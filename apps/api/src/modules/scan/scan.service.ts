import { db } from '../../db/index.js';
import { assets, assetCategories, locations, scanEvents, users, maintenanceLogs, faultReports } from '../../db/schema/index.js';
import { eq, and, desc, sql } from 'drizzle-orm';
import { NotFoundError } from '../../lib/errors.js';
import { emitToHospital } from '../../lib/socket.js';

export const scanService = {
  async getByTag(tag: string, user: any | null, meta: { ip?: string, ua?: string, lat?: string, lng?: string }) {
    const [result] = await db.select({
      asset: assets,
      categoryName: assetCategories.name,
      location: sql<string>`concat(${locations.building}, ' - ', ${locations.floor}, ' - ', ${locations.department})`,
    })
    .from(assets)
    .leftJoin(assetCategories, eq(assets.category_id, assetCategories.category_id))
    .leftJoin(locations, eq(assets.location_id, locations.location_id))
    .where(eq(assets.asset_tag, tag))
    .limit(1);

    if (!result) throw new NotFoundError('Asset not found');

    // Log event
    await db.insert(scanEvents).values({
      asset_id: result.asset.asset_id,
      scanned_by: user?.user_id || null,
      ip_address: meta.ip,
      user_agent: meta.ua,
      gps_lat: meta.lat ? sql`${meta.lat}` : null,
      gps_lng: meta.lng ? sql`${meta.lng}` : null,
      action_taken: 'viewed',
    });

    // Emit socket event (real-time dashboard)
    emitToHospital(result.asset.hospital_id, 'scan:new', {
      asset_tag: result.asset.asset_tag,
      scanned_by: user?.full_name || 'Public',
      scanned_at: new Date(),
      hospital_id: result.asset.hospital_id,
    });

    // Role-aware response
    const role = user?.role || 'public';

    // Get real last service date
    const [lastMaint] = await db.select()
      .from(maintenanceLogs)
      .where(and(eq(maintenanceLogs.asset_id, result.asset.asset_id), eq(maintenanceLogs.status, 'completed')))
      .orderBy(desc(maintenanceLogs.completed_date))
      .limit(1);

    if (role === 'public' || role === 'technician') {
      return {
        asset_tag: result.asset.asset_tag,
        name: result.asset.name,
        category: result.categoryName,
        location: result.location,
        status: result.asset.status,
        condition: result.asset.condition,
        last_service_date: lastMaint?.completed_date || 'None',
      };
    }

    if (role === 'supervisor') {
      const [{ count: faultCount }] = await db.select({ count: sql<number>`count(*)` })
        .from(faultReports) 
        .where(and(eq(faultReports.asset_id, result.asset.asset_id), eq(faultReports.status, 'open')));

      return {
        asset_tag: result.asset.asset_tag,
        name: result.asset.name,
        category: result.categoryName,
        location: result.location,
        status: result.asset.status,
        condition: result.asset.condition,
        last_service_date: lastMaint?.completed_date || 'None',
        open_fault_count: Number(faultCount),
        amc_status: (result.asset.warranty_expiry && result.asset.warranty_expiry > new Date()) ? 'Active (Warranty)' : 'Inactive',
      };
    }

    // Admin+ (full detail)
    return {
      ...result.asset,
      category: result.categoryName,
      location: result.location,
    };
  },

  async listLogs(filters: any, scopedHospitalId: string | null) {
    const page = Number(filters.page) || 1;
    const limit = Number(filters.limit) || 20;
    const offset = (page - 1) * limit;

    let conditions = [];
    if (scopedHospitalId) conditions.push(eq(assets.hospital_id, scopedHospitalId));
    else if (filters.hospital_id) conditions.push(eq(assets.hospital_id, filters.hospital_id));

    if (filters.asset_id) conditions.push(eq(scanEvents.asset_id, filters.asset_id));

    const where = conditions.length > 0 ? and(...conditions) : undefined;

    const data = await db.select({
      scan: scanEvents,
      assetTag: assets.asset_tag,
      assetName: assets.name,
      scannedByName: users.full_name,
    })
    .from(scanEvents)
    .leftJoin(assets, eq(scanEvents.asset_id, assets.asset_id))
    .leftJoin(users, eq(scanEvents.scanned_by, users.user_id))
    .where(where)
    .limit(limit)
    .offset(offset)
    .orderBy(desc(scanEvents.scanned_at));

    const [countResult] = await db.select({ count: sql<number>`count(*)` })
      .from(scanEvents)
      .leftJoin(assets, eq(scanEvents.asset_id, assets.asset_id))
      .where(where);

    return { data, total: Number(countResult.count), page, limit };
  }
};
