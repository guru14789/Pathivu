import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { qrService } from './qr.service.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';

import { sendSuccess } from '../../lib/response.js';

const router = Router();

router.post('/generate', requireAuth, requirePermission('create', 'QrCode'), asyncHandler(async (req: AuthRequest, res) => {
  const { asset_id, format } = req.body;
  const result = await qrService.generate(asset_id, format, req.user!.user_id);
  sendSuccess(res, result, null, 201);
}));

router.post('/bulk', requireAuth, requirePermission('create', 'QrCode'), asyncHandler(async (req: AuthRequest, res) => {
  const { asset_ids, format } = req.body;
  const results = await qrService.bulkGenerate(asset_ids, format, req.user!.user_id);
  sendSuccess(res, results);
}));

router.get('/:assetId', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const [qr] = await qrService.getActiveByAssetId(req.params.assetId as string);
  sendSuccess(res, qr);
}));

router.post('/:qrId/print', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const qr = await qrService.incrementPrintCount(req.params.qrId as string);
  sendSuccess(res, qr);
}));

export default router;
