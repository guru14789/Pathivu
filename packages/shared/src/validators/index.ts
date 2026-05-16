import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const userRoleEnum = z.enum(['super_admin', 'branch_admin', 'supervisor', 'technician', 'auditor', 'vendor']);

export const createUserSchema = z.object({
  hospital_id: z.string().uuid().nullable(),
  full_name: z.string().min(2).max(150),
  email: z.string().email().max(150),
  password: z.string().min(6),
  role: userRoleEnum,
  department: z.string().max(100).optional(),
});

export const assetStatusEnum = z.enum(['active', 'maintenance', 'condemned', 'transferred']);
export const assetConditionEnum = z.enum(['good', 'fair', 'poor', 'critical']);

export const createAssetSchema = z.object({
  hospital_id: z.string().uuid(),
  category_id: z.string().uuid(),
  location_id: z.string().uuid(),
  name: z.string().min(2).max(150),
  serial_number: z.string().max(100).optional().nullable(),
  model: z.string().max(100).optional().nullable(),
  manufacturer: z.string().max(100).optional().nullable(),
  purchase_date: z.string().optional().nullable(),
  purchase_cost: z.number().optional().nullable(),
  warranty_expiry: z.string().optional().nullable(),
  useful_life_years: z.number().optional().nullable(),
  salvage_value: z.number().optional().nullable(),
  is_critical: z.boolean().optional().default(false),
});

export const faultSeverityEnum = z.enum(['low', 'medium', 'high', 'critical']);
export const createFaultSchema = z.object({
  asset_id: z.string().uuid().optional(),
  asset_tag: z.string().optional(),
  fault_type: z.string().min(2),
  description: z.string().min(5),
  severity: faultSeverityEnum,
});
