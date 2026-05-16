import { pgTable, uuid, varchar, date, text, pgEnum, boolean, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { assets } from './assets.js';
import { hospitals } from './hospitals.js';
import { users } from './users.js';

export const complianceStatusEnum = pgEnum('compliance_status', ['valid', 'expiring_soon', 'expired']);

export const complianceDocuments = pgTable('compliance_documents', {
  doc_id: uuid('doc_id').primaryKey().default(sql`gen_random_uuid()`),
  hospital_id: uuid('hospital_id').references(() => hospitals.hospital_id).notNull(),
  asset_id: uuid('asset_id').references(() => assets.asset_id),
  cert_type: varchar('cert_type', { length: 100 }).notNull(), // NABH | AERB | fire_NOC | calibration | electrical | biomedical_waste
  issued_by: varchar('issued_by', { length: 150 }),
  issued_date: date('issued_date'),
  expiry_date: date('expiry_date').notNull(),
  document_url: text('document_url'),
  status: complianceStatusEnum('status').default('valid'),
  alert_30_sent: boolean('alert_30_sent').default(false),
  alert_60_sent: boolean('alert_60_sent').default(false),
  notes: text('notes'),
  uploaded_by: uuid('uploaded_by').references(() => users.user_id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  expiryIdx: index('compliance_expiry_idx').on(table.expiry_date),
  hospitalIdx: index('compliance_hospital_idx').on(table.hospital_id),
  statusIdx: index('compliance_status_idx').on(table.status),
}));
