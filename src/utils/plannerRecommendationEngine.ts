import { Product, AiDesignerConfig, AiDesignerSelection, DesignerCategoryType } from '../types';

export interface CategoryRecommendation {
  categoryName: DesignerCategoryType;
  product: Product | null;
  ruleNote?: string;
  matchScore?: number;
  availableColors?: string[];
  selectedColor?: string;
}

export const DESIGNER_CATEGORIES: DesignerCategoryType[] = [
  'Wash Basin',
  'Faucet',
  'Shower',
  'Rain Shower',
  'Toilet',
  'Mirror',
  'Cabinet',
  'Sink',
  'Accessories',
  'Bib Cock',
  'Angle Valve',
  'Floor Drain',
  'Cement'
];

// Keywords for auto-matching products from existing database
const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Wash Basin': ['basin', 'sink', 'vanity', 'pedestal', 'vessel', 'washbasin'],
  'Faucet': ['faucet', 'tap', 'mixer', 'basin mixer', 'spout', 'cascade'],
  'Shower': ['shower', 'hand shower', 'shower column', 'thermostatic', 'massage'],
  'Rain Shower': ['rain shower', 'overhead shower', 'ceiling panel', 'cascade panel', 'rain panel'],
  'Toilet': ['toilet', 'commode', 'wc', 'closet', 'water closet', 'wall-hung', 'rimless'],
  'Mirror': ['mirror', 'led mirror', 'vanity mirror', 'backlit mirror'],
  'Cabinet': ['cabinet', 'vanity cabinet', 'storage', 'bathroom cabinet'],
  'Sink': ['sink', 'kitchen sink', 'double bowl', 'granite sink', 'stainless sink'],
  'Accessories': ['accessory', 'towel', 'holder', 'soap', 'shelf', 'ring', 'rack', 'hook'],
  'Bib Cock': ['bib cock', 'bibcock', 'two way cock', 'wall tap'],
  'Angle Valve': ['angle valve', 'angle cock', 'valve', 'cpvc', 'pipe'],
  'Floor Drain': ['drain', 'floor drain', 'waste', 'grate', 'channel', 'trap', 'gully'],
  'Cement': ['cement', 'opc', 'portland', 'concrete', 'building material']
};

export function generateDesignerRecommendations(
  selection: AiDesignerSelection,
  allProducts: Product[],
  config: AiDesignerConfig
): CategoryRecommendation[] {
  // Filter out hidden products based on config.productTags
  const visibleProducts = allProducts.filter((p) => {
    const tag = config.productTags?.[p.id];
    return !tag?.hidden;
  });

  // Select relevant categories depending on room type
  let activeCategories = [...DESIGNER_CATEGORIES];
  if (selection.roomType === 'Kitchen') {
    activeCategories = ['Sink', 'Faucet', 'Bib Cock', 'Angle Valve', 'Cement'];
  } else if (selection.roomType === 'Powder Room' || selection.roomType === 'Washroom') {
    activeCategories = ['Wash Basin', 'Faucet', 'Toilet', 'Mirror', 'Accessories', 'Bib Cock', 'Angle Valve', 'Floor Drain'];
  }

  const recommendations: CategoryRecommendation[] = [];

  for (const catName of activeCategories) {
    // 1. Check direct Admin Rules for this category
    const matchingRule = (config.rules || []).find((r) => {
      if (!r.isActive || r.categoryName !== catName) return false;

      const roomMatch = !r.roomTypes?.length || r.roomTypes.includes(selection.roomType);
      const styleMatch = !r.styles?.length || r.styles.includes(selection.style);
      const colorMatch = !r.colorThemes?.length || r.colorThemes.includes(selection.colorTheme);
      const budgetMatch = !r.budgets?.length || r.budgets.includes(selection.budget);

      return roomMatch && styleMatch && colorMatch && budgetMatch;
    });

    if (matchingRule && matchingRule.assignedProductId) {
      const assigned = visibleProducts.find((p) => p.id === matchingRule.assignedProductId);
      if (assigned) {
        recommendations.push({
          categoryName: catName,
          product: assigned,
          ruleNote: matchingRule.customNote || `Admin Rule: Custom matched for ${selection.style} style in ${selection.colorTheme} color.`,
          matchScore: 100,
          availableColors: assigned.availableColors || assigned.availableFinishes || [selection.colorTheme],
          selectedColor: (assigned.availableColors || assigned.availableFinishes)?.[0] || selection.colorTheme
        });
        continue;
      }
    }

    // 2. Search candidates by category keywords
    const keywords = (catName && CATEGORY_KEYWORDS[catName]) || [(catName || '').toLowerCase()];
    const candidateProducts = visibleProducts.filter((p) => {
      if (!p) return false;
      const text = `${p.name || ''} ${p.category || ''} ${p.description || ''} ${(p.features || []).join(' ')} ${p.brand || ''}`.toLowerCase();
      return keywords.some((kw) => kw && text.includes(kw));
    });

    if (candidateProducts.length === 0) {
      // If no keyword match found, check pinned products or fallback
      const pinned = visibleProducts.find((p) => config.productTags?.[p.id]?.pinned);
      const fallback = pinned || visibleProducts[0] || null;

      if (fallback) {
        recommendations.push({
          categoryName: catName,
          product: fallback,
          ruleNote: `Curated recommendation for your ${selection.roomType} setup.`,
          matchScore: 60,
          availableColors: fallback.availableColors || fallback.availableFinishes || [selection.colorTheme],
          selectedColor: (fallback.availableColors || fallback.availableFinishes)?.[0] || selection.colorTheme
        });
      }
      continue;
    }

    // 3. Score candidate products
    let bestProduct = candidateProducts[0];
    let highestScore = -1;

    for (const prod of candidateProducts) {
      let score = 10;
      const tag = config.productTags?.[prod.id];

      if (tag) {
        if (tag.pinned) score += 30;
        if (tag.roomTypes?.includes(selection.roomType)) score += 15;
        if (tag.styles?.includes(selection.style)) score += 15;
        if (tag.colorThemes?.includes(selection.colorTheme)) score += 20;
        if (tag.budgets?.includes(selection.budget)) score += 15;
      }

      // Check text matches for color theme & style
      const prodText = `${prod.name} ${prod.description} ${(prod.features || []).join(' ')}`.toLowerCase();
      if (prodText.includes(selection.colorTheme.toLowerCase())) score += 10;
      if (prodText.includes(selection.style.toLowerCase())) score += 10;

      // Finish/Color match
      const finishes = (prod.availableColors || prod.availableFinishes || []).map((c) => c.toLowerCase());
      if (finishes.some((f) => f.includes(selection.colorTheme.toLowerCase()))) score += 15;

      if (score > highestScore) {
        highestScore = score;
        bestProduct = prod;
      }
    }

    if (bestProduct) {
      const colors = bestProduct.availableColors || bestProduct.availableFinishes || [selection.colorTheme];
      const matchedColor = colors.find((c) => c.toLowerCase().includes(selection.colorTheme.toLowerCase())) || colors[0];

      recommendations.push({
        categoryName: catName,
        product: bestProduct,
        ruleNote: `Optimized for ${selection.style} design, ${selection.colorTheme} finish & ${selection.budget} budget.`,
        matchScore: highestScore,
        availableColors: colors,
        selectedColor: matchedColor
      });
    }
  }

  return recommendations;
}

// Backward compatibility helper alias
export const generateBathroomRecommendations = generateDesignerRecommendations;
