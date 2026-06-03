'use client';

import { useState, useRef, useEffect } from 'react';
import type { PotluckDeal, DealStatus } from '@/types/potluck';
import { useAuth } from '@/lib/firebase/auth-context';
import { MoreVertical, Play, Pause, Edit, Share, XCircle, Trash2, RotateCcw, BarChart2, Save } from 'lucide-react';

interface PotluckActionsProps {
  deal: PotluckDeal;
  onRefresh: () => void;
}

type ActionVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'icon-only';

export function PotluckActions({ deal, onRefresh }: PotluckActionsProps) {
  const { getIdToken } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (confirmingAction) {
      timer = setTimeout(() => {
        setConfirmingAction(null);
      }, 5000);
    }
    return () => clearTimeout(timer);
  }, [confirmingAction]);

  const updateStatus = async (newStatus: DealStatus) => {
    setIsUpdating(true);
    try {
      const token = await getIdToken();
      await fetch(`/api/seller/potluck/${deal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      onRefresh();
    } catch (err) {
      console.error('Failed to update deal status', err);
    } finally {
      setIsUpdating(false);
      setConfirmingAction(null);
      setIsMenuOpen(false);
    }
  };

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/kitchen/${deal.kitchenId}?deal=${deal.id}`;
    await navigator.clipboard.writeText(url);
    // Simple inline toast replacement
    const el = document.createElement('div');
    el.textContent = 'Link copied!';
    el.className = 'fixed bottom-4 right-4 bg-gray-900 text-white px-4 py-2 rounded shadow-lg z-50 animate-fade-in';
    document.body.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 3000);
    setIsMenuOpen(false);
  };

  const renderDangerousButton = (id: string, label: string, targetStatus: DealStatus, Icon: any, className = '') => {
    if (confirmingAction === id) {
      return (
        <div className="absolute inset-0 z-20 flex gap-2 items-center justify-between h-9 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-sm rounded-xl px-1 animate-fade-in shadow-sm">
          <span className="text-xs text-gray-700 dark:text-gray-300 font-bold px-2 whitespace-nowrap">End deal?</span>
          <div className="flex items-center gap-1">
              <button
                onClick={() => updateStatus(targetStatus)}
                disabled={isUpdating}
                className="h-7 px-3 text-xs font-bold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors flex items-center justify-center min-w-[70px]"
              >
                {isUpdating ? "..." : "Yes, end"}
              </button>
              <button
                onClick={() => setConfirmingAction(null)}
                className="h-7 px-3 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
              >
                Cancel
              </button>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={() => setConfirmingAction(id)}
        className={`h-9 px-4 rounded-xl text-sm font-medium transition-colors flex items-center justify-center gap-2 ${className}`}
      >
        <Icon className="w-4 h-4" />
        {label}
      </button>
    );
  };

  return (
    <div className="flex gap-2 pt-1 relative">
      {deal.status === 'PENDING' || deal.status === 'SCHEDULED' ? (
        <>
          <button
            onClick={() => updateStatus('ACTIVE')}
            disabled={isUpdating}
            className="flex-1 h-9 bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> Start Early
          </button>
          {renderDangerousButton('cancel', 'Cancel', 'CANCELLED', XCircle, 'flex-1 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40')}
        </>
      ) : deal.status === 'ACTIVE' ? (
        <>
          <button
            onClick={() => updateStatus('PAUSED')}
            disabled={isUpdating}
            className="flex-1 h-9 bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:hover:bg-yellow-900/50 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Pause className="w-4 h-4" /> Pause
          </button>
          <button
            onClick={handleCopyLink}
            className="h-9 w-9 flex items-center justify-center bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 rounded-xl transition-colors"
            title="Share"
          >
            <Share className="w-4 h-4" />
          </button>
          <div className="flex-shrink-0">
            {renderDangerousButton('end', 'End', 'CANCELLED', XCircle, 'h-9 w-9 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 p-0 [&>svg]:m-0')}
          </div>
        </>
      ) : deal.status === 'PAUSED' ? (
        <>
          <button
            onClick={() => updateStatus('ACTIVE')}
            disabled={isUpdating}
            className="flex-1 h-9 bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-400 dark:hover:bg-green-900/50 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4" /> Resume
          </button>
          {renderDangerousButton('end', 'End', 'CANCELLED', XCircle, 'flex-1 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40')}
        </>
      ) : deal.status === 'FILLED' ? (
        <>
          <button
            onClick={() => {}}
            className="flex-1 h-9 bg-orange-500 text-white hover:bg-orange-600 rounded-xl text-sm font-bold transition-colors flex items-center justify-center gap-2 potluck-shimmer"
          >
            <Play className="w-4 h-4" /> Activate Now
          </button>
          {renderDangerousButton('cancel', 'Cancel', 'CANCELLED', XCircle, 'h-9 px-3 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 p-0')}
        </>
      ) : (
        // ENDED | EXPIRED | CANCELLED
        <>
          <button
            onClick={() => {}}
            className="flex-1 h-9 bg-orange-100 text-orange-700 hover:bg-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:hover:bg-orange-900/50 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Restart
          </button>
          <button
            className="h-9 px-3 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700 rounded-xl transition-colors flex items-center justify-center gap-2"
            title="View Stats"
          >
            <BarChart2 className="w-4 h-4" />
          </button>
        </>
      )}

      {/* Overflow Menu */}
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="h-9 w-9 flex items-center justify-center bg-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-neutral-800 dark:hover:text-neutral-300 rounded-xl transition-colors"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        
        {isMenuOpen && (
          <div className="absolute right-0 bottom-full mb-2 w-48 bg-white dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800 rounded-xl shadow-lg py-1 z-50 animate-fade-in origin-bottom-right">
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 flex items-center gap-2">
              <Edit className="w-4 h-4" /> Edit
            </button>
            <button className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 flex items-center gap-2">
              <Save className="w-4 h-4" /> Save Template
            </button>
            <button onClick={handleCopyLink} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-neutral-300 hover:bg-gray-50 dark:hover:bg-neutral-800 flex items-center gap-2">
              <Share className="w-4 h-4" /> Share Link
            </button>
            {deal.status === 'ACTIVE' && (
              <button
                onClick={() => {
                  setConfirmingAction('end');
                  setIsMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" /> End Early
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
