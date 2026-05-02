import React from "react";
import { AnimatedNumber } from "./AnimatedNumber";
import { SensitiveValue } from "./PrivacyMode";

interface KPICardProps {
    title: string;
    value: number | string;
    icon: React.ReactNode;
    trend?: number;
    isCurrency?: boolean;
    isSensitive?: boolean;
}

export function KPICard({
    title,
    value,
    icon,
    trend,
    isCurrency = false,
    isSensitive = false,
}: KPICardProps) {
    const formatValue = (val: number | string) => {
        if (typeof val === "string") return val;
        
        if (isCurrency) {
            return `Rs. ${val.toLocaleString()}`;
        }
        return val.toLocaleString();
    };

    const renderValue = () => {
        if (typeof value === "number") {
            return (
                <AnimatedNumber
                    value={value}
                    formatValue={(v) => formatValue(v)}
                />
            );
        }
        return formatValue(value);
    };

    const content = (
        <div
            style={{
                background: "rgba(26, 29, 36, 0.6)",
                backdropFilter: "blur(20px)",
                WebkitBackdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 16,
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 16,
                transition: "all 0.3s ease",
                cursor: "default",
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.background = "rgba(26, 29, 36, 0.8)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.background = "rgba(26, 29, 36, 0.6)";
                e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                e.currentTarget.style.transform = "translateY(0)";
            }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ color: "#8B8FA8", fontSize: 14, fontWeight: 500 }}>{title}</span>
                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 40,
                        height: 40,
                        borderRadius: 10,
                        background: "rgba(0,212,170,0.1)",
                        color: "#00D4AA",
                    }}
                >
                    {icon}
                </div>
            </div>

            <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <h3
                    style={{
                        color: "#F0F2F5",
                        fontSize: 28,
                        fontWeight: 600,
                        margin: 0,
                        fontFamily: "'JetBrains Mono', monospace",
                        letterSpacing: "-0.5px",
                    }}
                >
                    {isSensitive ? (
                        <SensitiveValue>{renderValue()}</SensitiveValue>
                    ) : (
                        renderValue()
                    )}
                </h3>

                {trend !== undefined && (
                    <span
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                            fontSize: 13,
                            fontWeight: 500,
                            padding: "4px 8px",
                            borderRadius: 6,
                            background: trend >= 0 ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                            color: trend >= 0 ? "#34D399" : "#F87171",
                        }}
                    >
                        {trend >= 0 ? "↑" : "↓"} {Math.abs(trend)}%
                    </span>
                )}
            </div>
        </div>
    );

    return content;
}
