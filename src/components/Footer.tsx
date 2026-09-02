import React from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  MessageSquare, 
  Mail, 
  ArrowUpRight, 
  ShieldCheck, 
  Heart,
  Palette,
  Lock
} from 'lucide-react';
import { BusinessConfig } from '../types';

interface FooterProps {
  config: BusinessConfig;
  onSelectCategory: (categoryId: string) => void;
  onOpenAdminLogin?: () => void;
  onReplayIntro?: () => void;
  onOpenThemeModal?: () => void;
  onOpenDeliveryChecker?: () => void;
  onOpenDeliveryAreas?: () => void;
}

export const Footer: React.FC<FooterProps> = ({ 
  config, 
  onSelectCategory, 
  onOpenAdminLogin, 
  onReplayIntro, 
  onOpenThemeModal,
  onOpenDeliveryChecker,
  onOpenDeliveryAreas 
}) => {
  const handleWhatsApp = () => {
    const rawNumber = config.whatsapp || config.phone || '923108002863';
    const targetPhone = rawNumber.replace(/[^0-9]/g, '') || '923108002863';
    const text = encodeURIComponent(`Hello ${config.name || 'Zafar Sarwar Traders'}, I am visiting your website and would like to inquire about your products.`);
    window.open(`https://wa.me/${targetPhone}?text=${text}`, '_blank');
  };

  return (
    <footer className="bg-[#030712] text-slate-400 text-xs border-t border-slate-800/80 pt-16 pb-8 relative overflow-hidden">
      {/* Background Lighting */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-64 bg-gradient-to-t from-blue-900/10 via-slate-900/10 to-transparent blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-slate-800/80">
          
          {/* Col 1: Brand Info */}
          <div className="lg:col-span-4 space-y-4">
            <a href="#hero" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-[1.5px] shadow-lg shadow-amber-950/20">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <span className="text-lg font-black text-white font-serif tracking-tight">
                ZAFAR SARWAR <span className="text-amber-400 font-sans font-light">TRADERS</span>
              </span>
            </a>

            <p className="text-slate-400 leading-relaxed font-light">
              Pakistan's premier destination for luxury sanitaryware, designer faucets, thermostatic rain showers, CPVC/UPVC piping systems, Master paints, cement, and comprehensive construction materials.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleWhatsApp}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-semibold hover:bg-emerald-600 hover:text-white transition-all shadow-md"
              >
                <MessageSquare className="w-4 h-4" />
                <span>WhatsApp Official Hotline</span>
              </button>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-white font-bold text-sm font-serif">Quick Navigation</h4>
            <ul className="space-y-2">
              {onOpenDeliveryChecker && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenDeliveryChecker}
                    className="text-amber-400 hover:text-amber-300 font-bold transition-colors flex items-center gap-1 text-left"
                  >
                    <span>🚚 Delivery Checker</span>
                  </button>
                </li>
              )}
              {onOpenDeliveryAreas && (
                <li>
                  <button
                    type="button"
                    onClick={onOpenDeliveryAreas}
                    className="text-slate-300 hover:text-white transition-colors text-left"
                  >
                    Delivery Areas Directory
                  </button>
                </li>
              )}
              {['Home', 'About Us', 'Categories', 'Products', 'Why Us', 'Gallery', 'Reviews', 'FAQ', 'Contact'].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                    className="hover:text-amber-300 transition-colors"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: Categories */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-white font-bold text-sm font-serif">Top Product Lines</h4>
            <ul className="space-y-2">
              {[
                { name: 'Luxury Rain Showers', id: 'rain-showers' },
                { name: 'Designer Faucets & Mixers', id: 'designer-faucets' },
                { name: 'Rimless Wall-Hung Toilets', id: 'toilets' },
                { name: 'Waterproof Vanity Cabinets', id: 'vanity-cabinets' },
                { name: 'CPVC & UPVC Pressure Pipes', id: 'cpvc-pipes' },
                { name: 'Weather-Shield Exterior Paints', id: 'paints' },
                { name: 'Grade 53 Portland Cement', id: 'cement' },
              ].map((cat) => (
                <li key={cat.id}>
                  <button
                    onClick={() => onSelectCategory(cat.id)}
                    className="hover:text-amber-300 transition-colors text-left"
                  >
                    {cat.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: Contact Info */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-white font-bold text-sm font-serif">Showroom Contact</h4>
            <div className="space-y-2 text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="text-slate-300 font-light">{config.address}</span>
                  <a
                    href="https://maps.app.goo.gl/NKv1i28dGbyLzudR6"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-[11px] text-amber-400 hover:text-amber-300 font-bold transition-colors"
                  >
                    📍 Get Directions on Google Maps →
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-400 shrink-0" />
                <a href={`tel:${config.phone}`} className="hover:text-white font-light">{config.phone}</a>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400 shrink-0" />
                <a href={`mailto:${config.email}`} className="hover:text-white font-light">{config.email}</a>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar & Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} <strong className="text-slate-300">{config.name}</strong>. All Rights Reserved.
          </div>

          <div className="flex items-center space-x-4">
            {onOpenThemeModal && (
              <button
                onClick={onOpenThemeModal}
                className="text-blue-400 hover:text-blue-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Palette className="w-3.5 h-3.5 text-blue-400" />
                <span>Color Themes</span>
              </button>
            )}
            {onOpenAdminLogin && (
              <button
                onClick={onOpenAdminLogin}
                className="text-slate-400 hover:text-cyan-300 font-medium transition-colors flex items-center gap-1 cursor-pointer"
                title="Admin Management Portal"
              >
                <Lock className="w-3 h-3 text-slate-500 hover:text-cyan-400" />
                <span>Admin Login</span>
              </button>
            )}
            {onReplayIntro && (
              <button
                onClick={onReplayIntro}
                className="text-amber-400 hover:text-amber-300 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
              >
                <span>✨ Replay Cinematic Intro</span>
              </button>
            )}
            <a href="#hero" className="hover:text-blue-400 transition-colors">Privacy Policy</a>
            <span>•</span>
            <a href="#hero" className="hover:text-blue-400 transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
};
