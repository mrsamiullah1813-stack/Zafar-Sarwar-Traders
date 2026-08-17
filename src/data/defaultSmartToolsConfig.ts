import { SmartToolsSettings } from '../types';

export const defaultSmartToolsSettings: SmartToolsSettings = {
  isEnabled: true,
  sectionTitle: "Smart Construction & Bathroom Tools",
  sectionUrduTitle: "اسمارٹ اسٹور ٹولز — آن لائن کیلکولیٹر اور گائیڈ",
  sectionSubtitle: "Calculate accurate cement bags, plan complete bathroom fixture packages, check water tank & pump capacities, or match products to your exact budget.",
  sectionBadge: "Interactive Store Utilities",
  tools: [
    {
      id: "cement-calculator",
      title: "Cement Calculator",
      urduTitle: "سیمنٹ کیلکولیٹر",
      tagline: "Estimate approximate cement requirement for your home or project.",
      description: "Quickly estimate total cement bags needed based on Pakistani house size (Marla / Kanal), covered area, and single or double storey construction.",
      badge: "Pakistani Marla Presets",
      iconName: "HardHat",
      buttonText: "Open Cement Calculator",
      isEnabled: true,
      showOnHomepage: true,
      displayOrder: 1,
      disclaimer: "Ye sirf general estimate hai. Actual requirement design, structure, foundation, slab, walls, concrete ratio, steel quantity, soil condition, construction method aur site requirements ke mutabiq kam ya zyada ho sakti hai. Final quantity ke liye qualified engineer/contractor se confirm karein."
    },
    {
      id: "bathroom-planner",
      title: "Bathroom Planner",
      urduTitle: "باتھ روم پلانر",
      tagline: "Plan fixtures, styles, and full bathroom packages easily.",
      description: "Select your bathroom type (Master, Guest, Standard), required items (Toilet, Basin, Shower, Faucets), style & finishes to get a complete curated package.",
      badge: "Visual Package Builder",
      iconName: "ShowerHead",
      buttonText: "Open Bathroom Planner",
      isEnabled: true,
      showOnHomepage: true,
      displayOrder: 2,
      disclaimer: "Product rates are based on current showroom catalog. Final plumbing installation accessories and labor are estimated separately."
    },
    {
      id: "material-estimator",
      title: "Material Estimator",
      urduTitle: "میٹیریل تخمینہ",
      tagline: "Estimate approximate construction materials.",
      description: "Comprehensive estimator covering Grey Structure materials including Bricks, Sand (Chenab/Ravi), Crush (Margalla/Sargodha), Steel (Grade 60), and Cement.",
      badge: "Grey Structure Breakdown",
      iconName: "Calculator",
      buttonText: "Open Material Estimator",
      isEnabled: true,
      showOnHomepage: true,
      displayOrder: 3,
      disclaimer: "Construction material rates and quantities fluctuate based on architectural drawings, RCC slab thickness, and soil bearing capacity."
    },
    {
      id: "bathroom-budget-finder",
      title: "Bathroom Budget Finder",
      urduTitle: "باتھ روم بجٹ فائنڈر",
      tagline: "Find suitable bathroom products according to your budget.",
      description: "Tell us your budget (e.g. Rs. 50k, 100k, 200k+) and bathroom type to instantly match with real in-stock vanity sets, commodes, faucets, and showers.",
      badge: "Budget-Friendly Matcher",
      iconName: "DollarSign",
      buttonText: "Open Budget Finder",
      isEnabled: true,
      showOnHomepage: true,
      displayOrder: 4,
      disclaimer: "All package recommendations query live store prices. Options can be customized or added directly to cart / WhatsApp order."
    },
    {
      id: "water-tank-pump-guide",
      title: "Water Tank & Pump Guide",
      urduTitle: "پانی کا ٹینک اور پمپ گائیڈ",
      tagline: "Get an approximate tank and pump recommendation.",
      description: "Calculate optimal overhead water tank size (Gallons/Liters) and water pump / pressure motor horsepower (HP) based on family size and number of floors.",
      badge: "Capacity & Motor Guide",
      iconName: "Droplet",
      buttonText: "Open Water Guide",
      isEnabled: true,
      showOnHomepage: true,
      displayOrder: 5,
      disclaimer: "Final tank aur pump selection building height, water source, pipe length, pressure aur site conditions par depend karti hai. Final installation ke liye qualified plumber/engineer se confirm karein."
    }
  ]
};
