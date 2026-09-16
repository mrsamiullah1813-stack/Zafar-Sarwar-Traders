import React, { useMemo } from 'react';
import { Award, ArrowRight, ShieldCheck } from 'lucide-react';
import { ProductBrand, Product } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { getBrandSlug } from '../utils/slugUtils';

interface BrandsPageProps {
  brands: ProductBrand[];
  products: Product[];
  onNavigate: (path: string) => void;
}

export const BrandsPage: React.FC<BrandsPageProps> = ({
  brands,
  products,
  onNavigate
}) => {
  // Live product count per brand
  const brandProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (Array.isArray(products)) {
      products.forEach((p) => {
        if (!p.isHidden) {
          if (p.brandId) counts[p.brandId] = (counts[p.brandId] || 0) + 1;
          if (p.brand) counts[p.brand] = (counts[p.brand] || 0) + 1;
        }
      });
    }
    return counts;
  }, [products]);

  const activeBrands = useMemo(() => {
    return (brands || []).filter((b) => b.isActive !== false);
  }, [brands]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[{ label: 'Authorized Brands', active: true }]}
        onNavigateHome={() => onNavigate('/')}
      />

      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>CERTIFIED DIRECT DISTRIBUTOR</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif tracking-tight">
            Official Authorized Brands & Manufacturers
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            We partner directly with Pakistan's most trusted sanitaryware, faucet, pipe, and paint brands. Every product is backed by manufacturer certification and genuine warranty.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeBrands.map((brand) => {
            const slug = getBrandSlug(brand);
            const count = brandProductCounts[brand.id] || brandProductCounts[brand.name] || 0;

            return (
              <div
                key={brand.id}
                onClick={() => onNavigate(`/brand/${slug}`)}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-400 transition-all p-6 flex flex-col justify-between cursor-pointer group"
              >
                <div className="space-y-4">
                  
                  {/* Brand Header with Logo / Icon */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="w-16 h-16 rounded-xl bg-slate-50 border border-slate-200 p-2 flex items-center justify-center overflow-hidden">
                      {brand.logo ? (
                        <img
                          src={brand.logo}
                          alt={brand.name}
                          className="max-h-full max-w-full object-contain filter group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <Award className="w-8 h-8 text-blue-600" />
                      )}
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-bold uppercase">
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                        <span>Official Partner</span>
                      </span>
                      <span className="text-xs font-semibold text-slate-500 mt-1">
                        {count} Available Items
                      </span>
                    </div>
                  </div>

                  {/* Brand Info */}
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {brand.name}
                    </h2>
                    {brand.countryOfOrigin && (
                      <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">
                        Origin: {brand.countryOfOrigin}
                      </div>
                    )}
                    <p className="text-xs text-slate-500 mt-2 line-clamp-3 leading-relaxed">
                      {brand.description || 'Certified premium manufacturing partner with complete product catalog and warranty.'}
                    </p>
                  </div>

                </div>

                <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                  <span>View Brand Products</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
