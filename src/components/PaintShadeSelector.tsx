import React, { useState, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import {
  Palette, Search, Check, X, Sparkles, ChevronRight, Layers,
  SlidersHorizontal, CheckCircle2, Image as ImageIcon, Filter, AlertCircle
} from 'lucide-react';
import { PaintShade } from '../types';
import { searchPaintShades, formatPaintShadeLabel, getColorFamily } from '../utils/paintShadeUtils';

// Safe Error Boundary to guarantee Paint Shade selector never breaks the host page
interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class SafePaintShadeBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PaintShadeSelector Error Boundary caught error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

interface PaintShadeSelectorProps {
  shades: PaintShade[];
  selectedShade?: PaintShade | null;
  onSelectShade: (shade: PaintShade) => void;
  title?: string;
  className?: string;
}

const PaintShadeSelectorInternal: React.FC<PaintShadeSelectorProps> = ({
  shades,
  selectedShade,
  onSelectShade,
  title = 'Choose Shade',
  className = ''
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFamily, setSelectedFamily] = useState<string>('All');
  // Internal pending selection while browsing in modal before clicking [ Apply Shade ]
  const [pendingShade, setPendingShade] = useState<PaintShade | null>(selectedShade || null);

  // Filter to only available shades
  const availableShades = useMemo(() => {
    return (shades || []).filter(s => s && s.isActive !== false);
  }, [shades]);

  // Color families present in available shades
  const availableFamilies = useMemo(() => {
    const families = new Set<string>();
    availableShades.forEach(s => {
      if (s.colorHex) {
        families.add(getColorFamily(s.colorHex));
      }
    });
    return ['All', ...Array.from(families).filter(f => f !== 'All')];
  }, [availableShades]);

  // Real-time search and color family filter
  const filteredShades = useMemo(() => {
    let result = searchPaintShades(availableShades, searchQuery);
    if (selectedFamily !== 'All') {
      result = result.filter(s => getColorFamily(s.colorHex) === selectedFamily);
    }
    return result;
  }, [availableShades, searchQuery, selectedFamily]);

  // Active chosen shade for display
  const activeSelected = selectedShade || availableShades[0] || null;

  const handleOpenPicker = () => {
    setPendingShade(activeSelected);
    setSearchQuery('');
    setSelectedFamily('All');
    setIsPickerOpen(true);
  };

  const handleApplyShade = () => {
    if (pendingShade) {
      onSelectShade(pendingShade);
    }
    setIsPickerOpen(false);
  };

  if (!availableShades || availableShades.length === 0) {
    return null;
  }

  const activeReferenceImage = activeSelected?.referenceImage || activeSelected?.image;

  return (
    <>
      {/* 1. CLEAN PRODUCT PAGE BAR (DO NOT OVERWHELM MAIN PRODUCT VIEW WITH 100+ CARDS) */}
      <div className={`p-3.5 sm:p-4 rounded-2xl bg-slate-950/90 border border-slate-800/90 space-y-2.5 ${className}`}>
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/30 text-indigo-400">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                {title}
              </span>
              <span className="text-[10px] text-slate-400">
                {availableShades.length} real shade{availableShades.length !== 1 ? 's' : ''} available
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenPicker}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-950/50 flex items-center gap-1.5 active:scale-95 border border-indigo-400/30"
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{activeSelected ? 'Change Shade' : 'Choose Shade'}</span>
          </button>
        </div>

        {/* Selected Shade Display Card */}
        {activeSelected ? (
          <div
            onClick={handleOpenPicker}
            className="group cursor-pointer p-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/60 hover:bg-slate-850 transition-all flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              {/* Real Shade Reference Swatch Thumbnail */}
              <div className="relative w-11 h-11 rounded-lg border-2 border-slate-700 overflow-hidden bg-slate-950 shadow-md shrink-0 flex items-center justify-center">
                {activeReferenceImage ? (
                  <img
                    src={activeReferenceImage}
                    alt={activeSelected.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center font-mono text-[9px] font-black text-black/70"
                    style={{ backgroundColor: activeSelected.colorHex || '#CBD5E1' }}
                  >
                    {activeSelected.code || 'SHADE'}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-400">Selected Shade:</span>
                  <span className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors truncate">
                    {activeSelected.name}
                  </span>
                  <span className="px-2 py-0.5 rounded-md bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono font-bold shrink-0">
                    Code: {activeSelected.code}
                  </span>
                </div>

                <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                  Visual color swatch matched • Exact code on invoice
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-xs text-indigo-400 group-hover:text-indigo-300 font-semibold shrink-0">
              <span className="hidden sm:inline">Change</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleOpenPicker}
            className="w-full py-3 px-4 rounded-xl border border-dashed border-indigo-500/40 hover:border-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/40 text-indigo-300 text-xs font-bold transition-all flex items-center justify-center gap-2"
          >
            <Palette className="w-4 h-4" />
            <span>Click to Select Paint Shade</span>
          </button>
        )}
      </div>

      {/* 2. DEDICATED REAL SHADE PICKER MODAL */}
      {isPickerOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                  <Palette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white tracking-tight">Select Paint Shade</h3>
                  <p className="text-xs text-slate-400">Search by shade code (e.g. 3044) or name (e.g. Emerald)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerOpen(false)}
                className="p-2 rounded-xl bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar & Color Family Filter Chips */}
            <div className="p-4 border-b border-slate-850 bg-slate-950 space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search shade code (e.g. 3044, 3001) or name (e.g. Emerald)..."
                  className="w-full pl-10 pr-10 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Color Family Filter Chips */}
              {availableFamilies.length > 2 && (
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {availableFamilies.map(fam => (
                    <button
                      key={fam}
                      type="button"
                      onClick={() => setSelectedFamily(fam)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                        selectedFamily === fam
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {fam}
                    </button>
                  ))}
                </div>
              )}

              {/* Real search count hint */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
                <span>
                  Showing <strong>{filteredShades.length}</strong> of {availableShades.length} shades
                </span>
                <span className="font-mono text-indigo-400">
                  Exact Code Preserved on Order
                </span>
              </div>
            </div>

            {/* Real Shade Cards Grid */}
            <div className="p-4 sm:p-5 overflow-y-auto flex-1 bg-slate-950 space-y-4">
              {filteredShades.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Palette className="w-10 h-10 text-slate-600 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No Shade Found</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Try searching by code number (e.g. <strong>3044</strong>) or clear your filter to view all available shades.
                  </p>
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedFamily('All'); }}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-700 transition-colors"
                  >
                    View All Shades
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {filteredShades.map((shade) => {
                    const isSelected = pendingShade?.id === shade.id;
                    const shadeImg = shade.referenceImage || shade.image;

                    return (
                      <button
                        key={shade.id}
                        type="button"
                        onClick={() => setPendingShade(shade)}
                        className={`group relative p-3 rounded-2xl text-left transition-all duration-150 flex flex-col justify-between border ${
                          isSelected
                            ? 'bg-indigo-950/80 border-indigo-400 ring-2 ring-indigo-500/50 shadow-xl shadow-indigo-950/60 scale-[1.02]'
                            : 'bg-slate-900/90 border-slate-800 hover:border-slate-600 hover:bg-slate-850'
                        }`}
                      >
                        {/* Selected Checkmark Badge */}
                        {isSelected && (
                          <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-md">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}

                        {/* Real Shade Reference Swatch */}
                        <div className="relative w-full aspect-square rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shadow-inner mb-2.5 flex items-center justify-center">
                          {shadeImg ? (
                            <img
                              src={shadeImg}
                              alt={shade.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                            />
                          ) : (
                            <div
                              className="w-full h-full flex flex-col items-center justify-center p-2 text-center"
                              style={{ backgroundColor: shade.colorHex || '#CBD5E1' }}
                            >
                              <span className="text-[11px] font-black text-black/75 font-mono uppercase">
                                {shade.code}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Shade Name & Exact Shade Code */}
                        <div className="space-y-1 w-full">
                          <h5 className={`text-xs font-bold line-clamp-1 leading-snug ${isSelected ? 'text-white' : 'text-slate-200 group-hover:text-white'}`}>
                            {shade.name}
                          </h5>

                          <div className="flex items-center justify-between gap-1">
                            <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono font-bold text-indigo-300">
                              {shade.code}
                            </span>
                            {shade.priceAdjustment && shade.priceAdjustment > 0 ? (
                              <span className="text-[9px] font-mono text-emerald-400 font-bold">
                                +Rs. {shade.priceAdjustment}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Active Selection & Apply Bar */}
            <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="min-w-0">
                {pendingShade ? (
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-6 h-6 rounded-lg border border-slate-700 shrink-0"
                      style={{ backgroundColor: pendingShade.colorHex || '#CBD5E1' }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs text-slate-400">Selected:</span>
                        <span className="text-sm font-bold text-white truncate">{pendingShade.name}</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/40 text-indigo-300 text-[10px] font-mono font-bold">
                          Code: {pendingShade.code}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-slate-400">Please choose a shade from the collection</span>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={!pendingShade}
                  onClick={handleApplyShade}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Apply Shade</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export const PaintShadeSelector: React.FC<PaintShadeSelectorProps> = (props) => {
  return (
    <SafePaintShadeBoundary>
      <PaintShadeSelectorInternal {...props} />
    </SafePaintShadeBoundary>
  );
};
