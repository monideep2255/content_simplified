import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, Bookmark, Loader2, Wand2, MessageCircle, Check, Upload, FileText } from "lucide-react";
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

  const explanation = simplificationResult?.explanation;

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

  const handleFollowup = () => {
    if (!followupQuestion.trim() || !explanation) {
      toast({
        title: "Question Required",
        description: "Please enter a follow-up question.",
        variant: "destructive",
      });
      return;
    }

    addFollowup({ 
      explanationId: explanation.id, 
      question: followupQuestion.trim() 
    });
    setFollowupQuestion("");
    
    // Scroll to show the new follow-up answer after a short delay
    setTimeout(() => {
      const followupContainer = document.querySelector('[data-followup-container]');
      if (followupContainer) {
        followupContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 1000);
  };

  const handleCopy = async () => {
    if (!explanation) return;
    
    try {
      await navigator.clipboard.writeText(explanation.simplifiedContent);
      toast({
        title: "Copied",
        description: "Explanation copied to clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy to clipboard.",
        variant: "destructive",
      });
    }
  };

  const handleSave = () => {
    if (!explanation) return;
    
    // Show confirmation that it's saved (explanation is automatically saved when created)
    toast({
      title: "Saved",
      description: "This explanation is now in your saved collection.",
    });
  };

  const getCategoryInfo = (cat: string) => {
    return categories.find(c => c.value === cat) || categories[4];
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Transform Complex Content into Clear Understanding
        </h2>
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
                placeholder="Paste text content, article titles, or video transcripts you want to understand better. Note: I cannot process URLs directly - please copy the content from the webpage instead."
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
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSave}
                  className="text-gray-500 hover:text-green-600 transition-colors duration-200"
                >
                  <Bookmark size={16} />
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
                  placeholder="Ask anything about this explanation..."
                  value={followupQuestion}
                  onChange={(e) => setFollowupQuestion(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleFollowup();
                    }
                  }}
                  className="flex-1"
                />
                <Button 
                  onClick={handleFollowup}
                  disabled={isAddingFollowup || !followupQuestion.trim()}
                  className="bg-indigo-500 hover:bg-indigo-600"
                >
                  {isAddingFollowup ? (
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
