import React, { useState } from 'react';
import { 
  Calculator, 
  HardHat, 
  Settings, 
  ToggleLeft, 
  ToggleRight, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Info, 
  Save, 
  Layers, 
  Home, 
  ShieldCheck, 
  AlertTriangle, 
  Package, 
  MessageSquare, 
  RotateCcw,
  Sliders,
  Check,
  Building2
} from 'lucide-react';
import { 
  BuildMaterialEstimatorConfig, 
  HouseSizePreset, 
  ConstructionTypeOption, 
  FloorOption, 
  ConstructionQualityOption, 
  OptionalEstimatorFactor 
} from '../types';
import { defaultBuildMaterialEstimatorConfig } from '../data/defaultEstimatorConfig';

interface AdminEstimatorManagerProps {
  config: BuildMaterialEstimatorConfig;
  onSaveConfig: (updated: BuildMaterialEstimatorConfig) => Promise<{ success: boolean; error?: string }> | void;
}

export const AdminEstimatorManager: React.FC<AdminEstimatorManagerProps> = ({
  config,
  onSaveConfig
}) => {
  const [formState, setFormState] = useState<BuildMaterialEstimatorConfig>({
    ...defaultBuildMaterialEstimatorConfig,
    ...config
  });

  const [activeSubTab, setActiveSubTab] = useState<'general' | 'calculation' | 'sizes' | 'types' | 'disclaimer' | 'products'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // New item draft states
  const [newFactorText, setNewFactorText] = useState('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleEnable = () => {
    setFormState(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all estimator configuration back to default civil engineering standards?')) {
      setFormState({ ...defaultBuildMaterialEstimatorConfig });
      showToast('Estimator reset to default configuration');
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await onSaveConfig(formState);
      if (res && res.success === false) {
        setErrorMessage(res.error || 'Failed to persist settings to Supabase.');
      } else {
        showToast('Estimator configuration permanently saved to Supabase & CMS!');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error saving settings.');
    } finally {
      setIsSaving(false);
    }
  };

  // House Size Presets Helper
  const handleUpdateHouseSize = (index: number, updates: Partial<HouseSizePreset>) => {
    const updated = [...(formState.houseSizes || [])];
    updated[index] = { ...updated[index], ...updates };
    setFormState(prev => ({ ...prev, houseSizes: updated }));
  };

  const handleAddHouseSize = () => {
    const newPreset: HouseSizePreset = {
      id: `size-${Date.now()}`,
      name: '8 Marla',
      marlaCount: 8,
      defaultCoveredAreaSqFt: 2800,
      popular: false,
      description: 'Custom Marla residential preset'
    };
    setFormState(prev => ({
      ...prev,
      houseSizes: [...(prev.houseSizes || []), newPreset]
    }));
  };

  const handleDeleteHouseSize = (index: number) => {
    setFormState(prev => ({
      ...prev,
      houseSizes: prev.houseSizes.filter((_, i) => i !== index)
    }));
  };

  // Construction Types Helper
  const handleUpdateConstType = (index: number, updates: Partial<ConstructionTypeOption>) => {
    const updated = [...(formState.constructionTypes || [])];
    updated[index] = { ...updated[index], ...updates };
    setFormState(prev => ({ ...prev, constructionTypes: updated }));
  };

  // Floors Helper
  const handleUpdateFloor = (index: number, updates: Partial<FloorOption>) => {
    const updated = [...(formState.floorsOptions || [])];
    updated[index] = { ...updated[index], ...updates };
    setFormState(prev => ({ ...prev, floorsOptions: updated }));
  };

  // Optional Factors Helper
  const handleUpdateOptionalFactor = (index: number, updates: Partial<OptionalEstimatorFactor>) => {
    const updated = [...(formState.optionalFactors || [])];
    updated[index] = { ...updated[index], ...updates };
    setFormState(prev => ({ ...prev, optionalFactors: updated }));
  };

  const handleAddOptionalFactor = () => {
    const newFactor: OptionalEstimatorFactor = {
      id: `factor-${Date.now()}`,
      label: 'New Structural Feature',
      description: 'Describe structural addition',
      percentageAdjustment: 0.05,
      defaultChecked: false
    };
    setFormState(prev => ({
      ...prev,
      optionalFactors: [...(prev.optionalFactors || []), newFactor]
    }));
  };

  const handleDeleteOptionalFactor = (index: number) => {
    setFormState(prev => ({
      ...prev,
      optionalFactors: prev.optionalFactors.filter((_, i) => i !== index)
    }));
  };

  // Disclaimers Factors Helper
  const handleAddDisclaimerFactor = () => {
    if (!newFactorText.trim()) return;
    setFormState(prev => ({
      ...prev,
      factorsList: [...(prev.factorsList || []), newFactorText.trim()]
    }));
    setNewFactorText('');
  };

  const handleDeleteDisclaimerFactor = (index: number) => {
    setFormState(prev => ({
      ...prev,
      factorsList: prev.factorsList.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      
      {/* TOP HEADER & CONTROLS */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 shrink-0">
            <HardHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-tight font-serif">
                Build Material & Cement Estimator
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                formState.isEnabled
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                  : 'bg-rose-950 text-rose-300 border border-rose-500/40'
              }`}>
                {formState.isEnabled ? 'Estimator Active' : 'Estimator Disabled'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-light">
              Manage civil calculation base rates, multipliers, house sizes, disclaimer notes, and live showroom cement recommendations.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleToggleEnable}
            className={`px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border ${
              formState.isEnabled
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-400'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
            }`}
          >
            {formState.isEnabled ? <ToggleRight className="w-5 h-5 text-white" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
            <span>{formState.isEnabled ? 'Enabled' : 'Disabled'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Reset to civil engineering defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving to Supabase...' : 'Save Settings'}</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK TOASTS */}
      {toastMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-2 shadow-lg animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/90 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-2 shadow-lg animate-fadeIn">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* SUB-TABS NAVIGATION */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold border-b border-slate-800">
        {[
          { id: 'general', label: 'General & Copy', icon: Settings },
          { id: 'calculation', label: 'Calculation Rates', icon: Calculator },
          { id: 'sizes', label: 'House Sizes & Marla', icon: Home },
          { id: 'types', label: 'Structure & Multipliers', icon: Layers },
          { id: 'disclaimer', label: 'Disclaimers & Factors', icon: AlertTriangle },
          { id: 'products', label: 'Cement Products', icon: Package }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-950'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        
        {/* SUB-TAB 1: GENERAL & HEADINGS */}
        {activeSubTab === 'general' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
              <Settings className="w-4 h-4 text-blue-400" />
              <span>Section Identity & Customer Headings</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Section Title</label>
                <input
                  type="text"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  placeholder="Build Material & Cement Estimator"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Badge / Tagline</label>
                <input
                  type="text"
                  value={formState.tagline}
                  onChange={(e) => setFormState({ ...formState, tagline: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  placeholder="DIRECT DISTRIBUTOR CIVIL CALCULATION ENGINE"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Subtitle / Purpose</label>
              <input
                type="text"
                value={formState.subtitle}
                onChange={(e) => setFormState({ ...formState, subtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                placeholder="Estimate Grade 53 cement requirements for your house construction in Pakistan."
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp Inquiry Template</label>
              <textarea
                rows={3}
                value={formState.whatsappInquiryTemplate}
                onChange={(e) => setFormState({ ...formState, whatsappInquiryTemplate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Available placeholders: {'{bagsRange}'}, {'{houseSize}'}, {'{coveredArea}'}, {'{floors}'}, {'{constructionType}'}
              </p>
            </div>
          </div>
        )}

        {/* SUB-TAB 2: CALCULATION RATES & PERCENTAGES */}
        {activeSubTab === 'calculation' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
              <Calculator className="w-4 h-4 text-blue-400" />
              <span>Civil Engineering Base Rates & Range Configuration</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Base Cement Bags Per Sq Ft
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="1.5"
                  value={formState.baseCementBagsPerSqFt}
                  onChange={(e) => setFormState({ ...formState, baseCementBagsPerSqFt: parseFloat(e.target.value) || 0.38 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Pakistan standard baseline: 0.38 - 0.42 bags / sq ft
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Min Estimate Bound (% multiplier)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.5"
                  max="1.0"
                  value={formState.minEstimatePercentage}
                  onChange={(e) => setFormState({ ...formState, minEstimatePercentage: parseFloat(e.target.value) || 0.92 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Default 0.92 (-8% for minimum requirement bound)
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Max Estimate Bound (% multiplier)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="1.0"
                  max="1.8"
                  value={formState.maxEstimatePercentage}
                  onChange={(e) => setFormState({ ...formState, maxEstimatePercentage: parseFloat(e.target.value) || 1.08 })}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Default 1.08 (+8% for upper bound buffer)
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Square Feet per Marla Conversion (Pakistan Standard)
              </label>
              <input
                type="number"
                value={formState.sqFtPerMarla}
                onChange={(e) => setFormState({ ...formState, sqFtPerMarla: parseInt(e.target.value) || 225 })}
                className="w-full max-w-xs px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Standard in Punjab/Lahore is 225 sq ft (or 250 sq ft in select housing societies).
              </p>
            </div>
          </div>
        )}

        {/* SUB-TAB 3: HOUSE SIZES & MARLA PRESETS */}
        {activeSubTab === 'sizes' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Home className="w-4 h-4 text-blue-400" />
                <span>House Size Presets (Pakistan Marla / Kanal)</span>
              </h3>
              <button
                type="button"
                onClick={handleAddHouseSize}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Preset</span>
              </button>
            </div>

            <div className="space-y-3">
              {formState.houseSizes?.map((size, idx) => (
                <div
                  key={size.id || idx}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-3/4">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold">Preset Name</label>
                      <input
                        type="text"
                        value={size.name}
                        onChange={(e) => handleUpdateHouseSize(idx, { name: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold">Default Covered Area (Sq Ft)</label>
                      <input
                        type="number"
                        value={size.defaultCoveredAreaSqFt}
                        onChange={(e) => handleUpdateHouseSize(idx, { defaultCoveredAreaSqFt: parseInt(e.target.value) || 1800 })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold">Popular Badge</label>
                      <button
                        type="button"
                        onClick={() => handleUpdateHouseSize(idx, { popular: !size.popular })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                          size.popular
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        {size.popular ? '★ Popular' : 'Standard'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteHouseSize(idx)}
                    className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-400 border border-rose-800/40 self-end sm:self-center"
                    title="Delete Preset"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SUB-TAB 4: STRUCTURE & MULTIPLIERS */}
        {activeSubTab === 'types' && (
          <div className="space-y-6">
            
            {/* Construction Types */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Construction Types Multipliers</span>
              </h3>

              <div className="space-y-3">
                {formState.constructionTypes?.map((cType, idx) => (
                  <div key={cType.id || idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold">Type Name</label>
                      <input
                        type="text"
                        value={cType.name}
                        onChange={(e) => handleUpdateConstType(idx, { name: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold">Description</label>
                      <input
                        type="text"
                        value={cType.description}
                        onChange={(e) => handleUpdateConstType(idx, { description: e.target.value })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-slate-400 uppercase font-semibold">Multiplier</label>
                      <input
                        type="number"
                        step="0.05"
                        value={cType.multiplier}
                        onChange={(e) => handleUpdateConstType(idx, { multiplier: parseFloat(e.target.value) || 1.0 })}
                        className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Optional Factors Multipliers */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span>Optional Construction Features & Percentage Adjustments</span>
                </h3>
                <button
                  type="button"
                  onClick={handleAddOptionalFactor}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Feature</span>
                </button>
              </div>

              <div className="space-y-3">
                {formState.optionalFactors?.map((factor, idx) => (
                  <div key={factor.id || idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full sm:w-4/5">
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-semibold">Feature Label</label>
                        <input
                          type="text"
                          value={factor.label}
                          onChange={(e) => handleUpdateOptionalFactor(idx, { label: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-semibold">Description</label>
                        <input
                          type="text"
                          value={factor.description}
                          onChange={(e) => handleUpdateOptionalFactor(idx, { description: e.target.value })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-400 uppercase font-semibold">Adjustment (+% as decimal, e.g. 0.08 = +8%)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={factor.percentageAdjustment}
                          onChange={(e) => handleUpdateOptionalFactor(idx, { percentageAdjustment: parseFloat(e.target.value) || 0 })}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeleteOptionalFactor(idx)}
                      className="p-2 rounded-lg bg-rose-950/40 hover:bg-rose-900 text-rose-400 border border-rose-800/40 self-end sm:self-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* SUB-TAB 5: DISCLAIMERS & CIVIL FACTORS */}
        {activeSubTab === 'disclaimer' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Mandatory Pakistan Disclaimers & Civil Factors Notes</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Main Warning Heading (Urdu / English)
              </label>
              <input
                type="text"
                value={formState.disclaimerHeading}
                onChange={(e) => setFormState({ ...formState, disclaimerHeading: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Engineering Final Verification Notice
              </label>
              <input
                type="text"
                value={formState.engineeringWarningText}
                onChange={(e) => setFormState({ ...formState, engineeringWarningText: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 space-y-3">
              <label className="block text-xs font-semibold text-slate-300">
                Factors Influencing Final Quantity (Bullet Points List)
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newFactorText}
                  onChange={(e) => setNewFactorText(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddDisclaimerFactor(); } }}
                  placeholder="e.g. Weather / ambient temperature during concrete pour"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
                <button
                  type="button"
                  onClick={handleAddDisclaimerFactor}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  Add
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {formState.factorsList?.map((factor, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs text-slate-300"
                  >
                    <span>• {factor}</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteDisclaimerFactor(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SUB-TAB 6: SHOWROOM CEMENT PRODUCTS */}
        {activeSubTab === 'products' && (
          <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2 border-b border-slate-800 pb-3">
              <Package className="w-4 h-4 text-blue-400" />
              <span>Showroom Cement Recommendations Display</span>
            </h3>

            <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Enable Live Cement Products in Estimator</span>
                <span className="text-[11px] text-slate-400">Dynamically shows cement products from your live catalog directly in the estimator result card</span>
              </div>
              <button
                type="button"
                onClick={() => setFormState(prev => ({ ...prev, enableCementProducts: !prev.enableCementProducts }))}
                className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                  formState.enableCementProducts !== false
                    ? 'bg-emerald-600 text-white border-emerald-500'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
              >
                {formState.enableCementProducts !== false ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cement Category Slug / Keyword
              </label>
              <input
                type="text"
                value={formState.cementCategorySlug || 'cement'}
                onChange={(e) => setFormState({ ...formState, cementCategorySlug: e.target.value })}
                className="w-full max-w-sm px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                placeholder="cement"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Matches products with this category slug or products containing &apos;cement&apos; in their name.
              </p>
            </div>
          </div>
        )}

      </form>
    </div>
  );
};
