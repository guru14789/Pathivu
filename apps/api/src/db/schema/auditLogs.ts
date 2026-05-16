import { pgTable, uuid, text, timestamp, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users.js';

export const auditActionEnum = pgEnum('audit_action', ['INSERT', 'UPDATE', 'DELETE']);

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  changed_by: uuid('changed_by').references(() => users.user_id),
  action: auditActionEnum('action').notNull(),
  table_name: text('table_name').notNull(),
  record_id: uuid('record_id').notNull(),
  old_values: jsonb('old_values'),
  new_values: jsonb('new_values'),
  ip_address: text('ip_address'),
  user_agent: text('user_agent'),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
