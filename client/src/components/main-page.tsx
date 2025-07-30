import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Loader2, Wand2, MessageCircle, Upload, FileText } from "lucide-react";
import { useContentSimplifier } from "@/hooks/use-content-simplifier";
import { useToast } from "@/hooks/use-toast";
import type { ExplanationWithFollowups } from "@shared/schema";

const categories = [
  { value: "ai", label: "🤖 AI", color: "bg-purple-500" },
  { value: "money", label: "💰 Money", color: "bg-green-500" },
  { value: "tech", label: "⚡ Tech", color: "bg-blue-500" },
  { value: "business", label: "📊 Business", color: "bg-yellow-500" },
  { value: "other", label: "📝 Other", color: "bg-gray-500" },
];

export function MainPage() {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<"ai" | "money" | "tech" | "business" | "other">("ai");
  const [followupQuestion, setFollowupQuestion] = useState("");
  const [savedExplanation, setSavedExplanation] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [contentType, setContentType] = useState<string>("");
  const [isLoadingFollowup, setIsLoadingFollowup] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const { 
    simplifyContent, 
    addFollowup, 
    isSimplifying, 
    isAddingFollowup, 
    simplificationResult 
  } = useContentSimplifier();

  const [explanation, setExplanation] = useState<ExplanationWithFollowups | null>(null);

  // Update explanation when simplification result changes
  useEffect(() => {
    if (simplificationResult?.explanation) {
      setExplanation(simplificationResult.explanation);
    }
  }, [simplificationResult]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadedFile(file);
    setContentType(file.type);

    try {
      const fileContent = await readFileContent(file);
      setContent(fileContent);
      
      toast({
        title: "File Uploaded",
        description: `${file.name} has been loaded successfully.`,
      });
    } catch (error) {
      toast({
        title: "Upload Error",
        description: "Failed to read file content.",
        variant: "destructive",
      });
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          resolve(result);
        } else {
          reject(new Error('Failed to read file as text'));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    });
  };

  const handleSimplify = () => {
    if (!content.trim()) {
      toast({
        title: "Content Required",
        description: "Please enter some content or upload a file to simplify.",
        variant: "destructive",
      });
      return;
    }

    const requestData = {
      content: content.trim(),
      category,
      contentType: contentType || undefined,
      fileName: uploadedFile?.name || undefined,
    };

    simplifyContent(requestData);
    
    // Scroll to results after a short delay
    setTimeout(() => {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 500);
  };

  const handleFollowup = async () => {
    if (!followupQuestion.trim() || !explanation) {
      toast({
        title: "Question Required",
        description: "Please enter a follow-up question.",
        variant: "destructive",
      });
      return;
    }

    const question = followupQuestion.trim();
    setFollowupQuestion("");
    setIsLoadingFollowup(true);

    try {
      // Call the API directly to get the answer
      const response = await fetch('/api/followup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          explanationId: explanation.id,
          question: question,
          originalContent: explanation.simplifiedContent
        })
      });

      const result = await response.json();

      if (result.success && result.followup) {
        // Update the explanation state with the new followup
        setExplanation(prev => prev ? {
          ...prev,
          followups: [...(prev.followups || []), result.followup]
        } : null);

        // Scroll to show the new follow-up answer
        setTimeout(() => {
          const followupContainer = document.querySelector('[data-followup-container]');
          if (followupContainer) {
            followupContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }, 500);
      } else {
        const errorMessage = result.message || "Failed to process follow-up question";
        toast({
          title: errorMessage.includes("Rate limit") ? "Rate Limit Reached" : "Error",
          description: errorMessage.includes("Rate limit") 
            ? "Too many requests. Please wait a moment and try again."
            : errorMessage,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error", 
        description: "Failed to process follow-up question",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFollowup(false);
    }
  };

  const handleCopy = async () => {
    if (!explanation) return;
    
    try {
      const textToCopy = `${explanation.title}\n\n${explanation.simplifiedContent}`;
      await navigator.clipboard.writeText(textToCopy);
      toast({
        title: "Copied",
        description: "Explanation has been copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const getCategoryInfo = (cat: string) => {
    return categories.find(c => c.value === cat) || categories[4];
  };

  const resetToHome = () => {
    setContent("");
    setCategory("other");
    setExplanation(null);
    setFollowupQuestion("");
    setUploadedFile(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center mb-4">
          <button 
            onClick={resetToHome}
            className="text-3xl font-bold text-gray-900 hover:text-indigo-600 transition-colors cursor-pointer flex items-center space-x-2"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <span>Content Simplifier</span>
          </button>
          {explanation && (
            <button
              onClick={resetToHome}
              className="ml-4 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
            >
              Clear & Start Over
            </button>
          )}
        </div>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Paste any URL or text content and get AI-powered explanations with real-world examples and analogies that make sense.
        </p>
      </div>

      {/* Input Section */}
      <Card className="mb-8">
        <CardContent className="p-6">
          <div className="mb-6">
            <Label htmlFor="content-input" className="block text-sm font-medium text-gray-700 mb-2">
              Content to Simplify
            </Label>
            <div className="space-y-3">
              <Textarea
                id="content-input"
                placeholder="Paste URLs, text content, article titles, or video transcripts you want to understand better. I can now access and explain content from web links!"
                className="min-h-32 resize-none"
                value={content}
                onChange={(e) => {
                  setContent(e.target.value);
                  setUploadedFile(null);
                  setContentType("");
                }}
              />
              
              <div className="flex items-center justify-center">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>OR</span>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".pdf,.txt,.md,.doc,.docx,image/*"
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex flex-col items-center space-y-2 h-auto py-4"
                >
                  <Upload className="text-gray-400" size={24} />
                  <span className="text-sm font-medium text-gray-700">
                    Upload File
                  </span>
                  <span className="text-xs text-gray-500">
                    PDF, Markdown, Text, Images, Documents
                  </span>
                </Button>
                
                {uploadedFile && (
                  <div className="mt-3 flex items-center justify-center space-x-2 text-sm text-green-600">
                    <FileText size={16} />
                    <span>{uploadedFile.name}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1">
              <Label htmlFor="category-select" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </Label>
              <Select value={category} onValueChange={(value) => setCategory(value as "ai" | "money" | "tech" | "business" | "other")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleSimplify}
            disabled={isSimplifying || !content.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600"
            size="lg"
          >
            {isSimplifying ? (
              <>
                <Loader2 className="animate-spin mr-2" size={16} />
                Processing content...
              </>
            ) : (
              <>
                <Wand2 className="mr-2" size={16} />
                Simplify Content
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results Section */}
      {explanation && (
        <Card ref={resultsRef} className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {explanation.title}
                  </h3>
                  <Badge 
                    variant="secondary" 
                    className="flex items-center space-x-1"
                  >
                    <div className={`w-2 h-2 rounded-full ${getCategoryInfo(explanation.category).color}`} />
                    <span>{getCategoryInfo(explanation.category).label}</span>
                  </Badge>
                </div>
                
                {explanation.sourceUrl && (
                  <a
                    href={explanation.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline inline-flex items-center space-x-1"
                  >
                    <span>View Source</span>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <Copy size={16} />
                </Button>
              </div>
            </div>

            <div className="prose max-w-none mb-6">
              {explanation.simplifiedContent.split('\n').map((paragraph, index) => (
                <p key={index} className="text-gray-800 leading-relaxed mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Follow-up Questions Section */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                <MessageCircle size={20} />
                <span>Ask a Follow-up Question</span>
              </h4>
              
              <div className="flex gap-3 mb-6">
                <Input
                  placeholder={isLoadingFollowup ? "Processing your question..." : "Ask anything about this explanation..."}
                  value={followupQuestion}
                  onChange={(e) => setFollowupQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && !isLoadingFollowup) {
                      e.preventDefault();
                      handleFollowup();
                    }
                  }}
                  className="flex-1"
                  disabled={isLoadingFollowup}
                />
                <Button 
                  onClick={handleFollowup}
                  disabled={isLoadingFollowup || !followupQuestion.trim()}
                  className="bg-indigo-500 hover:bg-indigo-600"
                >
                  {isLoadingFollowup ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <>
                      <MessageCircle className="mr-2" size={16} />
                      Ask
                    </>
                  )}
                </Button>
              </div>

              {/* Follow-up Conversations */}
              {explanation.followups && explanation.followups.length > 0 && (
                <div className="space-y-4" data-followup-container>
                  {explanation.followups.map((followup) => (
                    <div key={followup.id} className="bg-gray-50 rounded-lg p-4 animate-in slide-in-from-bottom duration-300">
                      <div className="font-medium text-gray-900 mb-2">
                        Q: {followup.question}
                      </div>
                      <div className="text-gray-700 leading-relaxed">
                        {followup.answer}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
