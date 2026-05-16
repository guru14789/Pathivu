import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { faultsService } from './faults.service.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validate } from '../../lib/validation.js';
import { createFaultSchema, updateFaultSchema } from './faults.validators.js';
import multer from 'multer';

import { sendSuccess } from '../../lib/response.js';

import { ForbiddenError } from '../../lib/errors.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Public/Optional Auth Route for reporting faults
router.post('/report', upload.single('photo'), asyncHandler(async (req: any, res) => {
  const validatedBody = validate(createFaultSchema, req.body);
  const userId = req.user?.user_id;
  const result = await faultsService.create(validatedBody, userId, req.file?.buffer);
  return sendSuccess(res, result, null, 201);
}));

router.get('/', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const result = await faultsService.list(req.query, req.user!.hospital_id);
  sendSuccess(res, result.data, {
    total: result.total,
    page: result.page,
    limit: result.limit
  });
}));

router.get('/:id', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const result = await faultsService.getById(req.params.id as string);
  
  if (req.user!.role !== 'super_admin' && result.fault.hospital_id !== req.user!.hospital_id) {
    throw new ForbiddenError();
  }

  sendSuccess(res, result);
}));

router.patch('/:id', requireAuth, requirePermission('update', 'FaultReport'), asyncHandler(async (req: AuthRequest, res) => {
  const validatedBody = validate(updateFaultSchema, req.body);
  const result = await faultsService.update(req.params.id as string, validatedBody, req.user!.user_id);
  sendSuccess(res, result);
}));

export default router;
