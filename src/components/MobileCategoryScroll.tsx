import React from 'react';
import { ProductCategory } from '../types';
import { getCategorySlug } from '../utils/slugUtils';
import { Grid, ChevronRight, Layers } from 'lucide-react';

interface MobileCategoryScrollProps {
  categories: ProductCategory[];
  onSelectCategory: (categoryId: string) => void;
  onNavigateToCategories?: () => void;
  activeCategoryId?: string | null;
}

export const MobileCategoryScroll: React.FC<MobileCategoryScrollProps> = ({
  categories,
  onSelectCategory,
  onNavigateToCategories,
  activeCategoryId
}) => {
  const safeCategories = Array.isArray(categories) ? categories : [];

  if (safeCategories.length === 0) return null;

  return (
    <div className="md:hidden bg-white border-b border-slate-200/80 shadow-xs select-none">
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1">
        <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-700">
          <Layers className="w-3.5 h-3.5 text-blue-600" />
          <span>Shop Departments</span>
        </div>
        {onNavigateToCategories && (
          <button
            type="button"
            onClick={onNavigateToCategories}
            className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-0.5 active:opacity-75"
          >
            <span>See All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Horizontal Touch Scroll Track */}
      <div className="flex items-start gap-3 px-3 py-2 overflow-x-auto no-scrollbar overscroll-contain">
        {/* All Departments leading shortcut */}
        {onNavigateToCategories && (
          <button
            type="button"
            onClick={onNavigateToCategories}
            className="flex flex-col items-center gap-1.5 shrink-0 group active:scale-95 transition-transform"
          >
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm border border-blue-500/30">
              <Grid className="w-6 h-6" />
            </div>
            <span className="text-[10.5px] font-bold text-slate-800 text-center max-w-[64px] truncate leading-tight">
              All
            </span>
          </button>
        )}

        {/* Categories items */}
        {safeCategories.map((cat) => {
          const isActive = activeCategoryId === cat.id;
          const displayImage = cat.iconImage || cat.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=200&q=80';

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className="flex flex-col items-center gap-1.5 shrink-0 group active:scale-95 transition-transform"
            >
              <div
                className={`relative w-13 h-13 rounded-2xl bg-slate-100 overflow-hidden border p-0.5 transition-all ${
                  isActive
                    ? 'border-blue-600 ring-2 ring-blue-500/30 shadow-md'
                    : 'border-slate-200/90 shadow-xs'
                }`}
              >
                <img
                  src={displayImage}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-xl"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.src = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=200&q=80';
                  }}
                />
                {cat.badge && (
                  <span className="absolute top-0 right-0 px-1 py-0.2 bg-red-600 text-white text-[7.5px] font-black uppercase rounded-bl-md">
                    {cat.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10.5px] font-semibold text-center max-w-[64px] truncate leading-tight ${
                  isActive ? 'text-blue-600 font-bold' : 'text-slate-800'
                }`}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
