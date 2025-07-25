# Content Simplifier 🧠✨

**Your AI-Powered Content Understanding Companion**

*Last Updated: July 25, 2025*

Transform complex content into clear, understandable explanations with real-world examples and analogies. Whether it's AI developments, cryptocurrency trends, or business insights, Content Simplifier makes any content accessible to everyone.

![Content Simplifier Demo](https://img.shields.io/badge/Status-Live-brightgreen) ![Version](https://img.shields.io/badge/Version-1.0-blue)

## 🌟 What is Content Simplifier?

Content Simplifier is a web application that takes complex text content and breaks it down into simple, easy-to-understand explanations. Perfect for:

- 📖 **Curious learners** who want to understand complex articles without hours of research
- 💼 **Busy professionals** who need to quickly grasp newsletter content and save insights
- 🎓 **Students** who want to break down academic or technical content
- 📱 **Content consumers** who want one tool to organize their learning

## ✨ Features

### ✅ Currently Implemented (Phase 1-3)

#### 🤖 AI-Powered Simplification
- **Smart Content Processing**: Paste text content and get instant AI-powered explanations
- **Real-World Examples**: Complex concepts explained with analogies and examples everyone can understand
- **Clean Output**: No jargon, no technical mumbo-jumbo - just clear, conversational explanations

#### 💬 Interactive Follow-Up Questions
- **Ask Anything**: Have questions about an explanation? Just ask!
- **Conversational Interface**: Follow-up answers appear smoothly like a chatbot
- **Context-Aware**: AI remembers the original explanation for better follow-up responses

#### 🔗 Source Tracking
- **Source Links**: Always know where content came from with clickable source links
- **Content Types**: Support for text content, article titles, video transcripts, and more
- **File Upload**: Upload PDFs, Markdown files, text documents, and images

#### 📂 Basic Organization
- **Category System**: Organize content by AI, Money, Tech, Business, or Other
- **Session-Based**: Content remains available during your current session

### 🚧 Coming Next (Future Versions)

#### 📚 Persistent Storage (Optional)
- **Save What Matters**: Save explanations you want to keep for later
- **Easy Browsing**: View saved explanations in an organized grid with filtering options
- **Cross-Session Access**: Access your saved content anytime

#### 🎯 Advanced Features
- **Custom Categories**: Create your own content categories
- **Learning Path Recommendations**: AI-suggested content based on your interests
- **Export Capabilities**: Export your explanations in various formats
- **Usage Analytics**: Track your learning progress

## 🚀 Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- Anthropic API Key (for Claude AI)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/content-simplifier.git
   cd content-simplifier
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to `http://localhost:5000` to start using Content Simplifier!

### Getting Your API Key

1. Visit [Anthropic's Console](https://console.anthropic.com/)
2. Create an account or sign in
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key and add it to your `.env` file

## 📖 How to Use

### Basic Usage

1. **Enter Content**: Paste text content, article titles, or transcripts into the main input area
2. **Choose Category**: Select the most appropriate category (AI, Money, Tech, Business, Other)
3. **Get Explanation**: Click "Simplify Content" and wait for your clear explanation
4. **Ask Follow-ups**: Have questions? Type them in the follow-up box for more details
5. **Copy if Needed**: Click the copy icon to save explanations to your clipboard

### Important Notes

- **URLs**: The app cannot directly process URLs or web links. Copy the content from the webpage instead
- **File Support**: Upload PDFs, Markdown files, text documents, and images for processing
- **Session-Based**: All content is temporary and only available during your current session

### Navigation

The app now has a simplified single-page interface focused entirely on content simplification. No navigation is needed as all functionality is available on the main page.

## 🛠 Technical Architecture

### Frontend
- **React 18** with modern hooks and TypeScript
- **Tailwind CSS** for responsive, beautiful design
- **shadcn/ui** components for consistent UI elements
- **TanStack Query** for efficient data management

### Backend
- **Express.js** server with TypeScript
- **Session-based architecture** (no database required)
- **Anthropic Claude API** for AI-powered content processing
- **RESTful API** design with proper error handling

### Key Technologies
- **Claude 4.0 Sonnet**: Latest AI model for best explanation quality
- **Vite**: Fast development and build tooling
- **TypeScript**: Type safety and developer experience
- **Tailwind CSS**: Modern styling framework

## 📁 Project Structure

```
content-simplifier/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/           # Utility functions and API calls
│   │   └── pages/         # Page components
├── server/                # Backend Express server
│   ├── services/          # Business logic (Claude AI integration)
│   └── routes.ts          # API route definitions
├── shared/                # Shared types and schemas
└── README.md             # You are here!
```

## 🎯 Use Cases

### For Learners
- Understand complex research papers
- Break down technical blog posts
- Simplify financial news and analysis
- Learn about new technologies

### For Professionals
- Quickly grasp industry reports
- Understand competitor analysis
- Process lengthy newsletters
- Stay updated on market trends

### For Students
- Simplify academic articles
- Understand complex theories
- Break down case studies
- Process research materials

## 🔧 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production

### Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🚫 Limitations

- **URLs**: Cannot directly process web URLs - content must be copied manually
- **File Size**: Large files may cause processing delays
- **API Limits**: Subject to Anthropic API rate limits and usage quotas
- **Language**: Currently optimized for English content
- **Session-Based**: Content is not saved between sessions (by design for simplicity)

## 🔐 Privacy & Security

- **API Keys**: Your Anthropic API key is stored securely in environment variables
- **Data**: Explanations are stored in your own database
- **No Tracking**: No user analytics or tracking implemented
- **Local Processing**: All content processing happens through your API key

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/your-username/content-simplifier/issues) page
2. Create a new issue with detailed information
3. Include error messages and steps to reproduce

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Anthropic** for providing the Claude AI API
- **Replit** for the development platform
- **shadcn/ui** for the beautiful component library
- **The open source community** for the amazing tools and libraries

---

**Ready to make complex content simple?** Start exploring with Content Simplifier today! 🚀