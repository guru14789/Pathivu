import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { categoryService } from './categories.service.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';

import { sendSuccess } from '../../lib/response.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const result = await categoryService.list(req.user!.hospital_id);
  return sendSuccess(res, result);
}));

router.post('/', requireAuth, requirePermission('create', 'Asset'), asyncHandler(async (req: AuthRequest, res) => {
  const category = await categoryService.create(req.body, req.user!.user_id);
  return sendSuccess(res, category, null, 201);
}));

export default router;
