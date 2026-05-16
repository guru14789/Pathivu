import { pgTable, uuid, varchar, timestamp } from 'drizzle-orm/pg-core';
import { hospitals } from './hospitals.js';

export const locations = pgTable('locations', {
  location_id: uuid('location_id').primaryKey().defaultRandom(),
  hospital_id: uuid('hospital_id').references(() => hospitals.hospital_id).notNull(),
  building: varchar('building', { length: 100 }),
  floor: varchar('floor', { length: 20 }),
  room_number: varchar('room_number', { length: 20 }),
  department: varchar('department', { length: 100 }).notNull(),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
