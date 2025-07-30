import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import type { ExplanationWithFollowups } from '@shared/schema';
import { format } from 'date-fns';

export type ExportFormat = 'pdf' | 'docx' | 'txt';

export const exportExplanation = async (
  explanation: ExplanationWithFollowups,
  format: ExportFormat
): Promise<void> => {
  const fileName = `${explanation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${format}`;
  
  switch (format) {
    case 'pdf':
      await exportToPDF(explanation, fileName);
      break;
    case 'docx':
      await exportToDocx(explanation, fileName);
      break;
    case 'txt':
      exportToText(explanation, fileName);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

const exportToPDF = async (explanation: ExplanationWithFollowups, fileName: string): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;

  // Helper function to add text with automatic line wrapping
  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    
    const lines = doc.splitTextToSize(text, maxWidth);
    
    // Check if we need a new page
    if (yPosition + (lines.length * fontSize * 0.5) > doc.internal.pageSize.height - margin) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * fontSize * 0.5 + 5;
  };

  // Add title
  addText(explanation.title, 18, true);
  yPosition += 15;

  // Add only the simplified explanation
  addText(explanation.simplifiedContent);

  // Add follow-up questions if any
  if (explanation.followups.length > 0) {
    yPosition += 10;
    addText('Follow-up Questions & Answers:', 14, true);
    
    explanation.followups.forEach((followup, index) => {
      yPosition += 5;
      addText(`Q${index + 1}: ${followup.question}`, 12, true);
      addText(`A${index + 1}: ${followup.answer}`);
    });
  }

  doc.save(`${fileName}.pdf`);
};

const exportToDocx = async (explanation: ExplanationWithFollowups, fileName: string): Promise<void> => {
  const children: Paragraph[] = [];

  // Title
  children.push(
    new Paragraph({
      children: [new TextRun({ text: explanation.title, bold: true, size: 32 })],
      heading: HeadingLevel.TITLE,
    })
  );

  // Add spacing
  children.push(new Paragraph({ children: [new TextRun({ text: "" })] }));
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Original Content:', bold: true, size: 24 })],
      heading: HeadingLevel.HEADING_1,
    })
  );

  children.push(
    new Paragraph({
      children: [new TextRun({ text: explanation.originalContent })],
    })
  );

  // Simplified Explanation
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Simplified Explanation:', bold: true, size: 24 })],
      heading: HeadingLevel.HEADING_1,
    })
  );

  children.push(
    new Paragraph({
      children: [new TextRun({ text: explanation.simplifiedContent })],
    })
  );

  // Follow-up Questions
  if (explanation.followups.length > 0) {
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Follow-up Questions & Answers:', bold: true, size: 24 })],
        heading: HeadingLevel.HEADING_1,
      })
    );

    explanation.followups.forEach((followup, index) => {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Q${index + 1}: ${followup.question}`, bold: true })],
        })
      );

      children.push(
        new Paragraph({
          children: [new TextRun({ text: `A${index + 1}: ${followup.answer}` })],
        })
      );
    });
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
};

const exportToText = (explanation: ExplanationWithFollowups, fileName: string): void => {
  let content = `${explanation.title}\n`;
  content += '='.repeat(explanation.title.length) + '\n\n';
  
  // Add only the simplified explanation
  content += explanation.simplifiedContent + '\n\n';
  
  if (explanation.followups.length > 0) {
    content += 'Follow-up Questions & Answers:\n';
    content += '-'.repeat(32) + '\n';
    
    explanation.followups.forEach((followup, index) => {
      content += `\nQ${index + 1}: ${followup.question}\n`;
      content += `A${index + 1}: ${followup.answer}\n`;
    });
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${fileName}.txt`);
};

export const exportMultipleExplanations = async (
  explanations: ExplanationWithFollowups[],
  exportFormat: ExportFormat
): Promise<void> => {
  const timestamp = format(new Date(), 'yyyy-MM-dd_HH-mm');
  const fileName = `content_simplifier_export_${timestamp}`;
  
  switch (exportFormat) {
    case 'pdf':
      await exportMultipleToPDF(explanations, fileName);
      break;
    case 'docx':
      await exportMultipleToDocx(explanations, fileName);
      break;
    case 'txt':
      exportMultipleToText(explanations, fileName);
      break;
    default:
      throw new Error(`Unsupported export format: ${exportFormat}`);
  }
};

const exportMultipleToPDF = async (explanations: ExplanationWithFollowups[], fileName: string): Promise<void> => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const margin = 20;
  const maxWidth = pageWidth - 2 * margin;
  let yPosition = margin;
  let isFirstExplanation = true;

  const addText = (text: string, fontSize: number = 12, isBold: boolean = false) => {
    doc.setFontSize(fontSize);
    if (isBold) {
      doc.setFont('helvetica', 'bold');
    } else {
      doc.setFont('helvetica', 'normal');
    }
    
    const lines = doc.splitTextToSize(text, maxWidth);
    
    if (yPosition + (lines.length * fontSize * 0.5) > doc.internal.pageSize.height - margin) {
      doc.addPage();
      yPosition = margin;
    }
    
    doc.text(lines, margin, yPosition);
    yPosition += lines.length * fontSize * 0.5 + 5;
  };

  explanations.forEach((explanation, index) => {
    if (!isFirstExplanation) {
      doc.addPage();
      yPosition = margin;
    }
    isFirstExplanation = false;

    addText(explanation.title, 18, true);
    yPosition += 5;

    addText(`Category: ${explanation.category.toUpperCase()}`, 10);
    addText(`Created: ${format(new Date(explanation.createdAt), 'MMM d, yyyy HH:mm')}`, 10);
    
    if (explanation.sourceUrl) {
      addText(`Source: ${explanation.sourceUrl}`, 10);
    }
    
    yPosition += 10;

    addText('Original Content:', 14, true);
    addText(explanation.originalContent);
    yPosition += 10;

    addText('Simplified Explanation:', 14, true);
    addText(explanation.simplifiedContent);

    if (explanation.followups.length > 0) {
      yPosition += 10;
      addText('Follow-up Questions & Answers:', 14, true);
      
      explanation.followups.forEach((followup, fIndex) => {
        yPosition += 5;
        addText(`Q${fIndex + 1}: ${followup.question}`, 12, true);
        addText(`A${fIndex + 1}: ${followup.answer}`);
      });
    }
  });

  doc.save(`${fileName}.pdf`);
};

const exportMultipleToDocx = async (explanations: ExplanationWithFollowups[], fileName: string): Promise<void> => {
  const children: Paragraph[] = [];

  // Add title page
  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Content Simplifier Export', bold: true, size: 48 })],
      heading: HeadingLevel.TITLE,
    })
  );

  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}`, break: 2 })],
    })
  );

  children.push(
    new Paragraph({
      children: [new TextRun({ text: `Total Explanations: ${explanations.length}`, break: 1 })],
    })
  );

  explanations.forEach((explanation, index) => {
    // Page break between explanations
    if (index > 0) {
      children.push(new Paragraph({ children: [new TextRun({ text: '', break: 1 })] }));
    }

    // Title
    children.push(
      new Paragraph({
        children: [new TextRun({ text: explanation.title, bold: true, size: 32 })],
        heading: HeadingLevel.HEADING_1,
      })
    );

    // Metadata
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: `Category: ${explanation.category.toUpperCase()}`, break: 1 }),
          new TextRun({ text: `Created: ${format(new Date(explanation.createdAt), 'MMM d, yyyy HH:mm')}`, break: 1 }),
        ],
      })
    );

    if (explanation.sourceUrl) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: `Source: ${explanation.sourceUrl}`, break: 1 })],
        })
      );
    }

    // Content sections
    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Original Content:', bold: true, size: 24 })],
        heading: HeadingLevel.HEADING_2,
      })
    );

    children.push(
      new Paragraph({
        children: [new TextRun({ text: explanation.originalContent })],
      })
    );

    children.push(
      new Paragraph({
        children: [new TextRun({ text: 'Simplified Explanation:', bold: true, size: 24 })],
        heading: HeadingLevel.HEADING_2,
      })
    );

    children.push(
      new Paragraph({
        children: [new TextRun({ text: explanation.simplifiedContent })],
      })
    );

    if (explanation.followups.length > 0) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: 'Follow-up Questions & Answers:', bold: true, size: 24 })],
          heading: HeadingLevel.HEADING_2,
        })
      );

      explanation.followups.forEach((followup, fIndex) => {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `Q${fIndex + 1}: ${followup.question}`, bold: true })],
          })
        );

        children.push(
          new Paragraph({
            children: [new TextRun({ text: `A${fIndex + 1}: ${followup.answer}` })],
          })
        );
      });
    }
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${fileName}.docx`);
};

const exportMultipleToText = (explanations: ExplanationWithFollowups[], fileName: string): void => {
  let content = 'Content Simplifier Export\n';
  content += '========================\n\n';
  content += `Generated: ${format(new Date(), 'MMM d, yyyy HH:mm')}\n`;
  content += `Total Explanations: ${explanations.length}\n\n`;
  content += '='.repeat(50) + '\n\n';

  explanations.forEach((explanation, index) => {
    if (index > 0) {
      content += '\n' + '='.repeat(50) + '\n\n';
    }

    content += `${explanation.title}\n`;
    content += '='.repeat(explanation.title.length) + '\n\n';
    
    content += `Category: ${explanation.category.toUpperCase()}\n`;
    content += `Created: ${format(new Date(explanation.createdAt), 'MMM d, yyyy HH:mm')}\n`;
    
    if (explanation.sourceUrl) {
      content += `Source: ${explanation.sourceUrl}\n`;
    }
    
    content += '\n';
    
    content += 'Original Content:\n';
    content += '-'.repeat(16) + '\n';
    content += explanation.originalContent + '\n\n';
    
    content += 'Simplified Explanation:\n';
    content += '-'.repeat(21) + '\n';
    content += explanation.simplifiedContent + '\n\n';
    
    if (explanation.followups.length > 0) {
      content += 'Follow-up Questions & Answers:\n';
      content += '-'.repeat(32) + '\n';
      
      explanation.followups.forEach((followup, fIndex) => {
        content += `\nQ${fIndex + 1}: ${followup.question}\n`;
        content += `A${fIndex + 1}: ${followup.answer}\n`;
      });
    }
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${fileName}.txt`);
};