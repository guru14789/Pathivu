import { z } from 'zod';
import { ValidationError } from './errors.js';

export const validate = <T = any>(schema: any, data: unknown): T => {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError('Validation failed', result.error.flatten().fieldErrors);
  }
  return result.data;
};
