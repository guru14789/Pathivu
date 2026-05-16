import { pgTable, uuid, varchar, text, timestamp, pgEnum, index, decimal, date } from 'drizzle-orm/pg-core';
import { assets } from './assets.js';
import { hospitals } from './hospitals.js';
import { users } from './users.js';
import { faultReports } from './faultReports.js';

export const maintenanceTypeEnum = pgEnum('maintenance_type', ['PPM', 'breakdown', 'calibration', 'inspection', 'AMC_service']);
export const maintenancePriorityEnum = pgEnum('maintenance_priority', ['P1', 'P2', 'P3']);
export const maintenanceStatusEnum = pgEnum('maintenance_status', ['open', 'in_progress', 'completed', 'cancelled']);

export const maintenanceLogs = pgTable('maintenance_logs', {
  log_id: uuid('log_id').primaryKey().defaultRandom(),
  asset_id: uuid('asset_id').references(() => assets.asset_id).notNull(),
  hospital_id: uuid('hospital_id').references(() => hospitals.hospital_id).notNull(),
  fault_id: uuid('fault_id').references(() => faultReports.fault_id),
  assigned_to: uuid('assigned_to').references(() => users.user_id),
  approved_by: uuid('approved_by').references(() => users.user_id),
  maintenance_type: maintenanceTypeEnum('maintenance_type').notNull(),
  priority: maintenancePriorityEnum('priority').default('P2'),
  status: maintenanceStatusEnum('status').default('open'),
  scheduled_date: date('scheduled_date'),
  completed_date: date('completed_date'),
  downtime_hours: decimal('downtime_hours', { precision: 6, scale: 2 }),
  cost: decimal('cost', { precision: 12, scale: 2 }),
  notes: text('notes'),
  technician_remarks: text('technician_remarks'),
  created_by: uuid('created_by').references(() => users.user_id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  assetIdx: index('maint_asset_idx').on(table.asset_id),
  hospitalIdx: index('maint_hospital_idx').on(table.hospital_id),
  statusIdx: index('maint_status_idx').on(table.status),
  priorityIdx: index('maint_priority_idx').on(table.priority),
}));
