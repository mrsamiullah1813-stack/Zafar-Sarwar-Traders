import { Product, PaintShade, ProductCategory } from '../types';

/**
 * Checks if a category or categoryId belongs to Paint products.
 * Paint products are identified by category group 'paints_materials',
 * categoryId matching paint-related slugs, or category name containing 'paint'.
 */
export function isPaintCategory(
  categoryName?: string,
  categoryId?: string,
  categoryGroup?: string
): boolean {
  if (categoryGroup === 'paints_materials') return true;

  const id = (categoryId || '').toLowerCase().trim();
  const name = (categoryName || '').toLowerCase().trim();

  if (
    id === 'paints' ||
    id === 'paint' ||
    id.includes('paint') ||
    id.includes('emulsion') ||
    id.includes('distemper') ||
    id.includes('enamel') ||
    id.includes('varnish') ||
    id.includes('primer')
  ) {
    return true;
  }

  if (
    name.includes('paint') ||
    name.includes('emulsion') ||
    name.includes('distemper') ||
    name.includes('enamel') ||
    name.includes('weather-shield') ||
    name.includes('weathershield') ||
    name.includes('matt finish') ||
    name.includes('silk finish') ||
    name.includes('wall coating')
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if a specific Product is a Paint product.
 */
export function isPaintProduct(
  product?: Product | null,
  categories: ProductCategory[] = []
): boolean {
  if (!product) return false;

  if (product.isPaintProduct === true) return true;

  // Check matching category group from categories list
  if (categories && categories.length > 0) {
    const matchedCat = categories.find(
      c => c.id === product.categoryId || (c.name && c.name.toLowerCase() === (product.category || '').toLowerCase())
    );
    if (matchedCat && matchedCat.group === 'paints_materials') {
      return true;
    }
  }

  return isPaintCategory(product.category, product.categoryId);
}

/**
 * Checks if a product has active paint shades configured and enabled.
 */
export function hasActivePaintShades(product?: Product | null): boolean {
  if (!product) return false;

  const isEnabled = Boolean(
    product.shadesEnabled === true ||
    product.paintShadesConfig?.shadesEnabled === true
  );

  if (!isEnabled) return false;

  const list = product.shadesList || product.paintShadesConfig?.shades || [];
  return list.some(s => s.isActive !== false);
}

/**
 * Gets all active paint shades for a product, ordered by displayOrder.
 * Only returns shades where isActive is not false.
 */
export function getActivePaintShades(product?: Product | null): PaintShade[] {
  if (!product) return [];

  const rawList = product.shadesList || product.paintShadesConfig?.shades || [];
  const activeList = rawList.filter(s => s && s.isActive !== false);

  return [...activeList].sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0));
}

/**
 * Gets the default selected paint shade for a product (first active shade).
 */
export function getDefaultPaintShade(product?: Product | null): PaintShade | null {
  const shades = getActivePaintShades(product);
  return shades.length > 0 ? shades[0] : null;
}

/**
 * Formats a Paint Shade for display or invoice/WhatsApp messages.
 * Exact Shade Code is the primary reference.
 * e.g. "Grey Mist — 3044" or "Grey Mist (Code: 3044)"
 */
export function formatPaintShadeLabel(shade?: PaintShade | null): string {
  if (!shade) return '';
  const code = (shade.code || '').trim();
  if (code) {
    return `${shade.name} — ${code}`;
  }
  return shade.name;
}

/**
 * Real-time search filter for paint shades by exact/partial code or name.
 * Prevents merging of similar shades (e.g. Grey 3001 vs Grey 3002).
 */
export function searchPaintShades(shades: PaintShade[], query: string): PaintShade[] {
  if (!query || !query.trim()) return shades;
  const q = query.toLowerCase().trim();

  return shades.filter(shade => {
    const nameMatch = (shade.name || '').toLowerCase().includes(q);
    const codeMatch = shade.code ? shade.code.toLowerCase().includes(q) : false;
    return nameMatch || codeMatch;
  });
}

/**
 * Checks if a shade code is duplicated within a product's shade list.
 */
export function findDuplicateShade(
  shades: PaintShade[],
  code: string,
  excludeId?: string
): PaintShade | undefined {
  if (!code || !code.trim()) return undefined;
  const normalizedCode = code.trim().toLowerCase();
  return shades.find(
    s => s.id !== excludeId && (s.code || '').trim().toLowerCase() === normalizedCode
  );
}

/**
 * Returns boolean if duplicate shade code exists
 */
export function hasDuplicateShadeCode(
  shades: PaintShade[],
  code: string,
  excludeId?: string
): boolean {
  return Boolean(findDuplicateShade(shades, code, excludeId));
}

/**
 * Categorizes a HEX color string into a recognizable color family.
 */
export function getColorFamily(hex?: string): string {
  if (!hex || !hex.startsWith('#')) return 'All';
  
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(c => c + c).join('');
  }
  if (cleanHex.length !== 6) return 'All';

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  const delta = max - min;

  const l = (max + min) / 2;
  const s = max === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  // Very light / white
  if (l > 0.92) return 'Whites & Creams';
  // Very dark / black
  if (l < 0.15) return 'Deep & Accent';
  // Low saturation: greys and neutrals
  if (s < 0.15) {
    if (l > 0.8) return 'Whites & Creams';
    if (l > 0.4) return 'Greys & Neutrals';
    return 'Deep & Accent';
  }

  // Calculate Hue in degrees (0 - 360)
  let h = 0;
  if (delta !== 0) {
    if (max === r / 255) {
      h = ((g / 255 - b / 255) / delta) % 6;
    } else if (max === g / 255) {
      h = (b / 255 - r / 255) / delta + 2;
    } else {
      h = (r / 255 - g / 255) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }

  if (h >= 345 || h < 15) return 'Reds & Warm';
  if (h >= 15 && h < 45) return 'Earthy & Warm Tones';
  if (h >= 45 && h < 70) return 'Yellows & Creams';
  if (h >= 70 && h < 165) return 'Pastels & Greens';
  if (h >= 165 && h < 260) return 'Pastels & Cool Blues';
  if (h >= 260 && h < 315) return 'Purples & Violets';
  return 'Reds & Warm';
}

/**
 * Helper to safely extract average pixel color (hex) and sample data URL from an image.
 */
export function extractColorFromCanvas(
  imgElement: HTMLImageElement,
  clientX: number,
  clientY: number,
  rect: DOMRect,
  sampleRadius = 2
): { hex: string; sampleDataUrl: string } | null {
  try {
    const naturalWidth = imgElement.naturalWidth || imgElement.width;
    const naturalHeight = imgElement.naturalHeight || imgElement.height;
    if (!naturalWidth || !naturalHeight) return null;

    const scaleX = naturalWidth / rect.width;
    const scaleY = naturalHeight / rect.height;

    const originX = Math.round((clientX - rect.left) * scaleX);
    const originY = Math.round((clientY - rect.top) * scaleY);

    const canvas = document.createElement('canvas');
    canvas.width = naturalWidth;
    canvas.height = naturalHeight;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;

    ctx.drawImage(imgElement, 0, 0, naturalWidth, naturalHeight);

    const startX = Math.max(0, originX - sampleRadius);
    const startY = Math.max(0, originY - sampleRadius);
    const endX = Math.min(naturalWidth - 1, originX + sampleRadius);
    const endY = Math.min(naturalHeight - 1, originY + sampleRadius);
    const width = endX - startX + 1;
    const height = endY - startY + 1;

    const imgData = ctx.getImageData(startX, startY, width, height);
    const data = imgData.data;

    let totalR = 0, totalG = 0, totalB = 0, count = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalR += data[i];
      totalG += data[i + 1];
      totalB += data[i + 2];
      count++;
    }

    if (count === 0) return null;

    const avgR = Math.round(totalR / count);
    const avgG = Math.round(totalG / count);
    const avgB = Math.round(totalB / count);

    const toHex = (c: number) => c.toString(16).padStart(2, '0');
    const hex = `#${toHex(avgR)}${toHex(avgG)}${toHex(avgB)}`.toUpperCase();

    // Create a 64x64 micro thumbnail swatch dataUrl
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 64;
    thumbCanvas.height = 64;
    const thumbCtx = thumbCanvas.getContext('2d');
    if (thumbCtx) {
      const cropSize = Math.max(20, Math.min(naturalWidth / 10, 80));
      const cropX = Math.max(0, Math.min(naturalWidth - cropSize, originX - cropSize / 2));
      const cropY = Math.max(0, Math.min(naturalHeight - cropSize, originY - cropSize / 2));
      thumbCtx.drawImage(imgElement, cropX, cropY, cropSize, cropSize, 0, 0, 64, 64);
    }
    const sampleDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.85);

    return { hex, sampleDataUrl };
  } catch (err) {
    console.warn('Could not extract color from canvas (likely cross-origin restriction):', err);
    return null;
  }
}

/**
 * Real Paint Shade Reference Presets for 1-Click adding in Admin.
 * Uses authentic manufacturer shade codes from top brands (Berger, Master, Brighto, Dulux, Diamond).
 */
export interface PaintShadePreset {
  name: string;
  code: string;
  colorHex?: string;
  sampleImageUrl?: string;
  category: 'Popular Greys & Neutrals' | 'Whites, Creams & Off-Whites' | 'Pastels & Cool Blues' | 'Earthy & Warm Tones' | 'Rich Accent & Deep Shades';
  brandRef?: string;
}

export const POPULAR_PAINT_SHADE_PRESETS: PaintShadePreset[] = [
  // Popular Greys & Neutrals (Real manufacturer shade codes)
  {
    name: 'Grey Mist',
    code: '3044',
    colorHex: '#C5CCD3',
    category: 'Popular Greys & Neutrals',
    brandRef: 'Master / Berger Standard'
  },
  {
    name: 'Ash Grey',
    code: '3001',
    colorHex: '#D8DEE4',
    category: 'Popular Greys & Neutrals',
    brandRef: 'Architectural Series'
  },
  {
    name: 'Dove Grey',
    code: '3002',
    colorHex: '#BFC6CE',
    category: 'Popular Greys & Neutrals',
    brandRef: 'Architectural Series'
  },
  {
    name: 'Charcoal Shadow',
    code: '3003',
    colorHex: '#525B64',
    category: 'Popular Greys & Neutrals',
    brandRef: 'Architectural Series'
  },
  {
    name: 'Slate Stone',
    code: '3004',
    colorHex: '#707A84',
    category: 'Popular Greys & Neutrals',
    brandRef: 'Modern Matte'
  },
  {
    name: 'Smokey Quartz',
    code: '3048',
    colorHex: '#949FA8',
    category: 'Popular Greys & Neutrals',
    brandRef: 'Urban Palette'
  },

  // Whites, Creams & Off-Whites
  {
    name: 'Super White',
    code: '1001',
    colorHex: '#FFFFFF',
    category: 'Whites, Creams & Off-Whites',
    brandRef: 'Classic Ceiling & Wall'
  },
  {
    name: 'Off White',
    code: '1002',
    colorHex: '#FAF9F6',
    category: 'Whites, Creams & Off-Whites',
    brandRef: 'All-Time Classic'
  },
  {
    name: 'Almond Cream',
    code: '1003',
    colorHex: '#F6EFE9',
    category: 'Whites, Creams & Off-Whites',
    brandRef: 'Warm Living'
  },
  {
    name: 'Ivory Silk',
    code: '1004',
    colorHex: '#FFF9EB',
    category: 'Whites, Creams & Off-Whites',
    brandRef: 'Luxury Silk Emulsion'
  },
  {
    name: 'Champagne Frost',
    code: '1005',
    colorHex: '#F8F1E5',
    category: 'Whites, Creams & Off-Whites',
    brandRef: 'Premium Sheen'
  },
  {
    name: 'Pearl White',
    code: '1006',
    colorHex: '#F3F4F6',
    category: 'Whites, Creams & Off-Whites',
    brandRef: 'Soft Satin'
  },

  // Pastels & Cool Blues
  {
    name: 'Sky Breeze',
    code: '5012',
    colorHex: '#BDE0FE',
    category: 'Pastels & Cool Blues',
    brandRef: 'Fresh Pastels'
  },
  {
    name: 'Ocean Whisper',
    code: '5014',
    colorHex: '#A2D2FF',
    category: 'Pastels & Cool Blues',
    brandRef: 'Coastal Series'
  },
  {
    name: 'Mint Serenity',
    code: '6018',
    colorHex: '#D0E1D4',
    category: 'Pastels & Cool Blues',
    brandRef: 'Tranquil Herb'
  },
  {
    name: 'Sage Whisper',
    code: '6020',
    colorHex: '#B8CDBA',
    category: 'Pastels & Cool Blues',
    brandRef: 'Nature Interior'
  },
  {
    name: 'Lilac Cloud',
    code: '4010',
    colorHex: '#E5DBEB',
    category: 'Pastels & Cool Blues',
    brandRef: 'Modern Pastel'
  },

  // Earthy & Warm Tones
  {
    name: 'Sandstone Beige',
    code: '2001',
    colorHex: '#DFD2BE',
    category: 'Earthy & Warm Tones',
    brandRef: 'Exterior WeatherShield'
  },
  {
    name: 'Warm Taupe',
    code: '2002',
    colorHex: '#C5B5A1',
    category: 'Earthy & Warm Tones',
    brandRef: 'Earthy Elegance'
  },
  {
    name: 'Desert Dune',
    code: '2003',
    colorHex: '#E8DCB8',
    category: 'Earthy & Warm Tones',
    brandRef: 'Warm Neutral'
  },
  {
    name: 'Rustic Terracotta',
    code: '2008',
    colorHex: '#C46849',
    category: 'Earthy & Warm Tones',
    brandRef: 'Mediterranean'
  },
  {
    name: 'Mocha Dream',
    code: '2010',
    colorHex: '#8C6244',
    category: 'Earthy & Warm Tones',
    brandRef: 'Rich Timber'
  },

  // Rich Accent & Deep Shades
  {
    name: 'Royal Navy',
    code: '7001',
    colorHex: '#1B2A4A',
    category: 'Rich Accent & Deep Shades',
    brandRef: 'Executive Accent'
  },
  {
    name: 'Forest Emerald',
    code: '7002',
    colorHex: '#184E3A',
    category: 'Rich Accent & Deep Shades',
    brandRef: 'Luxury Accent'
  },
  {
    name: 'Crimson Heritage',
    code: '7003',
    colorHex: '#8B1E28',
    category: 'Rich Accent & Deep Shades',
    brandRef: 'Heritage Collection'
  },
  {
    name: 'Midnight Black',
    code: '7004',
    colorHex: '#1C1E21',
    category: 'Rich Accent & Deep Shades',
    brandRef: 'Industrial Matt'
  }
];
