import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

export const maintenanceQueue = new Queue('maintenance', { connection });
export const emailQueue = new Queue('email', { connection });
export const reportQueue = new Queue('reports', { connection });
