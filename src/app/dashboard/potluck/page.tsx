"use client";

import { useState, useEffect } from "react";
import { PotluckCard } from "@/components/potluck/PotluckCard";
import { Button } from "@/components/ui/button";
import { Plus, Info, X, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BackButton } from "@/components/ui/BackButton";
import { useAuth } from "@/lib/firebase/auth-context";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { cn } from "@/lib/utils";

export default function PotluckDashboardPage() {
    const { getIdToken } = useAuth();
    const { data: planData } = usePlanAccess();
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const potluckRemaining = planData?.usage.potluckRemaining ?? null;
    const potluckLimit = planData?.usage.potluckLimit ?? 0;
    const isOutOfUses = potluckRemaining !== null && potluckLimit > 0 && potluckRemaining === 0;
    const isUnlimited = potluckLimit === -1;
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        title: "",
        description: "",
        totalPlatesAvailable: "",
        targetOrderCount: "",
        pricePerPlateRs: "",
        regularPriceRs: "",
        expiresAt: "",
    });

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
            const token = await getIdToken();
            if (!token) return;
            const res = await fetch("/api/seller/potluck", {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) {
                setDeals(data.deals);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateDeal = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setFormError(null);
        
        try {
            const token = await getIdToken();
            const res = await fetch("/api/seller/potluck", {
                method: "POST",
                headers: { 
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    totalPlatesAvailable: Number(formData.totalPlatesAvailable),
                    targetOrderCount: Number(formData.targetOrderCount),
                    pricePerPlateRs: Number(formData.pricePerPlateRs),
                    regularPriceRs: Number(formData.regularPriceRs),
                    expiresAt: new Date(formData.expiresAt).toISOString(),
                })
            });
            
            const data = await res.json();
            
            if (res.ok && data.success) {
                setIsModalOpen(false);
                setFormData({
                    title: "", description: "", totalPlatesAvailable: "",
                    targetOrderCount: "", pricePerPlateRs: "", regularPriceRs: "", expiresAt: ""
                });
                fetchDeals();
            } else {
                setFormError(data.error || "Failed to create deal. Ensure you have Potluck uses remaining on your plan.");
            }
        } catch (err) {
            setFormError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="container py-8 max-w-6xl mx-auto space-y-6">
            <BackButton label="Dashboard" />
            <div className="flex justify-between items-start mt-2">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Community Potluck</h1>
                    <p className="text-muted-foreground mt-1">Manage your bulk deals and group orders.</p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                    <Button
                        onClick={() => setIsModalOpen(true)}
                        disabled={isOutOfUses}
                        className={cn(isOutOfUses && 'opacity-60 cursor-not-allowed')}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Create Deal
                    </Button>
                    {/* Usage pill */}
                    {potluckLimit > 0 && potluckRemaining !== null && (
                        <span className={cn(
                            'text-xs px-2.5 py-1 rounded-full font-medium',
                            isOutOfUses
                                ? 'bg-red-100 text-red-700'
                                : potluckRemaining <= 2
                                ? 'bg-amber-100 text-amber-700'
                                : 'bg-green-100 text-green-700'
                        )}>
                            {isOutOfUses ? '0 deals remaining' : `${potluckRemaining} deal${potluckRemaining !== 1 ? 's' : ''} remaining`}
                        </span>
                    )}
                    {isUnlimited && (
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                            ∞ Unlimited deals
                        </span>
                    )}
                </div>
            </div>

            {isOutOfUses && (
                <Alert className="bg-amber-50 border-amber-200">
                    <Info className="h-4 w-4 text-amber-600" />
                    <AlertTitle className="text-amber-800">No Potluck Uses Remaining</AlertTitle>
                    <AlertDescription className="text-amber-700">
                        You have used all your Group Deal slots for this period. Upgrade your plan to create more deals or wait for the next billing cycle.
                        <a href="/dashboard/subscription" className="ml-2 underline font-medium text-amber-800 hover:text-amber-900">Upgrade →</a>
                    </AlertDescription>
                </Alert>
            )}
            {!isOutOfUses && (
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Community Potluck</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        Sell in bulk to multiple customers. Set a target order count — when reached, the deal activates automatically for everyone.
                    </AlertDescription>
                </Alert>
            )}

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
                    <Button className="mt-6" onClick={() => setIsModalOpen(true)}>Create your first deal</Button>
                </div>
            )}

            {/* Create Deal Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-xl font-bold">Create Potluck Deal</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:bg-neutral-100 p-2 rounded-full dark:hover:bg-neutral-800">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 max-h-[70vh] overflow-y-auto">
                            {formError && (
                                <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400">
                                    {formError}
                                </div>
                            )}
                            <form id="potluckForm" onSubmit={handleCreateDeal} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Deal Title *</label>
                                    <input required type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g., Weekend Biryani Special" className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-primary-500/50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Describe the potluck meal..." rows={2} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-primary-500/50 resize-none" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Total Plates *</label>
                                        <input required type="number" min="1" value={formData.totalPlatesAvailable} onChange={e => setFormData({...formData, totalPlatesAvailable: e.target.value})} placeholder="e.g., 20" className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-primary-500/50" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-muted-foreground">Target Orders to Activate *</label>
                                        <input required type="number" min="1" value={formData.targetOrderCount} onChange={e => setFormData({...formData, targetOrderCount: e.target.value})} placeholder="e.g., 10" className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-primary-500/50" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Potluck Price (Rs) *</label>
                                        <input required type="number" min="1" value={formData.pricePerPlateRs} onChange={e => setFormData({...formData, pricePerPlateRs: e.target.value})} placeholder="e.g., 200" className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-primary-500/50" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-1 text-muted-foreground">Regular Price (Rs) *</label>
                                        <input required type="number" min="1" value={formData.regularPriceRs} onChange={e => setFormData({...formData, regularPriceRs: e.target.value})} placeholder="e.g., 300" className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-primary-500/50" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Expiry Date & Time *</label>
                                    <input required type="datetime-local" value={formData.expiresAt} onChange={e => setFormData({...formData, expiresAt: e.target.value})} className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-primary-500/50" />
                                </div>
                            </form>
                        </div>
                        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3 dark:bg-neutral-800 dark:border-neutral-800">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                            <Button form="potluckForm" type="submit" disabled={submitting}>
                                {submitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                                Create Potluck
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
