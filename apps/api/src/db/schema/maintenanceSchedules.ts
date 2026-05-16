import { pgTable, uuid, timestamp, pgEnum, index, boolean, date } from 'drizzle-orm/pg-core';
import { assets } from './assets.js';
import { hospitals } from './hospitals.js';
import { users } from './users.js';

export const scheduleTypeEnum = pgEnum('schedule_type', ['PPM', 'calibration', 'statutory_inspection']);
export const frequencyEnum = pgEnum('frequency', ['weekly', 'monthly', 'quarterly', 'biannual', 'annual']);

export const maintenanceSchedules = pgTable('maintenance_schedules', {
  schedule_id: uuid('schedule_id').primaryKey().defaultRandom(),
  asset_id: uuid('asset_id').references(() => assets.asset_id).notNull(),
  hospital_id: uuid('hospital_id').references(() => hospitals.hospital_id).notNull(),
  schedule_type: scheduleTypeEnum('schedule_type').notNull(),
  frequency: frequencyEnum('frequency').notNull(),
  last_service_date: date('last_service_date'),
  next_service_date: date('next_service_date').notNull(),
  alert_30_sent: boolean('alert_30_sent').default(false),
  alert_60_sent: boolean('alert_60_sent').default(false),
  is_active: boolean('is_active').default(true),
  created_by: uuid('created_by').references(() => users.user_id),
  created_at: timestamp('created_at', { withTimezone: true }).defaultNow(),
}, (table) => ({
  nextServiceIdx: index('sched_next_service_idx').on(table.next_service_date),
  isActiveIdx: index('sched_is_active_idx').on(table.is_active),
}));
