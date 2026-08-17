import React, { useState } from 'react';
import { 
  Sparkles, 
  Save, 
  Check, 
  AlertTriangle, 
  HardHat, 
  ShowerHead, 
  Calculator, 
  DollarSign, 
  Droplet, 
  Sliders, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  RefreshCw,
  Info
} from 'lucide-react';
import { SmartToolsSettings, SmartToolCardConfig } from '../types';
import { defaultSmartToolsSettings } from '../data/defaultSmartToolsConfig';

interface AdminSmartToolsManagerProps {
  settings: SmartToolsSettings;
  onSaveSettings: (updated: SmartToolsSettings) => Promise<{ success: boolean; error?: string }> | void;
}

export const AdminSmartToolsManager: React.FC<AdminSmartToolsManagerProps> = ({
  settings = defaultSmartToolsSettings,
  onSaveSettings
}) => {
  const [formData, setFormData] = useState<SmartToolsSettings>(() => ({
    ...defaultSmartToolsSettings,
    ...(settings || {})
  }));

  const [activeToolId, setActiveToolId] = useState<string>('cement-calculator');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleToggleGlobal = (enabled: boolean) => {
    setFormData(prev => ({ ...prev, isEnabled: enabled }));
  };

  const handleToolFieldChange = (toolId: string, field: keyof SmartToolCardConfig, val: any) => {
    setFormData(prev => ({
      ...prev,
      tools: prev.tools.map(t => t.id === toolId ? { ...t, [field]: val } : t)
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const res = await onSaveSettings(formData);
      if (res && res.success === false) {
        setErrorMessage(res.error || 'Failed to save Smart Tools configuration to database.');
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save Smart Tools settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const activeTool = formData.tools.find(t => t.id === activeToolId) || formData.tools[0];

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Store Configuration — Smart Tools</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-serif">
            Smart Tools & Calculators Management
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Configure homepage tool cards, descriptions, titles, disclaimers, and visibility across customer storefront.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : saveSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Save className="w-4 h-4" />}
            <span>{isSaving ? 'Saving to Supabase...' : saveSuccess ? 'Saved Successfully!' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>Smart Tools settings successfully persisted to Supabase database and live store!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Global Section Settings */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h3 className="font-bold text-white text-sm">Global Section Visibility</h3>
            <p className="text-xs text-slate-400">Toggle whether the compact Smart Tools section appears on the homepage.</p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isEnabled}
              onChange={(e) => handleToggleGlobal(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
          </label>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Section Title</label>
            <input
              type="text"
              value={formData.sectionTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, sectionTitle: e.target.value }))}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Urdu Title (Optional)</label>
            <input
              type="text"
              value={formData.sectionUrduTitle || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, sectionUrduTitle: e.target.value }))}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 font-arabic"
              dir="rtl"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-300 mb-1">Section Subtitle / Description</label>
            <textarea
              rows={2}
              value={formData.sectionSubtitle}
              onChange={(e) => setFormData(prev => ({ ...prev, sectionSubtitle: e.target.value }))}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Per-Tool Configuration Tabs & Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Tool Tabs List (4 cols) */}
        <div className="lg:col-span-4 space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">Select Tool to Edit:</span>
          {formData.tools.map((tool) => (
            <button
              key={tool.id}
              type="button"
              onClick={() => setActiveToolId(tool.id)}
              className={`w-full p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                activeToolId === tool.id
                  ? 'bg-blue-950/60 border-blue-500 text-white shadow-lg'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-lg ${tool.isEnabled ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-800 text-slate-500'}`}>
                  {tool.id.includes('cement') && <HardHat className="w-4 h-4" />}
                  {tool.id.includes('planner') && <ShowerHead className="w-4 h-4" />}
                  {tool.id.includes('material') && <Calculator className="w-4 h-4" />}
                  {tool.id.includes('budget') && <DollarSign className="w-4 h-4" />}
                  {tool.id.includes('water') && <Droplet className="w-4 h-4" />}
                </div>
                <div>
                  <div className="font-bold text-xs">{tool.title}</div>
                  <div className="text-[10px] text-slate-400">{tool.urduTitle}</div>
                </div>
              </div>

              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                tool.isEnabled ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-500'
              }`}>
                {tool.isEnabled ? 'Active' : 'Disabled'}
              </span>
            </button>
          ))}
        </div>

        {/* Right Active Tool Form (8 cols) */}
        {activeTool && (
          <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-white text-base">{activeTool.title} Configuration</h3>
                <span className="text-[11px] text-slate-400 font-mono">ID: {activeTool.id}</span>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeTool.isEnabled}
                    onChange={(e) => handleToolFieldChange(activeTool.id, 'isEnabled', e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600"
                  />
                  <span>Enabled</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeTool.showOnHomepage !== false}
                    onChange={(e) => handleToolFieldChange(activeTool.id, 'showOnHomepage', e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600"
                  />
                  <span>Show on Home</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tool Title</label>
                <input
                  type="text"
                  value={activeTool.title}
                  onChange={(e) => handleToolFieldChange(activeTool.id, 'title', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Urdu Title</label>
                <input
                  type="text"
                  value={activeTool.urduTitle || ''}
                  onChange={(e) => handleToolFieldChange(activeTool.id, 'urduTitle', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500 font-arabic"
                  dir="rtl"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Tagline</label>
                <input
                  type="text"
                  value={activeTool.tagline}
                  onChange={(e) => handleToolFieldChange(activeTool.id, 'tagline', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Card Description</label>
                <textarea
                  rows={2}
                  value={activeTool.description}
                  onChange={(e) => handleToolFieldChange(activeTool.id, 'description', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Badge Text</label>
                <input
                  type="text"
                  value={activeTool.badge || ''}
                  onChange={(e) => handleToolFieldChange(activeTool.id, 'badge', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Button Label</label>
                <input
                  type="text"
                  value={activeTool.buttonText || ''}
                  onChange={(e) => handleToolFieldChange(activeTool.id, 'buttonText', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-300 mb-1">Disclaimer Text</label>
                <textarea
                  rows={2}
                  value={activeTool.disclaimer || ''}
                  onChange={(e) => handleToolFieldChange(activeTool.id, 'disclaimer', e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>
        )}

      </div>
    </form>
  );
};
