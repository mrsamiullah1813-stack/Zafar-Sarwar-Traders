import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Video, Image as ImageIcon, Sparkles, Tag, ShieldCheck, Layers, Star } from 'lucide-react';
import { Product, ProductVideo, ProductCategory, ProductBrand } from '../types';
import { VideoUploader } from './VideoUploader';
import { MultiImageUploader } from './MultiImageUploader';

interface AdminProductModalProps {
  product: Product | null; // null for creating new product
  categories: ProductCategory[];
  brands?: ProductBrand[];
  onSave: (product: Product) => Promise<void> | void;
  onDelete?: (productId: string) => void;
  onClose: () => void;
}

export const AdminProductModal: React.FC<AdminProductModalProps> = ({
  product,
  categories,
  brands = [],
  onSave,
  onDelete,
  onClose
}) => {
  const [formData, setFormData] = useState<Partial<Product>>({
    id: `prod-${Date.now()}`,
    name: '',
    category: categories[0]?.name || 'Sanitaryware',
    categoryId: categories[0]?.id || 'bathroom-accessories',
    image: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80',
    description: '',
    price: 'PKR Call for Price',
    features: ['High Durability', '10 Year Warranty'],
    specs: { 'Material': 'Solid Brass', 'Origin': 'Imported' },
    badge: 'LUXURY',
    brand: brands[0]?.name || 'Master Sanitary Ware',
    brandId: brands[0]?.id || 'master',
    stockStatus: 'In Stock',
    stockQuantity: 50,
    hideStockBadge: false,
    isPriceOnRequest: false,
    hidePrice: false,
    isFeatured: true,
    rating: 4.8,
    reviewsCount: 12,
    videos: []
  });

  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [featuresInput, setFeaturesInput] = useState<string>('');
  const [colorsInput, setColorsInput] = useState<string>('');
  const [sizesInput, setSizesInput] = useState<string>('');
  const [materialsInput, setMaterialsInput] = useState<string>('');
  const [specPairs, setSpecPairs] = useState<{ key: string; value: string }[]>([]);
  const [newSpecKey, setNewSpecKey] = useState('');
  const [newSpecVal, setNewSpecVal] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        stockStatus: product.stockStatus || 'In Stock',
        videos: product.videos ? [...product.videos] : []
      });
      setUploadedImages(product.images && product.images.length > 0 ? product.images : (product.image ? [product.image] : []));
      setFeaturesInput(product.features ? product.features.join('\n') : '');
      setColorsInput(product.availableColors ? product.availableColors.join(', ') : '');
      setSizesInput(product.availableSizes ? product.availableSizes.join(', ') : '');
      setMaterialsInput(product.availableMaterials ? product.availableMaterials.join(', ') : '');
      
      if (product.specs) {
        setSpecPairs(Object.entries(product.specs).map(([k, v]) => ({ key: k, value: String(v) })));
      } else {
        setSpecPairs([{ key: 'Material', value: 'Solid Brass' }]);
      }
    } else {
      setFeaturesInput('High Durability\n10 Year Official Warranty\nPrecision Engineering');
      setSpecPairs([{ key: 'Material', value: 'Solid Brass / Porcelain' }, { key: 'Origin', value: 'Imported' }]);
    }
  }, [product]);

  const handleAddSpecPair = () => {
    if (!newSpecKey.trim() || !newSpecVal.trim()) return;
    setSpecPairs(prev => [...prev, { key: newSpecKey.trim(), value: newSpecVal.trim() }]);
    setNewSpecKey('');
    setNewSpecVal('');
  };

  const handleRemoveSpecPair = (index: number) => {
    setSpecPairs(prev => prev.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (catId: string) => {
    const selected = categories.find(c => c.id === catId);
    setFormData(prev => ({
      ...prev,
      categoryId: catId,
      category: selected ? selected.name : prev.category
    }));
  };

  const handleBrandChange = (brandId: string) => {
    const selected = brands.find(b => b.id === brandId);
    setFormData(prev => ({
      ...prev,
      brandId: brandId,
      brand: selected ? selected.name : prev.brand
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.categoryId) return;

    const mainImg = uploadedImages.length > 0 ? uploadedImages[0] : (formData.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80');

    const parsedFeatures = featuresInput
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    const parsedColors = colorsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const parsedSizes = sizesInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const parsedMaterials = materialsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    const specsObj: Record<string, string> = {};
    specPairs.forEach(p => {
      if (p.key.trim() && p.value.trim()) {
        specsObj[p.key.trim()] = p.value.trim();
      }
    });

    const finalProduct: Product = {
      id: formData.id || `prod-${Date.now()}`,
      name: formData.name,
      category: formData.category || 'Sanitaryware',
      categoryId: formData.categoryId || categories[0]?.id || 'bathroom-accessories',
      image: mainImg,
      images: uploadedImages,
      description: formData.description || 'Premium building material and sanitaryware.',
      price: formData.isPriceOnRequest ? 'Price on Request' : (formData.price || 'Call for Price'),
      features: parsedFeatures.length > 0 ? parsedFeatures : ['100% Genuine', 'Warranty Covered'],
      specs: specsObj,
      availableColors: parsedColors.length > 0 ? parsedColors : undefined,
      availableSizes: parsedSizes.length > 0 ? parsedSizes : undefined,
      availableMaterials: parsedMaterials.length > 0 ? parsedMaterials : undefined,
      badge: formData.badge,
      brand: formData.brand || 'Master',
      brandId: formData.brandId || 'master',
      stockStatus: formData.stockStatus || 'In Stock',
      stockQuantity: formData.stockQuantity,
      hideStockBadge: formData.hideStockBadge || false,
      isPriceOnRequest: formData.isPriceOnRequest || false,
      hidePrice: formData.hidePrice || false,
      isFeatured: formData.isFeatured !== false,
      isNew: formData.isNew,
      rating: typeof formData.rating === 'number' ? formData.rating : (formData.rating ? parseFloat(String(formData.rating)) : 4.8),
      reviewsCount: typeof formData.reviewsCount === 'number' ? formData.reviewsCount : 12,
      reviews_count: typeof formData.reviewsCount === 'number' ? formData.reviewsCount : 12,
      videos: formData.videos || []
    };

    setIsSaving(true);
    setErrorMsg(null);
    try {
      await onSave(finalProduct);
    } catch (err: any) {
      console.error('Error saving product in modal:', err);
      setErrorMsg(err?.message || 'Failed to save product to database.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex justify-center items-start sm:items-center p-3 sm:p-6 animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full my-auto overflow-hidden shadow-2xl relative p-6 sm:p-8 max-h-[92vh] flex flex-col">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4 shrink-0">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Admin Product & Availability Control</span>
          <h3 className="text-2xl font-bold text-white font-serif">
            {product ? 'Edit Product Content' : 'Add New Product to Store'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-2 flex-1 min-h-0">
          
          {/* Product Name & Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Product Name *</label>
              <input
                type="text"
                required
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Hansgrohe Thermostatic Rain Shower"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Brand / Manufacturer *</label>
              {brands && brands.length > 0 ? (
                <select
                  value={formData.brandId || ''}
                  onChange={(e) => handleBrandChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                  <option value="custom">Other / Custom Brand</option>
                </select>
              ) : (
                <input
                  type="text"
                  value={formData.brand || ''}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  placeholder="e.g., Kohler / Grohe / Master"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              )}
            </div>
          </div>

          {/* Category & Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Category *</label>
              <select
                value={formData.categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
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
                disabled={formData.isPriceOnRequest}
                value={formData.isPriceOnRequest ? 'Price on Request' : (formData.price || '')}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="e.g., PKR 45,000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
            </div>
          </div>

          {/* Rating & Review Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span>Customer Rating (1.0 – 5.0)</span>
              </label>
              <input
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                value={formData.rating ?? 4.8}
                onChange={(e) => setFormData({ ...formData, rating: parseFloat(e.target.value) || 4.8 })}
                placeholder="4.8"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Verified Reviews Count
              </label>
              <input
                type="number"
                min="0"
                value={formData.reviewsCount ?? 12}
                onChange={(e) => setFormData({ ...formData, reviewsCount: parseInt(e.target.value, 10) || 0 })}
                placeholder="12"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* AVAILABILITY SYSTEM CONTROLS */}
          <div className="p-4 rounded-2xl bg-slate-950/90 border border-blue-900/40 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-300">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              <span>Product Availability & Price Controls</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Availability Status</label>
                <select
                  value={formData.stockStatus || 'In Stock'}
                  onChange={(e) => setFormData({ ...formData, stockStatus: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="In Stock">In Stock (Green Badge)</option>
                  <option value="Limited Stock">Limited Stock (Amber Badge)</option>
                  <option value="Out of Stock">Out of Stock (Red Badge)</option>
                  <option value="Coming Soon">Coming Soon (Purple Badge)</option>
                  <option value="Available on Order">Available on Order (Cyan Badge)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Stock Quantity (Optional)</label>
                <input
                  type="number"
                  value={formData.stockQuantity || ''}
                  onChange={(e) => setFormData({ ...formData, stockQuantity: parseInt(e.target.value) || undefined })}
                  placeholder="e.g., 25"
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isPriceOnRequest || false}
                  onChange={(e) => setFormData({ ...formData, isPriceOnRequest: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-800"
                />
                <span>Set "Price on Request"</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.hidePrice || false}
                  onChange={(e) => setFormData({ ...formData, hidePrice: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-800"
                />
                <span>Hide Price Tag Entirely</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.hideStockBadge || false}
                  onChange={(e) => setFormData({ ...formData, hideStockBadge: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-800"
                />
                <span>Hide Availability Badge</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.isFeatured !== false}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-800"
                />
                <span>Featured Product</span>
              </label>
            </div>
          </div>

          {/* Device Image Upload */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <MultiImageUploader
              label="Device Image Upload (Drag & Drop or Browse File)"
              images={uploadedImages}
              onChange={(newImgs) => {
                setUploadedImages(newImgs);
                if (newImgs.length > 0) {
                  setFormData(prev => ({ ...prev, image: newImgs[0] }));
                }
              }}
              maxFiles={5}
            />
          </div>

          {/* Badge Tag */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Badge Tag</label>
            <select
              value={formData.badge || 'LUXURY'}
              onChange={(e) => setFormData({ ...formData, badge: e.target.value as any })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="LUXURY">LUXURY</option>
              <option value="NEW">NEW</option>
              <option value="BESTSELLER">BESTSELLER</option>
              <option value="PREMIUM GRADE">PREMIUM GRADE</option>
              <option value="IMPACT RESISTANT">IMPACT RESISTANT</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Product Description</label>
            <textarea
              rows={3}
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Detailed description of features, materials, and benefits..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          {/* Key Features (Line Separated) */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Key Features & Benefits (One feature per line)
            </label>
            <textarea
              rows={3}
              value={featuresInput}
              onChange={(e) => setFeaturesInput(e.target.value)}
              placeholder="e.g.&#10;10 Year Official Warranty&#10;Solid Brass Anti-Corrosion Body&#10;Thermostatic Temperature Control"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Specifications (Dynamic Key-Value Pair Editor) */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3">
            <label className="block text-xs font-bold text-blue-300">
              Technical Specifications (Key & Value Pairs)
            </label>
            
            <div className="space-y-2">
              {specPairs.map((pair, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={pair.key}
                    onChange={(e) => {
                      const updated = [...specPairs];
                      updated[idx].key = e.target.value;
                      setSpecPairs(updated);
                    }}
                    placeholder="Spec Name (e.g. Material)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                  <input
                    type="text"
                    value={pair.value}
                    onChange={(e) => {
                      const updated = [...specPairs];
                      updated[idx].value = e.target.value;
                      setSpecPairs(updated);
                    }}
                    placeholder="Value (e.g. Solid Brass)"
                    className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveSpecPair(idx)}
                    className="p-1.5 rounded-lg bg-rose-950 border border-rose-800 text-rose-300 hover:text-white"
                    title="Remove Spec"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add New Spec Row */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newSpecKey}
                onChange={(e) => setNewSpecKey(e.target.value)}
                placeholder="New Spec Name (e.g. Warranty)"
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
              />
              <input
                type="text"
                value={newSpecVal}
                onChange={(e) => setNewSpecVal(e.target.value)}
                placeholder="New Spec Value (e.g. 10 Years)"
                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300"
              />
              <button
                type="button"
                onClick={handleAddSpecPair}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shrink-0"
              >
                + Add
              </button>
            </div>
          </div>

          {/* Available Variants: Colors, Sizes, Materials */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Available Colors (Comma separated)
              </label>
              <input
                type="text"
                value={colorsInput}
                onChange={(e) => setColorsInput(e.target.value)}
                placeholder="Chrome, Matte Black, Rose Gold"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Available Sizes (Comma separated)
              </label>
              <input
                type="text"
                value={sizesInput}
                onChange={(e) => setSizesInput(e.target.value)}
                placeholder="1/2 Inch, 3/4 Inch, 60x60cm"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Materials (Comma separated)
              </label>
              <input
                type="text"
                value={materialsInput}
                onChange={(e) => setMaterialsInput(e.target.value)}
                placeholder="Brass, Porcelain, CPVC, Acrylic"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Video Uploader Section */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80">
            <VideoUploader
              videos={formData.videos || []}
              onChange={(updatedVideos) => setFormData(prev => ({ ...prev, videos: updatedVideos }))}
            />
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium flex items-center gap-2">
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            {product && onDelete ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  if (confirm('Are you sure you want to delete this product?')) {
                    onDelete(product.id);
                    onClose();
                  }
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Product</span>
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
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Saving to Database...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Product</span>
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
