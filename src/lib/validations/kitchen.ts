import { z } from "zod";

// ─── Kitchen Validation ─────────────────────────────────────────────────────

export const createKitchenSchema = z.object({
    name: z
        .string()
        .min(2, "Kitchen name must be at least 2 characters")
        .max(255, "Kitchen name must be at most 255 characters")
        .trim(),
    description: z
        .string()
        .max(2000, "Description must be at most 2000 characters")
        .trim()
        .optional(),
    profileImageUrl: z.string().url().optional(),
    coverImageUrl: z.string().url().optional(),
    images: z.array(z.string().url()).max(10).optional(),

    // Address
    addressLine: z.string().max(500).trim().optional(),
    city: z
        .string()
        .min(1, "City is required")
        .max(100)
        .trim(),
    area: z.string().max(200).trim().optional(),
    state: z.string().max(100).trim().optional(),
    country: z.string().max(100).trim().default("Pakistan"),
    postalCode: z.string().max(20).trim().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),

    // Contact
    contactPhone: z
        .string()
        .regex(/^\+?[\d\s-]{7,20}$/, "Invalid phone number")
        .optional(),
    contactWhatsapp: z
        .string()
        .regex(/^\+?[\d\s-]{7,20}$/, "Invalid WhatsApp number")
        .optional(),
    contactEmail: z.string().email("Invalid email").optional(),

    // Food
    cuisineTypes: z.array(z.string().max(100)).max(20).optional(),
    dietaryTags: z.array(z.string().max(50)).max(10).optional(),
});

export const updateKitchenSchema = createKitchenSchema.partial();

export const kitchenQuerySchema = z.object({
    city: z.string().optional(),
    area: z.string().optional(),
    cuisine: z.string().optional(),
    dietary: z.string().optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    maxPrice: z.coerce.number().positive().optional(),
    sort: z
        .enum(["rating", "newest", "boost", "distance"])
        .default("boost"),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20),
    lat: z.coerce.number().min(-90).max(90).optional(),
    lng: z.coerce.number().min(-180).max(180).optional(),
    radiusKm: z.coerce.number().min(1).max(50).default(10),
});

export type CreateKitchenInput = z.infer<typeof createKitchenSchema>;
export type UpdateKitchenInput = z.infer<typeof updateKitchenSchema>;
export type KitchenQueryInput = z.infer<typeof kitchenQuerySchema>;
