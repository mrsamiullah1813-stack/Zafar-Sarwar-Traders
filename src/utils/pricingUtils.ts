import { Product, ProductSaleConfig, ProductVariant } from '../types';

/**
 * Parses numeric price from any string format (e.g. "Rs. 10,000", "10,000 PKR", "10000", 10000)
 */
export function parseNumericPrice(val?: string | number | null): number {
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  if (!val) return 0;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats a number to Pakistani Rupee currency display (e.g. "Rs. 7,500")
 */
export function formatPakistaniPrice(num: number, includePrefix: boolean = true): string {
  if (isNaN(num) || num <= 0) return includePrefix ? 'Rs. 0' : '0';
  const formatted = Math.round(num).toLocaleString('en-PK');
  return includePrefix ? `Rs. ${formatted}` : formatted;
}

/**
 * Calculates discount percentage using the required formula:
 * Discount % = ((Regular Price - Sale Price) / Regular Price) * 100
 */
export function calculateDiscountPercentage(
  regularPrice: string | number | null | undefined,
  salePrice: string | number | null | undefined
): number {
  const reg = parseNumericPrice(regularPrice);
  const sale = parseNumericPrice(salePrice);
  if (reg <= 0 || sale <= 0 || sale >= reg) return 0;
  return Math.round(((reg - sale) / reg) * 100);
}

/**
 * Calculates savings amount (Regular Price - Sale Price)
 */
export function calculateSavingsAmount(
  regularPrice: string | number | null | undefined,
  salePrice: string | number | null | undefined
): number {
  const reg = parseNumericPrice(regularPrice);
  const sale = parseNumericPrice(salePrice);
  if (reg <= 0 || sale <= 0 || sale >= reg) return 0;
  return Math.max(0, reg - sale);
}

/**
 * Calculates countdown time remaining until sale end date
 */
export function getSaleTimeRemaining(saleEndDate?: string | null): {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalSeconds: number;
  isOver: boolean;
} {
  if (!saleEndDate) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isOver: true };
  }

  const end = new Date(saleEndDate).getTime();
  if (isNaN(end)) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isOver: true };
  }

  const now = Date.now();
  const diff = end - now;

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalSeconds: 0, isOver: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / (3600 * 24));
  const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalSeconds, isOver: false };
}

/**
 * Checks whether a product has a valid, active sale configured
 */
export function isProductOnSale(product?: Partial<Product> | null): boolean {
  if (!product) return false;
  
  const isEnabled = Boolean(
    product.saleEnabled === true || 
    product.saleConfig?.saleEnabled === true
  );

  if (!isEnabled) return false;

  const regNum = parseNumericPrice(product.price);
  const rawSale = product.salePrice ?? product.saleConfig?.salePrice;
  const saleNum = parseNumericPrice(rawSale);

  if (regNum <= 0 || saleNum <= 0 || saleNum >= regNum) {
    return false;
  }

  const now = Date.now();
  const startDate = product.saleStartDate || product.saleConfig?.saleStartDate;
  const endDate = product.saleEndDate || product.saleConfig?.saleEndDate;

  if (startDate) {
    const start = new Date(startDate).getTime();
    if (!isNaN(start) && now < start) {
      return false; // Sale has not started yet
    }
  }

  if (endDate) {
    const end = new Date(endDate).getTime();
    if (!isNaN(end) && now > end) {
      return false; // Sale has ended
    }
  }

  return true;
}

export interface ProductPricingDetails {
  isSaleActive: boolean;
  saleStatus: 'none' | 'active' | 'upcoming' | 'expired';
  regularPriceNumeric: number;
  salePriceNumeric: number;
  currentPriceNumeric: number;
  effectivePriceNumeric: number;
  formattedRegularPrice: string;
  formattedSalePrice: string;
  formattedCurrentPrice: string;
  effectivePriceString: string;
  discountPercent: number;
  discountPercentage: number;
  savingsAmount: number;
  formattedSavings: string;
  saleLabel: string;
  saleBadgeColor: string;
  saleMessage?: string;
  showCountdown: boolean;
  showDiscountPercentage: boolean;
  showSavings: boolean;
  showRegularPriceStrike: boolean;
  startDate?: string;
  endDate?: string;
  saleStartDate?: string;
  saleEndDate?: string;
  isPriceOnRequest: boolean;
}

/**
 * Comprehensive pricing details extractor for any product
 */
export function getProductPricingDetails(product?: Partial<Product> | null): ProductPricingDetails {
  if (!product) {
    return {
      isSaleActive: false,
      saleStatus: 'none',
      regularPriceNumeric: 0,
      salePriceNumeric: 0,
      currentPriceNumeric: 0,
      effectivePriceNumeric: 0,
      formattedRegularPrice: 'Price on Request',
      formattedSalePrice: '',
      formattedCurrentPrice: 'Price on Request',
      effectivePriceString: 'Price on Request',
      discountPercent: 0,
      discountPercentage: 0,
      savingsAmount: 0,
      formattedSavings: '',
      saleLabel: 'SALE',
      saleBadgeColor: 'red',
      showCountdown: false,
      showDiscountPercentage: true,
      showSavings: true,
      showRegularPriceStrike: true,
      isPriceOnRequest: true
    };
  }

  const isPriceOnRequest = Boolean(product.isPriceOnRequest || product.hidePrice);
  const regNum = parseNumericPrice(product.price);
  const rawSale = product.salePrice ?? product.saleConfig?.salePrice;
  const saleNum = parseNumericPrice(rawSale);

  const isEnabled = Boolean(
    product.saleEnabled === true || 
    product.saleConfig?.saleEnabled === true
  );

  const startDate = product.saleStartDate || product.saleConfig?.saleStartDate;
  const endDate = product.saleEndDate || product.saleConfig?.saleEndDate;
  const now = Date.now();

  let saleStatus: 'none' | 'active' | 'upcoming' | 'expired' = 'none';

  if (isEnabled && regNum > 0 && saleNum > 0 && saleNum < regNum) {
    saleStatus = 'active';

    if (startDate) {
      const start = new Date(startDate).getTime();
      if (!isNaN(start) && now < start) {
        saleStatus = 'upcoming';
      }
    }

    if (endDate) {
      const end = new Date(endDate).getTime();
      if (!isNaN(end) && now > end) {
        saleStatus = 'expired';
      }
    }
  }

  const isSaleActive = saleStatus === 'active';
  const discountPercent = calculateDiscountPercentage(regNum, saleNum);
  const savingsAmount = calculateSavingsAmount(regNum, saleNum);

  const formattedRegular = regNum > 0 ? formatPakistaniPrice(regNum) : (product.price || 'Call for Price');
  const formattedSale = saleNum > 0 ? formatPakistaniPrice(saleNum) : '';
  const formattedCurrent = isSaleActive ? formattedSale : (product.price ? (!isNaN(regNum) && regNum > 0 ? formatPakistaniPrice(regNum) : product.price) : 'Price on Request');
  const formattedSavings = savingsAmount > 0 ? formatPakistaniPrice(savingsAmount) : '';

  const saleLabel = product.saleLabel || product.saleConfig?.saleLabel || 'SALE';
  const saleBadgeColor = product.saleBadgeColor || product.saleConfig?.saleBadgeColor || 'red';
  const saleMessage = product.saleMessage || product.saleConfig?.saleMessage;

  const showCountdown = Boolean(
    (product.showSaleCountdown ?? product.saleConfig?.showCountdown ?? true) && 
    endDate && 
    saleStatus === 'active'
  );
  
  const showDiscountPercentage = Boolean(
    product.showDiscountPercentage ?? product.saleConfig?.showDiscountPercentage ?? true
  );

  const showSavings = Boolean(
    product.showSavingsAmount ?? product.saleConfig?.showSavings ?? true
  );

  const showRegularPriceStrike = Boolean(
    product.saleConfig?.showRegularPriceStrike ?? true
  );

  const effectiveNumeric = isSaleActive ? saleNum : regNum;
  const effectiveString = isPriceOnRequest ? 'Price on Request' : formattedCurrent;

  return {
    isSaleActive,
    saleStatus,
    regularPriceNumeric: regNum,
    salePriceNumeric: saleNum,
    currentPriceNumeric: effectiveNumeric,
    effectivePriceNumeric: effectiveNumeric,
    formattedRegularPrice: formattedRegular,
    formattedSalePrice: formattedSale,
    formattedCurrentPrice: effectiveString,
    effectivePriceString: effectiveString,
    discountPercent,
    discountPercentage: discountPercent,
    savingsAmount,
    formattedSavings,
    saleLabel,
    saleBadgeColor,
    saleMessage,
    showCountdown,
    showDiscountPercentage,
    showSavings,
    showRegularPriceStrike,
    startDate,
    endDate,
    saleStartDate: startDate,
    saleEndDate: endDate,
    isPriceOnRequest
  };
}

/**
 * Extracts and sorts active product variants (handling both product.variantsList and product.variantsConfig.variants)
 */
export function getActiveVariants(product?: Partial<Product> | null): ProductVariant[] {
  if (!product) return [];
  const rawList = product.variantsList || product.variantsConfig?.variants || [];
  if (!Array.isArray(rawList)) return [];

  return rawList
    .filter(v => v && typeof v === 'object' && v.isActive !== false)
    .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

/**
 * Checks if a product has active Admin-controlled variants enabled
 */
export function hasActiveVariants(product?: Partial<Product> | null): boolean {
  if (!product) return false;
  const isEnabled = Boolean(product.variantsEnabled || product.variantsConfig?.variantsEnabled);
  if (!isEnabled) return false;
  const active = getActiveVariants(product);
  return active.length > 0;
}

export interface VariantPricingDetails {
  variantId: string;
  variantName: string;
  sku?: string;
  isSaleActive: boolean;
  saleStatus: 'none' | 'active' | 'upcoming' | 'expired';
  regularPriceNumeric: number;
  salePriceNumeric: number;
  currentPriceNumeric: number;
  effectivePriceNumeric: number;
  formattedRegularPrice: string;
  formattedSalePrice: string;
  formattedCurrentPrice: string;
  effectivePriceString: string;
  discountPercentage: number;
  discountPercent: number;
  savingsAmount: number;
  formattedSavings: string;
  saleLabel: string;
  saleBadgeColor: string;
  saleMessage?: string;
  showCountdown: boolean;
  showDiscountPercentage: boolean;
  showSavings: boolean;
  showRegularPriceStrike: boolean;
  startDate?: string;
  endDate?: string;
  saleStartDate?: string;
  saleEndDate?: string;
  stockStatus: string;
  stockQuantity: number;
  inStock: boolean;
  image?: string;
  isPriceOnRequest: boolean;
}

/**
 * Calculates real-time dynamic pricing for a specific Product Variant.
 * Accepts arguments in either order: (parentProduct, variant) or (variant, parentProduct).
 */
export function getVariantPricingDetails(
  arg1: Partial<Product> | ProductVariant | null | undefined,
  arg2?: Partial<Product> | ProductVariant | null
): VariantPricingDetails {
  // Disambiguate arguments:
  let variant: ProductVariant | null = null;
  let parentProduct: Partial<Product> | null = null;

  if (arg1 && typeof arg1 === 'object') {
    if ('name' in arg1 && 'id' in arg1 && !('categoryId' in arg1 || 'variantsList' in arg1 || 'variantsConfig' in arg1)) {
      variant = arg1 as ProductVariant;
      parentProduct = (arg2 as Partial<Product>) || null;
    } else if (arg2 && typeof arg2 === 'object' && 'name' in arg2 && 'id' in arg2) {
      variant = arg2 as ProductVariant;
      parentProduct = (arg1 as Partial<Product>) || null;
    } else {
      variant = arg1 as ProductVariant;
      parentProduct = (arg2 as Partial<Product>) || null;
    }
  }

  if (!variant) {
    return {
      variantId: '',
      variantName: '',
      isSaleActive: false,
      saleStatus: 'none',
      regularPriceNumeric: 0,
      salePriceNumeric: 0,
      currentPriceNumeric: 0,
      effectivePriceNumeric: 0,
      formattedRegularPrice: 'Price on Request',
      formattedSalePrice: '',
      formattedCurrentPrice: 'Price on Request',
      effectivePriceString: 'Price on Request',
      discountPercentage: 0,
      discountPercent: 0,
      savingsAmount: 0,
      formattedSavings: '',
      saleLabel: '',
      saleBadgeColor: '',
      showCountdown: false,
      showDiscountPercentage: false,
      showSavings: false,
      showRegularPriceStrike: true,
      stockStatus: 'In Stock',
      stockQuantity: 10,
      inStock: true,
      isPriceOnRequest: true
    };
  }

  const regNum = parseNumericPrice(variant.price) || (parentProduct ? parseNumericPrice(parentProduct.price) : 0);
  
  // Check if variant has its own sale, or inherits parent product's sale
  const variantSaleEnabled = variant.saleEnabled === true;
  const parentSaleDetails = parentProduct ? getProductPricingDetails(parentProduct) : null;
  
  let isSale = false;
  let saleNum = 0;
  let saleMsg = parentSaleDetails?.saleMessage || '';
  let saleEnd = parentSaleDetails?.saleEndDate;

  if (variantSaleEnabled && variant.salePrice) {
    const rawVariantSale = parseNumericPrice(variant.salePrice);
    if (regNum > 0 && rawVariantSale > 0 && rawVariantSale < regNum) {
      isSale = true;
      saleNum = rawVariantSale;
      saleMsg = parentSaleDetails?.saleMessage || 'Special Variant Discount';
    }
  } else if (parentSaleDetails?.isSaleActive && (variant.price === undefined || variant.price === parentProduct?.price)) {
    // If variant price matches or is default, inherit parent sale
    isSale = true;
    saleNum = parentSaleDetails.salePriceNumeric;
    saleMsg = parentSaleDetails.saleMessage || '';
  }

  const effectiveNumeric = isSale ? saleNum : regNum;
  const discountPercent = calculateDiscountPercentage(regNum, saleNum);
  const savings = calculateSavingsAmount(regNum, saleNum);

  const formattedRegular = regNum > 0 ? formatPakistaniPrice(regNum) : 'Price on Request';
  const formattedSale = saleNum > 0 ? formatPakistaniPrice(saleNum) : '';
  const formattedCurrent = effectiveNumeric > 0 ? formatPakistaniPrice(effectiveNumeric) : 'Price on Request';
  const formattedSavings = savings > 0 ? formatPakistaniPrice(savings) : '';

  const stockQty = typeof variant.stockQuantity === 'number' ? variant.stockQuantity : (parentProduct?.stockQuantity ?? 10);
  const stockStatus = variant.stockStatus || (stockQty <= 0 ? 'Out of Stock' : (parentProduct?.stockStatus || 'In Stock'));
  const inStock = stockStatus.toLowerCase() !== 'out of stock' && stockQty > 0;

  return {
    variantId: variant.id,
    variantName: variant.name,
    sku: variant.sku || parentProduct?.sku,
    isSaleActive: isSale,
    saleStatus: isSale ? 'active' : 'none',
    regularPriceNumeric: regNum,
    salePriceNumeric: saleNum,
    currentPriceNumeric: effectiveNumeric,
    effectivePriceNumeric: effectiveNumeric,
    formattedRegularPrice: formattedRegular,
    formattedSalePrice: formattedSale,
    formattedCurrentPrice: formattedCurrent,
    effectivePriceString: formattedCurrent,
    discountPercentage: discountPercent,
    discountPercent,
    savingsAmount: savings,
    formattedSavings,
    saleLabel: isSale ? `${discountPercent}% OFF` : '',
    saleBadgeColor: 'bg-rose-600',
    saleMessage: saleMsg,
    showCountdown: isSale && Boolean(saleEnd),
    showDiscountPercentage: isSale && discountPercent > 0,
    showSavings: isSale && savings > 0,
    showRegularPriceStrike: true,
    saleEndDate: saleEnd,
    stockStatus,
    stockQuantity: stockQty,
    inStock,
    image: variant.image || parentProduct?.image,
    isPriceOnRequest: effectiveNumeric <= 0
  };
}

export interface ProductVariantDisplaySummary {
  hasVariants: boolean;
  optionName: string;
  variantCount: number;
  lowestPriceNumeric: number;
  highestPriceNumeric: number;
  minPrice: number;
  maxPrice: number;
  formattedPriceRange: string;
  hasActiveSale: boolean;
  defaultVariant?: ProductVariant;
}

/**
 * Returns summary price range and variant status for storefront cards
 */
export function getProductVariantDisplaySummary(product?: Partial<Product> | null): ProductVariantDisplaySummary {
  if (!product || !hasActiveVariants(product)) {
    const parentPricing = getProductPricingDetails(product);
    return {
      hasVariants: false,
      optionName: product?.optionName || 'Size',
      variantCount: 0,
      lowestPriceNumeric: parentPricing.effectivePriceNumeric,
      highestPriceNumeric: parentPricing.effectivePriceNumeric,
      minPrice: parentPricing.effectivePriceNumeric,
      maxPrice: parentPricing.effectivePriceNumeric,
      formattedPriceRange: parentPricing.formattedCurrentPrice,
      hasActiveSale: parentPricing.isSaleActive
    };
  }

  const active = getActiveVariants(product);
  const optionName = product.optionName || product.variantsConfig?.optionName || 'Size';
  const defaultVar = active.find(v => v.isDefault) || active[0];

  const variantPrices = active.map(v => {
    const p = getVariantPricingDetails(product, v);
    return {
      effectivePrice: p.effectivePriceNumeric,
      regularPrice: p.regularPriceNumeric,
      isSale: p.isSaleActive
    };
  }).filter(p => p.effectivePrice > 0);

  if (variantPrices.length === 0) {
    const parentPricing = getProductPricingDetails(product);
    return {
      hasVariants: true,
      optionName,
      variantCount: active.length,
      lowestPriceNumeric: parentPricing.effectivePriceNumeric,
      highestPriceNumeric: parentPricing.effectivePriceNumeric,
      minPrice: parentPricing.effectivePriceNumeric,
      maxPrice: parentPricing.effectivePriceNumeric,
      formattedPriceRange: parentPricing.formattedCurrentPrice,
      hasActiveSale: false,
      defaultVariant: defaultVar
    };
  }

  const numericValues = variantPrices.map(v => v.effectivePrice);
  const minPrice = Math.min(...numericValues);
  const maxPrice = Math.max(...numericValues);
  const anySale = variantPrices.some(v => v.isSale);

  let formattedPriceRange = '';
  if (minPrice === maxPrice) {
    formattedPriceRange = formatPakistaniPrice(minPrice);
  } else {
    formattedPriceRange = `From ${formatPakistaniPrice(minPrice)}`;
  }

  return {
    hasVariants: true,
    optionName,
    variantCount: active.length,
    lowestPriceNumeric: minPrice,
    highestPriceNumeric: maxPrice,
    minPrice,
    maxPrice,
    formattedPriceRange,
    hasActiveSale: anySale,
    defaultVariant: defaultVar
  };
}

