import { db } from '../../db/index.js';
import { maintenanceLogs, assets, users, auditLogs, locations } from '../../db/schema/index.js';
import { eq, and, sql, desc } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';
import { NotFoundError } from '../../lib/errors.js';
import { logAudit } from '../../lib/audit.js';
import { emitToHospital } from '../../lib/socket.js';

export const maintenanceService = {
  async list(filters: any, scopedHospitalId: string | null) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const offset = (page - 1) * limit;

    let conditions = [];
    if (scopedHospitalId) conditions.push(eq(maintenanceLogs.hospital_id, scopedHospitalId));
    else if (filters.hospital_id) conditions.push(eq(maintenanceLogs.hospital_id, filters.hospital_id));

    if (filters.status) conditions.push(eq(maintenanceLogs.status, filters.status));
    if (filters.priority) conditions.push(eq(maintenanceLogs.priority, filters.priority));
    if (filters.assigned_to) conditions.push(eq(maintenanceLogs.assigned_to, filters.assigned_to));
    if (filters.type) conditions.push(eq(maintenanceLogs.maintenance_type, filters.type));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const assignedToUser = alias(users, 'assigned_to_user');
    const approvedByUser = alias(users, 'approved_by_user');

    const data = await db.select({
      log: maintenanceLogs,
      asset_tag: assets.asset_tag,
      asset_name: assets.name,
      assigned_to_name: assignedToUser.full_name,
      approved_by_name: approvedByUser.full_name,
    })
    .from(maintenanceLogs)
    .innerJoin(assets, eq(maintenanceLogs.asset_id, assets.asset_id))
    .leftJoin(assignedToUser, eq(maintenanceLogs.assigned_to, assignedToUser.user_id))
    .leftJoin(approvedByUser, eq(maintenanceLogs.approved_by, approvedByUser.user_id))
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(maintenanceLogs.created_at));

    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(maintenanceLogs)
      .where(where);

    return { data, total: Number(countResult.count), page, limit };
  },

  async create(input: any, userId: string) {
    const [log] = await db.insert(maintenanceLogs).values({
      ...input,
      created_by: userId,
    }).returning();

    await logAudit({
      user_id: userId,
      action: 'INSERT',
      table_name: 'maintenance_logs',
      record_id: log.log_id,
      new_values: log
    });

    return log;
  },

  async getById(id: string) {
    const [result] = await db.select({
      log: maintenanceLogs,
      asset: assets,
      location: locations,
      assigned_to_name: users.full_name,
    })
    .from(maintenanceLogs)
    .innerJoin(assets, eq(maintenanceLogs.asset_id, assets.asset_id))
    .leftJoin(locations, eq(assets.location_id, locations.location_id))
    .leftJoin(users, eq(maintenanceLogs.assigned_to, users.user_id))
    .where(eq(maintenanceLogs.log_id, id))
    .limit(1);

    if (!result) throw new NotFoundError('Maintenance log not found');
    return result;
  },

  async update(id: string, updateData: any, userId: string) {
    const [oldLog] = await db.select().from(maintenanceLogs).where(eq(maintenanceLogs.log_id, id)).limit(1);
    if (!oldLog) throw new NotFoundError('Maintenance log not found');

    const set: any = { ...updateData, updated_at: new Date() };
    if (updateData.status === 'completed') {
      set.completed_date = sql`CURRENT_DATE`;
    }

    const [log] = await db.update(maintenanceLogs)
      .set(set)
      .where(eq(maintenanceLogs.log_id, id))
      .returning();

    if (log.status === 'completed' && updateData.condition) {
      await db.update(assets).set({ condition: updateData.condition }).where(eq(assets.asset_id, log.asset_id));
    }

    const [asset] = await db.select({ asset_tag: assets.asset_tag }).from(assets).where(eq(assets.asset_id, log.asset_id)).limit(1);

    emitToHospital(log.hospital_id, 'maintenance:updated', {
      log_id: log.log_id,
      status: log.status,
      asset_tag: asset?.asset_tag,
    });

    await logAudit({
      user_id: userId,
      action: 'UPDATE',
      table_name: 'maintenance_logs',
      record_id: id,
      old_values: oldLog,
      new_values: log
    });

    return log;
  }
};
