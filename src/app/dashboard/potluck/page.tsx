"use client";

import { useState, useEffect } from "react";
import { PotluckCard } from "@/components/potluck/PotluckCard";
import { Button } from "@/components/ui/button";
import { Plus, Info } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function PotluckDashboardPage() {
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDeals();
        
        // Listen to SSE
        const evtSource = new EventSource("/api/potluck/sse");
        evtSource.onmessage = (event) => {
            if (event.data.startsWith(":")) return; // skip pings
            try {
                const data = JSON.parse(event.data);
                if (data.type === "ORDER_PLACED" || data.type === "DEAL_ACTIVATED" || data.type === "DEAL_EXPIRED") {
                    fetchDeals(); // Refresh when realtime updates happen
                }
            } catch (e) {}
        };
        
        return () => evtSource.close();
    }, []);

    const fetchDeals = async () => {
        try {
            const res = await fetch("/api/seller/potluck");
            const data = await res.json();
            if (data.success) {
                setDeals(data.deals);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container py-8 max-w-6xl mx-auto space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Community Potluck</h1>
                    <p className="text-muted-foreground mt-1">Manage your bulk deals and group orders.</p>
                </div>
                <Button>
                    <Plus className="w-4 h-4 mr-2" /> Create Deal
                </Button>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">Premium Feature</AlertTitle>
                <AlertDescription className="text-blue-700">
                    Community Potlucks allow you to sell in bulk to multiple customers. Depending on your plan, you have a limited number of Potluck deals you can create each month.
                </AlertDescription>
            </Alert>

            {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1,2,3].map(i => (
                        <div key={i} className="h-64 bg-muted rounded-xl" />
                    ))}
                </div>
            ) : deals.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deals.map(deal => (
                        <PotluckCard key={deal.id} deal={deal} isSellerView />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                    <h3 className="text-lg font-semibold">No active potlucks</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                        Create a potluck deal to let customers group together and buy your food in bulk at a discounted price.
                    </p>
                    <Button className="mt-6">Create your first deal</Button>
                </div>
            )}
        </div>
    );
}
