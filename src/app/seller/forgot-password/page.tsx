"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
    const { sendPasswordReset, error: authError } = useAuth();
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setLoading(true);
        const success = await sendPasswordReset(email.trim());
        setLoading(false);

        if (success) {
            setSent(true);
        }
    };

    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-orange-50/30 to-white dark:from-neutral-900 dark:to-neutral-800">
            <div className="w-full max-w-md animate-slide-up">
                <div className="relative">
                    <div className="absolute -inset-0.5 rounded-[1.75rem] bg-gradient-to-r from-orange-400 to-yellow-400 opacity-15 blur-sm" />
                    <div className="relative rounded-3xl border border-orange-200/50 bg-white/90 backdrop-blur-xl p-8 shadow-xl shadow-orange-100/30 dark:bg-neutral-800/90 dark:border-neutral-700">

                        {!sent ? (
                            <>
                                <div className="text-center mb-8">
                                    <span className="text-5xl block mb-4">🔑</span>
                                    <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                        Reset Password
                                    </h1>
                                    <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
                                        Enter your registered email address and we&apos;ll send you
                                        a password reset link.
                                    </p>
                                </div>

                                {authError && (
                                    <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300 flex items-center gap-2">
                                        <span>⚠️</span>
                                        <span>{authError}</span>
                                    </div>
                                )}

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-neutral-700 mb-1.5 dark:text-neutral-300">
                                            Email Address
                                        </label>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="cook@example.com"
                                            required
                                            className="w-full rounded-xl border-2 border-neutral-200 bg-neutral-50/50 px-4 py-3 text-sm focus:border-orange-400 focus:ring-4 focus:ring-orange-100 outline-none transition-all dark:bg-neutral-700 dark:border-neutral-600 dark:text-neutral-200 dark:focus:border-orange-500 dark:focus:ring-orange-900/30"
                                        />
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={loading || !email.trim()}
                                        className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-orange-500/25 hover:shadow-xl hover:from-orange-600 hover:to-orange-700 transition-all active:scale-[0.97] disabled:opacity-60"
                                    >
                                        {loading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                                Sending...
                                            </span>
                                        ) : "Send Reset Link 📧"}
                                    </button>
                                </form>
                            </>
                        ) : (
                            <div className="text-center py-4">
                                <span className="text-5xl block mb-4">✅</span>
                                <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50">
                                    Check Your Email 😊!
                                </h2>
                                <p className="mt-3 text-sm text-neutral-500 dark:text-neutral-400 leading-relaxed">
                                    We&apos;ve sent a password reset link to <br />
                                    <strong className="text-neutral-900 dark:text-neutral-200">{email}</strong>
                                </p>
                                <p className="mt-4 text-xs text-neutral-400 dark:text-neutral-500">
                                    Didn&apos;t receive it? Check your spam folder 😎 or{" "}
                                    <button
                                        onClick={() => setSent(false)}
                                        className="text-orange-600 font-semibold hover:underline dark:text-orange-400"
                                    >
                                        try again 😋
                                    </button>
                                </p>

                                <Link
                                    href="/seller/login"
                                    className="mt-8 inline-block rounded-xl bg-neutral-100 px-6 py-2.5 text-sm font-semibold text-neutral-700 hover:bg-neutral-200 transition-all dark:bg-neutral-700 dark:text-neutral-200 dark:hover:bg-neutral-600"
                                >
                                    ← Back to Login 🚀
                                </Link>
                            </div>
                        )}

                        {!sent && (
                            <div className="mt-6 text-center text-sm text-neutral-500 dark:text-neutral-400">
                                Remember your password?{" "}
                                <Link
                                    href="/seller/login"
                                    className="font-bold text-orange-600 hover:underline dark:text-orange-400"
                                >
                                    Login here → 🌟
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
