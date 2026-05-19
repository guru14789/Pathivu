import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../db/index.js';
import { users } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { AppError, UnauthorizedError } from '../../lib/errors.js';
import { LoginInput } from './auth.validators.js';
import { defineAbilityFor } from '../../lib/ability.js';

export const authService = {
  async login(input: LoginInput) {
    const [user] = await db.select().from(users).where(eq(users.email, input.email)).limit(1);

    if (!user) {
      throw new AppError('AUTH_FAILED', 'Invalid credentials', 401);
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password_hash);
    if (!isPasswordValid) {
      throw new AppError('AUTH_FAILED', 'Invalid credentials', 401);
    }

    if (!user.is_active) {
      throw new AppError('FORBIDDEN', 'Account deactivated', 403);
    }

    const payload = {
      user_id: user.user_id,
      role: user.role,
      hospital_id: user.hospital_id,
      email: user.email,
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
    const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });

    // Update last login
    await db.update(users).set({ last_login: new Date() }).where(eq(users.user_id, user.user_id));

    const ability = defineAbilityFor({
      user_id: user.user_id,
      role: user.role as any,
      hospital_id: user.hospital_id,
      department: user.department,
      email: user.email,
    });

    return {
      user: {
        user_id: user.user_id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        hospital_id: user.hospital_id,
        permissions: ability.rules,
      },
      accessToken,
      refreshToken,
      expiresIn: 900,
    };
  },

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as any;
      const payload = {
        user_id: decoded.user_id,
        role: decoded.role,
        hospital_id: decoded.hospital_id,
        email: decoded.email,
      };
      const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
      return { accessToken, expiresIn: 900 };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }
};
