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
  X, 
  ShieldCheck, 
  Sparkles, 
  Building2, 
  ChevronRight,
  ExternalLink,
  PhoneCall,
  Info
} from 'lucide-react';
import { DeliverySettings, CityDeliveryInfo } from '../types';
import { loadDeliverySettings } from '../utils/storage';

interface DeliveryCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DeliveryCheckerModal: React.FC<DeliveryCheckerModalProps> = ({ isOpen, onClose }) => {
  const [deliverySettings] = useState<DeliverySettings>(() => loadDeliverySettings());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'free' | 'same_day' | 'punjab'>('all');
  const [selectedCity, setSelectedCity] = useState<CityDeliveryInfo | null>(null);

  // Custom city inquiry
  const [customCityName, setCustomCityName] = useState('');
  const [customAddress, setCustomAddress] = useState('');

  const activeCities = useMemo(() => {
    return (deliverySettings?.cities || []).filter(c => c && c.isEnabled !== false);
  }, [deliverySettings]);

  // Filtered list
  const filteredCities = useMemo(() => {
    return activeCities.filter(c => {
      // 1. Search query
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

      // 2. Tab filter
      let matchesTab = true;
      if (activeFilter === 'free') {
        matchesTab = c.deliveryFee === 0 || c.deliveryFeeType === 'free';
      } else if (activeFilter === 'same_day') {
        matchesTab = Boolean(c.isSameDayAvailable);
      } else if (activeFilter === 'punjab') {
        const punjabKeywords = ['chiniot', 'lahore', 'faisalabad', 'islamabad', 'rawalpindi', 'multan', 'sargodha', 'sialkot', 'gujranwala', 'jhang', 'lalian', 'bhowana', 'chenab nagar'];
        matchesTab = punjabKeywords.some(kw => c.cityName.toLowerCase().includes(kw));
      }

      return matchesSearch && matchesTab;
    });
  }, [activeCities, searchQuery, activeFilter]);

  if (!isOpen) return null;

  const handleWhatsappCustomInquiry = () => {
    const rawNumber = (deliverySettings.whatsappSupportNumber || '+923108002863').replace(/[^0-9]/g, '');
    const cityName = selectedCity ? selectedCity.cityName : (customCityName.trim() || 'My Location');
    
    let msg = `Assalam-o-Alaikum Zafar Sarwar Traders,\n\n`;
    msg += `I want to check delivery availability and freight rates for:\n`;
    msg += `📍 City / Area: ${cityName}\n`;
    if (customAddress.trim()) msg += `🏠 Address: ${customAddress.trim()}\n`;
    msg += `\nPlease confirm available delivery timeline, courier options, and dispatch schedule.`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://wa.me/${rawNumber}?text=${encoded}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl my-auto shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between relative">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center shadow-md">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-bold text-white flex items-center gap-2">
                Smart Delivery Checker
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 font-semibold border border-emerald-500/30">
                  Across Pakistan
                </span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Check delivery timelines, shipping fees, and express routes for your area.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your city, tehsil, or area (e.g. Chiniot, Chenab Nagar, Bhowana, Lahore, Faisalabad, DHA)..."
              className="w-full bg-slate-950 border border-slate-700 text-white rounded-2xl pl-12 pr-10 py-3.5 text-xs sm:text-sm placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-3.5 text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              type="button"
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all border ${
                activeFilter === 'all'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              All Zones ({activeCities.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('free')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all border ${
                activeFilter === 'free'
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              🎉 Free Local Delivery
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('same_day')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all border ${
                activeFilter === 'same_day'
                  ? 'bg-blue-500 text-white border-blue-400 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              ⚡ Same Day Express
            </button>

            <button
              type="button"
              onClick={() => setActiveFilter('punjab')}
              className={`px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all border ${
                activeFilter === 'punjab'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              📍 Punjab Hubs
            </button>
          </div>

          {/* City Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto pr-1">
            {filteredCities.map((city) => {
              const isAvailable = city.status !== 'unavailable' && city.isEnabled !== false;
              const isContact = city.status === 'contact_to_confirm';

              return (
                <div
                  key={city.id}
                  onClick={() => setSelectedCity(city)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer text-left ${
                    selectedCity?.id === city.id
                      ? 'bg-slate-950 border-amber-500 shadow-lg shadow-amber-500/10'
                      : 'bg-slate-950/70 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-white text-sm">{city.cityName}</span>
                        {city.isSameDayAvailable && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[9px] font-bold">
                            Same Day
                          </span>
                        )}
                        {city.isNextDayAvailable && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[9px] font-bold">
                            Next Day
                          </span>
                        )}
                      </div>

                      {city.areaTown && (
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {city.areaTown}
                        </p>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                        isContact 
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : isAvailable
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}>
                        {isContact ? 'Contact to Confirm' : isAvailable ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-amber-400 font-medium flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {city.estimatedDays}
                    </span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {city.deliveryFee === 0 ? 'FREE DELIVERY' : `PKR ${(city.deliveryFee ?? 0).toLocaleString()}`}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredCities.length === 0 && (
              <div className="col-span-full text-center py-8 text-slate-400 text-xs space-y-2">
                <p>No predefined delivery zone found for "{searchQuery}".</p>
                <p className="text-slate-500">We deliver custom orders to all locations across Pakistan!</p>
              </div>
            )}
          </div>

          {/* Custom Inquiry Box if unlisted or selected */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Unlisted City or Bulk Freight Inquiry?
              </h4>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              If your specific town, village, or construction site is not listed above, our logistics fleet can deliver via specialized freight trucks.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <input
                type="text"
                value={customCityName}
                onChange={(e) => setCustomCityName(e.target.value)}
                placeholder="Enter your City / Tehsil..."
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
              />

              <input
                type="text"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder="Complete address or landmark..."
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="button"
              onClick={handleWhatsappCustomInquiry}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-950/50"
            >
              <MessageSquare className="w-4 h-4 fill-white" />
              <span>Inquire Delivery Route on WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Store Hours & Cut-off info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="font-bold text-amber-400 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Same Day Order Cut-off
              </span>
              <p className="text-[11px] text-slate-400">
                Orders booked before {deliverySettings.orderCutoffTime || '05:00 PM'} process same day.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-1">
              <span className="font-bold text-blue-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Operating Timings
              </span>
              <p className="text-[11px] text-slate-400">
                {deliverySettings.storeOpeningTime || '09:00 AM'} - {deliverySettings.storeClosingTime || '09:00 PM'} ({deliverySettings.workingDays || 'Mon - Sat'})
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>Guaranteed Safe Packaging & Fragile Handling</span>
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-xl text-xs transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
