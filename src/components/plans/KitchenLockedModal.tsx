'use client';

import Link from 'next/link';

interface KitchenLockedModalProps {
    lockReason: string | null;
}

const LOCK_MESSAGES: Record<string, { title: string; message: string; showPacks: boolean }> = {
    ORDER_LIMIT_REACHED: {
        title: 'Order Limit Reached',
        message: 'You have used all your monthly orders. Buy more orders or upgrade your plan to continue accepting orders.',
        showPacks: true,
    },
    SUBSCRIPTION_EXPIRED: {
        title: 'Subscription Expired',
        message: 'Your subscription has expired. Renew your plan to accept orders again.',
        showPacks: false,
    },
    MENU_LIMIT: {
        title: 'Menu Item Limit Reached',
        message: 'You have reached your menu item limit. Remove items or upgrade your plan to add more.',
        showPacks: true,
    },
    PAYMENT_FAILED: {
        title: 'Payment Overdue',
        message: 'Your subscription payment has failed. Update your payment method to keep your kitchen active.',
        showPacks: false,
    },
    ADMIN_ACTION: {
        title: 'Kitchen Suspended',
        message: 'Your kitchen has been temporarily suspended by the platform team. Please contact support.',
        showPacks: false,
    },
};

export function KitchenLockedModal({ lockReason }: KitchenLockedModalProps) {
    const config = LOCK_MESSAGES[lockReason || ''] || LOCK_MESSAGES.ORDER_LIMIT_REACHED;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
                {/* Lock Icon */}
                <div className="flex flex-col items-center pt-10 pb-6">
                    <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                    </div>
                    <h2 className="text-2xl font-black text-neutral-900 dark:text-white">
                        Kitchen Locked 🔒
                    </h2>
                </div>

                <div className="px-8 pb-8 space-y-5">
                    {/* Title */}
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
                        <h3 className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">{config.title}</h3>
                        <p className="text-sm text-red-600 dark:text-red-300 leading-relaxed">{config.message}</p>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3">
                        {config.showPacks && (
                            <Link
                                href="/dashboard/packs"
                                className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-bold rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all"
                            >
                                Buy Extra Pack →
                            </Link>
                        )}
                        <Link
                            href="/dashboard/subscription"
                            className={`flex items-center justify-center gap-2 w-full py-3.5 text-sm font-bold rounded-xl transition-all ${
                                config.showPacks
                                    ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-lg hover:-translate-y-0.5'
                            }`}
                        >
                            {lockReason === 'SUBSCRIPTION_EXPIRED' ? 'Renew Plan →' : 'Upgrade Plan →'}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
