import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Maximize2,
  MapPin,
  Tag
} from 'lucide-react';
import { GalleryItem } from '../types';

interface GallerySectionProps {
  items: GalleryItem[];
}

const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  sanitary: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
  faucets: 'https://images.unsplash.com/photo-1585412727339-54e4bae3bbf9?auto=format&fit=crop&w=1200&q=80',
  paints: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=1200&q=80',
  materials: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
  default: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
};

const getCategoryFallbackImage = (category?: string): string => {
  return (category && CATEGORY_FALLBACK_IMAGES[category]) || CATEGORY_FALLBACK_IMAGES.default;
};

export const GallerySection: React.FC<GallerySectionProps> = ({ items }) => {
  const [filter, setFilter] = useState<'all' | 'sanitary' | 'faucets' | 'paints' | 'materials'>('all');
  const [activeLightboxIndex, setActiveLightboxIndex] = useState<number | null>(null);

  const safeItems = Array.isArray(items) ? items : [];
  const filteredItems = safeItems
    .filter((item) => filter === 'all' || item.category === filter)
    .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));

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

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeLightboxIndex === null) return;
      if (e.key === 'Escape') setActiveLightboxIndex(null);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, filteredItems.length]);

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
        {filteredItems.length === 0 ? (
          <div className="py-16 text-center rounded-3xl bg-slate-900/50 border border-slate-800/80 p-8">
            <Sparkles className="w-10 h-10 text-blue-400/60 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-white">No Displays in this Category</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
              Select another category filter or add showroom photos through the Admin Dashboard.
            </p>
          </div>
        ) : (
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
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (!target.dataset.fallbackApplied) {
                      target.dataset.fallbackApplied = 'true';
                      if (target.src.includes('/src/assets/images/')) {
                        target.src = target.src.replace('/src/assets/images/', '/assets/images/');
                        return;
                      }
                      target.src = getCategoryFallbackImage(item.category);
                    }
                  }}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 filter brightness-90 group-hover:brightness-100"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-[#030712]/40 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

                {/* Top Badges */}
                <div className="absolute top-4 left-4 right-14 flex items-center gap-2 flex-wrap">
                  {item.tag ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-500/30 backdrop-blur-md border border-blue-400/40 text-blue-200 text-[10px] font-bold tracking-wide shadow-md">
                      <Tag className="w-2.5 h-2.5 text-blue-300" />
                      {item.tag}
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400/90 bg-slate-900/80 px-2 py-0.5 rounded-full border border-slate-800 backdrop-blur-sm">
                      Zafar Showroom Display
                    </span>
                  )}
                  {item.location && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-300 text-[10px] font-medium truncate max-w-[140px]">
                      <MapPin className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                      <span className="truncate">{item.location}</span>
                    </span>
                  )}
                </div>

                {/* Title & Overlay info */}
                <div className="absolute bottom-0 inset-x-0 p-6 transform translate-y-1 group-hover:translate-y-0 transition-transform">
                  <h3 className="text-white font-bold text-base font-serif">
                    {item.title}
                  </h3>
                  <p className="text-slate-300 text-xs mt-1 line-clamp-2 font-light opacity-90 group-hover:opacity-100 transition-opacity">
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
        )}

      </div>

      {/* Lightbox Modal */}
      {activeLightboxIndex !== null && filteredItems[activeLightboxIndex] && (
        <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          {/* Close button */}
          <button
            onClick={() => setActiveLightboxIndex(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-blue-600 transition-all z-10"
            aria-label="Close Preview"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Prev button */}
          <button
            onClick={handlePrev}
            className="absolute left-4 sm:left-8 p-3 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-blue-600 transition-all z-10"
            aria-label="Previous Photo"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          {/* Next button */}
          <button
            onClick={handleNext}
            className="absolute right-4 sm:right-8 p-3 rounded-full bg-slate-900/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-blue-600 transition-all z-10"
            aria-label="Next Photo"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          {/* Content */}
          <div className="max-w-4xl w-full max-h-[88vh] flex flex-col items-center">
            <img
              src={filteredItems[activeLightboxIndex].image}
              alt={filteredItems[activeLightboxIndex].title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (!target.dataset.fallbackApplied) {
                  target.dataset.fallbackApplied = 'true';
                  if (target.src.includes('/src/assets/images/')) {
                    target.src = target.src.replace('/src/assets/images/', '/assets/images/');
                    return;
                  }
                  target.src = getCategoryFallbackImage(filteredItems[activeLightboxIndex].category);
                }
              }}
              className="max-h-[62vh] w-auto object-contain rounded-2xl border border-slate-800 shadow-2xl"
            />

            <div className="mt-5 text-center max-w-xl">
              <div className="flex items-center justify-center gap-2 mb-2">
                {filteredItems[activeLightboxIndex].tag && (
                  <span className="px-2.5 py-0.5 rounded-full bg-blue-600/30 border border-blue-400/40 text-blue-300 text-xs font-semibold">
                    {filteredItems[activeLightboxIndex].tag}
                  </span>
                )}
                {filteredItems[activeLightboxIndex].location && (
                  <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <MapPin className="w-3 h-3 text-sky-400" />
                    {filteredItems[activeLightboxIndex].location}
                  </span>
                )}
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-white font-serif">
                {filteredItems[activeLightboxIndex].title}
              </h3>
              <p className="mt-2 text-slate-300 text-xs sm:text-sm font-light leading-relaxed">
                {filteredItems[activeLightboxIndex].description}
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
