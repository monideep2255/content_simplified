import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  simplifyContent, 
  addFollowupQuestion
} from "@/lib/api";
import type { SimplifyContentRequest, FollowupQuestionRequest } from "@shared/schema";

type ExtendedSimplifyRequest = SimplifyContentRequest & { 
  contentType?: string; 
  fileName?: string;
  saveToHistory: boolean;
};

export function useContentSimplifier() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const simplifyMutation = useMutation({
    mutationFn: simplifyContent,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Content Simplified",
          description: "Your content has been successfully explained.",
        });
        // Don't invalidate queries since we're not auto-saving
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to simplify content",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to simplify content",
        variant: "destructive",
      });
    },
  });

  const followupMutation = useMutation({
    mutationFn: addFollowupQuestion,
    onSuccess: (data) => {
      if (!data.success) {
        toast({
          title: "Error",
          description: data.message || "Failed to process follow-up question",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to process follow-up question",
        variant: "destructive",
      });
    },
  });

  return {
    simplifyContent: (data: ExtendedSimplifyRequest) => simplifyMutation.mutate(data),
    addFollowup: (data: FollowupQuestionRequest) => followupMutation.mutate(data),
    isSimplifying: simplifyMutation.isPending,
    isAddingFollowup: followupMutation.isPending,
    simplificationResult: simplifyMutation.data,
  };
}
