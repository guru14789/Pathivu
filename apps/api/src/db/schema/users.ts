import { pgTable, uuid, varchar, text, boolean, timestamp, pgEnum, AnyPgColumn } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { hospitals } from './hospitals.js';

export const roleEnum = pgEnum('role', ['super_admin', 'branch_admin', 'supervisor', 'technician', 'auditor', 'vendor']);

export const users = pgTable('users', {
  user_id: uuid('user_id').primaryKey().default(sql`gen_random_uuid()`),
  hospital_id: uuid('hospital_id').references(() => hospitals.hospital_id),
  full_name: varchar('full_name', { length: 150 }).notNull(),
  email: varchar('email', { length: 150 }).unique().notNull(),
  phone: varchar('phone', { length: 20 }),
  password_hash: text('password_hash').notNull(),
  role: roleEnum('role').notNull(),
  department: varchar('department', { length: 100 }),
  is_active: boolean('is_active').default(true),
  created_by: uuid('created_by').references((): AnyPgColumn => users.user_id),
  last_login: timestamp('last_login', { withTimezone: true }),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
  updated_at: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});
