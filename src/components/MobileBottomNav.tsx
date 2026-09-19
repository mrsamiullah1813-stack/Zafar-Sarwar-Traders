import React from 'react';
import { Home, Grid, ShoppingBag, Package, Wrench } from 'lucide-react';

interface MobileBottomNavProps {
  currentPath: string;
  cartCount: number;
  onNavigate: (path: string) => void;
  onOpenCart: () => void;
  onOpenOrders?: () => void;
  onOpenAccount?: () => void;
  onOpenSearch?: () => void;
  onOpenProducts?: () => void;
  onOpenSmartTools?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPath,
  cartCount,
  onNavigate,
  onOpenCart,
  onOpenOrders,
  onOpenAccount,
  onOpenSearch,
  onOpenProducts,
  onOpenSmartTools
}) => {
  const isHome = currentPath === '/';
  const isCategories = currentPath.startsWith('/categor');
  const isProducts = currentPath.startsWith('/store') || currentPath.startsWith('/product');
  const isSmartTools = currentPath.startsWith('/smart-tools') || currentPath.startsWith('/tools');

  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/98 backdrop-blur-lg border-t border-slate-200/90 shadow-[0_-4px_20px_rgba(0,0,0,0.06)] safe-area-bottom select-none"
    >
      <div className="grid grid-cols-5 h-14 sm:h-15 max-w-lg mx-auto px-1 items-center">
        {/* Home */}
        <button
          type="button"
          onClick={() => {
            if (isHome) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              onNavigate('/');
            }
          }}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative ${
            isHome ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home className={`w-5 h-5 ${isHome ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-0.5 leading-tight ${isHome ? 'font-bold' : 'font-medium'}`}>
            Home
          </span>
          {isHome && (
            <span className="absolute top-1 w-1 h-1 bg-blue-600 rounded-full" />
          )}
        </button>

        {/* Categories / Departments */}
        <button
          type="button"
          onClick={() => onNavigate('/categories')}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative ${
            isCategories ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Grid className={`w-5 h-5 ${isCategories ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-0.5 leading-tight ${isCategories ? 'font-bold' : 'font-medium'}`}>
            Categories
          </span>
          {isCategories && (
            <span className="absolute top-1 w-1 h-1 bg-blue-600 rounded-full" />
          )}
        </button>

        {/* Cart Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenCart}
          className="flex flex-col items-center justify-center h-full min-h-[44px] text-slate-500 hover:text-slate-800 transition-colors relative"
          title="Shopping Cart"
        >
          <div className="relative">
            <ShoppingBag className="w-5 h-5 stroke-[1.8]" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-2 bg-rose-600 text-white text-[9px] font-black min-w-[17px] h-[17px] px-1 rounded-full flex items-center justify-center shadow-xs animate-in zoom-in-75">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-0.5 leading-tight font-medium">
            Cart
          </span>
        </button>

        {/* Products / Store Catalog */}
        <button
          type="button"
          onClick={() => {
            if (onOpenProducts) {
              onOpenProducts();
            } else if (isProducts) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              onNavigate('/store');
            }
          }}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative ${
            isProducts ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Products Catalog"
        >
          <Package className={`w-5 h-5 ${isProducts ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-0.5 leading-tight ${isProducts ? 'font-bold' : 'font-medium'}`}>
            Products
          </span>
          {isProducts && (
            <span className="absolute top-1 w-1 h-1 bg-blue-600 rounded-full" />
          )}
        </button>

        {/* Smart Tools Hub */}
        <button
          type="button"
          onClick={() => {
            if (onOpenSmartTools) {
              onOpenSmartTools();
            } else if (isSmartTools) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
              onNavigate('/smart-tools');
            }
          }}
          className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative ${
            isSmartTools ? 'text-blue-600' : 'text-slate-500 hover:text-slate-800'
          }`}
          title="Smart Tools Hub"
        >
          <Wrench className={`w-5 h-5 ${isSmartTools ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
          <span className={`text-[10px] mt-0.5 leading-tight ${isSmartTools ? 'font-bold' : 'font-medium'} whitespace-nowrap`}>
            Smart Tools
          </span>
          {isSmartTools && (
            <span className="absolute top-1 w-1 h-1 bg-blue-600 rounded-full" />
          )}
        </button>
      </div>
    </nav>
  );
};
