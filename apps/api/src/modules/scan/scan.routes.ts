import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { scanService } from './scan.service.js';
import { validate } from '../../lib/validation.js';
import { AuthRequest, requireAuth } from '../../middleware/auth.middleware.js';
import jwt from 'jsonwebtoken';

import { sendSuccess } from '../../lib/response.js';
import { ForbiddenError } from '../../lib/errors.js';

const router = Router();

router.get('/:assetTag', asyncHandler(async (req, res) => {
  // Optional auth for public scan
  let user = null;
  const token = req.headers.authorization?.split(' ')[1];
  if (token) {
    try {
      user = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (e) { /* ignore */ }
  }

  const result = await scanService.getByTag(req.params.assetTag as string, user, {
    ip: req.ip,
    ua: req.get('User-Agent'),
    lat: req.query.lat as string,
    lng: req.query.lng as string,
  });
  
  sendSuccess(res, result);
}));

router.get('/scan-logs', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  if (req.user!.role !== 'super_admin' && req.user!.role !== 'branch_admin') {
    throw new ForbiddenError();
  }
  const result = await scanService.listLogs(req.query, req.user!.hospital_id);
  sendSuccess(res, result.data, {
    total: result.total,
    page: result.page,
    limit: result.limit
  });
}));

export default router;
