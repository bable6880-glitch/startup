'use client'

import React, { useCallback, useState, useRef } from 'react';
import imageCompression from 'browser-image-compression';
import { UploadCloud, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/firebase/auth-context';
import { ImagePreview } from './ImagePreview';
import { UploadProgressBar } from './UploadProgressBar';

export type ImageType = 'avatar' | 'cover';

interface ImageUploaderProps {
    type: ImageType;
    currentImageUrl?: string | null;
    onUploadSuccess: (url: string) => void;
    onError?: (error: string) => void;
}

export function ImageUploader({ type, currentImageUrl, onUploadSuccess, onError }: ImageUploaderProps) {
    const { getIdToken } = useAuth();
    const [isCompressing, setIsCompressing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [dragActive, setDragActive] = useState(false);
    const [localError, setLocalError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    // Validate if the file is an accepted image and under the absolute pre-compression max (10MB)
    const validateFile = (file: File): string | null => {
        const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg'];
        if (!validTypes.includes(file.type)) {
            return `Invalid file type. Please upload a JPEG, PNG, WEBP, or GIF.`;
        }
        if (file.size > 10 * 1024 * 1024) {
            return `File is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max 10MB allowed before compression.`;
        }
        return null;
    };

    const processAndUpload = async (file: File) => {
        setLocalError('');
        const vError = validateFile(file);
        if (vError) {
            setLocalError(vError);
            if (onError) onError(vError);
            return;
        }

        try {
            setIsCompressing(true);
            setProgress(10); // Initial start
            
            // Compression Options
            const options = {
                maxSizeMB: 2, // Strict 2MB ceiling
                maxWidthOrHeight: type === 'avatar' ? 512 : 1280, // Smart downscale
                useWebWorker: true, // Offload thread
                fileType: 'image/webp', // Preferred web format
                initialQuality: 0.8,
            };

            const compressedBlob = await imageCompression(file, options);
            
            // Reconstruct the compressed blob back into a File object for the FormData payload
            const compressedFile = new File([compressedBlob], file.name.replace(/\.[^/.]+$/, ".webp"), {
                type: compressedBlob.type,
                lastModified: Date.now(),
            });

            setIsCompressing(false);
            setIsUploading(true);
            setProgress(40);

            // Fetch secure session token
            const token = await getIdToken();
            if (!token) throw new Error("Authentication required to upload images");

            // Build payload
            const formData = new FormData();
            formData.append('file', compressedFile);
            formData.append('folder', type === 'avatar' ? 'avatars' : 'kitchens'); // Subfolder tagging

            setProgress(60);

            // Send standard POST fetch (since we don't have XHR progress easily, we simulate steps)
            const response = await fetch('/api/upload/image', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            setProgress(90);

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Server rejected upload');
            }

            setProgress(100);
            onUploadSuccess(result.data.url);
            
            // Small delay to let user see 100%
            setTimeout(() => {
                setIsUploading(false);
                setProgress(0);
            }, 600);

        } catch (error: any) {
            console.error("Upload process failed:", error);
            setIsCompressing(false);
            setIsUploading(false);
            setProgress(0);
            setLocalError(error.message || "Failed to process image");
            if (onError) onError(error.message || "Failed to process image");
        }
    };

    // --- DRAG & DROP HANDLERS ---
    const handleDrag = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave") {
            setDragActive(false);
        }
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            processAndUpload(e.dataTransfer.files[0]);
        }
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            processAndUpload(e.target.files[0]);
        }
    };

    const isProcessing = isCompressing || isUploading;

    return (
        <div className="w-full">
            {/* Display active preview if we aren't compressing drastically or already possess an image */}
            {currentImageUrl && (
                <div className="mb-6">
                    <ImagePreview 
                        imageUrl={currentImageUrl} 
                        type={type} 
                        isUploading={isProcessing}
                        onChangeClick={() => inputRef.current?.click()}
                    />
                </div>
            )}

            {/* Upload Area (Hide Dropzone if image exists, though allow fallback to replace!) */}
            {!currentImageUrl && (
                <div
                    className={`relative w-full rounded-2xl border-2 border-dashed p-8 transition-colors text-center cursor-pointer 
                        ${dragActive ? 'border-orange-500 bg-orange-50/50' : 'border-gray-300 hover:border-orange-400 hover:bg-gray-50'}
                        ${isProcessing ? 'pointer-events-none opacity-60' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current?.click()}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/jpeg, image/png, image/webp, image/jpg"
                        onChange={handleChange}
                        className="hidden"
                    />

                    <div className="flex flex-col items-center gap-3">
                        <div className={`p-4 rounded-full ${dragActive ? 'bg-orange-100' : 'bg-gray-100'}`}>
                            <UploadCloud className={`w-8 h-8 ${dragActive ? 'text-orange-600' : 'text-gray-500'}`} />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-800">
                                Click to upload <span className="font-normal text-gray-500">or drag and drop</span>
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                JPG, PNG, WEBP (max 10MB)
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Error Message */}
            {localError && (
                <div className="mt-3 flex items-start gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                    <p>{localError}</p>
                </div>
            )}

            {/* Progress Bar Container */}
            {isProcessing && (
                <div className="mt-4">
                    <UploadProgressBar 
                        progress={progress} 
                        statusText={isCompressing ? "Compressing & Optimizing..." : "Uploading to Secure Storage..."} 
                    />
                </div>
            )}
        </div>
    );
}
