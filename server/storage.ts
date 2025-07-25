import { explanations, followupQuestions, type Explanation, type InsertExplanation, type FollowupQuestion, type InsertFollowupQuestion, type ExplanationWithFollowups } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  // Explanations
  createExplanation(explanation: InsertExplanation): Promise<Explanation>;
  getExplanation(id: string): Promise<Explanation | undefined>;
  getAllExplanations(): Promise<Explanation[]>;
  getExplanationsByCategory(category: string): Promise<Explanation[]>;
  deleteExplanation(id: string): Promise<void>;
  getExplanationWithFollowups(id: string): Promise<ExplanationWithFollowups | undefined>;
  
  // Followup Questions
  createFollowupQuestion(followup: InsertFollowupQuestion): Promise<FollowupQuestion>;
  getFollowupsByExplanationId(explanationId: string): Promise<FollowupQuestion[]>;
}

export class DatabaseStorage implements IStorage {
  async getExplanation(id: string): Promise<Explanation | undefined> {
    const [explanation] = await db.select().from(explanations).where(eq(explanations.id, id));
    return explanation || undefined;
  }

  async createExplanation(insertExplanation: InsertExplanation): Promise<Explanation> {
    const [explanation] = await db
      .insert(explanations)
      .values(insertExplanation)
      .returning();
    return explanation;
  }

  async getAllExplanations(): Promise<Explanation[]> {
    return await db
      .select()
      .from(explanations)
      .orderBy(explanations.createdAt);
  }

  async getExplanationsByCategory(category: string): Promise<Explanation[]> {
    return await db
      .select()
      .from(explanations)
      .where(eq(explanations.category, category))
      .orderBy(explanations.createdAt);
  }

  async deleteExplanation(id: string): Promise<void> {
    await db.delete(explanations).where(eq(explanations.id, id));
  }

  async getExplanationWithFollowups(id: string): Promise<ExplanationWithFollowups | undefined> {
    const explanation = await this.getExplanation(id);
    if (!explanation) return undefined;

    const followups = await this.getFollowupsByExplanationId(id);
    return { ...explanation, followups };
  }

  async createFollowupQuestion(insertFollowup: InsertFollowupQuestion): Promise<FollowupQuestion> {
    const [followup] = await db
      .insert(followupQuestions)
      .values(insertFollowup)
      .returning();
    return followup;
  }

  async getFollowupsByExplanationId(explanationId: string): Promise<FollowupQuestion[]> {
    return await db
      .select()
      .from(followupQuestions)
      .where(eq(followupQuestions.explanationId, explanationId))
      .orderBy(followupQuestions.createdAt);
  }
}

export const storage = new DatabaseStorage();
