import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ChevronDown, 
  Search, 
  X, 
  Plus, 
  Info, 
  Sparkles,
  ArrowRight,
  Edit3
} from 'lucide-react';
import { DeliverySettings, CityDeliveryInfo, Product, ProductDeliveryConfig } from '../types';
import { loadDeliverySettings } from '../utils/storage';

export interface DeliveryDetailsPayload {
  city: string;
  isCustomCity: boolean;
  address: string;
  deliveryFeeAmount: number;
  deliveryFeeType: 'free' | 'fixed' | 'contact' | 'custom';
  deliveryFeeDisplay: string;
  estimatedDays: string;
  isValid: boolean;
}

interface ProductDeliveryEstimatorProps {
  product: Product;
  customDeliverySettings?: DeliverySettings;
  onDeliveryDetailsChange?: (details: DeliveryDetailsPayload) => void;
}

export const ProductDeliveryEstimator: React.FC<ProductDeliveryEstimatorProps> = ({ 
  product, 
  customDeliverySettings,
  onDeliveryDetailsChange
}) => {
  const [deliverySettings] = useState<DeliverySettings>(
    () => customDeliverySettings || loadDeliverySettings()
  );

  // Active cities from settings
  const activeCities = useMemo(() => {
    return (deliverySettings.cities || [])
      .filter(c => c && c.isEnabled !== false)
      .sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
  }, [deliverySettings.cities]);

  // Product Delivery Override
  const prodConfig: ProductDeliveryConfig | undefined = product.deliveryConfig;
  const isHiddenForProduct = Boolean(prodConfig?.hideDeliveryInfo);

  // Modal / Dropdown state
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection state
  const [selectedCityId, setSelectedCityId] = useState<string>(() => {
    if (deliverySettings.defaultSelectedCityId && activeCities.some(c => c.id === deliverySettings.defaultSelectedCityId)) {
      return deliverySettings.defaultSelectedCityId;
    }
    return activeCities[0]?.id || '';
  });

  // Custom city inputs
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [customCityName, setCustomCityName] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [customLandmark, setCustomLandmark] = useState('');

  // Standard address input
  const [standardAddress, setStandardAddress] = useState('');

  // Find currently selected predefined city
  const selectedCity = useMemo(() => {
    if (isCustomMode) return null;
    return activeCities.find(c => c.id === selectedCityId) || null;
  }, [activeCities, selectedCityId, isCustomMode]);

  // Filtered cities based on search
  const filteredCities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return activeCities;
    return activeCities.filter(c => {
      const nameMatch = c.cityName.toLowerCase().includes(q);
      const areaMatch = c.areaTown ? c.areaTown.toLowerCase().includes(q) : false;
      const notesMatch = c.notes ? c.notes.toLowerCase().includes(q) : false;
      const coverageMatch = Array.isArray(c.coverageAreas) 
        ? c.coverageAreas.some(area => area.toLowerCase().includes(q))
        : false;
      return nameMatch || areaMatch || notesMatch || coverageMatch;
    });
  }, [activeCities, searchQuery]);

  // Derive estimated days
  const estimatedDays = useMemo(() => {
    if (prodConfig && (prodConfig.deliveryType === 'standard' || prodConfig.deliveryType === 'both')) {
      const min = prodConfig.minDeliveryTime ?? 2;
      const max = prodConfig.maxDeliveryTime ?? 4;
      const unit = prodConfig.deliveryTimeUnit || 'Days';
      return min === max ? `${min} ${unit}` : `${min}–${max} ${unit}`;
    }
    if (isCustomMode) {
      return '2–4 Working Days';
    }
    if (selectedCity) {
      return selectedCity.estimatedDays || '1–2 Working Days';
    }
    return deliverySettings.defaultEstimatedDays || '2–4 Working Days';
  }, [prodConfig, isCustomMode, selectedCity, deliverySettings]);

  // Derive delivery fee info
  const deliveryFeeInfo = useMemo(() => {
    // 1. Explicit Product specific fee override (only if admin explicitly configured one on this product)
    if (prodConfig && prodConfig.deliveryFeeType && prodConfig.deliveryFeeType !== 'inherit') {
      if (prodConfig.deliveryFeeType === 'free') {
        return { 
          amount: 0, 
          type: 'free' as const, 
          display: 'Free Delivery',
          heading: 'Free Delivery',
          subtitle: 'Free delivery applied for this product.',
          note: 'Contact for delivery information.'
        };
      }
      if (prodConfig.deliveryFeeType === 'fixed') {
        const amt = prodConfig.deliveryFeeAmount ?? 0;
        return { 
          amount: amt, 
          type: 'fixed' as const, 
          display: amt === 0 ? 'Free Delivery' : `Rs. ${amt.toLocaleString('en-PK')}`,
          heading: amt === 0 ? 'Free Delivery' : `Fixed Delivery Fee: Rs. ${amt.toLocaleString('en-PK')}`,
          subtitle: 'Fixed delivery charge configured for this product.',
          note: 'Contact for delivery information.'
        };
      }
      if (prodConfig.deliveryFeeType === 'custom' && prodConfig.deliveryFeeCustomText) {
        return { 
          amount: 0, 
          type: 'custom' as const, 
          display: prodConfig.deliveryFeeCustomText,
          heading: prodConfig.deliveryFeeLabel || 'Contact for Delivery',
          subtitle: prodConfig.deliveryFeeCustomText,
          note: 'Contact for further details.'
        };
      }
    }

    // Default for ALL existing & future products:
    // Heading: "Contact for Delivery"
    // Subtitle: "Delivery depends on quantity, item type and location."
    // Note: "Contact for further details."
    const customHeading = prodConfig?.deliveryFeeLabel?.trim() || 'Contact for Delivery';
    const customSub = prodConfig?.deliveryFeeCustomText?.trim() || 'Delivery depends on quantity, item type and location.';
    const customNote = prodConfig?.deliveryNote?.trim() || 'Contact for further details.';

    return { 
      amount: 0, 
      type: 'contact' as const, 
      display: customHeading,
      heading: customHeading,
      subtitle: customSub,
      note: customNote
    };
  }, [prodConfig, isCustomMode, selectedCity]);

  // Current active city name
  const currentCityName = isCustomMode ? customCityName.trim() : (selectedCity?.cityName || '');
  
  // Current active address
  const currentAddress = isCustomMode 
    ? [customAddress.trim(), customLandmark.trim() ? `(Landmark: ${customLandmark.trim()})` : ''].filter(Boolean).join(' ')
    : standardAddress.trim();

  // Notify parent component on state changes
  useEffect(() => {
    if (onDeliveryDetailsChange) {
      onDeliveryDetailsChange({
        city: currentCityName,
        isCustomCity: isCustomMode,
        address: currentAddress,
        deliveryFeeAmount: deliveryFeeInfo.amount,
        deliveryFeeType: deliveryFeeInfo.type,
        deliveryFeeDisplay: deliveryFeeInfo.display,
        estimatedDays,
        isValid: Boolean(currentCityName && currentAddress)
      });
    }
  }, [currentCityName, isCustomMode, currentAddress, deliveryFeeInfo, estimatedDays, onDeliveryDetailsChange]);

  if (!deliverySettings.isEnabled || isHiddenForProduct) {
    return null;
  }

  const handleSelectCity = (city: CityDeliveryInfo) => {
    setSelectedCityId(city.id);
    setIsCustomMode(false);
    setIsCityModalOpen(false);
    setSearchQuery('');
  };

  const handleContinueWithCustomCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCityName.trim()) return;
    setIsCustomMode(true);
    setIsCityModalOpen(false);
    setSearchQuery('');
  };

  return (
    <div className="p-4 sm:p-5 rounded-3xl bg-slate-950/70 border border-slate-800 space-y-4">
      {/* Title & Badge Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Delivery Information
            </h4>
            <p className="text-[11px] text-slate-400">
              Nationwide delivery with direct freight & cargo handling
            </p>
          </div>
        </div>

        {selectedCity && !isCustomMode && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Delivery Available</span>
          </span>
        )}
      </div>

      {/* PROMINENT DELIVERY FEE NOTICE DISPLAY */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-900/90 to-slate-950/90 border border-amber-500/30 space-y-1 shadow-sm">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-amber-400 shrink-0" />
          <h5 className="text-xs sm:text-sm font-extrabold text-amber-300 uppercase tracking-wide">
            {deliveryFeeInfo.heading}
          </h5>
        </div>
        <p className="text-xs text-slate-200 font-medium leading-relaxed pl-6">
          {deliveryFeeInfo.subtitle}
        </p>
        <p className="text-[11px] text-slate-400 font-normal pl-6">
          {deliveryFeeInfo.note}
        </p>
      </div>

      {/* 1. CUSTOMER-FACING DELIVERY CITY SELECTOR BUTTON */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
          <span>Delivery City</span>
          {currentCityName && (
            <span className="text-[10px] text-amber-400 font-semibold cursor-pointer hover:underline" onClick={() => setIsCityModalOpen(true)}>
              Change City
            </span>
          )}
        </label>

        <button
          type="button"
          onClick={() => setIsCityModalOpen(true)}
          className="w-full bg-slate-900 hover:bg-slate-850 border border-slate-700/80 hover:border-amber-500/60 text-white rounded-2xl p-3.5 flex items-center justify-between transition-all group shadow-sm text-left"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              {currentCityName ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white">
                    {currentCityName}
                  </span>
                  <span className="text-emerald-400 text-xs font-bold">✓</span>
                  {isCustomMode && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/50 font-medium">
                      Custom Location
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm font-medium text-slate-400">
                  Select Delivery City
                </span>
              )}
              <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                <span>{estimatedDays}</span>
                <span>•</span>
                <span className="text-amber-300 font-medium">
                  {deliveryFeeInfo.display}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold group-hover:translate-x-0.5 transition-transform">
            <span>{currentCityName ? 'Change' : 'Select'}</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* 2. SELECTED CITY INFORMATION BADGES */}
      {currentCityName && (
        <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Time: <strong className="text-white">{estimatedDays}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Delivery Fee: <strong className="text-amber-300">{deliveryFeeInfo.display}</strong></span>
            </div>
          </div>

          {selectedCity?.notes && (
            <p className="text-[11px] text-slate-400 flex items-start gap-1.5 pt-1 border-t border-slate-800/60">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>{selectedCity.notes}</span>
            </p>
          )}

          {isCustomMode && (
            <p className="text-[11px] text-blue-300 flex items-start gap-1.5 pt-1 border-t border-slate-800/60">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>Our team will confirm exact cargo dispatch rates for {currentCityName} on WhatsApp.</span>
            </p>
          )}
        </div>
      )}

      {/* 3. SIMPLIFIED DELIVERY ADDRESS INPUT (ONE FIELD) */}
      {currentCityName && !isCustomMode && (
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Delivery Address</span>
            <span className="text-[10px] text-slate-500 font-normal">Complete address</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={standardAddress}
              onChange={(e) => setStandardAddress(e.target.value)}
              placeholder="Enter your complete delivery address (House / Shop #, Street, Area / Mohalla, Landmark)"
              className="w-full bg-slate-900 border border-slate-700/80 focus:border-amber-500 rounded-2xl px-4 py-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* CITY SELECTION MODAL / PANEL */}
      {/* ======================================================== */}
      {isCityModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scaleIn">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-serif">
                    Select Delivery City
                  </h3>
                  <p className="text-xs text-slate-400">
                    Choose your destination from available delivery zones
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCityModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fast Case-Insensitive Search Input */}
            <div className="p-3.5 border-b border-slate-800 bg-slate-950/40">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔎 Search city (e.g. Chiniot, Faisalabad, Lahore, Jhang)..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white text-xs"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* City List Scroll Area */}
            <div className="p-3 space-y-1.5 overflow-y-auto flex-1 max-h-[50vh]">
              {filteredCities.length > 0 ? (
                filteredCities.map((city) => {
                  const isSelected = !isCustomMode && selectedCityId === city.id;
                  const isFree = city.freeDelivery || city.deliveryFeeType === 'free' || city.deliveryFee === 0;

                  return (
                    <button
                      key={city.id}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className={`w-full text-left p-3 rounded-2xl transition-all border flex items-center justify-between group ${
                        isSelected
                          ? 'bg-amber-500/10 border-amber-500 text-white shadow-md'
                          : 'bg-slate-950/60 hover:bg-slate-800/80 border-slate-800/80 text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                          isSelected ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 group-hover:text-amber-400'
                        }`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs sm:text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                              {city.cityName}
                            </span>
                            {isSelected && (
                              <span className="text-emerald-400 font-bold text-xs">✓ Selected</span>
                            )}
                          </div>
                          {city.areaTown && (
                            <p className="text-[11px] text-slate-400">
                              {city.areaTown}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider block bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          Delivery Available
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono mt-0.5 block">
                          {city.estimatedDays}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-slate-400 space-y-2">
                  <p className="text-xs">No matching city found for "{searchQuery}".</p>
                  <p className="text-[11px] text-slate-500">You can add your custom city location below!</p>
                </div>
              )}

              {/* 3. CUSTOM CITY SECTION ("+ Add Custom City") */}
              <div className="pt-3 border-t border-slate-800 mt-2">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-blue-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wider flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-blue-400" />
                      <span>+ Add Custom City (Unlisted Location)</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Across Pakistan</span>
                  </div>

                  <form onSubmit={handleContinueWithCustomCity} className="space-y-2.5">
                    <div>
                      <input
                        type="text"
                        value={customCityName}
                        onChange={(e) => setCustomCityName(e.target.value)}
                        placeholder="Enter City Name (e.g. Okara, Mianwali, Gujrat...)"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                        required
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={customAddress}
                        onChange={(e) => setCustomAddress(e.target.value)}
                        placeholder="Enter Complete Delivery Address"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                        required
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        value={customLandmark}
                        onChange={(e) => setCustomLandmark(e.target.value)}
                        placeholder="Optional Nearby Landmark"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-400"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!customCityName.trim()}
                      className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <span>Continue with Custom City</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <span>{activeCities.length} Standard Delivery Zones</span>
              <button
                type="button"
                onClick={() => setIsCityModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition-colors"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
