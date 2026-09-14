import { CityDeliveryInfo, DeliveryFeeTier } from '../types';

export interface CalculatedDeliveryFee {
  deliveryFee: number;
  isFree: boolean;
  matchedTier?: DeliveryFeeTier;
  tierDescription?: string;
  nextFreeTierNotice?: string;
  hasTiers: boolean;
  isUnavailable?: boolean;
}

/**
 * Format a tier amount range into human-readable text.
 * e.g. "PKR 0 – 4,999" or "PKR 10,000+"
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
 * Format a tier fee into human-readable text.
 * e.g. "FREE Delivery" or "PKR 200"
 */
export function formatTierFee(tier: DeliveryFeeTier): string {
  if (tier.isFree || Number(tier.fee) === 0) {
    return 'FREE Delivery';
  }
  return `PKR ${Number(tier.fee || 0).toLocaleString('en-PK')}`;
}

/**
 * Standard default 3-tier delivery preset as specified in requirements.
 */
export function getDefaultCityTiers(cityName: string = 'City'): DeliveryFeeTier[] {
  return [
    {
      id: `tier-${Date.now()}-1`,
      minAmount: 0,
      maxAmount: 4999,
      fee: 200,
      isFree: false,
      label: 'Standard Order'
    },
    {
      id: `tier-${Date.now()}-2`,
      minAmount: 5000,
      maxAmount: 9999,
      fee: 100,
      isFree: false,
      label: 'Medium Order Discount'
    },
    {
      id: `tier-${Date.now()}-3`,
      minAmount: 10000,
      maxAmount: null,
      fee: 0,
      isFree: true,
      label: 'Free Delivery on Orders 10,000+'
    }
  ];
}

export const generateDefaultCityTiers = getDefaultCityTiers;

/**
 * Validates delivery fee tiers for errors (overlapping ranges, negative values, min > max).
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

  // 1. Validate individual tiers
  tiers.forEach((tier, index) => {
    const tierNum = index + 1;
    if (typeof tier.minAmount !== 'number' || isNaN(tier.minAmount) || tier.minAmount < 0) {
      errors.push(`Tier #${tierNum}: Minimum amount cannot be negative or empty.`);
    }
    if (tier.maxAmount !== null && tier.maxAmount !== undefined) {
      if (typeof tier.maxAmount !== 'number' || isNaN(tier.maxAmount)) {
        errors.push(`Tier #${tierNum}: Maximum amount must be a valid number or 'No Limit'.`);
      } else if (tier.maxAmount < (tier.minAmount || 0)) {
        errors.push(`Tier #${tierNum}: Maximum amount (PKR ${tier.maxAmount.toLocaleString()}) cannot be less than Minimum amount (PKR ${tier.minAmount.toLocaleString()}).`);
      }
    }
    if (typeof tier.fee !== 'number' || isNaN(tier.fee) || tier.fee < 0) {
      errors.push(`Tier #${tierNum}: Delivery fee cannot be negative.`);
    }
  });

  // 2. Validate relationships and overlapping ranges
  // Sort a copy by minAmount
  const sorted = [...tiers].sort((a, b) => (a.minAmount || 0) - (b.minAmount || 0));

  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];

    if (current.maxAmount === null || current.maxAmount === undefined) {
      errors.push(`Tier with range starting at PKR ${(current.minAmount || 0).toLocaleString()}+ has 'No Limit' (∞), so higher tiers starting at PKR ${(next.minAmount || 0).toLocaleString()} will never be reached.`);
    } else if (next.minAmount <= current.maxAmount) {
      errors.push(
        `Conflicting / Overlapping range: Tier (PKR ${current.minAmount.toLocaleString()} – ${current.maxAmount.toLocaleString()}) overlaps with Tier starting at PKR ${next.minAmount.toLocaleString()}.`
      );
    } else if (next.minAmount > current.maxAmount + 1) {
      warnings.push(
        `Gap detected: Cart totals between PKR ${(current.maxAmount + 1).toLocaleString()} and PKR ${(next.minAmount - 1).toLocaleString()} are not explicitly covered.`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Calculates delivery fee dynamically based on city, cart subtotal, configured tiers,
 * city-level min/max caps, free delivery thresholds, and optional fallback toggles.
 */
export function calculateCityDeliveryFee(
  city: CityDeliveryInfo | undefined | null,
  orderSubtotal: number,
  fallbackFee: number = 250,
  globalFreeThreshold?: number,
  globalMinFee?: number,
  globalMaxFee?: number
): CalculatedDeliveryFee {
  const effectiveAmount = Math.max(0, Number(orderSubtotal) || 0);

  // If subtotal is zero, no delivery charges
  if (effectiveAmount <= 0) {
    return {
      deliveryFee: 0,
      isFree: true,
      hasTiers: false
    };
  }

  // 1. Global free delivery threshold check (if order qualifies across the store)
  if (globalFreeThreshold && globalFreeThreshold > 0 && effectiveAmount >= globalFreeThreshold) {
    return {
      deliveryFee: 0,
      isFree: true,
      hasTiers: Boolean(city?.deliveryTiers && city.deliveryTiers.length > 0),
      tierDescription: `Free Delivery (Orders over PKR ${globalFreeThreshold.toLocaleString('en-PK')})`
    };
  }

  // 2. If no city record provided, fallback to site default delivery fee
  if (!city) {
    let defaultFee = Math.max(0, Number(fallbackFee) || 250);
    if (typeof globalMinFee === 'number' && globalMinFee >= 0) defaultFee = Math.max(defaultFee, globalMinFee);
    if (typeof globalMaxFee === 'number' && globalMaxFee > 0) defaultFee = Math.min(defaultFee, globalMaxFee);

    return {
      deliveryFee: defaultFee,
      isFree: defaultFee === 0,
      hasTiers: false,
      tierDescription: defaultFee === 0 ? 'Free Standard Delivery' : `Standard Delivery: PKR ${defaultFee.toLocaleString('en-PK')}`
    };
  }

  const isUnavailable = city.status === 'unavailable' || city.isEnabled === false;

  // 3. Optional City Rule Check:
  // If city is marked as optional and custom rules are turned off (useCustomRules === false), fall back to global fallback rate
  if (city.useCustomRules === false) {
    let defaultFee = Math.max(0, Number(fallbackFee) || 250);
    if (typeof globalMinFee === 'number' && globalMinFee >= 0) defaultFee = Math.max(defaultFee, globalMinFee);
    if (typeof globalMaxFee === 'number' && globalMaxFee > 0) defaultFee = Math.min(defaultFee, globalMaxFee);

    return {
      deliveryFee: defaultFee,
      isFree: defaultFee === 0,
      hasTiers: false,
      tierDescription: `Standard Flat Rate: PKR ${defaultFee.toLocaleString('en-PK')}`,
      isUnavailable
    };
  }

  // 4. City-specific Free Delivery Threshold check
  if (city.freeDeliveryThreshold && city.freeDeliveryThreshold > 0 && effectiveAmount >= city.freeDeliveryThreshold) {
    return {
      deliveryFee: 0,
      isFree: true,
      hasTiers: Boolean(city.deliveryTiers && city.deliveryTiers.length > 0),
      tierDescription: `${city.cityName}: FREE Delivery (Orders over PKR ${city.freeDeliveryThreshold.toLocaleString('en-PK')})`,
      isUnavailable
    };
  }

  // 5. City Free Delivery Flag
  if (city.freeDelivery || city.deliveryFeeType === 'free') {
    return {
      deliveryFee: 0,
      isFree: true,
      hasTiers: false,
      tierDescription: `${city.cityName}: FREE Delivery`,
      isUnavailable
    };
  }

  // 6. Check if City has active Order-Value Tiers
  const hasActiveTiers = city.deliveryFeeType === 'tiered' && Array.isArray(city.deliveryTiers) && city.deliveryTiers.length > 0;

  if (hasActiveTiers && city.deliveryTiers) {
    // Sort tiers by minimum amount ascending
    const sortedTiers = [...city.deliveryTiers].sort((a, b) => (a.minAmount || 0) - (b.minAmount || 0));

    // Find the matching tier for current subtotal
    let matchedTier: DeliveryFeeTier | undefined = sortedTiers.find((tier) => {
      const min = Number(tier.minAmount || 0);
      const max = tier.maxAmount !== null && tier.maxAmount !== undefined ? Number(tier.maxAmount) : null;

      if (max === null) {
        return effectiveAmount >= min;
      }
      return effectiveAmount >= min && effectiveAmount <= max;
    });

    // If order subtotal falls outside defined tiers (e.g. gaps or boundary):
    if (!matchedTier) {
      if (effectiveAmount < (sortedTiers[0].minAmount || 0)) {
        matchedTier = sortedTiers[0];
      } else {
        matchedTier = sortedTiers[sortedTiers.length - 1];
      }
    }

    if (matchedTier) {
      const isFree = Boolean(matchedTier.isFree || Number(matchedTier.fee) === 0);
      let calculatedFee = isFree ? 0 : Math.max(0, Number(matchedTier.fee) || 0);

      // Apply city minimum fee floor and maximum fee ceiling if defined
      if (!isFree) {
        if (typeof city.minFee === 'number' && city.minFee > 0) {
          calculatedFee = Math.max(calculatedFee, city.minFee);
        }
        if (typeof city.maxFee === 'number' && city.maxFee > 0) {
          calculatedFee = Math.min(calculatedFee, city.maxFee);
        }
      }

      // Check if there is a higher tier or threshold offering free delivery
      let nextFreeTierNotice: string | undefined;
      const freeTier = sortedTiers.find(
        (t) => (t.isFree || Number(t.fee) === 0) && (t.minAmount || 0) > effectiveAmount
      );

      if (freeTier && !isFree) {
        const remainingToFree = (freeTier.minAmount || 0) - effectiveAmount;
        if (remainingToFree > 0) {
          nextFreeTierNotice = `Add PKR ${remainingToFree.toLocaleString('en-PK')} more to get FREE Delivery in ${city.cityName}!`;
        }
      } else if (city.freeDeliveryThreshold && city.freeDeliveryThreshold > effectiveAmount && !isFree) {
        const remainingToFree = city.freeDeliveryThreshold - effectiveAmount;
        if (remainingToFree > 0) {
          nextFreeTierNotice = `Add PKR ${remainingToFree.toLocaleString('en-PK')} more to get FREE Delivery in ${city.cityName}!`;
        }
      }

      const rangeLabel = formatTierRange(matchedTier);
      const tierDescription = `${city.cityName} Tier (${rangeLabel}): ${isFree ? 'FREE Delivery' : `PKR ${calculatedFee.toLocaleString('en-PK')}`}`;

      return {
        deliveryFee: calculatedFee,
        isFree,
        matchedTier,
        tierDescription,
        nextFreeTierNotice,
        hasTiers: true,
        isUnavailable
      };
    }
  }

  // 7. Base / Flat fee calculation
  let flatFee = typeof city.baseFee === 'number' ? city.baseFee : (typeof city.deliveryFee === 'number' ? city.deliveryFee : fallbackFee);
  flatFee = Math.max(0, flatFee);

  // Apply City Min/Max bounds
  if (typeof city.minFee === 'number' && city.minFee > 0) {
    flatFee = Math.max(flatFee, city.minFee);
  }
  if (typeof city.maxFee === 'number' && city.maxFee > 0) {
    flatFee = Math.min(flatFee, city.maxFee);
  }

  // Apply Global Min/Max bounds if set
  if (typeof globalMinFee === 'number' && globalMinFee >= 0) {
    flatFee = Math.max(flatFee, globalMinFee);
  }
  if (typeof globalMaxFee === 'number' && globalMaxFee > 0) {
    flatFee = Math.min(flatFee, globalMaxFee);
  }

  // Check if there is a city free delivery threshold notice
  let nextFreeNotice: string | undefined;
  if (city.freeDeliveryThreshold && city.freeDeliveryThreshold > effectiveAmount && flatFee > 0) {
    const remainingToFree = city.freeDeliveryThreshold - effectiveAmount;
    if (remainingToFree > 0) {
      nextFreeNotice = `Add PKR ${remainingToFree.toLocaleString('en-PK')} more for FREE Delivery in ${city.cityName}!`;
    }
  }

  return {
    deliveryFee: flatFee,
    isFree: flatFee === 0,
    hasTiers: false,
    tierDescription: flatFee === 0 ? `${city.cityName}: FREE Delivery` : `${city.cityName}: PKR ${flatFee.toLocaleString('en-PK')}`,
    nextFreeTierNotice: nextFreeNotice,
    isUnavailable
  };
}
