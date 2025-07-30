import type { Express } from "express";
import { createServer, type Server } from "http";
import { 
  simplifyContentSchema, 
  followupQuestionRequestSchema
} from "@shared/schema";
import { extractAndSimplifyContent, answerFollowupQuestion } from "./services/claude";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Simplify content endpoint (no auto-save)
  app.post("/api/simplify", async (req, res) => {
    try {
      const { content, category, contentType, fileName } = simplifyContentSchema.parse(req.body);
      
      const result = await extractAndSimplifyContent(content, contentType);
      
      // Return explanation without saving to database
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

  const httpServer = createServer(app);
  return httpServer;
}
