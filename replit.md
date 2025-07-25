# Content Simplifier - System Architecture

## Overview

Content Simplifier is an AI-powered web application that transforms complex content into clear, understandable explanations. Users can input text content or upload files, and the system uses Claude AI to generate simplified explanations with real-world examples and analogies. The application supports follow-up questions and content organization through categories with persistent PostgreSQL storage.

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes (July 2025)

✓ **Simplified Architecture**: Removed database completely - app is now session-based only
✓ **Enhanced File Upload**: Added support for PDFs, Markdown, text files, images, and documents
✓ **Improved UX**: Auto-scroll for follow-up answers, source links for content
✓ **URL Handling**: Clear messaging that URLs cannot be processed directly - users must copy content
✓ **Single Page App**: Removed navigation and saved items - focus purely on content simplification
✓ **Privacy-First**: No data persistence ensures complete privacy for user content

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend, backend, and AI services:

- **Frontend**: React-based single-page application with TypeScript
- **Backend**: Express.js server with TypeScript
- **Storage**: Session-based architecture (no database required)
- **AI Integration**: Anthropic Claude API for content processing
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite for development and production builds

## Key Components

### Frontend Architecture
- **Framework**: React 18 with modern hooks and functional components
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query for server state and local React state
- **UI Framework**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and responsive design

### Backend Architecture
- **Server**: Express.js with TypeScript
- **API Design**: RESTful endpoints with proper error handling
- **Middleware**: JSON parsing, CORS handling, and request logging
- **Storage**: Session-based - no persistent storage required
- **AI Service**: Separate service layer for Claude API integration

### Data Model
The application uses simple TypeScript interfaces for session-based data:
- **Explanations**: Temporary simplified content with metadata
- **Followup Questions**: In-memory conversation context
- **Categories**: Predefined categories (AI, Money, Tech, Business, Other)

### AI Processing Pipeline
- **URL Content Extraction**: Claude API with web browsing capabilities
- **Content Simplification**: Custom prompts for clear, jargon-free explanations
- **Follow-up Handling**: Context-aware responses based on previous explanations

## Data Flow

1. **Content Input**: User provides text content or uploads files with category selection
2. **AI Processing**: Content sent to Claude API for extraction and simplification
3. **Session Display**: Processed explanation displayed temporarily in current session
4. **Display**: Simplified content displayed with follow-up question capability
5. **Follow-up Questions**: Additional questions processed with context from original explanation
6. **Copy & Save**: Users can copy content to clipboard for their own organization

## External Dependencies

### Core Dependencies
- **@anthropic-ai/sdk**: Claude AI integration for content processing
- **@tanstack/react-query**: Server state management and caching
- **express**: Backend server framework
- **typescript**: Type safety and developer experience

### UI Dependencies
- **@radix-ui/***: Comprehensive set of UI primitives
- **tailwindcss**: Utility-first CSS framework
- **class-variance-authority**: Component variant management
- **cmdk**: Command palette functionality

### Development Dependencies
- **vite**: Fast build tool and development server
- **typescript**: Type safety and developer experience
- **esbuild**: Fast JavaScript bundler for production

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with hot module replacement
- **No Database**: No database setup required - purely session-based
- **Environment Variables**: Only Claude API key required

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles server code for Node.js deployment
- **No Database**: No database migrations or setup needed
- **Static Assets**: Served from Express server in production

### Storage Strategy
The application uses a session-based approach for simplicity:
- **Session-Only**: All content exists only during the current browser session
- **Privacy-First**: No data persistence ensures complete user privacy
- **Deployment-Simple**: No database setup or maintenance required

### Environment Configuration
- **Development**: File-based configuration with environment detection
- **Production**: Only requires ANTHROPIC_API_KEY environment variable
- **Replit Integration**: Simplified deployment with no database dependencies