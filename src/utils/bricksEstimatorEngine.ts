import { 
  BricksEstimatorInputs, 
  BricksEstimatorResult, 
  HouseBrickEstimatorInputs,
  HouseBrickEstimatorResult,
  FloorBrickBreakdown,
  SmartToolsSettings 
} from '../types';
import { defaultSmartToolsSettings } from '../data/defaultSmartToolsConfig';

/**
 * Standard Pakistani Brick Dimensions in Inches:
 * Length: 9"
 * Width: 4.5"
 * Height: 3"
 * Nominal brick volume with 0.5" mortar joint: (9 + 0.5) * (4.5 + 0.5) * (3 + 0.5) = 166.25 cu in = 0.0962 cu ft.
 * Standard Pakistani empirical brickwork factor: ~13.5 bricks per CFT of masonry (standard practice across Punjab, Sindh, KPK, Islamabad).
 */
export const STANDARD_BRICK_LENGTH_INCHES = 9.0;
export const STANDARD_BRICK_WIDTH_INCHES = 4.5;
export const STANDARD_BRICK_HEIGHT_INCHES = 3.0;
export const STANDARD_BRICKS_PER_CFT = 13.5;

/**
 * Calculates bricks per CFT based on given brick dimensions in inches with 0.5" standard mortar joint.
 */
export function calculateBricksPerCft(
  lengthInches: number = 9.0, 
  widthInches: number = 4.5, 
  heightInches: number = 3.0
): number {
  const l = Math.max(2, lengthInches);
  const w = Math.max(1.5, widthInches);
  const h = Math.max(1, heightInches);

  // If using standard Pakistani 9x4.5x3 dimensions, return calibrated standard 13.5 bricks/cft
  if (Math.abs(l - 9) < 0.1 && Math.abs(w - 4.5) < 0.1 && Math.abs(h - 3) < 0.1) {
    return STANDARD_BRICKS_PER_CFT;
  }

  // Calculate with standard 0.5 inch (12.7mm) mortar joint
  const nominalL = l + 0.5;
  const nominalW = w + 0.5;
  const nominalH = h + 0.5;
  const nominalVolumeCuInches = nominalL * nominalW * nominalH;
  
  if (nominalVolumeCuInches <= 0) return STANDARD_BRICKS_PER_CFT;
  
  // 1 Cubic Foot = 1728 Cubic Inches
  const calculatedBricks = 1728 / nominalVolumeCuInches;
  // Bound to safe architectural range
  return Math.max(8, Math.min(25, Math.round(calculatedBricks * 10) / 10));
}

/**
 * Full-House Comprehensive Brick Masonry Engine.
 * Supports Single, Double, and Triple Storey Pakistani homes, customizable room perimeters,
 * kitchen & washroom partitions, wall thickness modes (9", 4.5", Dual), door/window deductions,
 * brick dimensions, and wastage allowance.
 */
export function calculateHouseBrickEstimate(
  inputs: HouseBrickEstimatorInputs,
  settings: SmartToolsSettings = defaultSmartToolsSettings
): HouseBrickEstimatorResult {
  const safeSettings = settings || defaultSmartToolsSettings;
  const brickRates = safeSettings.brickSettings || defaultSmartToolsSettings.brickSettings!;

  // 1. Calculate Bricks per CFT from brick dimensions
  const brickDims = inputs.brickDimensions || { type: 'standard-pakistani', lengthInches: 9, widthInches: 4.5, heightInches: 3 };
  const bricksPerCft = brickDims.type === 'custom'
    ? calculateBricksPerCft(brickDims.lengthInches, brickDims.widthInches, brickDims.heightInches)
    : (brickRates.bricksPerCft || STANDARD_BRICKS_PER_CFT);

  // 2. Determine Storeys & Floor Dimensions
  const storeysCount = inputs.houseType === 'triple' ? 3 : (inputs.houseType === 'double' ? 2 : 1);
  const defaultHeight = Math.max(7, Math.min(20, Number(inputs.defaultWallHeightFeet) || 10));
  
  const floorConfigs = (inputs.floors && inputs.floors.length > 0)
    ? inputs.floors.slice(0, storeysCount)
    : [
        { storeyId: 'ground' as const, label: 'Ground Floor', lengthFeet: inputs.houseLengthFeet || 40, widthFeet: inputs.houseWidthFeet || 30, heightFeet: defaultHeight },
        ...(storeysCount >= 2 ? [{ storeyId: 'first' as const, label: 'First Floor', lengthFeet: inputs.houseLengthFeet || 40, widthFeet: inputs.houseWidthFeet || 30, heightFeet: defaultHeight }] : []),
        ...(storeysCount >= 3 ? [{ storeyId: 'second' as const, label: 'Second Floor', lengthFeet: inputs.houseLengthFeet || 40, widthFeet: inputs.houseWidthFeet || 30, heightFeet: defaultHeight }] : [])
      ];

  // 3. Covered Area
  const groundFloorArea = (floorConfigs[0]?.lengthFeet || inputs.houseLengthFeet || 40) * (floorConfigs[0]?.widthFeet || inputs.houseWidthFeet || 30);
  const totalCoveredAreaSqFt = floorConfigs.reduce((sum, fl) => sum + (fl.lengthFeet * fl.widthFeet), 0);
  const approxMarla = Math.round((groundFloorArea / 225) * 10) / 10; // Standard 225 sq ft / Marla (Lahore/Punjab standard)

  // 4. Exterior Wall Thickness & Interior Partition Thickness
  let extThicknessFt = 0.75; // 9 inches
  let intThicknessFt = 0.375; // 4.5 inches (standard dual setup)

  if (inputs.wallThicknessType === '4.5-inch') {
    extThicknessFt = 0.375;
    intThicknessFt = 0.375;
  } else if (inputs.wallThicknessType === '9-inch') {
    extThicknessFt = 0.75;
    intThicknessFt = 0.75;
  } else if (inputs.wallThicknessType === 'custom' && inputs.customThicknessInches && inputs.customThicknessInches > 0) {
    extThicknessFt = inputs.customThicknessInches / 12;
    intThicknessFt = Math.min(extThicknessFt, 0.375);
  }

  // 5. Calculate Interior Partitions from Rooms, Kitchens, Washrooms, and Other Spaces
  const allRooms = [
    ...(inputs.rooms || []),
    ...(inputs.kitchens || []),
    ...(inputs.washrooms || []),
    ...(inputs.otherSpaces || [])
  ];

  // In civil layout, room partition walls share borders. 
  // Each internal room partition perimeter contribution is (length + width) * height (deduplicating 50% shared edges).
  const roomBreakdowns: { name: string; category: string; bricksCount: number; areaSqFt: number }[] = [];
  let totalInteriorWallAreaSqFt = 0;

  allRooms.forEach(room => {
    const l = Math.max(3, Number(room.lengthFeet) || 10);
    const w = Math.max(3, Number(room.widthFeet) || 10);
    const h = Math.max(7, Number(room.heightFeet) || defaultHeight);
    
    // Internal partition area (length + width) * height
    const roomWallArea = (l + w) * h;
    totalInteriorWallAreaSqFt += roomWallArea;

    // Room bricks estimate
    const roomVolume = roomWallArea * intThicknessFt;
    const roomBricks = Math.round(roomVolume * bricksPerCft);

    roomBreakdowns.push({
      name: room.name || `${room.category.toUpperCase()}`,
      category: room.category,
      bricksCount: roomBricks,
      areaSqFt: Math.round(roomWallArea)
    });
  });

  // If user entered no rooms, provide an empirical architectural partition estimation based on covered area
  if (totalInteriorWallAreaSqFt === 0) {
    // Standard residential partition wall ratio: approx 1.2 to 1.5 linear ft of wall per sq ft of covered area
    totalInteriorWallAreaSqFt = Math.round(totalCoveredAreaSqFt * 1.35 * (defaultHeight / 10));
  }

  // 6. Calculate Deductions for Doors, Windows, and Custom Openings
  const doorWidth = Math.max(2, Number(inputs.doorWidthFeet) || 3);
  const doorHeight = Math.max(6, Number(inputs.doorHeightFeet) || 7);
  const doorsCount = Math.max(0, Number(inputs.doorsCount) || 0);
  const doorsDeductionAreaSqFt = doorsCount * (doorWidth * doorHeight);

  const windowWidth = Math.max(2, Number(inputs.windowWidthFeet) || 4);
  const windowHeight = Math.max(2, Number(inputs.windowHeightFeet) || 4);
  const windowsCount = Math.max(0, Number(inputs.windowsCount) || 0);
  const windowsDeductionAreaSqFt = windowsCount * (windowWidth * windowHeight);

  let customOpeningsDeductionSqFt = 0;
  if (Array.isArray(inputs.customOpenings)) {
    customOpeningsDeductionSqFt = inputs.customOpenings.reduce((sum, item) => {
      const w = Math.max(0, Number(item.widthFeet) || 0);
      const h = Math.max(0, Number(item.heightFeet) || 0);
      const qty = Math.max(1, Number(item.quantity) || 1);
      return sum + (w * h * qty);
    }, 0);
  }

  const rawTotalOpeningsDeductionSqFt = doorsDeductionAreaSqFt + windowsDeductionAreaSqFt + customOpeningsDeductionSqFt;

  // 7. Calculate Exterior Walls and Floor-by-Floor Breakdowns
  let totalExteriorWallAreaSqFt = 0;
  const floorBreakdowns: FloorBrickBreakdown[] = [];

  floorConfigs.forEach((floor, idx) => {
    const l = Math.max(5, Number(floor.lengthFeet) || inputs.houseLengthFeet || 40);
    const w = Math.max(5, Number(floor.widthFeet) || inputs.houseWidthFeet || 30);
    const h = Math.max(7, Number(floor.heightFeet) || defaultHeight);

    const perimeter = 2 * (l + w);
    const extWallArea = perimeter * h;
    totalExteriorWallAreaSqFt += extWallArea;

    // Distribute interior walls and openings across floors
    const floorIntWallArea = totalInteriorWallAreaSqFt / storeysCount;
    const floorGrossArea = extWallArea + floorIntWallArea;
    const floorOpenings = rawTotalOpeningsDeductionSqFt / storeysCount;
    const floorNetArea = Math.max(10, floorGrossArea - floorOpenings);

    // Floor volume calculation
    const floorExtNetArea = Math.max(5, extWallArea - (floorOpenings * 0.6));
    const floorIntNetArea = Math.max(5, floorIntWallArea - (floorOpenings * 0.4));
    const floorVolume = (floorExtNetArea * extThicknessFt) + (floorIntNetArea * intThicknessFt);
    
    const floorRawBricks = Math.round(floorVolume * bricksPerCft);
    const floorWastagePercent = Math.max(0, Math.min(25, Number(inputs.wastagePercent) || 5));
    const floorWastage = Math.round(floorRawBricks * (floorWastagePercent / 100));

    floorBreakdowns.push({
      floorId: floor.storeyId,
      label: floor.label || (idx === 0 ? 'Ground Floor' : idx === 1 ? 'First Floor' : 'Second Floor'),
      exteriorWallAreaSqFt: Math.round(extWallArea),
      interiorWallAreaSqFt: Math.round(floorIntWallArea),
      openingsDeductionSqFt: Math.round(floorOpenings),
      netMasonryAreaSqFt: Math.round(floorNetArea),
      rawBricks: floorRawBricks,
      wastageBricks: floorWastage,
      totalBricks: floorRawBricks + floorWastage
    });
  });

  const grossWallAreaSqFt = totalExteriorWallAreaSqFt + totalInteriorWallAreaSqFt;
  // Cap deductions at 35% of gross wall area for structural realism
  const maxAllowedDeductions = grossWallAreaSqFt * 0.35;
  const totalOpeningsDeductionSqFt = Math.min(rawTotalOpeningsDeductionSqFt, maxAllowedDeductions);
  const netWallAreaSqFt = Math.max(10, grossWallAreaSqFt - totalOpeningsDeductionSqFt);

  // 8. Net Masonry Volume
  const netExtWallArea = Math.max(5, totalExteriorWallAreaSqFt - (totalOpeningsDeductionSqFt * 0.6));
  const netIntWallArea = Math.max(5, totalInteriorWallAreaSqFt - (totalOpeningsDeductionSqFt * 0.4));
  const netMasonryVolumeCft = Math.round(((netExtWallArea * extThicknessFt) + (netIntWallArea * intThicknessFt)) * 10) / 10;

  // 9. Bricks Count & Wastage Buffer
  const rawBricksCount = Math.round(netMasonryVolumeCft * bricksPerCft);
  const wastagePercent = Math.max(0, Math.min(25, Number(inputs.wastagePercent) || 5));
  const wastageBricksCount = Math.round(rawBricksCount * (wastagePercent / 100));
  const recommendedBricks = rawBricksCount + wastageBricksCount;

  // 10. Estimated Range (derived from ±2.5% structural variation & joint thickness)
  const totalBricksMin = Math.round(rawBricksCount * (1 + (wastagePercent * 0.4 / 100)));
  const totalBricksMax = Math.round(recommendedBricks * 1.035);

  // 11. Mortar Requirements (Cement bags & Ravi/Chenab sand)
  const cementBagsPer1000 = brickRates.cementBagsPer1000Bricks || 3.2;
  const sandCftPer1000 = brickRates.sandCftPer1000Bricks || 15.0;
  const approxCementBags = Math.round((recommendedBricks / 1000) * cementBagsPer1000 * 10) / 10;
  const approxSandCft = Math.round((recommendedBricks / 1000) * sandCftPer1000);

  // 12. Summary Text & Brick Label
  const brickSizeLabel = brickDims.type === 'custom'
    ? `Custom (${brickDims.lengthInches}" × ${brickDims.widthInches}" × ${brickDims.heightInches}")`
    : `Standard Pakistani (9" × 4.5" × 3")`;

  const storeyLabel = inputs.houseType === 'triple' ? 'Triple Storey' : (inputs.houseType === 'double' ? 'Double Storey' : 'Single Storey');

  const summaryText = `For a ${storeyLabel} house (${inputs.houseLengthFeet}' × ${inputs.houseWidthFeet}', approx ${Math.round(totalCoveredAreaSqFt)} sq ft covered area) with net masonry volume of ${netMasonryVolumeCft} CFT, the estimated brick requirement is ~${recommendedBricks.toLocaleString()} bricks (including ${wastagePercent}% wastage allowance). Estimated mortar: ~${Math.ceil(approxCementBags)} cement bags & ~${approxSandCft} CFT sand.`;

  const urduSummaryText = `${storeyLabel} گھر (کل رقبہ تقریباً ${Math.round(totalCoveredAreaSqFt)} مربع فٹ / ${approxMarla} مرلہ) کے لیے تخمینہ اینٹیں تقریباً ${recommendedBricks.toLocaleString()} ہیں (بشمول ${wastagePercent}% اضافی ویسٹیج)۔ اس چنائی کے لیے تقریباً ${Math.ceil(approxCementBags)} سیمنٹ بیگز اور ${approxSandCft} کیوبک فٹ ریت درکار ہوگی۔`;

  const disclaimer = `This is an estimated brick quantity. Actual requirements may vary depending on wall design, brick size, openings, construction method, and structural requirements. For final construction quantities, consult a qualified engineer or contractor.`;

  return {
    inputs,
    totalCoveredAreaSqFt: Math.round(totalCoveredAreaSqFt),
    approxMarla,
    exteriorWallAreaSqFt: Math.round(totalExteriorWallAreaSqFt),
    interiorWallAreaSqFt: Math.round(totalInteriorWallAreaSqFt),
    grossWallAreaSqFt: Math.round(grossWallAreaSqFt),
    doorsDeductionAreaSqFt: Math.round(doorsDeductionAreaSqFt),
    windowsDeductionAreaSqFt: Math.round(windowsDeductionAreaSqFt),
    totalOpeningsDeductionSqFt: Math.round(totalOpeningsDeductionSqFt),
    netWallAreaSqFt: Math.round(netWallAreaSqFt),
    netMasonryVolumeCft,
    rawBricksCount,
    wastageBricksCount,
    totalBricksMin,
    totalBricksMax,
    recommendedBricks,
    floorBreakdowns,
    roomBreakdowns,
    approxCementBags,
    approxSandCft,
    summaryText,
    urduSummaryText,
    disclaimer,
    brickSizeLabel
  };
}

/**
 * Legacy single-wall calculator adapter for backward compatibility
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

  let openingsAreaSqFt = 0;
  if (Array.isArray(inputs.openings) && inputs.openings.length > 0) {
    openingsAreaSqFt = inputs.openings.reduce((sum, item) => {
      const w = Math.max(0, Number(item.widthFeet) || 0);
      const h = Math.max(0, Number(item.heightFeet) || 0);
      const qty = Math.max(1, Number(item.quantity) || 1);
      return sum + (w * h * qty);
    }, 0);
  }

  const netWallAreaSqFt = Math.max(1, grossWallAreaSqFt - openingsAreaSqFt);

  let thicknessInFeet = 0.75; // default 9 inches = 0.75 ft
  let bricksPerSqFt = brickRates.doubleWallBricksPerSqFt || 9.0;

  if (inputs.wallThicknessType === '4.5-inch') {
    thicknessInFeet = 0.375;
    bricksPerSqFt = brickRates.singleWallBricksPerSqFt || 4.5;
  } else if (inputs.wallThicknessType === '13.5-inch') {
    thicknessInFeet = 1.125;
    bricksPerSqFt = (brickRates.doubleWallBricksPerSqFt || 9.0) * 1.5;
  } else if (inputs.wallThicknessType === 'custom' && inputs.customThicknessInches && inputs.customThicknessInches > 0) {
    thicknessInFeet = inputs.customThicknessInches / 12;
    bricksPerSqFt = (brickRates.bricksPerCft || 13.5) * thicknessInFeet;
  }

  const wallVolumeCft = Math.round(netWallAreaSqFt * thicknessInFeet * 10) / 10;
  const rawBricksCount = Math.round(netWallAreaSqFt * bricksPerSqFt);

  const wastagePercent = Math.max(0, Math.min(25, Number(inputs.wastagePercent) || 5));
  const wastageBricksCount = Math.round(rawBricksCount * (wastagePercent / 100));

  const totalBricksMin = Math.round(rawBricksCount * 0.98);
  const totalBricksMax = rawBricksCount + wastageBricksCount + Math.round(rawBricksCount * 0.03);
  const recommendedBricks = rawBricksCount + wastageBricksCount;

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

/**
 * Builds a clean, professional WhatsApp message for sharing house brick estimates.
 */
export function buildHouseBrickEstimateWhatsAppMessage(
  result: HouseBrickEstimatorResult,
  companyName: string = "Zafar Sarwar Building Materials"
): string {
  const inputs = result.inputs;
  const houseTypeLabel = inputs.houseType === 'triple' ? 'Triple Storey' : (inputs.houseType === 'double' ? 'Double Storey' : 'Single Storey');
  
  const lines: string[] = [];
  lines.push(`*${companyName.toUpperCase()} — HOUSE BRICK ESTIMATE*`);
  lines.push(`----------------------------------------`);
  lines.push(`🏡 *House Type:* ${houseTypeLabel}`);
  lines.push(`📐 *House Size:* ${inputs.houseLengthFeet}' × ${inputs.houseWidthFeet}' (~${result.totalCoveredAreaSqFt.toLocaleString()} Sq Ft / ${result.approxMarla} Marla)`);
  lines.push(`🧱 *Brick Dimensions:* ${result.brickSizeLabel}`);
  lines.push(`----------------------------------------`);
  lines.push(`*Calculated Bricks:* ${result.rawBricksCount.toLocaleString()}`);
  lines.push(`*Wastage Allowance (${inputs.wastagePercent}%):* +${result.wastageBricksCount.toLocaleString()}`);
  lines.push(`🏆 *Total Estimated Bricks:* ~${result.recommendedBricks.toLocaleString()} Bricks`);
  lines.push(`📊 *Estimated Range:* ${result.totalBricksMin.toLocaleString()} – ${result.totalBricksMax.toLocaleString()} Bricks`);
  
  if (result.floorBreakdowns && result.floorBreakdowns.length > 1) {
    lines.push(`----------------------------------------`);
    lines.push(`*Floor Breakdown:*`);
    result.floorBreakdowns.forEach(f => {
      lines.push(`• ${f.label}: ~${f.totalBricks.toLocaleString()} Bricks`);
    });
  }

  lines.push(`----------------------------------------`);
  lines.push(`*Estimated Mortar Requirement:*`);
  lines.push(`• Cement: ~${Math.ceil(result.approxCementBags)} Bags (50kg)`);
  lines.push(`• Sand (Chenab/Ravi): ~${result.approxSandCft.toLocaleString()} CFT`);
  lines.push(`----------------------------------------`);
  lines.push(`_Note: ${result.disclaimer}_`);
  lines.push(`Please provide price quotation and delivery schedule.`);
  return lines.join('\n');
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

