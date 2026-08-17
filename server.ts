import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase Service Role DB Client for server proxy
const rawSupabaseUrl = (process.env.VITE_SUPABASE_URL || "").trim();
const targetSupabaseUrl = rawSupabaseUrl
  ? (rawSupabaseUrl.startsWith("http") ? rawSupabaseUrl : `https://${rawSupabaseUrl}.supabase.co`)
  : "";
const serviceRoleKey = (
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  ""
).trim();

const dbClient = (targetSupabaseUrl && serviceRoleKey)
  ? createClient(targetSupabaseUrl, serviceRoleKey)
  : null;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", app: "Zafar Sarwar Traders" });
  });

  // Database Proxy API Endpoints (Bypasses browser RLS write restrictions using service role key)
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

  app.post("/api/db/categories/upsert", async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { categories } = req.body;
      const list = Array.isArray(categories) ? categories : (req.body.category ? [req.body.category] : []);
      if (list.length === 0) return res.json({ success: true });

      const payloads = list.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        slug: (cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/(^-|-$)+/g, ""),
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
        display_order: cat.displayOrder ?? 0
      }));

      const { error } = await dbClient.from("categories").upsert(payloads, { onConflict: "id" });
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.delete("/api/db/categories/:id", async (req, res) => {
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

  app.post("/api/db/brands/upsert", async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { brands } = req.body;
      const list = Array.isArray(brands) ? brands : (req.body.brand ? [req.body.brand] : []);
      if (list.length === 0) return res.json({ success: true });

      const payloads = list.map((b: any) => ({
        id: b.id,
        name: b.name,
        slug: (b.slug || b.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")).replace(/(^-|-$)+/g, ""),
        logo: b.logo || "",
        description: b.description || "",
        official_badge: b.officialBadge || null,
        featured: Boolean(b.isFeatured),
        is_active: Boolean(b.isActive ?? true),
        display_order: b.displayOrder ?? 0
      }));

      const { error } = await dbClient.from("brands").upsert(payloads, { onConflict: "id" });
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.delete("/api/db/brands/:id", async (req, res) => {
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
    if (typeof product.salePrice === "number") {
      numericSalePrice = product.salePrice;
    } else if (product.salePrice) {
      const digitsOnly = String(product.salePrice).replace(/[^0-9.]/g, "");
      if (digitsOnly) numericSalePrice = parseFloat(digitsOnly) || null;
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

  app.post("/api/db/products/upsert", async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { products } = req.body;
      const list = Array.isArray(products) ? products : (req.body.product ? [req.body.product] : []);
      if (list.length === 0) return res.json({ success: true });

      const payloads = list.map((p: any) => mapServerProductToDb(p));

      let { error } = await dbClient.from("products").upsert(payloads, { onConflict: "id" });
      if (error && error.code === "23503") {
        const sanitizedPayloads = payloads.map(p => ({ ...p, category_id: null, brand_id: null }));
        const retryResult = await dbClient.from("products").upsert(sanitizedPayloads, { onConflict: "id" });
        error = retryResult.error;
      }
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err?.message || String(err) });
    }
  });

  app.delete("/api/db/products/:id", async (req, res) => {
    if (!dbClient) return res.status(500).json({ success: false, error: "Database client not configured on server" });
    try {
      const { id } = req.params;
      const { error } = await dbClient.from("products").delete().eq("id", id);
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true });
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

  // ULTRA PREMIUM AI SALES & WEBSITE ASSISTANT (RAG Chat API)
  app.post("/api/ai-chat", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      const { message, history = [], storeContext = {} } = req.body;

      if (!apiKey) {
        return res.json({
          success: true,
          data: {
            reply: "Welcome to Zafar Sarwar Traders! Our AI assistant is currently using live store mode. Our official showroom team is available on WhatsApp (+92 310 8002863) for instant pricing, quotes, and catalog inquiries. How can we help you today?",
            recommendedProducts: [],
            fallback: true,
            suggestedReplies: ["Order on WhatsApp", "Browse Products", "Call Showroom"]
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

      // 1. Gather all live data sources
      const allProducts: any[] = storeContext.products || cmsDataStore.zst_products_v1 || [];
      const allCategories: any[] = storeContext.categories || cmsDataStore.zst_categories_v1 || [];
      const allBrands: any[] = storeContext.brands || cmsDataStore.zst_brands_v1 || [];
      const deliverySettings: any = cmsDataStore.zst_delivery_settings_v1 || {};
      const cities: any[] = deliverySettings.cities || storeContext.cities || [];
      const aiConfig: any = storeContext.aiAssistantConfig || cmsDataStore.zst_ai_assistant_config_v1 || {};
      const customKnowledge: any[] = aiConfig.customKnowledge || [];
      const businessConfig: any = storeContext.config || cmsDataStore.zst_business_config_v1 || {};

      const query = (message || '').toLowerCase().trim();

      // 2. Extract numeric price intent if present (e.g., "under 5000", "below 10000", "around 15000")
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

      // 3. Search and score candidate products
      const ignoreWords = ['show', 'me', 'the', 'and', 'for', 'with', 'have', 'you', 'want', 'need', 'this', 'that', 'wala', 'wali', 'dikhao', 'chahiye', 'kya', 'hai', 'bhi', 'lagti', 'hogi', 'mujhe', 'mjhe', 'under', 'below', 'around', 'price', 'rate', 'cost', 'pakistan', 'rs', 'pkr'];
      const terms = query.split(/\s+/).filter(t => t.length > 1 && !ignoreWords.includes(t));

      const scoredProducts = allProducts.map((p: any) => {
        let score = 0;
        const pName = (p.name || '').toLowerCase();
        const pCat = (p.category || '').toLowerCase();
        const pBrand = (p.brand || '').toLowerCase();
        const pDesc = (p.description || '').toLowerCase();
        const pFeatures = (p.features || []).join(' ').toLowerCase();

        terms.forEach(term => {
          if (pName.includes(term)) score += 10;
          if (pCat.includes(term)) score += 6;
          if (pBrand.includes(term)) score += 6;
          if (pFeatures.includes(term)) score += 4;
          if (pDesc.includes(term)) score += 2;
        });

        const numPrice = parseInt(String(p.price || '0').replace(/[^0-9]/g, ''), 10);
        if (numPrice > 0) {
          if (maxPrice !== null && numPrice <= maxPrice && (minPrice === null || numPrice >= minPrice)) {
            score += 15;
          } else if (maxPrice !== null && numPrice > maxPrice) {
            score -= 8;
          }
        }

        return { product: p, score, numPrice };
      });

      let candidateMatches = scoredProducts
        .filter(sp => sp.score > 0)
        .sort((a, b) => b.score - a.score)
        .map(sp => sp.product);

      const hasExactMatch = candidateMatches.length > 0;

      if (!hasExactMatch) {
        candidateMatches = allProducts.slice(0, 10);
      } else {
        candidateMatches = candidateMatches.slice(0, 12);
      }

      // 4. Matched City Delivery Info
      const matchedCity = cities.find((c: any) => c.isEnabled && query.includes((c.cityName || '').toLowerCase()));

      // 5. Active Custom Knowledge Items
      const activeCustomKnowledge = customKnowledge.filter((ck: any) => ck.isEnabled);

      // 6. Matched Category
      const matchedCategory = allCategories.find((c: any) => query.includes((c.name || '').toLowerCase()));

      // Format conversation history for prompt
      const formattedHistory = Array.isArray(history)
        ? history.slice(-6).map((h: any) => `${h.sender === 'user' ? 'Customer' : 'Assistant'}: ${h.text}`).join('\n')
        : '';

      const systemInstruction = `You are "Zafar AI Shopping Assistant", an ultra-premium, highly polite showroom sales consultant for ZAFAR SARWAR TRADERS.

MANDATORY BEHAVIOR & RULES:
1. PUBLIC DATA ONLY: Answer based ONLY on the provided live store context below. Never invent products, prices, or specs not supported by the live catalog.
2. PRODUCT SEARCH & NOT FOUND HANDLING:
   - If user asks for a specific product/brand/color/type that exists in our candidate products, recommend those candidates with accurate names and prices.
   - If the requested product/brand is NOT in our catalog, clearly state: "I couldn't find that exact product in our current catalog, but here are similar available alternatives from our showroom:" and list candidate matches.
3. MULTILINGUAL SUPPORT: Automatically detect if the user's message is in English, Urdu, or Roman Urdu (e.g. "faucet dikhao", "kitne ka hai", "black shower hai?"). Always reply in the EXACT SAME language as the customer.
4. DELIVERY INQUIRIES: If the user asks about delivery to a city, use the MATCHED CITY DELIVERY INFO or general delivery guidelines. Provide estimated working days and fee.
5. CATEGORY & NAVIGATION: If user asks for a specific category (e.g., Showers, Faucets, Basin), fill the "recommendedCategory" field with { "id": "category-id", "name": "Category Name" }.
6. ADMIN SECURITY: NEVER reveal internal admin PINs, passwords, API keys, database structures, or customer orders.
7. COMPACT & HELPFUL: Keep your verbal response warm, concise, and scannable.

Respond in strict JSON format with these exact keys:
{
  "reply": "Your natural language response...",
  "recommendedProducts": [
    {
      "id": "prod-id",
      "name": "Product Name",
      "price": "PKR XX,XXX",
      "image": "image url",
      "brand": "Brand Name",
      "features": ["feature 1", "feature 2"],
      "stockStatus": "In Stock"
    }
  ],
  "recommendedCategory": null OR {
    "id": "cat-id",
    "name": "Category Name",
    "description": "Short category note"
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
        "id": "id1",
        "name": "Name 1",
        "brand": "Brand 1",
        "price": "Price 1",
        "material": "Brass / Ceramic / etc",
        "warranty": "Warranty info",
        "features": "Key features",
        "availability": "In Stock"
      }
    ]
  },
  "launchPlanner": false,
  "needsWhatsAppEscalation": false,
  "suggestedReplies": ["Order on WhatsApp", "View Product Specs", "Request Quote"]
}`;

      const promptContext = `
LIVE STORE CONTEXT:
Showroom Name: ${businessConfig.name || "Zafar Sarwar Traders"}
Phone / WhatsApp: ${businessConfig.phone || "+92 310 8002863"}
Address: ${businessConfig.address || "Main Showroom Yard"}
Working Hours: ${businessConfig.hoursWeekday || "9:00 AM - 9:00 PM"}

${matchedCity ? `MATCHED CITY DELIVERY INFO:
City: ${matchedCity.cityName}
Estimated Days: ${matchedCity.estimatedDays}
Delivery Fee: PKR ${matchedCity.deliveryFee}
Same Day Available: ${matchedCity.isSameDayAvailable}
Next Day Available: ${matchedCity.isNextDayAvailable}
` : ''}

${activeCustomKnowledge.length > 0 ? `CUSTOM KNOWLEDGE & POLICIES:
${activeCustomKnowledge.map((ck: any) => `• [${ck.title}]: ${ck.answerOrContent}`).join('\n')}
` : ''}

MATCHED CANDIDATE PRODUCTS (${candidateMatches.length} items):
${JSON.stringify(candidateMatches.map((p: any) => ({
  id: p.id,
  name: p.name,
  category: p.category,
  price: p.price,
  brand: p.brand,
  features: p.features,
  stockStatus: p.stockStatus || 'In Stock',
  image: p.image
})))}

AVAILABLE CATEGORIES:
${JSON.stringify(allCategories.map((c: any) => ({ id: c.id, name: c.name })))}

CONVERSATION HISTORY:
${formattedHistory}

CUSTOMER MESSAGE:
"${message}"
`;

      const response = await ai.models.generateContent({
        model: aiConfig?.selectedModel || "gemini-2.5-flash",
        contents: promptContext,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.6,
        },
      });

      const text = response.text || "{}";
      const parsed = JSON.parse(text);

      return res.json({
        success: true,
        data: {
          reply: parsed.reply || "I'd be glad to assist you with Zafar Sarwar Traders products. How can I help you find what you need?",
          recommendedProducts: parsed.recommendedProducts || candidateMatches.slice(0, 3).map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image,
            brand: p.brand,
            features: p.features,
            stockStatus: p.stockStatus || 'In Stock'
          })),
          recommendedCategory: parsed.recommendedCategory || (matchedCategory ? { id: matchedCategory.id, name: matchedCategory.name } : null),
          deliveryInfoCard: parsed.deliveryInfoCard || (matchedCity ? {
            cityName: matchedCity.cityName,
            estimatedDays: matchedCity.estimatedDays,
            deliveryFee: matchedCity.deliveryFee,
            notes: "Express delivery via Leopard / TCS courier fleet."
          } : null),
          comparisonTable: parsed.comparisonTable || null,
          launchPlanner: !!parsed.launchPlanner,
          needsWhatsAppEscalation: !!parsed.needsWhatsAppEscalation,
          suggestedReplies: parsed.suggestedReplies || ["Order on WhatsApp", "Browse Products", "Contact Us"]
        }
      });
    } catch (err: any) {
      console.error("AI Chat API Error:", err);
      return res.json({
        success: true,
        data: {
          reply: "Thank you for inquiring with Zafar Sarwar Traders! Our AI assistant is currently connected to our live showroom database. You can browse all luxury products below, or connect directly with our sales specialists on WhatsApp (+92 310 8002863).",
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
