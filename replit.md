# Content Simplifier - AI-Powered Content Understanding Companion

## Overview

Content Simplifier is a React-based web application that transforms complex content into clear, understandable explanations using AI. Users can input text content, URLs, or upload files, and the system uses Claude AI to generate simplified explanations with real-world analogies and examples. The application includes an interactive follow-up question system and basic content organization features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript and modern hooks
- **UI Library**: Shadcn/ui components with Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: React hooks with session-based storage (no persistent database)
- **Query Management**: TanStack Query for API state management
- **Routing**: Single-page application (no client-side routing implemented)

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **API**: RESTful endpoints for content simplification and follow-up questions
- **Session Management**: In-memory session storage during user visits
- **File Processing**: Support for text, PDF, markdown, and image uploads

### AI Integration
- **Provider**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Capabilities**: Content extraction, simplification, and follow-up question answering
- **URL Processing**: Currently requires manual content extraction (no direct URL browsing)

## Key Components

### Core Features
1. **Content Simplification Engine**
   - Text input with automatic content type detection
   - AI-powered explanation generation with custom prompts
   - Category organization (AI, Money, Tech, Business, Other)
   - File upload support (PDF, text, markdown, images)

2. **Interactive Follow-up System**
   - Question-answer interface without page scrolling issues
   - Context-aware responses based on original explanations
   - Smooth UI transitions for conversation flow

3. **Content Organization**
   - Category-based classification system
   - Session-based content storage
   - Copy functionality for explanations

### UI Components
- **MainPage**: Primary interface for content input and display
- **ExplanationModal**: Modal view for detailed content viewing
- **Category System**: Visual badges with color-coding
- **File Upload**: Drag-and-drop and click-to-upload functionality

## Data Flow

1. **Content Input**: User provides text, URL, or uploads file
2. **AI Processing**: Content sent to Claude API for simplification
3. **Response Handling**: Simplified content returned with metadata
4. **Display**: Results shown in clean, formatted interface
5. **Follow-up Questions**: Additional questions processed with original context
6. **Session Storage**: Content maintained in memory during user session

## External Dependencies

### Core Dependencies
- **@anthropic-ai/sdk**: Claude AI integration
- **@tanstack/react-query**: API state management
- **@radix-ui/***: UI primitive components
- **tailwindcss**: Utility-first CSS framework
- **zod**: Schema validation
- **date-fns**: Date formatting utilities

### Development Dependencies
- **Vite**: Build tool and development server
- **TypeScript**: Type safety and development experience
- **ESBuild**: Fast JavaScript/TypeScript bundling

### Database Configuration
- **Drizzle ORM**: Configured but not actively used (session-based storage)
- **PostgreSQL**: Database schema defined but application runs without persistent storage
- **Neon Database**: Connection configured via environment variables

## Recent Changes: Latest modifications with dates

### July 30, 2025
- **URL Processing with Web Search**: Implemented Claude's web search API for direct URL content retrieval
- **YouTube Detection**: Added special handling for YouTube URLs with user guidance for transcript processing
- **Follow-up Context Retention**: Fixed follow-up questions to include original explanation context
- **Clear/Reset Functionality**: Added clickable logo and "Clear & Start Over" button
- **Source Citations**: Automatic citation display for web-searched content
- **Plain Text Output**: Removed markdown formatting from all AI responses
- **PDF Error Handling**: Added content truncation (150k chars) to prevent token limit errors
- **Loading Indicators**: Comprehensive loading states for follow-up questions
- **Rate Limit Handling**: User-friendly error messages for API rate limits
- **Content Type Detection**: Enhanced file upload with proper MIME type handling
- **Export Options Complete**: Comprehensive export functionality with PDF, Word, and text formats
- **Multi-LLM Backup System**: Added DeepSeek API as backup when Claude reaches rate limits
- **Export from Main Page**: Download dropdown available on all explanations (saved or not)
- **Bulk Export Feature**: "Export All" functionality in history page
- **Save/Bookmark Guidance**: Clear instructions for users on how to save and bookmark content

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React application to `dist/public`
- **Backend**: ESBuild bundles server code to `dist/index.js`
- **Assets**: Static files served from build output

### Environment Configuration
- **Development**: Uses Vite dev server with HMR
- **Production**: Express serves static files and API endpoints
- **Environment Variables**: 
  - `ANTHROPIC_API_KEY` or `CLAUDE_API_KEY` for AI integration
  - `DATABASE_URL` for PostgreSQL (optional, not required for current functionality)

### Session Management
- **Current State**: In-memory storage during user sessions
- **Future Enhancement**: Optional database persistence for saved explanations
- **Data Persistence**: Content cleared when user closes browser/session ends

### Replit Integration
- **Development Banner**: Automatic development mode detection
- **Hot Reload**: Vite plugin for runtime error overlay
- **Cartographer**: Development mapping for Replit environment

## Architecture Decisions

### Session-Based vs Database Storage
**Problem**: Need for content persistence and user data management
**Solution**: Implemented session-based storage for MVP phase
**Rationale**: Simplified deployment and reduced complexity while maintaining core functionality
**Future**: Database persistence planned as optional enhancement

### Claude AI Integration
**Problem**: Need for reliable content simplification
**Solution**: Anthropic Claude API with custom prompts
**Rationale**: Superior language understanding and explanation capabilities
**Trade-off**: API costs vs quality of explanations

### Component Architecture
**Problem**: Scalable UI development
**Solution**: Shadcn/ui with Radix UI primitives
**Rationale**: Consistent design system with accessibility features
**Benefits**: Rapid development with professional appearance

### File Upload Strategy
**Problem**: Supporting multiple content types
**Solution**: Client-side file processing with type detection
**Rationale**: Reduced server load and immediate user feedback
**Limitation**: Large file processing constraints