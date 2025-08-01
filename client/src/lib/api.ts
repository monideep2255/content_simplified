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

// Enhanced file upload with processing
export async function uploadAndProcessFile(
  file: File, 
  category: string, 
  saveToHistory: boolean = false
): Promise<SimplifyResponse & { fileInfo?: any }> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('category', category);
  formData.append('saveToHistory', saveToHistory.toString());

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to upload and process file');
  }

  return await response.json();
}

// Removed database-dependent functions - app is now session-based only

export async function addFollowupQuestion(data: FollowupQuestionRequest): Promise<FollowupResponse> {
  const res = await apiRequest("POST", "/api/followup", data);
  return await res.json();
}

// Content History API functions
export async function getAllExplanations(): Promise<ExplanationsResponse> {
  const res = await apiRequest("GET", "/api/explanations");
  return await res.json();
}

export async function searchExplanations(data: { 
  query?: string; 
  category?: string; 
  bookmarkedOnly?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  contentType?: string;
}): Promise<ExplanationsResponse> {
  // Convert dates to ISO strings for API
  const searchParams = {
    ...data,
    dateFrom: data.dateFrom?.toISOString(),
    dateTo: data.dateTo?.toISOString(),
  };

  const res = await apiRequest("POST", "/api/explanations/search", searchParams);
  return await res.json();
}

export async function toggleBookmark(id: number): Promise<ExplanationResponse> {
  const res = await apiRequest("POST", `/api/explanations/${id}/bookmark`);
  return await res.json();
}

export async function deleteExplanation(id: number): Promise<{ success: boolean; message?: string }> {
  const res = await apiRequest("DELETE", `/api/explanations/${id}`);
  return await res.json();
}
