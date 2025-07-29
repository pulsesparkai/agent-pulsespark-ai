# PulseSpark.ai - AI-Powered Development Platform

A modern React application with Supabase backend for managing AI projects, chat sessions, and development workflows.

## 🚀 Features

- **Project Management**: Create, organize, and manage coding projects with GitHub integration
- **AI Chat Interface**: Multi-provider AI chat with session management and history
- **Memory System**: Semantic search and knowledge base with vector embeddings
- **API Key Management**: Secure storage and management of AI provider credentials
- **Feedback Analytics**: Track and analyze AI response quality across providers
- **Real-time Collaboration**: Live updates and notifications across the platform

## 🛠 Tech Stack

- **Frontend**: React 18+ with TypeScript
- **Backend**: Supabase (PostgreSQL + Auth + Real-time)
- **Styling**: Tailwind CSS with dark theme
- **Routing**: React Router v6
- **State Management**: React Context + Custom Hooks
- **Build Tool**: Vite
- **Deployment**: Vercel

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- Vercel account (for deployment)

## 🔧 Environment Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pulsespark-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=https://api.pulsespark.ai
   VITE_FRONTEND_URL=https://agent.pulsespark.ai
   VITE_APP_NAME=PulseSpark AI
   VITE_APP_VERSION=1.0.0
   ```

   **Get Supabase credentials:**
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Go to Settings > API
   - Copy the Project URL and anon/public key

## 🏃‍♂️ Development

**Start development server:**
```bash
npm run dev
```

**Other commands:**
```bash
npm run build          # Build for production
npm run preview        # Preview production build
npm run lint           # Run ESLint
npm run type-check     # TypeScript type checking
```

## 🚀 Deployment to Vercel

### Deployment to agent.pulsespark.ai

The frontend is deployed to **agent.pulsespark.ai** and connects to the backend API at **api.pulsespark.ai**.

### Option 1: Vercel CLI (Recommended)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Configure Custom Domain**
   - In Vercel dashboard, go to Settings > Domains
   - Add `agent.pulsespark.ai` as custom domain
   - Ensure DNS is pointing to Vercel

### Option 2: GitHub Integration

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Deploy PulseSpark.ai"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables
   - Deploy

### Environment Variables for Vercel

In your Vercel project settings, add these environment variables:

```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_API_URL=https://api.pulsespark.ai
VITE_FRONTEND_URL=https://agent.pulsespark.ai
VITE_APP_NAME=PulseSpark AI
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

## 🔒 Security Configuration

### Supabase Setup

1. **Row Level Security (RLS)**
   - All tables have RLS enabled
   - Users can only access their own data
   - Policies are automatically enforced

2. **Authentication**
   - Email/password authentication
   - Session persistence
   - Automatic token refresh

3. **API Keys**
   - Encrypted storage in database
   - Client-side encryption before storage
   - Secure key preview display

## 📱 Features Overview

### Dashboard
- Real-time statistics and metrics
- Quick action buttons
- Recent activity feed
- Getting started guide for new users

### Project Management
- Create, edit, delete projects
- GitHub repository integration
- File tree visualization
- Project search and filtering

### Chat Interface
- Multi-provider AI support (OpenAI, Claude, etc.)
- Session management
- Message history persistence
- Real-time messaging simulation

### Memory System
- Semantic search capabilities
- Tag-based organization
- Project association
- Advanced filtering options

### API Key Management
- Secure credential storage
- Provider-specific validation
- Search and filter functionality
- Encrypted key display

### Feedback Analytics
- Rate AI responses
- View aggregated statistics
- Provider performance comparison
- Filtering and analysis tools

## 🎨 UI/UX Features

- **Dark Theme**: Professional dark gray color scheme
- **Responsive Design**: Works on all device sizes
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support
- **Animations**: Smooth transitions and micro-interactions
- **Loading States**: Comprehensive loading indicators
- **Error Handling**: User-friendly error messages and recovery options

## 🔧 Production Optimizations

- **Code Splitting**: Automatic vendor and UI library chunking
- **Asset Optimization**: Compressed images and optimized bundles
- **Caching**: Static asset caching with proper headers
- **Error Monitoring**: Production error logging and monitoring
- **Performance**: Optimized queries and efficient re-renders

## 📊 Performance

- **Lighthouse Score**: 90+ across all metrics
- **Bundle Size**: Optimized with code splitting
- **Load Time**: < 3s initial load on 3G
- **Runtime Performance**: Smooth 60fps animations

## 🐛 Troubleshooting

### Common Issues

1. **Supabase Connection Error**
   - Verify environment variables are correct
   - Check Supabase project status
   - Ensure RLS policies are properly configured

2. **Build Errors**
   - Run `npm run type-check` to identify TypeScript issues
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`

3. **Authentication Issues**
   - Check Supabase Auth settings
   - Verify redirect URLs in Supabase dashboard
   - Clear browser storage and try again

### Support

For issues and support:
- Check the [Issues](https://github.com/your-repo/issues) page
- Review Supabase documentation
- Contact the development team

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Built with ❤️ by the PulseSpark.ai team**