import { Worker, Job } from 'bullmq';
import { redis } from '../redis.js';
import { db } from '../../db/index.js';
import { complianceDocuments, users, assets } from '../../db/schema/index.js';
import { eq, and, between, or, lte } from 'drizzle-orm';
import { sendComplianceAlert } from '../mailer.js';
import { emitToHospital } from '../socket.js';
import { logger } from '../logger.js';
import { addDays } from 'date-fns';

export const complianceAlertWorker = new Worker('compliance-alerts', async (job: Job) => {
  if (job.name === 'checkComplianceExpiry') {
    logger.info('Running checkComplianceExpiry job');
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const sixtyDaysFromNow = addDays(today, 60).toISOString().split('T')[0];
    const thirtyDaysFromNow = addDays(today, 30).toISOString().split('T')[0];

    // Find documents expiring within 60 days that haven't had their 60-day alert sent
    const expiring60 = await db.select()
      .from(complianceDocuments)
      .where(and(
        between(complianceDocuments.expiry_date, todayStr, sixtyDaysFromNow),
        eq(complianceDocuments.alert_60_sent, false)
      ));

    for (const doc of expiring60) {
      await processAlert(doc, 60);
    }

    // Find documents expiring within 30 days that haven't had their 30-day alert sent
    const expiring30 = await db.select()
      .from(complianceDocuments)
      .where(and(
        between(complianceDocuments.expiry_date, todayStr, thirtyDaysFromNow),
        eq(complianceDocuments.alert_30_sent, false)
      ));

    for (const doc of expiring30) {
      await processAlert(doc, 30);
    }
  }
}, { connection: redis });

async function processAlert(doc: any, days: number) {
  const hospitalAdmins = await db.select({ email: users.email })
    .from(users)
    .where(and(
      eq(users.hospital_id, doc.hospital_id),
      eq(users.role, 'branch_admin'),
      eq(users.is_active, true)
    ));

  let assetData = null;
  if (doc.asset_id) {
    [assetData] = await db.select().from(assets).where(eq(assets.asset_id, doc.asset_id)).limit(1);
  }

  for (const admin of hospitalAdmins) {
    try {
      await sendComplianceAlert({
        certType: doc.cert_type,
        assetTag: assetData?.asset_tag,
        daysUntilDue: days,
        adminEmail: admin.email
      });
    } catch (err) {
      logger.error(`Failed to send compliance email to ${admin.email}: ${err}`);
    }
  }

  emitToHospital(doc.hospital_id, 'alert:compliance', {
    cert_type: doc.cert_type,
    asset_tag: assetData?.asset_tag,
    days_until_expiry: days,
    hospital_id: doc.hospital_id
  });

  // Update alert flags
  await db.update(complianceDocuments)
    .set({
      [`alert_${days}_sent`]: true,
      status: days <= 30 ? 'expiring_soon' : 'valid'
    })
    .where(eq(complianceDocuments.doc_id, doc.doc_id));
}
