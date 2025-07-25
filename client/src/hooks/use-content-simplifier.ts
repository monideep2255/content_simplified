import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  simplifyContent, 
  getExplanations, 
  getExplanation,
  deleteExplanation,
  addFollowupQuestion 
} from "@/lib/api";
import type { SimplifyContentRequest, FollowupQuestionRequest } from "@shared/schema";

type ExtendedSimplifyRequest = SimplifyContentRequest & { 
  contentType?: string; 
  fileName?: string; 
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
        queryClient.invalidateQueries({ queryKey: ["/api/explanations"] });
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
    onSuccess: (data, variables) => {
      if (data.success) {
        queryClient.invalidateQueries({ 
          queryKey: ["/api/explanations", variables.explanationId] 
        });
      } else {
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

  const deleteMutation = useMutation({
    mutationFn: deleteExplanation,
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "Deleted",
          description: "Explanation has been deleted.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/explanations"] });
      } else {
        toast({
          title: "Error",
          description: data.message || "Failed to delete explanation",
          variant: "destructive",
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete explanation",
        variant: "destructive",
      });
    },
  });

  return {
    simplifyContent: (data: ExtendedSimplifyRequest) => simplifyMutation.mutate(data),
    addFollowup: (data: FollowupQuestionRequest) => followupMutation.mutate(data),
    deleteExplanation: (id: string) => deleteMutation.mutate(id),
    isSimplifying: simplifyMutation.isPending,
    isAddingFollowup: followupMutation.isPending,
    isDeleting: deleteMutation.isPending,
    simplificationResult: simplifyMutation.data,
  };
}

export function useExplanations(category?: string) {
  return useQuery({
    queryKey: ["/api/explanations", category || "all"],
    queryFn: () => getExplanations(category),
    select: (data) => data.explanations || [],
  });
}

export function useExplanation(id: string | null) {
  return useQuery({
    queryKey: ["/api/explanations", id],
    queryFn: () => getExplanation(id!),
    enabled: !!id,
    select: (data) => data.explanation,
  });
}
