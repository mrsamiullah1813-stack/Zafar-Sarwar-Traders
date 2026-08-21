import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Video, Image as ImageIcon, Sparkles, Tag, ShieldCheck, Layers, Star, Truck, Clock, MapPin, Info, DollarSign, MessageSquare, AlertCircle, Flame, Percent, Calendar, Timer } from 'lucide-react';
import { Product, ProductVideo, ProductCategory, ProductBrand, ProductDeliveryConfig, ProductSaleConfig } from '../types';
import { VideoUploader } from './VideoUploader';
import { MultiImageUploader } from './MultiImageUploader';
import { formatSupabaseError } from '../services/supabaseService';
import { parseNumericPrice, calculateDiscountPercentage, calculateSavingsAmount, formatPakistaniPrice } from '../utils/pricingUtils';

interface AdminProductModalProps {
  product: Product | null; // null for creating new product
  categories: ProductCategory[];
  brands?: ProductBrand[];
  onSave: (product: Product) => Promise<void> | void;
  onDelete?: (productId: string) => void;
  onClose: () => void;
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  product,
  categories,
  brands = [],
  onSave,
  onDelete,
  onClose
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    id: `prod-${Date.now()}`,
    name: '',
    category: categories[0]?.name || 'Sanitaryware',
    categoryId: categories[0]?.id || 'bathroom-accessories',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    description: '',
    price: 'PKR Call for Price',
    features: ['High Durability', '10 Year Warranty'],
    specs: { 'Material': 'Solid Brass', 'Origin': 'Imported' },
    badge: 'LUXURY',
    brand: brands[0]?.name || 'Master Sanitary Ware',
    brandId: brands[0]?.id || 'master',
    stockStatus: 'In Stock',
    stockQuantity: 50,
    hideStockBadge: false,
    isPriceOnRequest: false,
    hidePrice: false,
    isFeatured: true,
    rating: 4.8,
    reviewsCount: 12,
    videos: []
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [featuresInput, setFeaturesInput] = useState<string>('');
  const [colorsInput, setColorsInput] = useState<string>('');
  const [sizesInput, setSizesInput] = useState<string>('');
  const [materialsInput, setMaterialsInput] = useState<string>('');
  const [specPairs, setSpecPairs] = useState<{ key: string; value: string }[]>([]);
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecVal, setNewSpecVal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Delivery configuration states
  const [hasCustomDelivery, setHasCustomDelivery] = useState<boolean>(false);
  const [deliveryType, setDeliveryType] = useState<'standard' | 'custom' | 'both'>('standard');
  const [minDeliveryTime, setMinDeliveryTime] = useState<number>(3);
  const [maxDeliveryTime, setMaxDeliveryTime] = useState<number>(5);
  const [deliveryTimeUnit, setDeliveryTimeUnit] = useState<'Days' | 'Hours' | 'Working Days'>('Days');
  const [customDeliveryTimeLabel, setCustomDeliveryTimeLabel] = useState<string>('Estimated Delivery:');
  const [customDeliveryMessage, setCustomDeliveryMessage] = useState<string>('');
  const [customMessageLabel, setCustomMessageLabel] = useState<string>('Delivery Info:');
  const [deliveryFeeType, setDeliveryFeeType] = useState<'free' | 'fixed' | 'contact' | 'custom'>('contact');
  const [deliveryFeeAmount, setDeliveryFeeAmount] = useState<number>(350);
  const [deliveryFeeCustomText, setDeliveryFeeCustomText] = useState<string>('');
  const [deliveryFeeLabel, setDeliveryFeeLabel] = useState<string>('Delivery Fee:');
  const [deliveryAreaText, setDeliveryAreaText] = useState<string>('');
  const [deliveryNote, setDeliveryNote] = useState<string>('');
  const [hideDeliveryInfo, setHideDeliveryInfo] = useState<boolean>(false);

  // Sale & Discount configuration states
  const [saleEnabled, setSaleEnabled] = useState<boolean>(false);
  const [salePrice, setSalePrice] = useState<string>('');
  const [saleStartDate, setSaleStartDate] = useState<string>('');
  const [saleEndDate, setSaleEndDate] = useState<string>('');
  const [saleLabel, setSaleLabel] = useState<string>('SALE');
  const [saleBadgeColor, setSaleBadgeColor] = useState<string>('red');
  const [saleMessage, setSaleMessage] = useState<string>('');
  const [showSaleCountdown, setShowSaleCountdown] = useState<boolean>(true);
  const [showDiscountPercentage, setShowDiscountPercentage] = useState<boolean>(true);
  const [showSavingsAmount, setShowSavingsAmount] = useState<boolean>(true);

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        stockStatus: product.stockStatus || 'In Stock',
        videos: product.videos ? [...product.videos] : []
      });
      setUploadedImages(product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []));
      setFeaturesInput(product.features ? product.features.join('\n') : '');
      setColorsInput(product.availableColors ? product.availableColors.join(', ') : '');
      setSizesInput(product.availableSizes ? product.availableSizes.join(', ') : '');
      setMaterialsInput(product.availableMaterials ? product.availableMaterials.join(', ') : '');
      
      if (product.specs) {
        setSpecPairs(Object.entries(product.specs).map(([k, v]) => ({ key: k, value: String(v) })));
      } else {
        setSpecPairs([{ key: 'Material', value: 'Solid Brass' }]);
      }

      // Populate sale states
      const isProductSaleOn = Boolean(product.saleEnabled || product.saleConfig?.saleEnabled);
      setSaleEnabled(isProductSaleOn);
      setSalePrice(String(product.salePrice ?? product.saleConfig?.salePrice ?? ''));
      setSaleStartDate(product.saleStartDate ?? product.saleConfig?.saleStartDate ?? '');
      setSaleEndDate(product.saleEndDate ?? product.saleConfig?.saleEndDate ?? '');
      setSaleLabel(product.saleLabel ?? product.saleConfig?.saleLabel ?? 'SALE');
      setSaleBadgeColor(product.saleBadgeColor ?? product.saleConfig?.saleBadgeColor ?? 'red');
      setSaleMessage(product.saleMessage ?? product.saleConfig?.saleMessage ?? '');
      setShowSaleCountdown(product.showSaleCountdown ?? product.saleConfig?.showCountdown ?? true);
      setShowDiscountPercentage(product.showDiscountPercentage ?? product.saleConfig?.showDiscountPercentage ?? true);
      setShowSavingsAmount(product.showSavingsAmount ?? product.saleConfig?.showSavings ?? true);

      if (product.deliveryConfig) {
        setHasCustomDelivery(true);
        setDeliveryType(product.deliveryConfig.deliveryType && product.deliveryConfig.deliveryType !== 'inherit' ? product.deliveryConfig.deliveryType : 'standard');
        setMinDeliveryTime(product.deliveryConfig.minDeliveryTime ?? 3);
        setMaxDeliveryTime(product.deliveryConfig.maxDeliveryTime ?? 5);
        setDeliveryTimeUnit(product.deliveryConfig.deliveryTimeUnit || 'Days');
        setCustomDeliveryTimeLabel(product.deliveryConfig.customDeliveryTimeLabel || 'Estimated Delivery:');
        setCustomDeliveryMessage(product.deliveryConfig.customDeliveryMessage || '');
        setCustomMessageLabel(product.deliveryConfig.customMessageLabel || 'Delivery Info:');
        setDeliveryFeeType(product.deliveryConfig.deliveryFeeType && product.deliveryConfig.deliveryFeeType !== 'inherit' ? product.deliveryConfig.deliveryFeeType : 'contact');
        setDeliveryFeeAmount(product.deliveryConfig.deliveryFeeAmount ?? 350);
        setDeliveryFeeCustomText(product.deliveryConfig.deliveryFeeCustomText || '');
        setDeliveryFeeLabel(product.deliveryConfig.deliveryFeeLabel || 'Delivery Fee:');
        setDeliveryAreaText(product.deliveryConfig.deliveryAreaText || '');
        setDeliveryNote(product.deliveryConfig.deliveryNote || '');
        setHideDeliveryInfo(Boolean(product.deliveryConfig.hideDeliveryInfo));
      } else {
        setHasCustomDelivery(false);
        setDeliveryType('standard');
        setMinDeliveryTime(3);
        setMaxDeliveryTime(5);
        setDeliveryTimeUnit('Days');
        setCustomDeliveryTimeLabel('Estimated Delivery:');
        setCustomDeliveryMessage('');
        setCustomMessageLabel('Delivery Info:');
        setDeliveryFeeType('contact');
        setDeliveryFeeAmount(350);
        setDeliveryFeeCustomText('');
        setDeliveryFeeLabel('Delivery Fee:');
        setDeliveryAreaText('');
        setDeliveryNote('');
        setHideDeliveryInfo(false);
      }
    } else {
      setFeaturesInput('High Durability\n10 Year Official Warranty\nPrecision Engineering');
      setSpecPairs([{ key: 'Material', value: 'Solid Brass / Porcelain' }, { key: 'Origin', value: 'Imported' }]);
      setSaleEnabled(false);
      setSalePrice('');
      setSaleStartDate('');
      setSaleEndDate('');
      setSaleLabel('SALE');
      setSaleBadgeColor('red');
      setSaleMessage('');
      setShowSaleCountdown(true);
      setShowDiscountPercentage(true);
      setShowSavingsAmount(true);
      setHasCustomDelivery(false);
      setDeliveryType('standard');
      setMinDeliveryTime(3);
      setMaxDeliveryTime(5);
      setDeliveryTimeUnit('Days');
      setCustomDeliveryTimeLabel('Estimated Delivery:');
      setCustomDeliveryMessage('');
      setCustomMessageLabel('Delivery Info:');
      setDeliveryFeeType('contact');
      setDeliveryFeeAmount(350);
      setDeliveryFeeCustomText('');
      setDeliveryFeeLabel('Delivery Fee:');
      setDeliveryAreaText('');
      setDeliveryNote('');
      setHideDeliveryInfo(false);
    }
  }, [product]);

  const handleAddSpecPair = () => {
    if (!newSpecKey.trim() || !newSpecVal.trim()) return;
    setSpecPairs(prev => [...prev, { key: newSpecKey.trim(), value: newSpecVal.trim() }]);
    setNewSpecKey('');
    setNewSpecVal('');
  };

  const handleRemoveSpecPair = (index: number) => {
    setSpecPairs(prev => prev.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (catId: string) => {
    const selected = categories.find(c => c.id === catId);
    setFormData(prev => ({
      ...prev,
      categoryId: catId,
      category: selected ? selected.name : prev.category
    }));
  };

  const handleBrandChange = (brandId: string) => {
    const selected = brands.find(b => b.id === brandId);
    setFormData(prev => ({
      ...prev,
      brandId: brandId,
      brand: selected ? selected.name : prev.brand
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId) return;

    const mainImg = uploadedImages.length > 0 ? uploadedImages[0] : (formData.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80');

    const parsedFeatures = featuresInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const parsedColors = colorsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const parsedSizes = sizesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const parsedMaterials = materialsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const specsObj: Record<string, string> = {};
    specPairs.forEach(p => {
      if (p.key.trim() && p.value.trim()) {
        specsObj[p.key.trim()] = p.value.trim();
      }
    });

    const deliveryConfig: ProductDeliveryConfig | undefined = hasCustomDelivery ? {
      deliveryType,
      minDeliveryTime: Number(minDeliveryTime) > 0 ? Number(minDeliveryTime) : 1,
      maxDeliveryTime: Number(maxDeliveryTime) >= Number(minDeliveryTime) ? Number(maxDeliveryTime) : Number(minDeliveryTime),
      deliveryTimeUnit,
      customDeliveryTimeLabel: customDeliveryTimeLabel.trim() || 'Estimated Delivery:',
      customDeliveryMessage: customDeliveryMessage.trim() || undefined,
      customMessageLabel: customMessageLabel.trim() || 'Delivery Info:',
      deliveryFeeType,
      deliveryFeeAmount: deliveryFeeType === 'fixed' ? Number(deliveryFeeAmount) : undefined,
      deliveryFeeCustomText: deliveryFeeType === 'custom' ? deliveryFeeCustomText.trim() : undefined,
      deliveryFeeLabel: deliveryFeeLabel.trim() || 'Delivery Fee:',
      deliveryAreaText: deliveryAreaText.trim() || undefined,
      deliveryNote: deliveryNote.trim() || undefined,
      hideDeliveryInfo
    } : undefined;

    const numRegularPrice = parseNumericPrice(formData.price);
    const numSalePrice = parseNumericPrice(salePrice);
    const isSaleValid = saleEnabled && numRegularPrice > 0 && numSalePrice > 0 && numSalePrice < numRegularPrice;

    const saleConfigObj: ProductSaleConfig | undefined = saleEnabled ? {
      saleEnabled: true,
      salePrice: salePrice.trim() || undefined,
      saleStartDate: saleStartDate.trim() || undefined,
      saleEndDate: saleEndDate.trim() || undefined,
      saleLabel: saleLabel.trim() || 'SALE',
      saleBadgeColor: saleBadgeColor || 'red',
      saleMessage: saleMessage.trim() || undefined,
      showCountdown: showSaleCountdown,
      showDiscountPercentage: showDiscountPercentage,
      showSavings: showSavingsAmount,
      showRegularPriceStrike: true
    } : undefined;

    const finalProduct: Product = {
      id: formData.id || `prod-${Date.now()}`,
      name: formData.name,
      category: formData.category || 'Sanitaryware',
      categoryId: formData.categoryId || categories[0]?.id || 'bathroom-accessories',
      image: mainImg,
      images: uploadedImages,
      description: formData.description || 'Premium building material and sanitaryware.',
      price: formData.isPriceOnRequest ? 'Price on Request' : (formData.price || 'Call for Price'),
      salePrice: saleEnabled && salePrice ? salePrice.trim() : undefined,
      saleEnabled: Boolean(saleEnabled),
      saleStartDate: saleEnabled && saleStartDate ? saleStartDate.trim() : undefined,
      saleEndDate: saleEnabled && saleEndDate ? saleEndDate.trim() : undefined,
      saleLabel: saleEnabled && saleLabel ? saleLabel.trim() : undefined,
      saleBadgeColor: saleEnabled && saleBadgeColor ? saleBadgeColor : undefined,
      saleMessage: saleEnabled && saleMessage ? saleMessage.trim() : undefined,
      showSaleCountdown: showSaleCountdown,
      showDiscountPercentage: showDiscountPercentage,
      showSavingsAmount: showSavingsAmount,
      saleConfig: saleConfigObj,
      features: parsedFeatures.length > 0 ? parsedFeatures : ['100% Genuine', 'Warranty Covered'],
      specs: specsObj,
      availableColors: parsedColors.length > 0 ? parsedColors : undefined,
      availableSizes: parsedSizes.length > 0 ? parsedSizes : undefined,
      availableMaterials: parsedMaterials.length > 0 ? parsedMaterials : undefined,
      badge: formData.badge,
      brand: formData.brand || 'Master',
      brandId: formData.brandId || 'master',
      stockStatus: formData.stockStatus || 'In Stock',
      stockQuantity: formData.stockQuantity,
      hideStockBadge: formData.hideStockBadge || false,
      isPriceOnRequest: formData.isPriceOnRequest || false,
      hidePrice: formData.hidePrice || false,
      isFeatured: formData.isFeatured !== false,
      isNew: formData.isNew,
      rating: typeof formData.rating === 'number' ? formData.rating : (formData.rating ? parseFloat(String(formData.rating)) : 4.8),
      reviewsCount: typeof formData.reviewsCount === 'number' ? formData.reviewsCount : 12,
      reviews_count: typeof formData.reviewsCount === 'number' ? formData.reviewsCount : 12,
      videos: formData.videos || [],
      deliveryConfig: deliveryConfig
    };

    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onSave(finalProduct);
    } catch (err: any) {
      console.error('Error saving product in modal:', err);
      setErrorMsg(formatSupabaseError(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex justify-center items-start sm:items-center p-3 sm:p-6 animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full my-auto overflow-hidden shadow-2xl relative p-6 sm:p-8 max-h-[92vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Admin Product & Availability Control</span>
          <h3 className="text-2xl font-bold text-white font-serif">
            {product ? 'Edit Product Content' : 'Add New Product to Store'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-1 min-h-0">
          
          {/* Product Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Hansgrohe Thermostatic Rain Shower"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand / Manufacturer *</label>
              {brands && brands.length > 0 ? (
                <select
                  value={formData.brandId || ''}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                  <option value="custom">Other / Custom Brand</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.brand || ''}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g., Kohler / Grohe / Master"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Price / Wholesale Rate</label>
              <input
                type="text"
                disabled={formData.isPriceOnRequest}
                value={formData.isPriceOnRequest ? 'Price on Request' : (formData.price || '')}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g., PKR 45,000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Rating & Review Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Customer Rating (1.0 – 5.0)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={formData.rating ?? 4.8}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 4.8 })}
                placeholder="4.8"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Verified Reviews Count
              </label>
              <input
                type="number"
                min="0"
                value={formData.reviewsCount ?? 12}
                onChange={(e) => setFormData({ ...formData, reviewsCount: parseInt(e.target.value, 10) || 0 })}
                placeholder="12"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* 🔥 PRODUCT SALE & DISCOUNT PRICING SYSTEM (OPTIONAL PER PRODUCT) */}
          {(() => {
            const regNum = parseNumericPrice(formData.price);
            const saleNum = parseNumericPrice(salePrice);
            const liveDiscountPercent = calculateDiscountPercentage(regNum, saleNum);
            const liveSavings = calculateSavingsAmount(regNum, saleNum);
            const isSalePriceTooHigh = saleEnabled && salePrice && regNum > 0 && saleNum >= regNum;

            return (
              <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 space-y-4 ${
                saleEnabled 
                  ? 'bg-gradient-to-b from-rose-950/40 via-slate-900 to-slate-950 border-rose-500/50 shadow-xl shadow-rose-950/20' 
                  : 'bg-slate-950/70 border-slate-800'
              }`}>
                {/* Header with Enable Switch */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`p-2 rounded-xl border transition-colors ${
                      saleEnabled 
                        ? 'bg-rose-600 text-white border-rose-400 shadow-md shadow-rose-600/30' 
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}>
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Sale & Discount Pricing
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          saleEnabled 
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' 
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}>
                          {saleEnabled ? 'ACTIVE / ON' : 'DISABLED / OFF'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {saleEnabled 
                          ? 'Sale pricing and badges will be displayed for this specific product.' 
                          : 'Normal product pricing is active. Enable below to set a discounted sale price.'}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={saleEnabled}
                      onChange={(e) => setSaleEnabled(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-600"></div>
                  </label>
                </div>

                {/* Expanded Sale Options (Only when Sale Enabled = ON) */}
                {saleEnabled && (
                  <div className="pt-3 border-t border-rose-500/20 space-y-4 animate-fadeIn">
                    
                    {/* Price Inputs & Live Discount Calculation */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Regular / Base Price (PKR)
                        </label>
                        <input
                          type="text"
                          value={formData.price || ''}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          placeholder="e.g. 10,000"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 font-mono"
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          Current regular price: {regNum > 0 ? formatPakistaniPrice(regNum) : 'Not specified'}
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-rose-300 mb-1 flex items-center justify-between">
                          <span>Sale Price / Discounted Rate (PKR) *</span>
                          {liveDiscountPercent > 0 && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-black text-[10px] font-mono animate-pulse">
                              {liveDiscountPercent}% OFF
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          required={saleEnabled}
                          value={salePrice}
                          onChange={(e) => setSalePrice(e.target.value)}
                          placeholder="e.g. 7,500"
                          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-rose-500/50 text-xs text-rose-200 placeholder-slate-600 focus:outline-none focus:border-rose-400 font-mono font-bold"
                        />
                        <span className="text-[10px] text-rose-400/80 mt-0.5 block">
                          Customer will pay: {saleNum > 0 ? formatPakistaniPrice(saleNum) : 'Enter sale price'}
                        </span>
                      </div>
                    </div>

                    {/* Auto-Calculated Discount & Savings Live Card */}
                    {regNum > 0 && saleNum > 0 && !isSalePriceTooHigh && (
                      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-emerald-500/30 flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                            <Percent className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-slate-400 block">Automatic Discount Calculation</span>
                            <div className="flex items-baseline gap-2">
                              <span className="text-sm font-extrabold text-emerald-400 font-mono">
                                {liveDiscountPercent}% OFF
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                (~~{formatPakistaniPrice(regNum)}~~ → <strong className="text-white">{formatPakistaniPrice(saleNum)}</strong>)
                              </span>
                            </div>
                          </div>
                        </div>

                        {liveSavings > 0 && (
                          <div className="text-right">
                            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Customer Savings</span>
                            <span className="text-xs font-black text-amber-300 font-mono">
                              🎉 {formatPakistaniPrice(liveSavings)}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Warning if Sale Price >= Regular Price */}
                    {isSalePriceTooHigh && (
                      <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-500/40 text-amber-300 text-xs flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-bold block">Invalid Sale Price</strong>
                          Sale price ({formatPakistaniPrice(saleNum)}) must be strictly less than the regular price ({formatPakistaniPrice(regNum)}) for discount calculations to activate.
                        </div>
                      </div>
                    )}

                    {/* Sale Schedule Dates (Optional Countdown Timer) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-400" />
                          <span>Sale Start Date (Optional)</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={saleStartDate}
                          onChange={(e) => setSaleStartDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Leave empty to start sale immediately</span>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                          <Timer className="w-3.5 h-3.5 text-rose-400" />
                          <span>Sale End Date & Time (Optional Countdown)</span>
                        </label>
                        <input
                          type="datetime-local"
                          value={saleEndDate}
                          onChange={(e) => setSaleEndDate(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">Triggers dynamic live countdown timer</span>
                      </div>
                    </div>

                    {/* Sale Badge Label & Color Selector */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Sale Badge Label
                        </label>
                        <input
                          type="text"
                          value={saleLabel}
                          onChange={(e) => setSaleLabel(e.target.value)}
                          placeholder="e.g. SALE, HOT DEAL, RAMADAN OFFER"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500 uppercase tracking-wider font-bold"
                        />
                        {/* Quick Presets */}
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {['SALE', 'HOT DEAL', 'RAMADAN OFFER', 'SPECIAL OFFER', 'LIMITED TIME', 'CLEARANCE', 'EID SPECIAL'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setSaleLabel(preset)}
                              className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors ${
                                saleLabel === preset 
                                  ? 'bg-rose-600 text-white' 
                                  : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                              }`}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 mb-1">
                          Badge Color Theme
                        </label>
                        <select
                          value={saleBadgeColor}
                          onChange={(e) => setSaleBadgeColor(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-rose-500"
                        >
                          <option value="red">Ruby Red (Classic Sale)</option>
                          <option value="emerald">Emerald Green (Spring / Festive)</option>
                          <option value="amber">Amber Gold (Luxury / Ramadan)</option>
                          <option value="blue">Cobalt Blue (Corporate Offer)</option>
                          <option value="purple">Royal Purple (VIP Deal)</option>
                          <option value="cyan">Electric Cyan (Flash Promo)</option>
                        </select>
                      </div>
                    </div>

                    {/* Promotional Sale Message */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Promotional Sale Message (Optional)
                      </label>
                      <input
                        type="text"
                        value={saleMessage}
                        onChange={(e) => setSaleMessage(e.target.value)}
                        placeholder="e.g. Ramadan Special: Save Rs. 2,500 today with nationwide fast delivery!"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-rose-500"
                      />
                    </div>

                    {/* Sale Display Checkboxes */}
                    <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                      <span className="text-[11px] font-bold text-slate-300 block">Frontend Display Options:</span>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={showDiscountPercentage}
                            onChange={(e) => setShowDiscountPercentage(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-800"
                          />
                          <span>Show Discount % Pill</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={showSavingsAmount}
                            onChange={(e) => setShowSavingsAmount(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-800"
                          />
                          <span>Show Savings Callout</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                          <input
                            type="checkbox"
                            checked={showSaleCountdown}
                            onChange={(e) => setShowSaleCountdown(e.target.checked)}
                            className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 bg-slate-900 border-slate-800"
                          />
                          <span>Show Live Countdown</span>
                        </label>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            );
          })()}

          {/* AVAILABILITY SYSTEM CONTROLS */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-blue-900/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Product Availability & Price Controls</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Availability Status</label>
                <select
                  value={formData.stockStatus || 'In Stock'}
                  onChange={(e) => setFormData({ ...formData, stockStatus: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="In Stock">In Stock (Green Badge)</option>
                  <option value="Limited Stock">Limited Stock (Amber Badge)</option>
                  <option value="Out of Stock">Out of Stock (Red Badge)</option>
                  <option value="Coming Soon">Coming Soon (Purple Badge)</option>
                  <option value="Available on Order">Available on Order (Cyan Badge)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Quantity (Optional)</label>
                <input
                  type="number"
                  value={formData.stockQuantity || ''}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || undefined })}
                  placeholder="e.g., 25"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isPriceOnRequest || false}
                  onChange={(e) => setFormData({ ...formData, isPriceOnRequest: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-800"
                />
                <span>Set "Price on Request"</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.hidePrice || false}
                  onChange={(e) => setFormData({ ...formData, hidePrice: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-800"
                />
                <span>Hide Price Tag Entirely</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.hideStockBadge || false}
                  onChange={(e) => setFormData({ ...formData, hideStockBadge: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-800"
                />
                <span>Hide Availability Badge</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isFeatured !== false}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-800"
                />
                <span>Featured Product</span>
              </label>
            </div>
          </div>

          {/* Device Image Upload */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <MultiImageUploader
              label="Device Image Upload (Drag & Drop or Browse File)"
              images={uploadedImages}
              onChange={(newImgs) => {
                setUploadedImages(newImgs);
                if (newImgs.length > 0) {
                  setFormData(prev => ({ ...prev, image: newImgs[0] }));
                }
              }}
              maxFiles={5}
            />
          </div>

          {/* Badge Tag */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Badge Tag</label>
            <select
              value={formData.badge || 'LUXURY'}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="LUXURY">LUXURY</option>
              <option value="NEW">NEW</option>
              <option value="BESTSELLER">BESTSELLER</option>
              <option value="PREMIUM GRADE">PREMIUM GRADE</option>
              <option value="IMPACT RESISTANT">IMPACT RESISTANT</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Product Description</label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of features, materials, and benefits..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Key Features (Line Separated) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Key Features & Benefits (One feature per line)
            </label>
            <textarea
              rows={3}
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              placeholder="e.g.&#10;10 Year Official Warranty&#10;Solid Brass Anti-Corrosion Body&#10;Thermostatic Temperature Control"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Specifications (Dynamic Key-Value Pair Editor) */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-blue-300">
              Technical Specifications (Key & Value Pairs)
            </label>
            
            <div className="space-y-2">
              {specPairs.map((pair, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pair.key}
                    onChange={(e) => {
                      const updated = [...specPairs];
                      updated[idx].key = e.target.value;
                      setSpecPairs(updated);
                    }}
                    placeholder="Spec Name (e.g. Material)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={pair.value}
                    onChange={(e) => {
                      const updated = [...specPairs];
                      updated[idx].value = e.target.value;
                      setSpecPairs(updated);
                    }}
                    placeholder="Value (e.g. Solid Brass)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecPair(idx)}
                    className="p-1.5 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 hover:text-white"
                    title="Remove Spec"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Spec Row */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newSpecKey}
                onChange={(e) => setNewSpecKey(e.target.value)}
                placeholder="New Spec Name (e.g. Warranty)"
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
              />
              <input
                type="text"
                value={newSpecVal}
                onChange={(e) => setNewSpecVal(e.target.value)}
                placeholder="New Spec Value (e.g. 10 Years)"
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
              />
              <button
                type="button"
                onClick={handleAddSpecPair}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Available Variants: Colors, Sizes, Materials */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Available Colors (Comma separated)
              </label>
              <input
                type="text"
                value={colorsInput}
                onChange={(e) => setColorsInput(e.target.value)}
                placeholder="Chrome, Matte Black, Rose Gold"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Available Sizes (Comma separated)
              </label>
              <input
                type="text"
                value={sizesInput}
                onChange={(e) => setSizesInput(e.target.value)}
                placeholder="1/2 Inch, 3/4 Inch, 60x60cm"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Materials (Comma separated)
              </label>
              <input
                type="text"
                value={materialsInput}
                onChange={(e) => setMaterialsInput(e.target.value)}
                placeholder="Brass, Porcelain, CPVC, Acrylic"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Video Uploader Section */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <VideoUploader
              videos={formData.videos || []}
              onChange={(updatedVideos) => setFormData(prev => ({ ...prev, videos: updatedVideos }))}
            />
          </div>

          {/* Product Delivery Information Section */}
          <div className="p-5 rounded-2xl bg-slate-950/90 border border-amber-500/20 shadow-lg space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Delivery Information
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 font-semibold border border-amber-500/20">
                      Product-Specific Override
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Configure standard days, custom English notes, fees, or inherit global settings
                  </p>
                </div>
              </div>

              {/* Toggle Custom vs Global */}
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setHasCustomDelivery(!hasCustomDelivery)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                    hasCustomDelivery
                      ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {hasCustomDelivery ? '⚡ Custom Delivery Active' : '🌐 Using Global Store Rules'}
                </button>
              </div>
            </div>

            {!hasCustomDelivery ? (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                <p>
                  This product currently inherits the <strong className="text-slate-200">Global Delivery Settings & City Rules</strong> configured in the Delivery Manager. Click <strong>"Using Global Store Rules"</strong> above to customize delivery times, custom messages, or special shipping fees specifically for this item.
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-1 animate-fadeIn">
                {/* Delivery Type Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Delivery Display Format
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('standard')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                        deliveryType === 'standard'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      ⏱️ Standard (Numeric)
                      <span className="block text-[10px] font-normal text-slate-400 mt-0.5">e.g. 3–5 Days</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('custom')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                        deliveryType === 'custom'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      ✍️ Custom Text
                      <span className="block text-[10px] font-normal text-slate-400 mt-0.5">e.g. Price on Call / Free</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('both')}
                      className={`p-2.5 rounded-xl text-xs font-bold border transition-all text-center ${
                        deliveryType === 'both'
                          ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      ✨ Both (Number + Text)
                      <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Days + Special Note</span>
                    </button>
                  </div>
                </div>

                {/* Numeric Settings (Standard or Both) */}
                {(deliveryType === 'standard' || deliveryType === 'both') && (
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                    <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Delivery Duration & Time Range
                    </h5>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Minimum Time
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="90"
                          value={minDeliveryTime}
                          onChange={(e) => setMinDeliveryTime(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Maximum Time
                        </label>
                        <input
                          type="number"
                          min={minDeliveryTime}
                          max="120"
                          value={maxDeliveryTime}
                          onChange={(e) => setMaxDeliveryTime(Math.max(minDeliveryTime, parseInt(e.target.value) || minDeliveryTime))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Time Unit
                        </label>
                        <select
                          value={deliveryTimeUnit}
                          onChange={(e) => setDeliveryTimeUnit(e.target.value as any)}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                        >
                          <option value="Days">Days</option>
                          <option value="Hours">Hours</option>
                          <option value="Working Days">Working Days</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Custom Time Label (Optional)
                      </label>
                      <input
                        type="text"
                        value={customDeliveryTimeLabel}
                        onChange={(e) => setCustomDeliveryTimeLabel(e.target.value)}
                        placeholder="Estimated Delivery:"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {/* Custom Text Settings (Custom or Both) */}
                {(deliveryType === 'custom' || deliveryType === 'both') && (
                  <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                    <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Custom Delivery Message & English Notes
                    </h5>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-slate-300">
                          Custom Delivery Text / Message
                        </label>
                        <span className="text-[10px] text-slate-400">Supports normal English sentences</span>
                      </div>
                      <textarea
                        rows={2}
                        value={customDeliveryMessage}
                        onChange={(e) => setCustomDeliveryMessage(e.target.value)}
                        placeholder="e.g. Delivery charges depend on your location. Contact us before ordering."
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />

                      {/* Quick Presets for Admin Convenience */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        <span className="text-[10px] text-slate-400 font-semibold self-center mr-1">Quick Presets:</span>
                        {[
                          'Price on Call',
                          'Delivery Available — Contact Us',
                          'Delivery charges depend on location and quantity.',
                          'Free delivery available in Chiniot on selected orders.',
                          'Delivery available across Punjab.',
                          'Contact us for exact delivery timing.'
                        ].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setCustomDeliveryMessage(preset)}
                            className="px-2 py-0.5 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors border border-slate-700"
                          >
                            + {preset.length > 25 ? preset.substring(0, 25) + '...' : preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Custom Message Label (Optional)
                      </label>
                      <input
                        type="text"
                        value={customMessageLabel}
                        onChange={(e) => setCustomMessageLabel(e.target.value)}
                        placeholder="Delivery Info:"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  </div>
                )}

                {/* Delivery Fee Section */}
                <div className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3">
                  <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    Delivery Fee Configuration
                  </h5>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-300 mb-1">
                        Fee Type
                      </label>
                      <select
                        value={deliveryFeeType}
                        onChange={(e) => setDeliveryFeeType(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                      >
                        <option value="free">🎉 Free Delivery</option>
                        <option value="fixed">💰 Fixed Amount (PKR)</option>
                        <option value="contact">📞 Contact Us for Charges / Price</option>
                        <option value="custom">✍️ Custom Text Message</option>
                      </select>
                    </div>

                    {deliveryFeeType === 'fixed' && (
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Fixed Fee Amount (PKR)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={deliveryFeeAmount}
                          onChange={(e) => setDeliveryFeeAmount(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}

                    {deliveryFeeType === 'custom' && (
                      <div>
                        <label className="block text-[11px] font-medium text-slate-300 mb-1">
                          Custom Fee Text
                        </label>
                        <input
                          type="text"
                          value={deliveryFeeCustomText}
                          onChange={(e) => setDeliveryFeeCustomText(e.target.value)}
                          placeholder="e.g. Calculated based on distance & weight"
                          className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Delivery Notes & Area */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Delivery Coverage / Area (Optional)
                    </label>
                    <input
                      type="text"
                      value={deliveryAreaText}
                      onChange={(e) => setDeliveryAreaText(e.target.value)}
                      placeholder="e.g. Chiniot, Faisalabad, Lahore & Major Cities"
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Special Delivery Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={deliveryNote}
                      onChange={(e) => setDeliveryNote(e.target.value)}
                      placeholder="e.g. Delivery time may vary for heavy freight."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Hide Delivery Option */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="hideDeliveryCheck"
                    checked={hideDeliveryInfo}
                    onChange={(e) => setHideDeliveryInfo(e.target.checked)}
                    className="rounded border-slate-700 text-amber-500 focus:ring-amber-500 bg-slate-950"
                  />
                  <label htmlFor="hideDeliveryCheck" className="text-xs text-slate-300 cursor-pointer">
                    Hide delivery information block entirely for this product
                  </label>
                </div>

                {/* LIVE PREVIEW BOX */}
                <div className="mt-2 p-3 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 border border-amber-500/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Live Customer View Preview
                    </span>
                    <span className="text-[10px] text-slate-400">As shown on product page</span>
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-200">
                    {(deliveryType === 'standard' || deliveryType === 'both') && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium">{customDeliveryTimeLabel || 'Estimated Delivery:'}</span>
                        <span className="font-bold text-amber-400">
                          {minDeliveryTime === maxDeliveryTime ? `${minDeliveryTime} ${deliveryTimeUnit}` : `${minDeliveryTime}–${maxDeliveryTime} ${deliveryTimeUnit}`}
                        </span>
                      </div>
                    )}

                    {(deliveryType === 'custom' || deliveryType === 'both') && customDeliveryMessage && (
                      <div className="flex items-start gap-2">
                        <span className="text-slate-400 font-medium shrink-0">{customMessageLabel || 'Delivery Info:'}</span>
                        <span className="text-slate-200 font-medium">{customDeliveryMessage}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">{deliveryFeeLabel || 'Delivery Fee:'}</span>
                      <span className="font-bold text-emerald-400">
                        {deliveryFeeType === 'free' && 'Free Delivery'}
                        {deliveryFeeType === 'fixed' && `Rs. ${deliveryFeeAmount.toLocaleString()}`}
                        {deliveryFeeType === 'contact' && 'Contact Us'}
                        {deliveryFeeType === 'custom' && (deliveryFeeCustomText || 'Custom Charges')}
                      </span>
                    </div>

                    {deliveryAreaText && (
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium">Coverage:</span>
                        <span className="text-slate-300">{deliveryAreaText}</span>
                      </div>
                    )}

                    {deliveryNote && (
                      <div className="text-[11px] text-slate-400 italic">
                        Note: {deliveryNote}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            {product && onDelete ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  if (confirm('Are you sure you want to delete this product?')) {
                    onDelete(product.id);
                    onClose();
                  }
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Product</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Product</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
