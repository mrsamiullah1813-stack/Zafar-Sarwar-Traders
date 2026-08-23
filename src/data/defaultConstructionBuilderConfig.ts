import { ConstructionBuilderConfig } from '../types';

export const defaultConstructionBuilderConfig: ConstructionBuilderConfig = {
  isEnabled: true,
  title: "Smart Construction & Fitting Builder",
  subtitle: "Select your project, choose materials, select sizes and quantities, and build your custom package.",
  heroHeading: "Smart Construction & Fitting Builder",
  heroSubheading: "Select your project, choose materials, select sizes and quantities, and build your custom package.",
  heroBadge: "Custom Sanitary & Fitting Packages",
  entryCardBadge: "Package Builder",
  whatsappNumber: "923108002863",
  whatsappDisclaimerNote: "Please confirm availability, current brand rates, and delivery schedule on WhatsApp.",
  pipeTypes: ['UPVC', 'PVC', 'PPR', 'HDPE', 'CPVC', 'GI', 'CI'],
  commonUnits: ['Piece', 'Length (13 ft)', 'Length (20 ft)', 'Length (10 ft)', 'Foot', 'Meter', 'Roll (50m)', 'Roll (100m)', 'Bundle', 'Pack (10 pcs)'],
  
  packageTypes: [
    {
      id: 'pkg-bathroom',
      name: '🚿 Bathroom Plumbing Package',
      slug: 'bathroom-plumbing',
      subtitle: 'Complete concealed & exposed sanitary piping, CP fittings and waste lines for modern bathrooms',
      description: 'Select hot & cold water pipes, CP chrome brass elbows, tees, unions, waste pipes, and fixture connections.',
      iconName: 'ShowerHead',
      badge: 'Most Popular',
      recommendedCategoryIds: ['cat-pipes', 'cat-cp-fittings', 'cat-valves', 'cat-bathroom-acc'],
      enabled: true,
      isFeatured: true,
      sortOrder: 1
    },
    {
      id: 'pkg-pump',
      name: '💧 Pump Installation Package',
      slug: 'pump-installation',
      subtitle: 'Heavy-duty suction & delivery fittings, brass non-return valves, unions, and antivibration joints',
      description: 'Build complete water pump connection kits with foot valves, check valves, unions, and high-pressure lines.',
      iconName: 'Droplet',
      badge: 'High Pressure',
      recommendedCategoryIds: ['cat-pump-acc', 'cat-valves', 'cat-pipes', 'cat-ci-fittings'],
      enabled: true,
      isFeatured: true,
      sortOrder: 2
    },
    {
      id: 'pkg-watertank',
      name: '🚰 Water Tank Fitting Package',
      slug: 'water-tank-fitting',
      subtitle: 'Inlet, outlet, overflow, brass float ball-cock valve, and air-vent connections for rooftop tanks',
      description: 'Everything required to connect overhead plastic or concrete water tanks securely without leakage.',
      iconName: 'Boxes',
      badge: 'Essential',
      recommendedCategoryIds: ['cat-tank-acc', 'cat-valves', 'cat-upvc-fittings', 'cat-pipes'],
      enabled: true,
      isFeatured: true,
      sortOrder: 3
    },
    {
      id: 'pkg-house',
      name: '🏠 House Plumbing Package',
      slug: 'house-plumbing',
      subtitle: 'Full-house sanitary, drainage, water supply, and sewer line packages for 3, 5, 10 Marla & 1 Kanal houses',
      description: 'Comprehensive package builder for grey structure plumbing, main supply lines, and sanitary drainage.',
      iconName: 'Home',
      badge: 'Complete Solution',
      recommendedCategoryIds: ['cat-pipes', 'cat-upvc-fittings', 'cat-ppr-fittings', 'cat-valves', 'cat-bathroom-acc'],
      enabled: true,
      isFeatured: true,
      sortOrder: 4
    },
    {
      id: 'pkg-cp',
      name: '🔧 CP Fittings Package',
      slug: 'cp-fittings',
      subtitle: 'Luxury chrome-plated solid brass fittings, extension nipples, sockets, plugs and connectors',
      description: 'Precision engineered CP brass fittings for elegant washbasin and shower mixer connections.',
      iconName: 'Wrench',
      badge: 'Chrome Brass',
      recommendedCategoryIds: ['cat-cp-fittings', 'cat-valves'],
      enabled: true,
      isFeatured: false,
      sortOrder: 5
    },
    {
      id: 'pkg-ci',
      name: '⚙️ CI Fittings Package',
      slug: 'ci-fittings',
      subtitle: 'Cast iron & malleable iron threaded fittings, heavy industrial elbows, tees, unions and flanges',
      description: 'High-strength cast iron piping components for industrial and high-load plumbing applications.',
      iconName: 'Settings',
      badge: 'Heavy Duty',
      recommendedCategoryIds: ['cat-ci-fittings', 'cat-valves', 'cat-pipes'],
      enabled: true,
      isFeatured: false,
      sortOrder: 6
    },
    {
      id: 'pkg-pipes-fittings',
      name: '🏗️ Pipe & Fittings Package',
      slug: 'pipe-and-fittings',
      subtitle: 'Combined bulk UPVC, PPR, and PVC pipe bundles with matching standard elbows, tees and reducers',
      description: 'Direct pairing of delivery lengths with matching fittings for contractors and building sites.',
      iconName: 'Building2',
      badge: 'Site Bundle',
      recommendedCategoryIds: ['cat-pipes', 'cat-upvc-fittings', 'cat-ppr-fittings'],
      enabled: true,
      isFeatured: false,
      sortOrder: 7
    },
    {
      id: 'pkg-contractor',
      name: '🛠️ Contractor Package',
      slug: 'contractor-package',
      subtitle: 'Bulk trade discounts for master plumbers, civil contractors, and construction supervisors',
      description: 'Order wholesale bundles of pipes, fittings, valves, solvent cement, and installation clamps.',
      iconName: 'HardHat',
      badge: 'Wholesale Rates',
      recommendedCategoryIds: ['cat-pipes', 'cat-upvc-fittings', 'cat-cp-fittings', 'cat-valves', 'cat-tank-acc', 'cat-bathroom-acc'],
      enabled: true,
      isFeatured: false,
      sortOrder: 8
    },
    {
      id: 'pkg-custom',
      name: '📦 Custom Package',
      slug: 'custom-package',
      subtitle: 'Pick and choose freely across all pipes, fittings, valves, and accessories for any custom job',
      description: 'Full catalog freedom. Mix and match any size, material, or fitting type with live price calculation.',
      iconName: 'Package',
      badge: 'Flexible',
      recommendedCategoryIds: ['cat-pipes', 'cat-cp-fittings', 'cat-ci-fittings', 'cat-upvc-fittings', 'cat-ppr-fittings', 'cat-valves', 'cat-tank-acc', 'cat-pump-acc', 'cat-bathroom-acc'],
      enabled: true,
      isFeatured: false,
      sortOrder: 9
    }
  ],

  categories: [
    {
      id: 'cat-pipes',
      name: '🚰 Pipes (PPR, UPVC, PVC, GI)',
      slug: 'pipes',
      description: 'Water supply, drainage, and borehole pipes in standard lengths and rolls',
      iconName: 'Pipette',
      image: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=600&q=80',
      sortOrder: 1,
      enabled: true
    },
    {
      id: 'cat-cp-fittings',
      name: '🔧 CP Brass Fittings',
      slug: 'cp-fittings',
      description: 'Chrome-plated solid brass nipples, sockets, elbows, tees, and plugs',
      iconName: 'Wrench',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      sortOrder: 2,
      enabled: true
    },
    {
      id: 'cat-ci-fittings',
      name: '⚙️ CI / GI Iron Fittings',
      slug: 'ci-fittings',
      description: 'Cast iron and galvanized malleable iron threaded heavy duty fittings',
      iconName: 'Settings',
      image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
      sortOrder: 3,
      enabled: true
    },
    {
      id: 'cat-upvc-fittings',
      name: '🚰 UPVC & PVC Fittings',
      slug: 'upvc-fittings',
      description: 'High pressure solvent-weld elbows, tees, sockets, reducers and unions',
      iconName: 'Layers',
      image: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=600&q=80',
      sortOrder: 4,
      enabled: true
    },
    {
      id: 'cat-ppr-fittings',
      name: '🟢 PPR Hot & Cold Fittings',
      slug: 'ppr-fittings',
      description: 'Fusion weld PPR plain and brass-threaded inserts for concealed hot water lines',
      iconName: 'Disc',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      sortOrder: 5,
      enabled: true
    },
    {
      id: 'cat-valves',
      name: '🔴 Valves & Flow Controls',
      slug: 'valves',
      description: 'Heavy brass gate valves, ball valves, check valves, and foot valves',
      iconName: 'Gauge',
      image: 'https://images.unsplash.com/photo-1504917599217-d4dc5ebe6122?auto=format&fit=crop&w=600&q=80',
      sortOrder: 6,
      enabled: true
    },
    {
      id: 'cat-tank-acc',
      name: '💧 Water Tank Accessories',
      slug: 'water-tank-accessories',
      description: 'Tank nipples, float ball-cock valves, overflow adaptors and tank unions',
      iconName: 'Boxes',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      sortOrder: 7,
      enabled: true
    },
    {
      id: 'cat-pump-acc',
      name: '⚡ Pump Installation Kits',
      slug: 'pump-accessories',
      description: 'Vibration dampers, suction hoses, pressure gauges and brass check valves',
      iconName: 'Zap',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      sortOrder: 8,
      enabled: true
    },
    {
      id: 'cat-bathroom-acc',
      name: '🛁 Sanitary & Pipe Accessories',
      slug: 'bathroom-accessories',
      description: 'Teflon tapes, PVC solvent cements, pipe clamps, waste jali and couplings',
      iconName: 'ShowerHead',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      sortOrder: 9,
      enabled: true
    }
  ],

  items: [
    // ----------------------------------------------------
    // PIPES
    // ----------------------------------------------------
    {
      id: 'item-upvc-pipe',
      categoryId: 'cat-pipes',
      name: 'UPVC Pressure Pipe (13 ft Length)',
      description: 'Premium UPVC water supply and plumbing pipe, Class B / Schedule 40, corrosion resistant.',
      unit: 'Length (13 ft)',
      brand: 'Popular / Beta',
      material: 'UPVC',
      grade: 'Class B / Heavy Duty',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 1,
      variants: [
        { id: 'var-upvc-05', itemId: 'item-upvc-pipe', sizeType: 'INCH', sizeLabel: '½"', price: 420, unit: 'Length (13 ft)', enabled: true, sortOrder: 1 },
        { id: 'var-upvc-075', itemId: 'item-upvc-pipe', sizeType: 'INCH', sizeLabel: '¾"', price: 580, unit: 'Length (13 ft)', enabled: true, sortOrder: 2 },
        { id: 'var-upvc-10', itemId: 'item-upvc-pipe', sizeType: 'INCH', sizeLabel: '1"', price: 850, unit: 'Length (13 ft)', enabled: true, sortOrder: 3 },
        { id: 'var-upvc-125', itemId: 'item-upvc-pipe', sizeType: 'INCH', sizeLabel: '1¼"', price: 1250, unit: 'Length (13 ft)', enabled: true, sortOrder: 4 },
        { id: 'var-upvc-15', itemId: 'item-upvc-pipe', sizeType: 'INCH', sizeLabel: '1½"', price: 1650, unit: 'Length (13 ft)', enabled: true, sortOrder: 5 },
        { id: 'var-upvc-20', itemId: 'item-upvc-pipe', sizeType: 'INCH', sizeLabel: '2"', price: 2350, unit: 'Length (13 ft)', enabled: true, sortOrder: 6 },
        { id: 'var-upvc-30', itemId: 'item-upvc-pipe', sizeType: 'INCH', sizeLabel: '3"', price: 4200, unit: 'Length (13 ft)', enabled: true, sortOrder: 7 },
        { id: 'var-upvc-40', itemId: 'item-upvc-pipe', sizeType: 'INCH', sizeLabel: '4"', price: 6100, unit: 'Length (13 ft)', enabled: true, sortOrder: 8 }
      ]
    },
    {
      id: 'item-ppr-pipe',
      categoryId: 'cat-pipes',
      name: 'PPR Hot & Cold Water Pipe (4 Meter Length / PN20)',
      description: 'High-density polypropylene random pipe for concealed boiling hot and cold water installations.',
      unit: 'Length (4 Meter)',
      brand: 'Master / Faisal PPR',
      material: 'PPR',
      grade: 'PN 20 (20 Bar)',
      defaultSizeType: 'MM',
      enabled: true,
      sortOrder: 2,
      variants: [
        { id: 'var-ppr-20mm', itemId: 'item-ppr-pipe', sizeType: 'MM', sizeLabel: '20mm (½")', price: 540, unit: 'Length (4m)', enabled: true, sortOrder: 1 },
        { id: 'var-ppr-25mm', itemId: 'item-ppr-pipe', sizeType: 'MM', sizeLabel: '25mm (¾")', price: 790, unit: 'Length (4m)', enabled: true, sortOrder: 2 },
        { id: 'var-ppr-32mm', itemId: 'item-ppr-pipe', sizeType: 'MM', sizeLabel: '32mm (1")', price: 1250, unit: 'Length (4m)', enabled: true, sortOrder: 3 },
        { id: 'var-ppr-40mm', itemId: 'item-ppr-pipe', sizeType: 'MM', sizeLabel: '40mm (1¼")', price: 1950, unit: 'Length (4m)', enabled: true, sortOrder: 4 },
        { id: 'var-ppr-50mm', itemId: 'item-ppr-pipe', sizeType: 'MM', sizeLabel: '50mm (1½")', price: 2900, unit: 'Length (4m)', enabled: true, sortOrder: 5 },
        { id: 'var-ppr-63mm', itemId: 'item-ppr-pipe', sizeType: 'MM', sizeLabel: '63mm (2")', price: 4400, unit: 'Length (4m)', enabled: true, sortOrder: 6 }
      ]
    },
    {
      id: 'item-pvc-drainage-pipe',
      categoryId: 'cat-pipes',
      name: 'PVC Sanitary Drainage & Sewer Pipe (10 ft Length)',
      description: 'Light & medium duty sanitary waste, rain water and drain pipe for bathrooms and kitchens.',
      unit: 'Length (10 ft)',
      brand: 'Popular / National',
      material: 'PVC',
      grade: 'Sanitary Grade',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 3,
      variants: [
        { id: 'var-pvcd-2', itemId: 'item-pvc-drainage-pipe', sizeType: 'INCH', sizeLabel: '2"', price: 680, unit: 'Length (10 ft)', enabled: true, sortOrder: 1 },
        { id: 'var-pvcd-3', itemId: 'item-pvc-drainage-pipe', sizeType: 'INCH', sizeLabel: '3"', price: 1150, unit: 'Length (10 ft)', enabled: true, sortOrder: 2 },
        { id: 'var-pvcd-4', itemId: 'item-pvc-drainage-pipe', sizeType: 'INCH', sizeLabel: '4"', price: 1750, unit: 'Length (10 ft)', enabled: true, sortOrder: 3 },
        { id: 'var-pvcd-6', itemId: 'item-pvc-drainage-pipe', sizeType: 'INCH', sizeLabel: '6"', price: 3400, unit: 'Length (10 ft)', enabled: true, sortOrder: 4 }
      ]
    },

    // ----------------------------------------------------
    // CP BRASS FITTINGS
    // ----------------------------------------------------
    {
      id: 'item-cp-elbow',
      categoryId: 'cat-cp-fittings',
      name: 'CP Chrome Brass Elbow 90°',
      description: 'Solid heavy forged brass with mirror chrome electroplating. Threaded female connection.',
      unit: 'Piece',
      brand: 'Master / Sonex Quality',
      material: 'Chrome Plated Brass',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 1,
      variants: [
        { id: 'var-cp-elb-05', itemId: 'item-cp-elbow', sizeType: 'INCH', sizeLabel: '½"', price: 130, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-cp-elb-075', itemId: 'item-cp-elbow', sizeType: 'INCH', sizeLabel: '¾"', price: 190, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-cp-elb-10', itemId: 'item-cp-elbow', sizeType: 'INCH', sizeLabel: '1"', price: 290, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-cp-elb-125', itemId: 'item-cp-elbow', sizeType: 'INCH', sizeLabel: '1¼"', price: 440, unit: 'Piece', enabled: true, sortOrder: 4 },
        { id: 'var-cp-elb-15', itemId: 'item-cp-elbow', sizeType: 'INCH', sizeLabel: '1½"', price: 620, unit: 'Piece', enabled: true, sortOrder: 5 }
      ]
    },
    {
      id: 'item-cp-tee',
      categoryId: 'cat-cp-fittings',
      name: 'CP Chrome Brass Tee Equal',
      description: 'Solid brass three-way equal branch fitting with mirror chrome polish for sanitary points.',
      unit: 'Piece',
      brand: 'Master / Sonex Quality',
      material: 'Chrome Plated Brass',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 2,
      variants: [
        { id: 'var-cp-tee-05', itemId: 'item-cp-tee', sizeType: 'INCH', sizeLabel: '½"', price: 170, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-cp-tee-075', itemId: 'item-cp-tee', sizeType: 'INCH', sizeLabel: '¾"', price: 260, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-cp-tee-10', itemId: 'item-cp-tee', sizeType: 'INCH', sizeLabel: '1"', price: 390, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-cp-tee-125', itemId: 'item-cp-tee', sizeType: 'INCH', sizeLabel: '1¼"', price: 590, unit: 'Piece', enabled: true, sortOrder: 4 }
      ]
    },
    {
      id: 'item-cp-socket',
      categoryId: 'cat-cp-fittings',
      name: 'CP Chrome Brass Socket / Coupler',
      description: 'Internal threaded straight coupling for joining male threaded pipes and fittings.',
      unit: 'Piece',
      brand: 'Master / Sonex Quality',
      material: 'Chrome Plated Brass',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 3,
      variants: [
        { id: 'var-cp-soc-05', itemId: 'item-cp-socket', sizeType: 'INCH', sizeLabel: '½"', price: 110, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-cp-soc-075', itemId: 'item-cp-socket', sizeType: 'INCH', sizeLabel: '¾"', price: 160, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-cp-soc-10', itemId: 'item-cp-socket', sizeType: 'INCH', sizeLabel: '1"', price: 240, unit: 'Piece', enabled: true, sortOrder: 3 }
      ]
    },
    {
      id: 'item-cp-nipple-hex',
      categoryId: 'cat-cp-fittings',
      name: 'CP Chrome Brass Hex Nipple',
      description: 'Solid brass dual male threaded hex connection for mixers, bib cocks and shower arms.',
      unit: 'Piece',
      brand: 'Master Brass',
      material: 'Chrome Plated Brass',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 4,
      variants: [
        { id: 'var-cp-nip-05', itemId: 'item-cp-nipple-hex', sizeType: 'INCH', sizeLabel: '½"', price: 95, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-cp-nip-075', itemId: 'item-cp-nipple-hex', sizeType: 'INCH', sizeLabel: '¾"', price: 145, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-cp-nip-10', itemId: 'item-cp-nipple-hex', sizeType: 'INCH', sizeLabel: '1"', price: 220, unit: 'Piece', enabled: true, sortOrder: 3 }
      ]
    },
    {
      id: 'item-cp-extension-nipple',
      categoryId: 'cat-cp-fittings',
      name: 'CP Extension Nipple (Deep Tile Point)',
      description: 'Extended threaded adaptor for sanitary fittings inside tiled walls.',
      unit: 'Piece',
      brand: 'Master Brass',
      material: 'Chrome Plated Brass',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 5,
      variants: [
        { id: 'var-cp-ext-1', itemId: 'item-cp-extension-nipple', sizeType: 'INCH', sizeLabel: '½" × 1 inch Length', price: 110, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-cp-ext-15', itemId: 'item-cp-extension-nipple', sizeType: 'INCH', sizeLabel: '½" × 1½ inch Length', price: 140, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-cp-ext-2', itemId: 'item-cp-extension-nipple', sizeType: 'INCH', sizeLabel: '½" × 2 inch Length', price: 175, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-cp-ext-25', itemId: 'item-cp-extension-nipple', sizeType: 'INCH', sizeLabel: '½" × 2½ inch Length', price: 210, unit: 'Piece', enabled: true, sortOrder: 4 },
        { id: 'var-cp-ext-3', itemId: 'item-cp-extension-nipple', sizeType: 'INCH', sizeLabel: '½" × 3 inch Length', price: 250, unit: 'Piece', enabled: true, sortOrder: 5 }
      ]
    },
    {
      id: 'item-cp-plug',
      categoryId: 'cat-cp-fittings',
      name: 'CP Chrome Brass Plug / End Cap',
      description: 'Solid brass threaded stopper plug to seal testing points and unused sanitary wall points.',
      unit: 'Piece',
      brand: 'Standard Brass',
      material: 'Chrome Plated Brass',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 6,
      variants: [
        { id: 'var-cp-plg-05', itemId: 'item-cp-plug', sizeType: 'INCH', sizeLabel: '½"', price: 75, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-cp-plg-075', itemId: 'item-cp-plug', sizeType: 'INCH', sizeLabel: '¾"', price: 115, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-cp-plg-10', itemId: 'item-cp-plug', sizeType: 'INCH', sizeLabel: '1"', price: 175, unit: 'Piece', enabled: true, sortOrder: 3 }
      ]
    },

    // ----------------------------------------------------
    // CI & GI IRON FITTINGS
    // ----------------------------------------------------
    {
      id: 'item-ci-union',
      categoryId: 'cat-ci-fittings',
      name: 'GI / Cast Iron Threaded Pipe Union',
      description: 'Heavy duty malleable cast iron union with brass seal for quick pump and water line disconnection.',
      unit: 'Piece',
      brand: 'IIL / Beta Heavy',
      material: 'Cast Iron / Galvanized',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 1,
      variants: [
        { id: 'var-ciu-05', itemId: 'item-ci-union', sizeType: 'INCH', sizeLabel: '½"', price: 220, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-ciu-075', itemId: 'item-ci-union', sizeType: 'INCH', sizeLabel: '¾"', price: 290, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-ciu-10', itemId: 'item-ci-union', sizeType: 'INCH', sizeLabel: '1"', price: 380, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-ciu-125', itemId: 'item-ci-union', sizeType: 'INCH', sizeLabel: '1¼"', price: 540, unit: 'Piece', enabled: true, sortOrder: 4 },
        { id: 'var-ciu-15', itemId: 'item-ci-union', sizeType: 'INCH', sizeLabel: '1½"', price: 720, unit: 'Piece', enabled: true, sortOrder: 5 },
        { id: 'var-ciu-20', itemId: 'item-ci-union', sizeType: 'INCH', sizeLabel: '2"', price: 1150, unit: 'Piece', enabled: true, sortOrder: 6 }
      ]
    },
    {
      id: 'item-ci-elbow',
      categoryId: 'cat-ci-fittings',
      name: 'GI Galvanized Malleable Iron Elbow 90°',
      description: 'Heavy gauge threaded iron bend elbow for high pressure main lines and water pumps.',
      unit: 'Piece',
      brand: 'IIL / Beta',
      material: 'Galvanized Iron (GI)',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 2,
      variants: [
        { id: 'var-cielb-05', itemId: 'item-ci-elbow', sizeType: 'INCH', sizeLabel: '½"', price: 90, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-cielb-075', itemId: 'item-ci-elbow', sizeType: 'INCH', sizeLabel: '¾"', price: 130, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-cielb-10', itemId: 'item-ci-elbow', sizeType: 'INCH', sizeLabel: '1"', price: 190, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-cielb-125', itemId: 'item-ci-elbow', sizeType: 'INCH', sizeLabel: '1¼"', price: 290, unit: 'Piece', enabled: true, sortOrder: 4 },
        { id: 'var-cielb-15', itemId: 'item-ci-elbow', sizeType: 'INCH', sizeLabel: '1½"', price: 390, unit: 'Piece', enabled: true, sortOrder: 5 },
        { id: 'var-cielb-20', itemId: 'item-ci-elbow', sizeType: 'INCH', sizeLabel: '2"', price: 580, unit: 'Piece', enabled: true, sortOrder: 6 }
      ]
    },
    {
      id: 'item-ci-tee',
      categoryId: 'cat-ci-fittings',
      name: 'GI Galvanized Malleable Iron Tee Equal',
      description: 'Heavy duty threaded three way equal connector for water distribution and pump manifolds.',
      unit: 'Piece',
      brand: 'IIL / Beta',
      material: 'Galvanized Iron (GI)',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 3,
      variants: [
        { id: 'var-citee-05', itemId: 'item-ci-tee', sizeType: 'INCH', sizeLabel: '½"', price: 120, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-citee-075', itemId: 'item-ci-tee', sizeType: 'INCH', sizeLabel: '¾"', price: 170, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-citee-10', itemId: 'item-ci-tee', sizeType: 'INCH', sizeLabel: '1"', price: 260, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-citee-125', itemId: 'item-ci-tee', sizeType: 'INCH', sizeLabel: '1¼"', price: 390, unit: 'Piece', enabled: true, sortOrder: 4 },
        { id: 'var-citee-15', itemId: 'item-ci-tee', sizeType: 'INCH', sizeLabel: '1½"', price: 520, unit: 'Piece', enabled: true, sortOrder: 5 },
        { id: 'var-citee-20', itemId: 'item-ci-tee', sizeType: 'INCH', sizeLabel: '2"', price: 780, unit: 'Piece', enabled: true, sortOrder: 6 }
      ]
    },
    {
      id: 'item-ci-barrel-nipple',
      categoryId: 'cat-ci-fittings',
      name: 'GI Barrel Nipple (Heavy Gauge)',
      description: 'Galvanized iron dual threaded barrel nipple in standard 3 inch, 4 inch and 6 inch lengths.',
      unit: 'Piece',
      brand: 'IIL Heavy',
      material: 'Galvanized Iron (GI)',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 4,
      variants: [
        { id: 'var-cinip-05-3', itemId: 'item-ci-barrel-nipple', sizeType: 'INCH', sizeLabel: '½" × 3 inch', price: 65, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-cinip-075-3', itemId: 'item-ci-barrel-nipple', sizeType: 'INCH', sizeLabel: '¾" × 3 inch', price: 90, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-cinip-10-4', itemId: 'item-ci-barrel-nipple', sizeType: 'INCH', sizeLabel: '1" × 4 inch', price: 140, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-cinip-125-4', itemId: 'item-ci-barrel-nipple', sizeType: 'INCH', sizeLabel: '1¼" × 4 inch', price: 195, unit: 'Piece', enabled: true, sortOrder: 4 },
        { id: 'var-cinip-15-4', itemId: 'item-ci-barrel-nipple', sizeType: 'INCH', sizeLabel: '1½" × 4 inch', price: 260, unit: 'Piece', enabled: true, sortOrder: 5 },
        { id: 'var-cinip-20-6', itemId: 'item-ci-barrel-nipple', sizeType: 'INCH', sizeLabel: '2" × 6 inch', price: 420, unit: 'Piece', enabled: true, sortOrder: 6 }
      ]
    },

    // ----------------------------------------------------
    // UPVC & PVC FITTINGS
    // ----------------------------------------------------
    {
      id: 'item-upvc-elbow',
      categoryId: 'cat-upvc-fittings',
      name: 'UPVC Pressure Elbow 90°',
      description: 'Solvent weld UPVC heavy injection molded elbow for water distribution piping.',
      unit: 'Piece',
      brand: 'Popular / Beta',
      material: 'UPVC',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 1,
      variants: [
        { id: 'var-upvcelb-05', itemId: 'item-upvc-elbow', sizeType: 'INCH', sizeLabel: '½"', price: 45, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-upvcelb-075', itemId: 'item-upvc-elbow', sizeType: 'INCH', sizeLabel: '¾"', price: 65, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-upvcelb-10', itemId: 'item-upvc-elbow', sizeType: 'INCH', sizeLabel: '1"', price: 95, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-upvcelb-125', itemId: 'item-upvc-elbow', sizeType: 'INCH', sizeLabel: '1¼"', price: 160, unit: 'Piece', enabled: true, sortOrder: 4 },
        { id: 'var-upvcelb-15', itemId: 'item-upvc-elbow', sizeType: 'INCH', sizeLabel: '1½"', price: 230, unit: 'Piece', enabled: true, sortOrder: 5 },
        { id: 'var-upvcelb-20', itemId: 'item-upvc-elbow', sizeType: 'INCH', sizeLabel: '2"', price: 380, unit: 'Piece', enabled: true, sortOrder: 6 }
      ]
    },
    {
      id: 'item-upvc-tee',
      categoryId: 'cat-upvc-fittings',
      name: 'UPVC Pressure Tee Equal',
      description: 'Heavy duty pressure tee for dividing UPVC pipeline flows evenly.',
      unit: 'Piece',
      brand: 'Popular / Beta',
      material: 'UPVC',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 2,
      variants: [
        { id: 'var-upvctee-05', itemId: 'item-upvc-tee', sizeType: 'INCH', sizeLabel: '½"', price: 60, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-upvctee-075', itemId: 'item-upvc-tee', sizeType: 'INCH', sizeLabel: '¾"', price: 90, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-upvctee-10', itemId: 'item-upvc-tee', sizeType: 'INCH', sizeLabel: '1"', price: 135, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-upvctee-125', itemId: 'item-upvc-tee', sizeType: 'INCH', sizeLabel: '1¼"', price: 220, unit: 'Piece', enabled: true, sortOrder: 4 },
        { id: 'var-upvctee-15', itemId: 'item-upvc-tee', sizeType: 'INCH', sizeLabel: '1½"', price: 310, unit: 'Piece', enabled: true, sortOrder: 5 },
        { id: 'var-upvctee-20', itemId: 'item-upvc-tee', sizeType: 'INCH', sizeLabel: '2"', price: 510, unit: 'Piece', enabled: true, sortOrder: 6 }
      ]
    },
    {
      id: 'item-upvc-union',
      categoryId: 'cat-upvc-fittings',
      name: 'UPVC True Union (EPDM O-Ring Seal)',
      description: 'Double threaded / socket UPVC union with leak-free rubber O-ring seal for pumps & water tanks.',
      unit: 'Piece',
      brand: 'Beta / Super Flow',
      material: 'UPVC',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 3,
      variants: [
        { id: 'var-upvcun-05', itemId: 'item-upvc-union', sizeType: 'INCH', sizeLabel: '½"', price: 190, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-upvcun-075', itemId: 'item-upvc-union', sizeType: 'INCH', sizeLabel: '¾"', price: 260, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-upvcun-10', itemId: 'item-upvc-union', sizeType: 'INCH', sizeLabel: '1"', price: 360, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-upvcun-125', itemId: 'item-upvc-union', sizeType: 'INCH', sizeLabel: '1¼"', price: 510, unit: 'Piece', enabled: true, sortOrder: 4 },
        { id: 'var-upvcun-15', itemId: 'item-upvc-union', sizeType: 'INCH', sizeLabel: '1½"', price: 680, unit: 'Piece', enabled: true, sortOrder: 5 },
        { id: 'var-upvcun-20', itemId: 'item-upvc-union', sizeType: 'INCH', sizeLabel: '2"', price: 990, unit: 'Piece', enabled: true, sortOrder: 6 }
      ]
    },
    {
      id: 'item-upvc-reducer',
      categoryId: 'cat-upvc-fittings',
      name: 'UPVC Reducing Bush / Reducer Socket',
      description: 'Precision molded reducer for transitioning between different pipe diameters cleanly.',
      unit: 'Piece',
      brand: 'Popular / Beta',
      material: 'UPVC',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 4,
      variants: [
        { id: 'var-upvcred-075-05', itemId: 'item-upvc-reducer', sizeType: 'INCH', sizeLabel: '¾" × ½"', price: 50, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-upvcred-10-075', itemId: 'item-upvc-reducer', sizeType: 'INCH', sizeLabel: '1" × ¾"', price: 75, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-upvcred-125-10', itemId: 'item-upvc-reducer', sizeType: 'INCH', sizeLabel: '1¼" × 1"', price: 120, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-upvcred-15-10', itemId: 'item-upvc-reducer', sizeType: 'INCH', sizeLabel: '1½" × 1"', price: 160, unit: 'Piece', enabled: true, sortOrder: 4 },
        { id: 'var-upvcred-20-15', itemId: 'item-upvc-reducer', sizeType: 'INCH', sizeLabel: '2" × 1½"', price: 240, unit: 'Piece', enabled: true, sortOrder: 5 }
      ]
    },

    // ----------------------------------------------------
    // PPR HOT & COLD FITTINGS
    // ----------------------------------------------------
    {
      id: 'item-ppr-elbow-brass',
      categoryId: 'cat-ppr-fittings',
      name: 'PPR Female Brass Threaded Elbow (Sanitary Point)',
      description: 'Fusion weld PPR elbow with heavy female brass insert for shower and basin mixer connections.',
      unit: 'Piece',
      brand: 'Master / Faisal PPR',
      material: 'PPR with Brass Insert',
      defaultSizeType: 'MM',
      enabled: true,
      sortOrder: 1,
      variants: [
        { id: 'var-pprelb-20-05', itemId: 'item-ppr-elbow-brass', sizeType: 'MM', sizeLabel: '20mm × ½" Female', price: 280, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-pprelb-25-05', itemId: 'item-ppr-elbow-brass', sizeType: 'MM', sizeLabel: '25mm × ½" Female', price: 340, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-pprelb-25-075', itemId: 'item-ppr-elbow-brass', sizeType: 'MM', sizeLabel: '25mm × ¾" Female', price: 420, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-pprelb-32-10', itemId: 'item-ppr-elbow-brass', sizeType: 'MM', sizeLabel: '32mm × 1" Female', price: 680, unit: 'Piece', enabled: true, sortOrder: 4 }
      ]
    },
    {
      id: 'item-ppr-adaptor-male',
      categoryId: 'cat-ppr-fittings',
      name: 'PPR Male Brass Threaded Adaptor',
      description: 'Heavy duty PPR transition union with solid male brass threads for valve and tank attachments.',
      unit: 'Piece',
      brand: 'Master / Faisal PPR',
      material: 'PPR with Brass Insert',
      defaultSizeType: 'MM',
      enabled: true,
      sortOrder: 2,
      variants: [
        { id: 'var-ppradp-20-05', itemId: 'item-ppr-adaptor-male', sizeType: 'MM', sizeLabel: '20mm × ½" Male', price: 290, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-ppradp-25-075', itemId: 'item-ppr-adaptor-male', sizeType: 'MM', sizeLabel: '25mm × ¾" Male', price: 430, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-ppradp-32-10', itemId: 'item-ppr-adaptor-male', sizeType: 'MM', sizeLabel: '32mm × 1" Male', price: 690, unit: 'Piece', enabled: true, sortOrder: 3 }
      ]
    },
    {
      id: 'item-ppr-plain-elbow',
      categoryId: 'cat-ppr-fittings',
      name: 'PPR Plain Fusion Elbow 90°',
      description: 'Solid PPR fusion welded equal 90 degree elbow for concealed plumbing lines.',
      unit: 'Piece',
      brand: 'Master / Faisal PPR',
      material: 'PPR',
      defaultSizeType: 'MM',
      enabled: true,
      sortOrder: 3,
      variants: [
        { id: 'var-pprpelb-20', itemId: 'item-ppr-plain-elbow', sizeType: 'MM', sizeLabel: '20mm', price: 55, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-pprpelb-25', itemId: 'item-ppr-plain-elbow', sizeType: 'MM', sizeLabel: '25mm', price: 85, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-pprpelb-32', itemId: 'item-ppr-plain-elbow', sizeType: 'MM', sizeLabel: '32mm', price: 140, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-pprpelb-40', itemId: 'item-ppr-plain-elbow', sizeType: 'MM', sizeLabel: '40mm', price: 230, unit: 'Piece', enabled: true, sortOrder: 4 }
      ]
    },
    {
      id: 'item-ppr-plain-tee',
      categoryId: 'cat-ppr-fittings',
      name: 'PPR Plain Fusion Equal Tee',
      description: 'Three way fusion welded equal tee for branching PPR hot and cold lines.',
      unit: 'Piece',
      brand: 'Master / Faisal PPR',
      material: 'PPR',
      defaultSizeType: 'MM',
      enabled: true,
      sortOrder: 4,
      variants: [
        { id: 'var-pprptee-20', itemId: 'item-ppr-plain-tee', sizeType: 'MM', sizeLabel: '20mm', price: 75, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-pprptee-25', itemId: 'item-ppr-plain-tee', sizeType: 'MM', sizeLabel: '25mm', price: 110, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-pprptee-32', itemId: 'item-ppr-plain-tee', sizeType: 'MM', sizeLabel: '32mm', price: 185, unit: 'Piece', enabled: true, sortOrder: 3 }
      ]
    },

    // ----------------------------------------------------
    // VALVES & FLOW CONTROLS
    // ----------------------------------------------------
    {
      id: 'item-brass-gate-valve',
      categoryId: 'cat-valves',
      name: 'Heavy Forged Brass Gate Valve (Full Bore)',
      description: 'Solid brass gate valve with red cast handle, 16 Bar pressure rating for main water controls.',
      unit: 'Piece',
      brand: 'Master / Itap Italy Quality',
      material: 'Heavy Brass',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 1,
      variants: [
        { id: 'var-bgv-05', itemId: 'item-brass-gate-valve', sizeType: 'INCH', sizeLabel: '½"', price: 580, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-bgv-075', itemId: 'item-brass-gate-valve', sizeType: 'INCH', sizeLabel: '¾"', price: 850, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-bgv-10', itemId: 'item-brass-gate-valve', sizeType: 'INCH', sizeLabel: '1"', price: 1250, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-bgv-125', itemId: 'item-brass-gate-valve', sizeType: 'INCH', sizeLabel: '1¼"', price: 1850, unit: 'Piece', enabled: true, sortOrder: 4 },
        { id: 'var-bgv-15', itemId: 'item-brass-gate-valve', sizeType: 'INCH', sizeLabel: '1½"', price: 2600, unit: 'Piece', enabled: true, sortOrder: 5 },
        { id: 'var-bgv-20', itemId: 'item-brass-gate-valve', sizeType: 'INCH', sizeLabel: '2"', price: 3900, unit: 'Piece', enabled: true, sortOrder: 6 }
      ]
    },
    {
      id: 'item-brass-ball-valve',
      categoryId: 'cat-valves',
      name: 'Brass Ball Valve (Quarter Turn Lever Handle)',
      description: 'Quick-action quarter turn chrome plated brass ball valve with stainless steel lever handle.',
      unit: 'Piece',
      brand: 'Master / York',
      material: 'Brass / Chrome Plated Ball',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 2,
      variants: [
        { id: 'var-bbv-05', itemId: 'item-brass-ball-valve', sizeType: 'INCH', sizeLabel: '½"', price: 490, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-bbv-075', itemId: 'item-brass-ball-valve', sizeType: 'INCH', sizeLabel: '¾"', price: 720, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-bbv-10', itemId: 'item-brass-ball-valve', sizeType: 'INCH', sizeLabel: '1"', price: 1100, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-bbv-125', itemId: 'item-brass-ball-valve', sizeType: 'INCH', sizeLabel: '1¼"', price: 1650, unit: 'Piece', enabled: true, sortOrder: 4 },
        { id: 'var-bbv-15', itemId: 'item-brass-ball-valve', sizeType: 'INCH', sizeLabel: '1½"', price: 2300, unit: 'Piece', enabled: true, sortOrder: 5 },
        { id: 'var-bbv-20', itemId: 'item-brass-ball-valve', sizeType: 'INCH', sizeLabel: '2"', price: 3450, unit: 'Piece', enabled: true, sortOrder: 6 }
      ]
    },
    {
      id: 'item-brass-check-valve',
      categoryId: 'cat-valves',
      name: 'Brass Non-Return / Check Valve (Spring Loaded)',
      description: 'Prevents backflow in water pumps and overhead tank supply pipelines with internal spring disc.',
      unit: 'Piece',
      brand: 'Master / York Brass',
      material: 'Forged Brass',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 3,
      variants: [
        { id: 'var-bcv-05', itemId: 'item-brass-check-valve', sizeType: 'INCH', sizeLabel: '½"', price: 520, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-bcv-075', itemId: 'item-brass-check-valve', sizeType: 'INCH', sizeLabel: '¾"', price: 780, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-bcv-10', itemId: 'item-brass-check-valve', sizeType: 'INCH', sizeLabel: '1"', price: 1150, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-bcv-125', itemId: 'item-brass-check-valve', sizeType: 'INCH', sizeLabel: '1¼"', price: 1750, unit: 'Piece', enabled: true, sortOrder: 4 },
        { id: 'var-bcv-15', itemId: 'item-brass-check-valve', sizeType: 'INCH', sizeLabel: '1½"', price: 2450, unit: 'Piece', enabled: true, sortOrder: 5 },
        { id: 'var-bcv-20', itemId: 'item-brass-check-valve', sizeType: 'INCH', sizeLabel: '2"', price: 3750, unit: 'Piece', enabled: true, sortOrder: 6 }
      ]
    },
    {
      id: 'item-brass-foot-valve',
      categoryId: 'cat-valves',
      name: 'Brass Foot Valve with Stainless Steel Strainer',
      description: 'Submersible suction valve with stainless steel debris mesh filter for suction water pumps.',
      unit: 'Piece',
      brand: 'Beta / Master Heavy',
      material: 'Brass with SS Filter',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 4,
      variants: [
        { id: 'var-bfv-075', itemId: 'item-brass-foot-valve', sizeType: 'INCH', sizeLabel: '¾"', price: 680, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-bfv-10', itemId: 'item-brass-foot-valve', sizeType: 'INCH', sizeLabel: '1"', price: 950, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-bfv-125', itemId: 'item-brass-foot-valve', sizeType: 'INCH', sizeLabel: '1¼"', price: 1450, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-bfv-15', itemId: 'item-brass-foot-valve', sizeType: 'INCH', sizeLabel: '1½"', price: 1950, unit: 'Piece', enabled: true, sortOrder: 4 },
        { id: 'var-bfv-20', itemId: 'item-brass-foot-valve', sizeType: 'INCH', sizeLabel: '2"', price: 2950, unit: 'Piece', enabled: true, sortOrder: 5 }
      ]
    },

    // ----------------------------------------------------
    // WATER TANK & PUMP ACCESSORIES
    // ----------------------------------------------------
    {
      id: 'item-tank-nipple-brass',
      categoryId: 'cat-tank-acc',
      name: 'Heavy Brass Water Tank Connector / Nipple',
      description: 'Solid brass through-wall tank nipple with rubber gasket and locknut for leak-proof tank base outlets.',
      unit: 'Piece',
      brand: 'Master Brass',
      material: 'Forged Brass',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 1,
      variants: [
        { id: 'var-tkn-05', itemId: 'item-tank-nipple-brass', sizeType: 'INCH', sizeLabel: '½"', price: 340, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-tkn-075', itemId: 'item-tank-nipple-brass', sizeType: 'INCH', sizeLabel: '¾"', price: 480, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-tkn-10', itemId: 'item-tank-nipple-brass', sizeType: 'INCH', sizeLabel: '1"', price: 720, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-tkn-125', itemId: 'item-tank-nipple-brass', sizeType: 'INCH', sizeLabel: '1¼"', price: 1050, unit: 'Piece', enabled: true, sortOrder: 4 },
        { id: 'var-tkn-15', itemId: 'item-tank-nipple-brass', sizeType: 'INCH', sizeLabel: '1½"', price: 1450, unit: 'Piece', enabled: true, sortOrder: 5 },
        { id: 'var-tkn-20', itemId: 'item-tank-nipple-brass', sizeType: 'INCH', sizeLabel: '2"', price: 2200, unit: 'Piece', enabled: true, sortOrder: 6 }
      ]
    },
    {
      id: 'item-tank-float-valve',
      categoryId: 'cat-tank-acc',
      name: 'Brass Automatic Float Ball Valve (Ball Cock)',
      description: 'Heavy brass float valve with copper/plastic float ball to auto shut off water flow at full level.',
      unit: 'Piece',
      brand: 'Master / York',
      material: 'Brass with Float Ball',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 2,
      variants: [
        { id: 'var-flv-05', itemId: 'item-tank-float-valve', sizeType: 'INCH', sizeLabel: '½"', price: 680, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-flv-075', itemId: 'item-tank-float-valve', sizeType: 'INCH', sizeLabel: '¾"', price: 950, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-flv-10', itemId: 'item-tank-float-valve', sizeType: 'INCH', sizeLabel: '1"', price: 1450, unit: 'Piece', enabled: true, sortOrder: 3 }
      ]
    },
    {
      id: 'item-pump-vibration-joint',
      categoryId: 'cat-pump-acc',
      name: 'Flexible Anti-Vibration Pump Rubber Joint',
      description: 'Absorbs motor vibration and thermal expansion, preventing pipe cracking on pump discharge lines.',
      unit: 'Piece',
      brand: 'Beta Flex',
      material: 'EPDM Rubber with Flanged/Threaded Brass Ends',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 1,
      variants: [
        { id: 'var-pvj-10', itemId: 'item-pump-vibration-joint', sizeType: 'INCH', sizeLabel: '1"', price: 1450, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-pvj-125', itemId: 'item-pump-vibration-joint', sizeType: 'INCH', sizeLabel: '1¼"', price: 1950, unit: 'Piece', enabled: true, sortOrder: 2 },
        { id: 'var-pvj-15', itemId: 'item-pump-vibration-joint', sizeType: 'INCH', sizeLabel: '1½"', price: 2600, unit: 'Piece', enabled: true, sortOrder: 3 },
        { id: 'var-pvj-20', itemId: 'item-pump-vibration-joint', sizeType: 'INCH', sizeLabel: '2"', price: 3600, unit: 'Piece', enabled: true, sortOrder: 4 }
      ]
    },

    // ----------------------------------------------------
    // SANITARY & INSTALLATION ACCESSORIES
    // ----------------------------------------------------
    {
      id: 'item-teflon-tape',
      categoryId: 'cat-bathroom-acc',
      name: 'PTFE Heavy Duty Teflon Thread Seal Tape',
      description: 'High-density leak-proof sealing tape for all metal and plastic plumbing threads.',
      unit: 'Piece',
      brand: 'Super Seal',
      material: '100% Pure PTFE',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 1,
      variants: [
        { id: 'var-tef-std', itemId: 'item-teflon-tape', sizeType: 'INCH', sizeLabel: 'Standard Roll (12mm × 10m)', price: 45, unit: 'Roll', enabled: true, sortOrder: 1 },
        { id: 'var-tef-heavy', itemId: 'item-teflon-tape', sizeType: 'INCH', sizeLabel: 'Heavy Contractor Roll (19mm × 15m)', price: 85, unit: 'Roll', enabled: true, sortOrder: 2 },
        { id: 'var-tef-pack', itemId: 'item-teflon-tape', sizeType: 'INCH', sizeLabel: 'Contractor Pack (10 Rolls)', price: 400, unit: 'Pack', enabled: true, sortOrder: 3 }
      ]
    },
    {
      id: 'item-pvc-solvent-cement',
      categoryId: 'cat-bathroom-acc',
      name: 'UPVC / PVC Solvent Cement (Heavy Pipe Glue)',
      description: 'Fast-bonding high-pressure solvent adhesive for UPVC pipe and fitting joints.',
      unit: 'Can',
      brand: 'Popular / Tiger Bond',
      material: 'Solvent Adhesive',
      defaultSizeType: 'CUSTOM',
      enabled: true,
      sortOrder: 2,
      variants: [
        { id: 'var-solv-100g', itemId: 'item-pvc-solvent-cement', sizeType: 'CUSTOM', sizeLabel: '100 Gram Tin (with brush)', price: 160, unit: 'Tin', enabled: true, sortOrder: 1 },
        { id: 'var-solv-250g', itemId: 'item-pvc-solvent-cement', sizeType: 'CUSTOM', sizeLabel: '250 Gram Tin (with brush)', price: 340, unit: 'Tin', enabled: true, sortOrder: 2 },
        { id: 'var-solv-500g', itemId: 'item-pvc-solvent-cement', sizeType: 'CUSTOM', sizeLabel: '500 Gram Tin (with brush)', price: 620, unit: 'Tin', enabled: true, sortOrder: 3 }
      ]
    },
    {
      id: 'item-basin-waste-pipe',
      categoryId: 'cat-bathroom-acc',
      name: 'Flexible Basin & Sink Drain Waste Pipe',
      description: 'Heavy corrugated expandable waste pipe with rubber adapter for wash basins and kitchen sinks.',
      unit: 'Piece',
      brand: 'Master Deluxe',
      material: 'Heavy PP Plastic',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 3,
      variants: [
        { id: 'var-wst-125', itemId: 'item-basin-waste-pipe', sizeType: 'INCH', sizeLabel: '1¼" Basin Waste (Extendable)', price: 240, unit: 'Piece', enabled: true, sortOrder: 1 },
        { id: 'var-wst-15', itemId: 'item-basin-waste-pipe', sizeType: 'INCH', sizeLabel: '1½" Sink Waste (Heavy Extendable)', price: 290, unit: 'Piece', enabled: true, sortOrder: 2 }
      ]
    },
    {
      id: 'item-ss-pipe-clamp',
      categoryId: 'cat-bathroom-acc',
      name: 'Heavy Galvanized Pipe Saddle Clamps with Rubber Cushion',
      description: 'Heavy duty wall mounting saddle clamp with vibration-dampening EPDM rubber cushion.',
      unit: 'Pack (5 pcs)',
      brand: 'Beta Support',
      material: 'Galvanized Steel with EPDM Rubber',
      defaultSizeType: 'INCH',
      enabled: true,
      sortOrder: 4,
      variants: [
        { id: 'var-clm-05', itemId: 'item-ss-pipe-clamp', sizeType: 'INCH', sizeLabel: '½" (Pack of 5)', price: 180, unit: 'Pack (5 pcs)', enabled: true, sortOrder: 1 },
        { id: 'var-clm-075', itemId: 'item-ss-pipe-clamp', sizeType: 'INCH', sizeLabel: '¾" (Pack of 5)', price: 220, unit: 'Pack (5 pcs)', enabled: true, sortOrder: 2 },
        { id: 'var-clm-10', itemId: 'item-ss-pipe-clamp', sizeType: 'INCH', sizeLabel: '1" (Pack of 5)', price: 280, unit: 'Pack (5 pcs)', enabled: true, sortOrder: 3 },
        { id: 'var-clm-15', itemId: 'item-ss-pipe-clamp', sizeType: 'INCH', sizeLabel: '1½" (Pack of 5)', price: 380, unit: 'Pack (5 pcs)', enabled: true, sortOrder: 4 },
        { id: 'var-clm-20', itemId: 'item-ss-pipe-clamp', sizeType: 'INCH', sizeLabel: '2" (Pack of 5)', price: 490, unit: 'Pack (5 pcs)', enabled: true, sortOrder: 5 }
      ]
    }
  ]
};
