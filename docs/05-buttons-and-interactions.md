# BeWell AssetIQ — Buttons, Actions & Interactions Reference

## Overview

This document catalogues every interactive element across the entire BeWell AssetIQ platform — every button, dropdown, row action, form control, navigation item, and confirmation dialog.

---

## 1. Global Navigation (Sidebar)

All navigation items are always visible to authenticated users, with some hidden based on role.

| Nav Item | Icon | Route | Visible To | Active State |
|---|---|---|---|---|
| Dashboard | LayoutDashboard | `/dashboard` | All | Purple background + white text |
| Assets | Package | `/assets` | All | Same |
| Maintenance | Wrench | `/maintenance` | All | Same |
| Schedules | Calendar | `/schedules` | All | Same |
| Faults | AlertTriangle | `/faults` | All | Same |
| QR Generator | QrCode | `/qr-generator` | supervisor+ | Same |
| Scan Logs | ScanLine | `/scan-logs` | supervisor+ | Same |
| Hospitals | Building2 | `/hospitals` | branch_admin+ | Same |
| Users | Users | `/users` | branch_admin+ | Same |
| Vendors | Handshake | `/vendors` | branch_admin+ | Same |
| Compliance | ShieldCheck | `/compliance` | branch_admin+ | Same |
| Inventory | Archive | `/inventory` | supervisor+ | Same |
| Reports | BarChart3 | `/reports` | supervisor+ | Same |
| Audit Logs | ScrollText | `/audit-logs` | auditor, branch_admin, super_admin | Same |

---

## 2. Header Actions

| Element | Location | Action | State |
|---|---|---|---|
| Search Bar | Header center | Search across assets/faults/users | Focuses on click, `Enter` triggers search |
| User Avatar/Name | Header right | Opens profile dropdown | |
| Logout (dropdown) | Profile dropdown | `DELETE /api/auth/logout` → redirect to `/login` | Requires confirmation |
| Profile Settings (dropdown) | Profile dropdown | Navigate to profile edit | (future) |

---

## 3. LoginPage (`/login`)

| Element | Type | Action | Validation | Loading State |
|---|---|---|---|---|
| Email field | Input | onChange stores value | Required, valid email | — |
| Password field | Input (password) | onChange stores value | Required, min 8 chars | — |
| Show/Hide Password | Toggle icon | Toggles input type | — | — |
| Forgot Password? | Link | Navigate to `/reset-password` | — | — |
| Sign In | Button (primary) | `POST /api/auth/login` | All fields valid | Spinner + disabled |
| **Success** | — | Redirect to `/dashboard` | — | — |
| **Error** | Alert | "Invalid credentials or account deactivated..." | — | — |

---

## 4. ResetPasswordPage (`/reset-password`)

| Element | Type | Action | Validation |
|---|---|---|---|
| Email field | Input | onChange | Required, valid email |
| Send Reset Link | Button | `POST /api/auth/reset-password` | Email valid |
| Back to Login | Link | Navigate to `/login` | — |

---

## 5. DashboardPage (`/dashboard`)

### KPI Cards (4 cards)
| Card | Metric | Click Action |
|---|---|---|
| Total Assets | Count of all assets | Navigate to `/assets` |
| Open Faults | Count of open fault reports | Navigate to `/faults?status=open` |
| Pending Maintenance | Count of open/in_progress jobs | Navigate to `/maintenance?status=open` |
| Expired Compliance | Count of expired docs | Navigate to `/compliance?status=expired` |

### Quick Actions
| Button | Icon | Role Required | Action |
|---|---|---|---|
| Add Asset | Plus + Package | branch_admin+ | Navigate to `/assets/new` |
| Report Fault | AlertTriangle | All | Navigate to `/faults` (with modal trigger) |
| Generate QR | QrCode | supervisor+ | Navigate to `/qr-generator` |
| New Schedule | Calendar | supervisor+ | Navigate to `/schedules` |

### Live Fault Feed
| Element | Action |
|---|---|
| Fault row click | Navigate to `/faults/:id` |
| Severity badge | Visual indicator only |
| "View All Faults" | Navigate to `/faults` |

---

## 6. AssetListPage (`/assets`)

### Header Actions
| Button | Icon | Role Required | API Call | Loading | Success |
|---|---|---|---|---|---|
| Add Asset | Plus | branch_admin+ | — | — | Navigate to `/assets/new` |
| Export CSV | Download | supervisor+ | `GET /api/reports/assets?format=csv` | Spinner | CSV download |

### Filters
| Filter | Type | API Param | Reset Button |
|---|---|---|---|
| Search | Text input | `search` | ✅ X button clears |
| Status | Dropdown | `status` | ✅ |
| Condition | Dropdown | `condition` | ✅ |
| Category | Dropdown | `category_id` | ✅ |
| Location | Dropdown | `location_id` | ✅ |
| Hospital | Dropdown | `hospital_id` (super_admin only) | ✅ |

### Table Row Actions
| Button | Icon | Role Required | Action | Confirmation |
|---|---|---|---|---|
| View | Eye | All | Navigate to `/assets/:id` | No |
| Edit | Pencil | branch_admin+ | Navigate to `/assets/:id/edit` | No |
| Generate QR | QrCode | supervisor+ | Open QR modal | No |
| Delete | Trash2 | branch_admin+ | `DELETE /api/assets/:id` | ✅ "Are you sure you want to delete this asset?" |

### Pagination
| Control | Action |
|---|---|
| Previous | Load previous page |
| Page numbers | Jump to specific page |
| Next | Load next page |
| Items per page | Change limit (10/20/50) |

---

## 7. AssetFormPage (`/assets/new` and `/assets/:id/edit`)

| Section | Field | Type | Validation |
|---|---|---|---|
| Basic Info | Name | Text | Required, 2–150 chars |
| | Asset Tag | Text | Required, unique, max 50 |
| | Category | Dropdown | Optional |
| | Location | Dropdown | Optional |
| Technical | Serial Number | Text | Optional, unique if provided |
| | Model | Text | Optional |
| | Manufacturer | Text | Optional |
| Financial | Purchase Date | Date picker | Optional |
| | Purchase Cost | Number | Non-negative |
| | Warranty Expiry | Date picker | Optional |
| | Useful Life (years) | Number | Positive integer |
| | Salvage Value | Number | Non-negative |
| | Depreciation Method | Select (SLM/WDV) | Optional |
| Status | Status | Select | Required, one of enum |
| | Condition | Select | Required, one of enum |
| | Is Critical | Toggle | Default false |
| Media | Photo | File upload | Images only, max 5MB |
| Custom | Custom Attributes | Key-value builder | Optional |

### Form Actions
| Button | Location | Action | Loading | Success |
|---|---|---|---|---|
| Save Asset | Bottom right | `POST /api/assets` (create) or `PUT /api/assets/:id` (edit) | Spinner | Toast + redirect to `/assets/:id` |
| Cancel | Bottom right | Navigate back without saving | No | — |
| Upload Photo | Photo section | Opens file dialog | Upload spinner | Preview shown |
| Add Attribute | Custom section | Adds new key-value row | No | Row added |
| Remove Attribute | Per row | Removes that key-value pair | No | Row removed |

---

## 8. AssetDetailPage (`/assets/:id`)

### Page Header Buttons
| Button | Icon | Role Required | Action |
|---|---|---|---|
| Edit Asset | Pencil | branch_admin+ | Navigate to `/assets/:id/edit` |
| Generate QR | QrCode | supervisor+ | Open QR generation modal |
| Report Fault | AlertTriangle | All | Open fault report modal |
| Create Job Card | Wrench | supervisor+ | Open job card modal |

### Tab Navigation
| Tab | Content |
|---|---|
| Overview | Asset details, photo, depreciation |
| Maintenance | Linked job cards table |
| Faults | Linked fault reports table |
| Schedules | Active PPM schedules |
| Compliance | Linked compliance docs |
| QR Codes | Generated QR/barcodes |

### QR Codes Tab Actions
| Button | Action |
|---|---|
| Download | Download QR PNG from R2 |
| Print | Browser print dialog with QR |

---

## 9. FaultsListPage (`/faults`)

### Header Actions
| Button | Role | Action |
|---|---|---|
| New Fault Report | All | Opens create fault modal |
| Export | supervisor+ | Export fault list as CSV |

### Filters
| Filter | Options |
|---|---|
| Severity | All, Low, Medium, High, Critical |
| Status | All, Open, In Progress, Resolved, Closed |
| Date Range | From / To date pickers |
| Hospital | Dropdown (super_admin only) |

### Table Row Actions
| Button | Role | Action | Confirmation |
|---|---|---|---|
| View | All | Navigate to `/faults/:id` | No |
| Update Status | supervisor+ | Status dropdown → PATCH | No |
| Assign Technician | supervisor+ | Technician picker modal | No |
| Create Job Card | supervisor+ | Pre-fills maintenance form with fault_id | No |
| Close | branch_admin+ | Marks as closed | ✅ "Mark this fault as closed?" |

### Create Fault Modal Fields
| Field | Type | Validation |
|---|---|---|
| Asset | Search/select | Required |
| Fault Type | Text | Required, max 100 chars |
| Description | Textarea | Required |
| Severity | Select | Required |
| Photo | File upload | Optional |

---

## 10. MaintenanceListPage (`/maintenance`)

### Header Actions
| Button | Role | Action |
|---|---|---|
| New Job Card | supervisor+ | Opens create job card modal |
| Export | supervisor+ | CSV export |

### Table Row Actions
| Button | Role | Visibility | Action | Confirmation |
|---|---|---|---|---|
| View | All | Always | Navigate to `/maintenance/:id` | No |
| Edit | supervisor+ | Only for open/in_progress | Open edit modal | No |
| Mark Complete | technician+ | Only for in_progress | Opens completion form modal | No |
| Approve | supervisor+ | Only for completed | `PUT /api/maintenance/:id` (approved_by set) | ✅ |
| Cancel | supervisor+ | open/in_progress only | `PUT /api/maintenance/:id` status=cancelled | ✅ "Cancel this job card?" |

### Create Job Card Modal Fields
| Field | Type | Validation |
|---|---|---|
| Asset | Search/select | Required |
| Maintenance Type | Select | Required |
| Priority | Select (P1/P2/P3) | Required |
| Assign To | User search | Optional |
| Scheduled Date | Date picker | Optional |
| Notes | Textarea | Optional |
| Linked Fault | Fault search | Optional |

### Mark Complete Modal Fields
| Field | Validation |
|---|---|
| Completed Date | Required |
| Technician Remarks | Required |
| Downtime Hours | Optional, non-negative |
| Cost | Optional, non-negative |

---

## 11. SchedulesPage (`/schedules`)

### Header Actions
| Button | Role | Action |
|---|---|---|
| New Schedule | supervisor+ | Opens create schedule modal |
| Toggle View | All | Calendar / Table view switch |

### Table Row Actions
| Button | Role | Visibility | Action |
|---|---|---|---|
| Edit | supervisor+ | Always | Opens edit modal |
| Mark Serviced | supervisor+ | Always | Opens service date picker → updates `last_service_date` + recalculates `next_service_date` |
| Delete | supervisor+ | Always | `DELETE /api/schedules/:id` with confirmation |

### Create Schedule Modal Fields
| Field | Validation |
|---|---|
| Asset | Required |
| Schedule Type | Required |
| Frequency | Required |
| Next Service Date | Required, future date |
| Last Service Date | Optional |

---

## 12. HospitalsPage (`/hospitals`)

### Header Actions
| Button | Role | Action |
|---|---|---|
| Add Hospital | super_admin | Opens create modal |

### Table Row Actions
| Button | Role | Action | Confirmation |
|---|---|---|---|
| Edit | branch_admin+ | Opens edit modal | No |
| Deactivate | super_admin | `PUT /api/hospitals/:id` (is_active=false) | ✅ |
| Activate | super_admin | Re-enables | No |

### Create/Edit Hospital Modal Fields
| Field | Validation |
|---|---|
| Hospital Name | Required, 2–150 chars |
| Hospital Code | Required, exactly 3 uppercase letters |
| City | Optional |
| Address | Optional |
| Contact Person | Optional |
| Phone | Optional |
| Bed Count | Optional, positive integer |

---

## 13. UsersPage (`/users`)

### Header Actions
| Button | Role | Action |
|---|---|---|
| Add Team Member | branch_admin+ | Opens create user modal |

### Filters
| Filter | Options |
|---|---|
| Role | All, super_admin, branch_admin, supervisor, technician, auditor, vendor |
| Status | Active, Inactive |
| Search | Name or email |

### Table Row Actions
| Button | Role | Visibility | Action |
|---|---|---|---|
| View/Edit | branch_admin+ | Always | Opens side drawer |
| Deactivate | branch_admin+ | Active only | `PUT /api/users/:id/deactivate` with confirmation |
| Reactivate | branch_admin+ | Inactive only | `PUT /api/users/:id` (is_active=true) |

### Side Drawer (User Detail + Edit)
- Displays user info in edit form
- Role dropdown (branch_admin cannot set super_admin)
- Department text field
- Phone field
- **Save Changes** → `PUT /api/users/:id`
- **Close** → closes drawer

### Create User Modal Fields
| Field | Validation |
|---|---|
| Full Name | Required |
| Email | Required, unique, valid format |
| Password | Required, min 8 chars |
| Role | Required |
| Department | Optional |
| Phone | Optional |
| Hospital | Required for non-super_admin |

---

## 14. VendorsPage (`/vendors`)

### Header Actions
| Button | Role | Action |
|---|---|---|
| Add Vendor | branch_admin+ | Opens create modal |

### Table Row Actions
| Button | Role | Action |
|---|---|---|
| View Details | All | Navigate to `/vendors/:id` |
| Edit | branch_admin+ | Opens edit modal |
| Deactivate | branch_admin+ | With confirmation |

---

## 15. VendorDetailPage (`/vendors/:id`)

**Tabs:**
1. Overview (vendor info)
2. AMC Contracts (linked contracts table)
3. Assets (assets covered under AMC)

### Actions
| Button | Role | Action |
|---|---|---|
| Edit Vendor | branch_admin+ | Opens edit modal |
| Add AMC Contract | branch_admin+ | Opens AMC contract modal |
| View Contract PDF | All | Opens document URL in new tab |

---

## 16. CompliancePage (`/compliance`)

### Header Actions
| Button | Role | Action |
|---|---|---|
| Upload Document | branch_admin+ | Opens upload modal |
| Export Report | supervisor+ | PDF export of compliance status |

### Filters
| Filter | Options |
|---|---|
| Cert Type | All, NABH, AERB, fire_NOC, calibration, electrical, biomedical_waste |
| Status | All, Valid, Expiring Soon, Expired |
| Asset | Search |
| Date Range | Expiry date range |

### Table Row Actions
| Button | Role | Action | Confirmation |
|---|---|---|---|
| View Document | All | Opens R2 URL in new tab | No |
| Edit | branch_admin+ | Opens edit modal | No |
| Delete | branch_admin+ | `DELETE /api/compliance/:id` | ✅ "Delete this compliance document?" |

### Upload Modal Fields
| Field | Validation |
|---|---|
| Certificate Type | Required, dropdown |
| Issued By | Optional |
| Issue Date | Optional |
| Expiry Date | Required |
| Linked Asset | Optional |
| Notes | Optional |
| Document File | Required, PDF/image, max 10MB |

---

## 17. InventoryPage (`/inventory`)

### Header Actions
| Button | Role | Action |
|---|---|---|
| Add Part | branch_admin+ | Opens create part modal |
| Export | supervisor+ | CSV export |

### Filters
| Filter | Options |
|---|---|
| Low Stock | Toggle (show only below threshold) |
| Vendor | Dropdown |
| Search | Name or part number |

### Table Row Actions
| Button | Role | Action |
|---|---|---|
| Adjust Stock | technician+ | Opens stock adjustment modal (+/- quantity) |
| Edit | branch_admin+ | Opens edit modal |
| Deactivate | branch_admin+ | With confirmation |

### Stock Adjustment Modal
| Field | Validation |
|---|---|
| Adjustment (+/-) | Required, integer |
| Reason | Required |

---

## 18. QRGeneratorPage (`/qr-generator`)

### Controls
| Element | Type | Action |
|---|---|---|
| Asset Search | Search input | Find asset by tag, name, or serial |
| Format Selector | Radio group (QR / Code128 / EAN13) | Select code format |
| Generate Button | Primary button | `POST /api/qr/generate` |

### Generated Code Actions
| Button | Action |
|---|---|
| Download PNG | Download from R2 URL |
| Print | Open browser print dialog |
| Copy Link | Copy R2 URL to clipboard |

### Batch Generation
| Element | Action |
|---|---|
| Select Multiple Assets | Checkbox in table |
| Generate All | Loop `POST /api/qr/generate` for each |
| Download ZIP | Package all PNGs as ZIP |

---

## 19. ScanLogsPage (`/scan-logs`)

**Read-only page.** No action buttons except filters and pagination.

### Filters
| Filter | Options |
|---|---|
| Date Range | From / To date pickers |
| Asset | Search |
| Action Type | All, viewed, fault_logged, condition_updated, job_card_created |
| Scan Type | Authenticated / Anonymous |

---

## 20. ReportsPage (`/reports`)

### Report Cards
| Report | Description | Export Formats |
|---|---|---|
| Asset Summary | Status/condition/category breakdown | PDF, CSV |
| Maintenance Report | Cost, downtime, type analysis | PDF, CSV |
| Fault Analysis | Severity distribution, resolution time | PDF, CSV |
| Compliance Status | Expiry calendar and status breakdown | PDF |
| Vendor Performance | SLA adherence, AMC coverage | PDF, CSV |

### Per Report Actions
| Button | API | Loading | Success |
|---|---|---|---|
| View Report | `GET /api/reports/:type` | Spinner | Data rendered in table/chart |
| Export PDF | `GET /api/reports/export?format=pdf` | Spinner | PDF download |
| Export CSV | `GET /api/reports/export?format=csv` | Spinner | CSV download |

---

## 21. AuditLogsPage (`/audit-logs`)

**Read-only page.** No write actions.

### Filters
| Filter | Options |
|---|---|
| User | User search |
| Action | INSERT / UPDATE / DELETE |
| Table | assets, users, fault_reports, maintenance_logs, etc. |
| Date Range | From / To |

### Row Expand
| Action | Effect |
|---|---|
| Click row / ▼ expand | Shows JSON diff of old_values vs new_values |

---

## 22. PublicScanPage (`/scan/:assetTag`)

**No authentication required.**

| Element | Type | Action |
|---|---|---|
| Report a Fault | Button (medical-red) | Navigate to `/fault/:assetTag` |
| Asset info cards | Display only | No action |

---

## 23. PublicFaultPage (`/fault/:assetTag`)

**No authentication required.**

| Field | Type | Validation |
|---|---|---|
| Fault Type | Text | Required |
| Description | Textarea | Required, min 20 chars |
| Severity | Select | Required |
| Your Name (optional) | Text | Optional |
| Photo | File upload | Optional, image, max 5MB |

| Button | Action | Loading | Success |
|---|---|---|---|
| Submit Fault Report | `POST /api/faults` | Spinner | Thank you message |
| Cancel | Navigate back to scan page | — | — |

---

## 24. Confirmation Dialog Standard

Every destructive or irreversible action shows a confirmation modal:

```
┌─────────────────────────────────────┐
│ ⚠️  Confirm Action                    │
│                                     │
│  Are you sure you want to delete    │
│  this asset? This action cannot     │
│  be undone.                         │
│                                     │
│  [Cancel]        [Delete Asset]     │
│  (secondary)     (medical-red)      │
└─────────────────────────────────────┘
```

- **Cancel** → closes dialog, no action
- **Confirm** → triggers API call, shows loading on confirm button

---

## 25. Global Toast Notifications

| Trigger | Toast Type | Message |
|---|---|---|
| Asset created | ✅ Success | "Asset created successfully" |
| Asset updated | ✅ Success | "Asset updated successfully" |
| Asset deleted | ✅ Success | "Asset deleted" |
| Fault reported | ✅ Success | "Fault report submitted" |
| Job card created | ✅ Success | "Job card created" |
| QR code generated | ✅ Success | "QR code generated" |
| New critical fault | 🔴 Custom (red) | "CRITICAL: [Asset] — [Fault Type]" |
| API error | ❌ Error | Error message from API |
| Network error | ❌ Error | "Network error. Please check your connection." |
| Validation error | ❌ Error | Field-level errors shown inline |
| Session expired | ⚠️ Warning | "Session expired. Please login again." |

---

## 26. Form-Level Validation Rules (All Forms)

| Rule | Implementation |
|---|---|
| Required fields | Zod `.min(1)` or `.nonempty()` |
| Email format | Zod `.email()` |
| Phone format | Regex `/^\+?[1-9]\d{9,14}$/` |
| Date in future | Zod `.refine(d => d > new Date())` |
| Positive numbers | Zod `.positive()` |
| File size | Max 5MB for photos, 10MB for documents |
| File type | Accept specific MIME types only |
| Unique fields | Validated server-side (409 Conflict response) |

---

## 27. Keyboard Interactions

| Shortcut | Location | Action |
|---|---|---|
| `Escape` | Any modal | Close modal |
| `Enter` | Search bar | Trigger search |
| `Enter` | Form | Submit (if all valid) |
| `Tab` | Any form | Move to next field |
| `Shift+Tab` | Any form | Move to previous field |
| Arrow keys | Dropdowns | Navigate options |
