import { Product, ProductCategory, ProductBrand } from '../types';

export interface NaturalQueryFilter {
  cleanKeywords: string[];
  maxPrice?: number;
  minPrice?: number;
  targetPrice?: number; // for "around 10000"
}

/**
 * Parses natural language price expressions like:
 * - "under 5000", "below 10000", "less than 15000"
 * - "around 10000", "approx 15k"
 * - "between 5000 and 15000"
 * - "10k basin", "shower around 15k"
 */
export function parseNaturalLanguageQuery(query: string): NaturalQueryFilter {
  const q = query.toLowerCase().trim();
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

  // Split remaining query string into tokens
  const cleanKeywords = cleanStr
    .split(/[\s,/-]+/)
    .map(k => k.trim())
    .filter(k => k.length > 0 && !['under', 'below', 'around', 'between', 'and', 'to', 'for', 'rs', 'pkr', 'price'].includes(k));

  return {
    cleanKeywords,
    maxPrice,
    minPrice,
    targetPrice
  };
}

/**
 * Extracts numeric value from product price string
 */
export function getNumericPrice(product: Product): number {
  if (product.salePrice) {
    const num = parseFloat(product.salePrice.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) return num;
  }
  if (product.price) {
    const num = parseFloat(product.price.replace(/[^0-9.]/g, ''));
    if (!isNaN(num) && num > 0) return num;
  }
  return 0;
}

/**
 * Filters products based on natural query, search fields, category, brand, material, color, size, price, etc.
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
): Product[] {
  if (!products || products.length === 0) return [];

  const parsedQuery = parseNaturalLanguageQuery(rawQuery);

  let result = products.filter(p => !p.isHidden);

  // Search Text matching across ALL fields
  if (parsedQuery.cleanKeywords.length > 0) {
    result = result.filter(p => {
      const pName = (p.name || '').toLowerCase();
      const pCategory = (p.category || '').toLowerCase();
      const pBrand = (p.brand || '').toLowerCase();
      const pDesc = (p.description || '').toLowerCase();
      const pShortDesc = (p.shortDescription || '').toLowerCase();
      const pSku = (p.sku || '').toLowerCase();
      const pMaterial = (p.material || '').toLowerCase();
      const pBadge = (p.badge || '').toLowerCase();
      const pFeatures = (p.features || []).join(' ').toLowerCase();
      const pTags = (p.tags || []).join(' ').toLowerCase();
      const pColors = (p.availableColors || []).join(' ').toLowerCase();
      const pFinishes = (p.availableFinishes || []).join(' ').toLowerCase();
      const pSizes = (p.availableSizes || []).join(' ').toLowerCase();
      const pSpecs = p.specs ? Object.entries(p.specs).map(([k, v]) => `${k} ${v}`).join(' ').toLowerCase() : '';

      const fullHaystack = `${pName} ${pCategory} ${pBrand} ${pDesc} ${pShortDesc} ${pSku} ${pMaterial} ${pBadge} ${pFeatures} ${pTags} ${pColors} ${pFinishes} ${pSizes} ${pSpecs}`;

      // Check if ALL keywords match or ANY keywords match
      return parsedQuery.cleanKeywords.every(kw => fullHaystack.includes(kw));
    });
  }

  // Natural Price bounds
  result = result.filter(p => {
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
    result = result.filter(p => p && (p.categoryId === filters.categoryId || (p.category && p.category.toLowerCase().includes(catIdLower))));
  }

  // Explicit Brand Filter
  if (filters.brandId && filters.brandId !== 'all') {
    const brandIdLower = filters.brandId.toLowerCase();
    result = result.filter(p => p && (p.brandId === filters.brandId || (p.brand && p.brand.toLowerCase() === brandIdLower)));
  }

  // Explicit Color Filter
  if (filters.color && filters.color !== 'all') {
    const cLower = filters.color.toLowerCase();
    result = result.filter(p => 
      (p.availableColors || []).some(c => c.toLowerCase().includes(cLower)) ||
      (p.availableFinishes || []).some(f => f.toLowerCase().includes(cLower))
    );
  }

  // Explicit Material Filter
  if (filters.material && filters.material !== 'all') {
    const mLower = filters.material.toLowerCase();
    result = result.filter(p => 
      (p.material && p.material.toLowerCase().includes(mLower)) ||
      (p.availableMaterials || []).some(m => m.toLowerCase().includes(mLower))
    );
  }

  // Explicit Size Filter
  if (filters.size && filters.size !== 'all') {
    const sLower = filters.size.toLowerCase();
    result = result.filter(p => (p.availableSizes || []).some(s => s.toLowerCase().includes(sLower)));
  }

  // Stock Status Filter
  if (filters.stockStatus && filters.stockStatus !== 'all') {
    result = result.filter(p => p.stockStatus === filters.stockStatus);
  }

  // Sorting
  if (filters.sortBy) {
    result = [...result].sort((a, b) => {
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
      return 0; // relevance default
    });
  }

  return result;
}
