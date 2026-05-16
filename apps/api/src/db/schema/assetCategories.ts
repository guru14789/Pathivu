import { pgTable, uuid, varchar, text, timestamp } from 'drizzle-orm/pg-core';
import { hospitals } from './hospitals.js';

export const assetCategories = pgTable('asset_categories', {
  category_id: uuid('category_id').primaryKey().defaultRandom(),
  hospital_id: uuid('hospital_id').references(() => hospitals.hospital_id),
  name: varchar('name', { length: 100 }).notNull(),
  code: varchar('code', { length: 3 }).notNull(), // Added as per requirement
  description: text('description'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
