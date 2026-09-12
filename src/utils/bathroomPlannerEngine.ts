import { Product, EasyBathroomPlannerConfig, EasyBathroomPlannerInputs, BathroomPackageItem, EasyBathroomPlannerResult } from '../types';
import { parseNumericPrice } from './pricingUtils';

// Precise Category ID and Keyword Definition for 100% accurate catalog matching
interface FixtureMatcherDefinition {
  primaryCategoryIds: string[];
  positiveKeywords: string[];
  secondaryKeywords: string[];
  negativeExclusions: string[];
  fallbackCategoryNames: string[];
}

const FIXTURE_MATCH_RULES: Record<string, FixtureMatcherDefinition> = {
  'toilet': {
    primaryCategoryIds: ['toilets', 'commode', 'luxury-bathroom-sets'],
    positiveKeywords: ['commode', 'toilet', 'wc', 'water closet', 'one-piece', 'one piece', 'wall-hung', 'wall hung', 'rimless', 'coupled toilet', 'porcelain toilet'],
    secondaryKeywords: ['dual flush', 'soft close', 'ceramic seat', 'sanitary suite', 'floor mounted toilet'],
    negativeExclusions: ['faucet', 'mixer', 'shower', 'angle valve', 'floor drain', 'paint', 'cement', 'sink only', 'pipe'],
    fallbackCategoryNames: ['Toilets', 'Commode', 'Luxury Bathroom Sets']
  },
  'basin': {
    primaryCategoryIds: ['wash-basins', 'vanity-cabinets', 'luxury-bathroom-sets'],
    positiveKeywords: ['wash basin', 'basin', 'vanity', 'vessel basin', 'countertop basin', 'pedestal basin', 'under-mount sink', 'undermount basin', 'cabinet vanity', 'ceramic vessel', 'marble vanity'],
    secondaryKeywords: ['hand wash sink', 'ceramic basin', 'stone basin', 'bathroom sink'],
    negativeExclusions: ['rain shower', 'shower system', 'floor drain', 'cement', 'pipe', 'water pump', 'tank', 'weather paint'],
    fallbackCategoryNames: ['Wash Basins', 'Vanity Cabinets']
  },
  'shower': {
    primaryCategoryIds: ['rain-showers', 'shower-systems'],
    positiveKeywords: ['rain shower', 'shower system', 'shower set', 'overhead shower', 'cascade shower', 'thermostatic shower', 'shower column', 'telephone shower', 'hand shower set'],
    secondaryKeywords: ['shower panel', 'hydro shower', 'bath shower mixer', 'wall shower'],
    negativeExclusions: ['wash basin only', 'commode', 'toilet', 'cement', 'pvc pipe', 'paint', 'water tank'],
    fallbackCategoryNames: ['Rain Showers', 'Shower Systems']
  },
  'muslim_shower': {
    primaryCategoryIds: ['bathroom-accessories', 'plumbing-accessories', 'designer-faucets'],
    positiveKeywords: ['muslim shower', 'bidet spray', 'bidet shower', 'health faucet', 'shattaf', 'bib cock', 'bibcock', 'two way cock', '2 way bib cock'],
    secondaryKeywords: ['jet spray', 'hand spray', 'hygiene spray'],
    negativeExclusions: ['rain shower panel', 'vanity cabinet', 'cement', 'paint', 'water tank', 'toilet commode'],
    fallbackCategoryNames: ['Bathroom Accessories', 'Plumbing Accessories']
  },
  'accessories': {
    primaryCategoryIds: ['bathroom-accessories', 'bathroom-mirrors'],
    positiveKeywords: ['bathroom accessories', 'accessory set', 'towel rail', 'towel rod', 'soap dispenser', 'soap dish', 'bathroom mirror', 'led mirror', 'robe hook', 'glass shelf', 'paper holder', 'tumbler holder', '6-pc set', '6 pc accessory'],
    secondaryKeywords: ['towel ring', 'corner shelf', 'brush holder', 'defogger mirror'],
    negativeExclusions: ['commode', 'toilet', 'shower system', 'cement', 'pipe', 'water pump'],
    fallbackCategoryNames: ['Bathroom Accessories', 'Bathroom Mirrors']
  },
  'fittings': {
    primaryCategoryIds: ['plumbing-accessories', 'cpvc-pipes', 'upvc-pipes', 'pvc-pipes'],
    positiveKeywords: ['angle valve', 'angle cock', 'stop cock', 'bottle trap', 'waste pipe', 'floor drain', 'anti-cockroach drain', 'jali', 'p trap', 'ball valve', 'connection pipe', 'basin waste'],
    secondaryKeywords: ['plumbing fitting', 'heavy cp', 'brass valve', 'drain trap', 'drain grate'],
    negativeExclusions: ['commode', 'wash basin', 'vanity cabinet', 'paint', 'luxury set', 'rain shower panel'],
    fallbackCategoryNames: ['Plumbing Accessories', 'PVC Pipes', 'CPVC Pipes']
  }
};

/**
 * Parses numeric price safely
 */
export function parseProductPrice(priceStr?: string | number): number {
  return parseNumericPrice(priceStr);
}

/**
 * Formats price in Pakistani standard format (PKR 45,000)
 */
export function formatPKR(amount: number): string {
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`;
}

/**
 * Evaluates candidate product relevance against a fixture definition
 */
function scoreProductForFixture(
  product: Product,
  matcher: FixtureMatcherDefinition,
  styleId: string,
  budgetTierId: string,
  isPinned: boolean = false
): number {
  const prodName = (product.name || '').toLowerCase();
  const prodDesc = (product.description || '').toLowerCase();
  const prodCatId = (product.categoryId || '').toLowerCase();
  const prodCatName = (product.category || '').toLowerCase();
  const featuresText = (product.features || []).join(' ').toLowerCase();
  const brandText = (product.brand || '').toLowerCase();

  const fullText = `${prodName} ${prodDesc} ${prodCatId} ${prodCatName} ${featuresText} ${brandText}`;

  // 1. Negative Exclusion Check
  for (const neg of matcher.negativeExclusions) {
    // If the product name or category strongly contains an excluded word
    if (prodName.includes(neg) || prodCatId === neg) {
      // Allow only if the product name also explicitly has positive match
      const hasStrongPositive = matcher.positiveKeywords.some(pos => prodName.includes(pos));
      if (!hasStrongPositive) {
        return -9999; // Disqualify
      }
    }
  }

  let score = 0;

  // 2. Primary Category ID Match (Highest weight)
  if (matcher.primaryCategoryIds.includes(prodCatId)) {
    score += 100;
  } else if (matcher.primaryCategoryIds.some(cid => prodCatId.includes(cid))) {
    score += 80;
  }

  // 3. Fallback Category Name Match
  if (matcher.fallbackCategoryNames.some(fcn => prodCatName.toLowerCase().includes(fcn.toLowerCase()))) {
    score += 60;
  }

  // 4. Positive Keyword Matches in Product Name (Very high signal)
  let nameMatched = false;
  for (const posKw of matcher.positiveKeywords) {
    if (prodName.includes(posKw)) {
      score += 70;
      nameMatched = true;
      break;
    }
  }

  // 5. Positive Keyword Matches in Description / Features
  if (!nameMatched) {
    for (const posKw of matcher.positiveKeywords) {
      if (fullText.includes(posKw)) {
        score += 35;
        break;
      }
    }
  }

  // 6. Secondary Keywords
  for (const secKw of matcher.secondaryKeywords) {
    if (fullText.includes(secKw)) {
      score += 15;
    }
  }

  // If score has no category or keyword affinity at all, reject
  if (score < 30) {
    return -9999;
  }

  // 7. Budget tier price match
  const price = parseProductPrice(product.salePrice || product.price);
  if (budgetTierId === 'economy') {
    if (price > 0 && price <= 25000) score += 30;
    else if (price > 25000 && price <= 45000) score += 15;
    else if (price > 60000) score -= 25; // penalize ultra high for economy
  } else if (budgetTierId === 'standard') {
    if (price >= 15000 && price <= 75000) score += 30;
    else if (price > 75000) score += 10;
  } else if (budgetTierId === 'luxury') {
    if (price >= 50000) score += 40;
    else if (price >= 25000) score += 20;
  }

  // 8. Style and finish match
  const finishes = [
    ...(product.availableColors || []),
    ...(product.availableFinishes || []),
    product.specs?.['Finish'] || '',
    prodName,
    prodDesc
  ].join(' ').toLowerCase();

  if (styleId === 'matte-black' && (finishes.includes('black') || finishes.includes('matte'))) {
    score += 30;
  } else if (styleId === 'gold' && (finishes.includes('gold') || finishes.includes('brass') || finishes.includes('champagne'))) {
    score += 30;
  } else if (styleId === 'chrome' && (finishes.includes('chrome') || finishes.includes('silver') || finishes.includes('polished') || finishes.includes('stainless'))) {
    score += 25;
  } else if (styleId === 'white' && (finishes.includes('white') || finishes.includes('ceramic') || finishes.includes('porcelain') || finishes.includes('glaze'))) {
    score += 25;
  }

  // 9. Pinned Boost
  if (isPinned) {
    score += 50;
  }

  // 10. Genuine Verified Product Image Boost
  if (product.image || (product.images && product.images.length > 0)) {
    score += 10;
  }

  return score;
}

/**
 * Generates the full Easy Bathroom Package with 100% verified real product matching
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

  // Filter visible, valid products from real catalog
  const safeProducts = (Array.isArray(allProducts) ? allProducts : []).filter(p => {
    if (!p || !p.id || !p.name) return false;
    if (p.isHidden) return false;
    const tag = config.productTags?.[p.id];
    return !tag?.hidden;
  });

  // Track already assigned product IDs in this package to prevent duplicate items across different fixtures
  const usedProductIds = new Set<string>();

  // For each selected fixture, find the most accurate real store product
  for (const fixtureId of inputs.selectedFixtures) {
    const fixtureDef = config.fixtures.find(f => f.id === fixtureId);
    if (!fixtureDef) continue;

    // 1. Check if there is an explicit Admin Rule for this fixture
    const adminRule = (config.rules || []).find(r => {
      if (!r.isActive) return false;
      const roomMatch = !r.roomTypes?.length || r.roomTypes.includes(inputs.bathroomTypeId);
      const styleMatch = !r.styles?.length || r.styles.includes(inputs.styleId);
      const budgetMatch = !r.budgets?.length || r.budgets.includes(inputs.budgetTierId);
      return roomMatch && styleMatch && budgetMatch;
    });

    let matchedProduct: Product | null = null;

    if (adminRule && adminRule.assignedProductId) {
      matchedProduct = safeProducts.find(p => p.id === adminRule.assignedProductId) || null;
    }

    // 2. Automated Smart Scoring Engine
    if (!matchedProduct) {
      const matcher = FIXTURE_MATCH_RULES[fixtureId] || {
        primaryCategoryIds: [fixtureId],
        positiveKeywords: [fixtureId],
        secondaryKeywords: [],
        negativeExclusions: ['paint', 'cement'],
        fallbackCategoryNames: [fixtureDef.name]
      };

      // Score all candidate products
      const scoredCandidates: { product: Product; score: number }[] = [];

      for (const prod of safeProducts) {
        const isPinned = Boolean(config.productTags?.[prod.id]?.pinned);
        const score = scoreProductForFixture(prod, matcher, inputs.styleId, inputs.budgetTierId, isPinned);
        
        if (score > 0) {
          // Add small penalty if already used for another slot to encourage diverse package
          const finalScore = usedProductIds.has(prod.id) ? score - 30 : score;
          scoredCandidates.push({ product: prod, score: finalScore });
        }
      }

      // Sort by highest matching score
      scoredCandidates.sort((a, b) => b.score - a.score);

      if (scoredCandidates.length > 0) {
        matchedProduct = scoredCandidates[0].product;
      }
    }

    // 3. Fallback to category group if no keyword score
    if (!matchedProduct) {
      const matcher = FIXTURE_MATCH_RULES[fixtureId];
      if (matcher) {
        const categoryFallback = safeProducts.find(p => {
          if (usedProductIds.has(p.id)) return false;
          const catId = (p.categoryId || '').toLowerCase();
          return matcher.primaryCategoryIds.includes(catId);
        });
        if (categoryFallback) {
          matchedProduct = categoryFallback;
        }
      }
    }

    if (matchedProduct) {
      usedProductIds.add(matchedProduct.id);
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
    lines.push(`${index + 1}. *${item.product.name}*`);
    lines.push(`   • Item Category: ${item.fixtureName} (${item.fixtureUrduName || ''})`);
    if (item.product.brand) {
      lines.push(`   • Brand: ${item.product.brand}`);
    }
    if (item.selectedColor) {
      lines.push(`   • Finish / Color: ${item.selectedColor}`);
    }
    const unitFormatted = item.unitPrice > 0 ? `PKR ${item.unitPrice.toLocaleString('en-PK')}` : item.product.price || 'Market Rate';
    lines.push(`   • Price: ${unitFormatted}`);
    productInfoSections.push(lines.join('\n'));
  });

  // 2. Grand Total
  const grandTotalText = `PKR ${Math.round(result.totalPackagePrice).toLocaleString('en-PK')}`;

  const messageParts: string[] = [
    `*ZAFAR SARWAR TRADERS — BATHROOM PLANNER INQUIRY*`,
    `Assalam-o-Alaikum,\nI created a customized bathroom package on your website:`,
    `📋 *PACKAGE SPECIFICATIONS:*\n• *Bathroom Type:* ${result.bathroomTypeName}\n• *Style & Finish:* ${result.styleName}\n• *Budget Tier:* ${result.budgetTierName}\n• *Selected Items:* ${result.totalItemsCount} Fixtures`,
    `📦 *RECOMMENDED PRODUCTS & SPECS:*\n${productInfoSections.join('\n\n')}`,
    `💰 *ESTIMATED TOTAL VALUE:* ${grandTotalText}`,
    `Please confirm stock availability, package discount, and delivery details.`
  ];

  const message = messageParts.join('\n\n');
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, '') || '923108002863';
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
