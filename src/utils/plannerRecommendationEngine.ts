import { Product, AiDesignerConfig, AiDesignerSelection, DesignerCategoryType } from '../types';
import { parseNumericPrice } from './pricingUtils';

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

interface CategoryMatchRule {
  primaryCategoryIds: string[];
  positiveKeywords: string[];
  negativeExclusions: string[];
  fallbackCategoryNames: string[];
}

const CATEGORY_MATCH_RULES: Record<string, CategoryMatchRule> = {
  'Wash Basin': {
    primaryCategoryIds: ['wash-basins', 'vanity-cabinets'],
    positiveKeywords: ['wash basin', 'basin', 'vanity', 'vessel basin', 'countertop basin', 'pedestal basin', 'undermount sink', 'undermount basin', 'ceramic vessel'],
    negativeExclusions: ['rain shower', 'shower system', 'floor drain', 'cement', 'pipe', 'paint', 'water tank'],
    fallbackCategoryNames: ['Wash Basins', 'Vanity Cabinets']
  },
  'Faucet': {
    primaryCategoryIds: ['designer-faucets', 'kitchen-faucets'],
    positiveKeywords: ['faucet', 'basin mixer', 'mixer tap', 'tall faucet', 'sensor tap', 'waterfall faucet', 'single lever faucet', 'spout'],
    negativeExclusions: ['rain shower panel', 'commode', 'toilet', 'cement', 'pipe'],
    fallbackCategoryNames: ['Designer Faucets', 'Kitchen Faucets']
  },
  'Shower': {
    primaryCategoryIds: ['shower-systems', 'rain-showers'],
    positiveKeywords: ['shower', 'hand shower', 'shower set', 'telephone shower', 'shower column', 'sliding rail shower', 'wall shower mixer'],
    negativeExclusions: ['wash basin only', 'commode', 'toilet', 'cement', 'pipe', 'paint'],
    fallbackCategoryNames: ['Shower Systems', 'Rain Showers']
  },
  'Rain Shower': {
    primaryCategoryIds: ['rain-showers', 'shower-systems'],
    positiveKeywords: ['rain shower', 'raindance', 'ceiling rain panel', 'overhead shower', 'cascade panel', 'cascade shower', 'rain panel', 'thermostatic shower'],
    negativeExclusions: ['wash basin only', 'commode', 'toilet', 'cement', 'pipe', 'paint'],
    fallbackCategoryNames: ['Rain Showers', 'Shower Systems']
  },
  'Toilet': {
    primaryCategoryIds: ['toilets', 'commode', 'luxury-bathroom-sets'],
    positiveKeywords: ['toilet', 'commode', 'wc', 'water closet', 'one piece', 'one-piece', 'wall-hung', 'wall hung', 'rimless', 'coupled toilet'],
    negativeExclusions: ['faucet', 'mixer', 'shower', 'angle valve', 'floor drain', 'paint', 'cement', 'sink only'],
    fallbackCategoryNames: ['Toilets', 'Commode']
  },
  'Mirror': {
    primaryCategoryIds: ['bathroom-mirrors', 'bathroom-accessories'],
    positiveKeywords: ['mirror', 'led mirror', 'vanity mirror', 'backlit mirror', 'touch mirror', 'anti fog mirror', 'defogger mirror', 'beveled mirror'],
    negativeExclusions: ['commode', 'toilet', 'shower', 'faucet', 'pipe', 'cement'],
    fallbackCategoryNames: ['Bathroom Mirrors', 'Bathroom Accessories']
  },
  'Cabinet': {
    primaryCategoryIds: ['vanity-cabinets', 'wash-basins'],
    positiveKeywords: ['vanity cabinet', 'cabinet', 'bathroom cabinet', 'storage console', 'marine plywood vanity', 'wall mounted cabinet', 'mirror cabinet'],
    negativeExclusions: ['rain shower', 'floor drain', 'cement', 'pipe', 'paint'],
    fallbackCategoryNames: ['Vanity Cabinets']
  },
  'Sink': {
    primaryCategoryIds: ['wash-basins', 'kitchen-faucets'],
    positiveKeywords: ['sink', 'kitchen sink', 'granite sink', 'stainless sink', 'double bowl sink', 'handmade sink', 'vessel sink'],
    negativeExclusions: ['rain shower', 'commode', 'cement', 'pipe', 'paint'],
    fallbackCategoryNames: ['Wash Basins']
  },
  'Accessories': {
    primaryCategoryIds: ['bathroom-accessories'],
    positiveKeywords: ['accessory', 'accessories', 'towel rail', 'towel rod', 'soap dispenser', 'soap dish', 'robe hook', 'shelf', 'paper holder', 'tumbler holder', '6-pc set'],
    negativeExclusions: ['commode', 'toilet', 'shower system', 'cement', 'pipe'],
    fallbackCategoryNames: ['Bathroom Accessories']
  },
  'Bib Cock': {
    primaryCategoryIds: ['bathroom-accessories', 'plumbing-accessories', 'designer-faucets'],
    positiveKeywords: ['bib cock', 'bibcock', 'two way cock', '2 way bib cock', 'wall tap', 'muslim shower tap'],
    negativeExclusions: ['rain shower panel', 'vanity cabinet', 'cement', 'paint', 'water tank'],
    fallbackCategoryNames: ['Bathroom Accessories', 'Plumbing Accessories']
  },
  'Angle Valve': {
    primaryCategoryIds: ['plumbing-accessories', 'cpvc-pipes', 'upvc-pipes', 'pvc-pipes'],
    positiveKeywords: ['angle valve', 'angle cock', 'stop cock', 'ball valve', 'connection valve', 'brass angle valve'],
    negativeExclusions: ['commode', 'wash basin', 'vanity cabinet', 'paint', 'rain shower panel'],
    fallbackCategoryNames: ['Plumbing Accessories']
  },
  'Floor Drain': {
    primaryCategoryIds: ['plumbing-accessories', 'pvc-pipes'],
    positiveKeywords: ['floor drain', 'drain', 'anti cockroach drain', 'jali', 'drain trap', 'waste pipe', 'bottle trap', 'grate'],
    negativeExclusions: ['commode', 'wash basin', 'vanity cabinet', 'paint'],
    fallbackCategoryNames: ['Plumbing Accessories']
  },
  'Cement': {
    primaryCategoryIds: ['cement', 'construction-materials'],
    positiveKeywords: ['cement', 'opc', 'src cement', 'portland cement', '53 grade', 'maple leaf', 'bestway', 'fauji cement'],
    negativeExclusions: ['faucet', 'shower', 'basin', 'commode', 'mirror'],
    fallbackCategoryNames: ['Cement', 'Construction Materials']
  }
};

export function generateDesignerRecommendations(
  selection: AiDesignerSelection,
  allProducts: Product[],
  config: AiDesignerConfig
): CategoryRecommendation[] {
  // Filter visible, valid products from real store database
  const safeProducts = (Array.isArray(allProducts) ? allProducts : []).filter((p) => {
    if (!p || !p.id || !p.name) return false;
    if (p.isHidden) return false;
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
  const usedProductIds = new Set<string>();

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
      const assigned = safeProducts.find((p) => p.id === matchingRule.assignedProductId);
      if (assigned) {
        usedProductIds.add(assigned.id);
        recommendations.push({
          categoryName: catName,
          product: assigned,
          ruleNote: matchingRule.customNote || `Admin Rule: Matched for ${selection.style} style in ${selection.colorTheme} finish.`,
          matchScore: 100,
          availableColors: assigned.availableColors || assigned.availableFinishes || [selection.colorTheme],
          selectedColor: (assigned.availableColors || assigned.availableFinishes)?.[0] || selection.colorTheme
        });
        continue;
      }
    }

    // 2. Strict Category and Keyword Matching
    const matchRule = CATEGORY_MATCH_RULES[catName] || {
      primaryCategoryIds: [(catName || '').toLowerCase().replace(/\s+/g, '-')],
      positiveKeywords: [(catName || '').toLowerCase()],
      negativeExclusions: ['cement', 'paint'],
      fallbackCategoryNames: [catName]
    };

    const scoredCandidates: { product: Product; score: number }[] = [];

    for (const prod of safeProducts) {
      const prodName = (prod.name || '').toLowerCase();
      const prodDesc = (prod.description || '').toLowerCase();
      const prodCatId = (prod.categoryId || '').toLowerCase();
      const prodCatName = (prod.category || '').toLowerCase();
      const featuresText = (prod.features || []).join(' ').toLowerCase();

      // Negative check
      let isExcluded = false;
      for (const neg of matchRule.negativeExclusions) {
        if (prodName.includes(neg) || prodCatId === neg) {
          const hasExplicitPositive = matchRule.positiveKeywords.some(pos => prodName.includes(pos));
          if (!hasExplicitPositive) {
            isExcluded = true;
            break;
          }
        }
      }
      if (isExcluded) continue;

      let score = 0;

      // Primary Category ID match
      if (matchRule.primaryCategoryIds.includes(prodCatId)) {
        score += 100;
      } else if (matchRule.primaryCategoryIds.some(cid => prodCatId.includes(cid))) {
        score += 80;
      }

      // Fallback Category Name match
      if (matchRule.fallbackCategoryNames.some(fcn => prodCatName.toLowerCase().includes(fcn.toLowerCase()))) {
        score += 60;
      }

      // Positive keyword in name
      let nameMatched = false;
      for (const posKw of matchRule.positiveKeywords) {
        if (prodName.includes(posKw)) {
          score += 70;
          nameMatched = true;
          break;
        }
      }

      // Positive keyword in description
      if (!nameMatched) {
        for (const posKw of matchRule.positiveKeywords) {
          if (prodDesc.includes(posKw) || featuresText.includes(posKw)) {
            score += 35;
            break;
          }
        }
      }

      if (score < 30) continue; // Not a valid category match

      // Tag boosts
      const tag = config.productTags?.[prod.id];
      if (tag) {
        if (tag.pinned) score += 30;
        if (tag.roomTypes?.includes(selection.roomType)) score += 15;
        if (tag.styles?.includes(selection.style)) score += 15;
        if (tag.colorThemes?.includes(selection.colorTheme)) score += 20;
        if (tag.budgets?.includes(selection.budget)) score += 15;
      }

      // Finish / Color Theme affinity
      const finishes = [
        ...(prod.availableColors || []),
        ...(prod.availableFinishes || []),
        prod.specs?.['Finish'] || '',
        prodName,
        prodDesc
      ].join(' ').toLowerCase();

      if (selection.colorTheme && finishes.includes(selection.colorTheme.toLowerCase())) {
        score += 25;
      }

      // Budget Affinity
      const price = parseNumericPrice(prod.salePrice || prod.price);
      if (selection.budget === 'Economy' || selection.budget === 'economy') {
        if (price > 0 && price <= 25000) score += 25;
      } else if (selection.budget === 'Standard' || selection.budget === 'standard') {
        if (price >= 15000 && price <= 75000) score += 25;
      } else if (selection.budget === 'Luxury' || selection.budget === 'luxury') {
        if (price >= 40000) score += 30;
      }

      const finalScore = usedProductIds.has(prod.id) ? score - 40 : score;
      scoredCandidates.push({ product: prod, score: finalScore });
    }

    scoredCandidates.sort((a, b) => b.score - a.score);

    if (scoredCandidates.length > 0) {
      const best = scoredCandidates[0].product;
      usedProductIds.add(best.id);

      const colors = best.availableColors || best.availableFinishes || [selection.colorTheme];
      const matchedColor = colors.find((c) => c.toLowerCase().includes(selection.colorTheme.toLowerCase())) || colors[0];

      recommendations.push({
        categoryName: catName,
        product: best,
        ruleNote: `Matched authentic inventory for ${selection.style} (${matchedColor} finish).`,
        matchScore: scoredCandidates[0].score,
        availableColors: colors,
        selectedColor: matchedColor
      });
    } else {
      // If genuine inventory does not have this category, DO NOT return an unrelated mismatched product!
      // Only check if there is an exact category fallback in real products
      const categoryFallback = safeProducts.find(p => {
        if (usedProductIds.has(p.id)) return false;
        const catId = (p.categoryId || '').toLowerCase();
        return matchRule.primaryCategoryIds.includes(catId);
      });

      if (categoryFallback) {
        usedProductIds.add(categoryFallback.id);
        const colors = categoryFallback.availableColors || categoryFallback.availableFinishes || [selection.colorTheme];
        recommendations.push({
          categoryName: catName,
          product: categoryFallback,
          ruleNote: `Curated authentic product from ${categoryFallback.category || catName} category.`,
          matchScore: 60,
          availableColors: colors,
          selectedColor: colors[0]
        });
      }
    }
  }

  return recommendations;
}

// Backward compatibility helper alias
export const generateBathroomRecommendations = generateDesignerRecommendations;
