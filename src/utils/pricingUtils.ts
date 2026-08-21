import { Product, ProductSaleConfig } from '../types';

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
