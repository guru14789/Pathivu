import { db } from '../../db/index.js';
import { assets, hospitals, assetCategories, locations, users, auditLogs, assetAssignments, qrCodes, faultReports, maintenanceLogs } from '../../db/schema/index.js';
import { eq, and, sql, desc, or, ilike } from 'drizzle-orm';
import { NotFoundError, AppError, ValidationError } from '../../lib/errors.js';
import { logAudit } from '../../lib/audit.js';
import { r2 } from '../../lib/r2.js';

export const assetService = {
  async generateAssetTag(hospitalId: string, categoryId: string): Promise<string> {
    const [hospital] = await db.select().from(hospitals).where(eq(hospitals.hospital_id, hospitalId)).limit(1);
    const [category] = await db.select().from(assetCategories).where(eq(assetCategories.category_id, categoryId)).limit(1);
    
    if (!hospital || !category) throw new ValidationError('Invalid hospital or category ID');

    const [{ count }] = await db.select({ count: sql<number>`count(*)` })
      .from(assets)
      .where(and(eq(assets.hospital_id, hospitalId), eq(assets.category_id, categoryId)));

    const nextNumber = (Number(count) + 1).toString().padStart(4, '0');
    return `BW-${hospital.code}-${category.code}-${nextNumber}`;
  },

  async list(filters: any, scopedHospitalId: string | null) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const offset = (page - 1) * limit;

    let conditions = [];
    if (scopedHospitalId) conditions.push(eq(assets.hospital_id, scopedHospitalId));
    else if (filters.hospital_id) conditions.push(eq(assets.hospital_id, filters.hospital_id));

    if (filters.category_id) conditions.push(eq(assets.category_id, filters.category_id));
    if (filters.status) conditions.push(eq(assets.status, filters.status));
    if (filters.condition) conditions.push(eq(assets.condition, filters.condition));
    if (filters.is_critical !== undefined) conditions.push(eq(assets.is_critical, filters.is_critical === 'true'));
    
    if (filters.search) {
      conditions.push(or(
        ilike(assets.name, `%${filters.search}%`),
        ilike(assets.asset_tag, `%${filters.search}%`),
        ilike(assets.serial_number, `%${filters.search}%`)
      ));
    }

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.select({
      asset: assets,
      categoryName: assetCategories.name,
      location: sql<string>`concat(${locations.building}, ' - ', ${locations.floor}, ' - ', ${locations.department})`,
    })
    .from(assets)
    .leftJoin(assetCategories, eq(assets.category_id, assetCategories.category_id))
    .leftJoin(locations, eq(assets.location_id, locations.location_id))
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(assets.created_at));

    const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(assets).where(where);

    return { data, total: Number(count), page, limit };
  },

  async create(input: any, userId: string, photo?: Buffer) {
    const asset_tag = await this.generateAssetTag(input.hospital_id, input.category_id);
    
    let photo_url = null;
    if (photo) {
      const key = `photos/${input.hospital_id}/${asset_tag}/${Date.now()}.jpg`;
      photo_url = await r2.uploadBuffer(key, photo, 'image/jpeg');
    }

    const [asset] = await db.insert(assets).values({
      ...input,
      asset_tag,
      photo_url,
      created_by: userId,
    }).returning();

    // Audit Log
    await logAudit({
      user_id: userId,
      action: 'INSERT',
      table_name: 'assets',
      record_id: asset.asset_id,
      new_values: asset
    });

    return asset;
  },

  async getById(id: string) {
    const [result] = await db.select({
      asset: assets,
      categoryName: assetCategories.name,
      location: sql<string>`concat(${locations.building}, ' - ', ${locations.floor}, ' - ', ${locations.department})`,
    })
    .from(assets)
    .leftJoin(assetCategories, eq(assets.category_id, assetCategories.category_id))
    .leftJoin(locations, eq(assets.location_id, locations.location_id))
    .where(eq(assets.asset_id, id))
    .limit(1);

    if (!result) throw new NotFoundError('Asset not found');

    const [assignment] = await db.select({
      assignedTo: users.full_name,
      assignedDate: assetAssignments.assigned_date,
    })
    .from(assetAssignments)
    .leftJoin(users, eq(assetAssignments.assigned_to, users.user_id))
    .where(and(eq(assetAssignments.asset_id, id), sql`${assetAssignments.return_date} IS NULL`))
    .limit(1);

    const [activeQr] = await db.select().from(qrCodes).where(and(eq(qrCodes.asset_id, id), eq(qrCodes.is_active, true))).limit(1);

    const warrantyStatus = result.asset.warranty_expiry 
      ? (new Date(result.asset.warranty_expiry).getTime() < Date.now() ? 'expired' : 
         new Date(result.asset.warranty_expiry).getTime() < Date.now() + 60 * 24 * 60 * 60 * 1000 ? 'expiring_soon' : 'valid')
      : 'n/a';

    return { 
      ...result, 
      current_assignment: assignment || null,
      active_qr: activeQr || null,
      warranty_status: warrantyStatus
    };
  },

  async update(id: string, input: any, userId: string) {
    // Prevent sensitive field changes
    const { asset_tag, hospital_id, serial_number, ...updates } = input;

    const [oldAsset] = await db.select().from(assets).where(eq(assets.asset_id, id)).limit(1);
    if (!oldAsset) throw new NotFoundError('Asset not found');

    const [asset] = await db.update(assets)
      .set({ ...updates, updated_at: new Date() })
      .where(eq(assets.asset_id, id))
      .returning();

    await logAudit({
      user_id: userId,
      action: 'UPDATE',
      table_name: 'assets',
      record_id: id,
      old_values: oldAsset,
      new_values: asset
    });

    return asset;
  },

  async softDelete(id: string, userId: string) {
    const [asset] = await db.update(assets)
      .set({ status: 'condemned', updated_at: new Date() })
      .where(eq(assets.asset_id, id))
      .returning();

    await logAudit({
      user_id: userId,
      action: 'UPDATE',
      table_name: 'assets',
      record_id: id,
      old_values: { status: 'active' },
      new_values: { status: 'condemned' }
    });

    return asset;
  },

  async assign(id: string, input: any, userId: string) {
    // 1. Close current assignment if any
    await db.update(assetAssignments)
      .set({ return_date: new Date().toISOString() })
      .where(and(eq(assetAssignments.asset_id, id), sql`${assetAssignments.return_date} IS NULL`));

    // 2. Create new assignment
    const [assignment] = await db.insert(assetAssignments).values({
      asset_id: id,
      assigned_to: input.assigned_to,
      location_id: input.location_id,
      assigned_by: userId,
      assigned_date: input.assigned_date,
      notes: input.notes
    }).returning();

    await logAudit({
      user_id: userId,
      action: 'INSERT',
      table_name: 'asset_assignments',
      record_id: assignment.assignment_id,
      new_values: assignment
    });

    return assignment;
  },

  async unassign(id: string, userId: string) {
    const [assignment] = await db.update(assetAssignments)
      .set({ return_date: new Date().toISOString() })
      .where(and(eq(assetAssignments.asset_id, id), sql`${assetAssignments.return_date} IS NULL`))
      .returning();

    if (assignment) {
      await logAudit({
        user_id: userId,
        action: 'UPDATE',
        table_name: 'asset_assignments',
        record_id: assignment.assignment_id,
        new_values: { return_date: assignment.return_date }
      });
    }

    return assignment;
  },

  async getAssignments(id: string) {
    return await db.select({
      assignment: assetAssignments,
      assignedTo: users.full_name,
      assignedBy: users.full_name, // Should probably join twice for clarity
    })
    .from(assetAssignments)
    .leftJoin(users, eq(assetAssignments.assigned_to, users.user_id))
    .where(eq(assetAssignments.asset_id, id))
    .orderBy(desc(assetAssignments.assigned_date));
  },

  async getHistory(id: string) {
    return await db.select({
      log: auditLogs,
      userName: users.full_name,
    })
    .from(auditLogs)
    .leftJoin(users, eq(auditLogs.changed_by, users.user_id))
    .where(and(eq(auditLogs.table_name, 'assets'), eq(auditLogs.record_id, id)))
    .limit(100)
    .orderBy(desc(auditLogs.created_at));
  },

  async getFaults(id: string) {
    return await db.select({
      fault: faultReports,
      reportedBy: users.full_name,
    })
    .from(faultReports)
    .leftJoin(users, eq(faultReports.reported_by, users.user_id))
    .where(eq(faultReports.asset_id, id))
    .orderBy(desc(faultReports.reported_at));
  },

  async getMaintenance(id: string) {
    return await db.select({
      log: maintenanceLogs,
      technician: users.full_name,
    })
    .from(maintenanceLogs)
    .leftJoin(users, eq(maintenanceLogs.assigned_to, users.user_id))
    .where(eq(maintenanceLogs.asset_id, id))
    .orderBy(desc(maintenanceLogs.created_at));
  }
};
