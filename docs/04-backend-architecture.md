# BeWell AssetIQ — Backend Architecture Documentation

## 1. Server Architecture

### 1.1 Technology Stack

| Component | Technology | Version |
|---|---|---|
| Runtime | Node.js | 20+ |
| Framework | Express | 4.x |
| Language | TypeScript | 5.x |
| ORM | Drizzle ORM | 0.x |
| Database | PostgreSQL | 15 |
| Cache / Queue | Redis + BullMQ | 7 + 5 |
| Real-time | Socket.io | 4 |
| Auth | JWT (jsonwebtoken) | 9 |
| Password | bcrypt | 5 |
| Validation | Zod | 3 |
| File Storage | AWS SDK (S3-compat) → Cloudflare R2 | 3 |
| Email | Nodemailer | 6 |
| SMS | Twilio | 4 |
| Logging | Winston | 3 |
| Security | Helmet | 7 |
| Rate Limiting | express-rate-limit | 7 |
| Sanitization | Custom sanitizer (XSS) | — |

---

## 2. Module Structure

Each API feature is encapsulated in a self-contained module under `apps/api/src/modules/`:

```
modules/
├── auth/
│   ├── auth.routes.ts      # Express router
│   ├── auth.controller.ts  # HTTP layer
│   ├── auth.service.ts     # Business logic
│   └── auth.schema.ts      # Zod schemas
│
├── assets/
│   ├── assets.routes.ts
│   ├── assets.controller.ts
│   ├── assets.service.ts
│   └── assets.schema.ts
│
... (same pattern for all 17 modules)
```

### 2.1 Controller Responsibilities
- Extract and validate request data (using middleware-validated body)
- Call the service layer
- Return standardized HTTP response
- Never contain business logic

### 2.2 Service Responsibilities
- All business logic and decision-making
- Coordinate database calls via Drizzle ORM
- Trigger external services (R2, email, SMS, queue)
- Throw typed errors (no raw HTTP errors)

### 2.3 Routes Responsibilities
- Mount controllers on URL paths
- Apply middleware chain (auth → RBAC → validation)
- Apply route-specific rate limiting

---

## 3. Middleware Architecture

### 3.1 Middleware Execution Order

```
Incoming Request
    │
    ▼
[1] Request ID (UUID per request, X-Request-ID header)
[2] Helmet (security headers)
[3] CORS (origin whitelist)
[4] JSON body parser
[5] Cookie parser
[6] Input sanitizer (XSS/injection)
[7] Rate Limiter (general: 200/15min)
[8] Route-specific rate limiters (auth: 15/15min, scan: 30/1min)
[9] Request Logger (Winston)
    │
    ▼ (route hit)
    │
[10] requireAuth (JWT validation)
[11] requirePermission (CASL RBAC)
[12] validateRequest (Zod schema)
    │
    ▼
Controller → Service → Database
    │
    ▼
[13] errorHandler (global error middleware)
    │
    ▼
HTTP Response
```

---

## 4. Authentication Middleware (`auth.middleware.ts`)

```typescript
// JWT extraction: Bearer header OR httpOnly cookie
const token = req.headers.authorization?.split(' ')[1] || req.cookies?.access_token;

// Decoded payload attached to req.user
req.user = jwt.verify(token, process.env.JWT_SECRET) as AuthUser;
```

**AuthUser interface:**
```typescript
interface AuthUser {
  user_id: string;
  hospital_id: string | null;
  role: 'super_admin' | 'branch_admin' | 'supervisor' | 'technician' | 'auditor' | 'vendor';
  email: string;
}
```

**Error responses:**
- `401 Unauthorized` — missing token
- `401 Unauthorized` — invalid or expired token

---

## 5. RBAC Middleware (`rbac.middleware.ts`)

Uses **CASL** (ability.js) for attribute-based access control:

```typescript
// Usage in route:
router.get('/', requireAuth, requirePermission('read', 'Asset'), controller.list);

// Hospital scoping auto-injected:
// branch_admin, supervisor, technician → req.scopedHospitalId = req.user.hospital_id
// super_admin, auditor → req.scopedHospitalId = null (unrestricted)
```

**CASL Ability Definitions (by role):**

```typescript
// super_admin → can manage all
ability.can('manage', 'all');

// branch_admin → full access within hospital
ability.can('manage', 'Asset');
ability.can('manage', 'User');
ability.can('manage', 'FaultReport');
// ...

// supervisor → operational access
ability.can('read', 'Asset');
ability.can('manage', 'MaintenanceLogs');
ability.can('manage', 'Schedules');
ability.can('read', 'FaultReport');
ability.can('update', 'FaultReport');

// technician → limited operational
ability.can('read', 'Asset');
ability.can('create', 'MaintenanceLogs');
ability.can('update', 'MaintenanceLogs', { assigned_to: user.user_id });
ability.can('create', 'FaultReport');

// auditor → read only
ability.can('read', 'all');

// vendor → only assigned AMC assets
ability.can('read', 'Asset', { vendor_id: user.vendor_id });
```

---

## 6. Validation Middleware (`validate.middleware.ts`)

Zod schema validation for all request bodies:

```typescript
export const validate = (schema: ZodSchema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.errors);
  }
  req.body = result.data; // replace with coerced/stripped data
  next();
};
```

---

## 7. Error Handling Middleware (`error.middleware.ts`)

Global error handler — converts all errors to standardized JSON responses:

```typescript
// Custom error classes
class AppError extends Error {
  statusCode: number;
  code: string;
}

class ValidationError extends AppError { statusCode = 400; code = 'VALIDATION_ERROR'; }
class UnauthorizedError extends AppError { statusCode = 401; code = 'UNAUTHORIZED'; }
class ForbiddenError extends AppError { statusCode = 403; code = 'FORBIDDEN'; }
class NotFoundError extends AppError { statusCode = 404; code = 'NOT_FOUND'; }
class ConflictError extends AppError { statusCode = 409; code = 'CONFLICT'; }

// All errors → standardized response
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Name is required",
    "details": [{ "field": "name", "message": "Required" }]
  }
}
```

---

## 8. JWT / Session Handling

### 8.1 Token Generation (Login)

```typescript
// Access token — short-lived
const access_token = jwt.sign(
  { user_id, hospital_id, role, email },
  process.env.JWT_SECRET,
  { expiresIn: '15m' }
);

// Refresh token — long-lived, httpOnly cookie
const refresh_token = jwt.sign(
  { user_id },
  process.env.JWT_REFRESH_SECRET,
  { expiresIn: '7d' }
);

res.cookie('refresh_token', refresh_token, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
```

### 8.2 Token Refresh

```typescript
// POST /api/auth/refresh
const { user_id } = jwt.verify(req.cookies.refresh_token, JWT_REFRESH_SECRET);
const user = await db.query.users.findFirst({ where: eq(users.user_id, user_id) });
// Issue new access token
const access_token = jwt.sign({ ...user }, JWT_SECRET, { expiresIn: '15m' });
```

### 8.3 Logout

```typescript
// Clear httpOnly cookie
res.clearCookie('refresh_token');
```

---

## 9. Rate Limiting Strategy

| Endpoint Group | Window | Max Requests |
|---|---|---|
| All routes (general) | 15 minutes | 200 |
| `POST /api/auth/login` | 15 minutes | 15 |
| `POST /api/auth/refresh` | 15 minutes | 30 |
| `GET /api/scan/:assetTag` | 1 minute | 30 |

All exceeded limits return:
```json
{ "error": { "code": "TOO_MANY_REQUESTS", "message": "..." } }
```

---

## 10. Input Sanitization

A custom `sanitize()` function is applied to all `req.body`, `req.query`, and `req.params`:

- Strips HTML tags (prevents stored XSS)
- Encodes special characters (`<`, `>`, `"`, `'`, `&`)
- Applied before any route handler

Additionally, Drizzle ORM uses parameterized queries — SQL injection is structurally prevented.

---

## 11. File Upload Handling (`upload.middleware.ts`)

Uses `multer` with memory storage:

```typescript
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  },
});
```

Files are uploaded to Cloudflare R2 via `@aws-sdk/client-s3`:
```typescript
await s3Client.send(new PutObjectCommand({
  Bucket: process.env.R2_BUCKET_NAME,
  Key: `assets/${assetId}/${uuid()}.${ext}`,
  Body: file.buffer,
  ContentType: file.mimetype,
}));
```

---

## 12. Background Jobs (BullMQ Workers)

### 12.1 Queue Definitions

| Queue | Trigger | Job |
|---|---|---|
| `ppm-queue` | Daily CRON | Check `maintenance_schedules.next_service_date`, send alerts |
| `escalation-queue` | Event-driven | Escalate unresolved critical faults after SLA breach |
| `compliance-queue` | Daily CRON | Check `compliance_documents.expiry_date`, send 30/60-day alerts |
| `inventory-queue` | Event-driven | Alert when spare part stock falls below `reorder_threshold` |

### 12.2 PPM Worker Logic

```typescript
// Daily job: check all active schedules
const dueSchedules = await db.query.maintenanceSchedules.findMany({
  where: and(
    eq(maintenanceSchedules.is_active, true),
    lte(maintenanceSchedules.next_service_date, addDays(today, 60))
  )
});

for (const schedule of dueSchedules) {
  const daysUntilDue = differenceInDays(schedule.next_service_date, today);
  if (daysUntilDue <= 30 && !schedule.alert_30_sent) {
    await sendMaintenanceAlert(schedule, 30);
    await db.update(maintenanceSchedules).set({ alert_30_sent: true }).where(...);
  }
  if (daysUntilDue <= 60 && !schedule.alert_60_sent) {
    await sendMaintenanceAlert(schedule, 60);
    await db.update(maintenanceSchedules).set({ alert_60_sent: true }).where(...);
  }
}
```

---

## 13. Real-time (Socket.io)

### 13.1 Events Emitted by Server

| Event | Payload | Trigger |
|---|---|---|
| `fault:new` | `{ fault_id, asset_name, severity, hospital_id }` | New fault report created |
| `fault:updated` | `{ fault_id, status, resolved_by }` | Fault status changed |
| `maintenance:new` | `{ log_id, asset_name, priority }` | New job card created |
| `asset:critical` | `{ asset_id, asset_name, condition }` | Asset condition set to critical |

### 13.2 Client Subscriptions

```typescript
// Dashboard page listens to:
socket.on('fault:new', (fault) => { /* update fault stream */ });
socket.on('maintenance:new', (job) => { /* update maintenance widget */ });
```

---

## 14. Audit Logging Implementation

All critical mutations (assets, users, faults, maintenance) are logged to `audit_logs`:

```typescript
// Pattern in service methods:
await db.insert(auditLogs).values({
  changed_by: req.user.user_id,
  action: 'UPDATE',
  table_name: 'assets',
  record_id: assetId,
  old_values: oldAsset,
  new_values: updatedAsset,
  ip_address: req.ip,
  user_agent: req.headers['user-agent'],
});
```

Tables audited:
- `assets` (all mutations)
- `users` (all mutations)
- `fault_reports` (status changes)
- `maintenance_logs` (all mutations)
- `compliance_documents` (all mutations)
- `hospitals` (all mutations)

---

## 15. API Response Standardization

All controllers use a consistent response format:

```typescript
// Success
res.status(200).json({ data: result, message: 'Success' });

// Created
res.status(201).json({ data: result, message: 'Created successfully' });

// Paginated list
res.status(200).json({
  data: rows,
  pagination: { page, limit, total, totalPages }
});

// No content
res.status(204).send();
```

---

## 16. Environment Configuration

```
apps/api/
├── .env.development  # Local dev config
└── .env.production   # Production config
```

Root `.env` is a fallback (loaded second via `dotenv.config({ path: '../../.env' })`).

---

## 17. Caching Strategy

| Data | Cache | TTL |
|---|---|---|
| Hospital list | Redis | 5 minutes |
| Asset categories | Redis | 5 minutes |
| Locations per hospital | Redis | 5 minutes |
| User session data | Not cached (JWT stateless) | — |

Cache invalidation on write operations using `redis.del(cacheKey)`.

---

## 18. Logging

Uses **Winston** with structured JSON output:

```typescript
logger.info('User logged in', { user_id, email, ip: req.ip });
logger.error('Database query failed', { error: err.message, query });
logger.warn('Rate limit approaching', { ip, path: req.path });
```

Levels: `error → warn → info → http → debug`

In production: logs written to file (`logs/combined.log`, `logs/error.log`)
In development: logs written to console with color

---

## 19. Security Implementation Summary

| Threat | Mitigation |
|---|---|
| XSS (stored) | Input sanitization on all request inputs |
| SQL Injection | Drizzle ORM parameterized queries |
| CSRF | SameSite=Strict cookies + CORS whitelist |
| Brute Force | Rate limiting on auth endpoints |
| Token theft | Short-lived access tokens (15 min) |
| Session fixation | Fresh token on every login |
| Clickjacking | `X-Frame-Options: DENY` via Helmet |
| Sniffing | `HSTS` header with 1-year max-age |
| DoS | Rate limiting + graceful shutdown |
| Privilege escalation | CASL RBAC enforced server-side |

---

## 20. Graceful Shutdown

```typescript
const gracefulShutdown = async (signal) => {
  logger.info(`Received ${signal}`);
  httpServer.close(async () => {
    await Promise.all([
      ppmQueue.close(),
      escalationQueue.close(),
      complianceQueue.close(),
      inventoryQueue.close(),
    ]);
    await redis.quit();
    process.exit(0);
  });
  // Forceful kill after 10s timeout
  setTimeout(() => process.exit(1), 10000);
};
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
```

---

## 21. Health Check Endpoint

`GET /health` — used by load balancers and monitoring:

```json
{
  "status": "ok",
  "timestamp": "2025-05-19T10:00:00.000Z",
  "version": "1.0.0",
  "services": {
    "db": "ok",
    "redis": "ok",
    "r2": "ok"
  }
}
```

Returns `200` if all services healthy, `503` if any service is down.

---

## 22. API Endpoint Documentation (Full)

### Auth Module

#### POST `/api/auth/login`
- **Auth:** None (rate limited: 15/15min)
- **Body:** `{ email: string, password: string }`
- **Response 200:** `{ data: { user, access_token } }`
- **Response 401:** `{ error: { code: 'UNAUTHORIZED', message: 'Invalid credentials...' } }`
- **Sets Cookie:** `refresh_token` (httpOnly, Strict, 7d)
- **Validation:**
  - `email`: required, valid email format
  - `password`: required, min 8 characters

#### POST `/api/auth/refresh`
- **Auth:** `refresh_token` cookie
- **Rate limit:** 30/15min
- **Response 200:** `{ data: { access_token } }`
- **Response 401:** Invalid/expired refresh token

#### POST `/api/auth/logout`
- **Auth:** Bearer token
- **Response 204:** No content
- **Effect:** Clears `refresh_token` cookie

#### POST `/api/auth/reset-password`
- **Auth:** None
- **Body:** `{ email: string }`
- **Response 200:** Always returns success (enumeration protection)
- **Effect:** Sends password reset email if account exists

---

### Assets Module

#### GET `/api/assets`
- **Auth:** `requireAuth`, `requirePermission('read', 'Asset')`
- **Query params:** `page`, `limit`, `status`, `condition`, `category_id`, `location_id`, `hospital_id`, `search`
- **Scope:** `super_admin` sees all; branch-level roles see only their hospital
- **Response 200:** Paginated asset list

#### POST `/api/assets`
- **Auth:** `requireAuth`, `requirePermission('create', 'Asset')`
- **Body:** Full asset object (see schema section)
- **Response 201:** Created asset
- **Validation:** name required, asset_tag required & unique, purchase_cost non-negative

#### GET `/api/assets/:id`
- **Auth:** `requireAuth`, `requirePermission('read', 'Asset')`
- **Response 200:** Single asset with relations (category, location, vendor, hospital)
- **Response 404:** Asset not found

#### PUT `/api/assets/:id`
- **Auth:** `requireAuth`, `requirePermission('update', 'Asset')`
- **Body:** Partial asset update
- **Response 200:** Updated asset
- **Side effect:** Writes audit log entry

#### DELETE `/api/assets/:id`
- **Auth:** `requireAuth`, `requirePermission('delete', 'Asset')`
- **Response 204:** No content
- **Restriction:** Cannot delete asset with active maintenance logs or open faults

#### POST `/api/assets/:id/photo`
- **Auth:** `requireAuth`, upload.single('photo')
- **Body:** `multipart/form-data` with `photo` field
- **Response 200:** `{ data: { photo_url } }`

---

### Faults Module

#### GET `/api/faults`
- **Auth:** `requireAuth`, `requirePermission('read', 'FaultReport')`
- **Query params:** `severity`, `status`, `hospital_id`, `asset_id`, `from`, `to`
- **Response 200:** Paginated fault list

#### POST `/api/faults`
- **Auth:** Optional (public fault reporting supported)
- **Body:** `{ asset_id, fault_type, description, severity, photo_url? }`
- **Response 201:** Created fault
- **Side effect:** Emits `fault:new` Socket.io event; escalation job queued for critical faults

#### PUT `/api/faults/:id/status`
- **Auth:** `requireAuth`, `requirePermission('update', 'FaultReport')`
- **Body:** `{ status: 'in_progress' | 'resolved' | 'closed', resolution_notes? }`
- **Response 200:** Updated fault

#### PUT `/api/faults/:id/resolve`
- **Auth:** `requireAuth`
- **Body:** `{ resolution_notes: string }`
- **Response 200:** Fault marked resolved, `resolved_by` and `resolved_at` set

---

### Maintenance Module

#### GET `/api/maintenance`
- **Auth:** `requireAuth`, `requirePermission('read', 'MaintenanceLogs')`
- **Query params:** `type`, `priority`, `status`, `assigned_to`, `asset_id`, `from`, `to`
- **Response 200:** Paginated maintenance list

#### POST `/api/maintenance`
- **Auth:** `requireAuth`, `requirePermission('create', 'MaintenanceLogs')`
- **Body:** `{ asset_id, maintenance_type, priority, scheduled_date, assigned_to?, notes?, fault_id? }`
- **Response 201:** Created job card

#### PUT `/api/maintenance/:id/complete`
- **Auth:** `requireAuth`
- **Body:** `{ completed_date, technician_remarks, downtime_hours?, cost? }`
- **Response 200:** Job card updated to `completed` status

#### PUT `/api/maintenance/:id`
- **Auth:** `requireAuth`, `requirePermission('update', 'MaintenanceLogs')`
- **Restriction:** Cannot update `completed` or `cancelled` records
- **Response 200:** Updated record

---

### Schedules Module

#### GET `/api/schedules`
- **Auth:** `requireAuth`
- **Query params:** `hospital_id`, `asset_id`, `schedule_type`, `frequency`, `overdue_only`
- **Response 200:** Paginated schedule list with days-until-due computed field

#### POST `/api/schedules`
- **Auth:** `requireAuth`, `requirePermission('create', 'Schedules')`
- **Body:** `{ asset_id, schedule_type, frequency, next_service_date, last_service_date? }`
- **Response 201:** Created schedule

#### PUT `/api/schedules/:id/serviced`
- **Auth:** `requireAuth`, `requirePermission('update', 'Schedules')`
- **Body:** `{ service_date: string }`
- **Logic:** Sets `last_service_date`, auto-calculates `next_service_date` based on `frequency`, resets alert flags

---

### QR Module

#### POST `/api/qr/generate`
- **Auth:** `requireAuth`, `requirePermission('create', 'QRCode')`
- **Body:** `{ asset_id: string, format: 'qr' | 'barcode_code128' | 'barcode_ean13' }`
- **Logic:** Generates PNG, uploads to R2, saves `qr_codes` record
- **Response 201:** `{ data: { qr_id, r2_url } }`

#### GET `/api/qr/:assetId`
- **Auth:** `requireAuth`
- **Response 200:** List of QR codes for the asset

---

### Public Scan Module

#### GET `/api/scan/:assetTag`
- **Auth:** None (rate limited: 30/1min)
- **Response 200:** Public asset info (no sensitive data)
- **Side effect:** Creates `scan_events` record with IP and user-agent

#### POST `/api/scan/:assetTag/log`
- **Auth:** None
- **Body:** `{ action_taken, gps_lat?, gps_lng? }`
- **Response 200:** Scan event logged

---

### Users Module

#### GET `/api/users`
- **Auth:** `requireAuth`, `requirePermission('read', 'User')`
- **Scope:** branch_admin sees only their hospital's users
- **Query params:** `role`, `is_active`, `search`, `hospital_id`
- **Response 200:** User list (password_hash excluded)

#### POST `/api/users`
- **Auth:** `requireAuth`, `requirePermission('create', 'User')`
- **Body:** `{ full_name, email, password, role, hospital_id?, department?, phone? }`
- **Validation:** email unique, role within allowed scope (branch_admin cannot create super_admin)
- **Response 201:** Created user

#### PUT `/api/users/:id`
- **Auth:** `requireAuth`, `requirePermission('update', 'User')`
- **Body:** Partial user update (password update triggers bcrypt re-hash)

#### PUT `/api/users/:id/deactivate`
- **Auth:** `requireAuth`, `requirePermission('update', 'User')`
- **Effect:** Sets `is_active = false`

---

### Hospitals Module

#### GET `/api/hospitals`
- **Auth:** `requireAuth`
- **Scope:** All hospitals for super_admin; own hospital for others
- **Response 200:** Hospital list

#### POST `/api/hospitals`
- **Auth:** `requireAuth`, `requireRole(['super_admin'])`
- **Body:** `{ name, code, city?, address?, contact_person?, phone?, bed_count? }`
- **Validation:** `code` is 3 uppercase chars, `name` unique

#### PUT `/api/hospitals/:id`
- **Auth:** `requireAuth`, `requirePermission('update', 'Hospital')`

---

### Vendors Module

#### GET `/api/vendors`
- **Auth:** `requireAuth`
- **Query params:** `search`, `is_active`

#### POST `/api/vendors`
- **Auth:** `requireAuth`, `requirePermission('create', 'Vendor')`
- **Body:** `{ name, contact_person?, email?, phone?, address?, gst_number? }`
- **Side effect:** Auto-generates `vendor_code` (VND-XXXX)

#### GET `/api/vendors/:id`
- **Auth:** `requireAuth`
- **Response 200:** Vendor detail with AMC contracts

---

### AMC Module

#### GET `/api/amc`
- **Auth:** `requireAuth`
- **Query params:** `vendor_id`, `hospital_id`, `is_active`, `expiring_within_days`

#### POST `/api/amc`
- **Auth:** `requireAuth`, `requirePermission('create', 'AMCContract')`
- **Body:** `{ vendor_id, hospital_id, asset_id?, category_id?, start_date, end_date, contract_value?, response_sla_hours? }`

---

### Compliance Module

#### GET `/api/compliance`
- **Auth:** `requireAuth`
- **Query params:** `cert_type`, `status`, `hospital_id`, `asset_id`, `expiring_within_days`

#### POST `/api/compliance`
- **Auth:** `requireAuth`, `requirePermission('create', 'ComplianceDocument')`
- **Body:** `multipart/form-data` with `{ cert_type, hospital_id, expiry_date, issued_by?, issued_date?, asset_id?, notes? }` + file

---

### Inventory Module

#### GET `/api/inventory`
- **Auth:** `requireAuth`
- **Query params:** `hospital_id`, `vendor_id`, `low_stock_only`

#### POST `/api/inventory`
- **Auth:** `requireAuth`, `requirePermission('create', 'SparePart')`
- **Body:** `{ name, hospital_id, stock_quantity, reorder_threshold, unit_cost?, vendor_id?, part_number?, barcode? }`

#### PUT `/api/inventory/:id/stock`
- **Auth:** `requireAuth`
- **Body:** `{ adjustment: number, reason: string }` (+ve for restock, -ve for usage)
- **Side effect:** Triggers inventory alert if new stock < `reorder_threshold`

---

### Reports Module

#### GET `/api/reports/assets`
- **Auth:** `requireAuth`, `requirePermission('read', 'Report')`
- **Query params:** `hospital_id`, `from`, `to`, `group_by`
- **Response 200:** Asset summary by status/condition/category

#### GET `/api/reports/maintenance`
- **Query params:** `hospital_id`, `from`, `to`, `type`
- **Response 200:** Maintenance summary with total cost, average downtime

#### GET `/api/reports/export`
- **Query params:** `type` (assets/maintenance/compliance), `format` (pdf/csv), filters
- **Response:** Binary PDF or CSV file download

---

### Audit Logs Module

#### GET `/api/audit-logs`
- **Auth:** `requireAuth`, `requirePermission('read', 'AuditLog')`
- **Query params:** `changed_by`, `action`, `table_name`, `from`, `to`
- **Response 200:** Paginated audit log entries with old/new value diffs
