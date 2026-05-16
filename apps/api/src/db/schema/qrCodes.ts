import { pgTable, uuid, varchar, text, timestamp, boolean, integer, pgEnum } from 'drizzle-orm/pg-core';
import { assets } from './assets.js';
import { users } from './users.js';

export const qrFormatEnum = pgEnum('qr_format', ['qr', 'barcode_code128', 'barcode_ean13']);

export const qrCodes = pgTable('qr_codes', {
  qr_id: uuid('qr_id').primaryKey().defaultRandom(),
  asset_id: uuid('asset_id').references(() => assets.asset_id).notNull(),
  format: qrFormatEnum('format'),
  r2_key: text('r2_key').notNull(),
  r2_url: text('r2_url').notNull(),
  is_active: boolean('is_active').default(true),
  generated_by: uuid('generated_by').references(() => users.user_id).notNull(),
  generated_at: timestamp('generated_at', { withTimezone: true }).defaultNow(),
  print_count: integer('print_count').default(0),
});
