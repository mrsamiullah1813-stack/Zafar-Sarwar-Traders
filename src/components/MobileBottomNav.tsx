import React from 'react';
import { Home, Grid, ShoppingBag, Package, User } from 'lucide-react';

interface MobileBottomNavProps {
  currentPath: string;
  cartCount: number;
  onNavigate: (path: string) => void;
  onOpenCart: () => void;
  onOpenOrders?: () => void;
  onOpenAccount?: () => void;
  onOpenSearch?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentPath,
  cartCount,
  onNavigate,
  onOpenCart,
  onOpenOrders,
  onOpenAccount,
  onOpenSearch
}) => {
  const isHome = currentPath === '/';
  const isCategories = currentPath.startsWith('/categor');
  const isStore = currentPath.startsWith('/store');

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

        {/* Orders / Tracking */}
        <button
          type="button"
          onClick={onOpenOrders}
          className="flex flex-col items-center justify-center h-full min-h-[44px] text-slate-500 hover:text-slate-800 transition-colors relative"
          title="Track Orders"
        >
          <Package className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 leading-tight font-medium">
            Orders
          </span>
        </button>

        {/* Customer Account / Profile */}
        <button
          type="button"
          onClick={onOpenAccount}
          className="flex flex-col items-center justify-center h-full min-h-[44px] text-slate-500 hover:text-slate-800 transition-colors relative"
          title="My Account"
        >
          <User className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] mt-0.5 leading-tight font-medium">
            Account
          </span>
        </button>
      </div>
    </nav>
  );
};
