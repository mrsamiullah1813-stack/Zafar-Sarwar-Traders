import React, { useState } from 'react';
import { 
  Wrench, 
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
  Building2,
  Edit2,
  Search,
  Copy,
  ChevronRight,
  Eye,
  SlidersHorizontal,
  ShowerHead,
  Droplets,
  Zap,
  Boxes,
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';
import { 
  FittingBuilderConfig, 
  FittingPackageType, 
  FittingCategory, 
  FittingItem, 
  FittingItemVariant,
  Product 
} from '../types';
import { defaultFittingBuilderConfig } from '../data/defaultFittingBuilderData';

interface AdminConstructionBuilderManagerProps {
  config: FittingBuilderConfig;
  onSaveConfig: (updated: FittingBuilderConfig) => Promise<{ success: boolean; error?: string }> | void;
  products?: Product[];
}

export const AdminConstructionBuilderManager: React.FC<AdminConstructionBuilderManagerProps> = ({
  config,
  onSaveConfig,
  products = []
}) => {
  const [formState, setFormState] = useState<FittingBuilderConfig>({
    ...defaultFittingBuilderConfig,
    ...config
  });

  const [activeTab, setActiveTab] = useState<'packages' | 'categories' | 'items' | 'pipes' | 'settings'>('packages');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Edit states
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  // Filters for Item manager
  const [itemCategoryFilter, setItemCategoryFilter] = useState<string>('all');
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleEnable = () => {
    setFormState(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
  };

  const handleResetToDefaults = () => {
    if (window.confirm('Reset all Construction & Fitting Builder data back to defaults?')) {
      setFormState({ ...defaultFittingBuilderConfig });
      showToast('Reset to default construction builder configuration');
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const res = await onSaveConfig(formState);
      if (res && res.success === false) {
        setErrorMessage(res.error || 'Failed to save changes to Supabase.');
      } else {
        showToast('Construction & Fitting Builder settings saved to Supabase!');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'Error occurred while saving to database.');
    } finally {
      setIsSaving(false);
    }
  };

  // ----------------------------------------------------
  // PACKAGE TYPE CRUD
  // ----------------------------------------------------
  const handleAddPackage = () => {
    const newPkg: FittingPackageType = {
      id: `pkg-${Date.now()}`,
      name: 'New Custom Package',
      urduName: 'نیا پلمبنگ پیکج',
      description: 'Package description for custom plumbing or construction materials.',
      iconName: 'Wrench',
      badge: 'Custom',
      enabled: true,
      sortOrder: (formState.packageTypes?.length || 0) + 1,
      recommendedCategoryIds: []
    };

    setFormState(prev => ({
      ...prev,
      packageTypes: [...(prev.packageTypes || []), newPkg]
    }));
    setEditingPackageId(newPkg.id);
    showToast('New project package added');
  };

  const handleDeletePackage = (id: string) => {
    if (window.confirm('Are you sure you want to delete this package template?')) {
      setFormState(prev => ({
        ...prev,
        packageTypes: prev.packageTypes.filter(p => p.id !== id)
      }));
      if (editingPackageId === id) setEditingPackageId(null);
      showToast('Package deleted');
    }
  };

  // ----------------------------------------------------
  // CATEGORY CRUD
  // ----------------------------------------------------
  const handleAddCategory = () => {
    const newCat: FittingCategory = {
      id: `cat-${Date.now()}`,
      name: 'New Category',
      urduName: 'نئی کیٹیگری',
      description: 'Category description',
      iconName: 'Package',
      enabled: true,
      sortOrder: (formState.categories?.length || 0) + 1
    };

    setFormState(prev => ({
      ...prev,
      categories: [...(prev.categories || []), newCat]
    }));
    setEditingCategoryId(newCat.id);
    showToast('New fitting category added');
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Delete this category? Items under this category will remain in the catalog.')) {
      setFormState(prev => ({
        ...prev,
        categories: prev.categories.filter(c => c.id !== id)
      }));
      if (editingCategoryId === id) setEditingCategoryId(null);
      showToast('Category deleted');
    }
  };

  // ----------------------------------------------------
  // ITEM CRUD
  // ----------------------------------------------------
  const handleAddItem = () => {
    const targetCatId = formState.categories?.[0]?.id || 'cat-pipes';
    const newItem: FittingItem = {
      id: `item-${Date.now()}`,
      categoryId: targetCatId,
      name: 'New Fitting Item',
      urduName: 'نیا آئٹم',
      description: 'High-quality fitting product for sanitary and water line installations.',
      unit: 'Piece',
      enabled: true,
      sortOrder: (formState.items?.length || 0) + 1,
      defaultSizeType: 'INCH',
      variants: [
        {
          id: `var-${Date.now()}-1`,
          itemId: `item-${Date.now()}`,
          sizeType: 'INCH',
          sizeLabel: '½"',
          price: 150,
          isPriceOnCall: false,
          unit: 'Piece',
          enabled: true,
          sortOrder: 1,
          stockStatus: 'In Stock'
        },
        {
          id: `var-${Date.now()}-2`,
          itemId: `item-${Date.now()}`,
          sizeType: 'INCH',
          sizeLabel: '¾"',
          price: 220,
          isPriceOnCall: false,
          unit: 'Piece',
          enabled: true,
          sortOrder: 2,
          stockStatus: 'In Stock'
        },
        {
          id: `var-${Date.now()}-3`,
          itemId: `item-${Date.now()}`,
          sizeType: 'INCH',
          sizeLabel: '1"',
          price: 350,
          isPriceOnCall: false,
          unit: 'Piece',
          enabled: true,
          sortOrder: 3,
          stockStatus: 'In Stock'
        }
      ]
    };

    setFormState(prev => ({
      ...prev,
      items: [newItem, ...(prev.items || [])]
    }));
    setEditingItemId(newItem.id);
    showToast('New fitting item added');
  };

  const handleDuplicateItem = (item: FittingItem) => {
    const duplicated: FittingItem = {
      ...item,
      id: `item-${Date.now()}`,
      name: `${item.name} (Copy)`,
      variants: (item.variants || []).map((v, idx) => ({
        ...v,
        id: `var-${Date.now()}-${idx}`
      }))
    };

    setFormState(prev => ({
      ...prev,
      items: [duplicated, ...prev.items]
    }));
    setEditingItemId(duplicated.id);
    showToast('Item duplicated successfully');
  };

  const handleDeleteItem = (id: string) => {
    if (window.confirm('Are you sure you want to delete this fitting item and its size variants?')) {
      setFormState(prev => ({
        ...prev,
        items: prev.items.filter(i => i.id !== id)
      }));
      if (editingItemId === id) setEditingItemId(null);
      showToast('Item removed');
    }
  };

  // ----------------------------------------------------
  // VARIANT / SIZE CRUD FOR ACTIVE ITEM
  // ----------------------------------------------------
  const handleAddVariantToItem = (itemId: string) => {
    setFormState(prev => {
      return {
        ...prev,
        items: prev.items.map(item => {
          if (item.id === itemId) {
            const newVar: FittingItemVariant = {
              id: `var-${Date.now()}`,
              itemId,
              sizeType: item.defaultSizeType || 'INCH',
              sizeLabel: '2"',
              price: 450,
              isPriceOnCall: false,
              unit: item.unit || 'Piece',
              enabled: true,
              sortOrder: (item.variants?.length || 0) + 1,
              stockStatus: 'In Stock'
            };
            return {
              ...item,
              variants: [...(item.variants || []), newVar]
            };
          }
          return item;
        })
      };
    });
    showToast('Size variant added');
  };

  const handleBulkGenerateVariants = (itemId: string, presetType: 'INCH_STANDARD' | 'MM_STANDARD' | 'PIPE_LENGTHS') => {
    setFormState(prev => {
      return {
        ...prev,
        items: prev.items.map(item => {
          if (item.id === itemId) {
            let generated: FittingItemVariant[] = [];
            if (presetType === 'INCH_STANDARD') {
              const sizes = ['½"', '¾"', '1"', '1¼"', '1½"', '2"', '3"', '4"'];
              generated = sizes.map((s, idx) => ({
                id: `var-${Date.now()}-${idx}`,
                itemId,
                sizeType: 'INCH',
                sizeLabel: s,
                price: (idx + 1) * 120,
                isPriceOnCall: false,
                unit: item.unit || 'Piece',
                enabled: true,
                sortOrder: idx + 1,
                stockStatus: 'In Stock'
              }));
            } else if (presetType === 'MM_STANDARD') {
              const sizes = ['20mm', '25mm', '32mm', '40mm', '50mm', '63mm', '75mm', '110mm'];
              generated = sizes.map((s, idx) => ({
                id: `var-${Date.now()}-${idx}`,
                itemId,
                sizeType: 'MM',
                sizeLabel: s,
                price: (idx + 1) * 150,
                isPriceOnCall: false,
                unit: item.unit || 'Piece',
                enabled: true,
                sortOrder: idx + 1,
                stockStatus: 'In Stock'
              }));
            } else if (presetType === 'PIPE_LENGTHS') {
              const lengths = ['10 ft Length', '13 ft Length', '20 ft Length', '50m Coil', '100m Coil'];
              generated = lengths.map((s, idx) => ({
                id: `var-${Date.now()}-${idx}`,
                itemId,
                sizeType: 'OTHER',
                sizeLabel: s,
                price: (idx + 1) * 850,
                isPriceOnCall: false,
                unit: s.includes('Coil') ? 'Coil' : 'Length',
                enabled: true,
                sortOrder: idx + 1,
                stockStatus: 'In Stock'
              }));
            }

            return {
              ...item,
              variants: [...(item.variants || []), ...generated]
            };
          }
          return item;
        })
      };
    });
    showToast(`Standard ${presetType} sizes generated!`);
  };

  const handleDeleteVariant = (itemId: string, variantId: string) => {
    setFormState(prev => {
      return {
        ...prev,
        items: prev.items.map(item => {
          if (item.id === itemId) {
            return {
              ...item,
              variants: item.variants.filter(v => v.id !== variantId)
            };
          }
          return item;
        })
      };
    });
    showToast('Variant removed');
  };

  // Filtered items for display
  const displayItems = formState.items.filter(item => {
    if (itemCategoryFilter !== 'all' && item.categoryId !== itemCategoryFilter) return false;
    if (itemSearchQuery.trim()) {
      const q = itemSearchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchUrdu = item.urduName?.toLowerCase().includes(q);
      const matchBrand = item.brand?.toLowerCase().includes(q);
      const matchMat = item.material?.toLowerCase().includes(q);
      return matchName || matchUrdu || matchBrand || matchMat;
    }
    return true;
  });

  const editingItem = formState.items.find(i => i.id === editingItemId) || null;
  const editingPackage = formState.packageTypes?.find(p => p.id === editingPackageId) || null;
  const editingCategory = formState.categories?.find(c => c.id === editingCategoryId) || null;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* 1. TOP HEADER & MAIN CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
            <Wrench className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                Smart Construction & Fitting Builder
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                formState.isEnabled
                  ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                  : 'bg-rose-950/80 border border-rose-500/40 text-rose-300'
              }`}>
                {formState.isEnabled ? 'Active in Store' : 'Disabled'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-light">
              Manage custom package templates, sanitary categories, fittings catalog, sizes and pricing.
            </p>
          </div>
        </div>

        {/* Global Save & Reset Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={handleToggleEnable}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all ${
              formState.isEnabled
                ? 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 hover:bg-slate-700 text-rose-400 border border-rose-500/30'
            }`}
          >
            {formState.isEnabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
            <span>{formState.isEnabled ? 'Feature: Enabled' : 'Feature: Disabled'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Reset to factory defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Defaults</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleSave()}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving to Supabase...' : 'Save All Changes'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {toastMessage && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs font-bold flex items-center gap-2 animate-fadeIn shadow-lg">
          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800">
        <button
          onClick={() => { setActiveTab('packages'); setEditingPackageId(null); }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'packages'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Project Packages ({formState.packageTypes?.length || 0})</span>
        </button>

        <button
          onClick={() => { setActiveTab('categories'); setEditingCategoryId(null); }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'categories'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Fitting Categories ({formState.categories?.length || 0})</span>
        </button>

        <button
          onClick={() => { setActiveTab('items'); setEditingItemId(null); }}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'items'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Items & Size Manager ({formState.items?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('pipes')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'pipes'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Dedicated Pipe Manager</span>
        </button>

        <button
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'settings'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-950'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Builder Settings & WhatsApp</span>
        </button>
      </div>

      {/* 3. TAB 1: PROJECT PACKAGES */}
      {activeTab === 'packages' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Project Package Templates</h3>
              <p className="text-xs text-slate-400">Templates that appear in Step 1 of the customer builder.</p>
            </div>
            <button
              type="button"
              onClick={handleAddPackage}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Package Type</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(formState.packageTypes || []).map((pkg) => {
              const isEditing = editingPackageId === pkg.id;

              return (
                <div
                  key={pkg.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isEditing ? 'bg-slate-900 border-blue-500 ring-2 ring-blue-500/30' : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-blue-600/20 text-blue-400 font-bold">
                        <Building2 className="w-4 h-4" />
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white leading-tight">{pkg.name}</h4>
                        {pkg.urduName && (
                          <span className="text-xs text-slate-400 font-serif font-medium" dir="rtl">{pkg.urduName}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingPackageId(isEditing ? null : pkg.id)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                          isEditing ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePackage(pkg.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-slate-400 font-light line-clamp-2 mb-3">
                    {pkg.description}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-3 border-t border-slate-800 text-slate-400">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-slate-800 text-blue-300">
                      {pkg.badge || 'Standard'}
                    </span>
                    <span className={`text-[10px] font-bold ${pkg.enabled !== false ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {pkg.enabled !== false ? '● Active' : '○ Disabled'}
                    </span>
                  </div>

                  {/* Inline Edit Form */}
                  {isEditing && (
                    <div className="mt-4 pt-4 border-t border-slate-800 space-y-3 animate-fadeIn">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Package Name (English)</label>
                        <input
                          type="text"
                          value={pkg.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormState(prev => ({
                              ...prev,
                              packageTypes: prev.packageTypes.map(p => p.id === pkg.id ? { ...p, name: val } : p)
                            }));
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Urdu Name (اردو نام)</label>
                        <input
                          type="text"
                          dir="rtl"
                          value={pkg.urduName || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormState(prev => ({
                              ...prev,
                              packageTypes: prev.packageTypes.map(p => p.id === pkg.id ? { ...p, urduName: val } : p)
                            }));
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Description / Subtitle</label>
                        <textarea
                          rows={2}
                          value={pkg.description}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormState(prev => ({
                              ...prev,
                              packageTypes: prev.packageTypes.map(p => p.id === pkg.id ? { ...p, description: val } : p)
                            }));
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-white"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">Badge Tag</label>
                          <input
                            type="text"
                            value={pkg.badge || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormState(prev => ({
                                ...prev,
                                packageTypes: prev.packageTypes.map(p => p.id === pkg.id ? { ...p, badge: val } : p)
                              }));
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-white"
                          />
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">Status</label>
                          <button
                            type="button"
                            onClick={() => {
                              setFormState(prev => ({
                                ...prev,
                                packageTypes: prev.packageTypes.map(p => p.id === pkg.id ? { ...p, enabled: !p.enabled } : p)
                              }));
                            }}
                            className={`w-full py-1.5 rounded-xl text-xs font-bold border transition-colors ${
                              pkg.enabled !== false ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' : 'bg-slate-950 border-slate-800 text-slate-500'
                            }`}
                          >
                            {pkg.enabled !== false ? 'Enabled' : 'Disabled'}
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingPackageId(null)}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-bold"
                        >
                          Done Editing
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. TAB 2: FITTING CATEGORIES */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fitting Categories</h3>
              <p className="text-xs text-slate-400">Categories used to filter and group plumbing items.</p>
            </div>
            <button
              type="button"
              onClick={handleAddCategory}
              className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(formState.categories || []).map((cat) => {
              const isEditing = editingCategoryId === cat.id;
              const itemCount = (formState.items || []).filter(i => i.categoryId === cat.id).length;

              return (
                <div
                  key={cat.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isEditing ? 'bg-slate-900 border-blue-500 ring-2 ring-blue-500/30' : 'bg-slate-900/70 border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h4 className="text-sm font-bold text-white leading-tight">{cat.name}</h4>
                      {cat.urduName && (
                        <p className="text-xs text-slate-400 font-serif font-medium" dir="rtl">{cat.urduName}</p>
                      )}
                      <span className="text-[10px] text-blue-400 font-mono mt-0.5 block">{itemCount} items linked</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setEditingCategoryId(isEditing ? null : cat.id)}
                        className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                          isEditing ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isEditing && (
                    <div className="mt-3 pt-3 border-t border-slate-800 space-y-2.5 animate-fadeIn">
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Category Name</label>
                        <input
                          type="text"
                          value={cat.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormState(prev => ({
                              ...prev,
                              categories: prev.categories.map(c => c.id === cat.id ? { ...c, name: val } : c)
                            }));
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-bold text-slate-400 block mb-1">Urdu Name (اردو نام)</label>
                        <input
                          type="text"
                          dir="rtl"
                          value={cat.urduName || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setFormState(prev => ({
                              ...prev,
                              categories: prev.categories.map(c => c.id === cat.id ? { ...c, urduName: val } : c)
                            }));
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => setEditingCategoryId(null)}
                          className="px-3 py-1 rounded-lg bg-blue-600 text-white text-xs font-bold"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. TAB 3: ITEMS & SIZE VARIANT MANAGER */}
      {activeTab === 'items' && (
        <div className="space-y-6">
          
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Fittings & Sizes Catalog</h3>
              <p className="text-xs text-slate-400">Add products, configure MM & INCH size variants, and set live rates.</p>
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search items by name, material, brand..."
                value={itemSearchQuery}
                onChange={(e) => setItemSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <label className="text-xs text-slate-400 font-bold shrink-0">Category:</label>
              <select
                value={itemCategoryFilter}
                onChange={(e) => setItemCategoryFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none w-full sm:w-48"
              >
                <option value="all">All Categories ({formState.items?.length || 0})</option>
                {formState.categories?.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Items List */}
          <div className="space-y-4">
            {displayItems.map((item) => {
              const isEditing = editingItemId === item.id;
              const itemCat = formState.categories?.find(c => c.id === item.categoryId);

              return (
                <div
                  key={item.id}
                  className={`p-5 rounded-2xl border transition-all ${
                    isEditing ? 'bg-slate-900 border-blue-500 shadow-xl' : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Item Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-[10px] font-bold">
                          {itemCat?.name || 'Category'}
                        </span>
                        {item.material && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                            {item.material}
                          </span>
                        )}
                        {item.brand && (
                          <span className="px-2 py-0.5 rounded bg-amber-950/80 text-amber-300 text-[10px]">
                            {item.brand}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-white leading-tight">{item.name}</h4>
                      {item.urduName && (
                        <p className="text-xs text-slate-400 font-serif" dir="rtl">{item.urduName}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDuplicateItem(item)}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1"
                        title="Duplicate this item"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Duplicate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setEditingItemId(isEditing ? null : item.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                          isEditing ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                        }`}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Close Edit' : 'Edit Sizes & Rates'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Summary of Size Variants */}
                  <div className="pt-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-400">
                        Configured Sizes ({item.variants?.length || 0} variants):
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {(item.variants || []).map(v => (
                        <div
                          key={v.id}
                          className="px-2.5 py-1 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center gap-2"
                        >
                          <span className="font-bold text-white">{v.sizeLabel}</span>
                          <span className="text-[10px] text-slate-500">({v.sizeType})</span>
                          <span className="font-mono text-emerald-400 font-bold text-[11px]">
                            {v.price !== null && v.price !== undefined && !v.isPriceOnCall ? `Rs. ${Number(v.price).toLocaleString()}` : 'Call'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* FULL EXPANDED EDITING FORM */}
                  {isEditing && (
                    <div className="mt-5 pt-5 border-t border-slate-800 space-y-5 animate-fadeIn">
                      
                      {/* Base Info Fields */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">Item Title</label>
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormState(prev => ({
                                ...prev,
                                items: prev.items.map(i => i.id === item.id ? { ...i, name: val } : i)
                              }));
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">Urdu Name</label>
                          <input
                            type="text"
                            dir="rtl"
                            value={item.urduName || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormState(prev => ({
                                ...prev,
                                items: prev.items.map(i => i.id === item.id ? { ...i, urduName: val } : i)
                              }));
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">Category</label>
                          <select
                            value={item.categoryId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormState(prev => ({
                                ...prev,
                                items: prev.items.map(i => i.id === item.id ? { ...i, categoryId: val } : i)
                              }));
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                          >
                            {formState.categories?.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">Material (e.g. UPVC, PPR, Brass, CI)</label>
                          <input
                            type="text"
                            value={item.material || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormState(prev => ({
                                ...prev,
                                items: prev.items.map(i => i.id === item.id ? { ...i, material: val } : i)
                              }));
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">Brand (e.g. Master, Popular, Sonex)</label>
                          <input
                            type="text"
                            value={item.brand || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormState(prev => ({
                                ...prev,
                                items: prev.items.map(i => i.id === item.id ? { ...i, brand: val } : i)
                              }));
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-400 block mb-1">Default Unit</label>
                          <input
                            type="text"
                            value={item.unit || 'Piece'}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFormState(prev => ({
                                ...prev,
                                items: prev.items.map(i => i.id === item.id ? { ...i, unit: val } : i)
                              }));
                            }}
                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* SIZE VARIANTS TABLE & BULK GENERATORS */}
                      <div className="space-y-3 pt-3 border-t border-slate-800">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <h5 className="text-xs font-bold text-white uppercase tracking-wider">
                              Size Variants & Pricing Table
                            </h5>
                            <span className="text-[10px] text-slate-400">Configure size label, rate, and price-on-call status for each variant.</span>
                          </div>

                          {/* Quick Bulk Presets */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleBulkGenerateVariants(item.id, 'INCH_STANDARD')}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-blue-300 text-[10px] font-bold"
                            >
                              + Standard Inches (½"-4")
                            </button>
                            <button
                              type="button"
                              onClick={() => handleBulkGenerateVariants(item.id, 'MM_STANDARD')}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[10px] font-bold"
                            >
                              + Standard MM (20-110mm)
                            </button>
                            <button
                              type="button"
                              onClick={() => handleAddVariantToItem(item.id)}
                              className="px-2.5 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-bold flex items-center gap-1"
                            >
                              <Plus className="w-3 h-3" />
                              <span>Add Row</span>
                            </button>
                          </div>
                        </div>

                        {/* Variants Table */}
                        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-900 text-slate-400 font-bold uppercase text-[10px]">
                              <tr>
                                <th className="p-2.5">Size Label</th>
                                <th className="p-2.5">Type</th>
                                <th className="p-2.5">Unit Rate (PKR)</th>
                                <th className="p-2.5">On Call</th>
                                <th className="p-2.5">Unit</th>
                                <th className="p-2.5">Material / Spec</th>
                                <th className="p-2.5 text-right">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/80">
                              {(item.variants || []).map((variant) => (
                                <tr key={variant.id} className="hover:bg-slate-900/40">
                                  
                                  {/* Size Label */}
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={variant.sizeLabel}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setFormState(prev => ({
                                          ...prev,
                                          items: prev.items.map(i => i.id === item.id ? {
                                            ...i,
                                            variants: i.variants.map(v => v.id === variant.id ? { ...v, sizeLabel: val } : v)
                                          } : i)
                                        }));
                                      }}
                                      className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-white font-bold"
                                    />
                                  </td>

                                  {/* Size Type */}
                                  <td className="p-2">
                                    <select
                                      value={variant.sizeType}
                                      onChange={(e) => {
                                        const val = e.target.value as 'INCH' | 'MM' | 'OTHER';
                                        setFormState(prev => ({
                                          ...prev,
                                          items: prev.items.map(i => i.id === item.id ? {
                                            ...i,
                                            variants: i.variants.map(v => v.id === variant.id ? { ...v, sizeType: val } : v)
                                          } : i)
                                        }));
                                      }}
                                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300"
                                    >
                                      <option value="INCH">INCH</option>
                                      <option value="MM">MM</option>
                                      <option value="OTHER">OTHER</option>
                                    </select>
                                  </td>

                                  {/* Price */}
                                  <td className="p-2">
                                    <input
                                      type="number"
                                      disabled={variant.isPriceOnCall}
                                      value={variant.price !== null && variant.price !== undefined ? variant.price : ''}
                                      onChange={(e) => {
                                        const val = e.target.value === '' ? null : Number(e.target.value);
                                        setFormState(prev => ({
                                          ...prev,
                                          items: prev.items.map(i => i.id === item.id ? {
                                            ...i,
                                            variants: i.variants.map(v => v.id === variant.id ? { ...v, price: val } : v)
                                          } : i)
                                        }));
                                      }}
                                      placeholder="0"
                                      className="w-28 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-emerald-400 font-mono font-bold"
                                    />
                                  </td>

                                  {/* Price on Call Checkbox */}
                                  <td className="p-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(variant.isPriceOnCall || variant.price === null)}
                                      onChange={(e) => {
                                        const checked = e.target.checked;
                                        setFormState(prev => ({
                                          ...prev,
                                          items: prev.items.map(i => i.id === item.id ? {
                                            ...i,
                                            variants: i.variants.map(v => v.id === variant.id ? { 
                                              ...v, 
                                              isPriceOnCall: checked, 
                                              price: checked ? null : (v.price || 100) 
                                            } : v)
                                          } : i)
                                        }));
                                      }}
                                      className="rounded bg-slate-900 border-slate-800 text-blue-600 focus:ring-0"
                                    />
                                  </td>

                                  {/* Unit */}
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={variant.unit || item.unit || 'Piece'}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setFormState(prev => ({
                                          ...prev,
                                          items: prev.items.map(i => i.id === item.id ? {
                                            ...i,
                                            variants: i.variants.map(v => v.id === variant.id ? { ...v, unit: val } : v)
                                          } : i)
                                        }));
                                      }}
                                      className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300"
                                    />
                                  </td>

                                  {/* Material / Grade / Brand Override */}
                                  <td className="p-2">
                                    <input
                                      type="text"
                                      value={variant.material || ''}
                                      placeholder={item.material || 'Material'}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setFormState(prev => ({
                                          ...prev,
                                          items: prev.items.map(i => i.id === item.id ? {
                                            ...i,
                                            variants: i.variants.map(v => v.id === variant.id ? { ...v, material: val } : v)
                                          } : i)
                                        }));
                                      }}
                                      className="w-24 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-300"
                                    />
                                  </td>

                                  {/* Delete Variant */}
                                  <td className="p-2 text-right">
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteVariant(item.id, variant.id)}
                                      className="p-1 rounded bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-400 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </td>

                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Done Button */}
                      <div className="flex justify-end pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingItemId(null)}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                        >
                          Finish Editing Item
                        </button>
                      </div>

                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* 6. TAB 4: DEDICATED PIPE MANAGER */}
      {activeTab === 'pipes' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-cyan-600/20 text-cyan-400">
                <Wrench className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Dedicated Pipe Types & Standards</h3>
                <p className="text-xs text-slate-400">
                  Global pipe material classifications supported in Zafar Sarwar Traders building packages.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {['UPVC (Sanitary & Drain)', 'PPR-C (Hot & Cold Supply)', 'PVC (Conduit & Waste)', 'CPVC (High Heat)', 'HDPE (High Pressure Rolls)', 'GI (Galvanized Iron)', 'CI (Cast Iron Soil Pipes)'].map(pipeType => (
                <div key={pipeType} className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">{pipeType}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-500/30 text-xs text-blue-200 space-y-2">
              <h4 className="font-bold flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400" />
                <span>Pipe Sizing Guidelines:</span>
              </h4>
              <ul className="list-disc list-inside space-y-1 text-slate-300 text-[11px]">
                <li>UPVC Drainage Pipes are typically supplied in <strong>10 ft</strong> or <strong>13 ft</strong> lengths.</li>
                <li>PPR-C Supply Pipes are standard <strong>4-meter (13.1 ft)</strong> lengths in PN 16 / PN 20 pressure ratings.</li>
                <li>Pipes with variable brand/market rates can have <strong>"Rate on Call"</strong> enabled so customers confirm latest quotation before dispatch.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 5: BUILDER SETTINGS & WHATSAPP */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">General Configuration</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">Builder Modal Title</label>
                <input
                  type="text"
                  value={formState.title || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">Hero Badge</label>
                <input
                  type="text"
                  value={formState.heroBadge || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, heroBadge: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-400 block mb-1.5">Subtitle / Help Text</label>
              <textarea
                rows={2}
                value={formState.subtitle || ''}
                onChange={(e) => setFormState(prev => ({ ...prev, subtitle: e.target.value }))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800">
              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">WhatsApp Order Number</label>
                <input
                  type="text"
                  value={formState.whatsappNumber || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, whatsappNumber: e.target.value }))}
                  placeholder="+923108002863"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-400 block mb-1.5">WhatsApp Disclaimer Note</label>
                <input
                  type="text"
                  value={formState.whatsappDisclaimerNote || ''}
                  onChange={(e) => setFormState(prev => ({ ...prev, whatsappDisclaimerNote: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
