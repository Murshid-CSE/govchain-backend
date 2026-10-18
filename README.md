# GovChain Backend — Civic Transparency Platform

[![GovChain CI](https://github.com/Murshid-CSE/govchain-backend/actions/workflows/ci.yml/badge.svg)](https://github.com/Murshid-CSE/govchain-backend/actions)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)
[![Node.js Version](https://img.shields.io/badge/Node.js-v20%2B-green.svg)](https://nodejs.org)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL%2016-blue.svg)](https://www.postgresql.org)

**GovChain** is an open, verifiable backend API for a civic transparency and public-issue management platform. It allows residents to report civic problems, track departmental action timelines, monitor government procurement tenders, audit municipal budgets, participate in community polls, and verify the integrity of the public ledger via a cryptographic SHA-256 hash chain.

> [!NOTE]
> **Independent Civic Platform**: GovChain is an independent civic transparency and public tracking portal. It does not represent an official government service unless an authorized municipal partnership or department integration is explicitly configured.

---

## Architecture & Technology Stack

- **Frontend Client (`client/`)**:
  - React 19 SPA with TypeScript & Vite
  - Tailwind CSS v4 styling & Lucide icons
  - Interactive Leaflet mapping with OpenStreetMap tiles
  - Bilingual localization (English & Tamil / தமிழ்)
  - Role-aware dashboards (Citizen vs. Official task queues)
- **Backend Runtime & Web Framework**: Node.js LTS with Express 5
- **Database & Data Modeling**: PostgreSQL with Prisma ORM
- **Authentication & Security**:
  - `bcryptjs` for salted password hashing (10 rounds)
  - `jsonwebtoken` (HS256) for stateless authentication
  - Role-Based Access Control (RBAC): `citizen`, `official`, `moderator`, `admin`
  - `helmet` for HTTP security headers
  - `express-rate-limit` with tiered quotas (General, Auth, Uploads)
  - `zod` for request schema validation
- **Audit Logging**: Cryptographic SHA-256 hash chain verifying chronological ledger integrity
- **Civic Chat Intake**: Natural language classification, explainable priority recommendations, and duplicate detection with fallback
- **File Uploads**: `multer` with strict MIME filtering, size bounding, and UUID storage sanitization

---

## Core Modules & API Routes (`/api/v1`)

| Module | Route Prefix | Primary Operations |
| :--- | :--- | :--- |
| **System** | `/` & `/api/v1/health` | Service metadata, liveness check, database readiness probe (`/ready`) |
| **Auth** | `/api/v1/auth` | Self-registration, login, profile management, admin official onboarding |
| **Issues** | `/api/v1/issues` | Public reporting, geographic coords, comments, community upvoting, status tracking |
| **Chat Intake** | `/api/v1/chat` | AI-assisted draft report synthesis, category classification, duplicate check |
| **Departments** | `/api/v1/departments` | Public department directory, jurisdictions, workloads, and staff listings |
| **Tasks** | `/api/v1/tasks` | Actionable work orders with public audit timelines and SLA deadline tracking |
| **Tenders** | `/api/v1/tenders` | Open procurement notices, contractor bidding, and mandatory award justification |
| **Budgets** | `/api/v1/budgets` | Public allocations vs itemized real-world expenditures with utilization rates |
| **Grievances** | `/api/v1/grievances` | Formal citizen grievance filing with priority-driven SLA timers and responses |
| **Polls** | `/api/v1/polls` | Community sentiment pulse polls with single-vote deduplication per user |
| **Audit** | `/api/v1/audit` | SHA-256 cryptographic hash-chain ledger verification (`/verify`) |
| **Moderation** | `/api/v1/moderation` | Moderator review queue, approval/rejection, and duplicate report merging |
| **Uploads** | `/api/v1/uploads` | Authenticated evidence attachment uploads and safe file serving |

---

## Quick Start (Local Development)

### 1. Prerequisites
- Node.js (v20 or higher recommended; v24 supported)
- npm (v10 or higher)
- PostgreSQL (local instance or Docker Compose)

### 2. Installation
```bash
git clone https://github.com/Murshid-CSE/govchain-backend.git
cd govchain-backend
npm install
```

### 3. Environment Setup
Copy the template configuration file:
```bash
cp .env.example .env
```
Edit `.env` with your database credentials and secret key:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://govchain_user:govchain_dev_password@localhost:5432/govchain_dev?schema=public"
JWT_SECRET="your_secure_random_key_at_least_32_characters_long"
CORS_ORIGIN="http://localhost:5173"
```

### 4. Start Local PostgreSQL Database
Using Docker Compose:
```bash
docker compose up -d
```

### 5. Generate Database Client & Seed Demo Data
```bash
npx prisma db push
npm run seed
```

Default seeded accounts for local exploration:
| Role | Email | Password | Access |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@govchain.local` | `GovChain@2026` | Full system access, staff provisioning |
| **Official** | `official@govchain.local` | `GovChain@2026` | Task management, budget & tender logging |
| **Moderator** | `moderator@govchain.local` | `GovChain@2026` | Content review queue, duplicate linking |
| **Citizen** | `citizen@govchain.local` | `GovChain@2026` | Issue reporting, tracking, voting, comments |

### 6. Start the Applications

#### Backend API
Development mode with automatic reload:
```bash
npm run dev
```
Runs at `http://localhost:5000` (`/api/v1`).

#### Frontend Web Portal
In a separate terminal:
```bash
npm run client:dev
```
Or from within the `client/` directory:
```bash
cd client
npm run dev
```
Launches at `http://localhost:5173` with Vite HMR and automatic API proxying.

To build the frontend for production:
```bash
npm run build
```

---

## Running the Automated Test Suites

GovChain uses Node.js's native test runner (`node --test`) for fast, zero-dependency testing:

```bash
# Run backend tests
npm test

# Run full end-to-end suite (backend + frontend integration)
npm run test:all
```

Test coverage includes:
- **API Integration Suite**: Root info, liveness/readiness probes, hash verification endpoint, chat intake endpoint, validation error checks, 404 envelope tests
- **AI Civic Chat Intake Suite**: Natural language classification, explainable priority heuristics, safety risk classification
- **Cryptographic Hash Chain Suite**: SHA-256 calculation, chronological chain linkage, anti-tamper modification detection
- **Tracking Reference Suite**: Sequential formatted tracking tokens (`ISS-2026-XXXXX`, `GRV-2026-XXXXX`)
- **Database Integration Suite**: Live PostgreSQL operations across issues, tasks, tenders, budgets, and polls
- **Frontend Contract & Unit Suites**: Form validation, Indian rupee paise conversion, bilingual dictionaries, and live API e2e integration

---

## Production Deployment (100% Free Stack)

Detailed step-by-step production setup is documented in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

- **Hosting**: Render.com Web Service (Free Tier)
- **Database**: Neon.tech Serverless PostgreSQL (0.5 GB Free Tier)
- **CI Pipeline**: GitHub Actions (`.github/workflows/ci.yml`)

---

## Documentation

- [System Architecture](docs/ARCHITECTURE.md)
- [Security & Access Control](docs/SECURITY.md)
- [Privacy & Content Moderation Policy](docs/PRIVACY_AND_MODERATION.md)
- [Deployment & Operations Guide](docs/DEPLOYMENT.md)

---

## License

ISC License. Open for public civic benefit.
