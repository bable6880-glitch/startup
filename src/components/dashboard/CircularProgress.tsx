interface CircularProgressProps {
    /** 0–100 */
    percentage: number;
    color: string;
    size?: number;
    strokeWidth?: number;
    children?: React.ReactNode;
}

/**
 * SVG circular progress ring.
 * Used in stat cards (Users, Sessions, Bounce Rate style widgets).
 */
export function CircularProgress({
    percentage,
    color,
    size = 52,
    strokeWidth = 3,
    children,
}: CircularProgressProps) {
    const center = size / 2;
    const radius = center - strokeWidth;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference * (1 - Math.min(Math.max(percentage, 0), 100) / 100);

    return (
        <div style={{ position: "relative", width: size, height: size, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg
                width={size}
                height={size}
                viewBox={`0 0 ${size} ${size}`}
                style={{ position: "absolute", inset: 0 }}
            >
                {/* Track */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="rgba(255,255,255,0.08)"
                    strokeWidth={strokeWidth}
                />
                {/* Progress arc */}
                <circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke={color}
                    strokeWidth={strokeWidth}
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={`${offset}`}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${center} ${center})`}
                    style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
            </svg>
            {children && (
                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {children}
                </div>
            )}
        </div>
    );
}
