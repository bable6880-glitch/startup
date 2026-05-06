"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createMealSchema, type CreateMealInput } from "@/lib/validations/menu";
import { Loader2, Plus, Edit2, Trash2, X, Image as ImageIcon, Search, Sparkles } from "lucide-react";
import { BackButton } from "@/components/ui/BackButton";
import { usePlanAccess } from "@/hooks/use-plan-access";
import { FeatureGate } from "@/components/plans/FeatureGate";
import { KitchenLockedModal } from "@/components/plans/KitchenLockedModal";
import { AIPricingPanel } from "@/components/menu/AIPricingPanel";

type Meal = {
    id: string;
    name: string;
    description: string | null;
    price: number;
    category: "breakfast" | "lunch" | "dinner" | "snack" | "dessert" | "beverage" | "thali" | "other" | undefined;
    isAvailable: boolean;
    imageUrl: string | null;
    images: string[] | null;
    dietaryTags: string[] | null;
};

export default function MenuManagementPage() {
    const { user, loading: authLoading, getIdToken } = useAuth();
    const router = useRouter();
    
    // Data state
    const [meals, setMeals] = useState<Meal[]>([]);
    const [kitchenId, setKitchenId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const { data: planData } = usePlanAccess();
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");
    
    // Modal & Form state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [pageError, setPageError] = useState<string | null>(null);
    
    // Image Upload
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // AI Chef Assistant modal state (must be declared before any conditional returns)
    const [isAiModalOpen, setIsAiModalOpen] = useState(false);
    const [aiCuisine, setAiCuisine] = useState("");
    const [aiLoading, setAiLoading] = useState(false);
    const [aiSuggestions, setAiSuggestions] = useState<any[]>([]);
    const [aiTips, setAiTips] = useState<string | null>(null);
    const [aiError, setAiError] = useState<string | null>(null);

    // AI Pricing panel state
    const [aiPricingMeal, setAiPricingMeal] = useState<Meal | null>(null);
    const isElite = planData?.planId === 'elite';

    const {
        register, handleSubmit, reset, setValue, formState: { errors }, watch
    } = useForm<CreateMealInput>({
        resolver: zodResolver(createMealSchema) as never,
        defaultValues: { isAvailable: true, dietaryTags: [] },
    });

    const categories = ["breakfast", "lunch", "dinner", "snack", "dessert", "beverage", "thali", "other"];

    useEffect(() => {
        if (!authLoading && !user) { router.push("/login?redirect=/dashboard/menu"); return; }
        if (user) loadMenu();
    }, [user, authLoading, router]);

    const loadMenu = async () => {
        try {
            const token = await getIdToken();
            if (!token) return;
            const res = await fetch("/api/kitchens?ownerId=me", {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const json = await res.json();
                const k = (json.data || [])[0];
                if (k) {
                    setKitchenId(k.id);
                    const menuRes = await fetch(`/api/kitchens/${k.id}/menu`);
                    if (menuRes.ok) {
                        const m = await menuRes.json();
                        setMeals(m.data || []);
                    }
                } else {
                    setPageError("No kitchen profile found. Please create one on the dashboard.");
                }
            }
        } catch (err) {
            console.error(err);
            setPageError("Failed to load menu data.");
        } finally {
            setLoading(false);
        }
    };

    const openModal = (meal?: Meal) => {
        if (meal) {
            setEditingMeal(meal);
            setValue("name", meal.name);
            setValue("description", meal.description || "");
            setValue("price", meal.price);
            setValue("category", meal.category);
            setValue("isAvailable", meal.isAvailable);
            setValue("imageUrl", meal.imageUrl || undefined);
            const imgs = meal.images || (meal.imageUrl ? [meal.imageUrl] : []);
            setValue("images", imgs);
            setImagePreviews(imgs);
        } else {
            setEditingMeal(null);
            reset({ isAvailable: true, images: [] });
            setImagePreviews([]);
        }
        setFormError(null);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingMeal(null);
        reset({ isAvailable: true, images: [] });
        setImagePreviews([]);
        setFormError(null);
    };

    // ── Image Upload ──
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (imagePreviews.length >= 3) {
            setFormError("Maximum 3 images allowed.");
            return;
        }

        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
            setFormError("Invalid format. Only JPG, PNG, WebP allowed.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            setFormError("Image max size is 5MB.");
            return;
        }

        setUploading(true);
        setFormError(null);
        try {
            const token = await getIdToken();
            const formData = new FormData();
            formData.append("file", file);
            formData.append("folder", "meals");
            const res = await fetch("/api/upload", {
                method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
            });
            if (res.ok) {
                const { data } = await res.json();
                const newImages = [...imagePreviews, data.url];
                setImagePreviews(newImages);
                setValue("images", newImages);
                if (newImages.length === 1) {
                    setValue("imageUrl", data.url);
                }
            } else {
                setFormError("Image upload failed.");
            }
        } catch {
            setFormError("Upload network error.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const removeImage = (index: number) => {
        const newImages = imagePreviews.filter((_, i) => i !== index);
        setImagePreviews(newImages);
        setValue("images", newImages);
        if (newImages.length > 0) {
            setValue("imageUrl", newImages[0]);
        } else {
            setValue("imageUrl", undefined);
        }
    };

    // ── Form Submit ──
    const onSubmit = async (data: CreateMealInput) => {
        if (!kitchenId) return;
        setSubmitting(true);
        setFormError(null);
        try {
            const token = await getIdToken();
            const method = editingMeal ? "PUT" : "POST";
            const url = editingMeal 
                ? `/api/kitchens/${kitchenId}/menu/${editingMeal.id}`
                : `/api/kitchens/${kitchenId}/menu`;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(data),
            });
            
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || json.error?.message || "Failed to save meal");
            
            if (editingMeal) {
                setMeals(prev => prev.map(m => m.id === editingMeal.id ? { ...m, ...json.data } : m));
            } else {
                setMeals(prev => [json.data, ...prev]);
            }
            closeModal();
        } catch (err: any) {
            setFormError(err.message || "An error occurred");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Actions ──
    const deleteMeal = async (mealId: string) => {
        if (!kitchenId || !confirm("Are you sure you want to delete this meal? This cannot be undone.")) return;
        try {
            const token = await getIdToken();
            const res = await fetch(`/api/kitchens/${kitchenId}/menu/${mealId}`, {
                method: "DELETE", headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) setMeals(prev => prev.filter(m => m.id !== mealId));
        } catch (err) {
            console.error("Failed to delete", err);
        }
    };

    const toggleAvailability = async (meal: Meal) => {
        if (!kitchenId) return;
        try {
            const token = await getIdToken();
            const res = await fetch(`/api/kitchens/${kitchenId}/menu/${meal.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ isAvailable: !meal.isAvailable }),
            });
            if (res.ok) {
                setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, isAvailable: !meal.isAvailable } : m));
            }
        } catch (err) {
            console.error("Toggle failed", err);
        }
    };

    // Filtering
    const filteredMeals = meals.filter(m => {
        const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat = activeCategory === "all" || m.category === activeCategory;
        return matchesSearch && matchesCat;
    });

    if (authLoading || loading) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="animate-pulse space-y-6">
                    <div className="h-10 w-48 bg-neutral-200 rounded-lg dark:bg-neutral-700" />
                    <div className="h-20 bg-neutral-200 rounded-2xl dark:bg-neutral-700" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[1, 2, 3, 4].map(i => <div key={i} className="h-40 rounded-xl bg-neutral-100 dark:bg-neutral-800" />)}
                    </div>
                </div>
            </div>
        );
    }

    if (pageError) {
        return (
            <div className="mx-auto max-w-5xl px-4 py-16 text-center">
                <span className="text-5xl block mb-4">⚠️</span>
                <p className="text-red-500 font-medium">{pageError}</p>
                <button onClick={() => router.push("/dashboard")} className="mt-4 text-primary-600 hover:underline">Back to Dashboard</button>
            </div>
        );
    }



    const generateAiIdeas = async () => {
        if (!aiCuisine.trim()) return;
        setAiLoading(true);
        setAiError(null);
        try {
            const token = await getIdToken();
            const res = await fetch("/api/seller/ai/chef-assistant", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ cuisine: aiCuisine })
            });
            const data = await res.json();
            if (res.ok) {
                setAiSuggestions(data.ideas || []);
                setAiTips(data.tips || null);
            } else {
                setAiError(data.error || "Failed to generate ideas. Ensure you have the Elite plan.");
            }
        } catch (err) {
            setAiError("Network error.");
        } finally {
            setAiLoading(false);
        }
    };

    const useAiIdea = (idea: any) => {
        setIsAiModalOpen(false);
        setEditingMeal(null);
        reset({
            name: idea.name,
            description: idea.description,
            price: idea.suggestedPriceRs,
            category: "other",
            isAvailable: true,
            dietaryTags: [],
            images: [],
        });
        setImagePreviews([]);
        setFormError(null);
        setIsModalOpen(true);
    };

    return (
        <div className="mx-auto max-w-5xl px-4 py-8 bg-neutral-50/50 min-h-[calc(100vh-80px)] dark:bg-neutral-900 border border-transparent">
            {/* Kitchen Locked Overlay */}
            {planData && (planData as any).isKitchenLocked && (
                <KitchenLockedModal lockReason={(planData as any).lockReason || 'ORDER_LIMIT_REACHED'} />
            )}
            <BackButton label="Dashboard" />
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 mt-2">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">Menu Management</h1>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">Add, edit, or remove your delicious offerings.</p>
                </div>
                <div className="flex gap-3">
                    <FeatureGate
                        feature="cook_helper_ai"
                        currentPlanId={planData?.planId ?? null}
                        requiredPlan="growth"
                        fallback={
                            <button disabled className="flex items-center gap-2 rounded-xl bg-gray-100 px-5 py-2.5 text-sm font-bold text-gray-400 shadow-sm transition-all cursor-not-allowed">
                                🔒 AI Chef (Growth+)
                            </button>
                        }
                    >
                        <button
                            onClick={() => {
                                setAiCuisine("");
                                setAiSuggestions([]);
                                setAiTips(null);
                                setAiError(null);
                                setIsAiModalOpen(true);
                            }}
                            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-purple-500/30 hover:shadow-md transition-all active:scale-95"
                        >
                            <span className="text-lg">✨</span> AI Chef Assistant
                        </button>
                    </FeatureGate>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-bold text-white shadow-sm shadow-primary-500/30 hover:bg-primary-700 transition-all active:scale-95"
                    >
                        <Plus className="w-5 h-5" /> Add New Item
                    </button>
                </div>
            </div>

            {/* Filters & Search */}
            <div className="mb-6 flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                    <input 
                        type="text" 
                        placeholder="Search menu..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 dark:bg-neutral-800 dark:border-neutral-700 dark:text-white"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide py-1">
                    <button 
                        onClick={() => setActiveCategory("all")}
                        className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${activeCategory === "all" ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900" : "bg-neutral-200/50 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400"}`}
                    >
                        All
                    </button>
                    {categories.map(c => (
                        <button 
                            key={c}
                            onClick={() => setActiveCategory(c)}
                            className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-all ${activeCategory === c ? "bg-primary-600 text-white shadow-md shadow-primary-500/20" : "bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 dark:bg-neutral-800 dark:border-neutral-700 dark:text-neutral-300"}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Meal Grid */}
            {filteredMeals.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-neutral-300 dark:bg-neutral-800/50 dark:border-neutral-700">
                    <span className="text-5xl block mb-4">🍽️</span>
                    <h3 className="font-bold text-neutral-800 dark:text-neutral-200 mb-1">
                        {searchQuery ? "No matching items found" : "Your menu is empty"}
                    </h3>
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        {searchQuery ? "Try searching for something else." : "Start adding your signature dishes."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredMeals.map(meal => (
                        <div key={meal.id} className="group flex flex-col bg-white rounded-2xl border border-neutral-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow dark:bg-neutral-800 dark:border-neutral-700">
                            {/* Image Header */}
                            <div className="h-36 bg-neutral-100 relative dark:bg-neutral-700">
                                {meal.imageUrl ? (
                                    <img src={meal.imageUrl} alt={meal.name} className={`w-full h-full object-cover ${!meal.isAvailable && 'grayscale'}`} />
                                ) : (
                                    <div className="flex items-center justify-center h-full opacity-30"><ImageIcon className="w-10 h-10" /></div>
                                )}
                                {!meal.isAvailable && (
                                    <div className="absolute inset-0 bg-neutral-900/60 flex items-center justify-center">
                                        <span className="font-bold text-white uppercase tracking-wider bg-black/50 px-3 py-1 rounded-full text-xs">Out of Stock</span>
                                    </div>
                                )}
                            </div>

                            {/* Content */}
                            <div className="p-5 flex-1 flex flex-col pt-4">
                                <div className="flex justify-between items-start gap-2 mb-2">
                                    <h3 className={`font-bold leading-tight ${!meal.isAvailable ? 'text-neutral-500 dark:text-neutral-400' : 'text-neutral-900 dark:text-white'}`}>{meal.name}</h3>
                                    <span className="font-bold text-primary-600 dark:text-primary-400 shrink-0">Rs. {meal.price.toLocaleString()}</span>
                                </div>
                                
                                <p className="text-xs text-neutral-500 line-clamp-2 md:line-clamp-3 mb-4 flex-1 dark:text-neutral-400">
                                    {meal.description || "No description provided."}
                                </p>

                                {/* Footer Actions */}
                                <div className="flex items-center gap-2 mt-auto pt-4 border-t border-neutral-100 dark:border-neutral-700/50">
                                    {/* Toggle Switch */}
                                    <label className="flex items-center cursor-pointer gap-2 mr-auto" title="Click to toggle availability">
                                        <div className="relative">
                                            <input type="checkbox" className="sr-only" checked={meal.isAvailable} onChange={() => toggleAvailability(meal)} />
                                            <div className={`block w-10 h-6 rounded-full transition-colors ${meal.isAvailable ? 'bg-green-500' : 'bg-neutral-300 dark:bg-neutral-600'}`}></div>
                                            <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${meal.isAvailable ? 'translate-x-4' : ''}`}></div>
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${meal.isAvailable ? 'text-green-600' : 'text-neutral-500'}`}>
                                            {meal.isAvailable ? 'Active' : 'Hidden'}
                                        </span>
                                    </label>

                                    <button
                                        onClick={() => setAiPricingMeal(meal)}
                                        className="p-2 text-neutral-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors dark:hover:bg-violet-900/30 relative group/ai"
                                        title="AI Price Suggestion"
                                    >
                                        <Sparkles className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => openModal(meal)} className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors dark:hover:bg-primary-900/30">
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => deleteMeal(meal.id)} className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors dark:hover:bg-red-900/30">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* AI Pricing Panel (slide-in drawer) */}
            {aiPricingMeal && kitchenId && (
                <>
                    <div
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
                        onClick={() => setAiPricingMeal(null)}
                    />
                    <div className="fixed inset-y-0 right-0 w-80 bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-700 z-50 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                        <AIPricingPanel
                            meal={aiPricingMeal}
                            kitchenId={kitchenId}
                            hasAccess={isElite}
                            onApplyPrice={async (mealId, newPrice) => {
                                try {
                                    const token = await getIdToken();
                                    const res = await fetch(`/api/kitchens/${kitchenId}/menu/${mealId}`, {
                                        method: "PUT",
                                        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                        body: JSON.stringify({ price: newPrice }),
                                    });
                                    if (res.ok) {
                                        setMeals(prev => prev.map(m => m.id === mealId ? { ...m, price: newPrice } : m));
                                    }
                                } catch (err) {
                                    console.error("Failed to apply AI price", err);
                                }
                            }}
                            onClose={() => setAiPricingMeal(null)}
                        />
                    </div>
                </>
            )}

            {/* AI Assistant Modal */}
            {isAiModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 sm:px-0">
                    <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsAiModalOpen(false)} />
                    
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col dark:bg-neutral-900 animate-in fade-in slide-in-from-bottom-8 border border-purple-500/20">
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/10 dark:to-indigo-900/10">
                            <div className="flex items-center gap-3">
                                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-inner">
                                    ✨
                                </span>
                                <div>
                                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">AI Chef Assistant</h2>
                                    <p className="text-xs text-neutral-500 dark:text-neutral-400">Powered by advanced culinary models</p>
                                </div>
                            </div>
                            <button onClick={() => setIsAiModalOpen(false)} className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-200/50 p-2 rounded-full transition-colors dark:hover:bg-neutral-800">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="mb-6">
                                <label className="block text-sm font-bold text-neutral-700 mb-1.5 dark:text-neutral-300">What cuisine or dish are you thinking of?</label>
                                <div className="flex gap-2">
                                    <input 
                                        type="text" 
                                        value={aiCuisine}
                                        onChange={(e) => setAiCuisine(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && generateAiIdeas()}
                                        placeholder="e.g. Authentic Lahori, Healthy Salads, Italian..." 
                                        className="flex-1 rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-none transition-all dark:bg-neutral-950 dark:border-neutral-700 dark:text-white" 
                                    />
                                    <button 
                                        onClick={generateAiIdeas}
                                        disabled={aiLoading || !aiCuisine.trim()}
                                        className="rounded-xl bg-neutral-900 px-6 py-3 text-sm font-bold text-white shadow-sm hover:bg-neutral-800 disabled:opacity-50 transition-all dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-200"
                                    >
                                        {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Generate"}
                                    </button>
                                </div>
                                {aiError && <p className="mt-2 text-xs font-medium text-red-500">{aiError}</p>}
                            </div>

                            {aiSuggestions.length > 0 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                                    <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                                        💡 Menu Suggestions
                                    </h3>
                                    {aiSuggestions.map((idea, idx) => (
                                        <div key={idx} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:border-purple-300 hover:shadow-md transition-all dark:bg-neutral-800 dark:border-neutral-700">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-neutral-900 dark:text-white text-lg">{idea.name}</h4>
                                                <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg dark:bg-green-900/30 dark:text-green-400">
                                                    Rs. {idea.suggestedPriceRs}
                                                </span>
                                            </div>
                                            <p className="text-sm text-neutral-600 mb-4 dark:text-neutral-400 leading-relaxed">{idea.description}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="flex gap-3 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                                                    <span>Cost: Rs. {idea.estimatedCostRs}</span>
                                                    <span>•</span>
                                                    <span>Difficulty: {idea.difficulty}</span>
                                                </div>
                                                <button 
                                                    onClick={() => useAiIdea(idea)}
                                                    className="text-xs font-bold text-purple-600 bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50"
                                                >
                                                    Use this idea →
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {aiTips && (
                                        <div className="mt-6 rounded-xl bg-amber-50 border border-amber-200 p-4 flex gap-3 dark:bg-amber-900/20 dark:border-amber-900/50">
                                            <span className="text-amber-600">💡</span>
                                            <p className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed font-medium">
                                                {aiTips}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Slide-out / Modal Form */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 sm:px-0">
                    <div className="absolute inset-0 bg-neutral-900/50 backdrop-blur-sm transition-opacity" onClick={closeModal} />
                    
                    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-hidden flex flex-col dark:bg-neutral-900 animate-in fade-in slide-in-from-bottom-8">
                        <div className="flex items-center justify-between p-6 border-b border-neutral-100 dark:border-neutral-800">
                            <h2 className="text-xl font-bold text-neutral-900 dark:text-white">
                                {editingMeal ? "Edit Item" : "Create New Item"}
                            </h2>
                            <button onClick={closeModal} className="text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 p-2 rounded-full transition-colors dark:hover:bg-neutral-800">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 overflow-y-auto flex-1">
                            {formError && <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 text-sm font-medium text-red-600 dark:bg-red-900/20 dark:border-red-900/50 dark:text-red-400">{formError}</div>}
                            
                            <form id="mealForm" onSubmit={handleSubmit(onSubmit as never)} className="space-y-6">
                                {/* Image Uploader */}
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <div>
                                            <label className="block text-sm font-bold text-neutral-700 dark:text-neutral-300">Item Photos (Required) *</label>
                                            <p className="text-xs text-neutral-500 mt-1 dark:text-neutral-400">Add up to 3 photos. First photo is the main display. JPG, PNG up to 5MB.</p>
                                        </div>
                                        <span className="text-xs font-bold text-neutral-400">{imagePreviews.length}/3</span>
                                    </div>
                                    
                                    <div className="flex flex-wrap gap-4 mt-3">
                                        {imagePreviews.map((preview, idx) => (
                                            <div key={idx} className="relative w-28 h-28 shrink-0 rounded-2xl border border-neutral-200 overflow-hidden shadow-sm dark:border-neutral-700 group">
                                                <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button type="button" onClick={() => removeImage(idx)} className="p-2 bg-red-500 hover:bg-red-600 rounded-full text-white transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                                {idx === 0 && (
                                                    <div className="absolute top-1 left-1 bg-primary-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded shadow">Main</div>
                                                )}
                                            </div>
                                        ))}

                                        {imagePreviews.length < 3 && (
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={uploading}
                                                className="relative w-28 h-28 shrink-0 rounded-2xl border-2 border-dashed border-neutral-300 hover:border-primary-400 hover:bg-primary-50/50 transition-colors bg-neutral-50 flex flex-col items-center justify-center text-neutral-400 hover:text-primary-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-neutral-800 dark:border-neutral-700 group"
                                            >
                                                {uploading ? (
                                                    <Loader2 className="w-6 h-6 animate-spin text-primary-500" />
                                                ) : (
                                                    <>
                                                        <Plus className="w-6 h-6 mb-1" />
                                                        <span className="text-[10px] font-bold uppercase tracking-wider">Add Photo</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                    <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} className="hidden" />
                                    {errors.images && <p className="mt-2 text-xs font-medium text-red-500">{errors.images.message}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-bold text-neutral-700 mb-1.5 dark:text-neutral-300">Name *</label>
                                        <input {...register("name")} placeholder="e.g. Chicken Biryani" className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:bg-neutral-900 dark:border-neutral-700 dark:text-white" />
                                        {errors.name && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.name.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-1.5 dark:text-neutral-300">Price (Rs.) *</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 font-medium text-sm">Rs.</span>
                                            <input type="number" {...register("price", { valueAsNumber: true })} placeholder="0.00" className="w-full rounded-xl border border-neutral-300 bg-white pl-10 pr-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:bg-neutral-900 dark:border-neutral-700 dark:text-white" />
                                        </div>
                                        {errors.price && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.price.message}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-neutral-700 mb-1.5 dark:text-neutral-300">Category *</label>
                                        <select {...register("category")} className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all cursor-pointer dark:bg-neutral-900 dark:border-neutral-700 dark:text-white">
                                            <option value="">Select a category</option>
                                            {categories.map((c) => (
                                                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                            ))}
                                        </select>
                                        {errors.category && <p className="mt-1.5 text-xs font-medium text-red-500">{errors.category.message}</p>}
                                    </div>

                                    <div className="sm:col-span-2">
                                        <label className="block text-sm font-bold text-neutral-700 mb-1.5 dark:text-neutral-300">Description</label>
                                        <textarea {...register("description")} rows={3} placeholder="Describe the ingredients, flavor, and serving size..." className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none transition-all dark:bg-neutral-900 dark:border-neutral-700 dark:text-white" />
                                    </div>
                                </div>
                            </form>
                        </div>
                        
                        <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex items-center justify-end gap-3 rounded-b-2xl dark:bg-neutral-800/80 dark:border-neutral-800 mt-auto">
                            <button type="button" onClick={closeModal} className="px-5 py-2.5 text-sm font-bold text-neutral-600 hover:bg-neutral-200/50 rounded-xl transition-all dark:text-neutral-300 dark:hover:bg-neutral-700">
                                Cancel
                            </button>
                            <button type="submit" form="mealForm" disabled={submitting || uploading} className="min-w-[140px] rounded-xl bg-primary-600 px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-primary-700 transition-all active:scale-95 flex items-center justify-center disabled:opacity-50 disabled:active:scale-100">
                                {submitting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Saving</> : "Save Item"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
