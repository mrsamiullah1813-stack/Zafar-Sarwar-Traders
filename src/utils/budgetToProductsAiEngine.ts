import { 
  BudgetProductsAiInputs, 
  BudgetProductsAiResult, 
  BudgetRecommendedItem, 
  Product 
} from '../types';
import { parseNumericPrice } from './pricingUtils';

/**
 * Intelligent deterministic & semantic solver that matches real Supabase inventory
 * to customer's exact budget in PKR and required project categories.
 * CRITICAL: Strictly uses real products and prices from the database. Never invents items.
 */
export function calculateBudgetToProducts(
  inputs: BudgetProductsAiInputs,
  products: Product[] = []
): BudgetProductsAiResult {
  const targetBudget = Math.max(5000, Number(inputs.budgetAmountPkr) || 50000);
  const safeProducts = (Array.isArray(products) ? products : []).filter(p => !p.isHidden);

  // Helper to parse numeric price
  const getNumericPrice = (p: Product): number => {
    return parseNumericPrice(p.price);
  };

  // Group real products by functional category keys
  const categoryMatchers: Record<string, { label: string; filter: (p: Product) => boolean; targetBudgetShare: number }> = {
    toilets: {
      label: 'Commode / One-Piece Toilet',
      filter: (p) => {
        const text = `${p.name} ${p.category} ${p.categoryId}`.toLowerCase();
        return text.includes('toilet') || text.includes('commode') || text.includes('sanitary') || text.includes('water closet') || text.includes('one piece');
      },
      targetBudgetShare: 0.35
    },
    vanities: {
      label: 'Vanity / Basin Set',
      filter: (p) => {
        const text = `${p.name} ${p.category} ${p.categoryId}`.toLowerCase();
        return text.includes('vanity') || text.includes('basin') || text.includes('sink') || text.includes('wash basin') || text.includes('cabinet');
      },
      targetBudgetShare: 0.28
    },
    showers: {
      label: 'Shower Set / Master Mixer',
      filter: (p) => {
        const text = `${p.name} ${p.category} ${p.categoryId}`.toLowerCase();
        return text.includes('shower') || text.includes('mixer') || text.includes('rain') || text.includes('column');
      },
      targetBudgetShare: 0.20
    },
    faucets: {
      label: 'Basin / Bib Cock / Muslim Shower',
      filter: (p) => {
        const text = `${p.name} ${p.category} ${p.categoryId}`.toLowerCase();
        return text.includes('faucet') || text.includes('tap') || text.includes('cock') || text.includes('muslim shower') || text.includes('spout');
      },
      targetBudgetShare: 0.12
    },
    accessories: {
      label: 'Bathroom 6-Piece Accessory Set',
      filter: (p) => {
        const text = `${p.name} ${p.category} ${p.categoryId}`.toLowerCase();
        return text.includes('accessory') || text.includes('set') || text.includes('shelf') || text.includes('holder') || text.includes('towel') || text.includes('mirror');
      },
      targetBudgetShare: 0.08
    },
    plumbing: {
      label: 'Pipes, Valves & Connection Hoses',
      filter: (p) => {
        const text = `${p.name} ${p.category} ${p.categoryId}`.toLowerCase();
        return text.includes('pipe') || text.includes('valve') || text.includes('cpvc') || text.includes('upvc') || text.includes('connection') || text.includes('drain');
      },
      targetBudgetShare: 0.10
    },
    paints: {
      label: 'Wall Paint / Primer / Waterproofing',
      filter: (p) => {
        const text = `${p.name} ${p.category} ${p.categoryId}`.toLowerCase();
        return text.includes('paint') || text.includes('emulsion') || text.includes('primer') || text.includes('putty') || text.includes('coating');
      },
      targetBudgetShare: 0.25
    },
    geysers: {
      label: 'Water Heater / Instant Geyser',
      filter: (p) => {
        const text = `${p.name} ${p.category} ${p.categoryId}`.toLowerCase();
        return text.includes('geyser') || text.includes('heater') || text.includes('electric geyser') || text.includes('instant');
      },
      targetBudgetShare: 0.30
    }
  };

  // Determine active categories to match
  let activeKeys = inputs.selectedPriorities && inputs.selectedPriorities.length > 0 
    ? inputs.selectedPriorities 
    : ['toilets', 'vanities', 'showers', 'faucets', 'accessories'];

  if (inputs.projectType === 'plumbing') {
    activeKeys = ['plumbing', 'faucets', 'showers'];
  } else if (inputs.projectType === 'paint') {
    activeKeys = ['paints'];
  } else if (inputs.projectType === 'complete-house-sanitary') {
    activeKeys = ['toilets', 'vanities', 'showers', 'faucets', 'accessories', 'plumbing', 'geysers'];
  }

  // Pick best fitting real product for each category based on budget and quality
  const recommendations: BudgetRecommendedItem[] = [];
  let currentTotal = 0;

  for (const key of activeKeys) {
    const config = categoryMatchers[key];
    if (!config) continue;

    // Filter available matching products in database
    const matchingProducts = safeProducts.filter(config.filter);
    if (matchingProducts.length === 0) {
      // If no strict match, fallback to general products
      continue;
    }

    // Sort matching products based on customer quality preference
    const targetPriceForCategory = targetBudget * config.targetBudgetShare;

    // Rank products by distance from target price and quality match
    const sorted = [...matchingProducts].sort((a, b) => {
      const priceA = getNumericPrice(a);
      const priceB = getNumericPrice(b);

      if (inputs.preferredQuality === 'budget') {
        return priceA - priceB; // cheapest first
      } else if (inputs.preferredQuality === 'premium') {
        return priceB - priceA; // luxury first
      } else {
        // standard: closest to proportional target price
        return Math.abs(priceA - targetPriceForCategory) - Math.abs(priceB - targetPriceForCategory);
      }
    });

    // Pick top candidate that doesn't blow remaining budget too early
    let selectedProd = sorted[0];
    for (const cand of sorted) {
      const pPrice = getNumericPrice(cand);
      if (pPrice <= (targetBudget - currentTotal) * 1.3 || sorted.indexOf(cand) === sorted.length - 1) {
        selectedProd = cand;
        break;
      }
    }

    const unitPrice = getNumericPrice(selectedProd);
    const quantity = inputs.bathroomCount && inputs.bathroomCount > 1 ? inputs.bathroomCount : 1;
    const itemTotal = unitPrice * quantity;

    recommendations.push({
      categoryKey: key,
      categoryLabel: config.label,
      product: selectedProd,
      quantity,
      unitPrice,
      totalPrice: itemTotal,
      isEssential: true
    });

    currentTotal += itemTotal;
  }

  const remainingBudget = targetBudget - currentTotal;
  const isWithinBudget = currentTotal <= targetBudget * 1.08; // 8% reasonable flexibility buffer

  // Generate intelligent advisory notes
  let aiAdvice = '';
  let urduAdvice = '';

  if (isWithinBudget && remainingBudget >= 0) {
    aiAdvice = `Excellent combination! All ${recommendations.length} curated genuine products fit cleanly within your Rs. ${targetBudget.toLocaleString()} budget with Rs. ${remainingBudget.toLocaleString()} buffer remaining for installation accessories.`;
    urduAdvice = `بہترین انتخاب! تمام ${recommendations.length} اصلی مصنوعات آپ کے روپے ${targetBudget.toLocaleString()} کے بجٹ کے اندر ہیں اور روپے ${remainingBudget.toLocaleString()} کی بچت موجود ہے۔`;
  } else if (isWithinBudget && remainingBudget < 0) {
    aiAdvice = `Package is well-balanced and very close to your budget (exceeds by only Rs. ${Math.abs(remainingBudget).toLocaleString()}). You can customize individual items in the list to reduce costs.`;
    urduAdvice = `پیکج آپ کے بجٹ کے انتہائی قریب ہے اور صرف روپے ${Math.abs(remainingBudget).toLocaleString()} کا معمولی فرق ہے۔`;
  } else {
    aiAdvice = `Package total is Rs. ${currentTotal.toLocaleString()}, which exceeds the target budget. Consider switching high-tier items to Economy lines or reducing fixture counts.`;
    urduAdvice = `پیکج کی کل لاگت روپے ${currentTotal.toLocaleString()} بنتی ہے۔ آپ پریمیم اشیاء کی جگہ اسٹینڈرڈ ماڈلز منتخب کر سکتے ہیں۔`;
  }

  return {
    inputs,
    targetBudgetPkr: targetBudget,
    totalEstimatedPkr: currentTotal,
    remainingBudgetPkr: remainingBudget,
    isWithinBudget,
    recommendations,
    aiAdvice,
    urduAdvice
  };
}

export function buildBudgetAiWhatsAppMessage(result: BudgetProductsAiResult): string {
  const lines: string[] = [];
  lines.push(`*ZAFAR SARWAR TRADERS — BUDGET-TO-PRODUCTS SHOPPING LIST*`);
  lines.push(`----------------------------------------`);
  lines.push(`*Target Budget:* Rs. ${result.targetBudgetPkr.toLocaleString()} PKR`);
  lines.push(`*Estimated Total:* Rs. ${result.totalEstimatedPkr.toLocaleString()} PKR`);
  lines.push(`*Remaining Balance:* Rs. ${result.remainingBudgetPkr.toLocaleString()} PKR`);
  lines.push(`*Status:* ${result.isWithinBudget ? '✅ Within Budget' : '⚠️ Exceeds Budget'}`);
  lines.push(`----------------------------------------`);
  lines.push(`*Curated Products List:*`);
  result.recommendations.forEach((item, idx) => {
    lines.push(`${idx + 1}. *${item.product.name}*`);
    lines.push(`   • Category: ${item.categoryLabel}`);
    lines.push(`   • Price: Rs. ${item.unitPrice.toLocaleString()} ${item.quantity > 1 ? `× ${item.quantity} = Rs. ${item.totalPrice.toLocaleString()}` : ''}`);
  });
  lines.push(`----------------------------------------`);
  lines.push(`_AI Advice: ${result.aiAdvice}_`);
  lines.push(`Please confirm stock availability and arrange showroom delivery.`);
  return lines.join('\n');
}
