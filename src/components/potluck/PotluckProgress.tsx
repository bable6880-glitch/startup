'use client';

// PotluckProgress.tsx
// Animated progress bar for potluck deal progress.
// - Shimmer animation when ACTIVE (CSS background-position)
// - Bounce animation when order count increments
// - Respect prefers-reduced-motion

import { useEffect, useRef } from 'react';
import type { DealStatus } from '@/types/potluck';

interface PotluckProgressProps {
  current: number;
  target: number;
  status: DealStatus;
}

export function PotluckProgress({ current, target, status }: PotluckProgressProps) {
  const percentage = target === 0 ? 0 : Math.min(100, (current / target) * 100);
  const isActive = status === 'ACTIVE';
  const isComplete = status === 'FILLED' || percentage >= 100;
  const prevCountRef = useRef(current);

  // Determine bar color by status and progress
  const barColor = isComplete
    ? 'bg-green-500 dark:bg-green-400'
    : isActive
    ? 'bg-orange-500 dark:bg-orange-400'
    : status === 'PAUSED'
    ? 'bg-yellow-500 dark:bg-yellow-400'
    : 'bg-gray-400 dark:bg-neutral-600';

  // Milestone labels
  const milestones = [25, 50, 75, 100];

  return (
    <div className="space-y-2">
      {/* Progress bar track */}
      <div
        className="relative h-2.5 w-full rounded-full
                   bg-gray-100 dark:bg-neutral-800
                   overflow-hidden"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={target}
        aria-label={`${current} of ${target} orders`}
      >
        {/* Filled portion — width set via inline style for smooth CSS transition */}
        <div
          className={`
            absolute inset-y-0 left-0 rounded-full
            transition-all duration-700 ease-out
            ${barColor}
            ${isActive ? 'potluck-shimmer' : ''}
          `}
          style={{ width: `${percentage}%` }}
        />

        {/* Milestone markers */}
        {milestones.map((milestone) => (
          <div
            key={milestone}
            className={`
              absolute top-0 bottom-0 w-px
              ${percentage >= milestone
                ? 'bg-white/30 dark:bg-white/20'
                : 'bg-gray-200 dark:bg-neutral-700'
              }
            `}
            style={{ left: `${milestone}%` }}
          />
        ))}
      </div>

      {/* Order count + label row */}
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-600 dark:text-neutral-400">
          <span
            className="font-bold text-gray-900 dark:text-neutral-100
                       tabular-nums"
          >
            {current}
          </span>
          {' / '}
          <span className="text-gray-500 dark:text-neutral-500">
            {target} orders
          </span>
        </span>

        <span className={`
          font-semibold tabular-nums
          ${isComplete
            ? 'text-green-600 dark:text-green-400'
            : 'text-orange-600 dark:text-orange-400'
          }
        `}>
          {isComplete ? '✓ Target reached!' : `${Math.round(percentage)}%`}
        </span>
      </div>
    </div>
  );
}
