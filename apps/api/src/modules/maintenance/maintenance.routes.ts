import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { maintenanceService } from './maintenance.service.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validate } from '../../lib/validation.js';
import { createMaintenanceSchema, updateMaintenanceSchema } from './maintenance.validators.js';
import { ForbiddenError } from '../../lib/errors.js';

import { sendSuccess } from '../../lib/response.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const result = await maintenanceService.list(req.query, req.user!.hospital_id);
  sendSuccess(res, result.data, { 
    total: result.total, 
    page: result.page, 
    limit: result.limit 
  });
}));

router.post('/', requireAuth, requirePermission('create', 'MaintenanceLog'), asyncHandler(async (req: AuthRequest, res) => {
  const validatedBody = validate(createMaintenanceSchema, req.body);
  const result = await maintenanceService.create(validatedBody, req.user!.user_id);
  sendSuccess(res, result, null, 201);
}));

router.get('/:id', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const result = await maintenanceService.getById(req.params.id as string);
  sendSuccess(res, result);
}));

router.patch('/:id', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const validatedBody = validate(updateMaintenanceSchema, req.body);
  const logId = req.params.id as string;
  
  // RBAC: Technician can only update status of own jobs
  if (req.user!.role === 'technician') {
    const existing = await maintenanceService.getById(logId);
    if (existing.log.assigned_to !== req.user!.user_id) {
      throw new ForbiddenError('Access denied: Not assigned to this job');
    }
    // Limit technician fields
    const techFields = { 
      status: validatedBody.status, 
      technician_remarks: validatedBody.technician_remarks,
      downtime_hours: validatedBody.downtime_hours,
      condition: validatedBody.condition
    };
    const result = await maintenanceService.update(logId, techFields, req.user!.user_id);
    return sendSuccess(res, result);
  }

  const result = await maintenanceService.update(logId, validatedBody, req.user!.user_id);
  sendSuccess(res, result);
}));

export default router;
