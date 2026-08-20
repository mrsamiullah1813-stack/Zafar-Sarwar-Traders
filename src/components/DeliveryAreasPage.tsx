import React, { useState, useMemo } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Calendar, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  MessageSquare, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  ExternalLink,
  PhoneCall,
  Package,
  Check,
  ChevronRight,
  ArrowRight,
  Info
} from 'lucide-react';
import { DeliverySettings, CityDeliveryInfo } from '../types';
import { loadDeliverySettings } from '../utils/storage';

interface DeliveryAreasPageProps {
  onBackToHome?: () => void;
  onOpenProductQuickView?: (productId: string) => void;
}

export const DeliveryAreasPage: React.FC<DeliveryAreasPageProps> = ({ onBackToHome }) => {
  const [deliverySettings] = useState<DeliverySettings>(() => loadDeliverySettings());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('all');
  const [customCityInquiry, setCustomCityInquiry] = useState('');
  const [customAddressInquiry, setCustomAddressInquiry] = useState('');

  const activeCities = useMemo(() => {
    return (deliverySettings?.cities || []).filter(c => c && c.isEnabled !== false);
  }, [deliverySettings]);

  const filteredCities = useMemo(() => {
    return activeCities.filter(c => {
      const q = searchQuery.trim().toLowerCase();
      let matchesSearch = true;
      if (q) {
        const nameMatch = c.cityName.toLowerCase().includes(q);
        const areaMatch = c.areaTown ? c.areaTown.toLowerCase().includes(q) : false;
        const notesMatch = c.notes ? c.notes.toLowerCase().includes(q) : false;
        const coverageMatch = Array.isArray(c.coverageAreas) 
          ? c.coverageAreas.some(area => area.toLowerCase().includes(q))
          : false;
        matchesSearch = nameMatch || areaMatch || notesMatch || coverageMatch;
      }
      return matchesSearch;
    });
  }, [activeCities, searchQuery]);

  const handleWhatsappInquiry = (city?: CityDeliveryInfo) => {
    const rawNumber = (deliverySettings.whatsappSupportNumber || '+923108002863').replace(/[^0-9]/g, '');
    const cityName = city ? city.cityName : (customCityInquiry.trim() || 'My Area');
    
    let msg = `Assalam-o-Alaikum Zafar Sarwar Traders,\n\n`;
    msg += `I am visiting your website Delivery Areas page and would like to confirm delivery details for:\n`;
    msg += `📍 Location: ${cityName}${city?.areaTown ? ` (${city.areaTown})` : ''}\n`;
    if (customAddressInquiry.trim()) msg += `🏠 Full Address: ${customAddressInquiry.trim()}\n`;
    if (city) {
      msg += `🚚 Estimated Timeline: ${city.estimatedDays}\n`;
      msg += `💰 Quoted Delivery Fee: ${city.deliveryFee === 0 ? 'FREE' : `PKR ${city.deliveryFee}`}\n`;
    }
    msg += `\nPlease provide shipping details and available courier/truck dispatch schedule. Thank you!`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${rawNumber}?text=${encoded}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 space-y-10">
      
      {/* Breadcrumb / Top Navigation */}
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <button 
            type="button"
            onClick={onBackToHome}
            className="hover:text-amber-400 transition-colors"
          >
            Home
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-amber-400 font-semibold">Delivery Areas & Logistics</span>
        </div>

        {onBackToHome && (
          <button
            type="button"
            onClick={onBackToHome}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-white border border-slate-800 transition-all flex items-center gap-1.5"
          >
            ← Back to Store
          </button>
        )}
      </div>

      {/* Hero Header */}
      <div className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800 p-8 sm:p-12 relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-bold uppercase tracking-wider">
            <Truck className="w-4 h-4" /> Nationwide Logistics Network
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-white tracking-tight leading-tight">
            Fast, Reliable Delivery <br className="hidden sm:inline" />
            <span className="text-amber-400">Across Pakistan</span>
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            From local express delivery in Chiniot, Chenab Nagar, and Bhowana to bulk sanitary and construction freight in Lahore, Faisalabad, Islamabad, and nationwide — explore our delivery zones, timelines, and shipping rates.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-xl font-serif font-bold text-amber-400 block">50+</span>
              <span className="text-xs text-slate-400">Pakistan Cities Covered</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-xl font-serif font-bold text-emerald-400 block">Same Day</span>
              <span className="text-xs text-slate-400">Local Express Available</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-xl font-serif font-bold text-blue-400 block">100% Safe</span>
              <span className="text-xs text-slate-400">Fragile Packaging Guaranteed</span>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800">
              <span className="text-xl font-serif font-bold text-purple-400 block">Cut-off {deliverySettings.orderCutoffTime || '5PM'}</span>
              <span className="text-xs text-slate-400">Same-Day Processing</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Delivery Search Section */}
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-serif font-bold text-white flex items-center gap-2.5">
              <MapPin className="w-6 h-6 text-amber-400" />
              <span>Search Delivery Zones & Rates</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Type your city, tehsil, or neighborhood to check delivery timelines and rates.
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search city (e.g. Chiniot, Lahore...)"
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-2xl pl-10 pr-4 py-2.5 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors shadow-sm"
            />
          </div>
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCities.map((city) => {
            const isAvailable = city.status !== 'unavailable' && city.isEnabled !== false;
            const isContact = city.status === 'contact_to_confirm';

            return (
              <div 
                key={city.id}
                className="bg-slate-900/90 border border-slate-800 hover:border-amber-500/40 rounded-3xl p-5 space-y-4 transition-all hover:shadow-xl hover:shadow-amber-500/5 group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-serif font-bold text-white text-base group-hover:text-amber-400 transition-colors flex items-center gap-2">
                        {city.cityName}
                      </h3>
                      {city.areaTown && (
                        <p className="text-xs text-slate-400 mt-0.5">
                          {city.areaTown}
                        </p>
                      )}
                    </div>

                    <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border shrink-0 ${
                      isContact 
                        ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                        : isAvailable
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}>
                      {isContact ? 'Contact to Confirm' : isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </div>

                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5 pt-2.5">
                    {city.isSameDayAvailable && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                        ⚡ Same Day Dispatch
                      </span>
                    )}
                    {city.isNextDayAvailable && (
                      <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] font-bold">
                        🚀 Next Day
                      </span>
                    )}
                  </div>

                  {/* Delivery Timeline & Rate Details */}
                  <div className="grid grid-cols-2 gap-2 pt-3 mt-3 border-t border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Timeline:</span>
                      <span className="font-bold text-amber-400 font-serif flex items-center gap-1 mt-0.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        {city.estimatedDays}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Delivery Fee:</span>
                      <span className="font-bold text-emerald-400 font-mono mt-0.5 block">
                        {city.deliveryFee === 0 ? 'FREE' : `PKR ${(city.deliveryFee ?? 0).toLocaleString()}`}
                      </span>
                    </div>
                  </div>

                  {city.notes && (
                    <p className="text-[11px] text-slate-400 mt-2.5 bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
                      💡 {city.notes}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => handleWhatsappInquiry(city)}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-950 hover:bg-emerald-600 text-slate-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 border border-slate-800 hover:border-emerald-500 transition-all mt-2"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Book Delivery to {city.cityName}</span>
                </button>
              </div>
            );
          })}
        </div>

        {filteredCities.length === 0 && (
          <div className="text-center py-12 bg-slate-900/50 rounded-3xl border border-slate-800 p-8 space-y-4">
            <MapPin className="w-10 h-10 text-amber-400 mx-auto opacity-80" />
            <h3 className="text-lg font-serif font-bold text-white">No listed delivery zone found for "{searchQuery}"</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              We arrange special truck cargo and freight routes for all locations across Pakistan. Contact us below to confirm delivery details for your city.
            </p>
          </div>
        )}
      </div>

      {/* Dedicated Custom Freight Inquiry Box */}
      <div className="max-w-7xl mx-auto rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-amber-500/30 p-8 sm:p-10 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Special Cargo & Bulk Construction Orders</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-serif font-bold text-white">
              Need Delivery to an Unlisted Location or Large Freight?
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
              For large sanitary shipments, construction pipes, marble vanity freight, or unlisted cities, our dedicated dispatch fleet provides customized transport.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleWhatsappInquiry()}
              className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/60 transition-all transform hover:-translate-y-0.5"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Inquire on WhatsApp</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <input
            type="text"
            value={customCityInquiry}
            onChange={(e) => setCustomCityInquiry(e.target.value)}
            placeholder="Enter your City or Tehsil (e.g. Swat, Mianwali, Kasur, Mirpur...)"
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-4 py-3 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />

          <input
            type="text"
            value={customAddressInquiry}
            onChange={(e) => setCustomAddressInquiry(e.target.value)}
            placeholder="Complete project address or landmark..."
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-2xl px-4 py-3 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      {/* Safety & Packaging Guarantees */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center">
            <Package className="w-5 h-5" />
          </div>
          <h4 className="font-serif font-bold text-white text-base">Reinforced Fragile Packaging</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            All ceramic washbasins, commodes, marble vanities, and mirrors are encased in thick bubble wrap and wooden crates to guarantee zero-breakage transit.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
          <h4 className="font-serif font-bold text-white text-base">Same Day Processing</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            Orders confirmed before {deliverySettings.orderCutoffTime || '05:00 PM'} are dispatched the very same day from our Chiniot warehouse.
          </p>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h4 className="font-serif font-bold text-white text-base">Transit Damage Warranty</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            In the rare event of transit damage, our logistics department provides immediate replacement or claim processing with zero hassle.
          </p>
        </div>
      </div>

    </div>
  );
};
