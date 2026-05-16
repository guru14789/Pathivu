import { z } from 'zod';

export const createMaintenanceSchema = z.object({
  asset_id: z.string().uuid(),
  hospital_id: z.string().uuid(),
  maintenance_type: z.enum(['PPM', 'breakdown', 'calibration', 'inspection', 'AMC_service']),
  priority: z.enum(['P1', 'P2', 'P3']).default('P2'),
  scheduled_date: z.string().optional(),
  notes: z.string().optional(),
});

export const updateMaintenanceSchema = z.object({
  status: z.enum(['open', 'in_progress', 'completed', 'cancelled']).optional(),
  assigned_to: z.string().uuid().optional(),
  priority: z.enum(['P1', 'P2', 'P3']).optional(),
  technician_remarks: z.string().optional(),
  downtime_hours: z.string().optional(),
  cost: z.string().optional(),
  condition: z.enum(['good', 'fair', 'poor', 'critical']).optional(),
});
