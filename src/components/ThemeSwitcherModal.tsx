import React from 'react';
import { X, Palette, Check, Sparkles, Sun, Moon, Shield, Eye, Layers } from 'lucide-react';
import { ThemeOption, ThemeSettings } from '../types';

interface ThemeSwitcherModalProps {
  isOpen: boolean;
  onClose: () => void;
  themeSettings: ThemeSettings;
  activeThemeId: string;
  onSelectTheme: (themeId: string) => void;
}

export const ThemeSwitcherModal: React.FC<ThemeSwitcherModalProps> = ({
  isOpen,
  onClose,
  themeSettings,
  activeThemeId,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const enabledThemes = (themeSettings.availableThemes || []).filter(t => t.isEnabled);

  const getThemeIcon = (id: string) => {
    switch (id) {
      case 'light':
        return <Sun className="w-4 h-4 text-amber-500" />;
      case 'dark':
        return <Moon className="w-4 h-4 text-blue-400" />;
      case 'navy':
        return <Shield className="w-4 h-4 text-indigo-400" />;
      case 'glass':
        return <Layers className="w-4 h-4 text-cyan-400" />;
      case 'premium-blue':
        return <Sparkles className="w-4 h-4 text-blue-500" />;
      default:
        return <Palette className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="p-5 sm:p-6 bg-slate-950 border-b border-slate-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-white font-serif uppercase tracking-tight">
                  Website Theme Switcher
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-950 border border-blue-500/40 text-blue-300 text-[10px] font-mono font-bold uppercase">
                  5 Visual Styles
                </span>
              </div>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                Customize the appearance & visual atmosphere of Zafar Sarwar Traders
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            title="Close Panel"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* CONTENT — THEME GRID & PREVIEWS */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-slate-300 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Select your preferred visual style below. Your preference will be saved locally on this device.</span>
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {enabledThemes.map((theme: ThemeOption) => {
              const isSelected = activeThemeId === theme.id;

              return (
                <div
                  key={theme.id}
                  onClick={() => onSelectTheme(theme.id)}
                  className={`group relative p-4 rounded-2xl border cursor-pointer transition-all duration-200 text-left ${
                    isSelected
                      ? 'bg-slate-800/90 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-500/10'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40'
                  }`}
                >
                  {/* Selected Indicator Badge */}
                  {isSelected && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center gap-1 shadow-md animate-fadeIn">
                      <Check className="w-3 h-3 stroke-[3]" />
                      <span>Active</span>
                    </div>
                  )}

                  {/* Theme Header */}
                  <div className="flex items-center gap-2 mb-2 pr-16">
                    <div className="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
                      {getThemeIcon(theme.id)}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white font-serif uppercase tracking-wide">
                        {theme.name}
                      </h3>
                      {theme.badge && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          {theme.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-300 font-light leading-relaxed mb-3 line-clamp-2">
                    {theme.description}
                  </p>

                  {/* Visual Live Thumbnail Preview */}
                  <div 
                    className="p-3 rounded-xl border space-y-2 overflow-hidden shadow-inner transition-transform group-hover:scale-[1.01]"
                    style={{
                      background: theme.previewBg,
                      borderColor: theme.previewAccent + '40',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span 
                        className="text-[10px] font-bold uppercase font-serif"
                        style={{ color: theme.previewText }}
                      >
                        Sample Card
                      </span>
                      <span 
                        className="px-1.5 py-0.5 rounded text-[9px] font-mono font-black"
                        style={{ background: theme.previewAccent, color: '#ffffff' }}
                      >
                        PKR 18,500
                      </span>
                    </div>

                    <div 
                      className="p-2 rounded-lg text-[10px] flex items-center justify-between border"
                      style={{
                        background: theme.previewCard,
                        color: theme.previewText,
                        borderColor: theme.previewAccent + '30',
                      }}
                    >
                      <span className="font-semibold truncate">Rain Shower Set</span>
                      <span 
                        className="w-2 h-2 rounded-full"
                        style={{ background: theme.previewAccent }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-4 sm:p-5 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-4">
          <div className="text-[11px] text-slate-400 font-mono">
            Active Theme: <span className="text-blue-400 font-bold uppercase">{enabledThemes.find(t => t.id === activeThemeId)?.name || activeThemeId}</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-md transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
