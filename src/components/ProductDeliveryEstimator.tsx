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
  ArrowRight
} from 'lucide-react';
import { DeliverySettings, CityDeliveryInfo, Product, ProductDeliveryConfig } from '../types';
import { loadDeliverySettings, sanitizeAndDeduplicateCities, saveSelectedDeliveryCity, loadSelectedDeliveryCity } from '../utils/storage';
import { calculateCityDeliveryFee, isProductHeavyOrBulky } from '../utils/deliveryFeeCalculator';
import { parseNumericPrice } from '../utils/pricingUtils';

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
  quantity?: number;
  customDeliverySettings?: DeliverySettings;
  onDeliveryDetailsChange?: (details: DeliveryDetailsPayload) => void;
}

export const ProductDeliveryEstimator: React.FC<ProductDeliveryEstimatorProps> = ({ 
  product, 
  quantity = 1,
  customDeliverySettings,
  onDeliveryDetailsChange
}) => {
  const [deliverySettings] = useState<DeliverySettings>(
    () => customDeliverySettings || loadDeliverySettings()
  );

  // Active cities from settings
  const activeCities = useMemo(() => {
    const list = (deliverySettings.cities || [])
      .filter(c => c && c.isEnabled !== false)
      .sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));
    return sanitizeAndDeduplicateCities(list);
  }, [deliverySettings.cities]);

  // Product Delivery Override
  const prodConfig: ProductDeliveryConfig | undefined = product.deliveryConfig;
  const isHiddenForProduct = Boolean(prodConfig?.hideDeliveryInfo);

  // Modal / Dropdown state
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Selection state initialized from saved city or default settings
  const [selectedCityId, setSelectedCityId] = useState<string>(() => {
    const saved = loadSelectedDeliveryCity();
    if (saved) {
      const matched = activeCities.find(c => c.cityName?.toLowerCase() === saved.toLowerCase() || c.id === saved);
      if (matched) return matched.id;
    }
    if (deliverySettings.defaultSelectedCityId && activeCities.some(c => c.id === deliverySettings.defaultSelectedCityId)) {
      return deliverySettings.defaultSelectedCityId;
    }
    return activeCities[0]?.id || '';
  });

  // Custom city inputs
  const [isCustomMode, setIsCustomMode] = useState(() => {
    const saved = loadSelectedDeliveryCity();
    if (saved && !activeCities.some(c => c.cityName?.toLowerCase() === saved.toLowerCase() || c.id === saved)) {
      return true;
    }
    return false;
  });
  const [customCityName, setCustomCityName] = useState(() => {
    const saved = loadSelectedDeliveryCity();
    if (saved && !activeCities.some(c => c.cityName?.toLowerCase() === saved.toLowerCase() || c.id === saved)) {
      return saved;
    }
    return '';
  });

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
    // 1. Explicit Product specific fee override
    if (prodConfig && prodConfig.deliveryFeeType && prodConfig.deliveryFeeType !== 'inherit') {
      if (prodConfig.deliveryFeeType === 'free') {
        return { 
          amount: 0, 
          type: 'free' as const, 
          display: 'Free Delivery',
          heading: 'Free Delivery',
          subtitle: 'Free delivery applied for this product.',
          note: 'Direct showroom logistics & safe packaging.'
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
          note: 'Safe packaging and doorstep delivery.'
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

    // Predefined City Dynamic Calculation
    if (selectedCity && !isCustomMode) {
      const isHeavy = isProductHeavyOrBulky(product);
      const calc = calculateCityDeliveryFee(
        selectedCity,
        parseNumericPrice(product.price) || 1000,
        deliverySettings.globalDeliveryFeeAmount || 250,
        undefined,
        deliverySettings.minDeliveryFee,
        deliverySettings.maxDeliveryFee,
        product.weightKg || (isHeavy ? 12 : 1),
        isHeavy ? 'heavy' : 'light',
        quantity || 1,
        isHeavy ? 1 : 0,
        [{ product, quantity: quantity || 1 }]
      );

      const feeAmt = calc.isFree ? 0 : Math.max(200, calc.deliveryFee);

      return { 
        amount: feeAmt, 
        type: calc.isFree ? ('free' as const) : ('fixed' as const), 
        display: calc.isFree ? 'Free Delivery' : `Rs. ${feeAmt.toLocaleString('en-PK')}`,
        heading: calc.isFree ? 'Free Delivery' : `${selectedCity.cityName} Delivery: Rs. ${feeAmt.toLocaleString('en-PK')}`,
        subtitle: `Calculated delivery to ${selectedCity.cityName} (${calc.weightClass === 'heavy' ? 'Heavy / Bulky Cargo' : 'Standard Parcel'})`,
        note: `Estimated timeline: ${estimatedDays}. Direct showroom logistics.`
      };
    }

    // Default for Custom / Unselected City
    const customHeading = prodConfig?.deliveryFeeLabel?.trim() || 'Calculated at Checkout';
    const customSub = prodConfig?.deliveryFeeCustomText?.trim() || 'Delivery charges apply based on city, distance, quantity and weight. Minimum Rs. 200.';
    const customNote = prodConfig?.deliveryNote?.trim() || 'Contact our support team for specialized delivery assistance.';

    return { 
      amount: 0, 
      type: 'contact' as const, 
      display: customHeading,
      heading: customHeading,
      subtitle: customSub,
      note: customNote
    };
  }, [prodConfig, isCustomMode, selectedCity, product, deliverySettings, estimatedDays, quantity]);

  // Current active city name
  const currentCityName = isCustomMode ? customCityName.trim() : (selectedCity?.cityName || '');

  // Sync with global storage when city changes
  useEffect(() => {
    if (currentCityName) {
      saveSelectedDeliveryCity(currentCityName);
    }
  }, [currentCityName]);

  // Listen to external city updates (e.g. from checkout or other components)
  useEffect(() => {
    const handleCityUpdated = (e: any) => {
      const updatedCityName = e.detail || loadSelectedDeliveryCity();
      if (!updatedCityName) return;
      const matched = activeCities.find(c => c.cityName?.toLowerCase() === updatedCityName.toLowerCase() || c.id === updatedCityName);
      if (matched) {
        setSelectedCityId(matched.id);
        setIsCustomMode(false);
      } else {
        setIsCustomMode(true);
        setCustomCityName(updatedCityName);
      }
    };

    window.addEventListener('zst_selected_city_updated', handleCityUpdated);
    return () => window.removeEventListener('zst_selected_city_updated', handleCityUpdated);
  }, [activeCities]);

  // Notify parent component on state changes
  useEffect(() => {
    if (onDeliveryDetailsChange) {
      onDeliveryDetailsChange({
        city: currentCityName,
        isCustomCity: isCustomMode,
        address: '',
        deliveryFeeAmount: deliveryFeeInfo.amount,
        deliveryFeeType: deliveryFeeInfo.type,
        deliveryFeeDisplay: deliveryFeeInfo.display,
        estimatedDays,
        isValid: Boolean(currentCityName)
      });
    }
  }, [currentCityName, isCustomMode, deliveryFeeInfo, estimatedDays, onDeliveryDetailsChange]);

  if (!deliverySettings.isEnabled || isHiddenForProduct) {
    return null;
  }

  const handleSelectCity = (city: CityDeliveryInfo) => {
    setSelectedCityId(city.id);
    setIsCustomMode(false);
    setIsCityModalOpen(false);
    setSearchQuery('');
    saveSelectedDeliveryCity(city.cityName);
  };

  const handleContinueWithCustomCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customCityName.trim()) return;
    setIsCustomMode(true);
    setIsCityModalOpen(false);
    setSearchQuery('');
    saveSelectedDeliveryCity(customCityName.trim());
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-3.5">
      {/* Title & Badge Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center">
            <Truck className="w-4 h-4 text-slate-700" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Delivery Information
            </h4>
            <p className="text-[11px] text-slate-500 font-medium">
              Delivery depends on city, location and quantity.
            </p>
          </div>
        </div>

        {selectedCity && !isCustomMode && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Delivery Available</span>
          </span>
        )}
      </div>

      {/* PROMINENT DELIVERY FEE NOTICE DISPLAY */}
      <div className="p-3 sm:p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
        <div className="flex items-center gap-2">
          <Truck className="w-4 h-4 text-slate-800 shrink-0" />
          <h5 className="text-xs sm:text-sm font-bold text-slate-900 uppercase tracking-wide">
            {deliveryFeeInfo.heading}
          </h5>
        </div>
        <p className="text-xs text-slate-600 font-medium leading-relaxed pl-6">
          {deliveryFeeInfo.subtitle}
        </p>
        <p className="text-[11px] text-slate-500 font-normal pl-6">
          {deliveryFeeInfo.note}
        </p>
      </div>

      {/* 1. CUSTOMER-FACING DELIVERY CITY SELECTOR BUTTON */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
          <span>Delivery City</span>
          {currentCityName && (
            <span 
              className="text-[10px] text-blue-600 font-semibold cursor-pointer hover:underline" 
              onClick={() => setIsCityModalOpen(true)}
            >
              Change City
            </span>
          )}
        </label>

        <button
          type="button"
          onClick={() => setIsCityModalOpen(true)}
          className="w-full bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-900 rounded-xl p-3 flex items-center justify-between transition-all group shadow-2xs text-left cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 group-hover:scale-105 transition-transform">
              <MapPin className="w-4 h-4 text-slate-700" />
            </div>
            <div>
              {currentCityName ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">
                    {currentCityName}
                  </span>
                  <span className="text-emerald-600 text-xs font-bold">✓</span>
                  {isCustomMode && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200 font-medium">
                      Custom Location
                    </span>
                  )}
                </div>
              ) : (
                <span className="text-sm font-medium text-slate-500">
                  Select Delivery City
                </span>
              )}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                <span>{estimatedDays}</span>
                <span>•</span>
                <span className="text-slate-900 font-semibold">
                  {deliveryFeeInfo.display}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 text-xs text-slate-600 group-hover:text-slate-900 font-semibold">
            <span>{currentCityName ? 'Change' : 'Select'}</span>
            <ChevronDown className="w-4 h-4" />
          </div>
        </button>
      </div>

      {/* 2. SELECTED CITY INFORMATION BADGES */}
      {currentCityName && (
        <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Time: <strong className="text-slate-900">{estimatedDays}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Delivery Fee: <strong className="text-slate-900 font-mono">{deliveryFeeInfo.display}</strong></span>
            </div>
          </div>

          {selectedCity?.notes && (
            <p className="text-[11px] text-slate-500 flex items-start gap-1.5 pt-1 border-t border-slate-200">
              <Info className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>{selectedCity.notes}</span>
            </p>
          )}

          {isCustomMode && (
            <p className="text-[11px] text-blue-800 flex items-start gap-1.5 pt-1 border-t border-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
              <span>Our team will confirm exact cargo dispatch rates for {currentCityName} on WhatsApp.</span>
            </p>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* CITY SELECTION MODAL / PANEL                             */}
      {/* ======================================================== */}
      {isCityModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-slate-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-serif">
                    Select Delivery City
                  </h3>
                  <p className="text-xs text-slate-500">
                    Choose your destination from available delivery zones
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCityModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Fast Case-Insensitive Search Input */}
            <div className="p-3.5 border-b border-slate-200 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔎 Search city (e.g. Chiniot, Faisalabad, Lahore, Jhang)..."
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-900 focus:bg-white rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none transition-colors"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-900 text-xs cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* City List Scroll Area */}
            <div className="p-3 space-y-1.5 overflow-y-auto flex-1 max-h-[50vh]">
              {filteredCities.length > 0 ? (
                filteredCities.map((city, cIdx) => {
                  const isSelected = !isCustomMode && (selectedCityId === city.id || selectedCity?.cityName === city.cityName);

                  return (
                    <button
                      key={city.id ? `${city.id}-${cIdx}` : `est-city-${city.cityName}-${cIdx}`}
                      type="button"
                      onClick={() => handleSelectCity(city)}
                      className={`w-full text-left p-3 rounded-xl transition-all border flex items-center justify-between group cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                          : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600 group-hover:text-slate-900'
                        }`}>
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                              {city.cityName}
                            </span>
                            {isSelected && (
                              <span className="text-emerald-400 font-bold text-xs">✓ Selected</span>
                            )}
                          </div>
                          {city.areaTown && (
                            <p className={`text-[11px] ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                              {city.areaTown}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider block ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          Delivery Available
                        </span>
                        <span className={`text-[10px] font-mono mt-0.5 block ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                          {city.estimatedDays}
                        </span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-slate-500 space-y-1">
                  <p className="text-xs">No matching city found for "{searchQuery}".</p>
                  <p className="text-[11px] text-slate-400">You can enter your custom delivery city below.</p>
                </div>
              )}

              {/* 3. CUSTOM CITY SECTION ("+ Add Custom City") */}
              {deliverySettings.enableCustomCity !== false && (
                <div className="pt-3 border-t border-slate-200 mt-2">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                        <Plus className="w-4 h-4 text-slate-700" />
                        <span>+ Custom City (Unlisted Location)</span>
                      </span>
                      <span className="text-[10px] text-slate-500">Across Pakistan</span>
                    </div>

                    <form onSubmit={handleContinueWithCustomCity} className="space-y-2">
                      <div>
                        <input
                          type="text"
                          value={customCityName}
                          onChange={(e) => setCustomCityName(e.target.value)}
                          placeholder="Enter City Name (e.g. Okara, Mianwali, Gujrat...)"
                          className="w-full bg-white border border-slate-300 focus:border-slate-900 rounded-xl px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={!customCityName.trim()}
                        className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Confirm Delivery City</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
              <span>{activeCities.length} Standard Delivery Zones</span>
              <button
                type="button"
                onClick={() => setIsCityModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold transition-colors cursor-pointer"
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
