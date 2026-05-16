import { z } from 'zod';

export const createLocationSchema = z.object({
  building: z.string().max(100).optional(),
  floor: z.string().max(20).optional(),
  room_number: z.string().max(20).optional(),
  department: z.string().min(1).max(100),
});
