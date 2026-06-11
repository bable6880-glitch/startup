'use client';

import React, { useState, useEffect } from 'react';
import type { PotluckDeal } from '@/types/potluck';
import { PotluckCountdown } from './PotluckCountdown';
import { PotluckProgress } from './PotluckProgress';

interface PotluckPublicCardProps {
  deal: PotluckDeal;
  kitchenName?: string;
}

export function PotluckPublicCard({ deal, kitchenName }: PotluckPublicCardProps) {
  const [currentCount, setCurrentCount] = useState(deal.currentOrderCount);
  const [dealStatus, setDealStatus] = useState(deal.status);
  const [reserving, setReserving] = useState(false);
  const [hasReserved, setHasReserved] = useState(false); // Can be linked to actual API later

  // Polling for real-time updates on public card
  useEffect(() => {
    if (dealStatus !== 'ACTIVE') return;

    const poll = async () => {
      try {
        const res = await fetch(`/api/potluck?city=${deal.citySlug}&limit=10`);
        if (!res.ok) return;
        const { deals } = await res.json();
        const updated = deals?.find((d: any) => d.id === deal.id);
        if (updated) {
          if (typeof updated.currentOrderCount === 'number') {
            setCurrentCount(updated.currentOrderCount);
          }
          if (updated.status && updated.status !== dealStatus) {
            setDealStatus(updated.status);
          }
        }
      } catch {
        // Silent fail
      }
    };

    const interval = setInterval(poll, 15_000);
    return () => clearInterval(interval);
  }, [deal.citySlug, deal.id, dealStatus]);

  const originalPrice = Number(deal.regularPriceRs);
  const price = Number(deal.pricePerPlateRs);
  const discount = originalPrice > 0
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleOrder = async () => {
    setReserving(true);
    try {
      const res = await fetch(`/api/potluck/${deal.id}/reserve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: 1 })
      });
      
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 401) {
          window.location.href = `/login?redirect=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
        throw new Error(data.error || 'Failed to order');
      }
      
      setHasReserved(true);
      if (data.deal) {
        setCurrentCount(data.deal.currentOrderCount);
        setDealStatus(data.deal.status);
      }
      // Emit event so the layout can show a toast or we just alert for now
      alert("Order placed successfully! Check your dashboard.");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className="potluck-card-hover relative overflow-hidden rounded-2xl border border-gray-100 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-sm flex flex-col mb-8">
      {/* Top gradient bar */}
      {(dealStatus === 'ACTIVE' || dealStatus === 'FILLED') && (
        <div 
          className={`h-1.5 w-full bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500 ${dealStatus === 'ACTIVE' ? 'potluck-shimmer' : ''}`}
        />
      )}

      <div className="p-6 sm:p-8 flex flex-col md:flex-row gap-6 md:items-center">
        {/* Left Side: Info */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 potluck-live-ring relative">
              {dealStatus === 'ACTIVE' ? 'LIVE DEAL' : 'TARGET MET'}
            </span>
            <PotluckCountdown expiresAt={deal.expiresAt} className="text-sm font-bold" />
          </div>

          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-neutral-100 leading-tight">
              <span className="mr-2">{deal.emoji || '🍱'}</span>
              {deal.title}
            </h3>
            {kitchenName && (
              <p className="text-sm text-gray-500 dark:text-neutral-400 mt-1">
                By {kitchenName}
              </p>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-orange-600 dark:text-orange-400">
              Rs.{price.toLocaleString('en-PK')}
            </span>
            {originalPrice > 0 && originalPrice > price && (
              <span className="text-lg line-through text-gray-400 dark:text-neutral-500">
                Rs.{originalPrice.toLocaleString('en-PK')}
              </span>
            )}
            {discount > 0 && (
              <span className="text-sm font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 px-2 py-0.5 rounded-full">
                {discount}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Right Side: Progress & Action */}
        <div className="w-full md:w-[320px] bg-gray-50 dark:bg-neutral-800/50 rounded-xl p-5 border border-gray-100 dark:border-neutral-800 flex flex-col justify-center">
          <PotluckProgress 
            current={currentCount} 
            target={deal.targetOrderCount} 
            status={dealStatus as any} 
          />

          <div className="mt-5">
            {dealStatus === 'ACTIVE' && currentCount < deal.totalPlatesAvailable ? (
              <button
                onClick={handleOrder}
                disabled={reserving || hasReserved}
                className={`
                  w-full py-3.5 rounded-xl text-sm font-bold transition-all shadow-lg
                  ${hasReserved
                    ? 'bg-green-50 text-green-600 border border-green-200 shadow-none'
                    : 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-orange-500/25 hover:from-orange-600 hover:to-amber-600 disabled:opacity-60 disabled:hover:shadow-none potluck-shimmer'
                  }
                `}
              >
                {hasReserved
                  ? '✓ Ordered'
                  : reserving
                  ? 'Ordering...'
                  : `Order Now — Rs.${price.toLocaleString('en-PK')}`
                }
              </button>
            ) : (
              <div className="w-full py-3.5 rounded-xl text-sm font-bold text-center text-gray-500 bg-gray-200/50 dark:bg-neutral-800 dark:text-neutral-400">
                {dealStatus === 'FILLED' || currentCount >= deal.totalPlatesAvailable
                  ? '🎉 Deal Activated!'
                  : 'Deal Ended'
                }
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
