import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Sparkles, 
  Layers, 
  FileText, 
  Image as ImageIcon, 
  Sliders, 
  Globe, 
  Eye, 
  Star, 
  CheckCircle, 
  Info,
  Hash,
  ListOrdered
} from 'lucide-react';
import { ProductCategory } from '../types';
import { CategoryImageUploader } from './CategoryImageUploader';
import { formatSupabaseError } from '../services/supabaseService';

interface AdminCategoryModalProps {
  category: ProductCategory | null; // null for new category
  onSave: (category: ProductCategory) => Promise<void> | void;
  onClose: () => void;
}

export const AdminCategoryModal: React.FC<AdminCategoryModalProps> = ({
  category,
  onSave,
  onClose
}) => {
  const [formData, setFormData] = useState<ProductCategory>({
    id: category?.id || `cat-${Date.now()}`,
    name: category?.name || '',
    slug: category?.slug || '',
    description: category?.description || '',
    fullDescription: category?.fullDescription || '',
    image: category?.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    bannerImage: category?.bannerImage || '',
    itemCount: category?.itemCount || 0,
    badge: category?.badge || '',
    iconName: category?.iconName || 'Droplets',
    group: category?.group || 'sanitary',
    isFeatured: category?.isFeatured ?? true,
    showOnHomepage: category?.showOnHomepage ?? true,
    isActive: category?.isActive ?? true,
    seoTitle: category?.seoTitle || '',
    seoDescription: category?.seoDescription || '',
    displayOrder: category?.displayOrder || 1
  });

  const [activeTab, setActiveTab] = useState<'basic' | 'images' | 'settings' | 'seo'>('basic');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Auto-generate slug from name if empty or creating new
  useEffect(() => {
    if (!category && formData.name && !formData.slug) {
      const generatedSlug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, slug: generatedSlug }));
    }
  }, [formData.name]);

  const handleSlugify = () => {
    if (formData.name) {
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.name.trim()) {
      setErrorMsg('Category Name is required.');
      return;
    }

    const finalSlug = (formData.slug?.trim() || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'))
      .replace(/(^-|-$)+/g, '');

    setIsSaving(true);
    try {
      await onSave({
        ...formData,
        name: formData.name.trim(),
        slug: finalSlug,
        description: formData.description.trim() || 'Collection of premium products.',
        image: formData.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
        seoTitle: formData.seoTitle || `${formData.name} - Official Catalog`,
        seoDescription: formData.seoDescription || formData.description
      });
    } catch (err: any) {
      console.error('Error in category modal submit:', err);
      setErrorMsg(formatSupabaseError(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex justify-center items-start sm:items-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full my-auto max-h-[92vh] overflow-hidden shadow-2xl relative flex flex-col">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-600/10 border border-blue-500/30 text-blue-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white font-serif">
                {category ? `Edit Category: ${category.name}` : 'Create New Product Category'}
              </h2>
              <p className="text-xs text-slate-400 font-light mt-0.5">
                Configure cover images, descriptions, group department, homepage settings, and SEO.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-950 px-6 py-2 border-b border-slate-800 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'basic' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>1. Basic Information</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'images' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>2. Cover & Banner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'settings' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>3. Display & Status</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('seo')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'seo' 
                ? 'bg-blue-600 text-white shadow-md shadow-blue-950' 
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>4. SEO Meta</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* TAB 1: BASIC INFORMATION */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Italian Sanitaryware & Vanities"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      URL Slug
                    </label>
                    <button
                      type="button"
                      onClick={handleSlugify}
                      className="text-[10px] text-blue-400 hover:underline"
                    >
                      Auto-generate
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.slug || ''}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      placeholder="italian-sanitaryware-vanities"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500"
                    />
                    <Hash className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-3" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Group Department *
                  </label>
                  <select
                    value={formData.group}
                    onChange={(e) => setFormData({ ...formData, group: e.target.value as any })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="sanitary">Sanitaryware & Vanities</option>
                    <option value="faucets_showers">Faucets & Showers</option>
                    <option value="plumbing">Plumbing & Pipes</option>
                    <option value="paints_materials">Paints & Wall Putty</option>
                    <option value="construction">Cement, Sand & Construction</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Badge Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.badge || ''}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. LUXURY, NEW, BESTSELLER, HOT"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Short Summary / Subtitle (Shown on Cards)
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Brief 1-2 sentence overview of products in this collection..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Full Catalog Description
                </label>
                <textarea
                  rows={4}
                  value={formData.fullDescription || ''}
                  onChange={(e) => setFormData({ ...formData, fullDescription: e.target.value })}
                  placeholder="Comprehensive description for dedicated category landing page..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

            </div>
          )}

          {/* TAB 2: COVER & BANNER IMAGES */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              
              {/* Cover Image Upload */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <CategoryImageUploader
                  label="Category Cover Image (Device Upload Supported)"
                  imageUrl={formData.image}
                  onChange={(newUrl) => setFormData({ ...formData, image: newUrl })}
                  aspectRatioLabel="Supports drag-and-drop or browse device for JPG, PNG, WebP"
                />
              </div>

              {/* Banner Image Upload */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <CategoryImageUploader
                  label="Category Header Banner Image (Optional Wide Image)"
                  imageUrl={formData.bannerImage || ''}
                  onChange={(newUrl) => setFormData({ ...formData, bannerImage: newUrl })}
                  aspectRatioLabel="Wide banner (16:9 or 21:9 ratio) for category detail headers"
                />
              </div>

            </div>
          )}

          {/* TAB 3: DISPLAY ORDER, STATUS & VISIBILITY */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Display Order Index
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      value={formData.displayOrder || 1}
                      onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                    <ListOrdered className="w-4 h-4 text-slate-500 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    Lower numbers appear first on storefront.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Static Item Count Offset
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={formData.itemCount}
                    onChange={(e) => setFormData({ ...formData, itemCount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Switches */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
                
                {/* Active / Inactive */}
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-white block">Active Status</span>
                    <span className="text-[11px] text-slate-400">
                      When inactive, this category is hidden from storefront visitors.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      formData.isActive ? 'bg-emerald-600' : 'bg-slate-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.isActive ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Show on Homepage */}
                <div className="flex items-center justify-between border-t border-slate-900 pt-3">
                  <div>
                    <span className="text-xs font-bold text-white block">Show on Homepage</span>
                    <span className="text-[11px] text-slate-400">
                      Display category card in the main homepage Grid section.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, showOnHomepage: !formData.showOnHomepage })}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      formData.showOnHomepage ? 'bg-blue-600' : 'bg-slate-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.showOnHomepage ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

                {/* Featured Category */}
                <div className="flex items-center justify-between border-t border-slate-900 pt-3">
                  <div>
                    <span className="text-xs font-bold text-white block">Featured Category</span>
                    <span className="text-[11px] text-slate-400">
                      Highlight with a special glowing border and top priority badge.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, isFeatured: !formData.isFeatured })}
                    className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                      formData.isFeatured ? 'bg-cyan-600' : 'bg-slate-800'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      formData.isFeatured ? 'translate-x-6' : 'translate-x-0'
                    }`} />
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 4: SEO META */}
          {activeTab === 'seo' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  SEO Title Tag
                </label>
                <input
                  type="text"
                  value={formData.seoTitle || ''}
                  onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                  placeholder={`Buy ${formData.name || 'Sanitaryware'} | Official Outlet`}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  SEO Meta Description
                </label>
                <textarea
                  rows={3}
                  value={formData.seoDescription || ''}
                  onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                  placeholder="Meta description for search engine listings..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
                />
              </div>

              {/* Google Search Preview Card */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <span className="text-[10px] text-slate-500 font-mono block mb-1">
                  Search Engine Result Preview
                </span>
                <span className="text-xs font-medium text-blue-400 hover:underline block truncate">
                  {formData.seoTitle || `${formData.name || 'Category Name'} - Premium Catalog`}
                </span>
                <span className="text-[10px] text-emerald-400 font-mono block">
                  https://zst.pk/category/{formData.slug || 'category-slug'}
                </span>
                <p className="text-[11px] text-slate-400 line-clamp-2">
                  {formData.seoDescription || formData.description || 'Explore top-rated sanitaryware, faucets, and construction supplies.'}
                </p>
              </div>

            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            <span className="text-[11px] text-slate-500 font-mono">
              ID: {formData.id}
            </span>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving to Supabase...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>{category ? 'Update Category' : 'Save Category'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
