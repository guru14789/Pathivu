import { z } from 'zod';

export const createComplianceSchema = z.object({
  hospital_id: z.string().uuid(),
  asset_id: z.string().uuid().optional().nullable(),
  cert_type: z.string().min(1),
  issued_by: z.string().optional(),
  issued_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notes: z.string().optional(),
});

export const updateComplianceSchema = z.object({
  cert_type: z.string().min(1).optional(),
  issued_by: z.string().optional(),
  issued_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  expiry_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  notes: z.string().optional(),
  status: z.enum(['valid', 'expiring_soon', 'expired']).optional(),
});
