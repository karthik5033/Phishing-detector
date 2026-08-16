# ✅ Vercel Deployment Checklist

Quick reference for deploying ClickWise dashboard to Vercel.

---

## Before Deployment

- [ ] **Code is pushed to GitHub**
  ```bash
  git add .
  git commit -m "Ready for Vercel deployment"
  git push origin main
  ```

- [ ] **Environment variables are ready**
  - [ ] Backend API URL is available
  - [ ] Backend allows CORS from Vercel domain

- [ ] **Local build works**
  ```bash
  npm run build
  npm start
  # Test at http://localhost:3000
  ```

- [ ] **No TypeScript errors**
  ```bash
  npm run type-check
  ```

- [ ] **No ESLint errors**
  ```bash
  npm run lint
  ```

---

## Vercel Setup

### 1. Import Project
- [ ] Go to [vercel.com/new](https://vercel.com/new)
- [ ] Click "Import Git Repository"
- [ ] Select your ClickWise repository
- [ ] **Set Root Directory:** `my-app`

### 2. Configure Build Settings
- [ ] **Framework Preset:** Next.js (auto-detected)
- [ ] **Build Command:** `npm run build` (default)
- [ ] **Output Directory:** `.next` (default)
- [ ] **Install Command:** `npm install` (default)

### 3. Environment Variables
Add in Vercel dashboard:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend-api.com/api/v1` | Production, Preview, Development |

**Example:**
```
NEXT_PUBLIC_API_URL=https://clickwise-api.railway.app/api/v1
```

### 4. Deploy
- [ ] Click "Deploy"
- [ ] Wait for build to complete (~2-3 minutes)
- [ ] Check deployment logs for errors

---

## Post-Deployment Testing

### Test Deployment
Visit your Vercel URL (e.g., `https://clickwise-dashboard.vercel.app`)

- [ ] **Homepage loads**
- [ ] **Navigation works**
- [ ] **Dashboard pages load**
- [ ] **API calls work** (check browser console)
- [ ] **No console errors**
- [ ] **Mobile responsive**

### Common Issues

**API calls fail (CORS error):**
```python
# Update backend/main.py CORS settings:
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-app.vercel.app",  # Add this
        "http://localhost:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Build fails:**
- Check Vercel deployment logs
- Run `npm run build` locally to see errors
- Fix TypeScript/ESLint errors

**Environment variable not working:**
- Rebuild and redeploy after adding variables
- Ensure variable name starts with `NEXT_PUBLIC_`
- Check Vercel logs to see if variable is loaded

---

## Backend Deployment

Your frontend needs a backend. Quick options:

### Railway.app (Recommended)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Navigate to backend
cd ../backend

# Deploy
railway login
railway init
railway up

# Get deployment URL
railway domain
# Use this URL for NEXT_PUBLIC_API_URL
```

### Render.com (Free Tier)
1. Go to render.com
2. Create new "Web Service"
3. Connect GitHub repo
4. Select `backend` folder
5. Set:
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables (GEMINI_API_KEY, etc.)
7. Deploy and get URL

---

## Production Optimizations

### Enable Analytics (Optional)
```bash
npm install @vercel/analytics
```

Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

<Analytics />
```

### Custom Domain
1. Vercel Dashboard → Domains
2. Add your domain
3. Update DNS records
4. Wait for SSL certificate (~24h)

### Performance Budget
- Lighthouse score > 90
- First Contentful Paint < 1.8s
- Time to Interactive < 3.9s

---

## Rollback Plan

If deployment breaks:

1. **Instant Rollback:**
   - Vercel Dashboard → Deployments
   - Click "..." on last working deployment
   - Select "Promote to Production"

2. **Redeploy from Git:**
   ```bash
   git revert HEAD
   git push origin main
   # Auto-deploys previous version
   ```

---

## Continuous Deployment

**Automatic:**
- Push to `main` → Deploys to production
- Push to other branches → Creates preview URL
- Pull requests → Generates preview deployment

**Manual:**
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
cd my-app
vercel --prod
```

---

## Monitoring

### View Logs
- Vercel Dashboard → Project → Logs

### Check Health
- Visit: `https://your-app.vercel.app/`
- Check: `https://your-backend-api.com/health`

### Analytics
- Vercel Dashboard → Analytics
- View traffic and performance metrics

---

## Quick Commands Reference

```bash
# Local testing
npm run build && npm start

# Deploy with Vercel CLI
vercel --prod

# Check deployment status
vercel inspect [deployment-url]

# View logs
vercel logs [deployment-url]

# Roll back
# (Use Vercel dashboard for instant rollback)
```

---

## Support

**Vercel Issues:**
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Support](https://vercel.com/support)

**ClickWise Issues:**
- Check backend health endpoint
- Review browser console errors
- Verify environment variables
- Check CORS configuration

---

**Last Updated:** 2026-08-17
