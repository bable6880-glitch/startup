import { type ReactNode, type CSSProperties } from "react";

interface DashboardCardProps {
    children: ReactNode;
    className?: string;
    padding?: "sm" | "md" | "lg";
    style?: CSSProperties;
    /** Apply the hover border glow effect */
    hoverable?: boolean;
}

const paddingMap = {
    sm: "16px",
    md: "20px",
    lg: "24px",
} as const;

export function DashboardCard({
    children,
    className = "",
    padding = "md",
    style,
    hoverable = true,
}: DashboardCardProps) {
    return (
        <div
            className={`dash-card ${className}`}
            style={{
                background: "#283046",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: 12,
                padding: paddingMap[padding],
                color: "#D0D2D6",
                fontFamily: "var(--font-montserrat-var), 'Montserrat', sans-serif",
                ...style,
                ...(hoverable ? {} : { transition: "none" }),
            }}
        >
            {children}
        </div>
    );
}
