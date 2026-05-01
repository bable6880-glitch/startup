"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SuccessUI({
    planName,
    redirectUrl
}: {
    planName: string;
    redirectUrl: string;
}) {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.push(redirectUrl);
        }, 4000);
        return () => clearTimeout(timer);
    }, [router, redirectUrl]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight mb-3">
                Payment Successful!
            </h1>
            <p className="text-muted-foreground max-w-md mb-8">
                🎉 {planName} plan is now active! Your premium features are unlocked and ready to use.
            </p>
            <div className="flex gap-4">
                <Button onClick={() => router.push(redirectUrl)}>
                    Go to Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
