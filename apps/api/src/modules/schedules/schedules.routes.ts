import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { schedulesService } from './schedules.service.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validate } from '../../lib/validation.js';
import { createScheduleSchema, updateScheduleSchema } from './schedules.validators.js';

import { sendSuccess } from '../../lib/response.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const result = await schedulesService.list(req.query, req.user!.hospital_id);
  sendSuccess(res, result);
}));

router.post('/', requireAuth, requirePermission('create', 'MaintenanceSchedule'), asyncHandler(async (req: AuthRequest, res) => {
  const validatedBody = validate(createScheduleSchema, req.body);
  const result = await schedulesService.create(validatedBody, req.user!.user_id);
  sendSuccess(res, result, null, 201);
}));

router.patch('/:id', requireAuth, requirePermission('update', 'MaintenanceSchedule'), asyncHandler(async (req: AuthRequest, res) => {
  const validatedBody = validate(updateScheduleSchema, req.body);
  const result = await schedulesService.update(req.params.id as string, validatedBody, req.user!.user_id);
  sendSuccess(res, result);
}));

router.delete('/:id', requireAuth, requirePermission('delete', 'MaintenanceSchedule'), asyncHandler(async (req: AuthRequest, res) => {
  const result = await schedulesService.softDelete(req.params.id as string, req.user!.user_id);
  sendSuccess(res, result);
}));

export default router;
