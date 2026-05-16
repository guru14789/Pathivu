import { Worker, Job } from 'bullmq';
import { redis } from '../redis.js';
import { db } from '../../db/index.js';
import { faultReports, users, assets } from '../../db/schema/index.js';
import { eq, and, lt, inArray, sql } from 'drizzle-orm';
import { sendEscalationAlert } from '../mailer.js';
import { sendSMS } from '../sms.js';
import { logger } from '../logger.js';

export const faultEscalationWorker = new Worker('fault-escalation', async (job: Job) => {
  if (job.name === 'checkOverdueFaults') {
    logger.info('Running checkOverdueFaults job');

    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);

    const overdueFaults = await db.select({
      fault: faultReports,
      asset: assets,
    })
    .from(faultReports)
    .innerJoin(assets, eq(faultReports.asset_id, assets.asset_id))
    .where(and(
      eq(faultReports.status, 'open'),
      lt(faultReports.reported_at, fourHoursAgo),
      inArray(faultReports.severity, ['high', 'critical'])
    ));

    for (const item of overdueFaults) {
      const { fault, asset } = item;

      // Get supervisors and branch admins
      const recipients = await db.select({
        email: users.email,
        phone: users.phone,
        role: users.role
      })
      .from(users)
      .where(and(
        eq(users.hospital_id, fault.hospital_id),
        inArray(users.role, ['branch_admin', 'supervisor']),
        eq(users.is_active, true)
      ));

      const emails = recipients.map(r => r.email);
      await sendEscalationAlert({ fault, asset, supervisorEmails: emails });

      if (fault.severity === 'critical') {
        const message = `CRITICAL ESCALATION: Asset ${asset.asset_tag} (${asset.name}) fault has been open for >4h. Check: ${process.env.FRONTEND_URL}/faults/${fault.fault_id}`;
        for (const recipient of recipients) {
          if (recipient.phone) {
            await sendSMS(recipient.phone, message);
          }
        }
      }

      logger.info(`Fault escalation processed for ${fault.fault_id}`);
    }
  }
}, { connection: redis });
