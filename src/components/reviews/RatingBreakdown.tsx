import React from 'react';

interface RatingBreakdownProps {
    breakdown: { [key: number]: number };
    totalReviews: number;
}

export default function RatingBreakdown({ breakdown, totalReviews }: RatingBreakdownProps) {
    return (
        <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
                const count = breakdown[star] || 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                
                let barColor = 'bg-gray-200';
                if (star >= 4) barColor = 'bg-green-500';
                else if (star === 3) barColor = 'bg-yellow-400';
                else barColor = 'bg-red-500';

                return (
                    <div key={star} className="flex items-center text-sm">
                        <span className="w-8 font-medium text-gray-700">{star}★</span>
                        <div className="w-full h-2 mx-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                                className={`h-full ${barColor} rounded-full transition-all duration-500 ease-out`} 
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <span className="w-24 text-right text-gray-500">
                            {count} {count === 1 ? 'review' : 'reviews'}
                        </span>
                    </div>
                );
            })}
        </div>
    );
}
