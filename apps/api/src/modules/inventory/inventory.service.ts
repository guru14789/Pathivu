import { db } from '../../db/index.js';
import { spareParts, vendors } from '../../db/schema/index.js';
import { eq, and, sql, desc, ilike, count, lt, or } from 'drizzle-orm';
import { AppError } from '../../lib/errors.js';
import { logAudit } from '../../lib/audit.js';

import { inventoryQueue } from '../../lib/workers/workers.js';

export class InventoryService {
  async list(filters: { hospital_id?: string; low_stock?: boolean; search?: string; page: number; limit: number }) {
    const offset = (filters.page - 1) * filters.limit;
    let whereClause = undefined;
    
    if (filters.hospital_id) whereClause = eq(spareParts.hospital_id, filters.hospital_id);
    if (filters.low_stock) {
      const lLimit = lt(spareParts.stock_quantity, spareParts.reorder_threshold);
      whereClause = whereClause ? and(whereClause, lLimit) : lLimit;
    }
    if (filters.search) {
      const sLimit = or(
        ilike(spareParts.name, `%${filters.search}%`),
        ilike(spareParts.part_number, `%${filters.search}%`),
        ilike(spareParts.barcode, `%${filters.search}%`)
      );
      whereClause = whereClause ? and(whereClause, sLimit) : sLimit;
    }

    const data = await db.select({
      part: spareParts,
      vendor_name: vendors.name
    })
    .from(spareParts)
    .leftJoin(vendors, eq(spareParts.vendor_id, vendors.vendor_id))
    .where(whereClause)
    .limit(filters.limit)
    .offset(offset)
    .orderBy(desc(spareParts.created_at));

    const totalRes = await db.select({ count: count() }).from(spareParts).where(whereClause);

    return {
      parts: data.map(item => ({ ...item.part, vendor_name: item.vendor_name })),
      total: totalRes[0].count
    };
  }

  async getByBarcode(barcode: string) {
    const part = await db.query.spareParts.findFirst({
      where: eq(spareParts.barcode, barcode),
    });
    if (!part) throw new AppError('NOT_FOUND', 'Spare part not found', 404);
    return part;
  }

  async create(data: any, userId: string) {
    const [newPart] = await db.insert(spareParts).values(data).returning();

    await logAudit({
      user_id: userId,
      action: 'INSERT',
      table_name: 'spare_parts',
      record_id: newPart.part_id,
      new_values: newPart
    });

    return newPart;
  }

  async update(id: string, data: any, userId: string) {
    const [oldPart] = await db.select().from(spareParts).where(eq(spareParts.part_id, id));
    if (!oldPart) throw new AppError('NOT_FOUND', 'Spare part not found', 404);

    const [updatedPart] = await db.update(spareParts)
      .set({ ...data, updated_at: new Date() })
      .where(eq(spareParts.part_id, id))
      .returning();

    await logAudit({
      user_id: userId,
      action: 'UPDATE',
      table_name: 'spare_parts',
      record_id: id,
      old_values: oldPart,
      new_values: updatedPart
    });

    // Handle low stock alert trigger here if quantity decreased
    if (updatedPart.stock_quantity < updatedPart.reorder_threshold) {
      await inventoryQueue.add('lowStockAlert', { partId: id });
    }

    return updatedPart;
  }
}

export const inventoryService = new InventoryService();
