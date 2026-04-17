// ─── App-wide Constants ─────────────────────────────────────────────────────

export const APP_NAME = "Smart Tiffin";
export const APP_DESCRIPTION = "Discover home-cooked food from kitchens near you";

// ─── Pagination ─────────────────────────────────────────────────────────────
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 50;

// ─── Rate Limits ────────────────────────────────────────────────────────────
export const RATE_LIMITS = {
    PUBLIC: { requests: 60, window: "1m" as const },
    AUTH: { requests: 10, window: "1m" as const },
    WRITE: { requests: 20, window: "1m" as const },
    UPLOAD: { requests: 10, window: "5m" as const },
} as const;

// ─── Roles ──────────────────────────────────────────────────────────────────
export const ROLES = {
    CUSTOMER: "CUSTOMER",
    COOK: "COOK",
    ADMIN: "ADMIN",
} as const;

// ─── Request Size Limits ────────────────────────────────────────────────────
export const MAX_BODY_SIZE = 1_048_576; // 1MB

// ─── Slugify Helper ─────────────────────────────────────────────────────────
export function slugify(text: string): string {
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-")
        .replace(/^-+/, "")
        .replace(/-+$/, "");
}

// ─── Sanitize String ────────────────────────────────────────────────────────
export function sanitizeString(str: string): string {
    return str
        .replace(/<[^>]*>/g, "") // strip HTML tags
        .replace(/&[^;]+;/g, "") // strip HTML entities
        .trim();
}

// ─── Cities Data ────────────────────────────────────────────────────────────
export const PAKISTAN_CITIES = [
  { name: 'All Cities', slug: 'all', lat: null, lng: null },
  { name: 'Islamabad', slug: 'islamabad', lat: 33.6844, lng: 73.0479 },
  { name: 'Rawalpindi', slug: 'rawalpindi', lat: 33.5651, lng: 73.0169 },
  { name: 'Lahore', slug: 'lahore', lat: 31.5204, lng: 74.3587 },
  { name: 'Karachi', slug: 'karachi', lat: 24.8607, lng: 67.0011 },
  { name: 'Peshawar', slug: 'peshawar', lat: 34.0151, lng: 71.5249 },
  { name: 'Quetta', slug: 'quetta', lat: 30.1798, lng: 66.9750 },
  { name: 'Faisalabad', slug: 'faisalabad', lat: 31.4504, lng: 73.1350 },
  { name: 'Multan', slug: 'multan', lat: 30.1575, lng: 71.5249 },
  { name: 'Sialkot', slug: 'sialkot', lat: 32.4927, lng: 74.5317 },
  { name: 'Gujranwala', slug: 'gujranwala', lat: 32.1877, lng: 74.1945 },
];
