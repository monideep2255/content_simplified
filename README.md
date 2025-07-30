# Content Simplifier - AI-Powered Content Understanding Companion

Transform complex content into clear, understandable explanations using AI-powered simplification with real-world examples and analogies.

## Overview

Content Simplifier is a React-based web application that uses Anthropic's Claude AI to help users understand complex content through simplified explanations. The app provides a session-based experience for processing text, URLs, and file uploads with interactive follow-up capabilities.

## ✅ Implemented Features

### Core Content Processing
- **Text Simplification**: Paste any text content and get AI-powered explanations with real-world analogies
- **URL Processing**: Direct URL content retrieval and simplification using Claude's web search capabilities
- **File Upload Support**: 
  - PDF documents (up to 100MB)
  - Text files (.txt, .md)
  - Image files for content extraction
  - Drag-and-drop and click-to-upload functionality
- **Content Truncation**: Automatic handling of large documents to prevent API token limits (150k character limit)

### Content Organization
- **Category Classification**: AI, Money, Tech, Business, Other with visual badges
- **Source Citations**: Automatic citation display for web-searched content
- **Plain Text Output**: Clean, readable explanations without markdown formatting

### Interactive Features
- **Context-Aware Follow-up Questions**: Ask additional questions about simplified content with full context retention
- **Loading Indicators**: Visual feedback for both main simplification and follow-up processing
- **Copy Functionality**: One-click copying of explanations to clipboard
- **Clear/Reset Options**: 
  - Clickable logo to return to home screen
  - "Clear & Start Over" button after content processing

### User Experience
- **Session-Based Architecture**: No database required - content exists during browser session only
- **Responsive Design**: Works on desktop and mobile devices
- **Error Handling**: User-friendly error messages including rate limit notifications
- **Toast Notifications**: Clear feedback for all user actions

### Content Type Handling
- **YouTube Video Detection**: Special handling with clear instructions for transcript copying
- **Web Search Integration**: Automatic content retrieval from regular websites
- **Large File Processing**: Safe handling of oversized PDFs and documents
- **Content Type Detection**: Automatic identification of uploaded file types

### Technical Features
- **Rate Limit Management**: Graceful handling of API rate limits with user-friendly messaging
- **Real-time Updates**: Hot module reloading in development
- **TypeScript**: Full type safety throughout the application
- **Modern UI**: Shadcn/ui components with Tailwind CSS styling

## 🚧 Features Yet to Be Implemented

### Content Management
- **Content History**: Save and retrieve previously simplified explanations
- **Export Options**: Download explanations as PDF, Word, or text files
- **Bookmark System**: Save favorite explanations for later reference
- **Search Functionality**: Search through saved explanations

### Enhanced Processing
- **Batch Processing**: Process multiple files or URLs simultaneously
- **Video Transcript Integration**: Direct YouTube/video transcript processing
- **Audio File Support**: Process podcast transcripts and audio content
- **Advanced File Types**: Excel, PowerPoint, and other document formats

### Collaboration Features
- **Share Explanations**: Generate shareable links for explanations
- **Team Workspaces**: Collaborative content simplification
- **Comment System**: Add notes and comments to explanations
- **Version History**: Track changes to explanations over time

### Customization Options
- **Explanation Styles**: Choose between different explanation approaches (technical, beginner, expert)
- **Length Controls**: Specify desired explanation length (brief, detailed, comprehensive)
- **Language Support**: Multi-language content processing and explanations
- **Custom Categories**: User-defined content categories

### Advanced Features
- **AI Model Selection**: Choose between different AI models for processing
- **Explanation Comparison**: Compare explanations from different AI models
- **Content Summarization**: Generate executive summaries of long content
- **Key Concepts Extraction**: Highlight and define important terms

### Integration & API
- **Browser Extension**: Process content directly from web pages
- **API Access**: Developer API for integrating with other applications
- **Webhook Support**: Real-time notifications for processed content
- **Third-party Integrations**: Connect with note-taking apps, CMS systems

### Analytics & Insights
- **Usage Statistics**: Track content processing history and patterns
- **Content Analytics**: Insights into frequently processed topics
- **Performance Metrics**: Processing speed and accuracy measurements
- **User Feedback System**: Rating and improvement suggestions for explanations

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling and development
- **Tailwind CSS** for styling
- **Shadcn/ui** component library
- **TanStack Query** for API state management
- **Wouter** for routing (prepared for future multi-page features)

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Anthropic Claude API** (claude-sonnet-4-20250514)
- **Zod** for schema validation
- **Session-based storage** (no database required)

### Development Tools
- **ESBuild** for fast JavaScript bundling
- **Drizzle ORM** (configured but not used in current session-based architecture)
- **PostgreSQL** support ready for future persistent storage features

## Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Environment Variables**:
   ```bash
   ANTHROPIC_API_KEY=your_claude_api_key
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```

4. **Access Application**:
   Open `http://localhost:5000` in your browser

## Project Architecture

- **Session-Based**: Pure client-session architecture with no persistent storage
- **API-First**: RESTful API design ready for future mobile/desktop clients
- **Component-Driven**: Modular React components with TypeScript interfaces
- **Error-Resilient**: Comprehensive error handling and user feedback
- **Scalable**: Architecture ready for database integration and advanced features

## API Endpoints

- `POST /api/simplify` - Process and simplify content
- `POST /api/followup` - Answer follow-up questions with context

## Rate Limits

The application uses Anthropic's Claude API with the following limits:
- 30,000 input tokens per minute
- 8,000 output tokens per minute
- 50 requests per minute

Rate limit errors are handled gracefully with user-friendly messaging.

## Contributing

This project follows modern React and TypeScript best practices. All new features should include proper TypeScript types, error handling, and user feedback mechanisms.