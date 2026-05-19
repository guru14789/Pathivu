# BeWell AssetIQ — Database Schema Documentation

## 1. Overview

The BeWell AssetIQ database is a **PostgreSQL 15** relational database managed via **Drizzle ORM**. It consists of **17 tables** covering the full lifecycle of hospital asset management.

All tables use **UUIDs** as primary keys (generated via `gen_random_uuid()` or `defaultRandom()`). All timestamps are stored with timezone information (`timestamptz`).

---

## 2. Entity Relationship Diagram

```
hospitals ──┬── users ──────────────────────────────────────────┐
            │                                                     │
            ├── asset_categories                                  │
            │        │                                            │
            ├── locations                                         │
            │        │                                            │
            ├── assets ──┬── qr_codes                            │
            │    │  │    ├── scan_events ── (scanned_by → users)  │
            │    │  │    ├── fault_reports ─ (reported_by → users)│
            │    │  │    ├── maintenance_logs ─ (assigned_to → users)
            │    │  │    ├── maintenance_schedules               │
            │    │  │    ├── compliance_documents                 │
            │    │  │    └── amc_contracts ── vendors             │
            │    │  │                                             │
            │    │  └── asset_assignments ── (assigned_to → users)│
            │    │                                                 │
            │    └── spare_parts ── vendors                       │
            │                                                     │
            └── audit_logs ── (changed_by → users) ──────────────┘
```

---

## 3. Table Definitions

### 3.1 `hospitals`

The root entity. Every asset, user, and operational record belongs to a hospital.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `hospital_id` | UUID | PK, default `gen_random_uuid()` | Unique identifier |
| `name` | varchar(150) | NOT NULL | Full hospital name |
| `code` | varchar(3) | NOT NULL | Short 3-char code (e.g. `CHN`) |
| `city` | varchar(100) | | City |
| `address` | text | | Full address |
| `contact_person` | varchar(100) | | Primary contact name |
| `phone` | varchar(30) | | Contact phone |
| `bed_count` | integer | default 200 | Hospital bed capacity |
| `is_active` | boolean | default true | Soft delete flag |
| `created_at` | timestamptz | defaultNow() | |
| `updated_at` | timestamptz | defaultNow() | |

**Indexes:** None (primary key only)

---

### 3.2 `users`

All system users across all hospital branches.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `user_id` | UUID | PK | Unique identifier |
| `hospital_id` | UUID | FK → hospitals | Assigned hospital (null for super_admin) |
| `full_name` | varchar(150) | NOT NULL | Full name |
| `email` | varchar(150) | UNIQUE, NOT NULL | Login email |
| `phone` | varchar(20) | | Contact phone |
| `password_hash` | text | NOT NULL | Bcrypt hashed password |
| `role` | role_enum | NOT NULL | `super_admin \| branch_admin \| supervisor \| technician \| auditor \| vendor` |
| `department` | varchar(100) | | Department (e.g. Biomedical Engineering) |
| `is_active` | boolean | default true | Account active flag |
| `created_by` | UUID | FK → users (self) | Who created this user |
| `last_login` | timestamptz | | Last successful login timestamp |
| `created_at` | timestamptz | defaultNow() | |
| `updated_at` | timestamptz | defaultNow() | |

**Enums:**
```sql
CREATE TYPE role AS ENUM ('super_admin', 'branch_admin', 'supervisor', 'technician', 'auditor', 'vendor');
```

---

### 3.3 `asset_categories`

Equipment categories per hospital (e.g. Imaging, ICU Equipment).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `category_id` | UUID | PK | Unique identifier |
| `hospital_id` | UUID | FK → hospitals | Owning hospital |
| `name` | varchar(100) | NOT NULL | Category name |
| `code` | varchar(3) | NOT NULL | Short code (e.g. `IMG`) |
| `description` | text | | Optional description |
| `created_at` | timestamptz | defaultNow() | |

---

### 3.4 `locations`

Physical locations within a hospital (wards, departments, floors).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `location_id` | UUID | PK | Unique identifier |
| `hospital_id` | UUID | FK → hospitals | NOT NULL |
| `name` | varchar(150) | NOT NULL | Location name |
| `floor` | varchar(50) | | Floor number/name |
| `building` | varchar(100) | | Building name |
| `created_at` | timestamptz | defaultNow() | |

---

### 3.5 `vendors`

Equipment suppliers and AMC service providers.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `vendor_id` | UUID | PK | Unique identifier |
| `name` | varchar(150) | NOT NULL | Vendor company name |
| `contact_person` | varchar(100) | | Primary contact |
| `email` | varchar(150) | | Contact email |
| `phone` | varchar(30) | | Contact phone |
| `address` | text | | Office address |
| `gst_number` | varchar(20) | | GST registration number |
| `vendor_code` | varchar(20) | UNIQUE | Auto-generated (e.g. `VND-0001`) |
| `performance_rating` | decimal(3,2) | default 3.00 | Rating 1.00–5.00 |
| `is_active` | boolean | default true | Soft delete |
| `created_at` | timestamptz | defaultNow() | |

---

### 3.6 `assets`

The central table — every piece of medical equipment.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `asset_id` | UUID | PK | Unique identifier |
| `hospital_id` | UUID | FK → hospitals | NOT NULL |
| `category_id` | UUID | FK → asset_categories | Optional |
| `location_id` | UUID | FK → locations | Optional |
| `vendor_id` | UUID | FK → vendors | Supplier |
| `asset_tag` | varchar(50) | UNIQUE, NOT NULL | e.g. `CHN-IMG-0042` |
| `name` | varchar(150) | NOT NULL | Equipment name |
| `serial_number` | varchar(100) | UNIQUE | Manufacturer serial |
| `model` | varchar(100) | | Model number |
| `manufacturer` | varchar(100) | | Manufacturer name |
| `purchase_date` | timestamp | | Date of purchase |
| `purchase_cost` | decimal(12,2) | | Original cost |
| `warranty_expiry` | timestamp | | Warranty end date |
| `useful_life_years` | integer | | For depreciation |
| `salvage_value` | decimal(12,2) | | End-of-life value |
| `depreciation_method` | depreciation_enum | | `SLM \| WDV` |
| `status` | asset_status_enum | default `active` | `active \| maintenance \| condemned \| transferred` |
| `condition` | asset_condition_enum | default `good` | `good \| fair \| poor \| critical` |
| `is_critical` | boolean | default false | Life-critical equipment flag |
| `photo_url` | text | | R2 URL |
| `custom_attributes` | jsonb | default `{}` | Flexible metadata |
| `created_by` | UUID | FK → users | |
| `created_at` | timestamptz | defaultNow() | |
| `updated_at` | timestamptz | defaultNow() | |

**Indexes:**
```sql
CREATE INDEX asset_hospital_idx ON assets(hospital_id);
CREATE INDEX asset_status_idx ON assets(status);
CREATE INDEX asset_tag_idx ON assets(asset_tag);
CREATE INDEX asset_serial_idx ON assets(serial_number);
```

---

### 3.7 `qr_codes`

Generated QR codes / barcodes linked to assets.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `qr_id` | UUID | PK | |
| `asset_id` | UUID | FK → assets | NOT NULL |
| `format` | qr_format_enum | | `qr \| barcode_code128 \| barcode_ean13` |
| `r2_key` | text | NOT NULL | File key in R2 bucket |
| `r2_url` | text | NOT NULL | Public URL |
| `is_active` | boolean | default true | |
| `generated_by` | UUID | FK → users | NOT NULL |
| `generated_at` | timestamptz | defaultNow() | |
| `print_count` | integer | default 0 | Times printed |

---

### 3.8 `scan_events`

Every time a QR code is scanned (authenticated or anonymous).

| Column | Type | Constraints | Description |
|---|---|---|---|
| `scan_id` | UUID | PK | |
| `asset_id` | UUID | FK → assets | NOT NULL |
| `scanned_by` | UUID | FK → users | null for anonymous |
| `scanned_at` | timestamptz | NOT NULL, defaultNow() | |
| `ip_address` | varchar(50) | | Scan device IP |
| `user_agent` | text | | Browser/device info |
| `gps_lat` | decimal(9,6) | | GPS latitude |
| `gps_lng` | decimal(9,6) | | GPS longitude |
| `action_taken` | scan_action_enum | | `viewed \| fault_logged \| condition_updated \| job_card_created` |

**Indexes:**
```sql
CREATE INDEX scan_asset_idx ON scan_events(asset_id);
CREATE INDEX scan_at_idx ON scan_events(scanned_at);
```

---

### 3.9 `fault_reports`

Equipment fault/breakdown reports.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `fault_id` | UUID | PK | |
| `asset_id` | UUID | FK → assets | NOT NULL |
| `hospital_id` | UUID | FK → hospitals | NOT NULL |
| `reported_by` | UUID | FK → users | null for anonymous |
| `fault_type` | varchar(100) | NOT NULL | e.g. "Power failure", "Mechanical" |
| `description` | text | NOT NULL | Detailed description |
| `severity` | fault_severity_enum | NOT NULL | `low \| medium \| high \| critical` |
| `photo_url` | text | | R2 URL of fault photo |
| `status` | fault_status_enum | default `open` | `open \| in_progress \| resolved \| closed` |
| `resolved_at` | timestamptz | | When resolved |
| `resolved_by` | UUID | FK → users | Who resolved |
| `resolution_notes` | text | | Resolution description |
| `reported_at` | timestamptz | defaultNow() | |

**Indexes:**
```sql
CREATE INDEX fault_asset_idx ON fault_reports(asset_id);
CREATE INDEX fault_hospital_idx ON fault_reports(hospital_id);
CREATE INDEX fault_status_idx ON fault_reports(status);
CREATE INDEX fault_severity_idx ON fault_reports(severity);
CREATE INDEX fault_reported_at_idx ON fault_reports(reported_at);
```

---

### 3.10 `maintenance_logs`

Digital job cards for every maintenance activity.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `log_id` | UUID | PK | |
| `asset_id` | UUID | FK → assets | NOT NULL |
| `hospital_id` | UUID | FK → hospitals | NOT NULL |
| `fault_id` | UUID | FK → fault_reports | null if not fault-triggered |
| `assigned_to` | UUID | FK → users | Assigned technician |
| `approved_by` | UUID | FK → users | Approving supervisor |
| `maintenance_type` | maintenance_type_enum | NOT NULL | `PPM \| breakdown \| calibration \| inspection \| AMC_service` |
| `priority` | priority_enum | default `P2` | `P1 \| P2 \| P3` |
| `status` | maintenance_status_enum | default `open` | `open \| in_progress \| completed \| cancelled` |
| `scheduled_date` | date | | Planned date |
| `completed_date` | date | | Actual completion date |
| `downtime_hours` | decimal(6,2) | | Equipment downtime |
| `cost` | decimal(12,2) | | Maintenance cost |
| `notes` | text | | General notes |
| `technician_remarks` | text | | Technician's field remarks |
| `created_by` | UUID | FK → users | |
| `created_at` | timestamptz | defaultNow() | |
| `updated_at` | timestamptz | defaultNow() | |

**Indexes:**
```sql
CREATE INDEX maint_asset_idx ON maintenance_logs(asset_id);
CREATE INDEX maint_hospital_idx ON maintenance_logs(hospital_id);
CREATE INDEX maint_status_idx ON maintenance_logs(status);
CREATE INDEX maint_priority_idx ON maintenance_logs(priority);
```

---

### 3.11 `maintenance_schedules`

PPM and calibration recurring schedules.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `schedule_id` | UUID | PK | |
| `asset_id` | UUID | FK → assets | NOT NULL |
| `hospital_id` | UUID | FK → hospitals | NOT NULL |
| `schedule_type` | schedule_type_enum | NOT NULL | `PPM \| calibration \| statutory_inspection` |
| `frequency` | frequency_enum | NOT NULL | `weekly \| monthly \| quarterly \| biannual \| annual` |
| `last_service_date` | date | | Last completed service |
| `next_service_date` | date | NOT NULL | Next due date |
| `alert_30_sent` | boolean | default false | 30-day alert sent flag |
| `alert_60_sent` | boolean | default false | 60-day alert sent flag |
| `is_active` | boolean | default true | |
| `created_by` | UUID | FK → users | |
| `created_at` | timestamptz | defaultNow() | |

**Indexes:**
```sql
CREATE INDEX sched_next_service_idx ON maintenance_schedules(next_service_date);
CREATE INDEX sched_is_active_idx ON maintenance_schedules(is_active);
```

---

### 3.12 `compliance_documents`

Regulatory compliance certificates and their expiry tracking.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `doc_id` | UUID | PK | |
| `hospital_id` | UUID | FK → hospitals | NOT NULL |
| `asset_id` | UUID | FK → assets | Optional (some docs are hospital-level) |
| `cert_type` | varchar(100) | NOT NULL | `NABH \| AERB \| fire_NOC \| calibration \| electrical \| biomedical_waste` |
| `issued_by` | varchar(150) | | Issuing authority |
| `issued_date` | date | | Issue date |
| `expiry_date` | date | NOT NULL | Expiry date |
| `document_url` | text | | R2 URL to the document PDF |
| `status` | compliance_status_enum | default `valid` | `valid \| expiring_soon \| expired` |
| `alert_30_sent` | boolean | default false | |
| `alert_60_sent` | boolean | default false | |
| `notes` | text | | Additional notes |
| `uploaded_by` | UUID | FK → users | |
| `created_at` | timestamptz | defaultNow() | |

**Indexes:**
```sql
CREATE INDEX compliance_expiry_idx ON compliance_documents(expiry_date);
CREATE INDEX compliance_hospital_idx ON compliance_documents(hospital_id);
CREATE INDEX compliance_status_idx ON compliance_documents(status);
```

---

### 3.13 `amc_contracts`

Annual Maintenance Contracts between vendors and hospitals/assets.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `contract_id` | UUID | PK | |
| `vendor_id` | UUID | FK → vendors | NOT NULL |
| `hospital_id` | UUID | FK → hospitals | NOT NULL |
| `asset_id` | UUID | FK → assets | Optional (asset-level AMC) |
| `category_id` | UUID | FK → asset_categories | Optional (category-level AMC) |
| `contract_number` | varchar(100) | UNIQUE | e.g. `AMC-2025-0042` |
| `start_date` | date | NOT NULL | Contract start |
| `end_date` | date | NOT NULL | Contract end |
| `contract_value` | decimal(12,2) | | Annual contract value |
| `response_sla_hours` | integer | default 4 | SLA hours for response |
| `document_url` | text | | R2 URL to contract PDF |
| `is_active` | boolean | default true | |
| `notes` | text | | |
| `created_at` | timestamptz | defaultNow() | |

**Indexes:**
```sql
CREATE INDEX amc_end_date_idx ON amc_contracts(end_date);
CREATE INDEX amc_is_active_idx ON amc_contracts(is_active);
```

---

### 3.14 `spare_parts` (Inventory)

Spare parts and consumables inventory per hospital.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `part_id` | UUID | PK | |
| `hospital_id` | UUID | FK → hospitals | NOT NULL |
| `vendor_id` | UUID | FK → vendors | Optional |
| `name` | varchar(150) | NOT NULL | Part name |
| `part_number` | varchar(100) | | Manufacturer part number |
| `barcode` | varchar(100) | UNIQUE | Barcode for scanning |
| `unit` | varchar(30) | default `piece` | Unit of measure |
| `stock_quantity` | integer | NOT NULL, default 0 | Current stock |
| `reorder_threshold` | integer | NOT NULL, default 5 | Alert threshold |
| `unit_cost` | decimal(10,2) | | Cost per unit |
| `location_notes` | text | | Storage location description |
| `is_active` | boolean | default true | |
| `created_at` | timestamptz | defaultNow() | |
| `updated_at` | timestamptz | defaultNow() | |

**Indexes:**
```sql
CREATE INDEX spare_hospital_idx ON spare_parts(hospital_id);
CREATE INDEX spare_barcode_idx ON spare_parts(barcode);
```

---

### 3.15 `asset_assignments`

Tracks which user is currently assigned/responsible for an asset.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `assignment_id` | UUID | PK | |
| `asset_id` | UUID | FK → assets | NOT NULL |
| `assigned_to` | UUID | FK → users | NOT NULL |
| `assigned_by` | UUID | FK → users | |
| `assigned_at` | timestamptz | defaultNow() | |
| `returned_at` | timestamptz | | When returned/unassigned |
| `notes` | text | | Reason for assignment |

---

### 3.16 `audit_logs`

Immutable change history for all critical data mutations.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | UUID | PK | |
| `changed_by` | UUID | FK → users | Who made the change |
| `action` | audit_action_enum | NOT NULL | `INSERT \| UPDATE \| DELETE` |
| `table_name` | text | NOT NULL | Which table was changed |
| `record_id` | UUID | NOT NULL | Which record was changed |
| `old_values` | jsonb | | Values before change |
| `new_values` | jsonb | | Values after change |
| `ip_address` | text | | Request IP |
| `user_agent` | text | | Browser/client info |
| `created_at` | timestamptz | defaultNow() | When the change occurred |

> **Important:** No UPDATE or DELETE is permitted on this table. Records are insert-only.

---

## 4. Database Enums Summary

| Enum Name | Values |
|---|---|
| `role` | `super_admin`, `branch_admin`, `supervisor`, `technician`, `auditor`, `vendor` |
| `asset_status` | `active`, `maintenance`, `condemned`, `transferred` |
| `asset_condition` | `good`, `fair`, `poor`, `critical` |
| `depreciation_method` | `SLM`, `WDV` |
| `fault_severity` | `low`, `medium`, `high`, `critical` |
| `fault_status` | `open`, `in_progress`, `resolved`, `closed` |
| `maintenance_type` | `PPM`, `breakdown`, `calibration`, `inspection`, `AMC_service` |
| `maintenance_priority` | `P1`, `P2`, `P3` |
| `maintenance_status` | `open`, `in_progress`, `completed`, `cancelled` |
| `schedule_type` | `PPM`, `calibration`, `statutory_inspection` |
| `frequency` | `weekly`, `monthly`, `quarterly`, `biannual`, `annual` |
| `compliance_status` | `valid`, `expiring_soon`, `expired` |
| `scan_action` | `viewed`, `fault_logged`, `condition_updated`, `job_card_created` |
| `qr_format` | `qr`, `barcode_code128`, `barcode_ean13` |
| `audit_action` | `INSERT`, `UPDATE`, `DELETE` |

---

## 5. Indexing Strategy

All foreign keys are indexed. Additional indexes are applied to:
- Columns used in `WHERE` filters (status, severity, is_active)
- Columns used in `ORDER BY` (created_at, reported_at, next_service_date)
- Unique identifiers used in lookups (asset_tag, serial_number, barcode, vendor_code)

---

## 6. Migration Strategy

- All schema changes go through **Drizzle ORM** migration files in `apps/api/drizzle/`
- Run `npx drizzle-kit push` in development for instant schema sync
- Run `npx drizzle-kit generate` + `npx drizzle-kit migrate` in production for tracked migrations
- Never modify migration files manually after they've been applied

---

## 7. Seed Data Structure

The `seed.ts` script creates:
1. One default hospital (BeWell Main Hospital, code `BMW`)
2. Default `super_admin` user: `admin@bewell.com` / `password123`
3. Sample asset categories (Imaging, ICU Equipment, OT Equipment)
4. Sample locations (ICU Ward A, OT Block 1, Radiology)

---

## 8. Backup Strategy

| Method | Schedule | Retention |
|---|---|---|
| PostgreSQL `pg_dump` | Daily at 02:00 UTC | 30 days |
| Point-in-time recovery (managed DB) | Continuous WAL archival | 7 days |
| R2 file versioning | On upload | 90 days |

> Recommendation: Use **Neon** (serverless Postgres) or **AWS RDS** with automated snapshots in production.
