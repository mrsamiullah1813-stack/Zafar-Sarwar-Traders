import { Product, ProductCategory, ProductBrand } from '../types';
import { parseNumericPrice } from './pricingUtils';

export interface NaturalQueryFilter {
  rawQuery: string;
  normalizedQuery: string;
  cleanKeywords: string[];
  maxPrice?: number;
  minPrice?: number;
  targetPrice?: number; // for "around 10000"
  unitTokens: string[];
}

export interface ProductOptionItem {
  label: string;
  normalized: string;
  type: 'variant' | 'size' | 'capacity' | 'color' | 'shade' | 'material' | 'model' | 'spec';
  sku?: string;
  code?: string;
  price?: string | number;
}

export interface ProductWithMatchDetails extends Product {
  matchedVariants?: string[];
  matchedHighlight?: string;
  matchScore?: number;
  allDisplayOptions?: string[];
}

/**
 * Normalizes query string and unit contractions (e.g. 32mm -> 32 mm, 1" -> 1 inch, 16L -> 16 liter)
 */
export function normalizeSearchString(text: string): string {
  if (!text) return '';
  let str = text.toLowerCase().trim();

  // Normalize quotes and inch symbols
  str = str.replace(/(\d+(?:\/\d+)?)\s*(?:["”″]|inch(?:es)?|in\b)/gi, '$1 inch');
  
  // Normalize millimeters: 32mm -> 32 mm
  str = str.replace(/(\d+(?:\.\d+)?)\s*mm\b/gi, '$1 mm');
  
  // Normalize centimeters: 25cm -> 25 cm
  str = str.replace(/(\d+(?:\.\d+)?)\s*cm\b/gi, '$1 cm');
  
  // Normalize meters: 2m -> 2 meter
  str = str.replace(/(\d+(?:\.\d+)?)\s*(?:meter(?:s)?|mtr(?:s)?|m\b)/gi, '$1 meter');
  
  // Normalize Liters / Litres / L / Ltr: 16l, 16ltr, 16liters -> 16 liter
  str = str.replace(/(\d+(?:\.\d+)?)\s*(?:liter(?:s)?|litre(?:s)?|ltr(?:s)?|l\b)/gi, '$1 liter');
  
  // Normalize Gallons: 1gal -> 1 gallon
  str = str.replace(/(\d+(?:\.\d+)?)\s*(?:gallon(?:s)?|gal\b)/gi, '$1 gallon');

  // Normalize Kilograms: 50kg -> 50 kg
  str = str.replace(/(\d+(?:\.\d+)?)\s*(?:kg|kilogram(?:s)?)\b/gi, '$1 kg');

  // Normalize Watts: 1000w -> 1000 watt
  str = str.replace(/(\d+(?:\.\d+)?)\s*(?:watt(?:s)?|w\b)/gi, '$1 watt');

  // Normalize Horsepower: 1hp -> 1 hp
  str = str.replace(/(\d+(?:\.\d+)?)\s*hp\b/gi, '$1 hp');

  // Normalize extra spacing
  return str.replace(/\s+/g, ' ').trim();
}

/**
 * Parses natural language price expressions and search terms
 */
export function parseNaturalLanguageQuery(query: string): NaturalQueryFilter {
  const rawQuery = (query || '').trim();
  const q = rawQuery.toLowerCase();
  let cleanStr = q;
  let maxPrice: number | undefined = undefined;
  let minPrice: number | undefined = undefined;
  let targetPrice: number | undefined = undefined;

  // Helper to convert "10k" -> 10000
  const parseAmount = (valStr: string): number | undefined => {
    if (!valStr) return undefined;
    const clean = valStr.trim();
    if (clean.endsWith('k')) {
      const num = parseFloat(clean.replace('k', ''));
      return !isNaN(num) ? num * 1000 : undefined;
    }
    const num = parseFloat(clean.replace(/,/g, ''));
    return !isNaN(num) ? num : undefined;
  };

  // 1. "between X and Y" / "X to Y"
  const betweenMatch = q.match(/between\s+([\d,k]+)\s+and\s+([\d,k]+)/i) || q.match(/([\d,k]+)\s*to\s*([\d,k]+)/i);
  if (betweenMatch) {
    const min = parseAmount(betweenMatch[1]);
    const max = parseAmount(betweenMatch[2]);
    if (min !== undefined && max !== undefined) {
      minPrice = Math.min(min, max);
      maxPrice = Math.max(min, max);
      cleanStr = cleanStr.replace(betweenMatch[0], '');
    }
  }

  // 2. "under X", "below X", "less than X", "< X"
  if (maxPrice === undefined) {
    const underMatch = q.match(/(under|below|less than|max)\s+([\d,k]+)/i);
    if (underMatch) {
      maxPrice = parseAmount(underMatch[2]);
      if (maxPrice !== undefined) {
        cleanStr = cleanStr.replace(underMatch[0], '');
      }
    }
  }

  // 3. "above X", "over X", "more than X", "> X"
  if (minPrice === undefined) {
    const aboveMatch = q.match(/(above|over|more than|min)\s+([\d,k]+)/i);
    if (aboveMatch) {
      minPrice = parseAmount(aboveMatch[2]);
      if (minPrice !== undefined) {
        cleanStr = cleanStr.replace(aboveMatch[0], '');
      }
    }
  }

  // 4. "around X", "approx X", "about X"
  if (targetPrice === undefined && maxPrice === undefined && minPrice === undefined) {
    const aroundMatch = q.match(/(around|approx|about|~)\s*([\d,k]+)/i);
    if (aroundMatch) {
      targetPrice = parseAmount(aroundMatch[2]);
      if (targetPrice !== undefined) {
        cleanStr = cleanStr.replace(aroundMatch[0], '');
      }
    }
  }

  // 5. Bare "10k" pattern inside query like "10k basin" or "shower 15k"
  if (maxPrice === undefined && targetPrice === undefined && minPrice === undefined) {
    const bareKMatch = q.match(/(\d+)k\b/i);
    if (bareKMatch) {
      targetPrice = parseAmount(bareKMatch[0]);
      if (targetPrice !== undefined) {
        cleanStr = cleanStr.replace(bareKMatch[0], '');
      }
    }
  }

  const normalizedQuery = normalizeSearchString(cleanStr);

  // Extract unit-specific tokens (e.g. "32 mm", "1/2 inch", "16 liter")
  const unitTokens: string[] = [];
  const unitRegexes = [
    /\b\d+(?:\.\d+)?\s*mm\b/gi,
    /\b\d+(?:\/\d+)?\s*inch\b/gi,
    /\b\d+(?:\.\d+)?\s*liter\b/gi,
    /\b\d+(?:\.\d+)?\s*gallon\b/gi,
    /\b\d+(?:\.\d+)?\s*meter\b/gi,
    /\b\d+(?:\.\d+)?\s*kg\b/gi,
    /\b\d+(?:\.\d+)?\s*hp\b/gi,
    /\b\d+(?:\.\d+)?\s*watt\b/gi,
  ];

  unitRegexes.forEach(rgx => {
    const matches = normalizedQuery.match(rgx);
    if (matches) {
      matches.forEach(m => unitTokens.push(m.toLowerCase().trim()));
    }
  });

  // Split remaining query string into tokens
  const cleanKeywords = normalizedQuery
    .split(/[\s,/-]+/)
    .map(k => k.trim())
    .filter(k => k.length > 0 && !['under', 'below', 'around', 'between', 'and', 'to', 'for', 'rs', 'pkr', 'price', 'with', 'in', 'of', 'the', 'a', 'an'].includes(k));

  return {
    rawQuery,
    normalizedQuery,
    cleanKeywords,
    maxPrice,
    minPrice,
    targetPrice,
    unitTokens
  };
}

/**
 * Extracts numeric value from product price string
 */
export function getNumericPrice(product: Product): number {
  if (product.salePrice) {
    const num = parseNumericPrice(product.salePrice);
    if (!isNaN(num) && num > 0) return num;
  }
  if (product.price) {
    const num = parseNumericPrice(product.price);
    if (!isNaN(num) && num > 0) return num;
  }
  return 0;
}

/**
 * Extracts all searchable variants, sizes, capacities, models, shades, and specs from a product
 */
export function extractProductOptions(product: Product): ProductOptionItem[] {
  if (!product) return [];
  const options: ProductOptionItem[] = [];
  const seenLabels = new Set<string>();

  const addOption = (label: string | undefined | null, type: ProductOptionItem['type'], extra?: { sku?: string; code?: string; price?: string | number }) => {
    if (!label) return;
    const cleanLabel = String(label).trim();
    if (!cleanLabel) return;
    const key = `${type}:${cleanLabel.toLowerCase()}`;
    if (seenLabels.has(key)) return;
    seenLabels.add(key);

    options.push({
      label: cleanLabel,
      normalized: normalizeSearchString(cleanLabel),
      type,
      sku: extra?.sku,
      code: extra?.code,
      price: extra?.price
    });
  };

  // 1. Configured & Active Variants (variantsList or variantsConfig.variants)
  const variants = product.variantsList || product.variantsConfig?.variants || [];
  if (Array.isArray(variants)) {
    variants.forEach(v => {
      if (v && v.name && v.isActive !== false) {
        addOption(v.name, 'variant', { sku: v.sku, price: v.salePrice || v.price });
      }
    });
  }

  // 2. availableSizes
  if (Array.isArray(product.availableSizes)) {
    product.availableSizes.forEach(s => addOption(s, 'size'));
  }

  // 3. availableVariants
  if (Array.isArray(product.availableVariants)) {
    product.availableVariants.forEach(v => addOption(v, 'variant'));
  }

  // 4. availableColors
  if (Array.isArray(product.availableColors)) {
    product.availableColors.forEach(c => addOption(c, 'color'));
  }

  // 5. availableFinishes
  if (Array.isArray(product.availableFinishes)) {
    product.availableFinishes.forEach(f => addOption(f, 'spec'));
  }

  // 6. availableMaterials
  if (Array.isArray(product.availableMaterials)) {
    product.availableMaterials.forEach(m => addOption(m, 'material'));
  }

  // 7. Paint Shades (shadesList or paintShadesConfig.shades)
  const shades = product.shadesList || product.paintShadesConfig?.shades || [];
  if (Array.isArray(shades)) {
    shades.forEach(s => {
      if (s && s.isActive !== false) {
        if (s.name) addOption(s.name, 'shade', { code: s.code });
        if (s.code) addOption(`Code: ${s.code}`, 'shade', { code: s.code });
      }
    });
  }

  // 8. specs (e.g. Size, Capacity, Model, Dimensions)
  if (product.specs && typeof product.specs === 'object') {
    Object.entries(product.specs).forEach(([k, val]) => {
      if (val && typeof val === 'string') {
        addOption(val, 'spec');
      }
    });
  }

  return options;
}

/**
 * Checks a product against a search query, matching its name, variants, sizes, colors, capacities, etc.
 * Computes relevance score and extracts matched variant labels.
 */
export function matchProductWithVariants(
  product: Product,
  parsedQuery: NaturalQueryFilter
): {
  matched: boolean;
  score: number;
  matchedVariants: string[];
  allDisplayOptions: string[];
  highlightMessage?: string;
} {
  const options = extractProductOptions(product);
  const allDisplayOptions = options.map(o => o.label);

  if (parsedQuery.cleanKeywords.length === 0) {
    return {
      matched: true,
      score: 100,
      matchedVariants: [],
      allDisplayOptions,
      highlightMessage: allDisplayOptions.length > 0 
        ? `${allDisplayOptions.slice(0, 4).join(', ')}${allDisplayOptions.length > 4 ? ` +${allDisplayOptions.length - 4} more` : ''}`
        : undefined
    };
  }

  const pName = (product.name || '').toLowerCase();
  const pNormalizedName = normalizeSearchString(product.name || '');
  const pCategory = (product.category || '').toLowerCase();
  const pBrand = (product.brand || '').toLowerCase();
  const pDesc = (product.description || '').toLowerCase();
  const pShortDesc = (product.shortDescription || '').toLowerCase();
  const pSku = (product.sku || '').toLowerCase();
  const pMaterial = (product.material || '').toLowerCase();
  const pFeatures = (product.features || []).join(' ').toLowerCase();
  const pTags = (product.tags || []).join(' ').toLowerCase();
  const pOptionName = (product.optionName || product.variantsConfig?.optionName || '').toLowerCase();

  // Combine product-level textual content
  const productTextHaystack = `${pName} ${pNormalizedName} ${pCategory} ${pBrand} ${pDesc} ${pShortDesc} ${pSku} ${pMaterial} ${pFeatures} ${pTags} ${pOptionName}`;

  // Find matching options / variants
  const matchedOptionItems: ProductOptionItem[] = [];

  options.forEach(opt => {
    const optText = `${opt.label} ${opt.normalized} ${opt.sku || ''} ${opt.code || ''}`.toLowerCase();
    
    // Check unit tokens (e.g. "32 mm", "1 inch", "16 liter")
    const unitMatch = parsedQuery.unitTokens.some(ut => {
      const normUt = normalizeSearchString(ut);
      return optText.includes(ut) || optText.includes(normUt) || opt.normalized.includes(normUt);
    });

    // Check individual keywords
    const kwMatch = parsedQuery.cleanKeywords.some(kw => {
      if (kw.length <= 1) return false;
      return optText.includes(kw) || opt.normalized.includes(kw);
    });

    if (unitMatch || kwMatch) {
      matchedOptionItems.push(opt);
    }
  });

  const matchedVariants = Array.from(new Set(matchedOptionItems.map(o => o.label)));

  // Combine full haystack including all variant labels
  const optionsHaystack = options.map(o => `${o.label} ${o.normalized} ${o.sku || ''} ${o.code || ''}`).join(' ').toLowerCase();
  const fullHaystack = `${productTextHaystack} ${optionsHaystack}`;

  // Verify all keywords are present somewhere in the product or its options
  const allKeywordsPresent = parsedQuery.cleanKeywords.every(kw => {
    // Check direct substring
    if (fullHaystack.includes(kw)) return true;
    // Check with normalized variation (e.g. 32mm vs 32 mm)
    const normKw = normalizeSearchString(kw);
    if (fullHaystack.includes(normKw)) return true;
    return false;
  });

  if (!allKeywordsPresent) {
    return {
      matched: false,
      score: 0,
      matchedVariants: [],
      allDisplayOptions
    };
  }

  // Calculate smart relevance score
  let score = 200;

  // Exact phrase matching on product name
  if (pName === parsedQuery.rawQuery.toLowerCase() || pNormalizedName === parsedQuery.normalizedQuery) {
    score += 1000;
  } else if (pName.includes(parsedQuery.rawQuery.toLowerCase()) || pNormalizedName.includes(parsedQuery.normalizedQuery)) {
    score += 600;
  }

  // Exact Product Name + Variant Combination (e.g. "32 mm elbow" or "16 liter paint")
  if (matchedVariants.length > 0) {
    // If the query contains BOTH product name words AND variant matches
    const nameMatchCount = parsedQuery.cleanKeywords.filter(kw => pName.includes(kw) || pCategory.includes(kw)).length;
    if (nameMatchCount > 0) {
      score += 800 + (nameMatchCount * 100);
    } else {
      score += 400;
    }
  }

  // Category / Brand match
  if (pCategory.includes(parsedQuery.rawQuery.toLowerCase())) score += 300;
  if (pBrand && pBrand.includes(parsedQuery.rawQuery.toLowerCase())) score += 250;

  // Features / Tags / SKU exact match
  if (pSku && pSku === parsedQuery.rawQuery.toLowerCase()) score += 700;

  // Boost popular / best-selling items slightly for tie-breaking
  if (product.isBestSeller) score += 20;
  if (product.isFeatured) score += 15;

  // Format highlight message
  let highlightMessage: string | undefined = undefined;
  if (matchedVariants.length === 1) {
    highlightMessage = `${matchedVariants[0]} Available`;
  } else if (matchedVariants.length > 1) {
    if (matchedVariants.length <= 3) {
      highlightMessage = `${matchedVariants.join(', ')} Available`;
    } else {
      highlightMessage = `Available sizes: ${matchedVariants.slice(0, 3).join(', ')} +${matchedVariants.length - 3} more`;
    }
  } else if (allDisplayOptions.length > 0) {
    highlightMessage = `${allDisplayOptions.slice(0, 3).join(', ')}${allDisplayOptions.length > 3 ? ` (+${allDisplayOptions.length - 3} sizes)` : ''}`;
  }

  return {
    matched: true,
    score,
    matchedVariants,
    allDisplayOptions,
    highlightMessage
  };
}

/**
 * Filters and ranks products based on natural query, variants/sizes, category, brand, material, color, size, price, etc.
 * Returns products with attached matching details.
 */
export function filterProducts(
  products: Product[],
  rawQuery: string,
  filters: {
    categoryId?: string;
    brandId?: string;
    material?: string;
    color?: string;
    size?: string;
    quality?: string;
    stockStatus?: string;
    minPrice?: number;
    maxPrice?: number;
    sortBy?: 'relevance' | 'price_asc' | 'price_desc' | 'newest' | 'popular' | 'featured';
  }
): ProductWithMatchDetails[] {
  if (!products || products.length === 0) return [];

  const parsedQuery = parseNaturalLanguageQuery(rawQuery);
  const activeProducts = products.filter(p => !p.isHidden);

  // Match products against search text & variants
  let scoredResults: ProductWithMatchDetails[] = [];

  for (const product of activeProducts) {
    const matchInfo = matchProductWithVariants(product, parsedQuery);
    if (!matchInfo.matched) continue;

    scoredResults.push({
      ...product,
      matchedVariants: matchInfo.matchedVariants,
      matchedHighlight: matchInfo.highlightMessage,
      matchScore: matchInfo.score,
      allDisplayOptions: matchInfo.allDisplayOptions
    });
  }

  // Natural Price bounds
  scoredResults = scoredResults.filter(p => {
    const price = getNumericPrice(p);
    if (price === 0) return true; // Keep price-on-request unless strict bound applied

    if (parsedQuery.maxPrice !== undefined && price > parsedQuery.maxPrice) {
      return false;
    }
    if (parsedQuery.minPrice !== undefined && price < parsedQuery.minPrice) {
      return false;
    }
    if (parsedQuery.targetPrice !== undefined) {
      // Around target +/- 30%
      const lowerBound = parsedQuery.targetPrice * 0.7;
      const upperBound = parsedQuery.targetPrice * 1.3;
      if (price < lowerBound || price > upperBound) return false;
    }

    // Explicit Filter price bounds
    if (filters.minPrice !== undefined && price < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && price > filters.maxPrice) return false;

    return true;
  });

  // Explicit Category Filter
  if (filters.categoryId && filters.categoryId !== 'all') {
    const catIdLower = filters.categoryId.toLowerCase();
    scoredResults = scoredResults.filter(p => p && (p.categoryId === filters.categoryId || (p.category && p.category.toLowerCase().includes(catIdLower))));
  }

  // Explicit Brand Filter
  if (filters.brandId && filters.brandId !== 'all') {
    const brandIdLower = filters.brandId.toLowerCase();
    scoredResults = scoredResults.filter(p => p && (p.brandId === filters.brandId || (p.brand && p.brand.toLowerCase() === brandIdLower)));
  }

  // Explicit Color Filter
  if (filters.color && filters.color !== 'all') {
    const cLower = filters.color.toLowerCase();
    scoredResults = scoredResults.filter(p => {
      const options = extractProductOptions(p);
      return options.some(o => (o.type === 'color' || o.type === 'shade') && o.label.toLowerCase().includes(cLower)) ||
        (p.availableColors || []).some(c => c.toLowerCase().includes(cLower)) ||
        (p.availableFinishes || []).some(f => f.toLowerCase().includes(cLower));
    });
  }

  // Explicit Material Filter
  if (filters.material && filters.material !== 'all') {
    const mLower = filters.material.toLowerCase();
    scoredResults = scoredResults.filter(p => 
      (p.material && p.material.toLowerCase().includes(mLower)) ||
      (p.availableMaterials || []).some(m => m.toLowerCase().includes(mLower))
    );
  }

  // Explicit Size Filter
  if (filters.size && filters.size !== 'all') {
    const sLower = normalizeSearchString(filters.size);
    scoredResults = scoredResults.filter(p => {
      const options = extractProductOptions(p);
      return options.some(o => o.normalized.includes(sLower) || o.label.toLowerCase().includes(filters.size!.toLowerCase()));
    });
  }

  // Stock Status Filter
  if (filters.stockStatus && filters.stockStatus !== 'all') {
    scoredResults = scoredResults.filter(p => p.stockStatus === filters.stockStatus);
  }

  // Sorting
  if (filters.sortBy) {
    scoredResults = [...scoredResults].sort((a, b) => {
      if (filters.sortBy === 'price_asc') {
        return getNumericPrice(a) - getNumericPrice(b);
      }
      if (filters.sortBy === 'price_desc') {
        return getNumericPrice(b) - getNumericPrice(a);
      }
      if (filters.sortBy === 'newest') {
        return (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0);
      }
      if (filters.sortBy === 'popular') {
        return (b.isBestSeller ? 1 : 0) - (a.isBestSeller ? 1 : 0);
      }
      if (filters.sortBy === 'featured') {
        return (b.isFeatured ? 1 : 0) - (a.isFeatured ? 1 : 0);
      }
      // Default: relevance by matchScore
      return (b.matchScore || 0) - (a.matchScore || 0);
    });
  }

  return scoredResults;
}

/**
 * Generates instant search suggestions including categories, brands, direct products, and variant-matched products
 */
export function getInstantSearchSuggestions(
  query: string,
  products: Product[],
  categories: ProductCategory[],
  brands: ProductBrand[]
): {
  title: string;
  subtitle?: string;
  type: 'product' | 'category' | 'brand' | 'variant';
  matchedVariant?: string;
  target?: any;
}[] {
  if (!query || query.trim().length < 2) return [];

  const rawQ = query.trim();
  const parsed = parseNaturalLanguageQuery(rawQ);
  const q = parsed.normalizedQuery;
  const results: {
    title: string;
    subtitle?: string;
    type: 'product' | 'category' | 'brand' | 'variant';
    matchedVariant?: string;
    target?: any;
  }[] = [];

  const seenKeys = new Set<string>();

  // 1. Categories
  categories.forEach(c => {
    if (c.name.toLowerCase().includes(q) || c.name.toLowerCase().includes(rawQ.toLowerCase())) {
      const key = `cat:${c.id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        results.push({
          title: c.name,
          subtitle: `${c.itemCount || 0} items in Category`,
          type: 'category',
          target: c
        });
      }
    }
  });

  // 2. Brands
  brands.forEach(b => {
    if (b.name.toLowerCase().includes(q) || b.name.toLowerCase().includes(rawQ.toLowerCase())) {
      const key = `brand:${b.id}`;
      if (!seenKeys.has(key)) {
        seenKeys.add(key);
        results.push({
          title: b.name,
          subtitle: 'Official Brand Partner',
          type: 'brand',
          target: b
        });
      }
    }
  });

  // 3. Products & Matching Variants
  const activeProducts = products.filter(p => !p.isHidden);
  for (const product of activeProducts) {
    if (results.length >= 10) break;

    const matchInfo = matchProductWithVariants(product, parsed);
    if (!matchInfo.matched) continue;

    const key = `prod:${product.id}`;
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);

    let title = product.name;
    let subtitle = product.category;

    if (matchInfo.matchedVariants.length > 0) {
      // E.g. "Elbow — 32 mm Available" or "Primax Paint — 16 Liter Available"
      const variantText = matchInfo.matchedVariants.slice(0, 2).join(', ');
      title = `${product.name} — ${variantText} Available`;
      subtitle = `✓ ${matchInfo.matchedVariants.join(', ')} • ${product.category}`;
      results.push({
        title,
        subtitle,
        type: 'variant',
        matchedVariant: variantText,
        target: product
      });
    } else {
      results.push({
        title: product.name,
        subtitle: product.category,
        type: 'product',
        target: product
      });
    }
  }

  return results.slice(0, 8);
}

