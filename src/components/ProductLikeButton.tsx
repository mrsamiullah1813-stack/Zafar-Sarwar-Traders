import React from 'react';
import { Heart } from 'lucide-react';
import { useProductLikes } from '../services/productLikesService';

export interface ProductLikeButtonProps {
  productId: string | undefined;
  variant?: 'card-badge' | 'card-floating' | 'detail' | 'button-pill';
  className?: string;
  zeroText?: '0 Likes' | 'No likes yet';
  showCount?: boolean;
}

export const ProductLikeButton: React.FC<ProductLikeButtonProps> = ({
  productId,
  variant = 'card-badge',
  className = '',
  zeroText = '0 Likes',
  showCount = true
}) => {
  const { count, isLiked, label, toggle, isLoading } = useProductLikes(productId, zeroText);

  if (!productId) return null;

  // 1. DETAIL PAGE VARIANT (Full interactive button with tooltip)
  if (variant === 'detail') {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={isLoading}
        title={isLiked ? 'Unlike this product' : 'Like this product'}
        aria-label={`${label}. Click to ${isLiked ? 'unlike' : 'like'}`}
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs ${
          isLiked
            ? 'bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100 shadow-rose-100'
            : 'bg-white text-slate-600 border-slate-200 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50/50'
        } ${className}`}
      >
        <Heart
          className={`w-4 h-4 transition-transform duration-200 ${
            isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-400 stroke-[2]'
          } ${isLoading ? 'opacity-50' : ''}`}
        />
        {showCount && (
          <span className={`font-mono text-xs ${isLiked ? 'text-rose-600' : 'text-slate-600'}`}>
            {label}
          </span>
        )}
      </button>
    );
  }

  // 2. CARD FLOATING VARIANT (Floating on top-right of image)
  if (variant === 'card-floating') {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={isLoading}
        title={isLiked ? `Liked (${label}) - Click to unlike` : `Like this product (${label})`}
        aria-label={`${label}. Click to ${isLiked ? 'unlike' : 'like'}`}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border backdrop-blur-md transition-all active:scale-90 cursor-pointer shadow-xs ${
          isLiked
            ? 'bg-rose-500 text-white border-rose-400 hover:bg-rose-600'
            : 'bg-white/95 text-slate-700 border-slate-200/90 hover:text-rose-600 hover:bg-white'
        } ${className}`}
      >
        <Heart
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            isLiked ? 'fill-white text-white scale-105' : 'text-slate-400 stroke-[2]'
          }`}
        />
        {showCount && (
          <span className={`text-[10px] font-bold font-mono tracking-tight ${isLiked ? 'text-white' : 'text-slate-700'}`}>
            {count > 0 ? count : (zeroText === '0 Likes' ? '0' : 'Like')}
          </span>
        )}
      </button>
    );
  }

  // 3. CARD BADGE VARIANT (Compact inline element inside product card info)
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isLoading}
      title={isLiked ? `Liked (${label}) - Click to unlike` : `Click to like (${label})`}
      aria-label={`${label}. Click to ${isLiked ? 'unlike' : 'like'}`}
      className={`inline-flex items-center gap-1 text-[9.5px] sm:text-[10.5px] font-medium transition-colors active:scale-95 cursor-pointer py-0.5 px-1.5 rounded-md hover:bg-rose-50/60 ${
        isLiked
          ? 'text-rose-600 font-bold bg-rose-50/80 border border-rose-200/60'
          : 'text-slate-400 hover:text-rose-600 border border-transparent'
      } ${className}`}
    >
      <Heart
        className={`w-3 h-3 sm:w-3.5 sm:h-3.5 transition-transform duration-200 shrink-0 ${
          isLiked ? 'fill-rose-500 text-rose-500 scale-110' : 'text-slate-400 stroke-[1.75]'
        }`}
      />
      {showCount && (
        <span className={`font-mono text-[9px] sm:text-[10px] tracking-tight whitespace-nowrap ${
          isLiked ? 'text-rose-600 font-bold' : 'text-slate-400 hover:text-rose-600'
        }`}>
          {label}
        </span>
      )}
    </button>
  );
};
