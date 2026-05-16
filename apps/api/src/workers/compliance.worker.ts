import { Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { db } from '../db/index.js';
import { complianceDocuments, hospitals, users } from '../db/schema/index.js';
import { eq, and, sql, lte } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { sendComplianceAlert } from '../lib/mailer.js';
import { emitToHospital } from '../lib/socket.js';
import { addDays, format } from 'date-fns';

export const complianceWorker = new Worker('compliance-alerts', async (job) => {
  if (job.name === 'checkComplianceExpiry') {
    logger.info('Running daily compliance expiry check...');
    
    const today = new Date();
    const sixtyDaysFromNow = addDays(today, 60);
    const dateStr = format(sixtyDaysFromNow, 'yyyy-MM-dd');

    const expiringDocs = await db.select({
      doc: complianceDocuments,
      hospital: hospitals,
    })
    .from(complianceDocuments)
    .innerJoin(hospitals, eq(complianceDocuments.hospital_id, hospitals.hospital_id))
    .where(and(
      lte(complianceDocuments.expiry_date, dateStr),
      sql`${complianceDocuments.status} != 'expired'`,
      eq(complianceDocuments.alert_sent, false)
    ));

    for (const item of expiringDocs) {
      try {
        const admins = await db.select().from(users).where(and(
          eq(users.hospital_id, item.hospital.hospital_id),
          eq(users.role, 'branch_admin')
        ));

        const adminEmails = admins.map(a => a.email);
        await sendComplianceAlert(item.doc, item.hospital, adminEmails);
        
        emitToHospital(item.hospital.hospital_id, 'alert:compliance', {
          doc_name: item.doc.document_name,
          expiry_date: item.doc.expiry_date,
        });

        await db.update(complianceDocuments)
          .set({ alert_sent: true })
          .where(eq(complianceDocuments.doc_id, item.doc.doc_id));
          
        logger.info(`Compliance alert sent for ${item.doc.document_name}`);
      } catch (err) {
        logger.error(`Failed to send compliance alert for ${item.doc.document_name}:`, err);
      }
    }
  }
}, { connection: redis });
