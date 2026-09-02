import React, { useState, useEffect, useRef } from 'react';
import { Tag, Check, X, AlertCircle, Loader2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { AppliedCouponState } from '../types';
import { validateCouponCode } from '../utils/storage';

interface CouponPromoBoxProps {
  orderAmount?: number; // Subtotal or raw item total before coupon discount
  subtotalNumeric?: number; // Alias for orderAmount
  appliedCoupon: AppliedCouponState | null;
  onApplyCoupon: (coupon: AppliedCouponState | null) => void;
  onRemoveCoupon?: () => void;
  variant?: 'dark' | 'light';
  className?: string;
  autoExpandIfApplied?: boolean;
}

export const CouponPromoBox: React.FC<CouponPromoBoxProps> = ({
  orderAmount,
  subtotalNumeric,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  variant = 'light',
  className = '',
  autoExpandIfApplied = true
}) => {
  const currentAmount = typeof subtotalNumeric === 'number' ? subtotalNumeric : (typeof orderAmount === 'number' ? orderAmount : 0);
  const [isExpanded, setIsExpanded] = useState<boolean>(Boolean(appliedCoupon));
  const [inputCode, setInputCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const prevAmountRef = useRef<number>(currentAmount);

  // Automatically recalculate coupon discount whenever order subtotal/quantity/variant changes
  useEffect(() => {
    if (appliedCoupon && currentAmount !== prevAmountRef.current) {
      prevAmountRef.current = currentAmount;
      if (currentAmount <= 0) {
        if (onRemoveCoupon) onRemoveCoupon();
        else onApplyCoupon(null);
        return;
      }

      // If minimum order amount is not met after reducing quantity
      if (appliedCoupon.minOrderAmount && currentAmount < appliedCoupon.minOrderAmount) {
        if (onRemoveCoupon) onRemoveCoupon();
        else onApplyCoupon(null);
        setErrorMessage('Invalid or unavailable promo code.');
        return;
      }

      // Recalculate discount amount accurately
      const pct = Math.max(0, Math.min(100, appliedCoupon.discountPercentage || 0));
      let discountAmount = Math.round((currentAmount * pct) / 100);
      if (appliedCoupon.maxDiscountAmount && appliedCoupon.maxDiscountAmount > 0) {
        discountAmount = Math.min(discountAmount, appliedCoupon.maxDiscountAmount);
      }
      discountAmount = Math.min(discountAmount, currentAmount);
      const finalTotal = Math.max(0, currentAmount - discountAmount);

      onApplyCoupon({
        ...appliedCoupon,
        originalTotal: currentAmount,
        discountAmount,
        finalTotal
      });
    }
  }, [currentAmount, appliedCoupon, onApplyCoupon, onRemoveCoupon]);

  const handleApply = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputCode.trim()) {
      setErrorMessage('Invalid or unavailable promo code.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const result = await validateCouponCode(inputCode.trim(), currentAmount);
      if (result.valid && result.coupon) {
        onApplyCoupon(result.coupon);
        setErrorMessage(null);
        setInputCode('');
      } else {
        setErrorMessage(result.error || 'Invalid or unavailable promo code.');
      }
    } catch {
      setErrorMessage('Invalid or unavailable promo code.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    if (onRemoveCoupon) {
      onRemoveCoupon();
    } else {
      onApplyCoupon(null);
    }
    setInputCode('');
    setErrorMessage(null);
  };

  const isDark = variant === 'dark';

  return (
    <div className={`w-full text-xs select-none ${className}`}>
      {/* 1. Collapsed Trigger Link */}
      {!appliedCoupon && !isExpanded && (
        <button
          type="button"
          onClick={() => {
            setIsExpanded(true);
            setErrorMessage(null);
          }}
          className={`inline-flex items-center gap-1.5 font-medium py-1 px-1 transition-colors cursor-pointer group ${
            isDark
              ? 'text-blue-400 hover:text-blue-300'
              : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          <Tag className="w-3.5 h-3.5 transition-transform group-hover:rotate-12" />
          <span className="underline underline-offset-2">Have a coupon or promo code?</span>
        </button>
      )}

      {/* 2. Expanded Input Area (when no coupon applied) */}
      {!appliedCoupon && isExpanded && (
        <div
          className={`p-3 rounded-xl border transition-all duration-200 animate-fadeIn space-y-2 ${
            isDark
              ? 'bg-slate-900/90 border-slate-800 text-slate-200'
              : 'bg-slate-50/90 border-slate-200 text-slate-800'
          }`}
        >
          <div className="flex items-center justify-between">
            <label className={`text-[11px] font-bold flex items-center gap-1.5 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
              <Tag className="w-3.5 h-3.5 text-blue-500" />
              <span>Enter Promo / Coupon Code</span>
            </label>
            <button
              type="button"
              onClick={() => {
                setIsExpanded(false);
                setErrorMessage(null);
                setInputCode('');
              }}
              className={`text-[10px] font-medium hover:underline ${isDark ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleApply} className="flex items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter promo code"
                value={inputCode}
                onChange={(e) => {
                  setInputCode(e.target.value.toUpperCase());
                  if (errorMessage) setErrorMessage(null);
                }}
                disabled={loading}
                autoCapitalize="characters"
                className={`w-full px-3 py-2 text-xs font-mono font-bold uppercase rounded-lg border outline-none transition-all placeholder:normal-case placeholder:font-normal ${
                  isDark
                    ? 'bg-slate-950 border-slate-700 text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                    : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600'
                } ${errorMessage ? 'border-rose-500' : ''}`}
              />
            </div>
            <button
              type="submit"
              disabled={loading || !inputCode.trim()}
              className={`px-4 py-2 font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-500 text-white active:scale-95'
                  : 'bg-blue-600 hover:bg-blue-700 text-white active:scale-95'
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Checking...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Apply</span>
                </>
              )}
            </button>
          </form>

          {/* Error Message */}
          {errorMessage && (
            <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-500 text-[11px] font-semibold flex items-center gap-1.5 animate-shake">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>
      )}

      {/* 3. Applied Coupon Active Display */}
      {appliedCoupon && (
        <div
          className={`p-3 rounded-xl border transition-all duration-200 animate-fadeIn space-y-2.5 ${
            isDark
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
              : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono font-extrabold text-xs tracking-wider text-emerald-400 uppercase">
                    {appliedCoupon.code}
                  </span>
                  <span className={`px-1.5 py-0.2 text-[10px] font-extrabold rounded ${
                    isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {appliedCoupon.discountPercentage}% OFF
                  </span>
                </div>
                <span className={`text-[10px] block ${isDark ? 'text-emerald-400/80' : 'text-emerald-700'}`}>
                  Promo code successfully applied
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className={`text-[11px] font-bold px-2 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                isDark
                  ? 'bg-rose-950/40 text-rose-300 hover:bg-rose-900/60 border border-rose-500/30'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
              }`}
              title="Remove Coupon"
            >
              <X className="w-3 h-3" />
              <span>Remove</span>
            </button>
          </div>

          {/* Breakdown calculation */}
          <div className={`pt-2 border-t text-[11px] space-y-1 ${
            isDark ? 'border-emerald-500/20 text-slate-300' : 'border-emerald-200 text-slate-700'
          }`}>
            <div className="flex justify-between items-center">
              <span>Original Subtotal:</span>
              <span className="font-mono font-bold">
                Rs. {appliedCoupon.originalTotal.toLocaleString('en-PK')}
              </span>
            </div>
            <div className="flex justify-between items-center text-emerald-500 font-bold">
              <span>Discount ({appliedCoupon.discountPercentage}%):</span>
              <span className="font-mono">
                -Rs. {appliedCoupon.discountAmount.toLocaleString('en-PK')}
              </span>
            </div>
            <div className="flex justify-between items-center font-extrabold text-xs pt-1 border-t border-dashed border-emerald-500/30">
              <span className={isDark ? 'text-white' : 'text-slate-900'}>Discounted Total:</span>
              <span className="font-mono text-emerald-400">
                Rs. {appliedCoupon.finalTotal.toLocaleString('en-PK')}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
