"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMealSchema, type CreateMealInput } from "@/lib/validations/menu";

type Meal = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: string;
    isAvailable: boolean;
    availabilityStatus?: "AVAILABLE" | "OUT_OF_STOCK" | "NOT_TODAY" | "PREPARING";
    imageUrl: string | null;
    images: string[] | null;
    dietaryTags: string[] | null;
};

export default function MenuPage() {
    const { user, loading: authLoading, getIdToken } = useAuth();
    const router = useRouter();
    const [meals, setMeals] = useState<Meal[]>([]);
    const [kitchenId, setKitchenId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const {
        register, handleSubmit, reset, setValue, formState: { errors },
    } = useForm<CreateMealInput>({
        resolver: zodResolver(createMealSchema) as never,
        defaultValues: { isAvailable: true, dietaryTags: [] },
    });

    const loadMenu = useCallback(async () => {
        try {
            const token = await getIdToken();
            if (!token) return;
            const kitchenRes = await fetch("/api/kitchens?ownerId=me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (kitchenRes.ok) {
                const d = await kitchenRes.json();
                const k = (d.data || [])[0];
                if (k) {
                    setKitchenId(k.id);
                    const menuRes = await fetch(`/api/kitchens/${k.id}/menu`);
                    if (menuRes.ok) {
                        const m = await menuRes.json();
                        setMeals(m.data || []);
                    }
                }
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [getIdToken]);

    useEffect(() => {
        if (!authLoading && !user) { router.push("/login?redirect=/dashboard/menu"); return; }
        if (user) loadMenu();
    }, [user, authLoading, router, loadMenu]);

    // ── Image Upload Handler ──
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate on client-side too
        if (!['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(file.type)) {
            setError("Invalid file type. Only JPG, PNG, WebP allowed.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Image too large. Maximum 5MB.");
            return;
        }

        // Preview
        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        // Upload to Cloudinary via API
        setUploading(true);
        setError(null);
        try {
            const token = await getIdToken();
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", "meals");

            const res = await fetch("/api/upload", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (res.ok) {
                const { data } = await res.json();
                setValue("imageUrl", data.url);
            } else {
                const err = await res.json();
                setError(err.error?.message || "Image upload failed. Please try again.");
                setImagePreview(null);
            }
        } catch {
            setError("Image upload failed. Please try again.");
            setImagePreview(null);
        } finally {
            setUploading(false);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setValue("imageUrl", undefined);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const onSubmit = async (data: CreateMealInput) => {
        if (!kitchenId) return;
        setSubmitting(true);
        setError(null);
        try {
            const token = await getIdToken();
            const res = await fetch(`/api/kitchens/${kitchenId}/menu`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message || "Failed to add meal"); }
            const { data: newMeal } = await res.json();
            setMeals((prev) => [newMeal, ...prev]);
            setShowForm(false);
            setImagePreview(null);
            reset();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Error");
        } finally { setSubmitting(false); }
    };

    const updateAvailabilityStatus = async (meal: Meal, status: "AVAILABLE" | "OUT_OF_STOCK" | "NOT_TODAY" | "PREPARING") => {
        if (!kitchenId) return;
        const token = await getIdToken();
        const res = await fetch(`/api/kitchens/${kitchenId}/menu/${meal.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ availabilityStatus: status }),
        });
        if (res.ok) {
            setMeals((prev) => prev.map((m) => m.id === meal.id ? { 
                ...m, 
                availabilityStatus: status,
                isAvailable: status === "AVAILABLE"
            } : m));
        }
    };

    const deleteMeal = async (mealId: string) => {
        if (!kitchenId || !confirm("Delete this meal?")) return;
        const token = await getIdToken();
        const res = await fetch(`/api/kitchens/${kitchenId}/menu/${mealId}`, {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setMeals((prev) => prev.filter((m) => m.id !== mealId));
    };

    if (authLoading || loading) {
        return (
            <div className="mx-auto max-w-4xl px-4 py-8">
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => <div key={i} className="h-20 rounded-xl animate-shimmer" />)}
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <a href="/dashboard" className="text-sm text-neutral-500 hover:text-primary-600 dark:text-neutral-400">← Dashboard</a>
                    <h1 className="text-2xl font-bold text-neutral-900 mt-1 dark:text-neutral-50">Menu Management</h1>
                </div>
                <button
                    onClick={() => { setShowForm(!showForm); setImagePreview(null); setError(null); }}
                    className="rounded-xl bg-primary-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-600 transition-all active:scale-95"
                >
                    {showForm ? "Cancel" : "+ Add Meal"}
                </button>
            </div>

            {/* Add Meal Form */}
            {showForm && (
                <div className="mb-8 rounded-2xl border border-neutral-200/60 bg-white p-6 shadow-sm animate-slide-up dark:bg-neutral-800 dark:border-neutral-700">
                    <h2 className="text-lg font-semibold text-neutral-900 mb-4 dark:text-neutral-100">Add New Meal</h2>
                    {error && <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-900/30 dark:text-red-300">{error}</div>}
                    <form onSubmit={handleSubmit(onSubmit as never)} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        {/* Image Upload */}
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-neutral-700 mb-2 dark:text-neutral-300">Meal Image</label>
                            <div className="flex items-center gap-4">
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="relative flex-shrink-0 w-28 h-28 rounded-xl border-2 border-dashed border-neutral-300 hover:border-primary-400 transition-colors overflow-hidden bg-neutral-50 dark:bg-neutral-700 dark:border-neutral-600 group"
                                >
                                    {imagePreview ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-neutral-400 group-hover:text-primary-500">
                                            <span className="text-2xl mb-1">📷</span>
                                            <span className="text-xs">Upload</span>
                                        </div>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                                            <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                                        </div>
                                    )}
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleImageUpload}
                                    className="hidden"
                                />
                                {imagePreview && !uploading && (
                                    <button
                                        type="button"
                                        onClick={removeImage}
                                        className="text-xs text-red-500 hover:text-red-700 font-medium"
                                    >
                                        Remove
                                    </button>
                                )}
                                {!imagePreview && (
                                    <p className="text-xs text-neutral-400 dark:text-neutral-500">
                                        JPG, PNG, or WebP · Max 5MB
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-300">Name *</label>
                            <input {...register("name")} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200" />
                            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-300">Description</label>
                            <textarea {...register("description")} rows={2} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-300">Price (Rs.) *</label>
                            <input type="number" {...register("price", { valueAsNumber: true })} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200" />
                            {errors.price && <p className="mt-1 text-xs text-red-500">{errors.price.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-300">Category *</label>
                            <select {...register("category")} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200">
                                <option value="">Select</option>
                                {["breakfast", "lunch", "dinner", "snack", "dessert", "beverage", "thali", "other"].map((c) => (
                                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                ))}
                            </select>
                            {errors.category && <p className="mt-1 text-xs text-red-500">{errors.category.message}</p>}
                        </div>
                        <div className="sm:col-span-2 flex justify-end">
                            <button type="submit" disabled={submitting || uploading} className="rounded-xl bg-accent-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-accent-600 transition-all disabled:opacity-60">
                                {submitting ? "Adding..." : "Add Meal"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Meals List */}
            {meals.length === 0 ? (
                <div className="text-center py-16 rounded-2xl border-2 border-dashed border-neutral-300 dark:border-neutral-600">
                    <span className="text-4xl block mb-3">🍽️</span>
                    <h3 className="font-semibold text-neutral-700 dark:text-neutral-300">No meals yet</h3>
                    <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Add your first meal to the menu</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {meals.map((meal) => (
                        <div key={meal.id} className={`rounded-xl border p-4 flex items-center justify-between gap-4 transition-all ${meal.isAvailable ? "bg-white border-neutral-200/60 dark:bg-neutral-800 dark:border-neutral-700" : "bg-neutral-50 border-neutral-200/40 opacity-70 dark:bg-neutral-800/50"
                            }`}>
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                {meal.imageUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img src={meal.imageUrl} alt={meal.name} className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                                ) : (
                                    <div className="w-14 h-14 rounded-lg bg-neutral-100 dark:bg-neutral-700 flex items-center justify-center flex-shrink-0">
                                        <span className="text-xl">🍽️</span>
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-neutral-900 truncate dark:text-neutral-100">{meal.name}</h3>
                                        {!meal.isAvailable && <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-600 dark:bg-red-900/30 dark:text-red-300">Paused</span>}
                                        {meal.availabilityStatus === "NOT_TODAY" && <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full whitespace-nowrap ml-1 dark:bg-amber-900/50 dark:text-amber-200">Auto-resets tomorrow</span>}
                                    </div>
                                    <p className="text-sm font-medium text-primary-600 dark:text-primary-400">Rs. {meal.price.toLocaleString()}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <select 
                                    value={meal.availabilityStatus || (meal.isAvailable ? "AVAILABLE" : "OUT_OF_STOCK")} 
                                    onChange={(e) => updateAvailabilityStatus(meal, e.target.value as any)}
                                    className={`rounded-lg px-2 py-1.5 text-xs font-medium border-0 ring-1 ring-inset outline-none transition-all ${
                                        meal.availabilityStatus === "AVAILABLE" || (meal.isAvailable && !meal.availabilityStatus)
                                            ? "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-900/30 dark:text-green-300 dark:ring-green-500/30" 
                                            : meal.availabilityStatus === "NOT_TODAY"
                                                ? "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-900/30 dark:text-amber-300 dark:ring-amber-500/30"
                                                : "bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-500/30"
                                    }`}
                                >
                                    <option value="AVAILABLE">✅ Available</option>
                                    <option value="NOT_TODAY">⏳ Not Today</option>
                                    <option value="OUT_OF_STOCK">❌ Out of Stock</option>
                                </select>
                                <button onClick={() => deleteMeal(meal.id)} className="rounded-lg px-3 py-1.5 text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-all dark:bg-red-900/30 dark:text-red-300">
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
