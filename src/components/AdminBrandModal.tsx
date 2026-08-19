import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Image as ImageIcon, Sparkles, Eye, EyeOff } from 'lucide-react';
import { ProductBrand } from '../types';
import { MultiImageUploader } from './MultiImageUploader';
import { formatSupabaseError } from '../services/supabaseService';

interface AdminBrandModalProps {
  brand: ProductBrand | null;
  onSave: (brand: ProductBrand) => Promise<void> | void;
  onDelete?: (brandId: string) => void;
  onClose: () => void;
}

export const AdminBrandModal: React.FC<AdminBrandModalProps> = ({
  brand,
  onSave,
  onDelete,
  onClose
}) => {
  const [formData, setFormData] = useState<Partial<ProductBrand>>({
    id: `brand-${Date.now()}`,
    name: '',
    slug: '',
    logo: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80',
    bannerImage: 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
    description: '',
    isFeatured: true,
    isActive: true,
    displayOrder: 1
  });

  const [logoImages, setLogoImages] = useState<string[]>([]);
  const [bannerImages, setBannerImages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (brand) {
      setFormData({ ...brand });
      setLogoImages(brand.logo ? [brand.logo] : []);
      setBannerImages(brand.bannerImage ? [brand.bannerImage] : []);
    }
  }, [brand]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const finalLogo = logoImages.length > 0 ? logoImages[0] : (formData.logo || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80');
    const finalBanner = bannerImages.length > 0 ? bannerImages[0] : (formData.bannerImage || 'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80');

    const finalBrand: ProductBrand = {
      id: formData.id || `brand-${Date.now()}`,
      name: formData.name,
      slug: (formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')).replace(/(^-|-$)+/g, ''),
      logo: finalLogo,
      bannerImage: finalBanner,
      description: formData.description || 'Premium official partner and manufacturer.',
      officialBadge: formData.officialBadge || '100% Genuine',
      isFeatured: formData.isFeatured !== false,
      isActive: formData.isActive !== false,
      displayOrder: formData.displayOrder || 1
    };

    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onSave(finalBrand);
    } catch (err: any) {
      console.error('Error saving brand in modal:', err);
      setErrorMsg(formatSupabaseError(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex justify-center items-start sm:items-center p-3 sm:p-6 animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full my-auto shadow-2xl relative p-6 sm:p-8 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Brand Management</span>
          <h3 className="text-2xl font-bold text-white font-serif">
            {brand ? 'Edit Brand Details' : 'Add New Brand Partner'}
          </h3>
          {errorMsg && (
            <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium">
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-1 min-h-0">
          
          {/* Brand Name & Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand Name *</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  name: e.target.value,
                  slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                })}
                placeholder="e.g., Master Sanitary Ware / Faisal Fittings"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand Order / Priority</label>
              <input
                type="number"
                value={formData.displayOrder || 1}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Brand Description</label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brand heritage, guarantee, and product range overview..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Logo Uploader */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <MultiImageUploader
              label="Brand Logo (Square Image / Icon)"
              images={logoImages}
              onChange={(imgs) => {
                setLogoImages(imgs);
                if (imgs.length > 0) setFormData(prev => ({ ...prev, logo: imgs[0] }));
              }}
              maxFiles={1}
            />
          </div>

          {/* Banner Uploader */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <MultiImageUploader
              label="Brand Header Banner Image (Wide Landscape)"
              images={bannerImages}
              onChange={(imgs) => {
                setBannerImages(imgs);
                if (imgs.length > 0) setFormData(prev => ({ ...prev, bannerImage: imgs[0] }));
              }}
              maxFiles={1}
            />
          </div>

          {/* Feature & Active Toggles */}
          <div className="flex items-center gap-6 p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={formData.isFeatured !== false}
                onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-800"
              />
              <span>Mark as Featured Brand</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={formData.isActive !== false}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-800"
              />
              <span>Active on Website</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            {brand && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this brand permanently? Products linked to it will remain.')) {
                    onDelete(brand.id);
                    onClose();
                  }
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Brand</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isSaving ? 'Saving Brand...' : 'Save Brand'}</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
