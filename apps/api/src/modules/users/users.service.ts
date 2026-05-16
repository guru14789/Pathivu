import bcrypt from 'bcryptjs';
import { db } from '../../db/index.js';
import { users, auditLogs } from '../../db/schema/index.js';
import { eq, and, like, sql, or } from 'drizzle-orm';
import { NotFoundError } from '../../lib/errors.js';
import { logAudit } from '../../lib/audit.js';

export const usersService = {
  async getAll(filters: any, scopedHospitalId?: string | null) {
    const { role, is_active, hospital_id, search, page, limit } = filters;
    const offset = (page - 1) * limit;

    let whereClause = [];
    if (scopedHospitalId) {
      whereClause.push(eq(users.hospital_id, scopedHospitalId));
    } else if (hospital_id) {
      whereClause.push(eq(users.hospital_id, hospital_id));
    }

    if (role) {
      whereClause.push(eq(users.role, role));
    }
    if (is_active !== undefined) {
      whereClause.push(eq(users.is_active, is_active));
    }
    if (search) {
      whereClause.push(or(
        like(users.full_name, `%${search}%`),
        like(users.email, `%${search}%`)
      ));
    }

    const data = await db.select({
      user_id: users.user_id,
      hospital_id: users.hospital_id,
      full_name: users.full_name,
      email: users.email,
      role: users.role,
      department: users.department,
      is_active: users.is_active,
      last_login: users.last_login,
      created_at: users.created_at,
    })
      .from(users)
      .where(and(...whereClause))
      .limit(limit)
      .offset(offset);

    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(...whereClause));

    return { data, total: Number(count), page, limit };
  },

  async create(data: any, createdBy?: string, ipAddress?: string, userAgent?: string) {
    const { password, ...userData } = data;
    const password_hash = await bcrypt.hash(password, 12);
    
    const [user] = await db.insert(users).values({
      ...userData,
      password_hash,
      created_by: createdBy,
    }).returning();

    await logAudit({
      user_id: createdBy,
      action: 'INSERT',
      table_name: 'users',
      record_id: user.user_id,
      new_values: user,
      ip_address: ipAddress,
      user_agent: userAgent
    });

    const { password_hash: _, ...userWithoutHash } = user;
    return userWithoutHash;
  },

  async update(id: string, data: any, changedBy?: string, ipAddress?: string) {
    const [oldUser] = await db.select().from(users).where(eq(users.user_id, id)).limit(1);
    if (!oldUser) throw new NotFoundError('User not found');

    const { password, ...userData } = data;
    const updateData: any = { ...userData, updated_at: new Date() };
    
    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 12);
    }

    const [user] = await db.update(users)
      .set(updateData)
      .where(eq(users.user_id, id))
      .returning();

    await logAudit({
      user_id: changedBy,
      action: 'UPDATE',
      table_name: 'users',
      record_id: id,
      old_values: oldUser,
      new_values: user,
      ip_address: ipAddress
    });

    const { password_hash: _, ...userWithoutHash } = user;
    return userWithoutHash;
  },

  async softDelete(id: string, changedBy?: string, ipAddress?: string) {
    const [user] = await db.update(users)
      .set({ is_active: false, updated_at: new Date() })
      .where(eq(users.user_id, id))
      .returning();
    
    if (!user) throw new NotFoundError('User not found');

    await logAudit({
      user_id: changedBy,
      action: 'DELETE',
      table_name: 'users',
      record_id: id,
      new_values: { is_active: false },
      ip_address: ipAddress
    });

    return { success: true };
  }
};
