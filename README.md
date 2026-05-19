# BeWell AssetIQ — Healthcare Asset Management Platform

<div align="center">

[![License: MIT](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)](https://typescriptlang.org)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-336791.svg)](https://postgresql.org)

**NABH-compliant, enterprise-grade medical asset intelligence platform for multi-branch hospital networks.**

[Features](#features) · [Architecture](#architecture) · [Installation](#installation) · [API Docs](#api-endpoints) · [Deployment](#deployment)

</div>

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Modules Overview](#modules-overview)
- [Installation](#installation)
- [Environment Setup](#environment-setup)
- [Database Setup](#database-setup)
- [Running the Application](#running-the-application)
- [Docker Setup](#docker-setup)
- [Folder Structure](#folder-structure)
- [API Endpoints](#api-endpoints)
- [User Roles & Permissions](#user-roles--permissions)
- [Authentication](#authentication)
- [Environment Variables](#environment-variables)
- [Testing](#testing)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

**BeWell AssetIQ** is a comprehensive, NABH-compliant hospital asset management platform designed for multi-branch healthcare networks. It provides complete lifecycle management of medical equipment, preventive maintenance scheduling, fault reporting, compliance tracking, and real-time operational intelligence.

The platform enables healthcare administrators, biomedical engineers, and technicians to track every piece of medical equipment from procurement through condemnation — with a full audit trail, QR-based scanning, automated PPM alerts, and regulatory compliance dashboards.

### Business Objectives

1. Eliminate asset downtime through proactive maintenance scheduling (PPM)
2. Maintain NABH/AERB/CPCB regulatory compliance with automated document tracking
3. Provide real-time visibility into asset status across all hospital branches
4. Reduce manual audit effort through automated audit trails and digital job cards
5. Enable data-driven decisions through comprehensive reporting and analytics

---

## Features

### Core Asset Management
- 📋 Complete asset lifecycle tracking (procurement → condemnation)
- 🏷️ QR code & barcode generation per asset (QR, Code128, EAN13)
- 📸 Asset photo management via Cloudflare R2
- 📊 Depreciation calculations (SLM & WDV methods)
- 🔍 Advanced search, filter, and export

### Maintenance & Operations
- 🔧 PPM (Preventive Preventive Maintenance) scheduling with automated BullMQ alerts
- 📋 Digital job cards with technician assignment and approval workflow
- 🚨 Fault reporting with severity classification (Low/Medium/High/Critical)
- 📅 AMC (Annual Maintenance Contract) tracking per vendor/asset
- ⏱️ SLA tracking with escalation queues

### Compliance & Audit
- 📄 Compliance document management (NABH, AERB, Fire NOC, Calibration, Electrical)
- ⚠️ Automated expiry alerts (30-day and 60-day pre-warnings)
- 📝 NABH-compliant immutable audit trails (INSERT/UPDATE/DELETE)
- 🔍 Full diff view for all data mutations

### Intelligence & Reporting
- 📈 Executive dashboard with real-time KPI widgets
- 📊 Asset utilization, downtime, and cost analytics
- 📤 PDF and CSV export for all reports
- 🔴 Live fault stream via Socket.io
- 🗺️ Location-wise asset distribution maps

### Public Access
- 📱 QR scan page (no login required) — asset info, fault reporting
- 🚨 Anonymous fault reporting via scanned asset tag
- 📍 GPS location capture on scan events

---

## Tech Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 5.x | Build tool & dev server |
| Tailwind CSS | 3.x | Utility-first styling |
| React Router DOM | 6 | Client-side routing |
| TanStack Query | 5 | Server state management |
| Axios | 1.x | HTTP client |
| React Hook Form | 7 | Form management |
| Zod | 3 | Schema validation |
| React Hot Toast | 2 | Notifications |
| Lucide React | latest | Icon library |
| CASL | 6 | Frontend RBAC |
| Socket.io Client | 4 | Real-time updates |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 20+ | Runtime |
| Express | 4.x | HTTP framework |
| TypeScript | 5.x | Type safety |
| Drizzle ORM | 0.x | Database ORM |
| PostgreSQL | 15 | Primary database |
| Redis | 7 | Caching & BullMQ |
| BullMQ | 5 | Background job queues |
| Socket.io | 4 | Real-time events |
| JWT | jsonwebtoken | Authentication tokens |
| Bcrypt | 5 | Password hashing |
| Helmet | 7 | Security headers |
| express-rate-limit | 7 | Rate limiting |
| AWS SDK (S3) | 3 | Cloudflare R2 storage |
| Zod | 3 | Request validation |
| Winston | 3 | Structured logging |
| Nodemailer | 6 | Email notifications |
| Twilio | 4 | SMS alerts |

### Infrastructure
| Technology | Purpose |
|---|---|
| Docker + Docker Compose | Containerization |
| Nginx | Reverse proxy & static serving |
| Cloudflare R2 | Asset file storage |
| Turborepo | Monorepo build orchestration |

---

## Modules Overview

| Module | Route | Description |
|---|---|---|
| Dashboard | `/dashboard` | KPI overview, live faults, stats |
| Assets | `/assets` | Complete asset registry |
| Maintenance | `/maintenance` | Job cards & PPM logs |
| Schedules | `/schedules` | PPM & calibration schedule grid |
| Faults | `/faults` | Fault reports with severity triage |
| QR Generator | `/qr-generator` | Batch QR/barcode generation |
| Scan Logs | `/scan-logs` | QR scan event history |
| Hospitals | `/hospitals` | Branch management |
| Users | `/users` | Team & access management |
| Vendors | `/vendors` | Vendor directory & performance |
| Compliance | `/compliance` | Regulatory document tracker |
| Inventory | `/inventory` | Spare parts stock management |
| Reports | `/reports` | Analytics & export center |
| Audit Logs | `/audit-logs` | Immutable change history |
| Public Scan | `/scan/:tag` | Anonymous QR scan page |
| Public Fault | `/fault/:tag` | Anonymous fault reporting |

---

## Installation

### Prerequisites

- Node.js ≥ 20.x
- PostgreSQL ≥ 15
- Redis ≥ 7
- npm ≥ 10

```bash
# Clone the repository
git clone https://github.com/guru14789/Pathivu.git
cd Pathivu

# Install all dependencies (root + all apps via Turborepo)
npm install
```

---

## Environment Setup

```bash
# Copy the environment template
cp .env.example .env

# Edit the file and fill in all required values
nano .env
```

See [Environment Variables](#environment-variables) for the full list.

---

## Database Setup

```bash
# Navigate to the API app
cd apps/api

# Run Drizzle migrations (creates all tables)
npx drizzle-kit push

# Seed the database with default admin user and sample data
npx tsx src/db/seed.ts
```

**Default Admin Credentials (after seed):**
- Email: `admin@bewell.com`
- Password: `password123`

> ⚠️ Change the default admin password immediately after first login in production.

---

## Running the Application

### Development

```bash
# From the root directory — starts both API (port 4000) and Web (port 5173) concurrently
npm run dev

# Or start individually:
cd apps/api && npm run dev    # API server on :4000
cd apps/web && npm run dev    # Vite dev server on :5173
```

### Production Build

```bash
# Build all apps
npm run build

# Start the API in production mode
cd apps/api && npm start
```

---

## Docker Setup

```bash
# Build and start all services (PostgreSQL, Redis, API, Worker, Nginx)
docker-compose up --build

# Run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down

# Reset volumes (WARNING: deletes all data)
docker-compose down -v
```

Services exposed:
- **Web App** → `http://localhost` (port 80 via Nginx)
- **API** → proxied via Nginx at `/api`
- **PostgreSQL** → `localhost:5432` (internal)
- **Redis** → `localhost:6379` (internal)

---

## Folder Structure

```
bewell/
├── apps/
│   ├── api/                         # Express backend
│   │   ├── src/
│   │   │   ├── db/
│   │   │   │   ├── schema/          # Drizzle ORM table definitions (17 tables)
│   │   │   │   ├── index.ts         # DB connection
│   │   │   │   ├── migrate.ts       # Migration runner
│   │   │   │   └── seed.ts          # Seed data
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts    # JWT validation
│   │   │   │   ├── rbac.middleware.ts   # CASL-based RBAC
│   │   │   │   ├── error.middleware.ts  # Global error handler
│   │   │   │   ├── logger.middleware.ts # Request logging
│   │   │   │   ├── upload.middleware.ts # Multer file uploads
│   │   │   │   └── validate.middleware.ts # Zod validation
│   │   │   ├── modules/             # Feature modules (Controller+Service+Routes)
│   │   │   │   ├── auth/
│   │   │   │   ├── assets/
│   │   │   │   ├── categories/
│   │   │   │   ├── hospitals/
│   │   │   │   ├── users/
│   │   │   │   ├── faults/
│   │   │   │   ├── maintenance/
│   │   │   │   ├── schedules/
│   │   │   │   ├── vendors/
│   │   │   │   ├── amc/
│   │   │   │   ├── compliance/
│   │   │   │   ├── inventory/
│   │   │   │   ├── qr/
│   │   │   │   ├── scan/
│   │   │   │   ├── locations/
│   │   │   │   ├── reports/
│   │   │   │   └── audit-logs/
│   │   │   ├── lib/
│   │   │   │   ├── ability.ts       # CASL ability definitions
│   │   │   │   ├── errors.ts        # Custom error classes
│   │   │   │   ├── logger.ts        # Winston logger
│   │   │   │   ├── r2.ts            # Cloudflare R2 client
│   │   │   │   ├── redis.ts         # Redis client
│   │   │   │   ├── sanitizer.ts     # Input sanitization
│   │   │   │   ├── socket.ts        # Socket.io server
│   │   │   │   └── workers/         # BullMQ workers & queues
│   │   │   ├── types/               # Shared TypeScript types
│   │   │   └── index.ts             # Server entry point
│   │   ├── drizzle/                 # Generated migration files
│   │   ├── drizzle.config.ts
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   └── web/                         # React frontend
│       ├── src/
│       │   ├── components/
│       │   │   ├── Layout.tsx       # App shell (sidebar + header)
│       │   │   ├── ProtectedRoute.tsx
│       │   │   └── RoleGate.tsx
│       │   ├── context/
│       │   │   └── AuthContext.tsx  # Global auth state
│       │   ├── hooks/
│       │   │   ├── useAssets.ts
│       │   │   └── useRealtimeFaults.ts
│       │   ├── lib/
│       │   │   ├── ability.ts       # Frontend CASL
│       │   │   ├── socket.ts        # Socket.io client
│       │   │   └── utils.ts
│       │   ├── pages/
│       │   │   ├── LoginPage.tsx
│       │   │   ├── ResetPasswordPage.tsx
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── admin/           # Admin-only pages
│       │   │   ├── assets/          # Asset management pages
│       │   │   ├── maintenance/     # Maintenance pages
│       │   │   ├── faults/          # Fault pages
│       │   │   └── public/          # No-auth public pages
│       │   ├── App.tsx              # Router definition
│       │   └── main.tsx             # Entry point
│       ├── tailwind.config.js
│       └── package.json
│
├── packages/                         # Shared packages (future)
├── infra/
│   └── nginx.conf                   # Nginx reverse proxy config
├── docker-compose.yml
├── turbo.json                       # Turborepo pipeline config
├── .env.example
└── README.md
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Login with email & password |
| POST | `/api/auth/refresh` | Cookie | Refresh access token |
| POST | `/api/auth/logout` | Auth | Invalidate refresh token |
| POST | `/api/auth/reset-password` | Public | Request password reset |

### Assets
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/assets` | Auth | List assets (paginated, filtered) |
| POST | `/api/assets` | Auth | Create new asset |
| GET | `/api/assets/:id` | Auth | Get asset detail |
| PUT | `/api/assets/:id` | Auth | Update asset |
| DELETE | `/api/assets/:id` | Admin | Delete asset |
| POST | `/api/assets/:id/photo` | Auth | Upload asset photo |

### Fault Reports
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/faults` | Auth | List fault reports |
| POST | `/api/faults` | Auth/Public | Create fault report |
| GET | `/api/faults/:id` | Auth | Get fault detail |
| PUT | `/api/faults/:id/status` | Auth | Update fault status |
| PUT | `/api/faults/:id/resolve` | Auth | Mark as resolved |

### Maintenance
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/maintenance` | Auth | List maintenance logs |
| POST | `/api/maintenance` | Auth | Create job card |
| GET | `/api/maintenance/:id` | Auth | Get job card detail |
| PUT | `/api/maintenance/:id` | Auth | Update job card |
| PUT | `/api/maintenance/:id/complete` | Auth | Mark job complete |

### Schedules
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/schedules` | Auth | List maintenance schedules |
| POST | `/api/schedules` | Auth | Create schedule |
| PUT | `/api/schedules/:id` | Auth | Update schedule |
| DELETE | `/api/schedules/:id` | Admin | Delete schedule |

### Users
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/users` | Admin | List users |
| POST | `/api/users` | Admin | Create user |
| PUT | `/api/users/:id` | Admin | Update user |
| PUT | `/api/users/:id/deactivate` | Admin | Deactivate user |

### Hospitals
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/hospitals` | Auth | List hospitals |
| POST | `/api/hospitals` | SuperAdmin | Create hospital |
| PUT | `/api/hospitals/:id` | Admin | Update hospital |

### Vendors
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/vendors` | Auth | List vendors |
| POST | `/api/vendors` | Admin | Create vendor |
| GET | `/api/vendors/:id` | Auth | Vendor detail |
| PUT | `/api/vendors/:id` | Admin | Update vendor |

### QR & Scanning
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/qr/generate` | Auth | Generate QR code |
| GET | `/api/qr/:assetId` | Auth | Get QR for asset |
| GET | `/api/scan/:assetTag` | Public | Public scan endpoint |
| POST | `/api/scan/:assetTag/log` | Public | Log scan event |

### Compliance
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/compliance` | Auth | List documents |
| POST | `/api/compliance` | Admin | Upload document |
| GET | `/api/compliance/:id` | Auth | Get document |
| PUT | `/api/compliance/:id` | Admin | Update document |

### Inventory
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/inventory` | Auth | List spare parts |
| POST | `/api/inventory` | Admin | Add spare part |
| PUT | `/api/inventory/:id` | Auth | Update stock |

### Reports
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/reports/assets` | Auth | Asset report |
| GET | `/api/reports/maintenance` | Auth | Maintenance report |
| GET | `/api/reports/compliance` | Auth | Compliance report |
| GET | `/api/reports/export` | Auth | Export PDF/CSV |

### Audit Logs
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/audit-logs` | Admin | List audit entries |

---

## User Roles & Permissions

| Role | Scope | Key Permissions |
|---|---|---|
| `super_admin` | All hospitals | Full system access, hospital management |
| `branch_admin` | Own hospital | Manage users, assets, compliance for branch |
| `supervisor` | Own hospital | Approve maintenance jobs, manage schedules |
| `technician` | Own hospital | View assets, create/update job cards, report faults |
| `auditor` | Own hospital | Read-only access to all data + audit logs |
| `vendor` | Assigned assets | View assigned AMC assets, submit service reports |

---

## Authentication

The platform uses **JWT-based dual-token authentication**:

1. **Access Token** — Short-lived (15 min), stored in `Authorization` header
2. **Refresh Token** — Long-lived (7 days), stored in `httpOnly` cookie

### Login Flow
```
POST /api/auth/login
  → Verify email + bcrypt password comparison
  → Generate access_token (JWT, 15m)
  → Generate refresh_token (JWT, 7d) → set as httpOnly cookie
  → Return: { user, access_token }
```

### Refresh Flow
```
POST /api/auth/refresh
  → Read refresh_token from cookie
  → Verify and decode JWT
  → Issue new access_token
  → Return: { access_token }
```

---

## Environment Variables

```env
# ── Server ────────────────────────────────────────────
NODE_ENV=development
PORT=4000

# ── Frontend ──────────────────────────────────────────
FRONTEND_URL=http://localhost:5173
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000

# ── Security ──────────────────────────────────────────
JWT_SECRET=your_super_secret_jwt_key_min_32_chars

# ── Database ──────────────────────────────────────────
DATABASE_URL=postgresql://user:password@localhost:5432/bewell_db

# ── Redis ─────────────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Cloudflare R2 (File Storage) ─────────────────────
R2_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=bewell-assets
R2_PUBLIC_URL=https://assets.bewell.in

# ── SMTP (Email) ──────────────────────────────────────
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@bewell.in
SMTP_PASS=your_app_password
SMTP_FROM="BeWell AssetIQ <notifications@bewell.in>"

# ── Twilio (SMS) ──────────────────────────────────────
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your_token
TWILIO_FROM_NUMBER=+1234567890
ALERT_SMS_ENABLED=false

# ── Monitoring ────────────────────────────────────────
SENTRY_DSN=your_sentry_dsn
```

---

## Testing

```bash
# API health check
curl http://localhost:4000/health

# Test database connection
cd bewell && npx tsx test-db.ts

# Test login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@bewell.com","password":"password123"}'
```

---

## Deployment

### Production with Docker Compose

```bash
# Set production environment
export NODE_ENV=production

# Build and start
docker-compose up --build -d

# Run migrations
docker-compose exec api npx drizzle-kit push

# Seed initial data
docker-compose exec api npx tsx src/db/seed.ts
```

### Production Checklist
- [ ] All environment variables set
- [ ] `JWT_SECRET` is a cryptographically secure random string (≥ 32 chars)
- [ ] PostgreSQL using managed service (e.g., Neon, RDS, Supabase)
- [ ] Redis using managed service (e.g., Upstash, ElastiCache)
- [ ] Cloudflare R2 bucket configured
- [ ] SMTP credentials validated
- [ ] SSL/TLS enabled via Nginx or load balancer
- [ ] Rate limiting configured
- [ ] CORS restricted to production frontend URL
- [ ] Default admin password changed
- [ ] Sentry DSN configured for error tracking
- [ ] Daily PostgreSQL backups enabled

---

## Troubleshooting

### API server won't start
- Check `DATABASE_URL` is correct and PostgreSQL is running
- Check `REDIS_URL` is correct and Redis is running
- Run `npx drizzle-kit push` to ensure all tables exist

### Login fails
- Verify the seed script ran: `npx tsx src/db/seed.ts`
- Check `JWT_SECRET` is set in `.env`
- Clear browser cookies and try again

### QR codes not generating
- Verify Cloudflare R2 credentials are set
- Check `R2_BUCKET_NAME` matches the bucket you created
- Ensure the bucket has public-read access configured

### BullMQ workers not running
- Ensure Redis is running and `REDIS_URL` is correct
- Check logs: `docker-compose logs worker`

### File uploads failing
- Check R2 credentials and permissions
- Ensure `upload.middleware.ts` multer limits match your use case

---

## Git Workflow

```bash
# Feature branch
git checkout -b feature/your-feature-name

# Commit with conventional commits
git commit -m "feat: add bulk QR export"
git commit -m "fix: resolve maintenance filter bug"
git commit -m "docs: update API endpoint list"

# Push and create PR
git push origin feature/your-feature-name
```

**Branch naming:**
- `feature/` — new features
- `fix/` — bug fixes
- `hotfix/` — urgent production fixes
- `docs/` — documentation only

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes with conventional commits
4. Push to the branch
5. Open a Pull Request with a clear description

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## Versioning

| Version | Description |
|---|---|
| 1.0.0 | Initial release — Core asset management, auth, RBAC |
| 1.1.0 | Maintenance & PPM scheduling with BullMQ |
| 1.2.0 | Compliance tracking, QR generation, scan events |
| 1.3.0 | Reports, audit logs, vendor management |
| 2.0.0 | Multi-tenant SaaS enhancements (planned) |

---

<div align="center">
Built with ❤️ for the Healthcare Industry | BeWell AssetIQ © 2025
</div>
