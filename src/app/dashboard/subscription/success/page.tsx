"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SubscriptionSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const sessionId = searchParams.get("session_id");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (sessionId) {
            // Optional: verify session with backend here
            setLoading(false);
        } else {
            router.push("/dashboard/subscription");
        }
    }, [sessionId, router]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-muted-foreground animate-pulse">Verifying payment...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-3">
                Payment Successful!
            </h1>
            <p className="text-muted-foreground max-w-md mb-8">
                Your subscription has been upgraded. Welcome to your new Smart Tiffin Premium experience. Your premium features are now active.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => router.push("/dashboard")}>
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
