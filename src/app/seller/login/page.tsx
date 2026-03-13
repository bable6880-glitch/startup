// CHANGED: Added Google Sign-In button below email/password form.
// Google login triggers Firebase popup → syncs user → routes by role.

"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cookLoginSchema, type CookLoginInput } from "@/lib/validations/auth";
import Link from "next/link";

export default function SellerLoginPage() {
    const { user, loading: authLoading, signInWithEmail, signInWithGoogle, getIdToken, error: authError } = useAuth();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);
    const [googleError, setGoogleError] = useState<string | null>(null);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<CookLoginInput>({
        resolver: zodResolver(cookLoginSchema) as never,
    });

    useEffect(() => {
        if (user && !authLoading) {
            if (user.role === "COOK" || user.role === "ADMIN") {
                // If they have a kitchen ID, send them directly to dashboard
                if (user.cookKitchenId) {
                    router.push("/dashboard");
                } else {
                    router.push("/become-a-cook");
                }
            } else {
                router.push("/become-a-cook");
            }
        }
    }, [user, authLoading, router]);

    const onSubmit = async (data: CookLoginInput) => {
        await signInWithEmail(data.email, data.password);
    };

    // ── Google Sign-In for Cooks ──────────────────────────────────────────────
    const handleGoogleSignIn = useCallback(async () => {
        setGoogleLoading(true);
        setGoogleError(null);
        try {
            // Step 1: Trigger Google popup via Firebase
            await signInWithGoogle();

            // After signInWithGoogle, onAuthStateChanged fires and syncs the user.
            // The useEffect above handles routing based on the role returned from sync.
            // We just need to wait for user state to update (handled by useEffect).

            // Get fresh token to call sync manually for immediate role check
            const token = await getIdToken();
            if (!token) {
                // User closed popup or auth failed silently
                setGoogleLoading(false);
                return;
            }

            // Call sync to get the current role from DB
            const res = await fetch("/api/auth/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ idToken: token }),
            });

            if (!res.ok) {
                throw new Error("Sync failed");
            }

            const body = await res.json();
            const role = body.data?.role;
            const cookKitchenId = body.data?.cookKitchenId;

            // Route based on the DB role
            if (role === "COOK" || role === "ADMIN") {
                if (cookKitchenId) {
                    router.push("/dashboard");
                } else {
                    router.push("/become-a-cook");
                }
            } else {
                // CUSTOMER — needs to register a kitchen
                router.push("/become-a-cook");
            }
        } catch (err) {
            // Firebase popup closed by user → err.code === 'auth/popup-closed-by-user'
            const message = err instanceof Error ? err.message : "";
            if (message.includes("popup-closed-by-user") || message.includes("cancelled-popup-request")) {
                // Silent fail — user just closed the popup
                setGoogleLoading(false);
                return;
            }
            setGoogleError("Sign-in failed. Please try again.");
        } finally {
            setGoogleLoading(false);
        }
    }, [signInWithGoogle, getIdToken, router]);

    return (
        <div className="min-h-[calc(100vh-80px)] flex">
            {/* ── Left: Hero Panel (warm orange theme) ── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #EA580C 0%, #F97316 30%, #FB923C 60%, #FCD34D 100%)" }}>
                <div className="absolute inset-0">
                    <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-yellow-300/15 blur-3xl" />
                    <div className="absolute top-1/3 right-1/4 h-40 w-40 rounded-full bg-orange-300/10 blur-2xl" />
                </div>

                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <span className="text-6xl mb-6">👨‍🍳</span>
                    <h2 className="text-4xl font-extrabold leading-tight">
                        Welcome Back,<br />
                        <span className="text-yellow-200">Chef!</span>
                    </h2>
                    <p className="mt-6 text-lg text-orange-100 leading-relaxed max-w-md">
                        Manage your kitchen, track orders, and grow your home food
                        business — all from one dashboard.
                    </p>

                    <div className="mt-10 grid grid-cols-2 gap-4">
                        <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                            <p className="text-2xl font-bold">📦</p>
                            <p className="text-sm mt-1 text-orange-100">Track Orders</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                            <p className="text-2xl font-bold">🍱</p>
                            <p className="text-sm mt-1 text-orange-100">Manage Menu</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                            <p className="text-2xl font-bold">⭐</p>
                            <p className="text-sm mt-1 text-orange-100">View Reviews</p>
                        </div>
                        <div className="rounded-2xl bg-white/10 backdrop-blur-sm p-4">
                            <p className="text-2xl font-bold">📊</p>
                            <p className="text-sm mt-1 text-orange-100">Analytics</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right: Login Form ── */}
            <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 bg-gradient-to-br from-orange-50/50 to-white dark:from-neutral-900 dark:to-neutral-800">
                <div className="w-full max-w-md animate-slide-up">
                    {/* Mobile hero */}
                    <div className="lg:hidden text-center mb-8">
                        <span className="text-5xl block mb-3">👨‍🍳</span>
                        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50">
                            Seller Login
                        </h1>
                        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                            Sign in to manage your kitchen
                        </p>
                    </div>

                    {/* Card with gradient border */}
                    <div className="relative">
                        <div className="absolute -inset-0.5 rounded-[1.75rem] bg-gradient-to-r from-orange-400 to-yellow-400 opacity-20 blur-sm" />
                        <div className="relative rounded-3xl border border-orange-200/50 bg-white/90 backdrop-blur-xl p-8 shadow-xl shadow-orange-100/30 dark:bg-neutral-800/90 dark:border-neutral-700 dark:shadow-neutral-900/40">
                            <div className="hidden lg:block text-center mb-6">
                                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                    Sign In to Your Kitchen 🔥
                                </h1>
                                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                                    Enter your credentials to access the dashboard
                                </p>
                            </div>

                            {(authError || googleError) && (
                                <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300 flex items-center gap-2">
                                    <span>⚠️</span>
                                    <span>{authError || googleError}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1.5 dark:text-neutral-300">
                                        Email Address
                                    </label>
                                    <input
                                        {...register("email")}
                                        type="email"
                                        placeholder="cook@example.com"
                                        className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200 dark:focus:border-orange-500 dark:focus:ring-orange-900/30"
                                    />
                                    {errors.email && (
                                        <p className="mt-1.5 text-xs text-red-500">{errors.email.message}</p>
                                    )}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300">
                                            Password
                                        </label>
                                        <Link
                                            href="/seller/forgot-password"
                                            className="text-xs font-semibold text-orange-600 hover:text-orange-700 hover:underline dark:text-orange-400"
                                        >
                                            Forgot password?
                                        </Link>
                                    </div>
                                    <div className="relative">
                                        <input
                                            {...register("password")}
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Enter your password"
                                            className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50/50 px-4 py-3 pr-12 text-sm focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200 dark:focus:border-orange-500 dark:focus:ring-orange-900/30"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1 transition-colors"
                                        >
                                            {showPassword ? "🙈" : "👁️"}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1.5 text-xs text-red-500">{errors.password.message}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || authLoading}
                                    className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:shadow-orange-500/30 hover:from-orange-600 hover:to-orange-700 transition-all active:scale-[0.97] disabled:opacity-60"
                                >
                                    {isSubmitting || authLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            Signing in...
                                        </span>
                                    ) : "Sign In →"}
                                </button>
                            </form>

                            {/* ── Divider ── */}
                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-white px-4 text-xs text-neutral-400 uppercase tracking-widest dark:bg-neutral-800 dark:text-neutral-500">
                                        or
                                    </span>
                                </div>
                            </div>

                            {/* ── Google Sign-In Button ── */}
                            <button
                                type="button"
                                onClick={handleGoogleSignIn}
                                disabled={googleLoading || authLoading}
                                className="group w-full flex items-center justify-center gap-3 rounded-xl border-2 border-neutral-200 bg-white px-4 py-3.5 text-sm font-semibold text-neutral-700 shadow-sm hover:border-orange-300 hover:shadow-lg hover:shadow-orange-100/50 transition-all duration-300 active:scale-[0.97] disabled:opacity-60 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200 dark:hover:border-orange-500 dark:hover:shadow-orange-900/20"
                            >
                                {googleLoading ? (
                                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-neutral-300 border-t-orange-500" />
                                ) : (
                                    <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                )}
                                {googleLoading ? "Signing in..." : "Sign in with Google"}
                            </button>

                            <div className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                Don&apos;t have a seller account?{" "}
                                <Link
                                    href="/seller/register"
                                    className="font-bold text-orange-600 hover:underline dark:text-orange-400"
                                >
                                    Register here →
                                </Link>
                            </div>

                            <div className="mt-3 text-center text-xs text-neutral-400 dark:text-neutral-500">
                                Want to order food instead?{" "}
                                <Link href="/login" className="underline hover:text-primary-600 transition-colors">
                                    Customer Login
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
