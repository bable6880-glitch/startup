# Smart Tiffin â€” Complete Project Audit (Part 1/3)

> **Project Root**: `f:\smart-tiffin\home_food\`
> **Framework**: Next.js 16.1.6 (App Router) + React 19 + TypeScript
> **Database**: Neon PostgreSQL (serverless) via Drizzle ORM
> **Auth**: Firebase Auth (Google/Phone) + Firebase Admin SDK
> **Payments**: Stripe (checkout + webhooks)
> **Hosting**: Vercel (Hobby plan)
> **Cache/Realtime**: Upstash Redis (rate-limiting, caching, pub/sub SSE)
> **Storage**: Cloudinary (image uploads)
> **AI**: Anthropic Claude Haiku (pricing + chef assistant)
> **Styling**: Tailwind CSS v4

---

## DATABASE SCHEMA â€” 19 Tables

| Table | Purpose | Key Relations |
|---|---|---|
| `users` | All users (Customer/Cook/Admin) | â†’ kitchens, orders, reviews, subscriptions, favorites, addresses, notifications |
| `kitchens` | Cook's kitchen profiles | â†’ users(owner), meals, reviews, orders, subscriptions, boosts |
| `meals` | Menu items per kitchen | â†’ kitchens, orderItems |
| `orders` | Customer orders | â†’ kitchens, users(customer), orderItems |
| `order_items` | Line items per order | â†’ orders, meals |
| `reviews` | Kitchen reviews (by customers) | â†’ kitchens, users |
| `platform_reviews` | Platform-level reviews | â†’ users |
| `subscriptions` | Cook premium subscriptions | â†’ users, kitchens, planConfigs |
| `premium_plans` | Legacy plan definitions | Standalone |
| `plan_configs` | Active plan tiers (starter/growth/pro/elite) | â†’ subscriptions |
| `boosts` | Kitchen visibility boosts | â†’ kitchens, users |
| `reports` | Abuse reports | â†’ users(reporter), users(reviewer) |
| `admin_audit_log` | Admin action audit trail | â†’ users(admin) |
| `user_favorites` | Customer favorite kitchens | â†’ users, kitchens |
| `user_addresses` | Saved delivery addresses | â†’ users |
| `notifications` | In-app notifications | â†’ users |
| `commission_ledger` | Per-order commission records | â†’ orders |
| `potluck_deals` | Group buy deals by cooks | â†’ kitchens, users, subscriptions, meals |
| `potluck_orders` | Customer reservations on deals | â†’ potluckDeals, users, orders |
| `khata_entries` | Digital bookkeeping entries | â†’ kitchens, users |
| `plan_usage_log` | Plan limit enforcement audit | Standalone |

**Schema File**: `src/lib/db/schema.ts` (946 lines)

---

## FEATURE STATUS MATRIX

| # | Feature | Backend | Frontend | Auth Guard | Rate Limited | Validation | Status |
|---|---|---|---|---|---|---|---|
| 1 | **Auth (Login/Register)** | âœ… Full | âœ… Full | Firebase | âœ… auth:10/m | âœ… Zod | âœ… COMPLETE |
| 2 | **Kitchen Registration** | âœ… Full | âœ… Full | âœ… getAuthUser | âœ… kitchens:60/m | âœ… Zod | âœ… COMPLETE |
| 3 | **Menu Management** | âœ… Full | âœ… Full | âœ… requireSeller | âœ… default:60/m | âœ… Zod | âœ… COMPLETE |
| 4 | **Order System** | âœ… Full | âœ… Full | âœ… getAuthUser | âœ… orders:20/m | âœ… Zod | âœ… COMPLETE |
| 5 | **Real-time SSE** | âœ… Full | âœ… Full | âœ… SSE ticket | âœ… via Redis | N/A | âœ… COMPLETE |
| 6 | **Reviews (Kitchen)** | âœ… Full | âœ… Full | âœ… getAuthUser | âœ… reviews:30/m | âœ… Zod | âœ… COMPLETE |
| 7 | **Reviews (Platform)** | âœ… Full | âœ… Full | âœ… getAuthUser | âœ… reviews:30/m | âœ… Zod | âœ… COMPLETE |
| 8 | **Search/Explore** | âœ… Full | âœ… Full | Public | âœ… search:60/m | âœ… Zod | âœ… COMPLETE |
| 9 | **Subscription/Plans** | âœ… Full | âœ… Full | âœ… requireSeller | âœ… premium:20/m | âœ… Zod | âš ï¸ 90% â€” Elite checkout had runtime error |
| 10 | **Potluck Deals** | âœ… Full | âœ… Full | âœ… requireSeller + planGuard | âœ… sellerPotluck:10/h | âœ… Zod | âœ… COMPLETE |
| 11 | **Digital Khata** | âœ… Full | âœ… Full | âœ… requireSeller + planGuard | âœ… khata:60/m | âœ… Zod | âœ… COMPLETE |
| 12 | **Kitchen Boost** | âœ… Full | âœ… Full | âœ… requireSeller | âœ… premium:20/m | âœ… Zod | âœ… COMPLETE |
| 13 | **AI Pricing** | âœ… Full | âŒ No dedicated UI | âœ… requireSeller + planGuard | âœ… aiPricing:20/h | Partial | âš ï¸ 70% â€” Backend done, no UI page |
| 14 | **Chef AI Assistant** | âœ… Full | âŒ No dedicated UI | âœ… requireSeller + planGuard | âœ… chefAssistant:20/d | Partial | âš ï¸ 70% â€” Backend done, no UI page |
| 15 | **Admin Panel** | âœ… Full | âœ… Full | âœ… requireAdmin | âœ… admin:30/m | âœ… Zod | âœ… COMPLETE |
| 16 | **Notifications** | âœ… Full | âœ… Full (bell) | âœ… getAuthUser | âœ… default | N/A | âœ… COMPLETE |
| 17 | **Image Upload** | âœ… Full | âœ… Full | âœ… getAuthUser | âœ… upload:10/m | âœ… Magic bytes | âœ… COMPLETE |
| 18 | **Favorites** | âœ… Full | âœ… Full | âœ… getAuthUser | âœ… default | âœ… Zod | âœ… COMPLETE |
| 19 | **WhatsApp Notifs** | âš ï¸ MOCK | âŒ None | âœ… planGuard | N/A | N/A | âŒ 10% â€” Mock only, no real API |
| 20 | **Commission Tracking** | âœ… Full | âŒ No UI | Auto (on order complete) | N/A | N/A | âš ï¸ 50% â€” Backend only |
| 21 | **Cron Jobs** | âœ… Full | N/A | âœ… CRON_SECRET | N/A | N/A | âœ… COMPLETE |
| 22 | **SEO** | âœ… Full | âœ… Full | N/A | N/A | N/A | âœ… COMPLETE |

### Status Legend
- âœ… **COMPLETE** = Backend + Frontend + Security all working
- âš ï¸ **PARTIAL** = Some component missing (noted in %)
- âŒ **NOT DONE** = Stub/mock only

See Part 2 for API routes and Part 3 for file map.
# Smart Tiffin â€” Complete Project Audit (Part 2/3): API Routes

## ALL API ROUTES â€” Complete Inventory

### ðŸ” AUTH
| Route | Methods | Auth | Rate Limit | Status |
|---|---|---|---|---|
| `POST /api/auth/sync` | POST | Firebase token | auth:10/m | âœ… Syncs Firebase user â†’ DB, returns user+role+kitchenId |

**File**: `src/app/api/auth/sync/route.ts`

---

### ðŸ  KITCHENS
| Route | Methods | Auth | Rate Limit | Status |
|---|---|---|---|---|
| `GET /api/kitchens` | GET | Public (or auth for ?ownerId=me) | kitchens:60/m | âœ… List/filter kitchens with distance, ETag caching |
| `POST /api/kitchens` | POST | âœ… getAuthUser | kitchens:60/m | âœ… Create kitchen + auto roleâ†’COOK + auto free trial |
| `GET /api/kitchens/[id]` | GET | Public | kitchens:60/m | âœ… Get single kitchen by ID |
| `PUT /api/kitchen/update-images` | PUT | âœ… requireSeller | default:60/m | âœ… Update kitchen images |

**Files**: `src/app/api/kitchens/route.ts`, `src/app/api/kitchens/[id]/route.ts`, `src/app/api/kitchen/update-images/route.ts`

---

### ðŸ½ï¸ ORDERS
| Route | Methods | Auth | Rate Limit | Status |
|---|---|---|---|---|
| `GET /api/orders` | GET | âœ… getAuthUser | orders:20/m | âœ… Customer orders or cook's kitchen orders |
| `POST /api/orders` | POST | âœ… getAuthUser | orders:20/m | âœ… Place order with plan limit enforcement, SSE notify, notifications |
| `GET /api/orders/[id]` | GET | âœ… getAuthUser | orders:20/m | âœ… Single order detail |
| `PATCH /api/orders/[id]` | PATCH | âœ… getAuthUser (cook only) | orders:20/m | âœ… Update status (ACCEPTED/COMPLETED/CANCELLED), SSE notify both parties |
| `POST /api/orders/payment` | POST | âœ… getAuthUser | orders:20/m | âœ… Create Stripe payment intent for order |
| `POST /api/orders/reorder` | POST | âœ… getAuthUser | orders:20/m | âœ… Re-order from previous order |

**Files**: `src/app/api/orders/route.ts`, `src/app/api/orders/[id]/route.ts`, `src/app/api/orders/payment/route.ts`, `src/app/api/orders/reorder/route.ts`

---

### â­ REVIEWS
| Route | Methods | Auth | Rate Limit | Status |
|---|---|---|---|---|
| `GET /api/reviews` | GET | Public | reviews:30/m | âœ… List reviews with filters |
| `POST /api/reviews` | POST | âœ… getAuthUser | reviews:30/m | âœ… Create kitchen review (verified purchase check) |
| `GET /api/reviews/[id]` | GET | Public | reviews:30/m | âœ… Single review |
| `GET /api/reviews/check` | GET | âœ… getAuthUser | reviews:30/m | âœ… Check if user can review |
| `GET /api/reviews/platform` | GET | Public | reviews:30/m | âœ… Platform review stats |
| `POST /api/reviews/platform` | POST | âœ… getAuthUser | reviews:30/m | âœ… Submit platform review |

**Files**: `src/app/api/reviews/route.ts`, `src/app/api/reviews/[id]/route.ts`, `src/app/api/reviews/check/route.ts`, `src/app/api/reviews/platform/route.ts`

---

### ðŸ’Ž PREMIUM / SUBSCRIPTION
| Route | Methods | Auth | Rate Limit | Status |
|---|---|---|---|---|
| `GET /api/premium/plans` | GET | Public | premium:20/m | âœ… List plan configs from DB |
| `GET /api/premium/status` | GET | âœ… getAuthUser | premium:20/m | âœ… Kitchen subscription status |
| `POST /api/premium/checkout` | POST | âœ… getAuthUser | premium:20/m | âœ… Create Stripe checkout session |
| `GET /api/seller/subscription` | GET | âœ… requireSeller | premium:20/m | âœ… Full subscription management data with usage |
| `DELETE /api/seller/subscription` | DELETE | âœ… requireSeller | premium:20/m | âœ… Cancel subscription (Stripe + DB) |
| `POST /api/seller/subscription/checkout` | POST | âœ… requireSeller | subscriptionCheckout:3/h | âœ… Seller checkout flow |
| `GET /api/seller/subscription/status` | GET | âœ… requireSeller | premium:20/m | âœ… Detailed plan status |
| `POST /api/seller/subscription/trial` | POST | âœ… requireSeller | premium:20/m | âœ… Start free trial |
| `DELETE /api/seller/subscription/cancel` | DELETE | âœ… requireSeller | premium:20/m | âœ… Cancel with reason |

**Files**: `src/app/api/premium/*/route.ts`, `src/app/api/seller/subscription/*/route.ts`

---

### ðŸŽ¯ SELLER FEATURES (Plan-gated)
| Route | Methods | Auth | Rate Limit | Plan Guard | Status |
|---|---|---|---|---|---|
| `POST /api/seller/potluck` | POST | âœ… requireSeller | sellerPotluck:10/h | âœ… potluck feature | âœ… Create potluck deal |
| `GET /api/seller/potluck` | GET | âœ… requireSeller | sellerPotluck:10/h | None | âœ… List own deals |
| `PATCH /api/seller/potluck/[id]` | PATCH | âœ… requireSeller | sellerPotluck:10/h | None | âœ… Update deal status |
| `POST /api/seller/khata` | POST | âœ… requireSeller | khata:60/m | âœ… digital_khata | âœ… Create khata entry |
| `GET /api/seller/khata` | GET | âœ… requireSeller | khata:60/m | âœ… digital_khata | âœ… List khata entries |
| `GET /api/seller/khata/summary` | GET | âœ… requireSeller | khata:60/m | âœ… digital_khata | âœ… Monthly summary |
| `POST /api/seller/boost` | POST | âœ… requireSeller | premium:20/m | None | âœ… Create Stripe checkout for boost |
| `POST /api/seller/ai/pricing` | POST | âœ… requireSeller | aiPricing:20/h | âœ… ai_pricing | âœ… AI pricing suggestion (Anthropic) |
| `POST /api/seller/ai/chef-assistant` | POST | âœ… requireSeller | chefAssistant:20/d | âœ… cook_helper_ai | âœ… Chef AI assistant (Anthropic) |

**Files**: `src/app/api/seller/*/route.ts`

---

### ðŸ” SEARCH
| Route | Methods | Auth | Rate Limit | Status |
|---|---|---|---|---|
| `GET /api/search` | GET | Public | search:60/m | âœ… Full search with geo filtering |
| `GET /api/search/suggestions` | GET | Public | suggestions:30/m | âœ… Fuzzy search suggestions |

**Files**: `src/app/api/search/route.ts`, `src/app/api/search/suggestions/route.ts`

---

### ðŸ‘¤ ACCOUNT
| Route | Methods | Auth | Rate Limit | Status |
|---|---|---|---|---|
| `GET /api/account/profile` | GET | âœ… getAuthUser | default | âœ… Get user profile |
| `PATCH /api/account/profile-update` | PATCH | âœ… getAuthUser | default | âœ… Update profile |
| `GET /api/account/orders` | GET | âœ… getAuthUser | default | âœ… Customer order history |
| `GET /api/account/favorites` | GET | âœ… getAuthUser | default | âœ… Favorite kitchens |
| `GET /api/account/addresses` | GET | âœ… getAuthUser | default | âœ… Saved addresses |
| `GET /api/account/notifications` | GET | âœ… getAuthUser | default | âœ… Notification list |
| `GET /api/account/reviews` | GET | âœ… getAuthUser | default | âœ… User's reviews |
| `GET /api/account/analytics` | GET | âœ… getAuthUser | default | âœ… Buyer analytics |

**Files**: `src/app/api/account/*/route.ts`

---

### ðŸ›¡ï¸ ADMIN
| Route | Methods | Auth | Rate Limit | Status |
|---|---|---|---|---|
| `GET /api/admin?action=stats` | GET | âœ… requireAdmin | admin:30/m | âœ… Platform stats |
| `GET /api/admin?action=users` | GET | âœ… requireAdmin | admin:30/m | âœ… List users (cursor pagination) |
| `GET /api/admin?action=kitchens` | GET | âœ… requireAdmin | admin:30/m | âœ… List kitchens |
| `GET /api/admin?action=audit_log` | GET | âœ… requireAdmin | admin:30/m | âœ… Audit log |
| `GET /api/admin` (default) | GET | âœ… requireAdmin | admin:30/m | âœ… List reports |
| `POST /api/admin` | POST | âœ… requireAdmin | admin:30/m | âœ… resolve_report, moderate_kitchen, moderate_user, delete_review |

**File**: `src/app/api/admin/route.ts`

---

### ðŸ”§ INFRASTRUCTURE
| Route | Methods | Auth | Rate Limit | Status |
|---|---|---|---|---|
| `GET /api/health` | GET | None | None | âœ… Health check |
| `GET /api/stats` | GET | Public | default | âœ… Public platform stats |
| `GET /api/cities` | GET | Public | default | âœ… City list |
| `POST /api/upload` | POST | âœ… getAuthUser | upload:10/m | âœ… Image upload (magic bytes validation) |
| `POST /api/upload/image` | POST | âœ… getAuthUser | upload:10/m | âœ… Image upload variant |
| `GET /api/og` | GET | Public | None | âœ… OG image generation |
| `POST /api/reports` | POST | âœ… getAuthUser | default | âœ… Submit abuse report |
| `GET /api/plans` | GET | Public | default | âœ… Plan listing |

---

### ðŸ“¡ SSE (Server-Sent Events)
| Route | Methods | Auth | Status |
|---|---|---|---|
| `GET /api/sse/kitchen` | GET | âœ… SSE ticket | âœ… Real-time kitchen order updates |
| `GET /api/sse/customer` | GET | âœ… SSE ticket | âœ… Real-time customer order status |
| `POST /api/sse/ticket` | POST | âœ… getAuthUser | âœ… Issue SSE auth ticket |

**Files**: `src/app/api/sse/kitchen/route.ts`, `src/app/api/sse/customer/route.ts`, `src/app/api/sse/ticket/route.ts`

---

### â° CRON JOBS
| Route | Schedule | Auth | Status |
|---|---|---|---|
| `GET /api/cron/cleanup` | Daily 2AM UTC | CRON_SECRET | âœ… General cleanup |
| `GET /api/cron/potluck-expiry` | Daily 4AM UTC | CRON_SECRET | âœ… Expire potluck deals |
| `GET /api/cron/expire-subscriptions` | Not in vercel.json | CRON_SECRET | âš ï¸ Built but NOT scheduled |
| `GET /api/cron/notification-cleanup` | Not in vercel.json | CRON_SECRET | âš ï¸ Built but NOT scheduled |
| `GET /api/cron/reset-menu` | Not in vercel.json | CRON_SECRET | âš ï¸ Built but NOT scheduled |
| `GET /api/cron/reset-order-counts` | Not in vercel.json | CRON_SECRET | âš ï¸ Built but NOT scheduled |

**âš ï¸ ISSUE**: Only 2 of 6 cron jobs are scheduled in `vercel.json`. Vercel Hobby allows max 2.

---

### ðŸª WEBHOOKS
| Route | Methods | Auth | Status |
|---|---|---|---|
| `POST /api/webhooks/stripe` | POST | Stripe signature | âœ… Handles checkout.completed, subscription.updated/deleted, invoice.paid/failed |

**File**: `src/app/api/webhooks/stripe/route.ts`

---

## SECURITY ASSESSMENT

| Layer | Implementation | Status |
|---|---|---|
| **Authentication** | Firebase Admin SDK token verification | âœ… Solid |
| **Authorization** | Role-based (CUSTOMER/COOK/ADMIN) via `getAuthUser`, `requireSeller`, `requireAdmin` | âœ… Solid |
| **Rate Limiting** | Upstash Redis sliding window, 15+ route-specific limiters | âœ… Solid |
| **Input Validation** | Zod schemas on all write endpoints | âœ… Solid |
| **XSS Prevention** | `sanitizeText()` and `sanitizeRichText()` on all user inputs | âœ… Solid |
| **SQL Injection** | Drizzle ORM parameterized queries | âœ… Solid |
| **CSRF** | API routes only (no forms), Bearer token auth | âœ… OK |
| **Upload Security** | Magic bytes validation + MIME check + 5MB limit | âœ… Solid |
| **Stripe Webhooks** | Signature verification | âœ… Solid |
| **SSE Auth** | Redis-backed one-time ticket system | âœ… Solid |
| **Soft Deletes** | All entities use `deletedAt` pattern | âœ… Good |
| **Admin Audit** | All admin actions logged to `admin_audit_log` | âœ… Good |
| **ENV Protection** | `db:push` blocked in production via script guard | âœ… Good |
| **SEO Security** | `noindex` on all private pages, robots.txt blocks dashboard | âœ… Good |

See Part 3 for the complete file map.
# Smart Tiffin â€” Complete Project Audit (Part 3/3): File Map & Issues

## COMPLETE FILE MAP

### `/src/app/` â€” Pages & API Routes

```
src/app/
â”œâ”€â”€ layout.tsx                          # Root layout (AuthProvider, CartProvider, LocationProvider)
â”œâ”€â”€ page.tsx                            # Landing page (23KB â€” hero, features, reviews, CTA)
â”œâ”€â”€ globals.css                         # Global styles (11KB)
â”œâ”€â”€ error.tsx                           # Global error boundary
â”œâ”€â”€ not-found.tsx                       # Custom 404 page (15KB â€” premium design)
â”œâ”€â”€ icon.png                            # Favicon
â”œâ”€â”€ robots.ts                           # Dynamic robots.txt (blocks dashboard, admin)
â”œâ”€â”€ sitemap.ts                          # Dynamic sitemap (public pages + kitchens)
â”‚
â”œâ”€â”€ login/                              # Auth page
â”‚   â””â”€â”€ page.tsx                        # Google + Phone login UI
â”‚
â”œâ”€â”€ complete-profile/                   # Post-registration profile completion
â”‚   â””â”€â”€ page.tsx
â”‚
â”œâ”€â”€ explore/                            # Kitchen discovery
â”‚   â”œâ”€â”€ page.tsx                        # Explore page with filters + map
â”‚   â”œâ”€â”€ ExploreSEO.tsx                  # SEO wrapper (33KB â€” structured data)
â”‚   â””â”€â”€ error.tsx
â”‚
â”œâ”€â”€ kitchen/[id]/                       # Kitchen detail page
â”‚   â””â”€â”€ page.tsx                        # Menu, reviews, order placement
â”‚
â”œâ”€â”€ orders/                             # Customer order views
â”‚   â”œâ”€â”€ page.tsx                        # Order list
â”‚   â””â”€â”€ [id]/page.tsx                   # Order detail with real-time tracking
â”‚
â”œâ”€â”€ account/                            # Customer account hub
â”‚   â”œâ”€â”€ layout.tsx
â”‚   â”œâ”€â”€ page.tsx                        # Account dashboard (16KB)
â”‚   â”œâ”€â”€ AccountClientLayout.tsx         # Client layout with nav tabs
â”‚   â”œâ”€â”€ addresses/page.tsx              # Saved addresses
â”‚   â”œâ”€â”€ analytics/page.tsx              # Buyer spending analytics
â”‚   â”œâ”€â”€ favorites/page.tsx              # Favorite kitchens
â”‚   â”œâ”€â”€ notifications/page.tsx          # Notification center
â”‚   â”œâ”€â”€ orders/page.tsx                 # Order history
â”‚   â”œâ”€â”€ profile/page.tsx                # Edit profile
â”‚   â””â”€â”€ reviews/page.tsx                # User's reviews
â”‚
â”œâ”€â”€ dashboard/                          # COOK dashboard
â”‚   â”œâ”€â”€ layout.tsx
â”‚   â”œâ”€â”€ page.tsx                        # Main dashboard (38KB â€” stats, quick actions, charts)
â”‚   â”œâ”€â”€ DashboardClientLayout.tsx       # Client layout with sidebar nav
â”‚   â”œâ”€â”€ loading.tsx
â”‚   â”œâ”€â”€ menu/
â”‚   â”‚   â”œâ”€â”€ page.tsx                    # Menu management (40KB â€” CRUD, availability, images)
â”‚   â”‚   â””â”€â”€ loading.tsx
â”‚   â”œâ”€â”€ orders/
â”‚   â”‚   â”œâ”€â”€ page.tsx                    # Order management with real-time SSE (9KB)
â”‚   â”‚   â””â”€â”€ loading.tsx
â”‚   â”œâ”€â”€ reviews/
â”‚   â”‚   â”œâ”€â”€ page.tsx                    # Review management + seller replies (18KB)
â”‚   â”‚   â””â”€â”€ loading.tsx
â”‚   â”œâ”€â”€ settings/
â”‚   â”‚   â”œâ”€â”€ page.tsx                    # Kitchen settings (24KB)
â”‚   â”‚   â””â”€â”€ loading.tsx
â”‚   â”œâ”€â”€ subscription/
â”‚   â”‚   â”œâ”€â”€ page.tsx                    # Subscription overview
â”‚   â”‚   â”œâ”€â”€ pricing-client.tsx          # Plan pricing cards (16KB)
â”‚   â”‚   â”œâ”€â”€ actions.ts                  # Server actions for subscription
â”‚   â”‚   â”œâ”€â”€ loading.tsx
â”‚   â”‚   â”œâ”€â”€ manage/page.tsx             # Manage subscription
â”‚   â”‚   â””â”€â”€ success/page.tsx            # Post-checkout success
â”‚   â”œâ”€â”€ potluck/
â”‚   â”‚   â””â”€â”€ page.tsx                    # Potluck deal management (28KB)
â”‚   â”œâ”€â”€ khata/
â”‚   â”‚   â””â”€â”€ page.tsx                    # Digital bookkeeping (20KB)
â”‚   â””â”€â”€ boost/
â”‚       â””â”€â”€ page.tsx                    # Kitchen boost purchase (7KB)
â”‚
â”œâ”€â”€ admin/
â”‚   â”œâ”€â”€ layout.tsx
â”‚   â””â”€â”€ page.tsx                        # Admin panel (21KB â€” users, kitchens, reports, audit)
â”‚
â”œâ”€â”€ become-a-cook/page.tsx              # Cook registration form
â”œâ”€â”€ seller/page.tsx                     # Seller landing page
â”œâ”€â”€ premium/page.tsx                    # Premium plans marketing page
â”œâ”€â”€ city/page.tsx                       # City-specific kitchen listings
â”œâ”€â”€ about/page.tsx                      # About page
â”œâ”€â”€ contact/page.tsx                    # Contact page
â”œâ”€â”€ privacy/page.tsx                    # Privacy policy
â”œâ”€â”€ terms/page.tsx                      # Terms of service
â”‚
â””â”€â”€ api/                                # (See Part 2 for all 50+ routes)
```

---

### `/src/services/` â€” Business Logic Layer

| File | Size | Purpose | Status |
|---|---|---|---|
| `auth.service.ts` | 4KB | User auth, sync, role updates | âœ… Complete |
| `kitchen.service.ts` | 9KB | Kitchen CRUD, listing with Redis cache | âœ… Complete |
| `menu.service.ts` | 6KB | Meal CRUD with ownership verification | âœ… Complete |
| `order.service.ts` | 11KB | Order CRUD, status updates, SSE pub | âœ… Complete |
| `review.service.ts` | 11KB | Kitchen + platform reviews, seller replies, rating recalc | âœ… Complete |
| `premium.service.ts` | 25KB | Subscriptions, Stripe checkout/webhooks, trial, boost, grace period | âœ… Complete |
| `notification.service.ts` | 9KB | In-app + FCM push notifications, templates | âœ… Complete |
| `admin.service.ts` | 6KB | Reports, moderation, platform stats, audit log | âœ… Complete |
| `commission.service.ts` | 3KB | Per-order commission recording + auto-khata | âœ… Complete |
| `plan-usage.service.ts` | 4KB | Order count increment, potluck use decrement/restore | âœ… Complete |
| `whatsapp.service.ts` | 2KB | **MOCK** â€” No real WhatsApp Business API | âŒ Mock only |

---

### `/src/lib/` â€” Shared Libraries

| File/Dir | Purpose | Status |
|---|---|---|
| `db/index.ts` | Neon DB connection (serverless) | âœ… |
| `db/schema.ts` | All 19+ tables + relations (946 lines) | âœ… |
| `db/migration-guard.ts` | Production migration safety | âœ… |
| `auth/firebase-admin.ts` | Firebase Admin SDK init (singleton) | âœ… |
| `auth/get-auth-user.ts` | Extract/verify auth user from request | âœ… |
| `auth/seller-guard.ts` | Require COOK role + load kitchen | âœ… |
| `auth/resolve-sse-ticket.ts` | One-time SSE auth ticket resolution | âœ… |
| `firebase/auth-context.tsx` | Client-side Firebase auth context (18KB) | âœ… |
| `firebase/config.ts` | Firebase client config | âœ… |
| `plans/plan-access.ts` | Central plan feature resolution (14KB) | âœ… |
| `plans/plan-guards.ts` | Enforce plan limits (menu, orders, potluck, features) | âœ… |
| `plans/check-access.ts` | Lightweight plan access check | âœ… |
| `redis/index.ts` | Redis client + cache helpers | âœ… |
| `redis/pubsub.ts` | Redis pub/sub for SSE real-time events | âœ… |
| `redis/search-index.ts` | Redis search index for suggestions | âœ… |
| `validations/auth.ts` | Auth Zod schemas | âœ… |
| `validations/kitchen.ts` | Kitchen Zod schemas | âœ… |
| `validations/menu.ts` | Menu Zod schemas | âœ… |
| `validations/order.ts` | Order Zod schemas | âœ… |
| `validations/review.ts` | Review Zod schemas | âœ… |
| `validations/subscription.ts` | Subscription Zod schemas + plan constants | âœ… |
| `validations/potluck.ts` | Potluck Zod schemas | âœ… |
| `validations/address.ts` | Address Zod schemas | âœ… |
| `utils/api-response.ts` | Standardized API response helpers | âœ… |
| `utils/errors.ts` | Custom error classes (AppError, NotFoundError, etc.) | âœ… |
| `utils/cloudinary.ts` | Cloudinary SDK config | âœ… |
| `utils/distance.ts` | Haversine distance calculation | âœ… |
| `utils/fuzzy-search.ts` | Fuzzy search algorithm | âœ… |
| `utils/logger.ts` | Structured JSON logger | âœ… |
| `utils/sanitize.ts` | XSS sanitization helpers | âœ… |
| `cart-context.tsx` | Client-side cart state (8KB) | âœ… |
| `location-context.tsx` | Client-side geolocation (7KB) | âœ… |
| `stripe.ts` | Stripe SDK init | âœ… |
| `rate-limit.ts` | 15+ route-specific rate limiters | âœ… |

---

### `/src/components/` â€” Reusable Components

| Dir | Files | Purpose |
|---|---|---|
| `ui/` | button, input, label, textarea, card, alert, avatar, progress | Radix-based primitives |
| `ui/` | KitchenCard, SearchBar, CityFilterBar, NotificationBell, UserAvatar, BackButton, ContactCard, TestimonialCard | Feature components |
| `ui/image-uploader/` | Image upload with compression | Image management |
| `auth/` | AuthGuard, LoginForm | Auth UI |
| `cart/` | CartDrawer, CartIcon | Shopping cart |
| `home/` | Hero, Features, HowItWorks, ClientsSection | Landing sections |
| `kitchen/` | KitchenDetail, KitchenMenu, KitchenReviews | Kitchen page |
| `layout/` | Header, Footer, MobileNav | Site layout |
| `location/` | LocationPicker, LocationModal | Geolocation |
| `map/` | MapView, KitchenMap | Leaflet maps |
| `menu/` | MenuForm, MenuCard | Menu CRUD |
| `orders/` | OrderCard, OrderDetail, OrderTracker | Order UI |
| `plans/` | PlanCard, PlanComparison | Subscription UI |
| `potluck/` | PotluckCard, PotluckForm | Potluck UI |
| `reviews/` | ReviewForm, ReviewCard, ReviewList | Review UI |
| `dashboard/` | StatsCard, RevenueChart, OrdersChart | Dashboard widgets |

---

### `/src/hooks/` â€” Custom Hooks

| File | Purpose | Status |
|---|---|---|
| `use-kitchen-sse.ts` | SSE hook for cook real-time order updates | âœ… |
| `use-customer-sse.ts` | SSE hook for customer order tracking | âœ… |
| `use-plan-access.ts` | Client-side plan access check | âœ… |

---

### Root Config Files

| File | Purpose |
|---|---|
| `package.json` | Dependencies (Next.js 16, React 19, Stripe, Firebase, Drizzle, etc.) |
| `vercel.json` | Vercel config + 2 cron jobs |
| `next.config.ts` | Next.js config (3.4KB) |
| `drizzle.config.ts` | Drizzle ORM config |
| `tsconfig.json` | TypeScript config |
| `.env.local` | Environment variables (NOT committed) |
| `.env.example` | Env template |

---

## KNOWN ISSUES & GAPS

### ðŸ”´ Critical
1. **Elite Subscription Checkout Error** â€” Runtime error when clicking "Get Elite" button (`pricing-client.tsx`). Likely missing `stripePriceId` in `plan_configs` DB table for elite plan.
2. **4 Cron Jobs NOT Scheduled** â€” `expire-subscriptions`, `notification-cleanup`, `reset-menu`, `reset-order-counts` exist but aren't in `vercel.json`. Vercel Hobby only allows 2 crons.

### ðŸŸ¡ Partial Implementation
3. **AI Pricing** â€” Backend fully built (`/api/seller/ai/pricing`) with Anthropic integration + fallback. **No dedicated UI page** â€” needs a button/modal in menu management.
4. **Chef AI Assistant** â€” Backend fully built (`/api/seller/ai/chef-assistant`) with rate limiting (20/day). **No dedicated UI page**.
5. **Commission Tracking** â€” Backend fully built (auto-records on order complete). **No admin UI** to view/manage commission ledger.
6. **WhatsApp Notifications** â€” **MOCK service only**. `whatsapp.service.ts` logs to console instead of calling WhatsApp Business API.

### ðŸŸ¢ Minor
7. **Order Payment** â€” Stripe payment intent API exists but **COD (Cash on Delivery) is the primary flow**. JazzCash/Easypaisa/SadaPay throw 501 Not Implemented.
8. **Delivery Tracking** â€” Basic status flow (PENDINGâ†’ACCEPTEDâ†’COMPLETEDâ†’CANCELLED). No real-time GPS tracking or delivery partner integration.
9. **Plan Usage Reset** â€” `reset-order-counts` cron exists but not scheduled. Monthly order counters may not reset properly.

---

## ENVIRONMENT VARIABLES NEEDED

```env
# Database
DATABASE_URL=postgresql://...@neon.tech/...

# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_SERVICE_ACCOUNT_KEY=   # base64 encoded JSON

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# AI (Optional)
ANTHROPIC_API_KEY=

# App
NEXT_PUBLIC_BASE_URL=https://smarttiffin.pk
CRON_SECRET=
```

---

## PLAN TIERS (plan_configs table)

| Feature | Starter | Growth | Pro | Elite |
|---|---|---|---|---|
| Menu Items | 5 | 15 | 30 | Unlimited |
| Monthly Orders | 30 | 100 | 300 | Unlimited |
| Commission Rate | 10% | 7.5% | 5% | 2.5% |
| Potluck Deals | 1/period | 3/period | 5/period | Unlimited |
| Featured Boost | basic | city | city_top | national |
| Analytics | basic | standard | advanced | ai_insights |
| AI Pricing | âŒ | âŒ | âŒ | âœ… |
| Chef AI | âŒ | âœ… | âœ… | âœ… |
| Digital Khata | âŒ | âŒ | âœ… | âœ… |
| Auto WhatsApp | âŒ | âŒ | âŒ | âœ… |
| Branding Tools | âŒ | âœ… | âœ… | âœ… |
| Priority Support | âŒ | âŒ | âœ… | âœ… |
| Dedicated Manager | âŒ | âŒ | âŒ | âœ… |

---

## SUMMARY FOR CLAUDE DESKTOP

When working with this codebase:

1. **All source code** is in `f:\smart-tiffin\home_food\src\`
2. **Database schema** is the single source of truth at `src/lib/db/schema.ts`
3. **Business logic** lives in `src/services/*.service.ts` â€” API routes are thin wrappers
4. **Auth flow**: Firebase client â†’ ID token â†’ `getAuthUser()` â†’ DB user lookup
5. **Plan system**: `plan_configs` DB table â†’ `getKitchenPlanAccess()` â†’ `guardFeatureAccess()` / `guardMenuItemLimit()` / `guardOrderLimit()`
6. **Real-time**: Redis pub/sub â†’ SSE endpoints â†’ React hooks (`use-kitchen-sse`, `use-customer-sse`)
7. **Caching**: Redis with `cached()` helper and explicit `invalidateCache()` calls
8. **All API responses** use standardized helpers from `src/lib/utils/api-response.ts`
