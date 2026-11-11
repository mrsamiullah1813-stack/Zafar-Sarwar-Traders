/**
 * Zafar Sarwar Traders — Cement Minimum Order Quantity (MOQ) Rules Engine
 * 
 * Business Rules:
 * A. Chiniot City: 100 cement bags initial default (configurable).
 * B. Nearby Areas (~30–50 km from Chiniot): 300 cement bags initial default (configurable 200–300 bags).
 * C. Other / Farther Cities: 500 cement bags strict minimum.
 * 
 * Applies ONLY to cement products (Bestway, OPC, White Cement, Dandot, etc.).
 * Does NOT apply to sanitaryware, paints, water tanks, pipes, fittings, or other categories.
 */

import { Product, CartItem } from '../types';

export interface CementMoqSettings {
  isEnabled: boolean; // Master toggle for cement MOQ rules
  chiniotMinQuantity: number; // default: 100 bags
  nearbyZoneMinQuantity: number; // default: 300 bags (configurable 200-300)
  fartherZoneMinQuantity: number; // default: 500 bags
  nearbyCities: string[]; // List of city slugs or normalized city names in the nearby zone
  unitLabel: string; // "bags"
}

export type CementDeliveryZone = 'chiniot' | 'nearby' | 'farther';

export interface CementMoqInfo {
  isCement: boolean;
  zone: CementDeliveryZone;
  zoneName: string;
  minQuantity: number;
  cityName: string;
  unitLabel: string;
  badgeText: string;
  descriptionText: string;
}

export interface CementValidationResult {
  isValid: boolean;
  hasCement: boolean;
  totalCementQuantity: number;
  requiredMinQuantity: number;
  deficitQuantity: number;
  zone: CementDeliveryZone;
  zoneName: string;
  cityName: string;
  unitLabel: string;
  errorMessage?: string;
  cementItems: Array<{
    productId: string;
    productName: string;
    quantity: number;
  }>;
  cementItemCount?: number;
  requiredMoq?: number;
}

// Default list of nearby cities and tehsils approximately 30-50 km from Chiniot showroom
export const DEFAULT_NEARBY_CEMENT_CITIES: string[] = [
  // Immediate tehsils & close neighbors (~10-40 km)
  'chenab nagar',
  'rabwah',
  'bhowana',
  'lalian',
  'chak jhumra',
  'pindi bhattian',
  'sukheke',
  'sukheke mandi',
  'sangla hill',
  'shahkot',
  // Neighboring major industrial/market districts (~30-50 km)
  'faisalabad',
  'khurrianwala',
  'sargodha',
  'silanwali',
  'jhang',
  'hafizabad',
  'jaranwala',
  'gojra'
];

export const defaultCementMoqSettings: CementMoqSettings = {
  isEnabled: true,
  chiniotMinQuantity: 100, // Chiniot city: 100 bags
  nearbyZoneMinQuantity: 300, // Nearby ~30-50 km: 300 bags (configurable 200-300)
  fartherZoneMinQuantity: 500, // Other / farther cities: 500 bags
  nearbyCities: DEFAULT_NEARBY_CEMENT_CITIES,
  unitLabel: 'bags'
};

/**
 * Checks whether a given product is a cement product.
 * Strictly distinguishes building cement (OPC, SRC, Bestway, White Cement, etc.)
 * from plumbing PVC solvent cement or paint additives.
 */
export function isCementProduct(
  product: Product | { category?: string; categoryId?: string; name?: string; id?: string } | null | undefined
): boolean {
  if (!product) return false;

  const cat = (product.category || '').toLowerCase().trim();
  const catId = (product.categoryId || '').toLowerCase().trim();
  const name = (product.name || '').toLowerCase().trim();

  // Exclude PVC / CPVC pipe solvent cement, glues, adhesives
  if (
    name.includes('solvent cement') ||
    name.includes('pvc solvent') ||
    name.includes('cpvc solvent') ||
    name.includes('pipe cement') ||
    name.includes('glue') ||
    name.includes('adhesive')
  ) {
    return false;
  }

  // 1. Direct category match
  if (catId === 'cement' || cat === 'cement' || catId === 'cat-1787133942640') {
    return true;
  }

  // 2. Name contains cement brands or types
  const cementKeywords = [
    'portland cement',
    'best way cement',
    'bestway cement',
    'white cement',
    'dandot cement',
    'dg cement',
    'maple leaf cement',
    'lucky cement',
    'fauji cement',
    'askari cement',
    'pioneer cement',
    'power cement',
    'kohat cement',
    'cherat cement',
    'flying cement',
    'opc grade',
    'src cement',
    'grade 53 cement',
    'cement bag'
  ];

  if (cementKeywords.some(kw => name.includes(kw))) {
    return true;
  }

  // 3. Category contains cement (and not plumbing accessories)
  if (cat.includes('cement') && !cat.includes('plumbing') && !cat.includes('accessories')) {
    return true;
  }

  // 4. Standalone "cement" word in product name under materials/building supply
  if (/\bcement\b/i.test(name) && !name.includes('solvent')) {
    return true;
  }

  return false;
}

/**
 * Normalizes city names for reliable matching regardless of punctuation/spaces.
 */
export function normalizeCityName(city: string | null | undefined): string {
  if (!city) return '';
  return city
    .toLowerCase()
    .replace(/^city-/, '')
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Determines the applicable cement delivery zone for a selected city:
 * - 'chiniot': Chiniot city & core local area
 * - 'nearby': Nearby delivery areas ~30-50 km from Chiniot
 * - 'farther': All other / farther cities across Pakistan
 */
export function getCementDeliveryZone(
  cityNameOrId: string | null | undefined,
  settings: CementMoqSettings = defaultCementMoqSettings
): CementDeliveryZone {
  const norm = normalizeCityName(cityNameOrId);
  if (!norm) return 'chiniot'; // Default to origin if unspecified

  // 1. Chiniot City Zone
  if (norm === 'chiniot' || norm.includes('chiniot city') || norm.startsWith('chiniot')) {
    return 'chiniot';
  }

  // 2. Nearby Delivery Zone (~30–50 km from Chiniot)
  const nearbyList = Array.isArray(settings?.nearbyCities) && settings.nearbyCities.length > 0
    ? settings.nearbyCities
    : DEFAULT_NEARBY_CEMENT_CITIES;

  const isNearby = nearbyList.some(nearbyCandidate => {
    const normNearby = normalizeCityName(nearbyCandidate);
    if (!normNearby) return false;
    return norm === normNearby || norm.includes(normNearby) || normNearby.includes(norm);
  });

  if (isNearby) {
    return 'nearby';
  }

  // 3. Farther Cities across Pakistan
  return 'farther';
}

/**
 * Gets the minimum order quantity (MOQ) and details for a selected delivery city.
 */
export function getCementMoqForCity(
  cityNameOrId: string | null | undefined,
  settings: CementMoqSettings = defaultCementMoqSettings,
  product?: Product
): CementMoqInfo {
  const isCement = product ? isCementProduct(product) : true;
  const rawCity = cityNameOrId && cityNameOrId.trim() ? cityNameOrId.trim() : 'Chiniot';
  const cleanCity = rawCity.replace(/^city-/, '').replace(/-/g, ' ');
  const displayCity = cleanCity.charAt(0).toUpperCase() + cleanCity.slice(1);

  if (!settings.isEnabled || !isCement) {
    return {
      isCement,
      zone: 'chiniot',
      zoneName: 'Standard',
      minQuantity: 1,
      cityName: displayCity,
      unitLabel: 'units',
      badgeText: 'Standard Delivery',
      descriptionText: 'Standard order quantities apply.'
    };
  }

  const zone = getCementDeliveryZone(cityNameOrId, settings);

  if (zone === 'chiniot') {
    const minQty = Math.max(1, settings.chiniotMinQuantity || 100);
    return {
      isCement: true,
      zone: 'chiniot',
      zoneName: 'Chiniot Local Zone',
      minQuantity: minQty,
      cityName: displayCity,
      unitLabel: settings.unitLabel || 'bags',
      badgeText: `Chiniot Minimum: ${minQty} bags`,
      descriptionText: `Direct delivery within Chiniot city: Minimum order of ${minQty} bags.`
    };
  }

  if (zone === 'nearby') {
    // Configurable between 200 and 300 bags (initial default: 300)
    const rawNearby = settings.nearbyZoneMinQuantity || 300;
    const minQty = Math.min(300, Math.max(200, rawNearby));
    return {
      isCement: true,
      zone: 'nearby',
      zoneName: 'Nearby Delivery Zone (~30–50 km)',
      minQuantity: minQty,
      cityName: displayCity,
      unitLabel: settings.unitLabel || 'bags',
      badgeText: `Nearby Zone Minimum: ${minQty} bags`,
      descriptionText: `Dedicated truck delivery to ${displayCity} and nearby areas (~30–50 km): Minimum order of ${minQty} bags.`
    };
  }

  // Farther Zone (Outside nearby radius) -> 500 bags strict minimum
  const minQty = Math.max(500, settings.fartherZoneMinQuantity || 500);
  return {
    isCement: true,
    zone: 'farther',
    zoneName: 'Farther Cities Nationwide',
    minQuantity: minQty,
    cityName: displayCity,
    unitLabel: settings.unitLabel || 'bags',
    badgeText: `Nationwide Minimum: ${minQty} bags`,
    descriptionText: `Long-distance flatbed freight to ${displayCity}: Minimum order of ${minQty} bags required.`
  };
}

/**
 * Validates cart items for cement MOQ compliance.
 * Computes total cement quantity across all cement items in the cart
 * and compares it against the required MOQ for the destination city.
 */
export function validateCementCart(
  items: CartItem[] | Array<{ product?: Product; productId?: string; productName?: string; quantity?: number }>,
  cityNameOrId: string | null | undefined,
  settings: CementMoqSettings = defaultCementMoqSettings
): CementValidationResult {
  const safeItems = Array.isArray(items) ? items : [];
  const cementItems: Array<{ productId: string; productName: string; quantity: number }> = [];
  let totalCementQuantity = 0;

  for (const item of safeItems) {
    const prod = (item as any).product || {
      id: (item as any).productId || (item as any).id,
      name: (item as any).productName || (item as any).name,
      category: (item as any).category,
      categoryId: (item as any).categoryId
    };

    if (isCementProduct(prod)) {
      const qty = Math.max(0, parseInt(String((item as any).quantity || '0'), 10) || 0);
      cementItems.push({
        productId: String(prod.id || ''),
        productName: String(prod.name || 'Cement'),
        quantity: qty
      });
      totalCementQuantity += qty;
    }
  }

  const hasCement = cementItems.length > 0;
  const moqInfo = getCementMoqForCity(cityNameOrId, settings);

  if (!settings.isEnabled || !hasCement) {
    return {
      isValid: true,
      hasCement,
      totalCementQuantity,
      cementItemCount: totalCementQuantity,
      requiredMinQuantity: 1,
      requiredMoq: 1,
      deficitQuantity: 0,
      zone: moqInfo.zone,
      zoneName: moqInfo.zoneName,
      cityName: moqInfo.cityName,
      unitLabel: moqInfo.unitLabel,
      cementItems
    };
  }

  const requiredMinQuantity = moqInfo.minQuantity;
  const isValid = totalCementQuantity >= requiredMinQuantity;
  const deficitQuantity = Math.max(0, requiredMinQuantity - totalCementQuantity);

  let errorMessage: string | undefined = undefined;
  if (!isValid) {
    errorMessage = `Cement order requires a minimum of ${requiredMinQuantity} bags for delivery to ${moqInfo.cityName} (${moqInfo.zoneName}). Your cart currently has ${totalCementQuantity} bag${totalCementQuantity === 1 ? '' : 's'} (deficit of ${deficitQuantity} bags). Please increase your quantity to proceed.`;
  }

  return {
    isValid,
    hasCement: true,
    totalCementQuantity,
    cementItemCount: totalCementQuantity,
    requiredMinQuantity,
    requiredMoq: requiredMinQuantity,
    deficitQuantity,
    zone: moqInfo.zone,
    zoneName: moqInfo.zoneName,
    cityName: moqInfo.cityName,
    unitLabel: moqInfo.unitLabel,
    errorMessage,
    cementItems
  };
}
