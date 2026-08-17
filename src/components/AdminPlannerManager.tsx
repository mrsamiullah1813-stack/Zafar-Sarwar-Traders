import React, { useState } from 'react';
import { 
  Sparkles, 
  Settings, 
  Save, 
  CheckCircle2, 
  Layers, 
  Palette, 
  DollarSign, 
  Plus, 
  Trash2, 
  MessageSquare, 
  Info,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { Product, EasyBathroomPlannerConfig, BathroomTypePreset, BathroomStyleOption, BathroomBudgetTier } from '../types';
import { defaultEasyBathroomPlannerConfig } from '../data/defaultPlannerConfig';

interface AdminPlannerManagerProps {
  products: Product[];
  config: EasyBathroomPlannerConfig | any;
  onSaveConfig: (updatedConfig: any) => Promise<{ success: boolean; error?: string }> | void;
}

export const AdminPlannerManager: React.FC<AdminPlannerManagerProps> = ({
  products = [],
  config,
  onSaveConfig
}) => {
  const [plannerConfig, setPlannerConfig] = useState<EasyBathroomPlannerConfig>({
    ...defaultEasyBathroomPlannerConfig,
    ...(config || {})
  });

  const [activeTab, setActiveTab] = useState<'general' | 'types' | 'styles' | 'budgets' | 'whatsapp'>('general');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [saveErrorMsg, setSaveErrorMsg] = useState<string | null>(null);

  const handleSave = async (updated?: EasyBathroomPlannerConfig) => {
    const toSave = updated || plannerConfig;
    setIsSaving(true);
    setSaveSuccessMsg(null);
    setSaveErrorMsg(null);

    try {
      const res = await onSaveConfig(toSave);
      if (res && res.success === false) {
        setSaveErrorMsg(res.error || 'Failed to save configuration to database');
      } else {
        setSaveSuccessMsg('Easy Bathroom Planner settings saved permanently to database!');
        setTimeout(() => setSaveSuccessMsg(null), 3500);
      }
    } catch (e: any) {
      setSaveErrorMsg(e?.message || 'Error saving settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleEnable = () => {
    const updated = { ...plannerConfig, isEnabled: !plannerConfig.isEnabled };
    setPlannerConfig(updated);
    handleSave(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      
      {/* Header Bar */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white font-serif">Easy Bathroom Planner CMS</h2>
            <p className="text-xs text-slate-400">
              Manage 4-step wizard questions, Pakistani bathroom presets, styles, budget tiers, and WhatsApp package formatting.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleToggleEnable}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              plannerConfig.isEnabled
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950'
                : 'bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-300'
            }`}
          >
            <span>Status: {plannerConfig.isEnabled ? 'Active (Live on Website)' : 'Disabled'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {saveSuccessMsg && (
        <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{saveSuccessMsg}</span>
        </div>
      )}

      {saveErrorMsg && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2 animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{saveErrorMsg}</span>
        </div>
      )}

      {/* Sub Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-900 border border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'general' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          <span>General & Titles</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('types')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'types' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Bathroom Types ({plannerConfig.bathroomTypes?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('styles')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'styles' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>Styles & Finishes ({plannerConfig.styles?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('budgets')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'budgets' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Budget Tiers ({plannerConfig.budgetTiers?.length || 0})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('whatsapp')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'whatsapp' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>WhatsApp Message Template</span>
        </button>
      </div>

      {/* TAB CONTENT: GENERAL & TITLES */}
      {activeTab === 'general' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <Settings className="w-4 h-4" />
            <span>Wizard Header & Bilingual Text</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tool Title (English)</label>
              <input
                type="text"
                value={plannerConfig.title}
                onChange={(e) => setPlannerConfig({ ...plannerConfig, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Tool Title (Urdu / Roman Urdu)</label>
              <input
                type="text"
                value={plannerConfig.urduTitle}
                onChange={(e) => setPlannerConfig({ ...plannerConfig, urduTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-arabic"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Subtitle (English)</label>
              <input
                type="text"
                value={plannerConfig.subtitle}
                onChange={(e) => setPlannerConfig({ ...plannerConfig, subtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Subtitle (Urdu / Roman Urdu)</label>
              <input
                type="text"
                value={plannerConfig.urduSubtitle}
                onChange={(e) => setPlannerConfig({ ...plannerConfig, urduSubtitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-arabic"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Bottom Disclaimer & Warranty Note</label>
            <textarea
              rows={2}
              value={plannerConfig.disclaimerText}
              onChange={(e) => setPlannerConfig({ ...plannerConfig, disclaimerText: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save General Settings'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BATHROOM TYPES */}
      {activeTab === 'types' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>Bathroom Type Presets (Master, Family, Guest, Rental)</span>
          </h3>

          <div className="space-y-3">
            {plannerConfig.bathroomTypes.map((type, idx) => (
              <div key={type.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Type Name (English)</label>
                    <input
                      type="text"
                      value={type.name}
                      onChange={(e) => {
                        const updated = [...plannerConfig.bathroomTypes];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setPlannerConfig({ ...plannerConfig, bathroomTypes: updated });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Type Name (Urdu)</label>
                    <input
                      type="text"
                      value={type.urduName}
                      onChange={(e) => {
                        const updated = [...plannerConfig.bathroomTypes];
                        updated[idx] = { ...updated[idx], urduName: e.target.value };
                        setPlannerConfig({ ...plannerConfig, bathroomTypes: updated });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-arabic"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Description</label>
                  <input
                    type="text"
                    value={type.description}
                    onChange={(e) => {
                      const updated = [...plannerConfig.bathroomTypes];
                      updated[idx] = { ...updated[idx], description: e.target.value };
                      setPlannerConfig({ ...plannerConfig, bathroomTypes: updated });
                    }}
                    className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Bathroom Types'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: STYLES & FINISHES */}
      {activeTab === 'styles' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span>Styles & Finishes (Chrome, Matte Black, Gold, White)</span>
          </h3>

          <div className="space-y-3">
            {plannerConfig.styles.map((st, idx) => (
              <div key={st.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Style Name</label>
                    <input
                      type="text"
                      value={st.name}
                      onChange={(e) => {
                        const updated = [...plannerConfig.styles];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setPlannerConfig({ ...plannerConfig, styles: updated });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Urdu Style</label>
                    <input
                      type="text"
                      value={st.urduName}
                      onChange={(e) => {
                        const updated = [...plannerConfig.styles];
                        updated[idx] = { ...updated[idx], urduName: e.target.value };
                        setPlannerConfig({ ...plannerConfig, styles: updated });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-arabic"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Hex Color Code</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={st.colorHex || '#94a3b8'}
                        onChange={(e) => {
                          const updated = [...plannerConfig.styles];
                          updated[idx] = { ...updated[idx], colorHex: e.target.value };
                          setPlannerConfig({ ...plannerConfig, styles: updated });
                        }}
                        className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                      />
                      <input
                        type="text"
                        value={st.colorHex}
                        onChange={(e) => {
                          const updated = [...plannerConfig.styles];
                          updated[idx] = { ...updated[idx], colorHex: e.target.value };
                          setPlannerConfig({ ...plannerConfig, styles: updated });
                        }}
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Styles & Finishes'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: BUDGET TIERS */}
      {activeTab === 'budgets' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <DollarSign className="w-4 h-4" />
            <span>Budget Tiers & Price Brackets</span>
          </h3>

          <div className="space-y-3">
            {plannerConfig.budgetTiers.map((tier, idx) => (
              <div key={tier.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Tier Name</label>
                    <input
                      type="text"
                      value={tier.name}
                      onChange={(e) => {
                        const updated = [...plannerConfig.budgetTiers];
                        updated[idx] = { ...updated[idx], name: e.target.value };
                        setPlannerConfig({ ...plannerConfig, budgetTiers: updated });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Price Range Label</label>
                    <input
                      type="text"
                      value={tier.priceRange}
                      onChange={(e) => {
                        const updated = [...plannerConfig.budgetTiers];
                        updated[idx] = { ...updated[idx], priceRange: e.target.value };
                        setPlannerConfig({ ...plannerConfig, budgetTiers: updated });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-emerald-400 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">Urdu Label</label>
                    <input
                      type="text"
                      value={tier.urduName}
                      onChange={(e) => {
                        const updated = [...plannerConfig.budgetTiers];
                        updated[idx] = { ...updated[idx], urduName: e.target.value };
                        setPlannerConfig({ ...plannerConfig, budgetTiers: updated });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-arabic"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Budget Tiers'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB CONTENT: WHATSAPP TEMPLATE */}
      {activeTab === 'whatsapp' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            <span>WhatsApp Package Order Template</span>
          </h3>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300">Available Placeholder Tags:</p>
            <p className="font-mono text-[11px] text-emerald-400">
              {`{bathroomType}`} • {`{style}`} • {`{budget}`} • {`{itemsCount}`} • {`{itemsList}`} • {`{totalPrice}`}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">WhatsApp Message Content</label>
            <textarea
              rows={10}
              value={plannerConfig.whatsappTemplate}
              onChange={(e) => setPlannerConfig({ ...plannerConfig, whatsappTemplate: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex justify-end">
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={isSaving}
              className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save WhatsApp Template'}</span>
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
