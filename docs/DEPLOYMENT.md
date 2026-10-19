# GovChain Deployment & Operations Guide

## 1. Architecture & Hosting Strategy

GovChain separates the backend REST API, PostgreSQL database, and frontend Single-Page Application (SPA):

```
┌──────────────────────────────────────┐       ┌──────────────────────────────────────┐
│  Frontend SPA (Vercel / Render Static)│       │  Backend API (Render / Railway / VPS)│
│                                      │       │                                      │
│  - React 19 + Vite Production Bundle │──────▶│  - Node.js LTS Runtime with Express 5│
│  - Global CDN Distribution           │       │  - Zero-Trust Server-Side RBAC       │
│  - Client-Side Route Rewrites        │       │  - Cryptographic SHA-256 Hash Chain  │
└──────────────────────────────────────┘       └──────────────────┬───────────────────┘
                                                                  │ TLS Pooled Connection
                                               ┌──────────────────▼───────────────────┐
                                               │   Managed Database (Neon / Supabase)  │
                                               │                                      │
                                               │  - PostgreSQL 15+ Engine             │
                                               │  - Durable Point-in-Time Backups     │
                                               │  - Connection Pooling (pgBouncer)    │
                                               └──────────────────────────────────────┘
```

---

## 2. Hosting Provider Plan Limitations & Tradeoffs

> [!WARNING]
> **Free-Tier Operational Tradeoffs (Staging/Demo vs. Production)**:
> - **Render Free Web Service**: Spins down after 15 minutes of inactivity; initial cold start takes 50–90 seconds. Suitable for staging and demos, but causes unacceptable delays for real-world municipal emergency reporting.
> - **Render Free PostgreSQL**: Strictly expires and deletes after **30 days**. Never use Render free PostgreSQL for citizen data.
> - **Neon.tech Serverless Postgres**: Free tier offers 0.5 GB storage and scale-to-zero compute. Well-suited for development/staging; for production, enable persistent compute to prevent connection cold starts.
> - **Vercel Hobby**: Intended for personal, non-commercial use. Civic portals operated by municipalities require standard commercial eligibility.

---

## 3. Environment Variables Specification

Never commit real values to version control. Set these variables strictly within your hosting provider's secrets panel:

### Backend Service Environment Variables
| Variable Name | Required | Default / Format | Purpose |
| :--- | :---: | :--- | :--- |
| `NODE_ENV` | **Yes** | `production` | Enables production optimizations, secure cookies, and disables stack traces |
| `PORT` | **Yes** | `5000` (or host assigned, e.g. `10000`) | Listening HTTP port |
| `DATABASE_URL` | **Yes** | `postgresql://user:pass@host:5432/db?sslmode=require` | Pooled connection string to managed PostgreSQL |
| `JWT_SECRET` | **Yes** | Minimum 32 characters (64-char hex recommended) | Secret key for signing citizen and staff authentication tokens |
| `JWT_EXPIRES_IN` | No | `24h` | Token validity duration |
| `CORS_ORIGIN` | **Yes** | `https://your-frontend-domain.com` | Strictly allowlisted frontend origin for cross-origin requests |

### Frontend Web Portal Environment Variables
| Variable Name | Required | Default / Format | Purpose |
| :--- | :---: | :--- | :--- |
| `VITE_API_BASE_URL` | **Yes** | `https://your-api-domain.com/api/v1` | Public API endpoint (configured at build time) |
| `VITE_APP_NAME` | No | `GovChain` | Application title |
| `VITE_MAP_DEFAULT_LAT` | No | `13.0827` | Map initial latitude (default Chennai) |
| `VITE_MAP_DEFAULT_LNG` | No | `80.2707` | Map initial longitude (default Chennai) |
| `VITE_MAP_DEFAULT_ZOOM` | No | `12` | Map initial zoom level |

---

## 4. Controlled Production Release Procedure

### Step 1: Provision Durable Database (Neon Staging)
1. Provision a PostgreSQL instance with TLS enabled on [Neon.tech](https://neon.tech) (offers 1 GB free storage per project as of October 2026).
2. Note both connection strings provided by Neon:
   - **Direct Connection URL** (port 5432, without `-pooler`): Used strictly for running Prisma schema migrations.
   - **Pooled Connection URL** (with `-pooler`): Used for backend application runtime on Render/Railway.

### Step 2: Apply Migrations (Controlled Release Step)
Run the migration deploy command targeting the staging database. Do **not** use `prisma db push` or `prisma migrate dev` against staging or production:

**Using the Guarded PowerShell Helper (Recommended)**:
```powershell
.\migrate-staging.ps1
```
This script prompts for the direct Neon staging connection URL with masked input (no echoing), verifies TLS and non-pooled endpoint configuration, requires explicit confirmation, and executes `npx prisma migrate deploy` followed by optional synthetic baseline seeding.

**Manual Command**:
```bash
DATABASE_URL="postgresql://user:pass@ep-xyz.us-east-2.aws.neon.tech/govchain-staging?sslmode=require" npx prisma migrate deploy
```

### Step 3: Deploy Backend Service
1. Connect the GitHub repository to your backend host (e.g., Render, Railway, or VPS).
2. Set Build Command: `npm install && npx prisma generate`
3. Set Start Command: `node server.js`
4. Set the Backend Environment Variables in the provider secrets dashboard.

### Step 4: Deploy Frontend SPA
1. Connect the repository to your frontend host (e.g., Vercel, Cloudflare Pages, or Render Static).
2. Root directory: `client`
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Configure `VITE_API_BASE_URL` to point to the live backend URL from Step 3.

---

## 5. Post-Deployment Smoke Test Protocol

After deployment, verify the live deployment by executing these checks against the live domains:

1. **Liveness Probe**:
   ```bash
   curl -s -f https://your-api.com/api/v1/health
   ```
2. **Database Readiness Probe**:
   ```bash
   curl -s -f https://your-api.com/api/v1/health/ready
   ```
3. **Cryptographic Audit Verification**:
   ```bash
   curl -s -f https://your-api.com/api/v1/audit/verify
   ```
4. **Public Browser Smoke Test**:
   - Visit the frontend URL in a browser.
   - Verify landing page statistics load.
   - Verify Leaflet map renders with OpenStreetMap tiles.
   - Verify navigation to `/transparency`, `/issues`, and `/chat`.
