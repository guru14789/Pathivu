import { z } from 'zod';

export const createHospitalSchema = z.object({
  name: z.string().max(150),
  code: z.string().length(3).transform(v => v.toUpperCase()),
  city: z.string().max(100).optional(),
  address: z.string().optional(),
  contact_person: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  bed_count: z.number().int().optional(),
  is_active: z.boolean().optional(),
}).strip();

export const updateHospitalSchema = createHospitalSchema.partial();

export const hospitalQuerySchema = z.object({
  search: z.string().optional(),
  is_active: z.string().transform(v => v === 'true').optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
}).strip();
