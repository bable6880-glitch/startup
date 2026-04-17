'use client'

import Link from 'next/link'
import { useEffect, useState, useCallback } from 'react'

// ─── Auto Redirect Handler ─────────────────────────────────────────────────
function useAutoRedirect(seconds: number = 8) {
  const [countdown, setCountdown] = useState(seconds)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (paused || countdown <= 0) return
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [paused, countdown])

  useEffect(() => {
    if (countdown === 0 && !paused) {
      window.location.href = '/'
    }
  }, [countdown, paused])

  const pause = useCallback(() => setPaused(true), [])
  const resume = useCallback(() => setPaused(false), [])

  return { countdown, paused, pause, resume }
}

// ─── Animated Tiffin Box SVG ────────────────────────────────────────────────
function TiffinAnimation() {
  return (
    <div className="tiffin-scene" aria-hidden="true">
      {/* Steam wisps */}
      <div className="steam-container">
        <div className="steam steam-1" />
        <div className="steam steam-2" />
        <div className="steam steam-3" />
      </div>

      {/* Tiffin Box */}
      <svg viewBox="0 0 200 180" className="tiffin-svg" xmlns="http://www.w3.org/2000/svg">
        {/* Tiffin Lid — animated to open */}
        <g className="tiffin-lid">
          <ellipse cx="100" cy="35" rx="65" ry="18" fill="#f97316" stroke="#ea580c" strokeWidth="2" />
          <rect x="35" y="20" width="130" height="15" rx="4" fill="#fb923c" stroke="#ea580c" strokeWidth="1.5" />
          {/* Handle */}
          <rect x="88" y="10" width="24" height="10" rx="5" fill="#c2410c" />
          <rect x="92" y="6" width="16" height="8" rx="4" fill="#ea580c" />
        </g>

        {/* Tiffin Body */}
        <g className="tiffin-body">
          {/* Top tier */}
          <rect x="38" y="50" width="124" height="30" rx="6" fill="#fb923c" stroke="#ea580c" strokeWidth="1.5" />
          <ellipse cx="100" cy="50" rx="62" ry="8" fill="#fdba74" stroke="#ea580c" strokeWidth="1" />

          {/* Middle tier */}
          <rect x="38" y="82" width="124" height="30" rx="6" fill="#f97316" stroke="#c2410c" strokeWidth="1.5" />
          <ellipse cx="100" cy="82" rx="62" ry="8" fill="#fb923c" stroke="#ea580c" strokeWidth="1" />

          {/* Bottom tier */}
          <rect x="38" y="114" width="124" height="30" rx="6" fill="#ea580c" stroke="#c2410c" strokeWidth="1.5" />
          <ellipse cx="100" cy="114" rx="62" ry="8" fill="#f97316" stroke="#c2410c" strokeWidth="1" />

          {/* Base */}
          <ellipse cx="100" cy="144" rx="62" ry="8" fill="#c2410c" stroke="#9a3412" strokeWidth="1" />

          {/* Decorative bands */}
          <line x1="42" y1="65" x2="158" y2="65" stroke="#fdba74" strokeWidth="1" opacity="0.6" />
          <line x1="42" y1="97" x2="158" y2="97" stroke="#fdba74" strokeWidth="1" opacity="0.6" />
          <line x1="42" y1="129" x2="158" y2="129" stroke="#fb923c" strokeWidth="1" opacity="0.6" />
        </g>

        {/* Empty text inside — peeks when lid opens */}
        <text x="100" y="72" textAnchor="middle" fontFamily="sans-serif" fontSize="11" fill="#9a3412" opacity="0.7" className="empty-text">
          empty!
        </text>

        {/* Sad face on middle tier */}
        <g className="sad-face" opacity="0.5">
          <circle cx="88" cy="100" r="2" fill="#7c2d12" />
          <circle cx="112" cy="100" r="2" fill="#7c2d12" />
          <path d="M 90 108 Q 100 104 110 108" fill="none" stroke="#7c2d12" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </svg>

      {/* Floating food particles */}
      <div className="particle particle-1">🍚</div>
      <div className="particle particle-2">🥗</div>
      <div className="particle particle-3">🍛</div>
      <div className="particle particle-4">🥄</div>
      <div className="particle particle-5">🌶️</div>
    </div>
  )
}

// ─── Main 404 Page ──────────────────────────────────────────────────────────
export default function NotFound() {
  const { countdown, paused, pause } = useAutoRedirect(8)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      <style jsx global>{`
        /* ─── Tiffin Scene ─────────────────────────────────── */
        .tiffin-scene {
          position: relative;
          width: 240px;
          height: 240px;
          margin: 0 auto;
        }

        @media (min-width: 640px) {
          .tiffin-scene {
            width: 300px;
            height: 300px;
          }
        }

        .tiffin-svg {
          width: 100%;
          height: 100%;
          filter: drop-shadow(0 8px 24px rgba(249, 115, 22, 0.25));
        }

        /* ─── Lid Animation ────────────────────────────────── */
        .tiffin-lid {
          transform-origin: 100px 35px;
          animation: lid-bounce 3s ease-in-out infinite;
        }

        @keyframes lid-bounce {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          30% { transform: translateY(-28px) rotate(-12deg); }
          50% { transform: translateY(-32px) rotate(-15deg); }
          70% { transform: translateY(-28px) rotate(-12deg); }
        }

        /* ─── Empty text fade ──────────────────────────────── */
        .empty-text {
          animation: text-peek 3s ease-in-out infinite;
        }

        @keyframes text-peek {
          0%, 15%, 85%, 100% { opacity: 0; }
          35%, 65% { opacity: 0.7; }
        }

        /* ─── Sad face ─────────────────────────────────────── */
        .sad-face {
          animation: face-sad 3s ease-in-out infinite;
        }

        @keyframes face-sad {
          0%, 100% { opacity: 0.5; }
          40%, 60% { opacity: 0.9; }
        }

        /* ─── Steam ────────────────────────────────────────── */
        .steam-container {
          position: absolute;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          width: 80px;
          height: 60px;
          z-index: 10;
        }

        .steam {
          position: absolute;
          bottom: 0;
          width: 8px;
          height: 20px;
          background: linear-gradient(to top, rgba(251, 146, 60, 0.3), transparent);
          border-radius: 50%;
          animation: steam-rise 2.5s ease-out infinite;
        }

        .steam-1 { left: 20%; animation-delay: 0s; }
        .steam-2 { left: 50%; animation-delay: 0.8s; }
        .steam-3 { left: 75%; animation-delay: 1.6s; }

        @keyframes steam-rise {
          0% { opacity: 0; transform: translateY(0) scaleX(1); height: 20px; }
          30% { opacity: 0.6; }
          100% { opacity: 0; transform: translateY(-50px) scaleX(2.5); height: 35px; }
        }

        /* ─── Floating Particles ───────────────────────────── */
        .particle {
          position: absolute;
          font-size: 1.25rem;
          animation: float-away 4s ease-out infinite;
          opacity: 0;
          pointer-events: none;
        }

        .particle-1 { top: 30%; left: 5%; animation-delay: 0s; }
        .particle-2 { top: 20%; right: 5%; animation-delay: 0.7s; }
        .particle-3 { top: 45%; left: 0; animation-delay: 1.4s; }
        .particle-4 { top: 50%; right: 0; animation-delay: 2.1s; }
        .particle-5 { top: 15%; left: 15%; animation-delay: 2.8s; }

        @keyframes float-away {
          0% { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(0.5); }
          20% { opacity: 0.9; transform: translate(-10px, -15px) rotate(30deg) scale(1); }
          100% { opacity: 0; transform: translate(-30px, -70px) rotate(120deg) scale(0.3); }
        }

        /* ─── Progress Ring ────────────────────────────────── */
        .redirect-ring {
          transform: rotate(-90deg);
        }

        .redirect-ring circle {
          transition: stroke-dashoffset 1s linear;
        }

        /* ─── Reduced Motion ───────────────────────────────── */
        @media (prefers-reduced-motion: reduce) {
          .tiffin-lid,
          .empty-text,
          .sad-face,
          .steam,
          .particle {
            animation: none !important;
          }
          .tiffin-lid {
            transform: translateY(-28px) rotate(-12deg);
          }
          .empty-text {
            opacity: 0.7;
          }
          .particle {
            display: none;
          }
        }

        /* ─── Page entrance ────────────────────────────────── */
        .not-found-enter {
          animation: page-enter 0.6s ease-out both;
        }

        @keyframes page-enter {
          from { opacity: 0; transform: translateY(30px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .btn-bounce:active {
          transform: scale(0.95);
        }
      `}</style>

      <main
        className={`min-h-[calc(100vh-80px)] flex items-center justify-center px-4 py-12 sm:py-20 ${mounted ? 'not-found-enter' : 'opacity-0'}`}
        role="main"
        aria-label="Page not found"
      >
        <div className="text-center max-w-lg mx-auto">

          {/* 404 Badge */}
          <div
            className="inline-flex items-center gap-2 rounded-full bg-primary-100/80 px-5 py-2 text-sm font-bold text-primary-700 mb-8 dark:bg-primary-900/40 dark:text-primary-300"
            aria-hidden="true"
          >
            <span className="text-base">🚫</span>
            Error 404
          </div>

          {/* Animation */}
          <TiffinAnimation />

          {/* Headline */}
          <h1 className="mt-8 text-3xl sm:text-4xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-50">
            {"Oops! This page is "}
            <span className="text-gradient">not on the menu</span>
            {" 🍽️"}
          </h1>

          {/* Subtext */}
          <p className="mt-4 text-base sm:text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-md mx-auto">
            Looks like you took a wrong bite. Let&apos;s get you back to something delicious!
          </p>

          {/* CTA Buttons */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
            <Link
              href="/"
              onClick={pause}
              className="btn-bounce w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-primary-500 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-primary-500/30 hover:bg-primary-600 hover:shadow-xl hover:shadow-primary-500/40 transition-all duration-200 active:scale-95"
              aria-label="Go to homepage"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Go to Home
            </Link>

            <Link
              href="/explore"
              onClick={pause}
              className="btn-bounce w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl border-2 border-primary-300 bg-white px-8 py-3.5 text-sm font-bold text-primary-600 hover:bg-primary-50 hover:border-primary-400 transition-all duration-200 active:scale-95 dark:bg-neutral-800 dark:border-primary-700 dark:text-primary-400 dark:hover:bg-neutral-700"
              aria-label="Browse kitchens"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Browse Kitchens
            </Link>
          </div>

          {/* Auto Redirect Timer */}
          {!paused && countdown > 0 && (
            <div className="mt-8 flex flex-col items-center gap-2 animate-fade-in">
              <div className="relative w-12 h-12">
                <svg className="redirect-ring w-12 h-12" viewBox="0 0 44 44" aria-hidden="true">
                  <circle
                    cx="22" cy="22" r="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className="text-neutral-200 dark:text-neutral-700"
                  />
                  <circle
                    cx="22" cy="22" r="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="text-primary-500"
                    strokeDasharray={113}
                    strokeDashoffset={113 - (113 * (8 - countdown)) / 8}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-neutral-600 dark:text-neutral-300">
                  {countdown}s
                </span>
              </div>
              <p className="text-xs text-neutral-400 dark:text-neutral-500">
                Redirecting to home...
              </p>
            </div>
          )}

          {paused && (
            <p className="mt-6 text-xs text-neutral-400 dark:text-neutral-500 animate-fade-in">
              Auto-redirect paused
            </p>
          )}

          {/* Security note — invisible to user, safe for crawlers */}
          <div className="sr-only" aria-hidden="true">
            This page is displayed for all invalid or unauthorized access attempts.
            No internal system information is exposed.
          </div>
        </div>
      </main>
    </>
  )
}
