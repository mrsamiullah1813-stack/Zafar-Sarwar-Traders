import "dotenv/config";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase DB Client for server proxy with exhaustive environment variable fallbacks
const rawSupabaseUrl = (
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  ""
).trim();

let normalizedSupabaseUrl = rawSupabaseUrl;
if (normalizedSupabaseUrl && !normalizedSupabaseUrl.startsWith("http://") && !normalizedSupabaseUrl.startsWith("https://")) {
  normalizedSupabaseUrl = `https://${normalizedSupabaseUrl}`;
  if (!normalizedSupabaseUrl.includes(".")) {
    normalizedSupabaseUrl += ".supabase.co";
  }
}

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

const publicAnonKey = (
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_KEY ||
  ""
).trim();

const isPlaceholder = (val: string) =>
  !val ||
  val.includes("your-supabase") ||
  val.includes("placeholder") ||
  val.includes("EXAMPLE") ||
  val.includes("YOUR_");

const isSupabaseServerConfigured = Boolean(
  normalizedSupabaseUrl &&
  !isPlaceholder(normalizedSupabaseUrl) &&
  serviceRoleKey &&
  !isPlaceholder(serviceRoleKey)
);

const dbClient = isSupabaseServerConfigured
  ? createClient(normalizedSupabaseUrl, serviceRoleKey)
  : null;

if (dbClient) {
  console.log("✅ Supabase Server Database Proxy connected to:", normalizedSupabaseUrl);
} else {
  console.log("ℹ️ Supabase Server Database Proxy inactive: credentials not provided or placeholder.");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      app: "Zafar Sarwar Traders",
      supabaseConnected: Boolean(dbClient),
      supabaseUrl: normalizedSupabaseUrl ? normalizedSupabaseUrl.replace(/^(https?:\/\/)([^.]+)(.*)$/, "$1***$3") : null
    });
  });

  // Public Supabase Configuration Endpoint for Frontend Dynamic Runtime Hydration
  // (Safe: strictly returns public Anon Key / URL; never leaks Service Role Key)
  app.get("/api/supabase-config", (req, res) => {
    const isPublicConfigured = Boolean(
      normalizedSupabaseUrl &&
      !isPlaceholder(normalizedSupabaseUrl) &&
      publicAnonKey &&
      !isPlaceholder(publicAnonKey)
    );
    return res.json({
      configured: isPublicConfigured,
      url: isPublicConfigured ? normalizedSupabaseUrl : "",
      anonKey: isPublicConfigured ? publicAnonKey : ""
    });
  });

  // Database Diagnostic Endpoint
  app.get("/api/db/diagnostic", async (req, res) => {
    if (!dbClient) {
      return res.json({
        success: false,
        status: "Supabase client not initialized on server",
        urlConfigured: Boolean(normalizedSupabaseUrl),
        keyConfigured: Boolean(serviceRoleKey)
      });
    }

    const report: Record<string, any> = {};
    const tables = ["products", "categories", "brands", "hero_settings", "hero_slides", "orders", "delivery_cities", "site_settings"];

    for (const tbl of tables) {
      try {
        const { count, error } = await dbClient.from(tbl).select("*", { count: "exact", head: true });
        if (error) {
          report[tbl] = { status: "error", error: error.message };
        } else {
          report[tbl] = { status: "ok", count: count ?? 0 };
        }
      } catch (err: any) {
        report[tbl] = { status: "exception", error: err?.message || String(err) };
      }
    }

    try {
      const { data: buckets, error: bError } = await dbClient.storage.listBuckets();
      report["storage_buckets"] = bError ? { status: "error", error: bError.message } : { status: "ok", buckets: buckets?.map(b => b.name) || [] };
    } catch (err: any) {
      report["storage_buckets"] = { status: "exception", error: err?.message || String(err) };
    }

    return res.json({
      success: true,
      url: normalizedSupabaseUrl ? normalizedSupabaseUrl.replace(/^(https?:\/\/)([^.]+)(.*)$/, "$1***$3") : null,
      tables: report
    });
  });

  // Database Proxy API Endpoints (Securely handles admin writes with Supabase Auth validation & service role key)
  const requireAdminAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Missing or invalid authorization header. You must be logged in as an Admin (Ctrl+Shift+A) to perform this operation."
      });
    }

    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Empty authentication token. Please log in as an Admin (Ctrl+Shift+A)."
      });
    }

    if (!dbClient) {
      return res.status(500).json({
        success: false,
        error: "Database client not configured on server."
      });
    }

    try {
      const { data: { user }, error: authError } = await dbClient.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({
          success: false,
          error: "Invalid or expired session. Please log in again (Ctrl+Shift+A)."
        });
      }

      // User verified by Supabase Auth
      (req as any).adminUser = user;
      return next();
    } catch (err: any) {
      return res.status(401).json({
        success: false,
        error: "Failed to authenticate session token."
      });
    }
  };

  // Robust Supabase Upsert Helper with automatic column negotiation and foreign-key healing
  async function robustUpsert(table: string, payloads: any[], options: { onConflict?: string } = { onConflict: "id" }): Promise<{ success: boolean; data?: any; error?: string }> {
    if (!dbClient) return { success: false, error: "Database client not configured on server" };
    if (!payloads || payloads.length === 0) return { success: true };

    let currentPayloads = payloads.map(p => ({ ...p }));
    const maxRetries = 35;
    let attempts = 0;
    let lastError: any = null;

    while (attempts < maxRetries) {
      attempts++;
      const { data, error } = await dbClient.from(table).upsert(currentPayloads, options);
      if (!error) {
        if (attempts > 1) {
          console.log(`[Robust DB Upsert] Table "${table}": Successfully saved after ${attempts} adaptation attempts.`);
        }
        return { success: true, data };
      }

      lastError = error;
      const errMsg = String(error.message || "");

      // 1. Missing Column Error (PostgREST schema cache or relation missing column)
      // e.g.: "Could not find the 'sale_enabled' column of 'products' in the schema cache"
      // e.g.: "column "sale_enabled" of relation "products" does not exist"
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
        console.warn(`[Robust DB Upsert] Table "${table}": Column "${badCol}" not found in schema cache. Stripping column and retrying (attempt ${attempts})...`);
        currentPayloads = currentPayloads.map(item => {
          const copy = { ...item };
          delete copy[badCol];
          return copy;
        });
        continue;
      }

      // 2. Foreign Key Constraint Violation (e.g. category_id, brand_id, product_id)
      if (error.code === "23503" || errMsg.toLowerCase().includes("foreign key") || errMsg.toLowerCase().includes("violates foreign key")) {
        console.warn(`[Robust DB Upsert] Table "${table}": Foreign key constraint violation. Nullifying relation fields and retrying (attempt ${attempts})...`);
        currentPayloads = currentPayloads.map(item => {
          const copy = { ...item };
          if ("category_id" in copy) copy.category_id = null;
          if ("brand_id" in copy) copy.brand_id = null;
          if ("product_id" in copy) copy.product_id = null;
          return copy;
        });
        continue;
      }

      // 3. Unique Constraint Violation on slug
      if (error.code === "23505" && (errMsg.toLowerCase().includes("slug") || errMsg.toLowerCase().includes("unique"))) {
        console.warn(`[Robust DB Upsert] Table "${table}": Unique slug collision detected. Appending unique token and retrying (attempt ${attempts})...`);
        currentPayloads = currentPayloads.map((item, i) => {
          const copy = { ...item };
          if (copy.slug) {
            copy.slug = `${copy.slug}-${Date.now().toString(36).slice(-4)}${i + 1}`;
          }
          return copy;
        });
        continue;
      }

      // Unrecoverable error
      break;
    }

    return { success: false, error: lastError?.message || "Database upsert failed after schema negotiation" };
  }

  app.get("/api/db/categories", async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { data, error } = await dbClient.from("categories").select("*").order("display_order", { ascending: true });
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post("/api/db/categories/upsert", requireAdminAuth, async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { categories } = req.body;
      const list = Array.isArray(categories) ? categories : (req.body.category ? [req.body.category] : []);
      if (list.length === 0) return res.json({ success: true });

      // Pre-fetch existing category slugs and IDs to resolve conflicts gracefully
      let existingRows: { id: any; slug: string }[] = [];
      try {
        const { data } = await dbClient.from("categories").select("id, slug");
        if (Array.isArray(data)) existingRows = data;
      } catch (fetchErr) {
        console.warn("Could not pre-fetch existing categories:", fetchErr);
      }

      const existingSlugToIdMap = new Map<string, string>();
      existingRows.forEach(r => {
        if (r.slug && r.id) {
          existingSlugToIdMap.set(String(r.slug).toLowerCase().trim(), String(r.id));
        }
      });

      const usedSlugs = new Set<string>();

      const payloads = list.map((cat: any, idx: number) => {
        const catId = String(cat.id || `cat-${Date.now()}-${idx + 1}`);
        let rawSlug = (cat.slug || cat.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `category-${idx + 1}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
        if (!rawSlug) rawSlug = `category-${idx + 1}`;

        let finalSlug = rawSlug;
        const ownerId = existingSlugToIdMap.get(finalSlug);
        // If an existing DB record has this slug with a DIFFERENT id, make slug unique
        if (ownerId && ownerId !== catId) {
          const suffix = catId.replace(/[^a-z0-9]/gi, "").slice(-4) || String(idx + 1);
          finalSlug = `${rawSlug}-${suffix}`;
        }

        // Deduplicate within the current batch
        let dedupCounter = 1;
        while (usedSlugs.has(finalSlug)) {
          dedupCounter++;
          finalSlug = `${rawSlug}-${dedupCounter}`;
        }
        usedSlugs.add(finalSlug);

        return {
          id: catId,
          name: cat.name || "Category",
          slug: finalSlug,
          description: cat.description || "",
          full_description: cat.fullDescription || null,
          image: cat.image || "",
          icon: cat.iconName || "Grid",
          badge: cat.badge || null,
          featured: Boolean(cat.isFeatured),
          show_on_homepage: Boolean(cat.showOnHomepage ?? true),
          is_active: Boolean(cat.isActive ?? true),
          seo_title: cat.seoTitle || null,
          seo_description: cat.seoDescription || null,
          display_order: cat.displayOrder ?? idx
        };
      });

      const result = await robustUpsert("categories", payloads, { onConflict: "id" });
      if (!result.success) return res.status(500).json({ success: false, error: result.error });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.delete("/api/db/categories/:id", requireAdminAuth, async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { id } = req.params;
      const { error } = await dbClient.from("categories").delete().eq("id", id);
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.get("/api/db/brands", async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { data, error } = await dbClient.from("brands").select("*").order("display_order", { ascending: true });
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post("/api/db/brands/upsert", requireAdminAuth, async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { brands } = req.body;
      const list = Array.isArray(brands) ? brands : (req.body.brand ? [req.body.brand] : []);
      if (list.length === 0) return res.json({ success: true });

      let existingRows: { id: any; slug: string }[] = [];
      try {
        const { data } = await dbClient.from("brands").select("id, slug");
        if (Array.isArray(data)) existingRows = data;
      } catch {
        // ignore
      }

      const existingSlugToIdMap = new Map<string, string>();
      existingRows.forEach(r => {
        if (r.slug && r.id) {
          existingSlugToIdMap.set(String(r.slug).toLowerCase().trim(), String(r.id));
        }
      });

      const usedSlugs = new Set<string>();

      const payloads = list.map((b: any, idx: number) => {
        const brandId = String(b.id || `brand-${Date.now()}-${idx + 1}`);
        let rawSlug = (b.slug || b.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-") || `brand-${idx + 1}`)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)+/g, "");
        if (!rawSlug) rawSlug = `brand-${idx + 1}`;

        let finalSlug = rawSlug;
        const ownerId = existingSlugToIdMap.get(finalSlug);
        if (ownerId && ownerId !== brandId) {
          const suffix = brandId.replace(/[^a-z0-9]/gi, "").slice(-4) || String(idx + 1);
          finalSlug = `${rawSlug}-${suffix}`;
        }

        let dedupCounter = 1;
        while (usedSlugs.has(finalSlug)) {
          dedupCounter++;
          finalSlug = `${rawSlug}-${dedupCounter}`;
        }
        usedSlugs.add(finalSlug);

        return {
          id: brandId,
          name: b.name || "Brand",
          slug: finalSlug,
          logo: b.logo || "",
          description: b.description || "",
          official_badge: b.officialBadge || null,
          featured: Boolean(b.isFeatured),
          is_active: Boolean(b.isActive ?? true),
          display_order: b.displayOrder ?? idx
        };
      });

      const result = await robustUpsert("brands", payloads, { onConflict: "id" });
      if (!result.success) return res.status(500).json({ success: false, error: result.error });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.delete("/api/db/brands/:id", requireAdminAuth, async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { id } = req.params;
      const { error } = await dbClient.from("brands").delete().eq("id", id);
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // PRODUCTS DB Proxy API Endpoints
  function mapServerProductToDb(product: any) {
    let numericPrice: number | null = null;
    if (typeof product.price === "number") {
      numericPrice = product.price;
    } else if (product.price) {
      const digitsOnly = String(product.price).replace(/[^0-9.]/g, "");
      if (digitsOnly) numericPrice = parseFloat(digitsOnly) || null;
    }

    let numericSalePrice: number | null = null;
    const rawSaleVal = product.salePrice ?? product.saleConfig?.salePrice;
    if (typeof rawSaleVal === "number") {
      numericSalePrice = rawSaleVal;
    } else if (rawSaleVal) {
      const digitsOnly = String(rawSaleVal).replace(/[^0-9.]/g, "");
      if (digitsOnly) numericSalePrice = parseFloat(digitsOnly) || null;
    }

    const isSaleEnabled = Boolean(product.saleEnabled === true || product.saleConfig?.saleEnabled === true);

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
      _stock_status: product.stockStatus || "In Stock",
      _stock_quantity: product.stockQuantity ?? 10,
      _hide_stock_badge: Boolean(product.hideStockBadge),
      _is_price_on_request: Boolean(product.isPriceOnRequest),
      _hide_price: Boolean(product.hidePrice),
      _rating: typeof product.rating === "number" ? product.rating : (product.rating ? parseFloat(String(product.rating)) : 4.8),
      _reviews_count: typeof product.reviewsCount === "number" ? product.reviewsCount : (typeof product.reviews_count === "number" ? product.reviews_count : (parseInt(String(product.reviewsCount || product.reviews_count || "12"), 10) || 12)),
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
      _display_order: product.displayOrder ?? 0
    };

    return {
      id: product.id,
      sku: product.sku || null,
      title: product.name || product.title || "Product",
      slug: (product.name || product.title || "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      description: product.description || "",
      short_description: product.shortDescription || null,
      price: numericPrice,
      sale_price: numericSalePrice,
      sale_enabled: isSaleEnabled,
      sale_start_date: product.saleStartDate ?? product.saleConfig?.saleStartDate ?? null,
      sale_end_date: product.saleEndDate ?? product.saleConfig?.saleEndDate ?? null,
      sale_label: product.saleLabel ?? product.saleConfig?.saleLabel ?? null,
      sale_message: product.saleMessage ?? product.saleConfig?.saleMessage ?? null,
      show_countdown: Boolean(product.showSaleCountdown ?? product.saleConfig?.showCountdown ?? true),
      show_discount_percentage: Boolean(product.showDiscountPercentage ?? product.saleConfig?.showDiscountPercentage ?? true),
      show_savings: Boolean(product.showSavingsAmount ?? product.saleConfig?.showSavings ?? true),
      category_id: product.categoryId || null,
      brand_id: product.brandId || null,
      image: product.image || "",
      gallery: product.images || [],
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
      rating: typeof product.rating === "number" ? product.rating : (product.rating ? parseFloat(String(product.rating)) : 4.8),
      reviews_count: typeof product.reviewsCount === "number" ? product.reviewsCount : (typeof product.reviews_count === "number" ? product.reviews_count : (parseInt(String(product.reviewsCount || product.reviews_count || "12"), 10) || 12)),
      display_order: product.displayOrder ?? 0
    };
  }

  app.get("/api/db/products", async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { data, error } = await dbClient.from("products").select("*").order("display_order", { ascending: true }).order("created_at", { ascending: false });
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post("/api/db/products/upsert", requireAdminAuth, async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { products } = req.body;
      const list = Array.isArray(products) ? products : (req.body.product ? [req.body.product] : []);
      if (list.length === 0) return res.json({ success: true });

      const payloads = list.map((p: any) => mapServerProductToDb(p));

      const result = await robustUpsert("products", payloads, { onConflict: "id" });
      if (!result.success) {
        console.error("[Supabase API] Product upsert failed after robust schema negotiation:", result.error);
        return res.status(500).json({ success: false, error: result.error });
      }

      // Invalidate AI catalog cache on product update
      aiCatalogCache = null;

      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.delete("/api/db/products/:id", requireAdminAuth, async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { id } = req.params;
      const { error } = await dbClient.from("products").delete().eq("id", id);
      if (error) return res.status(500).json({ success: false, error: error.message });
      aiCatalogCache = null;
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // HERO SETTINGS DB Proxy
  app.get("/api/db/hero-settings", async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { data, error } = await dbClient.from("hero_settings").select("*").eq("id", "default").maybeSingle();
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post("/api/db/hero-settings/upsert", requireAdminAuth, async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { settings } = req.body;
      const payload = {
        id: "default",
        autoplay: Boolean(settings.autoPlay ?? true),
        slide_duration: (settings.rotationDurationSeconds || 5) * 1000,
        transition_style: settings.transitionStyle || "fade",
        overlay_intensity: 0.4,
        height: "h-[85vh]",
        show_price: true,
        show_brand: true,
        show_category: true,
        show_stock: true,
        show_cart: Boolean(settings.enableSecondaryBtn ?? true),
        show_whatsapp: Boolean(settings.enableTertiaryBtn ?? true),
        published: Boolean(settings.isEnabled ?? true),
        updated_at: new Date().toISOString()
      };
      const result = await robustUpsert("hero_settings", [payload], { onConflict: "id" });
      if (!result.success) return res.status(500).json({ success: false, error: result.error });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // ORDERS DB Proxy
  app.get("/api/db/orders", async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { customerId } = req.query;
      let query = dbClient.from("orders").select("*, order_items(*)").order("created_at", { ascending: false });
      if (customerId && typeof customerId === "string") {
        query = query.eq("customer_id", customerId);
      }
      const { data, error } = await query;
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post("/api/db/orders/upsert", async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { order, items } = req.body;
      if (!order) return res.status(400).json({ success: false, error: "Order payload required" });

      const orderResult = await robustUpsert("orders", [order], { onConflict: "id" });
      if (!orderResult.success) return res.status(500).json({ success: false, error: orderResult.error });

      if (Array.isArray(items) && items.length > 0) {
        const itemsResult = await robustUpsert("order_items", items, { onConflict: "id" });
        if (!itemsResult.success) console.warn("Order items upsert warning:", itemsResult.error);
      }
      return res.json({ success: true, id: order.id });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.patch("/api/db/orders/:id/status", requireAdminAuth, async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { id } = req.params;
      const { status, note } = req.body;
      const { data: existing } = await dbClient.from("orders").select("status_history").eq("id", id).maybeSingle();
      const history = existing && Array.isArray(existing.status_history) ? existing.status_history : [];
      const updatedHistory = [...history, { status, timestamp: new Date().toISOString(), note }];

      const { error } = await dbClient
        .from("orders")
        .update({ status, status_history: updatedHistory, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // DELIVERY CITIES DB Proxy
  app.get("/api/db/delivery-cities", async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { data, error } = await dbClient.from("delivery_cities").select("*").order("display_order", { ascending: true });
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post("/api/db/delivery-cities/upsert", requireAdminAuth, async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { cities } = req.body;
      const list = Array.isArray(cities) ? cities : (req.body.city ? [req.body.city] : []);
      if (list.length === 0) return res.json({ success: true });

      const payloads = list.map((c: any) => ({
        id: c.id,
        name: c.cityName || c.name,
        delivery_fee: c.deliveryFee ?? c.delivery_fee ?? 0,
        estimated_days: c.estimatedDays || c.estimated_days || "2-4 Days",
        enabled: Boolean(c.isEnabled ?? c.enabled ?? true),
        same_day_available: Boolean(c.isSameDayAvailable ?? c.same_day_available),
        next_day_available: Boolean(c.isNextDayAvailable ?? c.next_day_available),
        display_order: c.displayOrder ?? c.display_order ?? 0,
        notes: c.notes || null
      }));

      const result = await robustUpsert("delivery_cities", payloads, { onConflict: "id" });
      if (!result.success) {
        console.warn("[Server DB] Delivery cities upsert warning:", result.error);
      }
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.delete("/api/db/delivery-cities/:id", requireAdminAuth, async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { id } = req.params;
      const { error } = await dbClient.from("delivery_cities").delete().eq("id", id);
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // STORAGE MEDIA UPLOAD DB Proxy (Guarded by requireAdminAuth)
  app.post("/api/db/upload", requireAdminAuth, async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { fileData, fileName, bucketName = "product-media", mimeType = "image/jpeg" } = req.body;
      if (!fileData) return res.status(400).json({ success: false, error: "fileData is required" });

      const base64Data = fileData.includes(",") ? fileData.split(",")[1] : fileData;
      const buffer = Buffer.from(base64Data, "base64");
      const cleanFileName = fileName || `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`;
      const filePath = `uploads/${cleanFileName}`;

      const candidateBuckets = Array.from(new Set([bucketName, "product-media", "categories", "products", "gallery", "media", "brand-assets", "public"]));

      for (const b of candidateBuckets) {
        try {
          const { error: uploadErr } = await dbClient.storage.from(b).upload(filePath, buffer, {
            contentType: mimeType,
            cacheControl: "3600",
            upsert: true
          });

          if (!uploadErr) {
            const { data: publicUrlData } = dbClient.storage.from(b).getPublicUrl(filePath);
            return res.json({ success: true, url: publicUrlData.publicUrl });
          }
        } catch {
          // try next bucket
        }
      }

      return res.status(500).json({ success: false, error: "Failed to upload to storage buckets" });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // SITE SETTINGS DB Proxy (Supports both key/value rows AND column-based rows)
  app.get("/api/db/site-settings/:key", async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { key } = req.params;
      // 1. Try key-value table
      const { data: kvData, error: kvErr } = await dbClient.from("site_settings").select("value").eq("key", key).maybeSingle();
      if (!kvErr && kvData && kvData.value !== undefined) {
        return res.json({ success: true, data: kvData.value });
      }

      // 2. Try single row config with named column
      const k = key.toLowerCase();
      let colName = null;
      if (k.includes("announcement")) colName = "announcements";
      else if (k.includes("theme")) colName = "theme_settings";
      else if (k.includes("ai") || k.includes("assistant")) colName = "ai_assistant";
      else if (k.includes("contact")) colName = "contact_info";
      else if (k.includes("stat")) colName = "stats";
      else if (k.includes("delivery")) colName = "delivery_settings";
      else if (k.includes("checkout")) colName = "checkout_settings";
      else if (k.includes("planner") || k.includes("designer")) colName = "planner_config";
      else if (k.includes("config") || k.includes("business")) colName = "business_config";
      else if (k.includes("gallery")) colName = "gallery";

      if (colName) {
        const { data: colData } = await dbClient.from("site_settings").select(colName).eq("id", "config").maybeSingle();
        if (colData && (colData as any)[colName] !== undefined) {
          return res.json({ success: true, data: (colData as any)[colName] });
        }
      }

      return res.json({ success: true, data: null });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.post("/api/db/site-settings/upsert", requireAdminAuth, async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { key, value } = req.body;
      if (!key) return res.status(400).json({ success: false, error: "Key is required" });

      // 1. Try key/value schema
      const { error: kvError } = await dbClient.from("site_settings").upsert({
        key,
        value,
        updated_at: new Date().toISOString()
      }, { onConflict: "key" });

      if (!kvError) {
        return res.json({ success: true });
      }

      // 2. If table uses column-based id='config' schema
      const k = key.toLowerCase();
      let colName = null;
      if (k.includes("announcement")) colName = "announcements";
      else if (k.includes("theme")) colName = "theme_settings";
      else if (k.includes("ai") || k.includes("assistant")) colName = "ai_assistant";
      else if (k.includes("contact")) colName = "contact_info";
      else if (k.includes("stat")) colName = "stats";
      else if (k.includes("delivery")) colName = "delivery_settings";
      else if (k.includes("checkout")) colName = "checkout_settings";
      else if (k.includes("planner") || k.includes("designer")) colName = "planner_config";
      else if (k.includes("config") || k.includes("business")) colName = "business_config";
      else if (k.includes("gallery")) colName = "gallery";

      if (colName) {
        const payload = { id: "config", [colName]: value, updated_at: new Date().toISOString() };
        const { error: colError } = await dbClient.from("site_settings").upsert(payload, { onConflict: "id" });
        if (colError) return res.status(500).json({ success: false, error: colError.message });
        return res.json({ success: true });
      }

      return res.status(500).json({ success: false, error: kvError.message });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // =========================================================
  // DEDICATED AI KNOWLEDGE BASE DATABASE PROXY APIS (SUPABASE)
  // =========================================================

  // In-memory cached catalog for lightning fast AI response (<10ms context prep)
  interface AiCatalogCache {
    timestamp: number;
    products: any[];
    categories: any[];
    brands: any[];
    deliveryCities: any[];
    aiKnowledge: any[];
    aiConfig: any;
    businessConfig: any;
  }

  let aiCatalogCache: AiCatalogCache | null = null;
  const CACHE_TTL_MS = 30000; // 30 seconds TTL

  const invalidateAiCatalogCache = () => {
    aiCatalogCache = null;
  };

  const getCachedDatabaseCatalogForAi = async (storeContext: any = {}) => {
    const now = Date.now();
    if (aiCatalogCache && (now - aiCatalogCache.timestamp) < CACHE_TTL_MS) {
      return {
        products: storeContext.products?.length ? storeContext.products : aiCatalogCache.products,
        categories: storeContext.categories?.length ? storeContext.categories : aiCatalogCache.categories,
        brands: storeContext.brands?.length ? storeContext.brands : aiCatalogCache.brands,
        deliveryCities: storeContext.cities?.length ? storeContext.cities : aiCatalogCache.deliveryCities,
        aiKnowledge: storeContext.aiAssistantConfig?.customKnowledge?.length ? storeContext.aiAssistantConfig.customKnowledge : aiCatalogCache.aiKnowledge,
        aiConfig: storeContext.aiAssistantConfig || aiCatalogCache.aiConfig,
        businessConfig: storeContext.config || aiCatalogCache.businessConfig
      };
    }

    let products: any[] = [];
    let categories: any[] = [];
    let brands: any[] = [];
    let deliveryCities: any[] = [];
    let aiKnowledge: any[] = [];
    let aiConfig: any = {};
    let businessConfig: any = {};

    if (dbClient) {
      try {
        const [prodRes, catRes, brandRes, cityRes, knowRes, setRes] = await Promise.all([
          dbClient.from("products").select("*").eq("hidden", false).limit(100),
          dbClient.from("categories").select("id, name, slug, description").order("display_order", { ascending: true }),
          dbClient.from("brands").select("id, name, description, country").eq("enabled", true),
          dbClient.from("delivery_cities").select("id, name, city_name, delivery_fee, estimated_days, enabled, is_enabled, same_day_available, next_day_available").eq("enabled", true),
          dbClient.from("ai_knowledge").select("id, title, category, question_or_topic, answer_or_content, is_enabled, display_order").order("display_order", { ascending: true }),
          dbClient.from("site_settings").select("key, value")
        ]);

        if (prodRes.data && Array.isArray(prodRes.data)) {
          products = prodRes.data.map((p: any) => {
            const rawSpecs = typeof p.specifications === 'object' && p.specifications ? p.specifications : (p.specs || {});
            const isSale = Boolean(p.sale_enabled ?? p.is_on_sale ?? p.sale_active ?? rawSpecs._sale_enabled ?? (p.sale_price && Number(p.sale_price) > 0));
            const salePriceVal = p.sale_price ?? rawSpecs._sale_price ?? rawSpecs._raw_sale_price;
            const priceVal = p.price ?? rawSpecs._raw_price;

            return {
              id: p.id,
              name: p.title || p.name || "Product",
              price: isSale && salePriceVal ? `PKR ${Number(salePriceVal).toLocaleString()}` : (priceVal ? (String(priceVal).includes('PKR') ? priceVal : `PKR ${Number(priceVal).toLocaleString()}`) : "Price on Request"),
              numericPrice: Number(isSale && salePriceVal ? salePriceVal : priceVal) || 0,
              category: p.category_id || p.category || "",
              brand: p.brand || p.brand_id || "",
              image: p.main_image || p.image || "/placeholder.jpg",
              features: Array.isArray(p.features) ? p.features : [],
              description: p.description || p.short_description || "",
              stockStatus: p.stock_status || (p.stock_quantity > 0 ? "In Stock" : "Available on Order"),
              badge: p.badge || ""
            };
          });
        }

        if (catRes.data && Array.isArray(catRes.data)) {
          categories = catRes.data;
        }

        if (brandRes.data && Array.isArray(brandRes.data)) {
          brands = brandRes.data;
        }

        if (cityRes.data && Array.isArray(cityRes.data)) {
          deliveryCities = cityRes.data.map((c: any) => ({
            cityName: c.name || c.city_name || "City",
            deliveryFee: c.delivery_fee || 0,
            estimatedDays: c.estimated_days || "2-3 Days",
            isEnabled: c.enabled !== false && c.is_enabled !== false,
            isSameDayAvailable: !!c.same_day_available,
            isNextDayAvailable: !!c.next_day_available
          }));
        }

        if (knowRes.data && Array.isArray(knowRes.data) && knowRes.data.length > 0) {
          aiKnowledge = knowRes.data.map((k: any) => ({
            id: k.id,
            title: k.title,
            category: k.category,
            questionOrTopic: k.question_or_topic,
            answerOrContent: k.answer_or_content,
            isEnabled: k.is_enabled !== false,
            displayOrder: k.display_order || 0
          }));
        }

        if (setRes.data && Array.isArray(setRes.data)) {
          for (const row of setRes.data) {
            if (row.key === "zst_ai_assistant_config_v1" && row.value) {
              aiConfig = row.value;
              if (aiKnowledge.length === 0 && Array.isArray(aiConfig.customKnowledge)) {
                aiKnowledge = aiConfig.customKnowledge;
              }
            } else if (row.key === "zst_business_config_v1" && row.value) {
              businessConfig = row.value;
            }
          }
        }
      } catch (dbErr) {
        console.warn("[Server AI Context] Direct Supabase fetch error, will use fallback store:", dbErr);
      }
    }

    // Fallback to cmsDataStore or storeContext if database was empty
    if (products.length === 0) {
      products = storeContext.products || cmsDataStore.zst_products_v1 || [];
    }
    if (categories.length === 0) {
      categories = storeContext.categories || cmsDataStore.zst_categories_v1 || [];
    }
    if (brands.length === 0) {
      brands = storeContext.brands || cmsDataStore.zst_brands_v1 || [];
    }
    if (deliveryCities.length === 0) {
      const deliv = cmsDataStore.zst_delivery_settings_v1 || {};
      deliveryCities = deliv.cities || storeContext.cities || [];
    }
    if (aiKnowledge.length === 0) {
      const cfg = storeContext.aiAssistantConfig || cmsDataStore.zst_ai_assistant_config_v1 || {};
      aiKnowledge = cfg.customKnowledge || [];
    }
    if (Object.keys(aiConfig).length === 0) {
      aiConfig = storeContext.aiAssistantConfig || cmsDataStore.zst_ai_assistant_config_v1 || {};
    }
    if (Object.keys(businessConfig).length === 0) {
      businessConfig = storeContext.config || cmsDataStore.zst_business_config_v1 || {};
    }

    aiCatalogCache = {
      timestamp: now,
      products,
      categories,
      brands,
      deliveryCities,
      aiKnowledge,
      aiConfig,
      businessConfig
    };

    return aiCatalogCache;
  };

  // GET AI Knowledge from Supabase
  app.get("/api/db/ai-knowledge", async (req, res) => {
    try {
      if (dbClient) {
        const { data, error } = await dbClient
          .from("ai_knowledge")
          .select("*")
          .order("display_order", { ascending: true });

        if (!error && Array.isArray(data) && data.length > 0) {
          return res.json({ success: true, data });
        }
      }

      // Fallback to site_settings or cmsDataStore
      const aiConf = cmsDataStore.zst_ai_assistant_config_v1 || {};
      return res.json({ success: true, data: aiConf.customKnowledge || [] });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // UPSERT AI Knowledge item(s) to Supabase
  app.post("/api/db/ai-knowledge/upsert", requireAdminAuth, async (req, res) => {
    try {
      const { knowledge, item } = req.body;
      const itemsToSave: any[] = Array.isArray(knowledge) ? knowledge : (item ? [item] : []);

      if (itemsToSave.length === 0) {
        return res.status(400).json({ success: false, error: "No knowledge item(s) provided" });
      }

      if (dbClient) {
        const dbPayload = itemsToSave.map((k: any, idx: number) => ({
          id: k.id || `ck-${Date.now()}-${idx}`,
          title: k.title || "Untitled Knowledge",
          category: k.category || "general",
          question_or_topic: k.questionOrTopic || k.question_or_topic || "",
          answer_or_content: k.answerOrContent || k.answer_or_content || "",
          is_enabled: k.isEnabled !== false && k.is_enabled !== false,
          display_order: typeof k.displayOrder === 'number' ? k.displayOrder : (typeof k.display_order === 'number' ? k.display_order : idx + 1),
          updated_at: new Date().toISOString()
        }));

        const result = await robustUpsert("ai_knowledge", dbPayload, { onConflict: "id" });
        if (!result.success) {
          console.warn("[DB Proxy] Upsert to ai_knowledge table error:", result.error);
        } else {
          console.log(`[DB Proxy] Upserted ${dbPayload.length} records into ai_knowledge table`);
        }
      }

      // Also update in-memory cmsDataStore for local disk persistence
      const currentConfig = cmsDataStore.zst_ai_assistant_config_v1 || {};
      let currentKnowledge: any[] = currentConfig.customKnowledge || [];
      itemsToSave.forEach(newItem => {
        const existingIdx = currentKnowledge.findIndex(k => k.id === newItem.id);
        if (existingIdx >= 0) {
          currentKnowledge[existingIdx] = { ...currentKnowledge[existingIdx], ...newItem };
        } else {
          currentKnowledge.push(newItem);
        }
      });
      cmsDataStore.zst_ai_assistant_config_v1 = {
        ...currentConfig,
        customKnowledge: currentKnowledge
      };
      await persistDataStoreToDisk();
      invalidateAiCatalogCache();

      return res.json({ success: true, count: itemsToSave.length });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // DELETE AI Knowledge item from Supabase
  app.delete("/api/db/ai-knowledge/:id", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      if (!id) return res.status(400).json({ success: false, error: "ID is required" });

      if (dbClient) {
        await dbClient.from("ai_knowledge").delete().eq("id", id);
      }

      const currentConfig = cmsDataStore.zst_ai_assistant_config_v1 || {};
      if (Array.isArray(currentConfig.customKnowledge)) {
        currentConfig.customKnowledge = currentConfig.customKnowledge.filter((k: any) => k.id !== id);
        cmsDataStore.zst_ai_assistant_config_v1 = currentConfig;
        await persistDataStoreToDisk();
      }
      invalidateAiCatalogCache();

      return res.json({ success: true, id });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // TOGGLE AI Knowledge item enabled state
  app.patch("/api/db/ai-knowledge/:id/toggle", requireAdminAuth, async (req, res) => {
    try {
      const { id } = req.params;
      const { isEnabled } = req.body;
      if (!id) return res.status(400).json({ success: false, error: "ID is required" });

      if (dbClient) {
        await dbClient.from("ai_knowledge").update({
          is_enabled: !!isEnabled,
          updated_at: new Date().toISOString()
        }).eq("id", id);
      }

      const currentConfig = cmsDataStore.zst_ai_assistant_config_v1 || {};
      if (Array.isArray(currentConfig.customKnowledge)) {
        currentConfig.customKnowledge = currentConfig.customKnowledge.map((k: any) => 
          k.id === id ? { ...k, isEnabled: !!isEnabled } : k
        );
        cmsDataStore.zst_ai_assistant_config_v1 = currentConfig;
        await persistDataStoreToDisk();
      }
      invalidateAiCatalogCache();

      return res.json({ success: true, id, isEnabled });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  // AI Luxury Bathroom & Building Material Consultant API
  app.post("/api/ai-consultant", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          error: "GEMINI_API_KEY is missing in environment secrets.",
        });
      }

      const { projectType, roomsCount, aestheticStyle, budgetLevel, customDetails } = req.body;

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      const prompt = `You are a world-class luxury interior designer and building material consultant for ZAFAR SARWAR TRADERS, a premier distributor of luxury sanitaryware, designer faucets, rain showers, vanities, plumbing (CPVC/PPR), paints, cement, and construction supplies.

The customer provided these requirements:
- Project Type: ${projectType || "Residential Villa / Bathroom Upgrade"}
- Number of Bathrooms / Units: ${roomsCount || 2}
- Aesthetic Style: ${aestheticStyle || "Modern Minimalist Matte Black & Gold"}
- Budget Scale: ${budgetLevel || "Ultra Luxury Premium"}
- Specific Requests: ${customDetails || "Looking for thermostatic shower systems, wall-hung toilets, designer wash basins, premium paints, and high-pressure plumbing."}

Respond in clean JSON format with these exact keys:
1. "headline": A compelling, luxury recommendation title for the project.
2. "overview": A 2-sentence executive summary tailored for Zafar Sarwar Traders catalog.
3. "recommendedCategories": Array of 4-6 category names from our store (e.g., ["Rain Showers", "Designer Faucets", "Vanity Cabinets", "CPVC Pipes", "Wall Putty & Paints"]).
4. "keyProducts": Array of 4 recommended items with fields: "name", "category", "whyItFits", "estimatedSpecs".
5. "estimatedMaterialTip": A professional tip regarding plumbing, waterproofing, or finish choices.
6. "whatsappSummary": A pre-formatted short text snippet ready for WhatsApp inquiry.

Ensure tone is highly professional, inspiring, and elegant like Kohler, Hansgrohe, Grohe, or Porsche design aesthetics.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        },
      });

      const responseText = response.text || "{}";
      const parsedData = JSON.parse(responseText);

      return res.json({ success: true, data: parsedData });
    } catch (err: any) {
      console.error("AI Consultant API Error:", err);
      return res.status(500).json({
        error: "Failed to generate AI consultancy recommendation.",
        details: err?.message || String(err),
      });
    }
  });

  // =========================================================================
  // HIGH-PERFORMANCE, WEBSITE-AWARE AI SALES ASSISTANT (RAG & Live DB Grounded)
  // =========================================================================
  app.post("/api/ai-chat", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const { message, history = [], storeContext = {} } = req.body;

      // 1. Fetch live ground truth data directly from Supabase / server cache
      const catalog = await getCachedDatabaseCatalogForAi(storeContext);
      const allProducts: any[] = catalog.products || [];
      const allCategories: any[] = catalog.categories || [];
      const allBrands: any[] = catalog.brands || [];
      const cities: any[] = catalog.deliveryCities || [];
      const aiConfig: any = catalog.aiConfig || {};
      const customKnowledge: any[] = (catalog.aiKnowledge || []).filter((k: any) => k.isEnabled !== false);
      const businessConfig: any = catalog.businessConfig || {};

      const query = (message || '').toLowerCase().trim();

      // 2. Multilingual & Smart Tool Intent Analysis
      const isUrduQuery = /[\u0600-\u06FF]/.test(message || '') || 
        /\b(kya|hai|hein|chahiye|dikhao|batao|kitne|ka|ki|rate|bhejo|toti|nal|commode|sasta|mehenga|lagti|hogi|mujhe|mjhe|chaniot|lahore)\b/i.test(query);

      // Smart Tools intent detection
      let detectedSmartTool: string | null = null;
      if (/\b(bathroom plan|planner|package|remodel|renovation|design|kamray ka naksha)\b/i.test(query)) {
        detectedSmartTool = "bathroom_planner";
      } else if (/\b(cement|concrete|crush|sand|ret|bajri|estimate|estimator|kitna cement|bori|bags)\b/i.test(query)) {
        detectedSmartTool = "cement_estimator";
      } else if (/\b(tank|tanki|water tank|pump|hp pump|pani ki tanki)\b/i.test(query)) {
        detectedSmartTool = "tank_calculator";
      } else if (/\b(tile|tiles|marbles|sqft|square feet|box|boxes)\b/i.test(query)) {
        detectedSmartTool = "tile_calculator";
      }

      // 3. Extract Numeric Price Intent
      let maxPrice: number | null = null;
      let minPrice: number | null = null;
      const priceNumbers = query.match(/\b\d{3,7}\b/g);
      if (priceNumbers && priceNumbers.length > 0) {
        const primaryNum = parseInt(priceNumbers[0], 10);
        if (query.includes('under') || query.includes('below') || query.includes('less than') || query.includes('kam') || query.includes('tak') || query.includes('se kam')) {
          maxPrice = primaryNum;
        } else if (query.includes('around') || query.includes('about') || query.includes('karib') || query.includes('approx')) {
          minPrice = Math.floor(primaryNum * 0.75);
          maxPrice = Math.ceil(primaryNum * 1.25);
        } else if (query.includes('above') || query.includes('more than') || query.includes('ziyada')) {
          minPrice = primaryNum;
        } else {
          maxPrice = Math.ceil(primaryNum * 1.2);
        }
      }

      // 4. Intelligent Multi-Token Candidate Scoring & Search
      const stopwords = ['show', 'me', 'the', 'and', 'for', 'with', 'have', 'you', 'want', 'need', 'this', 'that', 'wala', 'wali', 'dikhao', 'chahiye', 'kya', 'hai', 'bhi', 'lagti', 'hogi', 'mujhe', 'mjhe', 'under', 'below', 'around', 'price', 'rate', 'cost', 'pakistan', 'rs', 'pkr', 'batao', 'please'];
      const searchTerms = query.split(/[\s,.-]+/).filter(t => t.length > 1 && !stopwords.includes(t));

      // Synonyms dictionary for Urdu/English matching
      const synonymMap: Record<string, string[]> = {
        'faucet': ['tap', 'mixer', 'toti', 'nal', 'sink mixer', 'basin mixer'],
        'shower': ['fawwara', 'shower set', 'rain shower', 'jet', 'body jet', 'head shower'],
        'toilet': ['commode', 'wc', 'pot', 'seat', 'wall hung', 'one piece'],
        'basin': ['sink', 'wash basin', 'vanity', 'countertop'],
        'pipe': ['cpvc', 'ppr', 'upvc', 'plumbing', 'fittings'],
        'cement': ['opc', 'src', '53 grade', 'bestway', 'maple leaf'],
        'paint': ['emulsion', 'weather sheet', 'silk', 'varnish']
      };

      const expandedTerms = new Set<string>(searchTerms);
      searchTerms.forEach(term => {
        for (const [key, syns] of Object.entries(synonymMap)) {
          if (term === key || syns.includes(term)) {
            expandedTerms.add(key);
            syns.forEach(s => expandedTerms.add(s));
          }
        }
      });

      const scoredProducts = allProducts.map((p: any) => {
        let score = 0;
        const pName = (p.name || '').toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        const pBrand = (p.brand || '').toLowerCase();
        const pDesc = (p.description || '').toLowerCase();
        const pFeatures = (p.features || []).join(' ').toLowerCase();

        expandedTerms.forEach(term => {
          if (pName.includes(term)) score += 15;
          if (pBrand.includes(term)) score += 12;
          if (pCat.includes(term)) score += 8;
          if (pFeatures.includes(term)) score += 6;
          if (pDesc.includes(term)) score += 3;
        });

        const numPrice = p.numericPrice || parseInt(String(p.price || '0').replace(/[^0-9]/g, ''), 10) || 0;
        if (numPrice > 0) {
          if (maxPrice !== null && numPrice <= maxPrice && (minPrice === null || numPrice >= minPrice)) {
            score += 20;
          } else if (maxPrice !== null && numPrice > maxPrice) {
            score -= 10;
          }
        }

        return { product: p, score, numPrice };
      });

      const matchedCandidates = scoredProducts
        .filter(sp => sp.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(sp => sp.product);

      const candidateProducts = matchedCandidates.length > 0
        ? matchedCandidates.slice(0, 10)
        : allProducts.slice(0, 8);

      // 5. Matched City Delivery Info
      const matchedCity = cities.find((c: any) => c.isEnabled && query.includes((c.cityName || '').toLowerCase()));

      // 6. Matched Category
      const matchedCategory = allCategories.find((c: any) => query.includes((c.name || '').toLowerCase()) || (c.slug && query.includes(c.slug)));

      // 7. Matched Custom Knowledge & Policies (Strict Grounding)
      const relevantKnowledge = customKnowledge.filter((ck: any) => {
        const topic = (ck.questionOrTopic || '').toLowerCase();
        const title = (ck.title || '').toLowerCase();
        return Array.from(expandedTerms).some(t => topic.includes(t) || title.includes(t));
      });
      const activeKnowledgeToInject = relevantKnowledge.length > 0 ? relevantKnowledge : customKnowledge.slice(0, 6);

      // Check if GEMINI_API_KEY is present
      if (!apiKey) {
        return res.json({
          success: true,
          data: {
            reply: isUrduQuery
              ? `ظفر سرور ٹریڈرز میں خوش آمدید! ہماری انوینٹری میں تمام برانڈز (Sonex, Faisal, Master, Hansgrohe, Grohe) اصل وارنٹی کے ساتھ دستیاب ہیں۔ آپ واٹس ایپ پر فوری کوٹیشن اور ڈسکاؤنٹ حاصل کر سکتے ہیں۔`
              : `Welcome to Zafar Sarwar Traders! We are official stockists for premium sanitaryware, faucets, showers, and plumbing supplies with 100% genuine brand warranties. How can I help you today?`,
            recommendedProducts: candidateProducts.slice(0, 3).map((p: any) => ({
              id: p.id,
              name: p.name,
              price: p.price,
              image: p.image,
              brand: p.brand,
              features: p.features || [],
              stockStatus: p.stockStatus || 'In Stock'
            })),
            recommendedCategory: matchedCategory ? { id: matchedCategory.id, name: matchedCategory.name } : null,
            deliveryInfoCard: matchedCity ? {
              cityName: matchedCity.cityName,
              estimatedDays: matchedCity.estimatedDays,
              deliveryFee: matchedCity.deliveryFee,
              notes: "Express door-to-door delivery."
            } : null,
            suggestedReplies: isUrduQuery 
              ? ["واٹس ایپ پر رابطہ کریں", "پروڈکٹس دیکھیں", "ڈیلیوری کی تفصیل"]
              : ["Order on WhatsApp", "Browse Products", "Check Delivery Times"],
            suggestedSmartTool: detectedSmartTool
          }
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });

      // Format conversation history
      const formattedHistory = Array.isArray(history)
        ? history.slice(-6).map((h: any) => `${h.sender === 'user' ? 'Customer' : 'Assistant'}: ${h.text}`).join('\n')
        : '';

      const systemInstruction = `You are "Zafar AI Shopping Assistant", the official digital showroom sales consultant for ZAFAR SARWAR TRADERS (Pakistan's premier luxury sanitaryware, designer faucets, rain showers, plumbing, and building materials supplier).

CORE ARCHITECTURAL RULES & GUARDRAILS:
1. STRICT WEBSITE TRUTH: You MUST ground all facts, prices, specifications, warranties, and delivery information strictly in the provided LIVE STORE CONTEXT and CUSTOM KNOWLEDGE below. Never invent fake product models or prices.
2. ACCURATE PRODUCT RECOMMENDATIONS:
   - When the customer inquires about products, faucets, showers, prices, or materials, select 1 to 4 matching products from CANDIDATE PRODUCTS.
   - If the user asks for an exact model or brand not in our catalog, politely clarify: "While that specific item is not in our current stock, here are top-rated available alternatives from our showroom:" and show relevant candidate items.
3. LANGUAGE COHESION & MULTILINGUAL SUPPORT:
   - If the customer writes in Urdu script (e.g. "کتنے کا ہے"), reply in beautiful, polite Urdu.
   - If the customer writes in Roman Urdu (e.g. "faucet dikhao", "lahore delivery hai?", "rate kya hai"), reply in natural, courteous Roman Urdu.
   - If the customer writes in English, reply in crisp, professional English.
4. INTEGRATED SMART TOOLS:
   - If the user is planning a full bathroom or asks for packages, mention our Easy Bathroom Planner and set "suggestedSmartTool": "bathroom_planner".
   - If user asks about cement/concrete bags or construction calculation, suggest our Material Estimator and set "suggestedSmartTool": "cement_estimator".
   - If user asks about water tanks or pump power, set "suggestedSmartTool": "tank_calculator".
5. SECURITY & CONFIDENTIALITY: Never reveal internal admin PINs, developer keys, Supabase credentials, or private customer records.

Respond in strict JSON format matching this schema:
{
  "reply": "Your natural language conversational response...",
  "recommendedProducts": [
    {
      "id": "product-id",
      "name": "Product Title",
      "price": "PKR XX,XXX",
      "image": "image url",
      "brand": "Brand Name",
      "features": ["feature 1", "feature 2"],
      "stockStatus": "In Stock"
    }
  ],
  "recommendedCategory": null OR {
    "id": "category-id",
    "name": "Category Name"
  },
  "deliveryInfoCard": null OR {
    "cityName": "City Name",
    "estimatedDays": "X-Y Working Days",
    "deliveryFee": 250,
    "notes": "Delivery note"
  },
  "comparisonTable": null OR {
    "title": "Product Comparison",
    "products": [
      {
        "id": "id",
        "name": "Name",
        "brand": "Brand",
        "price": "Price",
        "material": "Material / Brass / Finish",
        "warranty": "Warranty info",
        "features": "Key highlights",
        "availability": "In Stock"
      }
    ]
  },
  "suggestedSmartTool": null OR "bathroom_planner" OR "cement_estimator" OR "tank_calculator" OR "tile_calculator",
  "suggestedReplies": ["Quick Reply 1", "Quick Reply 2", "Quick Reply 3"]
}`;

      const promptContext = `
LIVE STORE CONTEXT (SOURCE OF TRUTH):
Showroom: ${businessConfig.name || "Zafar Sarwar Traders"}
WhatsApp / Phone: ${businessConfig.phone || "+92 310 8002863"}
Location: ${businessConfig.address || "Main Showroom Yard"}
Showroom Timings: ${businessConfig.hoursWeekday || "Monday - Saturday 9:00 AM - 9:00 PM (Friday break for Juma prayer)"}

${matchedCity ? `CITY DELIVERY DETAILS:
City: ${matchedCity.cityName}
Estimated Delivery: ${matchedCity.estimatedDays}
Delivery Fee: PKR ${matchedCity.deliveryFee}
Same Day Express: ${matchedCity.isSameDayAvailable ? "Available" : "Standard"}
` : ''}

CUSTOM KNOWLEDGE & OFFICIAL STORE POLICIES (${activeKnowledgeToInject.length} rules loaded from Supabase):
${activeKnowledgeToInject.map((k: any) => `• [${k.category.toUpperCase()}] ${k.title}: ${k.answerOrContent}`).join('\n')}

CANDIDATE PRODUCTS FROM LIVE DATABASE (${candidateProducts.length} items):
${JSON.stringify(candidateProducts.map((p: any) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  price: p.price,
  brand: p.brand,
  features: p.features,
  stockStatus: p.stockStatus || 'In Stock',
  image: p.image
})))}

AVAILABLE STORE CATEGORIES:
${JSON.stringify(allCategories.map((c: any) => ({ id: c.id, name: c.name })))}

CONVERSATION HISTORY:
${formattedHistory}

CUSTOMER QUERY:
"${message}"
`;

      const selectedModel = aiConfig?.selectedModel || "gemini-2.5-flash";

      const response = await ai.models.generateContent({
        model: selectedModel.includes("gemini") ? selectedModel : "gemini-2.5-flash",
        contents: promptContext,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.5,
        },
      });

      const text = response.text || "{}";
      let parsed: any = {};
      try {
        parsed = JSON.parse(text);
      } catch (parseErr) {
        console.warn("[Server AI Chat] JSON parse fallback on text:", text);
        parsed = { reply: text.replace(/[{}"]/g, '') };
      }

      return res.json({
        success: true,
        data: {
          reply: parsed.reply || (isUrduQuery ? "میں آپ کی رہنمائی کے لیے حاضر ہوں۔ آپ کو کون سی پروڈکٹ یا قیمت معلوم کرنی ہے؟" : "I'd be glad to help you with Zafar Sarwar Traders products. How can I assist you today?"),
          recommendedProducts: parsed.recommendedProducts || (candidateProducts.length > 0 ? candidateProducts.slice(0, 3).map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image,
            brand: p.brand,
            features: p.features,
            stockStatus: p.stockStatus || 'In Stock'
          })) : []),
          recommendedCategory: parsed.recommendedCategory || (matchedCategory ? { id: matchedCategory.id, name: matchedCategory.name } : null),
          deliveryInfoCard: parsed.deliveryInfoCard || (matchedCity ? {
            cityName: matchedCity.cityName,
            estimatedDays: matchedCity.estimatedDays,
            deliveryFee: matchedCity.deliveryFee,
            notes: "Express door-to-door courier dispatch."
          } : null),
          comparisonTable: parsed.comparisonTable || null,
          suggestedSmartTool: parsed.suggestedSmartTool || detectedSmartTool || null,
          suggestedReplies: parsed.suggestedReplies || (isUrduQuery 
            ? ["واٹس ایپ پر آرڈر کریں", "وارنٹی کی تفصیل", "مکمل کیٹلاگ"]
            : ["Order on WhatsApp", "View Product Specs", "Request Quotation"])
        }
      });
    } catch (err: any) {
      console.error("AI Chat API Error:", err);
      return res.json({
        success: true,
        data: {
          reply: "Welcome to Zafar Sarwar Traders! Our AI shopping assistant is connected to our live showroom inventory. You can browse all luxury sanitaryware, showers, and faucets below, or chat directly with our team on WhatsApp (+92 310 8002863).",
          recommendedProducts: [],
          fallback: true,
          suggestedReplies: ["Order on WhatsApp", "Browse Products", "Call Showroom"]
        }
      });
    }
  });

  // PERSISTENT CMS DATA BACKEND DISK APIS
  const fs = await import("fs/promises");
  const CMS_FILE_PATH = path.join(process.cwd(), "cms_store_data.json");

  let cmsDataStore: Record<string, any> = {};

  // Hydrate in-memory store on boot if file exists
  try {
    const fileContent = await fs.readFile(CMS_FILE_PATH, "utf-8");
    cmsDataStore = JSON.parse(fileContent);
    console.log("Successfully loaded CMS store from disk:", Object.keys(cmsDataStore));
  } catch (e) {
    console.log("No existing cms_store_data.json found. Will initialize on first save.");
  }

  let saveQueuePromise: Promise<void> = Promise.resolve();

  const persistDataStoreToDisk = () => {
    saveQueuePromise = saveQueuePromise.then(async () => {
      try {
        await fs.writeFile(CMS_FILE_PATH, JSON.stringify(cmsDataStore, null, 2), "utf-8");
      } catch (err) {
        console.error("Error persisting cms_store_data.json to disk:", err);
      }
    });
    return saveQueuePromise;
  };

  app.get("/api/cms/load", (req, res) => {
    return res.json({ success: true, data: cmsDataStore });
  });

  app.post("/api/cms/save", async (req, res) => {
    try {
      const { key, payload } = req.body;
      if (key) {
        cmsDataStore[key] = payload;
        await persistDataStoreToDisk();
      }
      return res.json({ success: true, key });
    } catch (e: any) {
      console.error("CMS Save Error:", e);
      return res.status(500).json({ success: false, error: e?.message || String(e) });
    }
  });

  app.post("/api/cms/save-all", async (req, res) => {
    try {
      const { data } = req.body;
      if (data && typeof data === "object") {
        cmsDataStore = { ...cmsDataStore, ...data };
        await persistDataStoreToDisk();
      }
      return res.json({ success: true, keys: Object.keys(cmsDataStore) });
    } catch (e: any) {
      console.error("CMS Batch Save Error:", e);
      return res.status(500).json({ success: false, error: e?.message || String(e) });
    }
  });


  // Vite development middleware vs Static Production serving
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Zafar Sarwar Traders Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
