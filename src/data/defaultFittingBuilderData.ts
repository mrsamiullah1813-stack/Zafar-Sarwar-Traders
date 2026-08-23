import { FittingBuilderConfig } from '../types';

export const defaultFittingBuilderConfig: FittingBuilderConfig = {
  isEnabled: true,
  title: 'Smart Construction & Fitting Builder',
  subtitle: 'Select your project, choose materials, select sizes and quantities, and build your custom package.',
  urduTitle: 'سمارٹ کنسٹرکشن اور پلمبنگ فٹنگ پیکج بلڈر',
  urduSubtitle: 'اپنا پروجیکٹ منتخب کریں، پائپ، فٹنگ، والو اور سائز منتخب کر کے اپنا حسبِ ضرورت پیکج تیار کریں',
  heroBadge: 'Custom Package Builder',
  entryCardBadge: 'Interactive Package System',
  whatsappNumber: '+923108002863',
  whatsappDisclaimerNote: 'Please confirm availability and final wholesale/project pricing.',
  packageTypes: [
    {
      id: 'pkg-bathroom',
      name: 'Bathroom Plumbing Package',
      urduName: 'باتھ روم پلمبنگ پیکج',
      description: 'Complete concealed & open plumbing, CP fittings, waste pipes, and mixer connections for modern washrooms.',
      iconName: 'ShowerHead',
      image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80',
      badge: 'Popular',
      enabled: true,
      sortOrder: 1,
      featured: true,
      recommendedCategoryIds: ['cat-cp-fittings', 'cat-ppr-fittings', 'cat-upvc-fittings', 'cat-valves', 'cat-accessories'],
      recommendedItemIds: ['item-cp-elbow', 'item-cp-tee', 'item-ppr-fapt', 'item-ball-valve', 'item-teflon-tape']
    },
    {
      id: 'pkg-pump',
      name: 'Pump Installation Package',
      urduName: 'واٹر پمپ انسٹالیشن پیکج',
      description: 'High-pressure suction and delivery lines, brass check valves, unions, pressure gauges, and motor connectors.',
      iconName: 'Zap',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      badge: 'Heavy Duty',
      enabled: true,
      sortOrder: 2,
      featured: true,
      recommendedCategoryIds: ['cat-pipes', 'cat-valves', 'cat-unions-nipples', 'cat-pump-accessories'],
      recommendedItemIds: ['item-check-valve-nrv', 'item-foot-valve', 'item-union-brass', 'item-upvc-pipe', 'item-gate-valve']
    },
    {
      id: 'pkg-watertank',
      name: 'Water Tank Fitting Package',
      urduName: 'واٹر ٹینک فٹنگ پیکج',
      description: 'Tank nipples, float valves, overflow vents, brass ball valves, and heavy-duty delivery risers.',
      iconName: 'Droplets',
      image: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=600&q=80',
      badge: 'Essential',
      enabled: true,
      sortOrder: 3,
      featured: true,
      recommendedCategoryIds: ['cat-tank-fittings', 'cat-pipes', 'cat-valves', 'cat-upvc-fittings', 'cat-unions-nipples'],
      recommendedItemIds: ['item-tank-nipple', 'item-float-valve', 'item-ball-valve', 'item-upvc-pipe', 'item-union-brass']
    },
    {
      id: 'pkg-house-plumbing',
      name: 'House Plumbing Package',
      urduName: 'مکمل گھر پلمبنگ پیکج',
      description: 'Comprehensive water supply, drainage, PPR hot lines, UPVC mains, and sewer piping for 5 Marla / 10 Marla / 1 Kanal houses.',
      iconName: 'Home',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
      badge: 'Complete Solution',
      enabled: true,
      sortOrder: 4,
      featured: true,
      recommendedCategoryIds: ['cat-pipes', 'cat-ppr-fittings', 'cat-upvc-fittings', 'cat-valves', 'cat-accessories'],
      recommendedItemIds: ['item-ppr-pipe', 'item-upvc-pipe', 'item-pvc-drain-pipe', 'item-gate-valve', 'item-solvent-cement']
    },
    {
      id: 'pkg-cp-fittings',
      name: 'CP Fittings Package',
      urduName: 'سی پی (کروم پلیٹڈ) فٹنگز',
      description: 'Premium chrome-plated brass elbows, tees, barrel nipples, extension pieces, and luxury bathroom connection joints.',
      iconName: 'Wrench',
      image: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=600&q=80',
      badge: 'High Finish',
      enabled: true,
      sortOrder: 5,
      featured: false,
      recommendedCategoryIds: ['cat-cp-fittings', 'cat-unions-nipples', 'cat-accessories'],
      recommendedItemIds: ['item-cp-elbow', 'item-cp-tee', 'item-cp-socket', 'item-cp-barrel-nipple', 'item-teflon-tape']
    },
    {
      id: 'pkg-ci-fittings',
      name: 'CI Fittings Package',
      urduName: 'کاسٹ آئرن (سی آئی) فٹنگز',
      description: 'Heavy industrial cast iron threaded fittings, tees, reducers, flanges, and high-tensile piping connectors.',
      iconName: 'Settings',
      image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
      badge: 'Industrial Grade',
      enabled: true,
      sortOrder: 6,
      featured: false,
      recommendedCategoryIds: ['cat-ci-fittings', 'cat-valves', 'cat-unions-nipples'],
      recommendedItemIds: ['item-ci-elbow', 'item-ci-tee', 'item-ci-socket', 'item-ci-hex-bush']
    },
    {
      id: 'pkg-pipes-fittings',
      name: 'Pipe & Fittings Package',
      urduName: 'پائپ اور فٹنگز پیکج',
      description: 'Combined bundle of UPVC, PPR, and PVC pipes with corresponding elbows, couplers, and solvent joints.',
      iconName: 'Layers',
      image: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=600&q=80',
      badge: 'Bundle Deal',
      enabled: true,
      sortOrder: 7,
      featured: false,
      recommendedCategoryIds: ['cat-pipes', 'cat-upvc-fittings', 'cat-ppr-fittings', 'cat-accessories'],
      recommendedItemIds: ['item-upvc-pipe', 'item-ppr-pipe', 'item-upvc-elbow', 'item-ppr-elbow', 'item-solvent-cement']
    },
    {
      id: 'pkg-contractor',
      name: 'Contractor Wholesale Package',
      urduName: 'ٹھیکیدار / ہول سیل بلک پیکج',
      description: 'Bulk order packages for master plumbers, civil contractors, and construction supervisors with custom size breakdown.',
      iconName: 'HardHat',
      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
      badge: 'Wholesale Rates',
      enabled: true,
      sortOrder: 8,
      featured: false,
      recommendedCategoryIds: ['cat-pipes', 'cat-upvc-fittings', 'cat-ppr-fittings', 'cat-valves', 'cat-accessories'],
      recommendedItemIds: ['item-upvc-pipe', 'item-gate-valve', 'item-ball-valve', 'item-solvent-cement']
    },
    {
      id: 'pkg-custom',
      name: 'Custom Package Builder',
      urduName: 'حسبِ ضرورت کسٹم پیکج',
      description: 'Select any combination of plumbing components, pipes, sanitary fixtures, and specialty valves.',
      iconName: 'Package',
      image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80',
      badge: 'Full Freedom',
      enabled: true,
      sortOrder: 9,
      featured: false,
      recommendedCategoryIds: ['cat-pipes', 'cat-cp-fittings', 'cat-valves', 'cat-tank-fittings', 'cat-accessories'],
      recommendedItemIds: ['item-cp-elbow', 'item-upvc-pipe', 'item-ball-valve', 'item-teflon-tape']
    }
  ],
  categories: [
    {
      id: 'cat-pipes',
      name: '🚰 Pipes (UPVC, PPR, PVC, GI)',
      urduName: 'پائپس (یو پی وی سی، پی پی آر، پی وی سی، جی آئی)',
      description: 'Pressure, drainage, hot/cold water supply and conduit pipes in standard inch and mm lengths.',
      iconName: 'Layers',
      enabled: true,
      sortOrder: 1,
      isPipeCategory: true
    },
    {
      id: 'cat-cp-fittings',
      name: '🔧 CP Fittings (Chrome Plated)',
      urduName: 'سی پی فٹنگز (کروم پلیٹڈ پیتل)',
      description: 'Heavy brass chrome-plated elbows, tees, sockets, barrel nipples, and bathroom joints.',
      iconName: 'Wrench',
      enabled: true,
      sortOrder: 2
    },
    {
      id: 'cat-ci-fittings',
      name: '⚙️ CI Fittings (Cast Iron)',
      urduName: 'سی آئی فٹنگز (کاسٹ آئرن ہیوی)',
      description: 'Threaded cast iron elbows, tees, sockets, reducers, and heavy commercial plumbing items.',
      iconName: 'Settings',
      enabled: true,
      sortOrder: 3
    },
    {
      id: 'cat-upvc-fittings',
      name: '🚿 UPVC Pressure Fittings',
      urduName: 'یو پی وی سی پریشر فٹنگز',
      description: 'Solvent weld UPVC elbows, tees, reducers, male/female adaptors, and end caps.',
      iconName: 'Droplet',
      enabled: true,
      sortOrder: 4
    },
    {
      id: 'cat-ppr-fittings',
      name: '🟢 PPR Hot & Cold Fittings',
      urduName: 'پی پی آر سی ہیٹ فیوژن فٹنگز',
      description: 'Polypropylene random copolymer heat fusion fittings, brass transition adaptors, and union joints.',
      iconName: 'Flame',
      enabled: true,
      sortOrder: 5
    },
    {
      id: 'cat-valves',
      name: '🎛️ Valves & Flow Controls',
      urduName: 'والوز (گیٹ، بال، چیک، نان ریٹرن والو)',
      description: 'Heavy brass gate valves, full bore ball valves, horizontal/vertical check valves, and foot valves.',
      iconName: 'Sliders',
      enabled: true,
      sortOrder: 6
    },
    {
      id: 'cat-tank-fittings',
      name: '🛢️ Water Tank Fittings',
      urduName: 'واٹر ٹینک فٹنگز اور کنیکٹرز',
      description: 'Tank connectors, heavy brass float valves, overflow unions, and tank outlet assemblies.',
      iconName: 'Droplets',
      enabled: true,
      sortOrder: 7
    },
    {
      id: 'cat-pump-accessories',
      name: '⚡ Pump & Motor Accessories',
      urduName: 'پمپ اور موٹر فٹنگز و کنکشنز',
      description: 'Suction unions, brass non-return valves, pressure switches, gauges, and flexible pump connectors.',
      iconName: 'Zap',
      enabled: true,
      sortOrder: 8
    },
    {
      id: 'cat-unions-nipples',
      name: '🧩 Unions, Nipples & Bushings',
      urduName: 'یونین، نپل، بوشنگ اور ایڈاپٹرز',
      description: 'Brass and GI threaded unions, hex nipples, barrel nipples, reducing bushes, and sockets.',
      iconName: 'Boxes',
      enabled: true,
      sortOrder: 9
    },
    {
      id: 'cat-accessories',
      name: '🧰 Installation Accessories & Solvents',
      urduName: 'انسٹالیشن سامان، سلوشن، ٹیفلون اور کلیمپ',
      description: 'Teflon thread seal tapes, UPVC solvent cements, PPR welding rods, GI clamps, and gasket seals.',
      iconName: 'Tool',
      enabled: true,
      sortOrder: 10
    }
  ],
  items: [
    // ---------------- PIPES ----------------
    {
      id: 'item-upvc-pipe',
      categoryId: 'cat-pipes',
      name: 'UPVC Pressure Pipe (Class B / Class C)',
      urduName: 'یو پی وی سی پریشر پائپ (کلاس بی / سی)',
      description: 'High-tensile UPVC pressure pipe for underground & overhead cold water supply lines.',
      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
      unit: '13 ft Length',
      enabled: true,
      sortOrder: 1,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH', 'MM'],
      material: 'UPVC',
      brand: 'Popular / Master / Beta',
      tags: ['pipe', 'upvc', 'water supply', 'pressure'],
      variants: [
        { id: 'v-upvc-050', itemId: 'item-upvc-pipe', sizeType: 'INCH', sizeLabel: '½"', price: 580, unit: '13 ft Length', length: '13 ft', material: 'UPVC', brand: 'Popular', grade: 'Class C', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-upvc-075', itemId: 'item-upvc-pipe', sizeType: 'INCH', sizeLabel: '¾"', price: 820, unit: '13 ft Length', length: '13 ft', material: 'UPVC', brand: 'Popular', grade: 'Class C', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-upvc-100', itemId: 'item-upvc-pipe', sizeType: 'INCH', sizeLabel: '1"', price: 1180, unit: '13 ft Length', length: '13 ft', material: 'UPVC', brand: 'Popular', grade: 'Class C', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-upvc-125', itemId: 'item-upvc-pipe', sizeType: 'INCH', sizeLabel: '1¼"', price: 1650, unit: '13 ft Length', length: '13 ft', material: 'UPVC', brand: 'Popular', grade: 'Class C', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-upvc-150', itemId: 'item-upvc-pipe', sizeType: 'INCH', sizeLabel: '1½"', price: 2150, unit: '13 ft Length', length: '13 ft', material: 'UPVC', brand: 'Popular', grade: 'Class C', enabled: true, sortOrder: 5, stockStatus: 'In Stock' },
        { id: 'v-upvc-200', itemId: 'item-upvc-pipe', sizeType: 'INCH', sizeLabel: '2"', price: 2950, unit: '13 ft Length', length: '13 ft', material: 'UPVC', brand: 'Popular', grade: 'Class C', enabled: true, sortOrder: 6, stockStatus: 'In Stock' },
        { id: 'v-upvc-300', itemId: 'item-upvc-pipe', sizeType: 'INCH', sizeLabel: '3"', price: 5400, unit: '13 ft Length', length: '13 ft', material: 'UPVC', brand: 'Popular', grade: 'Class B', enabled: true, sortOrder: 7, stockStatus: 'In Stock' },
        { id: 'v-upvc-400', itemId: 'item-upvc-pipe', sizeType: 'INCH', sizeLabel: '4"', price: 7800, unit: '13 ft Length', length: '13 ft', material: 'UPVC', brand: 'Popular', grade: 'Class B', enabled: true, sortOrder: 8, stockStatus: 'In Stock' },
        // MM equivalents
        { id: 'v-upvc-mm-20', itemId: 'item-upvc-pipe', sizeType: 'MM', sizeLabel: '20mm', price: 580, unit: '13 ft Length', length: '4 Meter', material: 'UPVC', brand: 'Popular', grade: 'PN 16', enabled: true, sortOrder: 9, stockStatus: 'In Stock' },
        { id: 'v-upvc-mm-25', itemId: 'item-upvc-pipe', sizeType: 'MM', sizeLabel: '25mm', price: 820, unit: '13 ft Length', length: '4 Meter', material: 'UPVC', brand: 'Popular', grade: 'PN 16', enabled: true, sortOrder: 10, stockStatus: 'In Stock' },
        { id: 'v-upvc-mm-32', itemId: 'item-upvc-pipe', sizeType: 'MM', sizeLabel: '32mm', price: 1180, unit: '13 ft Length', length: '4 Meter', material: 'UPVC', brand: 'Popular', grade: 'PN 16', enabled: true, sortOrder: 11, stockStatus: 'In Stock' },
        { id: 'v-upvc-mm-50', itemId: 'item-upvc-pipe', sizeType: 'MM', sizeLabel: '50mm', price: 2150, unit: '13 ft Length', length: '4 Meter', material: 'UPVC', brand: 'Popular', grade: 'PN 16', enabled: true, sortOrder: 12, stockStatus: 'In Stock' },
        { id: 'v-upvc-mm-63', itemId: 'item-upvc-pipe', sizeType: 'MM', sizeLabel: '63mm', price: 2950, unit: '13 ft Length', length: '4 Meter', material: 'UPVC', brand: 'Popular', grade: 'PN 16', enabled: true, sortOrder: 13, stockStatus: 'In Stock' }
      ]
    },
    {
      id: 'item-ppr-pipe',
      categoryId: 'cat-pipes',
      name: 'PPR Hot & Cold Pressure Pipe (PN 20)',
      urduName: 'پی پی آر سی گرم اور ٹھنڈے پانی کا پائپ (پی این 20)',
      description: 'Polypropylene Random Copolymer heat fusion pipe with high temperature resistance up to 95°C.',
      image: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=600&q=80',
      unit: '4 Meter Length',
      enabled: true,
      sortOrder: 2,
      defaultSizeType: 'MM',
      supportedSizeTypes: ['MM', 'INCH'],
      material: 'PPR-C (PN 20)',
      brand: 'Master / Turk Plast / Beta',
      tags: ['pipe', 'ppr', 'hot water', 'concealed'],
      variants: [
        { id: 'v-ppr-20', itemId: 'item-ppr-pipe', sizeType: 'MM', sizeLabel: '20mm (½")', price: 650, unit: '4 Meter Length', length: '4m', material: 'PPR', brand: 'Turk Plast', grade: 'PN 20', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-ppr-25', itemId: 'item-ppr-pipe', sizeType: 'MM', sizeLabel: '25mm (¾")', price: 920, unit: '4 Meter Length', length: '4m', material: 'PPR', brand: 'Turk Plast', grade: 'PN 20', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-ppr-32', itemId: 'item-ppr-pipe', sizeType: 'MM', sizeLabel: '32mm (1")', price: 1450, unit: '4 Meter Length', length: '4m', material: 'PPR', brand: 'Turk Plast', grade: 'PN 20', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-ppr-40', itemId: 'item-ppr-pipe', sizeType: 'MM', sizeLabel: '40mm (1¼")', price: 2250, unit: '4 Meter Length', length: '4m', material: 'PPR', brand: 'Turk Plast', grade: 'PN 20', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-ppr-50', itemId: 'item-ppr-pipe', sizeType: 'MM', sizeLabel: '50mm (1½")', price: 3400, unit: '4 Meter Length', length: '4m', material: 'PPR', brand: 'Turk Plast', grade: 'PN 20', enabled: true, sortOrder: 5, stockStatus: 'In Stock' },
        { id: 'v-ppr-63', itemId: 'item-ppr-pipe', sizeType: 'MM', sizeLabel: '63mm (2")', price: 4950, unit: '4 Meter Length', length: '4m', material: 'PPR', brand: 'Turk Plast', grade: 'PN 20', enabled: true, sortOrder: 6, stockStatus: 'In Stock' }
      ]
    },
    {
      id: 'item-pvc-drain-pipe',
      categoryId: 'cat-pipes',
      name: 'PVC Drainage & Sewer Waste Pipe',
      urduName: 'پی وی سی نکاسی آب اور سیوریج پائپ',
      description: 'Smooth interior drainage pipe for bathroom waste, rainwater downspouts, and underground drainage.',
      image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
      unit: '10 ft Length',
      enabled: true,
      sortOrder: 3,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH', 'MM'],
      material: 'PVC',
      brand: 'Popular / Master / Adamjee',
      tags: ['pipe', 'drainage', 'sewer', 'waste'],
      variants: [
        { id: 'v-pvc-2', itemId: 'item-pvc-drain-pipe', sizeType: 'INCH', sizeLabel: '2"', price: 650, unit: '10 ft Length', length: '10 ft', material: 'PVC', brand: 'Popular', grade: 'Drainage', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-pvc-3', itemId: 'item-pvc-drain-pipe', sizeType: 'INCH', sizeLabel: '3"', price: 1150, unit: '10 ft Length', length: '10 ft', material: 'PVC', brand: 'Popular', grade: 'Drainage', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-pvc-4', itemId: 'item-pvc-drain-pipe', sizeType: 'INCH', sizeLabel: '4"', price: 1650, unit: '10 ft Length', length: '10 ft', material: 'PVC', brand: 'Popular', grade: 'Drainage', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-pvc-6', itemId: 'item-pvc-drain-pipe', sizeType: 'INCH', sizeLabel: '6"', price: 3400, unit: '10 ft Length', length: '10 ft', material: 'PVC', brand: 'Popular', grade: 'Drainage', enabled: true, sortOrder: 4, stockStatus: 'In Stock' }
      ]
    },

    // ---------------- CP FITTINGS ----------------
    {
      id: 'item-cp-elbow',
      categoryId: 'cat-cp-fittings',
      name: 'CP Elbow 90° (Chrome Plated Brass)',
      urduName: 'سی پی کہنی (ایلبو) 90 ڈگری',
      description: 'Solid brass forged elbow with mirror chrome finish for bathroom mixers, tap connections, and exposed lines.',
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 1,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH', 'MM'],
      material: 'Chrome Plated Brass',
      brand: 'Sonex / Faisal / Master',
      tags: ['fitting', 'cp', 'elbow', 'brass'],
      variants: [
        { id: 'v-cp-elb-050', itemId: 'item-cp-elbow', sizeType: 'INCH', sizeLabel: '½"', price: 140, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-cp-elb-075', itemId: 'item-cp-elbow', sizeType: 'INCH', sizeLabel: '¾"', price: 180, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-cp-elb-100', itemId: 'item-cp-elbow', sizeType: 'INCH', sizeLabel: '1"', price: 260, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-cp-elb-125', itemId: 'item-cp-elbow', sizeType: 'INCH', sizeLabel: '1¼"', price: 390, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-cp-elb-150', itemId: 'item-cp-elbow', sizeType: 'INCH', sizeLabel: '1½"', price: 540, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 5, stockStatus: 'In Stock' },
        { id: 'v-cp-elb-200', itemId: 'item-cp-elbow', sizeType: 'INCH', sizeLabel: '2"', price: 880, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 6, stockStatus: 'In Stock' },
        // MM equivalents
        { id: 'v-cp-elb-mm20', itemId: 'item-cp-elbow', sizeType: 'MM', sizeLabel: '20mm', price: 140, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 7, stockStatus: 'In Stock' },
        { id: 'v-cp-elb-mm25', itemId: 'item-cp-elbow', sizeType: 'MM', sizeLabel: '25mm', price: 180, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 8, stockStatus: 'In Stock' },
        { id: 'v-cp-elb-mm32', itemId: 'item-cp-elbow', sizeType: 'MM', sizeLabel: '32mm', price: 260, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 9, stockStatus: 'In Stock' }
      ]
    },
    {
      id: 'item-cp-tee',
      categoryId: 'cat-cp-fittings',
      name: 'CP Equal Tee (Chrome Plated Brass)',
      urduName: 'سی پی ٹی (تین منہ والی فٹنگ)',
      description: '3-way equal CP brass tee for splitting hot or cold bathroom water feeds.',
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 2,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH', 'MM'],
      material: 'Chrome Plated Brass',
      brand: 'Sonex / Faisal / Master',
      tags: ['fitting', 'cp', 'tee', 'brass'],
      variants: [
        { id: 'v-cp-tee-050', itemId: 'item-cp-tee', sizeType: 'INCH', sizeLabel: '½"', price: 190, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-cp-tee-075', itemId: 'item-cp-tee', sizeType: 'INCH', sizeLabel: '¾"', price: 260, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-cp-tee-100', itemId: 'item-cp-tee', sizeType: 'INCH', sizeLabel: '1"', price: 380, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-cp-tee-125', itemId: 'item-cp-tee', sizeType: 'INCH', sizeLabel: '1¼"', price: 560, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-cp-tee-150', itemId: 'item-cp-tee', sizeType: 'INCH', sizeLabel: '1½"', price: 780, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 5, stockStatus: 'In Stock' },
        { id: 'v-cp-tee-200', itemId: 'item-cp-tee', sizeType: 'INCH', sizeLabel: '2"', price: 1250, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 6, stockStatus: 'In Stock' }
      ]
    },
    {
      id: 'item-cp-socket',
      categoryId: 'cat-cp-fittings',
      name: 'CP Socket / Coupler',
      urduName: 'سی پی ساکٹ / کپلر',
      description: 'Female threaded CP brass connector for joining two male threaded fittings.',
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 3,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH'],
      material: 'Chrome Plated Brass',
      brand: 'Sonex / Faisal',
      variants: [
        { id: 'v-cp-sock-050', itemId: 'item-cp-socket', sizeType: 'INCH', sizeLabel: '½"', price: 120, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-cp-sock-075', itemId: 'item-cp-socket', sizeType: 'INCH', sizeLabel: '¾"', price: 160, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-cp-sock-100', itemId: 'item-cp-socket', sizeType: 'INCH', sizeLabel: '1"', price: 230, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-cp-sock-125', itemId: 'item-cp-socket', sizeType: 'INCH', sizeLabel: '1¼"', price: 340, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-cp-sock-150', itemId: 'item-cp-socket', sizeType: 'INCH', sizeLabel: '1½"', price: 460, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 5, stockStatus: 'In Stock' },
        { id: 'v-cp-sock-200', itemId: 'item-cp-socket', sizeType: 'INCH', sizeLabel: '2"', price: 750, unit: 'Piece', material: 'CP Brass', brand: 'Sonex', enabled: true, sortOrder: 6, stockStatus: 'In Stock' }
      ]
    },
    {
      id: 'item-cp-barrel-nipple',
      categoryId: 'cat-cp-fittings',
      name: 'CP Barrel Nipple / Extension Piece',
      urduName: 'سی پی بیرل نپل / ایکسٹینشن',
      description: 'Solid brass threaded extension piece for wall mixer taps, bibcocks, and shower arms.',
      image: 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 4,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH'],
      material: 'Chrome Plated Brass',
      brand: 'Sonex',
      variants: [
        { id: 'v-cp-nip-050-1', itemId: 'item-cp-barrel-nipple', sizeType: 'INCH', sizeLabel: '½" × 1 inch', price: 95, unit: 'Piece', material: 'CP Brass', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-cp-nip-050-2', itemId: 'item-cp-barrel-nipple', sizeType: 'INCH', sizeLabel: '½" × 2 inch', price: 140, unit: 'Piece', material: 'CP Brass', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-cp-nip-050-3', itemId: 'item-cp-barrel-nipple', sizeType: 'INCH', sizeLabel: '½" × 3 inch', price: 190, unit: 'Piece', material: 'CP Brass', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-cp-nip-075-2', itemId: 'item-cp-barrel-nipple', sizeType: 'INCH', sizeLabel: '¾" × 2 inch', price: 180, unit: 'Piece', material: 'CP Brass', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-cp-nip-100-2', itemId: 'item-cp-barrel-nipple', sizeType: 'INCH', sizeLabel: '1" × 2 inch', price: 260, unit: 'Piece', material: 'CP Brass', enabled: true, sortOrder: 5, stockStatus: 'In Stock' }
      ]
    },

    // ---------------- CI FITTINGS (Cast Iron) ----------------
    {
      id: 'item-ci-elbow',
      categoryId: 'cat-ci-fittings',
      name: 'CI Heavy Elbow 90° (Cast Iron)',
      urduName: 'سی آئی ہیوی کہنی (کاسٹ آئرن)',
      description: 'Heavy duty cast iron 90-degree threaded elbow for high-pressure gas and industrial water plumbing.',
      image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 1,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH'],
      material: 'Cast Iron (CI)',
      brand: 'IIL / National',
      variants: [
        { id: 'v-ci-elb-050', itemId: 'item-ci-elbow', sizeType: 'INCH', sizeLabel: '½"', price: 110, unit: 'Piece', material: 'Cast Iron', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-ci-elb-075', itemId: 'item-ci-elbow', sizeType: 'INCH', sizeLabel: '¾"', price: 160, unit: 'Piece', material: 'Cast Iron', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-ci-elb-100', itemId: 'item-ci-elbow', sizeType: 'INCH', sizeLabel: '1"', price: 240, unit: 'Piece', material: 'Cast Iron', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-ci-elb-125', itemId: 'item-ci-elbow', sizeType: 'INCH', sizeLabel: '1¼"', price: 380, unit: 'Piece', material: 'Cast Iron', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-ci-elb-150', itemId: 'item-ci-elbow', sizeType: 'INCH', sizeLabel: '1½"', price: 520, unit: 'Piece', material: 'Cast Iron', enabled: true, sortOrder: 5, stockStatus: 'In Stock' },
        { id: 'v-ci-elb-200', itemId: 'item-ci-elbow', sizeType: 'INCH', sizeLabel: '2"', price: 820, unit: 'Piece', material: 'Cast Iron', enabled: true, sortOrder: 6, stockStatus: 'In Stock' },
        { id: 'v-ci-elb-300', itemId: 'item-ci-elbow', sizeType: 'INCH', sizeLabel: '3"', price: 1750, unit: 'Piece', material: 'Cast Iron', enabled: true, sortOrder: 7, stockStatus: 'In Stock' },
        { id: 'v-ci-elb-400', itemId: 'item-ci-elbow', sizeType: 'INCH', sizeLabel: '4"', price: 2900, unit: 'Piece', material: 'Cast Iron', enabled: true, sortOrder: 8, stockStatus: 'In Stock' }
      ]
    },
    {
      id: 'item-ci-tee',
      categoryId: 'cat-ci-fittings',
      name: 'CI Heavy Equal Tee (Cast Iron)',
      urduName: 'سی آئی ہیوی ٹی (کاسٹ آئرن)',
      description: 'Cast iron threaded equal branch tee for heavy plumbing and distribution lines.',
      image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 2,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH'],
      material: 'Cast Iron (CI)',
      variants: [
        { id: 'v-ci-tee-050', itemId: 'item-ci-tee', sizeType: 'INCH', sizeLabel: '½"', price: 160, unit: 'Piece', material: 'Cast Iron', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-ci-tee-075', itemId: 'item-ci-tee', sizeType: 'INCH', sizeLabel: '¾"', price: 230, unit: 'Piece', material: 'Cast Iron', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-ci-tee-100', itemId: 'item-ci-tee', sizeType: 'INCH', sizeLabel: '1"', price: 340, unit: 'Piece', material: 'Cast Iron', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-ci-tee-125', itemId: 'item-ci-tee', sizeType: 'INCH', sizeLabel: '1¼"', price: 540, unit: 'Piece', material: 'Cast Iron', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-ci-tee-150', itemId: 'item-ci-tee', sizeType: 'INCH', sizeLabel: '1½"', price: 720, unit: 'Piece', material: 'Cast Iron', enabled: true, sortOrder: 5, stockStatus: 'In Stock' },
        { id: 'v-ci-tee-200', itemId: 'item-ci-tee', sizeType: 'INCH', sizeLabel: '2"', price: 1150, unit: 'Piece', material: 'Cast Iron', enabled: true, sortOrder: 6, stockStatus: 'In Stock' }
      ]
    },
    {
      id: 'item-ci-hex-bush',
      categoryId: 'cat-ci-fittings',
      name: 'CI Hex Bush / Reducer Bush',
      urduName: 'سی آئی ہیکس بوشنگ ریڈیوسر',
      description: 'Male-to-female threaded reducing bush in cast iron.',
      image: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 3,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH'],
      material: 'Cast Iron (CI)',
      variants: [
        { id: 'v-ci-bush-1', itemId: 'item-ci-hex-bush', sizeType: 'INCH', sizeLabel: '¾" × ½"', price: 110, unit: 'Piece', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-ci-bush-2', itemId: 'item-ci-hex-bush', sizeType: 'INCH', sizeLabel: '1" × ½"', price: 150, unit: 'Piece', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-ci-bush-3', itemId: 'item-ci-hex-bush', sizeType: 'INCH', sizeLabel: '1" × ¾"', price: 150, unit: 'Piece', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-ci-bush-4', itemId: 'item-ci-hex-bush', sizeType: 'INCH', sizeLabel: '1¼" × 1"', price: 240, unit: 'Piece', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-ci-bush-5', itemId: 'item-ci-hex-bush', sizeType: 'INCH', sizeLabel: '1½" × 1"', price: 320, unit: 'Piece', enabled: true, sortOrder: 5, stockStatus: 'In Stock' },
        { id: 'v-ci-bush-6', itemId: 'item-ci-hex-bush', sizeType: 'INCH', sizeLabel: '2" × 1½"', price: 480, unit: 'Piece', enabled: true, sortOrder: 6, stockStatus: 'In Stock' }
      ]
    },

    // ---------------- UPVC FITTINGS ----------------
    {
      id: 'item-upvc-elbow',
      categoryId: 'cat-upvc-fittings',
      name: 'UPVC Pressure Elbow 90°',
      urduName: 'یو پی وی سی پریشر کہنی 90 ڈگری',
      description: 'Solvent weld UPVC elbow for high-pressure clean water plumbing.',
      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 1,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH', 'MM'],
      material: 'UPVC',
      brand: 'Popular / Master',
      variants: [
        { id: 'v-upvc-elb-050', itemId: 'item-upvc-elbow', sizeType: 'INCH', sizeLabel: '½"', price: 45, unit: 'Piece', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-upvc-elb-075', itemId: 'item-upvc-elbow', sizeType: 'INCH', sizeLabel: '¾"', price: 65, unit: 'Piece', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-upvc-elb-100', itemId: 'item-upvc-elbow', sizeType: 'INCH', sizeLabel: '1"', price: 95, unit: 'Piece', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-upvc-elb-125', itemId: 'item-upvc-elbow', sizeType: 'INCH', sizeLabel: '1¼"', price: 160, unit: 'Piece', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-upvc-elb-150', itemId: 'item-upvc-elbow', sizeType: 'INCH', sizeLabel: '1½"', price: 240, unit: 'Piece', enabled: true, sortOrder: 5, stockStatus: 'In Stock' },
        { id: 'v-upvc-elb-200', itemId: 'item-upvc-elbow', sizeType: 'INCH', sizeLabel: '2"', price: 380, unit: 'Piece', enabled: true, sortOrder: 6, stockStatus: 'In Stock' }
      ]
    },
    {
      id: 'item-upvc-tee',
      categoryId: 'cat-upvc-fittings',
      name: 'UPVC Pressure Equal Tee',
      urduName: 'یو پی وی سی پریشر ٹی',
      description: '3-way equal solvent weld UPVC tee fitting.',
      image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 2,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH', 'MM'],
      material: 'UPVC',
      variants: [
        { id: 'v-upvc-tee-050', itemId: 'item-upvc-tee', sizeType: 'INCH', sizeLabel: '½"', price: 60, unit: 'Piece', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-upvc-tee-075', itemId: 'item-upvc-tee', sizeType: 'INCH', sizeLabel: '¾"', price: 90, unit: 'Piece', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-upvc-tee-100', itemId: 'item-upvc-tee', sizeType: 'INCH', sizeLabel: '1"', price: 140, unit: 'Piece', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-upvc-tee-125', itemId: 'item-upvc-tee', sizeType: 'INCH', sizeLabel: '1¼"', price: 230, unit: 'Piece', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-upvc-tee-150', itemId: 'item-upvc-tee', sizeType: 'INCH', sizeLabel: '1½"', price: 330, unit: 'Piece', enabled: true, sortOrder: 5, stockStatus: 'In Stock' },
        { id: 'v-upvc-tee-200', itemId: 'item-upvc-tee', sizeType: 'INCH', sizeLabel: '2"', price: 540, unit: 'Piece', enabled: true, sortOrder: 6, stockStatus: 'In Stock' }
      ]
    },

    // ---------------- PPR FITTINGS ----------------
    {
      id: 'item-ppr-elbow',
      categoryId: 'cat-ppr-fittings',
      name: 'PPR Equal Elbow 90°',
      urduName: 'پی پی آر سی برابر کہنی 90 ڈگری',
      description: 'Heat fusion PPR elbow for concealed hot & cold plumbing.',
      image: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 1,
      defaultSizeType: 'MM',
      supportedSizeTypes: ['MM'],
      material: 'PPR',
      brand: 'Turk Plast / Master',
      variants: [
        { id: 'v-ppr-elb-20', itemId: 'item-ppr-elbow', sizeType: 'MM', sizeLabel: '20mm', price: 40, unit: 'Piece', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-ppr-elb-25', itemId: 'item-ppr-elbow', sizeType: 'MM', sizeLabel: '25mm', price: 60, unit: 'Piece', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-ppr-elb-32', itemId: 'item-ppr-elbow', sizeType: 'MM', sizeLabel: '32mm', price: 110, unit: 'Piece', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-ppr-elb-40', itemId: 'item-ppr-elbow', sizeType: 'MM', sizeLabel: '40mm', price: 190, unit: 'Piece', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-ppr-elb-50', itemId: 'item-ppr-elbow', sizeType: 'MM', sizeLabel: '50mm', price: 340, unit: 'Piece', enabled: true, sortOrder: 5, stockStatus: 'In Stock' },
        { id: 'v-ppr-elb-63', itemId: 'item-ppr-elbow', sizeType: 'MM', sizeLabel: '63mm', price: 580, unit: 'Piece', enabled: true, sortOrder: 6, stockStatus: 'In Stock' }
      ]
    },
    {
      id: 'item-ppr-fapt',
      categoryId: 'cat-ppr-fittings',
      name: 'PPR Brass Female Threaded Adaptor (FAPT)',
      urduName: 'پی پی آر سی پیتل فیمیل ایڈاپٹر / ساکٹ',
      description: 'PPR socket with embedded heavy brass female threads for connecting taps and mixers.',
      image: 'https://images.unsplash.com/photo-1616401784845-180882ba9ba8?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 2,
      defaultSizeType: 'MM',
      supportedSizeTypes: ['MM'],
      material: 'PPR with Brass Insert',
      variants: [
        { id: 'v-ppr-fapt-20-05', itemId: 'item-ppr-fapt', sizeType: 'MM', sizeLabel: '20mm × ½"', price: 210, unit: 'Piece', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-ppr-fapt-25-05', itemId: 'item-ppr-fapt', sizeType: 'MM', sizeLabel: '25mm × ½"', price: 260, unit: 'Piece', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-ppr-fapt-25-07', itemId: 'item-ppr-fapt', sizeType: 'MM', sizeLabel: '25mm × ¾"', price: 330, unit: 'Piece', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-ppr-fapt-32-10', itemId: 'item-ppr-fapt', sizeType: 'MM', sizeLabel: '32mm × 1"', price: 580, unit: 'Piece', enabled: true, sortOrder: 4, stockStatus: 'In Stock' }
      ]
    },

    // ---------------- VALVES ----------------
    {
      id: 'item-gate-valve',
      categoryId: 'cat-valves',
      name: 'Heavy Brass Gate Valve (Sluice Valve)',
      urduName: 'ہیوی پیتل گیٹ والو',
      description: 'Full-bore solid brass gate valve with red cast handle for main water lines and isolation control.',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 1,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH', 'MM'],
      material: 'Forged Brass',
      brand: 'Sonex / Valvo / Master',
      tags: ['valve', 'gate valve', 'brass', 'main line'],
      variants: [
        { id: 'v-gv-050', itemId: 'item-gate-valve', sizeType: 'INCH', sizeLabel: '½"', price: 680, unit: 'Piece', material: 'Brass', brand: 'Sonex', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-gv-075', itemId: 'item-gate-valve', sizeType: 'INCH', sizeLabel: '¾"', price: 890, unit: 'Piece', material: 'Brass', brand: 'Sonex', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-gv-100', itemId: 'item-gate-valve', sizeType: 'INCH', sizeLabel: '1"', price: 1280, unit: 'Piece', material: 'Brass', brand: 'Sonex', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-gv-125', itemId: 'item-gate-valve', sizeType: 'INCH', sizeLabel: '1¼"', price: 1850, unit: 'Piece', material: 'Brass', brand: 'Sonex', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-gv-150', itemId: 'item-gate-valve', sizeType: 'INCH', sizeLabel: '1½"', price: 2550, unit: 'Piece', material: 'Brass', brand: 'Sonex', enabled: true, sortOrder: 5, stockStatus: 'In Stock' },
        { id: 'v-gv-200', itemId: 'item-gate-valve', sizeType: 'INCH', sizeLabel: '2"', price: 3950, unit: 'Piece', material: 'Brass', brand: 'Sonex', enabled: true, sortOrder: 6, stockStatus: 'In Stock' },
        { id: 'v-gv-300', itemId: 'item-gate-valve', sizeType: 'INCH', sizeLabel: '3"', price: 8900, unit: 'Piece', material: 'Brass', brand: 'Sonex', enabled: true, sortOrder: 7, stockStatus: 'In Stock' },
        { id: 'v-gv-400', itemId: 'item-gate-valve', sizeType: 'INCH', sizeLabel: '4"', price: 14500, unit: 'Piece', material: 'Brass', brand: 'Sonex', enabled: true, sortOrder: 8, stockStatus: 'In Stock' }
      ]
    },
    {
      id: 'item-ball-valve',
      categoryId: 'cat-valves',
      name: 'Brass Quarter-Turn Ball Valve (PN 25)',
      urduName: 'پیتل بال والو (کوارٹر ٹرن ہینڈل)',
      description: 'Chrome brass ball valve with lever handle for instantaneous 90-degree shut-off.',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 2,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH', 'MM'],
      material: 'Nickel-Plated Brass',
      brand: 'Sonex / Itap / Master',
      variants: [
        { id: 'v-bv-050', itemId: 'item-ball-valve', sizeType: 'INCH', sizeLabel: '½"', price: 540, unit: 'Piece', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-bv-075', itemId: 'item-ball-valve', sizeType: 'INCH', sizeLabel: '¾"', price: 780, unit: 'Piece', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-bv-100', itemId: 'item-ball-valve', sizeType: 'INCH', sizeLabel: '1"', price: 1150, unit: 'Piece', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-bv-125', itemId: 'item-ball-valve', sizeType: 'INCH', sizeLabel: '1¼"', price: 1680, unit: 'Piece', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-bv-150', itemId: 'item-ball-valve', sizeType: 'INCH', sizeLabel: '1½"', price: 2350, unit: 'Piece', enabled: true, sortOrder: 5, stockStatus: 'In Stock' },
        { id: 'v-bv-200', itemId: 'item-ball-valve', sizeType: 'INCH', sizeLabel: '2"', price: 3600, unit: 'Piece', enabled: true, sortOrder: 6, stockStatus: 'In Stock' }
      ]
    },
    {
      id: 'item-check-valve-nrv',
      categoryId: 'cat-valves',
      name: 'Brass Non-Return Check Valve (NRV)',
      urduName: 'نان ریٹرن والو (این آر وی / یک طرفہ والو)',
      description: 'Spring-loaded one-way non-return valve preventing backflow to water meters, pumps, and tanks.',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 3,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH'],
      material: 'Brass with Stainless Spring',
      variants: [
        { id: 'v-nrv-050', itemId: 'item-check-valve-nrv', sizeType: 'INCH', sizeLabel: '½"', price: 620, unit: 'Piece', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-nrv-075', itemId: 'item-check-valve-nrv', sizeType: 'INCH', sizeLabel: '¾"', price: 860, unit: 'Piece', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-nrv-100', itemId: 'item-check-valve-nrv', sizeType: 'INCH', sizeLabel: '1"', price: 1250, unit: 'Piece', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-nrv-125', itemId: 'item-check-valve-nrv', sizeType: 'INCH', sizeLabel: '1¼"', price: 1850, unit: 'Piece', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-nrv-150', itemId: 'item-check-valve-nrv', sizeType: 'INCH', sizeLabel: '1½"', price: 2600, unit: 'Piece', enabled: true, sortOrder: 5, stockStatus: 'In Stock' },
        { id: 'v-nrv-200', itemId: 'item-check-valve-nrv', sizeType: 'INCH', sizeLabel: '2"', price: 4100, unit: 'Piece', enabled: true, sortOrder: 6, stockStatus: 'In Stock' }
      ]
    },
    {
      id: 'item-foot-valve',
      categoryId: 'cat-valves',
      name: 'Brass Foot Valve with Filter Strainer',
      urduName: 'فٹ والو مع جالی (پمپ سکشن والو)',
      description: 'Bottom suction foot valve with stainless mesh strainer for water pumps and underground cisterns.',
      image: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 4,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH'],
      material: 'Brass & Stainless Mesh',
      variants: [
        { id: 'v-fv-075', itemId: 'item-foot-valve', sizeType: 'INCH', sizeLabel: '¾"', price: 750, unit: 'Piece', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-fv-100', itemId: 'item-foot-valve', sizeType: 'INCH', sizeLabel: '1"', price: 1100, unit: 'Piece', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-fv-125', itemId: 'item-foot-valve', sizeType: 'INCH', sizeLabel: '1¼"', price: 1650, unit: 'Piece', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-fv-150', itemId: 'item-foot-valve', sizeType: 'INCH', sizeLabel: '1½"', price: 2350, unit: 'Piece', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-fv-200', itemId: 'item-foot-valve', sizeType: 'INCH', sizeLabel: '2"', price: 3750, unit: 'Piece', enabled: true, sortOrder: 5, stockStatus: 'In Stock' }
      ]
    },

    // ---------------- WATER TANK FITTINGS ----------------
    {
      id: 'item-tank-nipple',
      categoryId: 'cat-tank-fittings',
      name: 'Water Tank Connector / Flanged Nipple Assembly',
      urduName: 'واٹر ٹینک نپل مع واشر اور فلینج',
      description: 'Leak-proof double washer tank outlet nipple for polytank and overhead water reservoirs.',
      image: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 1,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH'],
      material: 'Heavy UPVC / Brass Nut',
      variants: [
        { id: 'v-tn-075', itemId: 'item-tank-nipple', sizeType: 'INCH', sizeLabel: '¾"', price: 180, unit: 'Piece', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-tn-100', itemId: 'item-tank-nipple', sizeType: 'INCH', sizeLabel: '1"', price: 260, unit: 'Piece', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-tn-125', itemId: 'item-tank-nipple', sizeType: 'INCH', sizeLabel: '1¼"', price: 390, unit: 'Piece', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-tn-150', itemId: 'item-tank-nipple', sizeType: 'INCH', sizeLabel: '1½"', price: 540, unit: 'Piece', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-tn-200', itemId: 'item-tank-nipple', sizeType: 'INCH', sizeLabel: '2"', price: 850, unit: 'Piece', enabled: true, sortOrder: 5, stockStatus: 'In Stock' }
      ]
    },
    {
      id: 'item-float-valve',
      categoryId: 'cat-tank-fittings',
      name: 'Heavy Brass Float Valve with Copper/Plastic Ball',
      urduName: 'ہیوی پیتل فلوٹ والو مع بال (آٹومیٹک ٹینک بند کرنے والا)',
      description: 'Automatic water level shut-off valve with adjustable brass rod and floating ball.',
      image: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 2,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH'],
      material: 'Brass & Copper/Plastic Ball',
      variants: [
        { id: 'v-flv-050', itemId: 'item-float-valve', sizeType: 'INCH', sizeLabel: '½"', price: 850, unit: 'Piece', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-flv-075', itemId: 'item-float-valve', sizeType: 'INCH', sizeLabel: '¾"', price: 1250, unit: 'Piece', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-flv-100', itemId: 'item-float-valve', sizeType: 'INCH', sizeLabel: '1"', price: 1850, unit: 'Piece', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-flv-150', itemId: 'item-float-valve', sizeType: 'INCH', sizeLabel: '1½"', price: 3400, unit: 'Piece', enabled: true, sortOrder: 4, stockStatus: 'In Stock' }
      ]
    },

    // ---------------- UNIONS & NIPPLES ----------------
    {
      id: 'item-union-brass',
      categoryId: 'cat-unions-nipples',
      name: 'Threaded Pipe Union (Brass Seat)',
      urduName: 'تھریڈڈ پائپ یونین مع پیتل سیٹ',
      description: 'Quick-disconnect threaded union with ground brass seat for easy pump removal and line maintenance.',
      image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80',
      unit: 'Piece',
      enabled: true,
      sortOrder: 1,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH', 'MM'],
      material: 'GI / Brass Seat',
      variants: [
        { id: 'v-un-050', itemId: 'item-union-brass', sizeType: 'INCH', sizeLabel: '½"', price: 220, unit: 'Piece', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-un-075', itemId: 'item-union-brass', sizeType: 'INCH', sizeLabel: '¾"', price: 290, unit: 'Piece', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-un-100', itemId: 'item-union-brass', sizeType: 'INCH', sizeLabel: '1"', price: 420, unit: 'Piece', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-un-125', itemId: 'item-union-brass', sizeType: 'INCH', sizeLabel: '1¼"', price: 650, unit: 'Piece', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-un-150', itemId: 'item-union-brass', sizeType: 'INCH', sizeLabel: '1½"', price: 890, unit: 'Piece', enabled: true, sortOrder: 5, stockStatus: 'In Stock' },
        { id: 'v-un-200', itemId: 'item-union-brass', sizeType: 'INCH', sizeLabel: '2"', price: 1450, unit: 'Piece', enabled: true, sortOrder: 6, stockStatus: 'In Stock' }
      ]
    },

    // ---------------- ACCESSORIES & SOLVENTS ----------------
    {
      id: 'item-teflon-tape',
      categoryId: 'cat-accessories',
      name: 'Heavy Duty PTFE Teflon Thread Seal Tape',
      urduName: 'ٹیفلون ٹیپ (دھاگہ سیل کرنے والا ٹیپ)',
      description: 'High-density PTFE thread seal tape for leak-proof water, air, and gas joints.',
      image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80',
      unit: 'Roll',
      enabled: true,
      sortOrder: 1,
      defaultSizeType: 'OTHER',
      supportedSizeTypes: ['OTHER'],
      material: 'PTFE',
      variants: [
        { id: 'v-tef-std', itemId: 'item-teflon-tape', sizeType: 'OTHER', sizeLabel: 'Standard (12mm × 10m)', price: 40, unit: 'Roll', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-tef-hvy', itemId: 'item-teflon-tape', sizeType: 'OTHER', sizeLabel: 'Heavy Gas Grade (19mm × 15m)', price: 85, unit: 'Roll', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-tef-box', itemId: 'item-teflon-tape', sizeType: 'OTHER', sizeLabel: 'Full Box (10 Rolls)', price: 380, unit: 'Box', enabled: true, sortOrder: 3, stockStatus: 'In Stock' }
      ]
    },
    {
      id: 'item-solvent-cement',
      categoryId: 'cat-accessories',
      name: 'UPVC / PVC Solvent Cement Adhesive Tin',
      urduName: 'یو پی وی سی سلوشن (سیمنٹ گم)',
      description: 'Fast-setting industrial adhesive solution for permanent bonding of UPVC pressure and drainage fittings.',
      image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80',
      unit: 'Tin',
      enabled: true,
      sortOrder: 2,
      defaultSizeType: 'OTHER',
      supportedSizeTypes: ['OTHER'],
      material: 'Solvent Cement',
      brand: 'Popular / Samad / Tiger',
      variants: [
        { id: 'v-sol-100', itemId: 'item-solvent-cement', sizeType: 'OTHER', sizeLabel: '100 ml Tube', price: 90, unit: 'Tube', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-sol-250', itemId: 'item-solvent-cement', sizeType: 'OTHER', sizeLabel: '250 gram Tin', price: 240, unit: 'Tin', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-sol-500', itemId: 'item-solvent-cement', sizeType: 'OTHER', sizeLabel: '500 gram Tin', price: 420, unit: 'Tin', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-sol-1000', itemId: 'item-solvent-cement', sizeType: 'OTHER', sizeLabel: '1000 gram (1 Kg) Tin', price: 780, unit: 'Tin', enabled: true, sortOrder: 4, stockStatus: 'In Stock' }
      ]
    },
    {
      id: 'item-pipe-clamps',
      categoryId: 'cat-accessories',
      name: 'GI Heavy Pipe Clamps with Rawal Plugs',
      urduName: 'جی آئی پائپ کلیمپ مع راول پلگ اور پیچ',
      description: 'Galvanized iron wall fixing clamps with rubber vibration dampeners for secure pipe routing.',
      image: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=600&q=80',
      unit: 'Pack of 5',
      enabled: true,
      sortOrder: 3,
      defaultSizeType: 'INCH',
      supportedSizeTypes: ['INCH'],
      material: 'Galvanized Steel',
      variants: [
        { id: 'v-cl-050', itemId: 'item-pipe-clamps', sizeType: 'INCH', sizeLabel: '½"', price: 120, unit: 'Pack of 5', enabled: true, sortOrder: 1, stockStatus: 'In Stock' },
        { id: 'v-cl-075', itemId: 'item-pipe-clamps', sizeType: 'INCH', sizeLabel: '¾"', price: 150, unit: 'Pack of 5', enabled: true, sortOrder: 2, stockStatus: 'In Stock' },
        { id: 'v-cl-100', itemId: 'item-pipe-clamps', sizeType: 'INCH', sizeLabel: '1"', price: 190, unit: 'Pack of 5', enabled: true, sortOrder: 3, stockStatus: 'In Stock' },
        { id: 'v-cl-150', itemId: 'item-pipe-clamps', sizeType: 'INCH', sizeLabel: '1½"', price: 260, unit: 'Pack of 5', enabled: true, sortOrder: 4, stockStatus: 'In Stock' },
        { id: 'v-cl-200', itemId: 'item-pipe-clamps', sizeType: 'INCH', sizeLabel: '2"', price: 340, unit: 'Pack of 5', enabled: true, sortOrder: 5, stockStatus: 'In Stock' },
        { id: 'v-cl-300', itemId: 'item-pipe-clamps', sizeType: 'INCH', sizeLabel: '3"', price: 480, unit: 'Pack of 5', enabled: true, sortOrder: 6, stockStatus: 'In Stock' },
        { id: 'v-cl-400', itemId: 'item-pipe-clamps', sizeType: 'INCH', sizeLabel: '4"', price: 620, unit: 'Pack of 5', enabled: true, sortOrder: 7, stockStatus: 'In Stock' }
      ]
    }
  ]
};
