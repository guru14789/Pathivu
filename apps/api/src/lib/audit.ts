import { db } from '../db/index.js';
import { auditLogs } from '../db/schema/index.js';
import { logger } from './logger.js';

export async function logAudit({
  user_id,
  action,
  table_name,
  record_id,
  old_values,
  new_values,
  ip_address,
  user_agent
}: any) {
  try {
    await db.insert(auditLogs).values({
      changed_by: user_id,
      action: action as any,
      table_name,
      record_id,
      old_values,
      new_values,
      ip_address,
      user_agent
    });
  } catch (err) {
    logger.error('Failed to write audit log:', err);
  }
}
