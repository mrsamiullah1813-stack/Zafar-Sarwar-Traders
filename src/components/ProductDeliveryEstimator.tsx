import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Calendar, 
  MessageSquare, 
  ShieldCheck, 
  CheckCircle2, 
  ChevronDown,
  Info,
  ExternalLink,
  Building2,
  Compass,
  FileText
} from 'lucide-react';
import { DeliverySettings, CityDeliveryInfo, Product } from '../types';
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

  // Active cities only
  const activeCities = deliverySettings.cities.filter(c => c.isEnabled);
  const customCityOptionValue = 'CUSTOM_CITY_OPTION';
  const customCityLabelText = deliverySettings.customCityLabel || '➕ Custom City / Address';
  
  // Selected City State
  const [selectedCityId, setSelectedCityId] = useState<string>(() => {
    if (deliverySettings.defaultSelectedCityId && activeCities.some(c => c.id === deliverySettings.defaultSelectedCityId)) {
      return deliverySettings.defaultSelectedCityId;
    }
    return activeCities[0]?.id || '';
  });

  // Custom city form fields
  const [customCityName, setCustomCityName] = useState('');
  const [customAddress, setCustomAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [instructions, setInstructions] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isCustomCity = selectedCityId === customCityOptionValue || selectedCityId === 'Other';
  const selectedCity = activeCities.find(c => c.id === selectedCityId || c.cityName === selectedCityId);

  if (!deliverySettings.isEnabled) {
    return null;
  }

  const validateCustom = () => {
    const errs: Record<string, string> = {};
    if (isCustomCity || showAddressForm) {
      if (isCustomCity && !customCityName.trim()) {
        errs.customCityName = 'Please enter your city or area.';
      }
      if (!customAddress.trim() && (isCustomCity || showAddressForm)) {
        errs.customAddress = 'Please enter your complete delivery address.';
      }
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Format WhatsApp Link
  const handleConfirmWhatsapp = () => {
    if ((isCustomCity || showAddressForm) && !validateCustom()) {
      return;
    }

    const rawNumber = (deliverySettings.whatsappSupportNumber || '+923108002863').replace(/[^0-9]/g, '');
    const displayCity = isCustomCity 
      ? (customCityName.trim() || 'Custom City') 
      : (selectedCity ? selectedCity.cityName : 'My City');

    const priceStr = product.salePrice || product.price || 'Contact for price';
    
    let message = `Hello Zafar Sarwar Traders,\n\n`;
    message += `I want to place an order / confirm delivery time.\n\n`;
    message += `Product:\n• ${product.name} (${priceStr})\n\n`;
    
    message += `Delivery Location:\n`;
    message += `City: ${displayCity}\n`;
    if (customAddress.trim()) message += `Address: ${customAddress.trim()}\n`;
    if (postalCode.trim()) message += `Postal Code: ${postalCode.trim()}\n`;
    if (instructions.trim()) message += `Instructions: ${instructions.trim()}\n`;

    message += `\nDelivery Estimate:\n`;
    if (isCustomCity) {
      message += `${deliverySettings.customCityNotice || 'Delivery time for this location will be confirmed by our team.'}\n`;
    } else if (selectedCity) {
      message += `${selectedCity.estimatedDays} (Fee: ${selectedCity.deliveryFee === 0 ? 'FREE' : `PKR ${selectedCity.deliveryFee}`})\n`;
    }

    message += `\nPlease confirm delivery availability and estimated delivery time for my location.`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${rawNumber}?text=${encoded}`, '_blank');
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
      {/* Header Banner */}
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-white text-base">Delivery Information</h4>
            <p className="text-[11px] text-blue-400 font-semibold tracking-wide flex items-center gap-1 mt-0.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{deliverySettings.acrossPakistanHeadline || 'Delivery Available Across Pakistan'}</span>
            </p>
          </div>
        </div>

        {deliverySettings.deliveryPartner && (
          <span className="hidden sm:inline-block px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-[10px] font-mono border border-slate-700">
            {deliverySettings.deliveryPartner}
          </span>
        )}
      </div>

      {/* City Dropdown Selector */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            <span>Select Your Destination City:</span>
          </span>
          {selectedCity && !isCustomCity && (
            <span className="text-[10px] text-emerald-400 font-bold font-mono">
              Fee: {selectedCity.deliveryFee === 0 ? 'FREE' : `PKR ${selectedCity.deliveryFee}`}
            </span>
          )}
        </label>

        <div className="relative">
          <select
            value={selectedCityId}
            onChange={(e) => {
              setSelectedCityId(e.target.value);
              setErrors({});
            }}
            className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3.5 py-2.5 pr-10 text-xs font-semibold appearance-none focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
          >
            {activeCities.map(city => (
              <option key={city.id} value={city.id}>
                📍 {city.cityName} ({city.estimatedDays})
              </option>
            ))}
            {deliverySettings.enableCustomCity !== false && (
              <option value={customCityOptionValue}>
                {customCityLabelText}
              </option>
            )}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
        </div>
      </div>

      {/* Dynamic Delivery Estimation Box for Selected Predefined City */}
      {!isCustomCity && selectedCity && (
        <div className="p-4 rounded-xl bg-gradient-to-br from-blue-950/40 via-slate-950 to-slate-900 border border-blue-900/40 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-400">Estimated Delivery:</span>
              <span className="text-sm font-bold text-white font-serif">{selectedCity.cityName}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {selectedCity.isSameDayAvailable && (
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/60 text-[10px] font-bold">
                  ⚡ Same Day
                </span>
              )}
              {selectedCity.isNextDayAvailable && (
                <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 text-[10px] font-bold">
                  🚀 Next Day
                </span>
              )}
            </div>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="text-base font-serif font-bold text-emerald-400 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>{selectedCity.estimatedDays}</span>
            </div>

            <div className="text-xs text-slate-300">
              Delivery Charge:{' '}
              <span className="font-bold text-white font-mono">
                {selectedCity.deliveryFee === 0 ? 'FREE' : `PKR ${(selectedCity.deliveryFee ?? 0).toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Custom City Notice & Address Form Box */}
      {isCustomCity && (
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-700/50 space-y-3 animate-fadeIn">
          <div className="flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-amber-200">
                {deliverySettings.customCityNotice || 'Delivery time for this location will be confirmed by our team.'}
              </p>
              <p className="text-[11px] text-amber-300/80 mt-0.5 leading-relaxed">
                Please enter your city and address below to request exact delivery details on WhatsApp.
              </p>
            </div>
          </div>

          {/* Custom City & Address Inputs */}
          <div className="space-y-2.5 pt-1">
            <div>
              <label className="block text-[11px] font-bold text-amber-200 mb-1">City / Area *</label>
              <input
                type="text"
                placeholder="Enter your city or area (e.g. Kasur, Swat, Daska, Rahim Yar Khan)"
                value={customCityName}
                onChange={(e) => setCustomCityName(e.target.value)}
                className={`w-full bg-slate-950 border text-white text-xs rounded-lg px-3 py-2 outline-none ${
                  errors.customCityName ? 'border-rose-500' : 'border-amber-700/60 focus:border-amber-400'
                }`}
              />
              {errors.customCityName && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.customCityName}</p>}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-amber-200 mb-1">Full Delivery Address *</label>
              <input
                type="text"
                placeholder="House/Shop No, Street, Area, City"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                className={`w-full bg-slate-950 border text-white text-xs rounded-lg px-3 py-2 outline-none ${
                  errors.customAddress ? 'border-rose-500' : 'border-amber-700/60 focus:border-amber-400'
                }`}
              />
              {errors.customAddress && <p className="text-[10px] text-rose-400 mt-1 font-semibold">{errors.customAddress}</p>}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-300 mb-1">Postal Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 54000"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-300 mb-1">Landmark / Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="Any landmark or delivery instructions"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Optional Address Toggle for Predefined Cities */}
      {!isCustomCity && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowAddressForm(!showAddressForm)}
            className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold underline flex items-center gap-1 transition-colors"
          >
            <span>{showAddressForm ? '− Hide full delivery address' : '➕ Add complete delivery address for WhatsApp confirmation'}</span>
          </button>

          {showAddressForm && (
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs animate-fadeIn">
              <div>
                <label className="block text-[10px] font-bold text-slate-300 mb-1">Full Delivery Address *</label>
                <input
                  type="text"
                  placeholder="House/Plot No, Street, Area, Block"
                  value={customAddress}
                  onChange={(e) => setCustomAddress(e.target.value)}
                  className={`w-full bg-slate-900 border text-white rounded-lg px-3 py-1.5 text-xs outline-none ${
                    errors.customAddress ? 'border-rose-500' : 'border-slate-700 focus:border-blue-500'
                  }`}
                />
                {errors.customAddress && <p className="text-[10px] text-rose-400 mt-0.5">{errors.customAddress}</p>}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Postal Code</label>
                  <input
                    type="text"
                    placeholder="e.g. 54000"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-2.5 py-1 text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-400 mb-0.5">Landmark / Instructions</label>
                  <input
                    type="text"
                    placeholder="Near main market"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 text-white rounded-lg px-2.5 py-1 text-xs outline-none"
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Order Cut-off & Store Working Hours Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Cut-off Box */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Clock className="w-3.5 h-3.5" />
            <span>Order Cut-off Time: {deliverySettings.orderCutoffTime}</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            • Orders placed before <strong className="text-slate-200">{deliverySettings.orderCutoffTime}</strong> process same working day.
          </p>
        </div>

        {/* Store Timings Box */}
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-1">
          <div className="flex items-center gap-1.5 text-blue-400 font-bold">
            <Calendar className="w-3.5 h-3.5" />
            <span>Store Working Hours</span>
          </div>
          <p className="text-[11px] text-slate-300 font-medium">
            🕒 {deliverySettings.storeOpeningTime} - {deliverySettings.storeClosingTime} ({deliverySettings.workingDays})
          </p>
        </div>
      </div>

      {/* WhatsApp Delivery Confirmation Button */}
      <div className="pt-2">
        <button
          onClick={handleConfirmWhatsapp}
          className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
        >
          <MessageSquare className="w-4 h-4 fill-white" />
          <span>Confirm Delivery on WhatsApp ({isCustomCity ? (customCityName || 'Custom Location') : (selectedCity ? selectedCity.cityName : 'Your City')})</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-80" />
        </button>
      </div>
    </div>
  );
};
