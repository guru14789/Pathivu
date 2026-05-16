import { db } from '../../db/index.js';
import { hospitals, auditLogs } from '../../db/schema/index.js';
import { eq, like, and, sql } from 'drizzle-orm';
import { NotFoundError } from '../../lib/errors.js';
import { logAudit } from '../../lib/audit.js';

export const hospitalsService = {
  async getAll(filters: any, scopedHospitalId?: string | null) {
    const { search, is_active, page, limit } = filters;
    const offset = (page - 1) * limit;

    let whereClause = [];
    if (scopedHospitalId) {
      whereClause.push(eq(hospitals.hospital_id, scopedHospitalId));
    }
    if (search) {
      whereClause.push(like(hospitals.name, `%${search}%`));
    }
    if (is_active !== undefined) {
      whereClause.push(eq(hospitals.is_active, is_active));
    }

    const data = await db.select()
      .from(hospitals)
      .where(and(...whereClause))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(hospitals)
      .where(and(...whereClause));

    return { data, total: Number(count), page, limit };
  },

  async create(data: any, changedBy?: string, ipAddress?: string) {
    const [hospital] = await db.insert(hospitals).values(data).returning();
    
    await logAudit({
      user_id: changedBy,
      action: 'INSERT',
      table_name: 'hospitals',
      record_id: hospital.hospital_id,
      new_values: hospital,
      ip_address: ipAddress
    });

    return hospital;
  },

  async update(id: string, data: any, changedBy?: string, ipAddress?: string) {
    const [oldHospital] = await db.select().from(hospitals).where(eq(hospitals.hospital_id, id)).limit(1);
    if (!oldHospital) throw new NotFoundError('Hospital not found');

    const [hospital] = await db.update(hospitals)
      .set({ ...data, updated_at: new Date() })
      .where(eq(hospitals.hospital_id, id))
      .returning();
    
    await logAudit({
      user_id: changedBy,
      action: 'UPDATE',
      table_name: 'hospitals',
      record_id: id,
      old_values: oldHospital,
      new_values: hospital,
      ip_address: ipAddress
    });

    return hospital;
  }
};
