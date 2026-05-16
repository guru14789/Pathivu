import { Router } from 'express';
import { vendorsService } from './vendors.service.js';
import { createVendorSchema, updateVendorSchema } from './vendors.validators.js';
import { sendSuccess } from '../../lib/response.js';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validate } from '../../lib/validation.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const search = req.query.search as string;
  const is_active = req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined;

  const result = await vendorsService.list({ search, is_active, page, limit });
  sendSuccess(res, result.vendors, { total: result.total, page, limit });
}));

router.post('/', requireAuth, requirePermission('create', 'Vendor'), asyncHandler(async (req: AuthRequest, res) => {
  const validatedBody = validate(createVendorSchema, req.body);
  const vendor = await vendorsService.create(validatedBody, req.user!.user_id);
  sendSuccess(res, vendor, null, 201);
}));

router.get('/:id', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const vendor = await vendorsService.getById(req.params.id as string);
  sendSuccess(res, vendor);
}));

router.patch('/:id', requireAuth, requirePermission('update', 'Vendor'), asyncHandler(async (req: AuthRequest, res) => {
  const validatedBody = validate(updateVendorSchema, req.body);
  const vendor = await vendorsService.update(req.params.id as string, validatedBody, req.user!.user_id);
  sendSuccess(res, vendor);
}));

export default router;
