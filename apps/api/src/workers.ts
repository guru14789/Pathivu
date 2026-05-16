import * as dotenv from 'dotenv';
import path from 'path';
import { startWorkers } from './lib/workers/workers.js';
import { logger } from './lib/logger.js';

// Import workers to initialize them
import './lib/workers/ppmAlert.worker.js';
import './lib/workers/faultEscalation.worker.js';
import './lib/workers/complianceAlert.worker.js';
import './lib/workers/lowStockAlert.worker.js';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });

// This file is the entry point for the separate worker process
startWorkers()
  .then(() => logger.info('Background worker process running'))
  .catch(err => logger.error('Worker process failed to start:', err));
