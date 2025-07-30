import { z } from "zod";
import { pgTable, text, integer, timestamp, boolean, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

// Database Tables
export const explanations = pgTable("explanations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  originalContent: text("original_content").notNull(),
  simplifiedContent: text("simplified_content").notNull(),
  category: text("category", { enum: ["ai", "money", "tech", "business", "other"] }).notNull(),
  sourceUrl: text("source_url"),
  isBookmarked: boolean("is_bookmarked").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const followups = pgTable("followups", {
  id: serial("id").primaryKey(),
  explanationId: integer("explanation_id").references(() => explanations.id).notNull(),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Zod Schemas for API
export const simplifyContentSchema = z.object({
  content: z.string().min(1, "Content is required"),
  category: z.enum(["ai", "money", "tech", "business", "other"]),
  sourceUrl: z.string().optional(),
  contentType: z.string().optional(),
  fileName: z.string().optional(),
  saveToHistory: z.boolean().default(false),
});

export const followupQuestionRequestSchema = z.object({
  explanationId: z.string(),
  question: z.string().min(1, "Question is required"),
  originalContent: z.string().optional(),
});

export const saveExplanationSchema = z.object({
  explanationId: z.number(),
});

export const searchExplanationsSchema = z.object({
  query: z.string().optional(),
  category: z.enum(["ai", "money", "tech", "business", "other"]).optional(),
  bookmarkedOnly: z.boolean().default(false),
});

// Insert Schemas
export const insertExplanationSchema = createInsertSchema(explanations).omit({
  id: true,
  createdAt: true,
});
export const insertFollowupSchema = createInsertSchema(followups).omit({
  id: true,
  createdAt: true,
});

// Select Types
export type Explanation = typeof explanations.$inferSelect;
export type Followup = typeof followups.$inferSelect;
export type InsertExplanation = z.infer<typeof insertExplanationSchema>;
export type InsertFollowup = z.infer<typeof insertFollowupSchema>;

// Legacy type for backward compatibility
export type ExplanationWithFollowups = Explanation & {
  followups: Followup[];
};

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