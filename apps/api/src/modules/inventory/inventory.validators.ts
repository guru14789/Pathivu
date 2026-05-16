import { z } from 'zod';

export const createInventorySchema = z.object({
  body: z.object({
    hospital_id: z.string().uuid(),
    vendor_id: z.string().uuid().optional().nullable(),
    name: z.string().min(1).max(150),
    part_number: z.string().max(100).optional(),
    barcode: z.string().max(100).optional(),
    unit: z.string().max(30).optional(),
    stock_quantity: z.number().int().min(0),
    reorder_threshold: z.number().int().min(0).optional(),
    unit_cost: z.string().optional(),
    location_notes: z.string().optional(),
  }),
});

export const updateInventorySchema = z.object({
  body: z.object({
    vendor_id: z.string().uuid().optional().nullable(),
    name: z.string().min(1).max(150).optional(),
    part_number: z.string().max(100).optional(),
    barcode: z.string().max(100).optional(),
    unit: z.string().max(30).optional(),
    stock_quantity: z.number().int().min(0).optional(),
    reorder_threshold: z.number().int().min(0).optional(),
    unit_cost: z.string().optional(),
    location_notes: z.string().optional(),
    is_active: z.boolean().optional(),
  }),
});
