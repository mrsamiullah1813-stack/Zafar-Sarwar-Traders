import React, { useState } from 'react';
import { 
  Sparkles, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Sliders, 
  ToggleLeft, 
  ToggleRight, 
  Save, 
  Info, 
  Layers, 
  Package, 
  Tag, 
  CheckCircle2, 
  Palette, 
  Home, 
  DollarSign, 
  Pin, 
  EyeOff, 
  Eye
} from 'lucide-react';
import { Product, AiDesignerConfig, DesignerRecommendationRule, DesignerCategoryType } from '../types';
import { DESIGNER_CATEGORIES } from '../utils/plannerRecommendationEngine';

interface AdminDesignerManagerProps {
  products: Product[];
  config: AiDesignerConfig;
  onSaveConfig: (updatedConfig: AiDesignerConfig) => void;
}

export const AdminDesignerManager: React.FC<AdminDesignerManagerProps> = ({
  products,
  config,
  onSaveConfig
}) => {
  const [designerConfig, setDesignerConfig] = useState<AiDesignerConfig>(config);
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'options' | 'rules' | 'products'>('general');
  const [isSavedNotice, setIsSavedNotice] = useState(false);
  const [productSearch, setProductSearch] = useState('');

  // Rule Form Modal State
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<DesignerRecommendationRule | null>(null);

  // Options Edit State
  const [editingOptionType, setEditingOptionType] = useState<'roomTypes' | 'styles' | 'colorThemes' | 'budgetLevels' | null>(null);
  const [newOptionForm, setNewOptionForm] = useState<{ id: string; label: string; description: string; hex?: string; badge?: string; icon?: string }>({
    id: '',
    label: '',
    description: '',
    hex: '#3b82f6',
    badge: 'NEW',
    icon: 'Home'
  });

  const triggerSaved = () => {
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  const handleToggleEnable = () => {
    const updated = { ...designerConfig, isEnabled: !designerConfig.isEnabled };
    setDesignerConfig(updated);
    onSaveConfig(updated);
    triggerSaved();
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveConfig(designerConfig);
    triggerSaved();
  };

  // Rule Handlers
  const handleOpenNewRule = () => {
    setEditingRule({
      id: `rule-${Date.now()}`,
      name: '',
      categoryName: 'Wash Basin',
      roomTypes: [],
      styles: [],
      colorThemes: [],
      budgets: [],
      assignedProductId: products[0]?.id || '',
      customNote: '',
      isActive: true
    });
    setIsRuleModalOpen(true);
  };

  const handleEditRule = (rule: DesignerRecommendationRule) => {
    setEditingRule({ ...rule });
    setIsRuleModalOpen(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = designerConfig.rules.filter((r) => r.id !== ruleId);
    const updated = { ...designerConfig, rules: updatedRules };
    setDesignerConfig(updated);
    onSaveConfig(updated);
    triggerSaved();
  };

  const handleSaveRule = () => {
    if (!editingRule || !editingRule.name.trim()) return;

    let updatedRules = [...(designerConfig.rules || [])];
    const existingIndex = updatedRules.findIndex((r) => r.id === editingRule.id);

    if (existingIndex >= 0) {
      updatedRules[existingIndex] = editingRule;
    } else {
      updatedRules.push(editingRule);
    }

    const updated = { ...designerConfig, rules: updatedRules };
    setDesignerConfig(updated);
    onSaveConfig(updated);
    setIsRuleModalOpen(false);
    triggerSaved();
  };

  // Option Handlers (Room Types, Styles, Color Themes, Budgets)
  const handleAddOption = (type: 'roomTypes' | 'styles' | 'colorThemes' | 'budgetLevels') => {
    if (!newOptionForm.label.trim()) return;
    const optId = newOptionForm.label.trim();

    const updatedConfig = { ...designerConfig };

    if (type === 'roomTypes') {
      updatedConfig.roomTypes = [
        ...updatedConfig.roomTypes,
        { id: optId, label: newOptionForm.label, description: newOptionForm.description, icon: newOptionForm.icon || 'Home' }
      ];
    } else if (type === 'styles') {
      updatedConfig.styles = [
        ...updatedConfig.styles,
        { id: optId, label: newOptionForm.label, description: newOptionForm.description, badge: newOptionForm.badge }
      ];
    } else if (type === 'colorThemes') {
      updatedConfig.colorThemes = [
        ...updatedConfig.colorThemes,
        { id: optId, label: newOptionForm.label, hex: newOptionForm.hex || '#ffffff', description: newOptionForm.description }
      ];
    } else if (type === 'budgetLevels') {
      updatedConfig.budgetLevels = [
        ...updatedConfig.budgetLevels,
        { id: optId, label: newOptionForm.label, description: newOptionForm.description, priceRange: newOptionForm.badge }
      ];
    }

    setDesignerConfig(updatedConfig);
    onSaveConfig(updatedConfig);
    setNewOptionForm({ id: '', label: '', description: '', hex: '#3b82f6', badge: '', icon: 'Home' });
    setEditingOptionType(null);
    triggerSaved();
  };

  const handleDeleteOption = (type: 'roomTypes' | 'styles' | 'colorThemes' | 'budgetLevels', id: string) => {
    const updatedConfig = { ...designerConfig };
    if (type === 'roomTypes') updatedConfig.roomTypes = updatedConfig.roomTypes.filter((o) => o.id !== id);
    if (type === 'styles') updatedConfig.styles = updatedConfig.styles.filter((o) => o.id !== id);
    if (type === 'colorThemes') updatedConfig.colorThemes = updatedConfig.colorThemes.filter((o) => o.id !== id);
    if (type === 'budgetLevels') updatedConfig.budgetLevels = updatedConfig.budgetLevels.filter((o) => o.id !== id);

    setDesignerConfig(updatedConfig);
    onSaveConfig(updatedConfig);
    triggerSaved();
  };

  // Product Tagging & Pinning Matrix Handler
  const handleToggleProductPin = (productId: string) => {
    const currentTags = designerConfig.productTags?.[productId] || {};
    const updatedTags = {
      ...designerConfig.productTags,
      [productId]: { ...currentTags, pinned: !currentTags.pinned }
    };
    const updated = { ...designerConfig, productTags: updatedTags };
    setDesignerConfig(updated);
    onSaveConfig(updated);
    triggerSaved();
  };

  const handleToggleProductHidden = (productId: string) => {
    const currentTags = designerConfig.productTags?.[productId] || {};
    const updatedTags = {
      ...designerConfig.productTags,
      [productId]: { ...currentTags, hidden: !currentTags.hidden }
    };
    const updated = { ...designerConfig, productTags: updatedTags };
    setDesignerConfig(updated);
    onSaveConfig(updated);
    triggerSaved();
  };

  return (
    <div className="space-y-8 text-slate-100">
      
      {/* Top Banner & Control Bar */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 p-0.5 shadow-lg shadow-amber-950/40">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-amber-400" />
            </div>
          </div>
          <div>
            <h2 className="text-xl font-bold font-serif text-white">AI Interior Designer CMS</h2>
            <p className="text-xs text-slate-400">Configure room options, styles, color themes, rules, and product matrix.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {isSavedNotice && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-mono text-xs font-bold animate-pulse">
              <Check className="w-4 h-4" /> Saved to CMS
            </span>
          )}

          <button
            onClick={handleToggleEnable}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              designerConfig.isEnabled
                ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                : 'bg-rose-950 text-rose-300 border border-rose-500/40'
            }`}
          >
            {designerConfig.isEnabled ? <ToggleRight className="w-5 h-5 text-emerald-400" /> : <ToggleLeft className="w-5 h-5 text-rose-400" />}
            <span>Feature Status: {designerConfig.isEnabled ? 'ENABLED' : 'DISABLED'}</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-4">
        {[
          { id: 'general', label: 'Section Titles & Settings', icon: Settings },
          { id: 'options', label: 'Room Types & Style Options', icon: Layers },
          { id: 'rules', label: 'Recommendation Rules', icon: Sliders },
          { id: 'products', label: 'Product Tagging & Pinning', icon: Tag },
        ].map((tab) => {
          const TabIcon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              <TabIcon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: GENERAL SETTINGS ================= */}
      {activeSubTab === 'general' && (
        <form onSubmit={handleSaveGeneral} className="p-8 rounded-3xl bg-slate-900 border border-slate-800 space-y-6 max-w-4xl">
          <h3 className="text-lg font-bold font-serif text-white border-b border-slate-800 pb-3">Section Headers & Text Content</h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Section Main Title</label>
              <input
                type="text"
                value={designerConfig.title}
                onChange={(e) => setDesignerConfig({ ...designerConfig, title: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Section Subtitle / Description</label>
              <textarea
                rows={2}
                value={designerConfig.subtitle}
                onChange={(e) => setDesignerConfig({ ...designerConfig, subtitle: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Banner Badge Text</label>
              <input
                type="text"
                value={designerConfig.bannerTag}
                onChange={(e) => setDesignerConfig({ ...designerConfig, bannerTag: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-amber-400 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">WhatsApp Order Message Template</label>
              <textarea
                rows={8}
                value={designerConfig.whatsappTemplate}
                onChange={(e) => setDesignerConfig({ ...designerConfig, whatsappTemplate: e.target.value })}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-mono focus:border-amber-400 outline-none leading-relaxed"
              />
              <p className="text-[10px] text-slate-500 mt-1">Placeholders available: &#123;roomType&#125;, &#123;style&#125;, &#123;colorTheme&#125;, &#123;budget&#125;, &#123;roomSize&#125;, &#123;count&#125;, &#123;productList&#125;, &#123;totalPrice&#125;</p>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-all shadow-lg shadow-amber-950/40"
            >
              <Save className="w-4 h-4" />
              <span>Save Text Changes</span>
            </button>
          </div>
        </form>
      )}

      {/* ================= TAB 2: OPTIONS MANAGEMENT ================= */}
      {activeSubTab === 'options' && (
        <div className="space-y-8">
          {/* ROOM TYPES */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Home className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-serif text-white">Room Types</h3>
              </div>
              <button
                onClick={() => setEditingOptionType('roomTypes')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950 border border-blue-500/40 text-blue-300 text-xs font-bold hover:bg-blue-900"
              >
                <Plus className="w-3.5 h-3.5" /> Add Room Type
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {(designerConfig?.roomTypes || []).map((r) => (
                <div key={r.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{r.label}</h4>
                    <p className="text-xs text-slate-400 mt-1">{r.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
                    <button
                      onClick={() => handleDeleteOption('roomTypes', r.id)}
                      className="text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* INTERIOR STYLES */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-serif text-white">Interior Styles</h3>
              </div>
              <button
                onClick={() => setEditingOptionType('styles')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950 border border-blue-500/40 text-blue-300 text-xs font-bold hover:bg-blue-900"
              >
                <Plus className="w-3.5 h-3.5" /> Add Style
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {(designerConfig?.styles || []).map((s) => (
                <div key={s.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-white text-sm">{s.label}</h4>
                      {s.badge && <span className="px-2 py-0.5 rounded text-[9px] font-mono bg-blue-950 text-blue-300">{s.badge}</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{s.description}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-end">
                    <button
                      onClick={() => handleDeleteOption('styles', s.id)}
                      className="text-slate-500 hover:text-rose-400 text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* COLOR THEMES */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-bold font-serif text-white">Color Themes</h3>
              </div>
              <button
                onClick={() => setEditingOptionType('colorThemes')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-950 border border-blue-500/40 text-blue-300 text-xs font-bold hover:bg-blue-900"
              >
                <Plus className="w-3.5 h-3.5" /> Add Color Theme
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {(designerConfig?.colorThemes || []).map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-white/20 shrink-0" style={{ backgroundColor: c.hex }} />
                    <div>
                      <h4 className="font-bold text-white text-xs">{c.label}</h4>
                      <span className="text-[10px] font-mono text-slate-500">{c.hex}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteOption('colorThemes', c.id)}
                    className="text-slate-500 hover:text-rose-400 text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* ADD OPTION MODAL */}
          {editingOptionType && (
            <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex justify-center items-start sm:items-center p-3 sm:p-6 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full my-auto space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-white">Add New {editingOptionType}</h3>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Label Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Bronze or Industrial"
                    value={newOptionForm.label}
                    onChange={(e) => setNewOptionForm({ ...newOptionForm, label: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Description</label>
                  <input
                    type="text"
                    placeholder="Short description"
                    value={newOptionForm.description}
                    onChange={(e) => setNewOptionForm({ ...newOptionForm, description: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>

                {editingOptionType === 'colorThemes' && (
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">Hex Color Code</label>
                    <input
                      type="color"
                      value={newOptionForm.hex}
                      onChange={(e) => setNewOptionForm({ ...newOptionForm, hex: e.target.value })}
                      className="w-full h-10 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer"
                    />
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setEditingOptionType(null)}
                    className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs font-bold text-slate-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleAddOption(editingOptionType)}
                    className="px-5 py-2 rounded-xl bg-amber-500 text-slate-950 text-xs font-bold"
                  >
                    Add Option
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 3: RECOMMENDATION RULES ================= */}
      {activeSubTab === 'rules' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold font-serif text-white">AI Recommendation Rules</h3>
              <p className="text-xs text-slate-400">Map catalog products directly to style & color combinations.</p>
            </div>
            <button
              onClick={handleOpenNewRule}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
            >
              <Plus className="w-4 h-4" /> Add Rule
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(designerConfig?.rules || []).map((rule) => {
              const assignedProduct = products.find((p) => p.id === rule.assignedProductId);
              return (
                <div key={rule.id} className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full bg-blue-950 text-blue-300 font-mono text-[10px] font-bold border border-blue-500/30 uppercase">
                      {rule.categoryName}
                    </span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEditRule(rule)} className="text-slate-400 hover:text-white text-xs">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDeleteRule(rule.id)} className="text-slate-400 hover:text-rose-400 text-xs">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h4 className="font-bold text-white text-sm">{rule.name}</h4>

                  {assignedProduct && (
                    <div className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <img src={assignedProduct.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                      <div>
                        <span className="font-bold text-white text-xs block">{assignedProduct.name}</span>
                        <span className="text-[10px] text-amber-400 font-mono">{assignedProduct.price || 'Catalog Item'}</span>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-slate-400 italic">"{rule.customNote || 'No custom note'}"</p>
                </div>
              );
            })}
          </div>

          {/* EDIT RULE MODAL */}
          {isRuleModalOpen && editingRule && (
            <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-md flex justify-center items-start sm:items-center p-3 sm:p-6 overflow-y-auto">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-lg w-full my-auto space-y-4 shadow-2xl max-h-[90vh] overflow-y-auto">
                <h3 className="text-lg font-bold text-white">Edit Recommendation Rule</h3>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Rule Name</label>
                  <input
                    type="text"
                    value={editingRule.name}
                    onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Target Category</label>
                  <select
                    value={editingRule.categoryName}
                    onChange={(e) => setEditingRule({ ...editingRule, categoryName: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  >
                    {DESIGNER_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Assigned Product from DB</label>
                  <select
                    value={editingRule.assignedProductId}
                    onChange={(e) => setEditingRule({ ...editingRule, assignedProductId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  >
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>{p.name} ({p.category})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">Custom Recommendation Note</label>
                  <textarea
                    rows={2}
                    value={editingRule.customNote}
                    onChange={(e) => setEditingRule({ ...editingRule, customNote: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button onClick={() => setIsRuleModalOpen(false)} className="px-4 py-2 bg-slate-950 text-slate-400 text-xs font-bold rounded-xl">Cancel</button>
                  <button onClick={handleSaveRule} className="px-5 py-2 bg-amber-500 text-slate-950 text-xs font-bold rounded-xl">Save Rule</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ================= TAB 4: PRODUCT TAGGING & PINNING ================= */}
      {activeSubTab === 'products' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-base font-bold font-serif text-white">Product Tagging & Pinning Matrix</h3>
              <p className="text-xs text-slate-400">Pin featured products to top or hide items from the AI Interior Designer.</p>
            </div>

            <input
              type="text"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs w-full sm:w-64 outline-none focus:border-amber-400"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {(products || [])
              .filter((p) => p && (p.name || '').toLowerCase().includes((productSearch || '').toLowerCase()))
              .map((p) => {
                const tag = designerConfig.productTags?.[p.id] || {};
                return (
                  <div key={p.id} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <img src={p.image} alt="" className="w-12 h-12 rounded-xl object-cover shrink-0" />
                      <div>
                        <h4 className="font-bold text-white text-xs line-clamp-1">{p.name}</h4>
                        <span className="text-[10px] text-slate-400 font-mono block">{p.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => handleToggleProductPin(p.id)}
                        title="Pin as Featured in AI Designer"
                        className={`p-2 rounded-xl transition-all ${
                          tag.pinned ? 'bg-amber-500 text-slate-950 shadow-md' : 'bg-slate-900 text-slate-500 hover:text-white'
                        }`}
                      >
                        <Pin className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleProductHidden(p.id)}
                        title="Hide from AI Designer"
                        className={`p-2 rounded-xl transition-all ${
                          tag.hidden ? 'bg-rose-950 text-rose-300 border border-rose-500/40' : 'bg-slate-900 text-slate-500 hover:text-white'
                        }`}
                      >
                        {tag.hidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

    </div>
  );
};

// Backwards compatibility alias
export const AdminPlannerManager = AdminDesignerManager;
