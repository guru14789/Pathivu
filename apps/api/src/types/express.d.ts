import { AuthUser } from '../lib/ability.js';

declare global {
  namespace Express {
    interface Request {
      id: string;
      user?: AuthUser;
      scopedHospitalId?: string | null;
    }
  }
}

export {};
