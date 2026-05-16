import { pgTable, uuid, text, timestamp, date } from 'drizzle-orm/pg-core';
import { assets } from './assets.js';
import { users } from './users.js';
import { locations } from './locations.js';

export const assetAssignments = pgTable('asset_assignments', {
  assignment_id: uuid('assignment_id').primaryKey().defaultRandom(),
  asset_id: uuid('asset_id').references(() => assets.asset_id).notNull(),
  assigned_to: uuid('assigned_to').references(() => users.user_id).notNull(),
  location_id: uuid('location_id').references(() => locations.location_id),
  assigned_by: uuid('assigned_by').references(() => users.user_id).notNull(),
  assigned_date: date('assigned_date').notNull(),
  return_date: date('return_date'),
  notes: text('notes'),
});
