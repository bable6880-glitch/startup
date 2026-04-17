import React from 'react';
import Image from 'next/image';
import { Camera, Trash2, Edit2 } from 'lucide-react';

interface ImagePreviewProps {
    imageUrl: string;
    type: 'avatar' | 'cover';
    onRemove?: () => void;
    onChangeClick?: () => void;
    isUploading?: boolean;
}

export function ImagePreview({ imageUrl, type, onRemove, onChangeClick, isUploading = false }: ImagePreviewProps) {
    const isAvatar = type === 'avatar';
    
    // Style configurations based on the image type
    const containerClasses = isAvatar 
        ? "relative w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden border-4 border-white dark:border-neutral-800 shadow-lg mx-auto group"
        : "relative w-full aspect-video md:aspect-[21/9] rounded-2xl overflow-hidden shadow-md group";

    return (
        <div className={containerClasses}>
            {/* The Image */}
            <Image
                src={imageUrl}
                alt={`${type} preview`}
                fill
                className={`object-cover transition-transform duration-500 ${!isUploading ? 'group-hover:scale-105' : ''} ${isUploading ? 'opacity-50 blur-sm' : 'opacity-100'}`}
                unoptimized // Incase cloud URL needs raw passthrough
            />

            {/* Uploading Overlay */}
            {isUploading && (
                <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mb-2" />
                    <span className="text-white text-xs font-semibold">Uploading...</span>
                </div>
            )}

            {/* Hover Actions (only show if not currently uploading and actionable) */}
            {!isUploading && (onChangeClick || onRemove) && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100 gap-3">
                    {onChangeClick && (
                        <button
                            type="button"
                            onClick={onChangeClick}
                            className="bg-white/20 hover:bg-white/40 p-2 rounded-full text-white backdrop-blur-sm transition-all hover:scale-110"
                            title="Change Image"
                        >
                            <Edit2 size={18} />
                        </button>
                    )}
                    {onRemove && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="bg-red-500/80 hover:bg-red-600 p-2 rounded-full text-white backdrop-blur-sm transition-all hover:scale-110"
                            title="Remove Image"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
            )}

            {/* Fallback Icon if URL drops */}
            {!imageUrl && !isUploading && (
                <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
                    <Camera className="w-8 h-8 text-gray-400" />
                </div>
            )}
        </div>
    );
}
