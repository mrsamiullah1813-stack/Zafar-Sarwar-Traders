import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Calendar, 
  MessageSquare, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  XCircle,
  ChevronDown,
  Info,
  ExternalLink,
  Building2,
  Search,
  Sparkles,
  DollarSign,
  PhoneCall,
  Check
} from 'lucide-react';
import { DeliverySettings, CityDeliveryInfo, Product, ProductDeliveryConfig } from '../types';
import { loadDeliverySettings } from '../utils/storage';

interface ProductDeliveryEstimatorProps {
  product: Product;
  customDeliverySettings?: DeliverySettings;
}

export const ProductDeliveryEstimator: React.FC<ProductDeliveryEstimatorProps> = ({ 
  product, 
  customDeliverySettings 
}) => {
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(
    () => customDeliverySettings || loadDeliverySettings()
  );

  useEffect(() => {
    if (customDeliverySettings) {
      setDeliverySettings(customDeliverySettings);
    }
  }, [customDeliverySettings]);

  // Product Delivery Override
  const prodConfig: ProductDeliveryConfig | undefined = product.deliveryConfig;
  const isHiddenForProduct = Boolean(prodConfig?.hideDeliveryInfo);

  // If global delivery is disabled or hidden for this product, return null
  if (!deliverySettings.isEnabled || isHiddenForProduct) {
    return null;
  }

  // Active cities only
  const activeCities = useMemo(() => {
    return (deliverySettings.cities || []).filter(c => c && c.isEnabled !== false);
  }, [deliverySettings.cities]);

  // City Search & Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCityId, setSelectedCityId] = useState<string>(() => {
    if (deliverySettings.defaultSelectedCityId && activeCities.some(c => c.id === deliverySettings.defaultSelectedCityId)) {
      return deliverySettings.defaultSelectedCityId;
    }
    return activeCities[0]?.id || 'city-chiniot';
  });

  // Custom city & address form fields
  const [customCityName, setCustomCityName] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  const customCityOptionValue = 'CUSTOM_CITY_OPTION';
  const isCustomSelected = selectedCityId === customCityOptionValue || selectedCityId === 'Other';

  // Find currently selected city
  const selectedCity = useMemo(() => {
    return activeCities.find(c => c.id === selectedCityId || c.cityName.toLowerCase() === selectedCityId.toLowerCase());
  }, [activeCities, selectedCityId]);

  // Smart Search Matching across City Name, Area/Town, and Coverage Sub-areas
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

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

  // Handle Search Input Change & Autocomplete
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setSearchFeedback(null);
    const trimmed = val.trim().toLowerCase();
    if (!trimmed) return;

    const exactOrFirst = activeCities.find(c => {
      if (c.cityName.toLowerCase() === trimmed) return true;
      if (c.areaTown && c.areaTown.toLowerCase().includes(trimmed)) return true;
      if (Array.isArray(c.coverageAreas) && c.coverageAreas.some(a => a.toLowerCase().includes(trimmed))) return true;
      return c.cityName.toLowerCase().includes(trimmed);
    });

    if (exactOrFirst) {
      setSelectedCityId(exactOrFirst.id);
    }
  };

  const handleSelectSearchResult = (city: CityDeliveryInfo) => {
    setSelectedCityId(city.id);
    setSearchQuery('');
    setSearchFeedback(`Selected ${city.cityName}${city.areaTown ? ` (${city.areaTown})` : ''}`);
  };

  // Compute Displayed Time & Fee (Product Override vs City / Global Settings)
  const deliveryTimeDisplay = useMemo(() => {
    if (prodConfig && (prodConfig.deliveryType === 'standard' || prodConfig.deliveryType === 'both')) {
      const min = prodConfig.minDeliveryTime ?? 2;
      const max = prodConfig.maxDeliveryTime ?? 4;
      const unit = prodConfig.deliveryTimeUnit || 'Days';
      const label = prodConfig.customDeliveryTimeLabel || 'Estimated Delivery:';
      const timeStr = min === max ? `${min} ${unit}` : `${min}–${max} ${unit}`;
      return { label, value: timeStr, isCustom: true };
    }

    if (selectedCity && !isCustomSelected) {
      return {
        label: 'Estimated Delivery:',
        value: selectedCity.estimatedDays || '2–3 Working Days',
        isCustom: false
      };
    }

    return {
      label: 'Estimated Delivery:',
      value: deliverySettings.defaultEstimatedDays || '2–4 Working Days',
      isCustom: false
    };
  }, [prodConfig, selectedCity, isCustomSelected, deliverySettings]);

  const customTextMessage = useMemo(() => {
    if (prodConfig && (prodConfig.deliveryType === 'custom' || prodConfig.deliveryType === 'both') && prodConfig.customDeliveryMessage) {
      return {
        label: prodConfig.customMessageLabel || 'Delivery Info:',
        text: prodConfig.customDeliveryMessage
      };
    }
    if (deliverySettings.globalCustomDeliveryMessage && (!prodConfig || prodConfig.deliveryType === 'inherit')) {
      return {
        label: 'Delivery Info:',
        text: deliverySettings.globalCustomDeliveryMessage
      };
    }
    return null;
  }, [prodConfig, deliverySettings]);

  const deliveryFeeDisplay = useMemo(() => {
    // 1. Product specific fee override
    if (prodConfig && prodConfig.deliveryFeeType && prodConfig.deliveryFeeType !== 'inherit') {
      const label = prodConfig.deliveryFeeLabel || 'Delivery Fee:';
      if (prodConfig.deliveryFeeType === 'free') {
        return { label, value: 'Free Delivery', type: 'free', badgeColor: 'text-emerald-400 font-bold' };
      }
      if (prodConfig.deliveryFeeType === 'fixed') {
        const amt = prodConfig.deliveryFeeAmount ?? 0;
        return { label, value: amt === 0 ? 'Free Delivery' : `PKR ${amt.toLocaleString()}`, type: 'fixed', badgeColor: 'text-emerald-400 font-bold' };
      }
      if (prodConfig.deliveryFeeType === 'contact') {
        return { label, value: 'Contact Us for Charges', type: 'contact', badgeColor: 'text-amber-400 font-bold' };
      }
      if (prodConfig.deliveryFeeType === 'custom') {
        return { label, value: prodConfig.deliveryFeeCustomText || 'Calculated based on location', type: 'custom', badgeColor: 'text-blue-400 font-bold' };
      }
    }

    // 2. City specific fee
    if (selectedCity && !isCustomSelected) {
      if (selectedCity.deliveryFeeType === 'free' || selectedCity.deliveryFee === 0) {
        return { label: 'Delivery Fee:', value: 'Free Local Delivery', type: 'free', badgeColor: 'text-emerald-400 font-bold' };
      }
      if (selectedCity.deliveryFeeType === 'contact') {
        return { label: 'Delivery Fee:', value: 'Contact Us', type: 'contact', badgeColor: 'text-amber-400 font-bold' };
      }
      if (selectedCity.deliveryFeeType === 'custom' && selectedCity.deliveryFeeCustomText) {
        return { label: 'Delivery Fee:', value: selectedCity.deliveryFeeCustomText, type: 'custom', badgeColor: 'text-blue-400 font-bold' };
      }
      return { label: 'Delivery Fee:', value: `PKR ${(selectedCity.deliveryFee ?? 0).toLocaleString()}`, type: 'fixed', badgeColor: 'text-emerald-400 font-bold' };
    }

    // 3. Custom city or global default
    if (isCustomSelected) {
      return { label: 'Delivery Fee:', value: 'Confirmed via WhatsApp', type: 'contact', badgeColor: 'text-amber-400 font-bold' };
    }

    return { label: 'Delivery Fee:', value: 'Contact Us', type: 'contact', badgeColor: 'text-slate-300' };
  }, [prodConfig, selectedCity, isCustomSelected]);

  // Current City Availability Status
  const cityStatus = useMemo(() => {
    if (isCustomSelected) {
      return 'custom';
    }
    if (!selectedCity) {
      return 'not_found';
    }
    if (selectedCity.status === 'unavailable' || selectedCity.isEnabled === false) {
      return 'unavailable';
    }
    if (selectedCity.status === 'contact_to_confirm') {
      return 'contact_to_confirm';
    }
    return 'available';
  }, [isCustomSelected, selectedCity]);

  // WhatsApp Order & Delivery Confirmation
  const handleConfirmWhatsapp = () => {
    const rawNumber = (deliverySettings.whatsappSupportNumber || '+923108002863').replace(/[^0-9]/g, '');
    const displayCity = isCustomSelected 
      ? (customCityName.trim() || 'Custom City') 
      : (selectedCity ? selectedCity.cityName : 'My City');
    
    const displayArea = isCustomSelected
      ? ''
      : (selectedCity?.areaTown ? ` (${selectedCity.areaTown})` : '');

    const priceStr = product.salePrice || product.price || 'Call for Price';
    
    let message = `Assalam-o-Alaikum Zafar Sarwar Traders,\n\n`;
    message += `I want to check delivery availability & place an order for:\n`;
    message += `📦 Product: ${product.name}\n`;
    message += `💰 Rate: ${priceStr}\n\n`;
    
    message += `📍 Destination Location:\n`;
    message += `• City / Area: ${displayCity}${displayArea}\n`;
    if (customAddress.trim()) message += `• Complete Address: ${customAddress.trim()}\n`;
    if (postalCode.trim()) message += `• Postal Code: ${postalCode.trim()}\n`;
    if (landmark.trim()) message += `• Landmark: ${landmark.trim()}\n`;

    message += `\n🚚 Delivery Estimate:\n`;
    if (deliveryTimeDisplay.value) {
      message += `• ${deliveryTimeDisplay.label} ${deliveryTimeDisplay.value}\n`;
    }
    if (deliveryFeeDisplay.value) {
      message += `• ${deliveryFeeDisplay.label} ${deliveryFeeDisplay.value}\n`;
    }
    if (customTextMessage?.text) {
      message += `• Note: ${customTextMessage.text}\n`;
    }

    message += `\nPlease confirm availability, total charges, and delivery schedule. Thank you!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${rawNumber}?text=${encoded}`, '_blank');
  };

  return (
    <div className="bg-slate-900/95 border border-slate-800 rounded-3xl p-5 sm:p-6 space-y-4 shadow-2xl relative overflow-hidden">
      {/* Decorative Accent Glow */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-sm">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-white text-base flex items-center gap-2">
              Delivery Information & Checker
            </h4>
            <p className="text-[11px] text-amber-400/90 font-medium flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{deliverySettings.acrossPakistanHeadline || 'Express Delivery Available Across Pakistan'}</span>
            </p>
          </div>
        </div>

        {deliverySettings.deliveryPartner && (
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-xl bg-slate-950 text-slate-300 text-[10px] font-mono border border-slate-800">
            {deliverySettings.deliveryPartner}
          </span>
        )}
      </div>

      {/* Product-Specific Custom Delivery Callout (if active on product) */}
      {prodConfig && (prodConfig.deliveryType === 'custom' || prodConfig.deliveryType === 'both') && customTextMessage && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-2.5">
          <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-200">
            <span className="font-bold text-amber-300 mr-1.5">{customTextMessage.label}</span>
            <span className="leading-relaxed">{customTextMessage.text}</span>
          </div>
        </div>
      )}

      {/* SMART DELIVERY AVAILABILITY CHECKER */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>Check Delivery Availability in Your City / Area:</span>
          </label>
          <span className="text-[10px] text-slate-400 hidden sm:inline-block">50+ Pakistan Cities & Tehsils</span>
        </div>

        {/* Live Search & Autocomplete Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Type your city or area (e.g. Chiniot, Chenab Nagar, Bhowana, Lahore, DHA...)"
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl pl-10 pr-10 py-2.5 text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors shadow-inner"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400 hover:text-white text-xs font-bold"
            >
              ✕
            </button>
          )}
        </div>

        {/* Search Autocomplete Suggestions Dropdown */}
        {searchQuery.trim().length > 0 && (
          <div className="p-2 rounded-xl bg-slate-950 border border-amber-500/30 max-h-48 overflow-y-auto space-y-1 shadow-2xl animate-fadeIn">
            {searchResults.length > 0 ? (
              searchResults.map(city => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => handleSelectSearchResult(city)}
                  className="w-full text-left p-2 rounded-lg hover:bg-slate-900 flex items-center justify-between gap-2 text-xs transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{city.cityName}</span>
                    {city.areaTown && (
                      <span className="text-[10px] text-slate-400">({city.areaTown})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-amber-400 font-mono font-medium">{city.estimatedDays}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-bold border border-emerald-500/30">
                      {city.deliveryFee === 0 ? 'FREE' : `PKR ${city.deliveryFee}`}
                    </span>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-2.5 text-center text-xs text-slate-400">
                <p>"{searchQuery}" is not in our standard zone list.</p>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCityId(customCityOptionValue);
                    setCustomCityName(searchQuery);
                    setSearchQuery('');
                  }}
                  className="mt-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors inline-block"
                >
                  ➕ Check as Custom Location
                </button>
              </div>
            )}
          </div>
        )}

        {searchFeedback && (
          <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
            <Check className="w-3.5 h-3.5" />
            <span>{searchFeedback}</span>
          </p>
        )}

        {/* Quick City Suggestion Chips (Top Delivery Hubs) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mr-1">Quick:</span>
          {activeCities.slice(0, 8).map(city => {
            const isSelected = selectedCityId === city.id;
            return (
              <button
                key={city.id}
                type="button"
                onClick={() => {
                  setSelectedCityId(city.id);
                  setSearchQuery('');
                  setSearchFeedback(null);
                }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium whitespace-nowrap transition-all border shrink-0 ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                📍 {city.cityName}
              </button>
            );
          })}
        </div>

        {/* City Select Dropdown for complete full list */}
        <div className="relative">
          <select
            value={selectedCityId}
            onChange={(e) => {
              setSelectedCityId(e.target.value);
              setSearchFeedback(null);
            }}
            className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 pr-10 text-xs font-semibold appearance-none focus:outline-none focus:border-amber-500 transition-colors cursor-pointer"
          >
            {activeCities.map(city => (
              <option key={city.id} value={city.id}>
                📍 {city.cityName} {city.areaTown ? `— ${city.areaTown}` : ''} ({city.estimatedDays} | {city.deliveryFee === 0 ? 'FREE' : `PKR ${city.deliveryFee}`})
              </option>
            ))}
            {deliverySettings.enableCustomCity !== false && (
              <option value={customCityOptionValue}>
                {deliverySettings.customCityLabel || '➕ Custom City / Other Location'}
              </option>
            )}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
        </div>
      </div>

      {/* DELIVERY AVAILABILITY STATUS CARDS */}

      {/* CASE 1: PREDEFINED CITY AVAILABLE */}
      {cityStatus === 'available' && selectedCity && (
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 space-y-3 shadow-lg">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">
                  Delivery Available to {selectedCity.cityName}
                </span>
              </div>
              {selectedCity.areaTown && (
                <p className="text-[11px] text-slate-400 pl-6">
                  Coverage: {selectedCity.areaTown}
                </p>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {selectedCity.isSameDayAvailable && (
                <span className="px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                  ⚡ Same Day
                </span>
              )}
              {selectedCity.isNextDayAvailable && (
                <span className="px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-300 border border-blue-500/30 text-[10px] font-bold">
                  🚀 Next Day
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 font-medium block">
                {deliveryTimeDisplay.label}
              </span>
              <span className="text-sm font-bold text-amber-400 flex items-center gap-1.5 mt-0.5 font-serif">
                <Clock className="w-4 h-4 text-amber-400 shrink-0" />
                <span>{deliveryTimeDisplay.value}</span>
              </span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-medium block">
                {deliveryFeeDisplay.label}
              </span>
              <span className={`text-sm mt-0.5 block ${deliveryFeeDisplay.badgeColor}`}>
                {deliveryFeeDisplay.value}
              </span>
            </div>
          </div>

          {selectedCity.notes && (
            <div className="text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 flex items-start gap-2">
              <Info className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
              <span>{selectedCity.notes}</span>
            </div>
          )}
        </div>
      )}

      {/* CASE 2: CONTACT TO CONFIRM */}
      {cityStatus === 'contact_to_confirm' && selectedCity && (
        <div className="p-4 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-3 shadow-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-xs font-bold text-amber-300">
              Delivery to {selectedCity.cityName} Requires Confirmation
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedCity.notes || 'Please contact our logistics team on WhatsApp to confirm delivery route, freight timings, and cargo handling for this area.'}
          </p>
        </div>
      )}

      {/* CASE 3: UNAVAILABLE */}
      {cityStatus === 'unavailable' && selectedCity && (
        <div className="p-4 rounded-2xl bg-rose-950/30 border border-rose-500/40 space-y-3 shadow-lg">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="text-xs font-bold text-rose-300">
              Standard Courier Delivery Not Currently Listed for {selectedCity.cityName}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Our standard door-to-door courier route is not scheduled for this area. However, we can arrange dedicated private freight or showroom truck dispatch on special request.
          </p>
        </div>
      )}

      {/* CASE 4: CUSTOM CITY / UNLISTED LOCATION */}
      {isCustomSelected && (
        <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/40 space-y-3 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-200">
                {deliverySettings.customCityNotice || 'Delivery time for custom location will be confirmed by our team.'}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Enter your city and details below to send an instant location inquiry via WhatsApp.
              </p>
            </div>
          </div>

          <div className="space-y-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">City / Area Name *</label>
              <input
                type="text"
                placeholder="e.g. Kasur, Swat, Daska, Rahim Yar Khan, Mirpur..."
                value={customCityName}
                onChange={(e) => setCustomCityName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-400"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-300 mb-1">Full Delivery Address (Optional)</label>
              <input
                type="text"
                placeholder="House/Shop No, Street, Mohallah, Town"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-white text-xs rounded-xl px-3 py-2 outline-none focus:border-amber-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Postal Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 54000"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="Near main hospital / chowk"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-amber-400"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optional Address Expansion for Predefined Cities */}
      {!isCustomSelected && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowAddressForm(!showAddressForm)}
            className="text-[11px] text-amber-400 hover:text-amber-300 font-semibold underline flex items-center gap-1 transition-colors"
          >
            <span>{showAddressForm ? '− Hide full address fields' : '➕ Add complete delivery address for WhatsApp confirmation'}</span>
          </button>

          {showAddressForm && (
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5 text-xs animate-fadeIn">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1">Complete Delivery Address</label>
                <input
                  type="text"
                  placeholder="House/Shop No, Street, Sector/Block"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Postal Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 54000"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-2.5 py-1 text-xs outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Landmark / Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. Near main bazaar"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-2.5 py-1 text-xs outline-none focus:border-amber-400"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Operational Highlights Grid (Cut-off & Working Hours) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs pt-1">
        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Order Cut-off: {deliverySettings.orderCutoffTime || '05:00 PM'}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Orders placed before <strong className="text-slate-200">{deliverySettings.orderCutoffTime || '05:00 PM'}</strong> are processed the same working day.
          </p>
        </div>

        <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-blue-400 font-bold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Showroom Working Hours</span>
          </div>
          <p className="text-[11px] text-slate-300 font-medium">
            🕒 {deliverySettings.storeOpeningTime || '09:00 AM'} - {deliverySettings.storeClosingTime || '09:00 PM'} ({deliverySettings.workingDays || 'Mon - Sat'})
          </p>
        </div>
      </div>

      {/* Customer Delivery Notes (Bullet points) */}
      {deliverySettings.deliveryNotes && deliverySettings.deliveryNotes.length > 0 && (
        <div className="p-3 rounded-2xl bg-slate-950/50 border border-slate-800/60 space-y-1 text-[11px] text-slate-400">
          {deliverySettings.deliveryNotes.slice(0, 3).map((note, idx) => (
            <div key={idx} className="flex items-start gap-1.5">
              <span className="text-amber-400 shrink-0">•</span>
              <span>{note.replace(/^✓\s*/, '')}</span>
            </div>
          ))}
        </div>
      )}

      {/* ONE-CLICK WHATSAPP CONFIRMATION BUTTON */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleConfirmWhatsapp}
          className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/60 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <MessageSquare className="w-4 h-4 fill-white shrink-0" />
          <span>
            Confirm Delivery on WhatsApp ({isCustomSelected ? (customCityName || 'Custom City') : (selectedCity ? selectedCity.cityName : 'Your City')})
          </span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80 shrink-0" />
        </button>
      </div>
    </div>
  );
};
