import { Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { db } from '../db/index.js';
import { maintenanceSchedules, assets, hospitals, users } from '../db/schema/index.js';
import { eq, and, sql, lte } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { sendPpmAlert } from '../lib/mailer.js';
import { emitToHospital } from '../lib/socket.js';
import { addDays, format } from 'date-fns';

export const ppmWorker = new Worker('ppm-alerts', async (job) => {
  if (job.name === 'checkPpmDue') {
    logger.info('Running daily PPM alert check...');
    
    const today = new Date();
    const thirtyDaysFromNow = addDays(today, 30);
    const dateStr = format(thirtyDaysFromNow, 'yyyy-MM-dd');

    // Find schedules due in 30 days that haven't sent alert
    const dueSchedules = await db.select({
      schedule: maintenanceSchedules,
      asset: assets,
      hospital: hospitals,
    })
    .from(maintenanceSchedules)
    .innerJoin(assets, eq(maintenanceSchedules.asset_id, assets.asset_id))
    .innerJoin(hospitals, eq(assets.hospital_id, hospitals.hospital_id))
    .where(and(
      lte(maintenanceSchedules.next_service_date, dateStr),
      eq(maintenanceSchedules.is_active, true),
      eq(maintenanceSchedules.alert_30_sent, false)
    ));

    for (const item of dueSchedules) {
      try {
        // Get branch admins
        const admins = await db.select().from(users).where(and(
          eq(users.hospital_id, item.hospital.hospital_id),
          eq(users.role, 'branch_admin')
        ));

        const adminEmails = admins.map(a => a.email);
        
        await sendPpmAlert(item.asset, 30, adminEmails);
        
        emitToHospital(item.hospital.hospital_id, 'alert:ppm', {
          asset_tag: item.asset.asset_tag,
          next_service_date: item.schedule.next_service_date,
        });

        await db.update(maintenanceSchedules)
          .set({ alert_30_sent: true })
          .where(eq(maintenanceSchedules.schedule_id, item.schedule.schedule_id));
          
        logger.info(`PPM 30-day alert sent for asset ${item.asset.asset_tag}`);
      } catch (err) {
        logger.error(`Failed to send PPM alert for ${item.asset.asset_tag}:`, err);
      }
    }
  }
}, { connection: redis });
