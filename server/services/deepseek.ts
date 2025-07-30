import OpenAI from 'openai';

const deepseek = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: 'https://api.deepseek.com',
});

export async function simplifyContentWithDeepSeek(
  content: string,
  category: string,
  sourceUrl?: string
): Promise<{ title: string; simplifiedContent: string; category: string }> {
  try {
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

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from DeepSeek API');
    }

    // Parse the response
    const titleMatch = result.match(/TITLE:\s*(.+?)(?:\n|$)/);
    const explanationMatch = result.match(/EXPLANATION:\s*([\s\S]+)/);

    if (!titleMatch || !explanationMatch) {
      throw new Error('Invalid response format from DeepSeek API');
    }

    const title = titleMatch[1].trim();
    const simplifiedContent = explanationMatch[1].trim();

    return {
      title,
      simplifiedContent,
      category,
    };
  } catch (error) {
    console.error('DeepSeek API error:', error);
    throw new Error('Failed to process content with DeepSeek API');
  }
}

export async function processFollowupWithDeepSeek(
  question: string,
  originalContent: string
): Promise<string> {
  try {
    const prompt = `You are helping a user understand content better by answering their follow-up questions.

Original explanation context:
${originalContent}

User's follow-up question: ${question}

Please provide a clear, helpful answer in plain text (no markdown formatting). Keep your response focused and easy to understand.`;

    const response = await deepseek.chat.completions.create({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const result = response.choices[0]?.message?.content;
    if (!result) {
      throw new Error('No response from DeepSeek API');
    }

    return result.trim();
  } catch (error) {
    console.error('DeepSeek followup error:', error);
    throw new Error('Failed to process follow-up question with DeepSeek API');
  }
}