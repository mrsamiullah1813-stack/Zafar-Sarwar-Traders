import { supabase, isSupabaseConfigured, initializeSupabaseRuntime } from '../lib/supabase';
export { isSupabaseConfigured, initializeSupabaseRuntime };
import { 
  Product, 
  ProductCategory, 
  ProductBrand, 
  HeroSettings, 
  CustomerOrder, 
  CityDeliveryInfo, 
  BusinessConfig, 
  AnnouncementBarSettings, 
  ThemeSettings, 
  AiAssistantConfig 
} from '../types';

// =========================================================
// DATA MAPPERS (Robust snake_case <-> camelCase conversion)
// =========================================================

export function mapDbProductToProduct(row: any): Product {
  const rawSpecs = typeof row.specifications === 'object' && row.specifications ? row.specifications : (row.specs || {});
  
  // Extract clean specs by excluding internal metadata keys starting with '_'
  const cleanSpecs: Record<string, string> = {};
  for (const [k, v] of Object.entries(rawSpecs)) {
    if (!k.startsWith('_') && typeof v === 'string') {
      cleanSpecs[k] = v;
    }
  }

  // Restore price preserving raw formatted string if saved
  let resolvedPrice = rawSpecs._raw_price || row.price_text;
  if (!resolvedPrice) {
    if (row.price !== null && row.price !== undefined) {
      resolvedPrice = String(row.price);
    } else {
      resolvedPrice = 'Call for Price';
    }
  }

  let resolvedSalePrice = rawSpecs._raw_sale_price || row.sale_price_text;
  if (!resolvedSalePrice && row.sale_price !== null && row.sale_price !== undefined) {
    resolvedSalePrice = String(row.sale_price);
  }

  return {
    id: String(row.id),
    sku: row.sku || '',
    name: row.title || row.name || '',
    category: row.category_name || row.category || rawSpecs._category_name || 'Uncategorized',
    categoryId: row.category_id || row.categoryId || rawSpecs._category_id || '',
    brand: row.brand_name || row.brand || rawSpecs._brand_name || '',
    brandId: row.brand_id || row.brandId || rawSpecs._brand_id || '',
    image: row.main_image || row.image || '',
    images: Array.isArray(row.gallery_images) ? row.gallery_images : (Array.isArray(row.images) ? row.images : (Array.isArray(row.gallery) ? row.gallery : [])),
    description: row.description || '',
    shortDescription: row.short_description || row.shortDescription || '',
    price: resolvedPrice,
    salePrice: resolvedSalePrice || undefined,
    features: Array.isArray(row.features) ? row.features : [],
    specs: cleanSpecs,
    isNew: Boolean(row.is_new ?? row.isNew ?? rawSpecs._is_new),
    isFeatured: Boolean(row.featured ?? row.is_featured ?? row.isFeatured ?? rawSpecs._is_featured),
    isHeroFeatured: Boolean(row.hero_featured ?? row.is_hero_featured ?? row.isHeroFeatured ?? rawSpecs._is_hero_featured),
    isBestSeller: Boolean(row.best_seller ?? row.is_best_seller ?? row.isBestSeller ?? rawSpecs._is_best_seller),
    isTrending: Boolean(row.trending ?? row.is_trending ?? row.isTrending ?? rawSpecs._is_trending),
    isHidden: Boolean(row.hidden ?? row.is_hidden ?? row.isHidden ?? rawSpecs._is_hidden),
    badge: row.badge || rawSpecs._badge || undefined,
    stockStatus: row.stock_status || row.stockStatus || rawSpecs._stock_status || 'In Stock',
    stockQuantity: Number(row.stock_quantity ?? row.stockQuantity ?? rawSpecs._stock_quantity ?? 10),
    hideStockBadge: Boolean(row.hide_stock_badge ?? row.hideStockBadge ?? rawSpecs._hide_stock_badge),
    isPriceOnRequest: Boolean(row.price_on_request ?? row.is_price_on_request ?? row.isPriceOnRequest ?? rawSpecs._is_price_on_request),
    hidePrice: Boolean(row.hide_price ?? row.hidePrice ?? rawSpecs._hide_price),
    availableColors: Array.isArray(row.colors) ? row.colors : (Array.isArray(row.availableColors) ? row.availableColors : (Array.isArray(rawSpecs._available_colors) ? rawSpecs._available_colors : [])),
    availableSizes: Array.isArray(row.sizes) ? row.sizes : (Array.isArray(row.availableSizes) ? row.availableSizes : (Array.isArray(rawSpecs._available_sizes) ? rawSpecs._available_sizes : [])),
    availableMaterials: Array.isArray(row.materials) ? row.materials : (Array.isArray(row.availableMaterials) ? row.availableMaterials : (Array.isArray(rawSpecs._available_materials) ? rawSpecs._available_materials : [])),
    availableVariants: Array.isArray(row.variants) ? row.variants : (Array.isArray(row.availableVariants) ? row.availableVariants : (Array.isArray(rawSpecs._available_variants) ? rawSpecs._available_variants : [])),
    availableFinishes: Array.isArray(row.finishes) ? row.finishes : (Array.isArray(row.available_finishes) ? row.available_finishes : (Array.isArray(row.availableFinishes) ? row.availableFinishes : (Array.isArray(rawSpecs._available_finishes) ? rawSpecs._available_finishes : []))),
    material: row.material || rawSpecs._material || undefined,
    warranty: row.warranty || rawSpecs._warranty || undefined,
    videos: Array.isArray(row.videos) ? row.videos : (Array.isArray(rawSpecs._videos) ? rawSpecs._videos : []),
    pdfCatalogueUrl: row.pdf_catalogue_url || row.pdfCatalogueUrl || rawSpecs._pdf_catalogue_url || undefined,
    installationGuideUrl: row.installation_guide_url || row.installationGuideUrl || rawSpecs._installation_guide_url || undefined,
    whatsappCustomMessage: row.whatsapp_custom_message || row.whatsappCustomMessage || rawSpecs._whatsapp_custom_message || undefined,
    relatedProductIds: Array.isArray(row.related_product_ids) ? row.related_product_ids : (Array.isArray(row.relatedProductIds) ? row.relatedProductIds : (Array.isArray(rawSpecs._related_product_ids) ? rawSpecs._related_product_ids : [])),
    tags: Array.isArray(row.tags) ? row.tags : (Array.isArray(rawSpecs._tags) ? rawSpecs._tags : []),
    seoTitle: row.seo_title || row.seoTitle || rawSpecs._seo_title || undefined,
    seoDescription: row.seo_description || row.seoDescription || rawSpecs._seo_description || undefined,
    rating: typeof row.rating === 'number' ? row.rating : (typeof rawSpecs._rating === 'number' ? rawSpecs._rating : (row.rating ? parseFloat(String(row.rating)) : 4.8)),
    reviewsCount: Number(row.reviews_count ?? row.reviewsCount ?? rawSpecs._reviews_count ?? 12),
    reviews_count: Number(row.reviews_count ?? row.reviewsCount ?? rawSpecs._reviews_count ?? 12),
    displayOrder: Number(row.display_order ?? row.displayOrder ?? rawSpecs._display_order ?? 0)
  };
}

export function mapProductToDb(product: Product): any {
  let numericPrice = 0;
  if (product.price) {
    const digitsOnly = String(product.price).replace(/[^0-9.]/g, '');
    if (digitsOnly) {
      numericPrice = parseFloat(digitsOnly) || 0;
    }
  }

  let numericSalePrice: number | null = null;
  if (product.salePrice) {
    const digitsOnly = String(product.salePrice).replace(/[^0-9.]/g, '');
    if (digitsOnly) {
      numericSalePrice = parseFloat(digitsOnly) || null;
    }
  }

  const specsWithMeta = {
    ...(product.specs || {}),
    _raw_price: product.price ?? null,
    _raw_sale_price: product.salePrice ?? null,
    _category_name: product.category || null,
    _category_id: product.categoryId || null,
    _brand_name: product.brand || null,
    _brand_id: product.brandId || null,
    _is_new: Boolean(product.isNew),
    _is_featured: Boolean(product.isFeatured),
    _is_hero_featured: Boolean(product.isHeroFeatured),
    _is_best_seller: Boolean(product.isBestSeller),
    _is_trending: Boolean(product.isTrending),
    _is_hidden: Boolean(product.isHidden),
    _badge: product.badge || null,
    _stock_status: product.stockStatus || 'In Stock',
    _stock_quantity: product.stockQuantity ?? 10,
    _hide_stock_badge: Boolean(product.hideStockBadge),
    _is_price_on_request: Boolean(product.isPriceOnRequest),
    _hide_price: Boolean(product.hidePrice),
    _available_colors: product.availableColors || [],
    _available_sizes: product.availableSizes || [],
    _available_materials: product.availableMaterials || [],
    _available_variants: product.availableVariants || [],
    _available_finishes: product.availableFinishes || [],
    _material: product.material || null,
    _warranty: product.warranty || null,
    _videos: product.videos || [],
    _pdf_catalogue_url: product.pdfCatalogueUrl || null,
    _installation_guide_url: product.installationGuideUrl || null,
    _whatsapp_custom_message: product.whatsappCustomMessage || null,
    _related_product_ids: product.relatedProductIds || [],
    _tags: product.tags || [],
    _seo_title: product.seoTitle || null,
    _seo_description: product.seoDescription || null,
    _rating: typeof product.rating === 'number' ? product.rating : (product.rating ? parseFloat(String(product.rating)) : 4.8),
    _reviews_count: typeof product.reviewsCount === 'number' ? product.reviewsCount : (typeof product.reviews_count === 'number' ? product.reviews_count : 12),
    _display_order: product.displayOrder ?? 0
  };

  return {
    id: product.id,
    sku: product.sku || null,
    title: product.name,
    slug: (product.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    description: product.description || '',
    short_description: product.shortDescription || null,
    price: numericPrice,
    sale_price: numericSalePrice,
    category_id: product.categoryId || null,
    brand_id: product.brandId || null,
    image: product.image || '',
    main_image: product.image || '',
    gallery: product.images || [],
    gallery_images: product.images || [],
    videos: product.videos || [],
    features: product.features || [],
    specifications: specsWithMeta,
    stock_quantity: product.stockQuantity ?? 10,
    badge: product.badge || null,
    material: product.material || null,
    warranty: product.warranty || null,
    seo_title: product.seoTitle || null,
    seo_description: product.seoDescription || null,
    is_featured: Boolean(product.isFeatured),
    is_hero_featured: Boolean(product.isHeroFeatured),
    is_new: Boolean(product.isNew),
    is_best_seller: Boolean(product.isBestSeller),
    is_trending: Boolean(product.isTrending),
    is_hidden: Boolean(product.isHidden),
    is_price_on_request: Boolean(product.isPriceOnRequest),
    hide_price: Boolean(product.hidePrice),
    hide_stock_badge: Boolean(product.hideStockBadge),
    rating: typeof product.rating === 'number' ? product.rating : (product.rating ? parseFloat(String(product.rating)) : 4.8),
    reviews_count: typeof product.reviewsCount === 'number' ? product.reviewsCount : (typeof product.reviews_count === 'number' ? product.reviews_count : 12),
    display_order: product.displayOrder ?? 0
  };
}

// =========================================================
// 1. PRODUCTS CRUD (Direct Supabase SDK)
// =========================================================

export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  await initializeSupabaseRuntime();

  if (!isSupabaseConfigured) {
    console.warn('[Supabase Direct SDK] Table: products | Status: SKIPPED | Reason: Supabase not configured in environment');
    return null;
  }

  try {
    console.log('[Supabase Direct SDK] Querying table: public.products ...');
    
    // Attempt standard query with ordering
    let { data, error, status, statusText } = await supabase
      .from('products')
      .select('*')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false });

    // Fallback if column ordering fails due to schema variations
    if (error && (error.code === '42703' || error.message?.toLowerCase().includes('column'))) {
      console.warn('[Supabase Direct SDK] Table: products | Retrying without column ordering');
      const fallbackRes = await supabase.from('products').select('*');
      data = fallbackRes.data;
      error = fallbackRes.error;
      status = fallbackRes.status;
      statusText = fallbackRes.statusText;
    }

    if (error) {
      console.error(`[Supabase Direct SDK] Table: products | Status: FAILED | Error Code: ${error.code || 'UNKNOWN'} | Message: ${error.message} | HTTP: ${status} (${statusText || 'Error'})`);
      return null;
    }

    const rowCount = data ? data.length : 0;
    console.log(`[Supabase Direct SDK] Table: products | Status: SUCCESS | Records: ${rowCount} | HTTP: ${status || 200}`);
    return data ? data.map(mapDbProductToProduct) : [];
  } catch (err: any) {
    console.error(`[Supabase Direct SDK] Table: products | Status: ERROR | Message: ${err?.message || String(err)}`);
    return null;
  }
}

export async function upsertProductInSupabase(product: Product | Product[]): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  const list = Array.isArray(product) ? product : [product];

  try {
    for (const prod of list) {
      const payload = mapProductToDb(prod);
      let { error } = await supabase.from('products').upsert(payload, { onConflict: 'id' });

      // If foreign key constraint failed on category_id or brand_id, retry without FKs
      if (error && error.code === '23503') {
        const sanitizedPayload = { ...payload, category_id: null, brand_id: null };
        const retryResult = await supabase.from('products').upsert(sanitizedPayload, { onConflict: 'id' });
        error = retryResult.error;
      }

      if (error) {
        console.error(`[Supabase Direct SDK] Product upsert failed for ${prod.name}: ${error.message}`);
        return { success: false, error: error.message };
      }
    }
    console.log(`[Supabase Direct SDK] Upserted ${list.length} product(s) successfully`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || String(err) };
  }
}

export async function deleteProductFromSupabase(productId: string): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (error) {
      console.error(`[Supabase Direct SDK] Product delete failed: ${error.message}`);
      return { success: false, error: error.message };
    }
    console.log(`[Supabase Direct SDK] Deleted product ID: ${productId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// =========================================================
// 2. CATEGORIES CRUD (Direct Supabase SDK)
// =========================================================

export async function fetchCategoriesFromSupabase(): Promise<ProductCategory[] | null> {
  await initializeSupabaseRuntime();

  if (!isSupabaseConfigured) {
    console.warn('[Supabase Direct SDK] Table: categories | Status: SKIPPED | Reason: Supabase not configured');
    return null;
  }

  try {
    console.log('[Supabase Direct SDK] Querying table: public.categories ...');
    
    // Direct select('*') avoids PostgREST column errors if display_order is absent in schema
    let { data, error, status, statusText } = await supabase
      .from('categories')
      .select('*');

    if (error) {
      console.error(`[Supabase Direct SDK] Table: categories | Status: FAILED | Error Code: ${error.code || 'UNKNOWN'} | Message: ${error.message} | HTTP: ${status} (${statusText || 'Error'})`);
      return null;
    }

    const rawRows = data || [];
    const rowCount = rawRows.length;
    console.log(`[Supabase Direct SDK] Table: categories | Status: SUCCESS | Raw Rows Returned: ${rowCount} | HTTP: ${status || 200}`);

    const mappedCategories: ProductCategory[] = rawRows.map((r: any, idx: number) => {
      const catId = String(r.id ?? r.category_id ?? r.cat_id ?? `cat-${idx + 1}`);
      const catName = String(r.name ?? r.title ?? r.category_name ?? r.label ?? `Category ${idx + 1}`);
      const rawSlug = r.slug ?? r.category_slug ?? catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const cleanSlug = String(rawSlug).replace(/(^-|-$)+/g, '');

      // Determine active status accurately
      let isActive = true;
      if (r.is_active !== undefined && r.is_active !== null) {
        isActive = r.is_active === true || r.is_active === 1 || r.is_active === 'true' || r.is_active === 't';
      } else if (r.active !== undefined && r.active !== null) {
        isActive = Boolean(r.active);
      } else if (r.enabled !== undefined && r.enabled !== null) {
        isActive = Boolean(r.enabled);
      } else if (r.status !== undefined && r.status !== null) {
        isActive = String(r.status).toLowerCase() === 'active';
      }

      // Determine homepage visibility
      let showOnHomepage = true;
      if (r.show_on_homepage !== undefined && r.show_on_homepage !== null) {
        showOnHomepage = Boolean(r.show_on_homepage);
      } else if (r.display_on_homepage !== undefined && r.display_on_homepage !== null) {
        showOnHomepage = Boolean(r.display_on_homepage);
      }

      const isFeatured = Boolean(r.featured ?? r.is_featured ?? false);
      const displayOrder = Number(r.display_order ?? r.sort_order ?? r.order ?? r.position ?? idx);

      return {
        id: catId,
        name: catName,
        slug: cleanSlug,
        description: r.description ?? r.desc ?? r.details ?? r.short_description ?? '',
        fullDescription: r.full_description ?? r.fullDescription ?? undefined,
        image: r.image ?? r.image_url ?? r.img ?? r.cover_image ?? r.thumbnail ?? r.photo ?? r.main_image ?? r.picture ?? '',
        iconImage: r.icon_image ?? undefined,
        bannerImage: r.banner_image ?? undefined,
        itemCount: Number(r.item_count ?? r.count ?? r.total_items ?? 0),
        badge: r.badge || undefined,
        iconName: r.icon ?? r.icon_name ?? 'Grid',
        group: (r.group_name ?? r.group ?? r.department ?? r.category_group ?? 'sanitary') as any,
        isFeatured,
        showOnHomepage,
        isActive,
        seoTitle: r.seo_title ?? undefined,
        seoDescription: r.seo_description ?? undefined,
        displayOrder
      };
    });

    // In-memory sorting by displayOrder, then by name
    mappedCategories.sort((a, b) => {
      if ((a.displayOrder ?? 0) !== (b.displayOrder ?? 0)) {
        return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
      }
      return a.name.localeCompare(b.name);
    });

    console.log(`[Supabase Direct SDK] Categories mapped successfully: ${mappedCategories.length} categories ready for UI [Sample: ${mappedCategories.slice(0, 5).map(c => c.name).join(', ')}]`);
    return mappedCategories;
  } catch (err: any) {
    console.error(`[Supabase Direct SDK] Table: categories | Status: ERROR | Message: ${err?.message || String(err)}`);
    return null;
  }
}

export async function upsertCategoryInSupabase(category: ProductCategory | ProductCategory[]): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  const list = Array.isArray(category) ? category : [category];

  try {
    const payloads = list.map(cat => ({
      id: cat.id,
      name: cat.name,
      slug: (cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/(^-|-$)+/g, ''),
      description: cat.description || '',
      full_description: cat.fullDescription || null,
      image: cat.image || '',
      icon: cat.iconName || 'Grid',
      badge: cat.badge || null,
      featured: Boolean(cat.isFeatured),
      show_on_homepage: Boolean(cat.showOnHomepage ?? true),
      is_active: Boolean(cat.isActive ?? true),
      seo_title: cat.seoTitle || null,
      seo_description: cat.seoDescription || null,
      display_order: cat.displayOrder ?? 0
    }));

    const { error } = await supabase.from('categories').upsert(payloads, { onConflict: 'id' });
    if (error) {
      console.error(`[Supabase Direct SDK] Category upsert failed: ${error.message}`);
      return { success: false, error: error.message };
    }
    console.log(`[Supabase Direct SDK] Upserted ${list.length} category/categories successfully`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteCategoryFromSupabase(categoryId: string): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) return { success: false, error: error.message };
    console.log(`[Supabase Direct SDK] Deleted category ID: ${categoryId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// =========================================================
// 3. BRANDS CRUD (Direct Supabase SDK)
// =========================================================

export async function fetchBrandsFromSupabase(): Promise<ProductBrand[] | null> {
  await initializeSupabaseRuntime();

  if (!isSupabaseConfigured) {
    console.warn('[Supabase Direct SDK] Table: brands | Status: SKIPPED | Reason: Supabase not configured');
    return null;
  }

  try {
    console.log('[Supabase Direct SDK] Querying table: public.brands ...');
    let { data, error, status, statusText } = await supabase
      .from('brands')
      .select('*')
      .order('display_order', { ascending: true });

    if (error && (error.code === '42703' || error.message?.toLowerCase().includes('column'))) {
      const fallbackRes = await supabase.from('brands').select('*');
      data = fallbackRes.data;
      error = fallbackRes.error;
      status = fallbackRes.status;
      statusText = fallbackRes.statusText;
    }

    if (error) {
      console.error(`[Supabase Direct SDK] Table: brands | Status: FAILED | Error Code: ${error.code || 'UNKNOWN'} | Message: ${error.message} | HTTP: ${status} (${statusText || 'Error'})`);
      return null;
    }

    const rowCount = data ? data.length : 0;
    console.log(`[Supabase Direct SDK] Table: brands | Status: SUCCESS | Records: ${rowCount} | HTTP: ${status || 200}`);
    return data ? data.map((r: any) => ({
      id: String(r.id),
      name: r.name || '',
      slug: r.slug || (r.name ? r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : ''),
      logo: r.logo || '',
      bannerImage: r.banner_image || undefined,
      description: r.description || '',
      officialBadge: r.official_badge || undefined,
      isFeatured: Boolean(r.featured ?? r.is_featured),
      isActive: Boolean(r.enabled ?? r.is_active ?? true),
      displayOrder: Number(r.display_order ?? 0)
    })) : [];
  } catch (err: any) {
    console.error(`[Supabase Direct SDK] Table: brands | Status: ERROR | Message: ${err?.message || String(err)}`);
    return null;
  }
}

export async function upsertBrandInSupabase(brand: ProductBrand | ProductBrand[]): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  const list = Array.isArray(brand) ? brand : [brand];

  try {
    const payloads = list.map(b => ({
      id: b.id,
      name: b.name,
      slug: (b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/(^-|-$)+/g, ''),
      logo: b.logo || '',
      description: b.description || '',
      official_badge: b.officialBadge || null,
      is_active: Boolean(b.isActive ?? true),
      featured: Boolean(b.isFeatured),
      display_order: b.displayOrder ?? 0
    }));

    const { error } = await supabase.from('brands').upsert(payloads, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    console.log(`[Supabase Direct SDK] Upserted ${list.length} brand(s) successfully`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function deleteBrandFromSupabase(brandId: string): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const { error } = await supabase.from('brands').delete().eq('id', brandId);
    if (error) return { success: false, error: error.message };
    console.log(`[Supabase Direct SDK] Deleted brand ID: ${brandId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// =========================================================
// 4. HERO SETTINGS & SLIDES (Direct Supabase SDK)
// =========================================================

export async function fetchHeroSettingsFromSupabase(): Promise<HeroSettings | null> {
  await initializeSupabaseRuntime();

  if (!isSupabaseConfigured) {
    console.warn('[Supabase Direct SDK] Table: hero_settings | Status: SKIPPED | Reason: Supabase not configured');
    return null;
  }

  try {
    console.log('[Supabase Direct SDK] Querying table: public.hero_settings ...');
    const { data, error, status, statusText } = await supabase
      .from('hero_settings')
      .select('*')
      .eq('id', 'default')
      .maybeSingle();

    if (error) {
      console.error(`[Supabase Direct SDK] Table: hero_settings | Status: FAILED | Error Code: ${error.code || 'UNKNOWN'} | Message: ${error.message} | HTTP: ${status} (${statusText || 'Error'})`);
      return null;
    }

    if (!data) {
      console.log(`[Supabase Direct SDK] Table: hero_settings | Status: SUCCESS (No default row) | HTTP: ${status || 200}`);
      return null;
    }

    console.log(`[Supabase Direct SDK] Table: hero_settings | Status: SUCCESS | Config Found: true | HTTP: ${status || 200}`);

    // Query slides
    let slideProductIds: string[] = [];
    try {
      const { data: slideData, error: slideErr } = await supabase
        .from('hero_slides')
        .select('*')
        .eq('enabled', true)
        .order('display_order', { ascending: true });

      if (!slideErr && slideData && slideData.length > 0) {
        slideProductIds = slideData.map((s: any) => String(s.product_id)).filter(Boolean);
      }
    } catch {}

    return {
      isEnabled: Boolean(data.is_enabled ?? true),
      badgeText: data.badge_text || 'DIRECT DISTRIBUTOR & SANITARY SPECIALIST',
      heading: data.heading || 'INNOVATION & ELEGANCE IN SANITARYWARE',
      subheading: data.subheading || 'Premium Faucets, Luxury Bathroom Suites, Smart Showers & Complete Building Solutions',
      primaryBtnText: data.primary_btn_text || 'Explore Collection',
      primaryBtnLink: data.primary_btn_link || '#products',
      enablePrimaryBtn: Boolean(data.enable_primary_btn ?? true),
      secondaryBtnText: data.secondary_btn_text || 'Contact Sales',
      secondaryBtnLink: data.secondary_btn_link || '#contact',
      enableSecondaryBtn: Boolean(data.enable_secondary_btn ?? true),
      tertiaryBtnText: data.tertiary_btn_text || undefined,
      tertiaryBtnLink: data.tertiary_btn_link || undefined,
      enableTertiaryBtn: data.enable_tertiary_btn ? Boolean(data.enable_tertiary_btn) : undefined,
      rotationDurationSeconds: Number(data.rotation_duration_seconds ?? (data.slide_duration ? data.slide_duration / 1000 : 6)),
      transitionSpeedSeconds: Number(data.transition_speed_seconds ?? 0.8),
      transitionStyle: data.transition_style || 'cinematic-depth',
      autoPlay: Boolean(data.autoplay ?? true),
      pauseOnHover: Boolean(data.pause_on_hover ?? true),
      enableParallax: Boolean(data.enable_parallax ?? true),
      parallaxStrength: Number(data.parallax_strength ?? 15),
      glowIntensity: data.glow_intensity || 'medium',
      bgType: data.bg_type || 'ambient-dark',
      bgMediaUrl: data.bg_media_url || undefined,
      bgVideoUrl: data.bg_video_url || undefined,
      heroProductIds: Array.isArray(data.hero_product_ids) && data.hero_product_ids.length > 0 ? data.hero_product_ids : slideProductIds,
      heroMode: data.hero_mode || 'selected_or_featured',
      productImageOverrides: typeof data.product_image_overrides === 'object' ? data.product_image_overrides : {},
      productVideoOverrides: typeof data.product_video_overrides === 'object' ? data.product_video_overrides : {},
      customProductOrder: Array.isArray(data.custom_product_order) ? data.custom_product_order : [],
      isDraft: Boolean(data.is_draft)
    };
  } catch (err: any) {
    console.error(`[Supabase Direct SDK] Table: hero_settings | Status: ERROR | Message: ${err?.message || String(err)}`);
    return null;
  }
}

export async function saveHeroSettingsToSupabase(settings: HeroSettings): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const payload = {
      id: 'default',
      is_enabled: Boolean(settings.isEnabled),
      badge_text: settings.badgeText || '',
      heading: settings.heading || '',
      subheading: settings.subheading || '',
      primary_btn_text: settings.primaryBtnText || '',
      primary_btn_link: settings.primaryBtnLink || '',
      enable_primary_btn: Boolean(settings.enablePrimaryBtn),
      secondary_btn_text: settings.secondaryBtnText || '',
      secondary_btn_link: settings.secondaryBtnLink || '',
      enable_secondary_btn: Boolean(settings.enableSecondaryBtn),
      tertiary_btn_text: settings.tertiaryBtnText || null,
      tertiary_btn_link: settings.tertiaryBtnLink || null,
      enable_tertiary_btn: settings.enableTertiaryBtn ? Boolean(settings.enableTertiaryBtn) : null,
      rotation_duration_seconds: settings.rotationDurationSeconds || 6,
      transition_speed_seconds: settings.transitionSpeedSeconds || 0.8,
      transition_style: settings.transitionStyle || 'cinematic-depth',
      autoplay: Boolean(settings.autoPlay),
      pause_on_hover: Boolean(settings.pauseOnHover),
      enable_parallax: Boolean(settings.enableParallax),
      parallax_strength: settings.parallaxStrength || 15,
      glow_intensity: settings.glowIntensity || 'medium',
      bg_type: settings.bgType || 'ambient-dark',
      bg_media_url: settings.bgMediaUrl || null,
      bg_video_url: settings.bgVideoUrl || null,
      hero_product_ids: settings.heroProductIds || [],
      hero_mode: settings.heroMode || 'selected_or_featured',
      product_image_overrides: settings.productImageOverrides || {},
      product_video_overrides: settings.productVideoOverrides || {},
      custom_product_order: settings.customProductOrder || [],
      is_draft: Boolean(settings.isDraft)
    };

    const { error } = await supabase.from('hero_settings').upsert(payload, { onConflict: 'id' });
    if (error) {
      console.error(`[Supabase Direct SDK] Hero settings save failed: ${error.message}`);
      return { success: false, error: error.message };
    }
    console.log('[Supabase Direct SDK] Saved hero_settings successfully');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// =========================================================
// 5. ORDERS CRUD (Direct Supabase SDK)
// =========================================================

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function fetchOrdersFromSupabase(customerId?: string): Promise<CustomerOrder[] | null> {
  await initializeSupabaseRuntime();

  if (!isSupabaseConfigured) {
    console.warn('[Supabase Direct SDK] Table: orders | Status: SKIPPED | Reason: Supabase not configured');
    return null;
  }

  try {
    console.log('[Supabase Direct SDK] Querying table: public.orders ...');
    let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
    if (customerId) {
      if (isUUID(customerId)) {
        query = query.eq('customer_id', customerId);
      } else {
        query = query.or(`customer_phone.eq.${customerId},id.eq.${customerId}`);
      }
    }
    let { data, error, status, statusText } = await query;

    if (error && (error.code === '42703' || error.message?.toLowerCase().includes('column'))) {
      const fallbackRes = await supabase.from('orders').select('*');
      data = fallbackRes.data;
      error = fallbackRes.error;
      status = fallbackRes.status;
      statusText = fallbackRes.statusText;
    }

    if (error) {
      console.error(`[Supabase Direct SDK] Table: orders | Status: FAILED | Error Code: ${error.code || 'UNKNOWN'} | Message: ${error.message} | HTTP: ${status} (${statusText || 'Error'})`);
      return null;
    }

    const count = data ? data.length : 0;
    console.log(`[Supabase Direct SDK] Table: orders | Status: SUCCESS | Records: ${count} | HTTP: ${status || 200}`);
    return data ? data.map(mapDbOrderToCustomerOrder) : [];
  } catch (err: any) {
    console.error(`[Supabase Direct SDK] Table: orders | Status: ERROR | Message: ${err?.message || String(err)}`);
    return null;
  }
}

function mapDbOrderToCustomerOrder(r: any): CustomerOrder {
  return {
    id: String(r.id),
    orderNumber: r.id || r.order_number,
    customerId: r.customer_id || undefined,
    customerName: r.customer_name,
    phoneNumber: r.customer_phone || r.phone_number || '',
    whatsappNumber: r.whatsapp_number || undefined,
    city: r.shipping_city || r.city || '',
    areaLocality: r.shipping_area || r.area_locality || undefined,
    deliveryAddress: r.shipping_address || r.delivery_address || '',
    postalCode: r.postal_code || undefined,
    landmark: r.landmark || undefined,
    deliveryInstructions: r.delivery_instructions || undefined,
    notes: r.notes || undefined,
    items: Array.isArray(r.order_items) ? r.order_items.map((item: any) => ({
      productId: String(item.product_id),
      productName: item.product_title || item.product_name || '',
      image: item.product_image || item.image || '',
      unitPrice: String(item.unit_price ?? 0),
      numericPrice: Number(item.unit_price ?? 0),
      quantity: Number(item.quantity ?? 1),
      selectedColor: item.selected_color || undefined,
      selectedSize: item.selected_size || undefined,
      selectedQuality: item.selected_quality || undefined,
      selectedVariant: item.selected_variant || undefined,
      lineTotal: Number(item.total_price ?? ((item.unit_price || 0) * (item.quantity || 1)))
    })) : [],
    subtotal: Number(r.subtotal ?? 0),
    deliveryCharges: Number(r.delivery_fee ?? r.delivery_charges ?? 0),
    taxAmount: Number(r.tax_amount ?? 0),
    grandTotal: Number(r.total_amount ?? r.grand_total ?? 0),
    createdAt: r.created_at,
    updatedAt: r.updated_at || undefined,
    status: r.status || 'Order Received',
    statusHistory: Array.isArray(r.status_history) ? r.status_history : [],
    estimatedDeliveryDays: r.estimated_delivery_days || undefined,
    estimatedDeliveryDate: r.estimated_delivery_date || undefined,
    estimatedDeliveryTime: r.estimated_delivery_time || undefined,
    isDelayed: Boolean(r.is_delayed),
    delayReason: r.delay_reason || undefined,
    trackingReference: r.tracking_reference || undefined,
    adminNotes: r.admin_notes || undefined,
    deliveryDelayNote: r.delivery_delay_note || undefined
  };
}

export async function createOrderInSupabase(order: CustomerOrder): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  const orderPayload = {
    id: order.id,
    customer_id: (order.customerId && isUUID(order.customerId)) ? order.customerId : null,
    customer_name: order.customerName,
    customer_phone: order.phoneNumber,
    whatsapp_number: order.whatsappNumber || null,
    shipping_city: order.city,
    shipping_area: order.areaLocality || null,
    shipping_address: order.deliveryAddress,
    postal_code: order.postalCode || null,
    landmark: order.landmark || null,
    delivery_instructions: order.deliveryInstructions || null,
    notes: order.notes || null,
    subtotal: order.subtotal,
    delivery_fee: order.deliveryCharges,
    tax_amount: order.taxAmount || 0,
    total_amount: order.grandTotal,
    status: order.status || 'Order Received',
    status_history: order.statusHistory || [{ status: order.status || 'Order Received', timestamp: new Date().toISOString() }],
    estimated_delivery_days: order.estimatedDeliveryDays || null,
    estimated_delivery_date: order.estimatedDeliveryDate || null,
    estimated_delivery_time: order.estimatedDeliveryTime || null,
    created_at: order.createdAt || new Date().toISOString()
  };

  const itemsPayload = (Array.isArray(order.items) ? order.items : []).map(item => ({
    id: `${order.id}-${item.productId}`,
    order_id: order.id,
    product_id: item.productId,
    product_title: item.productName || '',
    product_image: item.image || '',
    unit_price: item.numericPrice || parseFloat(item.unitPrice) || 0,
    quantity: item.quantity,
    total_price: item.lineTotal || ((item.numericPrice || parseFloat(item.unitPrice) || 0) * item.quantity),
    selected_color: item.selectedColor || null,
    selected_size: item.selectedSize || null,
    selected_quality: item.selectedQuality || null,
    selected_variant: item.selectedVariant || null
  }));

  try {
    const { error: orderErr } = await supabase.from('orders').upsert(orderPayload, { onConflict: 'id' });
    if (orderErr) {
      console.error(`[Supabase Direct SDK] Order creation failed: ${orderErr.message}`);
      return { success: false, error: orderErr.message };
    }

    if (itemsPayload.length > 0) {
      const { error: itemsErr } = await supabase.from('order_items').upsert(itemsPayload, { onConflict: 'id' });
      if (itemsErr) {
        console.warn(`[Supabase Direct SDK] Order items upsert warning: ${itemsErr.message}`);
      }
    }
    console.log(`[Supabase Direct SDK] Created order: ${order.id}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateOrderStatusInSupabase(orderId: string, status: CustomerOrder['status'], note?: string): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const { data: existing } = await supabase.from('orders').select('status_history').eq('id', orderId).maybeSingle();
    const history = existing && Array.isArray(existing.status_history) ? existing.status_history : [];
    const updatedHistory = [...history, { status, timestamp: new Date().toISOString(), note }];

    const { error } = await supabase
      .from('orders')
      .update({ status, status_history: updatedHistory, updated_at: new Date().toISOString() })
      .eq('id', orderId);

    if (error) return { success: false, error: error.message };
    console.log(`[Supabase Direct SDK] Updated order ${orderId} to status: ${status}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// =========================================================
// 6. DELIVERY CITIES CRUD (Direct Supabase SDK)
// =========================================================

export async function fetchDeliveryCitiesFromSupabase(): Promise<CityDeliveryInfo[] | null> {
  await initializeSupabaseRuntime();

  if (!isSupabaseConfigured) {
    console.warn('[Supabase Direct SDK] Table: delivery_cities | Status: SKIPPED | Reason: Supabase not configured');
    return null;
  }

  try {
    console.log('[Supabase Direct SDK] Querying table: public.delivery_cities ...');
    let { data, error, status, statusText } = await supabase
      .from('delivery_cities')
      .select('*')
      .order('display_order', { ascending: true });

    if (error && (error.code === '42703' || error.message?.toLowerCase().includes('column'))) {
      const fallbackRes = await supabase.from('delivery_cities').select('*');
      data = fallbackRes.data;
      error = fallbackRes.error;
      status = fallbackRes.status;
      statusText = fallbackRes.statusText;
    }

    if (error) {
      console.error(`[Supabase Direct SDK] Table: delivery_cities | Status: FAILED | Error Code: ${error.code || 'UNKNOWN'} | Message: ${error.message} | HTTP: ${status} (${statusText || 'Error'})`);
      return null;
    }

    const count = data ? data.length : 0;
    console.log(`[Supabase Direct SDK] Table: delivery_cities | Status: SUCCESS | Records: ${count} | HTTP: ${status || 200}`);
    return data ? data.map((r: any) => ({
      id: String(r.id),
      cityName: r.name || r.city_name || '',
      deliveryFee: Number(r.delivery_fee ?? 0),
      estimatedDays: r.estimated_days || '2-4 Days',
      isEnabled: Boolean(r.enabled),
      isSameDayAvailable: Boolean(r.same_day_available),
      isNextDayAvailable: Boolean(r.next_day_available),
      displayOrder: Number(r.display_order ?? 0),
      notes: r.notes || undefined
    })) : [];
  } catch (err: any) {
    console.error(`[Supabase Direct SDK] Table: delivery_cities | Status: ERROR | Message: ${err?.message || String(err)}`);
    return null;
  }
}

export async function upsertDeliveryCityInSupabase(city: CityDeliveryInfo): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const payload = {
      id: city.id,
      name: city.cityName,
      delivery_fee: city.deliveryFee,
      estimated_days: city.estimatedDays || '2-4 Days',
      enabled: Boolean(city.isEnabled),
      same_day_available: Boolean(city.isSameDayAvailable),
      next_day_available: Boolean(city.isNextDayAvailable),
      display_order: city.displayOrder ?? 0,
      notes: city.notes || null
    };
    const { error } = await supabase.from('delivery_cities').upsert(payload, { onConflict: 'id' });
    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveDeliveryCitiesToSupabase(cities: CityDeliveryInfo[]): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  for (const city of cities) {
    await upsertDeliveryCityInSupabase(city);
  }
  return { success: true };
}

// =========================================================
// 7. SITE SETTINGS (Direct Supabase SDK)
// =========================================================

function getSiteSettingColumnName(key: string): string | null {
  const k = key.toLowerCase();
  if (k.includes('announcement')) return 'announcements';
  if (k.includes('theme')) return 'theme_settings';
  if (k.includes('ai') || k.includes('assistant')) return 'ai_assistant';
  if (k.includes('contact')) return 'contact_info';
  if (k.includes('stat')) return 'stats';
  if (k.includes('delivery')) return 'delivery_settings';
  if (k.includes('checkout')) return 'checkout_settings';
  if (k.includes('planner') || k.includes('designer')) return 'planner_config';
  if (k.includes('config') || k.includes('business')) return 'business_config';
  if (k.includes('gallery')) return 'gallery';
  return null;
}

export async function fetchSiteSettingFromSupabase<T>(key: string): Promise<T | null> {
  await initializeSupabaseRuntime();

  if (!isSupabaseConfigured) {
    console.warn(`[Supabase Direct SDK] Table: site_settings | Key: ${key} | Status: SKIPPED | Reason: Supabase not configured`);
    return null;
  }

  try {
    // 1. Try key-value table (key, value)
    const { data: kvData, error: kvErr, status: kvStatus } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (!kvErr && kvData && kvData.value !== undefined) {
      console.log(`[Supabase Direct SDK] Table: site_settings (KV) | Key: ${key} | Status: SUCCESS | HTTP: ${kvStatus || 200}`);
      return kvData.value as T;
    }

    // 2. Try single row config with named column (id = 'config')
    const colName = getSiteSettingColumnName(key);
    if (colName) {
      const { data: colData, error: colErr, status: colStatus } = await supabase
        .from('site_settings')
        .select(colName)
        .eq('id', 'config')
        .maybeSingle();

      if (!colErr && colData && (colData as any)[colName] !== undefined && (colData as any)[colName] !== null) {
        console.log(`[Supabase Direct SDK] Table: site_settings (Column: ${colName}) | Key: ${key} | Status: SUCCESS | HTTP: ${colStatus || 200}`);
        return (colData as any)[colName] as T;
      }
    }
    console.log(`[Supabase Direct SDK] Table: site_settings | Key: ${key} | Status: NO_DATA (Using local default)`);
    return null;
  } catch (err: any) {
    console.error(`[Supabase Direct SDK] Table: site_settings | Key: ${key} | Status: ERROR | Message: ${err?.message || String(err)}`);
    return null;
  }
}

export async function saveSiteSettingToSupabase(key: string, value: any): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const { error: kvError } = await supabase.from('site_settings').upsert({
      key,
      value,
      updated_at: new Date().toISOString()
    }, { onConflict: 'key' });

    if (!kvError) {
      console.log(`[Supabase Direct SDK] Saved site_setting KV: ${key}`);
      return { success: true };
    }

    const colName = getSiteSettingColumnName(key);
    if (colName) {
      const payload = { id: 'config', [colName]: value, updated_at: new Date().toISOString() };
      const { error: colError } = await supabase.from('site_settings').upsert(payload, { onConflict: 'id' });
      if (colError) return { success: false, error: colError.message };
      console.log(`[Supabase Direct SDK] Saved site_setting column ${colName}: ${key}`);
      return { success: true };
    }

    return { success: false, error: kvError?.message };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function saveBuildMaterialEstimatorToSupabase(config: any): Promise<{ success: boolean; error?: string }> {
  return saveSiteSettingToSupabase('zst_planner_config_v1', config);
}

export async function fetchBuildMaterialEstimatorFromSupabase(): Promise<any | null> {
  return fetchSiteSettingFromSupabase<any>('zst_planner_config_v1');
}

// =========================================================
// 8. STORAGE MEDIA UPLOAD (Direct Supabase SDK)
// =========================================================

export async function uploadMediaToSupabase(file: File, bucketName: 'product-media' | 'brand-assets' | 'hero-media' = 'product-media'): Promise<{ url?: string; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) {
    console.warn(`[Supabase Direct SDK] Storage Bucket: ${bucketName} | Status: SKIPPED | Reason: Supabase not configured`);
    return { error: 'Supabase not configured' };
  }
  try {
    const fileExt = file.name.split('.').pop() || 'png';
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
    const filePath = `uploads/${fileName}`;

    console.log(`[Supabase Direct SDK] Storage Bucket: ${bucketName} | Uploading file: ${filePath}`);
    const { error: uploadErr } = await supabase.storage.from(bucketName).upload(filePath, file, {
      cacheControl: '3600',
      upsert: true
    });

    if (uploadErr) {
      console.error(`[Supabase Direct SDK] Storage Bucket: ${bucketName} | Upload FAILED | Message: ${uploadErr.message}`);
      return { error: uploadErr.message };
    }

    const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(filePath);
    console.log(`[Supabase Direct SDK] Storage Bucket: ${bucketName} | Upload SUCCESS | Public URL generated`);
    return { url: publicUrlData.publicUrl };
  } catch (err: any) {
    console.error(`[Supabase Direct SDK] Storage Bucket: ${bucketName} | Upload ERROR | Message: ${err?.message || String(err)}`);
    return { error: err.message || 'Media upload failed' };
  }
}
