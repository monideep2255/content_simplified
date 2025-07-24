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

export async function simplifyContent(data: SimplifyContentRequest): Promise<SimplifyResponse> {
  const res = await apiRequest("POST", "/api/simplify", data);
  return await res.json();
}

export async function getExplanations(category?: string): Promise<ExplanationsResponse> {
  const url = category ? `/api/explanations?category=${category}` : "/api/explanations";
  const res = await apiRequest("GET", url);
  return await res.json();
}

export async function getExplanation(id: string): Promise<ExplanationResponse> {
  const res = await apiRequest("GET", `/api/explanations/${id}`);
  return await res.json();
}

export async function deleteExplanation(id: string): Promise<{ success: boolean; message?: string }> {
  const res = await apiRequest("DELETE", `/api/explanations/${id}`);
  return await res.json();
}

export async function addFollowupQuestion(data: FollowupQuestionRequest): Promise<FollowupResponse> {
  const res = await apiRequest("POST", "/api/followup", data);
  return await res.json();
}
