import fs from 'fs';
import fsPromises from 'fs/promises';
import path from 'path';

export const CANONICAL_DOMAIN = 'https://zafarsarwartraders.shop';

export const escapeXml = (str: string): string =>
  str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });

export const slugify = (text: string): string => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
};

const formatLastmod = (rawDate: any): string | null => {
  if (!rawDate) return null;
  try {
    const d = new Date(rawDate);
    if (isNaN(d.getTime())) return null;
    const year = d.getFullYear();
    // Only accept realistic dates, avoiding fake future or ancient dates
    if (year >= 2023 && year <= 2030) {
      return d.toISOString().split('T')[0];
    }
    return null;
  } catch {
    return null;
  }
};

// Baseline public categories in case database is empty/temporarily unreachable
const BASELINE_CATEGORIES = [
  { id: 'bathroom-accessories', name: 'Bathroom Accessories', slug: 'bathroom-accessories' },
  { id: 'luxury-bathroom-sets', name: 'Luxury Bathroom Sets', slug: 'luxury-bathroom-sets' },
  { id: 'wash-basins', name: 'Wash Basins', slug: 'wash-basins' },
  { id: 'designer-faucets', name: 'Designer Faucets', slug: 'designer-faucets' },
  { id: 'kitchen-faucets', name: 'Kitchen Faucets', slug: 'kitchen-faucets' },
  { id: 'rain-showers', name: 'Rain Showers', slug: 'rain-showers' },
  { id: 'shower-systems', name: 'Shower Systems', slug: 'shower-systems' },
  { id: 'toilets', name: 'Toilets', slug: 'toilets' },
  { id: 'commode', name: 'Commode', slug: 'commode' },
  { id: 'vanity-cabinets', name: 'Vanity Cabinets', slug: 'vanity-cabinets' },
  { id: 'bathroom-mirrors', name: 'Bathroom Mirrors', slug: 'bathroom-mirrors' },
  { id: 'pipes-fittings', name: 'Pipes & Fittings', slug: 'pipes-fittings' },
  { id: 'water-tanks', name: 'Water Tanks', slug: 'water-tanks' },
  { id: 'water-pumps', name: 'Water Pumps', slug: 'water-pumps' },
  { id: 'paints-finishes', name: 'Paints & Finishes', slug: 'paints-finishes' },
  { id: 'cement-structural', name: 'Cement & Structural', slug: 'cement-structural' },
  { id: 'steel-iron', name: 'Steel & Iron', slug: 'steel-iron' },
  { id: 'sand-crush', name: 'Sand & Crush', slug: 'sand-crush' }
];

export interface SitemapUrlEntry {
  loc: string;
  lastmod?: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

/**
 * Builds the complete dynamic XML sitemap from live Supabase tables and local CMS store data
 */
import { createClient } from '@supabase/supabase-js';

export async function generateDynamicSitemapXml(
  dbClient?: any,
  cmsDataStore?: Record<string, any>
): Promise<string> {
  let products: any[] = [];
  let categories: any[] = [];
  let brands: any[] = [];

  // 1. Resolve or auto-initialize Supabase client
  let client = dbClient;
  if (!client) {
    try {
      const rawUrl = (
        process.env.VITE_SUPABASE_URL ||
        process.env.SUPABASE_URL ||
        process.env.NEXT_PUBLIC_SUPABASE_URL ||
        ""
      ).trim();
      const serviceRoleKey = (
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.SERVICE_ROLE_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY ||
        process.env.SUPABASE_ANON_KEY ||
        process.env.SUPABASE_KEY ||
        process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
        process.env.SUPABASE_PUBLISHABLE_KEY ||
        ""
      ).trim();

      if (rawUrl && serviceRoleKey) {
        let normUrl = rawUrl;
        if (!normUrl.startsWith("http://") && !normUrl.startsWith("https://")) {
          normUrl = `https://${normUrl}`;
          if (!normUrl.includes(".")) {
            normUrl += ".supabase.co";
          }
        }
        client = createClient(normUrl, serviceRoleKey);
      }
    } catch {}
  }

  // Fetch live data from Supabase DB Client if available
  if (client) {
    try {
      const [prodRes, catRes, brandRes] = await Promise.all([
        client.from('products').select('id, title, name, slug, hidden, is_hidden, updated_at, created_at'),
        client.from('categories').select('id, name, slug, is_active, updated_at, created_at'),
        client.from('brands').select('id, name, slug, enabled, is_active, updated_at, created_at')
      ]);

      if (prodRes && Array.isArray(prodRes.data) && prodRes.data.length > 0) {
        products = prodRes.data;
      }
      if (catRes && Array.isArray(catRes.data) && catRes.data.length > 0) {
        categories = catRes.data;
      }
      if (brandRes && Array.isArray(brandRes.data) && brandRes.data.length > 0) {
        brands = brandRes.data;
      }
    } catch (err) {
      console.warn('[SitemapGenerator] Error querying Supabase directly, falling back to CMS store:', err);
    }
  }

  // 2. Fallbacks to in-memory/disk CMS store if Supabase data is missing
  if (products.length === 0 && cmsDataStore && Array.isArray(cmsDataStore.zst_products_v1)) {
    products = cmsDataStore.zst_products_v1;
  }
  if (categories.length === 0 && cmsDataStore && Array.isArray(cmsDataStore.zst_categories_v1) && cmsDataStore.zst_categories_v1.length > 0) {
    categories = cmsDataStore.zst_categories_v1;
  }
  if (categories.length === 0) {
    categories = BASELINE_CATEGORIES;
  }
  if (brands.length === 0 && cmsDataStore && Array.isArray(cmsDataStore.zst_brands_v1)) {
    brands = cmsDataStore.zst_brands_v1;
  }

  const urls: SitemapUrlEntry[] = [];
  const seenUrls = new Set<string>();

  const addUrl = (entry: SitemapUrlEntry) => {
    if (!entry.loc || seenUrls.has(entry.loc)) return;
    seenUrls.add(entry.loc);
    urls.push(entry);
  };

  // 1. Verified Public Static Pages
  addUrl({
    loc: `${CANONICAL_DOMAIN}/`,
    changefreq: 'daily',
    priority: '1.0'
  });
  addUrl({
    loc: `${CANONICAL_DOMAIN}/store`,
    changefreq: 'daily',
    priority: '0.9'
  });
  addUrl({
    loc: `${CANONICAL_DOMAIN}/categories`,
    changefreq: 'weekly',
    priority: '0.85'
  });
  addUrl({
    loc: `${CANONICAL_DOMAIN}/brands`,
    changefreq: 'weekly',
    priority: '0.8'
  });
  addUrl({
    loc: `${CANONICAL_DOMAIN}/delivery`,
    changefreq: 'monthly',
    priority: '0.7'
  });
  addUrl({
    loc: `${CANONICAL_DOMAIN}/smart-tools`,
    changefreq: 'monthly',
    priority: '0.7'
  });
  addUrl({
    loc: `${CANONICAL_DOMAIN}/about`,
    changefreq: 'monthly',
    priority: '0.7'
  });
  addUrl({
    loc: `${CANONICAL_DOMAIN}/contact`,
    changefreq: 'monthly',
    priority: '0.7'
  });

  // 2. Real Category Pages (ID and Slug based from existing application and Supabase data)
  for (const cat of categories) {
    // Exclude explicitly deactivated categories
    if (cat.is_active === false || cat.isActive === false || cat.enabled === false) {
      continue;
    }
    const rawSlug = cat.slug || cat.name || cat.id;
    const slug = slugify(rawSlug);
    if (!slug) continue;

    const lastmod = formatLastmod(cat.updated_at || cat.updatedAt || cat.created_at || cat.createdAt) || undefined;
    addUrl({
      loc: `${CANONICAL_DOMAIN}/category/${slug}`,
      lastmod,
      changefreq: 'weekly',
      priority: '0.85'
    });
  }

  // 3. Real Brand Pages
  for (const brand of brands) {
    if (brand.enabled === false || brand.is_active === false || brand.isActive === false) {
      continue;
    }
    const rawSlug = brand.slug || brand.name || brand.id;
    const slug = slugify(rawSlug);
    if (!slug) continue;

    const lastmod = formatLastmod(brand.updated_at || brand.updatedAt || brand.created_at || brand.createdAt) || undefined;
    addUrl({
      loc: `${CANONICAL_DOMAIN}/brand/${slug}`,
      lastmod,
      changefreq: 'weekly',
      priority: '0.8'
    });
  }

  // 4. Real Product Detail Pages (from database records)
  for (const prod of products) {
    // Exclude hidden products
    if (prod.hidden === true || prod.is_hidden === true || prod.isHidden === true) {
      continue;
    }

    const rawSlug = prod.slug || prod.name || prod.title || prod.id;
    const slug = slugify(rawSlug);
    if (!slug) continue;

    const lastmod = formatLastmod(prod.updated_at || prod.updatedAt || prod.created_at || prod.createdAt) || undefined;
    addUrl({
      loc: `${CANONICAL_DOMAIN}/product/${slug}`,
      lastmod,
      changefreq: 'daily',
      priority: '0.8'
    });
  }

  // Format valid XML following sitemap 0.9 protocol
  const xmlLines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9 http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">'
  ];

  for (const u of urls) {
    xmlLines.push('  <url>');
    xmlLines.push(`    <loc>${escapeXml(u.loc)}</loc>`);
    if (u.lastmod) {
      xmlLines.push(`    <lastmod>${u.lastmod}</lastmod>`);
    }
    xmlLines.push(`    <changefreq>${u.changefreq}</changefreq>`);
    xmlLines.push(`    <priority>${u.priority}</priority>`);
    xmlLines.push('  </url>');
  }

  xmlLines.push('</urlset>');
  return xmlLines.join('\n');
}

/**
 * Saves generated sitemap XML to public/sitemap.xml, /sitemap.xml, and dist/sitemap.xml (if exists)
 */
export async function updateSitemapFiles(sitemapXml: string): Promise<void> {
  const targets = [
    path.join(process.cwd(), 'public', 'sitemap.xml'),
    path.join(process.cwd(), 'sitemap.xml'),
    path.join(process.cwd(), 'dist', 'sitemap.xml')
  ];

  for (const targetPath of targets) {
    try {
      const dir = path.dirname(targetPath);
      if (fs.existsSync(dir)) {
        await fsPromises.writeFile(targetPath, sitemapXml, 'utf-8');
      }
    } catch (err) {
      console.warn(`[SitemapGenerator] Warning writing sitemap to ${targetPath}:`, err);
    }
  }
}
