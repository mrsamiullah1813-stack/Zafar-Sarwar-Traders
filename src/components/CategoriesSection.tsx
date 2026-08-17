import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  MessageSquare, 
  Search, 
  Droplets, 
  ShowerHead, 
  Wrench, 
  Palette, 
  HardHat, 
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { ProductCategory, BusinessConfig } from '../types';

interface CategoriesSectionProps {
  categories: ProductCategory[];
  config: BusinessConfig;
  onSelectCategory: (categoryId: string) => void;
}

export const CategoriesSection: React.FC<CategoriesSectionProps> = ({
  categories,
  config,
  onSelectCategory
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'sanitary' | 'faucets_showers' | 'plumbing' | 'paints_materials' | 'construction'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filterTabs = [
    { id: 'all', label: 'All Categories', icon: Layers },
    { id: 'sanitary', label: 'Sanitaryware & Vanities', icon: Droplets },
    { id: 'faucets_showers', label: 'Faucets & Showers', icon: ShowerHead },
    { id: 'plumbing', label: 'Pipes & Fittings', icon: Wrench },
    { id: 'paints_materials', label: 'Paints & Primers', icon: Palette },
    { id: 'construction', label: 'Hardware & Supplies', icon: HardHat },
  ];

  const safeCategories = Array.isArray(categories) ? categories : [];
  const query = (searchTerm || '').toLowerCase();
  const filteredCategories = safeCategories.filter((cat) => {
    if (!cat) return false;
    const matchesTab = activeTab === 'all' || cat.group === activeTab;
    const catName = (cat.name || '').toLowerCase();
    const catDesc = (cat.description || '').toLowerCase();
    const matchesSearch = catName.includes(query) || catDesc.includes(query);
    return matchesTab && matchesSearch;
  });

  const handleInquireCategory = (e: React.MouseEvent, categoryName: string) => {
    e.stopPropagation();
    const text = encodeURIComponent(`Hello ${config.name}, I am interested in exploring products in the "${categoryName}" category.`);
    window.open(`https://wa.me/${config.whatsapp.replace(/[^0-9]/g, '')}?text=${text}`, '_blank');
  };

  return (
    <section id="categories" className="py-20 bg-slate-50 relative overflow-hidden border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold uppercase tracking-wider mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Shop By Department</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-serif font-black text-slate-900 tracking-tight">
            Explore Product Categories
          </h2>

          <p className="mt-3 text-slate-600 text-sm sm:text-base font-normal leading-relaxed">
            Browse our comprehensive department collections designed for luxury bathrooms, piping infrastructure, paints, and hardware.
          </p>
        </div>

        {/* Filter Bar & Search */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {filterTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full md:w-64">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search category name..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

        </div>

        {/* Grid Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredCategories.map((cat, idx) => (
              <motion.div
                key={cat.id}
                layout
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, delay: idx * 0.02 }}
                onClick={() => onSelectCategory(cat.id)}
                className="group bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl hover:border-blue-500/50 transition-all cursor-pointer flex flex-col justify-between overflow-hidden"
              >
                <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                  <img
                    src={cat.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'}
                    alt={cat.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  {cat.badge && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-blue-600 text-white text-[10px] font-bold uppercase tracking-wider shadow">
                      {cat.badge}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/80 backdrop-blur-sm text-white text-[10px] font-medium">
                    {cat.itemCount}+ Items
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                        {cat.name}
                      </h3>
                      <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    <p className="mt-1.5 text-slate-500 text-xs line-clamp-2 leading-relaxed">
                      {cat.description}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 group-hover:underline">
                      Explore Collection →
                    </span>

                    <button
                      onClick={(e) => handleInquireCategory(e, cat.name)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 text-[11px] font-bold transition-all"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </div>
    </section>
  );
};
