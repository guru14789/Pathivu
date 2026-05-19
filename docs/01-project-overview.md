# BeWell AssetIQ — Project Overview & Business Documentation

## 1. Project Overview

### 1.1 What Is BeWell AssetIQ?

BeWell AssetIQ is a **multi-branch, NABH-compliant hospital asset intelligence platform** that digitizes the entire lifecycle of medical equipment — from procurement and tagging to preventive maintenance, fault resolution, and final condemnation.

It replaces paper-based AMC files, spreadsheet registers, and manual inspection checklists with a secure, role-aware, real-time digital system accessible by all stakeholders across hospital branches.

### 1.2 Problem Statement

Indian healthcare organizations face:
- **Asset downtime** due to missed preventive maintenance (PPM)
- **NABH audit failures** due to missing or expired compliance documents
- **No traceability** — paper registers lost or tampered
- **Fragmented vendor communication** — AMC renewals missed
- **No real-time visibility** — administrators unaware of asset status
- **Manual fault tracking** — faults unreported or delayed

### 1.3 Solution

BeWell AssetIQ provides:
- A **central asset registry** with QR codes on each equipment
- Automated **PPM scheduling and alerts** via BullMQ
- **Digital job cards** for every maintenance activity
- **Compliance document vault** with 30/60-day expiry alerts
- **Anonymous fault reporting** via QR scan (no login required)
- **Immutable audit trails** for NABH compliance
- **Role-based access** for administrators, technicians, auditors, and vendors

---

## 2. Business Objectives

| # | Objective | KPI |
|---|---|---|
| 1 | Reduce equipment downtime | < 2% unplanned downtime per quarter |
| 2 | Eliminate NABH audit deficiencies | 0 compliance document expiry events |
| 3 | Digitize all maintenance records | 100% job cards created digitally |
| 4 | Improve fault resolution time | P1 faults resolved < 4 hours |
| 5 | Increase asset utilization | Track via depreciation & downtime reports |
| 6 | Vendor performance visibility | Monthly SLA compliance scores |

---

## 3. User Roles & Permissions

### 3.1 Role Definitions

#### super_admin
- **Scope:** All hospitals in the network
- **Permissions:** Create/manage hospitals, create branch admins, view all data
- **Use case:** IT administrator, CTO, or group CEO office

#### branch_admin
- **Scope:** Single assigned hospital
- **Permissions:** Manage users, assets, vendors, compliance within their hospital
- **Use case:** Hospital administrator, biomedical department head

#### supervisor
- **Scope:** Single assigned hospital
- **Permissions:** View all assets, approve maintenance job cards, create schedules
- **Use case:** Biomedical engineer, shift supervisor

#### technician
- **Scope:** Single assigned hospital
- **Permissions:** View assigned assets, create/update job cards, report faults
- **Use case:** Maintenance technician, biomedical technician

#### auditor
- **Scope:** Single assigned hospital
- **Permissions:** Read-only access to all data, full audit log access
- **Use case:** NABH auditor, internal compliance officer

#### vendor
- **Scope:** Assigned AMC assets only
- **Permissions:** View assigned assets, submit service reports
- **Use case:** External AMC vendor technician

### 3.2 Permission Matrix

| Action | super_admin | branch_admin | supervisor | technician | auditor | vendor |
|---|---|---|---|---|---|---|
| Create Hospital | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Edit Hospital | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create User | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Deactivate User | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Create Asset | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Edit Asset | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delete Asset | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Report Fault | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| Resolve Fault | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Create Job Card | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approve Job Card | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Create Schedule | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Upload Compliance Doc | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| View Audit Logs | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Generate QR Codes | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Manage Vendors | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Manage Inventory | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |

---

## 4. Functional Requirements

### 4.1 Asset Management
- FR-A01: System shall support creating assets with a unique asset tag (auto-generated or manual)
- FR-A02: Each asset shall belong to exactly one hospital and optionally one category and location
- FR-A03: Assets shall support depreciation tracking via SLM or WDV methods
- FR-A04: System shall track asset status: active, maintenance, condemned, transferred
- FR-A05: System shall support custom attributes (JSONB) for flexible equipment metadata
- FR-A06: Asset photos shall be uploaded to Cloudflare R2 and linked by URL
- FR-A07: Assets shall have a condition rating: good, fair, poor, critical

### 4.2 QR Code Management
- FR-Q01: System shall generate QR codes, Code128 barcodes, and EAN13 barcodes
- FR-Q02: Generated codes shall be stored in R2 and linked to the asset record
- FR-Q03: Each QR code shall encode the asset tag and point to the public scan URL
- FR-Q04: System shall track print count per QR code
- FR-Q05: Public scan page shall show asset info without login
- FR-Q06: Any user (anonymous) shall be able to report a fault via scan

### 4.3 Fault Management
- FR-F01: System shall support fault reporting with severity: low, medium, high, critical
- FR-F02: Faults shall be linked to an asset and hospital
- FR-F03: Fault status transitions: open → in_progress → resolved → closed
- FR-F04: Critical faults shall trigger real-time Socket.io event to dashboard
- FR-F05: Fault resolution shall record resolution notes and resolved_by user
- FR-F06: Anonymous fault reports via QR scan shall be supported

### 4.4 Maintenance Management
- FR-M01: System shall support maintenance types: PPM, breakdown, calibration, inspection, AMC_service
- FR-M02: Each maintenance log (job card) shall have priority P1, P2, or P3
- FR-M03: Job cards shall be assignable to specific technicians
- FR-M04: Supervisors shall approve completed job cards
- FR-M05: System shall record downtime hours and maintenance cost per job
- FR-M06: Job cards may be linked to a fault report (fault-triggered maintenance)

### 4.5 Preventive Maintenance Scheduling (PPM)
- FR-S01: System shall support schedule frequencies: weekly, monthly, quarterly, biannual, annual
- FR-S02: System shall support schedule types: PPM, calibration, statutory_inspection
- FR-S03: BullMQ worker shall check schedules daily and trigger alerts
- FR-S04: 30-day and 60-day pre-due alerts shall be sent via email/SMS
- FR-S05: Schedule shall record last service date and next service date

### 4.6 Compliance Management
- FR-C01: System shall track compliance documents: NABH, AERB, fire_NOC, calibration, electrical, biomedical_waste
- FR-C02: Each document shall have an expiry date
- FR-C03: System shall send 30-day and 60-day pre-expiry alerts
- FR-C04: Documents shall be stored in Cloudflare R2
- FR-C05: Status shall auto-update: valid, expiring_soon, expired

### 4.7 Vendor & AMC Management
- FR-V01: System shall maintain a vendor directory with contact, GST, performance rating
- FR-V02: AMC contracts shall be linked to vendor, hospital, and optionally asset or category
- FR-V03: AMC contracts shall have SLA hours for response time
- FR-V04: System shall track AMC expiry and alert on upcoming renewals

### 4.8 Inventory Management
- FR-I01: System shall manage spare parts inventory per hospital
- FR-I02: Each part shall have a reorder threshold
- FR-I03: When stock falls below threshold, an inventory alert shall trigger
- FR-I04: Parts may be linked to a vendor for ordering

### 4.9 Audit Logging
- FR-AL01: All INSERT, UPDATE, DELETE operations on critical tables shall be logged
- FR-AL02: Audit logs shall capture old_values, new_values, user, IP, and timestamp
- FR-AL03: Audit logs shall be immutable (no UPDATE or DELETE permitted)
- FR-AL04: Auditors and admins shall be able to query and filter audit logs

### 4.10 Reporting
- FR-R01: System shall generate asset reports (by status, category, location, hospital)
- FR-R02: System shall generate maintenance reports (by type, technician, cost, downtime)
- FR-R03: System shall generate compliance status reports
- FR-R04: All reports shall be exportable as PDF and CSV
- FR-R05: Reports shall respect role-based hospital scoping

---

## 5. Non-Functional Requirements

### 5.1 Performance
- API response time < 300ms for 95th percentile under normal load
- Dashboard loads in < 2 seconds on 10 Mbps connection
- Support 100 concurrent users per hospital instance
- PostgreSQL queries optimized with appropriate indexes on all foreign keys and filter columns

### 5.2 Security
- All passwords hashed with bcrypt (cost factor ≥ 10)
- JWT access tokens expire in 15 minutes
- Refresh tokens stored in httpOnly, SameSite=Strict cookies
- All inputs sanitized against XSS and SQL injection
- Rate limiting on auth endpoints (15 requests / 15 min)
- CORS restricted to known frontend origin
- Helmet.js security headers on all responses
- RBAC enforced at middleware level before controller execution

### 5.3 Reliability
- API uptime target: 99.5%
- Graceful shutdown on SIGTERM/SIGINT
- BullMQ jobs with retry logic (3 attempts)
- PostgreSQL connection pooling

### 5.4 Scalability
- Stateless API design (JWT-based, no server-side session)
- Docker Compose configured with 2 API replicas
- BullMQ workers as separate Docker service (horizontally scalable)
- Redis for shared state between API instances

### 5.5 Maintainability
- Full TypeScript across frontend and backend
- Drizzle ORM for type-safe database queries
- Zod schemas for runtime validation mirroring TypeScript types
- Modular directory structure per feature domain
- Winston structured logging for observability

### 5.6 Compliance
- NABH Section 4.7, 5.2, 7.1 — equipment management and maintenance records
- All data mutations captured in audit_logs table
- No direct database access by application users (connection pooled through ORM)

---

## 6. Application Architecture

### 6.1 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       INTERNET / USERS                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                    ┌────▼────┐
                    │  Nginx  │  Reverse Proxy / Static Files
                    └────┬────┘
             ┌───────────┼───────────┐
             │           │           │
        ┌────▼────┐ ┌────▼────┐     │
        │ React   │ │ Express │     │
        │ Web App │ │   API   │     │
        │ (Vite)  │ │ :4000   │     │
        └─────────┘ └────┬────┘     │
                         │          │
              ┌──────────┼──────────┘
              │          │
         ┌────▼────┐ ┌───▼────┐ ┌──────────┐ ┌──────────┐
         │ Postgres │ │ Redis  │ │ BullMQ   │ │Cloudflare│
         │   :5432  │ │ :6379  │ │ Workers  │ │    R2    │
         └──────────┘ └────────┘ └──────────┘ └──────────┘
```

### 6.2 Backend Module Pattern

Each feature module follows a consistent **Controller → Service → Repository** pattern:

```
modules/assets/
├── assets.routes.ts      # Express router + middleware application
├── assets.controller.ts  # Request/Response handling, no business logic
├── assets.service.ts     # Business logic, orchestration
├── assets.schema.ts      # Zod validation schemas
└── assets.types.ts       # TypeScript interfaces
```

### 6.3 Data Flow

```
HTTP Request
    │
    ▼
Rate Limiter → Auth Middleware → RBAC Middleware → Zod Validation
    │
    ▼
Controller (extract request data, call service)
    │
    ▼
Service (business logic, coordinate multiple DB calls)
    │
    ▼
Drizzle ORM → PostgreSQL
    │
    ▼
Response serialized → HTTP Response
```

---

## 7. Future Enhancement Roadmap

### Phase 4 — Planned Q3 2025
- [ ] Mobile PWA for technicians (camera-based QR scan, offline-capable)
- [ ] WhatsApp notifications via Twilio WhatsApp API
- [ ] Bulk asset import via CSV/Excel
- [ ] Asset transfer workflow between hospitals

### Phase 5 — Planned Q4 2025
- [ ] Predictive maintenance scoring via ML model
- [ ] Asset utilization heat maps
- [ ] Integration with procurement ERP (SAP, Oracle)
- [ ] RFID reader support alongside QR

### Phase 6 — 2026
- [ ] Multi-tenant SaaS with subscription billing
- [ ] White-label branding per hospital group
- [ ] Regulatory reporting (AERB annual returns, CPCB)
- [ ] IoT sensor integration for real-time equipment telemetry

---

## 8. Production Readiness Checklist

### Security
- [ ] `JWT_SECRET` is a 32+ character random string
- [ ] Default admin password changed
- [ ] CORS set to production frontend URL only
- [ ] All `.env` secrets externalized (not in codebase)
- [ ] Rate limiting validated under load
- [ ] Helmet security headers verified
- [ ] HTTPS enforced via Nginx or load balancer

### Reliability
- [ ] PostgreSQL using managed service with automated backups
- [ ] Redis using managed service (Upstash or ElastiCache)
- [ ] Cloudflare R2 bucket CORS policies set
- [ ] BullMQ workers deployed as separate service
- [ ] Graceful shutdown tested
- [ ] Health endpoint monitored (`/health`)

### Performance
- [ ] All database indexes applied
- [ ] Query performance validated under realistic data volume
- [ ] API response times measured and within SLA
- [ ] Frontend bundle size optimized (code splitting configured)

### Observability
- [ ] Sentry DSN configured for error tracking
- [ ] Winston logging to file or log aggregation service
- [ ] Health check endpoint configured in load balancer

### Operations
- [ ] Database backup schedule confirmed
- [ ] Deployment runbook documented
- [ ] On-call escalation path defined
