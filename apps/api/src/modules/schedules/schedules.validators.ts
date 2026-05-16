import { z } from 'zod';

export const createScheduleSchema = z.object({
  asset_id: z.string().uuid(),
  hospital_id: z.string().uuid(),
  schedule_type: z.enum(['PPM', 'calibration', 'statutory_inspection']),
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'biannual', 'annual']),
  last_service_date: z.string().optional(),
});

export const updateScheduleSchema = z.object({
  frequency: z.enum(['weekly', 'monthly', 'quarterly', 'biannual', 'annual']).optional(),
  last_service_date: z.string().optional(),
  is_active: z.boolean().optional(),
});
