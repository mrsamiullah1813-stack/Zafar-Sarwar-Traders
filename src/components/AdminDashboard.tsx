import React, { useState, useEffect } from 'react';
import { VideoUploader } from './VideoUploader';
import { MultiImageUploader } from './MultiImageUploader';
import { AdminCategoryModal } from './AdminCategoryModal';
import { AdminProductModal } from './AdminProductModal';
import { AdminBrandModal } from './AdminBrandModal';
import { AdminStatModal } from './AdminStatModal';
import { AdminContactModal } from './AdminContactModal';
import { VisitorAnalyticsDashboard } from './VisitorAnalyticsDashboard';
import { AdminOrdersManager } from './AdminOrdersManager';
import { AdminCustomersManager } from './AdminCustomersManager';
import { AdminDeliveryManager } from './AdminDeliveryManager';
import { 
  X, 
  Plus, 
  Trash2, 
  Edit3, 
  Video, 
  Image as ImageIcon, 
  Check, 
  ArrowUp, 
  ArrowDown, 
  Settings, 
  Layers, 
  Package, 
  ShoppingBag, 
  Truck,
  Sparkles, 
  Globe, 
  ShieldCheck, 
  Search, 
  Upload, 
  RefreshCw, 
  LogOut, 
  MessageSquare,
  Key,
  FileText,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Copy,
  CheckSquare,
  Square,
  ToggleLeft,
  ToggleRight,
  Filter,
  Tag,
  Building2,
  Star,
  BarChart3,
  TrendingUp,
  Download as DownloadIcon,
  Award,
  Users,
  UserCheck,
  Shield,
  PhoneCall,
  Clock,
  Wrench,
  Type
} from 'lucide-react';
import { AdminPlannerManager } from './AdminPlannerManager';
import { AdminEstimatorManager } from './AdminEstimatorManager';
import { AdminAiAssistantManager } from './AdminAiAssistantManager';
import { AdminAnnouncementManager } from './AdminAnnouncementManager';
import { AdminHeroManager } from './AdminHeroManager';
import { AdminConstructionBuilderManager } from './AdminConstructionBuilderManager';
import { Megaphone, Palette, HardHat } from 'lucide-react';
import { AdminThemeManager } from './AdminThemeManager';
import { AdminPricingAppearanceManager } from './AdminPricingAppearanceManager';
import { AdminSmartToolsManager } from './AdminSmartToolsManager';
import { AdminCouponsManager } from './AdminCouponsManager';
import { Product, ProductCategory, ProductVideo, BusinessConfig, GalleryItem, ProductBrand, StatCounter, AiDesignerConfig, AiAssistantConfig, ContactPerson, ThemeSettings, HeroSettings, BuildMaterialEstimatorConfig, SmartToolsSettings, FittingBuilderConfig } from '../types';
import { getAdminPin, setAdminPin, loadPlannerConfig, savePlannerConfig, loadBuildMaterialEstimatorConfig, saveBuildMaterialEstimatorConfig, loadAiAssistantConfig, saveAiAssistantConfig, loadThemeSettings, saveThemeSettings, loadHeroSettings, saveHeroSettings, loadSmartToolsSettings, saveSmartToolsSettings, loadFittingBuilderConfig, saveFittingBuilderConfig, deleteProductFromStorage, saveStoredProducts, saveStoredProductSingle, deleteCategoryFromStorage, saveStoredCategories, saveStoredCategorySingle, deleteBrandFromStorage, saveStoredBrands, saveStoredBrandSingle } from '../utils/storage';

interface AdminDashboardProps {
  products: Product[];
  categories: ProductCategory[];
  brands: ProductBrand[];
  stats: StatCounter[];
  contacts?: ContactPerson[];
  config: BusinessConfig;
  gallery: GalleryItem[];
  heroSettings?: HeroSettings;
  smartToolsSettings?: SmartToolsSettings;
  fittingBuilderConfig?: FittingBuilderConfig;
  onSaveProducts: (products: Product[]) => Promise<{ success: boolean; error?: string }> | void;
  onSaveCategories: (categories: ProductCategory[]) => Promise<{ success: boolean; error?: string }> | void;
  onSaveBrands: (brands: ProductBrand[]) => Promise<{ success: boolean; error?: string }> | void;
  onSaveStats: (stats: StatCounter[]) => Promise<{ success: boolean; error?: string }> | void;
  onSaveContacts?: (contacts: ContactPerson[]) => Promise<{ success: boolean; error?: string }> | void;
  onSaveConfig: (config: BusinessConfig) => Promise<{ success: boolean; error?: string }> | void;
  onSaveGallery: (gallery: GalleryItem[]) => void;
  onSaveHeroSettings?: (hs: HeroSettings) => void;
  onSaveSmartToolsSettings?: (st: SmartToolsSettings) => void;
  onSaveFittingBuilderConfig?: (fc: FittingBuilderConfig) => void;
  onLogout: () => void;
  onClose: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  categories,
  brands = [],
  stats = [],
  contacts = [],
  config,
  gallery,
  heroSettings,
  smartToolsSettings,
  fittingBuilderConfig,
  onSaveProducts,
  onSaveCategories,
  onSaveBrands,
  onSaveStats,
  onSaveContacts,
  onSaveConfig,
  onSaveGallery,
  onSaveHeroSettings,
  onSaveSmartToolsSettings,
  onSaveFittingBuilderConfig,
  onLogout,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'analytics' | 'hero' | 'announcements' | 'orders' | 'customers' | 'coupons' | 'delivery' | 'products' | 'categories' | 'brands' | 'contacts' | 'statistics' | 'banners_seo' | 'pricing_appearance' | 'gallery' | 'smart_tools' | 'construction_builder' | 'planner' | 'estimator' | 'ai_assistant' | 'themes'>('analytics');
  const [plannerConfig, setPlannerConfig] = useState<AiDesignerConfig>(loadPlannerConfig());
  const [estimatorConfig, setEstimatorConfig] = useState<BuildMaterialEstimatorConfig>(loadBuildMaterialEstimatorConfig());
  const [fittingConfigState, setFittingConfigState] = useState<FittingBuilderConfig>(fittingBuilderConfig || loadFittingBuilderConfig());
  const [aiAssistantConfig, setAiAssistantConfig] = useState<AiAssistantConfig>(loadAiAssistantConfig());
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>(loadThemeSettings());
  const [heroSettingsState, setHeroSettingsState] = useState<HeroSettings>(heroSettings || loadHeroSettings());
  const [smartToolsSettingsState, setSmartToolsSettingsState] = useState<SmartToolsSettings>(smartToolsSettings || loadSmartToolsSettings());

  const [searchQuery, setSearchQuery] = useState('');
  const [brandSearch, setBrandSearch] = useState('');
  const [editingBrand, setEditingBrand] = useState<ProductBrand | null>(null);
  const [isBrandModalOpen, setIsBrandModalOpen] = useState(false);

  // Contacts Management State
  const [contactSearch, setContactSearch] = useState('');
  const [editingContact, setEditingContact] = useState<ContactPerson | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);

  // Stats Modal State
  const [statSearch, setStatSearch] = useState('');
  const [editingStat, setEditingStat] = useState<StatCounter | null>(null);
  const [isStatModalOpen, setIsStatModalOpen] = useState(false);

  const [categoryFilter, setCategoryFilter] = useState('all');

  // Category Management Filter & State
  const [catSearch, setCatSearch] = useState('');
  const [catGroupFilter, setCatGroupFilter] = useState<string>('all');
  const [catStatusFilter, setCatStatusFilter] = useState<'all' | 'active' | 'inactive' | 'featured'>('all');
  const [selectedCatIds, setSelectedCatIds] = useState<string[]>([]);
  
  // Confirmation Modals State
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState<ProductCategory | null>(null);
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Product Editing Modal State inside CMS
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Category Editing State
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // Config Form state
  const [configForm, setConfigForm] = useState<BusinessConfig>({ ...config });
  const [newPin, setNewPin] = useState(getAdminPin());
  const [configSuccessMsg, setConfigSuccessMsg] = useState('');

  // Keep configForm synchronized when parent config updates
  useEffect(() => {
    if (config) {
      setConfigForm({ ...config });
    }
  }, [config]);

  // Gallery item add state
  const [newGalleryTitle, setNewGalleryTitle] = useState('');
  const [newGalleryImg, setNewGalleryImg] = useState('');
  const [newGalleryCat, setNewGalleryCat] = useState<'sanitary' | 'faucets' | 'paints' | 'materials'>('sanitary');

  // Filtered Products
  const filteredProducts = (products || []).filter(p => {
    if (!p) return false;
    const q = (searchQuery || '').toLowerCase();
    const nameStr = (p.name || '').toLowerCase();
    const brandStr = (p.brand || '').toLowerCase();
    const descStr = (p.description || '').toLowerCase();
    const matchesSearch = nameStr.includes(q) || brandStr.includes(q) || descStr.includes(q);
    const matchesCategory = categoryFilter === 'all' || p.categoryId === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Reorder Products
  const handleMoveProduct = (index: number, direction: 'up' | 'down') => {
    const newProducts = [...products];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newProducts.length) return;
    
    const temp = newProducts[index];
    newProducts[index] = newProducts[targetIndex];
    newProducts[targetIndex] = temp;
    
    onSaveProducts(newProducts);
  };

  // Clear Sample Products
  const handleClearSampleProducts = () => {
    if (confirm('Are you sure you want to clear all sample products? You can add your real products manually.')) {
      onSaveProducts([]);
    }
  };

  // Single Product Save
  const handleSaveSingleProduct = async (productToSave: Product) => {
    const res = await saveStoredProductSingle(productToSave);
    if (res && res.success === false) {
      const errMsg = res.error || 'Database error saving product';
      showToast(`Save failed: ${errMsg}`);
      throw new Error(errMsg);
    }
    const exists = products.some(p => p.id === productToSave.id);
    let updated: Product[];
    if (exists) {
      updated = products.map(p => p.id === productToSave.id ? productToSave : p);
    } else {
      updated = [productToSave, ...products];
    }
    if (onSaveProducts) {
      // Update in-memory React state in parent App.tsx
      onSaveProducts(updated);
    }
    setIsProductModalOpen(false);
    setEditingProduct(null);
    showToast(`Product "${productToSave.name}" saved successfully!`);
  };

  // Product Delete
  const handleDeleteProduct = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      const res = await deleteProductFromStorage(id);
      if (res && res.success === false) {
        showToast(`Delete failed: ${res.error || 'Database error'}`);
        return;
      }
      const updated = products.filter(p => p.id !== id);
      onSaveProducts(updated);
      showToast('Product deleted permanently from database.');
    }
  };

  // Category Save
  const handleSaveCategory = async (catToSave: ProductCategory) => {
    const res = await saveStoredCategorySingle(catToSave);
    if (res && res.success === false) {
      const errMsg = res.error || 'Database error saving category';
      showToast(`Save failed: ${errMsg}`);
      throw new Error(errMsg);
    }
    const exists = categories.some(c => c.id === catToSave.id);
    let updated: ProductCategory[];
    if (exists) {
      updated = categories.map(c => c.id === catToSave.id ? catToSave : c);
    } else {
      updated = [...categories, catToSave];
    }
    if (onSaveCategories) {
      onSaveCategories(updated);
    }
    showToast(exists ? `Category "${catToSave.name}" updated successfully!` : `New category "${catToSave.name}" created!`);
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  };

  // Brand Management Handlers
  const handleSaveBrand = async (brandToSave: ProductBrand) => {
    const res = await saveStoredBrandSingle(brandToSave);
    if (res && res.success === false) {
      const errMsg = res.error || 'Database error saving brand';
      showToast(`Save failed: ${errMsg}`);
      throw new Error(errMsg);
    }
    const exists = brands.some(b => b.id === brandToSave.id);
    let updated: ProductBrand[];
    if (exists) {
      updated = brands.map(b => b.id === brandToSave.id ? brandToSave : b);
    } else {
      updated = [...brands, brandToSave];
    }
    if (onSaveBrands) {
      onSaveBrands(updated);
    }
    setIsBrandModalOpen(false);
    setEditingBrand(null);
    showToast(exists ? `Brand "${brandToSave.name}" updated successfully!` : `New brand "${brandToSave.name}" added!`);
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (confirm('Delete this brand permanently? Associated products will remain in store.')) {
      const res = await deleteBrandFromStorage(brandId);
      if (res && res.success === false) {
        showToast(`Delete failed: ${res.error || 'Database error'}`);
        return;
      }
      const updated = brands.filter(b => b.id !== brandId);
      onSaveBrands(updated);
      showToast('Brand removed from database.');
    }
  };

  const handleMoveBrand = (index: number, direction: 'up' | 'down') => {
    const newBrands = [...brands];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newBrands.length) return;
    const temp = newBrands[index];
    newBrands[index] = newBrands[targetIndex];
    newBrands[targetIndex] = temp;
    onSaveBrands(newBrands);
  };

  // Product Duplicate & Toggles
  const handleDuplicateProduct = async (prod: Product) => {
    const copy: Product = {
      ...prod,
      id: `prod-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sku: prod.sku ? `${prod.sku}-COPY` : undefined,
      name: `${prod.name} (Copy)`,
      displayOrder: (prod.displayOrder || products.length) + 1
    };
    await saveStoredProductSingle(copy);
    onSaveProducts([copy, ...products]);
    showToast(`Duplicated "${prod.name}" successfully!`);
  };

  const handleToggleProductHidden = async (prod: Product) => {
    const updatedItem = { ...prod, isHidden: !prod.isHidden };
    const updatedList = products.map(p => p.id === prod.id ? updatedItem : p);
    onSaveProducts(updatedList);
    await saveStoredProductSingle(updatedItem);
    showToast(`Product "${prod.name}" ${!prod.isHidden ? 'Hidden' : 'Visible'}.`);
  };

  // Contact Persons Handlers
  const handleSaveContact = async (contactToSave: ContactPerson) => {
    const exists = contacts.some(c => c.id === contactToSave.id);
    let updated: ContactPerson[];
    if (exists) {
      updated = contacts.map(c => c.id === contactToSave.id ? contactToSave : c);
    } else {
      updated = [...contacts, contactToSave];
    }
    if (onSaveContacts) {
      const res = await onSaveContacts(updated);
      if (res && res.success === false) {
        showToast(`Save failed: ${res.error || 'Database error'}`);
        return;
      }
    }
    showToast(exists ? `Contact "${contactToSave.fullName}" updated!` : `New contact "${contactToSave.fullName}" added!`);
    setIsContactModalOpen(false);
    setEditingContact(null);
  };

  const handleDeleteContact = async (id: string) => {
    if (confirm('Delete this contact person permanently?')) {
      const updated = contacts.filter(c => c.id !== id);
      if (onSaveContacts) {
        const res = await onSaveContacts(updated);
        if (res && res.success === false) {
          showToast(`Delete failed: ${res.error || 'Database error'}`);
          return;
        }
      }
      showToast('Contact person removed.');
      setIsContactModalOpen(false);
      setEditingContact(null);
    }
  };

  const handleToggleContactHidden = async (contact: ContactPerson) => {
    const updated = contacts.map(c => c.id === contact.id ? { ...c, isHidden: !c.isHidden } : c);
    if (onSaveContacts) {
      const res = await onSaveContacts(updated);
      if (res && res.success === false) {
        showToast(`Update failed: ${res.error || 'Database error'}`);
        return;
      }
    }
    showToast(`Contact "${contact.fullName}" ${!contact.isHidden ? 'Hidden' : 'Visible'}.`);
  };

  const handleSetPrimaryContact = async (contactId: string) => {
    const updated = contacts.map(c => ({
      ...c,
      isPrimary: c.id === contactId
    }));
    if (onSaveContacts) {
      const res = await onSaveContacts(updated);
      if (res && res.success === false) {
        showToast(`Update failed: ${res.error || 'Database error'}`);
        return;
      }
    }
    showToast('Primary contact updated.');
  };

  const handleMoveContact = async (index: number, direction: 'up' | 'down') => {
    const newContacts = [...contacts];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newContacts.length) return;
    const temp = newContacts[index];
    newContacts[index] = newContacts[targetIndex];
    newContacts[targetIndex] = temp;
    const reindexed = newContacts.map((c, i) => ({ ...c, displayOrder: i + 1 }));
    if (onSaveContacts) {
      const res = await onSaveContacts(reindexed);
      if (res && res.success === false) {
        showToast(`Update failed: ${res.error || 'Database error'}`);
        return;
      }
    }
    showToast('Contact personnel order updated.');
  };

  // Stat Counter Handlers
  const handleSaveStat = async (statToSave: StatCounter) => {
    const exists = stats.some(s => s.id === statToSave.id);
    let updated: StatCounter[];
    if (exists) {
      updated = stats.map(s => s.id === statToSave.id ? statToSave : s);
    } else {
      updated = [...stats, statToSave];
    }
    const res = await onSaveStats(updated);
    if (res && res.success === false) {
      showToast(`Save failed: ${res.error || 'Database error'}`);
      return;
    }
    showToast(exists ? `Stat counter "${statToSave.title}" updated!` : `New stat counter "${statToSave.title}" created!`);
    setIsStatModalOpen(false);
    setEditingStat(null);
  };

  const handleDeleteStat = async (statId: string) => {
    if (confirm('Delete this statistic counter permanently?')) {
      const updated = stats.filter(s => s.id !== statId);
      const res = await onSaveStats(updated);
      if (res && res.success === false) {
        showToast(`Delete failed: ${res.error || 'Database error'}`);
        return;
      }
      showToast('Statistic counter removed.');
    }
  };

  const handleMoveStat = async (index: number, direction: 'up' | 'down') => {
    const newStats = [...stats];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newStats.length) return;
    const temp = newStats[index];
    newStats[index] = newStats[targetIndex];
    newStats[targetIndex] = temp;
    const res = await onSaveStats(newStats);
    if (res && res.success === false) {
      showToast(`Update failed: ${res.error || 'Database error'}`);
      return;
    }
  };

  // Category Permanent Delete Confirm Handler
  const handleConfirmDeleteCategory = async () => {
    if (!deleteCategoryConfirm) return;
    const catId = deleteCategoryConfirm.id;
    const catName = deleteCategoryConfirm.name;
    const res = await deleteCategoryFromStorage(catId);
    if (res && res.success === false) {
      showToast(`Delete failed: ${res.error || 'Database error'}`);
      setDeleteCategoryConfirm(null);
      return;
    }
    const updated = categories.filter(c => c.id !== catId);
    onSaveCategories(updated);
    setSelectedCatIds(prev => prev.filter(id => id !== catId));
    setDeleteCategoryConfirm(null);
    showToast(`Category "${catName}" deleted permanently from database.`);
  };

  // Duplicate Category
  const handleDuplicateCategory = (cat: ProductCategory) => {
    const copy: ProductCategory = {
      ...cat,
      id: `cat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: `${cat.name} (Copy)`,
      slug: `${cat.slug || cat.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-copy`,
      displayOrder: (cat.displayOrder || categories.length) + 1
    };
    const updated = [...categories, copy];
    onSaveCategories(updated);
    showToast(`Duplicated "${cat.name}" successfully!`);
  };

  // Reorder Category Up or Down
  const handleMoveCategory = (index: number, direction: 'up' | 'down') => {
    const newCatList = [...categories];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newCatList.length) return;
    
    const temp = newCatList[index];
    newCatList[index] = newCatList[targetIndex];
    newCatList[targetIndex] = temp;
    
    // Update displayOrder indices
    const reindexed = newCatList.map((c, i) => ({ ...c, displayOrder: i + 1 }));
    onSaveCategories(reindexed);
    showToast("Category order re-arranged!");
  };

  // Quick Active Status Toggle
  const handleToggleCategoryActive = async (cat: ProductCategory) => {
    const updatedCat = { ...cat, isActive: cat.isActive === false ? true : false };
    const updated = categories.map(c => 
      c.id === cat.id ? updatedCat : c
    );
    onSaveCategories(updated);
    await saveStoredCategorySingle(updatedCat);
    const newStatus = cat.isActive === false ? 'Activated' : 'Deactivated';
    showToast(`Category "${cat.name}" ${newStatus}.`);
  };

  // Quick Featured Status Toggle
  const handleToggleCategoryFeatured = async (cat: ProductCategory) => {
    const updatedCat = { ...cat, isFeatured: !cat.isFeatured };
    const updated = categories.map(c => 
      c.id === cat.id ? updatedCat : c
    );
    onSaveCategories(updated);
    await saveStoredCategorySingle(updatedCat);
    showToast(`Category "${cat.name}" featured status toggled.`);
  };

  // Filtered Categories List
  const filteredCategories = (categories || []).filter(cat => {
    if (!cat) return false;
    const q = (catSearch || '').toLowerCase();
    const nameStr = (cat.name || '').toLowerCase();
    const descStr = (cat.description || '').toLowerCase();
    const slugStr = (cat.slug || '').toLowerCase();
    const matchesSearch = !q || nameStr.includes(q) || descStr.includes(q) || slugStr.includes(q);
    
    const catGroup = (cat.group || '').toLowerCase();
    const selectedGroup = (catGroupFilter || '').toLowerCase();
    const matchesGroup = selectedGroup === 'all' || catGroup === selectedGroup || catGroup.includes(selectedGroup);

    let matchesStatus = true;
    if (catStatusFilter === 'active') matchesStatus = cat.isActive !== false;
    if (catStatusFilter === 'inactive') matchesStatus = cat.isActive === false;
    if (catStatusFilter === 'featured') matchesStatus = !!cat.isFeatured;

    return matchesSearch && matchesGroup && matchesStatus;
  });

  // Diagnostic log for Admin Panel Categories
  useEffect(() => {
    if (activeTab === 'categories') {
      console.log(`[UI Diagnostics] Admin Panel Categories Tab: ${categories?.length || 0} categories in state, ${filteredCategories.length} displayed in table (Search: "${catSearch || 'none'}", Group: "${catGroupFilter}", Status: "${catStatusFilter}")`);
    }
  }, [activeTab, categories?.length, filteredCategories.length, catSearch, catGroupFilter, catStatusFilter]);

  // Bulk Selection Handlers
  const handleSelectAllCategories = () => {
    if (selectedCatIds.length === filteredCategories.length) {
      setSelectedCatIds([]);
    } else {
      setSelectedCatIds(filteredCategories.map(c => c.id));
    }
  };

  const handleToggleSelectCategory = (id: string) => {
    setSelectedCatIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkActivateCategories = () => {
    const updated = categories.map(c => 
      selectedCatIds.includes(c.id) ? { ...c, isActive: true } : c
    );
    onSaveCategories(updated);
    showToast(`${selectedCatIds.length} categories activated.`);
    setSelectedCatIds([]);
  };

  const handleBulkDeactivateCategories = () => {
    const updated = categories.map(c => 
      selectedCatIds.includes(c.id) ? { ...c, isActive: false } : c
    );
    onSaveCategories(updated);
    showToast(`${selectedCatIds.length} categories deactivated.`);
    setSelectedCatIds([]);
  };

  const handleBulkDuplicateCategories = () => {
    const copies: ProductCategory[] = [];
    categories.forEach(c => {
      if (selectedCatIds.includes(c.id)) {
        copies.push({
          ...c,
          id: `cat-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
          name: `${c.name} (Copy)`
        });
      }
    });
    onSaveCategories([...categories, ...copies]);
    showToast(`${copies.length} categories duplicated.`);
    setSelectedCatIds([]);
  };

  const handleConfirmBulkDeleteCategories = () => {
    const updated = categories.filter(c => !selectedCatIds.includes(c.id));
    onSaveCategories(updated);
    showToast(`${selectedCatIds.length} categories deleted permanently.`);
    setSelectedCatIds([]);
    setBulkDeleteConfirmOpen(false);
  };

  // Config & Banners Save
  const handleSaveConfigForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await onSaveConfig(configForm);
      if (res && res.success === false) {
        showToast(`Save failed: ${res.error || 'Database error saving settings'}`);
        return;
      }
      if (newPin) {
        setAdminPin(newPin);
      }
      setConfigSuccessMsg('Store settings, Banners & Phone/WhatsApp successfully saved!');
      showToast('Store settings & WhatsApp lines saved!');
      setTimeout(() => setConfigSuccessMsg(''), 4000);
    } catch (err: any) {
      showToast(`Save failed: ${err?.message || String(err)}`);
    }
  };

  // Gallery Add
  const handleAddGalleryItem = () => {
    if (!newGalleryTitle || !newGalleryImg) return;
    const item: GalleryItem = {
      id: `gal-${Date.now()}`,
      title: newGalleryTitle,
      category: newGalleryCat,
      image: newGalleryImg,
      description: 'Zafar Sarwar Traders Showcase Project'
    };
    onSaveGallery([item, ...gallery]);
    setNewGalleryTitle('');
    setNewGalleryImg('');
  };

  const handleDeleteGalleryItem = (id: string) => {
    onSaveGallery(gallery.filter(g => g.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950 text-slate-100 flex flex-col overflow-hidden animate-fadeIn">
      
      {/* CMS Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-blue-600/20 border border-blue-500/40 text-blue-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-serif text-white flex items-center gap-2">
              <span>Admin Content Management System (CMS)</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400 text-[10px] font-mono uppercase">
                Owner Mode Active
              </span>
            </h1>
            <p className="text-xs text-slate-400 font-light">
              Full control over products, categories, videos, banners, prices, and store settings.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
          >
            <Eye className="w-4 h-4 text-blue-400" />
            <span>View Public Storefront</span>
          </button>

          <button
            onClick={() => {
              onLogout();
              onClose();
            }}
            className="px-4 py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Lock & Exit Admin</span>
          </button>
        </div>
      </header>

      {/* Main CMS Container */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        
        {/* Sidebar Navigation */}
        <aside className="w-full md:w-64 bg-slate-900/60 border-b md:border-b-0 md:border-r border-slate-800 p-4 shrink-0 flex flex-col justify-between overflow-y-auto max-h-72 md:max-h-full min-h-0">
          <div className="space-y-1.5">
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">
              Management Modules
            </div>

            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'analytics'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-emerald-400" />
                <span>Visitor Analytics</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-[10px] text-emerald-300 font-mono font-bold">
                Live
              </span>
            </button>

            <button
              onClick={() => setActiveTab('hero')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'hero'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Hero Product Manager</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-[10px] text-cyan-300 font-mono font-bold">
                Hero
              </span>
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'announcements'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Megaphone className="w-4 h-4 text-amber-400" />
                <span>Announcement Bar</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-[10px] text-amber-300 font-mono font-bold">
                Top Bar
              </span>
            </button>

            <button
              onClick={() => setActiveTab('orders')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'orders'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-emerald-400" />
                <span>Customer Orders</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-[10px] text-emerald-300 font-mono font-bold">
                Orders
              </span>
            </button>

            <button
              onClick={() => setActiveTab('customers')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'customers'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-cyan-400" />
                <span>Customer Directory</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-[10px] text-cyan-300 font-mono font-bold">
                Users
              </span>
            </button>

            <button
              onClick={() => setActiveTab('coupons')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'coupons'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>Coupons & Promo Codes</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-[10px] text-amber-300 font-mono font-bold">
                Discounts
              </span>
            </button>

            <button
              onClick={() => setActiveTab('delivery')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'delivery'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Truck className="w-4 h-4 text-sky-400" />
                <span>Delivery Management</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-sky-950 text-[10px] text-sky-300 font-mono font-bold">
                Pakistan
              </span>
            </button>

            <button
              onClick={() => setActiveTab('products')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'products'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Package className="w-4 h-4" />
                <span>Products Inventory</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] text-slate-300 font-mono">
                {products.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('categories')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'categories'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className="w-4 h-4" />
                <span>Product Categories</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] text-slate-300 font-mono">
                {categories.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('brands')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'brands'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4" />
                <span>Brand Partners</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] text-slate-300 font-mono">
                {brands.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('contacts')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'contacts'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-amber-400" />
                <span>Contact Personnel</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] text-amber-300 font-mono">
                {contacts.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('statistics')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'statistics'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Award className="w-4 h-4" />
                <span>Business Statistics</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] text-slate-300 font-mono">
                {stats.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('banners_seo')}
              className={`w-full flex items-center gap-2.5 px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'banners_seo'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Banners, Contact & SEO</span>
            </button>

            <button
              onClick={() => setActiveTab('pricing_appearance')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'pricing_appearance'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Type className="w-4 h-4 text-amber-400" />
                <span>Pricing Appearance</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-950 text-[10px] text-amber-300 font-mono font-bold">
                NEW
              </span>
            </button>

            <button
              onClick={() => setActiveTab('themes')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'themes'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Palette className="w-4 h-4 text-pink-400" />
                <span>Theme Management</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-pink-950 text-[10px] text-pink-300 font-mono font-bold">
                5 Themes
              </span>
            </button>

            <button
              onClick={() => setActiveTab('gallery')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'gallery'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-4 h-4" />
                <span>Showroom Gallery</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-950 text-[10px] text-slate-300 font-mono">
                {gallery.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('smart_tools')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'smart_tools'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>Smart Tools Hub (5 Tools)</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                smartToolsSettingsState.isEnabled ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
              }`}>
                {smartToolsSettingsState.isEnabled ? 'Active' : 'OFF'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('construction_builder')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'construction_builder'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4 text-blue-400" />
                <span>Smart Fitting Builder</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                fittingConfigState.isEnabled ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
              }`}>
                {fittingConfigState.isEnabled ? 'Active' : 'OFF'}
              </span>
            </button>


            <button
              onClick={() => setActiveTab('planner')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'planner'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Easy Bathroom Planner</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                plannerConfig.isEnabled ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
              }`}>
                {plannerConfig.isEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('estimator')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'estimator'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <HardHat className="w-4 h-4 text-amber-400" />
                <span>Cement / Material Estimator</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                estimatorConfig.isEnabled ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
              }`}>
                {estimatorConfig.isEnabled ? 'ON' : 'OFF'}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('ai_assistant')}
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'ai_assistant'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>AI Sales Assistant</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                aiAssistantConfig.isEnabled ? 'bg-emerald-950 text-emerald-300' : 'bg-rose-950 text-rose-300'
              }`}>
                {aiAssistantConfig.isEnabled ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-2 text-center">
            <span className="text-[11px] font-bold text-emerald-400 block">WhatsApp Integration</span>
            <p className="text-[10px] text-slate-400 font-mono">+92 310 8002863</p>
            <p className="text-[10px] text-slate-500 italic">All product order buttons link directly to this official line.</p>
          </div>
        </aside>

        {/* Content Panel Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 pb-32 bg-slate-950/80 min-h-0">
          
          {/* TAB: HERO PRODUCT MANAGER */}
          {activeTab === 'hero' && (
            <AdminHeroManager
              products={products}
              categories={categories}
              brands={brands}
              heroSettings={heroSettingsState}
              onUpdateHeroSettings={(newSettings) => {
                setHeroSettingsState(newSettings);
                saveHeroSettings(newSettings);
                if (onSaveHeroSettings) onSaveHeroSettings(newSettings);
              }}
              onUpdateProducts={(updatedProds) => {
                onSaveProducts(updatedProds);
              }}
              showToast={showToast}
            />
          )}

          {/* TAB: WEBSITE MULTI-THEME MANAGEMENT */}
          {activeTab === 'themes' && (
            <AdminThemeManager
              themeSettings={themeSettings}
              onSaveThemeSettings={(newSettings) => {
                setThemeSettings(newSettings);
                saveThemeSettings(newSettings);
              }}
            />
          )}

          {/* TAB: AI ASSISTANT CONFIG */}
          {activeTab === 'ai_assistant' && (
            <AdminAiAssistantManager
              config={aiAssistantConfig}
              onSaveConfig={(updated) => {
                setAiAssistantConfig(updated);
                saveAiAssistantConfig(updated);
              }}
            />
          )}

          {/* TAB: AI BATHROOM PLANNER ADMIN */}
          {activeTab === 'planner' && (
            <AdminPlannerManager
              products={products}
              config={plannerConfig}
              onSaveConfig={(updated) => {
                setPlannerConfig(updated);
                savePlannerConfig(updated);
              }}
            />
          )}

          {/* TAB: SMART CONSTRUCTION & FITTING BUILDER ADMIN */}
          {activeTab === 'construction_builder' && (
            <AdminConstructionBuilderManager
              config={fittingConfigState}
              products={products}
              onSaveConfig={async (updated) => {
                setFittingConfigState(updated);
                if (onSaveFittingBuilderConfig) onSaveFittingBuilderConfig(updated);
                const res = await saveFittingBuilderConfig(updated);
                return res;
              }}
            />
          )}

          {/* TAB: BUILD MATERIAL & CEMENT ESTIMATOR ADMIN */}
          {activeTab === 'estimator' && (
            <AdminEstimatorManager
              config={estimatorConfig}
              onSaveConfig={async (updated) => {
                setEstimatorConfig(updated);
                const res = await saveBuildMaterialEstimatorConfig(updated);
                return res;
              }}
            />
          )}

          {/* TAB: ANNOUNCEMENT BAR MANAGER */}
          {activeTab === 'announcements' && (
            <AdminAnnouncementManager
              onShowToast={showToast}
            />
          )}

          {/* TAB: VISITOR ANALYTICS DASHBOARD */}
          {activeTab === 'analytics' && (
            <VisitorAnalyticsDashboard
              products={products}
              categories={categories}
            />
          )}

          {/* TAB: CUSTOMER ORDERS & CHECKOUT SETTINGS */}
          {activeTab === 'orders' && (
            <AdminOrdersManager
              onShowToast={showToast}
            />
          )}

          {/* TAB: CUSTOMER DIRECTORY & LIFETIME RECORDS */}
          {activeTab === 'customers' && (
            <AdminCustomersManager
              onShowToast={showToast}
            />
          )}

          {/* TAB: COUPONS & PROMO CODES MANAGER */}
          {activeTab === 'coupons' && (
            <AdminCouponsManager />
          )}

          {/* TAB: SMART DELIVERY ESTIMATION SYSTEM */}
          {activeTab === 'delivery' && (
            <AdminDeliveryManager
              onShowToast={showToast}
            />
          )}

          {/* TAB 1: PRODUCTS INVENTORY */}
          {activeTab === 'products' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              
              {/* Top Controls */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white font-serif">Product Inventory Management</h2>
                  <p className="text-xs text-slate-400 font-light mt-0.5">
                    Add unlimited products, attach HD videos, upload multiple images, update prices & reorder display order.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClearSampleProducts}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-950 hover:bg-rose-950/80 border border-slate-800 hover:border-rose-500/40 text-slate-400 hover:text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    title="Remove sample items to populate real store inventory"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear Sample Products</span>
                  </button>

                  <button
                    onClick={() => {
                      setEditingProduct(null);
                      setIsProductModalOpen(true);
                    }}
                    className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 flex items-center gap-2 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add New Product</span>
                  </button>
                </div>
              </div>

              {/* Search & Filter Bar */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative md:col-span-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search product name, brand, or specs..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3 pointer-events-none" />
                </div>

                <div>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Categories ({products.length})</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="py-3.5 px-4 w-12 text-center">Order</th>
                        <th className="py-3.5 px-4">Product Info</th>
                        <th className="py-3.5 px-4">Category</th>
                        <th className="py-3.5 px-4">Price / Rate</th>
                        <th className="py-3.5 px-4">Media</th>
                        <th className="py-3.5 px-4">Badges</th>
                        <th className="py-3.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/80">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((prod, index) => {
                          const realIndex = products.findIndex(p => p.id === prod.id);
                          const hasVideo = prod.videos && prod.videos.length > 0;
                          const imageCount = (prod.images?.length || 0) + 1;

                          return (
                            <tr key={prod.id} className="hover:bg-slate-800/40 transition-colors">
                              {/* Order Controls */}
                              <td className="py-3 px-2 text-center">
                                <div className="flex flex-col items-center gap-1">
                                  <button
                                    onClick={() => handleMoveProduct(realIndex, 'up')}
                                    disabled={realIndex === 0}
                                    className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent"
                                    title="Move Up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveProduct(realIndex, 'down')}
                                    disabled={realIndex === products.length - 1}
                                    className="p-1 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 disabled:hover:bg-transparent"
                                    title="Move Down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>

                              {/* Product Info */}
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={prod.image}
                                    alt={prod.name}
                                    className="w-12 h-12 rounded-lg object-cover bg-slate-950 border border-slate-800 shrink-0"
                                  />
                                  <div>
                                    <span className="font-bold text-white block font-serif leading-tight">
                                      {prod.name}
                                    </span>
                                    <span className="text-[10px] text-blue-400 font-mono">
                                      {prod.brand || 'ZAFAR SARWAR TRADERS'}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Category */}
                              <td className="py-3 px-4 text-slate-400">
                                <span className="px-2.5 py-1 rounded-md bg-slate-950 border border-slate-800 text-[11px]">
                                  {prod.category}
                                </span>
                              </td>

                              {/* Price */}
                              <td className="py-3 px-4 text-emerald-400 font-semibold font-mono">
                                {prod.price || 'Call for Price'}
                              </td>

                              {/* Media */}
                              <td className="py-3 px-4 space-y-1">
                                <div className="flex items-center gap-1.5 text-[11px] text-slate-300">
                                  <ImageIcon className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                                  <span>{imageCount} Image{imageCount > 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[11px]">
                                  <Video className={`w-3.5 h-3.5 shrink-0 ${hasVideo ? 'text-rose-400' : 'text-slate-600'}`} />
                                  <span className={hasVideo ? 'text-rose-300 font-medium' : 'text-slate-500'}>
                                    {hasVideo ? `${prod.videos!.length} Video(s)` : 'No Video'}
                                  </span>
                                </div>
                              </td>

                              {/* Badges */}
                              <td className="py-3 px-4">
                                <div className="flex flex-wrap gap-1">
                                  {prod.isFeatured && (
                                    <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-500/30 text-blue-300 text-[10px] font-bold">
                                      Featured
                                    </span>
                                  )}
                                  {prod.badge && (
                                    <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-700 text-slate-300 text-[10px] font-bold">
                                      {prod.badge}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Actions */}
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => handleToggleProductHidden(prod)}
                                    className={`p-1.5 rounded-lg border transition-colors ${
                                      prod.isHidden 
                                        ? 'bg-amber-950/60 border-amber-800 text-amber-300' 
                                        : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                                    }`}
                                    title={prod.isHidden ? "Show Product on Website" : "Hide Product from Website"}
                                  >
                                    {prod.isHidden ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                  </button>
                                  <button
                                    onClick={() => handleDuplicateProduct(prod)}
                                    className="p-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 hover:text-white hover:bg-emerald-800 transition-colors"
                                    title="Duplicate Product"
                                  >
                                    <Copy className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingProduct(prod);
                                      setIsProductModalOpen(true);
                                    }}
                                    className="p-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white transition-colors"
                                    title="Edit Product"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteProduct(prod.id)}
                                    className="p-1.5 rounded-lg bg-rose-950/60 hover:bg-rose-900 text-rose-300 hover:text-white transition-colors"
                                    title="Delete Product"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500 italic">
                            No products found matching your filter criteria. Click "Add New Product" to create your first item!
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CATEGORIES MANAGEMENT */}
          {activeTab === 'categories' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
                    <Layers className="w-5 h-5 text-blue-400" />
                    <span>Category Management & Taxonomy</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-light mt-0.5">
                    Total {categories.length} Categories • Live search, drag/move display reordering, custom cover images, and bulk actions.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setEditingCategory(null);
                    setIsCategoryModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 flex items-center gap-2 transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Category</span>
                </button>
              </div>

              {/* Search, Filter & Bulk Controls Bar */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  
                  {/* Live Search */}
                  <div className="relative">
                    <input
                      type="text"
                      value={catSearch}
                      onChange={(e) => setCatSearch(e.target.value)}
                      placeholder="Live search categories..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  </div>

                  {/* Group Filter */}
                  <select
                    value={catGroupFilter}
                    onChange={(e) => setCatGroupFilter(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Group Departments</option>
                    <option value="sanitary">Sanitaryware & Vanities</option>
                    <option value="faucets_showers">Faucets & Showers</option>
                    <option value="plumbing">Plumbing & Pipes</option>
                    <option value="paints_materials">Paints & Wall Putty</option>
                    <option value="construction">Cement & Construction</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={catStatusFilter}
                    onChange={(e) => setCatStatusFilter(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="inactive">Inactive Only</option>
                    <option value="featured">Featured Categories</option>
                  </select>

                  {/* Select All Checkbox button */}
                  <button
                    type="button"
                    onClick={handleSelectAllCategories}
                    className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    {selectedCatIds.length === filteredCategories.length && filteredCategories.length > 0 ? (
                      <CheckSquare className="w-4 h-4 text-blue-400" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-500" />
                    )}
                    <span>
                      {selectedCatIds.length === filteredCategories.length && filteredCategories.length > 0
                        ? 'Deselect All'
                        : `Select All (${filteredCategories.length})`}
                    </span>
                  </button>

                </div>

                {/* Bulk Action Toolbar (shows when items are selected) */}
                {selectedCatIds.length > 0 && (
                  <div className="p-3 rounded-xl bg-blue-950/60 border border-blue-500/40 flex flex-wrap items-center justify-between gap-3 animate-fadeIn">
                    <span className="text-xs font-bold text-blue-300 flex items-center gap-1.5 font-mono">
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                      <span>{selectedCatIds.length} Category(s) Selected</span>
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={handleBulkActivateCategories}
                        className="px-3 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-500/30 text-emerald-300 text-xs font-semibold transition-colors"
                      >
                        Enable / Activate
                      </button>

                      <button
                        onClick={handleBulkDeactivateCategories}
                        className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                      >
                        Disable / Hide
                      </button>

                      <button
                        onClick={handleBulkDuplicateCategories}
                        className="px-3 py-1.5 rounded-lg bg-blue-900 hover:bg-blue-800 border border-blue-500/40 text-blue-200 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Duplicate</span>
                      </button>

                      <button
                        onClick={() => setBulkDeleteConfirmOpen(true)}
                        className="px-3 py-1.5 rounded-lg bg-rose-950/90 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Bulk Delete</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Toast Notification Banner */}
              {toastMessage && (
                <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-semibold flex items-center gap-2 animate-fadeIn shadow-xl">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{toastMessage}</span>
                </div>
              )}

              {/* Categories Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategories.map((cat, idx) => {
                  const productCount = (products || []).filter(p => 
                    p && (p.categoryId === cat.id || (p.category && cat.name && p.category.toLowerCase() === cat.name.toLowerCase()))
                  ).length;

                  const isSelected = selectedCatIds.includes(cat.id);
                  const isActive = cat.isActive !== false;

                  return (
                    <div 
                      key={cat.id} 
                      className={`p-4 rounded-2xl bg-slate-900 border transition-all space-y-3 flex flex-col justify-between relative group ${
                        isSelected 
                          ? 'border-blue-500 ring-2 ring-blue-500/30 bg-blue-950/20' 
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {/* Top Bar with Checkbox, Group & Order */}
                      <div>
                        <div className="relative h-36 w-full rounded-xl overflow-hidden bg-slate-950 mb-3 border border-slate-800">
                          <img 
                            src={cat.image} 
                            alt={cat.name} 
                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                              !isActive ? 'opacity-40 grayscale' : ''
                            }`} 
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                          
                          {/* Selection Checkbox */}
                          <button
                            type="button"
                            onClick={() => handleToggleSelectCategory(cat.id)}
                            className="absolute top-2 left-2 p-1.5 rounded-lg bg-slate-950/80 border border-slate-800 text-white hover:bg-blue-600 transition-colors shadow-md"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-400" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </button>

                          {/* Display Order Badge */}
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-800 text-slate-300 text-[10px] font-mono">
                            Order #{cat.displayOrder || idx + 1}
                          </span>

                          {/* Group Pill */}
                          <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-blue-950/90 border border-blue-500/40 text-blue-300 text-[10px] font-mono">
                            {cat.group}
                          </span>

                          {/* Product Counter Badge */}
                          <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-[10px] font-mono font-bold">
                            {productCount} Products
                          </span>
                        </div>

                        {/* Title & Badges */}
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-white font-serif">{cat.name}</h3>
                          
                          <div className="flex items-center gap-1 shrink-0">
                            {cat.badge && (
                              <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[9px] font-bold text-amber-400 uppercase">
                                {cat.badge}
                              </span>
                            )}
                            {cat.isFeatured && (
                              <span className="px-1.5 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-[9px] font-bold text-cyan-300 uppercase">
                                Featured
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {cat.description}
                        </p>
                      </div>

                      {/* Controls Footer */}
                      <div className="pt-3 border-t border-slate-800/80 space-y-2">
                        
                        {/* Status Toggle & Reorder */}
                        <div className="flex items-center justify-between text-xs">
                          
                          {/* Active Toggle button */}
                          <button
                            type="button"
                            onClick={() => handleToggleCategoryActive(cat)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors ${
                              isActive 
                                ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300 hover:bg-emerald-900' 
                                : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-white'
                            }`}
                          >
                            {isActive ? '● Active' : '○ Inactive'}
                          </button>

                          {/* Move Up / Down */}
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveCategory(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveCategory(idx, 'down')}
                              disabled={idx === filteredCategories.length - 1}
                              className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                        </div>

                        {/* Edit, Duplicate & Delete Buttons */}
                        <div className="flex items-center justify-between gap-1 pt-1">
                          
                          <button
                            onClick={() => handleDuplicateCategory(cat)}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                            title="Duplicate Category"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingCategory(cat);
                                setIsCategoryModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => setDeleteCategoryConfirm(cat)}
                              className="px-3 py-1.5 rounded-xl bg-rose-950/80 text-rose-300 hover:bg-rose-900 hover:text-white text-xs font-bold border border-rose-500/40 transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>

                        </div>

                      </div>

                    </div>
                  );
                })}
              </div>

              {filteredCategories.length === 0 && (
                <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400">
                  <p className="text-sm">No categories match your search filter "{catSearch}".</p>
                  <button
                    onClick={() => { setCatSearch(''); setCatGroupFilter('all'); setCatStatusFilter('all'); }}
                    className="mt-2 text-xs text-blue-400 underline font-bold"
                  >
                    Reset Category Filters
                  </button>
                </div>
              )}

            </div>
          )}

          {/* TAB: BRAND PARTNERS MANAGEMENT */}
          {activeTab === 'brands' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-blue-400" />
                    <span>Brand Partners & Manufacturers ({brands.length})</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-light mt-0.5">
                    Manage authorized sanitaryware, pipe, and paint brand partnerships displayed on the website.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingBrand(null);
                    setIsBrandModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Brand Partner</span>
                </button>
              </div>

              {/* Brand Search Bar */}
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Search brand partners by name or slug..."
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>

              {/* Brands Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(brands || [])
                  .filter(b => b && (b.name || '').toLowerCase().includes((brandSearch || '').toLowerCase()))
                  .map((brand, idx) => {
                    const linkedCount = (products || []).filter(
                      p => p && (p.brandId === brand.id || (p.brand && brand.name && p.brand.toLowerCase() === brand.name.toLowerCase()))
                    ).length;

                    return (
                      <div
                        key={brand.id}
                        className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition-all"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-14 h-14 rounded-xl bg-slate-950 border border-slate-800 p-1.5 shrink-0 flex items-center justify-center overflow-hidden">
                            <img
                              src={brand.logo}
                              alt={brand.name}
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover rounded-lg"
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-sm font-bold text-white font-serif truncate">
                                {brand.name}
                              </h3>
                              {brand.isFeatured && (
                                <span className="px-1.5 py-0.5 rounded bg-blue-950 border border-blue-500/40 text-[9px] font-bold text-blue-300">
                                  Featured
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                              {linkedCount} linked products
                            </p>
                            <p className="text-xs text-slate-400 line-clamp-2 mt-1">
                              {brand.description}
                            </p>
                          </div>
                        </div>

                        {/* Controls */}
                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveBrand(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveBrand(idx, 'down')}
                              disabled={idx === brands.length - 1}
                              className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingBrand(brand);
                                setIsBrandModalOpen(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteBrand(brand.id)}
                              className="px-3 py-1.5 rounded-xl bg-rose-950/80 text-rose-300 hover:bg-rose-900 hover:text-white text-xs font-bold border border-rose-500/40 transition-colors flex items-center gap-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB: CONTACT PERSONNEL MANAGEMENT */}
          {activeTab === 'contacts' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
                    <Users className="w-5 h-5 text-amber-400" />
                    <span>Contact Persons & Management Team</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-light mt-0.5">
                    Add, edit, reorder or hide contacts (CEO, Sanitary Manager, Accounts, Sales) that appear on the website.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingContact(null);
                    setIsContactModalOpen(true);
                  }}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 text-xs font-black shadow-lg shadow-amber-950 flex items-center gap-2 transition-all shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Contact Person</span>
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Search contact person by name, designation, or department..."
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
              </div>

              {/* Contacts Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {(contacts || [])
                  .filter(c => c && (
                    (c.fullName || '').toLowerCase().includes((contactSearch || '').toLowerCase()) ||
                    (c.designation || '').toLowerCase().includes((contactSearch || '').toLowerCase()) ||
                    (c.department || '').toLowerCase().includes((contactSearch || '').toLowerCase())
                  ))
                  .map((contact, idx) => {
                    return (
                      <div
                        key={contact.id}
                        className={`p-5 rounded-2xl bg-slate-900 border transition-all flex flex-col justify-between space-y-4 shadow-xl relative ${
                          contact.isPrimary ? 'border-amber-500/50 bg-amber-950/10' : 'border-slate-800'
                        } ${contact.isHidden ? 'opacity-60' : ''}`}
                      >
                        {contact.isPrimary && (
                          <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-500 text-slate-950 font-black text-[9px] uppercase px-3 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            <span>Primary Contact</span>
                          </div>
                        )}

                        <div className="flex items-start gap-3.5 pt-2">
                          {contact.profilePhoto ? (
                            <img
                              src={contact.profilePhoto}
                              alt={contact.fullName}
                              className="w-14 h-14 rounded-2xl object-cover border border-slate-700/80 shadow-md shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-amber-400 font-bold text-lg font-serif shrink-0">
                              {contact.fullName.charAt(0)}
                            </div>
                          )}

                          <div className="flex-1 min-w-0 pr-12">
                            <h3 className="text-sm font-bold text-white truncate">
                              {contact.fullName}
                            </h3>
                            <div className="text-[11px] font-bold text-amber-400 truncate">
                              {contact.designation}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate">
                              {contact.department}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-1.5 pt-3 border-t border-slate-800/80 text-xs font-mono text-slate-300">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Mobile:</span>
                            <span className="text-white font-bold">{contact.mobileNumber}</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">WhatsApp:</span>
                            <span className="text-emerald-400 font-bold">{contact.whatsappNumber}</span>
                          </div>
                          {contact.workingHours && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400">Hours:</span>
                              <span className="text-slate-300">{contact.workingHours}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Status:</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              contact.availabilityStatus === 'Available' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' :
                              contact.availabilityStatus === 'Busy' ? 'bg-amber-950 text-amber-300 border border-amber-500/30' :
                              'bg-slate-950 text-slate-400 border border-slate-800'
                            }`}>
                              {contact.availabilityStatus}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleMoveContact(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveContact(idx, 'down')}
                              disabled={idx === contacts.length - 1}
                              className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryContact(contact.id)}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                                contact.isPrimary 
                                  ? 'bg-amber-500 text-slate-950 border-amber-400' 
                                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-amber-300'
                              }`}
                              title={contact.isPrimary ? 'Primary Contact' : 'Set as Primary Contact'}
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleToggleContactHidden(contact)}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition-colors ${
                                contact.isHidden 
                                  ? 'bg-rose-950/80 text-rose-300 border-rose-500/30' 
                                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                              }`}
                              title={contact.isHidden ? 'Hidden from Website (Click to Show)' : 'Visible on Website (Click to Hide)'}
                            >
                              {contact.isHidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setEditingContact(contact);
                                setIsContactModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white border border-blue-500/30 transition-colors"
                              title="Edit Contact Person"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeleteContact(contact.id)}
                              className="p-1.5 rounded-lg bg-rose-950/80 text-rose-300 hover:bg-rose-900 hover:text-white border border-rose-500/40 transition-colors"
                              title="Delete Contact Person"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB: BUSINESS STATISTICS MANAGEMENT */}
          {activeTab === 'statistics' && (
            <div className="space-y-6 max-w-6xl mx-auto">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <div>
                  <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-400" />
                    <span>Business Statistics & Milestones ({stats.length})</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-light mt-0.5">
                    Customize count-up milestone numbers (Products, Brands, Years Experience, Customers) on the homepage.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setEditingStat(null);
                    setIsStatModalOpen(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 transition-all flex items-center justify-center gap-2 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add New Counter</span>
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map((stat, idx) => (
                  <div
                    key={stat.id}
                    className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col justify-between space-y-4 shadow-lg hover:border-slate-700 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-blue-400 font-mono">
                          Order #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          {stat.enableAnimation !== false && (
                            <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500/30 text-[9px] font-bold text-emerald-300">
                              Animated
                            </span>
                          )}
                          {stat.isHidden && (
                            <span className="px-2 py-0.5 rounded bg-rose-950 border border-rose-500/30 text-[9px] font-bold text-rose-300">
                              Hidden
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-3xl font-extrabold text-white font-serif">
                        {stat.prefix}{(stat.numberValue ?? 0).toLocaleString()}{stat.suffix}
                      </div>

                      <h3 className="text-sm font-bold text-slate-200">
                        {stat.title}
                      </h3>

                      {stat.description && (
                        <p className="text-xs text-slate-400 font-light">
                          {stat.description}
                        </p>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleMoveStat(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveStat(idx, 'down')}
                          disabled={idx === stats.length - 1}
                          className="p-1 rounded bg-slate-950 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingStat(stat);
                            setIsStatModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-blue-600/20 text-blue-300 hover:bg-blue-600 hover:text-white text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleDeleteStat(stat.id)}
                          className="px-3 py-1.5 rounded-xl bg-rose-950/80 text-rose-300 hover:bg-rose-900 hover:text-white text-xs font-bold border border-rose-500/40 transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: BANNERS, CONTACT & SEO */}
          {activeTab === 'banners_seo' && (
            <div className="max-w-4xl mx-auto space-y-6">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <h2 className="text-xl font-bold text-white font-serif">Banners, Contact Information & SEO</h2>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Update homepage headline text, phone numbers, WhatsApp line (+92 310 8002863), store location, and SEO settings.
                </p>
              </div>

              {configSuccessMsg && (
                <div className="p-4 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <span>{configSuccessMsg}</span>
                </div>
              )}

              <form onSubmit={handleSaveConfigForm} className="space-y-6">
                
                {/* Store Branding & Banners */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Homepage Banner & Branding</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Business Name</label>
                      <input
                        type="text"
                        value={configForm.name}
                        onChange={(e) => setConfigForm({ ...configForm, name: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Store Tagline</label>
                      <input
                        type="text"
                        value={configForm.tagline}
                        onChange={(e) => setConfigForm({ ...configForm, tagline: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Top Announcement Bar Banner</label>
                    <input
                      type="text"
                      value={configForm.announcementText || 'Showroom Open Today: Monday – Saturday: 8:00 AM – 9:00 PM'}
                      onChange={(e) => setConfigForm({ ...configForm, announcementText: e.target.value })}
                      placeholder="e.g. Special Discount on Hansgrohe Showers This Week!"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Contact & WhatsApp Management */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Contact Lines & WhatsApp Management</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Primary Showroom Phone</label>
                      <input
                        type="text"
                        value={configForm.phone}
                        onChange={(e) => setConfigForm({ ...configForm, phone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Main WhatsApp Line</label>
                      <input
                        type="text"
                        value={configForm.whatsapp}
                        onChange={(e) => setConfigForm({ ...configForm, whatsapp: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Sales Inquiry WhatsApp</label>
                      <input
                        type="text"
                        value={configForm.salesWhatsapp || configForm.whatsapp}
                        onChange={(e) => setConfigForm({ ...configForm, salesWhatsapp: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Order Status WhatsApp</label>
                      <input
                        type="text"
                        value={configForm.orderWhatsapp || configForm.whatsapp}
                        onChange={(e) => setConfigForm({ ...configForm, orderWhatsapp: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Customer Support WhatsApp</label>
                      <input
                        type="text"
                        value={configForm.supportWhatsapp || configForm.whatsapp}
                        onChange={(e) => setConfigForm({ ...configForm, supportWhatsapp: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Delivery Logistics Phone</label>
                      <input
                        type="text"
                        value={configForm.deliveryPhone || configForm.phone}
                        onChange={(e) => setConfigForm({ ...configForm, deliveryPhone: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Official Email Address</label>
                      <input
                        type="email"
                        value={configForm.email}
                        onChange={(e) => setConfigForm({ ...configForm, email: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Store Address</label>
                      <input
                        type="text"
                        value={configForm.address}
                        onChange={(e) => setConfigForm({ ...configForm, address: e.target.value })}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Google Maps Embed Embed URL</label>
                    <input
                      type="text"
                      value={configForm.googleMapEmbedUrl}
                      onChange={(e) => setConfigForm({ ...configForm, googleMapEmbedUrl: e.target.value })}
                      placeholder="https://maps.google.com/maps?q=..."
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Business Hours & Operating Schedule */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Business Hours & Operating Schedule</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Opening Time</label>
                      <input
                        type="text"
                        value={configForm.openingTime || '08:00 AM'}
                        onChange={(e) => setConfigForm({ ...configForm, openingTime: e.target.value })}
                        placeholder="e.g. 08:00 AM"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Daily Closing Time</label>
                      <input
                        type="text"
                        value={configForm.closingTime || '09:00 PM'}
                        onChange={(e) => setConfigForm({ ...configForm, closingTime: e.target.value })}
                        placeholder="e.g. 09:00 PM"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Working Days</label>
                      <input
                        type="text"
                        value={configForm.workingDays || 'Monday – Saturday'}
                        onChange={(e) => setConfigForm({ ...configForm, workingDays: e.target.value })}
                        placeholder="e.g. Monday – Saturday"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Same-Day Cut-Off Time</label>
                      <input
                        type="text"
                        value={configForm.cutOffTime || '04:00 PM'}
                        onChange={(e) => setConfigForm({ ...configForm, cutOffTime: e.target.value })}
                        placeholder="e.g. 04:00 PM"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-slate-200">Holiday / Special Closure Banner Notice</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!configForm.isHolidayNotice}
                          onChange={(e) => setConfigForm({ ...configForm, isHolidayNotice: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                      </label>
                    </div>

                    {configForm.isHolidayNotice && (
                      <input
                        type="text"
                        value={configForm.holidayNoticeText || ''}
                        onChange={(e) => setConfigForm({ ...configForm, holidayNoticeText: e.target.value })}
                        placeholder="e.g. Showroom closed on Eid-ul-Adha. Orders placed online will dispatch on Saturday."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-amber-500/40 text-xs text-amber-200"
                      />
                    )}
                  </div>
                </div>

                {/* CMS Policies Management */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    <span>Store Policies & Legal CMS</span>
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Privacy Policy</label>
                      <textarea
                        rows={3}
                        value={configForm.privacyPolicy || ''}
                        onChange={(e) => setConfigForm({ ...configForm, privacyPolicy: e.target.value })}
                        placeholder="Privacy policy content..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Terms & Conditions</label>
                      <textarea
                        rows={3}
                        value={configForm.termsConditions || ''}
                        onChange={(e) => setConfigForm({ ...configForm, termsConditions: e.target.value })}
                        placeholder="Terms and conditions..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Return & Refund Policy</label>
                      <textarea
                        rows={3}
                        value={configForm.returnPolicy || ''}
                        onChange={(e) => setConfigForm({ ...configForm, returnPolicy: e.target.value })}
                        placeholder="Return policy details..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">Delivery & Shipping Policy</label>
                      <textarea
                        rows={3}
                        value={configForm.shippingPolicy || ''}
                        onChange={(e) => setConfigForm({ ...configForm, shippingPolicy: e.target.value })}
                        placeholder="Shipping policy details..."
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* SEO & Admin Security */}
                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                  <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                    <Globe className="w-4 h-4" />
                    <span>Search Engine Optimization (SEO) & Security</span>
                  </h3>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">SEO Title</label>
                    <input
                      type="text"
                      value={configForm.seoTitle || 'ZAFAR SARWAR TRADERS | Luxury Sanitaryware, Faucets & Building Supplies'}
                      onChange={(e) => setConfigForm({ ...configForm, seoTitle: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Admin Security PIN / Password</label>
                    <div className="relative max-w-xs">
                      <input
                        type="password"
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono tracking-widest"
                      />
                      <Key className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-xl shadow-blue-950 transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save All CMS Banners & Settings</span>
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* TAB 4: GALLERY MANAGEMENT */}
          {activeTab === 'gallery' && (
            <div className="space-y-6 max-w-5xl mx-auto">
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
                <h2 className="text-xl font-bold text-white font-serif">Showroom & Project Gallery</h2>
                <p className="text-xs text-slate-400 font-light mt-0.5">
                  Manage real showroom interior photos and project execution galleries shown on the homepage.
                </p>
              </div>

              {/* Add Gallery Form with Device Image Upload */}
              <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Add Showroom / Project Photo</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Photo Title (e.g. Master Bathroom Suite)"
                    value={newGalleryTitle}
                    onChange={(e) => setNewGalleryTitle(e.target.value)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />

                  <select
                    value={newGalleryCat || 'sanitary'}
                    onChange={(e) => setNewGalleryCat(e.target.value as any)}
                    className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="sanitary">Luxury Bathrooms</option>
                    <option value="faucets">Faucets & Mixers</option>
                    <option value="paints">Paints & Decor</option>
                    <option value="materials">Building Materials</option>
                  </select>
                </div>

                <MultiImageUploader
                  label="Showroom Gallery Photos (Drag & Drop or Browse)"
                  images={newGalleryImg ? [newGalleryImg] : []}
                  onChange={(imgs) => {
                    if (imgs.length > 0) {
                      setNewGalleryImg(imgs[0]);
                    } else {
                      setNewGalleryImg('');
                    }
                  }}
                  maxFiles={1}
                />

                <button
                  type="button"
                  onClick={handleAddGalleryItem}
                  disabled={!newGalleryTitle || !newGalleryImg}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Photo to Showroom Gallery</span>
                </button>
              </div>

              {/* Gallery Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {gallery.map((item) => (
                  <div key={item.id} className="relative group rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden">
                    <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent p-4 flex flex-col justify-end">
                      <h4 className="text-sm font-bold text-white font-serif">{item.title}</h4>
                      <p className="text-[11px] text-slate-400">{item.description}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteGalleryItem(item.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white transition-all shadow-lg"
                      title="Delete Photo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: SMART TOOLS HUB (5 TOOLS) */}
          {activeTab === 'smart_tools' && (
            <AdminSmartToolsManager
              settings={smartToolsSettingsState}
              onSaveSettings={async (updated) => {
                setSmartToolsSettingsState(updated);
                await saveSmartToolsSettings(updated);
                if (onSaveSmartToolsSettings) onSaveSmartToolsSettings(updated);
                showToast('Smart Tools configuration updated permanently in Supabase!');
              }}
            />
          )}

          {/* TAB: SMART CONSTRUCTION & FITTING BUILDER */}
          {activeTab === 'construction_builder' && (
            <AdminConstructionBuilderManager
              products={products}
              config={fittingConfigState}
              onSaveConfig={async (updated) => {
                setFittingConfigState(updated);
                const res = await saveFittingBuilderConfig(updated);
                if (onSaveFittingBuilderConfig) await onSaveFittingBuilderConfig(updated);
                showToast('Smart Construction & Fitting Builder configuration saved permanently in Supabase!');
                return res;
              }}
            />
          )}

          {/* TAB: EASY BATHROOM PLANNER */}
          {activeTab === 'planner' && (
            <AdminPlannerManager
              products={products}
              config={plannerConfig}
              onSaveConfig={(updated) => {
                setPlannerConfig(updated);
                savePlannerConfig(updated);
              }}
            />
          )}

          {/* TAB: CEMENT & MATERIAL ESTIMATOR */}
          {activeTab === 'estimator' && (
            <AdminEstimatorManager
              config={estimatorConfig}
              onSaveConfig={(updated) => {
                setEstimatorConfig(updated);
                saveBuildMaterialEstimatorConfig(updated);
              }}
            />
          )}

          {/* TAB: AI SHOPPING ASSISTANT */}
          {activeTab === 'ai_assistant' && (
            <AdminAiAssistantManager
              config={aiAssistantConfig}
              onSaveConfig={(updated) => {
                setAiAssistantConfig(updated);
                saveAiAssistantConfig(updated);
              }}
            />
          )}

          {/* TAB: THEME MANAGEMENT */}
          {activeTab === 'themes' && (
            <AdminThemeManager
              themeSettings={themeSettings}
              onSaveThemeSettings={(updated) => {
                setThemeSettings(updated);
                saveThemeSettings(updated);
              }}
            />
          )}

          {/* TAB: PRICING APPEARANCE & TYPOGRAPHY */}
          {activeTab === 'pricing_appearance' && (
            <AdminPricingAppearanceManager
              onSaved={() => {
                showToast('Product pricing typography saved and updated across showroom!');
              }}
            />
          )}

        </main>

      </div>

      {/* RICH PRODUCT MODAL INSIDE CMS */}
      {isProductModalOpen && (
        <AdminProductModal
          product={editingProduct}
          categories={categories}
          brands={brands}
          allProducts={products}
          onSave={handleSaveSingleProduct}
          onDelete={handleDeleteProduct}
          onClose={() => {
            setIsProductModalOpen(false);
            setEditingProduct(null);
          }}
        />
      )}

      {/* CATEGORY EDIT MODAL */}
      {isCategoryModalOpen && (
        <AdminCategoryModal
          category={editingCategory}
          onSave={handleSaveCategory}
          onClose={() => {
            setIsCategoryModalOpen(false);
            setEditingCategory(null);
          }}
        />
      )}

      {/* BRAND PARTNER EDIT MODAL */}
      {isBrandModalOpen && (
        <AdminBrandModal
          brand={editingBrand}
          onSave={handleSaveBrand}
          onDelete={handleDeleteBrand}
          onClose={() => {
            setIsBrandModalOpen(false);
            setEditingBrand(null);
          }}
        />
      )}

      {/* SINGLE CATEGORY DELETE CONFIRMATION POPUP */}
      {deleteCategoryConfirm && (
        <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex justify-center items-start sm:items-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full my-auto p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Permanently Delete Category?</h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">ID: {deleteCategoryConfirm.id}</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                Are you sure you want to permanently delete <strong className="text-white font-serif">{deleteCategoryConfirm.name}</strong>?
              </p>
              <p className="text-[11px] text-rose-400 font-mono">
                ⚠ Warning: This category will be removed instantly from the catalog and homepage. Associated products will remain in store catalog.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteCategoryConfirm(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteCategory}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Permanent Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BULK CATEGORY DELETE CONFIRMATION POPUP */}
      {bulkDeleteConfirmOpen && (
        <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex justify-center items-start sm:items-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full my-auto p-6 space-y-4 shadow-2xl relative max-h-[90vh] flex flex-col overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-600/20 border border-rose-500/40 text-rose-400">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Bulk Delete Categories?</h3>
                <p className="text-xs text-rose-400 font-bold">{selectedCatIds.length} categories selected</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-2">
              <p>
                Are you sure you want to permanently delete <strong className="text-white">{selectedCatIds.length} selected categories</strong>?
              </p>
              <p className="text-[11px] text-slate-400">
                This operation will permanently purge these category entries from the system.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setBulkDeleteConfirmOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmBulkDeleteCategories}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete All Selected ({selectedCatIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BRAND MODAL */}
      {isBrandModalOpen && (
        <AdminBrandModal
          brand={editingBrand}
          onSave={handleSaveBrand}
          onDelete={handleDeleteBrand}
          onClose={() => {
            setIsBrandModalOpen(false);
            setEditingBrand(null);
          }}
        />
      )}

      {/* STAT MODAL */}
      {isStatModalOpen && (
        <AdminStatModal
          stat={editingStat}
          onSave={handleSaveStat}
          onDelete={handleDeleteStat}
          onClose={() => {
            setIsStatModalOpen(false);
            setEditingStat(null);
          }}
        />
      )}

      {/* CONTACT PERSON MODAL */}
      {isContactModalOpen && (
        <AdminContactModal
          contact={editingContact}
          onSave={handleSaveContact}
          onDelete={handleDeleteContact}
          onClose={() => {
            setIsContactModalOpen(false);
            setEditingContact(null);
          }}
        />
      )}

    </div>
  );
};

// Sub-component: Comprehensive Product Editor Modal with Uploads, Videos & Specs
const ProductEditorModal: React.FC<{
  product: Product | null;
  categories: ProductCategory[];
  onSave: (product: Product) => void;
  onClose: () => void;
}> = ({ product, categories, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    id: product?.id || `prod-${Date.now()}`,
    name: product?.name || '',
    category: product?.category || categories[0]?.name || 'Sanitaryware',
    categoryId: product?.categoryId || categories[0]?.id || 'bathroom-accessories',
    brand: product?.brand || 'ZAFAR SARWAR TRADERS',
    price: product?.price || 'PKR Call for Price',
    image: product?.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    images: product?.images || [],
    description: product?.description || '',
    features: product?.features || ['100% Genuine Certified', 'Warranty Included'],
    specs: product?.specs || { 'Material': 'Brass / Ceramic', 'Origin': 'Imported' },
    badge: product?.badge || 'LUXURY',
    isFeatured: product?.isFeatured ?? true,
    isNew: product?.isNew ?? false,
    videos: product?.videos || []
  });

  const [featureInput, setFeatureInput] = useState('');
  const [specKey, setSpecKey] = useState('');
  const [specValue, setSpecValue] = useState('');
  const [extraImageUrl, setExtraImageUrl] = useState('');

  // Video Inputs
  const [vidTitle, setVidTitle] = useState('');
  const [vidUrl, setVidUrl] = useState('');
  const [vidType, setVidType] = useState<'mp4' | 'youtube' | 'vimeo' | 'embed'>('youtube');

  // Handle image upload from file system (Data URL base64 conversion)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'main' | 'extra') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Url = reader.result as string;
      if (target === 'main') {
        setFormData(prev => ({ ...prev, image: base64Url }));
      } else {
        setFormData(prev => ({ ...prev, images: [...(prev.images || []), base64Url] }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddFeature = () => {
    if (!featureInput.trim()) return;
    setFormData(prev => ({
      ...prev,
      features: [...(prev.features || []), featureInput.trim()]
    }));
    setFeatureInput('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== idx)
    }));
  };

  const handleAddSpec = () => {
    if (!specKey.trim() || !specValue.trim()) return;
    setFormData(prev => ({
      ...prev,
      specs: { ...(prev.specs || {}), [specKey.trim()]: specValue.trim() }
    }));
    setSpecKey('');
    setSpecValue('');
  };

  const handleRemoveSpec = (key: string) => {
    setFormData(prev => {
      const copy = { ...(prev.specs || {}) };
      delete copy[key];
      return { ...prev, specs: copy };
    });
  };

  const handleAddExtraImage = () => {
    if (!extraImageUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), extraImageUrl.trim()]
    }));
    setExtraImageUrl('');
  };

  const handleRemoveExtraImage = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).filter((_, i) => i !== idx)
    }));
  };

  const handleAddVideo = () => {
    if (!vidUrl.trim()) return;
    const newVideo: ProductVideo = {
      id: `vid-${Date.now()}`,
      title: vidTitle.trim() || 'Product Demonstration Video',
      type: vidType,
      url: vidUrl.trim()
    };
    setFormData(prev => ({
      ...prev,
      videos: [...(prev.videos || []), newVideo]
    }));
    setVidTitle('');
    setVidUrl('');
  };

  const handleRemoveVideo = (vId: string) => {
    setFormData(prev => ({
      ...prev,
      videos: (prev.videos || []).filter(v => v.id !== vId)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId) return;

    const selectedCat = categories.find(c => c.id === formData.categoryId);

    const finalProduct: Product = {
      id: formData.id || `prod-${Date.now()}`,
      name: formData.name,
      category: selectedCat ? selectedCat.name : formData.category || 'Sanitaryware',
      categoryId: formData.categoryId,
      brand: formData.brand || 'ZAFAR SARWAR TRADERS',
      price: formData.price || 'Call for Price',
      image: formData.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      images: formData.images || [],
      description: formData.description || 'Luxury sanitaryware item from Zafar Sarwar Traders.',
      features: formData.features && formData.features.length > 0 ? formData.features : ['100% Genuine Quality'],
      specs: formData.specs || {},
      badge: formData.badge,
      isFeatured: formData.isFeatured,
      isNew: formData.isNew,
      videos: formData.videos || []
    };

    onSave(finalProduct);
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex justify-center items-start sm:items-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full my-auto shadow-2xl relative p-6 sm:p-8 max-h-[90vh] flex flex-col overflow-hidden">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">CMS Product Editor</span>
          <h3 className="text-2xl font-bold text-white font-serif">
            {product ? 'Edit Product Details' : 'Add New Product to Store Catalog'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-2 flex-1 min-h-0">
          
          {/* Row 1: Title & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product Title *</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Hansgrohe Axor Raindance Shower"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand Name</label>
              <input
                type="text"
                value={formData.brand || ''}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder="e.g., Kohler, Grohe, Master, Dulux"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Row 2: Category & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Price / Wholesale Rate</label>
              <input
                type="text"
                value={formData.price || ''}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g. PKR 45,000 or Call for Wholesale Rate"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Product Showcase Images (Drag & Drop, Compression, Preview, Reorder) */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <MultiImageUploader
              label="Product Showcase Images (Cover + Gallery Photos)"
              images={[
                ...(formData.image ? [formData.image] : []),
                ...(formData.images || [])
              ]}
              onChange={(allImgs) => {
                if (allImgs.length > 0) {
                  setFormData(prev => ({
                    ...prev,
                    image: allImgs[0],
                    images: allImgs.slice(1)
                  }));
                } else {
                  setFormData(prev => ({
                    ...prev,
                    image: '',
                    images: []
                  }));
                }
              }}
              maxFiles={8}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Product description, luxury finish specs, durability..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Specifications Key-Value Editor */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
            <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Technical Specifications</span>
            
            {formData.specs && Object.keys(formData.specs).length > 0 && (
              <div className="space-y-1.5">
                {Object.entries(formData.specs).map(([k, v]) => (
                  <div key={k} className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">{k}: </span>
                      <span className="text-white font-semibold">{v}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSpec(k)}
                      className="p-1 text-rose-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="Spec Name (e.g. Material)"
                value={specKey}
                onChange={(e) => setSpecKey(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
              />
              <input
                type="text"
                placeholder="Spec Value (e.g. Solid Brass)"
                value={specValue}
                onChange={(e) => setSpecValue(e.target.value)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
              />
              <button
                type="button"
                onClick={handleAddSpec}
                className="py-1.5 px-3 rounded-lg bg-blue-600 text-white text-xs font-bold"
              >
                Add Spec
              </button>
            </div>
          </div>

          {/* Videos Upload & Links */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
            <VideoUploader
              videos={formData.videos || []}
              onChange={(updatedVideos) => setFormData(prev => ({ ...prev, videos: updatedVideos }))}
            />
          </div>

          {/* Badges & Status Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-800"
              />
              <span className="font-semibold">Featured on Homepage</span>
            </label>

            <label className="flex items-center gap-2 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isNew}
                onChange={(e) => setFormData({ ...formData, isNew: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-800"
              />
              <span className="font-semibold">Mark as New Arrival</span>
            </label>

            <div>
              <select
                value={formData.badge || 'LUXURY'}
                onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                className="w-full px-3.5 py-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
              >
                <option value="LUXURY">Badge: LUXURY</option>
                <option value="NEW">Badge: NEW</option>
                <option value="BESTSELLER">Badge: BESTSELLER</option>
                <option value="PREMIUM GRADE">Badge: PREMIUM GRADE</option>
                <option value="IMPACT RESISTANT">Badge: IMPACT RESISTANT</option>
              </select>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Product to Store</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};

// Sub-component: Category Editor Modal
const CategoryEditorModal: React.FC<{
  category: ProductCategory | null;
  onSave: (cat: ProductCategory) => void;
  onClose: () => void;
}> = ({ category, onSave, onClose }) => {
  const [formData, setFormData] = useState<Partial<ProductCategory>>({
    id: category?.id || `cat-${Date.now()}`,
    name: category?.name || '',
    description: category?.description || '',
    image: category?.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    itemCount: category?.itemCount || 0,
    iconName: category?.iconName || 'Droplet',
    group: category?.group || 'sanitary'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    onSave({
      id: formData.id || `cat-${Date.now()}`,
      name: formData.name,
      description: formData.description || 'Collection of premium products.',
      image: formData.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
      itemCount: formData.itemCount || 0,
      iconName: formData.iconName || 'Droplet',
      group: formData.group || 'sanitary'
    });
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex justify-center items-start sm:items-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full my-auto shadow-2xl relative p-6 sm:p-8 max-h-[90vh] flex flex-col overflow-hidden">
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-xl font-bold text-white font-serif mb-4 shrink-0">
          {category ? 'Edit Category' : 'Add New Product Category'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-1 min-h-0">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category Name *</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Italian Marble Vanities"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Group Department</label>
            <select
              value={formData.group}
              onChange={(e) => setFormData({ ...formData, group: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            >
              <option value="sanitary">Sanitaryware</option>
              <option value="faucets_showers">Faucets & Showers</option>
              <option value="plumbing">Plumbing & Pipes</option>
              <option value="paints_materials">Paints & Finishes</option>
              <option value="construction">Construction Materials</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Category Cover Image URL</label>
            <input
              type="text"
              value={formData.image || ''}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl bg-slate-950 text-slate-400 text-xs font-semibold"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="py-2 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold"
            >
              Save Category
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
