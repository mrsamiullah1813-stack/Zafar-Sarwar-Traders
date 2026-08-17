import React, { useState } from 'react';
import { Search, X, MessageSquare, ArrowRight } from 'lucide-react';
import { Product, ProductCategory, BusinessConfig } from '../types';

interface SearchModalProps {
  products: Product[];
  categories: ProductCategory[];
  config: BusinessConfig;
  onSelectProduct: (product: Product) => void;
  onSelectCategory: (categoryId: string) => void;
  onClose: () => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  products,
  categories,
  config,
  onSelectProduct,
  onSelectCategory,
  onClose
}) => {
  const [query, setQuery] = useState('');

  const safeProducts = Array.isArray(products) ? products : [];
  const safeCategories = Array.isArray(categories) ? categories : [];
  const q = query.trim().toLowerCase();

  const matchedProducts = q
    ? safeProducts.filter(
        (p) =>
          p &&
          ((p.name || '').toLowerCase().includes(q) ||
          (p.category || '').toLowerCase().includes(q) ||
          (p.description || '').toLowerCase().includes(q))
      )
    : [];

  const matchedCategories = q
    ? safeCategories.filter(
        (c) =>
          c &&
          ((c.name || '').toLowerCase().includes(q) ||
          (c.description || '').toLowerCase().includes(q))
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-start justify-center pt-20 p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[80vh] flex flex-col">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Search Bar */}
        <div className="relative mb-6">
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, faucets, showers, pipes, cement..."
            className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-slate-950 border border-blue-500/40 text-sm text-white placeholder-slate-500 focus:outline-none shadow-xl"
          />
          <Search className="w-5 h-5 text-blue-400 absolute left-4 top-4" />
        </div>

        {/* Results Body */}
        <div className="overflow-y-auto space-y-6 flex-1 pr-1">
          {query.trim() === '' ? (
            <div className="text-center py-8">
              <span className="text-xs font-semibold text-slate-400 block mb-3">Popular Searches:</span>
              <div className="flex flex-wrap justify-center gap-2">
                {['Rain Shower', 'Designer Faucet', 'CPVC Pipe', 'Master Paint', 'Wall Hung WC', 'Cement'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-blue-300 hover:border-blue-500"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {/* Category Matches */}
              {matchedCategories.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-2">
                    Matching Categories ({matchedCategories.length})
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {matchedCategories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => { onSelectCategory(cat.id); onClose(); }}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 text-left flex items-center justify-between"
                      >
                        <div>
                          <div className="text-white font-bold text-xs">{cat.name}</div>
                          <div className="text-slate-400 text-[10px] mt-0.5">{cat.itemCount}+ Items</div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product Matches */}
              {matchedProducts.length > 0 && (
                <div>
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block mb-2">
                    Matching Products ({matchedProducts.length})
                  </span>
                  <div className="space-y-2">
                    {matchedProducts.map((prod) => (
                      <div
                        key={prod.id}
                        onClick={() => { onSelectProduct(prod); onClose(); }}
                        className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 flex items-center justify-between gap-3 cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={prod.image}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                          <div>
                            <div className="text-white font-bold text-xs group-hover:text-blue-300">
                              {prod.name}
                            </div>
                            <div className="text-slate-400 text-[10px]">{prod.category}</div>
                          </div>
                        </div>

                        <span className="text-[10px] text-blue-400 font-semibold px-2 py-1 rounded bg-blue-950 border border-blue-800">
                          View Specs
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matchedCategories.length === 0 && matchedProducts.length === 0 && (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No matching products or categories found for "{query}".
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
};
