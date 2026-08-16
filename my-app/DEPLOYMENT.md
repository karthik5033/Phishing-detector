# 🚀 ClickWise Frontend Deployment Guide

This guide covers deploying the ClickWise Next.js dashboard to Vercel.

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup

Before deploying, you need to configure the backend API URL:

**For Vercel Dashboard:**
1. Go to your Vercel project → Settings → Environment Variables
2. Add the following variable:
   ```
   Name: NEXT_PUBLIC_API_URL
   Value: https://your-backend-api.com/api/v1
   ```
3. Apply to: Production, Preview, and Development

**Backend Options:**

**Option A: Deploy Backend Separately**
- Deploy the FastAPI backend to a service like:
  - Railway.app
  - Render.com
  - AWS EC2/ECS
  - Google Cloud Run
  - DigitalOcean App Platform
- Get the deployed backend URL
- Set `NEXT_PUBLIC_API_URL` to that URL

**Option B: Local Backend for Development**
- Keep `NEXT_PUBLIC_API_URL=http://127.0.0.1:8002/api/v1`
- Note: This only works for local development, not production

**Option C: Vercel Serverless Functions (Advanced)**
- Create API routes in `app/api/` to proxy requests to your backend
- Requires additional setup (not covered here)

---

## 🌐 Deploy to Vercel

### Method 1: Deploy via Vercel Dashboard (Easiest)

1. **Push to GitHub:**
   ```bash
   cd my-app
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import your GitHub repository
   - Select the `my-app` folder as the root directory
   - Add environment variable `NEXT_PUBLIC_API_URL`
   - Click "Deploy"

3. **Configure Root Directory:**
   - In Vercel project settings → General
   - Set "Root Directory" to `my-app`
   - Save changes

### Method 2: Deploy via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Navigate to my-app directory
cd my-app

# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Link to existing project or create new
# - Set project name: clickwise-dashboard
# - Confirm settings

# For production deployment
vercel --prod
```

---

## 🔧 Configuration Files

### `next.config.ts`
✅ Already configured with:
- Standalone output for optimal Vercel deployment
- Image optimization
- TypeScript strict mode
- Production optimizations

### `vercel.json`
✅ Configured with:
- Security headers (X-Frame-Options, X-XSS-Protection)
- API rewrites
- Build settings

### `.env.example`
✅ Template for environment variables
- Copy to `.env.local` for local development
- Add actual values in Vercel dashboard for production

---

## 🛠️ Build & Test Locally

Before deploying, test the production build locally:

```bash
# Navigate to my-app
cd my-app

# Install dependencies
npm install

# Create .env.local file (if not exists)
cp .env.example .env.local

# Edit .env.local and set your backend URL
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8002/api/v1

# Build for production
npm run build

# Start production server
npm start

# Test at http://localhost:3000
```

---

## 🐛 Troubleshooting

### Build Fails on Vercel

**TypeScript Errors:**
```bash
# Run locally to see errors
npm run build

# Fix type errors in your code
# Or temporarily disable strict checking in next.config.ts (not recommended):
# typescript: { ignoreBuildErrors: true }
```

**ESLint Errors:**
```bash
# Run linting locally
npm run lint

# Fix linting errors
# Or disable during build in next.config.ts (not recommended):
# eslint: { ignoreDuringBuilds: true }
```

**Missing Dependencies:**
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### API Requests Fail

**CORS Issues:**
- Ensure your backend allows requests from your Vercel domain
- Add Vercel domain to backend CORS allowed origins:
  ```python
  # In backend/main.py
  app.add_middleware(
      CORSMiddleware,
      allow_origins=[
          "https://your-app.vercel.app",
          "http://localhost:3000"
      ],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

**Backend Not Accessible:**
- Check `NEXT_PUBLIC_API_URL` environment variable is set in Vercel
- Verify backend is deployed and accessible
- Test backend health endpoint: `https://your-backend-api.com/health`

**Mixed Content Errors:**
- Ensure backend uses HTTPS in production (not HTTP)
- Vercel serves over HTTPS, backend must too

### Environment Variables Not Working

- Environment variables starting with `NEXT_PUBLIC_` are exposed to the browser
- Rebuild and redeploy after changing environment variables in Vercel
- Check Vercel deployment logs to see if variables are loaded

---

## 📊 Performance Optimization

### Enable Vercel Analytics (Optional)

```bash
# Install Vercel Analytics
npm install @vercel/analytics

# In app/layout.tsx, add:
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Enable Vercel Speed Insights (Optional)

```bash
npm install @vercel/speed-insights

# In app/layout.tsx:
import { SpeedInsights } from '@vercel/speed-insights/next';

// Add <SpeedInsights /> to your layout
```

---

## 🔐 Security Best Practices

✅ **Already Implemented:**
- Security headers in `vercel.json`
- Environment variables for sensitive config
- No hardcoded API endpoints

**Additional Recommendations:**
1. Enable Vercel's DDoS protection
2. Set up custom domain with SSL
3. Enable Vercel's Web Application Firewall (WAF) if available
4. Regularly update dependencies: `npm audit fix`

---

## 🌍 Custom Domain Setup

1. **Add Domain in Vercel:**
   - Go to Project Settings → Domains
   - Add your custom domain (e.g., `dashboard.clickwise.com`)

2. **Configure DNS:**
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or add A record pointing to Vercel's IP

3. **SSL Certificate:**
   - Automatically provisioned by Vercel
   - Usually takes 24-48 hours to activate

---

## 📈 Monitoring & Logs

### View Deployment Logs:
- Vercel Dashboard → Deployments → Select deployment → View logs

### Runtime Logs:
- Vercel Dashboard → Project → Logs tab
- Shows real-time application logs

### Analytics:
- Vercel Dashboard → Analytics
- View traffic, performance, and Web Vitals

---

## 🔄 CI/CD Pipeline

**Automatic Deployments:**
- Push to `main` branch → Deploys to production
- Push to other branches → Creates preview deployment
- Pull requests → Generates preview URL

**Manual Deployments:**
```bash
# Deploy current branch to production
vercel --prod

# Deploy with specific environment
vercel --prod --env NEXT_PUBLIC_API_URL=https://api.example.com/api/v1
```

---

## 📝 Backend Deployment Notes

The frontend requires a backend API. Here are recommended deployment options:

### Railway.app (Easiest for FastAPI)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Navigate to backend folder
cd ../backend

# Login and deploy
railway login
railway init
railway up
```

### Render.com (Free Tier Available)
1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables (GEMINI_API_KEY, etc.)

### DigitalOcean App Platform
1. Create new app from GitHub
2. Select `backend` folder
3. Configure build and run commands
4. Add environment variables
5. Deploy

---

## ✅ Post-Deployment Checklist

After deploying:

- [ ] Test homepage loads correctly
- [ ] Test all navigation links work
- [ ] Test dashboard pages load data
- [ ] Test API integration (backend connectivity)
- [ ] Check browser console for errors
- [ ] Test on mobile devices
- [ ] Verify analytics are tracking (if enabled)
- [ ] Check performance scores (Lighthouse)
- [ ] Test with Chrome extension (if applicable)
- [ ] Set up monitoring/alerts

---

## 🆘 Getting Help

**Vercel Documentation:**
- [Next.js on Vercel](https://vercel.com/docs/frameworks/nextjs)
- [Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Custom Domains](https://vercel.com/docs/projects/domains)

**ClickWise Issues:**
- Check backend is running: `curl https://your-api.com/health`
- Review Vercel deployment logs
- Check browser console for errors
- Verify environment variables are set

---

## 📚 Additional Resources

- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Edge Network](https://vercel.com/docs/edge-network/overview)

---

**Last Updated:** 2026-08-17  
**Maintained by:** ClickWise Team
