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
    const nameMatch = shade.name.toLowerCase().includes(q);
    const codeMatch = shade.code ? shade.code.toLowerCase().includes(q) : false;
    return nameMatch || codeMatch;
  });
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
