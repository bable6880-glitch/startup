"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, Suspense } from "react";
import Link from "next/link";

function LoginContent() {
    const { user, loading, error, signInWithGoogle } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect") || "/explore";

    useEffect(() => {
        if (user && !loading) {
            if (user.role === "COOK" || user.role === "ADMIN") {
                router.push("/dashboard");
            } else {
                router.push(redirect);
            }
        }
    }, [user, loading, redirect, router]);

    // While Firebase is processing auth state (initial load OR returning from
    // Google redirect), show a full-screen spinner. This prevents the login
    // form from flashing and gives the user visual feedback.
    if (loading || user) {
        return (
            <div className="min-h-[calc(100vh-80px)] flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                <p className="text-sm font-medium text-neutral-500 dark:text-neutral-400 animate-pulse">
                    {user ? "Redirecting you…" : "Signing you in…"}
                </p>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-80px)] flex">
            {/* ── Left: Hero Panel ── */}
            <div className="hidden lg:flex lg:w-1/2 relative bg-gradient-to-br from-primary-600 via-primary-500 to-accent-500 overflow-hidden">
                {/* Background shapes */}
                <div className="absolute inset-0">
                    <div className="absolute -top-20 -left-20 h-72 w-72 rounded-full bg-white/10 blur-2xl" />
                    <div className="absolute bottom-10 right-10 h-56 w-56 rounded-full bg-accent-400/20 blur-3xl" />
                    <div className="absolute top-1/2 left-1/3 h-40 w-40 rounded-full bg-primary-300/15 blur-2xl" />
                </div>

                <div className="relative z-10 flex flex-col justify-center px-16 text-white">
                    <span className="text-6xl mb-6">🍱</span>
                    <h2 className="text-4xl font-extrabold leading-tight">
                        Discover <br />
                        Home-Cooked <br />
                        <span className="text-accent-200">Deliciousness</span>
                    </h2>
                    <p className="mt-6 text-lg text-primary-100 leading-relaxed max-w-md">
                        Browse authentic kitchens, check ratings, and order fresh meals
                        made with love — delivered right to your door.
                    </p>

                    <div className="mt-10 flex gap-8">
                        <div>
                            <p className="text-3xl font-bold">500+</p>
                            <p className="text-sm text-primary-200">Home Kitchens</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">10K+</p>
                            <p className="text-sm text-primary-200">Happy Customers</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold">6</p>
                            <p className="text-sm text-primary-200">Cities</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Right: Login Form ── */}
            <div className="flex w-full items-center justify-center px-6 py-12 lg:w-1/2 bg-gradient-to-br from-neutral-50 to-white dark:from-neutral-900 dark:to-neutral-800">
                <div className="w-full max-w-md animate-slide-up">
                    {/* Mobile hero accent */}
                    <div className="lg:hidden text-center mb-8">
                        <span className="text-5xl block mb-3">🍱</span>
                        <h1 className="text-3xl font-extrabold text-neutral-900 dark:text-neutral-50">
                            Smart Tiffin
                        </h1>
                        <p className="mt-1 text-neutral-500 dark:text-neutral-400">
                            Home-cooked meals, delivered fresh
                        </p>
                    </div>

                    {/* Card */}
                    <div className="rounded-3xl border border-neutral-200/70 bg-white/80 backdrop-blur-xl p-8 shadow-xl shadow-neutral-200/40 dark:bg-neutral-800/80 dark:border-neutral-700 dark:shadow-neutral-900/40">
                        <div className="hidden lg:block text-center mb-8">
                            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                Welcome Back 👋
                            </h1>
                            <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                                Sign in to order delicious home-cooked food
                            </p>
                        </div>

                        {error && (
                            <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300 flex items-center gap-2">
                                <span>⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            onClick={signInWithGoogle}
                            disabled={loading}
                            className="group w-full flex items-center justify-center gap-3 rounded-2xl border-2 border-neutral-200 bg-white px-5 py-4 text-sm font-semibold text-neutral-700 shadow-sm hover:border-primary-300 hover:shadow-lg hover:shadow-primary-100/50 transition-all duration-300 active:scale-[0.97] disabled:opacity-60 dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200 dark:hover:border-primary-500 dark:hover:shadow-primary-900/20"
                        >
                            <svg className="h-5 w-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            {loading ? "Signing in..." : "Continue with Google"}
                        </button>

                        <div className="relative my-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-neutral-200 dark:border-neutral-700" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-4 text-xs text-neutral-400 uppercase tracking-widest dark:bg-neutral-800 dark:text-neutral-500">
                                    or
                                </span>
                            </div>
                        </div>

                        <button
                            disabled
                            className="w-full flex items-center justify-center gap-3 rounded-2xl bg-[#25D366]/5 border-2 border-[#25D366]/20 px-5 py-4 text-sm font-semibold text-[#25D366] transition-all opacity-50 cursor-not-allowed"
                        >
                            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                            </svg>
                            WhatsApp OTP (Coming Soon)
                        </button>

                        <p className="mt-8 text-center text-xs text-neutral-400 dark:text-neutral-500">
                            By signing in you agree to our{" "}
                            <a href="/privacy" className="underline hover:text-primary-600 transition-colors">Privacy Policy</a>
                        </p>
                    </div>

                    {/* Seller CTA */}
                    <div className="mt-6 rounded-2xl border border-neutral-200/60 bg-white/60 backdrop-blur-sm p-5 text-center dark:bg-neutral-800/60 dark:border-neutral-700">
                        <p className="text-sm text-neutral-500 dark:text-neutral-400">
                            Want to sell home food?{" "}
                            <Link href="/seller/register" className="font-bold text-accent-600 hover:underline dark:text-accent-400">
                                Register as Cook →
                            </Link>
                        </p>
                        <p className="mt-1.5 text-xs text-neutral-400 dark:text-neutral-500">
                            Already a seller?{" "}
                            <Link href="/seller/login" className="font-semibold text-primary-600 hover:underline dark:text-primary-400">
                                Seller Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={
            <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
        }>
            <LoginContent />
        </Suspense>
    );
}
