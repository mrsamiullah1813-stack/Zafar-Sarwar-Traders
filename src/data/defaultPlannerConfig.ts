import { EasyBathroomPlannerConfig, AiDesignerConfig } from '../types';

export const defaultEasyBathroomPlannerConfig: EasyBathroomPlannerConfig = {
  isEnabled: true,
  title: "Easy Bathroom Planner",
  urduTitle: "آسان باتھ روم پلانر",
  subtitle: "Build your complete sanitary & bathroom package in 4 simple steps",
  urduSubtitle: "4 آسان سوالوں میں اپنے باتھ روم کے سامان کا پیکج اور تخمینہ معلوم کریں",
  whatsappTemplate: `*ZAFAR SARWAR TRADERS — BATHROOM PACKAGE INQUIRY*

Assalam-o-Alaikum,
I created a customized bathroom package on your website:

• *Bathroom Type:* {bathroomType}
• *Style & Finish:* {style}
• *Target Budget:* {budget}
• *Selected Items:* {itemsCount} Fixtures

*RECOMMENDED PACKAGE ITEMS:*
{itemsList}

*ESTIMATED PACKAGE VALUE:* PKR {totalPrice}

Please confirm brand availability, showroom package discount, and delivery schedule to my city.`,
  bathroomTypes: [
    {
      id: 'master',
      name: 'Master Bathroom',
      urduName: 'بڑا ماسٹر باتھ روم (Attach Bath)',
      description: 'Full suite with premium vanity, English commode, concealed/rain shower & complete luxury fittings.',
      icon: 'Crown',
      recommendedFixtures: ['toilet', 'basin', 'shower', 'muslim_shower', 'accessories', 'fittings']
    },
    {
      id: 'standard',
      name: 'Family / Daily Bath',
      urduName: 'روزمرہ فیملی باتھ روم (Standard Bath)',
      description: 'Durable, long-lasting sanitary setup for everyday family bedrooms with official brand warranty.',
      icon: 'Home',
      recommendedFixtures: ['toilet', 'basin', 'shower', 'muslim_shower', 'accessories', 'fittings']
    },
    {
      id: 'guest',
      name: 'Guest / Powder Room',
      urduName: 'مہمانوں کے لیے (Powder / Guest Room)',
      description: 'Compact elegant setup: stylish wash basin, commode, designer mirror & towel accessories.',
      icon: 'Sparkles',
      recommendedFixtures: ['toilet', 'basin', 'muslim_shower', 'accessories']
    },
    {
      id: 'rental',
      name: 'Rental / Commercial Unit',
      urduName: 'کرائے یا دکان / کمرشل کے لیے',
      description: 'Smart high-durability budget fixtures designed for heavy usage, rental portions & commercial plazas.',
      icon: 'Building2',
      recommendedFixtures: ['toilet', 'basin', 'muslim_shower', 'fittings']
    }
  ],
  fixtures: [
    {
      id: 'toilet',
      name: 'English Commode / WC Set',
      urduName: 'کمبوڈ یا ون پیس ٹوائلٹ سیٹ',
      description: 'Ceramic commode with soft-close seat, dual flush mechanism & water tank.',
      categoryGroup: 'toilets',
      icon: 'Toilet',
      defaultChecked: true
    },
    {
      id: 'basin',
      name: 'Wash Basin & Vanity Mixer',
      urduName: 'ہاتھ دھونے کا بیسن اور مکسر نل',
      description: 'Ceramic vessel basin or vanity with heavy brass single-lever hot & cold mixer.',
      categoryGroup: 'wash-basins',
      icon: 'Droplet',
      defaultChecked: true
    },
    {
      id: 'shower',
      name: 'Shower Set / Rain Shower',
      urduName: 'نہانے کا شاور اور مکسر سیٹ',
      description: 'Overhead cascade rain shower, telephone hand shower & wall mixer valve.',
      categoryGroup: 'showers',
      icon: 'ShowerHead',
      defaultChecked: true
    },
    {
      id: 'muslim_shower',
      name: 'Muslim Shower & Bib Cock',
      urduName: 'مسلم شاور اور بیب کاک',
      description: 'High-pressure flexible chrome/black Muslim shower with dual-function bib cock tap.',
      categoryGroup: 'bathroom-accessories',
      icon: 'Pipette',
      defaultChecked: true
    },
    {
      id: 'accessories',
      name: 'Mirror & Bath Accessories (6-pc)',
      urduName: 'آئینہ، تولیہ راڈ، صابن دانی اور ہکس',
      description: 'LED/Beveled mirror, towel rod, double shelf, soap dish, tumbler holder & paper holder.',
      categoryGroup: 'bathroom-accessories',
      icon: 'Sparkles',
      defaultChecked: true
    },
    {
      id: 'fittings',
      name: 'Plumbing & Drain Fittings',
      urduName: 'اینگل والو، ویسٹ پائپ اور فلور جالی',
      description: 'Heavy CP angle valves, bottle trap waste pipe, and stainless anti-cockroach floor drain.',
      categoryGroup: 'pvc-pipes',
      icon: 'Wrench',
      defaultChecked: true
    }
  ],
  styles: [
    {
      id: 'chrome',
      name: 'Classic Chrome',
      urduName: 'چمکدار کروم (ہمیشہ پسندیدہ)',
      description: 'High-gloss electroplated mirror chrome finish — timeless, brilliant & easy to maintain.',
      colorHex: '#94a3b8',
      badge: 'MOST POPULAR'
    },
    {
      id: 'matte-black',
      name: 'Matte Black',
      urduName: 'میٹ بلیک (ماڈرن اور جدید)',
      description: 'Ultra-modern fingerprint resistant velvet black — stunning bold architectural look.',
      colorHex: '#18181b',
      badge: 'TRENDING'
    },
    {
      id: 'gold',
      name: 'Royal Gold / Brass',
      urduName: 'شاہی گولڈ اور براس',
      description: 'PVD brushed gold & warm champagne brass finish for a true luxury palace aesthetic.',
      colorHex: '#eab308',
      badge: 'LUXURY'
    },
    {
      id: 'white',
      name: 'Pure White Ceramic',
      urduName: 'سادہ سفید پورسلین',
      description: 'Pristine glazed white porcelain paired with sleek minimal fixtures for a bright, clean feel.',
      colorHex: '#ffffff',
      badge: 'CLEAN'
    }
  ],
  budgetTiers: [
    {
      id: 'economy',
      name: 'Economy Tier',
      urduName: 'مناسب بجٹ (Smart Budget)',
      priceRange: 'PKR 25,000 – 50,000',
      description: 'High durability sanitaryware and reliable brass fittings at competitive wholesale budget rates.',
      badge: 'BUDGET FRIENDLY',
      multiplier: 0.75
    },
    {
      id: 'standard',
      name: 'Standard Quality',
      urduName: 'عام روایتی (Most Popular)',
      priceRange: 'PKR 50,000 – 100,000',
      description: 'Best-selling Pakistani brand fixtures (Master, Sonex, Faisal) with 10-year official warranty.',
      badge: 'RECOMMENDED',
      multiplier: 1.0
    },
    {
      id: 'luxury',
      name: 'Premium / Luxury Tier',
      urduName: 'وی آئی پی / امپورٹڈ (Luxury Grade)',
      priceRange: 'PKR 100,000+',
      description: 'Flagship imported designer ensembles, Italian marble consoles & thermostatic rain panels.',
      badge: 'FLAGSHIP VIP',
      multiplier: 1.6
    }
  ],
  rules: [],
  productTags: {},
  disclaimerText: "Note: Estimated package price is calculated from current showroom inventory rates. Final price may vary based on exact model selection and custom color preferences. All products are 100% original with manufacturer warranty."
};

// Backward compatibility alias for existing storage/CMS references
export const defaultBathroomPlannerConfig: AiDesignerConfig = {
  isEnabled: true,
  title: "Easy Bathroom Planner",
  subtitle: "Build your complete sanitary & bathroom package in 4 simple steps",
  bannerTag: "INSTANT BATHROOM PACKAGE GENERATOR",
  whatsappTemplate: defaultEasyBathroomPlannerConfig.whatsappTemplate,
  roomTypes: [
    { id: 'master', label: 'Master Bathroom', description: 'Primary family bathrooms, ensuite suites & master spa baths', icon: 'Home' },
    { id: 'standard', label: 'Standard Family Bath', description: 'Standard layout for daily family bedrooms', icon: 'Sparkles' },
    { id: 'guest', label: 'Guest / Powder Room', description: 'Compact powder rooms & luxury guest half-baths', icon: 'Minimize2' },
    { id: 'rental', label: 'Rental / Commercial Bath', description: 'Durable, high-utility budget fixtures', icon: 'Building2' }
  ],
  styles: [
    { id: 'chrome', label: 'Classic Chrome', description: 'Sleek lines, geometric silhouettes & concealed thermostatic valves', badge: 'POPULAR' },
    { id: 'matte-black', label: 'Matte Black', description: 'Deep fingerprint-resistant obsidian black with velvet feel', badge: 'TRENDING' },
    { id: 'gold', label: 'Royal Gold', description: 'Bespoke champagne, PVD brushed gold & warm brass highlights', badge: 'LUXURY' },
    { id: 'white', label: 'Pure White Ceramic', description: 'Rimless white porcelain, floating fixtures & uncluttered space', badge: 'CLEAN' }
  ],
  colorThemes: [
    { id: 'Chrome', label: 'Classic Chrome', hex: '#cbd5e1', gradient: 'from-slate-300 to-slate-400', description: 'Mirror-finish electroplated chrome' },
    { id: 'Matte Black', label: 'Matte Black', hex: '#09090b', gradient: 'from-zinc-900 to-black', description: 'Deep fingerprint-resistant obsidian black' },
    { id: 'Gold', label: 'Brushed Gold', hex: '#eab308', gradient: 'from-amber-400 to-yellow-600', description: 'Bespoke champagne, PVD brushed gold' },
    { id: 'White', label: 'Pure White', hex: '#ffffff', gradient: 'from-slate-100 to-white', description: 'Classic porcelain white' }
  ],
  budgetLevels: [
    { id: 'economy', label: 'Economy Tier', description: 'High-durability certified sanitaryware for smart economical renovation', priceRange: 'PKR 25,000 - 50,000' },
    { id: 'standard', label: 'Standard Tier', description: 'Balanced performance, pure brass cores & 10-year official warranty', priceRange: 'PKR 50,000 - 100,000' },
    { id: 'luxury', label: 'Luxury Tier', description: 'Imported flagship designer ensembles & custom marble craftsmanship', priceRange: 'PKR 100,000+' }
  ],
  roomSizes: [
    { id: 'Small', label: 'Small Room', description: 'Compact layout under 45 sq.ft (e.g. 5ft x 8ft powder bath)', sqftRange: '< 45 sq.ft' },
    { id: 'Medium', label: 'Medium Room', description: 'Standard layout 45 – 85 sq.ft (e.g. 7ft x 10ft family bathroom)', sqftRange: '45 – 85 sq.ft' },
    { id: 'Large', label: 'Large Room', description: 'Expansive master spa suite 85+ sq.ft (e.g. 10ft x 12ft or larger)', sqftRange: '> 85 sq.ft' }
  ],
  rules: [],
  productTags: {}
};
