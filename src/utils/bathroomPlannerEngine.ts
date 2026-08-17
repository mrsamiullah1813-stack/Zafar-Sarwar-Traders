import { Product, EasyBathroomPlannerConfig, EasyBathroomPlannerInputs, BathroomPackageItem, EasyBathroomPlannerResult } from '../types';

// Fixture keywords for smart matching from real store catalog
const FIXTURE_KEYWORDS: Record<string, string[]> = {
  'toilet': ['commode', 'toilet', 'wc', 'water closet', 'one piece', 'wall hung', 'soft close', 'sanitary'],
  'basin': ['basin', 'vanity', 'wash basin', 'sink', 'pedestal', 'vessel basin', 'faucet', 'mixer', 'basin mixer'],
  'shower': ['shower', 'rain shower', 'shower set', 'overhead shower', 'telephone shower', 'hand shower', 'mixer'],
  'muslim_shower': ['muslim shower', 'bib cock', 'bibcock', 'two way', 'bidet', 'spray', 'tap', 'cock'],
  'accessories': ['accessory', 'accessories', 'mirror', 'towel', 'shelf', 'soap', 'dish', 'holder', 'hook', 'paper holder'],
  'fittings': ['angle valve', 'valve', 'waste', 'drain', 'floor drain', 'trap', 'pipe', 'fitting', 'cpvc', 'pvc']
};

/**
 * Parses numeric price from string like "PKR 14,500" or "14500" or "Call for Price"
 */
export function parseProductPrice(priceStr?: string): number {
  if (!priceStr) return 0;
  const digitsOnly = priceStr.replace(/[^0-9]/g, '');
  const parsed = parseInt(digitsOnly, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Formats price in Pakistani standard format (PKR 45,000)
 */
export function formatPKR(amount: number): string {
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`;
}

/**
 * Generates the full Easy Bathroom Package
 */
export function generateBathroomPackage(
  inputs: EasyBathroomPlannerInputs,
  allProducts: Product[],
  config: EasyBathroomPlannerConfig
): EasyBathroomPlannerResult {
  const bathroomType = config.bathroomTypes.find(t => t.id === inputs.bathroomTypeId) || config.bathroomTypes[0];
  const style = config.styles.find(s => s.id === inputs.styleId) || config.styles[0];
  const budget = config.budgetTiers.find(b => b.id === inputs.budgetTierId) || config.budgetTiers[1];

  const items: BathroomPackageItem[] = [];

  // Filter visible products
  const visibleProducts = (allProducts || []).filter(p => {
    if (!p) return false;
    const tag = config.productTags?.[p.id];
    return !tag?.hidden;
  });

  // For each selected fixture, find the best matching product from the catalog
  for (const fixtureId of inputs.selectedFixtures) {
    const fixtureDef = config.fixtures.find(f => f.id === fixtureId);
    if (!fixtureDef) continue;

    // Check if there is an explicit Admin Rule for this fixture
    const rule = (config.rules || []).find(r => {
      if (!r.isActive) return false;
      const roomMatch = !r.roomTypes?.length || r.roomTypes.includes(inputs.bathroomTypeId);
      const styleMatch = !r.styles?.length || r.styles.includes(inputs.styleId);
      const budgetMatch = !r.budgets?.length || r.budgets.includes(inputs.budgetTierId);
      return roomMatch && styleMatch && budgetMatch;
    });

    let matchedProduct: Product | null = null;

    if (rule && rule.assignedProductId) {
      matchedProduct = visibleProducts.find(p => p.id === rule.assignedProductId) || null;
    }

    if (!matchedProduct) {
      // Find candidate products matching keywords
      const keywords = FIXTURE_KEYWORDS[fixtureId] || [fixtureId];
      const candidates = visibleProducts.filter(p => {
        const text = `${p.name || ''} ${p.category || ''} ${p.categoryId || ''} ${p.description || ''} ${(p.features || []).join(' ')} ${p.brand || ''}`.toLowerCase();
        return keywords.some(kw => text.includes(kw.toLowerCase()));
      });

      if (candidates.length > 0) {
        // Score candidates based on budget, style, and tag matches
        let highestScore = -999;
        let bestCandidate = candidates[0];

        for (const candidate of candidates) {
          let score = 10;
          const parsedPrice = parseProductPrice(candidate.price);

          // Budget scoring
          if (budget.id === 'economy') {
            if (parsedPrice > 0 && parsedPrice <= 25000) score += 30;
            else if (parsedPrice > 25000 && parsedPrice <= 45000) score += 15;
          } else if (budget.id === 'standard') {
            if (parsedPrice >= 15000 && parsedPrice <= 65000) score += 30;
          } else if (budget.id === 'luxury') {
            if (parsedPrice >= 40000) score += 30;
          }

          // Style & color scoring
          const candText = `${candidate.name} ${candidate.description} ${(candidate.availableColors || []).join(' ')} ${(candidate.availableFinishes || []).join(' ')}`.toLowerCase();
          if (style.id === 'matte-black' && candText.includes('black')) score += 25;
          if (style.id === 'gold' && (candText.includes('gold') || candText.includes('brass'))) score += 25;
          if (style.id === 'chrome' && (candText.includes('chrome') || candText.includes('silver'))) score += 20;
          if (style.id === 'white' && (candText.includes('white') || candText.includes('porcelain'))) score += 20;

          // Pinned boost
          if (config.productTags?.[candidate.id]?.pinned) score += 40;

          if (score > highestScore) {
            highestScore = score;
            bestCandidate = candidate;
          }
        }

        matchedProduct = bestCandidate;
      } else {
        // Fallback: pick any available product
        matchedProduct = visibleProducts[0] || null;
      }
    }

    if (matchedProduct) {
      let unitPrice = parseProductPrice(matchedProduct.price);
      if (unitPrice === 0) {
        // Estimate a realistic price based on fixture and budget multiplier
        const baseEstimateMap: Record<string, number> = {
          'toilet': 24500,
          'basin': 16500,
          'shower': 18500,
          'muslim_shower': 4800,
          'accessories': 8500,
          'fittings': 6200
        };
        const base = baseEstimateMap[fixtureId] || 10000;
        unitPrice = Math.round(base * budget.multiplier);
      }

      items.push({
        fixtureId,
        fixtureName: fixtureDef.name,
        fixtureUrduName: fixtureDef.urduName,
        product: matchedProduct,
        selectedColor: style.name,
        quantity: 1,
        unitPrice,
        totalPrice: unitPrice,
        isIncluded: true
      });
    }
  }

  const includedItems = items.filter(i => i.isIncluded);
  const totalPackagePrice = includedItems.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    inputs,
    bathroomTypeName: bathroomType.name,
    styleName: style.name,
    budgetTierName: budget.name,
    items,
    totalPackagePrice,
    totalItemsCount: includedItems.length
  };
}

/**
 * Builds clean, friendly WhatsApp message for sharing and ordering package
 */
export function buildPlannerWhatsAppMessage(
  result: EasyBathroomPlannerResult,
  whatsappNumber: string = "923108002863",
  customTemplate?: string
): string {
  const itemsText = result.items
    .filter(item => item.isIncluded)
    .map((item, idx) => `${idx + 1}. *${item.fixtureName}* (${item.product.brand}): ${item.product.name} — ${formatPKR(item.totalPrice)}`)
    .join('\n');

  const template = customTemplate || `*ZAFAR SARWAR TRADERS — BATHROOM PACKAGE INQUIRY*

Assalam-o-Alaikum,
I selected a custom bathroom package on your website:

• *Bathroom Type:* {bathroomType}
• *Style Finish:* {style}
• *Budget Tier:* {budget}
• *Total Fixtures:* {itemsCount} Items

*PACKAGE ITEMS:*
{itemsList}

*ESTIMATED PACKAGE TOTAL:* PKR {totalPrice}

Please share final package price, available discounts & delivery to my location.`;

  const message = template
    .replace('{bathroomType}', result.bathroomTypeName)
    .replace('{style}', result.styleName)
    .replace('{budget}', result.budgetTierName)
    .replace('{itemsCount}', String(result.totalItemsCount))
    .replace('{itemsList}', itemsText)
    .replace('{totalPrice}', Math.round(result.totalPackagePrice).toLocaleString('en-PK'));

  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '');
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
