import { supabase, isSupabaseConfigured, initializeSupabaseRuntime } from '../lib/supabase';
export { isSupabaseConfigured, initializeSupabaseRuntime };
import { getAdminAuthToken } from '../utils/storage';
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
  AiAssistantConfig,
  AiCustomKnowledge,
  ProductVariant,
  ProductVariantsConfig,
  PaintShade,
  PaintShadesConfig,
  FittingBuilderConfig
} from '../types';
import { defaultFittingBuilderConfig } from '../data/defaultFittingBuilderData';

// =========================================================
// AUTH HEADERS HELPER FOR SECURE ADMIN BACKEND PROXY
// =========================================================

async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token || getAdminAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  } catch (err) {
    const token = getAdminAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

// =========================================================
// ERROR FORMATTER
// =========================================================

export function formatSupabaseError(error: any): string {
  if (!error) return 'Unknown database error occurred.';
  const msg = typeof error === 'string' ? error : (error.message || JSON.stringify(error));
  const lower = msg.toLowerCase();
  if (lower.includes('categories_slug_key') || lower.includes('duplicate key value') && lower.includes('slug')) {
    return 'A category with this URL slug already exists. Please choose a distinct category name or slug.';
  }
  if (lower.includes('row-level security') || lower.includes('violates row-level') || lower.includes('rls')) {
    return 'Permission denied by Row-Level Security: You must log in as an authenticated Admin (Ctrl+Shift+A) to perform this operation in Supabase.';
  }
  if (lower.includes('jwt') || (lower.includes('token') && (lower.includes('expired') || lower.includes('invalid')))) {
    return 'Your admin authentication session has expired. Please log in again (Ctrl+Shift+A).';
  }
  if (lower.includes('failed to fetch') || lower.includes('network') || lower.includes('timeout')) {
    return 'Network connection issue: Unable to connect to Supabase PostgreSQL database. Please check your internet connection.';
  }
  return msg;
}

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

  let resolvedSalePrice = rawSpecs._raw_sale_price || rawSpecs._sale_price || rawSpecs._sale_config?.salePrice || row.sale_price_text || (row.sale_price !== null && row.sale_price !== undefined ? String(row.sale_price) : (row.discount_price !== null && row.discount_price !== undefined ? String(row.discount_price) : (row.discounted_price !== null && row.discounted_price !== undefined ? String(row.discounted_price) : undefined)));

  const isSaleEnabled = Boolean(
    row.sale_enabled ??
    row.is_on_sale ??
    row.sale_active ??
    row.on_sale ??
    row.is_sale ??
    row.discount_enabled ??
    rawSpecs._sale_enabled ??
    rawSpecs._sale_config?.saleEnabled ??
    (resolvedSalePrice && Number(String(resolvedSalePrice).replace(/[^0-9.]/g, '')) > 0 && rawSpecs._sale_enabled !== false)
  );

  // Parse Variants & Dynamic Pricing
  let parsedVariantsList: ProductVariant[] = [];
  const rawVariantsSource = row.variants || rawSpecs._variants_list || rawSpecs._variants_config?.variants;
  if (Array.isArray(rawVariantsSource)) {
    parsedVariantsList = rawVariantsSource.map((v: any, idx: number) => {
      if (typeof v === 'string') {
        return {
          id: `var-${idx + 1}`,
          name: v,
          price: resolvedPrice,
          isActive: true,
          displayOrder: idx
        };
      }
      if (v && typeof v === 'object') {
        return {
          id: String(v.id || `var-${idx + 1}`),
          name: String(v.name || v.label || v.title || `Option ${idx + 1}`),
          sku: v.sku || undefined,
          price: v.price !== undefined && v.price !== null ? String(v.price) : undefined,
          saleEnabled: Boolean(v.saleEnabled ?? v.sale_enabled),
          salePrice: v.salePrice !== undefined && v.salePrice !== null ? String(v.salePrice) : (v.sale_price !== undefined ? String(v.sale_price) : undefined),
          discountPercentage: typeof v.discountPercentage === 'number' ? v.discountPercentage : undefined,
          saleLabel: v.saleLabel || v.sale_label || undefined,
          stockQuantity: typeof v.stockQuantity === 'number' ? v.stockQuantity : (typeof v.stock_quantity === 'number' ? v.stock_quantity : 10),
          stockStatus: v.stockStatus || v.stock_status || 'In Stock',
          image: v.image || undefined,
          isActive: v.isActive !== false && v.is_active !== false,
          isDefault: Boolean(v.isDefault ?? v.is_default),
          displayOrder: typeof v.displayOrder === 'number' ? v.displayOrder : (typeof v.display_order === 'number' ? v.display_order : idx)
        };
      }
      return null;
    }).filter(Boolean) as ProductVariant[];
  }

  const isVariantsEnabled = Boolean(
    row.variants_enabled ??
    rawSpecs._variants_enabled ??
    rawSpecs._variants_config?.variantsEnabled ??
    (parsedVariantsList.length > 0 && (rawSpecs._variants_enabled === true || row.variants_enabled === true))
  );

  const optionName = String(
    row.option_name ||
    rawSpecs._option_name ||
    rawSpecs._variants_config?.optionName ||
    'Size'
  );

  // Paint Shade System Parsing
  let parsedShadesList: PaintShade[] = [];
  const rawShades = row.shades || rawSpecs._shades_list || rawSpecs._paint_shades_config?.shades || [];
  if (Array.isArray(rawShades)) {
    parsedShadesList = rawShades.map((s: any, idx: number) => {
      if (!s) return null;
      if (typeof s === 'string') {
        return {
          id: `shade-${idx + 1}`,
          name: s,
          code: '',
          colorHex: '#FFFFFF',
          isActive: true,
          displayOrder: idx,
          priceAdjustment: 0
        };
      }
      if (typeof s === 'object') {
        return {
          id: s.id || `shade-${idx + 1}`,
          name: s.name || `Shade ${idx + 1}`,
          code: s.code || '',
          colorHex: s.colorHex || s.color_hex || '#FFFFFF',
          image: s.image || undefined,
          isActive: s.isActive !== false && s.is_active !== false,
          displayOrder: typeof s.displayOrder === 'number' ? s.displayOrder : (typeof s.display_order === 'number' ? s.display_order : idx),
          priceAdjustment: Number(s.priceAdjustment ?? s.price_adjustment ?? 0)
        };
      }
      return null;
    }).filter(Boolean) as PaintShade[];
  }

  const isShadesEnabled = Boolean(
    row.shades_enabled ??
    rawSpecs._shades_enabled ??
    rawSpecs._paint_shades_config?.shadesEnabled ??
    (parsedShadesList.length > 0 && (rawSpecs._shades_enabled === true || row.shades_enabled === true))
  );

  const shadesTitle = String(
    row.shades_title ||
    rawSpecs._shades_title ||
    rawSpecs._paint_shades_config?.shadesTitle ||
    'Select Paint Shade / Color'
  );

  const shadeSheetUrl = String(
    row.shade_sheet_url ||
    rawSpecs._shade_sheet_url ||
    rawSpecs._paint_shades_config?.shadeSheetUrl ||
    ''
  );

  const primaryImage = row.main_image || row.image || (Array.isArray(row.gallery_images) && row.gallery_images[0]) || (Array.isArray(row.images) && row.images[0]) || (Array.isArray(row.gallery) && row.gallery[0]) || '';
  const galleryImagesList = Array.isArray(row.gallery_images) && row.gallery_images.length > 0 
    ? row.gallery_images 
    : (Array.isArray(row.images) && row.images.length > 0 
      ? row.images 
      : (Array.isArray(row.gallery) && row.gallery.length > 0 
        ? row.gallery 
        : (primaryImage ? [primaryImage] : [])));

  return {
    id: String(row.id),
    sku: row.sku || '',
    name: row.title || row.name || '',
    category: row.category_name || row.category || rawSpecs._category_name || 'Uncategorized',
    categoryId: row.category_id || row.categoryId || rawSpecs._category_id || '',
    brand: row.brand_name || row.brand || rawSpecs._brand_name || '',
    brandId: row.brand_id || row.brandId || rawSpecs._brand_id || '',
    image: primaryImage,
    images: galleryImagesList,
    description: row.description || '',
    shortDescription: row.short_description || row.shortDescription || '',
    price: resolvedPrice,
    salePrice: resolvedSalePrice || undefined,
    saleEnabled: isSaleEnabled,
    saleStartDate: row.sale_start_date || rawSpecs._sale_start_date || undefined,
    saleEndDate: row.sale_end_date || rawSpecs._sale_end_date || undefined,
    saleLabel: row.sale_label || rawSpecs._sale_label || undefined,
    saleBadgeColor: row.sale_badge_color || rawSpecs._sale_badge_color || undefined,
    saleMessage: row.sale_message || rawSpecs._sale_message || undefined,
    showSaleCountdown: Boolean(row.show_sale_countdown ?? rawSpecs._show_sale_countdown ?? (row.show_countdown ?? rawSpecs._show_countdown ?? true)),
    showDiscountPercentage: Boolean(row.show_discount_percentage ?? rawSpecs._show_discount_percentage ?? true),
    showSavingsAmount: Boolean(row.show_savings_amount ?? rawSpecs._show_savings_amount ?? (row.show_savings ?? rawSpecs._show_savings ?? true)),
    saleConfig: rawSpecs._sale_config || undefined,
    // Variants
    variantsEnabled: isVariantsEnabled,
    optionName: optionName,
    variantsList: parsedVariantsList,
    variantsConfig: {
      variantsEnabled: isVariantsEnabled,
      optionName: optionName,
      variants: parsedVariantsList
    },
    // Paint Shades
    shadesEnabled: isShadesEnabled,
    shadesTitle: shadesTitle,
    shadeSheetUrl: shadeSheetUrl || undefined,
    shadesList: parsedShadesList,
    paintShadesConfig: {
      shadesEnabled: isShadesEnabled,
      shadesTitle: shadesTitle,
      shadeSheetUrl: shadeSheetUrl || undefined,
      shades: parsedShadesList
    },
    isPaintProduct: Boolean(row.is_paint_product ?? rawSpecs._is_paint_product),
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
    displayOrder: Number(row.display_order ?? row.displayOrder ?? rawSpecs._display_order ?? 0),
    deliveryConfig: rawSpecs._delivery_config || row.delivery_config || undefined
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
  const rawSaleVal = product.salePrice ?? product.saleConfig?.salePrice;
  if (rawSaleVal) {
    const digitsOnly = String(rawSaleVal).replace(/[^0-9.]/g, '');
    if (digitsOnly) {
      numericSalePrice = parseFloat(digitsOnly) || null;
    }
  }

  const isSaleEnabled = Boolean(product.saleEnabled === true || product.saleConfig?.saleEnabled === true);
  const isVariantsEnabled = Boolean(product.variantsEnabled === true || product.variantsConfig?.variantsEnabled === true);
  const optionName = product.optionName || product.variantsConfig?.optionName || 'Size';
  const cleanVariantsList = (product.variantsList || product.variantsConfig?.variants || []).map((v, idx) => ({
    id: v.id || `var-${Date.now()}-${idx}`,
    name: v.name,
    sku: v.sku || null,
    price: v.price !== undefined && v.price !== null ? String(v.price) : null,
    sale_enabled: Boolean(v.saleEnabled),
    sale_price: v.salePrice !== undefined && v.salePrice !== null ? String(v.salePrice) : null,
    stock_quantity: typeof v.stockQuantity === 'number' ? v.stockQuantity : 10,
    stock_status: v.stockStatus || 'In Stock',
    image: v.image || null,
    is_active: v.isActive !== false,
    is_default: Boolean(v.isDefault),
    display_order: v.displayOrder ?? idx
  }));

  const isShadesEnabled = Boolean(product.shadesEnabled === true || product.paintShadesConfig?.shadesEnabled === true);
  const shadesTitle = product.shadesTitle || product.paintShadesConfig?.shadesTitle || 'Select Paint Shade / Color';
  const cleanShadesList = (product.shadesList || product.paintShadesConfig?.shades || []).map((s, idx) => ({
    id: s.id || `shade-${Date.now()}-${idx}`,
    name: s.name,
    code: s.code || null,
    colorHex: s.colorHex || '#FFFFFF',
    image: s.image || null,
    isActive: s.isActive !== false,
    displayOrder: s.displayOrder ?? idx,
    priceAdjustment: Number(s.priceAdjustment ?? 0)
  }));

  const specsWithMeta = {
    ...(product.specs || {}),
    _raw_price: product.price ?? null,
    _raw_sale_price: product.salePrice ?? null,
    _sale_enabled: isSaleEnabled,
    _sale_price: product.salePrice ?? product.saleConfig?.salePrice ?? null,
    _sale_start_date: product.saleStartDate ?? product.saleConfig?.saleStartDate ?? null,
    _sale_end_date: product.saleEndDate ?? product.saleConfig?.saleEndDate ?? null,
    _sale_label: product.saleLabel ?? product.saleConfig?.saleLabel ?? null,
    _sale_badge_color: product.saleBadgeColor ?? product.saleConfig?.saleBadgeColor ?? null,
    _sale_message: product.saleMessage ?? product.saleConfig?.saleMessage ?? null,
    _show_sale_countdown: Boolean(product.showSaleCountdown ?? product.saleConfig?.showCountdown ?? true),
    _show_discount_percentage: Boolean(product.showDiscountPercentage ?? product.saleConfig?.showDiscountPercentage ?? true),
    _show_savings_amount: Boolean(product.showSavingsAmount ?? product.saleConfig?.showSavings ?? true),
    _sale_config: product.saleConfig || null,
    _variants_enabled: isVariantsEnabled,
    _option_name: optionName,
    _variants_list: cleanVariantsList,
    _variants_config: {
      variantsEnabled: isVariantsEnabled,
      optionName: optionName,
      variants: cleanVariantsList
    },
    _shades_enabled: isShadesEnabled,
    _shades_title: shadesTitle,
    _shade_sheet_url: product.shadeSheetUrl || product.paintShadesConfig?.shadeSheetUrl || null,
    _shades_list: cleanShadesList,
    _paint_shades_config: {
      shadesEnabled: isShadesEnabled,
      shadesTitle: shadesTitle,
      shadeSheetUrl: product.shadeSheetUrl || product.paintShadesConfig?.shadeSheetUrl || null,
      shades: cleanShadesList
    },
    _is_paint_product: Boolean(product.isPaintProduct),
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
    _delivery_config: product.deliveryConfig || null,
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
    sale_enabled: isSaleEnabled,
    category_id: product.categoryId || null,
    brand_id: product.brandId || null,
    image: product.image || '',
    gallery: product.images || [],
    features: product.features || [],
    specifications: specsWithMeta,
    stock_quantity: product.stockQuantity ?? 10,
    is_featured: Boolean(product.isFeatured),
    rating: typeof product.rating === 'number' ? product.rating : (product.rating ? parseFloat(String(product.rating)) : 4.8),
    reviews_count: typeof product.reviewsCount === 'number' ? product.reviewsCount : (typeof product.reviews_count === 'number' ? product.reviews_count : 12),
    display_order: product.displayOrder ?? 0
  };
}

export function mapDbCategoryToCategory(r: any, idx: number): ProductCategory {
  const catId = String(r.id ?? r.category_id ?? r.cat_id ?? `cat-${idx + 1}`);
  const catName = String(r.name ?? r.title ?? r.category_name ?? r.label ?? `Category ${idx + 1}`);
  const rawSlug = r.slug ?? r.category_slug ?? catName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const cleanSlug = String(rawSlug).replace(/(^-|-$)+/g, '');

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
}

export function mapDbBrandToBrand(r: any, idx: number): ProductBrand {
  return {
    id: String(r.id),
    name: r.name || '',
    slug: r.slug || (r.name ? r.name.toLowerCase().replace(/[^a-z0-9]+/g, '-') : `brand-${idx + 1}`),
    logo: r.logo || '',
    bannerImage: r.banner_image || undefined,
    description: r.description || '',
    officialBadge: r.official_badge || undefined,
    isFeatured: Boolean(r.featured ?? r.is_featured),
    isActive: Boolean(r.enabled ?? r.is_active ?? true),
    displayOrder: Number(r.display_order ?? idx)
  };
}

export function mapDbHeroSettings(data: any, slideProductIds: string[] = []): HeroSettings {
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
}

export function mapDbDeliveryCity(r: any, idx: number): CityDeliveryInfo {
  return {
    id: String(r.id),
    cityName: r.name || r.city_name || '',
    areaTown: r.area_town || r.areaTown || undefined,
    status: (r.status === 'available' || r.status === 'unavailable' || r.status === 'contact_to_confirm') ? r.status : (r.enabled === false ? 'unavailable' : 'available'),
    deliveryFee: Number(r.delivery_fee ?? 0),
    deliveryFeeType: r.delivery_fee_type || r.deliveryFeeType || (Number(r.delivery_fee ?? 0) === 0 ? 'free' : 'fixed'),
    deliveryFeeCustomText: r.delivery_fee_custom_text || r.deliveryFeeCustomText || undefined,
    estimatedDays: r.estimated_days || r.estimatedDays || '2-4 Days',
    isEnabled: Boolean(r.enabled ?? true),
    isSameDayAvailable: Boolean(r.same_day_available ?? r.isSameDayAvailable),
    isNextDayAvailable: Boolean(r.next_day_available ?? r.isNextDayAvailable),
    displayOrder: Number(r.display_order ?? idx),
    notes: r.notes || undefined,
    coverageAreas: Array.isArray(r.coverage_areas) ? r.coverage_areas : (Array.isArray(r.coverageAreas) ? r.coverageAreas : undefined)
  };
}

// =========================================================
// 1. PRODUCTS CRUD (Direct Supabase SDK + Server Fallback)
// =========================================================

export async function fetchProductsFromSupabase(): Promise<Product[] | null> {
  await initializeSupabaseRuntime();

  // 1. Attempt Direct Supabase SDK Query
  if (isSupabaseConfigured) {
    try {
      let { data, error, status, statusText } = await supabase
        .from('products')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error && (error.code === '42703' || error.message?.toLowerCase().includes('column'))) {
        const fallbackRes = await supabase.from('products').select('*');
        data = fallbackRes.data;
        error = fallbackRes.error;
        status = fallbackRes.status;
        statusText = fallbackRes.statusText;
      }

      if (!error && Array.isArray(data)) {
        console.log(`[Supabase Direct SDK] Table: products | Status: SUCCESS | Records: ${data.length} | HTTP: ${status || 200}`);
        return data.map(mapDbProductToProduct);
      }
      
      console.warn(`[Supabase Direct SDK] Direct products fetch failed (HTTP ${status || 0}), attempting server proxy fallback...`);
    } catch (err: any) {
      console.warn('[Supabase Direct SDK] Direct products fetch network exception, attempting server proxy fallback...');
    }
  }

  // 2. Server Proxy Fallback
  try {
    const res = await fetch('/api/db/products', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        console.log(`[Supabase Proxy] Loaded ${json.data.length} products via server proxy`);
        return json.data.map(mapDbProductToProduct);
      }
    }
  } catch (proxyErr) {
    // Network offline or static host fallback
  }

  return null;
}

export async function upsertProductInSupabase(product: Product | Product[]): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  const list = Array.isArray(product) ? product : [product];

  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/db/products/upsert', {
      method: 'POST',
      headers,
      body: JSON.stringify({ products: list })
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || (result && result.success === false)) {
      const errMsg = result?.error || (res.statusText ? `${res.statusText} (${res.status})` : `Server returned error ${res.status}`);
      const err = formatSupabaseError(errMsg);
      console.error(`[Supabase API] Product upsert failed: ${err}`);
      return { success: false, error: err };
    }
    console.log(`[Supabase API] Upserted ${list.length} product(s) successfully`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err?.message || String(err)) };
  }
}

export async function deleteProductFromSupabase(productId: string): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/db/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE',
      headers
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || (result && result.success === false)) {
      const errMsg = result?.error || (res.statusText ? `${res.statusText} (${res.status})` : `Server returned error ${res.status}`);
      const err = formatSupabaseError(errMsg);
      console.error(`[Supabase API] Product delete failed: ${err}`);
      return { success: false, error: err };
    }
    console.log(`[Supabase API] Deleted product ID: ${productId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err?.message || String(err)) };
  }
}

// =========================================================
// 2. CATEGORIES CRUD (Direct Supabase SDK + Server Fallback)
// =========================================================

export async function fetchCategoriesFromSupabase(): Promise<ProductCategory[] | null> {
  await initializeSupabaseRuntime();

  // 1. Attempt Direct Supabase SDK Query
  if (isSupabaseConfigured) {
    try {
      let { data, error, status } = await supabase
        .from('categories')
        .select('*');

      if (!error && Array.isArray(data)) {
        const mappedCategories: ProductCategory[] = data.map((r: any, idx: number) => mapDbCategoryToCategory(r, idx));
        mappedCategories.sort((a, b) => {
          if ((a.displayOrder ?? 0) !== (b.displayOrder ?? 0)) {
            return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
          }
          return a.name.localeCompare(b.name);
        });
        console.log(`[Supabase Direct SDK] Categories mapped successfully: ${mappedCategories.length} categories ready`);
        return mappedCategories;
      }
      console.warn(`[Supabase Direct SDK] Direct categories fetch failed (HTTP ${status || 0}), attempting server proxy fallback...`);
    } catch (err: any) {
      console.warn('[Supabase Direct SDK] Direct categories fetch network exception, attempting server proxy fallback...');
    }
  }

  // 2. Server Proxy Fallback
  try {
    const res = await fetch('/api/db/categories', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const mappedCategories: ProductCategory[] = json.data.map((r: any, idx: number) => mapDbCategoryToCategory(r, idx));
        mappedCategories.sort((a, b) => {
          if ((a.displayOrder ?? 0) !== (b.displayOrder ?? 0)) {
            return (a.displayOrder ?? 0) - (b.displayOrder ?? 0);
          }
          return a.name.localeCompare(b.name);
        });
        console.log(`[Supabase Proxy] Loaded ${mappedCategories.length} categories via server proxy`);
        return mappedCategories;
      }
    }
  } catch (proxyErr) {
    // offline or static hosting
  }

  return null;
}

export async function upsertCategoryInSupabase(category: ProductCategory | ProductCategory[]): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  const list = Array.isArray(category) ? category : [category];

  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/db/categories/upsert', {
      method: 'POST',
      headers,
      body: JSON.stringify({ categories: list })
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || (result && result.success === false)) {
      const errMsg = result?.error || (res.statusText ? `${res.statusText} (${res.status})` : `Server returned error ${res.status}`);
      const err = formatSupabaseError(errMsg);
      console.error(`[Supabase API] Category upsert failed: ${err}`);
      return { success: false, error: err };
    }
    console.log(`[Supabase API] Upserted ${list.length} category/categories successfully`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err?.message || String(err)) };
  }
}

export async function deleteCategoryFromSupabase(categoryId: string): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/db/categories/${encodeURIComponent(categoryId)}`, {
      method: 'DELETE',
      headers
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || (result && result.success === false)) {
      const errMsg = result?.error || (res.statusText ? `${res.statusText} (${res.status})` : `Server returned error ${res.status}`);
      const err = formatSupabaseError(errMsg);
      console.error(`[Supabase API] Category delete failed: ${err}`);
      return { success: false, error: err };
    }
    console.log(`[Supabase API] Deleted category ID: ${categoryId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err?.message || String(err)) };
  }
}

// =========================================================
// 3. BRANDS CRUD (Direct Supabase SDK + Server Fallback)
// =========================================================

export async function fetchBrandsFromSupabase(): Promise<ProductBrand[] | null> {
  await initializeSupabaseRuntime();

  // 1. Attempt Direct Supabase SDK Query
  if (isSupabaseConfigured) {
    try {
      let { data, error, status } = await supabase
        .from('brands')
        .select('*')
        .order('display_order', { ascending: true });

      if (error && (error.code === '42703' || error.message?.toLowerCase().includes('column'))) {
        const fallbackRes = await supabase.from('brands').select('*');
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (!error && Array.isArray(data)) {
        console.log(`[Supabase Direct SDK] Table: brands | Status: SUCCESS | Records: ${data.length} | HTTP: ${status || 200}`);
        return data.map((r: any, idx: number) => mapDbBrandToBrand(r, idx));
      }
      console.warn(`[Supabase Direct SDK] Direct brands fetch failed (HTTP ${status || 0}), attempting server proxy fallback...`);
    } catch (err: any) {
      console.warn('[Supabase Direct SDK] Direct brands fetch network exception, attempting server proxy fallback...');
    }
  }

  // 2. Server Proxy Fallback
  try {
    const res = await fetch('/api/db/brands', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        console.log(`[Supabase Proxy] Loaded ${json.data.length} brands via server proxy`);
        return json.data.map((r: any, idx: number) => mapDbBrandToBrand(r, idx));
      }
    }
  } catch (proxyErr) {
    // offline or static host fallback
  }

  return null;
}

export async function upsertBrandInSupabase(brand: ProductBrand | ProductBrand[]): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  const list = Array.isArray(brand) ? brand : [brand];

  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/db/brands/upsert', {
      method: 'POST',
      headers,
      body: JSON.stringify({ brands: list })
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || (result && result.success === false)) {
      const errMsg = result?.error || (res.statusText ? `${res.statusText} (${res.status})` : `Server returned error ${res.status}`);
      const err = formatSupabaseError(errMsg);
      console.error(`[Supabase API] Brand upsert failed: ${err}`);
      return { success: false, error: err };
    }
    console.log(`[Supabase API] Upserted ${list.length} brand(s) successfully`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err?.message || String(err)) };
  }
}

export async function deleteBrandFromSupabase(brandId: string): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/db/brands/${encodeURIComponent(brandId)}`, {
      method: 'DELETE',
      headers
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || (result && result.success === false)) {
      const errMsg = result?.error || (res.statusText ? `${res.statusText} (${res.status})` : `Server returned error ${res.status}`);
      const err = formatSupabaseError(errMsg);
      console.error(`[Supabase API] Brand delete failed: ${err}`);
      return { success: false, error: err };
    }
    console.log(`[Supabase API] Deleted brand ID: ${brandId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err?.message || String(err)) };
  }
}

// =========================================================
// 4. HERO SETTINGS & SLIDES (Direct Supabase SDK + Server Fallback)
// =========================================================

export async function fetchHeroSettingsFromSupabase(): Promise<HeroSettings | null> {
  await initializeSupabaseRuntime();

  // 1. Attempt Direct Supabase SDK Query
  if (isSupabaseConfigured) {
    try {
      const { data, error, status } = await supabase
        .from('hero_settings')
        .select('*')
        .eq('id', 'default')
        .maybeSingle();

      if (!error && data) {
        let slideProductIds: string[] = [];
        try {
          const { data: slideData } = await supabase
            .from('hero_slides')
            .select('*')
            .eq('enabled', true)
            .order('display_order', { ascending: true });

          if (slideData && slideData.length > 0) {
            slideProductIds = slideData.map((s: any) => String(s.product_id)).filter(Boolean);
          }
        } catch {}

        console.log(`[Supabase Direct SDK] Table: hero_settings | Status: SUCCESS | Config Found: true | HTTP: ${status || 200}`);
        return mapDbHeroSettings(data, slideProductIds);
      }
      
      if (!error && !data) {
        console.log(`[Supabase Direct SDK] Table: hero_settings | Status: SUCCESS (No default row)`);
        return null;
      }

      console.warn(`[Supabase Direct SDK] Direct hero settings fetch failed (HTTP ${status || 0}), attempting server proxy fallback...`);
    } catch (err: any) {
      console.warn('[Supabase Direct SDK] Direct hero settings fetch network exception, attempting server proxy fallback...');
    }
  }

  // 2. Server Proxy Fallback
  try {
    const res = await fetch('/api/db/hero-settings', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        console.log('[Supabase Proxy] Loaded hero settings via server proxy');
        return mapDbHeroSettings(json.data);
      }
    }
  } catch (proxyErr) {
    // offline or static host fallback
  }

  return null;
}

export async function saveHeroSettingsToSupabase(settings: HeroSettings): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/db/hero-settings/upsert', {
      method: 'POST',
      headers,
      body: JSON.stringify({ settings })
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || (result && result.success === false)) {
      const errMsg = result?.error || (res.statusText ? `${res.statusText} (${res.status})` : `Server returned error ${res.status}`);
      const err = formatSupabaseError(errMsg);
      console.error(`[Supabase API] Hero settings save failed: ${err}`);
      return { success: false, error: err };
    }
    console.log('[Supabase API] Saved hero_settings successfully');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err?.message || String(err)) };
  }
}

// =========================================================
// 5. ORDERS CRUD (Direct Supabase SDK + Server Fallback)
// =========================================================

const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);

export async function fetchOrdersFromSupabase(customerId?: string): Promise<CustomerOrder[] | null> {
  await initializeSupabaseRuntime();

  // 1. Attempt Direct Supabase SDK Query
  if (isSupabaseConfigured) {
    try {
      let query = supabase.from('orders').select('*, order_items(*)').order('created_at', { ascending: false });
      if (customerId) {
        if (isUUID(customerId)) {
          query = query.eq('customer_id', customerId);
        } else {
          query = query.or(`customer_phone.eq.${customerId},id.eq.${customerId}`);
        }
      }
      let { data, error, status } = await query;

      if (error && (error.code === '42703' || error.message?.toLowerCase().includes('column'))) {
        const fallbackRes = await supabase.from('orders').select('*');
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (!error && Array.isArray(data)) {
        console.log(`[Supabase Direct SDK] Table: orders | Status: SUCCESS | Records: ${data.length} | HTTP: ${status || 200}`);
        return data.map(mapDbOrderToCustomerOrder);
      }
      console.warn(`[Supabase Direct SDK] Direct orders fetch failed (HTTP ${status || 0}), attempting server proxy fallback...`);
    } catch (err: any) {
      console.warn('[Supabase Direct SDK] Direct orders fetch network exception, attempting server proxy fallback...');
    }
  }

  // 2. Server Proxy Fallback
  try {
    const url = `/api/db/orders${customerId ? `?customerId=${encodeURIComponent(customerId)}` : ''}`;
    const res = await fetch(url, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        console.log(`[Supabase Proxy] Loaded ${json.data.length} orders via server proxy`);
        return json.data.map(mapDbOrderToCustomerOrder);
      }
    }
  } catch (proxyErr) {
    // offline or static host fallback
  }

  return null;
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
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/db/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ status, note })
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || (result && result.success === false)) {
      const errMsg = result?.error || (res.statusText ? `${res.statusText} (${res.status})` : `Server returned error ${res.status}`);
      const err = formatSupabaseError(errMsg);
      console.error(`[Supabase API] Order status update failed: ${err}`);
      return { success: false, error: err };
    }
    console.log(`[Supabase API] Updated order ${orderId} to status: ${status}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err?.message || String(err)) };
  }
}

// =========================================================
// 6. DELIVERY CITIES CRUD (Direct Supabase SDK + Server Fallback)
// =========================================================

export async function fetchDeliveryCitiesFromSupabase(): Promise<CityDeliveryInfo[] | null> {
  await initializeSupabaseRuntime();

  // 1. Attempt Direct Supabase SDK Query
  if (isSupabaseConfigured) {
    try {
      let { data, error, status } = await supabase
        .from('delivery_cities')
        .select('*')
        .order('display_order', { ascending: true });

      if (error && (error.code === '42703' || error.message?.toLowerCase().includes('column'))) {
        const fallbackRes = await supabase.from('delivery_cities').select('*');
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (!error && Array.isArray(data)) {
        console.log(`[Supabase Direct SDK] Table: delivery_cities | Status: SUCCESS | Records: ${data.length} | HTTP: ${status || 200}`);
        return data.map((r: any, idx: number) => mapDbDeliveryCity(r, idx));
      }
      console.warn(`[Supabase Direct SDK] Direct delivery cities fetch failed (HTTP ${status || 0}), attempting server proxy fallback...`);
    } catch (err: any) {
      console.warn('[Supabase Direct SDK] Direct delivery cities fetch network exception, attempting server proxy fallback...');
    }
  }

  // 2. Server Proxy Fallback
  try {
    const res = await fetch('/api/db/delivery-cities', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        console.log(`[Supabase Proxy] Loaded ${json.data.length} delivery cities via server proxy`);
        return json.data.map((r: any, idx: number) => mapDbDeliveryCity(r, idx));
      }
    }
  } catch (proxyErr) {
    // offline or static host fallback
  }

  return null;
}

export async function upsertDeliveryCityInSupabase(city: CityDeliveryInfo): Promise<{ success: boolean; error?: string }> {
  return saveDeliveryCitiesToSupabase([city]);
}

export async function saveDeliveryCitiesToSupabase(cities: CityDeliveryInfo[]): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/db/delivery-cities/upsert', {
      method: 'POST',
      headers,
      body: JSON.stringify({ cities })
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || (result && result.success === false)) {
      const errMsg = result?.error || (res.statusText ? `${res.statusText} (${res.status})` : `Server returned error ${res.status}`);
      const err = formatSupabaseError(errMsg);
      console.error(`[Supabase API] Delivery cities save failed: ${err}`);
      return { success: false, error: err };
    }
    console.log(`[Supabase API] Saved ${cities.length} delivery cities successfully`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err?.message || String(err)) };
  }
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

  // 1. Attempt Direct Supabase SDK Query
  if (isSupabaseConfigured) {
    try {
      // 1a. Try key-value table (key, value)
      const { data: kvData, error: kvErr, status: kvStatus } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (!kvErr && kvData && kvData.value !== undefined) {
        console.log(`[Supabase Direct SDK] Table: site_settings (KV) | Key: ${key} | Status: SUCCESS | HTTP: ${kvStatus || 200}`);
        return kvData.value as T;
      }

      // 1b. Try single row config with named column (id = 'config')
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
    } catch (err: any) {
      console.warn(`[Supabase Direct SDK] Site setting (${key}) fetch exception, attempting proxy fallback...`);
    }
  }

  // 2. Server Proxy Fallback
  try {
    const res = await fetch(`/api/db/site-settings/${encodeURIComponent(key)}`, { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data !== undefined) {
        console.log(`[Supabase Proxy] Loaded site setting "${key}" via server proxy`);
        return json.data as T;
      }
    }
  } catch (proxyErr) {
    // offline or static host fallback
  }

  return null;
}

export async function saveSiteSettingToSupabase(key: string, value: any): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/db/site-settings/upsert', {
      method: 'POST',
      headers,
      body: JSON.stringify({ key, value })
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || (result && result.success === false)) {
      const errMsg = result?.error || (res.statusText ? `${res.statusText} (${res.status})` : `Server returned error ${res.status}`);
      const err = formatSupabaseError(errMsg);
      console.error(`[Supabase API] Site setting save failed for key "${key}": ${err}`);
      return { success: false, error: err };
    }
    console.log(`[Supabase API] Saved site_setting: ${key}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err?.message || String(err)) };
  }
}

export async function saveBuildMaterialEstimatorToSupabase(config: any): Promise<{ success: boolean; error?: string }> {
  return saveSiteSettingToSupabase('zst_planner_config_v1', config);
}

export async function fetchBuildMaterialEstimatorFromSupabase(): Promise<any | null> {
  return fetchSiteSettingFromSupabase<any>('zst_planner_config_v1');
}

// =========================================================
// 7B. AI KNOWLEDGE BASE & AI ASSISTANT CONFIG PERSISTENCE
// =========================================================

export function mapDbAiKnowledgeToKnowledge(row: any, fallbackIndex: number = 0): AiCustomKnowledge {
  return {
    id: row.id || `ck-${Date.now()}-${fallbackIndex}`,
    title: row.title || 'Untitled Knowledge Entry',
    category: (row.category || 'general') as any,
    questionOrTopic: row.question_or_topic || row.questionOrTopic || '',
    answerOrContent: row.answer_or_content || row.answerOrContent || '',
    isEnabled: row.is_enabled !== undefined ? Boolean(row.is_enabled) : (row.isEnabled !== undefined ? Boolean(row.isEnabled) : true),
    displayOrder: typeof row.display_order === 'number' ? row.display_order : (typeof row.displayOrder === 'number' ? row.displayOrder : fallbackIndex + 1)
  };
}

export function mapKnowledgeToDbAiKnowledge(item: AiCustomKnowledge, fallbackIndex: number = 0): Record<string, any> {
  return {
    id: item.id || `ck-${Date.now()}-${fallbackIndex}`,
    title: item.title || 'Untitled Knowledge Entry',
    category: item.category || 'general',
    question_or_topic: item.questionOrTopic || '',
    answer_or_content: item.answerOrContent || '',
    is_enabled: item.isEnabled !== false,
    display_order: item.displayOrder || (fallbackIndex + 1),
    updated_at: new Date().toISOString()
  };
}

export async function fetchAiKnowledgeFromSupabase(): Promise<AiCustomKnowledge[] | null> {
  await initializeSupabaseRuntime();

  // 1. Attempt Direct Supabase SDK Query on dedicated ai_knowledge table
  if (isSupabaseConfigured) {
    try {
      const { data, error, status } = await supabase
        .from('ai_knowledge')
        .select('*')
        .order('display_order', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        console.log(`[Supabase Direct SDK] Table: ai_knowledge | Status: SUCCESS | Records: ${data.length} | HTTP: ${status || 200}`);
        return data.map((r: any, idx: number) => mapDbAiKnowledgeToKnowledge(r, idx));
      }
    } catch (err: any) {
      console.warn('[Supabase Direct SDK] Direct ai_knowledge fetch exception, checking site_settings fallback...');
    }
  }

  // 2. Server Proxy Fallback for ai-knowledge
  try {
    const res = await fetch('/api/db/ai-knowledge', { cache: 'no-store' });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        console.log(`[Supabase Proxy] Loaded ${json.data.length} ai_knowledge records via server proxy`);
        return json.data.map((r: any, idx: number) => mapDbAiKnowledgeToKnowledge(r, idx));
      }
    }
  } catch (proxyErr) {
    // try site_settings fallback
  }

  // 3. Fallback to site_settings table 'zst_ai_assistant_config_v1'
  try {
    const aiConfig = await fetchSiteSettingFromSupabase<AiAssistantConfig>('zst_ai_assistant_config_v1');
    if (aiConfig && Array.isArray(aiConfig.customKnowledge) && aiConfig.customKnowledge.length > 0) {
      console.log(`[Supabase Direct SDK] Loaded ${aiConfig.customKnowledge.length} knowledge entries from site_settings`);
      return aiConfig.customKnowledge;
    }
  } catch {}

  return null;
}

export async function upsertAiKnowledgeInSupabase(
  knowledge: AiCustomKnowledge | AiCustomKnowledge[]
): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  const list = Array.isArray(knowledge) ? knowledge : [knowledge];
  if (list.length === 0) return { success: true };

  // 1. Direct Supabase SDK upsert to ai_knowledge table
  if (isSupabaseConfigured) {
    try {
      const dbPayload = list.map((item, idx) => mapKnowledgeToDbAiKnowledge(item, idx));
      const { error, status } = await supabase.from('ai_knowledge').upsert(dbPayload, { onConflict: 'id' });
      if (!error) {
        console.log(`[Supabase Direct SDK] Upserted ${list.length} ai_knowledge records directly (HTTP ${status || 200})`);
      }
    } catch (sdkErr) {
      console.warn('[Supabase Direct SDK] Direct ai_knowledge upsert skipped, using backend proxy...');
    }
  }

  // 2. Backend Proxy upsert
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/db/ai-knowledge/upsert', {
      method: 'POST',
      headers,
      body: JSON.stringify({ knowledge: list })
    });
    const result = await res.json().catch(() => ({ success: false, error: res.statusText }));
    if (!res.ok || !result.success) {
      console.warn(`[Supabase API] /api/db/ai-knowledge/upsert warning: ${result.error}`);
    }
  } catch (proxyErr) {
    console.warn('[Supabase API] Proxy upsert error for ai_knowledge:', proxyErr);
  }

  return { success: true };
}

export async function deleteAiKnowledgeFromSupabase(id: string): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();

  // 1. Direct Supabase SDK delete
  if (isSupabaseConfigured) {
    try {
      await supabase.from('ai_knowledge').delete().eq('id', id);
    } catch (err) {}
  }

  // 2. Server Proxy Delete
  try {
    const headers = await getAuthHeaders();
    await fetch(`/api/db/ai-knowledge/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers
    });
  } catch (err) {}

  return { success: true };
}

export async function fetchAiAssistantConfigFromSupabase(): Promise<AiAssistantConfig | null> {
  const config = await fetchSiteSettingFromSupabase<AiAssistantConfig>('zst_ai_assistant_config_v1');
  const knowledge = await fetchAiKnowledgeFromSupabase();

  if (config) {
    if (knowledge && knowledge.length > 0) {
      config.customKnowledge = knowledge;
    }
    return config;
  }

  if (knowledge && knowledge.length > 0) {
    return {
      isEnabled: true,
      aiName: "Zafar AI Shopping Assistant",
      welcomeMessage: "Welcome to Zafar Sarwar Traders. How can I assist you with your luxury sanitaryware, plumbing, or building material project today?",
      selectedModel: "gemini-3.6-flash",
      theme: "dark-cyan",
      suggestedQuestions: [
        "Show me faucets under 10000",
        "Show me black shower sets",
        "Which Sonex products do you have?",
        "Do you deliver to Lahore?"
      ],
      dataSources: {
        products: true,
        categories: true,
        brands: true,
        faqs: true,
        reviews: true,
        companyInfo: true,
        deliveryInfo: true,
        customKnowledge: true
      },
      customKnowledge: knowledge,
      enableProductRecommendations: true,
      enableQuoteAssistance: true,
      enableBathroomPlanner: true
    };
  }

  return null;
}

export async function saveAiAssistantConfigToSupabase(config: AiAssistantConfig): Promise<{ success: boolean; error?: string }> {
  // 1. Save full config object to site_settings (key: zst_ai_assistant_config_v1)
  const siteSettingRes = await saveSiteSettingToSupabase('zst_ai_assistant_config_v1', config);

  // 2. Also persist individual customKnowledge items to dedicated ai_knowledge table for relational indexing
  if (Array.isArray(config.customKnowledge) && config.customKnowledge.length > 0) {
    await upsertAiKnowledgeInSupabase(config.customKnowledge);
  }

  return siteSettingRes;
}

// =========================================================
// 7B. SMART CONSTRUCTION & FITTING BUILDER CRUD
// =========================================================

export async function fetchFittingBuilderConfigFromSupabase(): Promise<FittingBuilderConfig | null> {
  const config = await fetchSiteSettingFromSupabase<FittingBuilderConfig>('zst_fitting_builder_config_v1') || 
                 await fetchSiteSettingFromSupabase<FittingBuilderConfig>('zst_construction_builder_config_v1');
  if (config && Array.isArray(config.packageTypes) && Array.isArray(config.items) && config.items.length > 0) {
    return config;
  }
  return null;
}

export async function saveFittingBuilderConfigToSupabase(config: FittingBuilderConfig): Promise<{ success: boolean; error?: string }> {
  const cleanConfig = {
    ...config,
    updatedAt: new Date().toISOString()
  };
  // 1. Save full config to site_settings (both keys for full backwards compatibility)
  const siteSettingRes = await saveSiteSettingToSupabase('zst_fitting_builder_config_v1', cleanConfig);
  await saveSiteSettingToSupabase('zst_construction_builder_config_v1', cleanConfig);
  
  // 2. Also attempt backend proxy sync
  try {
    const headers = await getAuthHeaders();
    await fetch('/api/db/fitting-builder', {
      method: 'POST',
      headers,
      body: JSON.stringify({ config: cleanConfig })
    });
  } catch (err) {
    // Non-blocking
  }

  return siteSettingRes;
}


// =========================================================
// 8. STORAGE MEDIA UPLOAD (Direct Supabase SDK)
// =========================================================

export async function uploadMediaToSupabase(
  fileOrDataUrl: File | Blob | string,
  bucketName: string = 'product-media',
  customFileName?: string
): Promise<{ url?: string; error?: string }> {
  try {
    await initializeSupabaseRuntime();
  } catch {}

  try {
    let base64String: string = '';
    let mimeType = 'image/jpeg';
    let fileExt = 'jpg';

    if (typeof fileOrDataUrl === 'string') {
      if (fileOrDataUrl.startsWith('data:')) {
        base64String = fileOrDataUrl;
        const mimeMatch = fileOrDataUrl.match(/:(.*?);/);
        mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        fileExt = mimeType.split('/')[1] || 'jpg';
      } else {
        // Already a remote URL
        return { url: fileOrDataUrl };
      }
    } else if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
      mimeType = fileOrDataUrl.type || 'image/jpeg';
      fileExt = (fileOrDataUrl instanceof File ? fileOrDataUrl.name.split('.').pop() : mimeType.split('/')[1]) || 'jpg';
      base64String = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(fileOrDataUrl);
      });
    }

    const fileName = customFileName || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

    // 1. Try secure backend upload proxy first (uses service role key on server or local static uploads)
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/db/upload', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fileData: base64String,
          fileName,
          bucketName,
          mimeType
        })
      });
      const json = await res.json().catch(() => null);
      if (res.ok && json?.success && json?.url) {
        console.log(`[Storage] Upload SUCCESS via server backend: ${json.url}`);
        return { url: json.url };
      }
    } catch (proxyErr) {
      console.warn('[Storage] Backend upload proxy attempt skipped/failed:', proxyErr);
    }

    // 2. Direct Supabase SDK fallback if configured
    if (isSupabaseConfigured && supabase) {
      try {
        let fileBody: Blob;
        if (base64String.startsWith('data:')) {
          const parts = base64String.split(',');
          const byteString = atob(parts[1]);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          fileBody = new Blob([ab], { type: mimeType });
        } else {
          fileBody = fileOrDataUrl as Blob;
        }

        const filePath = `uploads/${fileName}`;
        let availableBuckets: string[] = [];
        try {
          const { data: bList } = await supabase.storage.listBuckets();
          if (bList && bList.length > 0) {
            availableBuckets = bList.map((b: any) => b.name);
          }
        } catch {}

        const candidateBuckets = Array.from(new Set([
          bucketName,
          bucketName.replace(/-/g, ' '),
          bucketName.replace(/\s+/g, '-'),
          'project media',
          'project-media',
          'brand assets',
          'brand-assets',
          'hero media',
          'hero-media',
          'product-media',
          'products',
          'categories',
          'gallery',
          'media',
          'public',
          ...availableBuckets
        ]));

        for (const b of candidateBuckets) {
          try {
            const { error: uploadErr } = await supabase.storage.from(b).upload(filePath, fileBody, {
              cacheControl: '3600',
              upsert: true
            });

            if (!uploadErr) {
              const { data: publicUrlData } = supabase.storage.from(b).getPublicUrl(filePath);
              console.log(`[Supabase Direct SDK] Storage: Upload SUCCESS to "${b}". Public URL: ${publicUrlData.publicUrl}`);
              return { url: publicUrlData.publicUrl };
            }
          } catch {}
        }
      } catch (directSdkErr) {
        console.warn('[Supabase Direct SDK] Storage direct upload error:', directSdkErr);
      }
    }

    // 3. Guaranteed fallback: return base64DataUrl
    if (base64String) {
      return { url: base64String };
    }

    return { error: 'Unable to process image file.' };
  } catch (err: any) {
    console.error(`[Supabase Storage] Upload Error:`, err);
    return { error: err?.message || 'Media upload failed' };
  }
}
