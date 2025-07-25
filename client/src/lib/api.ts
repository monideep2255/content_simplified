import { apiRequest } from "@/lib/queryClient";
import type { 
  SimplifyContentRequest, 
  FollowupQuestionRequest, 
  ExplanationWithFollowups
} from "@shared/schema";

export interface SimplifyResponse {
  success: boolean;
  explanation?: ExplanationWithFollowups;
  message?: string;
}

export interface ExplanationsResponse {
  success: boolean;
  explanations?: ExplanationWithFollowups[];
  message?: string;
}

export interface ExplanationResponse {
  success: boolean;
  explanation?: ExplanationWithFollowups;
  message?: string;
}

export interface FollowupResponse {
  success: boolean;
  followup?: any;
  message?: string;
}

export async function simplifyContent(data: SimplifyContentRequest & { contentType?: string; fileName?: string }): Promise<SimplifyResponse> {
  const res = await apiRequest("POST", "/api/simplify", data);
  return await res.json();
}

// Removed database-dependent functions - app is now session-based only

export async function addFollowupQuestion(data: FollowupQuestionRequest): Promise<FollowupResponse> {
  const res = await apiRequest("POST", "/api/followup", data);
  return await res.json();
}
