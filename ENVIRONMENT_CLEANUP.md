# Environment Cleanup Guide

## 🎯 Goal: Consolidate to ONE Production Environment

### Current Problem:
- Multiple production environments causing confusion
- Environment variables scattered across different deployments
- Different URLs for same application

### Solution: Merge Everything

## 🔧 Steps to Clean Up:

### 1. ✅ Choose Main Environment
**Keep**: `agent-pulsespark-ai` (main production)
**Delete**: All other production variants

### 2. ✅ Consolidate Environment Variables
Set these in your MAIN Vercel project only:

```bash
# REQUIRED - From your Supabase dashboard
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# APP CONFIGURATION
VITE_APP_NAME=PulseSpark AI
VITE_APP_VERSION=1.0.0
VITE_FRONTEND_URL=https://agent-pulsespark-ai.vercel.app

# OPTIONAL
VITE_API_URL=https://api.pulsespark.ai
NODE_ENV=production
```

### 3. ✅ Delete Extra Environments
In Vercel dashboard:
1. Go to each extra environment
2. Settings → General → Delete Project
3. Keep only the main one

### 4. ✅ Set Custom Domain (Optional)
- Point `agent.pulsespark.ai` to your main Vercel project
- Remove from other projects

## 🚀 Expected Results:
- ✅ ONE working production environment
- ✅ Clear environment variable setup
- ✅ No deployment conflicts
- ✅ Easier management and debugging

## 📋 Checklist:
- [ ] Delete extra Vercel projects
- [ ] Set environment variables in main project
- [ ] Test deployment
- [ ] Verify app functionality
- [ ] Update DNS if using custom domain

---
**After cleanup, you should have ONE clean, working environment!**