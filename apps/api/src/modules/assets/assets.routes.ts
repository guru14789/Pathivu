import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { assetService } from './assets.service.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validate } from '../../lib/validation.js';
import { createAssetSchema, updateAssetSchema } from './assets.validators.js';
import multer from 'multer';
import { ForbiddenError } from '../../lib/errors.js';

import { sendSuccess } from '../../lib/response.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const result = await assetService.list(req.query, req.user!.hospital_id);
  return sendSuccess(res, result.data, { total: result.total, page: Number(req.query.page) || 1, limit: Number(req.query.limit) || 20 });
}));

router.post('/', requireAuth, requirePermission('create', 'Asset'), upload.single('photo'), asyncHandler(async (req: AuthRequest, res) => {
  const validatedBody = validate(createAssetSchema, req.body);
  const asset = await assetService.create(validatedBody, req.user!.user_id, req.file?.buffer);
  return sendSuccess(res, asset, null, 201);
}));

router.get('/:id', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const asset = await assetService.getById(req.params.id as string);
  return sendSuccess(res, asset);
}));

router.patch('/:id', requireAuth, requirePermission('update', 'Asset'), asyncHandler(async (req: AuthRequest, res) => {
  const validatedBody = validate(updateAssetSchema, req.body);
  const asset = await assetService.update(req.params.id as string, validatedBody, req.user!.user_id);
  return sendSuccess(res, asset);
}));

router.delete('/:id', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  if (req.user!.role !== 'super_admin') throw new ForbiddenError('Forbidden');
  const asset = await assetService.softDelete(req.params.id as string, req.user!.user_id);
  return sendSuccess(res, asset);
}));

router.get('/:id/history', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const result = await assetService.getHistory(req.params.id as string);
  return sendSuccess(res, result);
}));

router.post('/:id/assign', requireAuth, requirePermission('update', 'Asset'), asyncHandler(async (req: AuthRequest, res) => {
  const result = await assetService.assign(req.params.id as string, req.body, req.user!.user_id);
  return sendSuccess(res, result, null, 201);
}));

router.post('/:id/unassign', requireAuth, requirePermission('update', 'Asset'), asyncHandler(async (req: AuthRequest, res) => {
  const result = await assetService.unassign(req.params.id as string, req.user!.user_id);
  return sendSuccess(res, result);
}));

router.get('/:id/assignments', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const result = await assetService.getAssignments(req.params.id as string);
  return sendSuccess(res, result);
}));

router.get('/:id/faults', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const result = await assetService.getFaults(req.params.id as string);
  return sendSuccess(res, result);
}));

router.get('/:id/maintenance', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const result = await assetService.getMaintenance(req.params.id as string);
  return sendSuccess(res, result);
}));

export default router;
