import React, { useState } from 'react';
import { Palette, Check, Plus, Trash2, ArrowUp, ArrowDown, ToggleLeft, ToggleRight, Sparkles, Shield, Eye, RefreshCw, Sun, Moon, Layers } from 'lucide-react';
import { ThemeSettings, ThemeOption } from '../types';
import { defaultThemeSettings, saveThemeSettings } from '../utils/storage';

interface AdminThemeManagerProps {
  themeSettings: ThemeSettings;
  onSaveThemeSettings: (settings: ThemeSettings) => void;
}

export const AdminThemeManager: React.FC<AdminThemeManagerProps> = ({
  themeSettings,
  onSaveThemeSettings,
}) => {
  const [formState, setFormState] = useState<ThemeSettings>(themeSettings || defaultThemeSettings);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleToggleThemeEnabled = (id: string) => {
    const updatedThemes = (formState.availableThemes || []).map(t => 
      t.id === id ? { ...t, isEnabled: !t.isEnabled } : t
    );
    setFormState(prev => ({ ...prev, availableThemes: updatedThemes }));
  };

  const handleSetDefaultTheme = (id: string) => {
    setFormState(prev => ({ ...prev, defaultTheme: id }));
    showToast(`Default website theme set to "${id}"`);
  };

  const handleUpdateThemeName = (id: string, name: string) => {
    const updatedThemes = (formState.availableThemes || []).map(t => 
      t.id === id ? { ...t, name } : t
    );
    setFormState(prev => ({ ...prev, availableThemes: updatedThemes }));
  };

  const handleUpdateThemeDescription = (id: string, description: string) => {
    const updatedThemes = (formState.availableThemes || []).map(t => 
      t.id === id ? { ...t, description } : t
    );
    setFormState(prev => ({ ...prev, availableThemes: updatedThemes }));
  };

  const handleMoveTheme = (index: number, direction: 'up' | 'down') => {
    const themes = [...(formState.availableThemes || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= themes.length) return;
    const temp = themes[index];
    themes[index] = themes[targetIndex];
    themes[targetIndex] = temp;
    setFormState(prev => ({ ...prev, availableThemes: themes }));
  };

  const handleResetDefaults = () => {
    if (confirm('Reset theme settings to original factory defaults?')) {
      setFormState(defaultThemeSettings);
      onSaveThemeSettings(defaultThemeSettings);
      showToast('Theme settings reset to factory defaults.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveThemeSettings(formState);
    saveThemeSettings(formState);
    showToast('Multi-Theme settings saved successfully!');
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[120] px-4 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white font-serif uppercase tracking-tight">
              Website Theme & Color Appearance Management
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Control website default theme, enable/disable theme modes, and configure visual color identity
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-blue-950"
          >
            <Check className="w-4 h-4" />
            <span>Save Theme Settings</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* SECTION 1: DEFAULT WEBSITE THEME */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>Default Website Theme (New Visitors)</span>
          </h3>

          <p className="text-xs text-slate-400">
            Select the default visual theme loaded for first-time website visitors. Visitors can also switch themes manually via the top navbar.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(formState.availableThemes || []).map((t) => {
              const isDefault = formState.defaultTheme === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => handleSetDefaultTheme(t.id)}
                  className={`p-3.5 rounded-2xl border text-left transition-all ${
                    isDefault
                      ? 'bg-blue-950/80 border-blue-500 ring-2 ring-blue-500/40 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-bold uppercase font-mono text-blue-400">
                      {t.id}
                    </span>
                    {isDefault && (
                      <span className="px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold">
                        Default
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold truncate font-serif">{t.name}</h4>
                  <p className="text-[10px] text-slate-400 line-clamp-2 mt-1">{t.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* SECTION 2: BRAND ACCENT COLORS */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
            <Palette className="w-4 h-4 text-cyan-400" />
            <span>Showroom Brand Accent Colors</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Primary Brand Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formState.primaryAccentColor || '#2563eb'}
                  onChange={(e) => setFormState(prev => ({ ...prev, primaryAccentColor: e.target.value }))}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={formState.primaryAccentColor || '#2563eb'}
                  onChange={(e) => setFormState(prev => ({ ...prev, primaryAccentColor: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Used for primary action buttons, badges, and highlights.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Secondary Brand Accent Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={formState.secondaryAccentColor || '#3b82f6'}
                  onChange={(e) => setFormState(prev => ({ ...prev, secondaryAccentColor: e.target.value }))}
                  className="w-10 h-10 rounded-xl cursor-pointer bg-transparent border-0"
                />
                <input
                  type="text"
                  value={formState.secondaryAccentColor || '#3b82f6'}
                  onChange={(e) => setFormState(prev => ({ ...prev, secondaryAccentColor: e.target.value }))}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-white"
                />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Used for secondary buttons, glowing glows, and indicators.</p>
            </div>
          </div>
        </div>

        {/* SECTION 3: THEME OPTIONS CONFIGURATION */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Theme Options Catalog</span>
          </h3>

          <div className="space-y-3">
            {(formState.availableThemes || []).map((theme, index) => (
              <div
                key={theme.id}
                className={`p-4 rounded-2xl border transition-all ${
                  theme.isEnabled
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono text-[10px] font-bold uppercase">
                      {theme.id}
                    </span>
                    <input
                      type="text"
                      value={theme.name}
                      onChange={(e) => handleUpdateThemeName(theme.id, e.target.value)}
                      className="px-3 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs font-bold text-white focus:outline-none focus:border-blue-500 font-serif"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMoveTheme(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveTheme(index, 'down')}
                      disabled={index === (formState.availableThemes || []).length - 1}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleThemeEnabled(theme.id)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                        theme.isEnabled
                          ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-900 border border-slate-800 text-slate-500'
                      }`}
                    >
                      {theme.isEnabled ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-slate-600" />}
                      <span>{theme.isEnabled ? 'Enabled' : 'Disabled'}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[11px] font-bold text-slate-400">Description</label>
                  <input
                    type="text"
                    value={theme.description}
                    onChange={(e) => handleUpdateThemeDescription(theme.id, e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};
