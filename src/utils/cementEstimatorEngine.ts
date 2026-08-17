import { 
  BuildMaterialEstimatorConfig, 
  BuildMaterialEstimatorInputs, 
  BuildMaterialEstimationResult,
  Product 
} from '../types';
import { defaultBuildMaterialEstimatorConfig } from '../data/defaultEstimatorConfig';

/**
 * Deterministic calculation engine for Pakistan residential & commercial cement requirements.
 * Strictly calculates based on validated inputs and admin-configured civil rules.
 */
export function calculateCementEstimate(
  inputs: BuildMaterialEstimatorInputs,
  config: BuildMaterialEstimatorConfig = defaultBuildMaterialEstimatorConfig
): BuildMaterialEstimationResult {
  const safeConfig = config || defaultBuildMaterialEstimatorConfig;
  
  // 1. Resolve Covered Area in Sq Ft
  let areaSqFt = Number(inputs.coveredAreaSqFt);
  if (isNaN(areaSqFt) || areaSqFt <= 0) {
    // Look up default from house size preset
    const preset = safeConfig.houseSizes?.find(h => h.id === inputs.houseSizeId);
    if (preset && preset.defaultCoveredAreaSqFt > 0) {
      areaSqFt = preset.defaultCoveredAreaSqFt;
    } else if (inputs.customMarla && inputs.customMarla > 0) {
      const conversion = safeConfig.sqFtPerMarla || 225;
      areaSqFt = inputs.customMarla * conversion * 1.5; // typical double story assumption
    } else {
      areaSqFt = 1800; // safe baseline fallback (5 Marla standard)
    }
  }

  // Cap minimum reasonable area to prevent anomalies
  areaSqFt = Math.max(100, Math.min(100000, areaSqFt));

  // 2. Base Rate (Cement Bags per Sq Ft)
  const baseRate = safeConfig.baseCementBagsPerSqFt > 0 ? safeConfig.baseCementBagsPerSqFt : 0.38;
  const rawBaseBags = areaSqFt * baseRate;

  // 3. Construction Type Multiplier
  const matchedConstType = safeConfig.constructionTypes?.find(c => c.id === inputs.constructionTypeId) || 
    safeConfig.constructionTypes?.[0] || 
    { id: 'grey-structure', name: 'Grey Structure', multiplier: 1.0, description: '' };
  const constMultiplier = Number(matchedConstType.multiplier) > 0 ? Number(matchedConstType.multiplier) : 1.0;

  // 4. Floors Multiplier
  let floorsMultiplier = 1.0;
  let floorsName = 'Ground Floor';
  if (inputs.floorId === 'custom' && typeof inputs.customFloorsCount === 'number' && inputs.customFloorsCount > 0) {
    floorsName = `${inputs.customFloorsCount} Floors`;
    floorsMultiplier = 1.0 + (inputs.customFloorsCount - 1) * 0.06;
  } else {
    const matchedFloor = safeConfig.floorsOptions?.find(f => f.id === inputs.floorId) || 
      safeConfig.floorsOptions?.[0] || 
      { id: 'ground', name: 'Ground Floor', multiplier: 1.0, floorsCount: 1 };
    floorsMultiplier = Number(matchedFloor.multiplier) > 0 ? Number(matchedFloor.multiplier) : 1.0;
    floorsName = matchedFloor.name;
  }

  // 5. Quality Multiplier
  const matchedQuality = safeConfig.qualityOptions?.find(q => q.id === inputs.qualityId) || 
    safeConfig.qualityOptions?.[0] || 
    { id: 'standard', name: 'Standard Structure', multiplier: 1.0, description: '' };
  const qualityMultiplier = Number(matchedQuality.multiplier) > 0 ? Number(matchedQuality.multiplier) : 1.0;

  // 6. Optional Factors Adjustment Total
  const selectedFactorIds = new Set(inputs.selectedOptionalFactors || []);
  let optionalAdjustmentsTotalPercentage = 0;
  
  if (Array.isArray(safeConfig.optionalFactors)) {
    safeConfig.optionalFactors.forEach(factor => {
      if (selectedFactorIds.has(factor.id)) {
        optionalAdjustmentsTotalPercentage += Number(factor.percentageAdjustment) || 0;
      }
    });
  }

  // 7. Bathroom Specific Additions (Cement for wet area bed screed & water insulation)
  const bathroomsCount = Math.max(0, Number(inputs.bathroomsCount) || 0);
  const bathroomBags = bathroomsCount * 3.5; // ~3.5 bags per washroom screed & waterproofing

  // 8. Core Mathematical Aggregation
  const baseFactorBags = rawBaseBags * constMultiplier * floorsMultiplier * qualityMultiplier;
  const optionalAdjustedBags = baseFactorBags * (1 + optionalAdjustmentsTotalPercentage);
  const finalExactBags = optionalAdjustedBags + bathroomBags;

  // 9. Percentage Range Bounds (e.g. -8% to +8%)
  const minPct = Number(safeConfig.minEstimatePercentage) > 0 ? Number(safeConfig.minEstimatePercentage) : 0.92;
  const maxPct = Number(safeConfig.maxEstimatePercentage) > 0 ? Number(safeConfig.maxEstimatePercentage) : 1.08;

  // Round to friendly clean integer steps (nearest 5 bags)
  const recommendedBags = Math.max(15, Math.round(finalExactBags / 5) * 5);
  const minEstimatedBags = Math.max(10, Math.round((finalExactBags * minPct) / 5) * 5);
  const maxEstimatedBags = Math.max(recommendedBags, Math.round((finalExactBags * maxPct) / 5) * 5);

  const matchedSize = safeConfig.houseSizes?.find(h => h.id === inputs.houseSizeId);
  const houseSizeLabel = matchedSize ? matchedSize.name : (inputs.customMarla ? `${inputs.customMarla} Marla` : `${areaSqFt} sq ft`);

  const summaryText = `For a ${houseSizeLabel} project with ${areaSqFt.toLocaleString()} sq ft covered area (${floorsName}, ${matchedConstType.name}), the estimated cement requirement is approximately ${minEstimatedBags.toLocaleString()} – ${maxEstimatedBags.toLocaleString()} bags (50kg each). Recommended planning buffer: ${recommendedBags.toLocaleString()} bags.`;

  return {
    inputs,
    coveredAreaSqFt: areaSqFt,
    baseEstimatedBags: Math.round(rawBaseBags),
    minEstimatedBags,
    maxEstimatedBags,
    recommendedBags,
    summaryText,
    appliedMultipliers: {
      baseRate,
      constructionType: { name: matchedConstType.name, multiplier: constMultiplier },
      floors: { name: floorsName, multiplier: floorsMultiplier },
      quality: { name: matchedQuality.name, multiplier: qualityMultiplier },
      optionalAdjustmentsTotalPercentage,
      bathroomBags: Math.round(bathroomBags)
    }
  };
}

/**
 * Filter and resolve currently available cement products from the catalog.
 * Dynamically queries real products from Supabase store state.
 */
export function getAvailableCementProducts(
  products: Product[],
  categorySlug: string = 'cement'
): Product[] {
  if (!Array.isArray(products) || products.length === 0) {
    return [];
  }

  const slugLower = (categorySlug || 'cement').toLowerCase();
  
  return products.filter(p => {
    if (!p || p.isHidden) return false;
    
    const catLower = (p.category || '').toLowerCase();
    const catIdLower = (p.categoryId || '').toLowerCase();
    const nameLower = (p.name || '').toLowerCase();
    
    const isCementCategory = 
      catIdLower === slugLower || 
      catLower === slugLower || 
      catIdLower.includes('cement') || 
      catLower.includes('cement');
      
    const isCementName = 
      nameLower.includes('cement') || 
      nameLower.includes('portland') || 
      nameLower.includes('opc');

    return isCementCategory || isCementName;
  });
}
