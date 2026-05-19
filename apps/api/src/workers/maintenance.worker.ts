import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { db } from '../db/index.js';
import { maintenanceLogs, faultReports } from '../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { logger } from '../lib/logger.js';

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export const maintenanceWorker = new Worker('maintenance', async job => {
  if (job.name === 'create-job-card') {
    const { faultId, assetId } = job.data;
    
    logger.info(`Auto-creating job card for fault: ${faultId}`);

    const [fault] = await db.select().from(faultReports).where(eq(faultReports.fault_id, faultId)).limit(1);
    
    if (!fault) return;

    await db.insert(maintenanceLogs).values({
      asset_id: assetId,
      hospital_id: fault.hospital_id,
      fault_id: faultId,
      maintenance_type: 'breakdown',
      priority: fault.severity === 'critical' ? 'P1' : (fault.severity === 'high' ? 'P1' : 'P2'),
      status: 'open',
      notes: `Auto-generated from fault report: ${fault.description}`,
    });
  }
}, { connection });
