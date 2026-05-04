import { AlertCircle, Lock, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KitchenLockedWallProps {
    reason: "expired" | "payment_failed" | "grace_period" | "none";
    currentPlanId?: string | null;
}

export function KitchenLockedWall({ reason, currentPlanId }: KitchenLockedWallProps) {
    if (reason === "none") return null;

    const isFailed = reason === "payment_failed";
    const isGrace = reason === "grace_period";
    const planName = currentPlanId ? currentPlanId.charAt(0).toUpperCase() + currentPlanId.slice(1) : "Premium";

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
            <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-red-100 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-900/50 flex items-center justify-center">
                    <Lock className="w-10 h-10 text-red-500" />
                </div>
                {isFailed && (
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center shadow-lg">
                        <CreditCard className="w-5 h-5 text-orange-500" />
                    </div>
                )}
                {isGrace && (
                    <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-full bg-amber-100 border-2 border-white flex items-center justify-center shadow-lg">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                    </div>
                )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                {isFailed ? "Payment Failed" : isGrace ? "Action Required" : "Subscription Expired"}
            </h1>

            <p className="text-gray-500 dark:text-gray-400 max-w-md text-lg leading-relaxed mb-8">
                {isFailed && `We couldn't process the renewal for your ${planName} plan. Please update your payment method.`}
                {isGrace && `Your ${planName} plan is past due. To maintain full access, please update your billing details.`}
                {reason === "expired" && `Your ${planName} subscription has expired. Renew your plan to unlock all premium features again.`}
            </p>

            <div className="flex gap-4">
                <Button 
                    size="lg" 
                    className="px-8 font-semibold shadow-lg"
                    onClick={() => window.location.href = '/dashboard/subscription'}
                >
                    {isFailed || isGrace ? "Update Payment Method" : "Renew Subscription"}
                </Button>
            </div>
            
            {isGrace && (
                <p className="mt-6 text-sm text-amber-600 dark:text-amber-500 font-medium bg-amber-50 dark:bg-amber-900/10 px-4 py-2 rounded-full">
                    Your kitchen remains active during the 3-day grace period.
                </p>
            )}
        </div>
    );
}
