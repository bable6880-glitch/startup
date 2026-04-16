import { z } from "zod";

// ─── Review Validation ──────────────────────────────────────────────────────

export const createKitchenReviewSchema = z.object({
    kitchenId: z.string().uuid("Invalid kitchen ID"),
    orderId: z.string().uuid("Invalid order ID"),
    rating: z.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
    comment: z
        .string()
        .max(500, "Comment must be at most 500 characters")
        .trim()
        .optional(),
});

export const createPlatformReviewSchema = z.object({
    rating: z.number().int().min(1, "Rating must be 1-5").max(5, "Rating must be 1-5"),
    comment: z
        .string()
        .max(500, "Comment must be at most 500 characters")
        .trim()
        .optional(),
});

export const sellerReplySchema = z.object({
    reviewId: z.string().uuid("Invalid review ID"),
    reply: z
        .string()
        .min(1, "Reply cannot be empty")
        .max(300, "Reply must be at most 300 characters")
        .trim(),
});

export const reviewQuerySchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    sort: z.enum(["newest", "oldest", "highest", "lowest"]).default("newest"),
});

export type CreateKitchenReviewInput = z.infer<typeof createKitchenReviewSchema>;
export type CreatePlatformReviewInput = z.infer<typeof createPlatformReviewSchema>;
export type SellerReplyInput = z.infer<typeof sellerReplySchema>;
export type ReviewQueryInput = z.infer<typeof reviewQuerySchema>;
