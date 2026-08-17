import React, { useState } from 'react';
import { 
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
  ArrowRight, 
  Wrench, 
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { SmartToolsSettings, SmartToolId } from '../types';
import { defaultSmartToolsSettings } from '../data/defaultSmartToolsConfig';
import { normalizeSmartToolId } from './SmartToolsModal';

interface SmartToolsSectionProps {
  settings?: SmartToolsSettings;
  onOpenTool: (toolId: SmartToolId | 'hub') => void;
}

export const SmartToolsSection: React.FC<SmartToolsSectionProps> = ({
  settings = defaultSmartToolsSettings,
  onOpenTool
}) => {
  const currentSettings = settings || defaultSmartToolsSettings;
  const [activeFilter, setActiveFilter] = useState<'all' | 'construction' | 'sanitary' | 'budget'>('all');

  if (currentSettings.isEnabled === false) {
    return null;
  }

  const allTools = currentSettings.tools || defaultSmartToolsSettings.tools;

  const enabledTools = allTools
    .filter(t => t.isEnabled && t.showOnHomepage !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  const filteredTools = enabledTools.filter(t => {
    const norm = normalizeSmartToolId(t.id);
    if (activeFilter === 'all') return true;
    if (activeFilter === 'construction') return ['cement-calculator', 'material-estimator', 'construction-cost', 'bricks'].includes(norm as string);
    if (activeFilter === 'sanitary') return ['bathroom-planner', 'water-tank', 'product-finder', 'paint'].includes(norm as string);
    if (activeFilter === 'budget') return ['budget-products', 'construction-cost', 'product-finder'].includes(norm as string);
    return true;
  });

  if (enabledTools.length === 0) {
    return null;
  }

  const getToolIcon = (iconName: string, id: string) => {
    const norm = normalizeSmartToolId(id);
    switch (iconName) {
      case 'HardHat':
        return <HardHat className="w-5 h-5 text-amber-500" />;
      case 'ShowerHead':
        return <ShowerHead className="w-5 h-5 text-blue-500" />;
      case 'Calculator':
        return <Calculator className="w-5 h-5 text-emerald-500" />;
      case 'DollarSign':
        return <DollarSign className="w-5 h-5 text-indigo-500" />;
      case 'Droplet':
        return <Droplet className="w-5 h-5 text-cyan-500" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5 text-blue-500" />;
      case 'Building2':
        return <Building2 className="w-5 h-5 text-amber-500" />;
      case 'Bot':
        return <Bot className="w-5 h-5 text-indigo-500" />;
      case 'Boxes':
        return <Boxes className="w-5 h-5 text-orange-500" />;
      case 'Palette':
        return <Palette className="w-5 h-5 text-rose-500" />;
      default:
        return <Sparkles className="w-5 h-5 text-blue-500" />;
    }
  };

  const getAccentColor = (id: string) => {
    const norm = normalizeSmartToolId(id);
    switch (norm) {
      case 'cement-calculator': return 'hover:border-amber-500/50 hover:shadow-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'bathroom-planner': return 'hover:border-blue-500/50 hover:shadow-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'material-estimator': return 'hover:border-emerald-500/50 hover:shadow-emerald-500/10 text-emerald-600 dark:text-emerald-400';
      case 'product-finder': return 'hover:border-blue-500/50 hover:shadow-blue-500/10 text-blue-600 dark:text-blue-400';
      case 'construction-cost': return 'hover:border-amber-500/50 hover:shadow-amber-500/10 text-amber-600 dark:text-amber-400';
      case 'budget-products': return 'hover:border-indigo-500/50 hover:shadow-indigo-500/10 text-indigo-600 dark:text-indigo-400';
      case 'bricks': return 'hover:border-orange-500/50 hover:shadow-orange-500/10 text-orange-600 dark:text-orange-400';
      case 'paint': return 'hover:border-rose-500/50 hover:shadow-rose-500/10 text-rose-600 dark:text-rose-400';
      case 'water-tank': return 'hover:border-cyan-500/50 hover:shadow-cyan-500/10 text-cyan-600 dark:text-cyan-400';
      default: return 'hover:border-blue-500/50 hover:shadow-blue-500/10 text-blue-600 dark:text-blue-400';
    }
  };

  const getButtonClass = (id: string) => {
    const norm = normalizeSmartToolId(id);
    switch (norm) {
      case 'cement-calculator': return 'bg-amber-600 hover:bg-amber-500 text-white';
      case 'bathroom-planner': return 'bg-blue-600 hover:bg-blue-500 text-white';
      case 'material-estimator': return 'bg-emerald-600 hover:bg-emerald-500 text-white';
      case 'product-finder': return 'bg-blue-600 hover:bg-blue-500 text-white';
      case 'construction-cost': return 'bg-amber-600 hover:bg-amber-500 text-white';
      case 'budget-products': return 'bg-indigo-600 hover:bg-indigo-500 text-white';
      case 'bricks': return 'bg-orange-600 hover:bg-orange-500 text-white';
      case 'paint': return 'bg-rose-600 hover:bg-rose-500 text-white';
      case 'water-tank': return 'bg-cyan-600 hover:bg-cyan-500 text-white';
      default: return 'bg-blue-600 hover:bg-blue-500 text-white';
    }
  };

  return (
    <section id="smart-tools" className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Container */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-2.5">
            <Wrench className="w-3.5 h-3.5" />
            <span>{currentSettings.sectionBadge || "Interactive Customer Utilities"}</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white font-serif tracking-tight">
            {currentSettings.sectionTitle || "Smart Construction & Planning Tools"}
          </h2>

          {currentSettings.sectionUrduTitle && (
            <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 font-arabic mt-1" dir="rtl">
              {currentSettings.sectionUrduTitle}
            </p>
          )}

          <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
            {currentSettings.sectionSubtitle || "Calculate exact materials, estimate house construction costs, and match products to your budget using Pakistani standards."}
          </p>
        </div>

        {/* Action Button: Browse Full Hub */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => onOpenTool('hub')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-blue-600 dark:hover:bg-blue-600 text-white text-xs font-bold transition-all shadow-md group"
          >
            <Layers className="w-4 h-4 text-blue-400 group-hover:text-white" />
            <span>Open All 9 Smart Tools</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Quick Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6">
        {[
          { id: 'all', label: 'All Tools' },
          { id: 'construction', label: '🏗️ Civil & Construction' },
          { id: 'sanitary', label: '🚿 Bathroom & Plumbing' },
          { id: 'budget', label: '💰 Budget & AI Matching' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveFilter(cat.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeFilter === cat.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid of Compact Tool Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTools.map((tool) => {
          const accentColor = getAccentColor(tool.id);
          const btnClass = getButtonClass(tool.id);

          return (
            <div
              key={tool.id}
              onClick={() => onOpenTool(tool.id)}
              className={`group cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-xl ${accentColor} relative overflow-hidden`}
            >
              {/* Card Top Icon & Badge */}
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-transform group-hover:scale-105">
                    {getToolIcon(tool.iconName, tool.id)}
                  </div>

                  {tool.badge && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-bold uppercase tracking-wider">
                      {tool.badge}
                    </span>
                  )}
                </div>

                {/* Title & Urdu Subtitle */}
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {tool.title}
                  </h3>
                  {tool.urduTitle && (
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-arabic block mt-0.5">
                      {tool.urduTitle}
                    </span>
                  )}

                  <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-1">
                    {tool.tagline}
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>

              {/* Bottom Action */}
              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
                  <span>Interactive tool</span>
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenTool(tool.id);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-sm ${btnClass}`}
                >
                  <span>{tool.buttonText || "Open Tool"}</span>
                  <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
