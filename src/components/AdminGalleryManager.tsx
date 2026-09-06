import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Plus, 
  Edit3, 
  Trash2, 
  Image as ImageIcon, 
  Upload, 
  Link, 
  Check, 
  X, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  RefreshCw, 
  AlertCircle, 
  MapPin, 
  Tag, 
  Search, 
  Copy, 
  CheckCircle2,
  ExternalLink,
  Info
} from 'lucide-react';
import { GalleryItem } from '../types';
import { galleryItems as defaultGallerySeed } from '../data/storeData';
import { MultiImageUploader } from './MultiImageUploader';

interface AdminGalleryManagerProps {
  gallery: GalleryItem[];
  onSaveGallery: (items: GalleryItem[]) => void;
  showToast?: (msg: string) => void;
}

const CATEGORY_NAMES: Record<string, { label: string; color: string }> = {
  sanitary: { label: 'Luxury Bathrooms', color: 'border-blue-500/40 text-blue-300 bg-blue-500/10' },
  faucets: { label: 'Faucets & Mixers', color: 'border-amber-500/40 text-amber-300 bg-amber-500/10' },
  paints: { label: 'Paints & Decor', color: 'border-purple-500/40 text-purple-300 bg-purple-500/10' },
  materials: { label: 'Building Materials', color: 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10' }
};

export const AdminGalleryManager: React.FC<AdminGalleryManagerProps> = ({
  gallery = [],
  onSaveGallery,
  showToast
}) => {
  const [items, setItems] = useState<GalleryItem[]>(gallery);
  const [filterCategory, setFilterCategory] = useState<'all' | 'sanitary' | 'faucets' | 'paints' | 'materials'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [itemToDelete, setItemToDelete] = useState<GalleryItem | null>(null);
  const [previewItem, setPreviewItem] = useState<GalleryItem | null>(null);

  // Form inputs
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'sanitary' | 'faucets' | 'paints' | 'materials'>('sanitary');
  const [formImage, setFormImage] = useState('');
  const [formTag, setFormTag] = useState('Showroom Live Display');
  const [formLocation, setFormLocation] = useState('Main Display Hall');
  const [formDescription, setFormDescription] = useState('');
  const [formFeatured, setFormFeatured] = useState(false);

  // Image input tab in modal (Upload vs Direct URL)
  const [imageTab, setImageTab] = useState<'upload' | 'url'>('upload');
  const [urlInput, setUrlInput] = useState('');
  const [urlPreviewValid, setUrlPreviewValid] = useState<boolean | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Sync with prop updates
  useEffect(() => {
    setItems(gallery);
  }, [gallery]);

  // Open modal for creating a new showroom picture
  const handleOpenCreate = () => {
    setEditingId(null);
    setFormTitle('');
    setFormCategory('sanitary');
    setFormImage('');
    setFormTag('Showroom Live Display');
    setFormLocation('Main Display Hall - Ground Floor');
    setFormDescription('Showroom physical display featuring premium bathroom fixtures and elegant ambient lighting.');
    setFormFeatured(false);
    setImageTab('upload');
    setUrlInput('');
    setUrlPreviewValid(null);
    setIsFormOpen(true);
  };

  // Open modal for editing existing showroom picture
  const handleOpenEdit = (item: GalleryItem) => {
    setEditingId(item.id);
    setFormTitle(item.title || '');
    setFormCategory((item.category as any) || 'sanitary');
    setFormImage(item.image || '');
    setFormTag(item.tag || 'Showroom Live Display');
    setFormLocation(item.location || 'Main Display Hall');
    setFormDescription(item.description || '');
    setFormFeatured(Boolean(item.featured));
    setUrlInput(item.image || '');
    setImageTab(item.image && item.image.startsWith('http') ? 'url' : 'upload');
    setUrlPreviewValid(null);
    setIsFormOpen(true);
  };

  // Save form submission (create or update)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const finalImage = (imageTab === 'url' && urlInput.trim()) ? urlInput.trim() : formImage.trim();

    if (!formTitle.trim()) {
      alert('Please provide a title for the showroom photo.');
      return;
    }
    if (!finalImage) {
      alert('Please provide an image either by uploading a photo or pasting an image URL.');
      return;
    }

    let updatedList: GalleryItem[];
    if (editingId) {
      // Update existing item
      updatedList = items.map((it) => {
        if (it.id === editingId) {
          return {
            ...it,
            title: formTitle.trim(),
            category: formCategory,
            image: finalImage,
            tag: formTag.trim(),
            location: formLocation.trim(),
            description: formDescription.trim(),
            featured: formFeatured
          };
        }
        return it;
      });
      if (showToast) showToast(`Showroom display "${formTitle}" updated successfully!`);
    } else {
      // Add new item
      const newItem: GalleryItem = {
        id: `gal-${Date.now()}`,
        title: formTitle.trim(),
        category: formCategory,
        image: finalImage,
        tag: formTag.trim(),
        location: formLocation.trim(),
        description: formDescription.trim(),
        featured: formFeatured,
        displayOrder: items.length + 1
      };
      updatedList = [newItem, ...items];
      if (showToast) showToast(`New showroom photo "${formTitle}" added to gallery!`);
    }

    setItems(updatedList);
    onSaveGallery(updatedList);
    setIsFormOpen(false);
  };

  // Delete item handler
  const confirmDeleteItem = () => {
    if (!itemToDelete) return;
    const updated = items.filter(it => it.id !== itemToDelete.id);
    setItems(updated);
    onSaveGallery(updated);
    if (showToast) showToast(`Showroom visual "${itemToDelete.title}" removed.`);
    setItemToDelete(null);
  };

  // Move item up / down in display ordering
  const handleMove = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const newArr = [...items];
    const temp = newArr[index];
    newArr[index] = newArr[targetIndex];
    newArr[targetIndex] = temp;

    // Update displayOrder attributes
    const reordered = newArr.map((it, idx) => ({ ...it, displayOrder: idx + 1 }));
    setItems(reordered);
    onSaveGallery(reordered);
  };

  // Reset to default seed
  const handleResetToDefaults = () => {
    if (window.confirm('Reset all showroom photos back to the curated master catalog seed? Custom photos will be replaced.')) {
      setItems(defaultGallerySeed);
      onSaveGallery(defaultGallerySeed);
      if (showToast) showToast('Showroom gallery reset to factory defaults.');
    }
  };

  // Quick copy URL
  const handleCopyUrl = (item: GalleryItem) => {
    navigator.clipboard.writeText(item.image);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filtered list
  const filteredList = items.filter(item => {
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || 
      item.title.toLowerCase().includes(q) || 
      (item.description && item.description.toLowerCase().includes(q)) ||
      (item.tag && item.tag.toLowerCase().includes(q)) ||
      (item.location && item.location.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-blue-950/40 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-blue-400" />
              Live Visuals CMS
            </span>
            <span className="text-xs text-slate-400">
              {items.length} Total Visual Displays
            </span>
          </div>
          <h2 className="text-2xl font-black text-white font-serif tracking-tight">
            Showroom & Project Gallery Manager
          </h2>
          <p className="text-xs text-slate-400 font-light mt-1 max-w-2xl">
            Upload and manage real showroom mockups, bathroom displays, paint sample studios, and project portfolio visuals rendered on the storefront.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleResetToDefaults}
            className="px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5"
            title="Reset to factory showroom photos"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-950/50 transition-all flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Showroom Photo</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3 rounded-2xl bg-slate-900 border border-slate-800">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 no-scrollbar">
          {[
            { id: 'all', label: 'All Displays' },
            { id: 'sanitary', label: 'Luxury Bathrooms' },
            { id: 'faucets', label: 'Faucets & Mixers' },
            { id: 'paints', label: 'Paints & Decor' },
            { id: 'materials', label: 'Building Materials' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                filterCategory === tab.id
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-950'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64 shrink-0">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search showroom photos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Gallery Cards Grid */}
      {filteredList.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <ImageIcon className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white font-serif">No Showroom Photos Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchQuery 
              ? `No showroom images match "${searchQuery}". Clear your search or add a new visual.` 
              : 'There are currently no items in this category. Click "+ Add Showroom Photo" above to upload.'}
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs inline-flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add First Photo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredList.map((item, index) => {
            const catInfo = CATEGORY_NAMES[item.category] || CATEGORY_NAMES.sanitary;

            return (
              <div
                key={item.id}
                className="group relative rounded-2xl bg-slate-900 border border-slate-800 hover:border-blue-500/50 transition-all duration-200 overflow-hidden shadow-xl flex flex-col justify-between"
              >
                {/* Image Section */}
                <div className="relative h-52 bg-slate-950 overflow-hidden">
                  <img
                    src={item.image}
                    alt={item.title}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.dataset.failed) {
                        target.dataset.failed = 'true';
                        // Flag broken image gracefully
                        target.classList.add('opacity-40');
                      }
                    }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent pointer-events-none" />

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border backdrop-blur-md shadow-md ${catInfo.color}`}>
                      {catInfo.label}
                    </span>

                    <div className="flex items-center gap-1 pointer-events-auto">
                      <button
                        type="button"
                        onClick={() => setPreviewItem(item)}
                        className="p-1.5 rounded-lg bg-slate-950/80 hover:bg-blue-600 text-slate-300 hover:text-white border border-slate-700/60 transition-all backdrop-blur-md"
                        title="View Fullscreen"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyUrl(item)}
                        className="p-1.5 rounded-lg bg-slate-950/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/60 transition-all backdrop-blur-md"
                        title="Copy Image URL"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Move Up/Down Controls */}
                  <div className="absolute bottom-3 right-3 flex items-center gap-1">
                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMove(index, 'up')}
                      className="p-1 rounded-md bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 disabled:opacity-30 transition-all shadow-md"
                      title="Move Earlier"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1}
                      onClick={() => handleMove(index, 'down')}
                      className="p-1 rounded-md bg-slate-900/90 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-700/60 disabled:opacity-30 transition-all shadow-md"
                      title="Move Later"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Subtitle tag / location */}
                  <div className="absolute bottom-3 left-3 flex items-center gap-1.5 flex-wrap">
                    {item.tag && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900/90 text-blue-300 text-[10px] font-semibold border border-slate-700/80 backdrop-blur-md">
                        <Tag className="w-2.5 h-2.5" />
                        {item.tag}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h4 className="text-sm font-bold text-white font-serif line-clamp-1">
                      {item.title}
                    </h4>
                    {item.location && (
                      <p className="text-[11px] text-sky-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{item.location}</span>
                      </p>
                    )}
                    <p className="text-xs text-slate-400 font-light mt-1.5 line-clamp-2 leading-relaxed">
                      {item.description || 'No detailed showroom notes provided.'}
                    </p>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(item)}
                      className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold transition-all flex items-center gap-1.5"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Edit Details</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setItemToDelete(item)}
                      className="p-1.5 rounded-xl bg-rose-950/40 hover:bg-rose-900 border border-rose-500/30 text-rose-300 hover:text-white transition-all"
                      title="Delete Visual"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 z-[120] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-7 my-8 relative">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2.5 mb-5">
              <div className="p-2 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30">
                {editingId ? <Edit3 className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-serif">
                  {editingId ? 'Edit Showroom Visual & Details' : 'Add New Showroom Picture'}
                </h3>
                <p className="text-xs text-slate-400 font-light">
                  {editingId 
                    ? 'Update photo, title, category tags, and descriptive notes.' 
                    : 'Upload real showroom photographs and specify project details.'}
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4">
              {/* Title & Category Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Display Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Master Spa Rain Shower Enclosure"
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Showroom Category <span className="text-rose-400">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="sanitary">Luxury Bathrooms (Sanitaryware)</option>
                    <option value="faucets">Faucets & Water Mixers</option>
                    <option value="paints">Paints & Decor Studio</option>
                    <option value="materials">Building Materials & Cement Hub</option>
                  </select>
                </div>
              </div>

              {/* Tag & Location Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Badge / Tag Label
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Showroom Live Display, Master Suite"
                    value={formTag}
                    onChange={(e) => setFormTag(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    Showroom Location / Client Site
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ground Floor - Main Display Hall"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Image Input Section: Dual Choice (Upload vs Direct URL) */}
              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">
                    Showroom Picture <span className="text-rose-400">*</span>
                  </span>

                  {/* Mode switcher */}
                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setImageTab('upload')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                        imageTab === 'upload'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Upload className="w-3 h-3" />
                      <span>Device Upload</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageTab('url')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all flex items-center gap-1 ${
                        imageTab === 'url'
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Link className="w-3 h-3" />
                      <span>Direct Image URL</span>
                    </button>
                  </div>
                </div>

                {imageTab === 'upload' ? (
                  <div className="space-y-2">
                    <MultiImageUploader
                      label="Select or Drag Showroom Photo (Saved to Supabase Storage & Served Reliably)"
                      images={formImage ? [formImage] : []}
                      bucketName="showroom-gallery"
                      onChange={(imgs) => {
                        if (imgs.length > 0) {
                          setFormImage(imgs[0]);
                          setUrlInput(imgs[0]);
                        } else {
                          setFormImage('');
                        }
                      }}
                      maxFiles={1}
                      aspectRatioHint="Recommended: 16:9 or 4:3 high-res photography. JPG, PNG, WebP."
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="url"
                        placeholder="https://images.unsplash.com/... or Supabase storage public URL"
                        value={urlInput}
                        onChange={(e) => {
                          setUrlInput(e.target.value);
                          setUrlPreviewValid(null);
                        }}
                        className="flex-1 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (!urlInput.trim()) return;
                          setFormImage(urlInput.trim());
                          setUrlPreviewValid(true);
                        }}
                        className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
                      >
                        Apply URL
                      </button>
                    </div>

                    {urlInput && (
                      <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-800 h-36 flex items-center justify-center">
                        <img
                          src={urlInput}
                          alt="URL preview"
                          onLoad={() => setUrlPreviewValid(true)}
                          onError={() => setUrlPreviewValid(false)}
                          className="w-full h-full object-contain"
                        />
                        {urlPreviewValid === false && (
                          <div className="absolute inset-0 bg-rose-950/80 flex items-center justify-center p-3 text-center">
                            <span className="text-xs text-rose-200 flex items-center gap-1.5 font-medium">
                              <AlertCircle className="w-4 h-4 text-rose-400" />
                              Unable to load image from this URL. Please verify link.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Description / Story textarea */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  Descriptive Details & Information
                </label>
                <textarea
                  rows={3}
                  placeholder="Describe the display setup, materials, sanitary fixtures, and lighting accents..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed resize-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!formTitle.trim() || (!formImage && !urlInput)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-blue-950/50 disabled:opacity-40 transition-all flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingId ? 'Update Showroom Photo' : 'Publish to Showroom Gallery'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[130] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-6 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white font-serif">
                Delete Showroom Photo?
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Are you sure you want to remove <span className="text-white font-semibold">"{itemToDelete.title}"</span>? This will remove the visual display from the public website.
              </p>
            </div>

            {/* Thumbnail Preview */}
            <div className="rounded-xl overflow-hidden h-32 bg-slate-950 border border-slate-800">
              <img src={itemToDelete.image} alt={itemToDelete.title} className="w-full h-full object-cover" />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteItem}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-950/50"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULLSCREEN PREVIEW LIGHTBOX */}
      {previewItem && (
        <div className="fixed inset-0 z-[140] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fadeIn">
          <button
            onClick={() => setPreviewItem(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-blue-600 transition-all z-10"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="max-w-4xl w-full max-h-[85vh] flex flex-col items-center">
            <img
              src={previewItem.image}
              alt={previewItem.title}
              className="max-h-[60vh] w-auto object-contain rounded-2xl border border-slate-800 shadow-2xl"
            />
            <div className="mt-5 text-center max-w-xl">
              <div className="flex items-center justify-center gap-2 mb-1.5">
                <span className="px-2.5 py-0.5 rounded-full bg-blue-600/30 text-blue-300 text-xs font-semibold border border-blue-400/30">
                  {CATEGORY_NAMES[previewItem.category]?.label || previewItem.category}
                </span>
                {previewItem.location && (
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-sky-400" />
                    {previewItem.location}
                  </span>
                )}
              </div>
              <h3 className="text-xl font-bold text-white font-serif">{previewItem.title}</h3>
              <p className="mt-1.5 text-slate-300 text-xs font-light leading-relaxed">{previewItem.description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
