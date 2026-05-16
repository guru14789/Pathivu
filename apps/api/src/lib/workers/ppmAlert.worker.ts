import { Worker, Job } from 'bullmq';
import { redis } from '../redis.js';
import { db } from '../../db/index.js';
import { maintenanceSchedules, users, assets } from '../../db/schema/index.js';
import { eq, and, between, lte, or } from 'drizzle-orm';
import { sendPpmAlert } from '../mailer.js';
import { emitToHospital } from '../socket.js';
import { logger } from '../logger.js';

export const ppmAlertWorker = new Worker('ppm-alerts', async (job: Job) => {
  if (job.name === 'checkPpmDue') {
    logger.info('Running checkPpmDue job');
    
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const today = new Date();

    // 30-day alerts
    const dueSchedules30 = await db.select({
      schedule: maintenanceSchedules,
      asset: assets,
    })
    .from(maintenanceSchedules)
    .innerJoin(assets, eq(maintenanceSchedules.asset_id, assets.asset_id))
    .where(and(
      eq(maintenanceSchedules.is_active, true),
      eq(maintenanceSchedules.alert_30_sent, false),
      between(maintenanceSchedules.next_service_date, today.toISOString().split('T')[0], thirtyDaysFromNow.toISOString().split('T')[0])
    ));

    // 60-day alerts
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
    const dueSchedules60 = await db.select({
      schedule: maintenanceSchedules,
      asset: assets,
    })
    .from(maintenanceSchedules)
    .innerJoin(assets, eq(maintenanceSchedules.asset_id, assets.asset_id))
    .where(and(
      eq(maintenanceSchedules.is_active, true),
      eq(maintenanceSchedules.alert_60_sent, false),
      between(maintenanceSchedules.next_service_date, today.toISOString().split('T')[0], sixtyDaysFromNow.toISOString().split('T')[0])
    ));

    const allDue = [...dueSchedules30.map(s => ({ ...s, type: 30 })), ...dueSchedules60.map(s => ({ ...s, type: 60 }))];

    for (const item of allDue) {
      const { schedule, asset, type } = item as any;
      
      const admins = await db.select({ email: users.email })
        .from(users)
        .where(and(
          eq(users.hospital_id, asset.hospital_id),
          eq(users.role, 'branch_admin'),
          eq(users.is_active, true)
        ));

      for (const admin of admins) {
        await sendPpmAlert({
          asset,
          daysUntilDue: Math.ceil((new Date(schedule.next_service_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
          adminEmail: admin.email
        });
      }

      emitToHospital(asset.hospital_id, 'alert:ppm', {
        asset_tag: asset.asset_tag,
        asset_name: asset.name,
        days_until_due: Math.ceil((new Date(schedule.next_service_date).getTime() - today.getTime()) / (1000 * 60 * 60 * 24)),
        hospital_id: asset.hospital_id
      });

      await db.update(maintenanceSchedules)
        .set(type === 30 ? { alert_30_sent: true } : { alert_60_sent: true })
        .where(eq(maintenanceSchedules.schedule_id, schedule.schedule_id));
      
      logger.info(`PPM ${type}-day alert sent for asset ${asset.asset_tag}`);
    }
  }
}, { connection: redis });
