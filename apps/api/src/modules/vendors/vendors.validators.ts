import { z } from 'zod';

export const createVendorSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(150),
    contact_person: z.string().max(100).optional(),
    email: z.string().email('Invalid email').max(150).optional().or(z.literal('')),
    phone: z.string().max(30).optional(),
    address: z.string().optional(),
    gst_number: z.string().max(20).optional(),
    is_active: z.boolean().optional(),
  }),
});

export const updateVendorSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(150).optional(),
    contact_person: z.string().max(100).optional(),
    email: z.string().email().max(150).optional().or(z.literal('')),
    phone: z.string().max(30).optional(),
    address: z.string().optional(),
    gst_number: z.string().max(20).optional(),
    performance_rating: z.string().regex(/^\d{1}\.\d{2}$/).optional(),
    is_active: z.boolean().optional(),
  }),
});
