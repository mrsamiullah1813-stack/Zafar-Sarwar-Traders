import React from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, Award } from 'lucide-react';
import { ProductBrand, Product } from '../types';
import { CinematicSection } from './cinematic/CinematicSection';

interface BrandsSectionProps {
  brands: ProductBrand[];
  products: Product[];
}

export const BrandsSection: React.FC<BrandsSectionProps> = ({
  brands,
  products
}) => {
  const safeBrands = Array.isArray(brands) ? brands : [];
  const activeBrands = [...safeBrands]
    .filter(b => b.isActive !== false)
    .sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));

  if (activeBrands.length === 0) return null;

  return (
    <CinematicSection id="brands" variant="scale" className="py-16 sm:py-24 relative bg-slate-950/60 border-t border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-950/80 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3 shadow-xl">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Official Partners & Stockists</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white font-serif tracking-tight">
              Authorized <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300">Brands</span>
            </h2>
            <p className="mt-2 text-slate-300 text-sm font-light max-w-xl">
              We stock 100% genuine products directly from top local and international sanitaryware, plumbing, paint, and construction manufacturers.
            </p>
          </div>
          
          <div className="hidden md:flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-300 text-xs font-mono">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Trusted Warranty & Genuine Assurance</span>
          </div>
        </div>

        {/* Brands Grid - DISPLAY ONLY (Non-clickable, no pointer cursor) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.15 }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.05 }
            }
          }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 sm:gap-6"
        >
          {activeBrands.map((brand) => {
            const count = (products || []).filter(
              p => p && brand && (p.brandId === brand.id || (p.brand && brand.name && p.brand.toLowerCase() === brand.name.toLowerCase()))
            ).length;

            return (
              <motion.div
                key={brand.id}
                variants={{
                  hidden: { opacity: 0, scale: 0.95, y: 15 },
                  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4 } }
                }}
                className="cursor-default select-none"
              >
                <div className="relative rounded-2xl bg-slate-900/90 p-4 border border-slate-800/90 flex flex-col items-center text-center justify-between shadow-lg h-full cursor-default select-none">
                  
                  {/* Brand Logo Container */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl bg-slate-950 border border-slate-800 p-2 overflow-hidden flex items-center justify-center mb-3 shrink-0">
                    <img
                      src={brand.logo || 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=300&q=80'}
                      alt={brand.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover rounded-lg pointer-events-none"
                    />
                  </div>

                  {/* Brand Name & Info */}
                  <div className="space-y-1 w-full">
                    <h3 className="text-xs sm:text-sm font-bold text-white line-clamp-1 font-serif tracking-tight">
                      {brand.name}
                    </h3>
                    {brand.description ? (
                      <p className="text-[10px] text-slate-400 line-clamp-1 font-sans">
                        {brand.description}
                      </p>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium block">
                        {count > 0 ? `${count} Catalog Products` : 'Authorized Stockist'}
                      </span>
                    )}
                  </div>

                  {/* Official Badge Tag */}
                  <div className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-950/70 border border-emerald-500/30 shrink-0">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    <span>{brand.officialBadge || '100% Genuine'}</span>
                  </div>

                </div>
              </motion.div>
            );
          })}
        </motion.div>

      </div>
    </CinematicSection>
  );
};

