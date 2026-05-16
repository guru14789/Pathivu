import { z } from 'zod';
import { createFaultSchema as sharedFaultSchema } from '@bewell/shared';

export const createFaultSchema = sharedFaultSchema.refine(data => data.asset_id || data.asset_tag, {
  message: "Either asset_id or asset_tag must be provided",
  path: ["asset_id"],
});

export const updateFaultSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  resolution_notes: z.string().optional(),
});
