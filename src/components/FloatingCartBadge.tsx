import React, { useState, useEffect } from 'react';
import { ShoppingBag, Check, ChevronRight } from 'lucide-react';
import { CartItem } from '../types';
import { getActiveProductPrice } from '../utils/pricingUtils';

interface FloatingCartBadgeProps {
  cartItems: CartItem[];
  onOpenCart: () => void;
  lastAddedTimestamp?: number;
  lastAddedProductName?: string;
}

export const FloatingCartBadge: React.FC<FloatingCartBadgeProps> = ({
  cartItems,
  onOpenCart,
  lastAddedTimestamp,
  lastAddedProductName
}) => {
  const [showAddedAlert, setShowAddedAlert] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);

  const items = Array.isArray(cartItems) ? cartItems : [];
  const totalCount = items.reduce((sum, item) => sum + (item?.quantity || 0), 0);

  // STRICT CONDITIONAL VISIBILITY: If cart is empty (count === 0), do not render floating badge on screen
  const shouldRender = totalCount > 0;

  // Calculate Subtotal for the preview badge
  const subtotal = items.reduce((sum, item) => {
    if (!item?.product) return sum;
    const pricing = getActiveProductPrice(item.product, item.selectedVariant || item.selectedVariantId);
    return sum + (pricing.effectivePriceNumeric * (item.quantity || 1));
  }, 0);

  // Trigger real-time pulse and notification bubble whenever a new item is added
  useEffect(() => {
    if (lastAddedTimestamp && lastAddedTimestamp > 0 && totalCount > 0) {
      setShowAddedAlert(true);
      setIsBouncing(true);

      const bounceTimer = setTimeout(() => {
        setIsBouncing(false);
      }, 700);

      const alertTimer = setTimeout(() => {
        setShowAddedAlert(false);
      }, 3500);

      return () => {
        clearTimeout(bounceTimer);
        clearTimeout(alertTimer);
      };
    } else if (totalCount === 0) {
      setShowAddedAlert(false);
      setIsBouncing(false);
    }
  }, [lastAddedTimestamp, totalCount]);

  if (!shouldRender) {
    return null;
  }

  return (
    <div className="fixed bottom-24 sm:bottom-28 right-3 sm:right-6 z-40 flex flex-col items-end safe-area-bottom pointer-events-none animate-in fade-in zoom-in-95 duration-300">
      {/* Real-time "Item Added" Notification Alert Bubble */}
      {showAddedAlert && (
        <div
          onClick={onOpenCart}
          className="pointer-events-auto mb-2.5 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-slate-900/95 text-white border border-blue-500/40 shadow-2xl backdrop-blur-md animate-bounce cursor-pointer hover:bg-slate-800 transition-all max-w-[280px] sm:max-w-xs"
        >
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
            <Check className="w-3.5 h-3.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold text-emerald-400 leading-tight flex items-center gap-1">
              <span>Added to Cart!</span>
              <span className="text-[10px] text-slate-400 font-mono">({totalCount} in cart)</span>
            </p>
            {lastAddedProductName ? (
              <p className="text-[10px] text-slate-300 truncate font-medium mt-0.5">
                {lastAddedProductName}
              </p>
            ) : (
              <p className="text-[10px] text-slate-300 font-medium">Click to view cart drawer</p>
            )}
          </div>
          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
        </div>
      )}

      {/* Floating Interactive Cart Badge Button */}
      <button
        type="button"
        onClick={onOpenCart}
        title={`Shopping Cart: ${totalCount} item${totalCount === 1 ? '' : 's'}`}
        className={`pointer-events-auto group relative flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-slate-900/95 hover:bg-slate-900 text-white border border-slate-700/80 hover:border-blue-500/60 shadow-xl hover:shadow-2xl shadow-slate-950/40 backdrop-blur-md transition-all duration-300 active:scale-95 ${
          isBouncing ? 'scale-110 ring-4 ring-blue-500/30 border-blue-400' : ''
        }`}
      >
        {/* Glowing Cart Icon with Dynamic Count Badge */}
        <div className="relative flex items-center justify-center">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 group-hover:from-blue-500 group-hover:to-indigo-400 flex items-center justify-center text-white shadow-md shadow-blue-950 transition-all">
            <ShoppingBag className="w-4.5 h-4.5" />
          </div>

          {/* Real-time Badge Count Pill */}
          <span
            className="absolute -top-1.5 -right-2 min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-mono font-black flex items-center justify-center border-2 border-slate-900 shadow-md bg-rose-500 text-white scale-100 animate-pulse transition-transform duration-300"
          >
            {totalCount > 99 ? '99+' : totalCount}
          </span>
        </div>

        {/* Text & Subtotal Info (Visible on desktop or when items exist) */}
        <div className="hidden sm:flex flex-col text-left pr-1">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 group-hover:text-blue-400 transition-colors">
            Cart
          </span>
          <span className="text-xs font-mono font-bold text-slate-100">
            {subtotal > 0 ? `Rs. ${subtotal.toLocaleString('en-PK')}` : '0 Items'}
          </span>
        </div>
      </button>
    </div>
  );
};
