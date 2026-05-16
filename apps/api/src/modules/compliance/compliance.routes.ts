import { Router } from 'express';
import { complianceService } from './compliance.service.js';
import { createComplianceSchema, updateComplianceSchema } from './compliance.validators.js';
import { validate } from '../../middleware/validate.middleware.js';
import { requireAuth, requireRole } from '../../middleware/auth.middleware.js';
import { uploadSingle } from '../../middleware/upload.middleware.js';
import { sendSuccess } from '../../lib/response.js';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const filters = {
      hospital_id: req.query.hospital_id as string,
      status: req.query.status as string,
      cert_type: req.query.cert_type as string,
      asset_id: req.query.asset_id as string,
      expiring_within: req.query.expiring_within ? parseInt(req.query.expiring_within as string) : undefined,
      grouped: req.query.grouped === 'true',
    };

    const results = await complianceService.list(filters);
    sendSuccess(res, results);
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, requireRole(['super_admin', 'branch_admin']), uploadSingle('document'), validate(createComplianceSchema), async (req, res, next) => {
  try {
    const doc = await complianceService.create(req.body, req.file, req.user!.id);
    sendSuccess(res, doc, null, 201);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', requireAuth, requireRole(['super_admin', 'branch_admin']), uploadSingle('document'), validate(updateComplianceSchema), async (req, res, next) => {
  try {
    const doc = await complianceService.update(req.params.id, req.body, req.file, req.user!.id);
    sendSuccess(res, doc);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, requireRole(['super_admin', 'branch_admin']), async (req, res, next) => {
  try {
    const result = await complianceService.delete(req.params.id, req.user!.id);
    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
});

export default router;
