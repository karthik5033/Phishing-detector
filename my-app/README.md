# 🎨 ClickWise Dashboard - Next.js Frontend

Modern, responsive dashboard for the ClickWise phishing detection platform built with Next.js 16, React 19, and TailwindCSS 4.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- npm or yarn
- ClickWise backend running (see `../backend/README.md`)

### Installation

```bash
# Navigate to frontend directory
cd my-app

# Install dependencies
npm install

# Create environment file
cp .env.example .env.local

# Edit .env.local and set your backend URL
# NEXT_PUBLIC_API_URL=http://127.0.0.1:8002/api/v1

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📦 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **React:** 19.2.3
- **Styling:** TailwindCSS 4
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **TypeScript:** 5.x
- **Deployment:** Vercel-ready

---

## 🏗️ Project Structure

```
my-app/
├── app/                    # Next.js app router pages
│   ├── dashboard/          # Main dashboard pages
│   ├── features/           # Feature showcase pages
│   ├── analyze/            # URL analysis page
│   ├── architecture/       # System architecture docs
│   └── layout.tsx          # Root layout
├── components/             # Reusable React components
│   ├── ui/                 # UI primitives (buttons, cards, etc.)
│   └── ...                 # Feature components
├── lib/                    # Utility functions
│   ├── api.ts              # API client
│   ├── utils.ts            # Helper functions
│   └── constants.ts        # App constants
├── types/                  # TypeScript type definitions
├── public/                 # Static assets
├── next.config.ts          # Next.js configuration
└── vercel.json             # Vercel deployment config
```

---

## 🔧 Available Scripts

```bash
# Development
npm run dev              # Start dev server at localhost:3000

# Production
npm run build            # Create production build
npm start                # Start production server

# Code Quality
npm run lint             # Run ESLint
npm run type-check       # Run TypeScript type checking

# Maintenance
npm run clean            # Remove .next and node_modules
```

---

## 🌍 Environment Variables

Create `.env.local` file in the root directory:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://127.0.0.1:8002/api/v1
```

**Note:** Variables prefixed with `NEXT_PUBLIC_` are exposed to the browser.

---

## 📄 Key Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero section |
| `/dashboard` | Main dashboard with analytics |
| `/dashboard/activity` | Recent scan activity log |
| `/dashboard/controls` | Block/allow domain management |
| `/dashboard/privacy` | Privacy settings |
| `/analyze` | Manual URL analysis tool |
| `/features/*` | Feature showcase pages |
| `/docs` | Documentation |
| `/architecture` | System architecture diagram |

---

## 🚢 Deployment

### Deploy to Vercel

**Quick Deploy:**
1. Push code to GitHub
2. Import project to Vercel
3. Set `NEXT_PUBLIC_API_URL` environment variable in Vercel dashboard
4. Deploy!

**See full deployment guide:** [DEPLOYMENT.md](./DEPLOYMENT.md)

---

## 🔌 API Integration

The dashboard communicates with the ClickWise backend API.

### API Client (`lib/api.ts`)
```typescript
import { analyzeMessage } from '@/lib/api';

// Analyze a message/URL
const result = await analyzeMessage({
  text: "https://example.com",
  context: "URL analysis"
});
```

### Backend Endpoints Used
- `POST /api/v1/detect` - URL/message analysis
- `GET /api/v1/dashboard` - Dashboard stats
- `GET /api/v1/activity` - Activity log
- `GET /api/v1/blocklist` - Blocked domains
- `POST /api/v1/block` - Block domain
- `POST /api/v1/unblock` - Unblock domain

---

## 🐛 Troubleshooting

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

### API Connection Issues
1. Check backend is running: `http://127.0.0.1:8002/health`
2. Verify `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check browser console for CORS errors

---

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [Vercel Deployment](https://vercel.com/docs)
- [Full Deployment Guide](./DEPLOYMENT.md)

---

**Maintained by:** ClickWise Team  
**Last Updated:** 2026-08-17
