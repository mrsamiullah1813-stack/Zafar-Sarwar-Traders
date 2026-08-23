import React, { useState } from 'react';
import { 
  Wrench, 
  Save, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Search, 
  Building2, 
  Layers, 
  DollarSign, 
  CheckCircle2, 
  RefreshCw, 
  AlertCircle, 
  Sparkles,
  Sliders,
  ChevronDown,
  ChevronUp,
  PackageCheck,
  Eye,
  Zap,
  Tag
} from 'lucide-react';
import { 
  FittingBuilderConfig, 
  FittingCategory, 
  FittingItem, 
  FittingItemVariant, 
  FittingPackageType, 
  Product 
} from '../types';
import { defaultFittingBuilderConfig } from '../data/defaultFittingBuilderData';

interface AdminFittingBuilderManagerProps {
  config?: FittingBuilderConfig;
  products?: Product[];
  onSaveConfig: (updated: FittingBuilderConfig) => void;
}

export const AdminFittingBuilderManager: React.FC<AdminFittingBuilderManagerProps> = ({
  config = defaultFittingBuilderConfig,
  products = [],
  onSaveConfig
}) => {
  const [currentConfig, setCurrentConfig] = useState<FittingBuilderConfig>(() => ({
    ...defaultFittingBuilderConfig,
    ...config
  }));

  const [activeSubTab, setActiveSubTab] = useState<'general' | 'packages' | 'categories' | 'items' | 'quick_prices'>('items');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Search and Filter inside Admin Items
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');
  const [filterCatId, setFilterCatId] = useState<string>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);

  // Edit / Add Item Modal State
  const [isItemModalOpen, setIsItemModalOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<FittingItem | null>(null);

  // Edit / Add Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState<boolean>(false);
  const [editingCategory, setEditingCategory] = useState<FittingCategory | null>(null);

  // Edit / Add Package Type Modal State
  const [isPackageTypeModalOpen, setIsPackageTypeModalOpen] = useState<boolean>(false);
  const [editingPackageType, setEditingPackageType] = useState<FittingPackageType | null>(null);

  // Save changes handler
  const handleSaveAll = () => {
    onSaveConfig(currentConfig);
    setSuccessMsg('Smart Construction & Fitting Builder settings saved permanently in Supabase!');
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // ----------------------------------------------------------------
  // ITEM MANAGEMENT HANDLERS
  // ----------------------------------------------------------------
  const handleOpenAddItem = () => {
    const newItem: FittingItem = {
      id: `item-${Date.now()}`,
      categoryId: currentConfig.categories[0]?.id || 'cat-cpvc-fittings',
      name: '',
      urduName: '',
      description: '',
      brand: 'Master',
      material: 'CPVC',
      unit: 'Piece',
      enabled: true,
      sortOrder: currentConfig.items.length + 1,
      variants: [
        {
          id: `var-${Date.now()}-1`,
          itemId: `item-${Date.now()}`,
          sizeType: 'INCH',
          sizeLabel: '1/2"',
          price: 250,
          unit: 'Piece',
          material: 'CPVC',
          brand: 'Master',
          enabled: true,
          sortOrder: 1
        },
        {
          id: `var-${Date.now()}-2`,
          itemId: `item-${Date.now()}`,
          sizeType: 'INCH',
          sizeLabel: '3/4"',
          price: 380,
          unit: 'Piece',
          material: 'CPVC',
          brand: 'Master',
          enabled: true,
          sortOrder: 2
        }
      ]
    };
    setEditingItem(newItem);
    setIsItemModalOpen(true);
  };

  const handleOpenEditItem = (item: FittingItem) => {
    setEditingItem(JSON.parse(JSON.stringify(item)));
    setIsItemModalOpen(true);
  };

  const handleSaveItemModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name.trim()) return;

    const existingIndex = currentConfig.items.findIndex(i => i.id === editingItem.id);
    let updatedItems = [...currentConfig.items];

    if (existingIndex >= 0) {
      updatedItems[existingIndex] = editingItem;
    } else {
      updatedItems.push(editingItem);
    }

    const updatedConfig = {
      ...currentConfig,
      items: updatedItems
    };

    setCurrentConfig(updatedConfig);
    setIsItemModalOpen(false);
    setEditingItem(null);
    onSaveConfig(updatedConfig);
  };

  const handleDeleteItem = (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this construction fitting item?')) {
      const updatedConfig = {
        ...currentConfig,
        items: currentConfig.items.filter(i => i.id !== itemId)
      };
      setCurrentConfig(updatedConfig);
      onSaveConfig(updatedConfig);
    }
  };

  const handleToggleItemEnabled = (itemId: string) => {
    const updatedConfig = {
      ...currentConfig,
      items: currentConfig.items.map(i => {
        if (i.id === itemId) return { ...i, enabled: !i.enabled };
        return i;
      })
    };
    setCurrentConfig(updatedConfig);
    onSaveConfig(updatedConfig);
  };

  // Quick Price updater handler
  const handleUpdateVariantPrice = (itemId: string, variantId: string, newPrice: number | null) => {
    const updatedConfig = {
      ...currentConfig,
      items: currentConfig.items.map(item => {
        if (item.id === itemId) {
          return {
            ...item,
            variants: item.variants.map(v => {
              if (v.id === variantId) {
                return {
                  ...v,
                  price: newPrice,
                  isPriceOnCall: newPrice === null
                };
              }
              return v;
            })
          };
        }
        return item;
      })
    };
    setCurrentConfig(updatedConfig);
  };

  // ----------------------------------------------------------------
  // CATEGORY MANAGEMENT HANDLERS
  // ----------------------------------------------------------------
  const handleOpenAddCategory = () => {
    const newCat: FittingCategory = {
      id: `cat-${Date.now()}`,
      name: '',
      urduName: '',
      description: '',
      iconName: 'Wrench',
      enabled: true,
      sortOrder: currentConfig.categories.length + 1
    };
    setEditingCategory(newCat);
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategoryModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editingCategory.name.trim()) return;

    const existingIndex = currentConfig.categories.findIndex(c => c.id === editingCategory.id);
    let updatedCategories = [...currentConfig.categories];

    if (existingIndex >= 0) {
      updatedCategories[existingIndex] = editingCategory;
    } else {
      updatedCategories.push(editingCategory);
    }

    const updatedConfig = {
      ...currentConfig,
      categories: updatedCategories
    };

    setCurrentConfig(updatedConfig);
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
    onSaveConfig(updatedConfig);
  };

  const handleDeleteCategory = (catId: string) => {
    if (window.confirm('Delete this category? Items in this category will still be preserved.')) {
      const updatedConfig = {
        ...currentConfig,
        categories: currentConfig.categories.filter(c => c.id !== catId)
      };
      setCurrentConfig(updatedConfig);
      onSaveConfig(updatedConfig);
    }
  };

  // ----------------------------------------------------------------
  // PACKAGE TYPE HANDLERS
  // ----------------------------------------------------------------
  const handleOpenAddPackageType = () => {
    const newPkg: FittingPackageType = {
      id: `pkg-${Date.now()}`,
      name: '',
      urduName: '',
      description: '',
      iconName: 'Building2',
      badge: 'Popular',
      enabled: true,
      sortOrder: currentConfig.packageTypes.length + 1
    };
    setEditingPackageType(newPkg);
    setIsPackageTypeModalOpen(true);
  };

  const handleSavePackageTypeModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackageType || !editingPackageType.name.trim()) return;

    const existingIndex = currentConfig.packageTypes.findIndex(p => p.id === editingPackageType.id);
    let updatedPkg = [...currentConfig.packageTypes];

    if (existingIndex >= 0) {
      updatedPkg[existingIndex] = editingPackageType;
    } else {
      updatedPkg.push(editingPackageType);
    }

    const updatedConfig = {
      ...currentConfig,
      packageTypes: updatedPkg
    };

    setCurrentConfig(updatedConfig);
    setIsPackageTypeModalOpen(false);
    setEditingPackageType(null);
    onSaveConfig(updatedConfig);
  };

  // Filter items in admin view
  const adminFilteredItems = currentConfig.items.filter(item => {
    if (filterCatId !== 'all' && item.categoryId !== filterCatId) return false;
    if (itemSearchQuery.trim()) {
      const q = itemSearchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchUrdu = (item.urduName || '').includes(q);
      const matchBrand = (item.brand || '').toLowerCase().includes(q);
      if (!matchName && !matchUrdu && !matchBrand) return false;
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fadeIn">
      
      {/* Top Banner */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Wrench className="w-3 h-3" />
              <span>Smart Construction & Fitting System</span>
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              currentConfig.isEnabled ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950 text-rose-300 border border-rose-500/40'
            }`}>
              {currentConfig.isEnabled ? 'LIVE ON STORE' : 'DISABLED'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold text-white font-serif">
            Smart Construction & Fitting Package Builder CMS
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 font-light mt-1 max-w-2xl">
            Manage pipe sizes, fittings, valves, water tanks, pumps, rates in PKR, and package preset configurations.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleSaveAll}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-blue-950"
          >
            <Save className="w-4 h-4" />
            <span>Save Changes to Supabase</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Sub-Tab Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar border-b border-slate-800">
        <button
          onClick={() => setActiveSubTab('items')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'items'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Wrench className="w-4 h-4" />
          <span>Fitting Products & Sizes ({currentConfig.items.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('quick_prices')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'quick_prices'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          <span>Quick Price Sheet</span>
        </button>

        <button
          onClick={() => setActiveSubTab('categories')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'categories'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Categories ({currentConfig.categories.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('packages')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'packages'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Project Types ({currentConfig.packageTypes.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('general')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
            activeSubTab === 'general'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>General Settings</span>
        </button>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* 1. FITTING PRODUCTS & SIZES TAB */}
      {/* ---------------------------------------------------------------- */}
      {activeSubTab === 'items' && (
        <div className="space-y-4">
          
          {/* Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <input
                  type="text"
                  placeholder="Search items, sizes, materials..."
                  value={itemSearchQuery}
                  onChange={(e) => setItemSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
              </div>

              <select
                value={filterCatId}
                onChange={(e) => setFilterCatId(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                {currentConfig.categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleOpenAddItem}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-950"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>
          </div>

          {/* Items Accordion List */}
          <div className="space-y-3">
            {adminFilteredItems.map(item => {
              const category = currentConfig.categories.find(c => c.id === item.categoryId);
              const isExpanded = expandedItemId === item.id;

              return (
                <div
                  key={item.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden transition-all"
                >
                  <div className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3.5 min-w-0">
                      {item.image ? (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-950 border border-slate-800 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-600 shrink-0">
                          <Wrench className="w-5 h-5" />
                        </div>
                      )}

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white truncate">{item.name}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.enabled ? 'bg-emerald-950 text-emerald-300' : 'bg-slate-800 text-slate-500'
                          }`}>
                            {item.enabled ? 'Active' : 'Hidden'}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                          <span className="text-blue-400 font-semibold">{category?.name || 'Unassigned'}</span>
                          <span>•</span>
                          <span>{item.material}</span>
                          <span>•</span>
                          <span>{item.brand}</span>
                          <span>•</span>
                          <span className="font-mono text-slate-300 font-bold">{item.variants.length} Sizes</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleItemEnabled(item.id)}
                        className={`p-2 rounded-xl text-xs font-semibold border ${
                          item.enabled 
                            ? 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white' 
                            : 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                        }`}
                        title={item.enabled ? 'Disable Item' : 'Enable Item'}
                      >
                        {item.enabled ? 'Disable' : 'Enable'}
                      </button>

                      <button
                        onClick={() => handleOpenEditItem(item)}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-blue-400 border border-slate-800 transition-colors"
                        title="Edit Item"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950 text-rose-400 border border-slate-800 transition-colors"
                        title="Delete Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800"
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Variants List */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-950/80 border-t border-slate-800/80 space-y-2">
                      <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                        Configured Size Variants & Rates (PKR):
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                        {item.variants.map(v => (
                          <div
                            key={v.id}
                            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                          >
                            <div>
                              <div className="text-xs font-bold font-mono text-white">{v.sizeLabel}</div>
                              <div className="text-[10px] text-slate-400">{v.unit || 'Piece'} • {v.material || item.material}</div>
                            </div>
                            <div className="text-right">
                              <span className="text-xs font-mono font-bold text-emerald-400">
                                {v.isPriceOnCall || v.price === null ? 'Price on Call' : `Rs. ${v.price.toLocaleString()}`}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 2. QUICK PRICING SPREADSHEET TAB */}
      {/* ---------------------------------------------------------------- */}
      {activeSubTab === 'quick_prices' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-white">Live Price Sheet</h3>
              <p className="text-xs text-slate-400">
                Update prices directly. Changes are automatically synchronized with the database when you click Save.
              </p>
            </div>

            <button
              onClick={handleSaveAll}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-emerald-950"
            >
              <Save className="w-4 h-4" />
              <span>Save All Updated Prices</span>
            </button>
          </div>

          <div className="overflow-x-auto max-h-[600px] no-scrollbar">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold sticky top-0 z-10 border-b border-slate-800">
                <tr>
                  <th className="p-3">Product Name</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Material</th>
                  <th className="p-3">Size Variant</th>
                  <th className="p-3">Unit</th>
                  <th className="p-3 text-right">Price in PKR</th>
                  <th className="p-3 text-center">Price on Call</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {currentConfig.items.map(item => {
                  const category = currentConfig.categories.find(c => c.id === item.categoryId);
                  return item.variants.map(v => (
                    <tr key={`${item.id}-${v.id}`} className="hover:bg-slate-950/60 transition-colors">
                      <td className="p-3 font-sans font-semibold text-white">{item.name}</td>
                      <td className="p-3 font-sans text-slate-400">{category?.name}</td>
                      <td className="p-3 text-blue-400">{v.material || item.material}</td>
                      <td className="p-3 font-bold text-white">{v.sizeLabel}</td>
                      <td className="p-3 text-slate-400">{v.unit || 'Piece'}</td>
                      <td className="p-3 text-right">
                        <input
                          type="number"
                          value={v.price === null ? '' : v.price}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : parseFloat(e.target.value);
                            handleUpdateVariantPrice(item.id, v.id, val);
                          }}
                          placeholder="Price on Call"
                          className="w-28 px-2 py-1 text-right rounded-lg bg-slate-950 border border-slate-800 text-xs font-bold font-mono text-emerald-400 focus:outline-none focus:border-blue-500"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={v.price === null || v.isPriceOnCall}
                          onChange={(e) => {
                            if (e.target.checked) {
                              handleUpdateVariantPrice(item.id, v.id, null);
                            } else {
                              handleUpdateVariantPrice(item.id, v.id, 200);
                            }
                          }}
                          className="w-4 h-4 rounded text-blue-600 bg-slate-950 border-slate-800 focus:ring-0 cursor-pointer"
                        />
                      </td>
                    </tr>
                  ));
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 3. CATEGORIES MANAGEMENT TAB */}
      {/* ---------------------------------------------------------------- */}
      {activeSubTab === 'categories' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Fitting Categories</h3>
              <p className="text-xs text-slate-400">Add, rename, or organize product categories shown in the builder.</p>
            </div>
            <button
              onClick={handleOpenAddCategory}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-950"
            >
              <Plus className="w-4 h-4" />
              <span>Add Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {currentConfig.categories.map(cat => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="text-sm font-bold text-white">{cat.name}</h4>
                  {cat.urduName && (
                    <p className="text-xs text-slate-400 font-urdu">{cat.urduName}</p>
                  )}
                  <p className="text-[11px] text-slate-500 mt-1">
                    {currentConfig.items.filter(i => i.categoryId === cat.id).length} Products inside
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      setEditingCategory(JSON.parse(JSON.stringify(cat)));
                      setIsCategoryModalOpen(true);
                    }}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-blue-400 border border-slate-800"
                    title="Edit Category"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id)}
                    className="p-2 rounded-xl bg-slate-950 hover:bg-rose-950 text-rose-400 border border-slate-800"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 4. PROJECT TYPES / PRESETS TAB */}
      {/* ---------------------------------------------------------------- */}
      {activeSubTab === 'packages' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 border border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white">Project Preset Bundles</h3>
              <p className="text-xs text-slate-400">Configure quick starter project choices (e.g. Full House Plumbing, Bathroom Setup).</p>
            </div>
            <button
              onClick={handleOpenAddPackageType}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-950"
            >
              <Plus className="w-4 h-4" />
              <span>Add Project Preset</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentConfig.packageTypes.map(pkg => (
              <div
                key={pkg.id}
                className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{pkg.name}</h4>
                      {pkg.badge && (
                        <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 text-[10px] font-semibold">
                          {pkg.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingPackageType(JSON.parse(JSON.stringify(pkg)));
                        setIsPackageTypeModalOpen(true);
                      }}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-blue-400 border border-slate-800"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-slate-400 font-light">{pkg.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* 5. GENERAL SETTINGS TAB */}
      {/* ---------------------------------------------------------------- */}
      {activeSubTab === 'general' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-6">
          
          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <div>
              <span className="text-sm font-bold text-white block">Enable Fitting Builder on Storefront</span>
              <span className="text-xs text-slate-400">Controls visibility in Smart Tools Hub and standalone launchers</span>
            </div>
            <input
              type="checkbox"
              checked={currentConfig.isEnabled}
              onChange={(e) => setCurrentConfig({ ...currentConfig, isEnabled: e.target.checked })}
              className="w-5 h-5 rounded text-blue-600 bg-slate-900 border-slate-700 cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Builder Title</label>
              <input
                type="text"
                value={currentConfig.title || ''}
                onChange={(e) => setCurrentConfig({ ...currentConfig, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Urdu Title</label>
              <input
                type="text"
                value={currentConfig.urduTitle || ''}
                onChange={(e) => setCurrentConfig({ ...currentConfig, urduTitle: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-urdu"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Subtitle / Marketing Tagline</label>
            <textarea
              rows={2}
              value={currentConfig.subtitle || ''}
              onChange={(e) => setCurrentConfig({ ...currentConfig, subtitle: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Target WhatsApp Order Phone Number</label>
            <input
              type="text"
              value={currentConfig.whatsappNumber || '923108002863'}
              onChange={(e) => setCurrentConfig({ ...currentConfig, whatsappNumber: e.target.value })}
              placeholder="e.g. 923108002863"
              className="w-full max-w-sm px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
            />
          </div>

          <div className="pt-2">
            <button
              onClick={handleSaveAll}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-lg"
            >
              Save General Settings
            </button>
          </div>

        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* EDIT / ADD ITEM MODAL */}
      {/* ---------------------------------------------------------------- */}
      {isItemModalOpen && editingItem && (
        <div className="fixed inset-0 z-[160] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-base font-bold text-white font-serif">
                {editingItem.name ? `Edit: ${editingItem.name}` : 'Add New Fitting Item'}
              </h3>
              <button
                onClick={() => setIsItemModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveItemModal} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={editingItem.name}
                    onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                    placeholder="e.g. CPVC Elbow 90 Degree"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Urdu Name</label>
                  <input
                    type="text"
                    value={editingItem.urduName || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, urduName: e.target.value })}
                    placeholder="e.g. ایلبو ۹۰ ڈگری"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-urdu"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={editingItem.categoryId}
                    onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  >
                    {currentConfig.categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Material</label>
                  <input
                    type="text"
                    value={editingItem.material || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, material: e.target.value })}
                    placeholder="e.g. CPVC, UPVC, PPRC"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Brand</label>
                  <input
                    type="text"
                    value={editingItem.brand || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, brand: e.target.value })}
                    placeholder="e.g. Master, Popular"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Photo Image URL</label>
                <input
                  type="text"
                  value={editingItem.image || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, image: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              {/* Sizes / Variants List Editor */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Size Variants & Prices (PKR)
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const newVar: FittingItemVariant = {
                        id: `var-${Date.now()}`,
                        itemId: editingItem.id,
                        sizeType: 'INCH',
                        sizeLabel: '1"',
                        price: 300,
                        unit: 'Piece',
                        enabled: true,
                        sortOrder: editingItem.variants.length + 1
                      };
                      setEditingItem({
                        ...editingItem,
                        variants: [...editingItem.variants, newVar]
                      });
                    }}
                    className="px-2.5 py-1 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Size</span>
                  </button>
                </div>

                <div className="space-y-2">
                  {editingItem.variants.map((v, vIdx) => (
                    <div key={v.id} className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Size (e.g. 1/2 inch or 25mm)"
                        value={v.sizeLabel}
                        onChange={(e) => {
                          const updated = [...editingItem.variants];
                          updated[vIdx].sizeLabel = e.target.value;
                          setEditingItem({ ...editingItem, variants: updated });
                        }}
                        className="w-28 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white font-mono"
                      />

                      <select
                        value={v.sizeType}
                        onChange={(e) => {
                          const updated = [...editingItem.variants];
                          updated[vIdx].sizeType = e.target.value as any;
                          setEditingItem({ ...editingItem, variants: updated });
                        }}
                        className="w-20 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                      >
                        <option value="INCH">INCH</option>
                        <option value="MM">MM</option>
                        <option value="OTHER">OTHER</option>
                      </select>

                      <input
                        type="number"
                        placeholder="Price PKR"
                        value={v.price === null ? '' : v.price}
                        onChange={(e) => {
                          const updated = [...editingItem.variants];
                          updated[vIdx].price = e.target.value === '' ? null : parseFloat(e.target.value);
                          setEditingItem({ ...editingItem, variants: updated });
                        }}
                        className="w-28 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-emerald-400 font-mono font-bold"
                      />

                      <input
                        type="text"
                        placeholder="Unit (e.g. Piece)"
                        value={v.unit || 'Piece'}
                        onChange={(e) => {
                          const updated = [...editingItem.variants];
                          updated[vIdx].unit = e.target.value;
                          setEditingItem({ ...editingItem, variants: updated });
                        }}
                        className="w-20 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
                      />

                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingItem.variants.filter((_, idx) => idx !== vIdx);
                          setEditingItem({ ...editingItem, variants: updated });
                        }}
                        className="p-1.5 text-slate-500 hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsItemModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  Save Item
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* EDIT / ADD CATEGORY MODAL */}
      {/* ---------------------------------------------------------------- */}
      {isCategoryModalOpen && editingCategory && (
        <div className="fixed inset-0 z-[160] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-bold text-white font-serif">Category Configuration</h3>
            <form onSubmit={handleSaveCategoryModal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  placeholder="e.g. CPVC Pipes & Fittings"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Urdu Name</label>
                <input
                  type="text"
                  value={editingCategory.urduName || ''}
                  onChange={(e) => setEditingCategory({ ...editingCategory, urduName: e.target.value })}
                  placeholder="e.g. سی پی وی سی پائپ اور فٹنگ"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-urdu"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  Save Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {/* EDIT / ADD PACKAGE TYPE MODAL */}
      {/* ---------------------------------------------------------------- */}
      {isPackageTypeModalOpen && editingPackageType && (
        <div className="fixed inset-0 z-[160] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-5 space-y-4">
            <h3 className="text-base font-bold text-white font-serif">Project Preset Configuration</h3>
            <form onSubmit={handleSavePackageTypeModal} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Preset Name *</label>
                <input
                  type="text"
                  required
                  value={editingPackageType.name}
                  onChange={(e) => setEditingPackageType({ ...editingPackageType, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Badge Tag</label>
                <input
                  type="text"
                  value={editingPackageType.badge || ''}
                  onChange={(e) => setEditingPackageType({ ...editingPackageType, badge: e.target.value })}
                  placeholder="e.g. Popular, 5 Marla, Full Setup"
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingPackageType.description}
                  onChange={(e) => setEditingPackageType({ ...editingPackageType, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPackageTypeModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-950 text-slate-400 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
                >
                  Save Preset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
