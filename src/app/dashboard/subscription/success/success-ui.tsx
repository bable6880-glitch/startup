"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const PLAN_ICONS: Record<string, string> = {
    starter: "🌱",
    growth: "📈",
    pro: "⚡",
    elite: "👑",
};

const PLAN_GRADIENTS: Record<string, string> = {
    starter: "from-gray-500 to-gray-700",
    growth: "from-orange-500 to-amber-500",
    pro: "from-blue-500 to-blue-700",
    elite: "from-purple-600 to-purple-900",
};

const CONFETTI_COLORS = [
    "#FF6B35", "#F7C59F", "#EFEFD0", "#004E89", "#1A936F",
    "#F18F01", "#C73E1D", "#3B1F2B", "#44BBA4", "#E94F37",
];

function useCountdown(seconds: number, onDone: () => void) {
    const [remaining, setRemaining] = useState(seconds);
    useEffect(() => {
        if (remaining <= 0) { onDone(); return; }
        const t = setTimeout(() => setRemaining(r => r - 1), 1000);
        return () => clearTimeout(t);
    }, [remaining]);
    return remaining;
}

export function SuccessUI({
    planName,
    planId,
    redirectUrl,
}: {
    planName: string;
    planId?: string;
    redirectUrl: string;
}) {
    const router = useRouter();
    const remaining = useCountdown(5, () => router.push(redirectUrl));

    const id = planId ?? planName.toLowerCase();
    const icon = PLAN_ICONS[id] ?? "🎉";
    const gradient = PLAN_GRADIENTS[id] ?? "from-orange-500 to-amber-500";

    const progress = ((5 - remaining) / 5) * 100;

    return (
        <>
            <style dangerouslySetInnerHTML={{ __html: `
                @keyframes fall {
                    0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
                }
                @keyframes checkIn {
                    0%   { transform: scale(0) rotate(-45deg); opacity: 0; }
                    60%  { transform: scale(1.15) rotate(8deg); opacity: 1; }
                    80%  { transform: scale(0.95) rotate(-3deg); }
                    100% { transform: scale(1) rotate(0deg); }
                }
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(16px); }
                    to   { opacity: 1; transform: translateY(0); }
                }
                @keyframes shimmer {
                    0%   { background-position: -200% 0; }
                    100% { background-position: 200% 0; }
                }
                .success-check { animation: checkIn 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275) 0.2s both; }
                .success-title { animation: fadeUp 0.5s ease 0.7s both; }
                .success-sub   { animation: fadeUp 0.5s ease 0.9s both; }
                .success-badge { animation: fadeUp 0.5s ease 1.1s both; }
                .success-bar   { animation: fadeUp 0.5s ease 1.3s both; }
                .confetti-piece {
                    position: fixed;
                    width: 10px;
                    height: 10px;
                    border-radius: 2px;
                    animation: fall linear forwards;
                    pointer-events: none;
                }
            ` }} />

            {/* Confetti */}
            {Array.from({ length: 60 }).map((_, i) => (
                <div
                    key={i}
                    className="confetti-piece"
                    style={{
                        left: `${Math.random() * 100}vw`,
                        top: `-${Math.random() * 20}px`,
                        backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
                        width: `${6 + Math.random() * 8}px`,
                        height: `${6 + Math.random() * 8}px`,
                        animationDuration: `${2.5 + Math.random() * 3}s`,
                        animationDelay: `${Math.random() * 1.5}s`,
                        borderRadius: Math.random() > 0.5 ? "50%" : "2px",
                    }}
                />
            ))}

            {/* Full-screen layout */}
            <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

                {/* Background glow orbs */}
                <div className={`absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-gradient-to-br ${gradient} opacity-[0.08] blur-[80px] pointer-events-none`} />
                <div className="absolute bottom-1/4 right-1/3 w-64 h-64 rounded-full bg-blue-500 opacity-[0.06] blur-[60px] pointer-events-none" />

                {/* Card */}
                <div className="relative z-10 w-full max-w-md">
                    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl text-center">

                        {/* Check mark */}
                        <div className="success-check flex items-center justify-center mx-auto mb-7">
                            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl`}>
                                <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>

                        <h1 className="success-title text-3xl sm:text-4xl font-extrabold text-white mb-3 tracking-tight">
                            Congratulations! 🎉
                        </h1>

                        <p className="success-sub text-white/60 text-base mb-7">
                            Your subscription is now active and all premium features are unlocked.
                        </p>

                        {/* Plan badge */}
                        <div className={`success-badge inline-flex items-center gap-2.5 bg-gradient-to-r ${gradient} text-white font-bold text-base px-6 py-3 rounded-2xl shadow-lg mb-8`}>
                            <span className="text-2xl">{icon}</span>
                            <div className="text-left">
                                <p className="text-[10px] font-semibold uppercase tracking-widest opacity-80">Active Plan</p>
                                <p className="text-lg font-extrabold leading-tight">{planName}</p>
                            </div>
                        </div>

                        {/* Countdown bar */}
                        <div className="success-bar">
                            <div className="flex items-center justify-between text-xs text-white/40 mb-2">
                                <span>Redirecting to dashboard</span>
                                <span>{remaining}s</span>
                            </div>
                            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-1000 ease-linear`}
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>

                        <button
                            onClick={() => router.push(redirectUrl)}
                            className={`mt-6 w-full py-3.5 rounded-2xl bg-gradient-to-r ${gradient} text-white font-bold text-sm hover:shadow-xl transition-all duration-200 hover:-translate-y-0.5`}
                        >
                            Go to Dashboard →
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}
