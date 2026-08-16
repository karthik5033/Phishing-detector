# 📊 Dashboard Documentation

SecureSentinel Dashboard is a Next.js web application for monitoring browsing activity and managing security.

---

## 📁 File Structure

```
my-app/
├── app/
│   ├── dashboard/
│   │   ├── page.tsx         # Overview/KPIs
│   │   └── activity/
│   │       └── page.tsx     # Activity log
│   ├── page.tsx             # Landing page
│   └── layout.tsx           # Root layout
├── components/
│   └── landing/             # Landing page components
├── lib/
│   └── constants.ts         # API URL config
└── README.md               # This file
```

---

## 🚀 Getting Started

### Installation
```bash
cd my-app
npm install
```

### Development
```bash
npm run dev
```
Open: `http://localhost:3000`

### Production Build
```bash
npm run build
npm start
```

---

## 📊 Dashboard Pages

### 1. Overview (`/dashboard`)
Shows key metrics:
- **Total Scans**: URLs analyzed
- **Threats Blocked**: High-risk sites
- **Critical Blocked**: Red-flagged sites
- **Safety Score**: 0-100 rating

**Features**:
- Real-time polling (5 seconds)
- Activity trend chart (7 days)
- Recent interventions list

---

### 2. Activity Insights (`/dashboard/activity`)
Detailed browsing history:
- Domain visited
- Timestamp
- Risk score & level
- Status (Blocked/Warned/Safe)
- Category (Phishing/Social Eng/etc)

**Features**:
- Search & filter
- Manual block/unblock
- Auto-refresh every 5 seconds
- Pagination (20 items/page)

---

## 🔌 API Integration

### Configuration
Located in `lib/constants.ts`:
```typescript
export const API_BASE_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  "http://127.0.0.1:8002/api/v1";
```

### Endpoints Used

#### Dashboard Stats
```typescript
fetch(`${API_BASE_URL}/dashboard`)
```
Returns: KPIs, trends, recent activity

#### Activity Log
```typescript
fetch(`${API_BASE_URL}/activity?limit=20`)
```
Returns: Paginated scan results

#### Block Domain
```typescript
fetch(`${API_BASE_URL}/block`, {
  method: "POST",
  body: JSON.stringify({ domain: "example.com" })
})
```

#### Unblock Domain
```typescript
fetch(`${API_BASE_URL}/unblock`, {
  method: "POST",
  body: JSON.stringify({ domain: "example.com" })
})
```

---

## 🎨 UI Components

### Overview Cards
Show KPIs with icons and animations.

### Activity Table
- Sortable columns
- Risk score badges
- Block/unblock buttons
- Category tags

### Charts
- Activity trend (7-day line chart)
- Risk distribution

---

## 🔧 Configuration

### Environment Variables
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://127.0.0.1:8002/api/v1
```

### Polling Interval
Edit `app/dashboard/activity/page.tsx`:
```typescript
const interval = setInterval(fetchActivity, 5000); // 5 seconds
```

---

## 🐛 Troubleshooting

**Dashboard shows "LOADING..."?**
1. Check backend: `http://127.0.0.1:8002/docs`
2. Check browser console (F12)
3. Verify API_BASE_URL in constants.ts

**Block/Unblock not working?**
1. Check API response in Network tab
2. Reload Chrome extension after blocking
3. Verify backend database path

**Slow loading?**
1. Backend might be processing large dataset
2. Check backend optimization (limit=20)
3. Clear browser cache

---

## 📈 Performance Optimizations

### Frontend
- Polling instead of websockets (simpler)
- Limited fetch (20 items)
- Client-side caching
- Debounced search

### Backend Integration
- Optimized SQL queries
- Indexed timestamps
- Set-based lookups (O(1))
- Reduced aggregations

---

## 🎯 Features

### Current
✅ Real-time activity monitoring
✅ Manual block/unblock
✅ Search & filter
✅ Risk categorization
✅ Trend visualization

### Planned
- Export data (CSV/JSON)
- Custom date ranges
- Advanced filtering
- Email alerts
- Multi-user support

---

## 🔐 Security

- All data stored locally
- No external API calls
- CORS configured for localhost
- No sensitive data logging

---

**See**: [Main README](../README.md) for complete documentation
