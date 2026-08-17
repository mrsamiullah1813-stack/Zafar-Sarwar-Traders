import { Product, WaterTankPumpInputs, WaterTankPumpResult } from '../types';

export function calculateWaterTankAndPump(
  inputs: WaterTankPumpInputs,
  allProducts: Product[]
): WaterTankPumpResult {
  const safeProducts = Array.isArray(allProducts) ? allProducts : [];

  // 1. Water Consumption per person per day (Pakistani residential benchmark)
  let litersPerPerson = 160;
  if (inputs.usageLevel === 'eco') litersPerPerson = 120;
  if (inputs.usageLevel === 'high') litersPerPerson = 220;

  const dailyLiters = inputs.peopleCount * litersPerPerson;
  const dailyGallons = Math.round(dailyLiters / 3.785);

  // 2. Overhead Storage Tank Recommendation (approx 1 to 1.2 days buffer)
  let recommendedTankLiters = 1000;
  if (dailyLiters <= 600) recommendedTankLiters = 750;
  else if (dailyLiters <= 1000) recommendedTankLiters = 1000;
  else if (dailyLiters <= 1600) recommendedTankLiters = 1500;
  else if (dailyLiters <= 2500) recommendedTankLiters = 2000;
  else recommendedTankLiters = 3000;

  const recommendedTankGallons = Math.round(recommendedTankLiters / 3.785);

  // 3. Underground / Ground Tank Recommendation (if requested or for ground backup)
  let recommendedUndergroundLiters: number | undefined = undefined;
  if (inputs.groundStorageNeeded) {
    recommendedUndergroundLiters = Math.round(recommendedTankLiters * 1.5);
  }

  // 4. Pump / Motor Horsepower (HP) Recommendation based on building height / floors and demand
  let pumpHp = "0.5 HP";
  let pipeSize = '1.0" Riser & 0.75" Branch';

  if (inputs.floorsCount === 1) {
    pumpHp = "0.5 HP (Single Storey Monoblock / Submersible)";
    pipeSize = '1.0" Main Riser & 0.75" Distribution';
  } else if (inputs.floorsCount === 2) {
    pumpHp = inputs.peopleCount > 6 ? "1.0 HP (High Pressure Jet Pump)" : "0.75 HP – 1.0 HP";
    pipeSize = '1.0" Main Riser & 0.75" Distribution';
  } else if (inputs.floorsCount === 3) {
    pumpHp = "1.5 HP (Multi-Stage / Deep Jet Pump)";
    pipeSize = '1.25" Main Riser & 1.0" Distribution';
  } else {
    pumpHp = "2.0 HP (Automatic Commercial Booster System)";
    pipeSize = '1.5" Main Riser & 1.0" Distribution';
  }

  // 5. Match Relevant Products in Store Catalog
  const recommendedProducts = safeProducts.filter(p => {
    if (p.isHidden) return false;
    const catId = (p.categoryId || '').toLowerCase();
    const catName = (p.category || '').toLowerCase();
    const pName = (p.name || '').toLowerCase();

    return (
      catId.includes('water-tanks') ||
      catName.includes('water tanks') ||
      catId.includes('cpvc') ||
      catId.includes('upvc') ||
      catId.includes('plumbing') ||
      pName.includes('tank') ||
      pName.includes('pipe') ||
      pName.includes('valve')
    );
  }).slice(0, 4);

  // 6. Summary Texts
  const summaryText = `For ${inputs.peopleCount} residents across ${inputs.floorsCount} ${inputs.floorsCount === 1 ? 'floor' : 'floors'}, we recommend a ${recommendedTankLiters.toLocaleString()} Litre (~${recommendedTankGallons} Gallon) multi-layer anti-bacterial overhead water tank paired with a ${pumpHp} motor.`;
  
  const urduSummaryText = `${inputs.peopleCount} افراد اور ${inputs.floorsCount} منزلہ عمارت کے لیے تقریباً ${recommendedTankLiters.toLocaleString()} لیٹر (~${recommendedTankGallons} گیلن) کا اوورہیڈ واٹر ٹینک اور ${pumpHp} کا پمپ تجویز کیا جاتا ہے۔`;

  const technicalTips = [
    `Use 5-Layer Food Grade Thermal Insulated tanks to prevent water from heating during peak Pakistani summers.`,
    `Install CPVC high-temperature piping for hot water lines and UPVC Class B/D for cold mains.`,
    `Ensure non-return brass check valve (NRV) is fitted on the pump discharge line to prevent water backflow.`,
    `For 2+ storeys, install an automatic water level controller to prevent tank overflows and dry-running motor damage.`
  ];

  return {
    inputs,
    dailyWaterRequirementLiters: dailyLiters,
    dailyWaterRequirementGallons: dailyGallons,
    recommendedOverheadTankLiters: recommendedTankLiters,
    recommendedOverheadTankGallons: recommendedTankGallons,
    recommendedUndergroundTankLiters,
    recommendedPumpHorsepower: pumpHp,
    recommendedPipeSizeInches: pipeSize,
    summaryText,
    urduSummaryText,
    recommendedProducts,
    technicalTips
  };
}

export function buildWaterGuideWhatsAppMessage(result: WaterTankPumpResult): string {
  const lines: string[] = [];
  lines.push(`*ZAFAR SARWAR TRADERS — WATER TANK & PUMP GUIDE*`);
  lines.push(`----------------------------------------`);
  lines.push(`*People / Family Size:* ${result.inputs.peopleCount} Persons`);
  lines.push(`*Floors:* ${result.inputs.floorsCount} Storey`);
  lines.push(`*Water Usage Level:* ${result.inputs.usageLevel.toUpperCase()}`);
  lines.push(`*Estimated Daily Requirement:* ${result.dailyWaterRequirementLiters.toLocaleString()} Litres (~${result.dailyWaterRequirementGallons} Gallons)`);
  lines.push(`*Recommended Tank:* ${result.recommendedOverheadTankLiters.toLocaleString()} Litres (~${result.recommendedOverheadTankGallons} Gallons)`);
  lines.push(`*Recommended Pump:* ${result.recommendedPumpHorsepower}`);
  lines.push(`*Recommended Pipe Sizes:* ${result.recommendedPipeSizeInches}`);
  lines.push(``);
  lines.push(`Please provide available tank brands (e.g. Master / Dura / Falcon) and pipe rate list.`);
  return lines.join('\n');
}
