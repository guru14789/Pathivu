import { Response, NextFunction } from 'express';
import { defineAbilityFor, Actions, Subjects } from '../lib/ability.js';
import { ForbiddenError } from '../lib/errors.js';
import { AuthRequest } from './auth.middleware.js';

export const requirePermission = (action: Actions, subject: Subjects) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new ForbiddenError('User not authenticated');
    }

    const ability = defineAbilityFor(req.user);

    if (ability.cannot(action, subject as any)) {
      throw new ForbiddenError(`You do not have permission to ${action} ${String(subject)}`);
    }

    // Auto-inject hospital_id for scoped roles
    if (['branch_admin', 'supervisor', 'technician'].includes(req.user.role)) {
      req.scopedHospitalId = req.user.hospital_id;
    }

    next();
  };
};
