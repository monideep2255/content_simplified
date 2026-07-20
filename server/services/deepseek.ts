import OpenAI from 'openai';
import { lookup as dnsLookup } from 'node:dns/promises';

// DeepSeek is the primary AI provider for this app. Its API is OpenAI-compatible
// (chat completions) but has no built-in web browsing, so URL content is fetched
// server-side (see fetchUrlAsText) before being sent to the model.
//
// The client is constructed lazily so a clear error is raised at request time if
// DEEPSEEK_API_KEY is missing, rather than the OpenAI SDK throwing on boot.
let deepseekClient: OpenAI | null = null;

function getDeepSeek(): OpenAI {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY is not set. The app needs it to generate explanations.');
  }
  if (!deepseekClient) {
    deepseekClient = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com',
    });
  }
  return deepseekClient;
}

const DEEPSEEK_MODEL = 'deepseek-chat';
const MAX_CONTENT_LENGTH = 150000; // Conservative cap to stay under model token limits.
const FETCH_TIMEOUT_MS = 15000;
const MAX_FETCH_BYTES = 5 * 1024 * 1024; // 5MB ceiling on a fetched page.

function truncate(content: string): string {
  return content.length > MAX_CONTENT_LENGTH
    ? content.substring(0, MAX_CONTENT_LENGTH) + '\n\n[Content truncated due to length - showing first portion]'
    : content;
}

async function callDeepSeek(prompt: string, maxTokens: number): Promise<string> {
  const response = await getDeepSeek().chat.completions.create({
    model: DEEPSEEK_MODEL,
    messages: [{ role: 'user', content: prompt }],
    max_tokens: maxTokens,
    temperature: 0.7,
  });
  const result = response.choices[0]?.message?.content;
  if (!result) {
    throw new Error('No response from DeepSeek.');
  }
  return result;
}

// SSRF protection for the server-side URL fetch. A hostname string check alone
// is not enough: a public hostname can resolve to a private IP (DNS rebinding),
// and a public URL can redirect to an internal one. So we resolve every URL's
// DNS and reject if any resolved address is private, and we follow redirects
// manually, re-validating each hop. Covers IPv4 (incl. CGNAT) and IPv6
// (loopback, ULA, link-local, IPv4-mapped).
const MAX_REDIRECTS = 5;

function parseHttpUrl(raw: string): URL {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error('That does not look like a valid URL.');
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error('Only http and https URLs are supported.');
  }
  return url;
}

function ipv4Parts(ip: string): number[] | null {
  const m = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return null;
  const parts = m.slice(1, 5).map(Number);
  return parts.some((p) => p > 255) ? null : parts;
}

function isPrivateIPv4(ip: string): boolean {
  const p = ipv4Parts(ip);
  if (!p) return false;
  const [a, b] = p;
  if (a === 0) return true; // 0.0.0.0/8
  if (a === 10) return true; // 10.0.0.0/8
  if (a === 127) return true; // loopback
  if (a === 169 && b === 254) return true; // link-local
  if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
  if (a === 192 && b === 168) return true; // 192.168.0.0/16
  if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT 100.64.0.0/10
  return false;
}

function isPrivateIPv6(ip: string): boolean {
  const addr = ip.toLowerCase();
  const mapped = addr.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/); // IPv4-mapped
  if (mapped) return isPrivateIPv4(mapped[1]);
  if (addr === '::1' || addr === '::') return true; // loopback / unspecified
  if (addr.startsWith('fe80')) return true; // link-local fe80::/10
  const firstHextet = parseInt(addr.split(':')[0] || '0', 16);
  if (!Number.isNaN(firstHextet) && (firstHextet & 0xfe00) === 0xfc00) return true; // ULA fc00::/7
  return false;
}

function isBlockedAddress(ip: string): boolean {
  return ip.includes(':') ? isPrivateIPv6(ip) : isPrivateIPv4(ip);
}

async function assertPublicHost(hostname: string): Promise<void> {
  const host = hostname.toLowerCase();
  if (host === 'localhost' || host.endsWith('.local')) {
    throw new Error('That URL points to a private or local address, which is not allowed.');
  }
  let resolved: { address: string }[];
  try {
    resolved = await dnsLookup(host, { all: true });
  } catch {
    throw new Error('Could not resolve that URL.');
  }
  if (resolved.length === 0 || resolved.some((r) => isBlockedAddress(r.address))) {
    throw new Error('That URL points to a private or local address, which is not allowed.');
  }
}

// Strip HTML down to readable text. In-house so the app takes no new dependency.
function htmlToText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

async function fetchUrlAsText(rawUrl: string): Promise<string> {
  let current = parseHttpUrl(rawUrl);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    let res: Response | undefined;
    // Follow redirects manually so each hop's host is re-validated before we
    // connect to it. A public URL must not be able to redirect us to an
    // internal address.
    for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
      await assertPublicHost(current.hostname);
      res = await fetch(current, {
        signal: controller.signal,
        redirect: 'manual',
        headers: {
          'User-Agent': 'ContentSimplifier/1.0 (+https://github.com/monideep2255/content_simplified)',
          Accept: 'text/html,application/xhtml+xml,text/plain',
        },
      });
      const location = res.headers.get('location');
      if (res.status >= 300 && res.status < 400 && location) {
        if (hop === MAX_REDIRECTS) {
          throw new Error('Too many redirects while fetching the URL.');
        }
        current = parseHttpUrl(new URL(location, current).toString());
        continue;
      }
      break;
    }
    if (!res) {
      throw new Error('Could not fetch the URL.');
    }
    if (!res.ok) {
      throw new Error(`Could not fetch the URL (status ${res.status}).`);
    }
    const raw = await res.text();
    const html = raw.length > MAX_FETCH_BYTES ? raw.slice(0, MAX_FETCH_BYTES) : raw;
    const text = htmlToText(html);
    if (text.length < 20) {
      throw new Error('The page had no readable text to simplify.');
    }
    return text;
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Fetching the URL timed out. Please try again or paste the content directly.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

// Primary entry point used by the routes. Handles text, files (content already
// extracted upstream), and URLs (fetched here, since DeepSeek cannot browse).
export async function extractAndSimplifyContent(
  content: string,
  contentType?: string
): Promise<{ title: string; simplified: string; isUrl: boolean; originalUrl?: string }> {
  const trimmed = content.trim();
  const isUrl = /^https?:\/\/.+/.test(trimmed);
  const isYouTube = isUrl && (trimmed.includes('youtube.com') || trimmed.includes('youtu.be'));

  if (isYouTube) {
    // Video content cannot be read from the URL alone.
    return {
      title: 'YouTube Video Processing Not Available',
      simplified:
        'I cannot directly access YouTube video content or transcripts. To get this content explained, please:\n\n1. Copy the video transcript if available (click the three dots below the video, then "Show transcript")\n2. Copy key points or descriptions from the video\n3. Paste that text content here instead of the URL\n\nThis limitation exists because video content cannot be processed directly, only text-based content from web pages.',
      isUrl: true,
      originalUrl: trimmed,
    };
  }

  let textToExplain: string;
  let originalUrl: string | undefined;
  let sourceNote = '';
  let contentDescription = 'content';

  if (isUrl) {
    originalUrl = trimmed;
    textToExplain = await fetchUrlAsText(trimmed);
    sourceNote = `\n\nSource: Content retrieved from ${originalUrl}`;
    contentDescription = 'web page';
  } else {
    textToExplain = content;
    if (contentType) {
      if (contentType.includes('pdf')) contentDescription = 'PDF document';
      else if (contentType.includes('image')) contentDescription = 'image';
      else if (contentType.includes('markdown')) contentDescription = 'markdown document';
      else if (contentType.includes('text')) contentDescription = 'text content';
    }
  }

  const prompt = `Explain the following ${contentDescription} in simple terms and deep detail with easy examples and analogies.

IMPORTANT: Provide clean, readable text without any markdown formatting. Do not use bold, italics, headers, bullet points, or any other markdown syntax. Use plain text with natural paragraphs only.

Use natural paragraphs and conversational language. Make complex concepts accessible to everyone through real-world comparisons.

Content to explain:
${truncate(textToExplain)}

Format your response as:
TITLE: [A clear, descriptive title for the content]

EXPLANATION:
[Your simplified explanation using plain text only]`;

  try {
    const raw = await callDeepSeek(prompt, 3000);
    const titleMatch = raw.match(/TITLE:\s*(.+?)(?:\n|$)/);
    const explanationMatch = raw.match(/EXPLANATION:\s*([\s\S]+)/);
    const title = titleMatch ? titleMatch[1].trim() : 'Simplified Explanation';
    let simplified = explanationMatch ? explanationMatch[1].trim() : raw.trim();
    if (sourceNote) {
      simplified += sourceNote;
    }
    return { title, simplified, isUrl, originalUrl };
  } catch (error) {
    console.error('DeepSeek simplify error:', error);
    if (error instanceof Error && error.message.includes('rate_limit')) {
      throw new Error('Rate limit reached. Please wait a moment and try again.');
    }
    throw new Error('Failed to process content. Please try again.');
  }
}

export async function answerFollowupQuestion(
  originalExplanation: string,
  question: string
): Promise<string> {
  const prompt = `Based on this previous explanation:

${originalExplanation}

Answer this follow-up question: ${question}

IMPORTANT: Use simple language and examples. Provide clean, readable text without any markdown formatting. Do not use bold, italics, headers, bullet points, or any other markdown syntax. Use plain text with natural paragraphs only. Be conversational and helpful.`;

  try {
    return (await callDeepSeek(prompt, 1000)).trim();
  } catch (error) {
    console.error('DeepSeek followup error:', error);
    if (error instanceof Error && error.message.includes('rate_limit')) {
      throw new Error('Rate limit reached. Please wait a moment and try again.');
    }
    throw new Error('Failed to answer follow-up question. Please try again.');
  }
}

// Backward-compatible helpers retained so the now-dormant Claude service
// (server/services/claude.ts) still type-checks. Not used by the routes.
export async function simplifyContentWithDeepSeek(
  content: string,
  category: string,
  sourceUrl?: string
): Promise<{ title: string; simplifiedContent: string; category: string }> {
  const prompt = `You are a helpful AI assistant that specializes in breaking down complex content into simple, easy-to-understand explanations.

Your task is to:
1. Create a clear, descriptive title for this content
2. Explain the content in simple terms using everyday language
3. Use real-world analogies and examples when helpful
4. Break down complex concepts into digestible parts
5. Focus on practical understanding

Content Category: ${category}
${sourceUrl ? `Source URL: ${sourceUrl}` : ''}

Content to simplify:
${content}

Please provide your response in the following format:
TITLE: [Your clear, descriptive title]
EXPLANATION: [Your simplified explanation in plain text - no markdown formatting]

Important: Use only plain text in your explanation. No bullet points, asterisks, or markdown formatting.`;

  const result = await callDeepSeek(prompt, 2000);
  const titleMatch = result.match(/TITLE:\s*(.+?)(?:\n|$)/);
  const explanationMatch = result.match(/EXPLANATION:\s*([\s\S]+)/);
  if (!titleMatch || !explanationMatch) {
    throw new Error('Invalid response format from DeepSeek API');
  }
  return {
    title: titleMatch[1].trim(),
    simplifiedContent: explanationMatch[1].trim(),
    category,
  };
}

export async function processFollowupWithDeepSeek(
  question: string,
  originalContent: string
): Promise<string> {
  const prompt = `You are helping a user understand content better by answering their follow-up questions.

Original explanation context:
${originalContent}

User's follow-up question: ${question}

Please provide a clear, helpful answer in plain text (no markdown formatting). Keep your response focused and easy to understand.`;

  return (await callDeepSeek(prompt, 1000)).trim();
}
