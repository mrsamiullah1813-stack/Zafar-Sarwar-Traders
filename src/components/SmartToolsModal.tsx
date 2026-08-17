import React, { useEffect } from 'react';
import { X, Sparkles, HardHat, ShowerHead, Calculator, DollarSign, Droplet, ArrowLeft } from 'lucide-react';
import { Product, BusinessConfig, SmartToolId, SmartToolsSettings, BuildMaterialEstimatorConfig, EasyBathroomPlannerConfig } from '../types';
import { BuildMaterialEstimator } from './BuildMaterialEstimator';
import { BathroomPlanner } from './BathroomPlanner';
import { BathroomBudgetFinder } from './BathroomBudgetFinder';
import { WaterTankPumpGuide } from './WaterTankPumpGuide';

interface SmartToolsModalProps {
  toolId: SmartToolId | null;
  products: Product[];
  config: BusinessConfig;
  estimatorConfig?: BuildMaterialEstimatorConfig;
  plannerConfig?: EasyBathroomPlannerConfig | any;
  smartToolsSettings?: SmartToolsSettings;
  onClose: () => void;
  onOpenQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity: number, color?: string) => void;
}

export const SmartToolsModal: React.FC<SmartToolsModalProps> = ({
  toolId,
  products,
  config,
  estimatorConfig,
  plannerConfig,
  smartToolsSettings,
  onClose,
  onOpenQuickView,
  onAddToCart
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (toolId) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [toolId, onClose]);

  if (!toolId) return null;

  const currentToolMeta = smartToolsSettings?.tools.find(t => t.id === toolId);

  const getToolTitle = () => {
    if (currentToolMeta) return currentToolMeta.title;
    switch (toolId) {
      case 'cement-calculator': return 'Cement Calculator';
      case 'bathroom-planner': return 'Bathroom Planner';
      case 'material-estimator': return 'Construction Material Estimator';
      case 'bathroom-budget-finder': return 'Bathroom Budget Finder';
      case 'water-tank-pump-guide': return 'Water Tank & Pump Guide';
      default: return 'Smart Store Tool';
    }
  };

  const getToolIcon = () => {
    switch (toolId) {
      case 'cement-calculator': return <HardHat className="w-5 h-5 text-amber-400" />;
      case 'bathroom-planner': return <ShowerHead className="w-5 h-5 text-blue-400" />;
      case 'material-estimator': return <Calculator className="w-5 h-5 text-emerald-400" />;
      case 'bathroom-budget-finder': return <DollarSign className="w-5 h-5 text-indigo-400" />;
      case 'water-tank-pump-guide': return <Droplet className="w-5 h-5 text-cyan-400" />;
      default: return <Sparkles className="w-5 h-5 text-blue-400" />;
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full my-auto overflow-hidden shadow-2xl relative max-h-[94vh] flex flex-col glow-blue-ambient">
        
        {/* Sticky Modal Top Bar */}
        <div className="flex items-center justify-between p-4 px-6 bg-slate-950/95 border-b border-slate-800 z-20 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
              {getToolIcon()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                  Interactive Smart Tool
                </span>
                {currentToolMeta?.urduTitle && (
                  <span className="text-xs text-slate-400 font-arabic hidden sm:inline">
                    ({currentToolMeta.urduTitle})
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white font-serif">
                {getToolTitle()}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-medium border border-slate-700"
              title="Close Tool (ESC)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Modal Body Container with Scroll */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* Tool 1 & 3: Cement Calculator & Material Estimator */}
          {(toolId === 'cement-calculator' || toolId === 'material-estimator') && (
            <BuildMaterialEstimator
              products={products}
              config={config}
              estimatorConfig={estimatorConfig}
              onOpenQuickView={onOpenQuickView}
            />
          )}

          {/* Tool 2: Bathroom Planner */}
          {toolId === 'bathroom-planner' && (
            <BathroomPlanner
              products={products}
              config={plannerConfig}
              whatsappNumber={config.phone || "923108002863"}
              onAddToCart={onAddToCart}
              onViewProduct={onOpenQuickView}
            />
          )}

          {/* Tool 4: Bathroom Budget Finder */}
          {toolId === 'bathroom-budget-finder' && (
            <BathroomBudgetFinder
              products={products}
              config={config}
              onAddToCart={onAddToCart}
              onViewProduct={onOpenQuickView}
              onClose={onClose}
            />
          )}

          {/* Tool 5: Water Tank & Pump Guide */}
          {toolId === 'water-tank-pump-guide' && (
            <WaterTankPumpGuide
              products={products}
              config={config}
              onAddToCart={onAddToCart}
              onViewProduct={onOpenQuickView}
              onClose={onClose}
            />
          )}

        </div>

      </div>
    </div>
  );
};
