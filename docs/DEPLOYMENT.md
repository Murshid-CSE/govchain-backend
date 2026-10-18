# GovChain Deployment & Operations Guide

## 1. Free-Tier Production Deployment Architecture

```
┌─────────────────────────────────┐      ┌───────────────────────────────────┐
│       Render.com (Free Web)     │      │         Neon.tech (Free Postgres)  │
│                                 │      │                                   │
│  - Node.js LTS Runtime          │─────▶│  - Managed PostgreSQL 16          │
│  - Automatic Deploy on Push     │      │  - 0.5 GB Free Storage            │
│  - Free Managed TLS / SSL       │      │  - Built-in Connection Pooling    │
│  - Zero Configuration CDN       │      │  - Branching Support              │
└─────────────────────────────────┘      └───────────────────────────────────┘
```

## 2. Step-by-Step Deployment Instructions

### Step 1: Provision Free Database (Neon.tech / Supabase)
1. Sign up at [neon.tech](https://neon.tech) (free tier).
2. Create a project named `govchain-prod`.
3. Copy the PostgreSQL connection string:
   ```
   postgresql://user:password@ep-sample-pooler.region.neon.tech/govchain_prod?sslmode=require
   ```

### Step 2: Deploy Backend to Render.com
1. Sign up at [render.com](https://render.com).
2. Create a **New Web Service** connected to your GitHub repository `Murshid-CSE/govchain-backend`.
3. Set the following build and start commands:
   - **Build Command**: `npm install && npx prisma generate`
   - **Start Command**: `node server.js`
4. Configure Environment Variables in Render Dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `DATABASE_URL`: *(Your Neon.tech connection string)*
   - `JWT_SECRET`: *(A secure 64-character random string)*
   - `JWT_EXPIRES_IN`: `24h`
   - `CORS_ORIGIN`: `https://your-frontend-domain.vercel.app`

### Step 3: Run Database Migrations & Initial Seed
From your local terminal with production `DATABASE_URL` configured or via Render Shell:
```bash
npx prisma db push
node prisma/seed.js
```

### Step 4: Verify Deployment
Run health check:
```bash
curl https://your-govchain-api.onrender.com/api/v1/health
curl https://your-govchain-api.onrender.com/api/v1/health/ready
```
