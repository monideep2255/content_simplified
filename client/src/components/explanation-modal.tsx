import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageCircle, Loader2, X } from "lucide-react";
import { useContentSimplifier } from "@/hooks/use-content-simplifier";
import type { ExplanationWithFollowups } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface ExplanationModalProps {
  explanation: ExplanationWithFollowups;
  onClose: () => void;
}

const categories = [
  { value: "ai", label: "🤖 AI", color: "bg-purple-500" },
  { value: "money", label: "💰 Money", color: "bg-green-500" },
  { value: "tech", label: "⚡ Tech", color: "bg-blue-500" },
  { value: "business", label: "📊 Business", color: "bg-yellow-500" },
  { value: "other", label: "📝 Other", color: "bg-gray-500" },
];

export function ExplanationModal({ explanation, onClose }: ExplanationModalProps) {
  const [followupQuestion, setFollowupQuestion] = useState("");
  const { addFollowup, isAddingFollowup } = useContentSimplifier();

  const getCategoryInfo = (cat: string) => {
    return categories.find(c => c.value === cat) || categories[4];
  };

  const handleFollowup = () => {
    if (!followupQuestion.trim()) return;

    addFollowup({ 
      explanationId: explanation.id, 
      question: followupQuestion.trim() 
    });
    setFollowupQuestion("");
    
    // Scroll to show the new follow-up answer after a short delay
    setTimeout(() => {
      const followupContainer = document.querySelector('[data-modal-followup-container]');
      if (followupContainer) {
        followupContainer.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 1000);
  };

  const formatDate = (date: Date | string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  const categoryInfo = getCategoryInfo(explanation.category);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="sticky top-0 bg-white border-b border-gray-200 p-6 flex flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-2xl font-bold text-gray-900 pr-8">
            {explanation.title}
          </DialogTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={20} />
          </Button>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          <div className="p-6">
            <div className="flex items-center space-x-4 mb-6">
              <div className="flex items-center space-x-2">
                <div className={`w-3 h-3 ${categoryInfo.color} rounded-full`} />
                <span className="text-sm font-medium text-gray-600">
                  {categoryInfo.label}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {formatDate(explanation.createdAt)}
              </span>
              {explanation.sourceUrl && (
                <a 
                  href={explanation.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 underline"
                >
                  View Source
                </a>
              )}
            </div>
            
            <div className="prose max-w-none mb-8">
              {explanation.simplifiedContent.split('\n').map((paragraph, index) => (
                <p key={index} className="text-gray-800 leading-relaxed mb-4 last:mb-0">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Follow-up Section */}
            <div className="border-t border-gray-200 pt-6">
              <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center space-x-2">
                <MessageCircle size={20} />
                <span>Follow-up Questions</span>
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
              {explanation.followups && explanation.followups.length > 0 ? (
                <div className="space-y-4" data-modal-followup-container>
                  {explanation.followups.map((followup) => (
                    <div key={followup.id} className="bg-gray-50 rounded-lg p-4 animate-in slide-in-from-bottom duration-300">
                      <div className="font-medium text-gray-900 mb-2">
                        Q: {followup.question}
                      </div>
                      <div className="text-gray-700 leading-relaxed">
                        {followup.answer}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {formatDate(followup.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                  <p>No follow-up questions yet. Ask anything about this explanation!</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}