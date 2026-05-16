import { pgTable, uuid, varchar, integer, decimal, boolean, timestamp, index, text } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { hospitals } from './hospitals.js';
import { vendors } from './vendors.js';

export const spareParts = pgTable('spare_parts', {
  part_id: uuid('part_id').primaryKey().default(sql`gen_random_uuid()`),
  hospital_id: uuid('hospital_id').references(() => hospitals.hospital_id).notNull(),
  vendor_id: uuid('vendor_id').references(() => vendors.vendor_id),
  name: varchar('name', { length: 150 }).notNull(),
  part_number: varchar('part_number', { length: 100 }),
  barcode: varchar('barcode', { length: 100 }).unique(),
  unit: varchar('unit', { length: 30 }).default('piece'),
  stock_quantity: integer('stock_quantity').notNull().default(0),
  reorder_threshold: integer('reorder_threshold').notNull().default(5),
  unit_cost: decimal('unit_cost', { precision: 10, scale: 2 }),
  location_notes: text('location_notes'), // e.g. 'Store room B, shelf 3'
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  hospitalIdx: index('spare_hospital_idx').on(table.hospital_id),
  barcodeIdx: index('spare_barcode_idx').on(table.barcode),
}));
