import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { 
  simplifyContentSchema, 
  followupQuestionRequestSchema,
  searchExplanationsSchema,
  saveExplanationSchema
} from "@shared/schema";
import { extractAndSimplifyContent, answerFollowupQuestion } from "./services/claude";
import { storage } from "./storage";
import { fileProcessor } from "./services/file-processor";
import { z } from "zod";

// Configure multer for file uploads
const upload = multer({
  dest: 'temp/', // temporary directory for uploads
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'text/markdown',
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/gif',
      'image/bmp',
      'image/tiff',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype) || file.originalname.toLowerCase().endsWith('.csv')) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Supported formats: PDF, text, markdown, images (JPG, PNG, GIF, BMP, TIFF), and spreadsheets (Excel, CSV).`));
    }
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Enhanced file upload endpoint
  app.post("/api/upload", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded"
        });
      }

      const { category = 'other', saveToHistory = false } = req.body;
      let extractedContent = '';
      let processingMethod = 'Unknown';

      // Try enhanced file processing first
      const enhancedResult = await fileProcessor.processFile(
        req.file.path,
        req.file.originalname,
        req.file.mimetype
      );

      if (enhancedResult.success) {
        extractedContent = enhancedResult.content;
        processingMethod = enhancedResult.processingMethod;
      } else if (enhancedResult.error !== 'Use existing file processing method') {
        // Enhanced processing failed with a real error
        fileProcessor.cleanupTempFile(req.file.path);
        return res.status(400).json({
          success: false,
          message: enhancedResult.error || 'Failed to process file'
        });
      } else {
        // Fall back to basic processing for PDF and text files
        try {
          extractedContent = fs.readFileSync(req.file.path, 'utf-8');
          processingMethod = 'Basic text extraction';
        } catch (error) {
          fileProcessor.cleanupTempFile(req.file.path);
          return res.status(400).json({
            success: false,
            message: 'Failed to extract content from file'
          });
        }
      }

      if (!extractedContent || extractedContent.trim().length < 10) {
        fileProcessor.cleanupTempFile(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'No readable content found in the file'
        });
      }

      // Clean up temp file
      fileProcessor.cleanupTempFile(req.file.path);

      // Process with AI
      const result = await extractAndSimplifyContent(
        extractedContent, 
        `file:${req.file.mimetype}:${processingMethod}`
      );

      if (saveToHistory === 'true' || saveToHistory === true) {
        // Save to database
        const savedExplanation = await storage.createExplanation({
          title: result.title,
          originalContent: extractedContent,
          simplifiedContent: result.simplified,
          category,
          sourceUrl: `file:${req.file.originalname}`,
          isBookmarked: false
        });

        res.json({ 
          success: true, 
          explanation: {
            ...savedExplanation,
            followups: []
          },
          fileInfo: {
            originalName: req.file.originalname,
            size: req.file.size,
            processingMethod
          }
        });
      } else {
        // Return session-based explanation
        res.json({ 
          success: true, 
          explanation: {
            id: `session-${Date.now()}`,
            title: result.title,
            originalContent: extractedContent,
            simplifiedContent: result.simplified,
            category,
            sourceUrl: `file:${req.file.originalname}`,
            createdAt: new Date(),
            followups: []
          },
          fileInfo: {
            originalName: req.file.originalname,
            size: req.file.size,
            processingMethod
          }
        });
      }

    } catch (error) {
      // Clean up temp file on error
      if (req.file) {
        fileProcessor.cleanupTempFile(req.file.path);
      }
      
      console.error('File upload error:', error);
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process uploaded file'
      });
    }
  });
  
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
      const searchData = searchExplanationsSchema.parse(req.body);
      
      // Convert date strings to Date objects if provided
      const filters = {
        ...searchData,
        dateFrom: searchData.dateFrom ? new Date(searchData.dateFrom) : undefined,
        dateTo: searchData.dateTo ? new Date(searchData.dateTo) : undefined,
      };
      
      const explanations = await storage.searchExplanations(filters);
      
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
