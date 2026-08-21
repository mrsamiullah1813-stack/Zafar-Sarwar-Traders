import React from 'react';
import { Flame, Tag, Sparkles, Percent } from 'lucide-react';
import { Product } from '../types';
import { getProductPricingDetails } from '../utils/pricingUtils';

interface ProductSaleBadgeProps {
  product: Product;
  variant?: 'floating' | 'inline' | 'banner';
  showDiscountPercent?: boolean;
}

export const ProductSaleBadge: React.FC<ProductSaleBadgeProps> = ({
  product,
  variant = 'floating',
  showDiscountPercent = true
}) => {
  const details = getProductPricingDetails(product);

  // If sale is not active or product is normal, render nothing!
  if (!details.isSaleActive) {
    return null;
  }

  const getColorClasses = (color: string) => {
    switch (color) {
      case 'emerald':
      case 'green':
        return 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-900/30';
      case 'amber':
      case 'orange':
        return 'bg-amber-500 text-slate-950 border-amber-400 shadow-amber-900/30';
      case 'blue':
        return 'bg-blue-600 text-white border-blue-400 shadow-blue-900/30';
      case 'purple':
        return 'bg-purple-600 text-white border-purple-400 shadow-purple-900/30';
      case 'cyan':
        return 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-cyan-900/30';
      case 'red':
      case 'crimson':
      default:
        return 'bg-rose-600 text-white border-rose-500 shadow-rose-900/30';
    }
  };

  const badgeColorClass = getColorClasses(details.saleBadgeColor);

  if (variant === 'banner') {
    return (
      <div className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-rose-950/80 via-slate-900 to-rose-950/80 border border-rose-500/40 text-white shadow-lg">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-rose-600 text-white shadow-md">
            <Flame className="w-4 h-4 animate-bounce" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xs tracking-wider uppercase text-rose-300">
                {details.saleLabel}
              </span>
              {details.discountPercent > 0 && details.showDiscountPercentage && (
                <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[11px] font-mono">
                  {details.discountPercent}% OFF
                </span>
              )}
            </div>
            {details.saleMessage && (
              <p className="text-[11px] text-slate-300 font-medium mt-0.5">
                {details.saleMessage}
              </p>
            )}
          </div>
        </div>

        {details.savingsAmount > 0 && details.showSavings && (
          <div className="text-right shrink-0">
            <span className="text-[9px] uppercase font-bold text-rose-400 block">Save</span>
            <span className="font-mono font-black text-xs text-amber-300">
              {details.formattedSavings}
            </span>
          </div>
        )}
      </div>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="inline-flex items-center gap-1.5 flex-wrap">
        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-black text-[10px] uppercase tracking-wider shadow-sm border ${badgeColorClass}`}>
          <Flame className="w-3 h-3 fill-current" />
          <span>{details.saleLabel}</span>
        </span>

        {details.discountPercent > 0 && showDiscountPercent && details.showDiscountPercentage && (
          <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] font-mono shadow-sm">
            <span>{details.discountPercent}% OFF</span>
          </span>
        )}
      </div>
    );
  }

  // Floating variant for top of image cards
  return (
    <div className="flex flex-col gap-1 items-start">
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-black text-[10px] uppercase tracking-wider shadow-lg border ${badgeColorClass}`}>
        <Flame className="w-3 h-3 fill-current animate-pulse" />
        <span>{details.saleLabel}</span>
      </span>

      {details.discountPercent > 0 && showDiscountPercent && details.showDiscountPercentage && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-950/90 text-rose-400 border border-rose-500/50 font-black text-[10px] font-mono shadow-md backdrop-blur-sm">
          {details.discountPercent}% OFF
        </span>
      )}
    </div>
  );
};
