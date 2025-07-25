import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const explanations = pgTable("explanations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  originalContent: text("original_content").notNull(),
  simplifiedContent: text("simplified_content").notNull(),
  category: varchar("category", { length: 20 }).notNull(),
  sourceUrl: text("source_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const followupQuestions = pgTable("followup_questions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  explanationId: varchar("explanation_id").notNull().references(() => explanations.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertExplanationSchema = createInsertSchema(explanations).omit({
  id: true,
  createdAt: true,
});

export const insertFollowupQuestionSchema = createInsertSchema(followupQuestions).omit({
  id: true,
  createdAt: true,
});

export const simplifyContentSchema = z.object({
  content: z.string().min(1, "Content is required"),
  category: z.enum(["ai", "money", "tech", "business", "other"]),
  contentType: z.string().optional(),
  fileName: z.string().optional(),
});

export const followupQuestionRequestSchema = z.object({
  explanationId: z.string(),
  question: z.string().min(1, "Question is required"),
});

export type InsertExplanation = z.infer<typeof insertExplanationSchema>;
export type InsertFollowupQuestion = z.infer<typeof insertFollowupQuestionSchema>;
export type Explanation = typeof explanations.$inferSelect;
export type FollowupQuestion = typeof followupQuestions.$inferSelect;
export type SimplifyContentRequest = z.infer<typeof simplifyContentSchema>;
export type FollowupQuestionRequest = z.infer<typeof followupQuestionRequestSchema>;

export interface ExplanationWithFollowups extends Explanation {
  followups: FollowupQuestion[];
}
