import React, { useState, useMemo } from 'react';
import { 
  Sparkles, 
  Calculator, 
  Wrench, 
  Maximize2, 
  Truck, 
  ArrowRight,
  Droplets,
  HardHat,
  Building2,
  Boxes,
  Palette,
  Search,
  Bot,
  Filter,
  Layers,
  ChevronRight
} from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SmartToolsSettings, SmartToolId } from '../types';
import { defaultSmartToolsSettings } from '../data/defaultSmartToolsConfig';

interface SmartToolsPageProps {
  onOpenSmartTool?: (toolId: any) => void;
  onOpenTool?: (toolId: any) => void;
  onOpenConstructionBuilder?: () => void;
  onOpenBuilder?: () => void;
  onOpenDeliveryChecker?: () => void;
  onNavigate: (path: string) => void;
  settings?: SmartToolsSettings;
}

export const SmartToolsPage: React.FC<SmartToolsPageProps> = ({
  onOpenSmartTool,
  onOpenTool,
  onOpenConstructionBuilder,
  onOpenBuilder,
  onOpenDeliveryChecker,
  onNavigate,
  settings
}) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'construction' | 'sanitary' | 'budget'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Safe action handlers
  const handleTool = (toolId: string) => {
    if (onOpenTool) {
      onOpenTool(toolId as SmartToolId);
    } else if (onOpenSmartTool) {
      onOpenSmartTool(toolId);
    }
  };

  const handleBuilder = () => {
    if (onOpenBuilder) {
      onOpenBuilder();
    } else if (onOpenConstructionBuilder) {
      onOpenConstructionBuilder();
    } else {
      handleTool('fitting-builder');
    }
  };

  const handleDelivery = () => {
    if (onOpenDeliveryChecker) {
      onOpenDeliveryChecker();
    } else {
      onNavigate('/delivery');
    }
  };

  const tools = useMemo(() => [
    {
      id: 'fitting-builder',
      title: 'Smart Construction & Fitting Builder',
      urduTitle: 'اسمارٹ کنسٹرکشن اور پائپ فٹنگ بلڈر',
      category: 'construction',
      badge: 'POPULAR PACKAGER',
      description: 'Step-by-step construction builder to bundle commodes, vanity basins, mixers, drains, valves, and pipes for whole-house construction.',
      icon: <Wrench className="w-6 h-6 text-blue-600" />,
      action: () => handleBuilder(),
      cta: 'Launch Fitting Builder'
    },
    {
      id: 'cement-calculator',
      title: 'Cement & Mortar Bag Estimator',
      urduTitle: 'سیمنٹ کیلکولیٹر',
      category: 'construction',
      badge: 'MARLA PRESETS',
      description: 'Accurately calculate required cement bags, sand volume, and aggregate for brick masonry, plaster, and concrete slabs with Marla presets.',
      icon: <HardHat className="w-6 h-6 text-amber-600" />,
      action: () => handleTool('cement-calculator'),
      cta: 'Calculate Cement Bags'
    },
    {
      id: 'bathroom-planner',
      title: 'Interactive 3D Bathroom Planner',
      urduTitle: 'باتھ روم پلانر',
      category: 'sanitary',
      badge: '5-STEP WIZARD',
      description: 'Design bathroom floor plans, calculate fixture spacing, clearances, and generate recommended vanity and shower configurations.',
      icon: <Maximize2 className="w-6 h-6 text-emerald-600" />,
      action: () => handleTool('bathroom-planner'),
      cta: 'Open Bathroom Planner'
    },
    {
      id: 'material-estimator',
      title: 'Building Material Cost Estimator',
      urduTitle: 'میٹیریل تخمینہ',
      category: 'construction',
      badge: 'CIVIL BREAKDOWN',
      description: 'Comprehensive cost estimation for grey structure, plumbing rough-ins, finish sanitaryware, and exterior painting coats.',
      icon: <Calculator className="w-6 h-6 text-purple-600" />,
      action: () => handleTool('material-estimator'),
      cta: 'Estimate Materials'
    },
    {
      id: 'construction-cost',
      title: 'House Construction Cost Estimator',
      urduTitle: 'گھر کی تعمیر کا تخمینہ لاگت',
      category: 'construction',
      badge: 'PKR COST RANGE',
      description: 'Select 3, 5, 7, 10 Marla or 1 Kanal, construction stage (Grey Structure vs Complete), and quality grade to get realistic PKR cost estimates.',
      icon: <Building2 className="w-6 h-6 text-amber-600" />,
      action: () => handleTool('construction-cost'),
      cta: 'Estimate House Cost'
    },
    {
      id: 'bricks',
      title: 'House Brick Calculator',
      urduTitle: 'گھر کے لیے اینٹوں کا کیلکولیٹر',
      category: 'construction',
      badge: 'HOUSE WIZARD',
      description: 'Enter your house type, dimensions, rooms, kitchens, washrooms, and openings to easily calculate required bricks, estimated range, and mortar bags.',
      icon: <Boxes className="w-6 h-6 text-orange-600" />,
      action: () => handleTool('bricks'),
      cta: 'Calculate Bricks'
    },
    {
      id: 'budget-products',
      title: 'Budget-to-Products AI',
      urduTitle: 'بجٹ کے مطابق پراڈکٹس AI',
      category: 'budget',
      badge: 'AI INVENTORY MATCHER',
      description: 'Enter your budget in PKR (e.g. Rs. 100,000 for 1 bathroom) and our intelligent system curates a complete shopping list of real store items.',
      icon: <Bot className="w-6 h-6 text-indigo-600" />,
      action: () => handleTool('budget-products'),
      cta: 'Find by Budget'
    },
    {
      id: 'product-finder',
      title: 'Smart Product Finder',
      urduTitle: 'اسمارٹ پراڈکٹ فائنڈر',
      category: 'sanitary',
      badge: 'QUICK SEARCH',
      description: 'Filter by item category (Toilet, Basin, Shower, Taps, Tanks, Pipes), exact budget, and quality preference to instantly find in-stock products.',
      icon: <Search className="w-6 h-6 text-blue-600" />,
      action: () => handleTool('product-finder'),
      cta: 'Find Products'
    },
    {
      id: 'paint',
      title: 'Paint Quantity Calculator',
      urduTitle: 'پینٹ کی مقدار کا کیلکولیٹر',
      category: 'construction',
      badge: 'ROOM COVERAGE',
      description: 'Enter room length, width, height, and openings to calculate paintable surface area and required paint in Litres, Gallons, and Drums.',
      icon: <Palette className="w-6 h-6 text-rose-600" />,
      action: () => handleTool('paint'),
      cta: 'Calculate Paint'
    },
    {
      id: 'ai-paint-visualizer',
      title: 'AI Paint Color Visualizer',
      urduTitle: 'اے آئی پینٹ کلر ویژولائزر',
      category: 'budget',
      badge: 'AI PHOTO ANALYSIS',
      description: 'Upload a photo of your living room, bedroom, or exterior wall. Our AI analyzes lighting and suggests matching paint shades from our catalog.',
      icon: <Sparkles className="w-6 h-6 text-rose-500" />,
      action: () => handleTool('ai-paint-visualizer'),
      cta: 'Try AI Visualizer'
    },
    {
      id: 'water-tank',
      title: 'Water Tank & Booster Sizing Guide',
      urduTitle: 'پانی کا ٹینک اور پمپ کیلکولیٹر',
      category: 'sanitary',
      badge: 'PLUMBING SIZING',
      description: 'Calculate optimal overhead and underground water storage requirements in Litres and Gallons based on family size and building storeys.',
      icon: <Droplets className="w-6 h-6 text-cyan-600" />,
      action: () => handleTool('water-tank'),
      cta: 'Size Water Tank'
    },
    {
      id: 'delivery-checker',
      title: 'Nationwide Delivery Fee Checker',
      urduTitle: 'ڈلیوری ریٹس چیکر',
      category: 'budget',
      badge: 'LOGISTICS ACCURACY',
      description: 'Check verified road cargo delivery rates for Chiniot, Faisalabad, Lahore, Rawalpindi, Karachi, and all cities in Pakistan.',
      icon: <Truck className="w-6 h-6 text-emerald-600" />,
      action: () => handleDelivery(),
      cta: 'Check Delivery Rates'
    }
  ], [handleTool, handleBuilder, handleDelivery]);

  const filteredTools = useMemo(() => {
    return tools.filter(tool => {
      if (activeCategory !== 'all') {
        if (activeCategory === 'construction' && !['fitting-builder', 'cement-calculator', 'material-estimator', 'construction-cost', 'bricks', 'paint'].includes(tool.id)) {
          return false;
        }
        if (activeCategory === 'sanitary' && !['fitting-builder', 'bathroom-planner', 'product-finder', 'water-tank'].includes(tool.id)) {
          return false;
        }
        if (activeCategory === 'budget' && !['budget-products', 'construction-cost', 'ai-paint-visualizer', 'delivery-checker'].includes(tool.id)) {
          return false;
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = tool.title.toLowerCase().includes(q);
        const matchDesc = tool.description.toLowerCase().includes(q);
        const matchUrdu = (tool.urduTitle || '').includes(q);
        if (!matchTitle && !matchDesc && !matchUrdu) return false;
      }

      return true;
    });
  }, [tools, activeCategory, searchQuery]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[{ label: 'Smart Engineering Tools', active: true }]}
        onNavigateHome={() => onNavigate('/')}
      />

      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INTERACTIVE ESTIMATION SUITE (12 SMART TOOLS)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif tracking-tight">
            Smart Construction, Sanitary & Estimation Tools
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Engineering calculators, bathroom layout visualizers, brick estimators, and material budgeting utilities crafted specifically for homeowners, plumbers, and contractors in Pakistan.
          </p>

          {/* Quick Filter & Search Bar */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'all', label: 'All 12 Tools' },
                { id: 'construction', label: '🏗️ Civil & Construction' },
                { id: 'sanitary', label: '🚿 Sanitary & Plumbing' },
                { id: 'budget', label: '💰 Budget & AI Matching' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all ${
                    activeCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search calculator or tool..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-800/90 border border-slate-700 text-white rounded-xl pl-9 pr-3 py-1.5 text-xs placeholder-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              onClick={tool.action}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-400 transition-all p-6 flex flex-col justify-between space-y-6 cursor-pointer group"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {tool.icon}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    {tool.badge}
                  </span>
                </div>

                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    {tool.title}
                  </h2>
                  {tool.urduTitle && (
                    <span className="text-xs text-slate-500 font-arabic block mt-0.5">
                      {tool.urduTitle}
                    </span>
                  )}
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  tool.action();
                }}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-blue-600 group-hover:bg-blue-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>{tool.cta}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ))}
        </div>

        {filteredTools.length === 0 && (
          <div className="text-center py-16 space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-slate-700">No smart tools match "{searchQuery}"</p>
            <button
              onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
              className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
            >
              Reset Search & Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
