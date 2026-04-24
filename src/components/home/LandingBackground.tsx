/**
 * LandingBackground – Ultra-lightweight SVG + CSS background system
 * 
 * Performance: ~4KB gzipped, 0 network requests (all inline)
 * Renders: Single composite layer, GPU-friendly (no blur filters)
 * Mobile: Simplified on <640px, hidden decorative elements on <480px
 * A11y: All decorative, aria-hidden, pointer-events-none
 */

export function HeroBackground() {
  return (
    <div
      className="landing-bg-hero"
      aria-hidden="true"
    >
      {/* Base gradient layer — pure CSS */}
      <div className="landing-bg-hero__gradient" />

      {/* Organic blob shapes — inline SVG, ~2KB */}
      <svg
        className="landing-bg-hero__blobs"
        viewBox="0 0 1440 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Top-right warm blob */}
        <ellipse
          cx="1200"
          cy="120"
          rx="320"
          ry="280"
          fill="#f97316"
          opacity="0.04"
        />
        {/* Bottom-left green blob */}
        <ellipse
          cx="200"
          cy="650"
          rx="350"
          ry="300"
          fill="#22c55e"
          opacity="0.035"
        />
        {/* Center-right soft accent */}
        <ellipse
          cx="900"
          cy="500"
          rx="200"
          ry="180"
          fill="#f97316"
          opacity="0.025"
        />
      </svg>

      {/* Subtle decorative elements — leaf outlines + grain dots */}
      <svg
        className="landing-bg-hero__decor"
        viewBox="0 0 1440 800"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Leaf outline — top right */}
        <g opacity="0.045" transform="translate(1100, 80) rotate(25) scale(1.2)">
          <path
            d="M0 60C0 60 15-5 50-15C85-25 120 5 120 5C120 5 85 45 50 55C15 65 0 60 0 60Z"
            stroke="#22c55e"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M10 55C30 35 60 20 110 10"
            stroke="#22c55e"
            strokeWidth="1"
            fill="none"
          />
        </g>

        {/* Leaf outline — bottom left */}
        <g opacity="0.04" transform="translate(80, 520) rotate(-15) scale(1.5)">
          <path
            d="M0 60C0 60 15-5 50-15C85-25 120 5 120 5C120 5 85 45 50 55C15 65 0 60 0 60Z"
            stroke="#16a34a"
            strokeWidth="1.5"
            fill="none"
          />
          <path
            d="M10 55C30 35 60 20 110 10"
            stroke="#16a34a"
            strokeWidth="1"
            fill="none"
          />
        </g>

        {/* Small leaf — mid right */}
        <g opacity="0.035" transform="translate(1250, 400) rotate(45) scale(0.8)">
          <path
            d="M0 40C0 40 10-3 35-10C60-17 80 3 80 3C80 3 55 30 35 37C15 44 0 40 0 40Z"
            stroke="#22c55e"
            strokeWidth="1.2"
            fill="none"
          />
        </g>

        {/* Grain dots — scattered, very faint */}
        <g opacity="0.06">
          <circle cx="300" cy="150" r="1.5" fill="#d4d4d4" />
          <circle cx="500" cy="300" r="1" fill="#d4d4d4" />
          <circle cx="700" cy="100" r="1.5" fill="#d4d4d4" />
          <circle cx="900" cy="350" r="1" fill="#d4d4d4" />
          <circle cx="1100" cy="200" r="1.5" fill="#d4d4d4" />
          <circle cx="400" cy="500" r="1" fill="#d4d4d4" />
          <circle cx="600" cy="600" r="1.5" fill="#d4d4d4" />
          <circle cx="800" cy="450" r="1" fill="#d4d4d4" />
          <circle cx="1000" cy="550" r="1.5" fill="#d4d4d4" />
          <circle cx="200" cy="350" r="1" fill="#d4d4d4" />
          <circle cx="1300" cy="500" r="1" fill="#d4d4d4" />
          <circle cx="150" cy="200" r="1.5" fill="#d4d4d4" />
        </g>

        {/* Subtle curved flow line — guides eye toward CTA */}
        <path
          d="M-50 200 Q400 100 720 350 Q1040 600 1500 400"
          stroke="#22c55e"
          strokeWidth="1"
          opacity="0.03"
          fill="none"
        />
      </svg>
    </div>
  );
}

export function SectionBackground({ variant = 'subtle' }: { variant?: 'subtle' | 'warm' | 'green' }) {
  const classMap = {
    subtle: 'landing-bg-section--subtle',
    warm: 'landing-bg-section--warm',
    green: 'landing-bg-section--green',
  };

  return (
    <div
      className={`landing-bg-section ${classMap[variant]}`}
      aria-hidden="true"
    />
  );
}
