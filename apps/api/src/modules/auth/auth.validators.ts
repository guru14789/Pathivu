import { z } from 'zod';
import { loginSchema as sharedLoginSchema } from '@bewell/shared';

export const loginSchema = sharedLoginSchema.strip();

export type LoginInput = z.infer<typeof loginSchema>;
