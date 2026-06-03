import { z } from "zod";

// ─── Order Validation ───────────────────────────────────────────────────────

export const createOrderSchema = z.object({
    kitchenId: z.string().uuid("Invalid kitchen ID"),
    items: z
        .array(
            z.object({
                mealId: z.string().uuid("Invalid meal ID"),
                quantity: z.number().int().min(1).max(50),
                notes: z.string().max(500).optional(),
            })
        )
        .min(1, "Order must have at least one item")
        .max(20, "Order can have at most 20 items"),
    notes: z.string().max(1000).optional(),
    deliveryMode: z.enum(["SELF_PICKUP", "FREE_DELIVERY"]).optional(),
    customerAddress: z.string().max(500).optional(),
    customerLat: z.number().min(-90).max(90).optional(),
    customerLng: z.number().min(-180).max(180).optional(),
    paymentMethod: z.enum(["COD", "STRIPE", "JAZZCASH", "EASYPAISA"]).optional().default("COD"),
});

export const updateOrderStatusSchema = z.object({
    status: z.enum(["ACCEPTED", "COMPLETED", "CANCELLED"]),
    estimatedMinutes: z.number().int().min(5).max(180).optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
