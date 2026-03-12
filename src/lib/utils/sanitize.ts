import DOMPurify from "isomorphic-dompurify";

// Strip ALL HTML — for plain text fields
export function sanitizeText(input: string): string {
    if (!input) return "";
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: [],    // No HTML allowed
        ALLOWED_ATTR: [],
    }).trim();
}

// Allow basic formatting — for descriptions (bold, italic, lists only)
export function sanitizeRichText(input: string): string {
    if (!input) return "";
    return DOMPurify.sanitize(input, {
        ALLOWED_TAGS: ["b", "i", "em", "strong", "ul", "ol", "li", "br", "p"],
        ALLOWED_ATTR: [], // No attributes (blocks onclick, href, etc.)
    }).trim();
}

// Sanitize an object's string fields recursively (useful for request bodies)
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const result = { ...obj };
    for (const key in result) {
        if (typeof result[key] === "string") {
            result[key] = sanitizeText(result[key] as string) as any;
        }
    }
    return result;
}
