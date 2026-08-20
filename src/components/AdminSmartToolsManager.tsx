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
  ShoppingBag, 
  Building2, 
  Bot, 
  Boxes, 
  Palette, 
  Sliders, 
  CheckCircle2, 
  RefreshCw,
  Info,
  Settings
} from 'lucide-react';
import { SmartToolsSettings, SmartToolCardConfig } from '../types';
import { defaultSmartToolsSettings } from '../data/defaultSmartToolsConfig';
import { normalizeSmartToolId } from './SmartToolsModal';

interface AdminSmartToolsManagerProps {
  settings: SmartToolsSettings;
  onSaveSettings: (updated: SmartToolsSettings) => Promise<any> | void;
}

export const AdminSmartToolsManager: React.FC<AdminSmartToolsManagerProps> = ({
  settings = defaultSmartToolsSettings,
  onSaveSettings
}) => {
  const [formData, setFormData] = useState<SmartToolsSettings>(() => ({
    ...defaultSmartToolsSettings,
    ...(settings || {})
  }));

  const [activeTab, setActiveTab] = useState<'tools' | 'assumptions'>('tools');
  const [activeToolId, setActiveToolId] = useState<string>(() => formData.tools?.[0]?.id || 'cement-calculator');
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

  const getToolIcon = (id: string) => {
    const norm = normalizeSmartToolId(id);
    switch (norm) {
      case 'cement-calculator': return <HardHat className="w-4 h-4 text-amber-500" />;
      case 'bathroom-planner': return <ShowerHead className="w-4 h-4 text-blue-500" />;
      case 'material-estimator': return <Calculator className="w-4 h-4 text-emerald-500" />;
      case 'product-finder': return <ShoppingBag className="w-4 h-4 text-blue-500" />;
      case 'construction-cost': return <Building2 className="w-4 h-4 text-amber-500" />;
      case 'budget-products': return <Bot className="w-4 h-4 text-indigo-500" />;
      case 'bricks': return <Boxes className="w-4 h-4 text-orange-500" />;
      case 'paint': return <Palette className="w-4 h-4 text-rose-500" />;
      case 'water-tank': return <Droplet className="w-4 h-4 text-cyan-500" />;
      default: return <Sparkles className="w-4 h-4 text-blue-500" />;
    }
  };

  return (
    <form onSubmit={handleSave} className="space-y-6 animate-fadeIn">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-400 mb-1">
            <Sparkles className="w-4 h-4" />
            <span>Store Configuration — Smart Tools Hub</span>
          </div>
          <h2 className="text-2xl font-bold text-white font-serif">
            Smart Tools & Estimators Management
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Manage visibility, titles, badges, and civil engineering calculation rates for all 9 smart store utilities.
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
          <span>Smart Tools settings successfully persisted to Supabase database!</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Tab Switcher: Tools vs Assumptions */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'tools'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Tools Visibility & Cards ({formData.tools.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assumptions')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'assumptions'
              ? 'bg-blue-600 text-white'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          Civil Calculation Assumptions
        </button>
      </div>

      {activeTab === 'tools' && (
        <>
          {/* Global Section Settings */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="font-bold text-white text-sm">Global Homepage Entry Visibility</h3>
                <p className="text-xs text-slate-400">Toggle whether the compact Smart Tools entry appears on the homepage.</p>
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
              <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
                {formData.tools.map((tool) => (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => setActiveToolId(tool.id)}
                    className={`w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                      activeToolId === tool.id
                        ? 'bg-blue-950/60 border-blue-500 text-white shadow-lg'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-lg ${tool.isEnabled ? 'bg-slate-800' : 'bg-slate-850 text-slate-600'}`}>
                        {getToolIcon(tool.id)}
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
        </>
      )}

      {activeTab === 'assumptions' && (
        <div className="space-y-6">
          {/* Construction Cost Rates */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-400" />
              House Construction Base Rates (PKR per Sq Ft)
            </h3>
            <p className="text-xs text-slate-400">
              Set default covered-area construction rates for Pakistani market calculations.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Grey Structure Standard (Rs/sq ft)</label>
                <input
                  type="number"
                  value={formData.constructionCostSettings?.greyStructureStandardPerSqFt || 2500}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    constructionCostSettings: {
                      ...prev.constructionCostSettings,
                      greyStructureStandardPerSqFt: parseFloat(e.target.value) || 2500
                    }
                  }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Finishing Standard (Rs/sq ft)</label>
                <input
                  type="number"
                  value={formData.constructionCostSettings?.finishingStandardPerSqFt || 2600}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    constructionCostSettings: {
                      ...prev.constructionCostSettings,
                      finishingStandardPerSqFt: parseFloat(e.target.value) || 2600
                    }
                  }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Complete Turnkey Standard (Rs/sq ft)</label>
                <input
                  type="number"
                  value={formData.constructionCostSettings?.completeStandardPerSqFt || 5100}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    constructionCostSettings: {
                      ...prev.constructionCostSettings,
                      completeStandardPerSqFt: parseFloat(e.target.value) || 5100
                    }
                  }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Bricks & Masonry Settings */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Boxes className="w-4 h-4 text-orange-400" />
              Bricks Masonry Standards
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">9" Double Wall (Bricks / Sq Ft)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.brickSettings?.doubleWallBricksPerSqFt || 9.0}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    brickSettings: {
                      ...prev.brickSettings,
                      doubleWallBricksPerSqFt: parseFloat(e.target.value) || 9.0
                    }
                  }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">4.5" Single Wall (Bricks / Sq Ft)</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.brickSettings?.singleWallBricksPerSqFt || 4.5}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    brickSettings: {
                      ...prev.brickSettings,
                      singleWallBricksPerSqFt: parseFloat(e.target.value) || 4.5
                    }
                  }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Mortar Cement Bags per 1,000 Bricks</label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.brickSettings?.cementBagsPer1000Bricks || 3.2}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    brickSettings: {
                      ...prev.brickSettings,
                      cementBagsPer1000Bricks: parseFloat(e.target.value) || 3.2
                    }
                  }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Sand CFT per 1,000 Bricks</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.brickSettings?.sandCftPer1000Bricks || 15.0}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    brickSettings: {
                      ...prev.brickSettings,
                      sandCftPer1000Bricks: parseFloat(e.target.value) || 15.0
                    }
                  }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Default Wastage Allowance (%)</label>
                <input
                  type="number"
                  step="1"
                  value={formData.brickSettings?.defaultWastagePercent || 5}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    brickSettings: {
                      ...prev.brickSettings,
                      defaultWastagePercent: parseFloat(e.target.value) || 5
                    }
                  }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Default Wall Height (Feet)</label>
                <input
                  type="number"
                  step="0.5"
                  value={formData.brickSettings?.defaultWallHeightFeet || 10}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    brickSettings: {
                      ...prev.brickSettings,
                      defaultWallHeightFeet: parseFloat(e.target.value) || 10
                    }
                  }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>
            </div>
          </div>

          {/* Paint Settings */}
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Palette className="w-4 h-4 text-rose-400" />
              Paint Coverage Standards
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Coverage (Sq Ft / Litre / Coat)</label>
                <input
                  type="number"
                  value={formData.paintSettings?.sqFtPerLitrePerCoat || 130}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    paintSettings: {
                      ...prev.paintSettings,
                      sqFtPerLitrePerCoat: parseFloat(e.target.value) || 130
                    }
                  }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Default Wastage %</label>
                <input
                  type="number"
                  value={formData.paintSettings?.defaultWastagePercent || 5}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    paintSettings: {
                      ...prev.paintSettings,
                      defaultWastagePercent: parseFloat(e.target.value) || 5
                    }
                  }))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </form>
  );
};
