import { z } from "zod";

export const createPotluckSchema = z.object({
    title: z.string().min(5, "Title must be at least 5 characters").max(100),
    description: z.string().max(500).optional(),
    mealId: z.string().uuid().optional(),
    totalPlatesAvailable: z.number().int().min(5).max(1000),
    targetOrderCount: z.number().int().min(1).max(1000),
    pricePerPlateRs: z.number().min(50).max(50000),
    regularPriceRs: z.number().min(50).max(50000),
    expiresAt: z.string().datetime(), // ISO datetime string
});

export type CreatePotluckInput = z.infer<typeof createPotluckSchema>;

export const reservePotluckSchema = z.object({
    quantity: z.number().int().min(1).max(50),
});

export type ReservePotluckInput = z.infer<typeof reservePotluckSchema>;
