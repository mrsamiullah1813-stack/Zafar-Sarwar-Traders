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
        // Only pick an available product from the same category or relevant keywords, do NOT pick random or fabricate
        matchedProduct = null;
      }
    }

    if (matchedProduct) {
      const unitPrice = parseProductPrice(matchedProduct.salePrice || matchedProduct.price);

      items.push({
        fixtureId,
        fixtureName: fixtureDef.name,
        fixtureUrduName: fixtureDef.urduName,
        product: matchedProduct,
        selectedColor: style.name,
        quantity: 1,
        unitPrice: unitPrice > 0 ? unitPrice : 0,
        totalPrice: unitPrice > 0 ? unitPrice : 0,
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
 * Builds clean, friendly WhatsApp message for sharing and ordering bathroom package
 */
export function buildPlannerWhatsAppMessage(
  result: EasyBathroomPlannerResult,
  whatsappNumber: string = "923108002863",
  _customTemplate?: string
): string {
  const activeItems = result.items.filter(item => item.isIncluded && item.product);

  // 1. Product Information Section
  const productInfoSections: string[] = [];
  activeItems.forEach((item, index) => {
    const lines: string[] = [];
    lines.push(`${index + 1}. Product Name: ${item.product.name} (${item.fixtureName})`);
    if (item.product.brand) {
      lines.push(`- Brand: ${item.product.brand}`);
    }
    if (item.product.category) {
      lines.push(`- Category: ${item.product.category}`);
    }
    if (item.selectedColor) {
      lines.push(`- Color / Finish: ${item.selectedColor}`);
    }
    if (item.product.material) {
      lines.push(`- Material: ${item.product.material}`);
    }
    productInfoSections.push(lines.join('\n'));
  });

  // 2. Pricing Breakdown Table
  const tableRows = [
    '| Item Name | Size / Variant | Quantity | Unit Price | Total Price |'
  ];

  activeItems.forEach(item => {
    const unitFormatted = item.unitPrice > 0 ? `Rs. ${item.unitPrice.toLocaleString('en-PK')}` : item.product.price || 'Call for Price';
    const totalFormatted = item.totalPrice > 0 ? `Rs. ${item.totalPrice.toLocaleString('en-PK')}` : unitFormatted;
    tableRows.push(`| ${item.product.name} | ${item.selectedColor || 'Standard'} | ${item.quantity} | ${unitFormatted} | ${totalFormatted} |`);
  });

  const pricingBreakdownTable = tableRows.join('\n');

  // 3. Delivery Details Section
  const deliveryLines = [
    '- Delivery City: To be confirmed on WhatsApp',
    '- Delivery Address: To be confirmed on WhatsApp',
    '- Delivery Status / Delivery Charges: Free / Based on Location'
  ];

  // 4. Grand Total
  const grandTotalText = `Rs. ${Math.round(result.totalPackagePrice).toLocaleString('en-PK')}`;

  const messageParts: string[] = [
    `Hello, Assalam-o-Alaikum Zafar Sarwar Traders,\nI want to order the following products from the Bathroom Planner (${result.bathroomTypeName} - ${result.styleName}):`,
    `**Product Information**\n${productInfoSections.join('\n\n')}`,
    `**Pricing Breakdown**\n\n${pricingBreakdownTable}`,
    `**Delivery Details**\n${deliveryLines.join('\n')}`,
    `**Grand Total**\n${grandTotalText}`
  ];

  const message = messageParts.join('\n\n');
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '') || '923108002863';
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
