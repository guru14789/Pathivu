# BeWell AssetIQ — Frontend Planning Documentation

## 1. UI/UX Strategy

### 1.1 Design Philosophy

BeWell AssetIQ follows a **Healthcare Enterprise Premium** design philosophy:
- **Trust & Clarity:** Medical contexts demand zero ambiguity. Every element must communicate its function instantly.
- **Data-first layout:** Tables, charts, and KPI cards take visual priority over decorative elements.
- **Accessibility first:** All text meets WCAG AA contrast ratios (≥ 4.5:1 for normal text, ≥ 3:1 for large text).
- **Consistent interaction patterns:** Every table behaves the same way. Every modal has the same structure.

### 1.2 Approved Color System

```css
:root {
  /* Brand Colors */
  --primary-purple:   #682784;   /* Primary CTAs, active nav, key badges */
  --secondary-purple: #601A7D;   /* Hover states, gradients */
  --light-purple:     #9667A9;   /* Secondary actions, tertiary text accents */
  --lavender:         #C8B1D1;   /* Backgrounds, disabled states, borders */

  /* Semantic Colors */
  --medical-red:   #E81F23;   /* Critical severity, destructive actions, error states */
  --health-green:  #95C223;   /* Active/success states, resolved status, health indicators */
  --care-blue:     #66C3CB;   /* Info states, scan logs, calibration, neutral status */
  --orange:        #EF7A19;   /* Warning states, expiring items, medium severity */

  /* Neutrals */
  --grey:          #A397A6;   /* Placeholder text, disabled text, secondary labels */
  --black:         #1E1E1E;   /* Primary text, headings */
  --white:         #FCFBFC;   /* Page backgrounds, card backgrounds */

  /* Derived Surface Colors */
  --surface-0:     #FCFBFC;   /* Page background */
  --surface-1:     #F8F6F9;   /* Card background */
  --surface-2:     #F0ECF2;   /* Hover on card, table row alt */
  --border-light:  #E8E0EC;   /* Card borders, dividers */
  --text-primary:  #1E1E1E;   /* Headings, body text */
  --text-secondary:#5C5062;   /* Subtitles, meta text */
  --text-muted:    #A397A6;   /* Placeholder, disabled */
}
```

### 1.3 Severity / Status Color Mapping

| State | Color | Hex |
|---|---|---|
| Active / Success / Resolved | `--health-green` | `#95C223` |
| Open / Pending | `--care-blue` | `#66C3CB` |
| Warning / Expiring / Medium | `--orange` | `#EF7A19` |
| Critical / Error / Expired | `--medical-red` | `#E81F23` |
| Disabled / Cancelled | `--grey` | `#A397A6` |
| Primary Action | `--primary-purple` | `#682784` |

---

## 2. Typography System

### 2.1 Font Family

```css
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
```

Import via Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### 2.2 Type Scale

| Element | Class | Size | Weight | Color |
|---|---|---|---|---|
| Page Title (H1) | `.text-2xl font-bold` | 24px | 700 | `--black` |
| Section Header (H2) | `.text-xl font-semibold` | 20px | 600 | `--black` |
| Card Title (H3) | `.text-lg font-semibold` | 18px | 600 | `--black` |
| Body / Label | `.text-sm font-medium` | 14px | 500 | `--black` |
| Table Header | `.text-xs font-semibold uppercase` | 12px | 600 | `--text-secondary` |
| Table Cell | `.text-sm` | 14px | 400 | `--black` |
| Placeholder | `.text-sm` | 14px | 400 | `--grey` |
| Badge / Tag | `.text-xs font-medium` | 12px | 500 | varies |

---

## 3. Component Architecture

### 3.1 Layout Shell (`Layout.tsx`)

```
┌──────────────────────────────────────────────────────┐
│ Sidebar (dark, #1A1C24, fixed, w-64)                  │
│  ├─ Logo                                              │
│  ├─ Navigation Groups                                 │
│  │   ├─ Main: Dashboard, Assets, Maintenance, Faults  │
│  │   ├─ QR: QR Generator, Scan Logs                  │
│  │   └─ Admin: Hospitals, Users, Vendors, Compliance  │
│  │              Inventory, Reports, Audit Logs         │
│  └─ User Profile (bottom)                             │
│                                                       │
│ Main Panel (white, flex-1)                            │
│  ├─ Header (h-16, white, border-b)                   │
│  │   ├─ Search Bar                                    │
│  │   └─ Profile Dropdown                              │
│  └─ <Outlet /> — Page Content                        │
└──────────────────────────────────────────────────────┘
```

### 3.2 Core Reusable Patterns

#### Page Header
```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold text-[#1E1E1E]">Page Title</h1>
    <p className="text-sm text-slate-500 mt-1">Subtitle / description</p>
  </div>
  <button className="bg-[#682784] text-white px-4 py-2 rounded-lg ...">
    Primary Action
  </button>
</div>
```

#### Stats Card
```tsx
<div className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm">
  <div className="flex items-center justify-between">
    <div>
      <p className="text-sm text-slate-500">Label</p>
      <p className="text-2xl font-bold text-[#1E1E1E]">Value</p>
    </div>
    <div className="bg-purple-50 p-3 rounded-lg">
      <Icon className="text-[#682784]" />
    </div>
  </div>
</div>
```

#### Table
```tsx
<table className="w-full">
  <thead className="bg-slate-50 border-b border-slate-200">
    <tr>
      <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Column</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-slate-100">
    <tr className="hover:bg-slate-50 transition-colors">
      <td className="px-6 py-4 text-sm text-[#1E1E1E]">Cell</td>
    </tr>
  </tbody>
</table>
```

#### Modal
```tsx
<div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
  <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
      <h2 className="text-xl font-bold text-[#1E1E1E]">Modal Title</h2>
      <button onClick={onClose}><X /></button>
    </div>
    <div className="px-6 py-4">
      {/* Form content */}
    </div>
    <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-3">
      <button className="border border-slate-200 text-slate-700 ...">Cancel</button>
      <button className="bg-[#682784] text-white ...">Save</button>
    </div>
  </div>
</div>
```

#### Status Badge
```tsx
const statusColors = {
  active:     'bg-green-50 text-green-700 border-green-200',
  open:       'bg-blue-50 text-blue-700 border-blue-200',
  in_progress:'bg-orange-50 text-orange-700 border-orange-200',
  resolved:   'bg-green-50 text-green-700 border-green-200',
  critical:   'bg-red-50 text-red-700 border-red-200',
  expired:    'bg-red-50 text-red-700 border-red-200',
  cancelled:  'bg-gray-50 text-gray-600 border-gray-200',
};
<span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusColors[status]}`}>
  {status}
</span>
```

---

## 4. Routing Structure

```typescript
// Public Routes (no auth)
/login               → LoginPage
/reset-password      → ResetPasswordPage
/scan/:assetTag      → PublicScanPage
/fault/:assetTag     → PublicFaultPage

// Protected Routes (require auth)
/                    → redirect to /dashboard
/dashboard           → DashboardPage

// Assets
/assets              → AssetListPage
/assets/new          → AssetFormPage (Create mode)
/assets/:id          → AssetDetailPage
/assets/:id/edit     → AssetFormPage (Edit mode)
/assets/:id/qr       → AssetQRPage

// Maintenance
/maintenance         → MaintenanceListPage
/maintenance/:id     → MaintenanceDetailPage
/schedules           → SchedulesPage

// Faults
/faults              → FaultsListPage
/faults/:id          → FaultDetailPage

// QR Management
/qr-generator        → QRGeneratorPage
/scan-logs           → ScanLogsPage

// Admin
/hospitals           → HospitalsPage
/users               → UsersPage
/vendors             → VendorsPage
/vendors/:id         → VendorDetailPage
/compliance          → CompliancePage
/inventory           → InventoryPage
/reports             → ReportsPage
/audit-logs          → AuditLogsPage
```

### 4.1 Protected Route Guard

```tsx
// components/ProtectedRoute.tsx
export const ProtectedRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
};
```

---

## 5. State Management Strategy

### 5.1 Server State (TanStack Query)

All server data is managed via `@tanstack/react-query`:
```typescript
// Pattern: one hook per resource
const { data: assets, isLoading, error } = useQuery({
  queryKey: ['assets', filters],
  queryFn: () => api.get('/assets', { params: filters }),
});

// Mutations with optimistic updates
const { mutate: createAsset } = useMutation({
  mutationFn: (data) => api.post('/assets', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['assets'] });
    toast.success('Asset created');
  },
  onError: (err) => toast.error(err.response?.data?.error?.message),
});
```

### 5.2 Auth State (React Context)

```typescript
// context/AuthContext.tsx
interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (data: LoginResponse) => void;
  logout: () => void;
}
```

Stored in `localStorage` after login. Token attached via Axios interceptor.

### 5.3 Real-time (Socket.io)

```typescript
// hooks/useRealtimeFaults.ts
const socket = io(SOCKET_URL);
socket.on('fault:new', (fault) => {
  queryClient.invalidateQueries({ queryKey: ['faults'] });
  toast.error(`New ${fault.severity} fault reported`);
});
```

---

## 6. API Integration Flow

### 6.1 Axios Configuration

```typescript
// All API calls use a shared Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true, // for httpOnly cookie refresh token
});

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor — handle 401 / token refresh
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401) {
      // Try refresh
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        localStorage.setItem('access_token', data.access_token);
        return api.request(error.config);
      } catch {
        localStorage.removeItem('access_token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
```

### 6.2 Standard Response Format

**Success:**
```json
{ "data": { ... }, "message": "Created successfully" }
```

**Paginated:**
```json
{
  "data": [...],
  "pagination": { "page": 1, "limit": 20, "total": 150, "totalPages": 8 }
}
```

**Error:**
```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [...] } }
```

---

## 7. Form Validation Strategy

All forms use `react-hook-form` + `zod` for type-safe validation:

```typescript
const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(150),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^\+?[1-9]\d{9,14}$/, 'Invalid phone number').optional(),
});

const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
});
```

**Field error display:**
```tsx
<input {...register('name')} className={errors.name ? 'border-red-500' : 'border-slate-200'} />
{errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
```

---

## 8. Loading, Error & Empty States

### 8.1 Loading State
```tsx
{isLoading && (
  <div className="flex items-center justify-center py-20">
    <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-200 border-t-[#682784]" />
  </div>
)}
```

### 8.2 Error State
```tsx
{error && (
  <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
    <AlertCircle className="text-red-500 mx-auto mb-2" size={32} />
    <p className="text-red-700 font-medium">Failed to load data</p>
    <button onClick={refetch} className="mt-3 text-red-600 underline">Retry</button>
  </div>
)}
```

### 8.3 Empty State
```tsx
{!isLoading && data?.length === 0 && (
  <div className="text-center py-16">
    <Package className="text-slate-300 mx-auto mb-4" size={48} />
    <p className="text-slate-600 font-semibold">No assets found</p>
    <p className="text-slate-400 text-sm mt-1">Add your first asset to get started</p>
    <button className="mt-4 bg-[#682784] text-white px-4 py-2 rounded-lg">Add Asset</button>
  </div>
)}
```

---

## 9. Toast / Notification System

Uses `react-hot-toast`:

```typescript
// Success
toast.success('Asset created successfully');

// Error
toast.error('Failed to delete asset');

// Custom (for critical faults)
toast.custom((t) => (
  <div className="bg-red-600 text-white px-4 py-3 rounded-lg flex items-center gap-3 shadow-lg">
    <AlertTriangle size={20} />
    <span>Critical fault reported: {fault.asset_name}</span>
    <button onClick={() => toast.dismiss(t.id)}>✕</button>
  </div>
));
```

---

## 10. Page Documentation

### 10.1 LoginPage (`/login`)

**Purpose:** Authenticate users into the system

**Components:**
- Full-screen dark background with brand gradient overlay
- BeWell logo + "AssetIQ" heading
- Email + Password fields with `react-hook-form`
- "Forgot Password?" link → `/reset-password`
- Submit button with loading spinner

**Validations:**
- Email: required, valid email format
- Password: required, min 8 characters

**Actions:**
- `POST /api/auth/login` → store access_token, redirect to `/dashboard`
- On error: display generic message ("Invalid credentials or account deactivated")

**Edge Cases:**
- Deactivated accounts → same error message (no enumeration)
- 15 failed attempts in 15 min → rate limit error

---

### 10.2 DashboardPage (`/dashboard`)

**Purpose:** Executive operational overview with real-time KPIs

**Components:**
- 4 stat cards (Total Assets, Open Faults, Pending Maintenance, Expired Compliance)
- Live fault stream (Socket.io powered, last 5 critical faults)
- Quick action buttons (Add Asset, Report Fault, Generate QR, New Schedule)
- Asset condition breakdown (chart)

**APIs:**
- `GET /api/assets` (count)
- `GET /api/faults?status=open` (count)
- `GET /api/maintenance?status=open` (count)
- `GET /api/compliance?status=expired` (count)

**Real-time:**
- Subscribes to `fault:new` Socket.io event

---

### 10.3 AssetListPage (`/assets`)

**Purpose:** Browse, search, and manage the complete asset registry

**Components:**
- Search bar (by asset tag, name, serial)
- Filter dropdowns (Status, Condition, Category, Location, Hospital)
- Data table with columns: Asset Tag, Name, Category, Location, Status, Condition, Actions
- Pagination (20 per page)
- "Add Asset" button → `/assets/new`

**Table Row Actions:**
- **View** (eye icon) → `/assets/:id`
- **Edit** (pencil icon) → `/assets/:id/edit` (branch_admin+)
- **Generate QR** (QR icon) → opens QR modal
- **Delete** (trash icon) → confirmation dialog (branch_admin+)

**Buttons:**
| Button | Role Required | Action |
|---|---|---|
| Add Asset | branch_admin+ | Navigate to `/assets/new` |
| Export | supervisor+ | Download asset list as CSV |
| View | All | Navigate to asset detail |
| Edit | branch_admin+ | Navigate to edit form |
| Delete | branch_admin+ | Confirmation → DELETE API |

---

### 10.4 AssetFormPage (`/assets/new` and `/assets/:id/edit`)

**Purpose:** Create or edit an asset record

**Fields:**
- Asset Name (required)
- Asset Tag (required, unique — auto-suggested)
- Category (dropdown — from `/api/categories`)
- Location (dropdown — from `/api/locations`)
- Serial Number
- Model / Manufacturer
- Purchase Date / Cost
- Warranty Expiry
- Useful Life (years)
- Salvage Value
- Depreciation Method (SLM / WDV)
- Status (active/maintenance/condemned/transferred)
- Condition (good/fair/poor/critical)
- Is Critical (toggle)
- Photo Upload (Cloudflare R2)
- Custom Attributes (key-value pair builder)

**Validations:**
- Name: required, 2–150 chars
- Asset Tag: required, unique (API validates), max 50 chars
- Purchase Cost: non-negative number

---

### 10.5 AssetDetailPage (`/assets/:id`)

**Purpose:** Full 360° view of a single asset

**Tabs:**
1. **Overview** — All asset fields, photo, depreciation summary
2. **Maintenance History** — Linked maintenance_logs table
3. **Fault History** — Linked fault_reports table
4. **Schedules** — Active PPM schedules for this asset
5. **Compliance** — Compliance documents linked to this asset
6. **QR Codes** — Generated QR codes with download/print

**Actions:**
- Edit Asset button
- Generate QR Code button
- Create Job Card button
- Report Fault button

---

### 10.6 FaultsListPage (`/faults`)

**Purpose:** Triage and manage all fault reports

**Columns:** Fault ID, Asset, Severity badge, Status badge, Reported By, Reported At, Actions

**Filters:** Severity (low/medium/high/critical), Status (open/in_progress/resolved/closed), Hospital, Date Range

**Row Actions:**
- View Detail → `/faults/:id`
- Update Status (in_progress, resolved, closed)
- Assign Technician (supervisor+)
- Create Job Card (from fault)

**Severity Badge Colors:**
- Low → blue
- Medium → orange
- High → red (lighter)
- Critical → red (darker) + pulsing dot

---

### 10.7 MaintenanceListPage (`/maintenance`)

**Purpose:** View and manage all job cards

**Columns:** Job ID, Asset, Type, Priority, Status, Assigned To, Scheduled Date, Actions

**Filters:** Type, Priority, Status, Technician, Date Range

**Row Actions:**
- View → `/maintenance/:id`
- Edit (open/in_progress only)
- Complete (mark as completed, requires completion date and notes)
- Cancel (supervisor+)

**Buttons:**
| Button | Role Required | Action |
|---|---|---|
| New Job Card | supervisor+ | Open create modal |
| Export | supervisor+ | Download CSV |
| Complete | technician+ | Mark job complete |
| Approve | supervisor+ | Approve completed job |

---

### 10.8 SchedulesPage (`/schedules`)

**Purpose:** Manage PPM and calibration recurring schedules

**View:** Calendar grid (monthly view) + table list view toggle

**Columns:** Asset, Schedule Type, Frequency, Next Service Date, Days Until Due (countdown), Status

**Color coding:**
- > 60 days → green
- 30–60 days → orange (expiring soon)
- < 30 days → red (urgent)
- Overdue → red + alert icon

**Actions:**
- New Schedule (supervisor+)
- Edit Schedule (supervisor+)
- Mark Serviced (update last_service_date, auto-calculate next_service_date)
- Delete (supervisor+)

---

### 10.9 HospitalsPage (`/hospitals`)

**Purpose:** Manage hospital branches (super_admin only)

**Columns:** Hospital Name, Code, City, Contact, Bed Count, Active, Actions

**Actions:**
- Add Hospital (super_admin only)
- Edit Hospital
- Activate / Deactivate

---

### 10.10 UsersPage (`/users`)

**Purpose:** Team and access management

**Components:**
- Table of all users (scoped to hospital for branch_admin)
- Search by name or email
- Filter by role and active status
- Side drawer — user detail + edit form
- "Add Team Member" modal

**Columns:** Name, Email, Role badge, Department, Status, Last Login, Actions

**Actions:**
| Button | Roles | Action |
|---|---|---|
| Add Team Member | branch_admin+ | Open create user modal |
| Edit User | branch_admin+ | Open edit drawer |
| Deactivate | branch_admin+ | Soft-delete (is_active = false) |
| Reactivate | branch_admin+ | Re-enable account |

---

### 10.11 VendorsPage (`/vendors`)

**Purpose:** Manage vendor directory

**Columns:** Vendor Code, Name, Contact, Email, Phone, GST, Rating, Active

**Row Actions:**
- View Details → `/vendors/:id`
- Edit (branch_admin+)
- Deactivate (branch_admin+)

---

### 10.12 CompliancePage (`/compliance`)

**Purpose:** Track regulatory compliance documents with expiry management

**Columns:** Cert Type, Hospital/Asset, Issued By, Expiry Date, Days Remaining, Status Badge

**Status:**
- Valid (> 60 days) → green badge
- Expiring Soon (≤ 60 days) → orange badge with countdown
- Expired → red badge

**Actions:**
- Upload Document (branch_admin+)
- View/Download Document
- Edit Expiry Date
- Delete (branch_admin+)

---

### 10.13 InventoryPage (`/inventory`)

**Purpose:** Spare parts stock management

**Columns:** Part Name, Part #, Barcode, Vendor, Stock, Reorder Threshold, Status, Cost

**Stock Status:**
- OK (stock > threshold) → green
- Low (stock ≤ threshold) → orange
- Out of Stock (stock = 0) → red

**Actions:**
- Add Part (branch_admin+)
- Update Stock (+/- quantity dialog)
- Edit Part Details
- Deactivate

---

### 10.14 QRGeneratorPage (`/qr-generator`)

**Purpose:** Generate and manage QR codes / barcodes for assets

**Components:**
- Asset search / select
- Format selector (QR, Code128, EAN13)
- Preview of generated code
- Download (PNG) / Print button
- Batch generation for multiple assets

**Actions:**
| Button | Role | API | Description |
|---|---|---|---|
| Generate | supervisor+ | `POST /api/qr/generate` | Generate QR and save to R2 |
| Download | All | (direct URL) | Download PNG from R2 |
| Print | All | (browser print) | Print QR label |

---

### 10.15 ScanLogsPage (`/scan-logs`)

**Purpose:** View history of all QR scan events

**Columns:** Scan Time, Asset, Asset Tag, Action Taken, Scanned By (or Anonymous), IP, GPS

**Filters:** Date Range, Asset, Action Type

**Read-only** — no actions

---

### 10.16 ReportsPage (`/reports`)

**Purpose:** Analytics and export center

**Report Types:**
- Asset Summary (by status, condition, category)
- Maintenance Summary (by type, cost, downtime)
- Fault Analysis (by severity, resolution time)
- Compliance Status (expiry calendar)
- Vendor Performance (SLA adherence)

**Export Actions:**
- Export as PDF
- Export as CSV

---

### 10.17 AuditLogsPage (`/audit-logs`)

**Purpose:** NABH-compliant change history viewer

**Columns:** Timestamp, User, Action, Table, Record ID, IP Address, [Expand ▼]

**Expandable Row:** Shows old_values vs new_values JSON diff

**Filters:** User, Action (INSERT/UPDATE/DELETE), Table Name, Date Range

**Read-only** — immutable records

---

### 10.18 PublicScanPage (`/scan/:assetTag`)

**Purpose:** No-login page shown when a QR code is scanned

**Displays:** Asset name, category, location, status, condition, last maintenance date

**Actions (no login required):**
- Report Fault → `/fault/:assetTag`
- View basic asset info

---

### 10.19 PublicFaultPage (`/fault/:assetTag`)

**Purpose:** Anonymous fault reporting via QR scan

**Fields:**
- Fault Type (text)
- Description (textarea)
- Severity (Low/Medium/High/Critical)
- Photo Upload (optional)

**On Submit:** `POST /api/faults` with asset_id derived from asset_tag lookup

---

## 11. Accessibility Standards

- All interactive elements have `aria-label` or visible text
- Color is never the sole indicator of meaning (always paired with icon or text)
- Focus states are visible (purple outline ring)
- All form inputs have associated `<label>` elements
- Modals trap focus when open
- Keyboard navigation works for all primary flows
- WCAG AA contrast ratio enforced for all text/background combinations

---

## 12. Responsive Design Rules

| Breakpoint | Width | Behavior |
|---|---|---|
| Mobile | < 768px | Single column layout, sidebar collapses to bottom nav |
| Tablet | 768–1024px | Sidebar collapses to icon-only |
| Desktop | > 1024px | Full sidebar + main panel |

**Table responsiveness:** On mobile, tables scroll horizontally. Key columns (Name, Status, Actions) stay pinned.

**Modal responsiveness:** On mobile, modals slide up from bottom (sheet style) at full width.

---

## 13. Theme / Tailwind Configuration

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'primary-purple':   '#682784',
        'secondary-purple': '#601A7D',
        'light-purple':     '#9667A9',
        'lavender':         '#C8B1D1',
        'medical-red':      '#E81F23',
        'health-green':     '#95C223',
        'care-blue':        '#66C3CB',
        'orange-brand':     '#EF7A19',
        'grey-muted':       '#A397A6',
        'black-base':       '#1E1E1E',
        'white-premium':    '#FCFBFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
};
```
