import { pgTable, uuid, varchar, text, decimal, timestamp, boolean } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const vendors = pgTable('vendors', {
  vendor_id: uuid('vendor_id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 150 }).notNull(),
  contact_person: varchar('contact_person', { length: 100 }),
  email: varchar('email', { length: 150 }),
  phone: varchar('phone', { length: 30 }),
  address: text('address'),
  gst_number: varchar('gst_number', { length: 20 }),
  vendor_code: varchar('vendor_code', { length: 20 }).unique(), // VND-0001 format
  performance_rating: decimal('performance_rating', { precision: 3, scale: 2 }).default('3.00'),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
