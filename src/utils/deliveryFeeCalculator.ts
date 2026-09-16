import { CityDeliveryInfo, DeliveryFeeTier, DeliveryWeightTier } from '../types';

export type WeightClass = 'light' | 'heavy';

export interface CalculatedDeliveryFee {
  deliveryFee: number;
  isFree: boolean;
  matchedTier?: DeliveryFeeTier;
  matchedWeightTier?: DeliveryWeightTier;
  weightClass: WeightClass;
  tierDescription?: string;
  weightTierDescription?: string;
  nextFreeTierNotice?: string;
  hasTiers: boolean;
  hasWeightTiers?: boolean;
  totalWeightKg?: number;
  totalItemCount?: number;
  loadMultiplier?: number;
  isUnavailable?: boolean;
}

/**
 * Format an order amount range into human-readable text.
 */
export function formatTierRange(tier: DeliveryFeeTier): string {
  const minFormatted = Number(tier.minAmount || 0).toLocaleString('en-PK');
  if (tier.maxAmount === null || tier.maxAmount === undefined) {
    return `PKR ${minFormatted}+`;
  }
  const maxFormatted = Number(tier.maxAmount).toLocaleString('en-PK');
  return `PKR ${minFormatted} – ${maxFormatted}`;
}

/**
 * Format an order tier fee into human-readable text.
 */
export function formatTierFee(tier: DeliveryFeeTier): string {
  if (tier.isFree || Number(tier.fee) === 0) {
    return 'FREE Delivery';
  }
  return `PKR ${Number(tier.fee || 0).toLocaleString('en-PK')}`;
}

/**
 * Default Light Weight standard tier (Minimum Rs. 200).
 */
export function getDefaultCityTiers(cityName: string = 'City'): DeliveryFeeTier[] {
  return [
    {
      id: `tier-${Date.now()}-1`,
      minAmount: 0,
      maxAmount: null,
      fee: 250,
      isFree: false,
      label: `${cityName} Standard Delivery`
    }
  ];
}

export const generateDefaultCityTiers = getDefaultCityTiers;

/**
 * Generates sensible base tiers for a city based on its base fee (Minimum Rs. 200).
 * Delivery is always charged.
 */
export function generateCityTiersForBaseFee(baseFee: number, citySlug: string = 'city'): DeliveryFeeTier[] {
  const cleanFee = Math.max(200, Math.round(baseFee));
  return [
    {
      id: `tier-${citySlug}-1`,
      minAmount: 0,
      maxAmount: null,
      fee: cleanFee,
      isFree: false,
      label: `Standard Delivery (Rs. ${cleanFee.toLocaleString('en-PK')})`
    }
  ];
}

/**
 * Default Heavy Weight standard tier.
 */
export function getDefaultHeavyCityTiers(cityName: string = 'City'): DeliveryFeeTier[] {
  return [
    {
      id: `tier-heavy-${Date.now()}-1`,
      minAmount: 0,
      maxAmount: null,
      fee: 400,
      isFree: false,
      label: `${cityName} Heavy Cargo Delivery`
    }
  ];
}

export const generateDefaultHeavyCityTiers = getDefaultHeavyCityTiers;

/**
 * Generates sensible Heavy Weight tiers based on base fee (+Rs. 130–150 cargo handling).
 */
export function generateHeavyCityTiersForBaseFee(baseFee: number, citySlug: string = 'city'): DeliveryFeeTier[] {
  const cleanFee = Math.max(200, Math.round(baseFee));
  const heavyBase = cleanFee + (cleanFee <= 250 ? 100 : (cleanFee <= 350 ? 130 : 150));
  return [
    {
      id: `tier-${citySlug}-h1`,
      minAmount: 0,
      maxAmount: null,
      fee: heavyBase,
      isFree: false,
      label: `Heavy Cargo Delivery (Rs. ${heavyBase.toLocaleString('en-PK')})`
    }
  ];
}

/**
 * Helper to check if a product is physically heavy or bulky:
 * - Commodes / toilets
 * - Wash basins / vanity
 * - Water tanks / geysers
 * - Pumps / motors
 * - Large flush tanks
 * - Large sanitary items / bathtubs
 * - Cement / tiles / building materials
 * - Weight >= 10 kg
 */
export function isProductHeavyOrBulky(prod: any): boolean {
  if (!prod) return false;
  if (prod.weightClass === 'heavy' || prod.deliveryConfig?.weightClass === 'heavy') return true;
  if (prod.isHeavy || prod.deliveryConfig?.isHeavy) return true;
  const weight = Number(prod.weightKg ?? prod.deliveryConfig?.weightKg ?? 0);
  if (weight >= 10) return true;
  const name = String(prod.name || '').toLowerCase();
  const category = String(prod.category || '').toLowerCase();
  const keywords = ['commode', 'toilet', 'basin', 'vanity', 'water tank', 'tank', 'pump', 'motor', 'flush tank', 'bathtub', 'cement', 'tile', 'geyser'];
  return keywords.some(kw => name.includes(kw) || category.includes(kw));
}

/**
 * Automatically determine if a cart / order is classified as 'light' or 'heavy'
 * and calculate combined physical load metrics.
 */
export function determineCartWeightClass(
  items: Array<{ product?: any; quantity?: number }>,
  heavyThresholdKg: number = 10
): {
  weightClass: WeightClass;
  totalWeightKg: number;
  hasHeavyItem: boolean;
  heavyItemCount: number;
  totalItemCount: number;
  reason: string;
} {
  let totalWeight = 0;
  let hasHeavyItem = false;
  let heavyItemCount = 0;
  let totalItemCount = 0;
  let heavyReason = '';

  for (const item of items) {
    const prod = item?.product;
    if (!prod) continue;
    const qty = Math.max(1, Number(item.quantity) || 1);
    totalItemCount += qty;

    const isHeavy = isProductHeavyOrBulky(prod);
    const itemWeight = Number(prod.weightKg ?? prod.deliveryConfig?.weightKg ?? (isHeavy ? 12 : 0.8));
    totalWeight += itemWeight * qty;

    if (isHeavy) {
      hasHeavyItem = true;
      heavyItemCount += qty;
      if (!heavyReason) {
        heavyReason = `Item "${prod.name || 'Product'}" is classified as Heavy / Bulky Cargo`;
      }
    } else if (itemWeight >= heavyThresholdKg) {
      hasHeavyItem = true;
      heavyItemCount += qty;
      if (!heavyReason) {
        heavyReason = `Item "${prod.name || 'Product'}" weighs ${itemWeight} kg (Heavy threshold: ${heavyThresholdKg} kg)`;
      }
    }
  }

  const roundedWeight = Math.round(totalWeight * 10) / 10;

  if (hasHeavyItem) {
    return {
      weightClass: 'heavy',
      totalWeightKg: roundedWeight,
      hasHeavyItem: true,
      heavyItemCount,
      totalItemCount,
      reason: heavyReason || 'Contains Heavy / Bulky Cargo items'
    };
  }

  if (totalWeight >= heavyThresholdKg) {
    return {
      weightClass: 'heavy',
      totalWeightKg: roundedWeight,
      hasHeavyItem: true,
      heavyItemCount: totalItemCount,
      totalItemCount,
      reason: `Total combined weight (${roundedWeight} kg) exceeds ${heavyThresholdKg} kg threshold`
    };
  }

  return {
    weightClass: 'light',
    totalWeightKg: roundedWeight,
    hasHeavyItem: false,
    heavyItemCount: 0,
    totalItemCount,
    reason: roundedWeight > 0 ? `Light Weight Parcel (${roundedWeight} kg)` : 'Standard Light Parcel (< 10 kg)'
  };
}

/**
 * Format a weight tier range into human-readable text.
 */
export function formatWeightTierRange(tier: DeliveryWeightTier): string {
  const minFormatted = Number(tier.minWeightKg || 0);
  if (tier.maxWeightKg === null || tier.maxWeightKg === undefined) {
    return `${minFormatted} kg+`;
  }
  return `${minFormatted} – ${tier.maxWeightKg} kg`;
}

/**
 * Format a weight tier fee into human-readable text.
 */
export function formatWeightTierFee(tier: DeliveryWeightTier): string {
  if (tier.isFree || Number(tier.fee) === 0) {
    return 'FREE Delivery';
  }
  return `PKR ${Number(tier.fee || 0).toLocaleString('en-PK')}`;
}

export function getDefaultCityWeightTiers(): DeliveryWeightTier[] {
  return [
    {
      id: `wt-${Date.now()}-1`,
      minWeightKg: 0,
      maxWeightKg: 10,
      fee: 250,
      isFree: false,
      label: 'Light Weight (0 – 10 kg)'
    },
    {
      id: `wt-${Date.now()}-2`,
      minWeightKg: 10.1,
      maxWeightKg: null,
      fee: 400,
      isFree: false,
      label: 'Heavy Weight (10+ kg)'
    }
  ];
}

export const generateDefaultCityWeightTiers = getDefaultCityWeightTiers;

/**
 * Validates delivery fee tiers for errors.
 */
export function validateDeliveryTiers(tiers: DeliveryFeeTier[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(tiers) || tiers.length === 0) {
    return { isValid: true, errors: [], warnings: [] };
  }

  tiers.forEach((tier, index) => {
    const tierNum = index + 1;
    if (typeof tier.minAmount !== 'number' || isNaN(tier.minAmount) || tier.minAmount < 0) {
      errors.push(`Tier #${tierNum}: Minimum order value cannot be negative.`);
    }
    if (tier.maxAmount !== null && tier.maxAmount !== undefined) {
      if (typeof tier.maxAmount !== 'number' || isNaN(tier.maxAmount)) {
        errors.push(`Tier #${tierNum}: Maximum order value must be a valid number or 'No Limit'.`);
      } else if (tier.maxAmount < (tier.minAmount || 0)) {
        errors.push(`Tier #${tierNum}: Maximum value (PKR ${tier.maxAmount.toLocaleString()}) cannot be less than Minimum value (PKR ${tier.minAmount.toLocaleString()}).`);
      }
    }
    if (typeof tier.fee !== 'number' || isNaN(tier.fee) || tier.fee < 0) {
      errors.push(`Tier #${tierNum}: Delivery fee cannot be negative.`);
    }
  });

  const sorted = [...tiers].sort((a, b) => (a.minAmount || 0) - (b.minAmount || 0));

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (current.maxAmount === null || current.maxAmount === undefined) {
      errors.push(`Tier starting at PKR ${(current.minAmount || 0).toLocaleString()}+ is set to 'No Limit', so subsequent Tier starting at PKR ${(next.minAmount || 0).toLocaleString()} can never be reached.`);
    } else if (next.minAmount <= current.maxAmount) {
      errors.push(
        `Conflicting / Overlapping range: Tier (PKR ${current.minAmount.toLocaleString()} – ${current.maxAmount.toLocaleString()}) overlaps with Tier starting at PKR ${next.minAmount.toLocaleString()}.`
      );
    } else if (next.minAmount > current.maxAmount + 1) {
      warnings.push(
        `Gap detected: Order values between PKR ${(current.maxAmount + 1).toLocaleString()} and PKR ${(next.minAmount - 1).toLocaleString()} are not explicitly covered.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

export function validateWeightTiers(tiers: DeliveryWeightTier[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!Array.isArray(tiers) || tiers.length === 0) {
    return { isValid: true, errors: [], warnings: [] };
  }

  tiers.forEach((tier, index) => {
    const tierNum = index + 1;
    if (typeof tier.minWeightKg !== 'number' || isNaN(tier.minWeightKg) || tier.minWeightKg < 0) {
      errors.push(`Weight Tier #${tierNum}: Minimum weight cannot be negative.`);
    }
    if (tier.maxWeightKg !== null && tier.maxWeightKg !== undefined) {
      if (typeof tier.maxWeightKg !== 'number' || isNaN(tier.maxWeightKg)) {
        errors.push(`Weight Tier #${tierNum}: Maximum weight must be a valid number or 'No Limit'.`);
      } else if (tier.maxWeightKg < (tier.minWeightKg || 0)) {
        errors.push(`Weight Tier #${tierNum}: Maximum weight (${tier.maxWeightKg} kg) cannot be less than Minimum weight (${tier.minWeightKg} kg).`);
      }
    }
    if (typeof tier.fee !== 'number' || isNaN(tier.fee) || tier.fee < 0) {
      errors.push(`Weight Tier #${tierNum}: Fee cannot be negative.`);
    }
  });

  const sorted = [...tiers].sort((a, b) => (a.minWeightKg || 0) - (b.minWeightKg || 0));

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (current.maxWeightKg === null || current.maxWeightKg === undefined) {
      errors.push(`Weight tier starting at ${current.minWeightKg} kg+ has 'No Limit', so higher weight tiers starting at ${next.minWeightKg} kg will never be reached.`);
    } else if (next.minWeightKg <= current.maxWeightKg) {
      errors.push(`Overlapping weight range: Tier (${current.minWeightKg} – ${current.maxWeightKg} kg) overlaps with next Tier starting at ${next.minWeightKg} kg.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculates delivery fee dynamically based on:
 * 1. Delivery City & approximate distance from Chiniot (base fee: Rs. 200, 250, 300, 350, 400, 450, 500)
 * 2. Product weight & bulk (Light vs Heavy)
 * 3. Product quantity & combined shipment physical load
 * 
 * CORE RULES:
 * - Rs. 200 is the absolute minimum delivery charge.
 * - NO automatic FREE delivery based on order amount (Rs. 5,000, Rs. 10,000, Rs. 20,000+ still pay delivery).
 * - Delivery is ALWAYS charged unless an admin explicitly configures a location/rule as free.
 * - 1-2 small light items do not double the fee. 5-10 small items or 2-3 large bulky items scale up intelligently.
 * - Very large/bulky shipments scale up to ~2x the base delivery fee when justified.
 */
export function calculateCityDeliveryFee(
  city: CityDeliveryInfo | undefined | null,
  orderSubtotal: number,
  fallbackFee: number = 250,
  _ignoredGlobalFreeThreshold?: number, // Kept for signature compatibility; order value does NOT make delivery free
  globalMinFee?: number,
  globalMaxFee?: number,
  weightParam?: number | WeightClass,
  explicitWeightClass?: WeightClass,
  totalItemCountParam?: number,
  heavyItemCountParam?: number,
  itemsList?: Array<{ product?: any; quantity?: number }>
): CalculatedDeliveryFee {
  const effectiveAmount = Math.max(0, Number(orderSubtotal) || 0);

  // If subtotal is zero (empty cart), no delivery charges
  if (effectiveAmount <= 0) {
    return {
      deliveryFee: 0,
      isFree: true,
      weightClass: 'light',
      hasTiers: false,
      hasWeightTiers: false,
      totalWeightKg: 0,
      totalItemCount: 0,
      loadMultiplier: 1.0
    };
  }

  // 1. Resolve weight class and item counts
  let resolvedWeightClass: WeightClass = 'light';
  let totalWeightKg = 0;
  let computedTotalItems = Math.max(1, Number(totalItemCountParam) || 1);
  let computedHeavyItems = Math.max(0, Number(heavyItemCountParam) || 0);

  if (Array.isArray(itemsList) && itemsList.length > 0) {
    const cartAnalysis = determineCartWeightClass(itemsList);
    resolvedWeightClass = cartAnalysis.weightClass;
    totalWeightKg = cartAnalysis.totalWeightKg;
    computedTotalItems = cartAnalysis.totalItemCount;
    computedHeavyItems = cartAnalysis.heavyItemCount;
  } else {
    if (explicitWeightClass === 'heavy' || explicitWeightClass === 'light') {
      resolvedWeightClass = explicitWeightClass;
    } else if (weightParam === 'heavy' || weightParam === 'light') {
      resolvedWeightClass = weightParam;
    } else if (typeof weightParam === 'number' && !isNaN(weightParam)) {
      totalWeightKg = Math.max(0, weightParam);
      resolvedWeightClass = totalWeightKg >= 10 ? 'heavy' : 'light';
    }
    if (resolvedWeightClass === 'heavy' && computedHeavyItems === 0) {
      computedHeavyItems = computedTotalItems;
    }
  }

  // 2. Check explicit Admin Free Delivery override on the city itself (only if admin explicitly set free)
  const isCityAdminFree = Boolean(city?.freeDelivery || city?.deliveryFeeType === 'free');
  const isUnavailable = city?.status === 'unavailable' || city?.isEnabled === false;

  if (isCityAdminFree && city) {
    return {
      deliveryFee: 0,
      isFree: true,
      weightClass: resolvedWeightClass,
      hasTiers: false,
      hasWeightTiers: false,
      totalWeightKg,
      totalItemCount: computedTotalItems,
      loadMultiplier: 1.0,
      tierDescription: `${city.cityName}: Admin Free Delivery`,
      isUnavailable
    };
  }

  // 3. Determine Base Fee for this City & Weight Class
  let baseFeeForClass = 250;

  if (!city || city.useCustomRules === false) {
    // Standard site default
    const rawFallback = Number(fallbackFee) || 250;
    baseFeeForClass = resolvedWeightClass === 'heavy' ? Math.max(350, rawFallback + 150) : Math.max(200, rawFallback);
  } else {
    // City-specific base rate
    if (resolvedWeightClass === 'heavy') {
      if (typeof city.heavyWeightFee === 'number' && city.heavyWeightFee > 0) {
        baseFeeForClass = city.heavyWeightFee;
      } else {
        const cityBase = Number(city.baseFee ?? city.deliveryFee ?? fallbackFee);
        baseFeeForClass = Math.max(350, cityBase + 150);
      }
    } else {
      if (typeof city.lightWeightFee === 'number' && city.lightWeightFee > 0) {
        baseFeeForClass = city.lightWeightFee;
      } else {
        baseFeeForClass = Number(city.baseFee ?? city.deliveryFee ?? fallbackFee);
      }
    }
  }

  // Ensure city base fee is at least Rs. 200
  baseFeeForClass = Math.max(200, baseFeeForClass);

  // 4. Calculate Quantity & Physical Shipment Load Multiplier
  // - 1 normal/light item: base fee (e.g. Rs. 300)
  // - 2-3 normal/light items: base fee (does NOT double)
  // - 4-6 small items: 1.2x base fee
  // - 7-10 small items: 1.4x base fee
  // - 11-15 small items: 1.65x base fee
  // - 16+ small items: scales up to ~2.0x–2.2x base fee
  // - 1 heavy item (e.g. commode): 1.0x heavy base fee
  // - 2 heavy items: 1.35x heavy base fee (e.g. Rs. 450 * 1.35 = Rs. 600+)
  // - 3 heavy items: 1.65x heavy base fee
  // - 4+ heavy items: scales up to ~2.2x–2.5x heavy base fee
  let loadMultiplier = 1.0;
  const effectiveLightItems = Math.max(0, computedTotalItems - computedHeavyItems);

  if (computedHeavyItems > 0) {
    if (computedHeavyItems === 1) {
      loadMultiplier = effectiveLightItems <= 3 ? 1.0 : 1.15;
    } else if (computedHeavyItems === 2) {
      loadMultiplier = 1.35;
    } else if (computedHeavyItems === 3) {
      loadMultiplier = 1.65;
    } else {
      loadMultiplier = Math.min(2.5, 1.65 + (computedHeavyItems - 3) * 0.25);
    }
  } else {
    if (computedTotalItems <= 3) {
      loadMultiplier = 1.0;
    } else if (computedTotalItems <= 6) {
      loadMultiplier = 1.2;
    } else if (computedTotalItems <= 10) {
      loadMultiplier = 1.4;
    } else if (computedTotalItems <= 15) {
      loadMultiplier = 1.65;
    } else {
      loadMultiplier = Math.min(2.2, 1.65 + (computedTotalItems - 15) * 0.05);
    }
  }

  // Weight-based freight cargo check for very heavy shipments (> 20 kg)
  if (totalWeightKg > 20) {
    const weightCargoMultiplier = Math.min(2.5, 1.0 + (totalWeightKg - 20) * 0.02);
    loadMultiplier = Math.max(loadMultiplier, weightCargoMultiplier);
  }

  // Calculate fee with load multiplier, rounded to nearest 10 PKR
  let calculatedFee = Math.round((baseFeeForClass * loadMultiplier) / 10) * 10;

  // 5. Apply Absolute Minimum of Rs. 200
  calculatedFee = Math.max(200, calculatedFee);

  // 6. Apply City Min / Max Bounds if configured
  if (city) {
    if (typeof city.minFee === 'number' && city.minFee > 0) {
      calculatedFee = Math.max(calculatedFee, city.minFee);
    }
    if (typeof city.maxFee === 'number' && city.maxFee > 0) {
      calculatedFee = Math.min(calculatedFee, city.maxFee);
    }
  }

  // 7. Apply Global Min / Max Bounds
  if (typeof globalMinFee === 'number' && globalMinFee >= 0) {
    calculatedFee = Math.max(calculatedFee, globalMinFee);
  }
  if (typeof globalMaxFee === 'number' && globalMaxFee > 0) {
    calculatedFee = Math.min(calculatedFee, globalMaxFee);
  }

  // Final guarantee: delivery fee is never below Rs. 200
  calculatedFee = Math.max(200, calculatedFee);

  const cityNameLabel = city?.cityName || 'Standard';
  const weightLabel = resolvedWeightClass === 'heavy' ? 'Heavy Cargo' : 'Standard';
  const qtyNotice = computedTotalItems > 1 ? `, Qty: ${computedTotalItems}` : '';
  const tierDescription = `${cityNameLabel} (${weightLabel}${qtyNotice}): PKR ${calculatedFee.toLocaleString('en-PK')}`;

  return {
    deliveryFee: calculatedFee,
    isFree: false,
    weightClass: resolvedWeightClass,
    tierDescription,
    hasTiers: false,
    hasWeightTiers: resolvedWeightClass === 'heavy',
    totalWeightKg,
    totalItemCount: computedTotalItems,
    loadMultiplier,
    isUnavailable
  };
}
