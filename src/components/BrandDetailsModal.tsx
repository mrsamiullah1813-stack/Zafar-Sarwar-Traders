import React from 'react';
import { X, MessageSquare, Sparkles, Check, ChevronRight, ShieldCheck, Tag } from 'lucide-react';
import { ProductBrand, Product } from '../types';

interface BrandDetailsModalProps {
  brand: ProductBrand | null;
  brandProducts: Product[];
  onSelectProduct: (product: Product) => void;
  onClose: () => void;
}

export const BrandDetailsModal: React.FC<BrandDetailsModalProps> = ({
  brand,
  brandProducts,
  onSelectProduct,
  onClose
}) => {
  if (!brand) return null;

  const targetWhatsAppNumber = "923108002863";

  const handleBrandWhatsAppInquiry = () => {
    const message = `Hello,\n\nI am inquiring about products from ${brand.name}.\n\nPlease share availability, catalog, and wholesale rate sheet.`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${targetWhatsAppNumber}?text=${encoded}`, '_blank');
  };

  const safeBrandProducts = Array.isArray(brandProducts) ? brandProducts : [];
  const featuredBrandProducts = safeBrandProducts.filter(p => p && p.isFeatured);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl relative my-auto max-h-[92vh] flex flex-col glow-blue-ambient">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2.5 rounded-full bg-slate-950/80 border border-slate-700 text-slate-300 hover:text-white transition-all z-20 shadow-xl"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand Banner Header */}
        <div className="relative h-48 sm:h-64 w-full bg-slate-950 overflow-hidden shrink-0">
          <img
            src={brand.bannerImage || 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80'}
            alt={brand.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />

          {/* Logo overlay badge */}
          <div className="absolute bottom-4 left-6 sm:left-8 flex items-end gap-4">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-slate-950 border-2 border-blue-500/50 p-2 shadow-2xl shrink-0 flex items-center justify-center overflow-hidden">
              <img
                src={brand.logo}
                alt={brand.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="mb-1">
              <span className="px-2.5 py-0.5 rounded-md bg-blue-950 border border-blue-500/40 text-blue-300 text-[10px] font-bold uppercase tracking-wider mb-1 inline-block">
                Authorized Brand Partner
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif drop-shadow-md">
                {brand.name}
              </h2>
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6">
          
          {/* Description & Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <div className="max-w-xl space-y-1">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">About Brand</span>
              <p className="text-slate-300 text-xs sm:text-sm leading-relaxed font-light">
                {brand.description}
              </p>
            </div>

            <button
              onClick={handleBrandWhatsAppInquiry}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 shrink-0 border border-emerald-400/30"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Inquire {brand.name} Rates</span>
            </button>
          </div>

          {/* Brand Product Grid */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>{brand.name} Product Collection ({safeBrandProducts.length})</span>
              </h3>
            </div>

            {safeBrandProducts.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {safeBrandProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => onSelectProduct(prod)}
                    className="group glass-card p-3 rounded-2xl border border-slate-800/80 hover:border-blue-500/40 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="relative h-32 w-full rounded-xl overflow-hidden bg-slate-950 mb-2">
                      <img
                        src={prod.image}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />

                      {/* Stock badge */}
                      {prod.stockStatus && !prod.hideStockBadge && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-800 text-[9px] font-bold text-emerald-300">
                          {prod.stockStatus}
                        </div>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] text-blue-400 font-bold uppercase block">
                        {prod.category}
                      </span>
                      <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-blue-300 transition-colors">
                        {prod.name}
                      </h4>
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-slate-300">
                          {prod.isPriceOnRequest ? 'Price on Request' : (prod.price || 'Call for Price')}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No products currently listed specifically under this brand. Contact showroom via WhatsApp for custom brand orders.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
