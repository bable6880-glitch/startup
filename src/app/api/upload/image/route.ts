import { NextRequest } from "next/server";
import { cloudinary } from "@/lib/utils/cloudinary";
import {
    apiSuccess,
    apiBadRequest,
    apiUnauthorized,
    apiInternalError,
} from "@/lib/utils/api-response";
import { getAuthUser } from "@/lib/auth/get-auth-user";
import crypto from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit for backend layer

// Security layer: Detect magic bytes manually
function isValidImageSignature(bytes: Uint8Array): boolean {
    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
    // PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
    // WebP: 52 49 46 46 ... 57 45 42 50
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true;
    return false;
}

/**
 * POST /api/upload/image
 * Auth required (COOK/ADMIN): Securely upload an image to Cloudinary.
 * Used exclusively for Avatar/Kitchen Background uploads.
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        // Strict Role Check - only Cooks or Admins upload images to profiles
        if (!user || (user.role !== "COOK" && user.role !== "ADMIN")) {
            return apiUnauthorized("Only authorized cooks can upload images");
        }

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const requestedFolder = formData.get("folder") as string;
        
        // Ensure folder mapping is strictly allowed to prevent directory traversal
        const folder = requestedFolder === "avatars" ? "avatars" : "kitchens";

        if (!file) {
            return apiBadRequest("Missing image file payload");
        }

        // Validate MIME type mapped by the browser
        if (!ALLOWED_TYPES.includes(file.type)) {
            return apiBadRequest("Forbidden MIME type. Please securely use JPEG, PNG, or WEBP.");
        }

        // Hard Backend File Size Ceiling
        if (file.size > MAX_SIZE) {
            return apiBadRequest(`Bypassed compression constraint: Image ${file.size} bytes strictly exceeds 5MB ceiling.`);
        }

        const bytes = await file.arrayBuffer();
        const uint8Array = new Uint8Array(bytes);

        // Security Validation against Magic Bytes - blocks MIME spoofing
        if (!isValidImageSignature(uint8Array)) {
            return apiBadRequest("Invalid image signature. Malicious file content detected.");
        }

        const buffer = Buffer.from(bytes);
        const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

        // Cryptographically random strings ensure ZERO path-injection capabilities
        const safePublicId = crypto.randomUUID();

        // Pass direct Base64 buffer map straight to unified CDN pipeline
        const result = await cloudinary.uploader.upload(base64, {
            folder: `smart-tiffin/${folder}`,
            resource_type: "image",
            public_id: safePublicId, // Discards original filename directly
            use_filename: false,
            unique_filename: true,
            format: "webp" // Auto WebP force mapping on backend
        });

        // End Response
        return apiSuccess({
            url: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes
        });

    } catch (error) {
        console.error("Critical Upload Pipeline Breakdown:", error);
        return apiInternalError("Protected storage pipeline error");
    }
}
