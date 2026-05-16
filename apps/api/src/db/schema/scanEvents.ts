import { pgTable, uuid, varchar, text, timestamp, decimal, pgEnum, index } from 'drizzle-orm/pg-core';
import { assets } from './assets.js';
import { users } from './users.js';

export const scanActionEnum = pgEnum('scan_action', ['viewed', 'fault_logged', 'condition_updated', 'job_card_created']);

export const scanEvents = pgTable('scan_events', {
  scan_id: uuid('scan_id').primaryKey().defaultRandom(),
  asset_id: uuid('asset_id').references(() => assets.asset_id).notNull(),
  scanned_by: uuid('scanned_by').references(() => users.user_id),
  scanned_at: timestamp('scanned_at', { withTimezone: true }).defaultNow().notNull(),
  ip_address: varchar('ip_address', { length: 50 }),
  user_agent: text('user_agent'),
  gps_lat: decimal('gps_lat', { precision: 9, scale: 6 }),
  gps_lng: decimal('gps_lng', { precision: 9, scale: 6 }),
  action_taken: scanActionEnum('action_taken'),
}, (table) => ({
  assetIdx: index('scan_asset_idx').on(table.asset_id),
  atIdx: index('scan_at_idx').on(table.scanned_at),
}));
