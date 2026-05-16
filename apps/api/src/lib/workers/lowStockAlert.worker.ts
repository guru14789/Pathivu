import { Worker, Job } from 'bullmq';
import { redis } from '../redis.js';
import { db } from '../../db/index.js';
import { spareParts, users } from '../../db/schema/index.js';
import { eq, and } from 'drizzle-orm';
import { sendLowStockAlert } from '../mailer.js';
import { emitToHospital } from '../socket.js';
import { logger } from '../logger.js';

export const lowStockAlertWorker = new Worker('inventory-alerts', async (job: Job) => {
  if (job.name === 'lowStockAlert') {
    const { partId } = job.data;
    logger.info(`Processing low stock alert for part: ${partId}`);

    const [part] = await db.select().from(spareParts).where(eq(spareParts.part_id, partId)).limit(1);
    if (!part) return;

    const hospitalAdmins = await db.select({ email: users.email })
      .from(users)
      .where(and(
        eq(users.hospital_id, part.hospital_id),
        eq(users.role, 'branch_admin'),
        eq(users.is_active, true)
      ));

    for (const admin of hospitalAdmins) {
      try {
        await sendLowStockAlert({
          partName: part.name,
          currentQty: part.stock_quantity,
          threshold: part.reorder_threshold,
          adminEmail: admin.email
        });
      } catch (err) {
        logger.error(`Failed to send low stock email to ${admin.email}: ${err}`);
      }
    }

    emitToHospital(part.hospital_id, 'alert:inventory', {
      part_name: part.name,
      current_qty: part.stock_quantity,
      threshold: part.reorder_threshold,
      hospital_id: part.hospital_id
    });
  }
}, { connection: redis });
