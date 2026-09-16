import React, { useState, useMemo } from 'react';
import { Layers, Search, ArrowRight, Sparkles } from 'lucide-react';
import { ProductCategory, Product } from '../types';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { getCategorySlug } from '../utils/slugUtils';

interface CategoriesPageProps {
  categories: ProductCategory[];
  products: Product[];
  onNavigate: (path: string) => void;
}

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  categories,
  products,
  onNavigate
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');

  const groups = [
    { id: 'all', label: 'All Departments' },
    { id: 'sanitary', label: 'Sanitaryware' },
    { id: 'faucets_showers', label: 'Faucets & Showers' },
    { id: 'plumbing', label: 'Plumbing & Pipes' },
    { id: 'paints_materials', label: 'Paints & Materials' },
    { id: 'construction', label: 'Construction' }
  ];

  // Compute live product counts per category
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    if (Array.isArray(products)) {
      products.forEach((p) => {
        if (!p.isHidden) {
          if (p.categoryId) {
            counts[p.categoryId] = (counts[p.categoryId] || 0) + 1;
          }
        }
      });
    }
    return counts;
  }, [products]);

  const filteredCategories = useMemo(() => {
    return (categories || []).filter((cat) => {
      if (cat.isActive === false) return false;

      if (selectedGroup !== 'all' && cat.group !== selectedGroup) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = cat.name.toLowerCase().includes(q);
        const matchDesc = cat.description?.toLowerCase().includes(q);
        if (!matchName && !matchDesc) return false;
      }

      return true;
    });
  }, [categories, selectedGroup, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[{ label: 'Product Categories', active: true }]}
        onNavigateHome={() => onNavigate('/')}
      />

      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Layers className="w-3.5 h-3.5" />
            <span>PRODUCT DEPARTMENTS</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif tracking-tight">
            Sanitaryware & Building Material Categories
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Explore our organized departments from luxury bathroom suites and brass faucets to certified plumbing pipes, heavy water tanks, and weather-resistant architectural paints.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6">
        
        {/* Search & Department Tabs */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Department Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
            {groups.map((grp) => (
              <button
                key={grp.id}
                type="button"
                onClick={() => setSelectedGroup(grp.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedGroup === grp.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                {grp.label}
              </button>
            ))}
          </div>

          {/* Search Category */}
          <div className="relative w-full md:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-slate-900"
            />
          </div>

        </div>

        {/* Categories Grid */}
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCategories.map((cat) => {
              const slug = getCategorySlug(cat);
              const count = categoryCounts[cat.id] ?? cat.itemCount ?? 0;

              return (
                <div
                  key={cat.id}
                  onClick={() => onNavigate(`/category/${slug}`)}
                  className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-400 transition-all overflow-hidden flex flex-col cursor-pointer group"
                >
                  {/* Category Image */}
                  <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={cat.bannerImage || cat.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                    {/* Badge */}
                    {cat.badge && (
                      <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold uppercase shadow-sm">
                        {cat.badge}
                      </div>
                    )}

                    {/* Count Pill */}
                    <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-lg bg-slate-900/90 text-white text-[11px] font-bold backdrop-blur-sm">
                      {count} Products
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h2 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {cat.name}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {cat.description || 'Premium selection of verified building and sanitaryware products.'}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-blue-600 group-hover:text-blue-700">
                      <span>Explore Products</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-2">
            <h3 className="text-base font-bold text-slate-800">No categories match your search</h3>
            <p className="text-xs text-slate-500">Try searching for other terms or reset the department filter.</p>
          </div>
        )}

      </div>
    </div>
  );
};
