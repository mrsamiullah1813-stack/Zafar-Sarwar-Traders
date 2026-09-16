import React from 'react';
import { 
  Sparkles, 
  Calculator, 
  Wrench, 
  Maximize2, 
  Truck, 
  Coins, 
  ArrowRight,
  Layers,
  Droplets,
  HardHat
} from 'lucide-react';
import { Breadcrumbs } from '../components/Breadcrumbs';

interface SmartToolsPageProps {
  onOpenSmartTool?: (toolId: any) => void;
  onOpenTool?: (toolId: any) => void;
  onOpenConstructionBuilder?: () => void;
  onOpenBuilder?: () => void;
  onOpenDeliveryChecker?: () => void;
  onNavigate: (path: string) => void;
}

export const SmartToolsPage: React.FC<SmartToolsPageProps> = ({
  onOpenSmartTool,
  onOpenTool,
  onOpenConstructionBuilder,
  onOpenBuilder,
  onOpenDeliveryChecker,
  onNavigate
}) => {
  const handleTool = onOpenTool || onOpenSmartTool || (() => {});
  const handleBuilder = onOpenBuilder || onOpenConstructionBuilder || (() => {});
  const handleDelivery = onOpenDeliveryChecker || (() => onNavigate('/delivery'));
  const tools = [
    {
      id: 'builder',
      title: 'Complete Sanitary & Fitting Builder',
      badge: 'POPULAR PACKAGER',
      description: 'Step-by-step construction builder to bundle commodes, vanity basins, mixers, drains, and pipes for whole-house construction.',
      icon: <Wrench className="w-6 h-6 text-blue-600" />,
      action: onOpenConstructionBuilder,
      cta: 'Launch Fitting Builder'
    },
    {
      id: 'cement-calculator',
      title: 'Cement & Mortar Bag Estimator',
      badge: 'CONSTRUCTION UTILITY',
      description: 'Accurately calculate required cement bags, sand volume, and aggregate for brick masonry, plaster, and concrete slabs.',
      icon: <HardHat className="w-6 h-6 text-amber-600" />,
      action: () => onOpenSmartTool('cement-calculator'),
      cta: 'Calculate Cement Bags'
    },
    {
      id: 'bathroom-planner',
      title: 'Interactive 3D Bathroom Planner',
      badge: 'ARCHITECTURAL',
      description: 'Design bathroom floor plans, calculate fixture spacing, clearances, and generate recommended vanity and shower configurations.',
      icon: <Maximize2 className="w-6 h-6 text-emerald-600" />,
      action: () => onOpenSmartTool('bathroom-planner'),
      cta: 'Open Bathroom Planner'
    },
    {
      id: 'material-estimator',
      title: 'Building Material Cost Estimator',
      badge: 'BUDGETING',
      description: 'Comprehensive cost estimation for grey structure, plumbing rough-ins, finish sanitaryware, and exterior painting coats.',
      icon: <Calculator className="w-6 h-6 text-purple-600" />,
      action: () => onOpenSmartTool('material-estimator'),
      cta: 'Estimate Materials'
    },
    {
      id: 'water-tank',
      title: 'Water Tank & Booster Sizing Guide',
      badge: 'PLUMBING SIZING',
      description: 'Calculate overhead and underground water storage requirements based on family size, bathrooms, and supply frequency.',
      icon: <Droplets className="w-6 h-6 text-cyan-600" />,
      action: () => onOpenSmartTool('water-tank'),
      cta: 'Size Your Water Tank'
    },
    {
      id: 'delivery-checker',
      title: 'Nationwide Delivery Fee Checker',
      badge: 'LOGISTICS ACCURACY',
      description: 'Check verified road cargo delivery rates for Chiniot, Faisalabad, Lahore, Rawalpindi, Karachi, and all cities in Pakistan.',
      icon: <Truck className="w-6 h-6 text-emerald-600" />,
      action: onOpenDeliveryChecker,
      cta: 'Check Delivery Rates'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      
      {/* Breadcrumbs */}
      <Breadcrumbs
        items={[{ label: 'Smart Engineering Tools', active: true }]}
        onNavigateHome={() => onNavigate('/')}
      />

      {/* Header Banner */}
      <div className="bg-slate-900 text-white py-10 px-4 sm:px-6 lg:px-8 border-b border-slate-800">
        <div className="max-w-7xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-900/60 border border-blue-500/40 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>INTERACTIVE ESTIMATION SUITE</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif tracking-tight">
            Smart Construction & Bathroom Planning Tools
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Free engineering calculators, bathroom layout visualizers, and material budgeting utilities crafted specifically for homeowners, plumbers, and contractors in Pakistan.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tools.map((tool) => (
            <div
              key={tool.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-400 transition-all p-6 flex flex-col justify-between space-y-6"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                    {tool.icon}
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase tracking-wider">
                    {tool.badge}
                  </span>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {tool.title}
                  </h2>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={tool.action}
                className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-blue-600 text-white text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>{tool.cta}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
