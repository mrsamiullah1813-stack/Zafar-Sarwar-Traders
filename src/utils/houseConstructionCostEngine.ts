import { 
  HouseConstructionInputs, 
  HouseConstructionResult, 
  ConstructionCostCategoryItem,
  SmartToolsSettings 
} from '../types';
import { defaultSmartToolsSettings } from '../data/defaultSmartToolsConfig';

/**
 * Deterministic calculation engine for Pakistani residential house construction cost.
 * Calculates realistic PKR cost ranges for Grey Structure, Finishing, or Complete construction.
 */
export function calculateHouseConstructionCost(
  inputs: HouseConstructionInputs,
  settings: SmartToolsSettings = defaultSmartToolsSettings
): HouseConstructionResult {
  const safeSettings = settings || defaultSmartToolsSettings;
  const rates = safeSettings.constructionCostSettings || defaultSmartToolsSettings.constructionCostSettings!;

  // 1. Calculate Covered Area
  let coveredAreaSqFt = 0;
  if (inputs.houseSizePreset === '3-marla') {
    coveredAreaSqFt = inputs.storeys === 'single' ? 650 : (inputs.storeys === 'triple' ? 1600 : 1150);
  } else if (inputs.houseSizePreset === '5-marla') {
    coveredAreaSqFt = inputs.storeys === 'single' ? 1100 : (inputs.storeys === 'triple' ? 2750 : 1950);
  } else if (inputs.houseSizePreset === '7-marla') {
    coveredAreaSqFt = inputs.storeys === 'single' ? 1550 : (inputs.storeys === 'triple' ? 3900 : 2750);
  } else if (inputs.houseSizePreset === '10-marla') {
    coveredAreaSqFt = inputs.storeys === 'single' ? 2200 : (inputs.storeys === 'triple' ? 5400 : 3850);
  } else if (inputs.houseSizePreset === '1-kanal') {
    coveredAreaSqFt = inputs.storeys === 'single' ? 3800 : (inputs.storeys === 'triple' ? 9500 : 6600);
  } else {
    // Custom
    if (inputs.customSqFt && inputs.customSqFt > 0) {
      coveredAreaSqFt = inputs.customSqFt;
    } else if (inputs.customMarla && inputs.customMarla > 0) {
      const perMarla = 225;
      const storeysMult = inputs.storeys === 'single' ? 0.9 : (inputs.storeys === 'triple' ? 2.3 : 1.7);
      coveredAreaSqFt = Math.round(inputs.customMarla * perMarla * storeysMult);
    } else {
      coveredAreaSqFt = 1950; // default 5 Marla double
    }
  }

  // Add basement if applicable
  if (inputs.hasBasement) {
    coveredAreaSqFt += Math.round(coveredAreaSqFt * 0.45);
  }

  // 2. Determine Base Rate per Sq Ft
  let baseRateMin = 0;
  let baseRateMax = 0;

  if (inputs.stage === 'grey-structure') {
    if (inputs.quality === 'basic') {
      baseRateMin = (rates.greyStructureBasicPerSqFt || 2100) * 0.95;
      baseRateMax = (rates.greyStructureBasicPerSqFt || 2100) * 1.05;
    } else if (inputs.quality === 'premium') {
      baseRateMin = (rates.greyStructurePremiumPerSqFt || 2900) * 0.95;
      baseRateMax = (rates.greyStructurePremiumPerSqFt || 2900) * 1.05;
    } else {
      // standard
      baseRateMin = (rates.greyStructureStandardPerSqFt || 2500) * 0.95;
      baseRateMax = (rates.greyStructureStandardPerSqFt || 2500) * 1.05;
    }
  } else if (inputs.stage === 'finishing') {
    if (inputs.quality === 'basic') {
      baseRateMin = (rates.finishingBasicPerSqFt || 1800) * 0.95;
      baseRateMax = (rates.finishingBasicPerSqFt || 1800) * 1.05;
    } else if (inputs.quality === 'premium') {
      baseRateMin = (rates.finishingPremiumPerSqFt || 3900) * 0.95;
      baseRateMax = (rates.finishingPremiumPerSqFt || 3900) * 1.05;
    } else {
      // standard
      baseRateMin = (rates.finishingStandardPerSqFt || 2600) * 0.95;
      baseRateMax = (rates.finishingStandardPerSqFt || 2600) * 1.05;
    }
  } else {
    // Complete House
    if (inputs.quality === 'basic') {
      baseRateMin = (rates.completeBasicPerSqFt || 3900) * 0.95;
      baseRateMax = (rates.completeBasicPerSqFt || 3900) * 1.05;
    } else if (inputs.quality === 'premium') {
      baseRateMin = (rates.completePremiumPerSqFt || 6800) * 0.95;
      baseRateMax = (rates.completePremiumPerSqFt || 6800) * 1.05;
    } else {
      // standard
      baseRateMin = (rates.completeStandardPerSqFt || 5100) * 0.95;
      baseRateMax = (rates.completeStandardPerSqFt || 5100) * 1.05;
    }
  }

  // Adjust for bathrooms/kitchens
  const extraBathrooms = Math.max(0, (inputs.bathroomsCount || 2) - 2);
  const extraKitchens = Math.max(0, (inputs.kitchensCount || 1) - 1);
  const extraFixturesCost = (extraBathrooms * 140000) + (extraKitchens * 250000);

  const totalCostMinPkr = Math.round(coveredAreaSqFt * baseRateMin + extraFixturesCost * 0.9);
  const totalCostMaxPkr = Math.round(coveredAreaSqFt * baseRateMax + extraFixturesCost * 1.1);
  const recommendedBudgetPkr = Math.round((totalCostMinPkr + totalCostMaxPkr) / 2);

  // 3. Category Breakdown
  const categories: ConstructionCostCategoryItem[] = [];

  if (inputs.stage === 'grey-structure') {
    const approxCementBags = Math.round(coveredAreaSqFt * 0.42);
    const approxSteelTons = Number((coveredAreaSqFt * 0.0038).toFixed(2));
    const approxBricks = Math.round(coveredAreaSqFt * 28);
    const approxSandCft = Math.round(coveredAreaSqFt * 1.3);
    const approxCrushCft = Math.round(coveredAreaSqFt * 1.1);

    categories.push(
      {
        id: 'cement',
        name: 'Cement (OPC / SRC)',
        urduName: 'سیمنٹ',
        percentage: 22,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.22),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.22),
        approxQuantity: `~${approxCementBags.toLocaleString()} Bags (50kg)`,
        description: 'For RCC foundation, columns, beams, roof slabs, and masonry plaster.',
        relatedCategorySlug: 'cement'
      },
      {
        id: 'steel',
        name: 'Steel Rebar (Grade 60)',
        urduName: 'سریا',
        percentage: 24,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.24),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.24),
        approxQuantity: `~${approxSteelTons} Tons`,
        description: 'Deformed Grade-60 high-tensile steel bars for structural reinforcement.',
        relatedCategorySlug: 'building-materials'
      },
      {
        id: 'bricks',
        name: 'Bricks (Awwal / First Class)',
        urduName: 'اینٹیں (اول کوالٹی)',
        percentage: 15,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.15),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.15),
        approxQuantity: `~${approxBricks.toLocaleString()} Bricks`,
        description: 'First-class kiln-baked red clay bricks for boundary & interior walls.',
        relatedCategorySlug: 'building-materials'
      },
      {
        id: 'sand-crush',
        name: 'Sand & Crush (Ravi / Chenab & Margalla/Sargodha)',
        urduName: 'ریت اور بجری',
        percentage: 12,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.12),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.12),
        approxQuantity: `~${approxSandCft.toLocaleString()} CFT Sand, ~${approxCrushCft.toLocaleString()} CFT Crush`,
        description: 'Coarse sand for plaster/concrete and graded stone aggregate for RCC.',
        relatedCategorySlug: 'building-materials'
      },
      {
        id: 'plumbing-electric-conduits',
        name: 'Underground Plumbing & Electrical Conduiting',
        urduName: 'زیر زمین پلمبنگ اور پائپنگ',
        percentage: 8,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.08),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.08),
        approxQuantity: 'UPVC / CPVC pipe network & conduit pipes',
        description: 'Sewerage drainage, cold/hot water rough-in, and ceiling light boxes.',
        relatedCategorySlug: 'pipes-fittings'
      },
      {
        id: 'labour-grey',
        name: 'Grey Structure Labour & Masonry Contractor',
        urduName: 'لیبر اور ٹھیکیدار',
        percentage: 19,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.19),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.19),
        approxQuantity: `~${coveredAreaSqFt.toLocaleString()} sq ft coverage`,
        description: 'Excavation, shuttering, steel binding, concrete pouring, and bricklaying.',
        relatedCategorySlug: 'services'
      }
    );
  } else if (inputs.stage === 'finishing') {
    categories.push(
      {
        id: 'tiles-flooring',
        name: 'Tiles, Marble & Granite',
        urduName: 'ٹائلیں اور ماربل',
        percentage: 28,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.28),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.28),
        approxQuantity: 'Porcelain/Ceramic tiles for floor & bathrooms',
        description: 'Living room, bedroom, staircase and bathroom wall/floor tiles.',
        relatedCategorySlug: 'tiles'
      },
      {
        id: 'sanitary-faucets',
        name: 'Sanitary Ware, Vanities & Faucets',
        urduName: 'سینیٹری، وینٹیز اور نلکے',
        percentage: 20,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.20),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.20),
        approxQuantity: `${inputs.bathroomsCount || 3} Bathrooms & Kitchen fixtures`,
        description: 'One-piece commodes, luxury vanities, shower sets, mixers, and geysers.',
        relatedCategorySlug: 'sanitary-ware'
      },
      {
        id: 'paint-false-ceiling',
        name: 'Paint, Polish & Gypsum Ceiling',
        urduName: 'پینٹ، پالش اور سیلنگ',
        percentage: 16,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.16),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.16),
        approxQuantity: 'Interior Plastic Emulsion, Weather Sheet & Ceiling',
        description: 'Wall putty, base coat, premium emulsion, and exterior weather-shield.',
        relatedCategorySlug: 'paints'
      },
      {
        id: 'woodwork-doors',
        name: 'Doors, Wardrobes & Kitchen Cabinets',
        urduName: 'دروازے اور کچن کیبنٹس',
        percentage: 20,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.20),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.20),
        approxQuantity: 'Solid/Semi-solid wood doors & UV/Acrylic cabinets',
        description: 'Main entrance door, bedroom doors, kitchen carcass, and hardware locks.',
        relatedCategorySlug: 'hardware'
      },
      {
        id: 'electric-fixtures',
        name: 'Electrical Switches, LED Lights & Fans',
        urduName: 'لائٹس، پنکھے اور سوئچ بورڈز',
        percentage: 16,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.16),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.16),
        approxQuantity: 'SMD downlights, chandeliers, copper wiring & DB board',
        description: 'Circuit breakers, switchboards, decorative lighting, and distribution boxes.',
        relatedCategorySlug: 'electrical'
      }
    );
  } else {
    // Complete House
    categories.push(
      {
        id: 'structure-materials',
        name: 'Civil Structure (Cement, Steel, Bricks, Sand & Crush)',
        urduName: 'سول اسٹرکچر میٹریل',
        percentage: 42,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.42),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.42),
        approxQuantity: `Grey structure materials for ${coveredAreaSqFt.toLocaleString()} sq ft`,
        description: 'Complete foundational framework, RCC slabs, columns, and walls.',
        relatedCategorySlug: 'building-materials'
      },
      {
        id: 'tiles-marble',
        name: 'Tiles, Flooring & Granite',
        urduName: 'ٹائلز اور فرش',
        percentage: 15,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.15),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.15),
        approxQuantity: 'Flooring, stairs, and bathroom wall tiles',
        description: 'Imported or local porcelain floor tiles and counter granites.',
        relatedCategorySlug: 'tiles'
      },
      {
        id: 'sanitary-plumbing',
        name: 'Sanitary Ware, Faucets & Bath Fixtures',
        urduName: 'سینیٹری اور پلمبنگ فٹنگز',
        percentage: 12,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.12),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.12),
        approxQuantity: `${inputs.bathroomsCount || 3} Bathrooms, Water Tanks & Pumps`,
        description: 'Luxury commodes, vanity units, brass shower mixers, geysers, and valves.',
        relatedCategorySlug: 'sanitary-ware'
      },
      {
        id: 'doors-woodwork',
        name: 'Woodwork, Doors, Kitchen & Wardrobes',
        urduName: 'دروازے اور لکڑی کا کام',
        percentage: 12,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.12),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.12),
        approxQuantity: 'Entrance doors, kitchen and wardrobe joinery',
        description: 'Lacquered woodwork, kitchen cabinetry, and premium handle locks.',
        relatedCategorySlug: 'hardware'
      },
      {
        id: 'paint-ceiling',
        name: 'Paints, Wall Putty & Gypsum Ceiling',
        urduName: 'پینٹ اور فالس سیلنگ',
        percentage: 8,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.08),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.08),
        approxQuantity: 'Full interior and exterior coatings',
        description: 'Multi-coat emulsion, weather-shield, and designer ceiling design.',
        relatedCategorySlug: 'paints'
      },
      {
        id: 'labour-management',
        name: 'Labour, Electrician, Plumber & Contractor Supervision',
        urduName: 'لیبر اور ٹھیکیدار نگرانی',
        percentage: 11,
        estimatedMinPkr: Math.round(totalCostMinPkr * 0.11),
        estimatedMaxPkr: Math.round(totalCostMaxPkr * 0.11),
        approxQuantity: 'Complete turnkey execution',
        description: 'Masons, carpenters, plumbers, electricians, and site management.',
        relatedCategorySlug: 'services'
      }
    );
  }

  const stageLabel = inputs.stage === 'grey-structure' 
    ? 'Grey Structure Only' 
    : (inputs.stage === 'finishing' ? 'Finishing Works Only' : 'Complete Turnkey House');

  const qualityLabel = inputs.quality === 'basic' 
    ? 'Economical / Basic Grade' 
    : (inputs.quality === 'premium' ? 'Luxury / Executive Grade' : 'Standard High-Quality Grade');

  const disclaimer = `This is an approximate planning estimate only. Actual cost depends on covered area, structural design, material quality, labour rates, location, market prices and project specifications. ESTIMATE ONLY — NOT A STRUCTURAL ENGINEERING QUOTATION.`;

  return {
    inputs,
    coveredAreaSqFt,
    ratePerSqFtMin: Math.round(baseRateMin),
    ratePerSqFtMax: Math.round(baseRateMax),
    totalCostMinPkr,
    totalCostMaxPkr,
    recommendedBudgetPkr,
    stageLabel,
    qualityLabel,
    categories,
    disclaimer
  };
}

export function buildConstructionEstimateWhatsAppMessage(result: HouseConstructionResult): string {
  const lines: string[] = [];
  lines.push(`*ZAFAR SARWAR TRADERS — HOUSE CONSTRUCTION ESTIMATE*`);
  lines.push(`----------------------------------------`);
  lines.push(`*Project Scope:* ${result.stageLabel}`);
  lines.push(`*Quality Standard:* ${result.qualityLabel}`);
  lines.push(`*Covered Area:* ${result.coveredAreaSqFt.toLocaleString()} Sq Ft`);
  lines.push(`*Estimated Cost Range:* Rs. ${(result.totalCostMinPkr / 100000).toFixed(2)} Lacs – Rs. ${(result.totalCostMaxPkr / 100000).toFixed(2)} Lacs`);
  lines.push(`*(Approx: Rs. ${result.totalCostMinPkr.toLocaleString()} – Rs. ${result.totalCostMaxPkr.toLocaleString()} PKR)*`);
  lines.push(`----------------------------------------`);
  lines.push(`*Key Material Breakdown:*`);
  result.categories.slice(0, 5).forEach(c => {
    lines.push(`• *${c.name}:* ~Rs. ${Math.round((c.estimatedMinPkr + c.estimatedMaxPkr) / 2).toLocaleString()} (${c.approxQuantity || ''})`);
  });
  lines.push(`----------------------------------------`);
  lines.push(`_Note: ${result.disclaimer}_`);
  lines.push(`Please advise on building material packages and showroom quotes.`);
  return lines.join('\n');
}
