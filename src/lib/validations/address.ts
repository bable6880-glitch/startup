import { z } from "zod";

export const createAddressSchema = z.object({
  label:       z.string().max(50).optional().default("Home"),
  addressLine: z.string().min(5).max(500),
  city:        z.string().max(100).optional(),
  area:        z.string().max(100).optional(),
  isDefault:   z.boolean().optional().default(false),
});

export const updateAddressSchema = createAddressSchema.partial();
export type CreateAddressInput = z.infer<typeof createAddressSchema>;
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>;
