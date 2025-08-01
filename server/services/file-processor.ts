import { createWorker } from 'tesseract.js';
import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';

export interface ProcessedFileResult {
  content: string;
  fileType: string;
  processingMethod: string;
  success: boolean;
  error?: string;
}

export class EnhancedFileProcessor {
  
  // Process image files with OCR
  async processImage(filePath: string, fileName: string): Promise<ProcessedFileResult> {
    try {
      console.log(`Processing image: ${fileName}`);
      
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(filePath);
      await worker.terminate();
      
      if (!text || text.trim().length < 10) {
        return {
          content: '',
          fileType: 'image',
          processingMethod: 'OCR',
          success: false,
          error: 'No readable text found in image. The image may be too blurry, have poor contrast, or contain no text.'
        };
      }
      
      return {
        content: text.trim(),
        fileType: 'image',
        processingMethod: 'OCR (Tesseract)',
        success: true
      };
      
    } catch (error) {
      console.error('Image OCR processing error:', error);
      return {
        content: '',
        fileType: 'image',
        processingMethod: 'OCR',
        success: false,
        error: 'Failed to process image. Please ensure the image contains clear, readable text.'
      };
    }
  }
  
  // Process Excel and CSV files
  async processSpreadsheet(filePath: string, fileName: string): Promise<ProcessedFileResult> {
    try {
      console.log(`Processing spreadsheet: ${fileName}`);
      
      const workbook = XLSX.readFile(filePath);
      const sheetNames = workbook.SheetNames;
      
      let allContent = '';
      
      // Process first sheet or up to 3 sheets
      const sheetsToProcess = sheetNames.slice(0, Math.min(3, sheetNames.length));
      
      for (const sheetName of sheetsToProcess) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        if (jsonData.length > 0) {
          allContent += `\n=== Sheet: ${sheetName} ===\n`;
          
          // Add headers if available
          const headers = jsonData[0] as any[];
          if (headers && headers.length > 0) {
            allContent += `Headers: ${headers.join(', ')}\n`;
          }
          
          // Add first few rows of data (limit to prevent overwhelming)
          const dataRows = jsonData.slice(1, Math.min(11, jsonData.length)); // First 10 data rows
          if (dataRows.length > 0) {
            allContent += 'Sample data:\n';
            dataRows.forEach((row: any[], index) => {
              if (row && row.length > 0) {
                allContent += `Row ${index + 1}: ${row.join(' | ')}\n`;
              }
            });
          }
          
          // Add summary info
          allContent += `Total rows: ${jsonData.length - 1}, Total columns: ${headers?.length || 0}\n`;
        }
      }
      
      if (!allContent.trim()) {
        return {
          content: '',
          fileType: path.extname(fileName).toLowerCase().slice(1),
          processingMethod: 'XLSX Parser',
          success: false,
          error: 'Spreadsheet appears to be empty or contains no readable data.'
        };
      }
      
      return {
        content: allContent.trim(),
        fileType: path.extname(fileName).toLowerCase().slice(1),
        processingMethod: 'XLSX Parser',
        success: true
      };
      
    } catch (error) {
      console.error('Spreadsheet processing error:', error);
      return {
        content: '',
        fileType: path.extname(fileName).toLowerCase().slice(1),
        processingMethod: 'XLSX Parser',
        success: false,
        error: 'Failed to process spreadsheet. Please ensure the file is a valid Excel or CSV file.'
      };
    }
  }
  
  // Enhanced PDF processing (for future improvement)
  async processEnhancedPDF(filePath: string, fileName: string): Promise<ProcessedFileResult> {
    // For now, return indication that basic PDF processing should be used
    // This can be enhanced later with better PDF libraries if needed
    return {
      content: '',
      fileType: 'pdf',
      processingMethod: 'Basic PDF (use existing)',
      success: false,
      error: 'Use existing PDF processing method'
    };
  }
  
  // Main processing method that routes to appropriate processor
  async processFile(filePath: string, fileName: string, mimeType: string): Promise<ProcessedFileResult> {
    const extension = path.extname(fileName).toLowerCase();
    
    // Image files - OCR processing
    if (mimeType.startsWith('image/') || ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'].includes(extension)) {
      return await this.processImage(filePath, fileName);
    }
    
    // Spreadsheet files
    if (['.xlsx', '.xls', '.csv'].includes(extension) || 
        mimeType.includes('spreadsheet') || 
        mimeType.includes('csv')) {
      return await this.processSpreadsheet(filePath, fileName);
    }
    
    // For other file types, return indication to use existing processing
    return {
      content: '',
      fileType: extension.slice(1),
      processingMethod: 'Existing processor',
      success: false,
      error: 'Use existing file processing method'
    };
  }
  
  // Utility method to clean up temporary files
  cleanupTempFile(filePath: string): void {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up temp file: ${filePath}`);
      }
    } catch (error) {
      console.error('Failed to cleanup temp file:', error);
    }
  }
}

export const fileProcessor = new EnhancedFileProcessor();