// src/types/potluck.ts
// Centralized types for the potluck feature
// DB enum: DRAFT | PENDING | ACTIVE | FILLED | CANCELLED | EXPIRED

export type DealStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'PAUSED'
  | 'FILLED'
  | 'CANCELLED'
  | 'EXPIRED';

export interface PotluckDeal {
  id: string;
  kitchenId: string;
  cookId: string;
  subscriptionId: string;
  title: string;
  description?: string | null;
  mealId?: string | null;
  totalPlatesAvailable: number;
  targetOrderCount: number;
  currentOrderCount: number;
  pricePerPlateRs: string | number;
  regularPriceRs: string | number;
  status: DealStatus;
  expiresAt: string;
  activatesAt?: string | null;
  activatedAt?: string | null;
  cancelledAt?: string | null;
  cancelReason?: string | null;
  city?: string | null;
  citySlug?: string | null;
  imageUrl?: string | null;
  images?: string[] | null;
  createdAt: string;
  updatedAt?: string | null;
  emoji?: string | null;
}

// Computed helpers — derive from deal data, no extra API calls
export function getDealPercentage(deal: PotluckDeal): number {
  if (deal.targetOrderCount === 0) return 0;
  return Math.min(100, Math.round((deal.currentOrderCount / deal.targetOrderCount) * 100));
}

export function getDealDiscount(deal: PotluckDeal): number {
  const original = Number(deal.regularPriceRs);
  const price = Number(deal.pricePerPlateRs);
  if (original === 0) return 0;
  return Math.round(((original - price) / original) * 100);
}

export function isLiveDeal(deal: PotluckDeal): boolean {
  return deal.status === 'ACTIVE' || deal.status === 'FILLED';
}
