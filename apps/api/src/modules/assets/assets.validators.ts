import { z } from 'zod';
import { createAssetSchema as sharedAssetSchema } from '@bewell/shared';

export const createAssetSchema = sharedAssetSchema.extend({
  depreciation_method: z.enum(['SLM', 'WDV']).optional(),
  custom_attributes: z.string().optional(),
});

export const updateAssetSchema = createAssetSchema.partial().omit({ hospital_id: true });
