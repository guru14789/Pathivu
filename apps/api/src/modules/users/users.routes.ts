import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { usersService } from './users.service.js';
import { createUserSchema, updateUserSchema, userQuerySchema } from './users.validators.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { ForbiddenError } from '../../lib/errors.js';
import { validate } from '../../lib/validation.js';

import { sendSuccess } from '../../lib/response.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  if (req.user?.role !== 'super_admin' && req.user?.role !== 'branch_admin') {
    throw new ForbiddenError('Access denied');
  }

  const filters = validate(userQuerySchema, req.query);
  const result = await usersService.getAll(filters, req.user.role === 'branch_admin' ? req.user.hospital_id : null);
  return sendSuccess(res, result.data, { total: result.total, page: filters.page, limit: filters.limit });
}));

router.post('/', requireAuth, requirePermission('create', 'User'), asyncHandler(async (req: AuthRequest, res) => {
  const validatedBody = validate(createUserSchema, req.body);

  if (req.user?.role === 'branch_admin') {
    if (validatedBody.role === 'super_admin') {
      throw new ForbiddenError('Branch admins cannot create super admins');
    }
    if (validatedBody.hospital_id !== req.user.hospital_id) {
      throw new ForbiddenError('Branch admins can only create users for their own hospital');
    }
  }

  const user = await usersService.create(validatedBody, req.user?.user_id, req.ip);
  return sendSuccess(res, user, null, 201);
}));

router.patch('/:id', requireAuth, requirePermission('update', 'User'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const validatedBody = validate(updateUserSchema, req.body);
  const user = await usersService.update(id as string, validatedBody, req.user?.user_id, req.ip);
  return sendSuccess(res, user);
}));

router.delete('/:id', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  if (req.user?.role !== 'super_admin') {
    throw new ForbiddenError('Only super admins can delete users');
  }
  const { id } = req.params;
  await usersService.softDelete(id as string, req.user?.user_id, req.ip);
  return sendSuccess(res, { success: true });
}));

export default router;
