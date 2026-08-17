import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  MessageSquare, 
  Check, 
  ShieldCheck, 
  Video, 
  Edit, 
  Trash2,
  Sparkles, 
  ChevronRight, 
  ChevronLeft,
  ZoomIn,
  Package,
  Layers,
  Palette,
  Ruler,
  Maximize2,
  Tag,
  ArrowRight,
  ShoppingBag,
  Plus,
  Minus
} from 'lucide-react';
import { Product, BusinessConfig } from '../types';
import { VideoPlayer } from './VideoPlayer';
import { ProductDeliveryEstimator } from './ProductDeliveryEstimator';

interface QuickViewModalProps {
  product: Product | null;
  config: BusinessConfig;
  allProducts?: Product[];
  isAdmin?: boolean;
  onEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onSelectProduct?: (product: Product) => void;
  onAddToCart?: (product: Product, quantity: number, selectedColor?: string, selectedSize?: string, selectedQuality?: string, selectedVariant?: string) => void;
  onClose: () => void;
}

export const QuickViewModal: React.FC<QuickViewModalProps> = ({
  product,
  config,
  allProducts = [],
  isAdmin = false,
  onEditProduct,
  onDeleteProduct,
  onSelectProduct,
  onAddToCart,
  onClose
}) => {
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);
  const [isFullscreenZoom, setIsFullscreenZoom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedQuality, setSelectedQuality] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  useEffect(() => {
    if (product) {
      setSelectedColor(product.availableColors?.[0] || product.availableFinishes?.[0] || '');
      setSelectedSize(product.availableSizes?.[0] || '');
      setSelectedQuality(product.availableMaterials?.[0] || '');
      setSelectedVariant(product.availableVariants?.[0] || '');
      setQuantity(1);
      setSelectedImageIndex(0);
    }
  }, [product]);

  if (!product) return null;

  // Compile list of all images available for gallery
  const galleryImages = [
    product.image,
    ...(product.images && Array.isArray(product.images) ? product.images.filter(img => img !== product.image) : [])
  ];

  const currentImage = galleryImages[selectedImageIndex] || product.image;

  // Exact WhatsApp number as required: +92 310 8002863
  const targetWhatsAppNumber = "923108002863";

  // Exact pre-filled WhatsApp message format as requested:
  const handleWhatsAppOrder = () => {
    const message = `Hello,\n\nI would like to order this product.\n\nProduct Name:\n${product.name}\n\nCategory:\n${product.category || 'Sanitaryware'}\n\nPlease provide availability and quotation.`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${targetWhatsAppNumber}?text=${encoded}`, '_blank');
  };

  const hasVideos = product.videos && product.videos.length > 0;
  const currentVideo = hasVideos ? product.videos![selectedVideoIndex] || product.videos![0] : null;

  // Derive colors if available or provide fallback defaults based on finishes/category
  const displayColors = product.availableColors || product.availableFinishes || ['Chrome', 'Matte Black', 'Brushed Gold', 'Gunmetal'];
  const displaySizes = product.availableSizes || ['Standard', 'Medium 12"', 'Large 24"'];
  const displayVariants = product.availableVariants || ['Concealed Mount', 'Countertop', 'Exposed Fittings'];
  const displayMaterials = product.availableMaterials || [product.specs?.['Material'] || 'Premium Brass & Ceramic'];
  const stockStatus = product.stockStatus || 'In Stock - Ready for Order';

  // Similar products from same category or fallback
  const safeAllProducts = Array.isArray(allProducts) ? allProducts : [];
  const similarProducts = safeAllProducts.filter(
    p => p && p.id !== product.id && (p.categoryId === product.categoryId || (p.category && product.category && p.category === product.category))
  ).slice(0, 4);

  const fallbackSimilar = similarProducts.length > 0 
    ? similarProducts 
    : safeAllProducts.filter(p => p && p.id !== product.id).slice(0, 4);

  const handleSelectRelated = (relatedProd: Product) => {
    if (onSelectProduct) {
      onSelectProduct(relatedProd);
      setSelectedImageIndex(0);
      setSelectedVideoIndex(0);
      if (scrollRef.current) {
        scrollRef.current.scrollTop = 0;
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900/90 border border-slate-800/90 rounded-3xl max-w-5xl w-full overflow-hidden shadow-2xl relative my-auto max-h-[92vh] flex flex-col glow-blue-ambient">
        
        {/* Top Sticky Bar */}
        <div className="flex items-center justify-between p-4 px-6 bg-slate-950/90 border-b border-slate-800/80 z-20 backdrop-blur-md">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-blue-950/80 border border-blue-500/40 text-blue-300 text-[11px] font-bold uppercase tracking-wider">
              {product.brand || product.category}
            </span>

            <span className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{stockStatus}</span>
            </span>

            {product.badge && (
              <span className="px-2.5 py-1 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-[10px] font-bold uppercase tracking-wider">
                {product.badge}
              </span>
            )}

            {isAdmin && (
              <span className="px-2.5 py-1 rounded-lg bg-amber-950/80 border border-amber-500/40 text-amber-300 text-[10px] font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin View</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isAdmin && onEditProduct && (
              <button
                onClick={() => onEditProduct(product)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md"
              >
                <Edit className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Edit Product</span>
              </button>
            )}

            {isAdmin && onDeleteProduct && (
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to delete this product?')) {
                    onDeleteProduct(product.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all shadow-md"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Delete Product</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              title="Close Panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div ref={scrollRef} className="p-4 sm:p-6 md:p-8 overflow-y-auto space-y-8">
          
          {/* MAIN PRODUCT GRID: Interactive Gallery + Detailed Specs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Gallery with Thumbnails & Fullscreen Zoom (5 columns on desktop) */}
            <div className="lg:col-span-6 space-y-3">
              
              {/* Main Image Box */}
              <div className="relative rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden group h-72 sm:h-96 flex items-center justify-center">
                <img
                  src={currentImage}
                  alt={product.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-50 pointer-events-none" />

                {/* Price Tag if available */}
                {product.price && (
                  <div className="absolute bottom-3 left-3 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700 text-emerald-400 font-bold text-sm shadow-xl backdrop-blur-md">
                    {product.price}
                  </div>
                )}

                {/* Gallery Zoom & Navigation overlay */}
                <button
                  onClick={() => setIsFullscreenZoom(true)}
                  className="absolute top-3 right-3 p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-blue-300 opacity-80 hover:opacity-100 hover:bg-slate-800 transition-all shadow-xl backdrop-blur-md"
                  title="Fullscreen Image Zoom"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {galleryImages.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : galleryImages.length - 1))}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/80 border border-slate-800 text-white hover:bg-blue-600 transition-all"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setSelectedImageIndex((prev) => (prev < galleryImages.length - 1 ? prev + 1 : 0))}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/80 border border-slate-800 text-white hover:bg-blue-600 transition-all"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnail Strip */}
              {galleryImages.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-2">
                  {galleryImages.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImageIndex(idx)}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition-all shrink-0 ${
                        selectedImageIndex === idx
                          ? 'border-blue-500 scale-105 shadow-md shadow-blue-950'
                          : 'border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* RIGHT COLUMN: Title, Brand, Colors, Sizes, Materials, Specs (6 columns on desktop) */}
            <div className="lg:col-span-6 space-y-5">
              <div>
                <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block mb-1">
                  {product.brand ? `${product.brand} • ${product.category}` : product.category}
                </span>

                <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif leading-tight">
                  {product.name}
                </h2>

                <p className="mt-3 text-slate-300 text-xs sm:text-sm font-light leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* AVAILABLE COLORS */}
              {displayColors && displayColors.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-blue-400" />
                      <span>Select Color / Finish:</span>
                    </div>
                    {selectedColor && <span className="text-blue-400 text-[11px]">{selectedColor}</span>}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {displayColors.map((color, cidx) => {
                      const isSelected = selectedColor === color;
                      return (
                        <button
                          key={cidx}
                          type="button"
                          onClick={() => setSelectedColor(color)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all active:scale-95 ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-400 shadow-lg shadow-blue-600/30 font-bold'
                              : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-400'}`} />
                          <span>{color}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AVAILABLE SIZES & VARIANTS GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {displaySizes && displaySizes.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Ruler className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Select Size:</span>
                      </div>
                      {selectedSize && <span className="text-cyan-400 text-[11px]">{selectedSize}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {displaySizes.map((sz, idx) => {
                        const isSelected = selectedSize === sz;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedSize(sz)}
                            className={`px-3 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                              isSelected
                                ? 'bg-cyan-600 text-white border-cyan-400 font-bold'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {sz}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {displayVariants && displayVariants.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Select Variant:</span>
                      </div>
                      {selectedVariant && <span className="text-indigo-400 text-[11px]">{selectedVariant}</span>}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {displayVariants.map((v, idx) => {
                        const isSelected = selectedVariant === v;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setSelectedVariant(v)}
                            className={`px-3 py-1 rounded-lg border text-[11px] font-medium transition-all ${
                              isSelected
                                ? 'bg-indigo-600 text-white border-indigo-400 font-bold'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                            }`}
                          >
                            {v}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* MATERIALS & BRAND */}
              {displayMaterials && displayMaterials.length > 0 && (
                <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
                    <Package className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Material Grade:</span>
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    {displayMaterials.join(', ')}
                  </div>
                </div>
              )}

              {/* Key Features Bullet List */}
              {product.features && product.features.length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-300 block">Key Features & Highlights:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {product.features.map((feat, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-200">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Technical Specifications Table */}
              {product.specs && Object.keys(product.specs).length > 0 && (
                <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 space-y-2">
                  <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                    Technical Specifications
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    {Object.entries(product.specs).map(([key, val]) => (
                      <div key={key} className="flex items-center justify-between py-1 border-b border-slate-900/90">
                        <span className="text-slate-400">{key}:</span>
                        <span className="text-slate-200 font-semibold">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PRICE & STOCK AVAILABILITY BLOCK */}
              <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800/80 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estimated Price / Wholesale Rate</span>
                  <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-serif">
                    {product.hidePrice ? 'Call for Price' : (product.isPriceOnRequest ? 'Price on Request' : (product.price || 'Call for Price'))}
                  </span>
                </div>

                {!product.hideStockBadge && (
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Availability</span>
                    <span className="px-3 py-1 rounded-lg bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold text-xs inline-block mt-0.5">
                      {product.stockStatus || 'In Stock'}
                    </span>
                  </div>
                )}
              </div>

              {/* DYNAMIC SMART DELIVERY ESTIMATION SYSTEM */}
              <ProductDeliveryEstimator product={product} />

            </div>

          </div>

          {/* DEDICATED PRODUCT VIDEO SHOWCASE */}
          <div className="p-5 sm:p-6 rounded-3xl bg-slate-950/80 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-blue-950 border border-blue-800/60 text-blue-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white font-serif">Product Video Demonstration</h3>
                  <p className="text-xs text-slate-400 font-light">Watch HD product feature video & walkthrough</p>
                </div>
              </div>

              {hasVideos && product.videos!.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                  {product.videos!.map((vid, vidx) => (
                    <button
                      key={vid.id}
                      onClick={() => setSelectedVideoIndex(vidx)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                        selectedVideoIndex === vidx
                          ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      Video {vidx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {hasVideos && currentVideo ? (
              <div className="space-y-3">
                <VideoPlayer video={currentVideo} />
                <div className="flex items-center justify-between text-xs text-slate-400 px-1">
                  <span className="font-semibold text-slate-200">{currentVideo.title}</span>
                  <span className="text-[11px] text-blue-400 uppercase font-mono">{currentVideo.type} HD Player</span>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center bg-slate-900/60 border border-slate-800/60 rounded-2xl space-y-1">
                <Video className="w-7 h-7 text-slate-600 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">No demonstration video attached yet.</p>
                {isAdmin && (
                  <p className="text-[11px] text-blue-400">
                    Admin can edit this product to add YouTube/MP4 video links.
                  </p>
                )}
              </div>
            )}
          </div>

          {/* QUANTITY & ADD TO CART / WHATSAPP ACTION BUTTONS */}
          <div className="pt-2 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {/* Quantity selector */}
              <div className="flex items-center justify-between sm:justify-start gap-3 bg-slate-950 p-2.5 rounded-2xl border border-slate-800 shrink-0">
                <span className="text-xs font-bold text-slate-400 pl-1">Quantity:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setQuantity(q => Math.max(1, q - 1))}
                    className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-extrabold text-white font-mono">{quantity}</span>
                  <button
                    type="button"
                    onClick={() => setQuantity(q => q + 1)}
                    className="p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Add to Cart button */}
              {onAddToCart && (
                <button
                  onClick={() => {
                    onAddToCart(product, quantity, selectedColor, selectedSize, selectedQuality, selectedVariant);
                  }}
                  className="flex-1 py-3.5 px-5 rounded-2xl text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all duration-200 shadow-xl shadow-blue-950/50 flex items-center justify-center gap-2.5 active:scale-98 border border-blue-400/30"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Add to Shopping Cart</span>
                </button>
              )}
            </div>

            {/* Direct WhatsApp Order button */}
            <button
              onClick={handleWhatsAppOrder}
              className="w-full py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-emerald-700 transition-all duration-300 shadow-xl flex items-center justify-center gap-2.5 border border-slate-800 hover:border-emerald-500"
            >
              <MessageSquare className="w-4 h-4 text-emerald-400" />
              <span>Order via WhatsApp Directly (+92 310 8002863)</span>
            </button>
          </div>

          {/* YOU MAY ALSO LIKE (SIMILAR PRODUCTS) */}
          {fallbackSimilar.length > 0 && (
            <div className="pt-6 border-t border-slate-800/80 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white font-serif">You May Also Like</h3>
                  <p className="text-xs text-slate-400">Explore similar products from our luxury collection</p>
                </div>
                <Sparkles className="w-4 h-4 text-blue-400" />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {fallbackSimilar.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectRelated(item)}
                    className="group glass-card p-3 rounded-2xl border border-slate-800/80 hover:border-blue-500/40 transition-all cursor-pointer flex flex-col justify-between"
                  >
                    <div className="relative h-28 w-full rounded-xl overflow-hidden bg-slate-950 mb-2">
                      <img
                        src={item.image}
                        alt={item.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-blue-400 uppercase font-bold block">
                        {item.brand || item.category}
                      </span>
                      <h4 className="text-xs font-bold text-white line-clamp-1 group-hover:text-blue-300 transition-colors">
                        {item.name}
                      </h4>
                      {item.price && (
                        <span className="text-[11px] font-semibold text-emerald-400 block mt-1">
                          {item.price}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* FULLSCREEN LIGHTBOX ZOOM MODAL */}
      {isFullscreenZoom && (
        <div className="fixed inset-0 z-60 bg-slate-950/98 flex items-center justify-center p-4">
          <button
            onClick={() => setIsFullscreenZoom(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-slate-900 border border-slate-700 text-white hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={currentImage}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="max-w-full max-h-[88vh] object-contain rounded-2xl shadow-2xl"
          />
        </div>
      )}
    </div>
  );
};
