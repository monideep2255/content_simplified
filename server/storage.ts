import { explanations, followups, type Explanation, type Followup, type InsertExplanation, type InsertFollowup, type ExplanationWithFollowups } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or } from "drizzle-orm";

export interface IStorage {
  // Explanation methods
  createExplanation(explanation: InsertExplanation): Promise<Explanation>;
  getExplanation(id: number): Promise<ExplanationWithFollowups | undefined>;
  getAllExplanations(): Promise<ExplanationWithFollowups[]>;
  searchExplanations(query?: string, category?: string, bookmarkedOnly?: boolean): Promise<ExplanationWithFollowups[]>;
  toggleBookmark(id: number): Promise<Explanation>;
  deleteExplanation(id: number): Promise<void>;
  
  // Followup methods
  createFollowup(followup: InsertFollowup): Promise<Followup>;
  getFollowupsByExplanation(explanationId: number): Promise<Followup[]>;
}

export class DatabaseStorage implements IStorage {
  async createExplanation(explanation: InsertExplanation): Promise<Explanation> {
    const [result] = await db
      .insert(explanations)
      .values(explanation)
      .returning();
    return result;
  }

  async getExplanation(id: number): Promise<ExplanationWithFollowups | undefined> {
    const [explanation] = await db
      .select()
      .from(explanations)
      .where(eq(explanations.id, id));
    
    if (!explanation) return undefined;

    const followupList = await db
      .select()
      .from(followups)
      .where(eq(followups.explanationId, id))
      .orderBy(desc(followups.createdAt));

    return {
      ...explanation,
      followups: followupList
    };
  }

  async getAllExplanations(): Promise<ExplanationWithFollowups[]> {
    const allExplanations = await db
      .select()
      .from(explanations)
      .orderBy(desc(explanations.createdAt));

    const result: ExplanationWithFollowups[] = [];
    
    for (const explanation of allExplanations) {
      const followupList = await db
        .select()
        .from(followups)
        .where(eq(followups.explanationId, explanation.id))
        .orderBy(desc(followups.createdAt));

      result.push({
        ...explanation,
        followups: followupList
      });
    }

    return result;
  }

  async searchExplanations(query?: string, category?: string, bookmarkedOnly?: boolean): Promise<ExplanationWithFollowups[]> {
    let whereConditions = [];

    if (query) {
      whereConditions.push(
        or(
          ilike(explanations.title, `%${query}%`),
          ilike(explanations.originalContent, `%${query}%`),
          ilike(explanations.simplifiedContent, `%${query}%`)
        )
      );
    }

    if (category) {
      whereConditions.push(eq(explanations.category, category as any));
    }

    if (bookmarkedOnly) {
      whereConditions.push(eq(explanations.isBookmarked, true));
    }

    const searchResults = await db
      .select()
      .from(explanations)
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(explanations.createdAt));

    const result: ExplanationWithFollowups[] = [];
    
    for (const explanation of searchResults) {
      const followupList = await db
        .select()
        .from(followups)
        .where(eq(followups.explanationId, explanation.id))
        .orderBy(desc(followups.createdAt));

      result.push({
        ...explanation,
        followups: followupList
      });
    }

    return result;
  }

  async toggleBookmark(id: number): Promise<Explanation> {
    const [current] = await db
      .select()
      .from(explanations)
      .where(eq(explanations.id, id));

    if (!current) {
      throw new Error("Explanation not found");
    }

    const [updated] = await db
      .update(explanations)
      .set({ isBookmarked: !current.isBookmarked })
      .where(eq(explanations.id, id))
      .returning();

    return updated;
  }

  async deleteExplanation(id: number): Promise<void> {
    // Delete followups first
    await db.delete(followups).where(eq(followups.explanationId, id));
    
    // Delete explanation
    await db.delete(explanations).where(eq(explanations.id, id));
  }

  async createFollowup(followup: InsertFollowup): Promise<Followup> {
    const [result] = await db
      .insert(followups)
      .values(followup)
      .returning();
    return result;
  }

  async getFollowupsByExplanation(explanationId: number): Promise<Followup[]> {
    return await db
      .select()
      .from(followups)
      .where(eq(followups.explanationId, explanationId))
      .orderBy(desc(followups.createdAt));
  }
}

export const storage = new DatabaseStorage();