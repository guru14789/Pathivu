import { pgTable, uuid, varchar, text, timestamp, pgEnum, index } from 'drizzle-orm/pg-core';
import { assets } from './assets.js';
import { hospitals } from './hospitals.js';
import { users } from './users.js';

export const faultSeverityEnum = pgEnum('fault_severity', ['low', 'medium', 'high', 'critical']);
export const faultStatusEnum = pgEnum('fault_status', ['open', 'in_progress', 'resolved', 'closed']);

export const faultReports = pgTable('fault_reports', {
  fault_id: uuid('fault_id').primaryKey().defaultRandom(),
  asset_id: uuid('asset_id').references(() => assets.asset_id).notNull(),
  hospital_id: uuid('hospital_id').references(() => hospitals.hospital_id).notNull(),
  reported_by: uuid('reported_by').references(() => users.user_id),
  fault_type: varchar('fault_type', { length: 100 }).notNull(),
  description: text('description').notNull(),
  severity: faultSeverityEnum('severity').notNull(),
  photo_url: text('photo_url'),
  status: faultStatusEnum('status').default('open'),
  resolved_at: timestamp('resolved_at', { withTimezone: true }),
  resolved_by: uuid('resolved_by').references(() => users.user_id),
  resolution_notes: text('resolution_notes'),
  reported_at: timestamp('reported_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  assetIdx: index('fault_asset_idx').on(table.asset_id),
  hospitalIdx: index('fault_hospital_idx').on(table.hospital_id),
  statusIdx: index('fault_status_idx').on(table.status),
  severityIdx: index('fault_severity_idx').on(table.severity),
  reportedAtIdx: index('fault_reported_at_idx').on(table.reported_at),
}));
