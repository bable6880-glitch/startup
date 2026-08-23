# 🧠 Smart Tiffin — Master AI Context Document

> **Purpose**: This is the **single source of truth** for any AI assistant working on this codebase. Paste this document into your AI conversation to give it complete understanding of the project architecture, patterns, constraints, and conventions. The AI should be able to **fix bugs, add features, and resolve issues** using only this document + the codebase.

> **Last Updated**: August 2026
> **Project Root**: `d:\startups\projectFoodpk\code\startup`
> **Live URL**: `https://smarttiffinfood.vercel.app`

---

## 1. WHAT THIS PROJECT IS

**Smart Tiffin** is a **Pakistan-based home-food marketplace** that connects home cooks (Sellers/Cooks) with customers looking for home-cooked meals. Think of it as **Uber Eats but for home kitchens** — localized for Pakistan with PKR pricing, WhatsApp integration, and local payment methods.

### Business Model
- **Customers** browse kitchens, order food, pay COD or via Stripe
- **Cooks** register kitchens, manage menus, accept/complete orders
- **Platform** charges per-order commission (varies by plan tier)
- **Revenue**: Subscription plans (Starter/Growth/Pro/Elite) + Extra Packs + Boosts

### Three User Roles
| Role | Description | Key Pages |
|------|-------------|-----------|
| `CUSTOMER` | Browses, orders food | `/explore`, `/kitchen/[id]`, `/orders` |
| `COOK` | Manages kitchen, menu, orders | `/dashboard/*`, `/become-a-cook` |
| `ADMIN` | Platform management | `/admin-portal/*` |

---

## 2. TECH STACK (EXACT VERSIONS)

| Layer | Technology | Version | Notes |
|-------|-----------|---------|-------|
| **Framework** | Next.js (App Router) | 16.1.6 | NOT Pages Router. Uses `src/app/` directory |
| **React** | React | 19.2.3 | React 19 with React Compiler enabled |
| **Language** | TypeScript | ^5 | Strict mode |
| **Styling** | Tailwind CSS | v4 | Uses `@tailwindcss/postcss` plugin |
| **Database** | PostgreSQL (Neon) | Serverless | HTTP driver — **NO `db.transaction()` SUPPORT** |
| **ORM** | Drizzle ORM | 0.45.1 | Schema in `src/lib/db/schema.ts` |
| **Auth** | Firebase Auth | 12.9.0 (client) / 13.6.1 (admin) | Google + Phone + Email login |
| **Payments** | Stripe | 20.3.1 | Checkout Sessions + Webhooks |
| **Cache/Realtime** | Upstash Redis | REST API | Rate limiting + caching + pub/sub SSE |
| **Image Storage** | Cloudinary | 2.9.0 | Upload via `src/lib/utils/cloudinary.ts` |
| **Maps** | Leaflet + react-leaflet | 1.9.4 / 5.0.0 | OpenStreetMap tiles |
| **Animations** | Framer Motion | 12.38.0 | Page transitions, micro-animations |
| **Forms** | React Hook Form + Zod | 7.71.1 / 4.3.6 | All forms validated via Zod schemas |
| **Charts** | Recharts | 3.8.1 | Dashboard analytics |
| **AI** | DeepSeek V3 via OpenRouter | — | Chef assistant + AI pricing suggestions |
| **Emails** | Resend | 6.12.2 | Admin OTP emails |
| **Deployment** | Vercel | Hobby plan | Auto-deploy from Git |

---

## 3. PROJECT STRUCTURE (COMPLETE FILE MAP)

```
d:\startups\projectFoodpk\code\startup\
├── .env                          # Environment variables (NEVER commit)
├── .env.example                  # Template with all required env vars
├── .env.local                    # Local overrides
├── next.config.ts                # CSP headers, CORS, image domains, redirects
├── drizzle.config.ts             # Drizzle ORM → Neon connection config
├── package.json                  # name: "home_food", scripts, deps
├── vercel.json                   # Vercel deployment config
├── amplify.yml                   # AWS Amplify (legacy, not primary)
│
├── src/
│   ├── app/                      # ◀ NEXT.JS APP ROUTER (all pages + API)
│   │   ├── layout.tsx            # Root layout (fonts, providers, navbar)
│   │   ├── page.tsx              # Homepage (hero, featured kitchens, CTA)
│   │   ├── globals.css           # Tailwind v4 + custom CSS (22KB)
│   │   ├── error.tsx             # Global error boundary
│   │   ├── not-found.tsx         # Custom 404 page
│   │   ├── robots.ts             # Dynamic robots.txt
│   │   ├── sitemap.ts            # Dynamic sitemap.xml
│   │   │
│   │   ├── login/                # Login page (Firebase Auth UI)
│   │   ├── become-a-cook/        # Cook onboarding / kitchen registration
│   │   ├── complete-profile/     # Post-registration profile completion
│   │   ├── explore/              # Kitchen discovery (search, filter, map)
│   │   ├── kitchen/              # Public kitchen profile pages
│   │   ├── city/                 # City-specific landing pages (SEO)
│   │   ├── orders/               # Customer order history + tracking
│   │   ├── account/              # User account settings
│   │   ├── dashboard/            # Cook dashboard (menu, orders, analytics)
│   │   ├── premium/              # Subscription plans page
│   │   ├── seller/               # Seller-specific pages
│   │   ├── admin-portal/         # Admin panel (isolated auth)
│   │   ├── about/                # About page
│   │   ├── contact/              # Contact page
│   │   ├── privacy/              # Privacy policy
│   │   ├── terms/                # Terms of service
│   │   │
│   │   └── api/                  # ◀ ALL BACKEND API ROUTES
│   │       ├── auth/sync/        # POST: Firebase token → DB user sync
│   │       ├── kitchens/         # CRUD: Kitchen management
│   │       ├── kitchen/          # Single kitchen operations
│   │       ├── orders/           # Order placement + status updates
│   │       ├── reviews/          # Kitchen + platform reviews
│   │       ├── premium/          # Subscription management + Stripe checkout
│   │       ├── plans/            # Plan configs + usage
│   │       ├── potluck/          # Group deal management
│   │       ├── reports/          # Abuse reporting
│   │       ├── search/           # Full-text search
│   │       ├── cities/           # City lookup
│   │       ├── upload/           # Cloudinary image upload
│   │       ├── stats/            # Platform statistics
│   │       ├── seller/           # Seller-specific endpoints
│   │       ├── account/          # User account management
│   │       ├── admin/            # Admin CRUD operations
│   │       ├── admin-portal/     # Admin auth (login, OTP, sessions)
│   │       ├── webhooks/         # Stripe webhook handler
│   │       ├── cron/             # Cron jobs (cleanup, potluck expiry)
│   │       ├── sse/              # Server-Sent Events endpoints
│   │       ├── health/           # Health check
│   │       └── og/               # Dynamic OG image generation
│   │
│   ├── components/               # ◀ REACT COMPONENTS (by feature)
│   │   ├── ui/                   # Base components (Button, Card, Input, etc.)
│   │   ├── layout/               # Navbar, Footer, layout wrappers
│   │   ├── auth/                 # Login forms, auth guards
│   │   ├── home/                 # Homepage sections
│   │   ├── kitchen/              # Kitchen profile components
│   │   ├── menu/                 # Menu item cards, grids
│   │   ├── cart/                 # CartPanel (slide-out panel)
│   │   ├── checkout/             # Checkout flow components
│   │   ├── orders/               # Order cards, status displays
│   │   ├── dashboard/            # Cook dashboard widgets
│   │   ├── reviews/              # Review cards, forms, stats
│   │   ├── plans/                # Plan cards, comparison tables
│   │   ├── potluck/              # Potluck deal cards
│   │   ├── map/                  # Leaflet map components
│   │   ├── location/             # City/area selectors
│   │   └── seo/                  # SEO meta components
│   │
│   ├── services/                 # ◀ BUSINESS LOGIC LAYER (12 services)
│   │   ├── auth.service.ts       # Firebase token verify + DB user sync
│   │   ├── kitchen.service.ts    # Kitchen CRUD + listing + caching
│   │   ├── menu.service.ts       # Meal CRUD + availability
│   │   ├── order.service.ts      # Order creation + status + history
│   │   ├── review.service.ts     # Reviews (kitchen + platform) + ratings
│   │   ├── premium.service.ts    # Subscription status + Stripe checkout
│   │   ├── commission.service.ts # Per-order commission recording
│   │   ├── notification.service.ts # In-app notifications + FCM push
│   │   ├── whatsapp.service.ts   # WhatsApp Business API (Meta Cloud)
│   │   ├── admin.service.ts      # Admin operations
│   │   ├── kitchen-lock.service.ts # Auto-lock when limits exceeded
│   │   └── plan-usage.service.ts # Monthly order/potluck counter
│   │
│   ├── lib/                      # ◀ CORE LIBRARIES & UTILITIES
│   │   ├── db/
│   │   │   ├── schema.ts         # ★ DATABASE SCHEMA (1070 lines, 19+ tables)
│   │   │   ├── index.ts          # Drizzle client initialization
│   │   │   ├── migration-guard.ts # Prevents accidental production migrations
│   │   │   └── migrations/       # SQL migration files
│   │   ├── auth/
│   │   │   ├── firebase-admin.ts # Firebase Admin SDK singleton
│   │   │   └── get-auth-user.ts  # ★ Standard auth helper for API routes
│   │   ├── firebase/             # Firebase client SDK setup
│   │   ├── redis/
│   │   │   ├── index.ts          # Redis client + cached() helper + cache keys
│   │   │   ├── pubsub.ts         # Redis pub/sub for SSE real-time
│   │   │   └── search-index.ts   # Redis-backed search indexing
│   │   ├── plans/
│   │   │   ├── plan-access.ts    # ★ PlanAccess system (feature gating)
│   │   │   ├── check-access.ts   # Access check middleware
│   │   │   ├── plan-guards.ts    # Route-level plan enforcement
│   │   │   └── subscription-states.ts # State machine for subscriptions
│   │   ├── ai/
│   │   │   ├── index.ts          # AI configuration
│   │   │   └── provider.ts       # OpenRouter/DeepSeek provider
│   │   ├── validations/          # ★ ZOD SCHEMAS (all API input validation)
│   │   │   ├── auth.ts           # Login/register schemas
│   │   │   ├── kitchen.ts        # Kitchen create/update schemas
│   │   │   ├── menu.ts           # Meal create/update schemas
│   │   │   ├── order.ts          # Order placement schema
│   │   │   ├── review.ts         # Review creation schemas
│   │   │   ├── subscription.ts   # Checkout/cancel schemas
│   │   │   ├── potluck.ts        # Potluck deal schemas
│   │   │   └── address.ts        # Address schemas
│   │   ├── utils/
│   │   │   ├── api-response.ts   # ★ Standard API response helpers
│   │   │   ├── errors.ts         # ★ Custom error classes (AppError hierarchy)
│   │   │   ├── error-handler.ts  # Centralized error → API response mapping
│   │   │   ├── logger.ts         # Structured logging utility
│   │   │   ├── sanitize.ts       # XSS sanitization (text + rich text)
│   │   │   ├── cloudinary.ts     # Cloudinary upload helper
│   │   │   ├── distance.ts       # Haversine distance calculation
│   │   │   ├── fuzzy-search.ts   # Client-side fuzzy search
│   │   │   └── trial-lock.ts     # Trial expiry auto-lock logic
│   │   ├── cart-context.tsx       # CartContext (React context for cart state)
│   │   ├── location-context.tsx  # LocationContext (city/area selection)
│   │   ├── stripe.ts             # Stripe client initialization
│   │   ├── rate-limit.ts         # Upstash rate limiter factory
│   │   └── seo/                  # SEO utilities
│   │
│   ├── hooks/                    # ◀ CUSTOM REACT HOOKS
│   │   ├── use-kitchen-sse.ts    # SSE for cook's real-time order updates
│   │   ├── use-customer-sse.ts   # SSE for customer's order status
│   │   ├── use-plan-access.ts    # Hook for plan feature gating in UI
│   │   └── useSafeQuery.ts       # SWR wrapper with error handling
│   │
│   ├── contexts/
│   │   └── IncomingOrderContext.tsx # Context for incoming order sound/alert
│   │
│   ├── config/
│   │   ├── constants.ts          # App-wide constants, cities, slugify()
│   │   ├── pack-pricing.ts       # Extra pack pricing (orders + potluck)
│   │   └── site.ts               # Site metadata (URL, name)
│   │
│   ├── types/
│   │   └── potluck.ts            # Potluck type definitions
│   │
│   └── proxy.ts                  # API proxy for external services
```

---

## 4. DATABASE SCHEMA (19+ TABLES)

> **File**: `src/lib/db/schema.ts` (1070 lines)
> **Driver**: Neon HTTP (serverless) — **`db.transaction()` NOT SUPPORTED**
> **ORM**: Drizzle ORM with relations

### 4.1 Core Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `users` | All users | `id`, `firebaseUid`, `email`, `name`, `phone`, `role` (CUSTOMER/COOK/ADMIN), `fcmToken`, `isActive` |
| `kitchens` | Cook's shop | `id`, `ownerId→users`, `name`, `slug`, `city`, `citySlug`, `area`, `areaSlug`, `lat/lng`, `status` (ACTIVE/SUSPENDED/INACTIVE), `planId`, `isLocked`, `avgRating`, `reviewCount`, `boostPriority` |
| `meals` | Menu items | `id`, `kitchenId→kitchens`, `name`, `price` (integer, PKR), `category`, `isAvailable`, `availabilityStatus`, `imageUrl` |
| `orders` | Transactions | `id`, `kitchenId→kitchens`, `customerId→users`, `status` (PENDING/ACCEPTED/COMPLETED/CANCELLED), `totalAmount`, `deliveryMode`, `customerName/Phone/Address` (snapshots) |
| `order_items` | Line items | `orderId→orders`, `mealId→meals`, `quantity`, `priceAtOrder` (snapshot) |

### 4.2 Subscription & Monetization Tables

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `plan_configs` | Plan tier definitions | `planId` (starter/growth/pro/elite/trial), `priceRs`, `menuItemLimit`, `monthlyOrderLimit`, `commissionRate`, feature flags |
| `subscriptions` | Active subscriptions | `userId`, `kitchenId`, `planId`, `status`, `currentPeriodStart/End`, `ordersUsedThisMonth`, `potluckUsesRemaining` |
| `subscription_history` | Audit trail | `kitchenId`, `planId`, `startedAt`, `endedAt`, `endReason`, `priceRsPaid` |
| `commission_ledger` | Revenue tracking | `orderId`, `kitchenId`, `orderAmountRs`, `commissionRate`, `commissionAmountRs`, `netAmountRs` |
| `extra_packs` | One-time add-ons | `packType` (ORDER_PACK/POTLUCK_PACK), `packSize`, `priceRs`, `status` |
| `boosts` | Featured placement | `kitchenId`, `priority`, `expiresAt` |

### 4.3 Social & Engagement Tables

| Table | Purpose |
|-------|---------|
| `reviews` | Kitchen reviews with ratings, seller replies, verified purchase flag |
| `platform_reviews` | Platform-level reviews |
| `user_favorites` | Customer's favorite kitchens |
| `user_addresses` | Saved delivery addresses |
| `notifications` | In-app notification center |
| `reports` | Abuse/quality reports |

### 4.4 Feature Tables

| Table | Purpose |
|-------|---------|
| `potluck_deals` | Group buy deals created by cooks |
| `potluck_orders` | Customer reservations on deals |
| `khata_entries` | Digital bookkeeping (income/expense tracking) |
| `plan_usage_log` | Plan limit enforcement audit |

### 4.5 Admin Tables (Isolated Auth)

| Table | Purpose |
|-------|---------|
| `admin_users` | Admin accounts (NOT Firebase — separate bcrypt auth) |
| `admin_sessions` | JWT sessions with JTI tracking |
| `admin_otp_codes` | Email OTP for admin login |
| `admin_audit_log` | Admin action audit trail |
| `stripe_processed_events` | Webhook idempotency tracking |
| `cities` | Dynamic city registry |

### 4.6 Enums

```
user_role:           CUSTOMER | COOK | ADMIN
kitchen_status:      ACTIVE | SUSPENDED | INACTIVE
order_status:        PENDING | ACCEPTED | COMPLETED | CANCELLED
subscription_status: TRIALING | ACTIVE | CANCELLED | EXPIRED | PAST_DUE | SUSPENDED | SUPERSEDED | UPGRADED
payment_method:      STRIPE | JAZZCASH | EASYPAISA | BANK_TRANSFER | SADAPAY | FREE_TRIAL | COD
menu_availability:   AVAILABLE | OUT_OF_STOCK | NOT_TODAY | PREPARING
delivery_mode:       SELF_PICKUP | FREE_DELIVERY
boost_status:        ACTIVE | EXPIRED | CANCELLED
report_status:       PENDING | REVIEWED | RESOLVED | DISMISSED
plan_config_enum:    starter | growth | pro | elite | trial
potluck_status:      DRAFT | PENDING | SCHEDULED | ACTIVE | PAUSED | FILLED | CANCELLED | EXPIRED
khata_entry_type:    INCOME | EXPENSE | WITHDRAWAL | COMMISSION | REFUND | ADJUSTMENT
notification_type:   ORDER_PLACED | ORDER_ACCEPTED | ORDER_PREPARING | ORDER_READY | ORDER_COMPLETED | ORDER_CANCELLED | REVIEW_REPLY | PROMO | SYSTEM
```

---

## 5. ARCHITECTURE PATTERNS & CONVENTIONS

### 5.1 API Route Pattern

Every API route follows this **exact** pattern:

```typescript
// src/app/api/[resource]/route.ts
import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import { apiSuccess, apiCreated, apiBadRequest, apiUnauthorized, apiForbidden, apiNotFound } from "@/lib/utils/api-response";
import { handleApiError } from "@/lib/utils/error-handler";
import { rateLimit } from "@/lib/rate-limit";
import { someSchema } from "@/lib/validations/some";
import { someService } from "@/services/some.service";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate limiting
    const limited = await rateLimit("resource", req);
    if (limited) return limited;

    // 2. Authentication
    const user = await getAuthUser(req);
    if (!user) return apiUnauthorized();

    // 3. Authorization (role check)
    if (user.role !== "COOK") return apiForbidden("Only cooks can do this");

    // 4. Validate input
    const body = await req.json();
    const parsed = someSchema.safeParse(body);
    if (!parsed.success) return apiBadRequest("Validation failed", parsed.error.flatten().fieldErrors);

    // 5. Business logic (delegated to service)
    const result = await someService(user.id, parsed.data);

    // 6. Response
    return apiCreated(result);
  } catch (error) {
    return handleApiError(error);
  }
}
```

### 5.2 Service Layer Pattern

Services are **pure business logic** — no HTTP concerns:

```typescript
// src/services/example.service.ts
import { db } from "@/lib/db";
import { someTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NotFoundError, AuthorizationError, ValidationError } from "@/lib/utils/errors";

export async function doSomething(userId: string, input: SomeInput) {
  // 1. Database queries via Drizzle
  const record = await db.query.someTable.findFirst({
    where: eq(someTable.id, input.id),
  });

  // 2. Throw custom errors (caught by handleApiError in route)
  if (!record) throw new NotFoundError("Record");
  if (record.ownerId !== userId) throw new AuthorizationError();

  // 3. Mutations
  const [updated] = await db.update(someTable)
    .set({ field: input.value, updatedAt: new Date() })
    .where(eq(someTable.id, input.id))
    .returning();

  // 4. Cache invalidation
  await invalidateCache(CacheKeys.someKey(input.id));

  return updated;
}
```

### 5.3 Error Handling System

```
AppError (base)
├── ValidationError    → 400
├── AuthenticationError → 401
├── AuthorizationError → 403
├── NotFoundError      → 404
├── ConflictError      → 409
└── RateLimitError     → 429
```

The `handleApiError()` function in `src/lib/utils/error-handler.ts` catches these and converts them to standardized API responses.

### 5.4 API Response Format

**ALL** API responses use this format:

```typescript
// Success
{ success: true, data: { ... } }
{ success: true, data: [...], meta: { page, limit, total, hasMore } }

// Error
{ success: false, error: { code: "NOT_FOUND", message: "Kitchen not found" } }
```

### 5.5 Authentication Flow

1. **Client**: User signs in via Firebase (Google/Phone/Email)
2. **Client**: Gets Firebase ID token
3. **Client**: Sends token in `Authorization: Bearer <token>` header
4. **Server**: `getAuthUser(req)` in `src/lib/auth/get-auth-user.ts` verifies token via Firebase Admin SDK
5. **Server**: Returns `{ id, firebaseUid, email, name, role, cookKitchenId }`
6. **Server**: Route checks `user.role` for authorization

### 5.6 Plan Access / Feature Gating

The **PlanAccess** system (`src/lib/plans/plan-access.ts`) is the central feature-gating mechanism:

```typescript
const access = await getKitchenPlanAccess(kitchenId);

// Check features
access.hasFeature('digital_khata')     // boolean
access.hasFeature('auto_whatsapp')     // boolean
access.hasFeature('ai_pricing')        // boolean
access.canAddMenuItem(currentCount)    // checks menu limit
access.canPlaceOrder()                 // checks order limit
access.canCreatePotluck()             // checks potluck quota
access.getCommissionRate()             // 0.10 to 0.20
access.getMenuLimit()                  // null = unlimited
access.getOrderLimit()                 // null = unlimited
```

**Plan Tiers**: `starter → growth → pro → elite`

Each plan has different limits for:
- Menu items
- Monthly orders
- Potluck deals
- Commission rate
- Features (AI, WhatsApp, Khata, Branding, etc.)

### 5.7 Real-Time System (SSE via Redis Pub/Sub)

```
Order placed → publishEvent(CHANNELS.kitchenOrders(kitchenId), { type: "NEW_ORDER", ... })
                                    ↓
                    Redis Pub/Sub → SSE endpoint → Cook's dashboard
                                    ↓
Order status change → publishEvent(CHANNELS.customerOrders(customerId), { type: "ORDER_STATUS_CHANGED", ... })
                                    ↓
                    Redis Pub/Sub → SSE endpoint → Customer's order page
```

**Hooks**: `use-kitchen-sse.ts` (cook) and `use-customer-sse.ts` (customer)

### 5.8 Caching Strategy

```typescript
import { cached, invalidateCache, CacheKeys, CacheTTL, redis } from "@/lib/redis";

// Read-through cache
const data = await cached(CacheKeys.kitchenProfile(id), CacheTTL.KITCHEN_PROFILE, async () => {
  return db.query.kitchens.findFirst({ where: eq(kitchens.id, id) });
});

// Invalidate on mutation
await invalidateCache(CacheKeys.kitchenProfile(id));
```

---

## 6. CRITICAL CONSTRAINTS & GOTCHAS

> [!CAUTION]
> **These are the most common sources of bugs. Read carefully.**

### 6.1 NO Database Transactions
The Neon HTTP driver does **NOT** support `db.transaction()`. All multi-step operations use **sequential inserts with manual compensation** (rollback on failure). Example in `order.service.ts`:

```typescript
// Create order
const [order] = await db.insert(orders).values({...}).returning();

try {
  // Create order items
  await db.insert(orderItems).values([...]);
} catch {
  // COMPENSATION: Delete orphaned order
  await db.delete(orders).where(eq(orders.id, order.id));
  throw new Error("Failed to create order items. Rolled back.");
}
```

### 6.2 Price Storage
All prices are stored as **integers in PKR** (not paisa/cents). `price: 250` means Rs. 250.

### 6.3 Soft Deletes
Most tables use `deletedAt` timestamp for soft deletes. Always filter with `isNull(table.deletedAt)` in queries.

### 6.4 Slug System
- Kitchen slugs are URL-friendly: `ammas-kitchen-abc123`
- City slugs: `islamabad`, `lahore`, `rawalpindi`
- Area slugs: `dha-phase-5`, `model-town`
- Generated by `slugify()` from `src/config/constants.ts`

### 6.5 Admin Portal (Isolated Auth)
The admin panel (`/admin-portal`) uses its **own authentication system** — NOT Firebase. It has:
- Separate `admin_users` table with bcrypt passwords
- JWT sessions stored in `admin_sessions`
- Email OTP via Resend for 2FA
- Isolated from customer/cook auth entirely

### 6.6 React 19 + SSR Hydration
- Cart and auth states are client-only, deferred with `suppressHydrationWarning`
- Use `'use client'` directive for any component that uses hooks, browser APIs, or context

### 6.7 Validation Rules
- ALL API inputs validated with Zod schemas from `src/lib/validations/`
- User-generated text sanitized via `sanitizeText()` / `sanitizeRichText()` from `src/lib/utils/sanitize.ts`
- Image uploads validated with magic bytes (not just file extension)

---

## 7. ENVIRONMENT VARIABLES

```bash
# ─── Database ────────────────────────────────────────────
DATABASE_URL="postgres://user:pass@host:5432/dbname"        # Neon PostgreSQL

# ─── Firebase (Client) ──────────────────────────────────
NEXT_PUBLIC_FIREBASE_API_KEY="..."
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="smarttiffin-47278.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="smarttiffin-47278"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="..."
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."

# ─── Firebase (Server — Admin SDK) ──────────────────────
FIREBASE_SERVICE_ACCOUNT_KEY='{"type":"service_account",...}'

# ─── Stripe ─────────────────────────────────────────────
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# ─── Redis (Upstash) ────────────────────────────────────
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# ─── Cloudinary ─────────────────────────────────────────
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# ─── Admin Portal ───────────────────────────────────────
ADMIN_JWT_SECRET="..."                          # min 32 chars
RESEND_API_KEY="re_..."                         # For OTP emails

# ─── Cron ────────────────────────────────────────────────
CRON_SECRET="..."

# ─── AI (Elite plan) ────────────────────────────────────
OPENROUTER_API_KEY="..."                        # DeepSeek V3

# ─── WhatsApp (optional) ────────────────────────────────
META_WHATSAPP_TOKEN="..."
META_WHATSAPP_PHONE_ID="..."

# ─── Application ────────────────────────────────────────
NEXT_PUBLIC_BASE_URL="https://smarttiffinfood.vercel.app"
```

---

## 8. FEATURE STATUS & COMPLETION MATRIX

| # | Feature | Backend | Frontend | Status |
|---|---------|---------|----------|--------|
| 1 | Auth (Firebase Login) | ✅ | ✅ | ✅ COMPLETE |
| 2 | Kitchen Registration | ✅ | ✅ | ✅ COMPLETE |
| 3 | Menu Management | ✅ | ✅ | ✅ COMPLETE |
| 4 | Order System | ✅ | ✅ | ✅ COMPLETE |
| 5 | Real-time SSE | ✅ | ✅ | ✅ COMPLETE |
| 6 | Kitchen Reviews | ✅ | ✅ | ✅ COMPLETE |
| 7 | Platform Reviews | ✅ | ✅ | ✅ COMPLETE |
| 8 | Search/Explore | ✅ | ✅ | ✅ COMPLETE |
| 9 | Subscription Plans | ✅ | ✅ | ⚠️ 90% — Elite checkout had runtime error |
| 10 | Potluck Deals | ✅ | ✅ | ✅ COMPLETE |
| 11 | Digital Khata | ✅ | ✅ | ✅ COMPLETE |
| 12 | Kitchen Boost | ✅ | ✅ | ✅ COMPLETE |
| 13 | AI Pricing | ✅ | ❌ No UI | ⚠️ 70% — Backend only |
| 14 | Chef AI Assistant | ✅ | ❌ No UI | ⚠️ 70% — Backend only |
| 15 | Admin Panel | ✅ | ✅ | ✅ COMPLETE |
| 16 | Notifications | ✅ | ✅ | ✅ COMPLETE |
| 17 | Image Upload | ✅ | ✅ | ✅ COMPLETE |
| 18 | Favorites | ✅ | ✅ | ✅ COMPLETE |
| 19 | WhatsApp Notifs | ⚠️ Mock | ❌ | ❌ 10% — Mock only |
| 20 | Commission Tracking | ✅ | ❌ No UI | ⚠️ 50% — Backend only |
| 21 | Cron Jobs | ✅ | N/A | ✅ COMPLETE |
| 22 | SEO | ✅ | ✅ | ✅ COMPLETE |

---

## 9. KEY FILE REFERENCE (★ = Start Here)

| File | Why It Matters |
|------|---------------|
| ★ `src/lib/db/schema.ts` | **Source of truth** for all data models |
| ★ `src/lib/auth/get-auth-user.ts` | Standard auth verification for ALL API routes |
| ★ `src/lib/utils/api-response.ts` | All API responses must use these helpers |
| ★ `src/lib/utils/errors.ts` | Custom error classes (throw these in services) |
| ★ `src/lib/plans/plan-access.ts` | Feature gating — checks what plan allows |
| ★ `src/services/order.service.ts` | Core transaction — order creation flow |
| ★ `src/services/kitchen.service.ts` | Kitchen CRUD with caching |
| ★ `src/config/constants.ts` | App constants, cities, slugify() |
| ★ `src/lib/validations/` | ALL Zod schemas for input validation |
| `src/components/layout/Navbar.tsx` | Role-based feature visibility |
| `src/lib/redis/pubsub.ts` | Real-time event publishing |
| `src/services/premium.service.ts` | Subscription management + Stripe |
| `src/services/commission.service.ts` | Revenue tracking on order completion |
| `next.config.ts` | CSP, CORS, image domains, redirects |

---

## 10. HOW TO ADD A NEW FEATURE

### Step-by-Step Checklist

1. **Database Changes** (if needed):
   - Add table/columns to `src/lib/db/schema.ts`
   - Add Drizzle relations
   - Run `npm run db:generate` then `npm run db:push`
   - Add new enums if needed

2. **Validation Schema**:
   - Create Zod schema in `src/lib/validations/[feature].ts`
   - Export input types: `export type FeatureInput = z.infer<typeof featureSchema>`

3. **Service Layer**:
   - Create `src/services/[feature].service.ts`
   - Import `db`, schema tables, error classes
   - Write pure business logic (no HTTP concerns)
   - Include cache invalidation if reading cached data

4. **API Route**:
   - Create `src/app/api/[feature]/route.ts`
   - Follow the standard pattern (rate limit → auth → validate → service → response)
   - Use `handleApiError()` in catch block

5. **Frontend Components**:
   - Create components in `src/components/[feature]/`
   - Use `useSafeQuery` hook for data fetching (SWR-based)
   - Use `'use client'` for interactive components

6. **Page**:
   - Create page in `src/app/[feature]/page.tsx`
   - Server Components by default, Client Components when needed

7. **Plan Gating** (if premium-only):
   - Add feature to `PlanFeature` type in `src/lib/plans/plan-access.ts`
   - Gate with `access.hasFeature('feature_name')` in service
   - Use `usePlanAccess` hook in UI for conditional rendering

---

## 11. HOW TO FIX A BUG

### Debugging Checklist

1. **Check the error class**: Is it a `ValidationError`, `NotFoundError`, `AuthorizationError`?
2. **Check the service**: Business logic lives in `src/services/` — NOT in API routes
3. **Check the schema**: Column types, nullable fields, default values in `schema.ts`
4. **Check caching**: Stale data? Look for missing `invalidateCache()` calls
5. **Check plan access**: Feature locked behind a plan? Check `plan-access.ts`
6. **Check rate limiting**: Getting 429s? Check `src/lib/rate-limit.ts` and `constants.ts`
7. **Check transactions**: Remember — NO `db.transaction()`. Multi-step ops need compensation logic

### Common Bug Patterns

| Symptom | Likely Cause |
|---------|-------------|
| "Kitchen not found" after creation | Cache not invalidated |
| Orders not showing for cook | `kitchenId` mismatch or ownership check failing |
| Features not available | Plan access not checking correct feature string |
| 500 on subscription checkout | Stripe price ID missing from `plan_configs` table |
| SSE not working | Redis pub/sub channel name mismatch |
| Rating not updating | `recalculateKitchenRating()` not called after review action |
| Admin login failing | Using Firebase auth instead of admin auth system |

---

## 12. MONETIZATION ENGINE

### Plan Tiers
| Plan | Price | Menu Items | Monthly Orders | Commission | Key Features |
|------|-------|-----------|----------------|------------|-------------|
| **Trial** | Free (15 days) | 3 | 10 | 20% | Basic only |
| **Starter** | Rs. 599/mo | 5 | 50 | 15% | Basic |
| **Growth** | Rs. 1,099/mo | 15 | 150 | 12% | + Analytics, Branding |
| **Pro** | Rs. 2,099/mo | 30 | 500 | 10% | + Potluck, AI Suggestions |
| **Elite** | Custom | Unlimited | Unlimited | 7% | + WhatsApp, Khata, AI, Manager |

### Extra Packs (One-Time Add-Ons)
- **Order Packs**: 50 orders (Rs.499), 100 (Rs.999), 200 (Rs.2100), 400 (Rs.3900)
- **Potluck Packs**: 5 deals (Rs.1099), 11 (Rs.2200), 15 (Rs.2999), 20 (Rs.3699)

### Commission Flow
```
Order COMPLETED → commission.service.ts → recordCommission()
  → Insert commission_ledger entry
  → Increment monthly order counter
  → Auto-lock kitchen if limit reached
  → Auto-generate khata entries (if Elite plan)
```

---

## 13. DEPLOYMENT & INFRASTRUCTURE

| Component | Provider | Notes |
|-----------|----------|-------|
| **Hosting** | Vercel (Hobby) | Auto-deploy on push |
| **Database** | Neon PostgreSQL | Serverless, HTTP driver |
| **Redis** | Upstash | REST API, rate limits + cache + pub/sub |
| **Images** | Cloudinary | Upload + CDN + transforms |
| **Auth** | Firebase | Google + Phone + Email |
| **Payments** | Stripe | Checkout + Webhooks |
| **DNS/CDN** | Vercel Edge | Automatic |
| **Email** | Resend | Admin OTP only |
| **AI** | OpenRouter (DeepSeek V3) | Chef assistant + pricing |

### Scripts
```bash
npm run dev          # Start development server
npm run build        # Production build (TypeScript checked)
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push schema to DB (blocked in prod)
npm run db:studio    # Open Drizzle Studio (DB browser)
npm run db:seed-plans # Seed plan_configs table
npm run db:seed-admin # Create admin user
```

---

## 14. NOTIFICATION TEMPLATES

```typescript
// In-app + FCM Push
notifyOrderPlaced(cookId, orderId, customerName)     // "🎉 New Order!"
notifyOrderAccepted(customerId, orderId, kitchenName) // "✅ Order Accepted!"
notifyOrderCompleted(customerId, orderId, kitchenName) // "🎉 Order Ready!"
notifyPaymentReceived(cookId, orderId, amount)        // "💰 Payment Received!"
notifyNewReview(cookId, kitchenName, rating)           // "⭐ New X-star Review!"
notifySellerReply(customerId, kitchenName)             // "💬 Cook Replied!"
```

---

## 15. INSTRUCTIONS FOR AI AGENTS

### When Asked to Add a Feature:
1. Read this document first
2. Check if related patterns exist in the codebase
3. Follow the exact patterns in Section 5 (Architecture)
4. Add database changes to `schema.ts`, not a new file
5. Create Zod validations in `src/lib/validations/`
6. Create service in `src/services/`
7. Create API route in `src/app/api/`
8. Use `apiSuccess()`, `apiCreated()`, etc. for responses
9. Throw `NotFoundError`, `ValidationError`, etc. for errors
10. Remember: NO `db.transaction()` — use compensation pattern

### When Asked to Fix a Bug:
1. Identify the affected layer (API route → service → DB)
2. Check error handling (is the right error class being thrown?)
3. Check caching (stale data? invalidation missing?)
4. Check plan access (feature gated? correct feature name?)
5. Check the schema (nullable columns? missing defaults?)

### When Asked to Remove a Feature:
1. Remove the API route directory
2. Remove the service file
3. Remove frontend components and pages
4. **Do NOT** delete database tables without explicit instruction — mark as deprecated
5. Remove validation schemas
6. Update any plan feature checks that reference the feature

### Naming Conventions:
- **Files**: kebab-case (`kitchen.service.ts`, `plan-access.ts`)
- **Components**: PascalCase (`KitchenCard.tsx`, `OrderPanel.tsx`)
- **DB Tables**: snake_case (`order_items`, `plan_configs`)
- **API Routes**: kebab-case paths (`/api/admin-portal/auth/login`)
- **Enums**: SCREAMING_SNAKE_CASE (`PENDING`, `COMPLETED`)
- **Types**: PascalCase (`CreateOrderInput`, `PlanAccess`)

### Import Aliases:
```typescript
@/lib/         → src/lib/
@/services/    → src/services/
@/components/  → src/components/
@/config/      → src/config/
@/hooks/       → src/hooks/
@/types/       → src/types/
```

---

> **This document was auto-generated from a comprehensive codebase analysis. Always verify against the actual source code when making changes.**
