import { createServer } from 'http';
import { Server } from 'socket.io';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { db } from './db/index.js';
import { sql } from 'drizzle-orm';
import { requestLogger } from './middleware/logger.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { sanitize } from './lib/sanitizer.js';
import { logger } from './lib/logger.js';
import { initSocket } from './lib/socket.js';
import { r2 } from './lib/r2.js';
import Redis from 'ioredis';
import { startWorkers } from './lib/workers/workers.js';
import { redis } from './lib/redis.js';
import { ppmQueue, escalationQueue, complianceQueue, inventoryQueue } from './lib/workers/workers.js';

// Routes
import authRoutes from './modules/auth/auth.routes.js';
import hospitalRoutes from './modules/hospitals/hospitals.routes.js';
import userRoutes from './modules/users/users.routes.js';
import assetRoutes from './modules/assets/assets.routes.js';
import qrRoutes from './modules/qr/qr.routes.js';
import scanRoutes from './modules/scan/scan.routes.js';
import locationRoutes from './modules/locations/locations.routes.js';
import categoryRoutes from './modules/categories/categories.routes.js';
import faultRoutes from './modules/faults/faults.routes.js';
import maintenanceRoutes from './modules/maintenance/maintenance.routes.js';
import schedulesRoutes from './modules/schedules/schedules.routes.js';
import vendorRoutes from './modules/vendors/vendors.routes.js';
import amcRoutes from './modules/amc/amc.routes.js';
import complianceRoutes from './modules/compliance/compliance.routes.js';
import inventoryRoutes from './modules/inventory/inventory.routes.js';
import reportRoutes from './modules/reports/reports.routes.js';
import auditLogRoutes from './modules/audit-logs/audit-logs.routes.js';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: envFile });
dotenv.config({ path: '../../.env' }); // Fallback to root .env

const app = express();
const httpServer = createServer(app);

// Initialize modular Socket.io
initSocket(httpServer);

const port = process.env.PORT || 4000;

// Request ID middleware
app.use((req, res, next) => {
  (req as any).id = uuidv4();
  res.setHeader('X-Request-ID', (req as any).id);
  next();
});

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  hsts: { maxAge: 31536000 },
  noSniff: true,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(cookieParser());

// Input sanitization
app.use((req, res, next) => {
  if (req.body) Object.assign(req.body, sanitize(req.body));
  if (req.query) Object.assign(req.query, sanitize(req.query));
  if (req.params) Object.assign(req.params, sanitize(req.params));
  next();
});

// Rate Limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: { error: { code: 'TOO_MANY_REQUESTS', message: 'Too many requests, please try again later.' } },
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  message: { error: { code: 'AUTH_THROTTLED', message: 'Too many login attempts. Please try again in 15 minutes.' } },
});

const scanLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: { code: 'SCAN_THROTTLED', message: 'Rate limit exceeded for public scanning.' } },
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: { code: 'REFRESH_THROTTLED', message: 'Too many refresh requests.' } },
});

app.use(generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/refresh', refreshLimiter);
app.use('/api/scan/:assetTag', scanLimiter);
app.use(requestLogger);

// Health Check
app.get('/health', async (req, res) => {
  const status: any = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      db: 'error',
      redis: 'error',
      r2: 'error',
    },
  };

  try {
    await db.execute(sql`SELECT 1`);
    status.services.db = 'ok';
  } catch (e) {}

  try {
    const redis = new Redis(process.env.REDIS_URL!);
    await redis.ping();
    status.services.redis = 'ok';
    await redis.quit();
  } catch (e) {}

  try {
    status.services.r2 = await r2.checkHealth();
  } catch (e) {}

  const overallError = Object.values(status.services).some(s => s === 'error');
  res.status(overallError ? 503 : 200).json(status);
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/hospitals', hospitalRoutes);
app.use('/api/users', userRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/scan', scanRoutes);
app.use('/api/locations', locationRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/faults', faultRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/amc', amcRoutes);
app.use('/api/compliance', complianceRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/audit-logs', auditLogRoutes);

// Error Handling
app.use(errorHandler);

// Graceful Shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}, shutting down gracefully`);
  
  // Close HTTP server first
  httpServer.close(async () => {
    logger.info('HTTP server closed');
    
    try {
      // Close Queues
      await Promise.all([
        ppmQueue.close(),
        escalationQueue.close(),
        complianceQueue.close(),
        inventoryQueue.close()
      ]);
      logger.info('BullMQ queues closed');

      // Close Redis
      await redis.quit();
      logger.info('Redis connection closed');
      
      logger.info('Cleanup complete');
      process.exit(0);
    } catch (err) {
      logger.error('Error during cleanup:', err);
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Forceful shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

httpServer.listen(port, async () => {
  logger.info(`Server running on port ${port} in ${process.env.NODE_ENV} mode`);
  try {
    await startWorkers();
  } catch (err) {
    logger.error('Failed to start workers:', err);
  }
});
