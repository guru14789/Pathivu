import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { locationService } from './locations.service.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validate } from '../../lib/validation.js';
import { createLocationSchema } from './locations.validators.js';

import { sendSuccess } from '../../lib/response.js';
import { BadRequestError } from '../../lib/errors.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const hospitalId = req.user!.hospital_id || (req.query.hospital_id as string);
  if (!hospitalId) throw new BadRequestError('Hospital ID is required');
  const result = await locationService.list(hospitalId, req.query.department as string);
  sendSuccess(res, result);
}));

router.post('/', requireAuth, requirePermission('create', 'Hospital'), asyncHandler(async (req: AuthRequest, res) => {
  const validatedBody = validate(createLocationSchema, req.body);
  const hospitalId = req.user!.hospital_id || req.body.hospital_id;
  if (!hospitalId) throw new BadRequestError('Hospital ID is required');
  
  const location = await locationService.create({ ...validatedBody, hospital_id: hospitalId }, req.user!.user_id);
  sendSuccess(res, location, null, 201);
}));

export default router;
