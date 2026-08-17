import React, { useState } from 'react';
import { 
  Sparkles, 
  Eye, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2,
  Building2
} from 'lucide-react';
import { GalleryItem } from '../types';

interface GallerySectionProps {
  items: GalleryItem[];
}

export const GallerySection: React.FC<GallerySectionProps> = ({ items }) => {
  const [filter, setFilter] = useState<'all' | 'sanitary' | 'faucets' | 'paints' | 'materials'>('all');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  const safeItems = Array.isArray(items) ? items : [];
  const filteredItems = safeItems.filter((item) => filter === 'all' || item.category === filter);

  const handleOpenLightbox = (index: number) => {
    setActiveLightboxIndex(index);
  };

  const handlePrev = () => {
    if (activeLightboxIndex === null) return;
    setActiveLightboxIndex((prev) => (prev === 0 ? filteredItems.length - 1 : prev! - 1));
  };

  const handleNext = () => {
    if (activeLightboxIndex === null) return;
    setActiveLightboxIndex((prev) => (prev === filteredItems.length - 1 ? 0 : prev! + 1));
  };

  return (
    <section id="gallery" className="py-20 lg:py-28 bg-[#030712] relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-1/3 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-blue-900/15 via-slate-900/10 to-transparent rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900/90 border border-blue-500/30 text-blue-300 text-xs font-semibold uppercase tracking-wider mb-3 shadow-xl">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              <span>Showroom & Project Visuals</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-black text-white font-serif tracking-tight">
              Showroom <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-sky-300 to-cyan-300">Gallery</span>
            </h2>
            <p className="mt-2 text-slate-300 text-sm font-light max-w-xl">
              Experience the craftsmanship of our live displays, sanitaryware mockups, paint studios, and building material stock.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {[
              { id: 'all', label: 'All Displays' },
              { id: 'sanitary', label: 'Luxury Bathrooms' },
              { id: 'faucets', label: 'Faucets & Mixers' },
              { id: 'paints', label: 'Paints & Decor' },
              { id: 'materials', label: 'Building Materials' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                  filter === tab.id
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold border-blue-400 shadow-lg shadow-blue-950/40'
                    : 'bg-slate-900/80 text-slate-400 border-slate-800/80 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Masonry / Grid Gallery */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => (
            <div
              key={item.id}
              onClick={() => handleOpenLightbox(idx)}
              className="group relative rounded-3xl overflow-hidden glass-card glass-card-hover border border-slate-800/80 hover:border-blue-500/40 transition-all duration-300 cursor-pointer h-72 shadow-xl hover:shadow-2xl hover:shadow-blue-950/20"
            >
              <img
                src={item.image}
                alt={item.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/30 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

              {/* Title & Overlay info */}
              <div className="absolute bottom-0 inset-x-0 p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform">
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">
                  Zafar Showroom Display
                </span>
                <h3 className="text-white font-bold text-base font-serif">
                  {item.title}
                </h3>
                <p className="text-slate-300 text-xs mt-1 line-clamp-2 font-light opacity-0 group-hover:opacity-100 transition-opacity">
                  {item.description}
                </p>
              </div>

              {/* Lightbox Icon */}
              <div className="absolute top-4 right-4 p-2.5 rounded-2xl bg-slate-900/90 border border-slate-700/80 text-blue-400 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <Maximize2 className="w-4 h-4 text-blue-400" />
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Lightbox Modal */}
      {activeLightboxIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          {/* Close button */}
          <button
            onClick={() => setActiveLightboxIndex(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-blue-600 transition-all z-10"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev button */}
          <button
            onClick={handlePrev}
            className="absolute left-4 sm:left-8 p-3 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-blue-600 transition-all z-10"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next button */}
          <button
            onClick={handleNext}
            className="absolute right-4 sm:right-8 p-3 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-blue-600 transition-all z-10"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center">
            <img
              src={filteredItems[activeLightboxIndex].image}
              alt={filteredItems[activeLightboxIndex].title}
              referrerPolicy="no-referrer"
              className="max-h-[65vh] w-auto object-contain rounded-2xl border border-slate-800 shadow-2xl"
            />

            <div className="mt-6 text-center max-w-xl">
              <h3 className="text-xl font-bold text-white font-serif">
                {filteredItems[activeLightboxIndex].title}
              </h3>
              <p className="mt-2 text-slate-300 text-xs sm:text-sm font-light">
                {filteredItems[activeLightboxIndex].description}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
