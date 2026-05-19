import { z } from 'zod';
import { loginSchema as sharedLoginSchema } from '@bewell/shared';

export const loginSchema = sharedLoginSchema.strip();

export type LoginInput = z.infer<typeof loginSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email('Valid email is required'),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const confirmResetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
});

export type ConfirmResetInput = z.infer<typeof confirmResetSchema>;
