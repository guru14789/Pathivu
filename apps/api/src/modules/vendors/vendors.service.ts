import { db } from '../../db/index.js';
import { vendors, amcContracts, assets } from '../../db/schema/index.js';
import { eq, and, ilike, sql, desc, count } from 'drizzle-orm';
import { AppError } from '../../lib/errors.js';
import { logAudit } from '../../lib/audit.js';

export class VendorsService {
  async list(filters: { search?: string; is_active?: boolean; page: number; limit: number }) {
    const offset = (filters.page - 1) * filters.limit;
    
    let whereClause = undefined;
    if (filters.search) {
      whereClause = ilike(vendors.name, `%${filters.search}%`);
    }
    if (filters.is_active !== undefined) {
      whereClause = whereClause ? and(whereClause, eq(vendors.is_active, filters.is_active)) : eq(vendors.is_active, filters.is_active);
    }

    const data = await db.select({
      vendor: vendors,
      contract_count: sql<number>`(SELECT count(*) FROM ${amcContracts} WHERE ${amcContracts.vendor_id} = ${vendors.vendor_id})`.mapWith(Number),
      asset_count: sql<number>`(SELECT count(*) FROM ${assets} WHERE ${assets.vendor_id} = ${vendors.vendor_id})`.mapWith(Number),
    })
    .from(vendors)
    .where(whereClause)
    .limit(filters.limit)
    .offset(offset)
    .orderBy(desc(vendors.created_at));

    const totalRes = await db.select({ count: count() }).from(vendors).where(whereClause);
    
    return {
      vendors: data.map(item => ({
        ...item.vendor,
        contract_count: item.contract_count,
        asset_count: item.asset_count
      })),
      total: totalRes[0].count
    };
  }

  async getById(id: string) {
    const vendor = await db.query.vendors.findFirst({
      where: eq(vendors.vendor_id, id)
    });

    if (!vendor) throw new AppError('NOT_FOUND', 'Vendor not found', 404);

    const activeContracts = await db.select()
      .from(amcContracts)
      .where(and(eq(amcContracts.vendor_id, id), eq(amcContracts.is_active, true)));

    const linkedAssets = await db.select()
      .from(assets)
      .where(eq(assets.vendor_id, id))
      .limit(10);

    return {
      ...vendor,
      active_contracts: activeContracts,
      linked_assets: linkedAssets
    };
  }

  async create(data: any, userId: string) {
    const lastVendor = await db.select().from(vendors).orderBy(desc(vendors.created_at)).limit(1);
    let nextId = 1;
    if (lastVendor.length > 0 && lastVendor[0].vendor_code) {
      const match = lastVendor[0].vendor_code.match(/VND-(\d+)/);
      if (match) nextId = parseInt(match[1]) + 1;
    }
    const vendor_code = `VND-${nextId.toString().padStart(4, '0')}`;

    const [vendor] = await db.insert(vendors).values({
      ...data,
      vendor_code,
    }).returning();

    await logAudit({
      user_id: userId,
      action: 'CREATE',
      resource_type: 'vendors',
      resource_id: vendor.vendor_id,
      new_value: vendor
    });

    return vendor;
  }

  async update(id: string, data: any, userId: string) {
    const [oldVendor] = await db.select().from(vendors).where(eq(vendors.vendor_id, id));
    if (!oldVendor) throw new AppError('NOT_FOUND', 'Vendor not found', 404);

    const [updatedVendor] = await db.update(vendors)
      .set(data)
      .where(eq(vendors.vendor_id, id))
      .returning();

    await logAudit({
      user_id: userId,
      action: 'UPDATE',
      resource_type: 'vendors',
      resource_id: id,
      old_value: oldVendor,
      new_value: updatedVendor
    });

    return updatedVendor;
  }
}

export const vendorsService = new VendorsService();
