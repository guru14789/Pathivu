import { db } from '../../db/index.js';
import { maintenanceSchedules, assets, auditLogs } from '../../db/schema/index.js';
import { eq, and, sql, lte, gt } from 'drizzle-orm';
import { NotFoundError } from '../../lib/errors.js';
import { logAudit } from '../../lib/audit.js';

export const schedulesService = {
  calculateNextDate(lastDate: Date, frequency: string): Date {
    const next = new Date(lastDate);
    switch (frequency) {
      case 'weekly': next.setDate(next.getDate() + 7); break;
      case 'monthly': next.setMonth(next.getMonth() + 1); break;
      case 'quarterly': next.setMonth(next.getMonth() + 3); break;
      case 'biannual': next.setMonth(next.getMonth() + 6); break;
      case 'annual': next.setFullYear(next.getFullYear() + 1); break;
    }
    return next;
  },

  async list(filters: any, scopedHospitalId: string | null) {
    let conditions = [];
    if (scopedHospitalId) conditions.push(eq(maintenanceSchedules.hospital_id, scopedHospitalId));
    else if (filters.hospital_id) conditions.push(eq(maintenanceSchedules.hospital_id, filters.hospital_id));

    if (filters.type) conditions.push(eq(maintenanceSchedules.schedule_type, filters.type));
    if (filters.overdue === 'true') {
      conditions.push(lte(maintenanceSchedules.next_service_date, sql`CURRENT_DATE`));
    } else if (filters.upcoming_days) {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + Number(filters.upcoming_days));
      conditions.push(and(
        gt(maintenanceSchedules.next_service_date, sql`CURRENT_DATE`),
        lte(maintenanceSchedules.next_service_date, futureDate.toISOString().split('T')[0])
      ));
    }

    conditions.push(eq(maintenanceSchedules.is_active, true));

    const where = and(...conditions);

    const data = await db.select({
      schedule: maintenanceSchedules,
      asset: assets,
      days_until_due: sql<number>`next_service_date - CURRENT_DATE`,
    })
    .from(maintenanceSchedules)
    .innerJoin(assets, eq(maintenanceSchedules.asset_id, assets.asset_id))
    .where(where);

    return data;
  },

  async create(input: any, userId: string) {
    const next_service_date = this.calculateNextDate(
      new Date(input.last_service_date || new Date()),
      input.frequency
    );

    const [schedule] = await db.insert(maintenanceSchedules).values({
      ...input,
      next_service_date: next_service_date.toISOString().split('T')[0],
      created_by: userId,
    }).returning();

    await logAudit({
      user_id: userId,
      action: 'CREATE',
      resource_type: 'maintenance_schedules',
      resource_id: schedule.schedule_id,
      new_value: schedule
    });

    return schedule;
  },

  async update(id: string, updateData: any, userId: string) {
    const [oldSched] = await db.select().from(maintenanceSchedules).where(eq(maintenanceSchedules.schedule_id, id)).limit(1);
    if (!oldSched) throw new NotFoundError('Schedule not found');

    let set = { ...updateData };
    if (updateData.last_service_date) {
      const nextDate = this.calculateNextDate(new Date(updateData.last_service_date), oldSched.frequency);
      set.next_service_date = nextDate.toISOString().split('T')[0];
      set.alert_30_sent = false;
      set.alert_60_sent = false;
    }

    const [schedule] = await db.update(maintenanceSchedules)
      .set(set)
      .where(eq(maintenanceSchedules.schedule_id, id))
      .returning();

    await logAudit({
      user_id: userId,
      action: 'UPDATE',
      resource_type: 'maintenance_schedules',
      resource_id: id,
      old_value: oldSched,
      new_value: schedule
    });

    return schedule;
  },

  async softDelete(id: string, userId: string) {
    const [schedule] = await db.update(maintenanceSchedules)
      .set({ is_active: false })
      .where(eq(maintenanceSchedules.schedule_id, id))
      .returning();
    
    if (schedule) {
      await logAudit({
        user_id: userId,
        action: 'DELETE',
        resource_type: 'maintenance_schedules',
        resource_id: id,
        new_value: { is_active: false }
      });
    }

    return { success: true };
  }
};
