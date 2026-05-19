import { Router } from 'express';
import { asyncHandler } from '../../lib/asyncHandler.js';
import { authService } from './auth.service.js';
import { loginSchema, resetPasswordSchema, confirmResetSchema } from './auth.validators.js';
import { requireAuth, AuthRequest } from '../../middleware/auth.middleware.js';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { defineAbilityFor } from '../../lib/ability.js';
import { validate } from '../../lib/validation.js';
import { UnauthorizedError, NotFoundError } from '../../lib/errors.js';
import { sendMail } from '../../lib/mailer.js';

import { sendSuccess } from '../../lib/response.js';

const router = Router();

router.post('/login', asyncHandler(async (req, res) => {
  const validatedBody = validate(loginSchema, req.body);
  const result = await authService.login(validatedBody);

  res.cookie('refresh_token', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return sendSuccess(res, {
    user: result.user,
    accessToken: result.accessToken,
    expiresIn: result.expiresIn,
  });
}));

router.post('/logout', requireAuth, (req, res) => {
  res.clearCookie('refresh_token');
  return res.status(204).send();
});

router.post('/refresh', asyncHandler(async (req, res) => {
  const refreshToken = req.cookies?.refresh_token;
  if (!refreshToken) {
    throw new UnauthorizedError('Missing refresh token');
  }

  const result = await authService.refreshToken(refreshToken);
  return sendSuccess(res, result);
}));

router.get('/me', requireAuth, asyncHandler(async (req: AuthRequest, res) => {
  const [user] = await db.select().from(users).where(eq(users.user_id, req.user!.user_id)).limit(1);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

  const { password_hash, ...userWithoutPassword } = user;
  
  const ability = defineAbilityFor({
    user_id: user.user_id,
    role: user.role as any,
    hospital_id: user.hospital_id,
    department: user.department,
    email: user.email,
  });

  return sendSuccess(res, {
    ...userWithoutPassword,
    permissions: ability.rules,
  });
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const { email } = validate(resetPasswordSchema, req.body);
  try {
    const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (user) {
      const resetToken = jwt.sign({ user_id: user.user_id }, process.env.JWT_SECRET!, { expiresIn: '1h' });
      const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
      await sendMail({
        to: email,
        subject: 'BeWell AssetIQ - Password Reset Request',
        html: `Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.`
      });
    }
  } catch (_) {
    // Silently fail - don't expose email existence
  }
  return sendSuccess(res, { message: 'If the email exists, a reset link has been sent' });
}));

router.post('/confirm-reset', asyncHandler(async (req, res) => {
  const { token, new_password } = validate(confirmResetSchema, req.body);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const password_hash = await bcrypt.hash(new_password, 12);
    await db.update(users).set({ password_hash }).where(eq(users.user_id, decoded.user_id));
    return sendSuccess(res, { message: 'Password reset successful' });
  } catch (_) {
    throw new UnauthorizedError('Invalid or expired reset token');
  }
}));

export default router;
