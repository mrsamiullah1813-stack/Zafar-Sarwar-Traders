import { useState, useEffect, useSyncExternalStore } from 'react';
import { ProductReview } from '../types';
import { loadProductReviewsFromDatabase } from './supabaseService';

export interface ProductCardRatingData {
  averageRating: number;   // e.g. 4.5, or 0 if no reviews
  formattedRating: string; // e.g. "4.5", or "0.0"
  totalCount: number;      // total count of approved reviews
  hasReviews: boolean;     // true if totalCount > 0
  label: string;           // "4.5" or "No ratings yet"
}

// In-memory reviews cache
let cachedReviews: ProductReview[] = [];
let isInitialFetchDone = false;
let fetchPromise: Promise<ProductReview[]> | null = null;
const listeners = new Set<() => void>();

function notifySubscribers() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (err) {
      console.warn('[ProductRatingService] Subscriber notification error:', err);
    }
  });
}

/**
 * Filter for genuine approved reviews
 */
export function isApprovedReview(review: ProductReview): boolean {
  if (!review) return false;
  const status = review.status;
  // Published or approved reviews (or reviews without explicit status)
  return !status || status === 'published' || status === 'approved';
}

/**
 * Computes strictly real rating statistics for a given product ID
 * Completely disconnects and ignores any manual overrides or fake ratings
 */
export function computeProductCardRating(
  productId: string | number | undefined,
  reviewsList: ProductReview[] = cachedReviews
): ProductCardRatingData {
  if (!productId) {
    return {
      averageRating: 0,
      formattedRating: '0.0',
      totalCount: 0,
      hasReviews: false,
      label: 'No ratings yet'
    };
  }

  const strId = String(productId).trim();
  const approvedProductReviews = reviewsList.filter(
    (rev) => String(rev.productId).trim() === strId && isApprovedReview(rev)
  );

  const totalCount = approvedProductReviews.length;

  if (totalCount === 0) {
    return {
      averageRating: 0,
      formattedRating: '0.0',
      totalCount: 0,
      hasReviews: false,
      label: 'No ratings yet'
    };
  }

  let totalScore = 0;
  for (const rev of approvedProductReviews) {
    const rawVal = Number(rev.rating);
    const cleanRating = Math.max(1, Math.min(5, isNaN(rawVal) ? 5 : rawVal));
    totalScore += cleanRating;
  }

  const averageRating = Number((totalScore / totalCount).toFixed(1));

  return {
    averageRating,
    formattedRating: averageRating.toFixed(1),
    totalCount,
    hasReviews: true,
    label: averageRating.toFixed(1)
  };
}

/**
 * Fetch all reviews from production database once and cache in-memory
 */
export async function fetchAndSyncProductReviews(force = false): Promise<ProductReview[]> {
  if (fetchPromise && !force) {
    return fetchPromise;
  }

  fetchPromise = (async () => {
    try {
      const allReviews = await loadProductReviewsFromDatabase();
      cachedReviews = Array.isArray(allReviews) ? allReviews : [];
      isInitialFetchDone = true;
      notifySubscribers();
      return cachedReviews;
    } catch (err) {
      console.warn('[ProductRatingService] Error syncing product reviews:', err);
      return cachedReviews;
    } finally {
      fetchPromise = null;
    }
  })();

  return fetchPromise;
}

// Global window event listener to update ratings instantly when a customer submits a review
if (typeof window !== 'undefined') {
  const handleReviewUpdate = () => {
    fetchAndSyncProductReviews(true);
  };

  window.addEventListener('product-reviews-updated', handleReviewUpdate);
  window.addEventListener('storage', (e) => {
    if (e.key === 'zst_product_reviews_v1') {
      fetchAndSyncProductReviews(true);
    }
  });

  // Kick off initial background sync
  fetchAndSyncProductReviews();
}

/**
 * Custom React Hook to get real dynamic product rating data
 * Strictly uses genuine customer reviews from database
 */
export function useProductCardRating(productId: string | number | undefined): ProductCardRatingData {
  // Subscribe to review store updates
  const reviews = useSyncExternalStore(
    (onStoreChange) => {
      listeners.add(onStoreChange);
      if (!isInitialFetchDone) {
        fetchAndSyncProductReviews();
      }
      return () => {
        listeners.delete(onStoreChange);
      };
    },
    () => cachedReviews,
    () => []
  );

  return computeProductCardRating(productId, reviews);
}
