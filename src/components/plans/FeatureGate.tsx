"use client";

import { ReactNode } from "react";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeatureGateProps {
    hasFeature: boolean;
    featureName: string;
    children: ReactNode;
    fallback?: ReactNode;
}

export function FeatureGate({ hasFeature, featureName, children, fallback }: FeatureGateProps) {
    if (hasFeature) {
        return <>{children}</>;
    }

    if (fallback) {
        return <>{fallback}</>;
    }

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/50 rounded-lg border border-dashed">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">{featureName} is a Premium Feature</h3>
            <p className="text-muted-foreground text-sm max-w-md mb-6">
                Upgrade your subscription plan to unlock {featureName.toLowerCase()} and grow your kitchen business.
            </p>
            <Button onClick={() => window.location.href = '/dashboard/subscription'} variant="default">
                View Plans
            </Button>
        </div>
    );
}
