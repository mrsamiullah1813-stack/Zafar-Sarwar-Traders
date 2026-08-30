import React, { useState, useEffect, useMemo } from 'react';
import { X, Check, Trash2, Video, Image as ImageIcon, Sparkles, Tag, ShieldCheck, Layers, Star, Truck, Clock, MapPin, Info, DollarSign, MessageSquare, AlertCircle, Flame, Percent, Calendar, Timer, Boxes, Plus, Copy, ArrowUp, ArrowDown, Settings2, Sliders, CheckCircle2, Eye, Palette } from 'lucide-react';
import { Product, ProductVideo, ProductCategory, ProductBrand, ProductDeliveryConfig, ProductSaleConfig, ProductVariant, ProductVariantsConfig, PaintShade, PaintShadesConfig, ProductQuantityConfig } from '../types';
import { VideoUploader } from './VideoUploader';
import { MultiImageUploader } from './MultiImageUploader';
import { AdminPaintShadesManager } from './AdminPaintShadesManager';
import { formatSupabaseError } from '../services/supabaseService';
import { parseNumericPrice, calculateDiscountPercentage, calculateSavingsAmount, formatPakistaniPrice } from '../utils/pricingUtils';
import { isPaintCategory, isPaintProduct } from '../utils/paintShadeUtils';

interface AdminProductModalProps {
  product: Product | null; // null for creating new product
  categories: ProductCategory[];
  brands?: ProductBrand[];
  allProducts?: Product[];
  onSave: (product: Product) => Promise<void> | void;
  onDelete?: (productId: string) => void;
  onClose: () => void;
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  product,
  categories,
  brands = [],
  allProducts = [],
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
  const [deliveryFeeAmount, setDeliveryFeeAmount] = useState<number>(0);
  const [deliveryFeeCustomText, setDeliveryFeeCustomText] = useState<string>('');
  const [deliveryFeeLabel, setDeliveryFeeLabel] = useState<string>('Contact for Delivery');
  const [deliveryAreaText, setDeliveryAreaText] = useState<string>('');
  const [deliveryNote, setDeliveryNote] = useState<string>('Contact for further details.');
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

  // Variant / Size / Capacity Dynamic Pricing states
  const [variantsEnabled, setVariantsEnabled] = useState<boolean>(false);
  const [optionName, setOptionName] = useState<string>('Capacity');
  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);
  const [activeVariantTab, setActiveVariantTab] = useState<'editor' | 'preview'>('editor');

  // Quantity & Bulk Order states (Admin controlled per product)
  const [quantityEnabled, setQuantityEnabled] = useState<boolean>(false);
  const [minQuantity, setMinQuantity] = useState<number>(1);
  const [maxQuantity, setMaxQuantity] = useState<number | undefined>(undefined);
  const [defaultQuantity, setDefaultQuantity] = useState<number>(1);
  const [quantityStep, setQuantityStep] = useState<number>(1);
  const [unitLabel, setUnitLabel] = useState<string>('Pcs');
  const [previewQty, setPreviewQty] = useState<number>(1);

  // Paint-Specific Shade / Color System states (Only for Paint products)
  const [shadesEnabled, setShadesEnabled] = useState<boolean>(false);
  const [shadesTitle, setShadesTitle] = useState<string>('Choose Shade');
  const [shadeSheetUrl, setShadeSheetUrl] = useState<string>('');
  const [shadesList, setShadesList] = useState<PaintShade[]>([]);

  // Dynamically detect if current selected category is a Paint product
  const isPaintItem = useMemo(() => {
    const selectedCat = categories.find(c => c.id === formData.categoryId);
    return isPaintCategory(formData.category || selectedCat?.name, formData.categoryId, selectedCat?.group) || isPaintProduct(product, categories);
  }, [formData.categoryId, formData.category, categories, product]);

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

      // Populate variant states
      const isProductVariantsOn = Boolean(product.variantsEnabled || product.variantsConfig?.variantsEnabled);
      setVariantsEnabled(isProductVariantsOn);
      setOptionName(product.optionName || product.variantsConfig?.optionName || 'Capacity');
      const loadedVariants = product.variantsList || product.variantsConfig?.variants || [];
      setVariantsList(Array.isArray(loadedVariants) ? loadedVariants : []);

      // Populate quantity states
      const isProductQtyOn = Boolean(product.quantityEnabled || product.quantityConfig?.quantityEnabled);
      setQuantityEnabled(isProductQtyOn);
      const initialMinQty = Number(product.minQuantity ?? product.quantityConfig?.minQuantity ?? 1);
      setMinQuantity(initialMinQty > 0 ? initialMinQty : 1);
      const initialMaxQty = product.maxQuantity ?? product.quantityConfig?.maxQuantity;
      setMaxQuantity(typeof initialMaxQty === 'number' && initialMaxQty > 0 ? initialMaxQty : undefined);
      const initialDefQty = Number(product.defaultQuantity ?? product.quantityConfig?.defaultQuantity ?? 1);
      setDefaultQuantity(initialDefQty > 0 ? initialDefQty : 1);
      setPreviewQty(initialDefQty > 0 ? initialDefQty : 1);
      const initialStep = Number(product.quantityStep ?? product.quantityConfig?.quantityStep ?? 1);
      setQuantityStep(initialStep > 0 ? initialStep : 1);
      setUnitLabel(product.unitLabel || product.quantityConfig?.unitLabel || 'Pcs');

      // Populate paint shades states
      const isProductShadesOn = Boolean(product.shadesEnabled || product.paintShadesConfig?.shadesEnabled);
      setShadesEnabled(isProductShadesOn);
      setShadesTitle(product.shadesTitle || product.paintShadesConfig?.shadesTitle || 'Choose Shade');
      setShadeSheetUrl(product.shadeSheetUrl || product.paintShadesConfig?.shadeSheetUrl || '');
      const loadedShades = product.shadesList || product.paintShadesConfig?.shades || [];
      setShadesList(Array.isArray(loadedShades) ? loadedShades : []);

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
        setDeliveryFeeAmount(0);
        setDeliveryFeeCustomText('');
        setDeliveryFeeLabel('Contact for Delivery');
        setDeliveryAreaText('');
        setDeliveryNote('Contact for further details.');
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
      setVariantsEnabled(false);
      setOptionName('Capacity');
      setVariantsList([]);
      setQuantityEnabled(false);
      setMinQuantity(1);
      setMaxQuantity(undefined);
      setDefaultQuantity(1);
      setQuantityStep(1);
      setUnitLabel('Pcs');
      setPreviewQty(1);
      setShadesEnabled(false);
      setShadesTitle('Select Paint Shade / Color');
      setShadesList([]);
      setHasCustomDelivery(false);
      setDeliveryType('standard');
      setMinDeliveryTime(3);
      setMaxDeliveryTime(5);
      setDeliveryTimeUnit('Days');
      setCustomDeliveryTimeLabel('Estimated Delivery:');
      setCustomDeliveryMessage('');
      setCustomMessageLabel('Delivery Info:');
      setDeliveryFeeType('contact');
      setDeliveryFeeAmount(0);
      setDeliveryFeeCustomText('');
      setDeliveryFeeLabel('Contact for Delivery');
      setDeliveryAreaText('');
      setDeliveryNote('Contact for further details.');
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

  // Variant Helpers
  const handleAddVariant = () => {
    const newIdx = variantsList.length;
    const newVar: ProductVariant = {
      id: `var-${Date.now()}-${newIdx}`,
      name: `Size / Option ${newIdx + 1}`,
      sku: formData.sku ? `${formData.sku}-V${newIdx + 1}` : undefined,
      price: formData.price && formData.price !== 'PKR Call for Price' ? String(formData.price) : '5000',
      saleEnabled: false,
      salePrice: undefined,
      stockQuantity: 10,
      stockStatus: 'In Stock',
      isActive: true,
      isDefault: variantsList.length === 0,
      displayOrder: newIdx
    };
    setVariantsList(prev => [...prev, newVar]);
  };

  const handleUpdateVariant = (index: number, field: keyof ProductVariant, value: any) => {
    setVariantsList(prev => {
      const copy = [...prev];
      if (!copy[index]) return prev;
      
      if (field === 'isDefault' && value === true) {
        // Only one default variant allowed
        return copy.map((v, i) => ({
          ...v,
          isDefault: i === index
        }));
      }

      copy[index] = {
        ...copy[index],
        [field]: value
      };
      return copy;
    });
  };

  const handleRemoveVariant = (index: number) => {
    setVariantsList(prev => {
      const filtered = prev.filter((_, i) => i !== index);
      // Ensure at least one is default if any left
      if (filtered.length > 0 && !filtered.some(v => v.isDefault)) {
        filtered[0].isDefault = true;
      }
      return filtered.map((v, i) => ({ ...v, displayOrder: i }));
    });
  };

  const handleDuplicateVariant = (index: number) => {
    const target = variantsList[index];
    if (!target) return;
    const dup: ProductVariant = {
      ...target,
      id: `var-${Date.now()}-${variantsList.length}`,
      name: `${target.name} (Copy)`,
      sku: target.sku ? `${target.sku}-COPY` : undefined,
      isDefault: false,
      displayOrder: variantsList.length
    };
    setVariantsList(prev => [...prev, dup]);
  };

  const [selectedCopyProductId, setSelectedCopyProductId] = useState<string>('');
  const [quickSizeNameInput, setQuickSizeNameInput] = useState<string>('');
  const [quickSizePriceInput, setQuickSizePriceInput] = useState<string>('250');

  // Copy Sizes From Another Product (creates completely independent deep copy)
  const handleCopySizesFromOtherProduct = () => {
    if (!selectedCopyProductId) return;
    const sourceProd = allProducts.find(p => p.id === selectedCopyProductId);
    if (!sourceProd) return;

    if (sourceProd.variantsList && sourceProd.variantsList.length > 0) {
      const cloned = sourceProd.variantsList.map((v, i) => ({
        ...v,
        id: `var-${Date.now()}-${i + 1}`,
        isActive: v.isActive !== false,
        isDefault: i === 0,
        displayOrder: i
      }));
      setVariantsList(cloned);
      if (sourceProd.optionName) {
        setOptionName(sourceProd.optionName);
      }
      setVariantsEnabled(true);
    } else if (sourceProd.availableSizes && sourceProd.availableSizes.length > 0) {
      const baseNum = parseNumericPrice(sourceProd.price) || 250;
      const cloned: ProductVariant[] = sourceProd.availableSizes.map((sz, i) => ({
        id: `var-${Date.now()}-${i + 1}`,
        name: sz,
        price: String(baseNum + (i * 120)),
        isActive: true,
        isDefault: i === 0,
        displayOrder: i,
        stockStatus: 'In Stock',
        stockQuantity: 50
      }));
      setVariantsList(cloned);
      setOptionName('Size');
      setVariantsEnabled(true);
    }
  };

  // Quick single size badge adder
  const handleQuickAddSizeBadge = (sizeLabel: string, defaultPriceNum: number = 250) => {
    const exists = variantsList.some(v => v.name.toLowerCase().trim() === sizeLabel.toLowerCase().trim());
    if (exists) return;
    const newVariant: ProductVariant = {
      id: `var-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: sizeLabel,
      price: String(defaultPriceNum),
      isActive: true,
      isDefault: variantsList.length === 0,
      displayOrder: variantsList.length,
      stockStatus: 'In Stock',
      stockQuantity: 100
    };
    setVariantsList(prev => [...prev, newVariant]);
    setVariantsEnabled(true);
  };

  // Quick custom size add from input
  const handleQuickAddCustomSize = () => {
    if (!quickSizeNameInput.trim()) return;
    const numPrice = parseNumericPrice(quickSizePriceInput) || 250;
    handleQuickAddSizeBadge(quickSizeNameInput.trim(), numPrice);
    setQuickSizeNameInput('');
  };

  const handleMoveVariant = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === variantsList.length - 1) return;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    setVariantsList(prev => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy.map((v, i) => ({ ...v, displayOrder: i }));
    });
  };

  const handleApplyPreset = (presetKey: string) => {
    let opt = 'Capacity';
    let list: ProductVariant[] = [];

    if (presetKey === 'water-tank') {
      opt = 'Capacity';
      list = [
        { id: `wt-100-${Date.now()}`, name: '100 Liters', sku: 'WT-100L', price: '8500', saleEnabled: false, stockQuantity: 20, stockStatus: 'In Stock', isActive: true, isDefault: true, displayOrder: 0 },
        { id: `wt-200-${Date.now()}`, name: '200 Liters', sku: 'WT-200L', price: '15000', saleEnabled: true, salePrice: '13800', stockQuantity: 15, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 1 },
        { id: `wt-300-${Date.now()}`, name: '300 Liters', sku: 'WT-300L', price: '21500', saleEnabled: false, stockQuantity: 12, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 2 },
        { id: `wt-500-${Date.now()}`, name: '500 Liters', sku: 'WT-500L', price: '34000', saleEnabled: true, salePrice: '31500', stockQuantity: 8, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 3 },
        { id: `wt-1000-${Date.now()}`, name: '1000 Liters', sku: 'WT-1000L', price: '62000', saleEnabled: false, stockQuantity: 5, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 4 },
      ];
    } else if (presetKey === 'pipe-size') {
      opt = 'Diameter / Size';
      list = [
        { id: `p-half-${Date.now()}`, name: '1/2 Inch (20mm)', sku: 'PP-050', price: '450', saleEnabled: false, stockQuantity: 200, stockStatus: 'In Stock', isActive: true, isDefault: true, displayOrder: 0 },
        { id: `p-34-${Date.now()}`, name: '3/4 Inch (25mm)', sku: 'PP-075', price: '680', saleEnabled: false, stockQuantity: 150, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 1 },
        { id: `p-1-${Date.now()}`, name: '1 Inch (32mm)', sku: 'PP-100', price: '980', saleEnabled: false, stockQuantity: 100, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 2 },
        { id: `p-125-${Date.now()}`, name: '1-1/4 Inch (40mm)', sku: 'PP-125', price: '1450', saleEnabled: false, stockQuantity: 60, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 3 },
        { id: `p-150-${Date.now()}`, name: '1-1/2 Inch (50mm)', sku: 'PP-150', price: '1850', saleEnabled: false, stockQuantity: 50, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 4 },
        { id: `p-2-${Date.now()}`, name: '2 Inch (63mm)', sku: 'PP-200', price: '2400', saleEnabled: false, stockQuantity: 40, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 5 },
      ];
    } else if (presetKey === 'paint-pack') {
      opt = 'Packaging Size';
      list = [
        { id: `pnt-qtr-${Date.now()}`, name: 'Quarter Can (0.91L)', sku: 'PNT-QTR', price: '950', saleEnabled: false, stockQuantity: 40, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 0 },
        { id: `pnt-1l-${Date.now()}`, name: '1 Litre Standard', sku: 'PNT-1L', price: '1650', saleEnabled: false, stockQuantity: 50, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 1 },
        { id: `pnt-gal-${Date.now()}`, name: '4 Litres (Gallon)', sku: 'PNT-4L', price: '5400', saleEnabled: true, salePrice: '4950', stockQuantity: 30, stockStatus: 'In Stock', isActive: true, isDefault: true, displayOrder: 2 },
        { id: `pnt-drm-${Date.now()}`, name: '16 Litres (Drum)', sku: 'PNT-16L', price: '19500', saleEnabled: true, salePrice: '17800', stockQuantity: 15, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 3 },
      ];
    } else if (presetKey === 'tile-size') {
      opt = 'Tile Dimension';
      list = [
        { id: `tl-1224-${Date.now()}`, name: '12 x 24 Inch', sku: 'TL-1224', price: '1800', saleEnabled: false, stockQuantity: 80, stockStatus: 'In Stock', isActive: true, isDefault: true, displayOrder: 0 },
        { id: `tl-2424-${Date.now()}`, name: '24 x 24 Inch', sku: 'TL-2424', price: '2600', saleEnabled: false, stockQuantity: 100, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 1 },
        { id: `tl-2448-${Date.now()}`, name: '24 x 48 Inch (Large Slab)', sku: 'TL-2448', price: '4800', saleEnabled: true, salePrice: '4400', stockQuantity: 50, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 2 },
      ];
    } else if (presetKey === 'shower-head') {
      opt = 'Shower Head Size';
      list = [
        { id: `sh-8-${Date.now()}`, name: '8 Inch Round', sku: 'SH-08R', price: '4200', saleEnabled: false, stockQuantity: 25, stockStatus: 'In Stock', isActive: true, isDefault: true, displayOrder: 0 },
        { id: `sh-10-${Date.now()}`, name: '10 Inch Round', sku: 'SH-10R', price: '6500', saleEnabled: false, stockQuantity: 20, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 1 },
        { id: `sh-12-${Date.now()}`, name: '12 Inch Slim Square', sku: 'SH-12S', price: '8900', saleEnabled: true, salePrice: '7900', stockQuantity: 15, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 2 },
        { id: `sh-16-${Date.now()}`, name: '16 Inch Ultra Luxury Matrix', sku: 'SH-16X', price: '14000', saleEnabled: true, salePrice: '12500', stockQuantity: 8, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 3 },
      ];
    } else if (presetKey === 'vanity-size') {
      opt = 'Cabinet Width';
      list = [
        { id: `van-24-${Date.now()}`, name: '24 Inch Single Sink', sku: 'VAN-24', price: '22000', saleEnabled: false, stockQuantity: 10, stockStatus: 'In Stock', isActive: true, isDefault: true, displayOrder: 0 },
        { id: `van-30-${Date.now()}`, name: '30 Inch Single Sink', sku: 'VAN-30', price: '29500', saleEnabled: false, stockQuantity: 8, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 1 },
        { id: `van-36-${Date.now()}`, name: '36 Inch Luxury Finish', sku: 'VAN-36', price: '38000', saleEnabled: true, salePrice: '34500', stockQuantity: 6, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 2 },
        { id: `van-48-${Date.now()}`, name: '48 Inch Master Suite', sku: 'VAN-48', price: '52000', saleEnabled: true, salePrice: '48000', stockQuantity: 4, stockStatus: 'In Stock', isActive: true, isDefault: false, displayOrder: 3 },
      ];
    }

    setOptionName(opt);
    setVariantsList(list);
    setVariantsEnabled(true);
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

    const activeCleanVariants = variantsList.map((v, i) => ({
      ...v,
      id: v.id || `var-${Date.now()}-${i}`,
      name: v.name?.trim() || `Option ${i + 1}`,
      displayOrder: typeof v.displayOrder === 'number' ? v.displayOrder : i
    }));

    const variantsConfigObj: ProductVariantsConfig | undefined = variantsEnabled ? {
      variantsEnabled: true,
      optionName: optionName.trim() || 'Size',
      variants: activeCleanVariants
    } : undefined;

    const activeCleanShades = shadesList.map((s, i) => ({
      ...s,
      id: s.id || `shade-${Date.now()}-${i}`,
      name: s.name?.trim() || `Shade ${i + 1}`,
      code: s.code?.trim() || `${3000 + i + 1}`,
      referenceImage: s.referenceImage || s.image || '',
      image: s.referenceImage || s.image || '',
      colorHex: s.colorHex || '#FAF9F6',
      isActive: s.isActive !== false,
      displayOrder: typeof s.displayOrder === 'number' ? s.displayOrder : i,
      priceAdjustment: Number(s.priceAdjustment ?? 0)
    }));

    const paintShadesConfigObj: PaintShadesConfig | undefined = (isPaintItem && shadesEnabled) ? {
      shadesEnabled: true,
      shadesTitle: shadesTitle.trim() || 'Choose Shade',
      shadeSheetUrl: shadeSheetUrl.trim() || undefined,
      shades: activeCleanShades
    } : undefined;

    const quantityConfigObj: ProductQuantityConfig | undefined = quantityEnabled ? {
      quantityEnabled: true,
      minQuantity: minQuantity > 0 ? minQuantity : 1,
      maxQuantity: maxQuantity && maxQuantity > 0 ? maxQuantity : undefined,
      defaultQuantity: defaultQuantity > 0 ? defaultQuantity : 1,
      quantityStep: quantityStep > 0 ? quantityStep : 1,
      unitLabel: unitLabel.trim() || 'Pcs'
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
      // Quantity configuration
      quantityEnabled: Boolean(quantityEnabled),
      minQuantity: quantityEnabled ? (minQuantity > 0 ? minQuantity : 1) : undefined,
      maxQuantity: (quantityEnabled && maxQuantity && maxQuantity > 0) ? maxQuantity : undefined,
      defaultQuantity: quantityEnabled ? (defaultQuantity > 0 ? defaultQuantity : 1) : undefined,
      quantityStep: quantityEnabled ? (quantityStep > 0 ? quantityStep : 1) : undefined,
      unitLabel: quantityEnabled ? (unitLabel.trim() || 'Pcs') : undefined,
      quantityConfig: quantityConfigObj,
      // Variant configuration
      variantsEnabled: Boolean(variantsEnabled),
      optionName: optionName.trim() || 'Size',
      variantsList: variantsEnabled ? activeCleanVariants : undefined,
      variantsConfig: variantsConfigObj,
      shadesEnabled: isPaintItem ? Boolean(shadesEnabled) : false,
      shadesTitle: shadesTitle.trim() || 'Choose Shade',
      shadeSheetUrl: isPaintItem && shadeSheetUrl ? shadeSheetUrl.trim() : undefined,
      shadesList: (isPaintItem && shadesEnabled) ? activeCleanShades : undefined,
      paintShadesConfig: paintShadesConfigObj,
      isPaintProduct: isPaintItem,
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

          {/* 📦 PRODUCT VARIANT, SIZE & DYNAMIC PRICING SYSTEM (ADMIN-CONTROLLED PER PRODUCT) */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 space-y-4 ${
            variantsEnabled 
              ? 'bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-950 border-indigo-500/50 shadow-xl shadow-indigo-950/20' 
              : 'bg-slate-950/70 border-slate-800'
          }`}>
            {/* Master Variant Toggle Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border transition-colors ${
                  variantsEnabled 
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/30' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Sizes & Pricing (Optional)
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      variantsEnabled 
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {variantsEnabled ? `ENABLED (${variantsList.filter(v => v.isActive !== false).length} SIZES)` : 'DISABLED / SINGLE PRICE'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {variantsEnabled 
                      ? 'Add different sizes/capacities (e.g., 1/2", 3/4", 1", 20mm, 500L) with individual prices.' 
                      : 'Disabled: Product operates as a standard single-price product. Toggle ON to add size options.'}
                  </p>
                </div>
              </div>

              {/* Master Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={variantsEnabled}
                  onChange={(e) => {
                    const nextVal = e.target.checked;
                    setVariantsEnabled(nextVal);
                    if (nextVal && variantsList.length === 0) {
                      handleAddVariant();
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Expanded Variant Manager Body */}
            {variantsEnabled && (
              <div className="pt-3 border-t border-indigo-500/20 space-y-4 animate-fadeIn">
                
                {/* Mode Tabs: Editor vs Live Preview */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setActiveVariantTab('editor')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeVariantTab === 'editor'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Sliders className="w-3.5 h-3.5" />
                      <span>Variant & Price Editor</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveVariantTab('preview')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                        activeVariantTab === 'preview'
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                          : 'bg-slate-900 text-slate-400 hover:text-white'
                      }`}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Customer Storefront Preview</span>
                    </button>
                  </div>

                  <span className="text-[11px] text-indigo-300 font-mono hidden sm:inline-block">
                    {variantsList.length} variant{variantsList.length !== 1 ? 's' : ''} defined
                  </span>
                </div>

                {activeVariantTab === 'editor' ? (
                  <div className="space-y-4">
                    
                    {/* Option Label & Presets */}
                    <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <label className="block text-xs font-semibold text-slate-200">
                          Option Label / Attribute Name *
                        </label>
                        <span className="text-[10px] text-slate-500">
                          Displayed above the buttons on product page (e.g., "Select Capacity:")
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          required={variantsEnabled}
                          value={optionName}
                          onChange={(e) => setOptionName(e.target.value)}
                          placeholder="e.g. Capacity, Size, Diameter, Pack Size"
                          className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-medium"
                        />
                      </div>

                      {/* Quick Attribute Label Presets */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Presets:</span>
                        {['Capacity', 'Size', 'Diameter', 'Length', 'Dimension', 'Packaging Size', 'Cabinet Width', 'Model'].map((preset) => (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setOptionName(preset)}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
                              optionName === preset
                                ? 'bg-indigo-600 text-white border-indigo-400'
                                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Copy Sizes From Another Product (Independent deep clone) */}
                    {allProducts && allProducts.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-slate-950/90 border border-indigo-500/30 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                            <Copy className="w-3.5 h-3.5 text-indigo-400" />
                            <span>Copy Sizes From Existing Product</span>
                          </span>
                          <span className="text-[10px] text-slate-500">Clones sizes & prices independently</span>
                        </div>
                        <div className="flex flex-col sm:flex-row items-center gap-2">
                          <select
                            value={selectedCopyProductId}
                            onChange={(e) => setSelectedCopyProductId(e.target.value)}
                            className="flex-1 w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                          >
                            <option value="">-- Select Product with Sizes / Variants --</option>
                            {allProducts
                              .filter(p => p.id !== product?.id && ((p.variantsList && p.variantsList.length > 0) || (p.availableSizes && p.availableSizes.length > 0)))
                              .map(p => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({p.variantsList?.length || p.availableSizes?.length} sizes)
                                </option>
                              ))}
                          </select>
                          <button
                            type="button"
                            disabled={!selectedCopyProductId}
                            onClick={handleCopySizesFromOtherProduct}
                            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 text-white text-xs font-bold shrink-0 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy Sizes Into This Product</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Quick Single Size Insert Pills (Inch & Metric) */}
                    <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                          <Plus className="w-3.5 h-3.5 text-blue-400" />
                          <span>Quick Add Size (1-Click)</span>
                        </span>
                        <span className="text-[10px] text-slate-500">Click to instantly add size option</span>
                      </div>

                      {/* Imperial Inches */}
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Imperial (Inches):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '4"', '5"', '6"'].map(sz => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => handleQuickAddSizeBadge(sz, 250)}
                              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-blue-600 hover:text-white border border-slate-800 text-slate-300 text-xs font-semibold transition-colors"
                            >
                              + {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Metric mm */}
                      <div className="space-y-1 pt-1 border-t border-slate-800/60">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Metric (mm):</span>
                        <div className="flex flex-wrap gap-1.5">
                          {['20mm', '25mm', '32mm', '40mm', '50mm', '63mm', '75mm', '90mm', '110mm'].map(sz => (
                            <button
                              key={sz}
                              type="button"
                              onClick={() => handleQuickAddSizeBadge(sz, 280)}
                              className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-indigo-600 hover:text-white border border-slate-800 text-slate-300 text-xs font-semibold transition-colors"
                            >
                              + {sz}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Custom Size Quick Adder */}
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/60">
                        <input
                          type="text"
                          value={quickSizeNameInput}
                          onChange={(e) => setQuickSizeNameInput(e.target.value)}
                          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleQuickAddCustomSize(); }}}
                          placeholder="Type custom size (e.g. 500L, 8 inch, Extra Large)..."
                          className="flex-1 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                        />
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-500 font-mono">Rs.</span>
                          <input
                            type="number"
                            value={quickSizePriceInput}
                            onChange={(e) => setQuickSizePriceInput(e.target.value)}
                            placeholder="Price"
                            className="w-24 px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleQuickAddCustomSize}
                          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 shrink-0"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Size</span>
                        </button>
                      </div>
                    </div>

                    {/* 1-Click Complete Industry Template Generator */}
                    <div className="p-3 rounded-xl bg-slate-950/90 border border-indigo-500/20 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                          <span>1-Click Full Category Templates</span>
                        </span>
                        <span className="text-[10px] text-slate-500">Auto-fills sizes, SKUs & sample PKR rates</span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApplyPreset('water-tank')}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 text-[11px] text-left text-slate-200 hover:text-white transition-all group"
                        >
                          <strong className="block text-indigo-400 group-hover:text-indigo-300">🚰 Water Tanks</strong>
                          <span className="text-[10px] text-slate-400">100L, 200L, 300L, 500L, 1000L</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApplyPreset('pipe-size')}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 text-[11px] text-left text-slate-200 hover:text-white transition-all group"
                        >
                          <strong className="block text-indigo-400 group-hover:text-indigo-300">🔧 Pipes & Fittings</strong>
                          <span className="text-[10px] text-slate-400">1/2", 3/4", 1", 1-1/4", 1-1/2", 2"</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApplyPreset('paint-pack')}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 text-[11px] text-left text-slate-200 hover:text-white transition-all group"
                        >
                          <strong className="block text-indigo-400 group-hover:text-indigo-300">🎨 Paints & Drums</strong>
                          <span className="text-[10px] text-slate-400">Quarter, 1L, 4L Gallon, 16L Drum</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApplyPreset('tile-size')}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 text-[11px] text-left text-slate-200 hover:text-white transition-all group"
                        >
                          <strong className="block text-indigo-400 group-hover:text-indigo-300">🧱 Porcelain & Tiles</strong>
                          <span className="text-[10px] text-slate-400">12x24, 24x24, 24x48 Slabs</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApplyPreset('shower-head')}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 text-[11px] text-left text-slate-200 hover:text-white transition-all group"
                        >
                          <strong className="block text-indigo-400 group-hover:text-indigo-300">🚿 Shower Heads</strong>
                          <span className="text-[10px] text-slate-400">8", 10", 12", 16" Rain Matrix</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleApplyPreset('vanity-size')}
                          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500 text-[11px] text-left text-slate-200 hover:text-white transition-all group"
                        >
                          <strong className="block text-indigo-400 group-hover:text-indigo-300">🪞 Luxury Vanities</strong>
                          <span className="text-[10px] text-slate-400">24", 30", 36", 48" Cabinets</span>
                        </button>
                      </div>
                    </div>

                    {/* Variant Items List */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                          Configured Variants ({variantsList.length})
                        </span>
                        <button
                          type="button"
                          onClick={handleAddVariant}
                          className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add New {optionName || 'Option'}</span>
                        </button>
                      </div>

                      {variantsList.length === 0 ? (
                        <div className="p-6 rounded-2xl bg-slate-950/80 border border-dashed border-slate-800 text-center space-y-2">
                          <Boxes className="w-8 h-8 text-slate-600 mx-auto" />
                          <p className="text-xs text-slate-400">No variants added yet for this product.</p>
                          <button
                            type="button"
                            onClick={handleAddVariant}
                            className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            <span>Add First Variant</span>
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {variantsList.map((variant, idx) => {
                            const vRegNum = parseNumericPrice(variant.price);
                            const vSaleNum = parseNumericPrice(variant.salePrice);
                            const vDiscount = calculateDiscountPercentage(vRegNum, vSaleNum);
                            const vSavings = calculateSavingsAmount(vRegNum, vSaleNum);
                            const vIsSaleActive = Boolean(variant.saleEnabled && vRegNum > 0 && vSaleNum > 0 && vSaleNum < vRegNum);

                            return (
                              <div
                                key={variant.id || idx}
                                className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-3 ${
                                  variant.isDefault
                                    ? 'bg-slate-950 border-indigo-500/60 shadow-lg shadow-indigo-950/30 ring-1 ring-indigo-500/30'
                                    : variant.isActive === false
                                    ? 'bg-slate-950/40 border-slate-800/60 opacity-60'
                                    : 'bg-slate-950 border-slate-800'
                                }`}
                              >
                                {/* Variant Row Header */}
                                <div className="flex items-center justify-between gap-2 flex-wrap pb-2 border-b border-slate-800/80">
                                  <div className="flex items-center gap-2">
                                    {/* Default Radio */}
                                    <label
                                      className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-indigo-300 bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-500/30"
                                      title="Mark as default selection when customer opens product"
                                    >
                                      <input
                                        type="radio"
                                        name="default-variant-radio"
                                        checked={Boolean(variant.isDefault)}
                                        onChange={() => handleUpdateVariant(idx, 'isDefault', true)}
                                        className="text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                                      />
                                      <span>{variant.isDefault ? '⭐ Default Selection' : 'Set as Default'}</span>
                                    </label>

                                    {/* Active Toggle */}
                                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-400">
                                      <input
                                        type="checkbox"
                                        checked={variant.isActive !== false}
                                        onChange={(e) => handleUpdateVariant(idx, 'isActive', e.target.checked)}
                                        className="rounded text-indigo-600 bg-slate-900 border-slate-700 w-3.5 h-3.5"
                                      />
                                      <span>{variant.isActive !== false ? 'Active' : 'Disabled'}</span>
                                    </label>
                                  </div>

                                  {/* Actions: Reorder, Duplicate, Remove */}
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      disabled={idx === 0}
                                      onClick={() => handleMoveVariant(idx, 'up')}
                                      className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30"
                                      title="Move Up"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      disabled={idx === variantsList.length - 1}
                                      onClick={() => handleMoveVariant(idx, 'down')}
                                      className="p-1 rounded bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30"
                                      title="Move Down"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDuplicateVariant(idx)}
                                      className="p-1 rounded bg-slate-900 text-slate-400 hover:text-indigo-300"
                                      title="Duplicate Variant"
                                    >
                                      <Copy className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveVariant(idx)}
                                      className="p-1 rounded bg-rose-950/60 text-rose-300 hover:text-rose-100 hover:bg-rose-900"
                                      title="Delete Variant"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>

                                {/* Form Fields Grid */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                  {/* Variant Name */}
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                      {optionName || 'Option'} Name / Label *
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={variant.name}
                                      onChange={(e) => handleUpdateVariant(idx, 'name', e.target.value)}
                                      placeholder="e.g. 200 Liters, 3/4 Inch"
                                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-bold"
                                    />
                                  </div>

                                  {/* SKU */}
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                      Variant SKU (Optional)
                                    </label>
                                    <input
                                      type="text"
                                      value={variant.sku || ''}
                                      onChange={(e) => handleUpdateVariant(idx, 'sku', e.target.value)}
                                      placeholder="e.g. WT-200L"
                                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
                                    />
                                  </div>

                                  {/* Regular Price */}
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                      Regular Price (PKR) *
                                    </label>
                                    <input
                                      type="text"
                                      required
                                      value={variant.price || ''}
                                      onChange={(e) => handleUpdateVariant(idx, 'price', e.target.value)}
                                      placeholder="e.g. 15000"
                                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono font-bold"
                                    />
                                    {vRegNum > 0 && (
                                      <span className="text-[10px] text-slate-500 mt-0.5 block font-mono">
                                        {formatPakistaniPrice(vRegNum)}
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {/* Row 2: Sale Discount & Inventory */}
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                                  {/* Sale Toggle & Price */}
                                  <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-bold text-rose-300">
                                        <input
                                          type="checkbox"
                                          checked={Boolean(variant.saleEnabled)}
                                          onChange={(e) => handleUpdateVariant(idx, 'saleEnabled', e.target.checked)}
                                          className="rounded text-rose-600 bg-slate-900 border-slate-700 w-3.5 h-3.5"
                                        />
                                        <span>On Sale?</span>
                                      </label>
                                      {vDiscount > 0 && (
                                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono text-[9px] font-bold">
                                          {vDiscount}% OFF
                                        </span>
                                      )}
                                    </div>

                                    {variant.saleEnabled && (
                                      <input
                                        type="text"
                                        value={variant.salePrice || ''}
                                        onChange={(e) => handleUpdateVariant(idx, 'salePrice', e.target.value)}
                                        placeholder="Sale Price (PKR)"
                                        className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-rose-500/50 text-xs text-rose-200 placeholder-slate-600 focus:outline-none focus:border-rose-400 font-mono font-bold"
                                      />
                                    )}
                                  </div>

                                  {/* Stock Status */}
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                      Stock Status
                                    </label>
                                    <select
                                      value={variant.stockStatus || 'In Stock'}
                                      onChange={(e) => handleUpdateVariant(idx, 'stockStatus', e.target.value)}
                                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500"
                                    >
                                      <option value="In Stock">In Stock</option>
                                      <option value="Limited Stock">Limited Stock</option>
                                      <option value="Out of Stock">Out of Stock</option>
                                      <option value="Available on Order">Available on Order</option>
                                    </select>
                                  </div>

                                  {/* Stock Quantity */}
                                  <div>
                                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                                      Stock Qty
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={variant.stockQuantity ?? 10}
                                      onChange={(e) => handleUpdateVariant(idx, 'stockQuantity', parseInt(e.target.value, 10) || 0)}
                                      className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                                    />
                                  </div>
                                </div>

                                {/* Dynamic Auto-Calculated Savings for this Variant */}
                                {vIsSaleActive && (
                                  <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between text-[11px]">
                                    <span className="text-emerald-300 font-medium">
                                      Discount Applied: <strong className="text-white font-mono">{formatPakistaniPrice(vSaleNum)}</strong> (was ~~{formatPakistaniPrice(vRegNum)}~~)
                                    </span>
                                    <span className="text-amber-300 font-bold font-mono">
                                      Save {formatPakistaniPrice(vSavings)} ({vDiscount}% OFF)
                                    </span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  /* Customer Storefront Live Simulation Preview */
                  <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-indigo-500/30 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" />
                        <span>Interactive Customer Storefront Simulation</span>
                      </span>
                      <span className="text-[10px] text-slate-400">Click options below to test dynamic pricing</span>
                    </div>

                    {/* Simulated Selector */}
                    <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span>Select {optionName || 'Option'}:</span>
                        </label>
                        <span className="text-[11px] text-indigo-300 font-medium">
                          {variantsList.filter(v => v.isActive !== false).length} options available
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {variantsList.filter(v => v.isActive !== false).map((v) => {
                          const numP = parseNumericPrice(v.price);
                          const numSP = parseNumericPrice(v.salePrice);
                          const isSale = Boolean(v.saleEnabled && numP > 0 && numSP > 0 && numSP < numP);
                          const effP = isSale ? numSP : numP;

                          return (
                            <button
                              key={v.id}
                              type="button"
                              onClick={() => handleUpdateVariant(variantsList.findIndex(item => item.id === v.id), 'isDefault', true)}
                              className={`p-2.5 rounded-xl border text-left transition-all relative ${
                                v.isDefault
                                  ? 'bg-indigo-950/80 border-indigo-400 text-white shadow-md shadow-indigo-950/50 ring-1 ring-indigo-400'
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                              }`}
                            >
                              {isSale && (
                                <span className="absolute top-1 right-1 px-1.5 py-0.2 rounded bg-rose-600 text-white font-mono text-[8px] font-black">
                                  SALE
                                </span>
                              )}
                              <div className="font-bold text-xs">{v.name}</div>
                              <div className="text-[11px] font-mono mt-0.5 flex items-baseline gap-1">
                                <span className={v.isDefault ? 'text-indigo-300 font-bold' : 'text-slate-400'}>
                                  {effP > 0 ? formatPakistaniPrice(effP) : 'Contact'}
                                </span>
                                {isSale && (
                                  <span className="text-[9px] text-slate-500 line-through">
                                    {formatPakistaniPrice(numP)}
                                  </span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Selected Details Preview Box */}
                      {(() => {
                        const def = variantsList.find(v => v.isDefault) || variantsList[0];
                        if (!def) return null;
                        const defReg = parseNumericPrice(def.price);
                        const defSale = parseNumericPrice(def.salePrice);
                        const isDefSale = Boolean(def.saleEnabled && defReg > 0 && defSale > 0 && defSale < defReg);

                        return (
                          <div className="pt-3 border-t border-slate-800 flex items-center justify-between flex-wrap gap-2">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Selected Price</span>
                              <div className="flex items-baseline gap-2">
                                <span className="text-base font-extrabold text-white font-mono">
                                  {isDefSale ? formatPakistaniPrice(defSale) : (defReg > 0 ? formatPakistaniPrice(defReg) : 'Call for Price')}
                                </span>
                                {isDefSale && (
                                  <span className="text-xs text-slate-500 line-through font-mono">
                                    {formatPakistaniPrice(defReg)}
                                  </span>
                                )}
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Availability</span>
                              <span className="text-xs font-bold text-emerald-400">
                                {def.stockStatus || 'In Stock'} ({def.stockQuantity ?? 10} units)
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>

          {/* 🔢 PRODUCT QUANTITY & WHOLESALE ORDERING SETTINGS (ADMIN-CONTROLLED PER PRODUCT) */}
          <div className={`p-4 sm:p-5 rounded-2xl border transition-all duration-300 space-y-4 ${
            quantityEnabled 
              ? 'bg-gradient-to-b from-blue-950/40 via-slate-900 to-slate-950 border-blue-500/50 shadow-xl shadow-blue-950/20' 
              : 'bg-slate-950/70 border-slate-800'
          }`}>
            {/* Master Quantity Toggle Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border transition-colors ${
                  quantityEnabled 
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-600/30' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}>
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Quantity Selector & Dynamic Total
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      quantityEnabled 
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' 
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      {quantityEnabled ? `ENABLED (Min: ${minQuantity}, Step: ${quantityStep}, Unit: ${unitLabel || 'Pcs'})` : 'DISABLED / OFF'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    {quantityEnabled 
                      ? 'Customers can select quantity (+ / -) with real-time price recalculation (Total = Unit Price × Quantity) on website and WhatsApp.' 
                      : 'Fixed 1-unit order. Enable below to let customers choose quantities, bulk orders, or custom pack counts.'}
                  </p>
                </div>
              </div>

              {/* Master Switch */}
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  checked={quantityEnabled}
                  onChange={(e) => {
                    const nextVal = e.target.checked;
                    setQuantityEnabled(nextVal);
                    if (nextVal && (!minQuantity || minQuantity < 1)) {
                      setMinQuantity(1);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Quantity Parameters & Interactive Preview */}
            {quantityEnabled && (
              <div className="pt-3 border-t border-blue-500/20 space-y-4 animate-fadeIn">
                
                {/* Quantity Parameters Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Minimum Quantity *
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={minQuantity}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setMinQuantity(val);
                        if (previewQty < val) setPreviewQty(val);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Lowest allowed</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Maximum Quantity
                    </label>
                    <input
                      type="number"
                      min={minQuantity}
                      placeholder="Unlimited"
                      value={maxQuantity !== undefined ? maxQuantity : ''}
                      onChange={(e) => {
                        const raw = e.target.value.trim();
                        if (raw === '') {
                          setMaxQuantity(undefined);
                        } else {
                          const val = Math.max(minQuantity, parseInt(raw) || minQuantity);
                          setMaxQuantity(val);
                          if (previewQty > val) setPreviewQty(val);
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Blank = No limit</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Default Initial Quantity
                    </label>
                    <input
                      type="number"
                      min={minQuantity}
                      max={maxQuantity}
                      value={defaultQuantity}
                      onChange={(e) => {
                        const val = Math.max(minQuantity, parseInt(e.target.value) || minQuantity);
                        setDefaultQuantity(val);
                        setPreviewQty(val);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Pre-filled count</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Step Increment (±)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={quantityStep}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        setQuantityStep(val);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-[10px] text-slate-500 mt-0.5 block">e.g. 1, 5, 10, 50</span>
                  </div>
                </div>

                {/* Unit / Metric Label */}
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-slate-200">
                      Unit / Packaging Label
                    </label>
                    <span className="text-[10px] text-slate-500">
                      Displayed next to the quantity counter
                    </span>
                  </div>

                  <input
                    type="text"
                    value={unitLabel}
                    onChange={(e) => setUnitLabel(e.target.value)}
                    placeholder="e.g. Pcs, Bags, Boxes, Liters, Tins, Tons, Units"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-medium"
                  />

                  {/* Preset Unit Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase mr-1">Unit Presets:</span>
                    {['Pcs', 'Bags', 'Boxes', 'Liters', 'Tins', 'Tons', 'Units', 'Sets', 'Meters', 'Feet', 'Sq Ft', 'Cartons'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setUnitLabel(preset)}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border transition-all ${
                          unitLabel === preset
                            ? 'bg-blue-600 text-white border-blue-400'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Interactive Live Storefront Preview */}
                <div className="p-4 rounded-xl bg-slate-900/90 border border-blue-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                      <span className="text-[11px] font-bold text-blue-300 uppercase tracking-wider">
                        Live Customer Storefront & WhatsApp Preview
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400">
                      Formula: Total = Unit Price × Quantity
                    </span>
                  </div>

                  {(() => {
                    let unitPriceNum = 0;
                    let unitPriceFormatted = 'Call for Price';
                    if (variantsEnabled && variantsList.length > 0) {
                      const defVar = variantsList.find(v => v.isDefault) || variantsList[0];
                      const reg = parseNumericPrice(defVar.price);
                      const sale = parseNumericPrice(defVar.salePrice);
                      const isSale = Boolean(defVar.saleEnabled && reg > 0 && sale > 0 && sale < reg);
                      unitPriceNum = isSale ? sale : reg;
                      unitPriceFormatted = unitPriceNum > 0 ? formatPakistaniPrice(unitPriceNum) : 'Call for Price';
                    } else {
                      const reg = parseNumericPrice(formData.price);
                      const sale = parseNumericPrice(salePrice);
                      const isSale = Boolean(saleEnabled && reg > 0 && sale > 0 && sale < reg);
                      unitPriceNum = isSale ? sale : reg;
                      unitPriceFormatted = unitPriceNum > 0 ? formatPakistaniPrice(unitPriceNum) : (formData.price || 'Call for Price');
                    }

                    const effectiveQty = Math.max(minQuantity, previewQty);
                    const totalNum = unitPriceNum * effectiveQty;
                    const formattedTotal = totalNum > 0 ? formatPakistaniPrice(totalNum) : 'Price on Request';

                    return (
                      <div className="space-y-3">
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                          {/* Quantity Stepper */}
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-semibold text-slate-300">Quantity:</span>
                            <div className="flex items-center bg-slate-900 border border-slate-700 rounded-xl p-1 shadow-inner">
                              <button
                                type="button"
                                onClick={() => setPreviewQty(prev => Math.max(minQuantity, prev - quantityStep))}
                                disabled={effectiveQty <= minQuantity}
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <span className="font-bold text-sm">−</span>
                              </button>
                              <div className="px-4 py-1 text-center min-w-[50px]">
                                <span className="font-bold text-sm text-white font-mono">{effectiveQty}</span>
                                {unitLabel && <span className="text-[10px] text-slate-400 ml-1">{unitLabel}</span>}
                              </div>
                              <button
                                type="button"
                                onClick={() => setPreviewQty(prev => maxQuantity ? Math.min(maxQuantity, prev + quantityStep) : prev + quantityStep)}
                                disabled={Boolean(maxQuantity && effectiveQty >= maxQuantity)}
                                className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                              >
                                <span className="font-bold text-sm">+</span>
                              </button>
                            </div>
                          </div>

                          {/* Calculated Pricing Display */}
                          <div className="flex items-center gap-4 text-right">
                            <div>
                              <span className="text-[10px] text-slate-400 uppercase font-bold block">Unit Price</span>
                              <span className="text-xs font-bold text-slate-200 font-mono">{unitPriceFormatted}</span>
                            </div>
                            <div className="pl-4 border-l border-slate-800">
                              <span className="text-[10px] text-blue-400 uppercase font-bold block">Calculated Total</span>
                              <span className="text-base font-extrabold text-blue-400 font-mono">{formattedTotal}</span>
                            </div>
                          </div>
                        </div>

                        {/* WhatsApp Message Preview Snippet */}
                        <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 font-mono flex items-start gap-2">
                          <span className="text-emerald-400 font-bold shrink-0">WhatsApp Order:</span>
                          <span className="text-slate-400 line-clamp-1">
                            • Product: {formData.name || 'Product'} | Quantity: {effectiveQty} {unitLabel || 'Pcs'} | Unit: {unitPriceFormatted} | Total: {formattedTotal}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

              </div>
            )}
          </div>

          {/* PAINT-SPECIFIC SHADE / COLOR SYSTEM (STRICTLY RENDERED ONLY FOR PAINT PRODUCTS) */}
          {isPaintItem && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-b from-indigo-950/40 to-slate-950 border border-indigo-500/40 space-y-4">
              <AdminPaintShadesManager
                shadesConfig={{
                  shadesEnabled: shadesEnabled,
                  shadesTitle: shadesTitle,
                  shadeSheetUrl: shadeSheetUrl,
                  shades: shadesList
                }}
                shadesEnabled={shadesEnabled}
                shadesTitle={shadesTitle}
                shadeSheetUrl={shadeSheetUrl}
                shadesList={shadesList}
                categoryName={formData.category}
                onChange={(updatedConfig) => {
                  setShadesEnabled(Boolean(updatedConfig.shadesEnabled));
                  setShadesTitle(updatedConfig.shadesTitle || 'Choose Shade');
                  setShadeSheetUrl(updatedConfig.shadeSheetUrl || '');
                  setShadesList(updatedConfig.shades || []);
                }}
              />
            </div>
          )}

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

                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400 font-medium">Delivery Fee Display:</span>
                        <span className="font-bold text-amber-300">
                          {deliveryFeeType === 'free' && 'Free Delivery'}
                          {deliveryFeeType === 'fixed' && `Rs. ${deliveryFeeAmount.toLocaleString()}`}
                          {deliveryFeeType === 'contact' && (deliveryFeeLabel || 'Contact for Delivery')}
                          {deliveryFeeType === 'custom' && (deliveryFeeCustomText || 'Delivery depends on quantity, item type and location.')}
                        </span>
                      </div>
                      {deliveryFeeType === 'contact' && (
                        <p className="text-[11px] text-slate-400 pl-4">
                          Delivery depends on quantity, item type and location. Contact for further details.
                        </p>
                      )}
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
