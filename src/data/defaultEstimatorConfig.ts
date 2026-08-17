import { BuildMaterialEstimatorConfig } from '../types';

export const defaultBuildMaterialEstimatorConfig: BuildMaterialEstimatorConfig = {
  isEnabled: true,
  title: 'Build Material Estimator',
  subtitle: 'Estimate Cement & Building Material Requirements for Your House',
  tagline: 'DIRECT DISTRIBUTOR CIVIL CALCULATION ENGINE',
  description: 'Quickly calculate approximate Grade 53 cement bags required for your house construction in Pakistan. Get instant planning estimates based on plot size, covered area, and structural specifications.',
  ctaText: 'Calculate Cement Estimate',
  whatsappInquiryTemplate: 'Hello Zafar Sarwar Traders, I calculated my house cement estimate ({bagsRange} bags for {houseSize}, {coveredArea} sq ft, {floors}, {constructionType}). Please provide wholesale bulk delivery quote.',

  // Standard Pakistan plot & area conversions
  sqFtPerMarla: 225,
  houseSizes: [
    {
      id: '3-marla',
      name: '3 Marla',
      marlaCount: 3,
      defaultCoveredAreaSqFt: 1100,
      popular: false,
      description: 'Typical 3 Marla plot (approx. 675 sq ft land, 1,100 sq ft covered area for Double Story)'
    },
    {
      id: '5-marla',
      name: '5 Marla',
      marlaCount: 5,
      defaultCoveredAreaSqFt: 1800,
      popular: true,
      description: 'Standard 5 Marla home (approx. 1,125 sq ft land, 1,800 sq ft covered area for Ground + 1)'
    },
    {
      id: '7-marla',
      name: '7 Marla',
      marlaCount: 7,
      defaultCoveredAreaSqFt: 2500,
      popular: false,
      description: 'Medium 7 Marla residence (approx. 1,575 sq ft land, 2,500 sq ft covered area)'
    },
    {
      id: '10-marla',
      name: '10 Marla',
      marlaCount: 10,
      defaultCoveredAreaSqFt: 3600,
      popular: true,
      description: 'Standard 10 Marla residence (approx. 2,250 sq ft land, 3,600 sq ft covered area)'
    },
    {
      id: '1-kanal',
      name: '1 Kanal',
      marlaCount: 20,
      defaultCoveredAreaSqFt: 5500,
      popular: false,
      description: '1 Kanal Luxury Estate (approx. 4,500 sq ft land, 5,500+ sq ft covered area)'
    },
    {
      id: 'custom',
      name: 'Custom Size',
      defaultCoveredAreaSqFt: 1800,
      popular: false,
      description: 'Enter your custom square footage or specific land measurement'
    }
  ],

  // Base civil engineering calculation factors (Pakistan standard 50kg cement bag)
  baseCementBagsPerSqFt: 0.38, // Standard baseline: ~0.38 - 0.42 bags / sq ft of covered area
  minEstimatePercentage: 0.92, // -8% for lower bound
  maxEstimatePercentage: 1.08, // +8% for upper bound

  constructionTypes: [
    {
      id: 'grey-structure',
      name: 'Grey Structure',
      description: 'Foundation, structural columns, beams, brickwork walls, RCC slabs, and preliminary concrete.',
      multiplier: 1.00,
      badge: 'POPULAR'
    },
    {
      id: 'complete-house',
      name: 'Complete House',
      description: 'Grey structure plus internal plaster, external rough cast, tile fixing cement, screed & plumbing works.',
      multiplier: 1.15,
      badge: 'TURNKEY'
    },
    {
      id: 'renovation',
      name: 'Renovation & Repairs',
      description: 'Structural alterations, floor screed replacements, boundary fixes, and room remodelings.',
      multiplier: 0.40,
      badge: 'MODULAR'
    },
    {
      id: 'extension',
      name: 'Upper Floor Extension',
      description: 'Adding a single new upper floor onto an existing sturdy foundation and ground structure.',
      multiplier: 0.85,
      badge: 'ADDITION'
    }
  ],

  floorsOptions: [
    {
      id: 'ground',
      name: 'Ground Floor Only',
      floorsCount: 1,
      multiplier: 1.00
    },
    {
      id: 'ground-1',
      name: 'Ground + 1 (Double Story)',
      floorsCount: 2,
      multiplier: 1.05
    },
    {
      id: 'ground-2',
      name: 'Ground + 2 (Triple Story)',
      floorsCount: 3,
      multiplier: 1.12
    },
    {
      id: 'custom',
      name: 'Custom Floors',
      floorsCount: 4,
      multiplier: 1.18
    }
  ],

  qualityOptions: [
    {
      id: 'standard',
      name: 'Standard Structure',
      description: 'Standard civil construction using Grade 43/53 Portland cement with standard 1:2:4 ratio mix.',
      multiplier: 1.00,
      badge: 'RECOMMENDED'
    },
    {
      id: 'premium',
      name: 'Premium High-Tensile',
      description: 'Engineered high-load structure with Grade 53 cement, extra reinforced beams, and dense columns.',
      multiplier: 1.08,
      badge: 'HIGH STRENGTH'
    }
  ],

  optionalFactors: [
    {
      id: 'rcc-slab',
      label: 'RCC Heavy Roof Slab / Casted Lintels',
      description: 'Reinforced concrete slabs with heavy gauge steel reinforcement and dense beam spans.',
      percentageAdjustment: 0.08,
      defaultChecked: true
    },
    {
      id: 'basement',
      label: 'Full / Partial Basement Construction',
      description: 'Sub-grade earth retaining walls, moisture-barrier concrete screed, and deep raft foundation.',
      percentageAdjustment: 0.18,
      defaultChecked: false
    },
    {
      id: 'heavy-foundation',
      label: 'Deep Raft / Strip Heavy Foundation',
      description: 'Extra deep footings for sandy/loose soil conditions or multi-story future load expansion.',
      percentageAdjustment: 0.10,
      defaultChecked: false
    },
    {
      id: 'additional-concrete',
      label: 'Overhead Water Tank & Concrete Porch',
      description: 'Monolithic overhead water storage reservoir, car porch slab, and exterior terrace ramps.',
      percentageAdjustment: 0.06,
      defaultChecked: true
    },
    {
      id: 'boundary-wall',
      label: 'Complete Perimeter Boundary Wall',
      description: 'Perimeter boundary walls with concrete tie-beams, pillars, and weather-resistant plaster.',
      percentageAdjustment: 0.05,
      defaultChecked: true
    }
  ],

  // Mandatory Pakistan Disclaimers & Notes
  disclaimerHeading: '⚠️ Ye sirf ek estimated calculation hai. Actual cement requirement is se kam ya zyada ho sakti hai.',
  disclaimerText: 'Actual quantity in cheezon par depend karti hai:',
  engineeringWarningText: 'Final quantity ke liye approved architectural/structural drawings aur qualified engineer ki calculation ko priority dein.',
  factorsList: [
    'Covered area',
    'House ka design aur architectural plan',
    'Floors ki quantity',
    'Foundation ki depth aur design',
    'Soil condition',
    'RCC slab aur structural design',
    'Columns aur beams ka size',
    'Walls aur concrete work',
    'Boundary wall / additional construction',
    'Engineer ki structural specifications',
    'Cement aur concrete mix ratio',
    'Site conditions'
  ],

  // Cement Products in Showroom
  enableCementProducts: true,
  cementCategorySlug: 'cement',
  featuredProductIds: [],
  showPrice: true,
  showAvailability: true
};
