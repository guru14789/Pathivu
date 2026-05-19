import { z } from 'zod';

export const createAMCSchema = z.object({
  vendor_id: z.string().uuid(),
  hospital_id: z.string().uuid(),
  asset_id: z.string().uuid().optional().nullable(),
  category_id: z.string().uuid().optional().nullable(),
  contract_number: z.string().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  contract_value: z.string().optional(),
  response_sla_hours: z.number().int().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
});

export const updateAMCSchema = z.object({
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  contract_value: z.string().optional(),
  response_sla_hours: z.number().int().optional(),
  notes: z.string().optional(),
  is_active: z.boolean().optional(),
});
