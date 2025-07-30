import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Copy, BookmarkIcon, MessageCircle, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toggleBookmark, addFollowupQuestion } from "@/lib/api";
import type { ExplanationWithFollowups } from "@shared/schema";
import { format } from "date-fns";

const categoryColors = {
  ai: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  money: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200", 
  tech: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  business: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200"
};

interface ExplanationModalProps {
  explanation: ExplanationWithFollowups | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ExplanationModal({ explanation, isOpen, onClose }: ExplanationModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [followupQuestion, setFollowupQuestion] = useState("");

  // Toggle bookmark mutation
  const bookmarkMutation = useMutation({
    mutationFn: toggleBookmark,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/explanations'] });
      toast({
        title: "Bookmark Updated",
        description: "Explanation bookmark status changed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update bookmark",
        variant: "destructive",
      });
    }
  });

  // Add followup mutation
  const followupMutation = useMutation({
    mutationFn: addFollowupQuestion,
    onSuccess: (data) => {
      if (data.success) {
        setFollowupQuestion("");
        // Refresh the explanation data to show new followup
        queryClient.invalidateQueries({ queryKey: ['/api/explanations'] });
        toast({
          title: "Question Added",
          description: "Your follow-up question has been answered.",
        });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to add follow-up question",
          variant: "destructive",
        });
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add follow-up question",
        variant: "destructive",
      });
    }
  });

  const handleCopy = () => {
    if (!explanation) return;
    
    let content = `${explanation.title}\n\n${explanation.simplifiedContent}`;
    
    if (explanation.followups.length > 0) {
      content += "\n\nFollow-up Questions & Answers:\n";
      explanation.followups.forEach((followup, index) => {
        content += `\nQ${index + 1}: ${followup.question}\nA${index + 1}: ${followup.answer}\n`;
      });
    }

    navigator.clipboard.writeText(content);
    toast({
      title: "Copied",
      description: "Explanation copied to clipboard.",
    });
  };

  const handleFollowupSubmit = () => {
    if (!explanation || !followupQuestion.trim()) return;
    
    followupMutation.mutate({
      explanationId: explanation.id.toString(),
      question: followupQuestion.trim(),
      originalContent: explanation.originalContent
    });
  };

  if (!explanation) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{explanation.title}</span>
              <Badge className={categoryColors[explanation.category]}>
                {explanation.category.toUpperCase()}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => bookmarkMutation.mutate(explanation.id)}
                disabled={bookmarkMutation.isPending}
              >
                <BookmarkIcon 
                  className={`w-4 h-4 ${explanation.isBookmarked ? 'fill-current text-yellow-500' : 'text-gray-400'}`} 
                />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopy}
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Source URL */}
          {explanation.sourceUrl && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">Source</h3>
              <a
                href={explanation.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 underline break-all"
              >
                {explanation.sourceUrl}
              </a>
            </div>
          )}

          {/* Original Content */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Original Content</h3>
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                {explanation.originalContent}
              </p>
            </div>
          </div>

          {/* Simplified Content */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Simplified Explanation</h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">
                {explanation.simplifiedContent}
              </p>
            </div>
          </div>

          {/* Follow-up Questions */}
          {explanation.followups.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-3">
                Follow-up Questions & Answers
              </h3>
              <div className="space-y-4">
                {explanation.followups.map((followup, index) => (
                  <div key={followup.id} className="border-l-4 border-blue-300 pl-4">
                    <div className="mb-2">
                      <div className="flex items-center gap-2 mb-1">
                        <MessageCircle className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-gray-900 dark:text-white">
                          Question {index + 1}
                        </span>
                        <span className="text-xs text-gray-500">
                          {format(new Date(followup.createdAt), 'MMM d, yyyy HH:mm')}
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 text-sm mb-2">
                        {followup.question}
                      </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
                      <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">
                        {followup.answer}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Follow-up Question */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">
              Ask a Follow-up Question
            </h3>
            <div className="flex gap-2">
              <Input
                placeholder="What else would you like to know about this topic?"
                value={followupQuestion}
                onChange={(e) => setFollowupQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleFollowupSubmit()}
                disabled={followupMutation.isPending}
              />
              <Button
                onClick={handleFollowupSubmit}
                disabled={!followupQuestion.trim() || followupMutation.isPending}
                size="sm"
              >
                {followupMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Metadata */}
          <div className="text-xs text-gray-500 pt-4 border-t">
            Created: {format(new Date(explanation.createdAt), 'MMM d, yyyy HH:mm')}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}