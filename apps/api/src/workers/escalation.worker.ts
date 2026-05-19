import { Worker } from 'bullmq';
import { redis } from '../lib/redis.js';
import { db } from '../db/index.js';
import { faultReports, assets, users } from '../db/schema/index.js';
import { eq, and, sql } from 'drizzle-orm';
import { logger } from '../lib/logger.js';
import { sendEscalationAlert } from '../lib/mailer.js';
import { emitToHospital } from '../lib/socket.js';

export const escalationWorker = new Worker('fault-escalation', async (job) => {
  if (job.name === 'checkOverdueFaults') {
    const { fault_id } = job.data;
    
    // If specific fault_id provided (delayed job)
    if (fault_id) {
      const [fault] = await db.select().from(faultReports).where(eq(faultReports.fault_id, fault_id)).limit(1);
      
      if (fault && fault.status === 'open') {
        const [asset] = await db.select().from(assets).where(eq(assets.asset_id, fault.asset_id)).limit(1);
        
        // Escalation logic: send to supervisor/admin
        const admins = await db.select().from(users).where(and(
          eq(users.hospital_id, fault.hospital_id),
          sql`${users.role} IN ('branch_admin', 'supervisor')`
        ));
        
        const emails = admins.map(a => a.email);
        await sendEscalationAlert({ fault, asset, supervisorEmails: emails });
        
        emitToHospital(fault.hospital_id, 'alert:escalation', {
          fault_id: fault.fault_id,
          asset_tag: asset.asset_tag,
        });
        
        logger.info(`Fault ${fault_id} escalated due to inactivity (4h).`);
      }
    }
  }
}, { connection: redis });
