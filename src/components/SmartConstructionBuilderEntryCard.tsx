import React from 'react';
import { 
  Wrench, 
  ArrowRight, 
  Sparkles, 
  CheckCircle2, 
  Layers, 
  ShowerHead, 
  Droplets, 
  Building2,
  HardHat,
  ChevronRight
} from 'lucide-react';
import { FittingBuilderConfig } from '../types';

interface SmartConstructionBuilderEntryCardProps {
  onOpenBuilder: () => void;
  config?: FittingBuilderConfig;
}

export const SmartConstructionBuilderEntryCard: React.FC<SmartConstructionBuilderEntryCardProps> = ({
  onOpenBuilder,
  config
}) => {
  if (config && config.isEnabled === false) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8">
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950 border border-blue-900/40 p-6 sm:p-8 lg:p-10 shadow-2xl shadow-blue-950/40 group">
        
        {/* Ambient background glow & grid */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20 group-hover:bg-blue-600/20 transition-all duration-700" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-cyan-600/10 rounded-full blur-2xl pointer-events-none -ml-10 -mb-10" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          
          {/* Left Content Area */}
          <div className="space-y-4 max-w-2xl">
            
            {/* Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                {config?.entryCardBadge || "Interactive Package System"}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Instant WhatsApp Quote
              </span>
            </div>

            {/* Main Headline & Subheadline */}
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight flex items-center gap-3">
                <span>🔧</span>
                <span>Smart Construction & Fitting Builder</span>
              </h2>
              <p className="text-sm sm:text-base text-slate-300 font-light mt-2 leading-relaxed">
                Build your custom plumbing & construction package. Select project type, choose pipes, fittings, valves, water tanks, pumps, specify exact sizes and quantities, and order your custom package directly on WhatsApp.
              </p>
            </div>

            {/* Feature Pills / Supported Packages */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <ShowerHead className="w-3.5 h-3.5 text-cyan-400" />
                Bathroom Plumbing
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-blue-400" />
                Water Tank & Pump Kits
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                Full House Drainage & Pipes
              </span>
              <span className="px-3 py-1 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-medium flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-indigo-400" />
                CP & CI Fittings
              </span>
            </div>

          </div>

          {/* Right Action Callout */}
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-stretch sm:items-center lg:items-end gap-3">
            <button
              onClick={onOpenBuilder}
              className="px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-black text-sm sm:text-base tracking-wide shadow-xl shadow-blue-600/30 flex items-center justify-center gap-3 transition-all transform hover:scale-105 active:scale-95 group/btn cursor-pointer"
            >
              <span>Build My Package</span>
              <ArrowRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
            </button>

            <span className="text-xs text-slate-400 text-center lg:text-right font-light">
              Live size-pricing & instant WhatsApp breakdown
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
