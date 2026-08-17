import { BusinessConfig, ProductCategory, Product, GalleryItem, Review, FaqItem, ProductBrand, StatCounter } from '../types';

export const defaultStatCounters: StatCounter[] = [
  {
    id: 'stat-1',
    title: 'Products Stocked',
    numberValue: 5000,
    suffix: '+',
    iconName: 'Package',
    description: 'Sanitaryware, CPVC/UPVC Piping & Paints',
    displayOrder: 1,
    isHidden: false,
    enableAnimation: true
  },
  {
    id: 'stat-2',
    title: 'Authorized Brands',
    numberValue: 20,
    suffix: '+',
    iconName: 'Building2',
    description: 'Master, Dura Max, Faisal, Nippon & More',
    displayOrder: 2,
    isHidden: false,
    enableAnimation: true
  },
  {
    id: 'stat-3',
    title: 'Years Experience',
    numberValue: 15,
    suffix: '+',
    iconName: 'Award',
    description: 'Trusted since 2011 across Pakistan',
    displayOrder: 3,
    isHidden: false,
    enableAnimation: true
  },
  {
    id: 'stat-4',
    title: 'Happy Customers',
    numberValue: 10000,
    suffix: '+',
    iconName: 'Users',
    description: 'Builders, plumbers & homeowners served',
    displayOrder: 4,
    isHidden: false,
    enableAnimation: true
  }
];

export const productBrands: ProductBrand[] = [
  {
    id: "master",
    name: "Master Sanitary Ware",
    slug: "master",
    logo: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80",
    bannerImage: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80",
    description: "Pakistan's premier luxury sanitaryware & faucet manufacturer, renowned for precision engineering & elegance.",
    isFeatured: true,
    isActive: true,
    displayOrder: 1
  },
  {
    id: "duramax",
    name: "Dura Max Pipes & Fittings",
    slug: "dura-max",
    logo: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=300&q=80",
    bannerImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
    description: "Heavy-duty CPVC, UPVC, & PPR piping systems built for extreme pressure and industrial durability.",
    isFeatured: true,
    isActive: true,
    displayOrder: 2
  },
  {
    id: "primax",
    name: "Primax Sanitaryware",
    slug: "primax",
    logo: "https://images.unsplash.com/photo-1585909692994-394e33917d0d?auto=format&fit=crop&w=300&q=80",
    bannerImage: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
    description: "Modern architectural wash basins, wall-hung closets, and smart bathroom ensembles.",
    isFeatured: true,
    isActive: true,
    displayOrder: 3
  },
  {
    id: "faisal",
    name: "Faisal Sanitary Fittings",
    slug: "faisal",
    logo: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=300&q=80",
    bannerImage: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80",
    description: "Durable pure brass faucets, mixers, shower columns, and luxury chrome fittings.",
    isFeatured: true,
    isActive: true,
    displayOrder: 4
  },
  {
    id: "nippon",
    name: "Nippon Paints & Coatings",
    slug: "nippon",
    logo: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=300&q=80",
    bannerImage: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=1200&q=80",
    description: "Advanced weather-proof exterior emulsions, luxury velvet interior finishes, and protective primers.",
    isFeatured: true,
    isActive: true,
    displayOrder: 5
  },
  {
    id: "popular",
    name: "Popular Pipes & Fittings",
    slug: "popular",
    logo: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80",
    bannerImage: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80",
    description: "Trusted nationwide for agricultural, plumbing, and sewage UPVC pipe infrastructure.",
    isFeatured: true,
    isActive: true,
    displayOrder: 6
  }
];

export const initialBusinessConfig: BusinessConfig = {
  name: "ZAFAR SARWAR TRADERS",
  tagline: "Premium Sanitary, Plumbing & Construction Solutions",
  address: "Jhang Road, Jhummrah Chowk, Chiniot, Punjab, Pakistan",
  phone: "+92 310 8002863",
  whatsapp: "+92 310 8002863",
  salesWhatsapp: "+92 310 8002863",
  orderWhatsapp: "+92 310 8002863",
  supportWhatsapp: "+92 310 8002863",
  deliveryPhone: "+92 310 8002863",
  email: "info@zafarsarwartraders.com",
  hoursWeekday: "Monday – Saturday: 8:00 AM – 9:00 PM",
  hoursSunday: "Sunday: 10:00 AM – 6:00 PM",
  openingTime: "08:00 AM",
  closingTime: "09:00 PM",
  workingDays: "Monday – Saturday",
  cutOffTime: "04:00 PM",
  isHolidayNotice: false,
  holidayNoticeText: "Showroom open for regular business hours",
  googleMapEmbedUrl: "https://maps.google.com/maps?q=https://maps.app.goo.gl/NKv1i28dGbyLzudR6&output=embed",
  privacyPolicy: "Zafar Sarwar Traders respects your privacy. All customer profile details, delivery addresses, and WhatsApp contact numbers are stored securely for order processing and account services.",
  termsConditions: "All luxury sanitaryware and fittings carry official manufacturer warranty. Prices are subject to market adjustments. Items must be inspected upon delivery.",
  returnPolicy: "Undamaged products in original factory packaging may be returned or exchanged within 7 days of receipt with sales invoice.",
  shippingPolicy: "Direct showroom truck delivery available for Chiniot, Faisalabad, Sargodha, and Lahore. Nationwide courier/cargo dispatch available across Pakistan. Same-day dispatch for orders placed before 4:00 PM."
};

export const productCategories: ProductCategory[] = [
  {
    id: "bathroom-accessories",
    name: "Bathroom Accessories",
    description: "Towel rails, soap dispensers, tumbler holders, robe hooks, and toilet paper holders in brushed nickel and matte black.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    itemCount: 85,
    badge: "Brushed & Matte",
    iconName: "Sparkles",
    group: "sanitary"
  },
  {
    id: "luxury-bathroom-sets",
    name: "Luxury Bathroom Sets",
    description: "Complete matching sanitaryware ensembles featuring wall-hung closets, designer basins, and color-matched fittings.",
    image: "https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=800&q=80",
    itemCount: 42,
    badge: "Flagship Collection",
    iconName: "Crown",
    group: "sanitary"
  },
  {
    id: "wash-basins",
    name: "Wash Basins",
    description: "Countertop ceramic vessels, under-mount sinks, pedestal basins, and hand-carved natural marble basins.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    itemCount: 120,
    badge: "Italian Designs",
    iconName: "Maximize2",
    group: "sanitary"
  },
  {
    id: "designer-faucets",
    name: "Designer Faucets",
    description: "Thermostatic basin mixers, waterfall cascades, wall-mounted tall faucets, and sensor taps.",
    image: "https://images.unsplash.com/photo-1585909692994-394e33917d0d?auto=format&fit=crop&w=800&q=80",
    itemCount: 150,
    badge: "Brass Body 10 Yr Warranty",
    iconName: "Droplet",
    group: "faucets_showers"
  },
  {
    id: "kitchen-faucets",
    name: "Kitchen Faucets",
    description: "Pull-down spray heads, dual-mode aerator spouts, flexi-neck mixers, and heavy-duty stainless steel taps.",
    image: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80",
    itemCount: 64,
    badge: "Chef Edition",
    iconName: "Utensils",
    group: "faucets_showers"
  },
  {
    id: "rain-showers",
    name: "Rain Showers",
    description: "Ultra-thin stainless steel ceiling rain panels, LED color-changing showers, and cascade water fall plates.",
    image: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80",
    itemCount: 58,
    badge: "Hydro Spa Experience",
    iconName: "CloudRain",
    group: "faucets_showers"
  },
  {
    id: "shower-systems",
    name: "Shower Systems",
    description: "Concealed 3-way thermostatic diverters, body jets, sliding rail handheld showers, and digital temperature controls.",
    image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
    itemCount: 38,
    badge: "Thermostatic",
    iconName: "Sliders",
    group: "faucets_showers"
  },
  {
    id: "toilets",
    name: "Toilets",
    description: "Rimless wall-hung closets, floor-mounted smart bidets, pneumatic dual-flush tanks, and soft-close seats.",
    image: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&w=800&q=80",
    itemCount: 95,
    badge: "Nano Glaze Hygienic",
    iconName: "Box",
    group: "sanitary"
  },
  {
    id: "commode",
    name: "Commode",
    description: "One-piece coupled WC suites, s-trap and p-trap ceramic toilets engineered for silent eco-flush action.",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    itemCount: 72,
    badge: "Eco Flush Tech",
    iconName: "Shield",
    group: "sanitary"
  },
  {
    id: "vanity-cabinets",
    name: "Vanity Cabinets",
    description: "Waterproof plywood & stone composite vanity units with drawer dividers, LED mirrors, and quartz tops.",
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    itemCount: 48,
    badge: "100% Waterproof",
    iconName: "Grid",
    group: "sanitary"
  },
  {
    id: "bathroom-mirrors",
    name: "Bathroom Mirrors",
    description: "Smart anti-fog touch LED mirrors, bluetooth speakers, ambient backlighting, and copper-free HD glass.",
    image: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=800&q=80",
    itemCount: 52,
    badge: "Smart Anti-Fog",
    iconName: "Sun",
    group: "sanitary"
  },
  {
    id: "water-pumps",
    name: "Water Pumps",
    description: "High-pressure automatic booster pumps, submersible borehole pumps, self-priming monoblocks, and silent inverter units.",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    itemCount: 36,
    badge: "Italian Motor Coil",
    iconName: "Zap",
    group: "plumbing"
  },
  {
    id: "pvc-pipes",
    name: "PVC Pipes",
    description: "Heavy-duty underground drainage pipes, soil waste & rainwater piping systems with leak-proof rubber ring seals.",
    image: "https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=800&q=80",
    itemCount: 110,
    badge: "Class B & D Certified",
    iconName: "Layers",
    group: "plumbing"
  },
  {
    id: "upvc-pipes",
    name: "UPVC Pipes",
    description: "Unplasticized PVC pressure pipes for cold water distribution, chemical resistance, and non-corrosive lifetime strength.",
    image: "https://images.unsplash.com/photo-1600585152220-90363fe7e115?auto=format&fit=crop&w=800&q=80",
    itemCount: 90,
    badge: "ISO 9001 Standard",
    iconName: "Layers",
    group: "plumbing"
  },
  {
    id: "cpvc-pipes",
    name: "CPVC Pipes",
    description: "High-temperature hot & cold plumbing pipework resistant up to 93°C, NSF certified for pure drinking water safety.",
    image: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80",
    itemCount: 88,
    badge: "Hot Water Certified",
    iconName: "Flame",
    group: "plumbing"
  },
  {
    id: "water-tanks",
    name: "Water Tanks",
    description: "Multi-layer anti-bacterial overhead water storage tanks, insulated UV-resistant tanks, and food-grade polyethylene.",
    image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
    itemCount: 28,
    badge: "5-Layer Thermal Guard",
    iconName: "Database",
    group: "plumbing"
  },
  {
    id: "plumbing-accessories",
    name: "Plumbing Accessories",
    description: "Brass ball valves, concealed stop cocks, floor drains with insect flap anti-odor trap, Teflon tapes, and solvent cements.",
    image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
    itemCount: 220,
    badge: "Commercial Grade",
    iconName: "Wrench",
    group: "plumbing"
  },
  {
    id: "paints",
    name: "Paints",
    description: "Ultra-durable exterior weather defense, luxury interior silk emulsions, anti-fungal acrylics, and metallic texture coatings.",
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
    itemCount: 350,
    badge: "10,000+ Custom Shades",
    iconName: "Palette",
    group: "paints_materials"
  },
  {
    id: "wall-putty",
    name: "Wall Putty",
    description: "White cement based smooth acrylic wall putty, water resistant primer coatings, and skim coat plaster.",
    image: "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=800&q=80",
    itemCount: 30,
    badge: "Velvet Smooth Finish",
    iconName: "Feather",
    group: "paints_materials"
  },
  {
    id: "cement",
    name: "Cement",
    description: "Ordinary Portland Cement (OPC 53 Grade), Sulphate Resistant Cement (SRC), and quick-setting structural cement.",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    itemCount: 18,
    badge: "Grade 53 Fresh Stocks",
    iconName: "Package",
    group: "construction"
  },
  {
    id: "sand",
    name: "Sand",
    description: "Washed river bed sand, Chenab fine sand, and sharp concrete sand thoroughly screened for optimal slab strength.",
    image: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=800&q=80",
    itemCount: 12,
    badge: "Screened Pure River Sand",
    iconName: "Sun",
    group: "construction"
  },
  {
    id: "crush",
    name: "Crush",
    description: "Margalla crushed gravel aggregate (1/2 inch & 3/4 inch), Sargodha blue stone aggregate for high compressive strength concrete.",
    image: "https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80",
    itemCount: 15,
    badge: "Margalla & Sargodha Grade",
    iconName: "HardHat",
    group: "construction"
  },
  {
    id: "construction-materials",
    name: "Construction Materials",
    description: "Deformed steel rebar (Grade 60), waterproofing bitumen membranes, expansion joints, and concrete additives.",
    image: "https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=800&q=80",
    itemCount: 75,
    badge: "Structural Grade",
    iconName: "Building2",
    group: "construction"
  },
  {
    id: "building-accessories",
    name: "Building Accessories",
    description: "Tile adhesives, epoxy grouts, scaffolding clamps, safety nets, wire mesh, and diamond cutting blades.",
    image: "https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80",
    itemCount: 140,
    badge: "Heavy Duty Tooling",
    iconName: "Tool",
    group: "construction"
  }
];

export const featuredProducts: Product[] = [
  {
    id: "prod-1",
    name: "Hansgrohe Axor Raindance Select 360 Thermostatic System",
    category: "Rain Showers",
    categoryId: "rain-showers",
    price: "PKR 185,000",
    rating: 4.9,
    reviewsCount: 38,
    image: "/src/assets/images/luxury_showroom_hero_1785655655475.jpg",
    description: "German-engineered overhead rain panel with integrated waterfall jet, concealed thermostatic brass cartridge, and anti-scald micro-sensors.",
    features: ["AirPower Technology", "Thermostatic 38°C Safety Lock", "EasyClean Silicone Nozzles", "12-Year Warranty"],
    specs: {
      "Finish": "Matte Black & Rose Gold",
      "Flow Rate": "14 L/min at 3 Bar",
      "Material": "Solid Brass Body",
      "Diverter": "3-Way Push Button Select"
    },
    isFeatured: true,
    isNew: true,
    badge: "LUXURY",
    brand: "Hansgrohe / Axor",
    availableFinishes: ["Matte Black", "Brushed Gold", "Chrome"],
    videos: [
      {
        id: "vid-1a",
        title: "Hansgrohe Axor Raindance Live Demonstration",
        type: "youtube",
        url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      },
      {
        id: "vid-1b",
        title: "Thermostatic Water Flow & Pressure Testing",
        type: "mp4",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4"
      }
    ]
  },
  {
    id: "prod-2",
    name: "Porsche Design Waterfall Cascading Vessel Faucet",
    category: "Designer Faucets",
    categoryId: "designer-faucets",
    price: "PKR 42,500",
    rating: 4.8,
    reviewsCount: 24,
    image: "/src/assets/images/luxury_faucet_shower_1785655667949.jpg",
    description: "Single-lever tall countertop basin faucet featuring an open-channel waterfall stream and precise aerated flow control.",
    features: ["Open Channel Waterfall", "Ceramic Disc Cartridge", "Fingerprint-Resistant PVD Coating"],
    specs: {
      "Height": "320 mm",
      "Spout Reach": "145 mm",
      "Warranty": "10 Years Replacement"
    },
    isFeatured: true,
    isNew: true,
    badge: "NEW",
    brand: "Kohler / Grohe",
    availableFinishes: ["Matte Black", "Brushed Brass", "Polished Chrome"],
    videos: [
      {
        id: "vid-2a",
        title: "Porsche Waterfall Faucet Stream & Finish Showcase",
        type: "mp4",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
      }
    ]
  },
  {
    id: "prod-3",
    name: "Royal Ceramic Wall-Hung Rimless WC Suite + Bidet Spray",
    category: "Toilets",
    categoryId: "toilets",
    price: "PKR 78,000",
    rating: 4.9,
    reviewsCount: 52,
    image: "https://images.unsplash.com/photo-1564540586988-aa4e53c3d799?auto=format&fit=crop&w=800&q=80",
    description: "Ultra-sleek wall-hung toilet with silent rimless dual-swirl flushing technology and anti-bacterial silver-ion glaze.",
    features: ["Rimless Vortex Flush", "UF Soft Close Quick-Release Seat", "Concealed Pneumatic Cistern Included"],
    specs: {
      "Dimensions": "540 x 360 x 350 mm",
      "Water Consumption": "3L / 4.5L Dual Flush",
      "Load Rating": "400 kg Tested"
    },
    isFeatured: true,
    badge: "BESTSELLER",
    brand: "TOTO / Roca",
    availableFinishes: ["Matte White", "Gloss White", "Matte Black"],
    videos: [
      {
        id: "vid-3a",
        title: "TOTO Rimless Vortex Flush System Video",
        type: "youtube",
        url: "https://www.youtube.com/watch?v=LXb3EKWsInQ"
      }
    ]
  },
  {
    id: "prod-4",
    name: "Italian Nero Marquina Marble Double Vanity Console",
    category: "Vanity Cabinets",
    categoryId: "vanity-cabinets",
    price: "PKR 245,000",
    rating: 5.0,
    reviewsCount: 17,
    image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
    description: "100% waterproof marine plywood vanity with quartz counter, dual under-mount ceramic sinks, and soft-close Blum drawers.",
    features: ["Solid Quartz Countertop", "Soft-Close Blum Hardware", "Backlit Mirror Included", "Zero Swelling Guarantee"],
    specs: {
      "Width": "1800 mm (Custom sizes available)",
      "Finish": "Nero Marquina / Walnut Wood",
      "Hardware": "Brushed Gold Handles"
    },
    isFeatured: true,
    badge: "LUXURY",
    brand: "Zafar Signature Custom",
    videos: [
      {
        id: "vid-4a",
        title: "Waterproof Vanity Craftsmanship & Blum Drawer Testing",
        type: "mp4",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4"
      }
    ]
  },
  {
    id: "prod-5",
    name: "Master Weather-Shield Anti-Fungal Exterior Luxury Emulsion",
    category: "Paints",
    categoryId: "paints",
    price: "PKR 16,500 / Bucket",
    rating: 4.7,
    reviewsCount: 43,
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
    description: "100% pure acrylic cross-linking exterior paint offering 15 years against UV fading, rain erosion, and algae growth.",
    features: ["Flexi-Elastic Crack Bridging", "High Heat Reflection", "Eco VOC Compliant", "Custom Tinting Available"],
    specs: {
      "Pack Sizes": "4 Liters / 16 Liters",
      "Coverage": "120-140 sq.ft per liter",
      "Dry Time": "2 Hours"
    },
    isFeatured: true,
    badge: "PREMIUM GRADE",
    brand: "Dulux / Master / Berger",
    videos: [
      {
        id: "vid-5a",
        title: "Weather Shield Hydrophobic Rain Resistance Demo",
        type: "mp4",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4"
      }
    ]
  },
  {
    id: "prod-6",
    name: "FlowGuard Gold CPVC Schedule 80 Hot & Cold Piping System",
    category: "CPVC Pipes",
    categoryId: "cpvc-pipes",
    price: "Call for Wholesale Rate",
    rating: 4.8,
    reviewsCount: 65,
    image: "/src/assets/images/building_materials_display_1785655681621.jpg",
    description: "High-temperature resistant NSF-certified CPVC pipes & heavy brass fittings engineered for zero scaling and zero corrosion.",
    features: ["Resists Up to 93°C", "NSF-61 Drinking Water Certified", "Solvent-Welded Leak Proof"],
    specs: {
      "Sizes": "1/2 inch to 3 inch SDR 11 & Sch 80",
      "Pressure Rating": "400 PSI @ 23°C",
      "Life Expectancy": "50+ Years"
    },
    isFeatured: true,
    badge: "IMPACT RESISTANT",
    brand: "FlowGuard / Master Pipe",
    videos: [
      {
        id: "vid-6a",
        title: "CPVC Pressure Testing & Solvent Weld Video",
        type: "mp4",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4"
      }
    ]
  },
  {
    id: "prod-7",
    name: "Ordinary Portland Cement OPC Grade 53 (Fresh Factory Batch)",
    category: "Cement",
    categoryId: "cement",
    price: "Wholesale Rate on Request",
    rating: 4.9,
    reviewsCount: 89,
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80",
    description: "High compressive strength cement ideal for multi-story slab casting, columns, beams, and pre-stressed concrete structures.",
    features: ["Rapid Strength Gain", "Low Heat of Hydration", "Fresh Daily Supply Guaranteed"],
    specs: {
      "Weight": "50 kg Paper / PP Bag",
      "Standard": "PSQCA / ASTM C150 Type I",
      "Compressive Strength": "> 53 MPa at 28 days"
    },
    isFeatured: true,
    badge: "BESTSELLER",
    brand: "Bestway / Maple Leaf / Pioneer",
    videos: []
  },
  {
    id: "prod-8",
    name: "Thermostatic 3-Way Concealed Body Jet Shower Set",
    category: "Shower Systems",
    categoryId: "shower-systems",
    price: "PKR 125,000",
    rating: 4.9,
    reviewsCount: 31,
    image: "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=800&q=80",
    description: "Concealed wall-mount valve with 6 directional swivel massage body jets, hand shower, and overhead waterfall spout.",
    features: ["6 Swivel Massage Body Jets", "Scald Protection Ceramic Core", "Ultra-Slim Stainless Overhead Panel"],
    specs: {
      "Inlet Size": "1/2 inch NPT",
      "Working Pressure": "0.15 - 0.6 MPa",
      "Finish": "Brushed Titanium Black"
    },
    isFeatured: true,
    isNew: true,
    badge: "NEW",
    brand: "Grohe / Hansgrohe",
    videos: [
      {
        id: "vid-8a",
        title: "Thermostatic Body Jet Spa Installation Video",
        type: "mp4",
        url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreet.mp4"
      }
    ]
  }
];

export const galleryItems: GalleryItem[] = [
  {
    id: "gal-1",
    title: "Minimalist Italian Matte Black Suite",
    category: "sanitary",
    image: "/src/assets/images/luxury_showroom_hero_1785655655475.jpg",
    description: "Showroom display featuring floating black vanity, concealed thermostatic shower system, and ambient LED wall coves."
  },
  {
    id: "gal-2",
    title: "Brushed Gold Cascading Faucet Display",
    category: "faucets",
    image: "/src/assets/images/luxury_faucet_shower_1785655667949.jpg",
    description: "Interactive water test bench in our showroom showcasing real water pressure and smooth single-lever mixers."
  },
  {
    id: "gal-3",
    title: "Building Materials & Structural Supplies Hub",
    category: "materials",
    image: "/src/assets/images/building_materials_display_1785655681621.jpg",
    description: "Dedicated warehouse floor stocking grade 53 cement, CPVC pipework, paints, and high tensile steel reinforcement."
  },
  {
    id: "gal-4",
    title: "Luxury Organic Stone Vessel Sink & Mirror",
    category: "sanitary",
    image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
    description: "Hand-carved river stone countertop basin paired with tall wall-mounted thermostatic spout."
  },
  {
    id: "gal-5",
    title: "Designer Color Palette & Silk Paints Wall",
    category: "paints",
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?auto=format&fit=crop&w=800&q=80",
    description: "Computerized shade mixing unit with live physical samples for interior designers and architects."
  },
  {
    id: "gal-6",
    title: "Modern Master Spa Rain Shower Enclosure",
    category: "sanitary",
    image: "https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=800&q=80",
    description: "Flush ceiling mounted 500x500mm rain and cascade shower panel with remote controlled RGB mood lighting."
  }
];

export const customerReviews: Review[] = [
  {
    id: "rev-1",
    name: "Chaudhry Tariq Mahmood",
    role: "Property Developer & Architect",
    location: "Bahria Town, Phase 8",
    projectType: "5-Villa Luxury Estate Project",
    rating: 5,
    comment: "Zafar Sarwar Traders supplied all sanitaryware, Hansgrohe showers, and CPVC piping for my 5-villa project. Their prices are direct wholesale, products 100% genuine, and delivery on time. Absolutely world-class team!",
    date: "July 2026"
  },
  {
    id: "rev-2",
    name: "Dr. Shahida Rizwan",
    role: "Homeowner",
    location: "DHA Phase 6",
    projectType: "Modern Master Bathroom Remodel",
    rating: 5,
    comment: "I was looking for custom matte black faucets and a waterproof marble vanity. The team at Zafar Sarwar Traders guided me patiently and sent specs via WhatsApp within 5 minutes. The finish in my master bath is like a 7-star hotel!",
    date: "June 2026"
  },
  {
    id: "rev-3",
    name: "Engr. Salman Farooq",
    role: "Chief Civil Engineer",
    location: "Commercial Plaza Project",
    projectType: "6-Story Commercial Building",
    rating: 5,
    comment: "From 53-grade fresh cement bags and Margalla crush to heavy-duty UPVC drainage pipes, Zafar Sarwar Traders handled all building material logistics flawlessly. Reliable quality every single order.",
    date: "May 2026"
  }
];

export const faqItems: FaqItem[] = [
  {
    id: "faq-1",
    category: "Sanitaryware & Showroom",
    question: "Are your sanitaryware products and faucets 100% original with manufacturer warranty?",
    answer: "Yes, 100%. We are authorized stockists for top global and premium brands (Hansgrohe, Grohe, TOTO, Kohler, Master, etc.). Every sanitary fixture comes with official manufacturer warranty certificates ranging from 5 to 12 years."
  },
  {
    id: "faq-2",
    category: "Orders & WhatsApp",
    question: "How do I inquire about prices and place an order?",
    answer: "Simply click the 'Get Price on WhatsApp' button next to any product on our website, or use our floating WhatsApp button. You can also send us your layout map or item list, and our team will generate an instant itemized quotation."
  },
  {
    id: "faq-3",
    category: "Plumbing & Construction",
    question: "Do you supply bulk construction materials like Cement, CPVC/UPVC Pipes, and Crush?",
    answer: "Yes! We specialize in both retail luxury fittings and heavy bulk commercial supplies. We stock Grade 53 cement, river sand, Margalla crush, steel rebars, and NSF-certified CPVC/PPR pipes with site delivery trucks available."
  },
  {
    id: "faq-4",
    category: "Delivery & Logistics",
    question: "What is your delivery coverage area?",
    answer: "We provide same-day or next-day direct site delivery across Chiniot, Faisalabad, Sargodha, Lahore, and nationwide courier/cargo dispatch across Pakistan."
  },
  {
    id: "faq-5",
    category: "Consultation & Services",
    question: "Can I bring my house architectural blueprint for plumbing and sanitary estimation?",
    answer: "Absolutely! Visit our modern showroom or send your floor plans via WhatsApp. Our in-house plumbing and interior specialists will map out pipe sizing, pressure pumps, and fitting quantities for free."
  }
];
