import { db } from '../../db/index.js';
import { locations, auditLogs } from '../../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { logAudit } from '../../lib/audit.js';

export const locationService = {
  async list(hospitalId: string, department?: string) {
    let conditions = [eq(locations.hospital_id, hospitalId)];
    if (department) conditions.push(eq(locations.department, department));
    
    return await db.select().from(locations).where(and(...conditions));
  },

  async create(input: any, userId: string) {
    const [location] = await db.insert(locations).values(input).returning();

    await logAudit({
      user_id: userId,
      action: 'CREATE',
      table_name: 'locations',
      record_id: location.location_id,
      new_values: location
    });

    return location;
  }
};
