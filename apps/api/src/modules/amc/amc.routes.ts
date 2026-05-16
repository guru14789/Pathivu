import { Router } from 'express';
import { amcService } from './amc.service.js';
import { createAMCSchema, updateAMCSchema } from './amc.validators.js';
import { validate } from '../../middleware/validate.middleware.js';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { uploadSingle } from '../../middleware/upload.middleware.js';
import { sendSuccess } from '../../lib/response.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const filters = {
      vendor_id: req.query.vendor_id as string,
      hospital_id: req.query.hospital_id as string,
      expiring_within: req.query.expiring_within ? parseInt(req.query.expiring_within as string) : undefined,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
    };

    const contracts = await amcService.list(filters);
    sendSuccess(res, contracts);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireRole(['super_admin', 'branch_admin']), uploadSingle('document'), validate(createAMCSchema), async (req, res, next) => {
  try {
    const contract = await amcService.create(req.body, req.file, req.user!.id);
    sendSuccess(res, contract, null, 201);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireAuth, requireRole(['super_admin', 'branch_admin']), validate(updateAMCSchema), async (req, res, next) => {
  try {
    const contract = await amcService.update(req.params.id, req.body, req.user!.id);
    sendSuccess(res, contract);
  } catch (error) {
    next(error);
  }
});

export default router;
