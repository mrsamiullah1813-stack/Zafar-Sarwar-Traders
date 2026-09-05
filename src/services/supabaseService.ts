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
  FittingBuilderConfig,
  PaymentMethodConfig,
  HowToOrderConfig
} from '../types';
import { defaultFittingBuilderConfig } from '../data/defaultFittingBuilderData';
import { parseNumericPrice } from '../utils/pricingUtils';

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
// ERROR FORMATTER & ROBUST DIRECT SUPABASE UPSERT
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

// In-memory cache of columns known to be missing from the remote database schema per table
const clientKnownInvalidColumnsByTable = new Map<string, Set<string>>();

export async function robustDirectSupabaseUpsert(
  table: string, 
  payloads: any[], 
  options: { onConflict?: string } = { onConflict: 'id' }
): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!isSupabaseConfigured || !supabase) {
    return { success: false, error: 'Supabase client not configured' };
  }
  if (!payloads || payloads.length === 0) return { success: true };

  const badCols = clientKnownInvalidColumnsByTable.get(table);
  let currentPayloads = payloads.map(p => {
    const copy = { ...p };
    if (badCols && badCols.size > 0) {
      badCols.forEach(col => delete copy[col]);
    }
    return copy;
  });

  const maxRetries = 50;
  let attempts = 0;
  let lastError: any = null;

  while (attempts < maxRetries) {
    attempts++;
    const { data, error } = await supabase.from(table).upsert(currentPayloads, options);
    if (!error) {
      if (attempts > 1) {
        console.log(`[Supabase Direct SDK] Table "${table}": Successfully saved after ${attempts} schema adaptation attempt(s).`);
      }
      return { success: true, data };
    }

    lastError = error;
    const errMsg = String(error.message || '');

    // 1. Missing Column Error (PostgREST schema cache or relation missing column)
    const colMatch =
      errMsg.match(/Could not find the '([^']+)' column/i) ||
      errMsg.match(/Could not find the "([^"]+)" column/i) ||
      errMsg.match(/column "([^"]+)" of relation/i) ||
      errMsg.match(/column '([^']+)' of relation/i) ||
      errMsg.match(/column "([^"]+)" does not exist/i) ||
      errMsg.match(/column '([^']+)' does not exist/i) ||
      errMsg.match(/column ([a-zA-Z0-9_]+) does not exist/i) ||
      errMsg.match(/has no column named '([^']+)'/i) ||
      errMsg.match(/has no column named "([^"]+)"/i) ||
      errMsg.match(/has no column named ([a-zA-Z0-9_]+)/i);

    if (colMatch && colMatch[1]) {
      const badCol = colMatch[1];
      if (!clientKnownInvalidColumnsByTable.has(table)) {
        clientKnownInvalidColumnsByTable.set(table, new Set());
      }
      clientKnownInvalidColumnsByTable.get(table)!.add(badCol);
      console.warn(`[Supabase Direct SDK] Table "${table}": Column "${badCol}" not found in schema cache. Stripping column and retrying (attempt ${attempts})...`);
      currentPayloads = currentPayloads.map(item => {
        const copy = { ...item };
        delete copy[badCol];
        return copy;
      });
      continue;
    }

    // 2. Foreign Key Constraint Violation (e.g. category_id, brand_id, product_id, customer_id)
    if (error.code === '23503' || errMsg.toLowerCase().includes('foreign key') || errMsg.toLowerCase().includes('violates foreign key')) {
      console.warn(`[Supabase Direct SDK] Table "${table}": Foreign key constraint violation (${errMsg}). Nullifying relation fields and retrying (attempt ${attempts})...`);
      currentPayloads = currentPayloads.map(item => {
        const copy = { ...item };
        if ('category_id' in copy) copy.category_id = null;
        if ('brand_id' in copy) copy.brand_id = null;
        if ('product_id' in copy) copy.product_id = null;
        if ('customer_id' in copy) copy.customer_id = null;
        if ('order_id' in copy) copy.order_id = null;
        return copy;
      });
      continue;
    }

    // 3. Unique Constraint Violation on slug
    if (error.code === '23505' && (errMsg.toLowerCase().includes('slug') || errMsg.toLowerCase().includes('unique'))) {
      currentPayloads = currentPayloads.map((item, i) => {
        const copy = { ...item };
        if (copy.slug) {
          copy.slug = `${copy.slug}-${Date.now().toString(36).slice(-4)}${i + 1}`;
        }
        return copy;
      });
      continue;
    }

    break;
  }

  return { success: false, error: formatSupabaseError(lastError?.message || 'Database upsert failed after schema negotiation') };
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
    (resolvedSalePrice && parseNumericPrice(resolvedSalePrice) > 0 && rawSpecs._sale_enabled !== false)
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

  const primaryImage = row.main_image || row.image || row.image_url || row.img_url || row.cover_image || row.thumbnail || row.picture || row.photo || (Array.isArray(row.gallery_images) && row.gallery_images[0]) || (Array.isArray(row.images) && row.images[0]) || (Array.isArray(row.gallery) && row.gallery[0]) || '';
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
    // Quantity Configuration
    quantityEnabled: Boolean(row.quantity_enabled ?? rawSpecs._quantity_enabled ?? rawSpecs._quantity_config?.quantityEnabled ?? false),
    minQuantity: typeof (row.min_quantity ?? rawSpecs._min_quantity ?? rawSpecs._quantity_config?.minQuantity) === 'number'
      ? Number(row.min_quantity ?? rawSpecs._min_quantity ?? rawSpecs._quantity_config?.minQuantity)
      : undefined,
    maxQuantity: typeof (row.max_quantity ?? rawSpecs._max_quantity ?? rawSpecs._quantity_config?.maxQuantity) === 'number'
      ? Number(row.max_quantity ?? rawSpecs._max_quantity ?? rawSpecs._quantity_config?.maxQuantity)
      : undefined,
    defaultQuantity: typeof (row.default_quantity ?? rawSpecs._default_quantity ?? rawSpecs._quantity_config?.defaultQuantity) === 'number'
      ? Number(row.default_quantity ?? rawSpecs._default_quantity ?? rawSpecs._quantity_config?.defaultQuantity)
      : undefined,
    quantityStep: typeof (row.quantity_step ?? rawSpecs._quantity_step ?? rawSpecs._quantity_config?.quantityStep) === 'number'
      ? Number(row.quantity_step ?? rawSpecs._quantity_step ?? rawSpecs._quantity_config?.quantityStep)
      : undefined,
    unitLabel: row.unit_label || rawSpecs._unit_label || rawSpecs._quantity_config?.unitLabel || undefined,
    quantityConfig: rawSpecs._quantity_config || (Boolean(row.quantity_enabled ?? rawSpecs._quantity_enabled) ? {
      quantityEnabled: Boolean(row.quantity_enabled ?? rawSpecs._quantity_enabled),
      minQuantity: Number(row.min_quantity ?? rawSpecs._min_quantity ?? 1),
      maxQuantity: typeof (row.max_quantity ?? rawSpecs._max_quantity) === 'number' ? Number(row.max_quantity ?? rawSpecs._max_quantity) : undefined,
      defaultQuantity: Number(row.default_quantity ?? rawSpecs._default_quantity ?? 1),
      quantityStep: Number(row.quantity_step ?? rawSpecs._quantity_step ?? 1),
      unitLabel: row.unit_label || rawSpecs._unit_label || 'Pcs'
    } : undefined),
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
  const numericPrice = parseNumericPrice(product.price);
  const rawSaleVal = product.salePrice ?? product.saleConfig?.salePrice;
  const numericSalePrice = rawSaleVal ? (parseNumericPrice(rawSaleVal) || null) : null;

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

  const isQuantityEnabled = Boolean(product.quantityEnabled === true || product.quantityConfig?.quantityEnabled === true);
  const quantityConfigObj = isQuantityEnabled ? {
    quantityEnabled: true,
    minQuantity: Number(product.minQuantity ?? product.quantityConfig?.minQuantity ?? 1),
    maxQuantity: typeof (product.maxQuantity ?? product.quantityConfig?.maxQuantity) === 'number' ? Number(product.maxQuantity ?? product.quantityConfig?.maxQuantity) : undefined,
    defaultQuantity: Number(product.defaultQuantity ?? product.quantityConfig?.defaultQuantity ?? 1),
    quantityStep: Number(product.quantityStep ?? product.quantityConfig?.quantityStep ?? 1),
    unitLabel: product.unitLabel || product.quantityConfig?.unitLabel || 'Pcs'
  } : null;

  const specsWithMeta = {
    ...(product.specs || {}),
    _raw_price: product.price ?? null,
    _raw_sale_price: product.salePrice ?? null,
    _quantity_enabled: isQuantityEnabled,
    _min_quantity: product.minQuantity ?? product.quantityConfig?.minQuantity ?? 1,
    _max_quantity: product.maxQuantity ?? product.quantityConfig?.maxQuantity ?? null,
    _default_quantity: product.defaultQuantity ?? product.quantityConfig?.defaultQuantity ?? 1,
    _quantity_step: product.quantityStep ?? product.quantityConfig?.quantityStep ?? 1,
    _unit_label: product.unitLabel || product.quantityConfig?.unitLabel || 'Pcs',
    _quantity_config: quantityConfigObj,
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
    freeDelivery: Boolean(r.free_delivery ?? r.freeDelivery ?? (Number(r.delivery_fee ?? 0) === 0)),
    minOrderAmount: typeof (r.min_order_amount ?? r.minOrderAmount) === 'number' ? Number(r.min_order_amount ?? r.minOrderAmount) : undefined,
    additionalAddress: r.additional_address || r.additionalAddress || undefined,
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

  // 1. Try server proxy first
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/db/products/upsert', {
      method: 'POST',
      headers,
      body: JSON.stringify({ products: list })
    });
    const result = await res.json().catch(() => null);
    if (res.ok && (!result || result.success !== false)) {
      console.log(`[Supabase API] Upserted ${list.length} product(s) successfully`);
      return { success: true };
    }
    if (result && result.error) {
      console.warn(`[Supabase API] Proxy returned error: ${result.error}, trying direct SDK fallback...`);
    }
  } catch (err: any) {
    console.warn('[Supabase API] Proxy product upsert network exception, trying direct Supabase SDK fallback...');
  }

  // 2. Direct Supabase SDK Fallback (Crucial for multi-device & static host environments)
  try {
    const payloads = list.map(p => mapProductToDb(p));
    const directResult = await robustDirectSupabaseUpsert('products', payloads, { onConflict: 'id' });
    if (directResult.success) {
      console.log(`[Supabase Direct SDK] Upserted ${list.length} product(s) successfully`);
      return { success: true };
    }
    return { success: false, error: directResult.error };
  } catch (directErr: any) {
    return { success: false, error: formatSupabaseError(directErr?.message || String(directErr)) };
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
    if (res.ok && (!result || result.success !== false)) {
      console.log(`[Supabase API] Deleted product ID: ${productId}`);
      return { success: true };
    }
  } catch (err: any) {}

  // Direct Supabase SDK Fallback
  try {
    const { error } = await supabase.from('products').delete().eq('id', productId);
    if (!error) {
      console.log(`[Supabase Direct SDK] Deleted product ID: ${productId}`);
      return { success: true };
    }
    return { success: false, error: formatSupabaseError(error.message) };
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

  let ordersList: CustomerOrder[] | null = null;

  // 1. Attempt Server Proxy First (has service-role bypass, avoids RLS blocks, and includes server CMS disk cache)
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('zst_admin_token') : null;
    const url = `/api/db/orders${customerId ? `?customerId=${encodeURIComponent(customerId)}` : ''}`;
    const res = await fetch(url, {
      cache: 'no-store',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        console.log(`[Supabase Proxy] Loaded ${json.data.length} orders via server proxy`);
        ordersList = json.data.map(mapDbOrderToCustomerOrder);
      }
    }
  } catch (proxyErr) {
    console.warn('[Supabase Proxy] Server proxy fetch error, attempting direct SDK:', proxyErr);
  }

  // 2. Direct Supabase SDK Query (if proxy yielded no orders or wasn't reachable)
  if (isSupabaseConfigured && (!ordersList || ordersList.length === 0)) {
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

      // If relationship error or column error, fallback to flat orders select
      if (error) {
        console.warn('[Supabase Direct SDK] Orders joined query warning, trying fallback select(*)...', error.message);
        let fallbackQuery = supabase.from('orders').select('*').order('created_at', { ascending: false });
        if (customerId) {
          if (isUUID(customerId)) {
            fallbackQuery = fallbackQuery.eq('customer_id', customerId);
          } else {
            fallbackQuery = fallbackQuery.or(`customer_phone.eq.${customerId},id.eq.${customerId}`);
          }
        }
        const fallbackRes = await fallbackQuery;
        data = fallbackRes.data;
        error = fallbackRes.error;
      }

      if (!error && Array.isArray(data) && data.length > 0) {
        console.log(`[Supabase Direct SDK] Table: orders | Status: SUCCESS | Records: ${data.length} | HTTP: ${status || 200}`);
        const sdkOrders = data.map(mapDbOrderToCustomerOrder);
        ordersList = sdkOrders;
      }
    } catch (err: any) {
      console.warn('[Supabase Direct SDK] Direct orders fetch network exception:', err?.message || err);
    }
  }

  return ordersList;
}

export async function fetchSingleOrderFromSupabase(orderId: string): Promise<CustomerOrder | null> {
  await initializeSupabaseRuntime();
  const cleanId = orderId.trim().replace(/^#/, '');

  // 1. Attempt Server Proxy First (has service-role bypass, merges CMS disk store and Supabase DB)
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('zst_admin_token') : null;
    const res = await fetch(`/api/db/orders/${encodeURIComponent(cleanId)}`, {
      cache: 'no-store',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {}
    });
    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return mapDbOrderToCustomerOrder(json.data);
      }
    }
  } catch (proxyErr) {
    console.warn('[Supabase Proxy] Single order fetch error, falling back to direct SDK:', proxyErr);
  }

  // 2. Direct Supabase SDK Query
  if (isSupabaseConfigured) {
    try {
      let { data, error } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .or(`id.eq.${cleanId},id.ilike.%${cleanId}%`)
        .maybeSingle();

      if (error) {
        const fallbackRes = await supabase
          .from('orders')
          .select('*')
          .or(`id.eq.${cleanId},id.ilike.%${cleanId}%`)
          .maybeSingle();
        data = fallbackRes.data;
      }

      if (data) {
        return mapDbOrderToCustomerOrder(data);
      }
    } catch (dbErr) {
      console.warn('[Supabase Direct SDK] Single order query exception:', dbErr);
    }
  }

  // 3. Fallback: Search in full orders list if direct single lookup didn't match
  try {
    const all = await fetchOrdersFromSupabase();
    if (all && all.length > 0) {
      const found = all.find(o => 
        o.id.toLowerCase() === cleanId.toLowerCase() || 
        o.id.toLowerCase().includes(cleanId.toLowerCase())
      );
      if (found) return found;
    }
  } catch {}

  return null;
}

function mapDbOrderToCustomerOrder(r: any): CustomerOrder {
  const rawItems = Array.isArray(r.order_items) && r.order_items.length > 0
    ? r.order_items
    : (Array.isArray(r.items) && r.items.length > 0 ? r.items : []);

  // Check if order was verified at any point in history or record
  const historyList = Array.isArray(r.status_history) ? r.status_history : (Array.isArray(r.statusHistory) ? r.statusHistory : []);
  const hasVerifiedInHistory = historyList.some((h: any) => 
    h?.status === 'Payment Verified' || 
    h?.status === 'Payment Confirmed' || 
    h?.status === 'Approved' ||
    (typeof h?.note === 'string' && h.note.toLowerCase().includes('verified'))
  );

  const isEverVerified = 
    r.payment_status === 'Payment Verified' || 
    r.paymentStatus === 'Payment Verified' || 
    r.payment_status === 'Payment Confirmed' || 
    r.paymentStatus === 'Payment Confirmed' || 
    r.status === 'Payment Verified' ||
    r.status === 'Payment Confirmed' ||
    r.payment_status === 'Paid' || 
    r.paymentStatus === 'Paid' || 
    Boolean(r.payment_verified_at) || 
    Boolean(r.paymentVerifiedAt) || 
    hasVerifiedInHistory;

  const isExplicitlyRejected = 
    r.payment_status === 'Payment Rejected' || 
    r.paymentStatus === 'Payment Rejected' || 
    r.status === 'Payment Rejected';

  const resolvedPaymentStatus = isEverVerified 
    ? 'Payment Verified' 
    : isExplicitlyRejected 
    ? 'Payment Rejected' 
    : (r.payment_status || r.paymentStatus || (r.is_advance_payment ? 'Advance Payment Under Review' : (r.payment_proof_url ? 'Payment Proof Submitted' : (r.payment_method?.toLowerCase().includes('cash') ? 'Cash on Delivery' : undefined))));

  return {
    id: String(r.id),
    orderNumber: r.order_number || r.orderNumber || r.id,
    customerId: r.customer_id || r.customerId || undefined,
    customerName: r.customer_name || r.customerName || '',
    phoneNumber: r.customer_phone || r.phoneNumber || r.phone_number || '',
    whatsappNumber: r.whatsapp_number || r.whatsappNumber || undefined,
    city: r.shipping_city || r.city || '',
    areaLocality: r.shipping_area || r.area_locality || r.areaLocality || undefined,
    deliveryAddress: r.shipping_address || r.delivery_address || r.deliveryAddress || '',
    postalCode: r.postal_code || r.postalCode || undefined,
    landmark: r.landmark || undefined,
    deliveryInstructions: r.delivery_instructions || r.deliveryInstructions || undefined,
    notes: r.notes || undefined,
    items: rawItems.map((item: any) => ({
      productId: String(item.product_id || item.productId || ''),
      productName: item.product_title || item.product_name || item.productName || 'Product',
      image: item.product_image || item.image || '',
      unitPrice: String(item.unit_price ?? item.unitPrice ?? 0),
      numericPrice: Number(item.numeric_price ?? item.numericPrice ?? item.unit_price ?? item.unitPrice ?? 0),
      quantity: Number(item.quantity ?? 1),
      selectedColor: item.selected_color || item.selectedColor || undefined,
      selectedSize: item.selected_size || item.selectedSize || undefined,
      selectedQuality: item.selected_quality || item.selectedQuality || undefined,
      selectedVariant: item.selected_variant || item.selectedVariant || undefined,
      selectedShade: item.selected_shade || item.selectedShade || undefined,
      selectedShadeCode: item.selected_shade_code || item.selectedShadeCode || undefined,
      lineTotal: Number(item.total_price ?? item.lineTotal ?? ((item.numeric_price || item.unit_price || item.unitPrice || 0) * (item.quantity || 1)))
    })),
    subtotal: Number(r.subtotal ?? 0),
    deliveryCharges: Number(r.delivery_fee ?? r.delivery_charges ?? r.deliveryCharges ?? 0),
    taxAmount: Number(r.tax_amount ?? r.taxAmount ?? 0),
    grandTotal: Number(r.total_amount ?? r.grand_total ?? r.grandTotal ?? 0),
    createdAt: r.created_at || r.createdAt || new Date().toISOString(),
    updatedAt: r.updated_at || r.updatedAt || undefined,
    status: r.status || 'Order Received',
    statusHistory: Array.isArray(r.status_history) ? r.status_history : (Array.isArray(r.statusHistory) ? r.statusHistory : []),
    estimatedDeliveryDays: r.estimated_delivery_days || r.estimatedDeliveryDays || undefined,
    estimatedDeliveryDate: r.estimated_delivery_date || r.estimatedDeliveryDate || undefined,
    estimatedDeliveryTime: r.estimated_delivery_time || r.estimatedDeliveryTime || undefined,
    isDelayed: Boolean(r.is_delayed || r.isDelayed),
    delayReason: r.delay_reason || r.delayReason || undefined,
    trackingReference: r.tracking_reference || r.trackingReference || undefined,
    adminNotes: r.admin_notes || r.adminNotes || undefined,
    deliveryDelayNote: r.delivery_delay_note || r.deliveryDelayNote || undefined,
    // Coupon Details
    couponCode: r.coupon_code || r.couponCode || undefined,
    appliedCouponCode: r.applied_coupon_code || r.appliedCouponCode || r.coupon_code || r.couponCode || undefined,
    discountAmount: r.discount_amount ? Number(r.discount_amount) : (r.discountAmount ? Number(r.discountAmount) : undefined),
    couponDiscountAmount: r.coupon_discount_amount ? Number(r.coupon_discount_amount) : (r.couponDiscountAmount ? Number(r.couponDiscountAmount) : (r.discount_amount ? Number(r.discount_amount) : undefined)),
    // Payment Details & Proof
    paymentMethodId: r.payment_method_id || r.paymentMethodId || undefined,
    paymentMethodName: r.payment_method_name || r.paymentMethodName || r.payment_method || undefined,
    paymentType: r.payment_type || r.paymentType || undefined,
    paymentProofUrl: r.payment_proof_url || r.paymentProofUrl || undefined,
    paymentProofFileName: r.payment_proof_file_name || r.paymentProofFileName || undefined,
    paymentProofUploadedAt: r.payment_proof_uploaded_at || r.paymentProofUploadedAt || undefined,
    transactionReference: r.transaction_reference || r.transactionReference || undefined,
    paymentStatus: resolvedPaymentStatus,
    paymentNotes: r.payment_notes || r.paymentNotes || undefined,
    paymentVerifiedAt: r.payment_verified_at || r.paymentVerifiedAt || undefined,
    paymentVerifiedBy: r.payment_verified_by || r.paymentVerifiedBy || undefined,
    paymentRejectionReason: r.payment_rejection_reason || r.paymentRejectionReason || undefined,
    // Advance Payment details
    isAdvancePayment: Boolean(r.is_advance_payment ?? r.isAdvancePayment),
    advancePercentage: r.advance_percentage ? Number(r.advance_percentage) : (r.advancePercentage ? Number(r.advancePercentage) : undefined),
    advanceAmountRequired: r.advance_amount_required ? Number(r.advance_amount_required) : (r.advanceAmountRequired ? Number(r.advanceAmountRequired) : undefined),
    advancePaidAmount: r.advance_paid_amount ? Number(r.advance_paid_amount) : (r.advancePaidAmount ? Number(r.advancePaidAmount) : undefined),
    remainingCodAmount: r.remaining_cod_amount ? Number(r.remaining_cod_amount) : (r.remainingCodAmount ? Number(r.remainingCodAmount) : undefined)
  };
}

export async function createOrderInSupabase(order: CustomerOrder): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();

  const orderPayload: Record<string, any> = {
    id: order.id,
    orderNumber: order.orderNumber || order.id,
    order_number: order.orderNumber || order.id,
    customerId: order.customerId,
    customer_id: (order.customerId && isUUID(order.customerId)) ? order.customerId : null,
    customerName: order.customerName,
    customer_name: order.customerName,
    phoneNumber: order.phoneNumber,
    customer_phone: order.phoneNumber,
    whatsappNumber: order.whatsappNumber,
    whatsapp_number: order.whatsappNumber || null,
    city: order.city,
    shipping_city: order.city,
    areaLocality: order.areaLocality,
    shipping_area: order.areaLocality || null,
    deliveryAddress: order.deliveryAddress,
    shipping_address: order.deliveryAddress,
    postalCode: order.postalCode,
    postal_code: order.postalCode || null,
    landmark: order.landmark || null,
    deliveryInstructions: order.deliveryInstructions,
    delivery_instructions: order.deliveryInstructions || null,
    notes: order.notes || null,
    subtotal: order.subtotal,
    deliveryCharges: order.deliveryCharges,
    delivery_fee: order.deliveryCharges,
    taxAmount: order.taxAmount,
    tax_amount: order.taxAmount || 0,
    grandTotal: order.grandTotal,
    total_amount: order.grandTotal,
    status: order.status || 'Order Received',
    statusHistory: order.statusHistory || [{ status: order.status || 'Order Received', timestamp: new Date().toISOString() }],
    status_history: order.statusHistory || [{ status: order.status || 'Order Received', timestamp: new Date().toISOString() }],
    estimatedDeliveryDays: order.estimatedDeliveryDays,
    estimated_delivery_days: order.estimatedDeliveryDays || null,
    estimatedDeliveryDate: order.estimatedDeliveryDate,
    estimated_delivery_date: order.estimatedDeliveryDate || null,
    estimatedDeliveryTime: order.estimatedDeliveryTime,
    estimated_delivery_time: order.estimatedDeliveryTime || null,
    createdAt: order.createdAt || new Date().toISOString(),
    created_at: order.createdAt || new Date().toISOString(),
    items: order.items || [],
    // Coupon fields
    couponCode: order.appliedCouponCode || order.couponCode,
    coupon_code: order.appliedCouponCode || order.couponCode || null,
    discountAmount: order.couponDiscountAmount || order.discountAmount,
    discount_amount: order.couponDiscountAmount || order.discountAmount || 0,
    // Payment fields
    paymentMethodName: order.paymentMethodName || order.paymentMethodId,
    payment_method: order.paymentMethodName || order.paymentMethodId || (order.paymentProofUrl ? 'Online Transfer' : 'Cash on Delivery'),
    paymentStatus: order.paymentStatus,
    payment_status: order.paymentStatus || (order.paymentProofUrl ? 'Payment Proof Submitted' : 'Cash on Delivery'),
    paymentProofUrl: order.paymentProofUrl,
    payment_proof_url: order.paymentProofUrl || null,
    transactionReference: order.transactionReference,
    transaction_reference: order.transactionReference || null,
    paymentNotes: order.paymentNotes,
    payment_notes: order.paymentNotes || null,
    // Advance Payment fields
    isAdvancePayment: Boolean(order.isAdvancePayment),
    is_advance_payment: Boolean(order.isAdvancePayment),
    advancePercentage: order.advancePercentage,
    advance_percentage: order.advancePercentage || null,
    advanceAmountRequired: order.advanceAmountRequired,
    advance_amount_required: order.advanceAmountRequired || null,
    advancePaidAmount: order.advancePaidAmount,
    advance_paid_amount: order.advancePaidAmount || null,
    remainingCodAmount: order.remainingCodAmount,
    remaining_cod_amount: order.remainingCodAmount || null
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
    selected_variant: item.selectedVariant || null,
    selected_shade: item.selectedShade || null,
    selected_shade_code: item.selectedShadeCode || null
  }));

  // 1. Try server proxy first (with robustUpsert column fallback)
  try {
    const res = await fetch('/api/db/orders/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: orderPayload, items: itemsPayload })
    });
    const json = await res.json().catch(() => null);
    if (res.ok && json?.success) {
      console.log(`[Supabase Proxy] Successfully created order: ${order.id}`);
      return { success: true };
    }
  } catch (proxyErr) {
    console.warn('[Supabase Proxy] Order creation proxy attempt failed, falling back to direct SDK:', proxyErr);
  }

  // 2. Direct Supabase SDK Fallback (with automatic schema negotiation and missing column stripping)
  if (!isSupabaseConfigured) {
    return { success: false, error: 'Server proxy failed and direct Supabase SDK is not configured' };
  }

  try {
    const orderResult = await robustDirectSupabaseUpsert('orders', [orderPayload], { onConflict: 'id' });
    if (!orderResult.success) {
      console.error(`[Supabase Direct SDK] Order creation failed: ${orderResult.error}`);
      return { success: false, error: orderResult.error };
    }

    if (itemsPayload.length > 0) {
      const itemsResult = await robustDirectSupabaseUpsert('order_items', itemsPayload, { onConflict: 'id' });
      if (!itemsResult.success) {
        console.warn(`[Supabase Direct SDK] Order items upsert warning: ${itemsResult.error}`);
      }
    }
    console.log(`[Supabase Direct SDK] Created order: ${order.id}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

export async function updateOrderStatusInSupabase(orderId: string, status: CustomerOrder['status'], note?: string): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();

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

export async function updateOrderPaymentStatusInSupabase(
  orderId: string, 
  paymentStatus: CustomerOrder['paymentStatus'], 
  orderStatus?: CustomerOrder['status'], 
  note?: string,
  rejectionReason?: string,
  verifiedBy?: string
): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/db/orders/${encodeURIComponent(orderId)}/payment-status`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ paymentStatus, orderStatus, note, rejectionReason, verifiedBy })
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || (result && result.success === false)) {
      // Fallback to updating order status endpoint
      if (orderStatus) {
        return updateOrderStatusInSupabase(orderId, orderStatus, note);
      }
      return { success: false, error: result?.error || 'Failed to update payment status' };
    }
    console.log(`[Supabase API] Updated order ${orderId} payment status: ${paymentStatus}`);
    return { success: true };
  } catch (err: any) {
    if (orderStatus) {
      return updateOrderStatusInSupabase(orderId, orderStatus, note);
    }
    return { success: false, error: formatSupabaseError(err?.message || String(err)) };
  }
}

export async function deleteOrderFromSupabase(orderId: string): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/db/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE',
      headers
    });
    const json = await res.json().catch(() => null);
    if (!res.ok || (json && json.success === false)) {
      const errMsg = json?.error || (res.statusText ? `${res.statusText} (${res.status})` : `Server returned error ${res.status}`);
      return { success: false, error: formatSupabaseError(errMsg) };
    }
    console.log(`[Supabase API] Storage optimization complete for order ${orderId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err?.message || String(err)) };
  }
}

export async function fetchPaymentMethodsFromSupabase(): Promise<PaymentMethodConfig[] | null> {
  const methods = await fetchSiteSettingFromSupabase<PaymentMethodConfig[]>('zst_payment_methods_v1');
  if (Array.isArray(methods) && methods.length > 0) {
    return methods;
  }
  return null;
}

export async function savePaymentMethodsToSupabase(methods: PaymentMethodConfig[]): Promise<{ success: boolean; error?: string }> {
  return saveSiteSettingToSupabase('zst_payment_methods_v1', methods);
}

// =========================================================
// HOW TO ORDER GUIDE CRUD (Site Settings)
// =========================================================

export async function fetchHowToOrderConfigFromSupabase(): Promise<HowToOrderConfig | null> {
  const config = await fetchSiteSettingFromSupabase<HowToOrderConfig>('zst_how_to_order_guide_v1');
  if (config && Array.isArray(config.steps) && config.steps.length > 0) {
    return config;
  }
  return null;
}

export async function saveHowToOrderConfigToSupabase(config: HowToOrderConfig): Promise<{ success: boolean; error?: string }> {
  return saveSiteSettingToSupabase('zst_how_to_order_guide_v1', config);
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

export async function deleteDeliveryCityFromSupabase(cityId: string): Promise<{ success: boolean; error?: string }> {
  await initializeSupabaseRuntime();
  if (!isSupabaseConfigured) return { success: false, error: 'Supabase not configured' };

  try {
    const headers = await getAuthHeaders();
    const res = await fetch(`/api/db/delivery-cities/${encodeURIComponent(cityId)}`, {
      method: 'DELETE',
      headers
    });
    const result = await res.json().catch(() => null);
    if (!res.ok || (result && result.success === false)) {
      const errMsg = result?.error || (res.statusText ? `${res.statusText} (${res.status})` : `Server returned error ${res.status}`);
      const err = formatSupabaseError(errMsg);
      console.error(`[Supabase API] Delivery city delete failed: ${err}`);
      return { success: false, error: err };
    }
    console.log(`[Supabase API] Deleted delivery city ID: ${cityId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: formatSupabaseError(err?.message || String(err)) };
  }
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
  if (k.includes('config') || k.includes('business')) return 'planner_config';
  return null;
}

export async function fetchSiteSettingFromSupabase<T>(key: string): Promise<T | null> {
  await initializeSupabaseRuntime();

  // 1. Attempt Direct Supabase SDK Query
  if (isSupabaseConfigured) {
    try {
      const k = key.toLowerCase();

      // 1a. Pricing Typography is stored inside theme_settings.pricingTypography (id = 'config')
      if (k.includes('pricing') || k.includes('typography')) {
        const { data: themeData, error: themeErr } = await supabase
          .from('site_settings')
          .select('theme_settings')
          .eq('id', 'config')
          .maybeSingle();

        if (!themeErr && themeData?.theme_settings) {
          const pTypo = themeData.theme_settings.pricingTypography || themeData.theme_settings.pricing_typography;
          if (pTypo) {
            console.log(`[Supabase Direct SDK] Loaded pricing typography from site_settings.theme_settings`);
            return pTypo as T;
          }
        }
      }

      // 1b. Coupons & Promo Codes are stored inside checkout_settings.coupons (id = 'config')
      if (k.includes('coupon') || k.includes('promo')) {
        const { data: chkData, error: chkErr } = await supabase
          .from('site_settings')
          .select('checkout_settings')
          .eq('id', 'config')
          .maybeSingle();

        if (!chkErr && chkData?.checkout_settings) {
          const coupons = chkData.checkout_settings.coupons || chkData.checkout_settings.promo_codes;
          if (coupons && Array.isArray(coupons)) {
            console.log(`[Supabase Direct SDK] Loaded ${coupons.length} coupons from site_settings.checkout_settings`);
            return coupons as T;
          }
        }
      }

      // 1c. Smart Tools & Fitting Builder are stored inside planner_config (id = 'config')
      if (k.includes('smart_tools') || k.includes('smart-tools') || k.includes('smarttools')) {
        const { data: planData, error: planErr } = await supabase
          .from('site_settings')
          .select('planner_config')
          .eq('id', 'config')
          .maybeSingle();

        if (!planErr && planData?.planner_config?.smartTools) {
          return planData.planner_config.smartTools as T;
        }
      }

      if (k.includes('fitting')) {
        const { data: planData, error: planErr } = await supabase
          .from('site_settings')
          .select('planner_config')
          .eq('id', 'config')
          .maybeSingle();

        if (!planErr && planData?.planner_config?.fittingBuilder) {
          return planData.planner_config.fittingBuilder as T;
        }
      }

      // 1d. Try key-value table (key, value)
      const { data: kvData, error: kvErr } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();

      if (!kvErr && kvData && kvData.value !== undefined && kvData.value !== null) {
        return kvData.value as T;
      }

      // 1e. Try standard single row config with named column (id = 'config')
      const colName = getSiteSettingColumnName(key);
      if (colName) {
        const { data: colData, error: colErr } = await supabase
          .from('site_settings')
          .select(colName)
          .eq('id', 'config')
          .maybeSingle();

        if (!colErr && colData && (colData as any)[colName] !== undefined && (colData as any)[colName] !== null) {
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
      if (json.success && json.data !== undefined && json.data !== null) {
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

  // 1. Try server proxy first
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/db/site-settings/upsert', {
      method: 'POST',
      headers,
      body: JSON.stringify({ key, value })
    });
    const result = await res.json().catch(() => null);
    if (res.ok && (!result || result.success !== false)) {
      console.log(`[Supabase API] Saved site_setting: ${key}`);
      return { success: true };
    }
    if (result && result.error) {
      console.warn(`[Supabase API] Server returned error for "${key}": ${result.error}, attempting direct SDK fallback...`);
    }
  } catch (err: any) {
    console.warn(`[Supabase API] Server proxy exception for "${key}", attempting direct SDK fallback...`);
  }

  // 2. Direct Supabase SDK Fallback (Crucial for static deployments / Hostinger)
  try {
    const k = key.toLowerCase();

    // 2a. Pricing Typography -> theme_settings.pricingTypography (id = 'config')
    if (k.includes('pricing') || k.includes('typography')) {
      const { data: cur } = await supabase.from('site_settings').select('theme_settings').eq('id', 'config').maybeSingle();
      const curTheme = cur?.theme_settings || {};
      const updatedTheme = {
        ...curTheme,
        pricingTypography: value,
        pricing_typography: value
      };
      const { error: updateErr } = await supabase.from('site_settings').update({
        theme_settings: updatedTheme,
        updated_at: new Date().toISOString()
      }).eq('id', 'config');

      if (!updateErr) {
        console.log(`[Supabase Direct SDK] Persisted pricing typography to site_settings.theme_settings`);
        return { success: true };
      }
      return { success: false, error: formatSupabaseError(updateErr.message) };
    }

    // 2b. Coupons -> checkout_settings.coupons (id = 'config')
    if (k.includes('coupon') || k.includes('promo')) {
      const { data: cur } = await supabase.from('site_settings').select('checkout_settings').eq('id', 'config').maybeSingle();
      const curCheckout = cur?.checkout_settings || {};
      const updatedCheckout = {
        ...curCheckout,
        coupons: value,
        promo_codes: value
      };
      const { error: updateErr } = await supabase.from('site_settings').update({
        checkout_settings: updatedCheckout,
        updated_at: new Date().toISOString()
      }).eq('id', 'config');

      if (!updateErr) {
        console.log(`[Supabase Direct SDK] Persisted coupons to site_settings.checkout_settings`);
        return { success: true };
      }
      return { success: false, error: formatSupabaseError(updateErr.message) };
    }

    // 2c. Standard columns
    const col = getSiteSettingColumnName(key);
    if (col) {
      const { error: updateErr } = await supabase.from('site_settings').update({
        [col]: value,
        updated_at: new Date().toISOString()
      }).eq('id', 'config');

      if (!updateErr) {
        console.log(`[Supabase Direct SDK] Updated site_settings column "${col}"`);
        return { success: true };
      }
      return { success: false, error: formatSupabaseError(updateErr.message) };
    }

    return { success: true };
  } catch (directErr: any) {
    return { success: false, error: formatSupabaseError(directErr?.message || String(directErr)) };
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
