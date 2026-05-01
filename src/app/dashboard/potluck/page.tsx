"use client";

import { useState, useEffect, useRef } from "react";
import { PotluckCard } from "@/components/potluck/PotluckCard";
import { Button } from "@/components/ui/button";
import { Plus, Info, X, Loader2, Image as ImageIcon, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { BackButton } from "@/components/ui/BackButton";
import { useAuth } from "@/lib/firebase/auth-context";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { cn } from "@/lib/utils";

// ─── Image Compression ─────────────────────────────────────────────────────

async function compressImage(file: File, maxSizeKB = 2000): Promise<File> {
    return new Promise((resolve) => {
        const canvas = document.createElement("canvas");
        const img = new Image();
        const url = URL.createObjectURL(file);

        img.onload = () => {
            // Scale down if necessary
            let { width, height } = img;
            const MAX_DIM = 1200;
            if (width > MAX_DIM || height > MAX_DIM) {
                const ratio = Math.min(MAX_DIM / width, MAX_DIM / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d")!;
            ctx.drawImage(img, 0, 0, width, height);

            // Try quality 0.8 first, drop to 0.6 if still too large
            let quality = 0.8;
            const tryBlob = (q: number) => {
                canvas.toBlob(
                    (blob) => {
                        if (!blob) { resolve(file); return; }
                        if (blob.size > maxSizeKB * 1024 && q > 0.4) {
                            tryBlob(q - 0.2);
                        } else {
                            resolve(new File([blob], file.name, { type: "image/webp" }));
                        }
                    },
                    "image/webp",
                    q
                );
            };
            tryBlob(quality);
            URL.revokeObjectURL(url);
        };
        img.onerror = () => resolve(file);
        img.src = url;
    });
}

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

    // Image state — 1 required + 2 optional
    const [images, setImages] = useState<{ file: File | null; preview: string }[]>([]);
    const [imageUploading, setImageUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

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

        const evtSource = new EventSource("/api/potluck/sse");
        evtSource.onmessage = (event) => {
            if (event.data.startsWith(":")) return;
            try {
                const data = JSON.parse(event.data);
                if (data.type === "ORDER_PLACED" || data.type === "DEAL_ACTIVATED" || data.type === "DEAL_EXPIRED") {
                    fetchDeals();
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

    // ── Image Upload Handling ────────────────────────────────────────────────

    const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
            setFormError("Only JPG, PNG, or WebP images are allowed.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setFormError("Image must be under 5MB before compression.");
            return;
        }
        if (images.length >= 3) {
            setFormError("Maximum 3 images allowed.");
            return;
        }

        setFormError(null);
        const preview = URL.createObjectURL(file);
        setImages(prev => [...prev, { file, preview }]);

        // Reset file input so same file can be re-selected
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const removeImage = (idx: number) => {
        setImages(prev => {
            const next = [...prev];
            if (next[idx].preview) URL.revokeObjectURL(next[idx].preview);
            next.splice(idx, 1);
            return next;
        });
    };

    const uploadImages = async (token: string): Promise<string[]> => {
        const urls: string[] = [];
        for (const img of images) {
            if (!img.file) continue;
            // Compress to max 2MB
            const compressed = await compressImage(img.file, 1800);
            const fd = new FormData();
            fd.append("file", compressed);
            fd.append("folder", "potluck");
            const res = await fetch("/api/upload", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (res.ok) {
                const { data } = await res.json();
                urls.push(data.url);
            }
        }
        return urls;
    };

    // ── Form Submit ──────────────────────────────────────────────────────────

    const handleCreateDeal = async (e: React.FormEvent) => {
        e.preventDefault();

        if (images.length === 0) {
            setFormError("Please add at least one meal image.");
            return;
        }

        setSubmitting(true);
        setFormError(null);

        try {
            const token = await getIdToken();
            if (!token) throw new Error("Not authenticated");

            // Upload images first
            setImageUploading(true);
            const uploadedUrls = await uploadImages(token);
            setImageUploading(false);

            if (uploadedUrls.length === 0) {
                setFormError("Image upload failed. Please try again.");
                setSubmitting(false);
                return;
            }

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
                    imageUrl: uploadedUrls[0],   // primary image
                    images: uploadedUrls,         // all images
                })
            });

            const data = await res.json();

            if (res.ok && data.success) {
                setIsModalOpen(false);
                setFormData({ title: "", description: "", totalPlatesAvailable: "", targetOrderCount: "", pricePerPlateRs: "", regularPriceRs: "", expiresAt: "" });
                setImages([]);
                fetchDeals();
            } else {
                // Richer error messages
                if (res.status === 403) {
                    setFormError(
                        data.error?.includes("exhaust") || data.error?.includes("uses")
                            ? "You've used all your Group Deal slots for this period. Upgrade your plan for more."
                            : data.error?.includes("subscription") || data.error?.includes("feature")
                            ? "This feature requires an active paid plan with Potluck access."
                            : data.error || "Access denied. Please check your subscription."
                    );
                } else {
                    setFormError(data.error || "Failed to create deal. Please try again.");
                }
            }
        } catch (err) {
            setFormError("Network error. Please try again.");
        } finally {
            setSubmitting(false);
            setImageUploading(false);
        }
    };

    const openModal = () => {
        setFormData({ title: "", description: "", totalPlatesAvailable: "", targetOrderCount: "", pricePerPlateRs: "", regularPriceRs: "", expiresAt: "" });
        setImages([]);
        setFormError(null);
        setIsModalOpen(true);
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
                        onClick={openModal}
                        disabled={isOutOfUses}
                        className={cn(isOutOfUses && "opacity-60 cursor-not-allowed")}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Create Deal
                    </Button>
                    {potluckLimit > 0 && potluckRemaining !== null && (
                        <span className={cn(
                            "text-xs px-2.5 py-1 rounded-full font-medium",
                            isOutOfUses ? "bg-red-100 text-red-700" :
                            potluckRemaining <= 2 ? "bg-amber-100 text-amber-700" :
                            "bg-green-100 text-green-700"
                        )}>
                            {isOutOfUses ? "0 deals remaining" : `${potluckRemaining} deal${potluckRemaining !== 1 ? "s" : ""} remaining`}
                        </span>
                    )}
                    {isUnlimited && (
                        <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-purple-100 text-purple-700">
                            ∞ Unlimited
                        </span>
                    )}
                </div>
            </div>

            {isOutOfUses ? (
                <div className="relative overflow-hidden rounded-2xl border border-amber-200 bg-amber-50 p-6 flex items-start gap-4">
                    <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <p className="font-semibold text-amber-900">No Potluck uses remaining</p>
                        <p className="text-sm text-amber-700 mt-1">You've used all your Group Deal slots for this billing period. Upgrade for more or wait for renewal.</p>
                        <a href="/dashboard/subscription" className="inline-flex items-center mt-3 text-xs font-bold text-white bg-gradient-to-r from-orange-500 to-amber-600 px-4 py-2 rounded-lg hover:shadow-md transition-all">
                            Upgrade Plan →
                        </a>
                    </div>
                </div>
            ) : (
                <Alert className="bg-blue-50 border-blue-200">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertTitle className="text-blue-800">Community Potluck</AlertTitle>
                    <AlertDescription className="text-blue-700">
                        Set a target order count — when reached, the deal activates automatically for all participants.
                    </AlertDescription>
                </Alert>
            )}

            {loading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
                    {[1, 2, 3].map(i => <div key={i} className="h-64 bg-muted rounded-xl" />)}
                </div>
            ) : deals.length > 0 ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {deals.map(deal => (
                        <PotluckCard key={deal.id} deal={deal} isSellerView />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed">
                    <span className="text-4xl block mb-4">🫕</span>
                    <h3 className="text-lg font-semibold">No active potlucks</h3>
                    <p className="text-muted-foreground mt-2 max-w-sm mx-auto text-sm">
                        Create a potluck deal to sell in bulk at a group discount price.
                    </p>
                    <Button className="mt-6" onClick={openModal} disabled={isOutOfUses}>Create your first deal</Button>
                </div>
            )}

            {/* ── Create Deal Modal ──────────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 flex flex-col max-h-[92vh]">
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800 flex-shrink-0">
                            <div>
                                <h2 className="text-xl font-bold">Create Potluck Deal</h2>
                                <p className="text-xs text-gray-400 mt-0.5">Add a meal image and set pricing details</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:bg-neutral-100 p-2 rounded-full dark:hover:bg-neutral-800">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1">

                            {/* ── Error Banner ── */}
                            {formError && (
                                <div className="mb-5 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400">
                                    <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    <div>
                                        <p className="font-semibold mb-0.5">Cannot create deal</p>
                                        <p>{formError}</p>
                                        {formError.includes("plan") && (
                                            <a href="/dashboard/subscription" className="underline font-medium mt-1 inline-block">View Plans →</a>
                                        )}
                                    </div>
                                </div>
                            )}

                            <form id="potluckForm" onSubmit={handleCreateDeal} className="space-y-5">

                                {/* ── Image Upload ── */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-1">
                                        Meal Images <span className="text-red-500">*</span>
                                        <span className="text-gray-400 font-normal ml-1">(1 required, up to 3 · max 2MB each)</span>
                                    </label>
                                    <div className="flex gap-3 mt-2 flex-wrap">
                                        {images.map((img, i) => (
                                            <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-neutral-200 shadow-sm group flex-shrink-0">
                                                <img src={img.preview} alt={`preview-${i}`} className="w-full h-full object-cover" />
                                                {i === 0 && (
                                                    <div className="absolute top-1 left-1 bg-orange-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                                                        Main
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(i)}
                                                    className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <Trash2 className="w-5 h-5 text-white" />
                                                </button>
                                            </div>
                                        ))}
                                        {images.length < 3 && (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="w-24 h-24 rounded-xl border-2 border-dashed border-neutral-300 hover:border-orange-400 hover:bg-orange-50/50 flex flex-col items-center justify-center text-neutral-400 hover:text-orange-500 transition-colors flex-shrink-0"
                                            >
                                                <ImageIcon className="w-5 h-5 mb-1" />
                                                <span className="text-[10px] font-bold uppercase tracking-wide">
                                                    {images.length === 0 ? "Add Photo" : "Add More"}
                                                </span>
                                            </button>
                                        )}
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        className="hidden"
                                        onChange={handleImageSelect}
                                    />
                                    <p className="text-xs text-gray-400 mt-2">Images are auto-compressed to under 2MB before upload.</p>
                                </div>

                                {/* Title */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-1">Deal Title <span className="text-red-500">*</span></label>
                                    <input required type="text" value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="e.g., Weekend Biryani Special"
                                        className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-1">Description</label>
                                    <textarea value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe the meal, serving size, ingredients..."
                                        rows={2}
                                        className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 resize-none" />
                                </div>

                                {/* Plates + Target */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-1">Total Plates <span className="text-red-500">*</span></label>
                                        <input required type="number" min="1" value={formData.totalPlatesAvailable}
                                            onChange={e => setFormData({ ...formData, totalPlatesAvailable: e.target.value })}
                                            placeholder="e.g., 20"
                                            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                                            <span className="text-muted-foreground">Target Orders to Activate</span> <span className="text-red-500">*</span>
                                        </label>
                                        <input required type="number" min="1" value={formData.targetOrderCount}
                                            onChange={e => setFormData({ ...formData, targetOrderCount: e.target.value })}
                                            placeholder="e.g., 10"
                                            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                                    </div>
                                </div>

                                {/* Prices */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-1">Potluck Price (Rs) <span className="text-red-500">*</span></label>
                                        <input required type="number" min="1" value={formData.pricePerPlateRs}
                                            onChange={e => setFormData({ ...formData, pricePerPlateRs: e.target.value })}
                                            placeholder="e.g., 200"
                                            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-800 mb-1">Regular Price (Rs) <span className="text-red-500">*</span></label>
                                        <input required type="number" min="1" value={formData.regularPriceRs}
                                            onChange={e => setFormData({ ...formData, regularPriceRs: e.target.value })}
                                            placeholder="e.g., 300"
                                            className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                                    </div>
                                </div>

                                {/* Expiry */}
                                <div>
                                    <label className="block text-sm font-semibold text-gray-800 mb-1">Expiry Date & Time <span className="text-red-500">*</span></label>
                                    <input required type="datetime-local" value={formData.expiresAt}
                                        onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                        className="w-full rounded-xl border border-neutral-300 px-4 py-2.5 text-sm dark:bg-neutral-800 dark:border-neutral-700 outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500" />
                                </div>
                            </form>
                        </div>

                        <div className="p-4 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3 dark:bg-neutral-800 dark:border-neutral-800 flex-shrink-0">
                            <Button variant="outline" onClick={() => setIsModalOpen(false)} disabled={submitting}>Cancel</Button>
                            <Button form="potluckForm" type="submit" disabled={submitting || imageUploading}>
                                {(submitting || imageUploading) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                {imageUploading ? "Uploading..." : submitting ? "Creating..." : "Create Potluck"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
