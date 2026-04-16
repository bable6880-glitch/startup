import { z } from "zod";

// ─── Menu / Meal Validation ─────────────────────────────────────────────────

export const createMealSchema = z.object({
    name: z
        .string()
        .min(2, "Meal name must be at least 2 characters")
        .max(255)
        .trim(),
    description: z.string().max(1000).trim().optional(),
    price: z
        .number()
        .int("Price must be in smallest currency unit (paise/cents)")
        .positive("Price must be positive"),
    currency: z.string().length(3).default("PKR"),
    imageUrl: z.string().url().optional(),
    images: z.array(z.string().url()).max(5).optional(),

    // Category
    category: z
        .enum(["breakfast", "lunch", "dinner", "snack", "dessert", "beverage", "thali", "other"])
        .optional(),
    cuisineType: z.string().max(100).optional(),
    dietaryTags: z.array(z.string().max(50)).max(10).optional(),

    // Availability
    isAvailable: z.boolean().default(true),
    availabilityStatus: z.enum(["AVAILABLE", "OUT_OF_STOCK", "NOT_TODAY", "PREPARING"]).optional(),
    availableDays: z
        .array(
            z.enum([
                "monday",
                "tuesday",
                "wednesday",
                "thursday",
                "friday",
                "saturday",
                "sunday",
            ])
        )
        .optional(),
    servingTime: z
        .string()
        .regex(/^\d{2}:\d{2}-\d{2}:\d{2}$/, "Format: HH:MM-HH:MM")
        .optional(),

    // Optional
    calories: z.number().int().positive().optional(),
    servingSize: z.string().max(100).optional(),
    sortOrder: z.number().int().min(0).default(0),
});

export const updateMealSchema = createMealSchema.partial();

export type CreateMealInput = z.infer<typeof createMealSchema>;
export type UpdateMealInput = z.infer<typeof updateMealSchema>;
