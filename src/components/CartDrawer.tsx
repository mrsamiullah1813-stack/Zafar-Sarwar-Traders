import React from 'react';
import { X, Trash2, ShoppingBag, Plus, Minus, ArrowRight, ShieldCheck, Tag, CheckCircle2, Flame } from 'lucide-react';
import { BusinessConfig, CartItem, CheckoutSettings } from '../types';
import { getProductPricingDetails } from '../utils/pricingUtils';

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
  if (!isOpen) return null;

  const items = Array.isArray(cartItems) ? cartItems : [];
  const totalItemCount = items.reduce((acc, item) => acc + (item?.quantity || 0), 0);

  const calculateSubtotal = () => {
    return items.reduce((acc, item) => {
      if (!item?.product) return acc;
      const pricing = getProductPricingDetails(item.product);
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

  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/65 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between border-l border-slate-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-white text-lg leading-tight">Shopping Cart</h3>
              <p className="text-xs text-slate-300">{totalItemCount} {totalItemCount === 1 ? 'item' : 'items'} in cart</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-300">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-serif font-bold text-slate-700 text-base">Your Cart is Empty</h4>
              <p className="text-xs text-slate-500">Explore our luxury sanitary, tiles & bath collections to add products.</p>
            </div>
          ) : (
            items.map((item, index) => {
              const p = item.product;
              if (!p) return null;

              const pricing = getProductPricingDetails(p);
              const numericPrice = pricing.effectivePriceNumeric;
              const lineTotal = numericPrice * (item.quantity || 1);

              return (
                <div key={index} className="pt-4 first:pt-0 flex gap-3 items-start">
                  <img
                    src={p.images?.[0] || p.image}
                    alt={p.name}
                    className="w-16 h-16 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0 mt-0.5"
                  />
                  
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex justify-between items-start gap-1">
                      <div>
                        <div className="flex items-center gap-1.5">
                          {p.brand && <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">{p.brand}</span>}
                          {pricing.isSaleActive && (
                            <span className="px-1.5 py-0.2 rounded bg-rose-100 text-rose-700 font-bold text-[9px] font-mono">
                              SALE {pricing.discountPercentage > 0 ? `${pricing.discountPercentage}% OFF` : ''}
                            </span>
                          )}
                        </div>
                        <h4 className="font-bold text-slate-900 text-xs line-clamp-1 leading-snug">{p.name}</h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => onRemoveItem(index)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Selected Options Badges */}
                    <div className="flex flex-wrap gap-1 text-[10px] pt-0.5">
                      {item.selectedColor && (
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
                      {item.selectedVariant && (
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                          Variant: {item.selectedVariant}
                        </span>
                      )}
                    </div>

                    {/* Quantity Selector & Price */}
                    <div className="flex items-center justify-between pt-1">
                      <div className="inline-flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(index, -1)}
                          className="px-2 py-1 hover:bg-slate-200 text-slate-600 text-xs transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 py-0.5 text-xs font-bold text-slate-900 font-mono">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(index, 1)}
                          className="px-2 py-1 hover:bg-slate-200 text-slate-600 text-xs transition-colors"
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
                        <span className={`text-xs font-bold font-mono ${pricing.isSaleActive ? 'text-rose-600' : 'text-slate-900'}`}>
                          {lineTotal > 0 ? `Rs. ${lineTotal.toLocaleString('en-PK')}` : pricing.effectivePriceString}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Checkout CTA */}
        {items.length > 0 && (
          <div className="p-5 border-t border-slate-100 bg-slate-50 space-y-3 shrink-0">
            <div className="space-y-1.5 text-xs text-slate-600">
              <div className="flex justify-between items-center">
                <span>Subtotal:</span>
                <span className="font-bold text-slate-900 font-mono">
                  {subtotal > 0 ? `Rs. ${subtotal.toLocaleString('en-PK')}` : 'Price on Request'}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span>Estimated Delivery:</span>
                <span className="font-semibold font-mono text-slate-700">
                  {deliveryFee === 0 ? (
                    <span className="text-emerald-600 uppercase font-bold text-[11px]">Free</span>
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
              <span>Complete order details & send directly on WhatsApp.</span>
            </div>

            <button
              onClick={() => {
                onClose();
                onProceedToCheckout();
              }}
              className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all active:scale-98"
            >
              <span>Proceed to Order</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onClearCart}
              className="w-full py-1 text-[11px] text-slate-400 hover:text-rose-600 text-center transition-colors font-medium"
            >
              Clear Entire Cart
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
