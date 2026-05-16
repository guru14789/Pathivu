import { db } from '../../db/index.js';
import { assetCategories, auditLogs } from '../../db/schema/index.js';
import { eq, or, isNull } from 'drizzle-orm';
import { logAudit } from '../../lib/audit.js';

export const categoryService = {
  async list(hospitalId: string | null) {
    const conditions = [isNull(assetCategories.hospital_id)];
    if (hospitalId) {
      conditions.push(eq(assetCategories.hospital_id, hospitalId));
    }
    return await db.select().from(assetCategories)
      .where(or(...conditions));
  },

  async create(input: any, userId: string) {
    const [category] = await db.insert(assetCategories).values(input).returning();

    await logAudit({
      user_id: userId,
      action: 'CREATE',
      resource_type: 'asset_categories',
      resource_id: category.category_id,
      new_value: category
    });

    return category;
  }
};
