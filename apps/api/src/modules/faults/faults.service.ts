import { db } from '../../db/index.js';
import { faultReports, assets, maintenanceLogs, auditLogs, users, locations } from '../../db/schema/index.js';
import { eq, and, sql, desc, or, ilike } from 'drizzle-orm';
import { AppError, NotFoundError } from '../../lib/errors.js';
import { r2 } from '../../lib/r2.js';
import { emitToHospital } from '../../lib/socket.js';
import { sendFaultAlert } from '../../lib/mailer.js';
import { sendSMS } from '../../lib/sms.js';
import { v4 as uuidv4 } from 'uuid';
import { escalationQueue } from '../../lib/workers/workers.js';
import { logAudit } from '../../lib/audit.js';

export const faultsService = {
  async create(input: any, userId?: string, photo?: Buffer) {
    let asset;
    if (input.asset_id) {
      [asset] = await db.select().from(assets).where(eq(assets.asset_id, input.asset_id)).limit(1);
    } else if (input.asset_tag) {
      [asset] = await db.select().from(assets).where(eq(assets.asset_tag, input.asset_tag)).limit(1);
    }

    if (!asset) throw new NotFoundError('Asset not found');

    let photo_url = null;
    if (photo) {
      const key = `photos/${asset.hospital_id}/${asset.asset_id}/fault-${uuidv4()}.jpg`;
      photo_url = await r2.uploadBuffer(key, photo, 'image/jpeg');
    }

    const [fault] = await db.insert(faultReports).values({
      asset_id: asset.asset_id,
      hospital_id: asset.hospital_id,
      reported_by: userId || null, 
      fault_type: input.fault_type,
      description: input.description,
      severity: input.severity,
      photo_url,
    }).returning();

    // Update asset status if critical/high
    if (['critical', 'high'].includes(fault.severity)) {
      await db.update(assets).set({ status: 'maintenance' }).where(eq(assets.asset_id, asset.asset_id));
    }

    // Create maintenance log
    const priority = fault.severity === 'critical' ? 'P1' : (fault.severity === 'high' ? 'P2' : 'P3');
    const [maintLog] = await db.insert(maintenanceLogs).values({
      asset_id: asset.asset_id,
      hospital_id: asset.hospital_id,
      fault_id: fault.fault_id,
      maintenance_type: 'breakdown',
      priority,
      status: 'open',
      created_by: userId,
    }).returning();

    // Audit Log
    await logAudit({
      user_id: userId,
      action: 'INSERT',
      table_name: 'fault_reports',
      record_id: fault.fault_id,
      new_values: fault
    });

    // Enqueue faultEscalation job in BullMQ with 4h delay
    await escalationQueue.add('checkOverdueFaults', { fault_id: fault.fault_id }, {
      delay: 4 * 60 * 60 * 1000, // 4 hours
      jobId: `escalation-${fault.fault_id}`, 
    });

    // Emit Socket Event
    const reporter = userId ? (await db.select().from(users).where(eq(users.user_id, userId)).limit(1))[0] : { full_name: 'Anonymous' };
    const [assetLocation] = await db.select({ 
      building: locations.building, 
      floor: locations.floor, 
      room: locations.room_number,
      department: locations.department 
    })
      .from(locations)
      .where(eq(locations.location_id, asset.location_id || ''))
      .limit(1);

    emitToHospital(asset.hospital_id, 'fault:new', {
      fault_id: fault.fault_id,
      asset_tag: asset.asset_tag,
      asset_name: asset.name,
      severity: fault.severity,
      reported_by: reporter?.full_name,
      location: assetLocation ? `${assetLocation.building} (Floor: ${assetLocation.floor}, Room: ${assetLocation.room})` : 'Unknown',
      reported_at: fault.reported_at,
    });

    // Alerts for critical faults
    if (fault.severity === 'critical') {
      const admins = await db.select({ email: users.email, phone: users.phone })
        .from(users)
        .where(and(eq(users.hospital_id, asset.hospital_id), eq(users.role, 'branch_admin')));
      
      const adminEmails = admins.map(a => a.email);
      await sendFaultAlert({ fault, asset, reporter, adminEmails });

      const smsEnabled = process.env.ALERT_SMS_ENABLED === 'true';
      if (smsEnabled) {
        for (const admin of admins) {
          if (admin.phone) {
            await sendSMS(admin.phone, `CRITICAL FAULT: ${asset.asset_tag} (${asset.name}). Reported at ${fault.reported_at}.`);
          }
        }
      }
    }

    return { fault_id: fault.fault_id, status: 'reported', maintenance_log_id: maintLog.log_id };
  },

  async list(filters: any, scopedHospitalId: string | null) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const offset = (page - 1) * limit;

    let conditions = [];
    if (scopedHospitalId) conditions.push(eq(faultReports.hospital_id, scopedHospitalId));
    else if (filters.hospital_id) conditions.push(eq(faultReports.hospital_id, filters.hospital_id));

    if (filters.status) conditions.push(eq(faultReports.status, filters.status));
    if (filters.severity) conditions.push(eq(faultReports.severity, filters.severity));
    if (filters.asset_id) conditions.push(eq(faultReports.asset_id, filters.asset_id));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.select({
      fault: faultReports,
      asset_tag: assets.asset_tag,
      asset_name: assets.name,
      reported_by_name: users.full_name,
      location: sql<string>`concat(${locations.building}, ' - ', ${locations.floor}, ' - ', ${locations.department})`,
    })
    .from(faultReports)
    .innerJoin(assets, eq(faultReports.asset_id, assets.asset_id))
    .leftJoin(users, eq(faultReports.reported_by, users.user_id))
    .leftJoin(locations, eq(assets.location_id, locations.location_id))
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(faultReports.reported_at));

    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(faultReports)
      .where(where);

    return { data, total: Number(countResult.count), page, limit };
  },

  async getById(id: string) {
    const [result] = await db.select({
      fault: faultReports,
      asset: assets,
      maintLog: maintenanceLogs,
    })
    .from(faultReports)
    .innerJoin(assets, eq(faultReports.asset_id, assets.asset_id))
    .leftJoin(maintenanceLogs, eq(faultReports.fault_id, maintenanceLogs.fault_id))
    .where(eq(faultReports.fault_id, id))
    .limit(1);

    if (!result) throw new NotFoundError('Fault not found');
    return result;
  },

  async update(id: string, updateData: any, userId: string) {
    const [oldFault] = await db.select().from(faultReports).where(eq(faultReports.fault_id, id)).limit(1);
    if (!oldFault) throw new NotFoundError('Fault not found');

    const set: any = { ...updateData };
    if (updateData.status === 'resolved') {
      set.resolved_at = new Date();
      set.resolved_by = userId;
    }

    const [fault] = await db.update(faultReports)
      .set(set)
      .where(eq(faultReports.fault_id, id))
      .returning();

    if (fault.status === 'resolved') {
      // Complete linked maintenance log
      await db.update(maintenanceLogs)
        .set({ status: 'completed', completed_date: sql`CURRENT_DATE` })
        .where(eq(maintenanceLogs.fault_id, id));

      // Check if other open faults exist for this asset
      const [otherOpen] = await db.select()
        .from(faultReports)
        .where(and(eq(faultReports.asset_id, fault.asset_id), eq(faultReports.status, 'open')))
        .limit(1);

      if (!otherOpen) {
        await db.update(assets).set({ status: 'active' }).where(eq(assets.asset_id, fault.asset_id));
      }
    }

    emitToHospital(fault.hospital_id, 'fault:updated', {
      fault_id: fault.fault_id,
      status: fault.status,
      updated_by: userId,
    });

    await logAudit({
      user_id: userId,
      action: 'UPDATE',
      table_name: 'fault_reports',
      record_id: id,
      old_values: oldFault,
      new_values: fault
    });

    return fault;
  }
};
