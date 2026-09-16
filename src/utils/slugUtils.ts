import { Product, ProductCategory, ProductBrand } from '../types';

/**
 * Robust slugify helper that handles alphanumeric, dashes, and unicode
 */
export function slugify(text: string): string {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-') // Replace spaces with -
    .replace(/[^\w\u0600-\u06FF\-]+/g, '') // Remove all non-word chars (except Urdu/Arabic & -)
    .replace(/\-\-+/g, '-') // Replace multiple - with single -
    .replace(/^-+/, '') // Trim - from start of text
    .replace(/-+$/, ''); // Trim - from end of text
}

/**
 * Get clean URL slug for a product
 */
export function getProductSlug(product: Product): string {
  if (!product) return '';
  if (product.slug && product.slug.trim()) {
    return slugify(product.slug);
  }
  const nameSlug = slugify(product.name);
  if (nameSlug) return nameSlug;
  return slugify(product.id) || product.id;
}

/**
 * Find a product by its URL slug or fallback ID
 * Supports both (products, slug) and (slug, products) call orders
 */
export function findProductBySlug(arg1: Product[] | string, arg2: string | Product[]): Product | undefined {
  const products = Array.isArray(arg1) ? arg1 : (Array.isArray(arg2) ? arg2 : []);
  const slug = typeof arg1 === 'string' ? arg1 : (typeof arg2 === 'string' ? arg2 : '');

  if (!products || !slug) return undefined;
  const decodedSlug = decodeURIComponent(slug).toLowerCase().trim();
  
  // 1. Direct slug match
  const directMatch = products.find(p => p.slug && p.slug.toLowerCase().trim() === decodedSlug);
  if (directMatch) return directMatch;

  // 2. Generated name slug match
  const nameSlugMatch = products.find(p => slugify(p.name) === decodedSlug);
  if (nameSlugMatch) return nameSlugMatch;

  // 3. ID match
  const idMatch = products.find(p => p.id.toLowerCase() === decodedSlug);
  if (idMatch) return idMatch;

  // 4. Partial or contains match
  return products.find(p => {
    const s = slugify(p.name);
    return s.includes(decodedSlug) || decodedSlug.includes(s) || decodedSlug.endsWith(`-${p.id.toLowerCase()}`);
  });
}

/**
 * Helper to generate product slug from object or name + id
 */
export function generateProductSlug(nameOrProduct: string | Product, id?: string): string {
  if (typeof nameOrProduct === 'object' && nameOrProduct !== null) {
    return getProductSlug(nameOrProduct);
  }
  const s = slugify(String(nameOrProduct || ''));
  return s || slugify(id || '') || 'product';
}

/**
 * Get clean URL slug for a category
 */
export function getCategorySlug(category: ProductCategory): string {
  if (!category) return '';
  if (category.slug && category.slug.trim()) {
    return slugify(category.slug);
  }
  const nameSlug = slugify(category.name);
  if (nameSlug) return nameSlug;
  return slugify(category.id) || category.id;
}

/**
 * Find a category by its URL slug or ID
 * Supports both (categories, slug) and (slug, categories) call orders
 */
export function findCategoryBySlug(arg1: ProductCategory[] | string, arg2: string | ProductCategory[]): ProductCategory | undefined {
  const categories = Array.isArray(arg1) ? arg1 : (Array.isArray(arg2) ? arg2 : []);
  const slug = typeof arg1 === 'string' ? arg1 : (typeof arg2 === 'string' ? arg2 : '');

  if (!categories || !slug) return undefined;
  const decodedSlug = decodeURIComponent(slug).toLowerCase().trim();

  // 1. Direct slug match
  const directMatch = categories.find(c => c.slug && c.slug.toLowerCase().trim() === decodedSlug);
  if (directMatch) return directMatch;

  // 2. Name slug match
  const nameSlugMatch = categories.find(c => slugify(c.name) === decodedSlug);
  if (nameSlugMatch) return nameSlugMatch;

  // 3. ID match
  const idMatch = categories.find(c => c.id.toLowerCase() === decodedSlug);
  if (idMatch) return idMatch;

  return undefined;
}

/**
 * Helper to generate category slug from object or name + id
 */
export function generateCategorySlug(nameOrCategory: string | ProductCategory, id?: string): string {
  if (typeof nameOrCategory === 'object' && nameOrCategory !== null) {
    return getCategorySlug(nameOrCategory);
  }
  const s = slugify(String(nameOrCategory || ''));
  return s || slugify(id || '') || 'category';
}

/**
 * Get clean URL slug for a brand
 */
export function getBrandSlug(brand: ProductBrand): string {
  if (!brand) return '';
  if (brand.slug && brand.slug.trim()) {
    return slugify(brand.slug);
  }
  const nameSlug = slugify(brand.name);
  if (nameSlug) return nameSlug;
  return slugify(brand.id) || brand.id;
}

/**
 * Find a brand by its URL slug or ID
 * Supports both (brands, slug) and (slug, brands) call orders
 */
export function findBrandBySlug(arg1: ProductBrand[] | string, arg2: string | ProductBrand[]): ProductBrand | undefined {
  const brands = Array.isArray(arg1) ? arg1 : (Array.isArray(arg2) ? arg2 : []);
  const slug = typeof arg1 === 'string' ? arg1 : (typeof arg2 === 'string' ? arg2 : '');

  if (!brands || !slug) return undefined;
  const decodedSlug = decodeURIComponent(slug).toLowerCase().trim();

  // 1. Direct slug match
  const directMatch = brands.find(b => b.slug && b.slug.toLowerCase().trim() === decodedSlug);
  if (directMatch) return directMatch;

  // 2. Name slug match
  const nameSlugMatch = brands.find(b => slugify(b.name) === decodedSlug);
  if (nameSlugMatch) return nameSlugMatch;

  // 3. ID match
  const idMatch = brands.find(b => b.id.toLowerCase() === decodedSlug);
  if (idMatch) return idMatch;

  return undefined;
}

/**
 * Helper to generate brand slug from object or name + id
 */
export function generateBrandSlug(nameOrBrand: string | ProductBrand, id?: string): string {
  if (typeof nameOrBrand === 'object' && nameOrBrand !== null) {
    return getBrandSlug(nameOrBrand);
  }
  const s = slugify(String(nameOrBrand || ''));
  return s || slugify(id || '') || 'brand';
}
