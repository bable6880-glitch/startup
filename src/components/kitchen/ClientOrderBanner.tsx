"use client";

import { useAuth } from "@/lib/firebase/auth-context";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function ClientOrderBanner({ kitchenName }: { kitchenName: string }) {
    const { user, loading } = useAuth();
    const pathname = usePathname();

    if (loading || user) return null;

    return (
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-orange-50 to-orange-100/50 p-4 border border-orange-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 dark:from-orange-950/30 dark:to-orange-900/10 dark:border-orange-900">
            <div className="flex items-start gap-3">
                <div className="bg-orange-100 p-2 rounded-xl text-orange-600 mt-1 sm:mt-0 dark:bg-orange-900/50 dark:text-orange-400">
                    👋
                </div>
                <div>
                    <h3 className="text-sm font-bold text-orange-900 dark:text-orange-100">Sign in to order</h3>
                    <p className="text-xs text-orange-700/80 mt-0.5 dark:text-orange-300">
                        Create an account to order from {kitchenName}
                    </p>
                </div>
            </div>
            <Link 
                href={`/login?redirect=${encodeURIComponent(pathname)}`}
                className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm transition-all text-center whitespace-nowrap active:scale-95"
            >
                Sign In
            </Link>
        </div>
    );
}
