import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  MessageSquare, 
  Search, 
  Sparkles, 
  Menu, 
  X, 
  ChevronDown, 
  Building2, 
  ShieldCheck,
  LogOut,
  ShoppingBag,
  Heart,
  Scale,
  CheckCircle2,
  Truck,
  Shield,
  HelpCircle,
  MapPin,
  Palette
} from 'lucide-react';
import { AnnouncementBar } from './AnnouncementBar';
import { BusinessConfig, ProductCategory } from '../types';

interface NavbarProps {
  config: BusinessConfig;
  categories?: ProductCategory[];
  isAdmin: boolean;
  cartCount?: number;
  wishlistCount?: number;
  compareCount?: number;
  onOpenCart?: () => void;
  onOpenWishlist?: () => void;
  onOpenCompare?: () => void;
  onOpenThemeModal?: () => void;
  onOpenAdminLogin: () => void;
  onLogoutAdmin: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenAiConsultant: () => void;
  onOpenConfigModal: () => void;
  onSearchClick: () => void;
  onOpenOrderTracking?: () => void;
  onSelectCategory: (categoryId: string) => void;
  onOpenSmartTool?: (toolId: any) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  config,
  categories,
  isAdmin,
  cartCount = 0,
  wishlistCount = 0,
  compareCount = 0,
  onOpenCart,
  onOpenWishlist,
  onOpenCompare,
  onOpenThemeModal,
  onOpenAdminLogin,
  onLogoutAdmin,
  onOpenAdminDashboard,
  onOpenAiConsultant,
  onOpenConfigModal,
  onSearchClick,
  onOpenOrderTracking,
  onSelectCategory,
  onOpenSmartTool
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = totalHeight > 0 ? (window.scrollY / totalHeight) * 100 : 0;
      setScrollProgress(progress);
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const targetWhatsAppNumber = "923108002863";

  const handleWhatsAppClick = () => {
    const text = encodeURIComponent(`Hello ${config.name}, I would like to inquire about sanitaryware, tiles and pricing.`);
    window.open(`https://wa.me/${targetWhatsAppNumber}?text=${text}`, '_blank');
  };

  const defaultCategoryQuickList = [
    { id: 'sanitaryware', name: 'Sanitary Ware' },
    { id: 'wash-basins', name: 'Wash Basins' },
    { id: 'toilets', name: 'Toilets' },
    { id: 'showers', name: 'Showers' },
    { id: 'kitchen-sinks', name: 'Kitchen Sinks' },
    { id: 'bathroom-accessories', name: 'Accessories' },
    { id: 'tiles', name: 'Tiles' },
    { id: 'paints', name: 'Paints' },
    { id: 'hardware', name: 'Hardware' },
    { id: 'pvc-pipes', name: 'PVC Pipes' }
  ];

  const activeCategoriesList = categories && categories.length > 0
    ? categories.filter(c => c.isActive !== false).map(c => ({ id: c.id, name: c.name }))
    : defaultCategoryQuickList;

  return (
    <div className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm transition-all">
      
      {/* Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-[3px] bg-slate-100 z-[100] pointer-events-none">
        <div 
          className="h-full bg-blue-600 transition-all duration-75 ease-out shadow-[0_0_10px_rgba(37,99,235,0.8)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* ANNOUNCEMENT BAR */}
      <AnnouncementBar />

      {/* TOP UTILITY BAR */}
      <div className="bg-slate-900 text-slate-300 text-[11px] py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          
          {/* Left Highlights */}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Genuine Products</span>
            </span>
            <span className="hidden sm:inline text-slate-700">|</span>
            <span className="hidden sm:flex items-center gap-1 text-slate-300">
              <Shield className="w-3.5 h-3.5 text-blue-400" />
              <span>Best Prices Guaranteed</span>
            </span>
            <span className="hidden md:inline text-slate-700">|</span>
            <span className="hidden md:flex items-center gap-1 text-slate-300">
              <Truck className="w-3.5 h-3.5 text-amber-400" />
              <span>Fast Delivery</span>
            </span>
          </div>

          {/* Right Links & Phone / Admin */}
          <div className="flex items-center gap-3">
            {onOpenOrderTracking && (
              <button
                onClick={onOpenOrderTracking}
                className="hover:text-amber-300 text-amber-400 font-bold transition-colors flex items-center gap-1 mr-1"
              >
                <Truck className="w-3.5 h-3.5" />
                <span>Track Order</span>
              </button>
            )}
            <a href="#about" className="hover:text-white transition-colors hidden lg:inline">
              Store Locator
            </a>
            <a href="#faq" className="hover:text-white transition-colors hidden lg:inline">
              Help Center
            </a>

            {isAdmin && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={onOpenAdminDashboard}
                  className="px-2.5 py-0.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-sm"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Admin CMS</span>
                </button>
                <button
                  onClick={onLogoutAdmin}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-rose-900 text-rose-300 font-bold text-[10px]"
                >
                  Exit
                </button>
              </div>
            )}

            <a
              href={`tel:+923108002863`}
              className="flex items-center gap-1 text-white font-bold hover:text-blue-400 transition-colors"
            >
              <Phone className="w-3 h-3 text-blue-400" />
              <span>+92 310 8002863</span>
            </a>
          </div>

        </div>
      </div>

      {/* MAIN HEADER */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Left: ZFT Logo */}
        <div className="flex items-center gap-3">
          <a
            href="#hero"
            onDoubleClick={onOpenAdminLogin}
            className="flex items-center gap-3 group"
            title="ZAFAR SARWAR TRADERS"
          >
            <div className="w-12 h-12 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-blue-400 shadow-md group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Building2 className="w-6 h-6" />
            </div>
          </a>
        </div>

        {/* Center: Large Company Name & Subtitle */}
        <div className="text-center flex-1 max-w-xl hidden md:block">
          <a href="#hero" className="block">
            <h1 className="text-xl lg:text-2xl font-black font-serif tracking-tight text-slate-900 uppercase">
              ZAFAR SARWAR <span className="text-blue-600 font-sans font-light">TRADERS</span>
            </h1>
            <p className="text-[11px] font-bold text-slate-500 tracking-widest uppercase mt-0.5">
              Sanitary & Bathroom Solutions
            </p>
          </a>
        </div>

        {/* Right: Search, Theme, Wishlist, Compare, Cart, WhatsApp Order */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Search Trigger */}
          <button
            onClick={onSearchClick}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
            title="Search Products"
          >
            <Search className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Search</span>
          </button>

          {/* Track Order Button */}
          {onOpenOrderTracking && (
            <button
              onClick={onOpenOrderTracking}
              className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 border border-amber-200/80 text-amber-900 transition-colors flex items-center gap-1.5 text-xs font-bold"
              title="Track Order Status"
            >
              <Truck className="w-4 h-4 text-amber-600" />
              <span className="hidden md:inline">Track Order</span>
            </button>
          )}

          {/* Theme Switcher Trigger */}
          {onOpenThemeModal && (
            <button
              onClick={onOpenThemeModal}
              className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Switch Visual Theme"
            >
              <Palette className="w-4 h-4 text-blue-600" />
              <span className="hidden sm:inline">Theme</span>
            </button>
          )}

          {/* Wishlist */}
          <button
            onClick={onOpenWishlist}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors relative"
            title="Wishlist"
          >
            <Heart className="w-4 h-4 text-rose-500" />
            {wishlistCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {wishlistCount}
              </span>
            )}
          </button>

          {/* Compare */}
          <button
            onClick={onOpenCompare}
            className="p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors relative hidden sm:flex"
            title="Compare Products"
          >
            <Scale className="w-4 h-4 text-amber-600" />
            {compareCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center">
                {compareCount}
              </span>
            )}
          </button>

          {/* Cart Drawer Button */}
          <button
            onClick={onOpenCart}
            className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-900 transition-colors relative flex items-center gap-1.5"
            title="View Shopping Cart"
          >
            <ShoppingBag className="w-4 h-4 text-blue-600" />
            <span className="text-xs font-bold hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="bg-blue-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </button>

          {/* WhatsApp Direct Order Button */}
          <button
            onClick={handleWhatsAppClick}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
          >
            <MessageSquare className="w-4 h-4" />
            <span className="hidden lg:inline">WhatsApp Order</span>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-slate-100 text-slate-700 md:hidden"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

        </div>

      </div>

      {/* CATEGORIES NAVIGATION BAR */}
      <div className="bg-slate-50 border-t border-slate-200/80 px-4 py-2 hidden md:block">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 overflow-x-auto text-xs font-semibold text-slate-700 no-scrollbar">
          
          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] shrink-0">
            Departments:
          </span>

          <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto whitespace-nowrap">
            {activeCategoriesList.map((cat) => (
              <button
                key={cat.id}
                onClick={() => onSelectCategory(cat.id)}
                className="hover:text-blue-600 transition-colors py-1 px-2.5 rounded-lg hover:bg-white"
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="ml-auto flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                if (onOpenSmartTool) onOpenSmartTool('cement-calculator');
                else {
                  const el = document.getElementById('smart-tools');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-xs font-bold text-amber-800 bg-amber-100/90 hover:bg-amber-200 hover:text-amber-900 flex items-center gap-1.5 px-3 py-1 rounded-lg transition-colors border border-amber-300/60"
            >
              <span>Cement Required</span>
            </button>

            <button
              onClick={() => {
                if (onOpenSmartTool) onOpenSmartTool('bathroom-planner');
                else {
                  const el = document.getElementById('smart-tools');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-xs font-bold text-emerald-800 bg-emerald-100/90 hover:bg-emerald-200 hover:text-emerald-900 flex items-center gap-1 px-3 py-1 rounded-lg transition-colors border border-emerald-300/60"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span>Easy Bathroom Planner</span>
            </button>

            <button
              onClick={() => {
                if (onOpenSmartTool) onOpenSmartTool('hub');
                else {
                  const el = document.getElementById('smart-tools');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="text-xs font-bold text-blue-800 bg-blue-100/90 hover:bg-blue-200 hover:text-blue-900 hidden lg:flex items-center gap-1 px-2.5 py-1 rounded-lg transition-colors border border-blue-300/60"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Smart Tools Hub (9 Tools)</span>
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-slate-200 p-4 space-y-4 animate-fadeIn">
          <div className="text-center pb-2 border-b border-slate-100">
            <h2 className="font-serif font-black text-slate-900 text-lg">ZAFAR SARWAR TRADERS</h2>
            <p className="text-xs text-slate-500 font-medium">Sanitary & Bathroom Solutions</p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-slate-700">
            {activeCategoriesList.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { onSelectCategory(cat.id); setMobileMenuOpen(false); }}
                className="p-2 rounded-lg bg-slate-50 text-left hover:bg-blue-50 hover:text-blue-600 truncate"
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-100 space-y-2">
            {onOpenThemeModal && (
              <button
                onClick={() => { onOpenThemeModal(); setMobileMenuOpen(false); }}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center gap-2 border border-slate-200 hover:bg-slate-200 transition-colors"
              >
                <Palette className="w-4 h-4 text-blue-600" />
                <span>Switch Color Theme (5 Styles)</span>
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenSmartTool) onOpenSmartTool('cement-calculator');
                else {
                  const el = document.getElementById('smart-tools');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full py-2.5 rounded-xl bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs flex items-center justify-center gap-2"
            >
              <span>Estimated Cement Required</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenSmartTool) onOpenSmartTool('bathroom-planner');
                else {
                  const el = document.getElementById('smart-tools');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full py-2.5 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold text-xs flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-emerald-700" />
              <span>Easy Bathroom Planner</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (onOpenSmartTool) onOpenSmartTool('hub');
                else {
                  const el = document.getElementById('smart-tools');
                  if (el) el.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="w-full py-2.5 rounded-xl bg-blue-50 text-blue-900 border border-blue-200 font-bold text-xs flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>Explore All 9 Smart Tools Hub</span>
            </button>

            <button
              onClick={() => { handleWhatsAppClick(); setMobileMenuOpen(false); }}
              className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center gap-2"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contact Showroom via WhatsApp</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
