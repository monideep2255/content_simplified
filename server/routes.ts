import type { Express } from "express";
import { createServer, type Server } from "http";
import { 
  simplifyContentSchema, 
  followupQuestionRequestSchema,
  searchExplanationsSchema,
  saveExplanationSchema
} from "@shared/schema";
import { extractAndSimplifyContent, answerFollowupQuestion } from "./services/claude";
import { storage } from "./storage";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Simplify content endpoint with optional save to history
  app.post("/api/simplify", async (req, res) => {
    try {
      const { content, category, contentType, fileName, saveToHistory } = simplifyContentSchema.parse(req.body);
      
      const result = await extractAndSimplifyContent(content, contentType);
      
      if (saveToHistory) {
        // Save to database
        const savedExplanation = await storage.createExplanation({
          title: result.title,
          originalContent: content,
          simplifiedContent: result.simplified,
          category,
          sourceUrl: result.originalUrl || null,
          isBookmarked: false
        });

        res.json({ 
          success: true, 
          explanation: {
            ...savedExplanation,
            followups: []
          }
        });
      } else {
        // Return session-based explanation
        res.json({ 
          success: true, 
          explanation: {
            id: `session-${Date.now()}`, // Session-based ID for UI
            title: result.title,
            originalContent: content,
            simplifiedContent: result.simplified,
            category,
            sourceUrl: result.originalUrl || null,
            createdAt: new Date(),
            followups: []
          }
        });
      }
    } catch (error) {
      console.error('Simplify content error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request data",
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to simplify content" 
      });
    }
  });



  // Add followup question (session-based only)
  app.post("/api/followup", async (req, res) => {
    try {
      const { explanationId, question, originalContent } = followupQuestionRequestSchema.parse(req.body);
      
      // Generate answer for follow-up question with context
      const answer = await answerFollowupQuestion(originalContent || "", question);
      
      const followup = {
        id: `followup-${Date.now()}`,
        explanationId,
        question,
        answer,
        createdAt: new Date()
      };

      res.json({ success: true, followup });
    } catch (error) {
      console.error('Followup question error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid request data",
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: error instanceof Error ? error.message : "Failed to process followup question" 
      });
    }
  });

  // Get all explanations (history)
  app.get("/api/explanations", async (req, res) => {
    try {
      const explanations = await storage.getAllExplanations();
      res.json({ success: true, explanations });
    } catch (error) {
      console.error('Get explanations error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to retrieve explanations" 
      });
    }
  });

  // Search explanations
  app.post("/api/explanations/search", async (req, res) => {
    try {
      const { query, category, bookmarkedOnly } = searchExplanationsSchema.parse(req.body);
      const explanations = await storage.searchExplanations(query, category, bookmarkedOnly);
      res.json({ success: true, explanations });
    } catch (error) {
      console.error('Search explanations error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid search parameters",
          errors: error.errors 
        });
      }
      res.status(500).json({ 
        success: false, 
        message: "Failed to search explanations" 
      });
    }
  });

  // Toggle bookmark
  app.post("/api/explanations/:id/bookmark", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid explanation ID" 
        });
      }
      
      const explanation = await storage.toggleBookmark(id);
      res.json({ success: true, explanation });
    } catch (error) {
      console.error('Toggle bookmark error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to toggle bookmark" 
      });
    }
  });

  // Delete explanation
  app.delete("/api/explanations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid explanation ID" 
        });
      }
      
      await storage.deleteExplanation(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete explanation error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to delete explanation" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
