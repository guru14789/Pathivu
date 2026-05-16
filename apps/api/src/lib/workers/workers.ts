import { Queue } from 'bullmq';
import { redis } from '../redis.js';
import { logger } from '../logger.js';
import '../../workers/index.js'; // Ensure workers are initialized

// Define Queues
export const ppmQueue = new Queue('ppm-alerts', { connection: redis });
export const escalationQueue = new Queue('fault-escalation', { connection: redis });
export const complianceQueue = new Queue('compliance-alerts', { connection: redis });
export const inventoryQueue = new Queue('inventory-alerts', { connection: redis });

export async function startWorkers() {
  logger.info('Initializing background workers...');

  // Clear existing repeatable jobs to avoid duplicates on restart
  const queues = [ppmQueue, escalationQueue, complianceQueue, inventoryQueue];
  for (const q of queues) {
    try {
      const jobs = await q.getRepeatableJobs();
      for (const job of jobs) {
        await q.removeRepeatableByKey(job.key);
      }
    } catch (err) {
      logger.error(`Failed to clear repeatable jobs for queue ${q.name}:`, err);
    }
  }

  // Schedule repeatable jobs
  
  // Daily PPM Check at 8 AM
  await ppmQueue.add('checkPpmDue', {}, {
    repeat: { pattern: '0 8 * * *' }
  });

  // Check Escalations every 30 minutes
  await escalationQueue.add('checkOverdueFaults', {}, {
    repeat: { pattern: '*/30 * * * *' }
  });

  // Daily Compliance Check at 9 AM
  await complianceQueue.add('checkComplianceExpiry', {}, {
    repeat: { pattern: '0 9 * * *' }
  });

  logger.info('Workers started and repeatable jobs scheduled.');
}
