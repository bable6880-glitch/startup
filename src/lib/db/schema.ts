import {
    pgTable,
    uuid,
    varchar,
    text,
    integer,
    boolean,
    timestamp,
    decimal,
    pgEnum,
    index,
    uniqueIndex,
    jsonb,
    date,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ─── Enums ──────────────────────────────────────────────────────────────────

export const userRoleEnum = pgEnum("user_role", [
    "CUSTOMER",
    "COOK",
    "ADMIN",
]);

export const kitchenStatusEnum = pgEnum("kitchen_status", [
    "ACTIVE",
    "SUSPENDED",
    "INACTIVE",
]);

export const orderStatusEnum = pgEnum("order_status", [
    "PENDING",
    "ACCEPTED",
    "COMPLETED",
    "CANCELLED",
]);

export const subscriptionStatusEnum = pgEnum("subscription_status", [
    "TRIALING",
    "ACTIVE",
    "CANCELLED",
    "EXPIRED",
    "PAST_DUE",
    "SUSPENDED",
    "SUPERSEDED",
]);

export const paymentMethodEnum = pgEnum("payment_method", [
    "STRIPE",
    "JAZZCASH",
    "EASYPAISA",
    "BANK_TRANSFER",
    "SADAPAY",
    "FREE_TRIAL",
    "COD",
]);

export const subscriptionPlanTypeEnum = pgEnum("subscription_plan_type", [
    "BASE_MONTHLY",
    "BASE_2MONTH",
    "BASE_4MONTH",
]);

export const menuAvailabilityEnum = pgEnum("menu_availability", [
    "AVAILABLE",
    "OUT_OF_STOCK",
    "NOT_TODAY",
    "PREPARING",
]);

export const deliveryModeEnum = pgEnum("delivery_mode", [
    "SELF_PICKUP",
    "FREE_DELIVERY",
]);

export const boostStatusEnum = pgEnum("boost_status", [
    "ACTIVE",
    "EXPIRED",
    "CANCELLED",
]);

export const reportStatusEnum = pgEnum("report_status", [
    "PENDING",
    "REVIEWED",
    "RESOLVED",
    "DISMISSED",
]);

export const reportTargetEnum = pgEnum("report_target", [
    "KITCHEN",
    "REVIEW",
    "USER",
]);

export const planConfigEnum = pgEnum("plan_config_enum", [
    "starter",
    "growth",
    "pro",
    "elite",
]);

export const potluckStatusEnum = pgEnum("potluck_status_enum", [
    "DRAFT",
    "PENDING",
    "ACTIVE",
    "FILLED",
    "CANCELLED",
    "EXPIRED",
]);

export const khataEntryTypeEnum = pgEnum("khata_entry_type_enum", [
    "INCOME",
    "EXPENSE",
    "WITHDRAWAL",
    "COMMISSION",
    "REFUND",
    "ADJUSTMENT",
]);

// ─── Users ──────────────────────────────────────────────────────────────────

export const users = pgTable(
    "users",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        firebaseUid: varchar("firebase_uid", { length: 128 }).notNull().unique(),
        email: varchar("email", { length: 255 }),
        name: varchar("name", { length: 255 }),
        phone: varchar("phone", { length: 20 }),
        avatarUrl: text("avatar_url"),
        role: userRoleEnum("role").default("CUSTOMER").notNull(),
        isPhoneVerified: boolean("is_phone_verified").default(false).notNull(),
        isEmailVerified: boolean("is_email_verified").default(false).notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        fcmToken: text("fcm_token"), // Device token for push notifications
        deletedAt: timestamp("deleted_at", { withTimezone: true }),
        defaultAddress: text("default_address"),
        defaultCity: varchar("default_city", { length: 100 }),
        phoneNumber: varchar("phone_number", { length: 20 }),
    },
    (table) => [
        uniqueIndex("users_firebase_uid_idx").on(table.firebaseUid),
        index("users_email_idx").on(table.email),
        index("users_role_idx").on(table.role),
        index("users_active_idx").on(table.isActive),
    ]
);

// ─── Kitchens ───────────────────────────────────────────────────────────────

export const kitchens = pgTable(
    "kitchens",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        ownerId: uuid("owner_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 255 }).notNull(),
        slug: varchar("slug", { length: 255 }).notNull().unique(),
        description: text("description"),
        profileImageUrl: text("profile_image_url"),
        coverImageUrl: text("cover_image_url"),
        images: text("images").array(),

        // Address
        addressLine: varchar("address_line", { length: 500 }),
        city: varchar("city", { length: 100 }).notNull(),
        citySlug: varchar("city_slug", { length: 100 }).notNull(),
        area: varchar("area", { length: 200 }),
        areaSlug: varchar("area_slug", { length: 200 }),
        state: varchar("state", { length: 100 }),
        country: varchar("country", { length: 100 }).default("Pakistan").notNull(),
        postalCode: varchar("postal_code", { length: 20 }),
        latitude: decimal("latitude", { precision: 10, scale: 7 }),
        longitude: decimal("longitude", { precision: 10, scale: 7 }),

        // Contact
        contactPhone: varchar("contact_phone", { length: 20 }),
        contactWhatsapp: varchar("contact_whatsapp", { length: 20 }),
        contactEmail: varchar("contact_email", { length: 255 }),

        // Delivery options the seller supports
        deliveryOptions: text("delivery_options").array(), // ["SELF_PICKUP", "FREE_DELIVERY"]

        // Cuisine & food
        cuisineTypes: text("cuisine_types").array(),
        dietaryTags: text("dietary_tags").array(), // veg, non-veg, vegan, etc.

        // Status & verification
        status: kitchenStatusEnum("status").default("ACTIVE").notNull(),
        isOpen: boolean("is_open").default(true).notNull(),
        isVerified: boolean("is_verified").default(false).notNull(),
        isWhatsappVerified: boolean("is_whatsapp_verified")
            .default(false)
            .notNull(),

        // Trial & subscription tracking
        trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
        isTrialUsed: boolean("is_trial_used").default(false).notNull(),

        // Aggregated ratings (denormalized for performance)
        avgRating: decimal("avg_rating", { precision: 3, scale: 2 }).default("0"),
        reviewCount: integer("review_count").default(0).notNull(),

        // Boost & premium
        boostPriority: integer("boost_priority").default(0).notNull(),
        boostExpiresAt: timestamp("boost_expires_at", { withTimezone: true }),

        // Timestamps
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (table) => [
        // Primary search index: city + active + boost (most common query)
        index("kitchens_city_active_boost_idx").on(
            table.citySlug,
            table.status,
            table.boostPriority
        ),
        index("kitchens_owner_idx").on(table.ownerId),
        index("kitchens_area_idx").on(table.areaSlug),
        index("kitchens_rating_idx").on(table.avgRating),
        index("kitchens_status_idx").on(table.status),
        uniqueIndex("kitchens_slug_idx").on(table.slug),
    ]
);

// ─── Meals (Menu Items) ────────────────────────────────────────────────────

export const meals = pgTable(
    "meals",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        kitchenId: uuid("kitchen_id")
            .notNull()
            .references(() => kitchens.id, { onDelete: "cascade" }),
        name: varchar("name", { length: 255 }).notNull(),
        description: text("description"),
        price: integer("price").notNull(), // price in smallest unit (paise/cents)
        currency: varchar("currency", { length: 3 }).default("PKR").notNull(),
        imageUrl: text("image_url"),
        images: text("images").array(),

        // Categorization
        category: varchar("category", { length: 100 }), // breakfast, lunch, dinner, snack
        cuisineType: varchar("cuisine_type", { length: 100 }),
        dietaryTags: text("dietary_tags").array(), // veg, non-veg, vegan, gluten-free

        // Availability
        isAvailable: boolean("is_available").default(true).notNull(),
        availabilityStatus: menuAvailabilityEnum("availability_status").default("AVAILABLE").notNull(),
        availableDays: text("available_days").array(), // ['monday','tuesday',...]
        servingTime: varchar("serving_time", { length: 50 }), // "12:00-14:00"

        // Nutrition (optional)
        calories: integer("calories"),
        servingSize: varchar("serving_size", { length: 100 }),

        // Sort
        sortOrder: integer("sort_order").default(0).notNull(),

        // Timestamps
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (table) => [
        index("meals_kitchen_idx").on(table.kitchenId),
        index("meals_available_idx").on(table.kitchenId, table.isAvailable),
        index("meals_category_idx").on(table.category),
        index("meals_price_idx").on(table.price),
    ]
);

// ─── Platform Reviews ───────────────────────────────────────────────────────

export const platformReviews = pgTable(
    "platform_reviews",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        rating: integer("rating").notNull(), // 1-5
        comment: text("comment"), // max 500 chars enforced in validation
        isVisible: boolean("is_visible").default(true).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    }
);

export const platformReviewsRelations = relations(platformReviews, ({ one }) => ({
    user: one(users, {
        fields: [platformReviews.userId],
        references: [users.id],
    }),
}));

// ─── Reviews ────────────────────────────────────────────────────────────────

export const reviews = pgTable(
    "reviews",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        kitchenId: uuid("kitchen_id")
            .notNull()
            .references(() => kitchens.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        menuItemId: uuid("menu_item_id").references(() => meals.id, {
            onDelete: "set null",
        }),
        rating: integer("rating").notNull(), // 1-5
        comment: text("comment"),
        isPinned: boolean("is_pinned").default(false).notNull(),
        sellerReply: text("seller_reply"),
        sellerRepliedAt: timestamp("seller_replied_at", { withTimezone: true }),
        isVerifiedPurchase: boolean("is_verified_purchase")
            .default(false)
            .notNull(),
        isVisible: boolean("is_visible").default(true).notNull(),
        isFlagged: boolean("is_flagged").default(false).notNull(),
        flagReason: text("flag_reason"),

        // Timestamps
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (table) => [
        // Multiple reviews per user per kitchen allowed
        index("reviews_user_kitchen_idx").on(table.userId, table.kitchenId),
        index("reviews_kitchen_idx").on(table.kitchenId),
        index("reviews_user_idx").on(table.userId),
        index("reviews_visible_idx").on(table.kitchenId, table.isVisible),
        index("reviews_rating_idx").on(table.rating),
    ]
);

// ─── Orders ─────────────────────────────────────────────────────────────────

export const orders = pgTable(
    "orders",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        kitchenId: uuid("kitchen_id")
            .notNull()
            .references(() => kitchens.id, { onDelete: "cascade" }),
        customerId: uuid("customer_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        status: orderStatusEnum("status").default("PENDING").notNull(),
        notes: text("notes"),
        totalAmount: integer("total_amount"), // estimated total in smallest unit
        currency: varchar("currency", { length: 3 }).default("PKR").notNull(),

        // Delivery
        deliveryMode: deliveryModeEnum("delivery_mode").default("SELF_PICKUP").notNull(),
        estimatedMinutes: integer("estimated_minutes"),

        // Customer location (for map)
        customerLat: decimal("customer_lat", { precision: 10, scale: 7 }),
        customerLng: decimal("customer_lng", { precision: 10, scale: 7 }),
        customerAddress: text("customer_address"),
        customerName: varchar("customer_name", { length: 255 }),
        customerPhone: varchar("customer_phone", { length: 20 }),
        deliveryAddress: text("delivery_address"),

        // N1: Payment fields
        paymentMethod: paymentMethodEnum("payment_method").default("STRIPE"),
        paymentStatus: varchar("payment_status", { length: 20 }).default("UNPAID").notNull(), // UNPAID | PAID | REFUNDED | FAILED
        stripePaymentIntentId: varchar("stripe_payment_intent_id", { length: 255 }),

        // Timestamps
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        acceptedAt: timestamp("accepted_at", { withTimezone: true }),
        completedAt: timestamp("completed_at", { withTimezone: true }),
        cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
        deletedAt: timestamp("deleted_at", { withTimezone: true }),
    },
    (table) => [
        index("orders_kitchen_idx").on(table.kitchenId),
        index("orders_customer_idx").on(table.customerId),
        index("orders_status_idx").on(table.status),
        index("orders_created_idx").on(table.createdAt),
    ]
);

// ─── Order Items ────────────────────────────────────────────────────────────

export const orderItems = pgTable(
    "order_items",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        orderId: uuid("order_id")
            .notNull()
            .references(() => orders.id, { onDelete: "cascade" }),
        mealId: uuid("meal_id")
            .notNull()
            .references(() => meals.id, { onDelete: "cascade" }),
        quantity: integer("quantity").notNull().default(1),
        priceAtOrder: integer("price_at_order").notNull(), // snapshot of meal price
        notes: text("notes"),
    },
    (table) => [
        index("order_items_order_idx").on(table.orderId),
        index("order_items_meal_idx").on(table.mealId),
    ]
);

// ─── Subscriptions (Cook Premium Plans) ─────────────────────────────────────

export const subscriptions = pgTable(
    "subscriptions",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        kitchenId: uuid("kitchen_id")
            .notNull()
            .references(() => kitchens.id, { onDelete: "cascade" }),
        planId: planConfigEnum("plan_id").notNull(),
        planType: subscriptionPlanTypeEnum("plan_type"),
        stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
        stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
        paymentMethod: paymentMethodEnum("payment_method")
            .default("STRIPE")
            .notNull(),
        status: subscriptionStatusEnum("status").default("ACTIVE").notNull(),
        currentPeriodStart: timestamp("current_period_start", {
            withTimezone: true,
        }).notNull(),
        currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }).notNull(),
        gracePeriodEndsAt: timestamp("grace_period_ends_at", {
            withTimezone: true,
        }),
        autoRenew: boolean("auto_renew").default(true).notNull(),
        cancelAtPeriodEnd: boolean("cancel_at_period_end").default(false),
        trialEndsAt: timestamp("trial_ends_at", { withTimezone: true }),
        ordersUsedThisMonth: integer("orders_used_this_month").default(0),
        ordersResetAt: timestamp("orders_reset_at", { withTimezone: true }),
        potluckUsesRemaining: integer("potluck_uses_remaining").notNull().default(0),
        potluckUsesResetAt: timestamp("potluck_uses_reset_at", { withTimezone: true }),
        metadata: jsonb("metadata"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow(),
        updatedAt: timestamp("updated_at", { withTimezone: true })
            .defaultNow(),
        cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
        cancelReason: text("cancel_reason"),
    },
    (table) => [
        index("subscriptions_user_idx").on(table.userId),
        index("subscriptions_kitchen_idx").on(table.kitchenId),
        index("subscriptions_status_idx").on(table.status),
        index("subscriptions_stripe_idx").on(table.stripeSubscriptionId),
        index("subscriptions_period_end_idx").on(table.currentPeriodEnd),
    ]
);

// ─── Premium Plans ──────────────────────────────────────────────────────────

export const premiumPlans = pgTable("premium_plans", {
    id: uuid("id").defaultRandom().primaryKey(),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    priceMonthly: integer("price_monthly").notNull(), // in smallest unit
    priceQuarterly: integer("price_quarterly"),
    priceYearly: integer("price_yearly"),
    currency: varchar("currency", { length: 3 }).default("PKR").notNull(),
    region: varchar("region", { length: 100 }).default("PK").notNull(),
    features: text("features").array(),
    includesVerifiedBadge: boolean("includes_verified_badge")
        .default(false)
        .notNull(),
    includesBoost: boolean("includes_boost").default(false).notNull(),
    boostDurationDays: integer("boost_duration_days"),
    isActive: boolean("is_active").default(true).notNull(),
    stripePriceIdMonthly: varchar("stripe_price_id_monthly", { length: 255 }),
    stripePriceIdQuarterly: varchar("stripe_price_id_quarterly", { length: 255 }),
    stripePriceIdYearly: varchar("stripe_price_id_yearly", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
});

// ─── Boosts ─────────────────────────────────────────────────────────────────

export const boosts = pgTable(
    "boosts",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        kitchenId: uuid("kitchen_id")
            .notNull()
            .references(() => kitchens.id, { onDelete: "cascade" }),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        status: boostStatusEnum("status").default("ACTIVE").notNull(),
        priority: integer("priority").default(1).notNull(),
        stripePaymentId: varchar("stripe_payment_id", { length: 255 }),
        startsAt: timestamp("starts_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("boosts_kitchen_idx").on(table.kitchenId),
        index("boosts_status_idx").on(table.status),
        index("boosts_expires_idx").on(table.expiresAt),
    ]
);

// ─── Reports (Abuse) ────────────────────────────────────────────────────────

export const reports = pgTable(
    "reports",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        reporterId: uuid("reporter_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        targetType: reportTargetEnum("target_type").notNull(),
        targetId: uuid("target_id").notNull(),
        reason: text("reason").notNull(),
        details: text("details"),
        status: reportStatusEnum("status").default("PENDING").notNull(),
        reviewedBy: uuid("reviewed_by").references(() => users.id),
        reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
        resolution: text("resolution"),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("reports_target_idx").on(table.targetType, table.targetId),
        index("reports_status_idx").on(table.status),
        index("reports_reporter_idx").on(table.reporterId),
    ]
);

// ─── Relations ──────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many, one }) => ({
    kitchens: many(kitchens),
    reviews: many(reviews),
    platformReviews: many(platformReviews),
    orders: many(orders),
    subscriptions: many(subscriptions),
    boosts: many(boosts),
    reports: many(reports),
    favorites: many(userFavorites),
    addresses: many(userAddresses),
    notifications: many(notifications),
}));

export const kitchensRelations = relations(kitchens, ({ one, many }) => ({
    owner: one(users, {
        fields: [kitchens.ownerId],
        references: [users.id],
    }),
    meals: many(meals),
    reviews: many(reviews),
    orders: many(orders),
    subscriptions: many(subscriptions),
    boosts: many(boosts),
}));

export const mealsRelations = relations(meals, ({ one, many }) => ({
    kitchen: one(kitchens, {
        fields: [meals.kitchenId],
        references: [kitchens.id],
    }),
    orderItems: many(orderItems),
}));

export const reviewsRelations = relations(reviews, ({ one }) => ({
    kitchen: one(kitchens, {
        fields: [reviews.kitchenId],
        references: [kitchens.id],
    }),
    user: one(users, {
        fields: [reviews.userId],
        references: [users.id],
    }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
    kitchen: one(kitchens, {
        fields: [orders.kitchenId],
        references: [kitchens.id],
    }),
    customer: one(users, {
        fields: [orders.customerId],
        references: [users.id],
    }),
    items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
    order: one(orders, {
        fields: [orderItems.orderId],
        references: [orders.id],
    }),
    meal: one(meals, {
        fields: [orderItems.mealId],
        references: [meals.id],
    }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one }) => ({
    user: one(users, {
        fields: [subscriptions.userId],
        references: [users.id],
    }),
    kitchen: one(kitchens, {
        fields: [subscriptions.kitchenId],
        references: [kitchens.id],
    }),
    planConfig: one(planConfigs, {
        fields: [subscriptions.planId],
        references: [planConfigs.planId],
    }),
}));

export const boostsRelations = relations(boosts, ({ one }) => ({
    kitchen: one(kitchens, {
        fields: [boosts.kitchenId],
        references: [kitchens.id],
    }),
    user: one(users, {
        fields: [boosts.userId],
        references: [users.id],
    }),
}));

export const reportsRelations = relations(reports, ({ one }) => ({
    reporter: one(users, {
        fields: [reports.reporterId],
        references: [users.id],
    }),
    reviewer: one(users, {
        fields: [reports.reviewedBy],
        references: [users.id],
    }),
}));

// ─── USER FAVORITES ───────────────────────────────────────────────
export const userFavorites = pgTable(
    "user_favorites",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        kitchenId: uuid("kitchen_id").notNull().references(() => kitchens.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (t) => [
        uniqueIndex("user_kitchen_unique_idx").on(t.userId, t.kitchenId),
        index("user_favorites_user_id_idx").on(t.userId),
    ]
);

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
    user: one(users, { fields: [userFavorites.userId], references: [users.id] }),
    kitchen: one(kitchens, { fields: [userFavorites.kitchenId], references: [kitchens.id] }),
}));

// ─── USER ADDRESSES ───────────────────────────────────────────────
export const userAddresses = pgTable(
    "user_addresses",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        label: varchar("label", { length: 50 }).default("Home"),  // "Home", "Work", "Other"
        addressLine: text("address_line").notNull(),
        city: varchar("city", { length: 100 }),
        area: varchar("area", { length: 100 }),
        isDefault: boolean("is_default").default(false).notNull(),
        createdAt: timestamp("created_at").defaultNow().notNull(),
        updatedAt: timestamp("updated_at").defaultNow().notNull(),
    }
);

export const userAddressesRelations = relations(userAddresses, ({ one }) => ({
    user: one(users, { fields: [userAddresses.userId], references: [users.id] }),
}));

// ─── NOTIFICATIONS ────────────────────────────────────────────────
export const notificationTypeEnum = pgEnum("notification_type", [
    "ORDER_PLACED",
    "ORDER_ACCEPTED",
    "ORDER_PREPARING",
    "ORDER_READY",
    "ORDER_COMPLETED",
    "ORDER_CANCELLED",
    "REVIEW_REPLY",
    "PROMO",
    "SYSTEM",
]);

export const notifications = pgTable(
    "notifications",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
        type: notificationTypeEnum("type").notNull(),
        title: varchar("title", { length: 255 }).notNull(),
        body: text("body"),
        isRead: boolean("is_read").default(false).notNull(),
        link: varchar("link", { length: 500 }),  // e.g. /account/orders/[id]
        metadata: jsonb("metadata"),                 // { orderId, kitchenId, etc. }
        clearedAt: timestamp("cleared_at", { withTimezone: true }),
        expiresAt: timestamp("expires_at", { withTimezone: true }),
        createdAt: timestamp("created_at").defaultNow().notNull(),
    },
    (t) => [
        index("notifications_user_id_idx").on(t.userId),
        index("notifications_is_read_idx").on(t.isRead),
        index("notifications_created_at_idx").on(t.createdAt),
        index("idx_notifications_expires_at").on(t.expiresAt),
        index("idx_notifications_user_cleared").on(t.userId, t.clearedAt),
    ]
);

export const notificationsRelations = relations(notifications, ({ one }) => ({
    user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

// ─── Plan Configs ───────────────────────────────────────────────────────────

export const planConfigs = pgTable("plan_configs", {
    id: uuid("id").defaultRandom().primaryKey(),
    planId: planConfigEnum("plan_id").notNull().unique(),
    displayName: varchar("display_name", { length: 50 }).notNull(),
    priceRs: integer("price_rs").notNull(),
    billingPeriodMonths: integer("billing_period_months").notNull(),
    menuItemLimit: integer("menu_item_limit"),
    monthlyOrderLimit: integer("monthly_order_limit"),
    commissionRate: decimal("commission_rate", { precision: 4, scale: 3 }).notNull(),
    featuredBoostLevel: varchar("featured_boost_level", { length: 20 }),
    prioritySupport: boolean("priority_support").default(false),
    brandingTools: boolean("branding_tools").default(false),
    promotionsLevel: varchar("promotions_level", { length: 20 }),
    advancedAnalytics: boolean("advanced_analytics").default(false),
    aiPricing: boolean("ai_pricing").default(false),
    autoWhatsApp: boolean("auto_whatsapp").default(false),
    dedicatedManager: boolean("dedicated_manager").default(false),
    chefAssistant: boolean("chef_assistant").default(false),
    digitalKhata: boolean("digital_khata").default(false),
    // ── Granular plan feature levels (monetization engine) ──
    menuItemLimitType: varchar("menu_item_limit_type", { length: 10 }).default("total"),
    analytics: varchar("analytics", { length: 20 }).default("basic"),
    supportLevel: varchar("support_level", { length: 20 }).default("standard"),
    brandingLevel: varchar("branding_level", { length: 30 }).default("none"),
    aiSuggestions: varchar("ai_suggestions", { length: 20 }).default("none"),
    cookHelperAi: boolean("cook_helper_ai").default(false),
    reviewsHighlighted: boolean("reviews_highlighted").default(false),
    orderTrackingLevel: varchar("order_tracking_level", { length: 20 }).default("standard"),
    realtimeOrderNotifs: boolean("realtime_order_notifs").default(false),
    mobileUiLevel: varchar("mobile_ui_level", { length: 20 }).default("standard"),
    kitchenListingPriority: varchar("kitchen_listing_priority", { length: 30 }),
    potluckUsesPerPeriod: integer("potluck_uses_per_period").notNull(),
    stripePriceId: varchar("stripe_price_id", { length: 100 }),
    isActive: boolean("is_active").default(true),
    sortOrder: integer("sort_order").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const planConfigsRelations = relations(planConfigs, ({ many }) => ({
    subscriptions: many(subscriptions),
}));

// ─── Commission Ledger ──────────────────────────────────────────────────────

export const commissionLedger = pgTable("commission_ledger", {
    id: uuid("id").defaultRandom().primaryKey(),
    orderId: uuid("order_id").notNull().references(() => orders.id),
    kitchenId: uuid("kitchen_id").notNull(),
    cookId: uuid("cook_id").notNull(),
    planId: planConfigEnum("plan_id").notNull(),
    orderAmountRs: decimal("order_amount_rs", { precision: 10, scale: 2 }).notNull(),
    commissionRate: decimal("commission_rate", { precision: 4, scale: 3 }).notNull(),
    commissionAmountRs: decimal("commission_amount_rs", { precision: 10, scale: 2 }).notNull(),
    netAmountRs: decimal("net_amount_rs", { precision: 10, scale: 2 }).notNull(),
    status: varchar("status", { length: 20 }).default('RECORDED'),
    collectedAt: timestamp("collected_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
    index("idx_commission_kitchen").on(table.kitchenId),
    index("idx_commission_order").on(table.orderId),
]);

// ─── Potluck Deals ──────────────────────────────────────────────────────────

export const potluckDeals = pgTable("potluck_deals", {
    id: uuid("id").defaultRandom().primaryKey(),
    kitchenId: uuid("kitchen_id").notNull().references(() => kitchens.id),
    cookId: uuid("cook_id").notNull().references(() => users.id),
    subscriptionId: uuid("subscription_id").notNull().references(() => subscriptions.id),
    title: varchar("title", { length: 200 }).notNull(),
    description: text("description"),
    mealId: uuid("meal_id").references(() => meals.id),
    totalPlatesAvailable: integer("total_plates_available").notNull(),
    targetOrderCount: integer("target_order_count").notNull(),
    pricePerPlateRs: decimal("price_per_plate_rs", { precision: 10, scale: 2 }).notNull(),
    regularPriceRs: decimal("regular_price_rs", { precision: 10, scale: 2 }).notNull(),
    currentOrderCount: integer("current_order_count").default(0),
    status: potluckStatusEnum("status").notNull(),
    activatesAt: timestamp("activates_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: varchar("cancel_reason", { length: 100 }),
    imageUrl: varchar("image_url", { length: 500 }),
    city: varchar("city", { length: 100 }),
    citySlug: varchar("city_slug", { length: 100 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
}, (table) => [
    index("idx_potluck_kitchen_status").on(table.kitchenId, table.status),
    index("idx_potluck_active_city").on(table.citySlug, table.status, table.expiresAt),
]);

export const potluckOrders = pgTable("potluck_orders", {
    id: uuid("id").defaultRandom().primaryKey(),
    potluckDealId: uuid("potluck_deal_id").notNull().references(() => potluckDeals.id),
    customerId: uuid("customer_id").notNull().references(() => users.id),
    orderId: uuid("order_id").references(() => orders.id),
    quantity: integer("quantity").notNull().default(1),
    totalAmountRs: decimal("total_amount_rs", { precision: 10, scale: 2 }).notNull(),
    status: varchar("status", { length: 20 }).default('RESERVED'),
    reservedAt: timestamp("reserved_at", { withTimezone: true }).defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
    uniqueIndex("uniq_potluck_customer").on(table.potluckDealId, table.customerId),
]);

// ─── Digital Khata ──────────────────────────────────────────────────────────

export const khataEntries = pgTable("khata_entries", {
    id: uuid("id").defaultRandom().primaryKey(),
    kitchenId: uuid("kitchen_id").notNull().references(() => kitchens.id),
    cookId: uuid("cook_id").notNull().references(() => users.id),
    entryType: khataEntryTypeEnum("entry_type").notNull(),
    category: varchar("category", { length: 100 }).notNull(),
    description: text("description").notNull(),
    amountRs: decimal("amount_rs", { precision: 10, scale: 2 }).notNull(),
    isCredit: boolean("is_credit").notNull(),
    referenceId: uuid("reference_id"),
    referenceType: varchar("reference_type", { length: 50 }),
    entryDate: date("entry_date").notNull(),
    isAutoGenerated: boolean("is_auto_generated").default(false),
    isCancelled: boolean("is_cancelled").default(false),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    cancelReason: varchar("cancel_reason", { length: 200 }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
    index("idx_khata_kitchen_date").on(table.kitchenId, table.entryDate),
    index("idx_khata_kitchen_type").on(table.kitchenId, table.entryType),
]);

// ─── Plan Usage Tracking ────────────────────────────────────────────────────

export const planUsageLog = pgTable("plan_usage_log", {
    id: uuid("id").defaultRandom().primaryKey(),
    kitchenId: uuid("kitchen_id").notNull(),
    subscriptionId: uuid("subscription_id").notNull(),
    actionType: varchar("action_type", { length: 50 }).notNull(),
    currentUsage: integer("current_usage").notNull(),
    limitValue: integer("limit_value"),
    wasAllowed: boolean("was_allowed").notNull(),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
}, (table) => [
    index("idx_usage_log_kitchen_action").on(table.kitchenId, table.actionType, table.createdAt),
]);

// ─── ADMIN PORTAL AUTH TABLES (isolated from Firebase) ───────────────────────

export const adminUsers = pgTable("admin_users", {
    id:            uuid("id").primaryKey().defaultRandom(),
    email:         text("email").notNull().unique(),
    username:      text("username").notNull().unique(),
    passwordHash:  text("password_hash").notNull(),
    displayName:   text("display_name").notNull(),
    role:          text("role").notNull().default("admin"), // "admin" | "super_admin"
    isActive:      boolean("is_active").notNull().default(true),
    lastLoginAt:   timestamp("last_login_at"),
    loginAttempts: integer("login_attempts").notNull().default(0),
    lockedUntil:   timestamp("locked_until"),
    createdAt:     timestamp("created_at").defaultNow().notNull(),
    updatedAt:     timestamp("updated_at").defaultNow().notNull(),
});

export const adminSessions = pgTable("admin_sessions", {
    id:             uuid("id").primaryKey().defaultRandom(),
    adminUserId:    uuid("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
    jtiHash:        text("jti_hash").notNull(),
    ipAddress:      text("ip_address"),
    userAgent:      text("user_agent"),
    createdAt:      timestamp("created_at").defaultNow().notNull(),
    expiresAt:      timestamp("expires_at").notNull(),
    lastActivityAt: timestamp("last_activity_at").defaultNow().notNull(),
    revokedAt:      timestamp("revoked_at"),
});

export const adminOtpCodes = pgTable("admin_otp_codes", {
    id:           uuid("id").primaryKey().defaultRandom(),
    adminUserId:  uuid("admin_user_id").notNull().references(() => adminUsers.id, { onDelete: "cascade" }),
    codeHash:     text("code_hash").notNull(),
    expiresAt:    timestamp("expires_at").notNull(),
    usedAt:       timestamp("used_at"),
    attempts:     integer("attempts").notNull().default(0),
    ipAddress:    text("ip_address"),
    createdAt:    timestamp("created_at").defaultNow().notNull(),
});

export const adminUsersRelations = relations(adminUsers, ({ many }) => ({
    sessions: many(adminSessions),
    otpCodes: many(adminOtpCodes),
}));

export const adminSessionsRelations = relations(adminSessions, ({ one }) => ({
    admin: one(adminUsers, {
        fields: [adminSessions.adminUserId],
        references: [adminUsers.id],
    }),
}));

export const adminOtpCodesRelations = relations(adminOtpCodes, ({ one }) => ({
    admin: one(adminUsers, {
        fields: [adminOtpCodes.adminUserId],
        references: [adminUsers.id],
    }),
}));

// ─── ADMIN AUDIT LOG ──────────────────────────────────────────────
export const adminAuditLog = pgTable(
    "admin_audit_log",
    {
        id: uuid("id").defaultRandom().primaryKey(),
        adminId: uuid("admin_id")
            .notNull()
            .references(() => adminUsers.id),
        action: varchar("action", { length: 255 }).notNull(),
        targetType: varchar("target_type", { length: 50 }).notNull(),
        targetId: uuid("target_id").notNull(),
        details: text("details"),
        ipAddress: varchar("ip_address", { length: 45 }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
    },
    (table) => [
        index("audit_admin_idx").on(table.adminId),
        index("audit_action_idx").on(table.action),
        index("audit_created_idx").on(table.createdAt),
    ]
);

export const adminAuditLogRelations = relations(adminAuditLog, ({ one }) => ({
    admin: one(adminUsers, { fields: [adminAuditLog.adminId], references: [adminUsers.id] }),
}));