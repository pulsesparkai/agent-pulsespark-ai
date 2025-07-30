# PulseSpark AI - Project Structure

## 📁 Complete File Tree

```
pulsespark-ai/
├── 📄 README.md
├── 📄 package.json
├── 📄 package-lock.json
├── 📄 index.html
├── 📄 vercel.json
├── 📄 .env.example
├── 📄 .vercelignore
├── 📄 .gitignore
├── 📄 tsconfig.json
├── 📄 tsconfig.app.json
├── 📄 tsconfig.node.json
├── 📄 vite.config.ts
├── 📄 tailwind.config.js
├── 📄 postcss.config.js
├── 📄 eslint.config.js
├── 📄 .env (hidden)
│
├── 📁 .bolt/
│   ├── 📄 prompt
│   ├── 📄 config.json
│   └── 📁 supabase_discarded_migrations/
│       ├── 📄 20250727185055_fragrant_hill.sql
│       └── 📄 20250727192255_velvet_water.sql
│
├── 📁 backend/
│   ├── 📄 main.py
│   ├── 📄 memory_api.py
│   ├── 📄 test_memory_api.py
│   ├── 📄 requirements.txt
│   ├── 📄 README.md
│   ├── 📄 Dockerfile
│   ├── 📄 docker-compose.yml
│   └── 📄 .env.example
│
├── 📁 supabase/
│   ├── 📁 functions/
│   │   ├── 📁 generate/
│   │   │   └── 📄 index.ts
│   │   └── 📁 embeddings/
│   │       └── 📄 index.ts
│   └── 📁 migrations/
│       ├── 📄 20250727175143_sweet_garden.sql
│       ├── 📄 20250727181307_pale_ember.sql
│       ├── 📄 20250727183000_morning_villa.sql
│       ├── 📄 20250728010529_bronze_base.sql
│       ├── 📄 20250728012030_winter_lab.sql
│       ├── 📄 20250728012454_divine_rice.sql
│       ├── 📄 20250728024245_royal_feather.sql
│       ├── 📄 20250728024332_long_paper.sql
│       ├── 📄 20250729133228_rustic_darkness.sql
│       ├── 📄 20250729133308_quick_bar.sql
│       ├── 📄 20250729133704_shiny_dawn.sql
│       ├── 📄 20250729133712_rustic_bread.sql
│       ├── 📄 20250729133720_silver_rain.sql
│       ├── 📄 20250729133748_old_lodge.sql
│       ├── 📄 20250729133754_round_coral.sql
│       ├── 📄 20250729133800_warm_band.sql
│       ├── 📄 20250729134512_humble_prism.sql
│       ├── 📄 20250729134522_red_firefly.sql
│       ├── 📄 20250729134533_tender_flower.sql
│       ├── 📄 20250729134539_fierce_trail.sql
│       ├── 📄 20250729134614_warm_mode.sql
│       ├── 📄 20250729150158_odd_canyon.sql
│       ├── 📄 20250729150201_azure_credit.sql
│       ├── 📄 20250729150203_floating_lab.sql
│       └── 📄 20250729150205_black_lake.sql
│
└── 📁 src/
    ├── 📄 main.tsx
    ├── 📄 App.tsx
    ├── 📄 index.css
    ├── 📄 vite-env.d.ts
    │
    ├── 📁 types/
    │   └── 📄 index.ts
    │
    ├── 📁 lib/
    │   ├── 📄 config.ts
    │   ├── 📄 supabase.ts
    │   └── 📄 encryption.ts
    │
    ├── 📁 utils/
    │   └── 📄 errorHandling.ts
    │
    ├── 📁 hooks/
    │   ├── 📄 useMemory.ts
    │   ├── 📄 useFeedback.ts
    │   └── 📄 useErrorHandler.ts
    │
    ├── 📁 contexts/
    │   ├── 📄 AuthContext.tsx
    │   ├── 📄 ApiKeysContext.tsx
    │   ├── 📄 ProjectContext.tsx
    │   ├── 📄 MemoryContext.tsx
    │   ├── 📄 FeedbackContext.tsx
    │   ├── 📄 ChatContext.tsx
    │   ├── 📄 NotificationContext.tsx
    │   ├── 📄 GitHubContext.tsx
    │   └── 📄 AIProviderContext.tsx
    │
    ├── 📁 pages/
    │   ├── 📄 AuthPage.tsx
    │   ├── 📄 DashboardPage.tsx
    │   ├── 📄 ProjectsPage.tsx
    │   ├── 📄 ApiKeysPage.tsx
    │   ├── 📄 ChatPage.tsx
    │   ├── 📄 MemoryPage.tsx
    │   ├── 📄 FeedbackPage.tsx
    │   └── 📄 SettingsPage.tsx
    │
    └── 📁 components/
        ├── 📄 FileExplorer.tsx
        │
        ├── 📁 Layout/
        │   ├── 📄 Layout.tsx
        │   ├── 📄 Header.tsx
        │   ├── 📄 Sidebar.tsx
        │   ├── 📄 SidebarNavigation.tsx
        │   └── 📄 AppHeader.tsx
        │
        ├── 📁 Auth/
        │   ├── 📄 LoginForm.tsx
        │   ├── 📄 LoginPage.tsx
        │   ├── 📄 SignupForm.tsx
        │   └── 📄 SignupPage.tsx
        │
        ├── 📁 Chat/
        │   ├── 📄 ChatMessage.tsx
        │   ├── 📄 ChatInputBar.tsx
        │   ├── 📄 ChatInterface.tsx
        │   ├── 📄 ChatMessageBubble.tsx
        │   ├── 📄 ChatNotifications.tsx
        │   ├── 📄 ChatSettingsPanel.tsx
        │   ├── 📄 ProviderSelector.tsx
        │   └── 📄 TypingIndicator.tsx
        │
        ├── 📁 ApiKeys/
        │   ├── 📄 ApiKeysPage.tsx
        │   ├── 📄 ApiKeysList.tsx
        │   └── 📄 AddApiKeyForm.tsx
        │
        ├── 📁 Projects/
        │   ├── 📄 ProjectsList.tsx
        │   ├── 📄 ProjectDashboard.tsx
        │   ├── 📄 ProjectFileExplorer.tsx
        │   └── 📄 ProjectSettingsPanel.tsx
        │
        ├── 📁 Memory/
        │   ├── 📄 index.ts
        │   ├── 📄 MemoryPage.tsx
        │   ├── 📄 MemoryList.tsx
        │   ├── 📄 MemoryItemEditor.tsx
        │   └── 📄 MemorySearch.tsx
        │
        ├── 📁 Feedback/
        │   └── 📄 FeedbackForm.tsx
        │
        ├── 📁 Shared/
        │   ├── 📄 ErrorBoundary.tsx
        │   ├── 📄 LoadingSpinner.tsx
        │   ├── 📄 PlaceholderPage.tsx
        │   └── 📄 ConfirmationModal.tsx
        │
        ├── 📁 User/
        │   ├── 📄 ActivityFeed.tsx
        │   ├── 📄 UserProfileSettings.tsx
        │   └── 📄 UserNotificationsPanel.tsx
        │
        ├── 📁 Admin/
        │   ├── 📄 AdminDashboard.tsx
        │   └── 📄 UserRoleManagement.tsx
        │
        ├── 📁 Support/
        │   └── 📄 SupportFAQPage.tsx
        │
        ├── 📁 Billing/
        │   ├── 📄 PaymentMethodForm.tsx
        │   └── 📄 SubscriptionBillingPage.tsx
        │
        ├── 📁 CodeEditor/
        │   ├── 📄 FileExplorer.tsx
        │   ├── 📄 MonacoEditor.tsx
        │   ├── 📄 CodeEditorPage.tsx
        │   └── 📄 GitHubIntegration.tsx
        │
        └── 📁 Dashboard/
            ├── 📄 Dashboard.tsx
            └── 📄 AIAnalyticsDashboard.tsx
```

## 🏗️ Architecture Overview

### **Frontend Structure**
```
React 18 + TypeScript + Vite
├── 🎨 Styling: Tailwind CSS
├── 🔄 State: React Context + Custom Hooks
├── 🛣️ Routing: React Router v6
├── 🔧 Build: Vite
└── 📦 Deployment: Vercel
```

### **Backend Structure**
```
FastAPI + Python
├── 🗄️ Database: Supabase (PostgreSQL)
├── 🔐 Auth: Supabase Auth
├── 🤖 AI: Multi-provider (OpenAI, Claude, etc.)
├── 🔍 Search: Vector embeddings (pgvector)
└── 🚀 Deployment: Docker + Render/Railway
```

### **Database Structure**
```
Supabase PostgreSQL
├── 👤 auth.users (built-in)
├── 🔑 api_keys
├── 📁 projects
├── 💬 chat_sessions
├── 🧠 memory_items
├── 📊 feedback_entries
└── 👥 users (custom profile data)
```

## 🔧 Key Technologies

### **Frontend Stack**
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with dark theme
- **Icons**: Lucide React
- **Charts**: Recharts
- **Editor**: Monaco Editor
- **Panels**: React Resizable Panels

### **Backend Stack**
- **API**: FastAPI with async/await
- **Database**: Supabase (PostgreSQL + Auth + Real-time)
- **Vector Search**: pgvector extension
- **AI Providers**: OpenAI, Claude, DeepSeek, Grok, Mistral
- **Security**: Row Level Security (RLS)

### **Development Tools**
- **Build**: Vite
- **Linting**: ESLint
- **Type Checking**: TypeScript
- **Package Manager**: npm
- **Version Control**: Git + GitHub

## 📊 Component Hierarchy

### **Main App Structure**
```
App.tsx
├── AuthProvider
├── ApiKeysProvider
├── ProjectProvider
├── MemoryProvider
├── FeedbackProvider
├── ChatProvider
├── NotificationProvider
└── Router
    ├── AuthPage (/auth)
    ├── ProtectedLayout
    │   ├── Layout (Sidebar + Header)
    │   ├── DashboardPage (/)
    │   ├── ProjectsPage (/projects)
    │   ├── ApiKeysPage (/api-keys)
    │   ├── ChatPage (/chat)
    │   ├── MemoryPage (/memory)
    │   ├── FeedbackPage (/feedback)
    │   └── SettingsPage (/settings)
    └── Navigate redirects
```

## 🎯 Feature Modules

### **🔐 Authentication**
- Email/password signup and login
- Supabase Auth integration
- Protected routes
- User session management

### **🤖 AI Chat**
- Multi-provider support
- Real-time messaging
- Session management
- Provider switching

### **📁 Project Management**
- File tree structure
- Monaco code editor
- GitHub integration
- Project settings

### **🧠 Memory System**
- Vector embeddings
- Semantic search
- Tag-based organization
- Project association

### **🔑 API Key Management**
- Secure storage (encrypted)
- Provider validation
- Key preview display
- CRUD operations

### **📊 Feedback Analytics**
- Rating system (thumbs/stars/scale)
- Provider performance tracking
- Usage analytics
- Trend analysis

## 🚀 Deployment Configuration

### **Frontend (Vercel)**
- Build command: `npm run build`
- Output directory: `dist`
- Environment variables in Vercel dashboard
- Custom domain: `agent.pulsespark.ai`

### **Backend (Render/Railway)**
- Docker containerized
- FastAPI with Uvicorn
- Environment variables for API keys
- Health check endpoints

### **Database (Supabase)**
- PostgreSQL with pgvector
- Row Level Security enabled
- Real-time subscriptions
- Edge functions for AI processing

---

**📝 Save this file as `project-structure.md` for future reference!**