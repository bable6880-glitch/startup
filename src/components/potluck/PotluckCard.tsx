'use client';

import React from 'react';
import type { PotluckDeal } from '@/types/potluck';
import { PotluckCountdown } from './PotluckCountdown';
import { PotluckProgress } from './PotluckProgress';
import { PotluckActions } from './PotluckActions';

const STATUS_CONFIG = {
  DRAFT: {
    label: 'Draft',
    badgeBg: 'bg-gray-100 dark:bg-neutral-800',
    badgeText: 'text-gray-500 dark:text-neutral-400',
    topBarColor: '',
    isLive: false,
  },
  PENDING: {
    label: 'Pending',
    badgeBg: 'bg-gray-100 dark:bg-neutral-800',
    badgeText: 'text-gray-500 dark:text-neutral-400',
    topBarColor: '',
    isLive: false,
  },
  SCHEDULED: {
    label: 'Scheduled',
    badgeBg: 'bg-blue-100 dark:bg-blue-900/30',
    badgeText: 'text-blue-700 dark:text-blue-300',
    topBarColor: 'from-blue-400 to-blue-500',
    isLive: false,
  },
  ACTIVE: {
    label: 'LIVE',
    badgeBg: 'bg-red-100 dark:bg-red-900/30',
    badgeText: 'text-red-600 dark:text-red-400',
    topBarColor: 'from-orange-400 via-amber-400 to-orange-500',
    isLive: true,
  },
  PAUSED: {
    label: 'Paused',
    badgeBg: 'bg-yellow-100 dark:bg-yellow-900/30',
    badgeText: 'text-yellow-700 dark:text-yellow-400',
    topBarColor: 'from-yellow-400 to-yellow-500',
    isLive: false,
  },
  FILLED: {
    label: 'Target Met!',
    badgeBg: 'bg-green-100 dark:bg-green-900/30',
    badgeText: 'text-green-700 dark:text-green-400',
    topBarColor: 'from-green-400 to-emerald-500',
    isLive: true,
  },
  ENDED: {
    label: 'Ended',
    badgeBg: 'bg-gray-100 dark:bg-neutral-800',
    badgeText: 'text-gray-500 dark:text-neutral-400',
    topBarColor: '',
    isLive: false,
  },
  EXPIRED: {
    label: 'Expired',
    badgeBg: 'bg-gray-100 dark:bg-neutral-800',
    badgeText: 'text-gray-500 dark:text-neutral-400',
    topBarColor: '',
    isLive: false,
  },
  CANCELLED: {
    label: 'Cancelled',
    badgeBg: 'bg-red-50 dark:bg-red-900/20',
    badgeText: 'text-red-500 dark:text-red-400',
    topBarColor: '',
    isLive: false,
  },
} as const;

interface PotluckCardProps {
  deal: PotluckDeal;
  onRefresh?: () => void;
  isSellerView?: boolean;
  onEdit?: (deal: PotluckDeal) => void;
  onRestart?: (deal: PotluckDeal) => void;
  onSaveTemplate?: (deal: PotluckDeal) => void;
}

export function PotluckCard({ deal, onRefresh = () => {}, isSellerView, onEdit, onRestart, onSaveTemplate }: PotluckCardProps) {
  const config = STATUS_CONFIG[deal.status] || STATUS_CONFIG.PENDING;
  
  const originalPrice = Number(deal.regularPriceRs);
  const price = Number(deal.pricePerPlateRs);
  const discount = originalPrice > 0
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  return (
    <div className="potluck-card-hover relative overflow-hidden rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 transition-colors duration-200 shadow-sm flex flex-col">
      {/* Top gradient bar */}
      {(deal.status === 'ACTIVE' || deal.status === 'FILLED') && (
        <div 
          className={`h-1 w-full bg-gradient-to-r ${config.topBarColor} ${deal.status === 'ACTIVE' ? 'potluck-shimmer' : ''}`}
        />
      )}

      <div className="p-5 flex-1 flex flex-col space-y-4">
        {/* Status & Timer row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span 
              className={`
                px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase
                ${config.badgeBg} ${config.badgeText}
                ${deal.status === 'ACTIVE' ? 'potluck-live-ring relative' : ''}
              `}
            >
              {config.label}
            </span>
          </div>
          <PotluckCountdown expiresAt={deal.expiresAt} />
        </div>

        {/* Title row */}
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-gray-900 dark:text-neutral-100 leading-tight">
            <span className="mr-2">{deal.emoji || '🍱'}</span>
            {deal.title}
          </h3>
        </div>

        {/* Price row */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-black text-orange-600 dark:text-orange-400">
            Rs.{price.toLocaleString('en-PK')}
          </span>
          {originalPrice > 0 && originalPrice > price && (
            <span className="text-sm line-through text-gray-400 dark:text-neutral-500">
              Rs.{originalPrice.toLocaleString('en-PK')}
            </span>
          )}
          {discount > 0 && (
            <span className="text-xs font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full ml-1">
              {discount}% OFF
            </span>
          )}
        </div>

        {/* Progress */}
        <div className="pt-2 pb-1">
          <PotluckProgress 
            current={deal.currentOrderCount} 
            target={deal.targetOrderCount} 
            status={deal.status} 
          />
        </div>

        {/* Actions */}
        <div className="pt-2 mt-auto border-t border-gray-100 dark:border-neutral-800/50">
          <PotluckActions deal={deal} onRefresh={onRefresh} onEdit={onEdit} onRestart={onRestart} onSaveTemplate={onSaveTemplate} />
        </div>
      </div>
    </div>
  );
}
