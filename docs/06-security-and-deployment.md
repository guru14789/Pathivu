# BeWell AssetIQ — Security, Deployment & Infrastructure Documentation

## 1. Authentication & Security

### 1.1 Login Flow (Full Detail)

```
User enters email + password on LoginPage
            │
            ▼
POST /api/auth/login (rate limited: 15 req/15 min)
            │
            ▼
[1] Validate body with Zod (email, password required)
            │
            ▼
[2] Query users table WHERE email = ? AND is_active = true
            │
            ▼
[3] bcrypt.compare(password, password_hash)
   ├── FAIL → throw UnauthorizedError (generic message)
   └── PASS → continue
            │
            ▼
[4] Generate access_token (JWT, 15 min)
    Payload: { user_id, hospital_id, role, email }
            │
            ▼
[5] Generate refresh_token (JWT, 7 days)
    Payload: { user_id }
            │
            ▼
[6] Set refresh_token as httpOnly cookie:
    Secure=true (production)
    SameSite=Strict
    Path=/api/auth/refresh
    MaxAge=7d
            │
            ▼
[7] Update users.last_login = NOW()
            │
            ▼
[8] Return: { data: { user (without password_hash), access_token } }
            │
            ▼
Frontend: store access_token in localStorage
          Axios interceptor attaches it as Bearer header
```

### 1.2 Token Refresh Flow

```
Axios interceptor detects 401 response
            │
            ▼
POST /api/auth/refresh (with httpOnly cookie)
            │
            ▼
[1] Read refresh_token from cookie
[2] jwt.verify(token, JWT_REFRESH_SECRET)
   ├── FAIL → clear cookie, return 401, redirect to /login
   └── PASS → continue
            │
            ▼
[3] Query user by user_id from token
[4] Generate new access_token (JWT, 15 min)
            │
            ▼
[5] Return: { data: { access_token } }
            │
            ▼
Frontend: update localStorage, retry original request
```

### 1.3 Password Reset Flow

```
User submits email on ResetPasswordPage
            │
            ▼
POST /api/auth/reset-password
            │
            ▼
[1] Always return 200 (prevent email enumeration)
[2] Lookup user by email in background
[3] If found → generate reset token (JWT, 1h)
[4] Send email with reset link:
    https://app.bewell.in/reset-password?token=<jwt>
            │
            ▼
User clicks link → frontend validates token
            │
            ▼
POST /api/auth/confirm-reset
Body: { token, new_password }
            │
            ▼
[1] Verify JWT token
[2] Hash new password with bcrypt
[3] Update users.password_hash
[4] Return 200
```

### 1.4 RBAC Permission Flow

```
Request arrives at protected route
            │
            ▼
requireAuth middleware:
  → Extracts Bearer token
  → jwt.verify(token, JWT_SECRET)
  → Attaches req.user = decoded payload
            │
            ▼
requirePermission('read', 'Asset') middleware:
  → defineAbilityFor(req.user) → CASL ability
  → ability.cannot('read', 'Asset') → ForbiddenError
  → Auto-inject req.scopedHospitalId for branch roles
            │
            ▼
Controller executes with req.user + req.scopedHospitalId
```

---

## 2. Security Headers (Helmet.js)

| Header | Value | Purpose |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Prevent MIME sniffing |
| `X-Frame-Options` | `DENY` | Prevent clickjacking |
| `Strict-Transport-Security` | `max-age=31536000` | Force HTTPS for 1 year |
| `X-XSS-Protection` | `1; mode=block` | XSS filter |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Referrer control |
| `Content-Security-Policy` | Disabled (SPA served separately) | N/A |

---

## 3. CORS Configuration

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL, // 'http://localhost:5173' (dev) or 'https://app.bewell.in' (prod)
  credentials: true, // Required for cookie-based refresh tokens
}));
```

In production, `FRONTEND_URL` must be set to the exact HTTPS frontend URL — no wildcards.

---

## 4. Input Sanitization

```typescript
// Applied to all req.body, req.query, req.params
function sanitize(data: any): any {
  if (typeof data === 'string') {
    return data
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');
  }
  if (Array.isArray(data)) return data.map(sanitize);
  if (typeof data === 'object') {
    return Object.fromEntries(Object.entries(data).map(([k, v]) => [k, sanitize(v)]));
  }
  return data;
}
```

SQL injection is prevented structurally by Drizzle ORM's parameterized queries.

---

## 5. File Security

All uploaded files:
1. MIME type validated by Multer (whitelist: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`)
2. File size limited (5MB for images, 10MB for documents)
3. Stored in Cloudflare R2 with a UUID-based key (no filename exposure)
4. R2 access keys never exposed to frontend
5. Download URLs are pre-signed or served via `r2_url` public URL

---

## 6. Deployment Architecture

### 6.1 Development

```
localhost:5173 (Vite dev server) → localhost:4000 (Express API)
                                 → localhost:5432 (PostgreSQL)
                                 → localhost:6379 (Redis)
```

Vite dev server proxies `/api/*` to Express automatically.

### 6.2 Production (Docker Compose)

```
Internet → Nginx (port 80/443)
    ├── /api/* → api:4000 (2 replicas, round-robin)
    └── /* → /usr/share/nginx/html (React build)

api containers → postgres (Docker network: bewell-network)
              → redis (Docker network: bewell-network)
              → Cloudflare R2 (external, HTTPS)

worker container → redis (BullMQ)
                → postgres (job processing)
                → Nodemailer SMTP (external)
                → Twilio API (external)
```

### 6.3 Nginx Configuration (`infra/nginx.conf`)

```nginx
upstream api {
    server api:4000;
}

server {
    listen 80;
    server_name app.bewell.in;

    # Serve React SPA
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;  # SPA routing
    }

    # Proxy API requests
    location /api/ {
        proxy_pass http://api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket for Socket.io
    location /socket.io/ {
        proxy_pass http://api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    # Static asset caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## 7. Docker Configuration

### 7.1 API Dockerfile (`apps/api/Dockerfile`)

```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package.json .
EXPOSE 4000
CMD ["node", "dist/index.js"]
```

### 7.2 Docker Compose Services

| Service | Image | Ports | Depends On |
|---|---|---|---|
| `postgres` | postgres:15-alpine | 5432 (internal) | — |
| `redis` | redis:7-alpine | 6379 (internal) | — |
| `api` | Custom (2 replicas) | 4000 (internal) | postgres, redis |
| `worker` | Custom (1 instance) | — | postgres, redis |
| `nginx` | nginx:alpine | 80, 443 | api |

---

## 8. CI/CD Pipeline (Recommended)

### 8.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy BeWell AssetIQ

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - run: npm run typecheck

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build Docker images
        run: docker-compose build
      - name: Push to registry
        run: docker-compose push

  deploy:
    needs: build
    runs-on: ubuntu-latest
    steps:
      - name: SSH to server and pull
        run: |
          ssh deploy@production-server 'docker-compose pull && docker-compose up -d'
```

### 8.2 Pipeline Stages

1. **Lint & Type Check** — TypeScript compilation, ESLint
2. **Build** — `npm run build` for both web and api
3. **Docker Build** — Build and tag Docker images
4. **Registry Push** — Push images to container registry
5. **Deploy** — SSH to server, pull images, restart services
6. **Migration** — Run `drizzle-kit push` on production DB
7. **Health Check** — Verify `/health` endpoint returns 200

---

## 9. Backup & Recovery Strategy

### 9.1 Database Backup

```bash
# Daily automated backup (cron at 02:00 UTC)
pg_dump $DATABASE_URL -Fc -f backup_$(date +%Y%m%d).dump

# Restore
pg_restore -d $DATABASE_URL backup_20250519.dump
```

**Retention:** 30-day rolling backup storage in R2/S3 `backups/` bucket

### 9.2 Point-in-Time Recovery (Production)

Use a managed PostgreSQL service (Neon, AWS RDS, or Supabase) for:
- Continuous WAL archiving
- Point-in-time restore to any second within the last 7 days
- Automated daily snapshots retained for 30 days

### 9.3 Cloudflare R2 Files

Enable object versioning on the R2 bucket to retain deleted files for 90 days.

### 9.4 Recovery Procedures

| Scenario | Recovery Steps | RTO |
|---|---|---|
| API crash | Docker auto-restart policy | < 30 seconds |
| Database corruption | Restore from `pg_dump` backup | < 2 hours |
| R2 file deletion | Restore from versioned bucket | < 10 minutes |
| Redis failure | Flush and restart (no persistent data) | < 1 minute |
| Complete infrastructure loss | Docker Compose redeploy + DB restore | < 4 hours |

---

## 10. Performance Optimization

### 10.1 Database
- Indexes on all foreign keys and commonly filtered columns
- Paginated queries — no unbounded `SELECT *`
- Connection pooling via Drizzle ORM (pg connection pool)
- EXPLAIN ANALYZE before adding any complex query to production

### 10.2 API
- `compression` middleware for gzip on all responses
- BullMQ workers for any task > 100ms (email, PDF generation, SMS)
- Redis caching for reference data (hospitals, categories, locations)

### 10.3 Frontend
- Code splitting via React lazy + Suspense (per route)
- TanStack Query deduplication and cache (prevents duplicate fetches)
- Images served from R2 CDN (Cloudflare global edge network)
- Vite tree-shaking eliminates dead code from bundle

---

## 11. Logging & Monitoring

### 11.1 Structured Logging (Winston)

```typescript
// Request log format
{
  "level": "http",
  "timestamp": "2025-05-19T10:00:00.000Z",
  "requestId": "uuid-here",
  "method": "POST",
  "url": "/api/assets",
  "statusCode": 201,
  "duration": "45ms",
  "userId": "user-uuid",
  "ip": "192.168.1.1"
}

// Error log format
{
  "level": "error",
  "timestamp": "...",
  "message": "Database connection failed",
  "stack": "...",
  "requestId": "...",
  "userId": "..."
}
```

### 11.2 Error Tracking (Sentry)

```typescript
import * as Sentry from '@sentry/node';
Sentry.init({ dsn: process.env.SENTRY_DSN });

// Capture unhandled errors
app.use(Sentry.Handlers.errorHandler());
```

### 11.3 Health Monitoring

Monitor `GET /health` every 30 seconds via:
- UptimeRobot (free)
- AWS CloudWatch
- Better Uptime

Alert on:
- Status code ≠ 200
- Any service showing `"error"` in the services object
- Response time > 3 seconds

---

## 12. Scalability Planning

### 12.1 Horizontal Scaling

The API is **stateless by design** — any instance can serve any request because:
- Session state is encoded in the JWT (no server-side session)
- File storage is external (R2)
- Redis is shared between all API instances

Scale by increasing `replicas` in Docker Compose or adding nodes to a Kubernetes deployment.

### 12.2 Database Scaling

- **Read replicas** for reporting queries (non-critical reads)
- **Connection pooling** via PgBouncer in front of PostgreSQL
- **Partitioning** for `audit_logs` and `scan_events` (high-volume insert tables) by `created_at` month

### 12.3 Queue Scaling

BullMQ workers are independently scalable — run multiple `worker` containers to process jobs faster.

---

## 13. Environment Variable Reference (Complete)

| Variable | Required | Default | Description |
|---|---|---|---|
| `NODE_ENV` | ✅ | `development` | Runtime environment |
| `PORT` | ✅ | `4000` | API server port |
| `FRONTEND_URL` | ✅ | `http://localhost:5173` | Allowed CORS origin |
| `JWT_SECRET` | ✅ | — | Access token signing secret (≥32 chars) |
| `JWT_REFRESH_SECRET` | ✅ | — | Refresh token secret (≥32 chars) |
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `REDIS_URL` | ✅ | `redis://localhost:6379` | Redis connection |
| `R2_ACCOUNT_ID` | ✅ | — | Cloudflare R2 account ID |
| `R2_ACCESS_KEY_ID` | ✅ | — | R2 access key |
| `R2_SECRET_ACCESS_KEY` | ✅ | — | R2 secret key |
| `R2_BUCKET_NAME` | ✅ | `bewell-assets` | R2 bucket name |
| `R2_PUBLIC_URL` | ✅ | — | Public CDN URL for R2 |
| `SMTP_HOST` | ⚠️ | `smtp.gmail.com` | SMTP server host |
| `SMTP_PORT` | ⚠️ | `587` | SMTP port |
| `SMTP_USER` | ⚠️ | — | SMTP username |
| `SMTP_PASS` | ⚠️ | — | SMTP password (app password) |
| `SMTP_FROM` | ⚠️ | — | Sender email address |
| `TWILIO_ACCOUNT_SID` | ❌ | — | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | ❌ | — | Twilio auth token |
| `TWILIO_FROM_NUMBER` | ❌ | — | Twilio from phone number |
| `ALERT_SMS_ENABLED` | ❌ | `false` | Enable SMS alerts |
| `SENTRY_DSN` | ❌ | — | Sentry DSN for error tracking |
| `VITE_API_URL` | ✅ (web) | `http://localhost:4000/api` | Frontend API URL |
| `VITE_SOCKET_URL` | ✅ (web) | `http://localhost:4000` | Frontend Socket.io URL |

✅ Required | ⚠️ Required for email alerts | ❌ Optional

---

## 14. Turborepo Pipeline Config

```json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^typecheck"]
    }
  }
}
```

**Root package.json scripts:**
```json
{
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "typecheck": "turbo run typecheck"
  }
}
```
