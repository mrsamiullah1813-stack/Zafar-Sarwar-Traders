import React from 'react';
import { ShieldCheck, Award, Truck, MapPin, Phone, MessageCircle, Clock, CheckCircle2 } from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { BusinessConfig, StatCounter } from '../types';

interface AboutPageProps {
  config: BusinessConfig;
  stats?: StatCounter[];
  onNavigate: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ config, stats = [], onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[{ label: 'About Us', active: true }]}
        onNavigateHome={() => onNavigate('/')}
      />

      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-12 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Award className="w-3.5 h-3.5" />
            <span>ESTABLISHED 1990 • CHINIOT, PAKISTAN</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif tracking-tight">
            About Zafar Sarwar Traders
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            More than three decades of trust, supplying high-grade sanitaryware, plumbing hardware, water storage tanks, and construction materials to homeowners and contractors.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-12">
        
        {/* Story Section */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-sm space-y-6">
          <div className="space-y-3">
            <h2 className="text-xl sm:text-2xl font-black font-serif text-slate-900">
              Your Trusted Sanitary & Building Supply Partner
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Founded over 30 years ago in Chiniot, <strong>Zafar Sarwar Traders</strong> has grown from a specialized local distributor into a nationwide provider of certified plumbing, sanitary fittings, and structural materials. We eliminate middlemen markups by partnering directly with the country's most respected manufacturers.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Whether you are renovating a single washroom or constructing a full-scale residential plaza or industrial project, our inventory includes vetted products from Master Sanitary Ware, Sonex, Faisal Sanitary, Porta, IIL G.I. Pipes, and Berger Paints.
            </p>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
              <ShieldCheck className="w-6 h-6 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">100% Genuine Guaranteed</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Direct factory sourcing guarantees no imitation goods or downgraded grade-B ceramic ware.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
              <Award className="w-6 h-6 text-amber-600" />
              <h3 className="text-sm font-bold text-slate-900">Direct Wholesale Pricing</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Competitive pricing for both bulk institutional construction and individual retail homebuilders.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/70 space-y-2">
              <Truck className="w-6 h-6 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Secure Road Cargo Delivery</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Carefully crated sanitary logistics with verified road cargo tracking to all Pakistani cities.
              </p>
            </div>
          </div>
        </div>

        {/* Showroom & Facility Details */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-10 shadow-lg space-y-6">
          <h2 className="text-xl sm:text-2xl font-bold font-serif">
            Visit Our Main Showroom
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-slate-300 text-xs sm:text-sm">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white mb-1">Showroom Address</div>
                <div>{config?.address || 'Near Railway Road, Main Bazar, Chiniot, Punjab, Pakistan'}</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white mb-1">Operating Hours</div>
                <div>Saturday – Thursday: 8:30 AM – 8:30 PM</div>
                <div>Friday: 2:30 PM – 8:30 PM</div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-white mb-1">Helpline & WhatsApp</div>
                <div>{config?.phone || '+92 310 8002863'}</div>
                <div>{config?.email || 'support@zafarsarwartraders.shop'}</div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate('/store')}
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              Browse Online Store
            </button>
            <button
              type="button"
              onClick={() => onNavigate('/contact')}
              className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              Contact Our Sales Team
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
