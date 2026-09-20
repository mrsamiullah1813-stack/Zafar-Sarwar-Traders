import React from 'react';

// Highly reliable, verified high-resolution fallback images for each category
export const CATEGORY_FALLBACK_IMAGES: Record<string, string> = {
  // Sanitaryware & Showers
  shower: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
  sanitary: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
  faucet: 'https://images.unsplash.com/photo-1585909692994-394e33917d0d?auto=format&fit=crop&w=800&q=80',
  basin: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80',
  sink: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80',
  commode: 'https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&w=800&q=80',
  toilet: 'https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&w=800&q=80',
  pan: 'https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&w=800&q=80',
  vanity: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
  mirror: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80',

  // Plumbing, Pipes & Water Systems
  pipe: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80',
  plumbing: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80',
  pprc: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80',
  pvc: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80',
  cpvc: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80',
  tank: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80',
  pump: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',

  // Building Materials, Concrete & Construction
  cement: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
  sand: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80',
  crush: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80',
  bajri: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80',
  aggregate: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80',
  tilebond: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=800&q=80',
  adhesive: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=800&q=80',
  material: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=800&q=80',
  steel: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',

  // Paints & Coatings
  paint: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80',
  primer: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80',
  enamel: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80',
  emulsion: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80',
  weathercare: 'https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80',

  // Home & Kitchen Appliances
  appliance: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
  stove: 'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80',
  geyser: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80',

  // Default fallback
  default: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80'
};

/**
 * Returns a category-smart fallback image URL based on category or name keywords.
 */
export function getCategoryFallbackImage(category?: string, name?: string): string {
  const combined = `${category || ''} ${name || ''}`.toLowerCase();

  if (combined.includes('cement')) return CATEGORY_FALLBACK_IMAGES.cement;
  if (combined.includes('sand')) return CATEGORY_FALLBACK_IMAGES.sand;
  if (combined.includes('crush') || combined.includes('bajri') || combined.includes('aggregate')) return CATEGORY_FALLBACK_IMAGES.crush;
  if (combined.includes('tile bond') || combined.includes('adhesive')) return CATEGORY_FALLBACK_IMAGES.tilebond;
  if (combined.includes('paint') || combined.includes('primer') || combined.includes('enamel') || combined.includes('emulsion') || combined.includes('grout')) {
    return CATEGORY_FALLBACK_IMAGES.paint;
  }
  if (combined.includes('pipe') || combined.includes('pprc') || combined.includes('cpvc') || combined.includes('pvc') || combined.includes('fitting')) {
    return CATEGORY_FALLBACK_IMAGES.pipe;
  }
  if (combined.includes('tank')) return CATEGORY_FALLBACK_IMAGES.tank;
  if (combined.includes('basin') || combined.includes('sink') || combined.includes('bowl') || combined.includes('vanity')) {
    return CATEGORY_FALLBACK_IMAGES.basin;
  }
  if (combined.includes('commode') || combined.includes('toilet') || combined.includes('pan') || combined.includes('seat') || combined.includes('flush')) {
    return CATEGORY_FALLBACK_IMAGES.commode;
  }
  if (combined.includes('stove') || combined.includes('geyser') || combined.includes('heater') || combined.includes('appliance')) {
    return CATEGORY_FALLBACK_IMAGES.appliance;
  }
  if (combined.includes('faucet') || combined.includes('tap') || combined.includes('mixer')) return CATEGORY_FALLBACK_IMAGES.faucet;
  if (combined.includes('shower')) return CATEGORY_FALLBACK_IMAGES.shower;
  if (combined.includes('mirror')) return CATEGORY_FALLBACK_IMAGES.mirror;
  if (combined.includes('building') || combined.includes('material') || combined.includes('steel')) return CATEGORY_FALLBACK_IMAGES.material;

  return CATEGORY_FALLBACK_IMAGES.default;
}

/**
 * Cleans, sanitizes, and normalizes a product image URL:
 * - Handles strings, objects with URL, arrays, and JSON-encoded image fields
 * - Rewrites `/src/assets/images/...` to `/assets/images/...`
 * - Resolves relative Supabase storage paths (e.g., `project media/uploads/...`)
 * - Properly percent-encodes spaces in Supabase and CDN URLs (e.g., `project%20media`)
 * - Replaces empty or corrupted image strings with a high-resolution, category-matching image
 */
export function normalizeProductImage(image?: string | null | any, category?: string, name?: string): string {
  if (!image) {
    return getCategoryFallbackImage(category, name);
  }

  // Handle accidental object input (e.g., { url: '...' })
  if (typeof image === 'object') {
    if (Array.isArray(image) && image.length > 0) {
      return normalizeProductImage(image[0], category, name);
    }
    if (typeof image.url === 'string') {
      return normalizeProductImage(image.url, category, name);
    }
    if (typeof image.image === 'string') {
      return normalizeProductImage(image.image, category, name);
    }
    return getCategoryFallbackImage(category, name);
  }

  if (typeof image !== 'string') {
    return getCategoryFallbackImage(category, name);
  }

  let trimmed = image.trim();

  // If string contains JSON array like '["https://..."]'
  if (trimmed.startsWith('["') && trimmed.endsWith('"]')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'string') {
        trimmed = parsed[0].trim();
      }
    } catch (e) {}
  }

  if (
    trimmed === '' ||
    trimmed === 'undefined' ||
    trimmed === 'null' ||
    trimmed === '""' ||
    trimmed.length < 5
  ) {
    return getCategoryFallbackImage(category, name);
  }

  // Normalize legacy `/src/assets/` paths
  if (trimmed.startsWith('/src/assets/')) {
    return trimmed.replace('/src/assets/', '/assets/');
  }

  // Handle accidental unescaped backslashes in paths
  if (trimmed.includes('\\')) {
    trimmed = trimmed.replace(/\\/g, '/');
  }

  // Resolve relative Supabase storage bucket paths
  if (trimmed.startsWith('project media/') || trimmed.startsWith('uploads/')) {
    const bucketAndPath = trimmed.startsWith('project media/') ? trimmed : `project media/${trimmed}`;
    trimmed = `https://hdbqzhyaluwbktogbfvu.supabase.co/storage/v1/object/public/${bucketAndPath}`;
  } else if (trimmed.startsWith('/storage/v1/object/public/')) {
    trimmed = `https://hdbqzhyaluwbktogbfvu.supabase.co${trimmed}`;
  }

  // Ensure spaces in URLs are encoded properly (essential for mobile WebKit & Chrome)
  if (trimmed.includes(' ') && (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/'))) {
    trimmed = trimmed.replace(/ /g, '%20');
  }

  return trimmed;
}

/**
 * Resolves the exact primary image from any Product record.
 * Checks all possible database fields used across Supabase and CMS:
 * 1. product.image
 * 2. product.images (first non-empty element or JSON array)
 * 3. product.imageUrl / product.image_url
 * 4. product.coverImage / product.cover_image
 * 5. product.main_image
 * 6. product.thumbnail
 */
export function resolveProductImage(product: any): string {
  if (!product) return '';
  if (typeof product === 'string') {
    return normalizeProductImage(product);
  }

  // 1. Direct primary image field
  if (typeof product.image === 'string' && product.image.trim().length > 3) {
    return normalizeProductImage(product.image, product.category, product.name);
  }

  // 2. Images array or stringified JSON array
  if (Array.isArray(product.images) && product.images.length > 0) {
    for (const img of product.images) {
      if (typeof img === 'string' && img.trim().length > 3) {
        return normalizeProductImage(img, product.category, product.name);
      }
    }
  } else if (typeof product.images === 'string' && product.images.trim().startsWith('[')) {
    try {
      const parsed = JSON.parse(product.images);
      if (Array.isArray(parsed) && parsed.length > 0) {
        for (const img of parsed) {
          if (typeof img === 'string' && img.trim().length > 3) {
            return normalizeProductImage(img, product.category, product.name);
          }
        }
      }
    } catch (e) {}
  }

  // 3. Alternative database column variants
  const candidateKeys = [
    product.imageUrl,
    product.image_url,
    product.coverImage,
    product.cover_image,
    product.main_image,
    product.thumbnail,
    product.photo
  ];

  for (const cand of candidateKeys) {
    if (typeof cand === 'string' && cand.trim().length > 3) {
      return normalizeProductImage(cand, product.category, product.name);
    }
  }

  return normalizeProductImage(product.image, product.category, product.name);
}

/**
 * Normalizes an array of product gallery images:
 * - Ensures primary image is included first
 * - Normalizes all paths
 * - Removes duplicates and empty strings
 * - Guarantees at least one valid image
 */
export function normalizeProductImages(
  images?: (string | null | undefined)[],
  primaryImage?: string | null,
  category?: string,
  name?: string
): string[] {
  const result: string[] = [];
  const primary = normalizeProductImage(primaryImage, category, name);

  if (primary) {
    result.push(primary);
  }

  if (Array.isArray(images)) {
    images.forEach(img => {
      if (img && typeof img === 'string') {
        const norm = normalizeProductImage(img, category, name);
        if (norm && !result.includes(norm)) {
          result.push(norm);
        }
      }
    });
  }

  if (result.length === 0) {
    result.push(getCategoryFallbackImage(category, name));
  }

  return result;
}

/**
 * Safe Image error event handler:
 * - If the broken image was trying to load `/src/assets/images/`, reroutes to `/assets/images/`
 * - Otherwise gracefully falls back to category-smart fallback
 * - Prevents infinite recursion loops
 */
export function handleImageError(
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  category?: string,
  name?: string
): void {
  const target = e.currentTarget;
  // Detach onerror to prevent any chance of infinite loop
  target.onerror = null;

  if (target.src.includes('/src/assets/')) {
    target.src = target.src.replace('/src/assets/', '/assets/');
    return;
  }

  const fallback = getCategoryFallbackImage(category, name);
  if (target.src !== fallback) {
    target.src = fallback;
  }
}
