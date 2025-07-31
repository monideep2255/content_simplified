import { explanations, followups, type Explanation, type Followup, type InsertExplanation, type InsertFollowup, type ExplanationWithFollowups } from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike, or, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Explanation methods
  createExplanation(explanation: InsertExplanation): Promise<Explanation>;
  getExplanation(id: number): Promise<ExplanationWithFollowups | undefined>;
  getAllExplanations(): Promise<ExplanationWithFollowups[]>;
  searchExplanations(filters: {
    query?: string;
    category?: string;
    bookmarkedOnly?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
    contentType?: string;
  }): Promise<ExplanationWithFollowups[]>;
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

  async searchExplanations(filters: {
    query?: string;
    category?: string;
    bookmarkedOnly?: boolean;
    dateFrom?: Date;
    dateTo?: Date;
    contentType?: string;
  }): Promise<ExplanationWithFollowups[]> {
    let whereConditions = [];

    if (filters.query) {
      whereConditions.push(
        or(
          ilike(explanations.title, `%${filters.query}%`),
          ilike(explanations.simplifiedContent, `%${filters.query}%`),
          ilike(explanations.originalContent, `%${filters.query}%`)
        )
      );
    }

    if (filters.category) {
      whereConditions.push(eq(explanations.category, filters.category as any));
    }

    if (filters.bookmarkedOnly) {
      whereConditions.push(eq(explanations.isBookmarked, true));
    }

    // Date range filtering
    if (filters.dateFrom) {
      whereConditions.push(gte(explanations.createdAt, filters.dateFrom));
    }

    if (filters.dateTo) {
      whereConditions.push(lte(explanations.createdAt, filters.dateTo));
    }

    // Content type filtering based on sourceUrl presence
    if (filters.contentType) {
      switch (filters.contentType) {
        case 'url':
          whereConditions.push(and(
            explanations.sourceUrl !== null,
            ilike(explanations.sourceUrl, 'http%')
          ));
          break;
        case 'text':
          whereConditions.push(
            or(
              explanations.sourceUrl === null,
              explanations.sourceUrl === ''
            )
          );
          break;
        case 'file':
          // Files might have specific patterns or no sourceUrl but have originalContent
          whereConditions.push(
            or(
              explanations.sourceUrl === null,
              explanations.sourceUrl === ''
            )
          );
          break;
      }
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