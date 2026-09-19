import React from 'react';
import { Star } from 'lucide-react';
import { useProductCardRating } from '../services/productRatingService';

export interface ProductCardRatingProps {
  productId: string | number | undefined;
  className?: string;
  starClassName?: string;
  showCount?: boolean;
}

/**
 * ProductCardRating
 * 
 * Renders real dynamic rating calculated strictly from genuine database customer reviews.
 * Disconnects and removes any hardcoded ratings or admin-panel fake rating override fields.
 * 
 * Conditional Display:
 * - If 0 reviews: displays "No ratings yet"
 * - If 1+ reviews: displays exact average score (e.g. 4.5 ⭐) with review count (e.g. (3))
 */
export const ProductCardRating: React.FC<ProductCardRatingProps> = ({
  productId,
  className = '',
  starClassName = 'w-2.5 h-2.5 sm:w-3 sm:h-3',
  showCount = true
}) => {
  const ratingData = useProductCardRating(productId);

  if (!ratingData.hasReviews) {
    return (
      <div 
        className={`flex items-center gap-1 text-slate-400 ${className}`}
        title="No customer ratings recorded yet"
      >
        <Star className={`${starClassName} text-slate-300 stroke-[1.5]`} />
        <span className="text-slate-400 font-medium text-[8.5px] sm:text-[9.5px] tracking-tight whitespace-nowrap">
          No ratings yet
        </span>
      </div>
    );
  }

  return (
    <div 
      className={`flex items-center gap-1 text-amber-500 ${className}`}
      title={`${ratingData.formattedRating} out of 5 stars based on ${ratingData.totalCount} verified review${ratingData.totalCount === 1 ? '' : 's'}`}
    >
      <Star className={`${starClassName} fill-amber-400 text-amber-400`} />
      <span className="text-slate-800 font-mono text-[9px] sm:text-[10px] font-bold">
        {ratingData.formattedRating}
      </span>
      {showCount && (
        <span className="text-slate-400 text-[8.5px] sm:text-[9.5px] font-medium font-mono">
          ({ratingData.totalCount})
        </span>
      )}
    </div>
  );
};
