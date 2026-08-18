import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { 
  X, 
  Sparkles, 
  HardHat, 
  ShowerHead, 
  Calculator, 
  DollarSign, 
  Droplet, 
  ShoppingBag, 
  Building2, 
  Bot, 
  Boxes, 
  Palette, 
  ArrowLeft,
  Search,
  Layers,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  MessageCircle,
  Wrench,
  CheckCircle2
} from 'lucide-react';
import { 
  Product, 
  BusinessConfig, 
  SmartToolId, 
  SmartToolsSettings, 
  BuildMaterialEstimatorConfig, 
  EasyBathroomPlannerConfig 
} from '../types';
import { defaultSmartToolsSettings } from '../data/defaultSmartToolsConfig';
import { BuildMaterialEstimator } from './BuildMaterialEstimator';
import { BathroomPlanner } from './BathroomPlanner';
import { BathroomBudgetFinder } from './BathroomBudgetFinder';
import { WaterTankPumpGuide } from './WaterTankPumpGuide';
import { SmartProductFinder } from './tools/SmartProductFinder';
import { HouseConstructionCostEstimator } from './tools/HouseConstructionCostEstimator';
import { BudgetToProductsAi } from './tools/BudgetToProductsAi';
import { BricksEstimator } from './tools/BricksEstimator';
import { PaintQuantityCalculator } from './tools/PaintQuantityCalculator';

// Safe Tool ID Normalizer to bridge all variations seamlessly
export function normalizeSmartToolId(id: string | null | undefined): SmartToolId | 'hub' | null {
  if (!id) return null;
  if (id === 'hub') return 'hub';
  
  switch (id) {
    case 'cement-calculator':
    case 'cement':
      return 'cement-calculator';

    case 'material-estimator':
    case 'material':
      return 'material-estimator';

    case 'bathroom-planner':
    case 'planner':
      return 'bathroom-planner';

    case 'product-finder':
    case 'smart-product-finder':
      return 'product-finder';

    case 'construction-cost':
    case 'house-construction-estimator':
      return 'construction-cost';

    case 'budget-products':
    case 'budget-to-products-ai':
      return 'budget-products';

    case 'bricks':
    case 'bricks-estimator':
      return 'bricks';

    case 'paint':
    case 'paint-quantity-calculator':
      return 'paint';

    case 'water-tank':
    case 'water-tank-pump-guide':
      return 'water-tank';

    case 'bathroom-budget-finder':
      return 'budget-products';

    default:
      return id as SmartToolId;
  }
}

// React Error Boundary for isolated, crash-safe tool execution
interface ErrorBoundaryProps {
  children: React.ReactNode;
  toolName?: string;
  onReset: () => void;
  onGoToHub: () => void;
  phone?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ToolErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[SmartTools] Tool render error caught safely:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-6 sm:p-10 rounded-3xl bg-slate-900 border border-slate-800 text-center max-w-xl mx-auto my-8 space-y-5 animate-fadeIn">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white font-serif">
              This tool couldn't load right now
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
              We encountered a temporary rendering issue loading {this.props.toolName || 'this smart tool'}. You can try refreshing the tool or choose another utility from our hub.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                this.setState({ hasError: false });
                this.props.onReset();
              }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-bold shadow-lg transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Try Again</span>
            </button>

            <button
              onClick={this.props.onGoToHub}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold border border-slate-700 transition-all"
            >
              <Wrench className="w-4 h-4 text-blue-400" />
              <span>Explore All Tools</span>
            </button>

            {this.props.phone && (
              <a
                href={`https://wa.me/${this.props.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent('Hi, I need assistance with the Smart Tools on your store.')}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-semibold border border-emerald-600 transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>WhatsApp Help</span>
              </a>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

interface SmartToolsModalProps {
  toolId: SmartToolId | 'hub' | null;
  products: Product[];
  config: BusinessConfig;
  estimatorConfig?: BuildMaterialEstimatorConfig;
  plannerConfig?: EasyBathroomPlannerConfig | any;
  smartToolsSettings?: SmartToolsSettings;
  onClose: () => void;
  onSelectTool?: (id: SmartToolId) => void;
  onOpenQuickView?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity?: number, color?: string) => void;
}

export const SmartToolsModal: React.FC<SmartToolsModalProps> = ({
  toolId,
  products,
  config,
  estimatorConfig,
  plannerConfig,
  smartToolsSettings = defaultSmartToolsSettings,
  onClose,
  onSelectTool,
  onOpenQuickView,
  onAddToCart
}) => {
  const [activeToolId, setActiveToolId] = useState<SmartToolId | 'hub' | null>(() => normalizeSmartToolId(toolId));
  const [hubCategory, setHubCategory] = useState<'all' | 'construction' | 'sanitary' | 'budget'>('all');
  const [hubSearch, setHubSearch] = useState<string>('');
  const [renderKey, setRenderKey] = useState<number>(0);

  useEffect(() => {
    setActiveToolId(normalizeSmartToolId(toolId));
  }, [toolId]);

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (activeToolId) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [activeToolId, onClose]);

  if (!activeToolId) return null;

  const currentSettings = smartToolsSettings || defaultSmartToolsSettings;
  const toolsList = currentSettings.tools || defaultSmartToolsSettings.tools;
  const currentNormalized = normalizeSmartToolId(activeToolId);
  const currentToolMeta = toolsList.find(t => normalizeSmartToolId(t.id) === currentNormalized);

  const getToolIcon = (id: string, className = "w-5 h-5") => {
    const norm = normalizeSmartToolId(id);
    switch (norm) {
      case 'cement-calculator': return <HardHat className={`${className} text-amber-400`} />;
      case 'material-estimator': return <Calculator className={`${className} text-emerald-400`} />;
      case 'bathroom-planner': return <ShowerHead className={`${className} text-blue-400`} />;
      case 'product-finder': return <ShoppingBag className={`${className} text-blue-400`} />;
      case 'construction-cost': return <Building2 className={`${className} text-amber-400`} />;
      case 'budget-products': return <Bot className={`${className} text-indigo-400`} />;
      case 'bricks': return <Boxes className={`${className} text-orange-400`} />;
      case 'paint': return <Palette className={`${className} text-rose-400`} />;
      case 'water-tank': return <Droplet className={`${className} text-cyan-400`} />;
      default: return <Sparkles className={`${className} text-blue-400`} />;
    }
  };

  const handleSwitchTool = (rawId: string) => {
    const normalized = normalizeSmartToolId(rawId);
    setActiveToolId(normalized);
    setRenderKey(prev => prev + 1);
    if (normalized && normalized !== 'hub' && onSelectTool) {
      onSelectTool(normalized as SmartToolId);
    }
  };

  // Filter tools for the Hub overview screen
  const filteredHubTools = toolsList.filter(t => {
    const norm = normalizeSmartToolId(t.id);
    if (!t.isEnabled) return false;
    if (hubCategory !== 'all') {
      if (hubCategory === 'construction' && !['cement-calculator', 'material-estimator', 'construction-cost', 'bricks'].includes(norm as string)) return false;
      if (hubCategory === 'sanitary' && !['bathroom-planner', 'water-tank', 'product-finder', 'paint'].includes(norm as string)) return false;
      if (hubCategory === 'budget' && !['budget-products', 'construction-cost', 'product-finder'].includes(norm as string)) return false;
    }
    if (hubSearch.trim()) {
      const q = hubSearch.toLowerCase();
      const matchTitle = t.title.toLowerCase().includes(q);
      const matchDesc = t.description.toLowerCase().includes(q);
      const matchUrdu = (t.urduTitle || '').includes(q);
      if (!matchTitle && !matchDesc && !matchUrdu) return false;
    }
    return true;
  });

  // Render the specific active tool
  const renderActiveToolContent = () => {
    const norm = normalizeSmartToolId(activeToolId);

    switch (norm) {
      case 'cement-calculator':
      case 'material-estimator':
        return (
          <BuildMaterialEstimator
            products={products}
            config={config}
            estimatorConfig={estimatorConfig}
            onOpenQuickView={onOpenQuickView}
          />
        );

      case 'bathroom-planner':
        return (
          <BathroomPlanner
            products={products}
            config={plannerConfig}
            whatsappNumber={config.phone || "923108002863"}
            onAddToCart={onAddToCart}
            onViewProduct={onOpenQuickView}
          />
        );

      case 'product-finder':
        return (
          <SmartProductFinder
            products={products}
            config={config}
            settings={currentSettings}
            onAddToCart={(p, qty) => onAddToCart && onAddToCart(p, qty || 1)}
            onViewProduct={(p) => onOpenQuickView && onOpenQuickView(p)}
          />
        );

      case 'construction-cost':
        return (
          <HouseConstructionCostEstimator
            config={config}
            settings={currentSettings}
          />
        );

      case 'budget-products':
        return (
          <BudgetToProductsAi
            products={products}
            config={config}
            settings={currentSettings}
            onAddToCart={(p, qty) => onAddToCart && onAddToCart(p, qty || 1)}
            onViewProduct={(p) => onOpenQuickView && onOpenQuickView(p)}
          />
        );

      case 'bricks':
        return (
          <BricksEstimator
            config={config}
            settings={currentSettings}
          />
        );

      case 'paint':
        return (
          <PaintQuantityCalculator
            products={products}
            config={config}
            settings={currentSettings}
            onAddToCart={(p, qty) => onAddToCart && onAddToCart(p, qty || 1)}
            onViewProduct={(p) => onOpenQuickView && onOpenQuickView(p)}
          />
        );

      case 'water-tank':
        return (
          <WaterTankPumpGuide
            products={products}
            config={config}
            onAddToCart={onAddToCart}
            onViewProduct={onOpenQuickView}
            onClose={onClose}
          />
        );

      default:
        return (
          <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 text-center max-w-lg mx-auto my-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-500/30 text-blue-400 mx-auto flex items-center justify-center">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Select a Smart Tool</h3>
            <p className="text-xs text-slate-400">
              Please choose a calculator or estimator from the Smart Tools Hub.
            </p>
            <button
              onClick={() => handleSwitchTool('hub')}
              className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
            >
              Open Tools Hub
            </button>
          </div>
        );
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto animate-fadeIn"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-6xl w-full my-auto overflow-hidden shadow-2xl relative max-h-[95vh] flex flex-col glow-blue-ambient">
        
        {/* Sticky Modal Top Bar */}
        <div className="flex items-center justify-between p-3.5 sm:p-4 px-4 sm:px-6 bg-slate-950/95 border-b border-slate-800 z-20 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-3">
            {activeToolId !== 'hub' ? (
              <button
                onClick={() => handleSwitchTool('hub')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white transition-all text-xs font-semibold border border-slate-700"
                title="Back to All Tools Hub"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">All Tools</span>
              </button>
            ) : (
              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                  {activeToolId === 'hub' ? 'Smart Tools Hub' : 'Interactive Utility'}
                </span>
                {currentToolMeta?.badge && activeToolId !== 'hub' && (
                  <span className="hidden md:inline-flex px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 text-[10px] font-semibold border border-blue-800/60">
                    {currentToolMeta.badge}
                  </span>
                )}
                {currentToolMeta?.urduTitle && activeToolId !== 'hub' && (
                  <span className="text-xs text-slate-400 font-arabic hidden lg:inline">
                    ({currentToolMeta.urduTitle})
                  </span>
                )}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-white font-serif">
                {activeToolId === 'hub' ? 'Customer Tools & Estimators Dashboard' : (currentToolMeta?.title || 'Smart Tool')}
              </h3>
            </div>
          </div>

          {/* Quick Tool Switcher Dropdown (when inside a tool) */}
          <div className="flex items-center gap-2">
            {activeToolId !== 'hub' && (
              <div className="flex items-center gap-1.5">
                <select
                  value={normalizeSmartToolId(activeToolId) || ''}
                  onChange={(e) => handleSwitchTool(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500 max-w-[140px] sm:max-w-[220px] truncate"
                  title="Switch to another tool"
                >
                  <option value="hub">📑 Tools Hub Menu</option>
                  {toolsList.filter(t => t.isEnabled).map(t => {
                    const normId = normalizeSmartToolId(t.id);
                    return (
                      <option key={t.id} value={normId || t.id}>
                        {t.title}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <button
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs font-medium border border-slate-700"
              title="Close (ESC)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* Modal Body Container with Scroll */}
        <div className="p-3 sm:p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* ========================================= */}
          {/* 1. HUB DASHBOARD VIEW (When activeToolId === 'hub') */}
          {/* ========================================= */}
          {activeToolId === 'hub' && (
            <div className="space-y-6">
              {/* Hub Intro Banner */}
              <div className="bg-gradient-to-r from-slate-950 via-blue-950/40 to-slate-950 border border-blue-900/30 rounded-2xl p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    🛠️ Customer Utilities & Material Estimators
                  </h2>
                  <p className="text-slate-300 text-xs mt-1 max-w-xl">
                    Select any calculator or planner below. All tools calculate Pakistani standard requirements and connect directly with our store products.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search calculator..."
                      value={hubSearch}
                      onChange={(e) => setHubSearch(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {[
                  { id: 'all', label: 'All 9 Tools' },
                  { id: 'construction', label: '🏗️ Civil & Construction' },
                  { id: 'sanitary', label: '🚿 Bathroom & Plumbing' },
                  { id: 'budget', label: '💰 Budget & AI Matching' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setHubCategory(cat.id as any)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      hubCategory === cat.id
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-750'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Tools Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredHubTools.map(tool => {
                  const normId = normalizeSmartToolId(tool.id) || tool.id;
                  return (
                    <div
                      key={tool.id}
                      onClick={() => handleSwitchTool(normId)}
                      className="group cursor-pointer rounded-2xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 hover:border-blue-500/40 p-5 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-blue-950/20"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:scale-105 transition-transform">
                            {getToolIcon(normId)}
                          </div>
                          {tool.badge && (
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-[10px] font-bold uppercase tracking-wider text-slate-300 border border-slate-700">
                              {tool.badge}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                          {tool.title}
                        </h3>
                        {tool.urduTitle && (
                          <span className="text-[11px] text-slate-400 font-arabic block mt-0.5">
                            {tool.urduTitle}
                          </span>
                        )}

                        <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                          {tool.description}
                        </p>
                      </div>

                      <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-blue-400 font-semibold flex items-center gap-1 group-hover:underline">
                          Launch Tool <ChevronRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Pakistani Standard
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================= */}
          {/* 2. SPECIFIC ACTIVE TOOL VIEWS (Wrapped in Error Boundary) */}
          {/* ========================================= */}
          {activeToolId !== 'hub' && (
            <ToolErrorBoundary
              key={`${activeToolId}-${renderKey}`}
              toolName={currentToolMeta?.title || 'Smart Tool'}
              onReset={() => setRenderKey(prev => prev + 1)}
              onGoToHub={() => handleSwitchTool('hub')}
              phone={config.phone || "923108002863"}
            >
              {renderActiveToolContent()}
            </ToolErrorBoundary>
          )}

        </div>

      </div>
    </div>
  );
};
