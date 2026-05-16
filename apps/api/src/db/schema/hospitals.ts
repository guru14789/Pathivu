import { pgTable, uuid, varchar, text, integer, boolean, timestamp } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const hospitals = pgTable('hospitals', {
  hospital_id: uuid('hospital_id').primaryKey().default(sql`gen_random_uuid()`),
  name: varchar('name', { length: 150 }).notNull(),
  code: varchar('code', { length: 3 }).notNull(), // Added as per requirement (e.g. CHN)
  city: varchar('city', { length: 100 }),
  address: text('address'),
  contact_person: varchar('contact_person', { length: 100 }),
  phone: varchar('phone', { length: 30 }),
  bed_count: integer('bed_count').default(200),
  is_active: boolean('is_active').default(true),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
