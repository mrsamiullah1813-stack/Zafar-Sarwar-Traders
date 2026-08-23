import React, { useState } from 'react';
import { X, ShoppingBag, CheckCircle2, Truck, ShieldCheck, Phone, MapPin, User, FileText, Send, Building2, Info, Compass, Mail } from 'lucide-react';
import { CartItem, BusinessConfig, CheckoutSettings, CustomerOrder, OrderItem, DeliverySettings } from '../types';
import { loadDeliverySettings, generateNextOrderId } from '../utils/storage';
import { getOrGenerateCustomerId } from '../utils/customerStorage';
import { getProductPricingDetails, getVariantPricingDetails, getActiveProductPrice } from '../utils/pricingUtils';

interface OrderCheckoutModalProps {
  isOpen: boolean;
  cartItems: CartItem[];
  config: BusinessConfig;
  checkoutSettings: CheckoutSettings;
  onClose: () => void;
  onOrderPlaced: (order: CustomerOrder) => void;
}

export const OrderCheckoutModal: React.FC<OrderCheckoutModalProps> = ({
  isOpen,
  cartItems,
  config,
  checkoutSettings,
  onClose,
  onOrderPlaced,
}) => {
  const [deliverySettings] = useState<DeliverySettings>(() => loadDeliverySettings());
  const activeCities = deliverySettings.cities.filter(c => c.isEnabled);

  const customCityOptionValue = 'CUSTOM_CITY_OPTION';
  const customCityLabelText = deliverySettings.customCityLabel || '➕ Custom City / Address';

  const [customerName, setCustomerName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCityId, setSelectedCityId] = useState<string>(
    activeCities[0]?.cityName || 'Lahore'
  );
  const [customCityName, setCustomCityName] = useState('');
  const [areaLocality, setAreaLocality] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [landmark, setLandmark] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const items = Array.isArray(cartItems) ? cartItems : [];

  const isCustomCitySelected = selectedCityId === customCityOptionValue || selectedCityId === 'Other';

  // Find city info if predefined
  const matchedCity = activeCities.find(
    c => c.cityName.toLowerCase() === selectedCityId.toLowerCase() || c.id === selectedCityId
  );

  const finalCityName = isCustomCitySelected 
    ? (customCityName.trim() || 'Custom Location')
    : (matchedCity ? matchedCity.cityName : selectedCityId);

  const getItemPricing = (item: CartItem) => {
    if (!item?.product) return { effectivePriceNumeric: 0, isSaleActive: false, discountPercentage: 0, regularPriceNumeric: 0, effectivePriceString: 'Price on Request', formattedSalePrice: '', formattedRegularPrice: '', variantSku: undefined };
    const p = item.product;
    const pricing = getActiveProductPrice(p, item.selectedVariant || item.selectedVariantId);
    const variants = p.variantsList || p.variantsConfig?.variants || [];
    const matched = variants.find(v => v.name === item.selectedVariant || v.id === item.selectedVariantId || v.id === item.selectedVariant);
    return { ...pricing, variantSku: matched?.sku || p.sku };
  };

  // Calculations
  const calculateSubtotal = () => {
    return items.reduce((acc, item) => {
      if (!item?.product) return acc;
      const pricing = getItemPricing(item);
      return acc + pricing.effectivePriceNumeric * (item.quantity || 1);
    }, 0);
  };

  const subtotal = calculateSubtotal();

  const isFreeDelivery = checkoutSettings.freeDeliveryThreshold 
    ? subtotal >= checkoutSettings.freeDeliveryThreshold 
    : false;

  const cityDeliveryFee = isCustomCitySelected 
    ? (checkoutSettings.deliveryFee || 250)
    : (matchedCity ? matchedCity.deliveryFee : (checkoutSettings.deliveryFee || 250));

  const deliveryCharges = subtotal > 0 ? (isFreeDelivery ? 0 : cityDeliveryFee) : 0;
  
  const taxAmount = checkoutSettings.enableTaxes && checkoutSettings.taxRatePercent > 0
    ? Math.round((subtotal * checkoutSettings.taxRatePercent) / 100)
    : 0;

  const grandTotal = subtotal + deliveryCharges + taxAmount;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!customerName.trim()) errs.customerName = 'Please enter your full name';
    if (!phoneNumber.trim()) {
      errs.phoneNumber = 'Please enter phone number';
    } else if (phoneNumber.trim().replace(/[^0-9]/g, '').length < 10) {
      errs.phoneNumber = 'Please enter a valid 11-digit mobile number';
    }

    if (isCustomCitySelected && !customCityName.trim()) {
      errs.customCityName = 'Please enter your city or area';
    }

    if (!areaLocality.trim()) {
      errs.areaLocality = 'Please enter your area or locality (e.g. DHA Phase 6, Model Town)';
    }

    if (!deliveryAddress.trim()) {
      errs.deliveryAddress = 'Please enter complete delivery address';
    }
    
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const orderId = generateNextOrderId();

    const orderItems: OrderItem[] = items.map(item => {
      const p = item.product;
      const pricing = getItemPricing(item);
      const numericPrice = pricing.effectivePriceNumeric;
      let unitPriceText = pricing.effectivePriceString;
      if (pricing.isSaleActive && pricing.discountPercentage > 0) {
        unitPriceText = `${pricing.formattedSalePrice} (Sale ${pricing.discountPercentage}% OFF)`;
      }
      return {
        productId: p.id,
        productName: p.name,
        brand: p.brand || p.category,
        image: p.images?.[0] || p.image,
        sku: pricing.variantSku || p.sku,
        unitPrice: unitPriceText,
        numericPrice: numericPrice,
        quantity: item.quantity,
        selectedColor: item.selectedColor,
        selectedSize: item.selectedSize,
        selectedQuality: item.selectedQuality,
        selectedVariant: item.selectedVariant,
        selectedVariantId: item.selectedVariantId,
        selectedVariantName: item.selectedVariantName,
        selectedOptionName: item.selectedOptionName,
        selectedVariantSku: item.selectedVariantSku,
        selectedShade: item.selectedShade,
        selectedShadeId: item.selectedShadeId,
        selectedShadeCode: item.selectedShadeCode,
        selectedShadeColor: item.selectedShadeColor,
        selectedShadeImage: item.selectedShadeImage,
        selectedShadePriceAdjustment: item.selectedShadePriceAdjustment,
        lineTotal: numericPrice * item.quantity,
      };
    });

    const custId = getOrGenerateCustomerId();
    const cleanOrderId = orderId.replace('#', '');

    const newOrder: CustomerOrder = {
      id: orderId,
      orderNumber: `ZFT-${cleanOrderId}`,
      customerId: custId,
      customerName: customerName.trim(),
      phoneNumber: phoneNumber.trim(),
      city: finalCityName,
      areaLocality: areaLocality.trim(),
      deliveryAddress: deliveryAddress.trim(),
      postalCode: postalCode.trim() || undefined,
      landmark: landmark.trim() || undefined,
      deliveryInstructions: deliveryInstructions.trim() || undefined,
      notes: notes.trim() || undefined,
      items: orderItems,
      subtotal,
      deliveryCharges,
      taxAmount,
      grandTotal,
      createdAt: new Date().toISOString(),
      status: 'Order Received',
      estimatedDeliveryDays: matchedCity ? matchedCity.estimatedDays : '2-4 Business Days',
      estimatedDeliveryDate: matchedCity ? matchedCity.estimatedDays : '2-4 Business Days',
      estimatedDeliveryTime: '10:00 AM – 6:00 PM',
    };

    // Construct formatted WhatsApp message
    let msg = `NEW ORDER — ${(config.name || 'ZAFAR SARWAR TRADERS').toUpperCase()}\n\n`;
    msg += `Order ID:\n#${orderId}\n\n`;

    msg += `CUSTOMER\n`;
    msg += `Name: ${customerName.trim()}\n`;
    msg += `Phone: ${phoneNumber.trim()}\n\n`;

    msg += `DELIVERY LOCATION\n`;
    msg += `City: ${finalCityName}\n`;
    msg += `Area: ${areaLocality.trim()}\n`;
    msg += `Address: ${deliveryAddress.trim()}\n`;
    if (postalCode.trim()) msg += `Postal Code: ${postalCode.trim()}\n`;
    if (landmark.trim()) msg += `Landmark: ${landmark.trim()}\n`;
    msg += `\n`;

    msg += `DELIVERY\n`;
    if (isCustomCitySelected) {
      msg += `Estimated Delivery: ${deliverySettings.customCityNotice || 'Delivery time for this location will be confirmed by our team.'}\n\n`;
    } else if (matchedCity) {
      msg += `Estimated Delivery: ${matchedCity.estimatedDays}\n\n`;
    } else {
      msg += `Estimated Delivery: Standard Courier Delivery\n\n`;
    }

    msg += `ORDER ITEMS\n\n`;
    orderItems.forEach((item, index) => {
      msg += `${index + 1}. ${item.productName}\n`;
      msg += `Quantity: ${item.quantity}\n`;
      if (item.selectedVariant) msg += `Size / Option: ${item.selectedVariant}\n`;
      if (item.selectedShade) msg += `Selected Shade: ${item.selectedShade}\n`;
      if (item.selectedShadeCode) msg += `Shade Code: ${item.selectedShadeCode}\n`;
      if (item.selectedColor && !item.selectedShade) msg += `Color: ${item.selectedColor}\n`;
      if (item.selectedSize && !item.selectedVariant) msg += `Size: ${item.selectedSize}\n`;
      if (item.selectedQuality) msg += `Quality: ${item.selectedQuality}\n`;
      msg += `Price: ${item.unitPrice}\n`;
      msg += `Subtotal: ${item.lineTotal > 0 ? `PKR ${item.lineTotal.toLocaleString('en-PK')}` : item.unitPrice}\n\n`;
    });

    msg += `--------------------------------\n`;
    msg += `Subtotal: PKR ${subtotal.toLocaleString('en-PK')}\n`;
    if (isCustomCitySelected) {
      msg += `Delivery Fee: Will be confirmed by team on WhatsApp\n`;
    } else if (deliveryCharges === 0) {
      msg += `Delivery Fee: FREE Delivery\n`;
    } else {
      msg += `Delivery Fee: PKR ${deliveryCharges.toLocaleString('en-PK')}\n`;
    }
    if (taxAmount > 0) {
      msg += `Tax (${checkoutSettings.taxRatePercent}%): PKR ${taxAmount.toLocaleString('en-PK')}\n`;
    }
    msg += `TOTAL: PKR ${grandTotal.toLocaleString('en-PK')}\n`;
    msg += `--------------------------------\n\n`;

    if (deliveryInstructions.trim()) {
      msg += `Additional Instructions:\n${deliveryInstructions.trim()}\n\n`;
    }

    if (notes.trim()) {
      msg += `Special Notes:\n${notes.trim()}\n\n`;
    }

    msg += `Please confirm order availability and delivery.`;

    // Save order
    await onOrderPlaced(newOrder);

    // Open WhatsApp
    const targetWhatsapp = checkoutSettings.whatsappNumberOverride || deliverySettings.whatsappSupportNumber || config.whatsapp || config.phone || '923006603063';
    const cleanNum = targetWhatsapp.replace(/[^0-9]/g, '');
    const waUrl = `https://wa.me/${cleanNum}?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');

    setIsSubmitting(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 my-auto flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600 text-white shadow-md">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg text-white leading-tight">Complete Your Delivery Details</h3>
              <p className="text-xs text-slate-300">Enter delivery address & place your order directly via WhatsApp</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body Grid */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Customer Details Form (Left Column - 7 Cols) */}
          <form onSubmit={handlePlaceOrder} id="checkout-form" className="lg:col-span-7 space-y-4">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-sm">Customer & Address Information</h4>
              </div>
              <span className="text-[11px] font-semibold text-slate-500">* Required Fields</span>
            </div>

            {/* Name & Phone Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Full Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="e.g. Ali Khan"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 text-xs font-medium rounded-xl border bg-slate-50 focus:bg-white text-slate-900 transition-all outline-none ${
                      errors.customerName ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.customerName && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.customerName}</p>}
              </div>

              {/* Phone / WhatsApp */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="e.g. 0300 1234567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className={`w-full pl-9 pr-3 py-2.5 text-xs font-medium rounded-xl border bg-slate-50 focus:bg-white text-slate-900 transition-all outline-none ${
                      errors.phoneNumber ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 focus:border-blue-500'
                    }`}
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                {errors.phoneNumber && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.phoneNumber}</p>}
              </div>
            </div>

            {/* City Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>Select Delivery City *</span>
                {matchedCity && !isCustomCitySelected && (
                  <span className="text-[11px] text-emerald-600 font-bold">
                    ⚡ {matchedCity.estimatedDays}
                  </span>
                )}
              </label>

              <div className="relative">
                <select
                  value={selectedCityId}
                  onChange={(e) => setSelectedCityId(e.target.value)}
                  className="w-full pl-9 pr-8 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 focus:border-blue-500 outline-none transition-all cursor-pointer appearance-none"
                >
                  {activeCities.map((c) => (
                    <option key={c.id} value={c.cityName}>
                      📍 {c.cityName} ({c.estimatedDays} • {c.deliveryFee === 0 ? 'FREE' : `PKR ${c.deliveryFee}`})
                    </option>
                  ))}
                  {deliverySettings.enableCustomCity !== false && (
                    <option value={customCityOptionValue}>
                      {customCityLabelText}
                    </option>
                  )}
                </select>
                <MapPin className="w-4 h-4 text-blue-600 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Custom City Manual Input Field */}
            {isCustomCitySelected && (
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2 animate-fadeIn">
                <label className="block text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-600" />
                  <span>City / Area *</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your city or area (e.g. Kasur, Swat, Daska, Rahim Yar Khan)"
                  value={customCityName}
                  onChange={(e) => setCustomCityName(e.target.value)}
                  className={`w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border bg-white text-slate-900 outline-none ${
                    errors.customCityName ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-amber-300 focus:border-amber-600'
                  }`}
                />
                {errors.customCityName && <p className="text-[11px] text-rose-600 font-semibold">{errors.customCityName}</p>}
                
                <p className="text-[11px] text-amber-800 font-medium leading-relaxed flex items-start gap-1 pt-1">
                  <Info className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span>{deliverySettings.customCityNotice || 'Delivery time for this location will be confirmed by our team on WhatsApp.'}</span>
                </p>
              </div>
            )}

            {/* Area / Locality */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Area / Locality *</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. DHA Phase 6, Sector F-7, Gulberg III, Model Town, Civil Lines"
                  value={areaLocality}
                  onChange={(e) => setAreaLocality(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 text-xs font-medium rounded-xl border bg-slate-50 focus:bg-white text-slate-900 transition-all outline-none ${
                    errors.areaLocality ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                <Compass className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              {errors.areaLocality && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.areaLocality}</p>}
            </div>

            {/* Complete Delivery Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Complete Address *</label>
              <div className="relative">
                <textarea
                  rows={2}
                  placeholder="House/Plot #, Street Number, Block/Sector, Building/Apartment Name"
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 text-xs font-medium rounded-xl border bg-slate-50 focus:bg-white text-slate-900 transition-all outline-none resize-none ${
                    errors.deliveryAddress ? 'border-rose-500 focus:ring-1 focus:ring-rose-500' : 'border-slate-200 focus:border-blue-500'
                  }`}
                />
                <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              </div>
              {errors.deliveryAddress && <p className="text-[11px] text-rose-500 mt-1 font-semibold">{errors.deliveryAddress}</p>}
            </div>

            {/* Postal Code & Landmark Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Postal Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. 54000"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Near XYZ Mosque / Commercial Market"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all focus:border-blue-500"
                />
              </div>
            </div>

            {/* Delivery Instructions */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Additional Delivery Instructions (Optional)</label>
              <input
                type="text"
                placeholder="e.g. Call before delivery, drop at gate, deliver between 2 PM - 5 PM"
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-slate-900 outline-none transition-all focus:border-blue-500"
              />
            </div>

            {/* Special Order Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Special Order Notes (Optional)</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="e.g. Urgent project requirement, invoice with company NTN..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 text-slate-900 focus:border-blue-500 outline-none transition-all"
                />
                <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Orders are confirmed directly by showroom representatives via WhatsApp. No upfront online payment required.</span>
            </div>
          </form>

          {/* Right Column: Order Summary & Estimate (5 Cols) */}
          <div className="lg:col-span-5 bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <h4 className="font-serif font-bold text-slate-900 text-sm">Order Summary</h4>
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  {items.reduce((s, i) => s + i.quantity, 0)} Items
                </span>
              </div>

              {/* Selected Delivery Location Badge */}
              <div className="p-3 rounded-xl bg-slate-900 text-white space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Destination:</span>
                  <span className="font-bold text-white truncate max-w-[150px]">{finalCityName}</span>
                </div>
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-400 font-medium">Estimate:</span>
                  <span className="font-bold text-emerald-400">
                    {isCustomCitySelected 
                      ? 'To be confirmed'
                      : (matchedCity ? matchedCity.estimatedDays : 'Standard Delivery')}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div className="max-h-44 overflow-y-auto space-y-2 pr-1 divide-y divide-slate-100">
                {items.map((item, idx) => {
                  const p = item.product;
                  const priceStr = p.salePrice || p.price || '0';
                  const numeric = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
                  const lineTot = numeric * item.quantity;

                  return (
                    <div key={idx} className="pt-2 first:pt-0 flex items-center gap-3">
                      <img
                        src={p.images?.[0] || p.image}
                        alt={p.name}
                        className="w-12 h-12 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
                      />
                      <div className="flex-1 min-w-0 text-xs">
                        <h5 className="font-bold text-slate-900 truncate leading-snug">{p.name}</h5>
                        <p className="text-[10px] text-slate-500 truncate">
                          {p.brand && `${p.brand} • `}Qty: {item.quantity}
                          {item.selectedVariant && ` • ${p.optionName || 'Opt'}: ${item.selectedVariant}`}
                          {item.selectedShade && ` • Shade: ${item.selectedShade}`}
                          {item.selectedColor && !item.selectedShade && ` • ${item.selectedColor}`}
                          {item.selectedSize && !item.selectedVariant && ` • ${item.selectedSize}`}
                        </p>
                      </div>
                      <div className="text-right text-xs shrink-0 font-bold text-slate-900 font-mono">
                        {lineTot > 0 ? `PKR ${lineTot.toLocaleString('en-PK')}` : priceStr}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Price Calculation Box */}
              <div className="pt-3 border-t border-slate-200 space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between items-center">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900 font-mono">
                    {subtotal > 0 ? `PKR ${subtotal.toLocaleString('en-PK')}` : 'Price on Request'}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5 text-blue-500" />
                    <span>Delivery Charges:</span>
                  </span>
                  <span className="font-bold font-mono">
                    {isCustomCitySelected ? (
                      <span className="text-amber-600 font-bold text-[11px]">To be confirmed</span>
                    ) : deliveryCharges === 0 ? (
                      <span className="text-emerald-600 uppercase font-extrabold text-[11px]">Free Delivery</span>
                    ) : (
                      `PKR ${deliveryCharges.toLocaleString('en-PK')}`
                    )}
                  </span>
                </div>

                {taxAmount > 0 && (
                  <div className="flex justify-between items-center">
                    <span>Tax ({checkoutSettings.taxRatePercent}%):</span>
                    <span className="font-bold text-slate-900 font-mono">PKR {taxAmount.toLocaleString('en-PK')}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 flex justify-between items-center font-extrabold text-sm text-slate-900">
                  <span>Grand Total:</span>
                  <span className="text-emerald-600 font-mono text-base">
                    {grandTotal > 0 ? `PKR ${grandTotal.toLocaleString('en-PK')}` : 'Price on Request'}
                  </span>
                </div>
              </div>
            </div>

            {/* Action Submit */}
            <div className="pt-2">
              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 transition-all duration-200 active:scale-98 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>Place Order via WhatsApp</span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
