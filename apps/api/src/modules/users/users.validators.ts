import { z } from 'zod';
import { createUserSchema as sharedUserSchema, userRoleEnum } from '@bewell/shared';

export const createUserSchema = sharedUserSchema.extend({
  is_active: z.boolean().optional().default(true),
}).strip();

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6).optional(),
});

export const userQuerySchema = z.object({
  role: userRoleEnum.optional(),
  is_active: z.string().transform(v => v === 'true').optional(),
  hospital_id: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
}).strip();
