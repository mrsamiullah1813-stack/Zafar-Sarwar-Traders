import { 
  BricksEstimatorInputs, 
  BricksEstimatorResult, 
  SmartToolsSettings 
} from '../types';
import { defaultSmartToolsSettings } from '../data/defaultSmartToolsConfig';

/**
 * Deterministic calculation engine for Pakistani brick masonry quantities.
 * Supports standard Pakistani single (4.5") and double (9") brick walls with door/window deductions and wastage.
 */
export function calculateBricksEstimate(
  inputs: BricksEstimatorInputs,
  settings: SmartToolsSettings = defaultSmartToolsSettings
): BricksEstimatorResult {
  const safeSettings = settings || defaultSmartToolsSettings;
  const brickRates = safeSettings.brickSettings || defaultSmartToolsSettings.brickSettings!;

  const length = Math.max(1, Number(inputs.wallLengthFeet) || 10);
  const height = Math.max(1, Number(inputs.wallHeightFeet) || 10);
  const grossWallAreaSqFt = length * height;

  // 1. Calculate Openings Deduction
  let openingsAreaSqFt = 0;
  if (Array.isArray(inputs.openings) && inputs.openings.length > 0) {
    openingsAreaSqFt = inputs.openings.reduce((sum, item) => {
      const w = Math.max(0, Number(item.widthFeet) || 0);
      const h = Math.max(0, Number(item.heightFeet) || 0);
      const qty = Math.max(1, Number(item.quantity) || 1);
      return sum + (w * h * qty);
    }, 0);
  }

  // Ensure net area does not become negative
  const netWallAreaSqFt = Math.max(1, grossWallAreaSqFt - openingsAreaSqFt);

  // 2. Determine Wall Thickness & Volume
  let thicknessInFeet = 0.75; // default 9 inches = 0.75 ft
  let bricksPerSqFt = brickRates.doubleWallBricksPerSqFt || 9.0;

  if (inputs.wallThicknessType === '4.5-inch') {
    thicknessInFeet = 0.375; // 4.5 inches = 0.375 ft
    bricksPerSqFt = brickRates.singleWallBricksPerSqFt || 4.5;
  } else if (inputs.wallThicknessType === '13.5-inch') {
    thicknessInFeet = 1.125; // 13.5 inches
    bricksPerSqFt = (brickRates.doubleWallBricksPerSqFt || 9.0) * 1.5;
  } else if (inputs.wallThicknessType === 'custom' && inputs.customThicknessInches && inputs.customThicknessInches > 0) {
    thicknessInFeet = inputs.customThicknessInches / 12;
    bricksPerSqFt = (brickRates.bricksPerCft || 13.5) * thicknessInFeet;
  }

  const wallVolumeCft = Math.round(netWallAreaSqFt * thicknessInFeet * 10) / 10;
  const rawBricksCount = Math.round(netWallAreaSqFt * bricksPerSqFt);

  // 3. Wastage Allowance
  const wastagePercent = Math.max(0, Math.min(25, Number(inputs.wastagePercent) || 5));
  const wastageBricksCount = Math.round(rawBricksCount * (wastagePercent / 100));

  const totalBricksMin = Math.round(rawBricksCount * 0.98);
  const totalBricksMax = rawBricksCount + wastageBricksCount + Math.round(rawBricksCount * 0.03);
  const recommendedBricks = rawBricksCount + wastageBricksCount;

  // 4. Mortar Requirements (1:6 cement sand standard mix)
  const cementBagsPer1000 = brickRates.cementBagsPer1000Bricks || 3.2;
  const sandCftPer1000 = brickRates.sandCftPer1000Bricks || 15.0;

  const approxCementBags = Math.round((recommendedBricks / 1000) * cementBagsPer1000 * 10) / 10;
  const approxSandCft = Math.round((recommendedBricks / 1000) * sandCftPer1000);

  const thicknessLabel = inputs.wallThicknessType === '4.5-inch'
    ? '4.5" (Single Leaf / Parda Wall)'
    : (inputs.wallThicknessType === '9-inch' ? '9" (Standard Double Leaf)' : `${inputs.customThicknessInches || 13.5}" Thick Wall`);

  const summaryText = `For a ${length}' × ${height}' wall (${thicknessLabel}) with net area ${Math.round(netWallAreaSqFt)} sq ft (${wallVolumeCft} CFT), estimated requirement is approximately ${recommendedBricks.toLocaleString()} bricks (including ${wastagePercent}% wastage buffer). Estimated mortar: ~${Math.ceil(approxCementBags)} cement bags & ~${approxSandCft} CFT sand.`;

  const urduSummaryText = `${length} × ${height} فٹ دیوار (${thicknessLabel}) کے لیے خالص رقبہ ${Math.round(netWallAreaSqFt)} مربع فٹ ہے، جس کے لیے تقریباً ${recommendedBricks.toLocaleString()} اینٹیں، ${Math.ceil(approxCementBags)} بیگز سیمنٹ اور ${approxSandCft} کیوبک فٹ ریت درکار ہوگی۔`;

  const disclaimer = `Actual brick requirement depends on brick size, wall thickness, mortar joints, openings such as doors/windows, site wastage and construction method. ESTIMATE ONLY.`;

  return {
    inputs,
    grossWallAreaSqFt: Math.round(grossWallAreaSqFt),
    openingsAreaSqFt: Math.round(openingsAreaSqFt),
    netWallAreaSqFt: Math.round(netWallAreaSqFt),
    wallVolumeCft,
    rawBricksCount,
    wastageBricksCount,
    totalBricksMin,
    totalBricksMax,
    recommendedBricks,
    approxCementBags,
    approxSandCft,
    summaryText,
    urduSummaryText,
    disclaimer
  };
}

export function buildBricksEstimateWhatsAppMessage(result: BricksEstimatorResult): string {
  const lines: string[] = [];
  lines.push(`*ZAFAR SARWAR TRADERS — BRICKS ESTIMATOR*`);
  lines.push(`----------------------------------------`);
  lines.push(`*Wall Dimensions:* ${result.inputs.wallLengthFeet}' Length × ${result.inputs.wallHeightFeet}' Height`);
  lines.push(`*Wall Thickness:* ${result.inputs.wallThicknessType}`);
  lines.push(`*Net Masonry Area:* ${result.netWallAreaSqFt} Sq Ft (~${result.wallVolumeCft} CFT Volume)`);
  lines.push(`*Estimated Bricks Required:* ~${result.recommendedBricks.toLocaleString()} Bricks (with ${result.inputs.wastagePercent}% buffer)`);
  lines.push(`*Mortar Cement:* ~${Math.ceil(result.approxCementBags)} Bags (50kg)`);
  lines.push(`*Mortar Sand:* ~${result.approxSandCft} CFT Chenab/Ravi Sand`);
  lines.push(`----------------------------------------`);
  lines.push(`_Note: ${result.disclaimer}_`);
  lines.push(`Please provide quotation and delivery options.`);
  return lines.join('\n');
}
