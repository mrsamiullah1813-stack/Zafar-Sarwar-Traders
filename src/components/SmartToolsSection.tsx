import React from 'react';
import { 
  Sparkles, 
  HardHat, 
  ShowerHead, 
  Calculator, 
  DollarSign, 
  Droplet, 
  ArrowRight, 
  Layers, 
  Wrench, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { SmartToolsSettings, SmartToolId, SmartToolCardConfig } from '../types';
import { defaultSmartToolsSettings } from '../data/defaultSmartToolsConfig';

interface SmartToolsSectionProps {
  settings?: SmartToolsSettings;
  onOpenTool: (toolId: SmartToolId) => void;
}

export const SmartToolsSection: React.FC<SmartToolsSectionProps> = ({
  settings = defaultSmartToolsSettings,
  onOpenTool
}) => {
  const currentSettings = settings || defaultSmartToolsSettings;

  if (currentSettings.isEnabled === false) {
    return null;
  }

  const enabledTools = (currentSettings.tools || [])
    .filter(t => t.isEnabled && t.showOnHomepage !== false)
    .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

  if (enabledTools.length === 0) {
    return null;
  }

  const getToolIcon = (iconName: string, id: string) => {
    switch (iconName) {
      case 'HardHat':
        return <HardHat className="w-6 h-6 text-amber-500" />;
      case 'ShowerHead':
        return <ShowerHead className="w-6 h-6 text-blue-500" />;
      case 'Calculator':
        return <Calculator className="w-6 h-6 text-emerald-500" />;
      case 'DollarSign':
        return <DollarSign className="w-6 h-6 text-indigo-500" />;
      case 'Droplet':
        return <Droplet className="w-6 h-6 text-cyan-500" />;
      default:
        return <Sparkles className="w-6 h-6 text-blue-500" />;
    }
  };

  const getAccentGlow = (id: string) => {
    switch (id) {
      case 'cement-calculator': return 'hover:border-amber-500/50 hover:shadow-amber-500/10';
      case 'bathroom-planner': return 'hover:border-blue-500/50 hover:shadow-blue-500/10';
      case 'material-estimator': return 'hover:border-emerald-500/50 hover:shadow-emerald-500/10';
      case 'bathroom-budget-finder': return 'hover:border-indigo-500/50 hover:shadow-indigo-500/10';
      case 'water-tank-pump-guide': return 'hover:border-cyan-500/50 hover:shadow-cyan-500/10';
      default: return 'hover:border-blue-500/50 hover:shadow-blue-500/10';
    }
  };

  const getButtonClass = (id: string) => {
    switch (id) {
      case 'cement-calculator': return 'bg-amber-600 hover:bg-amber-500 text-white';
      case 'bathroom-planner': return 'bg-blue-600 hover:bg-blue-500 text-white';
      case 'material-estimator': return 'bg-emerald-600 hover:bg-emerald-500 text-white';
      case 'bathroom-budget-finder': return 'bg-indigo-600 hover:bg-indigo-500 text-white';
      case 'water-tank-pump-guide': return 'bg-cyan-600 hover:bg-cyan-500 text-white';
      default: return 'bg-blue-600 hover:bg-blue-500 text-white';
    }
  };

  return (
    <section id="smart-tools" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/80 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 text-xs font-bold uppercase tracking-wider mb-3">
          <Wrench className="w-3.5 h-3.5" />
          <span>{currentSettings.sectionBadge || "Store Utilities"}</span>
        </div>

        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white font-serif tracking-tight">
          {currentSettings.sectionTitle}
        </h2>

        {currentSettings.sectionUrduTitle && (
          <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 font-arabic mt-1" dir="rtl">
            {currentSettings.sectionUrduTitle}
          </p>
        )}

        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          {currentSettings.sectionSubtitle}
        </p>
      </div>

      {/* Grid of Compact Tool Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enabledTools.map((tool) => {
          const accentGlow = getAccentGlow(tool.id);
          const btnClass = getButtonClass(tool.id);

          return (
            <div
              key={tool.id}
              onClick={() => onOpenTool(tool.id)}
              className={`group cursor-pointer rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between transition-all duration-300 shadow-sm hover:shadow-xl ${accentGlow} relative overflow-hidden`}
            >
              {/* Card Top Icon & Badge */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 transition-transform group-hover:scale-110">
                    {getToolIcon(tool.iconName, tool.id)}
                  </div>

                  {tool.badge && (
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-[11px] font-bold uppercase tracking-wider">
                      {tool.badge}
                    </span>
                  )}
                </div>

                {/* Title & Urdu Subtitle */}
                <div>
                  <div className="flex items-baseline justify-between gap-2">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tool.title}
                    </h3>
                    {tool.urduTitle && (
                      <span className="text-xs text-slate-500 dark:text-slate-400 font-arabic">
                        {tool.urduTitle}
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mt-1">
                    {tool.tagline}
                  </p>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-3 leading-relaxed">
                    {tool.description}
                  </p>
                </div>
              </div>

              {/* Bottom Action Button */}
              <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors flex items-center gap-1">
                  <span>Open interactive tool</span>
                </span>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenTool(tool.id);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm group-hover:shadow-md ${btnClass}`}
                >
                  <span>{tool.buttonText || "Open Tool"}</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
