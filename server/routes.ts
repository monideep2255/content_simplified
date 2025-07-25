import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  simplifyContentSchema, 
  followupQuestionRequestSchema,
  insertExplanationSchema,
  insertFollowupQuestionSchema 
} from "@shared/schema";
import { extractAndSimplifyContent, answerFollowupQuestion } from "./services/claude";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Simplify content endpoint
  app.post("/api/simplify", async (req, res) => {
    try {
      const { content, category, contentType, fileName } = simplifyContentSchema.parse(req.body);
      
      const result = await extractAndSimplifyContent(content, contentType);
      
      const explanation = await storage.createExplanation({
        title: result.title,
        originalContent: content,
        simplifiedContent: result.simplified,
        category,
        sourceUrl: result.originalUrl || null,
      });

      res.json({ 
        success: true, 
        explanation: {
          ...explanation,
          followups: []
        }
      });
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

  // Get all explanations
  app.get("/api/explanations", async (req, res) => {
    try {
      const category = req.query.category as string;
      let explanations;
      
      if (category && category !== 'all') {
        explanations = await storage.getExplanationsByCategory(category);
      } else {
        explanations = await storage.getAllExplanations();
      }

      // Get followup counts for each explanation
      const explanationsWithFollowups = await Promise.all(
        explanations.map(async (exp) => {
          const followups = await storage.getFollowupsByExplanationId(exp.id);
          return { ...exp, followups };
        })
      );

      res.json({ success: true, explanations: explanationsWithFollowups });
    } catch (error) {
      console.error('Get explanations error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch explanations" 
      });
    }
  });

  // Get single explanation with followups
  app.get("/api/explanations/:id", async (req, res) => {
    try {
      const explanation = await storage.getExplanationWithFollowups(req.params.id);
      
      if (!explanation) {
        return res.status(404).json({ 
          success: false, 
          message: "Explanation not found" 
        });
      }

      res.json({ success: true, explanation });
    } catch (error) {
      console.error('Get explanation error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to fetch explanation" 
      });
    }
  });

  // Delete explanation
  app.delete("/api/explanations/:id", async (req, res) => {
    try {
      const explanation = await storage.getExplanation(req.params.id);
      
      if (!explanation) {
        return res.status(404).json({ 
          success: false, 
          message: "Explanation not found" 
        });
      }

      await storage.deleteExplanation(req.params.id);
      res.json({ success: true, message: "Explanation deleted" });
    } catch (error) {
      console.error('Delete explanation error:', error);
      res.status(500).json({ 
        success: false, 
        message: "Failed to delete explanation" 
      });
    }
  });

  // Add followup question
  app.post("/api/followup", async (req, res) => {
    try {
      const { explanationId, question } = followupQuestionRequestSchema.parse(req.body);
      
      const explanation = await storage.getExplanation(explanationId);
      if (!explanation) {
        return res.status(404).json({ 
          success: false, 
          message: "Explanation not found" 
        });
      }

      const answer = await answerFollowupQuestion(explanation.simplifiedContent, question);
      
      const followup = await storage.createFollowupQuestion({
        explanationId,
        question,
        answer,
      });

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

  const httpServer = createServer(app);
  return httpServer;
}
