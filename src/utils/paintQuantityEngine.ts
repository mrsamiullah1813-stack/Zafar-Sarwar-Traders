import { 
  PaintEstimatorInputs, 
  PaintEstimatorResult, 
  Product, 
  SmartToolsSettings 
} from '../types';
import { defaultSmartToolsSettings } from '../data/defaultSmartToolsConfig';

/**
 * Deterministic calculation engine for interior and exterior paint requirements in Pakistan.
 * Computes net paintable surface area and required Litres, Gallons, and Drums.
 */
export function calculatePaintEstimate(
  inputs: PaintEstimatorInputs,
  products: Product[] = [],
  settings: SmartToolsSettings = defaultSmartToolsSettings
): PaintEstimatorResult {
  const safeSettings = settings || defaultSmartToolsSettings;
  const paintRates = safeSettings.paintSettings || defaultSmartToolsSettings.paintSettings!;

  const length = Math.max(1, Number(inputs.roomLengthFeet) || 12);
  const width = Math.max(1, Number(inputs.roomWidthFeet) || 10);
  const height = Math.max(1, Number(inputs.wallHeightFeet) || 10);

  // 1. Perimeter Walls Area = 2 * (L + W) * H
  const wallsAreaSqFt = 2 * (length + width) * height;

  // 2. Ceiling Area (if selected)
  const ceilingAreaSqFt = inputs.includeCeiling ? (length * width) : 0;

  // 3. Openings Deduction (Doors & Windows)
  const doorSqFt = paintRates.defaultDoorAreaSqFt || 21;
  const winSqFt = paintRates.defaultWindowAreaSqFt || 15;
  const openingsDeductionSqFt = (Math.max(0, inputs.doorsCount || 0) * doorSqFt) + 
                               (Math.max(0, inputs.windowsCount || 0) * winSqFt);

  // Net Area for a single coat
  const netPaintableAreaSqFt = Math.max(20, (wallsAreaSqFt + ceilingAreaSqFt) - openingsDeductionSqFt);

  // 4. Number of coats multiplier
  const coats = Math.max(1, Math.min(4, Number(inputs.numberOfCoats) || 2));
  const totalCoatsAreaSqFt = netPaintableAreaSqFt * coats;

  // 5. Surface absorption adjustment
  let coveragePerLitre = paintRates.sqFtPerLitrePerCoat || 130;
  if (inputs.surfaceType === 'rough-plaster') {
    coveragePerLitre = 100; // rougher surface absorbs more paint
  } else if (inputs.surfaceType === 'repaint') {
    coveragePerLitre = 145; // previously painted smooth surface
  } else if (inputs.surfaceType === 'drywall') {
    coveragePerLitre = 120;
  }

  const rawLitres = totalCoatsAreaSqFt / coveragePerLitre;
  const wastageBuffer = 1 + ((paintRates.defaultWastagePercent || 5) / 100);

  const recommendedLitres = Math.round(rawLitres * wastageBuffer * 10) / 10;
  const estimatedLitresMin = Math.max(1, Math.round(recommendedLitres * 0.9));
  const estimatedLitresMax = Math.max(1, Math.round(recommendedLitres * 1.15));

  // Pakistani packaging: ~3.785 / 4.0 Litre Gallon, 14–16 Litre Drum
  const approxGallons = Math.round((recommendedLitres / 3.785) * 10) / 10;
  const approxDrums = Math.round((recommendedLitres / 15) * 10) / 10;

  // 6. Match Real Paint / Painting Products from Supabase Store
  const matchedPaintProducts = (Array.isArray(products) ? products : []).filter(p => {
    if (!p || p.isHidden) return false;
    const catId = (p.categoryId || '').toLowerCase();
    const catName = (p.category || '').toLowerCase();
    const pName = (p.name || '').toLowerCase();

    return (
      catId.includes('paint') ||
      catName.includes('paint') ||
      catId.includes('coat') ||
      pName.includes('paint') ||
      pName.includes('emulsion') ||
      pName.includes('enamel') ||
      pName.includes('primer') ||
      pName.includes('putty') ||
      pName.includes('roller') ||
      pName.includes('brush') ||
      pName.includes('weather')
    );
  }).slice(0, 6);

  const summaryText = `For a ${length}' × ${width}' room (${height}' height, ${coats} coats${inputs.includeCeiling ? ' + ceiling' : ''}), net paintable surface area is ${Math.round(netPaintableAreaSqFt)} sq ft (${Math.round(totalCoatsAreaSqFt)} sq ft coat coverage). Estimated paint required: ~${recommendedLitres} Litres (~${approxGallons} Gallons / ${approxDrums} Drum).`;

  const urduSummaryText = `${length} × ${width} فٹ کمرے (${height} فٹ اونچائی، ${coats} کوٹس) کے لیے خالص پینٹ ایریا ${Math.round(netPaintableAreaSqFt)} مربع فٹ ہے، جس کے لیے تقریباً ${recommendedLitres} لیٹر (~${approxGallons} گیلن) پینٹ درکار ہوگا۔`;

  const disclaimer = `Approximate estimate only. Actual coverage depends on paint brand, surface porosity, primer application, number of coats, and tool efficiency.`;

  return {
    inputs,
    wallsAreaSqFt: Math.round(wallsAreaSqFt),
    ceilingAreaSqFt: Math.round(ceilingAreaSqFt),
    openingsDeductionSqFt: Math.round(openingsDeductionSqFt),
    netPaintableAreaSqFt: Math.round(netPaintableAreaSqFt),
    totalCoatsAreaSqFt: Math.round(totalCoatsAreaSqFt),
    estimatedLitresMin,
    estimatedLitresMax,
    recommendedLitres,
    approxGallons,
    approxDrums,
    matchedPaintProducts,
    summaryText,
    urduSummaryText,
    disclaimer
  };
}

export function buildPaintEstimateWhatsAppMessage(result: PaintEstimatorResult): string {
  const lines: string[] = [];
  lines.push(`*ZAFAR SARWAR TRADERS — PAINT ESTIMATOR*`);
  lines.push(`----------------------------------------`);
  lines.push(`*Room Dimensions:* ${result.inputs.roomLengthFeet}' Length × ${result.inputs.roomWidthFeet}' Width × ${result.inputs.wallHeightFeet}' Height`);
  lines.push(`*Coats:* ${result.inputs.numberOfCoats} Coats ${result.inputs.includeCeiling ? '(Includes Ceiling)' : ''}`);
  lines.push(`*Net Surface Area:* ${result.netPaintableAreaSqFt} Sq Ft (Total Application: ${result.totalCoatsAreaSqFt} Sq Ft)`);
  lines.push(`*Estimated Paint Required:* ~${result.recommendedLitres} Litres (~${result.approxGallons} Gallons / ${result.approxDrums} Drums)`);
  lines.push(`----------------------------------------`);
  lines.push(`_Note: ${result.disclaimer}_`);
  lines.push(`Please send shade cards and available paint brands with prices.`);
  return lines.join('\n');
}
