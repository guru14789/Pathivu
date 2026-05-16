import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { inventoryService } from './inventory.service.js';
import { createInventorySchema, updateInventorySchema } from './inventory.validators.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/rbac.middleware.js';
import { validate } from '../../lib/validation.js';
import { sendSuccess } from '../../lib/response.js';

const router = Router();

router.get('/', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const filters = {
    hospital_id: (req.query.hospital_id as string) || (req.user!.hospital_id ?? undefined),
    low_stock: req.query.low_stock === 'true',
    search: req.query.search as string,
    page: parseInt(req.query.page as string) || 1,
    limit: parseInt(req.query.limit as string) || 10,
  };

  const result = await inventoryService.list(filters);
  sendSuccess(res, result.parts, { total: result.total, page: filters.page, limit: filters.limit });
}));

router.post('/', requireAuth, requirePermission('create', 'Inventory'), asyncHandler(async (req: AuthRequest, res) => {
  const validatedBody = validate(createInventorySchema, req.body);
  const part = await inventoryService.create(validatedBody, req.user!.user_id);
  sendSuccess(res, part, null, 201);
}));

router.patch('/:id', requireAuth, requirePermission('update', 'Inventory'), asyncHandler(async (req: AuthRequest, res) => {
  const validatedBody = validate(updateInventorySchema, req.body);
  const part = await inventoryService.update(req.params.id as string, validatedBody, req.user!.user_id);
  sendSuccess(res, part);
}));

router.get('/scan/:barcode', requireAuth, asyncHandler(async (req, res) => {
  const part = await inventoryService.getByBarcode(req.params.barcode as string);
  sendSuccess(res, part);
}));

export default router;
