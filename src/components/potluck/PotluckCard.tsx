"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Users, Clock, Flame, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface PotluckCardProps {
    deal: any;
    onReserve?: (id: string, quantity: number) => Promise<void>;
    isSellerView?: boolean;
}

export function PotluckCard({ deal, onReserve, isSellerView }: PotluckCardProps) {
    const [quantity, setQuantity] = useState(1);
    const [loading, setLoading] = useState(false);

    const progress = Math.min(100, Math.round(((deal.currentOrderCount || 0) / deal.totalPlatesAvailable) * 100));
    const isExpired = new Date(deal.expiresAt) < new Date() || deal.status === 'EXPIRED';
    const isFilled = deal.status === 'FILLED' || (deal.currentOrderCount || 0) >= deal.totalPlatesAvailable;
    
    const canReserve = !isSellerView && deal.status === 'ACTIVE' && !isExpired && !isFilled;

    const handleReserve = async () => {
        if (!onReserve) return;
        setLoading(true);
        try {
            await onReserve(deal.id, quantity);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card className={`relative overflow-hidden transition-all ${isExpired ? 'opacity-70 grayscale-[0.5]' : 'hover:shadow-lg'}`}>
            {deal.status === 'ACTIVE' && progress > 80 && !isFilled && (
                <div className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center z-10">
                    <Flame className="w-3 h-3 mr-1" /> Selling Fast
                </div>
            )}
            {isFilled && (
                <div className="absolute top-0 right-0 bg-green-600 text-white text-xs font-bold px-3 py-1 rounded-bl-lg flex items-center z-10">
                    <CheckCircle className="w-3 h-3 mr-1" /> Sold Out
                </div>
            )}
            
            <CardHeader className="pb-3">
                <CardTitle className="text-xl line-clamp-1">{deal.title}</CardTitle>
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <Clock className="w-4 h-4" />
                    <span>
                        {isExpired ? 'Expired' : `Ends ${formatDistanceToNow(new Date(deal.expiresAt), { addSuffix: true })}`}
                    </span>
                </div>
            </CardHeader>
            
            <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4 h-10">
                    {deal.description || 'No description provided.'}
                </p>
                
                <div className="flex justify-between items-end mb-2">
                    <div>
                        <span className="text-2xl font-bold text-primary">Rs {deal.pricePerPlateRs}</span>
                        <span className="text-sm text-muted-foreground line-through ml-2">Rs {deal.regularPriceRs}</span>
                    </div>
                    <div className="text-right text-sm">
                        <span className="font-semibold">{deal.currentOrderCount || 0}</span>
                        <span className="text-muted-foreground"> / {deal.totalPlatesAvailable} plates</span>
                    </div>
                </div>
                
                <Progress value={progress} className="h-2 mb-2" />
                
                <div className="flex justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                        <Users className="w-3 h-3 mr-1" />
                        Target: {deal.targetOrderCount}
                    </div>
                    <div>
                        {deal.totalPlatesAvailable - (deal.currentOrderCount || 0)} left
                    </div>
                </div>
            </CardContent>
            
            <CardFooter className="bg-muted/30 pt-4 flex-col gap-3">
                {isSellerView ? (
                    <div className="w-full flex justify-between items-center text-sm">
                        <span className="font-semibold text-muted-foreground">Status:</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            deal.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                            deal.status === 'FILLED' ? 'bg-blue-100 text-blue-700' :
                            deal.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                        }`}>
                            {deal.status}
                        </span>
                    </div>
                ) : (
                    <div className="w-full flex items-center gap-2">
                        {canReserve ? (
                            <>
                                <select 
                                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                    value={quantity}
                                    onChange={(e) => setQuantity(Number(e.target.value))}
                                    disabled={loading}
                                >
                                    {[...Array(Math.min(10, deal.totalPlatesAvailable - (deal.currentOrderCount || 0)))].map((_, i) => (
                                        <option key={i+1} value={i+1}>{i+1}</option>
                                    ))}
                                </select>
                                <Button 
                                    className="flex-1" 
                                    onClick={handleReserve}
                                    disabled={loading}
                                >
                                    {loading ? 'Reserving...' : 'Reserve Now'}
                                </Button>
                            </>
                        ) : (
                            <Button className="w-full" variant="outline" disabled>
                                {isFilled ? 'Fully Booked' : isExpired ? 'Expired' : 'Not Available'}
                            </Button>
                        )}
                    </div>
                )}
            </CardFooter>
        </Card>
    );
}
