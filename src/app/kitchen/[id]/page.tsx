import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { MapLazy } from "@/components/map/MapLazy";
import { ReportButton } from "@/components/kitchen/ReportButton";
import { KitchenHeader } from "@/components/kitchen/KitchenHeader";
import { ClientOrderBanner } from "@/components/kitchen/ClientOrderBanner";
import { getKitchenById, getKitchenBySlug } from "@/services/kitchen.service";
import { getMealsByKitchen } from "@/services/menu.service";
import { getKitchenReviews, getKitchenReviewStats } from "@/services/review.service";
import { reviewQuerySchema } from "@/lib/validations/review";
import ReviewCard from "@/components/reviews/ReviewCard";
import ReviewList from "@/components/reviews/ReviewList";
import RatingBreakdown from "@/components/reviews/RatingBreakdown";
import WriteKitchenReviewAction from "@/components/reviews/WriteKitchenReviewAction";

type Props = { params: Promise<{ id: string }> };

// ─── Types ──────────────────────────────────────────────────────────────────

type MealData = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string | null;
    isAvailable: boolean;
    imageUrl: string | null;
    dietaryTags: string[] | null;
    calories: number | null;
    servingSize: string | null;
};

type ReviewData = {
    id: string;
    rating: number;
    comment: string | null;
    sellerReply: string | null;
    sellerRepliedAt: string | null;
    isVerifiedPurchase: boolean;
    user: { name: string | null } | null;
};

// ─── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { id } = await params;
    try {
        const kitchen = await getKitchenById(id);
        const cityName = kitchen.city || "Pakistan";
        const title = `${kitchen.name} – Home Cooked Food in ${cityName} | Smart Tiffin`;
        const description = `Order fresh home cooked food from ${kitchen.name} in ${cityName}. Affordable meal delivery and monthly tiffin service. View menu, reviews, and place your order today.`;
        return {
            title,
            description,
            keywords: [
                "tiffin service",
                "home cooked food",
                "meal delivery",
                "monthly tiffin service",
                `home cooked food delivery ${cityName}`,
                cityName,
                kitchen.name,
            ].filter(Boolean),
            alternates: {
                canonical: `https://smarttiffinfood.vercel.app/kitchen/${id}`,
            },
            openGraph: {
                title,
                description,
                type: "website",
                siteName: "Smart Tiffin",
                url: `https://smarttiffinfood.vercel.app/kitchen/${id}`,
                ...(kitchen.coverImageUrl ? { images: [{ url: kitchen.coverImageUrl }] } : {}),
            },
        };
    } catch {
        return { title: "Kitchen Not Found" };
    }
}

export const revalidate = 300;

// ─── Data Fetchers (direct service calls — no HTTP round-trip) ──────────────

async function getKitchen(idOrSlug: string) {
    try {
        // Try UUID lookup first
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(idOrSlug)) {
            try {
                return await getKitchenById(idOrSlug);
            } catch (err) {
                console.warn(`[Kitchen Page] UUID lookup failed for: ${idOrSlug}, falling back to slug...`);
            }
        }

        // Fallback to Slug lookup
        try {
            return await getKitchenBySlug(idOrSlug);
        } catch (err) {
            console.error(`[Kitchen Page] Both ID and Slug lookup failed for: ${idOrSlug}`);
            return null;
        }
    } catch (error) {
        console.error(`[Kitchen Page] Unexpected error fetching kitchen ${idOrSlug}:`, error);
        return null;
    }
}

async function getMenu(id: string) {
    try {
        return await getMealsByKitchen(id);
    } catch (error) {
        console.error(`[Kitchen Page] Failed to fetch menu for ${id}:`, error);
        return [];
    }
}

async function getReviews(id: string): Promise<{ reviews: ReviewData[]; total: number }> {
    try {
        const parsed = reviewQuerySchema.parse({ limit: "50" });
        const result = await getKitchenReviews(id, parsed);
        return { reviews: result.reviews as ReviewData[], total: result.total };
    } catch {
        return { reviews: [], total: 0 };
    }
}

// ─── Meal Card ──────────────────────────────────────────────────────────────

function MealCard({ meal }: { meal: MealData }) {
    return (
        <div className={`rounded-xl border p-4 transition-all ${meal.isAvailable
            ? "bg-white border-neutral-200/60 hover:shadow-md dark:bg-neutral-800 dark:border-neutral-700"
            : "bg-neutral-50 border-neutral-200/40 opacity-60 dark:bg-neutral-800/50 dark:border-neutral-700/50"
            }`}>
            <div className="flex gap-4">
                {meal.imageUrl && (
                    <div className="h-20 w-20 flex-shrink-0 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                        <img src={meal.imageUrl} alt={meal.name} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                )}

                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-neutral-900 truncate dark:text-neutral-100">{meal.name}</h3>
                        <span className="flex-shrink-0 font-bold text-primary-600 dark:text-primary-400">
                            Rs. {Number(meal.price).toLocaleString()}
                        </span>
                    </div>

                    {meal.description && (
                        <p className="mt-1 text-sm text-neutral-500 line-clamp-2 dark:text-neutral-400">{meal.description}</p>
                    )}

                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {meal.category && (
                            <span className="rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                {meal.category}
                            </span>
                        )}
                        {meal.dietaryTags?.slice(0, 2).map((tag) => (
                            <span key={tag} className="rounded-full bg-accent-50 px-2 py-0.5 text-xs font-medium text-accent-700 dark:bg-accent-900/30 dark:text-accent-300">
                                {tag}
                            </span>
                        ))}
                        {!meal.isAvailable && (
                            <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-300">
                                Unavailable
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

import { MealItem } from "@/components/menu/MealItem";
import { CartPanel } from "@/components/cart/CartPanel";

// ─── Kitchen Content ────────────────────────────────────────────────────────

async function KitchenContent({ id }: { id: string }) {
    const [kitchen, menu, reviewData, reviewStats] = await Promise.all([
        getKitchen(id),
        getMenu(id),
        getReviews(id),
        getKitchenReviewStats(id),
    ]);

    if (!kitchen) {
        return (
            <div className="text-center py-20">
                <span className="text-5xl block mb-4">😕</span>
                <h2 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300">Kitchen not found</h2>
                <Link href="/explore" className="mt-4 inline-block text-primary-600 hover:underline">
                    ← Back to Explore
                </Link>
            </div>
        );
    }

    return (
        <div className="animate-fade-in pb-20 md:pb-0">
            {/* JSON-LD Structured Data for SEO */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify({
                        "@context": "https://schema.org",
                        "@type": "Restaurant",
                        name: kitchen.name,
                        description: kitchen.description || "Tiffin service and home cooked food meal delivery provider.",
                        servesCuisine: kitchen.cuisineTypes?.length ? kitchen.cuisineTypes.join(", ") : "Home Style",
                        areaServed: kitchen.city || "Pakistan",
                        ...(kitchen.addressLine ? { address: { "@type": "PostalAddress", streetAddress: kitchen.addressLine, addressLocality: kitchen.city || "" } } : {}),
                        ...(kitchen.coverImageUrl ? { image: kitchen.coverImageUrl } : {}),
                        ...(Number(kitchen.reviewCount) > 0
                            ? {
                                aggregateRating: {
                                    "@type": "AggregateRating",
                                    ratingValue: Number(kitchen.avgRating).toFixed(1),
                                    reviewCount: String(kitchen.reviewCount),
                                },
                            }
                            : {}),
                        priceRange: "₨200 - ₨600"
                    }),
                }}
            />

            <div className="flex flex-col md:flex-row gap-8 items-start">

                {/* Left Column: Details & Menu */}
                <div className="flex-1 w-full min-w-0">

                    {/* Hero */}
                    <div className="relative h-48 sm:h-64 rounded-2xl overflow-hidden bg-gradient-to-br from-primary-100 to-primary-50 dark:from-neutral-700 dark:to-neutral-800">
                        {kitchen.coverImageUrl ? (
                            <img src={kitchen.coverImageUrl} alt={kitchen.name} className="h-full w-full object-cover" />
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <span className="text-7xl opacity-30">🍱</span>
                            </div>
                        )}
                    </div>

                    {/* Interactive Header (Title, Rating, Favorite Toggle) */}
                    <KitchenHeader kitchen={{
                        id: kitchen.id,
                        name: kitchen.name,
                        area: kitchen.area,
                        city: kitchen.city,
                        description: kitchen.description,
                        avgRating: String(kitchen.avgRating ?? "0"),
                        reviewCount: Number(kitchen.reviewCount ?? 0),
                        isVerified: kitchen.isVerified,
                        deliveryOptions: kitchen.deliveryOptions
                    }} />

                        {/* U1: Report Button */}
                        <div className="mt-4">
                            <ReportButton kitchenId={kitchen.id} kitchenName={kitchen.name} />
                        </div>

                        {/* Phase 7: WhatsApp CTA */}
                        {kitchen.contactWhatsapp && (
                            <div className="mt-5">
                                <a
                                    href={`https://wa.me/${kitchen.contactWhatsapp.replace(/[^0-9]/g, "").replace(/^0/, "92")}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2.5 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#25D366]/30 hover:bg-[#1fb855] transition-all active:scale-95"
                                >
                                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                    </svg>
                                    Chat on WhatsApp
                                </a>
                            </div>
                        )}

                    {/* U4c: Kitchen Gallery */}
                    {kitchen.images && kitchen.images.length > 0 && (
                        <section className="mt-8">
                            <h2 className="text-lg font-bold text-neutral-900 mb-4 dark:text-neutral-50">📸 Gallery</h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                {kitchen.images.map((img: string, idx: number) => (
                                    <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-neutral-100 dark:bg-neutral-700">
                                        <img src={img} alt={`${kitchen.name} photo ${idx + 1}`} className="h-full w-full object-cover hover:scale-105 transition-transform duration-300" loading="lazy" />
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* U2: Kitchen Location Map */}
                    {kitchen.latitude && kitchen.longitude && (
                        <section className="mt-8">
                            <h2 className="text-lg font-bold text-neutral-900 mb-4 dark:text-neutral-50">📍 Location</h2>
                            <div className="h-64 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700">
                                <MapLazy
                                    center={[Number(kitchen.latitude), Number(kitchen.longitude)]}
                                    markers={[{ position: [Number(kitchen.latitude), Number(kitchen.longitude)], title: kitchen.name }]}
                                />
                            </div>
                        </section>
                    )}

                    {/* Menu */}
                    <section className="mt-12">
                        <ClientOrderBanner kitchenName={kitchen.name} />
                        <h2 className="text-xl font-bold text-neutral-900 mb-6 dark:text-neutral-50">
                            Menu ({menu.length} items)
                        </h2>
                        {menu.length > 0 ? (
                            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                {menu.map((m: MealData) => (
                                    <MealItem key={m.id} meal={m} kitchenId={kitchen.id} kitchenName={kitchen.name} />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
                                <p className="text-neutral-500 dark:text-neutral-400">No menu items added yet.</p>
                            </div>
                        )}
                    </section>

                    {/* Reviews */}
                    <section className="mt-12 mb-12" id="reviews">
                        <h2 className="text-xl font-bold text-neutral-900 mb-6 dark:text-neutral-50">
                            Reviews ({reviewData.total})
                        </h2>
                        
                        {reviewData.total > 0 && (
                            <div className="mb-8 p-6 bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-100 dark:border-neutral-700">
                                <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
                                    <div className="flex flex-col items-center">
                                        <span className="text-5xl font-black text-neutral-900 dark:text-white">{Number(reviewStats.averageRating || 0).toFixed(1)}</span>
                                        <span className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">out of 5</span>
                                    </div>
                                    <div className="flex-1 w-full max-w-sm">
                                        <RatingBreakdown breakdown={reviewStats.breakdown} totalReviews={reviewStats.totalReviews} />
                                    </div>
                                </div>
                            </div>
                        )}

                        <ReviewList
                            reviews={reviewData.reviews as any[]}
                            emptyMessage="No reviews yet. Order from this kitchen and be the first to review!"
                        />

                        <WriteKitchenReviewAction kitchenId={kitchen.id} kitchenName={kitchen.name} />
                    </section>

                </div>

                {/* Right Column: Cart Panel (Client Component) */}
                <CartPanel />

            </div>
        </div>
    );
}

// ─── Page ───────────────────────────────────────────────────────────────────

function KitchenSkeleton() {
    return (
        <div className="animate-pulse-soft">
            <div className="h-64 rounded-2xl animate-shimmer" />
            <div className="mt-6 space-y-4">
                <div className="h-8 w-64 rounded-lg animate-shimmer" />
                <div className="h-4 w-48 rounded-lg animate-shimmer" />
                <div className="h-20 w-full rounded-lg animate-shimmer" />
            </div>
        </div>
    );
}

export default async function KitchenProfilePage({ params }: Props) {
    const { id } = await params;

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Breadcrumb */}
            <nav className="mb-6 text-sm text-neutral-500 dark:text-neutral-400">
                <Link href="/" className="hover:text-primary-600 transition-colors">Home</Link>
                <span className="mx-2">/</span>
                <Link href="/explore" className="hover:text-primary-600 transition-colors">Explore</Link>
                <span className="mx-2">/</span>
                <span className="text-neutral-900 font-medium dark:text-neutral-100">Kitchen</span>
            </nav>

            <Suspense fallback={<KitchenSkeleton />}>
                <KitchenContent id={id} />
            </Suspense>
        </div>
    );
}
