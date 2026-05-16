import { z } from 'zod';

export const scanLogQuerySchema = z.object({
  asset_id: z.string().uuid().optional(),
  scanned_by: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
}).strip();

export const generateQrSchema = z.object({
  asset_id: z.string().uuid(),
  format: z.enum(['qr', 'barcode_code128', 'barcode_ean13']).default('qr'),
}).strip();

export const bulkGenerateSchema = z.object({
  asset_ids: z.array(z.string().uuid()),
  format: z.enum(['qr', 'barcode_code128', 'barcode_ean13']).default('qr'),
}).strip();

export const publicFaultSchema = z.object({
  fault_type: z.string().optional(),
  description: z.string().min(1),
  severity: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  photo_url: z.string().optional(),
}).strip();
