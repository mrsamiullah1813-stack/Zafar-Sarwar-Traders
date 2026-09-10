import React, { useEffect } from 'react';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, ShieldCheck, Boxes, Sparkles, Check } from 'lucide-react';
import { BusinessConfig, CartItem, CheckoutSettings } from '../types';
import { getActiveProductPrice } from '../utils/pricingUtils';

interface CartDrawerProps {
  isOpen: boolean;
  cartItems: CartItem[];
  config: BusinessConfig;
  checkoutSettings?: CheckoutSettings;
  onClose: () => void;
  onUpdateQuantity: (cartIndex: number, delta: number) => void;
  onRemoveItem: (cartIndex: number) => void;
  onClearCart: () => void;
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  cartItems,
  config,
  checkoutSettings,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onProceedToCheckout
}) => {
  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const items = Array.isArray(cartItems) ? cartItems : [];
  const totalItemCount = items.reduce((acc, item) => acc + (item?.quantity || 0), 0);

  const getItemPricing = (item: CartItem) => {
    if (!item?.product) return { effectivePriceNumeric: 0, isSaleActive: false, discountPercentage: 0, regularPriceNumeric: 0, effectivePriceString: 'Price on Request' };
    const p = item.product;
    return getActiveProductPrice(p, item.selectedVariant || item.selectedVariantId);
  };

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => {
      if (!item?.product) return acc;
      const pricing = getItemPricing(item);
      return acc + pricing.effectivePriceNumeric * (item.quantity || 1);
    }, 0);
  };

  const subtotal = calculateSubtotal();

  const isFreeDelivery = checkoutSettings?.freeDeliveryThreshold 
    ? subtotal >= checkoutSettings.freeDeliveryThreshold 
    : false;

  const deliveryFee = subtotal > 0 ? (isFreeDelivery ? 0 : (checkoutSettings?.deliveryFee || 250)) : 0;
  
  const taxAmount = checkoutSettings?.enableTaxes && checkoutSettings.taxRatePercent > 0
    ? Math.round((subtotal * checkoutSettings.taxRatePercent) / 100)
    : 0;

  const grandTotal = subtotal + deliveryFee + taxAmount;

  // Free delivery threshold progress calculation
  const freeDeliveryThreshold = checkoutSettings?.freeDeliveryThreshold || 0;
  const freeDeliveryRemaining = freeDeliveryThreshold > 0 ? Math.max(0, freeDeliveryThreshold - subtotal) : 0;
  const freeDeliveryProgress = freeDeliveryThreshold > 0 
    ? Math.min(100, Math.round((subtotal / freeDeliveryThreshold) * 100))
    : 100;

  return (
    <div className="fixed inset-0 z-[100] flex justify-end">
      {/* Backdrop overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn"
        aria-hidden="true"
      />

      {/* Slide-over Drawer Panel */}
      <div 
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 z-10 animate-in slide-in-from-right duration-300 transform transition-transform"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 id="cart-drawer-title" className="font-serif font-bold text-white text-lg leading-tight">
                Shopping Cart
              </h3>
              <p className="text-xs text-slate-300">
                {totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in your cart
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Cart"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Free Delivery Threshold Progress Bar */}
        {freeDeliveryThreshold > 0 && items.length > 0 && (
          <div className="px-5 py-3 bg-blue-50/80 border-b border-blue-100/60 text-xs">
            {isFreeDelivery ? (
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Congratulations! You qualify for Free Delivery across Pakistan.</span>
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-700 font-medium">
                  <span>Add <strong className="text-blue-700 font-mono">Rs. {freeDeliveryRemaining.toLocaleString('en-PK')}</strong> more for Free Delivery</span>
                  <span className="font-mono text-[11px] font-bold text-blue-800">{freeDeliveryProgress}%</span>
                </div>
                <div className="w-full h-1.5 bg-blue-200/70 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-300"
                    style={{ width: `${freeDeliveryProgress}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-4">
              <div className="w-18 h-18 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                <ShoppingBag className="w-9 h-9 text-slate-400" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-slate-800 text-base">Your Cart is Empty</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Explore our luxury sanitaryware, premium faucets, bath fittings, and building supplies.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition-all active:scale-95"
              >
                Browse Catalog
              </button>
            </div>
          ) : (
            items.map((item, index) => {
              const p = item.product;
              if (!p) return null;

              const pricing = getItemPricing(item);
              const numericPrice = pricing.effectivePriceNumeric;
              const lineTotal = numericPrice * (item.quantity || 1);

              return (
                <div key={index} className="pt-4 first:pt-0 flex gap-3 items-start group">
                  <img
                    src={p.images?.[0] || p.image || '/logo.png'}
                    alt={p.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0 mt-0.5"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start gap-1">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          {p.brand && (
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block truncate">
                              {p.brand}
                            </span>
                          )}
                          {pricing.isSaleActive && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold text-[9px] font-mono shrink-0">
                              SALE {pricing.discountPercentage > 0 ? `${pricing.discountPercentage}% OFF` : ''}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs line-clamp-2 leading-snug">
                          {p.name}
                        </h4>
                      </div>

                      {/* Delete / Remove Button */}
                      <button
                        type="button"
                        onClick={() => onRemoveItem(index)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                        title="Delete / Remove item"
                        aria-label={`Remove ${p.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Selected Options Badges */}
                    <div className="flex flex-wrap gap-1 text-[10px] pt-0.5">
                      {item.selectedVariant && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold flex items-center gap-1">
                          <Boxes className="w-3 h-3" />
                          <span>{p.optionName || 'Option'}: {item.selectedVariant}</span>
                        </span>
                      )}
                      {item.selectedShade && (
                        <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 border border-indigo-200 font-bold flex items-center gap-1.5">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-slate-400 shrink-0"
                            style={{ backgroundColor: item.selectedShadeColor || '#FFFFFF' }}
                          />
                          <span>Shade: {item.selectedShade} {item.selectedShadeCode ? `(${item.selectedShadeCode})` : ''}</span>
                        </span>
                      )}
                      {item.selectedColor && !item.selectedShade && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                          Color: {item.selectedColor}
                        </span>
                      )}
                      {item.selectedSize && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                          Size: {item.selectedSize}
                        </span>
                      )}
                      {item.selectedQuality && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                          Quality: {item.selectedQuality}
                        </span>
                      )}
                    </div>

                    {/* Quantity Selector & Price */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50 shadow-xs">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(index, -1)}
                          className="px-2 py-1 hover:bg-slate-200 text-slate-600 text-xs transition-colors"
                          title="Decrease quantity"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2.5 py-0.5 text-xs font-bold text-slate-900 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(index, 1)}
                          className="px-2 py-1 hover:bg-slate-200 text-slate-600 text-xs transition-colors"
                          title="Increase quantity"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="text-right">
                        {pricing.isSaleActive && pricing.regularPriceNumeric > 0 && (
                          <div className="text-[10px] text-slate-400 line-through font-mono">
                            Rs. {(pricing.regularPriceNumeric * (item.quantity || 1)).toLocaleString('en-PK')}
                          </div>
                        )}
                        <div className="text-xs font-extrabold text-slate-900 font-mono">
                          {lineTotal > 0 ? `Rs. ${lineTotal.toLocaleString('en-PK')}` : 'Price on Request'}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Checkout CTA & Subtotal */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 border-t border-slate-100 bg-slate-50 space-y-3 shrink-0">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-900 font-mono text-sm">
                  {subtotal > 0 ? `Rs. ${subtotal.toLocaleString('en-PK')}` : 'Price on Request'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Estimated Delivery:</span>
                <span className="font-semibold font-mono text-slate-700">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600 uppercase font-bold text-[11px]">Free Delivery</span>
                  ) : (
                    `Rs. ${deliveryFee.toLocaleString('en-PK')}`
                  )}
                </span>
              </div>

              {taxAmount > 0 && (
                <div className="flex justify-between items-center">
                  <span>Estimated Tax ({checkoutSettings?.taxRatePercent}%):</span>
                  <span className="font-semibold font-mono text-slate-700">Rs. {taxAmount.toLocaleString('en-PK')}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-extrabold text-sm text-slate-900">
                <span>Grand Total:</span>
                <span className="text-emerald-600 font-mono text-base">
                  {grandTotal > 0 ? `Rs. ${grandTotal.toLocaleString('en-PK')}` : 'Price on Request'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Direct order processing with WhatsApp & cash/bank payment options.</span>
            </div>

            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onClearCart}
              className="w-full py-1 text-[11px] text-slate-400 hover:text-rose-600 text-center transition-colors font-medium cursor-pointer"
            >
              Clear Entire Cart
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
