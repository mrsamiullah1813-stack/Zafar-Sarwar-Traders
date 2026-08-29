import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Play,
  Film,
  Image as ImageIcon,
  Sparkles,
  Layers,
  Box,
  Palette,
  ExternalLink
} from 'lucide-react';
import { Product, ProductVariant, PaintShade, ProductVideo } from '../types';
import { VideoPlayer } from './VideoPlayer';

export interface ProductMediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;
  title: string;
  caption?: string;
  badge?: string;
  badgeType?: 'primary' | 'variant' | 'shade' | 'video' | 'gallery';
  variantId?: string;
  variantName?: string;
  variantSku?: string;
  videoType?: 'mp4' | 'youtube' | 'vimeo' | 'embed';
  videoData?: ProductVideo;
}

/**
 * Compiles all available media from a product including:
 * 1. Primary product image
 * 2. Additional product gallery images
 * 3. Variant-specific photos (with variant name & SKU metadata)
 * 4. Paint shade reference images & shade sheets
 * 5. HD Product demonstration videos
 */
export function compileProductMediaList(
  product: Product,
  selectedVariantObj?: ProductVariant | null,
  selectedShade?: PaintShade | null
): ProductMediaItem[] {
  const items: ProductMediaItem[] = [];
  const seenUrls = new Set<string>();

  // 1. Primary Product Image
  if (product.image && product.image.trim() !== '') {
    seenUrls.add(product.image);
    items.push({
      id: `media-primary-${product.id}`,
      type: 'image',
      url: product.image,
      title: product.name,
      caption: 'Showroom Flagship Display Photo',
      badge: 'Main Photo',
      badgeType: 'primary'
    });
  }

  // 2. Additional Gallery Images
  if (Array.isArray(product.images)) {
    product.images.forEach((imgUrl, idx) => {
      if (imgUrl && typeof imgUrl === 'string' && imgUrl.trim() !== '' && !seenUrls.has(imgUrl)) {
        seenUrls.add(imgUrl);
        items.push({
          id: `media-gallery-${product.id}-${idx}`,
          type: 'image',
          url: imgUrl,
          title: product.name,
          caption: `Gallery View ${idx + 2}`,
          badge: `Photo ${idx + 2}`,
          badgeType: 'gallery'
        });
      }
    });
  }

  // 3. Variant-Specific Photos
  const allVariants: ProductVariant[] = [
    ...(Array.isArray(product.variantsList) ? product.variantsList : []),
    ...(Array.isArray(product.variantsConfig?.variants) ? product.variantsConfig.variants : [])
  ];

  const uniqueVariantMap = new Map<string, ProductVariant>();
  allVariants.forEach((v) => {
    if (v && v.id && !uniqueVariantMap.has(v.id)) {
      uniqueVariantMap.set(v.id, v);
    }
  });

  uniqueVariantMap.forEach((v) => {
    if (v.image && v.image.trim() !== '' && !seenUrls.has(v.image)) {
      seenUrls.add(v.image);
      const optionLabel = product.optionName || 'Variant';
      items.push({
        id: `media-variant-${v.id}`,
        type: 'image',
        url: v.image,
        title: `${product.name} — ${v.name}`,
        caption: `${optionLabel}: ${v.name}${v.sku ? ` • SKU: ${v.sku}` : ''}`,
        badge: v.name,
        badgeType: 'variant',
        variantId: v.id,
        variantName: v.name,
        variantSku: v.sku
      });
    }
  });

  // 4. Paint Shade Cards & Reference Images
  const shadeSheetUrl = product.shadeSheetUrl || product.paintShadesConfig?.shadeSheetUrl;
  const shadeSheetName = product.paintShadesConfig?.shadeSheetName || 'Manufacturer Color Chart & Shade Card Reference';

  if (shadeSheetUrl && shadeSheetUrl.trim() !== '' && !seenUrls.has(shadeSheetUrl)) {
    seenUrls.add(shadeSheetUrl);
    items.push({
      id: `media-shadesheet-${product.id}`,
      type: 'image',
      url: shadeSheetUrl,
      title: `${product.name} — Official Shade Sheet`,
      caption: shadeSheetName,
      badge: 'Shade Card',
      badgeType: 'shade'
    });
  }

  const shades = Array.isArray(product.shadesList) ? product.shadesList : (Array.isArray(product.paintShadesConfig?.shades) ? product.paintShadesConfig.shades : []);
  shades.forEach((shade) => {
    const shadeImg = shade.referenceImage || shade.image;
    if (shadeImg && shadeImg.trim() !== '' && !seenUrls.has(shadeImg)) {
      seenUrls.add(shadeImg);
      items.push({
        id: `media-shade-${shade.id}`,
        type: 'image',
        url: shadeImg,
        title: `${product.name} — Shade ${shade.code} (${shade.name})`,
        caption: `Shade Code: ${shade.code} • Color: ${shade.name}`,
        badge: `Shade ${shade.code}`,
        badgeType: 'shade'
      });
    }
  });

  // 5. Product Videos
  if (Array.isArray(product.videos)) {
    product.videos.forEach((vid, idx) => {
      if (vid && vid.url && vid.url.trim() !== '') {
        items.push({
          id: `media-video-${vid.id || idx}`,
          type: 'video',
          url: vid.url,
          title: vid.title || `${product.name} Video Demonstration`,
          caption: `${vid.type ? vid.type.toUpperCase() : 'HD'} Video Walkthrough & Feature Guide`,
          badge: 'HD Video',
          badgeType: 'video',
          videoType: vid.type || 'embed',
          videoData: vid
        });
      }
    });
  }

  // Fallback placeholder if no image exists
  if (items.length === 0) {
    items.push({
      id: `media-fallback-${product.id}`,
      type: 'image',
      url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
      title: product.name,
      caption: 'Luxury Sanitaryware & Building Materials',
      badge: 'Display',
      badgeType: 'primary'
    });
  }

  return items;
}

export interface ProductMediaViewerProps {
  isOpen: boolean;
  product: Product;
  selectedVariantObj?: ProductVariant | null;
  selectedShade?: PaintShade | null;
  initialMediaIndex?: number;
  initialMediaUrl?: string;
  onClose: () => void;
  onSelectVariant?: (variant: ProductVariant) => void;
}

export const ProductMediaViewer: React.FC<ProductMediaViewerProps> = ({
  isOpen,
  product,
  selectedVariantObj,
  selectedShade,
  initialMediaIndex = 0,
  initialMediaUrl,
  onClose,
  onSelectVariant
}) => {
  const [mediaList, setMediaList] = useState<ProductMediaItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [isFullscreenMode, setIsFullscreenMode] = useState<boolean>(false);
  const [imageLoading, setImageLoading] = useState<boolean>(true);

  // References for gesture tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number }>({ x: 0, y: 0, panX: 0, panY: 0 });
  const touchStartRef = useRef<{ x: number; y: number; time: number }>({ x: 0, y: 0, time: 0 });
  const touchPinchDistRef = useRef<number | null>(null);
  const lastTapRef = useRef<number>(0);
  const thumbnailStripRef = useRef<HTMLDivElement>(null);

  // Compile media list whenever product or variant context changes
  useEffect(() => {
    if (!product) return;
    const list = compileProductMediaList(product, selectedVariantObj, selectedShade);
    setMediaList(list);

    // Determine initial index
    let startIdx = 0;
    if (initialMediaUrl) {
      const foundIdx = list.findIndex((m) => m.url === initialMediaUrl);
      if (foundIdx !== -1) startIdx = foundIdx;
    } else if (selectedVariantObj?.image) {
      const foundVariantIdx = list.findIndex((m) => m.variantId === selectedVariantObj.id || m.url === selectedVariantObj.image);
      if (foundVariantIdx !== -1) startIdx = foundVariantIdx;
    } else if (initialMediaIndex >= 0 && initialMediaIndex < list.length) {
      startIdx = initialMediaIndex;
    }
    setCurrentIndex(startIdx);
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, [product, selectedVariantObj, selectedShade, initialMediaIndex, initialMediaUrl, isOpen]);

  // Lock background scroll when open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Reset zoom & pan when navigating to a new item
  const resetZoom = useCallback(() => {
    setZoomLevel(1);
    setPanPosition({ x: 0, y: 0 });
  }, []);

  const handleNext = useCallback(() => {
    if (mediaList.length <= 1) return;
    setImageLoading(true);
    resetZoom();
    setCurrentIndex((prev) => (prev < mediaList.length - 1 ? prev + 1 : 0));
  }, [mediaList.length, resetZoom]);

  const handlePrev = useCallback(() => {
    if (mediaList.length <= 1) return;
    setImageLoading(true);
    resetZoom();
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : mediaList.length - 1));
  }, [mediaList.length, resetZoom]);

  // Auto-scroll active thumbnail into view
  useEffect(() => {
    if (thumbnailStripRef.current) {
      const activeThumb = thumbnailStripRef.current.querySelector(`[data-thumb-index="${currentIndex}"]`) as HTMLElement;
      if (activeThumb) {
        activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [currentIndex]);

  // Zoom controls
  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.5, 4));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => {
      const next = Math.max(prev - 0.5, 1);
      if (next === 1) setPanPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const toggleDoubleTapZoom = (clientX?: number, clientY?: number) => {
    if (zoomLevel > 1) {
      resetZoom();
    } else {
      setZoomLevel(2.5);
      // Optional subtle offset toward click
      if (clientX && clientY && imageRef.current) {
        const rect = imageRef.current.getBoundingClientRect();
        const offsetX = (rect.width / 2 - (clientX - rect.left)) * 0.5;
        const offsetY = (rect.height / 2 - (clientY - rect.top)) * 0.5;
        setPanPosition({ x: Math.max(-150, Math.min(150, offsetX)), y: Math.max(-150, Math.min(150, offsetY)) });
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        handlePrev();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-' || e.key === '_') {
        handleZoomOut();
      } else if (e.key === '0' || e.key === 'r' || e.key === 'R') {
        resetZoom();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleNext, handlePrev, onClose, resetZoom]);

  // Fullscreen toggle API
  const toggleFullscreen = () => {
    try {
      if (!document.fullscreenElement) {
        containerRef.current?.requestFullscreen?.().catch(() => {});
        setIsFullscreenMode(true);
      } else {
        document.exitFullscreen?.().catch(() => {});
        setIsFullscreenMode(false);
      }
    } catch {
      setIsFullscreenMode((prev) => !prev);
    }
  };

  // Mouse Drag / Pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomLevel <= 1) return;
    setIsDragging(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: panPosition.x,
      panY: panPosition.y
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomLevel <= 1) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;
    const maxPan = (zoomLevel - 1) * 280;
    setPanPosition({
      x: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.panX + deltaX)),
      y: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.panY + deltaY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mobile Touch Gestures: Swipe, Pinch-to-zoom & Double-tap
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const now = Date.now();
      // Detect double tap (< 300ms)
      if (now - lastTapRef.current < 300) {
        toggleDoubleTapZoom(touch.clientX, touch.clientY);
        lastTapRef.current = 0;
        return;
      }
      lastTapRef.current = now;

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: now
      };

      if (zoomLevel > 1) {
        setIsDragging(true);
        dragStartRef.current = {
          x: touch.clientX,
          y: touch.clientY,
          panX: panPosition.x,
          panY: panPosition.y
        };
      }
    } else if (e.touches.length === 2) {
      // Pinch to zoom start
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchPinchDistRef.current = dist;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchPinchDistRef.current !== null) {
      // Active pinch zoom
      const currentDist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = currentDist / touchPinchDistRef.current;
      setZoomLevel((prev) => Math.max(1, Math.min(4, prev * (ratio > 1 ? 1.03 : 0.97))));
      touchPinchDistRef.current = currentDist;
    } else if (e.touches.length === 1 && zoomLevel > 1 && isDragging) {
      // Pan when zoomed
      const touch = e.touches[0];
      const deltaX = touch.clientX - dragStartRef.current.x;
      const deltaY = touch.clientY - dragStartRef.current.y;
      const maxPan = (zoomLevel - 1) * 260;
      setPanPosition({
        x: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.panX + deltaX)),
        y: Math.max(-maxPan, Math.min(maxPan, dragStartRef.current.panY + deltaY))
      });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsDragging(false);
    touchPinchDistRef.current = null;

    if (e.changedTouches.length === 1 && zoomLevel <= 1.05) {
      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;
      const elapsed = Date.now() - touchStartRef.current.time;

      // Horizontal swipe threshold
      if (Math.abs(deltaX) > 45 && Math.abs(deltaY) < 70 && elapsed < 500) {
        if (deltaX < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
  };

  if (!isOpen || !product) return null;

  const currentMedia = mediaList[currentIndex] || mediaList[0];
  const isVideo = currentMedia?.type === 'video';

  return (
    <AnimatePresence>
      <motion.div
        ref={containerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-[100] bg-slate-950/98 backdrop-blur-2xl flex flex-col justify-between select-none overflow-hidden"
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* TOP CONTROL & SHOWROOM HEADER BAR */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3.5 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md z-30 shrink-0 gap-3">
          
          {/* Left info: Brand, Product Name, Caption & Counter */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="hidden sm:flex items-center justify-center w-9 h-9 rounded-xl bg-blue-950/80 border border-blue-500/40 text-blue-400 shrink-0">
              {isVideo ? <Film className="w-4 h-4" /> : <ImageIcon className="w-4 h-4" />}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider font-mono">
                  {product.brand || product.category}
                </span>

                {currentMedia?.badge && (
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${
                      currentMedia.badgeType === 'variant'
                        ? 'bg-indigo-950/90 text-indigo-300 border-indigo-500/40'
                        : currentMedia.badgeType === 'video'
                        ? 'bg-rose-950/90 text-rose-300 border-rose-500/40'
                        : currentMedia.badgeType === 'shade'
                        ? 'bg-amber-950/90 text-amber-300 border-amber-500/40'
                        : 'bg-slate-900 text-slate-300 border-slate-700'
                    }`}
                  >
                    {currentMedia.badge}
                  </span>
                )}

                {/* Media Counter */}
                <span className="px-2 py-0.5 rounded-md bg-slate-900 border border-slate-800 text-slate-400 font-mono text-[11px] font-bold">
                  {currentIndex + 1} / {mediaList.length}
                </span>
              </div>

              <h3 className="text-xs sm:text-sm font-extrabold text-white truncate font-serif mt-0.5">
                {product.name}
              </h3>

              {currentMedia?.caption && (
                <p className="text-[11px] text-slate-400 truncate hidden sm:block">
                  {currentMedia.caption}
                </p>
              )}
            </div>
          </div>

          {/* Right Toolbar: Zoom controls, Fullscreen, and Close */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {!isVideo && (
              <div className="hidden sm:flex items-center bg-slate-900/90 border border-slate-800 rounded-xl p-1 gap-1">
                <button
                  onClick={handleZoomOut}
                  disabled={zoomLevel <= 1}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title="Zoom Out (-)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>

                <span className="text-[10px] font-mono font-bold text-slate-300 px-1.5 min-w-[40px] text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>

                <button
                  onClick={handleZoomIn}
                  disabled={zoomLevel >= 4}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                  title="Zoom In (+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>

                {zoomLevel > 1 && (
                  <button
                    onClick={resetZoom}
                    className="p-1.5 rounded-lg text-blue-400 hover:text-blue-300 hover:bg-slate-800 transition-colors"
                    title="Reset Zoom (0 / R)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {/* Mobile Zoom button */}
            {!isVideo && (
              <button
                onClick={() => toggleDoubleTapZoom()}
                className="sm:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
                title="Toggle Zoom"
              >
                {zoomLevel > 1 ? <RotateCcw className="w-4 h-4 text-blue-400" /> : <ZoomIn className="w-4 h-4" />}
              </button>
            )}

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
              title="Toggle Fullscreen (F)"
            >
              {isFullscreenMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 sm:px-3 sm:py-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 hover:text-white transition-all flex items-center gap-1.5 font-bold text-xs shadow-lg shadow-rose-950/30"
              title="Close Viewer (Esc)"
            >
              <X className="w-4 h-4" />
              <span className="hidden sm:inline">Close</span>
            </button>
          </div>
        </div>

        {/* MAIN STAGE / MEDIA DISPLAY CANVAS */}
        <div className="relative flex-1 flex items-center justify-center p-2 sm:p-6 md:p-8 overflow-hidden">
          
          {/* Previous Media Arrow */}
          {mediaList.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-slate-900/90 border border-slate-700/80 text-white hover:bg-blue-600 hover:border-blue-400 hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center justify-center backdrop-blur-md group"
              title="Previous Item (Left Arrow / Swipe Right)"
            >
              <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Next Media Arrow */}
          {mediaList.length > 1 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 sm:w-14 sm:h-14 rounded-full bg-slate-900/90 border border-slate-700/80 text-white hover:bg-blue-600 hover:border-blue-400 hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center justify-center backdrop-blur-md group"
              title="Next Item (Right Arrow / Swipe Left)"
            >
              <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Media Content Stage */}
          <div className="relative w-full h-full flex items-center justify-center">
            {isVideo && currentMedia.videoData ? (
              <div className="w-full max-w-4xl max-h-[75vh] flex items-center justify-center p-2">
                <VideoPlayer video={currentMedia.videoData} className="w-full shadow-2xl border-slate-700" />
              </div>
            ) : (
              <div
                className={`relative max-w-full max-h-full flex items-center justify-center transition-all ${
                  zoomLevel > 1 ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-zoom-in'
                }`}
                onMouseDown={handleMouseDown}
                onDoubleClick={(e) => toggleDoubleTapZoom(e.clientX, e.clientY)}
              >
                {/* Image loading placeholder shimmer */}
                {imageLoading && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-blue-400 animate-pulse">
                    <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin mb-3" />
                    <span className="text-xs font-mono font-bold text-slate-400">Loading High-Res Display...</span>
                  </div>
                )}

                <motion.img
                  key={currentMedia.id}
                  ref={imageRef}
                  src={currentMedia.url}
                  alt={currentMedia.title}
                  referrerPolicy="no-referrer"
                  onLoad={() => setImageLoading(false)}
                  onError={(e) => {
                    setImageLoading(false);
                    const target = e.currentTarget;
                    if (!target.src.includes('unsplash.com/photo-1584622650111')) {
                      target.src = 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80';
                    }
                  }}
                  style={{
                    transform: `scale(${zoomLevel}) translate(${panPosition.x / zoomLevel}px, ${panPosition.y / zoomLevel}px)`,
                    transition: isDragging ? 'none' : 'transform 0.2s ease-out'
                  }}
                  className="max-h-[68vh] sm:max-h-[74vh] md:max-h-[78vh] max-w-[94vw] object-contain rounded-2xl shadow-2xl drop-shadow-[0_20px_50px_rgba(0,0,0,0.8)] pointer-events-auto"
                />

                {/* Floating Variant Info Card if this photo belongs to a variant */}
                {currentMedia.variantName && (
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-4 py-2 rounded-xl bg-slate-950/90 border border-indigo-500/50 shadow-2xl backdrop-blur-md flex items-center gap-2.5 z-20 pointer-events-none">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    <div className="text-center">
                      <span className="text-xs font-extrabold text-white font-mono block">
                        {currentMedia.variantName}
                      </span>
                      {currentMedia.variantSku && (
                        <span className="text-[10px] text-indigo-300 font-mono block">
                          SKU: {currentMedia.variantSku}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* BOTTOM THUMBNAIL NAVIGATION STRIP & KEYBOARD HINTS */}
        <div className="bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-md px-3 sm:px-6 py-3 shrink-0 z-30 space-y-2">
          
          {/* Thumbnails list */}
          {mediaList.length > 1 && (
            <div
              ref={thumbnailStripRef}
              className="flex items-center justify-start sm:justify-center gap-2 sm:gap-3 overflow-x-auto py-1 no-scrollbar scroll-smooth"
            >
              {mediaList.map((item, idx) => {
                const isActive = idx === currentIndex;

                return (
                  <button
                    key={item.id}
                    data-thumb-index={idx}
                    onClick={() => {
                      setImageLoading(true);
                      resetZoom();
                      setCurrentIndex(idx);
                      // If user clicks a variant image and callback exists, sync variant
                      if (item.variantId && onSelectVariant) {
                        const matchedVar = product.variantsList?.find((v) => v.id === item.variantId) ||
                                           product.variantsConfig?.variants?.find((v) => v.id === item.variantId);
                        if (matchedVar) onSelectVariant(matchedVar);
                      }
                    }}
                    className={`relative rounded-xl overflow-hidden shrink-0 transition-all group ${
                      isActive
                        ? 'w-16 h-16 sm:w-20 sm:h-20 border-2 border-blue-500 ring-2 ring-blue-500/40 shadow-lg shadow-blue-950 scale-105'
                        : 'w-14 h-14 sm:w-16 sm:h-16 border border-slate-800 opacity-60 hover:opacity-100 hover:border-slate-600'
                    }`}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full bg-slate-900 flex flex-col items-center justify-center text-blue-400 p-1">
                        <Play className="w-5 h-5 fill-blue-500 text-blue-500" />
                        <span className="text-[8px] font-bold text-slate-300 font-mono mt-0.5 uppercase">Video</span>
                      </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    )}

                    {/* Thumbnail Badge Overlay */}
                    {item.badge && (
                      <span className={`absolute bottom-0 inset-x-0 text-[8px] font-bold text-center py-0.5 truncate px-1 text-white ${
                        item.badgeType === 'variant' ? 'bg-indigo-600/90' :
                        item.badgeType === 'video' ? 'bg-rose-600/90' :
                        item.badgeType === 'shade' ? 'bg-amber-600/90' : 'bg-slate-900/90'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Desktop Keyboard & Mobile Touch helper hints */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-2 pt-1">
            <div className="flex items-center gap-3">
              <span className="hidden sm:inline">
                Keyboard: <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">←</kbd> <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">→</kbd> Navigate • <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">Esc</kbd> Close
              </span>
              <span className="hidden md:inline">
                • <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">+</kbd> <kbd className="px-1 py-0.5 bg-slate-900 border border-slate-800 rounded text-slate-300">-</kbd> Zoom • Double Click to Zoom
              </span>
              <span className="sm:hidden">
                Swipe left / right to browse • Pinch or Double-tap to zoom
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">
                Flagship Showroom Media Viewer
              </span>
            </div>
          </div>

        </div>

      </motion.div>
    </AnimatePresence>
  );
};
