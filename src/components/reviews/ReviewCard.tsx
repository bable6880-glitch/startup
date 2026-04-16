import StarRating from "./StarRating";
import { formatDistanceToNow } from "date-fns";
import { BadgeCheck, Flag, Reply } from "lucide-react";
import Image from "next/image";

interface ReviewCardProps {
    review: {
        id: string;
        rating: number;
        comment: string | null;
        createdAt: string;
        isVerifiedPurchase: boolean;
        sellerReply: string | null;
        user: {
            name: string | null;
            avatarUrl: string | null;
        };
    };
    onReply?: (reviewId: string) => void;
}

export default function ReviewCard({ review, onReply }: ReviewCardProps) {
    const initials = review.user.name ? review.user.name.substring(0, 2).toUpperCase() : 'U';

    return (
        <div className="p-4 border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow bg-white space-y-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    {review.user.avatarUrl ? (
                        <Image src={review.user.avatarUrl} alt="Avatar" width={40} height={40} className="rounded-full object-cover" />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-orange-700 font-bold border border-orange-300">
                            {initials}
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-gray-900">{review.user.name || 'Anonymous User'}</span>
                            {review.isVerifiedPurchase && (
                                <span className="flex items-center text-green-700 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 bg-green-50 border border-green-200 rounded-full" title="Verified Order">
                                    <BadgeCheck className="w-3 h-3 mr-1" strokeWidth={3} />
                                    Verified
                                </span>
                            )}
                        </div>
                        <span className="text-xs text-gray-500">
                            {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                        </span>
                    </div>
                </div>
                <button className="text-gray-300 hover:text-gray-500 transition-colors p-1" title="Report Review">
                    <Flag className="w-4 h-4" />
                </button>
            </div>
            
            <StarRating value={review.rating} size="sm" />
            
            {review.comment && (
                <p className="text-gray-700 text-sm leading-relaxed">{review.comment}</p>
            )}

            {review.sellerReply && (
                <div className="ml-6 mt-3 p-3 bg-orange-50 bg-opacity-50 border-l-2 border-orange-400 rounded-r-lg text-sm relative">
                    <p className="font-bold text-orange-900 mb-1 flex items-center gap-1">
                        <Reply className="w-3 h-3" /> Cook's response:
                    </p>
                    <p className="text-orange-800 leading-relaxed">{review.sellerReply}</p>
                </div>
            )}
            
            {onReply && !review.sellerReply && (
                <div className="pt-2">
                    <button 
                        onClick={() => onReply(review.id)}
                        className="text-sm font-medium px-3 py-1.5 rounded-md text-orange-600 bg-orange-50 hover:bg-orange-100 hover:text-orange-700 flex items-center transition-colors"
                    >
                        <Reply className="w-4 h-4 mr-1.5" /> Reply to customer
                    </button>
                </div>
            )}
        </div>
    );
}
