"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
    createKitchenSchema,
    type CreateKitchenInput,
} from "@/lib/validations/kitchen";

const cities = [
    "Lahore",
    "Karachi",
    "Islamabad",
    "Rawalpindi",
    "Faisalabad",
    "Multan",
];
const cuisineOptions = [
    "Pakistani",
    "Chinese",
    "Desi",
    "BBQ",
    "Biryani",
    "Continental",
    "Vegetarian",
    "Fast Food",
];

export default function BecomeACookPage() {
    const {
        user,
        loading: authLoading,
        error: authError,
        signInWithGoogle,
        getIdToken,
        refreshUser,
    } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch,
        trigger,
        setValue,
        getValues,
    } = useForm<CreateKitchenInput>({
        resolver: zodResolver(createKitchenSchema) as never,
        defaultValues: {
            cuisineTypes: [],
            country: "Pakistan",
        },
    });

    const totalSteps = 3;

    // CHANGED: Redirect COOK/ADMIN users away — they already have a kitchen
    useEffect(() => {
        if (user && !authLoading) {
            if (user.role === "COOK" || user.role === "ADMIN") {
                router.push("/dashboard");
            }
        }
    }, [user, authLoading, router]);

    // ── Step Navigation ──────────────────────────────────────────────────────
    const goNext = async () => {
        let fields: (keyof CreateKitchenInput)[] = [];
        if (step === 1) fields = ["name", "city"];
        if (step === 2) fields = ["contactPhone", "contactWhatsapp", "contactEmail"];
        const valid = await trigger(fields);
        if (valid) setStep((s) => Math.min(s + 1, totalSteps));
    };

    const goBack = () => setStep((s) => Math.max(s - 1, 1));

    // ── Cuisine toggle (array of strings) ────────────────────────────────────
    const toggleCuisine = (cuisine: string) => {
        const current = getValues("cuisineTypes") || [];
        if (current.includes(cuisine)) {
            setValue(
                "cuisineTypes",
                current.filter((c) => c !== cuisine)
            );
        } else {
            setValue("cuisineTypes", [...current, cuisine]);
        }
    };

    // ── Submit ───────────────────────────────────────────────────────────────
    // CHANGED: After kitchen creation, force token refresh, re-sync auth state,
    // and strictly redirect to /dashboard (not /kitchen/{id}).
    const onSubmit = async (data: CreateKitchenInput) => {
        setSubmitting(true);
        setError(null);
        try {
            const token = await getIdToken();
            if (!token) {
                setError("Please sign in first");
                setSubmitting(false);
                return;
            }

            const res = await fetch("/api/kitchens", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(data),
            });

            if (!res.ok) {
                let msg = "Failed to register kitchen";
                try {
                    const err = await res.json();
                    msg = err.error?.message || msg;
                } catch {
                    // response wasn't JSON
                }
                throw new Error(msg);
            }

            // Force Firebase token refresh to pick up new COOK custom claims
            await refreshUser();

            // Strict redirect to subscription page — payment required before dashboard access
            router.push("/dashboard/subscription?onboarding=true");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            setSubmitting(false);
        }
    };

    // ── Loading State ────────────────────────────────────────────────────────
    if (authLoading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="text-center space-y-3">
                    <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                    <p className="text-sm text-neutral-500 dark:text-neutral-400">
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    // ── Sign-In Required ─────────────────────────────────────────────────────
    if (!user) {
        return (
            <div className="flex min-h-[calc(100vh-200px)] items-center justify-center px-4 py-12">
                <div className="w-full max-w-md text-center animate-slide-up">
                    <div className="rounded-2xl border border-neutral-200/60 bg-white p-8 shadow-lg dark:bg-neutral-800 dark:border-neutral-700">
                        <span className="text-5xl block mb-4">👨‍🍳</span>
                        <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                            Become a Cook
                        </h1>
                        <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                            Sign in to register your home kitchen and start serving delicious
                            food
                        </p>

                        {/* Show auth-level error (sync failure) */}
                        {authError && (
                            <div className="mt-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300">
                                {authError}
                            </div>
                        )}

                        <button
                            onClick={signInWithGoogle}
                            className="mt-6 w-full flex items-center justify-center gap-3 rounded-xl bg-primary-500 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 transition-all active:scale-95"
                        >
                            <svg className="h-5 w-5" viewBox="0 0 24 24">
                                <path
                                    fill="#fff"
                                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                />
                                <path
                                    fill="#fff"
                                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                />
                                <path
                                    fill="#fff"
                                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                />
                                <path
                                    fill="#fff"
                                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                />
                            </svg>
                            Sign In with Google to Continue
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // ── Main Form ────────────────────────────────────────────────────────────
    const watchedName = watch("name");
    const watchedCity = watch("city");
    const watchedArea = watch("area");
    const watchedAddress = watch("addressLine");
    const watchedPhone = watch("contactPhone");
    const watchedWhatsapp = watch("contactWhatsapp");
    const watchedCuisine = watch("cuisineTypes") || [];
    const watchedDescription = watch("description");

    return (
        <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-50">
                    Register Your Kitchen
                </h1>
                <p className="mt-2 text-neutral-500 dark:text-neutral-400">
                    Set up your profile and start accepting orders
                </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                    {["Basic Info", "Contact & Menu", "Review"].map((label, idx) => (
                        <div key={label} className="flex items-center gap-2">
                            <div
                                className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${idx + 1 < step
                                    ? "bg-accent-500 text-white"
                                    : idx + 1 === step
                                        ? "bg-primary-500 text-white ring-4 ring-primary-100 dark:ring-primary-900/30"
                                        : "bg-neutral-200 text-neutral-500 dark:bg-neutral-700 dark:text-neutral-400"
                                    }`}
                            >
                                {idx + 1 < step ? "✓" : idx + 1}
                            </div>
                            <span
                                className={`text-xs font-medium hidden sm:inline ${idx + 1 <= step
                                    ? "text-primary-600 dark:text-primary-400"
                                    : "text-neutral-400 dark:text-neutral-500"
                                    }`}
                            >
                                {label}
                            </span>
                        </div>
                    ))}
                </div>
                <div className="h-2 rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden">
                    <div
                        className="h-2 rounded-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all duration-500 ease-out"
                        style={{ width: `${(step / totalSteps) * 100}%` }}
                    />
                </div>
            </div>

            {/* Error Banner */}
            {(error || authError) && (
                <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300 flex items-start gap-2">
                    <span className="mt-0.5">⚠️</span>
                    <span>{error || authError}</span>
                </div>
            )}

            <form
                onSubmit={handleSubmit(onSubmit as never)}
                className="rounded-2xl border border-neutral-200/60 bg-white p-6 sm:p-8 shadow-sm dark:bg-neutral-800 dark:border-neutral-700"
            >
                {/* ═══════════ Step 1: Basic Info ═══════════ */}
                <div className={step === 1 ? "block animate-fade-in" : "hidden"}>
                    <h2 className="text-lg font-semibold text-neutral-900 mb-1 dark:text-neutral-100">
                        Kitchen Details
                    </h2>
                    <p className="text-sm text-neutral-500 mb-6 dark:text-neutral-400">
                        Tell us about your kitchen
                    </p>

                    <div className="space-y-5">
                        {/* Kitchen Name */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-300">
                                Kitchen Name <span className="text-red-500">*</span>
                            </label>
                            <input
                                {...register("name")}
                                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
                                placeholder="e.g. HomeHarvest Kitchen"
                            />
                            {errors.name && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.name.message}
                                </p>
                            )}
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-300">
                                Description
                            </label>
                            <textarea
                                {...register("description")}
                                rows={3}
                                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none resize-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
                                placeholder="Tell customers about your kitchen and what makes it special..."
                            />
                            {errors.description && (
                                <p className="mt-1 text-xs text-red-500">
                                    {errors.description.message}
                                </p>
                            )}
                        </div>

                        {/* City + Area */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-300">
                                    City <span className="text-red-500">*</span>
                                </label>
                                <select
                                    {...register("city")}
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
                                >
                                    <option value="">Select city</option>
                                    {cities.map((c) => (
                                        <option key={c} value={c}>
                                            {c}
                                        </option>
                                    ))}
                                </select>
                                {errors.city && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.city.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-300">
                                    Area / Locality
                                </label>
                                <input
                                    {...register("area")}
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
                                    placeholder="e.g. DHA Phase 5"
                                />
                            </div>
                        </div>

                        {/* Full Address */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-300">
                                Full Address
                            </label>
                            <input
                                {...register("addressLine")}
                                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
                                placeholder="House 12, Street 5, Block C..."
                            />
                        </div>
                    </div>
                </div>

                {/* ═══════════ Step 2: Contact & Cuisine ═══════════ */}
                <div className={step === 2 ? "block animate-fade-in" : "hidden"}>
                    <h2 className="text-lg font-semibold text-neutral-900 mb-1 dark:text-neutral-100">
                        Contact & Cuisine
                    </h2>
                    <p className="text-sm text-neutral-500 mb-6 dark:text-neutral-400">
                        How can customers reach you?
                    </p>

                    <div className="space-y-5">
                        {/* Phone + WhatsApp */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-300">
                                    Phone Number
                                </label>
                                <input
                                    {...register("contactPhone")}
                                    type="tel"
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
                                    placeholder="+923001234567"
                                />
                                {errors.contactPhone && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.contactPhone.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-1 dark:text-neutral-300">
                                    WhatsApp Number
                                </label>
                                <input
                                    {...register("contactWhatsapp")}
                                    type="tel"
                                    className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200"
                                    placeholder="+923001234567"
                                />
                                {errors.contactWhatsapp && (
                                    <p className="mt-1 text-xs text-red-500">
                                        {errors.contactWhatsapp.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Cuisine Types */}
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2 dark:text-neutral-300">
                                Cuisine Types
                            </label>
                            <p className="text-xs text-neutral-400 mb-3 dark:text-neutral-500">
                                Select all that apply
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {cuisineOptions.map((c) => {
                                    const isSelected = watchedCuisine.includes(c);
                                    return (
                                        <button
                                            key={c}
                                            type="button"
                                            onClick={() => toggleCuisine(c)}
                                            className={`rounded-full px-4 py-2 text-sm font-medium transition-all ${isSelected
                                                ? "bg-primary-500 text-white shadow-sm scale-105"
                                                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-600"
                                                }`}
                                        >
                                            {isSelected && "✓ "}
                                            {c}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ═══════════ Step 3: Review ═══════════ */}
                <div className={step === 3 ? "block animate-fade-in" : "hidden"}>
                    <h2 className="text-lg font-semibold text-neutral-900 mb-1 dark:text-neutral-100">
                        Review & Submit
                    </h2>
                    <p className="text-sm text-neutral-500 mb-6 dark:text-neutral-400">
                        Please review your information before submitting
                    </p>

                    <div className="rounded-xl bg-neutral-50 p-5 space-y-3 dark:bg-neutral-700/50">
                        <div className="flex items-center gap-3 pb-3 border-b border-neutral-200 dark:border-neutral-600">
                            <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center text-xl font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                                {watchedName?.[0]?.toUpperCase() || "K"}
                            </div>
                            <div>
                                <p className="font-semibold text-neutral-900 dark:text-neutral-100">
                                    {watchedName || "Kitchen Name"}
                                </p>
                                <p className="text-sm text-neutral-500 dark:text-neutral-400">
                                    {[watchedArea, watchedCity].filter(Boolean).join(", ") ||
                                        "Location"}
                                </p>
                            </div>
                        </div>

                        {watchedDescription && (
                            <div>
                                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1 dark:text-neutral-400">
                                    Description
                                </p>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                    {watchedDescription}
                                </p>
                            </div>
                        )}

                        {watchedAddress && (
                            <div>
                                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1 dark:text-neutral-400">
                                    Address
                                </p>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                    {watchedAddress}
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1 dark:text-neutral-400">
                                    Phone
                                </p>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                    {watchedPhone || "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1 dark:text-neutral-400">
                                    WhatsApp
                                </p>
                                <p className="text-sm text-neutral-700 dark:text-neutral-300">
                                    {watchedWhatsapp || "—"}
                                </p>
                            </div>
                        </div>

                        {watchedCuisine.length > 0 && (
                            <div>
                                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2 dark:text-neutral-400">
                                    Cuisine
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {watchedCuisine.map((c) => (
                                        <span
                                            key={c}
                                            className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300"
                                        >
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* ═══════════ Navigation Buttons ═══════════ */}
                <div className="mt-8 flex items-center justify-between pt-4 border-t border-neutral-100 dark:border-neutral-700">
                    {step > 1 ? (
                        <button
                            type="button"
                            onClick={goBack}
                            className="rounded-xl border border-neutral-200 px-6 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-all dark:border-neutral-600 dark:text-neutral-300 dark:hover:bg-neutral-700"
                        >
                            ← Back
                        </button>
                    ) : (
                        <div />
                    )}

                    {step < totalSteps ? (
                        <button
                            type="button"
                            onClick={goNext}
                            className="rounded-xl bg-primary-500 px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-primary-600 transition-all active:scale-95"
                        >
                            Next →
                        </button>
                    ) : (
                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-xl bg-accent-500 px-8 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-accent-600 transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
                        >
                            {submitting ? (
                                <>
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Registering...
                                </>
                            ) : (
                                "🚀 Register Kitchen"
                            )}
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}
