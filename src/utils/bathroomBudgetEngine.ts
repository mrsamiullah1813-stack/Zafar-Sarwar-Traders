import { Product, BathroomBudgetInputs, BathroomBudgetPackageResult, BathroomBudgetItem } from '../types';
import { parseNumericPrice } from './pricingUtils';

export function parsePriceToNumber(priceStr?: string | number): number {
  return parseNumericPrice(priceStr);
}

export function formatPricePKR(amount: number): string {
  return `PKR ${Math.round(amount).toLocaleString('en-PK')}`;
}

export const BUDGET_TIERS: { id: BathroomBudgetInputs['budgetTierId']; label: string; amount: number; description: string }[] = [
  { id: 'under-50k', label: 'Under Rs. 50,000', amount: 50000, description: 'Economical, essential fixtures for powder rooms, rentals, or budget setups.' },
  { id: '50k-100k', label: 'Rs. 50,000 – 100,000', amount: 100000, description: 'Standard durable setup with branded brass faucets and ceramic commode suite.' },
  { id: '100k-200k', label: 'Rs. 100,000 – 200,000', amount: 200000, description: 'Premium modern bathroom with designer vanity, concealed shower, and rimless toilet.' },
  { id: '200k-350k', label: 'Rs. 200,000 – 350,000', amount: 350000, description: 'Luxury suite with thermostatic rain shower system, Italian marble vanity, and matte black/gold finishes.' },
  { id: '350k-plus', label: 'Rs. 350,000+ (Ultra Luxury)', amount: 500000, description: 'Architectural showroom collection with custom imported fittings and smart bidet systems.' },
  { id: 'custom', label: 'Custom Budget / اپنی مرضی کا بجٹ', amount: 150000, description: 'Enter your exact available budget in PKR.' }
];

export const FIXTURE_CATEGORIES = [
  { id: 'toilets', label: 'Toilet / Commode Suite', urdu: 'کموڈ / ٹوائلٹ سیٹ', categoryMatch: ['toilets', 'commode'], defaultReq: true },
  { id: 'vanities', label: 'Vanity Cabinet / Wash Basin', urdu: 'وینٹی / واش بیسن', categoryMatch: ['vanity-cabinets', 'wash-basins', 'pedestal-basins'], defaultReq: true },
  { id: 'faucets', label: 'Basin Mixer / Faucet', urdu: 'بیسن مکسر / فوسٹ', categoryMatch: ['designer-faucets', 'kitchen-faucets'], defaultReq: true },
  { id: 'showers', label: 'Rain Shower / Shower Set', urdu: 'شاور سسٹم / رین شاور', categoryMatch: ['rain-showers', 'shower-systems'], defaultReq: true },
  { id: 'accessories', label: 'Bathroom Accessories Set', urdu: 'باتھ روم ایکسیسریز (شیشہ، راڈ، ہک)', categoryMatch: ['bathroom-accessories', 'plumbing-accessories'], defaultReq: true },
  { id: 'plumbing', label: 'Pipes & Fittings (CPVC/PPR)', urdu: 'پائپ اور فٹنگز', categoryMatch: ['cpvc-pipes', 'upvc-pipes', 'plumbing-accessories'], defaultReq: false }
];

export function calculateBathroomBudgetPackage(
  inputs: BathroomBudgetInputs,
  allProducts: Product[]
): BathroomBudgetPackageResult {
  const safeProducts = Array.isArray(allProducts) ? allProducts : [];
  
  // 1. Determine Target Budget
  let targetBudget = 100000;
  if (inputs.budgetTierId === 'custom' && inputs.customBudgetAmount && inputs.customBudgetAmount > 0) {
    targetBudget = inputs.customBudgetAmount;
  } else {
    const matchedTier = BUDGET_TIERS.find(t => t.id === inputs.budgetTierId);
    targetBudget = matchedTier ? matchedTier.amount : 100000;
  }

  // 2. Determine budget allocation percentages per category based on chosen style and fixtures
  const selectedFixtureKeys = inputs.requiredFixtureTypes.length > 0
    ? inputs.requiredFixtureTypes
    : ['toilets', 'vanities', 'faucets', 'showers', 'accessories'];

  const items: BathroomBudgetItem[] = [];
  let totalPackagePrice = 0;

  // Approximate weight allocation per fixture
  const weightMap: Record<string, number> = {
    'vanities': 0.35,
    'toilets': 0.25,
    'showers': 0.20,
    'faucets': 0.12,
    'accessories': 0.05,
    'plumbing': 0.03
  };

  let totalWeight = selectedFixtureKeys.reduce((acc, k) => acc + (weightMap[k] || 0.15), 0);
  if (totalWeight === 0) totalWeight = 1;

  for (const fixtureKey of selectedFixtureKeys) {
    const fixtureDef = FIXTURE_CATEGORIES.find(f => f.id === fixtureKey);
    const categoryTitle = fixtureDef ? fixtureDef.label : fixtureKey;
    const categoryMatches = fixtureDef ? fixtureDef.categoryMatch : [fixtureKey];

    const categoryAllocatedBudget = (targetBudget * (weightMap[fixtureKey] || 0.15)) / totalWeight;

    // Filter candidate products
    const candidateProducts = safeProducts.filter(p => {
      if (p.isHidden) return false;
      const catId = (p.categoryId || '').toLowerCase();
      const catName = (p.category || '').toLowerCase();
      return categoryMatches.some(m => catId.includes(m) || catName.includes(m));
    });

    let bestProduct: Product | undefined = undefined;
    let itemPrice = 0;

    if (candidateProducts.length > 0) {
      // Sort candidates by price closeness to categoryAllocatedBudget
      const sorted = [...candidateProducts].sort((a, b) => {
        const priceA = parsePriceToNumber(a.salePrice || a.price);
        const priceB = parsePriceToNumber(b.salePrice || b.price);

        // Filter based on preferred style if relevant
        if (inputs.preferredStyle === 'luxury') {
          return priceB - priceA; // prefer luxury high specs
        } else if (inputs.preferredStyle === 'essential') {
          return priceA - priceB; // prefer economical
        } else {
          // Find closest to allocated budget
          const diffA = Math.abs(priceA - categoryAllocatedBudget);
          const diffB = Math.abs(priceB - categoryAllocatedBudget);
          return diffA - diffB;
        }
      });

      bestProduct = sorted[0];
      itemPrice = parsePriceToNumber(bestProduct.salePrice || bestProduct.price);
    } else {
      bestProduct = undefined;
      itemPrice = 0;
    }

    if (itemPrice > 0) {
      totalPackagePrice += itemPrice;
    }

    items.push({
      categoryKey: fixtureKey,
      categoryTitle,
      product: bestProduct,
      estimatedPrice: itemPrice,
      isRequired: true
    });
  }

  const isWithinBudget = totalPackagePrice <= targetBudget * 1.08; // 8% tolerance
  const differenceAmount = Math.abs(targetBudget - totalPackagePrice);

  let statusMessage = "";
  let urduStatusMessage = "";

  if (isWithinBudget) {
    if (totalPackagePrice <= targetBudget * 0.9) {
      statusMessage = `Great news! This complete ${inputs.preferredStyle} package is well within your budget with a saving of approx. ${formatPricePKR(differenceAmount)}.`;
      urduStatusMessage = `بہترین! یہ مکمل پیکج آپ کے بجٹ کے اندر تیار ہو گیا ہے اور تقریباً ${formatPricePKR(differenceAmount)} کی بچت ہو رہی ہے۔`;
    } else {
      statusMessage = `Balanced Package! This selection matches your target budget closely (${formatPricePKR(totalPackagePrice)} vs budget ${formatPricePKR(targetBudget)}).`;
      urduStatusMessage = `متوازن پیکج! یہ سامان آپ کے منتخب کردہ بجٹ کے عین مطابق تیار ہوا ہے۔`;
    }
  } else {
    statusMessage = `The recommended luxury fixtures slightly exceed your budget by ${formatPricePKR(differenceAmount)}. You can adjust individual items or increase budget.`;
    urduStatusMessage = `تجویز کردہ پیکج کا تخمینہ آپ کے بجٹ سے تقریباً ${formatPricePKR(differenceAmount)} زیادہ بن رہا ہے۔ آپ کچھ آئٹمز تبدیل کر سکتے ہیں۔`;
  }

  return {
    inputs,
    targetBudget,
    totalPackagePrice,
    isWithinBudget,
    differenceAmount,
    statusMessage,
    urduStatusMessage,
    items
  };
}

export function buildBudgetMessageForWhatsApp(result: BathroomBudgetPackageResult, showroomPhone: string = "+92 310 8002863"): string {
  const activeItems = result.items.filter(item => item.product && item.estimatedPrice > 0);

  // 1. Product Information Section
  const productInfoSections: string[] = [];
  activeItems.forEach((item, index) => {
    if (!item.product) return;
    const lines: string[] = [];
    lines.push(`${index + 1}. Product Name: ${item.product.name} (${item.categoryTitle})`);
    if (item.product.brand) {
      lines.push(`- Brand: ${item.product.brand}`);
    }
    if (item.product.category) {
      lines.push(`- Category: ${item.product.category}`);
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
    if (!item.product) return;
    const unitFormatted = item.estimatedPrice > 0 ? `Rs. ${item.estimatedPrice.toLocaleString('en-PK')}` : item.product.price || 'Call for Price';
    tableRows.push(`| ${item.product.name} | Standard | 1 | ${unitFormatted} | ${unitFormatted} |`);
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
    `Hello, Assalam-o-Alaikum Zafar Sarwar Traders,\nI want to order the following products from the Bathroom Budget Finder (${result.inputs.bathroomType.toUpperCase()} - Target: ${formatPricePKR(result.targetBudget)}):`,
    `**Product Information**\n${productInfoSections.join('\n\n')}`,
    `**Pricing Breakdown**\n\n${pricingBreakdownTable}`,
    `**Delivery Details**\n${deliveryLines.join('\n')}`,
    `**Grand Total**\n${grandTotalText}`
  ];

  return messageParts.join('\n\n');
}
