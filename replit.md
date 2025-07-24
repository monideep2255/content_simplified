# Content Simplifier - System Architecture

## Overview

Content Simplifier is an AI-powered web application that transforms complex content into clear, understandable explanations. Users can input URLs or text content, and the system uses Claude AI to generate simplified explanations with real-world examples and analogies. The application also supports follow-up questions and content organization through categories.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a modern full-stack architecture with clear separation between frontend, backend, and AI services:

- **Frontend**: React-based single-page application with TypeScript
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM (configured but currently using in-memory storage)
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
- **Storage**: Abstracted storage interface (currently in-memory, ready for database)
- **AI Service**: Separate service layer for Claude API integration

### Database Schema
The application uses Drizzle ORM with PostgreSQL schema for:
- **Explanations**: Stores simplified content with metadata
- **Followup Questions**: Linked to explanations for conversation context
- **Categories**: Predefined categories (AI, Money, Tech, Business, Other)

### AI Processing Pipeline
- **URL Content Extraction**: Claude API with web browsing capabilities
- **Content Simplification**: Custom prompts for clear, jargon-free explanations
- **Follow-up Handling**: Context-aware responses based on previous explanations

## Data Flow

1. **Content Input**: User provides URL or text content with category selection
2. **AI Processing**: Content sent to Claude API for extraction and simplification
3. **Storage**: Processed explanation stored with metadata and category
4. **Display**: Simplified content displayed with follow-up question capability
5. **Follow-up Questions**: Additional questions processed with context from original explanation
6. **Organization**: Content categorized and accessible through saved items page

## External Dependencies

### Core Dependencies
- **@anthropic-ai/sdk**: Claude AI integration for content processing
- **@neondatabase/serverless**: PostgreSQL database connectivity
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management and caching

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
- **Database**: Configured for PostgreSQL with Drizzle migrations
- **Environment Variables**: Claude API key and database URL required

### Production Build
- **Frontend**: Vite builds optimized static assets
- **Backend**: esbuild bundles server code for Node.js deployment
- **Database**: Drizzle migrations handle schema updates
- **Static Assets**: Served from Express server in production

### Storage Strategy
The application is designed with storage abstraction:
- **Current**: In-memory storage for rapid development and testing
- **Production Ready**: PostgreSQL schema defined and migration-ready
- **Flexibility**: Storage interface allows easy switching between implementations

### Environment Configuration
- **Development**: File-based configuration with environment detection
- **Production**: Environment variables for sensitive configuration
- **Replit Integration**: Special handling for Replit deployment environment