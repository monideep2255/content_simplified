import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2, MessageCircle } from "lucide-react";
import { useExplanations, useContentSimplifier } from "@/hooks/use-content-simplifier";
import { ExplanationModal } from "@/components/explanation-modal";
import type { ExplanationWithFollowups } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

const categories = [
  { value: "all", label: "All", color: "bg-blue-500" },
  { value: "ai", label: "🤖 AI", color: "bg-purple-500" },
  { value: "money", label: "💰 Money", color: "bg-green-500" },
  { value: "tech", label: "⚡ Tech", color: "bg-blue-500" },
  { value: "business", label: "📊 Business", color: "bg-yellow-500" },
  { value: "other", label: "📝 Other", color: "bg-gray-500" },
];

export function SavedItemsPage() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedExplanation, setSelectedExplanation] = useState<ExplanationWithFollowups | null>(null);
  
  const { data: explanations = [], isLoading } = useExplanations(selectedCategory === "all" ? undefined : selectedCategory);
  const { deleteExplanation, isDeleting } = useContentSimplifier();

  const getCategoryInfo = (cat: string) => {
    return categories.find(c => c.value === cat) || categories[5];
  };

  const getCategoryCounts = () => {
    const allExplanations = explanations;
    const counts: Record<string, number> = { all: allExplanations.length };
    
    categories.slice(1).forEach(cat => {
      counts[cat.value] = allExplanations.filter(exp => exp.category === cat.value).length;
    });
    
    return counts;
  };

  const categoryCounts = getCategoryCounts();

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this explanation?")) {
      deleteExplanation(id);
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      return formatDistanceToNow(new Date(date), { addSuffix: true });
    } catch {
      return "Recently";
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">Loading your saved explanations...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Saved Explanations</h2>
        <p className="text-gray-600 mb-6">Your collection of simplified content, organized by category.</p>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? "default" : "secondary"}
              size="sm"
              onClick={() => setSelectedCategory(cat.value)}
              className={`${
                selectedCategory === cat.value
                  ? "bg-blue-100 text-blue-800 hover:bg-blue-200"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              } transition-colors duration-200`}
            >
              {cat.label}
              <Badge variant="secondary" className="ml-2">
                {categoryCounts[cat.value] || 0}
              </Badge>
            </Button>
          ))}
        </div>
      </div>

      {/* Saved Items Grid */}
      {explanations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {explanations.map((explanation) => {
            const categoryInfo = getCategoryInfo(explanation.category);
            return (
              <Card 
                key={explanation.id} 
                className="hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => setSelectedExplanation(explanation)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 ${categoryInfo.color} rounded-full`} />
                      <span className="text-sm font-medium text-gray-600">
                        {categoryInfo.label}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(e, explanation.id)}
                      disabled={isDeleting}
                      className="text-gray-400 hover:text-red-500 transition-colors duration-200 p-1 h-auto"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {explanation.title}
                  </h3>
                  <div className="text-gray-600 text-sm mb-4 max-h-16 overflow-y-auto">
                    <p className="line-clamp-3">
                      {explanation.simplifiedContent.substring(0, 150)}...
                    </p>
                  </div>
                  
                  {explanation.sourceUrl && (
                    <a
                      href={explanation.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800 underline inline-flex items-center space-x-1 mb-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>View Source</span>
                      <svg className="w-2 h-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{formatDate(explanation.createdAt)}</span>
                    <div className="flex items-center space-x-1">
                      <MessageCircle size={12} />
                      <span>
                        {explanation.followups?.length || 0} follow-up{explanation.followups?.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageCircle className="text-gray-400" size={24} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No saved explanations yet</h3>
          <p className="text-gray-600 mb-6">
            {selectedCategory === "all" 
              ? "Start simplifying content to build your knowledge collection."
              : `No explanations found in the ${getCategoryInfo(selectedCategory).label} category.`
            }
          </p>
          <Button
            onClick={() => window.location.href = "/"}
            className="bg-blue-500 hover:bg-blue-600"
          >
            Get Started
          </Button>
        </div>
      )}

      {/* Detail Modal */}
      {selectedExplanation && (
        <ExplanationModal
          explanation={selectedExplanation}
          onClose={() => setSelectedExplanation(null)}
        />
      )}
    </div>
  );
}
