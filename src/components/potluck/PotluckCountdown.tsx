'use client';

// PotluckCountdown.tsx
// Animated countdown timer using requestAnimationFrame.
// Renders: "35h 48m 12s" for > 1 hour remaining
//          "48m 12s" for < 1 hour
//          "12s" for < 1 minute — shown in RED with pulse
//          "Expired" when expired

import { useState, useEffect, useRef } from 'react';

interface PotluckCountdownProps {
  expiresAt: string; // ISO date string
  className?: string;
}

function getTimeRemaining(expiresAt: string) {
  const total = new Date(expiresAt).getTime() - Date.now();
  if (total <= 0) return { hours: 0, minutes: 0, seconds: 0, isExpired: true, isUrgent: true, totalMs: 0 };

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor(total / 1000 / 60 / 60);
  const isUrgent = total < 6 * 60 * 60 * 1000; // < 6 hours

  return { hours, minutes, seconds, isExpired: false, isUrgent, totalMs: total };
}

export function PotluckCountdown({ expiresAt, className = '' }: PotluckCountdownProps) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(expiresAt));
  const rafRef = useRef<number>(0);
  const lastSecRef = useRef<number>(-1);

  useEffect(() => {
    // prefers-reduced-motion: update every 10s instead of every frame
    const prefersReduced = typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

    if (prefersReduced) {
      setTimeLeft(getTimeRemaining(expiresAt));
      const interval = setInterval(() => {
        setTimeLeft(getTimeRemaining(expiresAt));
      }, 10000);
      return () => clearInterval(interval);
    }

    function tick() {
      const now = Math.floor(Date.now() / 1000);
      if (now !== lastSecRef.current) {
        lastSecRef.current = now;
        setTimeLeft(getTimeRemaining(expiresAt));
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [expiresAt]);

  if (timeLeft.isExpired) {
    return (
      <span className={`text-gray-400 dark:text-neutral-500 text-sm ${className}`}>
        Expired
      </span>
    );
  }

  const { hours, minutes, seconds, isUrgent } = timeLeft;

  const urgentClasses = isUrgent
    ? 'text-red-500 dark:text-red-400 font-bold animate-pulse'
    : 'text-orange-600 dark:text-orange-400 font-semibold';

  let display = '';
  if (hours > 0) {
    display = `${hours}h ${String(minutes).padStart(2, '0')}m`;
  } else if (minutes > 0) {
    display = `${minutes}m ${String(seconds).padStart(2, '0')}s`;
  } else {
    display = `${seconds}s`;
  }

  return (
    <span
      className={`
        tabular-nums font-mono text-sm
        transition-colors duration-300
        ${urgentClasses}
        ${className}
      `.trim()}
      aria-label={`Time remaining: ${display}`}
      aria-live={isUrgent ? 'polite' : 'off'}
    >
      ⏰ {display}
    </span>
  );
}
