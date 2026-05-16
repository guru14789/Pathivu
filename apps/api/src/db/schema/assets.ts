import { pgTable, uuid, varchar, text, timestamp, decimal, integer, boolean, pgEnum, index, jsonb } from 'drizzle-orm/pg-core';
import { hospitals } from './hospitals.js';
import { assetCategories } from './assetCategories.js';
import { locations } from './locations.js';
import { users } from './users.js';
import { vendors } from './vendors.js';

export const assetStatusEnum = pgEnum('asset_status', ['active', 'maintenance', 'condemned', 'transferred']);
export const assetConditionEnum = pgEnum('asset_condition', ['good', 'fair', 'poor', 'critical']);
export const depreciationMethodEnum = pgEnum('depreciation_method', ['SLM', 'WDV']);

export const assets = pgTable('assets', {
  asset_id: uuid('asset_id').primaryKey().defaultRandom(),
  hospital_id: uuid('hospital_id').references(() => hospitals.hospital_id).notNull(),
  category_id: uuid('category_id').references(() => assetCategories.category_id),
  location_id: uuid('location_id').references(() => locations.location_id),
  vendor_id: uuid('vendor_id').references(() => vendors.vendor_id), // Linked to vendors in Phase 4
  asset_tag: varchar('asset_tag', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 150 }).notNull(),
  serial_number: varchar('serial_number', { length: 100 }).unique(),
  model: varchar('model', { length: 100 }),
  manufacturer: varchar('manufacturer', { length: 100 }),
  purchase_date: timestamp('purchase_date'),
  purchase_cost: decimal('purchase_cost', { precision: 12, scale: 2 }),
  warranty_expiry: timestamp('warranty_expiry'),
  useful_life_years: integer('useful_life_years'),
  salvage_value: decimal('salvage_value', { precision: 12, scale: 2 }),
  depreciation_method: depreciationMethodEnum('depreciation_method'),
  status: assetStatusEnum('status').default('active'),
  condition: assetConditionEnum('condition').default('good'),
  is_critical: boolean('is_critical').default(false),
  photo_url: text('photo_url'),
  custom_attributes: jsonb('custom_attributes').default({}),
  created_by: uuid('created_by').references(() => users.user_id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  hospitalIdx: index('asset_hospital_idx').on(table.hospital_id),
  statusIdx: index('asset_status_idx').on(table.status),
  tagIdx: index('asset_tag_idx').on(table.asset_tag),
  serialIdx: index('asset_serial_idx').on(table.serial_number),
}));
