# GovChain Architecture Documentation

## 1. High-Level System Architecture

GovChain is an open, verifiable civic transparency platform designed to hold local governance accountable by making every public grievance, municipal task, procurement tender, and budget rupee publicly trackable.

```
┌────────────────────────────────────────────────────────┐
│               Client Applications                      │
│    (Mobile Web, Desktop Browser, Progressive Web App) │
└───────────────────────────┬────────────────────────────┘
                            │ REST JSON API (HTTP / HTTPS)
┌───────────────────────────▼────────────────────────────┐
│                  GovChain API Gateway                  │
│  - Helmet Security Headers                             │
│  - Allowlisted CORS                                    │
│  - IP & Endpoint Rate Limiting                         │
│  - Centralized Error & Exception Handler               │
└───────────────────────────┬────────────────────────────┘
                            │
┌───────────────────────────▼────────────────────────────┐
│                    Modular Service Layer               │
│  ├── Auth & RBAC (Citizen, Official, Moderator, Admin) │
│  ├── Issues & Geographic Mapping                       │
│  ├── AI Civic Chat Intake & Triage Engine              │
│  ├── Department Tasks & SLA Workflows                  │
│  ├── Open Tenders & Contract Bidding Lifecycle         │
│  ├── Public Budget Allocation & Expenditure Tracking   │
│  ├── Community Initiative Sentiment Polls              │
│  ├── Content Moderation & Abuse Prevention             │
│  └── SHA-256 Tamper-Evident Hash Chain Audit Log       │
└───────────────────────────┬────────────────────────────┘
                            │ Prisma ORM
┌───────────────────────────▼────────────────────────────┐
│                   PostgreSQL Database                  │
│  - Relational Schema with Foreign Keys & Constraints   │
│  - Unique indexes for anti-duplicate voting/support    │
│  - Spatial/coordinate indexing for map filtering       │
└────────────────────────────────────────────────────────┘
```

## 2. Core Modules

| Module | Route Prefix | Responsibility |
| :--- | :--- | :--- |
| **Auth** | `/api/v1/auth` | Self-service citizen registration, JWT issuance, admin-controlled staff onboarding |
| **Issues** | `/api/v1/issues` | Public reporting, geolocation pins, upvoting/support, and status tracking |
| **Chat** | `/api/v1/chat` | AI-assisted structured reporting draft assistant with deterministic rule-based fallback |
| **Departments** | `/api/v1/departments` | Administrative jurisdictions, workloads, and staff directories |
| **Tasks** | `/api/v1/tasks` | Actionable department work items linked to issues with immutable timeline events |
| **Tenders** | `/api/v1/tenders` | Procurement bids, transparent criteria, and mandatory written award justification |
| **Budgets** | `/api/v1/budgets` | Departmental allocations vs itemized real-world expenditures with utilization % |
| **Grievances** | `/api/v1/grievances` | Formal citizen grievance filing with priority-driven SLA countdown timers |
| **Polls** | `/api/v1/polls` | Civic sentiment pulse checks with single-account vote deduplication |
| **Audit** | `/api/v1/audit` | SHA-256 cryptographic hash chain verifying chronological ledger integrity |
| **Moderation** | `/api/v1/moderation` | Safe review queue, duplicate merging, and escalation |
| **Uploads** | `/api/v1/uploads` | Safe multipart file storage with UUID hashing and strict MIME filtering |

## 3. Data Integrity & Cryptographic Audit Trail

Every state-altering event (issue creation, status transition, bid submission, tender award, budget expenditure) is appended to the `audit_events` ledger. Each event contains:
- `timestamp`: UTC timestamp
- `action`: Canonical event identifier
- `entityType` & `entityId`: Reference to target entity
- `prevHash`: The SHA-256 hash of the immediately preceding audit record
- `hash`: SHA-256 of canonical JSON payload `(timestamp + action + entityType + entityId + details + prevHash)`

Any retroactive tampering with an audit record breaks the chain linkage for all subsequent records, immediately detectable via `GET /api/v1/audit/verify`.
