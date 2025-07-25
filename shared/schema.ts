import { z } from "zod";

// Basic types for session-based app (no database)
export const simplifyContentSchema = z.object({
  content: z.string().min(1, "Content is required"),
  category: z.enum(["ai", "money", "tech", "business", "other"]),
  sourceUrl: z.string().optional(),
});

export const followupQuestionRequestSchema = z.object({
  explanationId: z.string(),
  question: z.string().min(1, "Question is required"),
});

export type SimplifyContentRequest = z.infer<typeof simplifyContentSchema>;
export type FollowupQuestionRequest = z.infer<typeof followupQuestionRequestSchema>;

// Response types for frontend
export interface ExplanationWithFollowups {
  id: string;
  title: string;
  originalContent: string;
  simplifiedContent: string;
  category: string;
  sourceUrl?: string;
  createdAt: Date;
  followups: FollowupQuestion[];
}

export interface FollowupQuestion {
  id: string;
  explanationId: string;
  question: string;
  answer: string;
  createdAt: Date;
}