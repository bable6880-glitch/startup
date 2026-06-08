interface SparklineProps {
    data: number[];
    color?: string;
    width?: number;
    height?: number;
    strokeWidth?: number;
}

/**
 * Inline SVG sparkline — no external library needed.
 * Draws a smooth polyline from the data array.
 * No axes, no labels, no fill.
 */
export function Sparkline({
    data,
    color = "#28C76F",
    width = 80,
    height = 36,
    strokeWidth = 2,
}: SparklineProps) {
    if (!data || data.length < 2) return null;

    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;

    const pad = strokeWidth;
    const innerW = width - pad * 2;
    const innerH = height - pad * 2;

    const points = data.map((val, i) => {
        const x = pad + (i / (data.length - 1)) * innerW;
        const y = pad + (1 - (val - min) / range) * innerH;
        return `${x.toFixed(2)},${y.toFixed(2)}`;
    });

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            style={{ display: "block", overflow: "visible" }}
        >
            <polyline
                points={points.join(" ")}
                fill="none"
                stroke={color}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
