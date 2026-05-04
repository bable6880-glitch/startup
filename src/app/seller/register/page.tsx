"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cookRegisterSchema, type CookRegisterInput } from "@/lib/validations/auth";
import Link from "next/link";

export default function SellerRegisterPage() {
    const { user, loading: authLoading, signUpWithEmail, error: authError } = useAuth();
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<CookRegisterInput>({
        resolver: zodResolver(cookRegisterSchema) as never,
    });

    useEffect(() => {
        if (user && !authLoading) {
            if (user.role === "COOK" || user.role === "ADMIN") {
                router.push("/dashboard");
            } else {
                router.push("/become-a-cook");
            }
        }
    }, [user, authLoading, router]);

    const onSubmit = async (data: CookRegisterInput) => {
        await signUpWithEmail(data.email, data.password, data.username);
    };

    // Map Firebase error to friendly messages
    const contextDisplayError = authError?.includes("email-already-in-use")
        ? "This email is already registered. Please login instead."
        : authError;

    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        if (contextDisplayError) {
            setLocalError(contextDisplayError);
            const timer = setTimeout(() => {
                setLocalError(null);
            }, 7000);
            return () => clearTimeout(timer);
        }
    }, [contextDisplayError]);

    return (
        <div className="min-h-[calc(100vh-80px)] flex">
            {/* ── Left: Hero Panel (warm orange) ── */}
            <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #C2410C 0%, #EA580C 30%, #F97316 70%, #FBBF24 100%)" }}>
                <div className="absolute inset-0">
                    <div className="absolute -top-20 -right-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute bottom-20 left-10 h-56 w-56 rounded-full bg-yellow-300/15 blur-3xl" />
                </div>

                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <span className="text-6xl mb-6">🚀</span>
                    <h2 className="text-4xl font-extrabold leading-tight">
                        Start Your<br />
                        Kitchen <br />
                        <span className="text-yellow-200">Business Today</span>
                    </h2>
                    <p className="mt-6 text-lg text-orange-100 leading-relaxed max-w-md">
                        Register as a cook, set up your kitchen, and start accepting orders.
                        Zero commission, zero listing fees.
                    </p>

                    <div className="mt-10 space-y-4">
                        <div className="flex items-center gap-3 text-orange-100">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">✓</span>
                            <span>Free to join — no upfront costs</span>
                        </div>
                        <div className="flex items-center gap-3 text-orange-100">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">✓</span>
                            <span>Set your own prices &amp; menu</span>
                        </div>
                        <div className="flex items-center gap-3 text-orange-100">
                            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold">✓</span>
                            <span>Get discovered by 10K+ customers</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right: Registration Form ── */}
            <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 bg-gradient-to-br from-orange-50/30 to-white dark:from-neutral-900 dark:to-neutral-800">
                <div className="w-full max-w-md animate-slide-up">
                    {/* Mobile hero */}
                    <div className="lg:hidden text-center mb-6">
                        <span className="text-5xl block mb-3">👨‍🍳</span>
                        <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-neutral-50">
                            Register as a Cook
                        </h1>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-0.5 rounded-[1.75rem] bg-gradient-to-r from-orange-400 to-yellow-400 opacity-15 blur-sm" />
                        <div className="relative rounded-3xl border border-orange-200/50 bg-white/90 backdrop-blur-xl p-8 shadow-xl shadow-orange-100/30 dark:bg-neutral-800/90 dark:border-neutral-700 dark:shadow-neutral-900/40">
                            <div className="hidden lg:block text-center mb-6">
                                <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                    Create Cook Account 👨‍🍳
                                </h1>
                                <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                                    Start your kitchen in just 2 minutes
                                </p>
                            </div>

                            {localError && (
                                <div className="mb-6 relative overflow-hidden rounded-2xl border border-red-200 bg-white shadow-xl shadow-red-500/10 dark:border-red-900/50 dark:bg-neutral-800 animate-in fade-in zoom-in-95 duration-300">
                                    <div className="flex items-start gap-4 p-5">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                                            <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-sm font-bold text-neutral-900 dark:text-white">Registration Failed</h3>
                                            <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
                                                {localError}
                                            </p>
                                        </div>
                                        <button onClick={() => setLocalError(null)} className="p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 rounded-lg transition-colors dark:hover:bg-neutral-700 dark:hover:text-neutral-300">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                    <div className="h-1 w-full bg-red-50 dark:bg-red-900/10">
                                        <div className="h-full bg-red-500" style={{ animation: 'shrink 7s linear forwards' }} />
                                    </div>
                                    <style>{`
                                        @keyframes shrink {
                                            from { width: 100%; }
                                            to { width: 0%; }
                                        }
                                    `}</style>
                                </div>
                            )}

                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1.5 dark:text-neutral-300">
                                        Your Name
                                    </label>
                                    <input
                                        {...register("username")}
                                        type="text"
                                        placeholder="Ahmed Khan"
                                        className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200 dark:focus:border-orange-500 dark:focus:ring-orange-900/30"
                                    />
                                    {errors.username && (
                                        <p className="mt-1 text-xs text-red-500">{errors.username.message}</p>
                                    )}
                                </div>

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
                                        <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1.5 dark:text-neutral-300">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <input
                                            {...register("password")}
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Min 8 chars, Aa1@..."
                                            className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50/50 px-4 py-3 pr-12 text-sm focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200 dark:focus:border-orange-500 dark:focus:ring-orange-900/30"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                                        >
                                            {showPassword ? "🙈" : "👁️"}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>
                                    )}
                                    <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                                        Uppercase, lowercase, number, special character required
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-neutral-700 mb-1.5 dark:text-neutral-300">
                                        Confirm Password
                                    </label>
                                    <input
                                        {...register("confirmPassword")}
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Repeat password"
                                        className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200 dark:focus:border-orange-500 dark:focus:ring-orange-900/30"
                                    />
                                    {errors.confirmPassword && (
                                        <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>
                                    )}
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmitting || authLoading}
                                    className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:from-orange-600 hover:to-amber-600 transition-all active:scale-[0.97] disabled:opacity-60"
                                >
                                    {isSubmitting || authLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                            Creating Account...
                                        </span>
                                    ) : "🚀 Create Cook Account"}
                                </button>
                            </form>

                            <div className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                Already have a seller account?{" "}
                                <Link
                                    href="/seller/login"
                                    className="font-bold text-orange-600 hover:underline dark:text-orange-400"
                                >
                                    Login here →
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
