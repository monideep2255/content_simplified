import { type Explanation, type InsertExplanation, type FollowupQuestion, type InsertFollowupQuestion, type ExplanationWithFollowups } from "@shared/schema";
import { randomUUID } from "crypto";

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

export class MemStorage implements IStorage {
  private explanations: Map<string, Explanation>;
  private followupQuestions: Map<string, FollowupQuestion>;

  constructor() {
    this.explanations = new Map();
    this.followupQuestions = new Map();
  }

  async createExplanation(insertExplanation: InsertExplanation): Promise<Explanation> {
    const id = randomUUID();
    const explanation: Explanation = { 
      ...insertExplanation, 
      id,
      sourceUrl: insertExplanation.sourceUrl || null,
      createdAt: new Date()
    };
    this.explanations.set(id, explanation);
    return explanation;
  }

  async getExplanation(id: string): Promise<Explanation | undefined> {
    return this.explanations.get(id);
  }

  async getAllExplanations(): Promise<Explanation[]> {
    return Array.from(this.explanations.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async getExplanationsByCategory(category: string): Promise<Explanation[]> {
    return Array.from(this.explanations.values())
      .filter(exp => exp.category === category)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async deleteExplanation(id: string): Promise<void> {
    this.explanations.delete(id);
    // Also delete associated followups
    const followupsToDelete = Array.from(this.followupQuestions.entries())
      .filter(([_, followup]) => followup.explanationId === id)
      .map(([id, _]) => id);
    
    followupsToDelete.forEach(followupId => {
      this.followupQuestions.delete(followupId);
    });
  }

  async getExplanationWithFollowups(id: string): Promise<ExplanationWithFollowups | undefined> {
    const explanation = await this.getExplanation(id);
    if (!explanation) return undefined;

    const followups = await this.getFollowupsByExplanationId(id);
    return { ...explanation, followups };
  }

  async createFollowupQuestion(insertFollowup: InsertFollowupQuestion): Promise<FollowupQuestion> {
    const id = randomUUID();
    const followup: FollowupQuestion = {
      ...insertFollowup,
      id,
      createdAt: new Date()
    };
    this.followupQuestions.set(id, followup);
    return followup;
  }

  async getFollowupsByExplanationId(explanationId: string): Promise<FollowupQuestion[]> {
    return Array.from(this.followupQuestions.values())
      .filter(followup => followup.explanationId === explanationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }
}

export const storage = new MemStorage();
