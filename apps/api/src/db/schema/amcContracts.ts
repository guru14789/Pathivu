import { pgTable, uuid, date, decimal, integer, boolean, text, varchar, timestamp, index } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { vendors } from './vendors.js';
import { assets } from './assets.js';
import { assetCategories } from './assetCategories.js';
import { hospitals } from './hospitals.js';

export const amcContracts = pgTable('amc_contracts', {
  contract_id: uuid('contract_id').primaryKey().default(sql`gen_random_uuid()`),
  vendor_id: uuid('vendor_id').references(() => vendors.vendor_id).notNull(),
  hospital_id: uuid('hospital_id').references(() => hospitals.hospital_id).notNull(),
  asset_id: uuid('asset_id').references(() => assets.asset_id),
  category_id: uuid('category_id').references(() => assetCategories.category_id),
  contract_number: varchar('contract_number', { length: 100 }).unique(),
  start_date: date('start_date').notNull(),
  end_date: date('end_date').notNull(),
  contract_value: decimal('contract_value', { precision: 12, scale: 2 }),
  response_sla_hours: integer('response_sla_hours').default(4),
  document_url: text('document_url'),
  is_active: boolean('is_active').default(true),
  notes: text('notes'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  endDateIdx: index('amc_end_date_idx').on(table.end_date),
  isActiveIdx: index('amc_is_active_idx').on(table.is_active),
}));
