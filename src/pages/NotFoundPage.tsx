import React, { useEffect } from 'react';
import { 
  Home, 
  ShoppingBag, 
  Layers, 
  Search, 
  ArrowLeft, 
  HelpCircle,
  PhoneCall,
  Sparkles
} from 'lucide-react';
import { updateSeoMetadata } from '../utils/seoUtils';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
  attemptedPath?: string;
  customMessage?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigate,
  attemptedPath = '',
  customMessage
}) => {
  useEffect(() => {
    updateSeoMetadata({
      title: 'Page Not Found (404) | Zafar Sarwar Traders',
      description: 'The requested product, category, or page could not be found on Zafar Sarwar Traders online store.',
      path: attemptedPath || '/404'
    });
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [attemptedPath]);

  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/store?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      onNavigate('/store');
    }
  };

  return (
    <div className="min-h-[80vh] bg-slate-50 text-slate-900 flex flex-col items-center justify-center px-4 py-16 sm:py-24">
      <div className="max-w-xl w-full text-center space-y-8">
        
        {/* Visual 404 Badge */}
        <div className="inline-flex items-center justify-center">
          <div className="relative">
            <span className="text-8xl sm:text-9xl font-black font-serif tracking-tighter text-slate-200 select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="px-4 py-1.5 rounded-full bg-blue-600 text-white text-xs sm:text-sm font-black uppercase tracking-wider shadow-lg shadow-blue-600/30">
                Page Not Found
              </div>
            </div>
          </div>
        </div>

        {/* Heading & Helpful Message */}
        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-black font-serif text-slate-900 tracking-tight">
            {customMessage || "We couldn't find the page you're looking for"}
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm max-w-md mx-auto leading-relaxed">
            The item or URL you requested may have been moved, renamed, or is currently unavailable in our live showroom inventory.
          </p>
          {attemptedPath && (
            <div className="inline-block px-3 py-1 rounded-lg bg-slate-200/70 text-slate-600 font-mono text-xs max-w-full truncate">
              {attemptedPath}
            </div>
          )}
        </div>

        {/* Quick Search Box */}
        <form onSubmit={handleSearchSubmit} className="relative max-w-md mx-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search all products, sanitaryware, pipes, paints..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-24 py-3 bg-white border border-slate-300 rounded-2xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
          />
          <button
            type="submit"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Search
          </button>
        </form>

        {/* Navigation Action Buttons */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold shadow-md transition-all active:scale-98 cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>Back to Home</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/store')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all active:scale-98 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Shop Products</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('/categories')}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs sm:text-sm font-bold transition-all active:scale-98 cursor-pointer"
          >
            <Layers className="w-4 h-4 text-slate-500" />
            <span>Browse Categories</span>
          </button>
        </div>

        {/* Contact Support Footer */}
        <div className="pt-8 border-t border-slate-200/80 flex items-center justify-center gap-2 text-xs text-slate-500">
          <PhoneCall className="w-3.5 h-3.5 text-slate-400" />
          <span>Need help finding a specific product?</span>
          <button
            type="button"
            onClick={() => onNavigate('/contact')}
            className="text-blue-600 font-bold hover:underline cursor-pointer"
          >
            Contact our Showroom
          </button>
        </div>

      </div>
    </div>
  );
};
