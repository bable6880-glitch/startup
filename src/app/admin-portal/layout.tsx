import type { Metadata } from "next";
import { PrivacyProvider } from "./_components/PrivacyMode";
import { ClientLayoutWrapper } from "./_components/ClientLayoutWrapper";

export const metadata: Metadata = {
    title: "Admin Portal — Smart Tiffin",
    robots: { index: false, follow: false },
};

export default function AdminPortalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div
            className="fixed inset-0 z-[9999]"
            style={{
                background: "#0A0B0D",
                fontFamily: "'DM Sans', 'Inter', system-ui, sans-serif",
            }}
        >
            {/* Animated gradient orbs — CSS only */}
            <div
                aria-hidden
                style={{
                    position: "fixed",
                    inset: 0,
                    zIndex: 0,
                    overflow: "hidden",
                    pointerEvents: "none",
                }}
            >
                <div
                    style={{
                        position: "absolute",
                        width: 800,
                        height: 800,
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle, rgba(0,212,170,0.04) 0%, transparent 70%)",
                        top: -200,
                        right: -200,
                        animation: "adminOrbFloat1 20s ease-in-out infinite",
                    }}
                />
                <div
                    style={{
                        position: "absolute",
                        width: 600,
                        height: 600,
                        borderRadius: "50%",
                        background:
                            "radial-gradient(circle, rgba(59,130,246,0.03) 0%, transparent 70%)",
                        bottom: -100,
                        left: -100,
                        animation: "adminOrbFloat2 25s ease-in-out infinite",
                    }}
                />
            </div>

            <PrivacyProvider>
                <ClientLayoutWrapper>
                    {/* Preload Google Fonts (non-blocking, replaces render-blocking @import) */}
                    <link
                        rel="preconnect"
                        href="https://fonts.googleapis.com"
                    />
                    <link
                        rel="preconnect"
                        href="https://fonts.gstatic.com"
                        crossOrigin="anonymous"
                    />
                    <link
                        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
                        rel="stylesheet"
                    />
                    {children}
                </ClientLayoutWrapper>
            </PrivacyProvider>

            {/* Keyframe animations */}
            <style>{`

                @keyframes adminOrbFloat1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -30px) scale(1.05); }
                    66% { transform: translate(-20px, 20px) scale(0.95); }
                }
                @keyframes adminOrbFloat2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-25px, 25px) scale(1.05); }
                    66% { transform: translate(15px, -15px) scale(0.95); }
                }
                @keyframes adminFadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes adminShake {
                    0%, 100% { transform: translateX(0); }
                    15% { transform: translateX(-8px); }
                    30% { transform: translateX(8px); }
                    45% { transform: translateX(-4px); }
                    60% { transform: translateX(4px); }
                    75% { transform: translateX(-2px); }
                    90% { transform: translateX(2px); }
                }
            `}</style>
        </div>
    );
}
