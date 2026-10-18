# GovChain Frontend — Civic Transparency & Issue Management Web App

GovChain's frontend is a responsive, accessible, production-grade Single-Page Application (SPA) designed for both citizens and municipal officials. Built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, and **Leaflet**, it connects directly to the GovChain REST API.

---

## Key Features

1. **Interactive Civic Map**:
   - Leaflet-based map with OpenStreetMap tiles and proper attribution.
   - Live pins for geo-located civic issues with severity-coded markers and popups.
   - Interactive pin-drop location picker with fallback to device GPS coordinates or manual address entry.

2. **Citizen Issue Reporting & Tracking**:
   - Multi-step reporting wizard with category selection, priority heuristics, location mapping, and photo attachment.
   - Public tracking reference lookup (`ISS-YYYY-XXXXX`, `GRV-YYYY-XXXXX`) without exposing submitter PII.
   - Upvoting / community support mechanism and chronological status update timeline.

3. **AI-Assisted Civic Intake Chat**:
   - Conversational intake calling `/api/v1/chat/intake` for natural-language issue diagnosis.
   - Automatic classification into 8 municipal departments with explainable priority scores.
   - Semantic duplicate report detection warnings and direct draft creation.

4. **Public Transparency Portal**:
   - **Cryptographic Audit Trail**: Live SHA-256 hash-chain verification (`/api/v1/audit/verify`) with integrity badges.
   - **Procurement Tenders**: Public bidding notices, submitted proposals, and mandatory award justification transparency.
   - **Departmental Budgets**: Real-time allocation vs. expenditure utilization progress bars formatted in Indian Rupees (`₹X,XX,XXX.XX` from integer paise).
   - **Civic Sentiment Polls**: Non-binding community pulse voting with client and server single-vote enforcement.

5. **Role-Aware Dashboard**:
   - **Citizen View**: Personal submitted issues, grievance history, and followed civic items.
   - **Official / Admin Workspace**: Actionable department task queue with role-authorized status transition controls (`assigned` → `in_progress` → `resolved`).

6. **Bilingual & Accessible UI**:
   - Native English and Tamil (`தமிழ்`) translations with persistence in `localStorage`.
   - WCAG 2.1 AA compliant color contrasts, semantic HTML, and `prefers-reduced-motion` animation overrides.
   - Responsive mobile-first design with drawer navigation and clean desktop split-view.

---

## Tech Stack

- **Framework**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`)
- **Mapping**: Leaflet + React-Leaflet
- **Icons**: Lucide React
- **HTTP Client**: Axios with request timeout (15s) and automatic Bearer JWT handling

---

## Getting Started

### 1. Prerequisites
- Node.js v20+ (Node.js v22/24 recommended)
- Running GovChain Backend API (default `http://localhost:5000`)

### 2. Installation
```bash
cd client
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default configuration:
```env
# Base API path (proxied by Vite to http://127.0.0.1:5000 during development)
VITE_API_BASE_URL=/api/v1
```

### 4. Running the Development Server
```bash
npm run dev
```
The application will launch at `http://localhost:5173`. Any requests to `/api/*` are automatically forwarded to `http://127.0.0.1:5000`.

### 5. Production Build & Typecheck
```bash
npm run build
```
This runs `tsc -b` for strict typechecking followed by `vite build` to generate optimized production assets in `client/dist/`.

### 6. Automated Testing
Run the client test suite (ESM tests for unit logic and API contract e2e):
```bash
npm test
```

---

## Architecture & Code Structure

```
client/
├── public/                 # Static assets
├── src/
│   ├── api/
│   │   └── client.ts       # Typed API client, error handler, multipart upload
│   ├── components/
│   │   ├── common/         # Badge, LoadingSpinner, ErrorBanner, EmptyState
│   │   ├── layout/         # Navbar, Footer (with OSM attribution & civic disclaimer)
│   │   └── map/            # CivicMap (Leaflet map & location picker)
│   ├── context/
│   │   └── AuthContext.tsx # JWT session state, user roles, login/logout
│   ├── i18n/
│   │   ├── LanguageContext.tsx # Language state provider (EN / TA)
│   │   └── translations.ts     # Bilingual dictionary
│   ├── pages/
│   │   ├── HomePage.tsx        # Hero, live stats, map preview, process
│   │   ├── IssuesPage.tsx      # Split map/list view with filter controls
│   │   ├── IssueDetailPage.tsx # Issue view, upvotes, official comments
│   │   ├── ReportIssuePage.tsx # Step-by-step reporting wizard
│   │   ├── AiChatPage.tsx      # Conversational AI triage & duplicate detector
│   │   ├── TrackIssuePage.tsx  # Tracking ID search & SLA timeline
│   │   ├── TransparencyPage.tsx# Audit hash verifier, tenders, budgets, polls
│   │   ├── DashboardPage.tsx   # Citizen reports vs. Official task queue
│   │   ├── LoginPage.tsx       # Authentication
│   │   └── RegisterPage.tsx    # Citizen registration
│   ├── types/
│   │   └── index.ts        # TypeScript contracts matching Prisma models
│   ├── App.tsx             # Root router & context providers
│   ├── index.css           # Tailwind v4 styles, Leaflet CSS, motion queries
│   └── main.tsx            # Application entrypoint
├── tests/
│   ├── unit.test.js        # Formatting, currency, and translation unit tests
│   └── e2e.test.js         # End-to-end integration tests against live backend
├── package.json
├── tsconfig.json
└── vite.config.ts          # Tailwind plugin & backend proxy setup
```

---

## Civic & Legal Notices
- **Map Tiles**: Map data &copy; [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
- **Civic Platform Notice**: GovChain is an independent civic transparency and public tracking portal. Community polls represent non-binding civic sentiment.
