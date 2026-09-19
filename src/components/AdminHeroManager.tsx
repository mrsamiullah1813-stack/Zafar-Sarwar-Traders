import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Check, 
  X, 
  Sliders, 
  Clock, 
  Save, 
  Plus, 
  Trash2, 
  Search,
  Eye,
  ArrowUp, 
  ArrowDown, 
  RotateCcw,
  Image as ImageIcon, 
  Upload,
  Link as LinkIcon,
  ExternalLink,
  Smartphone,
  Monitor,
  Tablet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  Edit3
} from 'lucide-react';
import { Product, HeroSettings, ProductCategory, ProductBrand, HeroBannerSlide } from '../types';
import { saveHeroSettings, defaultHeroBanners } from '../utils/storage';
import { uploadMediaToSupabase } from '../services/supabaseService';
import { HeroSection } from './HeroSection';

interface AdminHeroManagerProps {
  products: Product[];
  categories: ProductCategory[];
  brands: ProductBrand[];
  heroSettings: HeroSettings;
  onUpdateHeroSettings: (newSettings: HeroSettings) => void;
  onUpdateProducts: (updatedProducts: Product[]) => void;
  showToast: (msg: string) => void;
}

export const AdminHeroManager: React.FC<AdminHeroManagerProps> = ({
  products,
  categories,
  brands,
  heroSettings,
  onUpdateHeroSettings,
  onUpdateProducts,
  showToast,
}) => {
  // Initialize settings with banners array
  const [settings, setSettings] = useState<HeroSettings>(() => {
    const banners = Array.isArray(heroSettings?.banners) && heroSettings.banners.length > 0
      ? heroSettings.banners
      : defaultHeroBanners;
    return {
      ...heroSettings,
      banners
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Add / Edit Banner Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerForm, setBannerForm] = useState<{
    imageUrl: string;
    mobileImageUrl: string;
    title: string;
    linkUrl: string;
    openInNewTab: boolean;
    isActive: boolean;
  }>({
    imageUrl: '',
    mobileImageUrl: '',
    title: '',
    linkUrl: '',
    openInNewTab: false,
    isActive: true
  });

  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mobileFileInputRef = useRef<HTMLInputElement>(null);

  const banners = settings.banners || [];

  // Open modal for new banner
  const handleOpenAddModal = () => {
    setEditingBannerId(null);
    setBannerForm({
      imageUrl: '',
      mobileImageUrl: '',
      title: '',
      linkUrl: '',
      openInNewTab: false,
      isActive: true
    });
    setUploadError(null);
    setIsModalOpen(true);
  };

  // Open modal for editing existing banner
  const handleOpenEditModal = (banner: HeroBannerSlide) => {
    setEditingBannerId(banner.id);
    setBannerForm({
      imageUrl: banner.imageUrl || '',
      mobileImageUrl: banner.mobileImageUrl || '',
      title: banner.title || '',
      linkUrl: banner.linkUrl || '',
      openInNewTab: Boolean(banner.openInNewTab),
      isActive: banner.isActive !== false
    });
    setUploadError(null);
    setIsModalOpen(true);
  };

  // Handle File Upload to Supabase Storage
  const handleFileUpload = async (file: File, isMobileVersion = false) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please select a valid image file (JPG, PNG, WebP, AVIF).');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError('Image size exceeds 20MB limit. Please compress or choose a smaller image.');
      return;
    }

    setIsUploading(true);
    setUploadError(null);

    try {
      const res = await uploadMediaToSupabase(file, 'hero-media');
      if (res.url) {
        if (isMobileVersion) {
          setBannerForm(prev => ({ ...prev, mobileImageUrl: res.url! }));
        } else {
          setBannerForm(prev => ({ ...prev, imageUrl: res.url! }));
        }
        showToast('Banner image uploaded successfully!');
      } else if (res.error) {
        // If upload failed, convert to high-res data URL as instant reliable fallback
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target?.result as string;
          if (isMobileVersion) {
            setBannerForm(prev => ({ ...prev, mobileImageUrl: dataUrl }));
          } else {
            setBannerForm(prev => ({ ...prev, imageUrl: dataUrl }));
          }
          showToast('Image loaded locally');
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.error('Banner upload error:', err);
      setUploadError(err?.message || 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  // Save banner in form (Add or Edit)
  const handleSaveBannerForm = () => {
    if (!bannerForm.imageUrl.trim()) {
      setUploadError('Please provide a banner image URL or upload an image file.');
      return;
    }

    if (editingBannerId) {
      // Update existing banner
      const updatedBanners = banners.map(b => {
        if (b.id === editingBannerId) {
          return {
            ...b,
            imageUrl: bannerForm.imageUrl.trim(),
            mobileImageUrl: bannerForm.mobileImageUrl.trim() || undefined,
            title: bannerForm.title.trim() || 'Promotional Banner',
            linkUrl: bannerForm.linkUrl.trim() || undefined,
            openInNewTab: bannerForm.openInNewTab,
            isActive: bannerForm.isActive
          };
        }
        return b;
      });
      setSettings(prev => ({ ...prev, banners: updatedBanners }));
      showToast('Banner updated');
    } else {
      // Add new banner
      const newBanner: HeroBannerSlide = {
        id: `banner-${Date.now()}`,
        imageUrl: bannerForm.imageUrl.trim(),
        mobileImageUrl: bannerForm.mobileImageUrl.trim() || undefined,
        title: bannerForm.title.trim() || `Promotional Banner ${banners.length + 1}`,
        linkUrl: bannerForm.linkUrl.trim() || undefined,
        openInNewTab: bannerForm.openInNewTab,
        isActive: bannerForm.isActive,
        displayOrder: banners.length
      };
      setSettings(prev => ({ ...prev, banners: [...banners, newBanner] }));
      showToast('New banner added');
    }

    setIsModalOpen(false);
  };

  // Delete Banner
  const handleDeleteBanner = (id: string) => {
    if (banners.length <= 1) {
      if (!confirm('This is the only banner remaining. Are you sure you want to delete it?')) return;
    }
    const updated = banners.filter(b => b.id !== id).map((b, idx) => ({ ...b, displayOrder: idx }));
    setSettings(prev => ({ ...prev, banners: updated }));
    showToast('Banner deleted');
  };

  // Toggle Banner Active
  const handleToggleBannerActive = (id: string) => {
    const updated = banners.map(b => {
      if (b.id === id) {
        return { ...b, isActive: !b.isActive };
      }
      return b;
    });
    setSettings(prev => ({ ...prev, banners: updated }));
  };

  // Move Banner Up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[index - 1];
    newBanners[index - 1] = temp;
    // Reassign displayOrder
    newBanners.forEach((b, i) => { b.displayOrder = i; });
    setSettings(prev => ({ ...prev, banners: newBanners }));
  };

  // Move Banner Down
  const handleMoveDown = (index: number) => {
    if (index >= banners.length - 1) return;
    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[index + 1];
    newBanners[index + 1] = temp;
    // Reassign displayOrder
    newBanners.forEach((b, i) => { b.displayOrder = i; });
    setSettings(prev => ({ ...prev, banners: newBanners }));
  };

  // Reset to default banners
  const handleResetDefaults = () => {
    if (confirm('Reset hero slider to default curated banners? Any custom banners will be replaced.')) {
      setSettings(prev => ({
        ...prev,
        isEnabled: true,
        banners: defaultHeroBanners,
        autoPlay: true,
        rotationDurationSeconds: 5
      }));
      showToast('Reset to default banner collection');
    }
  };

  // Save and Publish to Database
  const handleSaveAndPublish = async () => {
    setIsSaving(true);
    try {
      const finalSettings: HeroSettings = {
        ...settings,
        isDraft: false
      };
      const res = await saveHeroSettings(finalSettings);
      if (res && res.success === false) {
        showToast(`Save failed: ${res.error || 'Database error'}`);
        return;
      }
      onUpdateHeroSettings(finalSettings);
      showToast('Hero Banners saved and published live!');
    } catch (err: any) {
      console.error('Error saving hero settings:', err);
      showToast(`Error saving settings: ${err?.message || String(err)}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <ImageIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Full-Banner Hero Slider
                </h2>
                <p className="text-xs sm:text-sm text-slate-400">
                  Manage promotional graphic banners displayed across desktop, tablet, and mobile devices.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Master Visibility Switch */}
            <div className="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-slate-800/80 border border-slate-700/60">
              <span className="text-xs font-bold text-slate-300">Slider Status:</span>
              <button
                type="button"
                onClick={() => setSettings(prev => ({ ...prev, isEnabled: !prev.isEnabled }))}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  settings.isEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    settings.isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
              <span className={`text-xs font-bold ${settings.isEnabled ? 'text-emerald-400' : 'text-slate-500'}`}>
                {settings.isEnabled ? 'Active' : 'Disabled'}
              </span>
            </div>

            {/* Live Preview Button */}
            <button
              type="button"
              onClick={() => setIsPreviewOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 border border-slate-700 text-slate-200 font-bold text-xs sm:text-sm transition-all cursor-pointer shadow-sm hover:scale-105"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              <span>Live Preview</span>
            </button>

            {/* Save & Publish Button */}
            <button
              type="button"
              onClick={handleSaveAndPublish}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs sm:text-sm shadow-lg shadow-amber-500/25 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving to DB...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save & Publish</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Global Slider Settings Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-400" />
          Slider Settings & Timing
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Autoplay Toggle */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Auto-Play Carousel</p>
              <p className="text-[11px] text-slate-400">Automatically cycle through promotional banners</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings(prev => ({ ...prev, autoPlay: !prev.autoPlay }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                settings.autoPlay ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.autoPlay ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Rotation Duration */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Slide Duration
              </span>
              <span className="text-xs font-mono font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                {settings.rotationDurationSeconds}s
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="15"
              step="1"
              value={settings.rotationDurationSeconds}
              onChange={(e) => setSettings(prev => ({ ...prev, rotationDurationSeconds: Number(e.target.value) }))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <p className="text-[10px] text-slate-500">Seconds each promotional banner remains visible</p>
          </div>

          {/* Pause on Hover */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-white">Pause on Hover / Touch</p>
              <p className="text-[11px] text-slate-400">Halts auto-scroll when customer hovers</p>
            </div>
            <button
              type="button"
              onClick={() => setSettings(prev => ({ ...prev, pauseOnHover: !prev.pauseOnHover }))}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                settings.pauseOnHover !== false ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.pauseOnHover !== false ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Banner Management Section */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-base sm:text-lg font-black text-white">
              Promotional Banners ({banners.length})
            </h3>
            <p className="text-xs text-slate-400">
              Upload complete promotional graphics. Clean pagination dots and navigation arrows are added automatically.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-bold transition-all cursor-pointer"
              title="Reset to default banner collection"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Banner</span>
            </button>
          </div>
        </div>

        {/* Banners List */}
        {banners.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-950/40">
            <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-300 mb-1">No promotional banners yet</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              Add banner images to create your responsive e-commerce hero slider.
            </p>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs shadow-md"
            >
              <Plus className="w-4 h-4" />
              Add First Banner
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {banners.map((banner, index) => (
              <div
                key={banner.id || index}
                className={`flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl border transition-all ${
                  banner.isActive !== false
                    ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                    : 'bg-slate-950/30 border-slate-800/40 opacity-60'
                }`}
              >
                {/* Banner Thumbnail & Details */}
                <div className="flex items-center gap-4 min-w-0 w-full lg:w-auto">
                  {/* Reorder Up/Down */}
                  <div className="flex flex-col gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move Banner Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveDown(index)}
                      disabled={index === banners.length - 1}
                      className="p-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Move Banner Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Banner Image Preview */}
                  <div className="relative w-28 sm:w-40 aspect-[16/7] rounded-xl overflow-hidden border border-slate-700 bg-slate-800 shrink-0 shadow-md">
                    <img
                      src={banner.imageUrl}
                      alt={banner.title || 'Banner'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80';
                      }}
                    />
                    <div className="absolute top-1 left-1 bg-black/60 backdrop-blur-xs text-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded">
                      #{index + 1}
                    </div>
                  </div>

                  {/* Information */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="text-sm font-bold text-white truncate">
                        {banner.title || `Promotional Banner ${index + 1}`}
                      </h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        banner.isActive !== false
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}>
                        {banner.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    {/* Destination Link */}
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <LinkIcon className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      {banner.linkUrl ? (
                        <span className="font-mono text-slate-300 truncate max-w-xs sm:max-w-md bg-slate-800/80 px-2 py-0.5 rounded text-[11px]">
                          {banner.linkUrl}
                        </span>
                      ) : (
                        <span className="text-slate-500 italic text-[11px]">No link (display only)</span>
                      )}
                      {banner.openInNewTab && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                          (new tab)
                        </span>
                      )}
                    </div>

                    {banner.mobileImageUrl && (
                      <p className="text-[10px] text-emerald-400/90 mt-1 flex items-center gap-1">
                        <Smartphone className="w-3 h-3" />
                        Dedicated mobile image configured
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                  {/* Toggle Active Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleBannerActive(banner.id)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      banner.isActive !== false
                        ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border-slate-700'
                    }`}
                  >
                    {banner.isActive !== false ? 'Active' : 'Enable'}
                  </button>

                  {/* Edit Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(banner)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                    <span>Edit</span>
                  </button>

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => handleDeleteBanner(banner.id)}
                    className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-all cursor-pointer"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Banner Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-amber-400" />
                {editingBannerId ? 'Edit Promotional Banner' : 'Add New Promotional Banner'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <div className="space-y-4">
              {/* Banner Graphic Image Upload & URL */}
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  1. Desktop / Main Banner Graphic <span className="text-amber-400">*</span>
                </label>
                
                {/* Image Preview Box */}
                {bannerForm.imageUrl ? (
                  <div className="relative aspect-[21/8] rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 mb-3 shadow-inner">
                    <img
                      src={bannerForm.imageUrl}
                      alt="Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setBannerForm(prev => ({ ...prev, imageUrl: '' }))}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/70 hover:bg-black text-rose-400 hover:text-rose-300 backdrop-blur-xs transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : null}

                {/* Upload or URL Inputs */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0], false);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 text-amber-400" />
                        <span>Upload Image File</span>
                      </>
                    )}
                  </button>

                  <div className="relative flex-1">
                    <input
                      type="url"
                      placeholder="Or paste direct image URL (https://...)"
                      value={bannerForm.imageUrl}
                      onChange={(e) => setBannerForm(prev => ({ ...prev, imageUrl: e.target.value }))}
                      className="w-full px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
                <p className="text-[11px] text-slate-500 mt-1.5">
                  Recommended size: 1920×720px or 1600×600px (16:6 to 21:8 ratio) for optimal desktop & tablet sharpness.
                </p>
              </div>

              {/* Optional Mobile Image */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  2. Mobile-Optimized Banner (Optional)
                </label>

                {bannerForm.mobileImageUrl ? (
                  <div className="relative aspect-[16/9] w-48 rounded-xl overflow-hidden border border-slate-700 bg-slate-950 mb-3 shadow-inner">
                    <img
                      src={bannerForm.mobileImageUrl}
                      alt="Mobile Banner Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setBannerForm(prev => ({ ...prev, mobileImageUrl: '' }))}
                      className="absolute top-1 right-1 p-1 rounded bg-black/70 text-rose-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : null}

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="file"
                    ref={mobileFileInputRef}
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files?.[0]) handleFileUpload(e.target.files[0], true);
                    }}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => mobileFileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold text-xs transition-all cursor-pointer shrink-0 disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Mobile File</span>
                  </button>

                  <input
                    type="url"
                    placeholder="Or paste mobile image URL (optional)"
                    value={bannerForm.mobileImageUrl}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, mobileImageUrl: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Optional square or 16:9 vertical format for small phone screens (e.g., 800×600px or 1080×1080px).
                </p>
              </div>

              {/* Banner Title / Alt Text */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  3. Banner Title / Internal Label
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master Bathroom Suites Collection"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                />
                <p className="text-[10px] text-slate-500 mt-1">Used for admin reference and accessibility image alt tag.</p>
              </div>

              {/* Destination Link URL */}
              <div className="pt-2 border-t border-slate-800">
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
                  <span>4. Destination Redirect Link (Optional)</span>
                  <span className="text-[10px] font-normal text-slate-500 normal-case">Where customer goes when clicking banner</span>
                </label>

                <div className="relative mb-2">
                  <LinkIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
                  <input
                    type="text"
                    placeholder="e.g. #products, /store, /categories, or https://..."
                    value={bannerForm.linkUrl}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, linkUrl: e.target.value }))}
                    className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-white text-xs font-mono placeholder:text-slate-600 focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Quick Link Selector Presets */}
                <div className="space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Link Presets:</span>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setBannerForm(prev => ({ ...prev, linkUrl: '#products' }))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-mono transition-colors"
                    >
                      #products (Home Grid)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerForm(prev => ({ ...prev, linkUrl: '/store' }))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-mono transition-colors"
                    >
                      /store (Catalog)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerForm(prev => ({ ...prev, linkUrl: '/categories' }))}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-mono transition-colors"
                    >
                      /categories
                    </button>
                    <button
                      type="button"
                      onClick={() => setBannerForm(prev => ({ ...prev, linkUrl: 'https://wa.me/923108002863' }))}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-400 border border-emerald-800/40 text-xs font-mono transition-colors"
                    >
                      WhatsApp Order
                    </button>
                  </div>

                  {/* Category Quick Select */}
                  {categories && categories.length > 0 && (
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-slate-400 shrink-0">Or Category:</span>
                      <select
                        onChange={(e) => {
                          if (e.target.value) setBannerForm(prev => ({ ...prev, linkUrl: `/category/${e.target.value}` }));
                        }}
                        className="text-xs bg-slate-950 border border-slate-800 text-slate-300 rounded-lg px-2 py-1"
                        defaultValue=""
                      >
                        <option value="" disabled>Select category...</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="checkbox"
                    id="banner-open-new-tab"
                    checked={bannerForm.openInNewTab}
                    onChange={(e) => setBannerForm(prev => ({ ...prev, openInNewTab: e.target.checked }))}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-amber-500/20"
                  />
                  <label htmlFor="banner-open-new-tab" className="text-xs text-slate-300 cursor-pointer">
                    Open link in a new browser tab (recommended for external URLs)
                  </label>
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-300">Set Banner Active</span>
                <button
                  type="button"
                  onClick={() => setBannerForm(prev => ({ ...prev, isActive: !prev.isActive }))}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                    bannerForm.isActive ? 'bg-amber-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      bannerForm.isActive ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBannerForm}
                className="px-6 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black shadow-md transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                {editingBannerId ? 'Save Changes' : 'Add Banner'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Modal */}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto">
          <div className="relative w-full max-w-6xl bg-slate-950 border border-slate-800 rounded-3xl p-4 sm:p-6 shadow-2xl space-y-4 my-6">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">Full-Banner Live Preview</h3>
                <span className="text-xs text-slate-500 font-mono">({previewDevice})</span>
              </div>

              {/* Device switcher */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-900 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPreviewDevice('desktop')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    previewDevice === 'desktop' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Desktop</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('tablet')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    previewDevice === 'tablet' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span>Tablet</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewDevice('mobile')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    previewDevice === 'mobile' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scaled Preview Frame */}
            <div className="flex justify-center bg-slate-900/50 p-4 rounded-2xl border border-slate-800/60 overflow-hidden">
              <div 
                className={`transition-all duration-300 ${
                  previewDevice === 'mobile' 
                    ? 'w-[375px]' 
                    : previewDevice === 'tablet' 
                    ? 'w-[768px]' 
                    : 'w-full max-w-5xl'
                }`}
              >
                <HeroSection
                  products={products}
                  categories={categories}
                  brands={brands}
                  heroSettings={settings}
                  onSelectProduct={() => {}}
                  onAddToCart={() => {}}
                  onBuyNow={() => {}}
                  onNavigateToStore={() => {}}
                  onNavigateToCategories={() => {}}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 text-xs text-slate-400">
              <span>This shows the real interactive slider component as customers will see it.</span>
              <button
                type="button"
                onClick={() => setIsPreviewOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
