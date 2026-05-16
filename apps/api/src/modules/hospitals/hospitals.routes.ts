import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { hospitalsService } from './hospitals.service.js';
import { createHospitalSchema, updateHospitalSchema, hospitalQuerySchema } from './hospitals.validators.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { ForbiddenError } from '../../lib/errors.js';
import { validate } from '../../lib/validation.js';

import { sendSuccess } from '../../lib/response.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const filters = validate(hospitalQuerySchema, req.query);
  const result = await hospitalsService.getAll(filters, req.user?.role === 'super_admin' ? null : req.user?.hospital_id);
  return sendSuccess(res, result.data, { total: result.total, page: filters.page, limit: filters.limit });
}));

router.post('/', requireAuth, requirePermission('create', 'Hospital'), asyncHandler(async (req: AuthRequest, res) => {
  const validatedBody = validate(createHospitalSchema, req.body);
  const hospital = await hospitalsService.create(validatedBody, req.user?.user_id, req.ip);
  return sendSuccess(res, hospital, null, 201);
}));

router.patch('/:id', requireAuth, requirePermission('update', 'Hospital'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  
  if (req.user?.role !== 'super_admin' && req.user?.hospital_id !== id) {
    throw new ForbiddenError('You can only update your own hospital');
  }

  const validatedBody = validate(updateHospitalSchema, req.body);
  const hospital = await hospitalsService.update(id as string, validatedBody, req.user?.user_id, req.ip);
  return sendSuccess(res, hospital);
}));

export default router;
