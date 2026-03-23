# Nugens Platform

Monorepo for the Nugens career ecosystem.

## Apps
| App | URL | Status |
|-----|-----|--------|
| gene-app | gene.nugens.in.net | ✅ Active |
| hyperx-app | hyperx.nugens.in.net | 🔜 Next |
| digihub-app | digihub.nugens.in.net | 🔜 Planned |
| units-app | units.nugens.in.net | 🔜 Planned |
| nugens-web | nugens.in.net | 🔜 Planned |

---

## Setup (one-time)

### 1. Supabase
1. Go to supabase.com → your project → SQL Editor
2. Paste contents of `database/schema.sql` → Run
3. Go to Settings → API → copy URL and anon key

### 2. Environment variables

**Gene app** (`apps/gene/.env.local`):
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GEN_E_API_URL=https://gene-backend-al5h.onrender.com
```

**Backend** (`backend/.env`):
```
OPENAI_API_KEY=sk-...
GROQ_API_KEY=gsk_...
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...
RAZORPAY_KEY_ID=rzp_...
RAZORPAY_KEY_SECRET=...
ADZUNA_APP_ID=...
ADZUNA_API_KEY=...
RESEND_API_KEY=re_...
CRON_SECRET=any-random-string
```

### 3. Local dev
```bash
# Gene app (http://localhost:3001)
cd apps/gene
npm install
npm run dev

# Backend (http://localhost:5000)
cd backend
npm install
npm run dev
```

### 4. Deploy

**Frontend → Cloudflare Pages**
- Connect GitHub repo
- App: `apps/gene`
- Build command: `npm run build`
- Build output: `dist`
- Add env vars (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_GEN_E_API_URL)
- Custom domain: `gene.nugens.in.net`

**Backend → Render**
- Connect GitHub repo
- Root directory: `backend`
- Start command: `node server.js`
- Add all env vars from backend/.env.example

---

## Adding a new app (HyperX, DigiHub, etc.)
1. Copy `apps/gene` → `apps/hyperx`
2. Update `apps/hyperx/package.json` name
3. Add new Cloudflare Pages project pointing to `apps/hyperx`
4. Set custom domain `hyperx.nugens.in.net`
