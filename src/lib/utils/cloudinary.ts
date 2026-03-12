import { v2 as cloudinary, type UploadApiOptions } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export type UploadFolder = "kitchens" | "meals" | "avatars";

/**
 * Generate a signed upload URL for client-side uploading to Cloudinary.
 */
export function getSignedUploadParams(folder: UploadFolder) {
    const timestamp = Math.round(Date.now() / 1000);
    const params: UploadApiOptions = {
        timestamp,
        folder: `smart-tiffin/${folder}`,
        allowed_formats: ["jpg", "jpeg", "png", "webp", "gif"],
        max_bytes: 5 * 1024 * 1024,
        transformation: [
            { width: 1200, height: 1200, crop: "limit", quality: "auto:good" },
        ],
    };

    const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder: params.folder },
        process.env.CLOUDINARY_API_SECRET!
    );

    return {
        signature,
        timestamp,
        cloudName: process.env.CLOUDINARY_CLOUD_NAME,
        apiKey: process.env.CLOUDINARY_API_KEY,
        folder: params.folder,
    };
}

/**
 * Delete an image from Cloudinary by its public ID.
 */
export async function deleteImage(publicId: string) {
    return cloudinary.uploader.destroy(publicId);
}

export { cloudinary };
