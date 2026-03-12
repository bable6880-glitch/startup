import { NextRequest } from "next/server";
import { cloudinary } from "@/lib/utils/cloudinary";
import {
    apiSuccess,
    apiBadRequest,
    apiUnauthorized,
    apiInternalError,
} from "@/lib/utils/api-response";
import { getAuthUser } from "@/lib/auth/get-auth-user";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg", "image/gif"];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function isValidImageSignature(bytes: Uint8Array): boolean {
    // JPEG: FF D8 FF
    if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return true;
    // PNG: 89 50 4E 47
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return true;
    // GIF: 47 49 46
    if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return true;
    // WebP: 52 49 46 46 ... 57 45 42 50
    if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
        bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return true;
    return false;
}

/**
 * POST /api/upload
 * Auth required: Upload an image to Cloudinary.
 * Accepts FormData with `file` (required) and `folder` (optional: meals|kitchens|avatars).
 * Returns { url, publicId }.
 */
export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser(request);
        if (!user) return apiUnauthorized();

        const formData = await request.formData();
        const file = formData.get("file") as File | null;
        const folder = (formData.get("folder") as string) || "meals";

        if (!file) {
            return apiBadRequest("No file provided");
        }

        // Validate type
        if (!ALLOWED_TYPES.includes(file.type)) {
            return apiBadRequest(
                `Invalid file type: ${file.type}. Allowed: JPEG, PNG, WebP, GIF`
            );
        }

        // Validate size
        if (file.size > MAX_SIZE) {
            return apiBadRequest(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB. Maximum: 5MB`);
        }

        // Convert file to buffer → base64 data URI for Cloudinary
        const bytes = await file.arrayBuffer();

        // Validate magic bytes (file signature) — prevents MIME spoofing
        const uint8Array = new Uint8Array(bytes);
        if (!isValidImageSignature(uint8Array)) {
            return apiBadRequest("File content does not match declared image type");
        }

        const buffer = Buffer.from(bytes);
        const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

        // Upload to Cloudinary (no transformation to avoid signature issues)
        const result = await cloudinary.uploader.upload(base64, {
            folder: `smart-tiffin/${folder}`,
            resource_type: "image",
        });

        return apiSuccess({
            url: result.secure_url,
            publicId: result.public_id,
        });
    } catch (error) {
        console.error("[Upload Error]", error);
        return apiInternalError("Failed to upload image");
    }
}
