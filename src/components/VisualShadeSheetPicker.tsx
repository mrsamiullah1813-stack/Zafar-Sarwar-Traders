import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  X, Check, ZoomIn, ZoomOut, Maximize2, Pipette, Plus,
  AlertTriangle, Palette, Sparkles, CheckCircle2, RefreshCw,
  Search, Info, Eye, Layers, ArrowRight, CornerDownLeft
} from 'lucide-react';
import { PaintShade } from '../types';
import { extractColorFromCanvas, getColorFamily, findDuplicateShade } from '../utils/paintShadeUtils';

interface VisualShadeSheetPickerProps {
  sheetUrl: string;
  currentShades: PaintShade[];
  onAddShade: (shade: PaintShade, overwrite?: boolean) => void;
  onClose: () => void;
  productTitle?: string;
}

export const VisualShadeSheetPicker: React.FC<VisualShadeSheetPickerProps> = ({
  sheetUrl,
  currentShades,
  onAddShade,
  onClose,
  productTitle
}) => {
  // Image & Canvas state
  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = 100%, 1.5, 2, etc.

  // Eyedropper cursor & Loupe state
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [hoverColor, setHoverColor] = useState<string>('#FFFFFF');

  // Currently sampled shade in composer
  const [sampledHex, setSampledHex] = useState<string>('#3B82F6');
  const [sampledSampleUrl, setSampledSampleUrl] = useState<string>('');
  const [shadeName, setShadeName] = useState<string>('');
  const [shadeCode, setShadeCode] = useState<string>('');
  const [priceAdjustment, setPriceAdjustment] = useState<number>(0);
  
  // Feedback & duplicate warning state
  const [justAddedName, setJustAddedName] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<PaintShade | null>(null);

  // Quick list of shades added in this session
  const [sessionAddedCount, setSessionAddedCount] = useState<number>(0);

  // Load and render image to offscreen canvas for instantaneous pixel color sampling
  useEffect(() => {
    if (!sheetUrl) return;
    setImageLoaded(false);
    setImageError(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      imgRef.current = img;
      setImageLoaded(true);

      // Render to internal sampling canvas
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvasRef.current = canvas;
      }
    };
    img.onerror = () => {
      // If cross-origin fails, retry without crossOrigin attribute
      const fallbackImg = new Image();
      fallbackImg.onload = () => {
        imgRef.current = fallbackImg;
        setImageLoaded(true);
      };
      fallbackImg.onerror = () => {
        setImageError(true);
      };
      fallbackImg.src = sheetUrl;
    };
    img.src = sheetUrl;
  }, [sheetUrl]);

  // Read color on mouse move for loupe
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setMousePos({ x, y });

    // Sample hover color if canvas is available
    if (imgRef.current && canvasRef.current) {
      const img = imgRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        const naturalW = img.naturalWidth || canvas.width;
        const naturalH = img.naturalHeight || canvas.height;
        const scaleX = naturalW / (rect.width * zoomLevel);
        const scaleY = naturalH / (rect.height * zoomLevel);
        
        const scrollLeft = containerRef.current.scrollLeft || 0;
        const scrollTop = containerRef.current.scrollTop || 0;

        const imgX = Math.round((x + scrollLeft) * scaleX);
        const imgY = Math.round((y + scrollTop) * scaleY);

        if (imgX >= 0 && imgX < naturalW && imgY >= 0 && imgY < naturalH) {
          try {
            const pixel = ctx.getImageData(imgX, imgY, 1, 1).data;
            const toHex = (c: number) => c.toString(16).padStart(2, '0');
            const hex = `#${toHex(pixel[0])}${toHex(pixel[1])}${toHex(pixel[2])}`.toUpperCase();
            setHoverColor(hex);
          } catch {
            // Ignore cross-origin read error
          }
        }
      }
    }
  };

  const handleMouseLeave = () => {
    setMousePos(null);
  };

  // Click handler to capture exact pixel color and create shade candidate
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current || !imgRef.current) return;

    const img = imgRef.current;
    const rect = containerRef.current.getBoundingClientRect();
    const scrollLeft = containerRef.current.scrollLeft || 0;
    const scrollTop = containerRef.current.scrollTop || 0;

    let hexColor = hoverColor;
    let sampleDataUrl = '';

    // Sample from canvas if available
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        const naturalW = img.naturalWidth || canvas.width;
        const naturalH = img.naturalHeight || canvas.height;
        const scaleX = naturalW / (rect.width * zoomLevel);
        const scaleY = naturalH / (rect.height * zoomLevel);

        const imgX = Math.round((e.clientX - rect.left + scrollLeft) * scaleX);
        const imgY = Math.round((e.clientY - rect.top + scrollTop) * scaleY);

        if (imgX >= 0 && imgX < naturalW && imgY >= 0 && imgY < naturalH) {
          try {
            // Sample a 3x3 average
            const startX = Math.max(0, imgX - 1);
            const startY = Math.max(0, imgY - 1);
            const w = Math.min(3, naturalW - startX);
            const h = Math.min(3, naturalH - startY);
            const pData = ctx.getImageData(startX, startY, w, h).data;
            
            let rTot = 0, gTot = 0, bTot = 0, count = 0;
            for (let i = 0; i < pData.length; i += 4) {
              rTot += pData[i];
              gTot += pData[i + 1];
              bTot += pData[i + 2];
              count++;
            }
            if (count > 0) {
              const toHex = (c: number) => c.toString(16).padStart(2, '0');
              hexColor = `#${toHex(Math.round(rTot / count))}${toHex(Math.round(gTot / count))}${toHex(Math.round(bTot / count))}`.toUpperCase();
            }

            // Create micro crop swatch thumbnail
            const thumbCanvas = document.createElement('canvas');
            thumbCanvas.width = 64;
            thumbCanvas.height = 64;
            const thumbCtx = thumbCanvas.getContext('2d');
            if (thumbCtx) {
              const cropSize = Math.max(20, Math.min(naturalW / 12, 80));
              const cropX = Math.max(0, Math.min(naturalW - cropSize, imgX - cropSize / 2));
              const cropY = Math.max(0, Math.min(naturalH - cropSize, imgY - cropSize / 2));
              thumbCtx.drawImage(img, cropX, cropY, cropSize, cropSize, 0, 0, 64, 64);
              sampleDataUrl = thumbCanvas.toDataURL('image/jpeg', 0.85);
            }
          } catch {
            // Ignore canvas error
          }
        }
      }
    }

    // Set sampled values into editor
    setSampledHex(hexColor);
    if (sampleDataUrl) {
      setSampledSampleUrl(sampleDataUrl);
    }

    // Check duplicate if code is already typed
    if (shadeCode.trim()) {
      const dup = currentShades.find(
        s => (s.code || '').trim().toLowerCase() === shadeCode.trim().toLowerCase()
      );
      setDuplicateWarning(dup || null);
    }

    // Auto-focus shade name input for rapid typing
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 50);
  };

  // Check duplicate when shade code changes
  const handleCodeChange = (codeVal: string) => {
    setShadeCode(codeVal);
    if (!codeVal.trim()) {
      setDuplicateWarning(null);
      return;
    }
    const dup = currentShades.find(
      s => (s.code || '').trim().toLowerCase() === codeVal.trim().toLowerCase()
    );
    setDuplicateWarning(dup || null);
  };

  // Save current sampled shade to product collection
  const handleSaveShade = (overwrite = false) => {
    const finalName = shadeName.trim() || `Shade ${currentShades.length + 1}`;
    const finalCode = shadeCode.trim() || `${3000 + currentShades.length + 1}`;

    // Duplicate verification
    if (!overwrite) {
      const existingDup = currentShades.find(
        s => (s.code || '').trim().toLowerCase() === finalCode.toLowerCase()
      );
      if (existingDup) {
        setDuplicateWarning(existingDup);
        return;
      }
    }

    const newShade: PaintShade = {
      id: duplicateWarning && overwrite ? duplicateWarning.id : `shade-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: finalName,
      code: finalCode,
      colorHex: sampledHex,
      referenceImage: sampledSampleUrl || '',
      image: sampledSampleUrl || '',
      isActive: true,
      displayOrder: duplicateWarning && overwrite ? (duplicateWarning.displayOrder ?? currentShades.length) : currentShades.length,
      priceAdjustment: Number(priceAdjustment) || 0
    };

    onAddShade(newShade, overwrite);
    setSessionAddedCount(prev => prev + 1);
    setJustAddedName(`${finalName} (${finalCode})`);

    // Reset inputs for next rapid click
    setShadeName('');
    setShadeCode('');
    setPriceAdjustment(0);
    setDuplicateWarning(null);

    // Auto-dismiss confirmation after 3s
    setTimeout(() => {
      setJustAddedName(null);
    }, 3000);
  };

  // Handle Enter key shortcut in inputs for speed
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveShade();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col overflow-hidden animate-in fade-in duration-200">
      {/* 1. TOP HEADER BAR */}
      <div className="p-3.5 sm:p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
            <Pipette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">Visual Paint Shade Picker</h3>
              <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/40">
                Click-to-Capture Eyedropper
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Click any color on the shade sheet image below to automatically sample its exact color, then enter the name & code.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {sessionAddedCount > 0 && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>+{sessionAddedCount} Added This Session</span>
            </span>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors flex items-center gap-1.5"
          >
            <X className="w-4 h-4" />
            <span>Done & Close</span>
          </button>
        </div>
      </div>

      {/* 2. MAIN SPLIT INTERACTION AREA */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT/CENTER: INTERACTIVE IMAGE CANVAS VIEWPORT */}
        <div className="flex-1 bg-slate-950 flex flex-col relative overflow-hidden">
          {/* Zoom & Viewport Controls Bar */}
          <div className="p-2.5 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between gap-2 shrink-0 z-10">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <Pipette className="w-3.5 h-3.5 text-indigo-400" />
              <span>Click anywhere on image to pick color</span>
            </div>

            <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.2))}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>

              <span className="px-2 text-[11px] font-mono font-bold text-indigo-300">
                {Math.round(zoomLevel * 100)}%
              </span>

              <button
                type="button"
                onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.2))}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="px-2 py-1 text-[10px] font-bold text-slate-300 hover:text-white rounded-lg hover:bg-slate-800 transition-colors border-l border-slate-800 ml-0.5"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Canvas Viewport */}
          <div
            ref={containerRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={handleImageClick}
            className="flex-1 overflow-auto flex items-center justify-center p-4 cursor-crosshair relative select-none"
            style={{ minHeight: '320px' }}
          >
            {imageError ? (
              <div className="text-center p-8 space-y-3 bg-slate-900/80 rounded-2xl border border-slate-800 max-w-md">
                <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
                <h4 className="text-sm font-bold text-white">Could Not Load Shade Sheet Image</h4>
                <p className="text-xs text-slate-400">
                  Please verify that the uploaded image URL is accessible or re-upload your shade card image in the admin panel.
                </p>
              </div>
            ) : !imageLoaded ? (
              <div className="flex flex-col items-center justify-center gap-3 text-slate-400 py-16">
                <RefreshCw className="w-8 h-8 animate-spin text-indigo-400" />
                <span className="text-xs font-semibold">Loading High-Resolution Shade Sheet...</span>
              </div>
            ) : (
              <div
                className="relative transition-transform duration-75 origin-center shadow-2xl rounded-xl overflow-hidden border border-slate-800 bg-slate-900 inline-block"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transformOrigin: 'top center'
                }}
              >
                <img
                  src={sheetUrl}
                  alt="Manufacturer Paint Shade Sheet"
                  referrerPolicy="no-referrer"
                  className="max-w-full block select-none pointer-events-none"
                  style={{ maxHeight: '78vh' }}
                />
              </div>
            )}

            {/* LIVE LOUPE / MAGNIFIER CURSOR */}
            {mousePos && imageLoaded && !imageError && (
              <div
                className="pointer-events-none fixed z-30 rounded-2xl bg-slate-950 border-2 border-indigo-400 shadow-2xl p-2 flex items-center gap-2.5 transition-transform duration-75"
                style={{
                  left: `${mousePos.x + 20}px`,
                  top: `${mousePos.y + 20}px`,
                  transform: 'translate(0, 0)'
                }}
              >
                {/* Sampled Color Pip */}
                <div
                  className="w-8 h-8 rounded-xl border border-white/50 shadow-inner flex items-center justify-center font-mono text-[9px] font-black text-black/80"
                  style={{ backgroundColor: hoverColor }}
                />
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono font-bold text-white">
                    {hoverColor}
                  </div>
                  <div className="text-[9px] text-indigo-300 font-semibold uppercase tracking-wider">
                    Click to Capture
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT SIDEBAR: COLOR COMPOSER & CURRENT SHADE ADDER */}
        <div className="w-full lg:w-96 bg-slate-900/95 border-t lg:border-t-0 lg:border-l border-slate-800 flex flex-col shrink-0 overflow-y-auto">
          {/* Section Header */}
          <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-900/90 space-y-1">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Captured Shade Details
              </h4>
            </div>
            <p className="text-[11px] text-slate-400">
              The color below is automatically sampled from your click on the sheet.
            </p>
          </div>

          {/* Form Composer */}
          <div className="p-4 sm:p-5 space-y-4 flex-1">
            {/* Live Swatch Preview Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
              <div className="flex items-center gap-3">
                {/* Swatch Thumbnail with micro crop or solid hex */}
                <div className="relative w-16 h-16 rounded-2xl border-2 border-slate-700 overflow-hidden bg-slate-900 shadow-md shrink-0 flex items-center justify-center">
                  {sampledSampleUrl ? (
                    <img
                      src={sampledSampleUrl}
                      alt="Sampled Texture"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div
                      className="w-full h-full"
                      style={{ backgroundColor: sampledHex }}
                    />
                  )}
                </div>

                {/* Color Hex & Family */}
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-md border border-white/40 shrink-0"
                      style={{ backgroundColor: sampledHex }}
                    />
                    <span className="text-sm font-mono font-bold text-white">
                      {sampledHex}
                    </span>
                  </div>
                  <div className="text-[10px] text-indigo-300 font-semibold">
                    Family: {getColorFamily(sampledHex)}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Auto-Captured from Image
                  </div>
                </div>
              </div>
            </div>

            {/* Input: Shade Name */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-300 block uppercase tracking-wider">
                Shade Name *
              </label>
              <input
                ref={nameInputRef}
                type="text"
                value={shadeName}
                onChange={(e) => setShadeName(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. Emerald, Grey Mist, Sky Blue"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 font-semibold focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Input: Exact Shade Code */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-400 block uppercase tracking-wider">
                  Shade Code *
                </label>
                <span className="text-[10px] font-mono text-slate-500">
                  Exact Reference Code
                </span>
              </div>
              <input
                type="text"
                value={shadeCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="e.g. 3044, 3032, 1001"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-xl bg-slate-950 border border-indigo-900/80 text-indigo-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
              />
            </div>

            {/* Optional Price Delta */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider">
                Price Adjustment (PKR)
              </label>
              <input
                type="number"
                value={priceAdjustment || ''}
                onChange={(e) => setPriceAdjustment(parseFloat(e.target.value) || 0)}
                onKeyDown={handleKeyDown}
                placeholder="0 (Leave 0 for standard price)"
                className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* DUPLICATE CODE WARNING BANNER */}
            {duplicateWarning && (
              <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/50 space-y-2 text-amber-200">
                <div className="flex items-start gap-2 text-xs font-bold">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    Shade code <strong>"{duplicateWarning.code}"</strong> already exists as "{duplicateWarning.name}".
                  </span>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleSaveShade(true)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-slate-950 text-[11px] font-bold transition-colors shadow-sm"
                  >
                    Overwrite Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShadeCode(`${shadeCode}-2`);
                      setDuplicateWarning(null);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-[11px] font-semibold transition-colors"
                  >
                    Change Code
                  </button>
                </div>
              </div>
            )}

            {/* SUCCESS FEEDBACK BANNER */}
            {justAddedName && (
              <div className="p-3 rounded-xl bg-emerald-950/80 border border-emerald-500/40 flex items-center gap-2 text-xs font-bold text-emerald-300 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Saved "{justAddedName}" to Product Shades!</span>
              </div>
            )}

            {/* ACTION BUTTON */}
            <button
              type="button"
              onClick={() => handleSaveShade(false)}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-98"
            >
              <Plus className="w-4 h-4" />
              <span>+ Save Shade to Product</span>
              <span className="hidden sm:inline-flex items-center text-[10px] text-indigo-200 bg-indigo-700/50 px-1.5 py-0.5 rounded font-mono">
                ↵ Enter
              </span>
            </button>

            <p className="text-[10px] text-slate-400 text-center">
              Tip: You can keep clicking and adding more shades continuously without closing this window.
            </p>
          </div>

          {/* RECENTLY CONFIGURED SHADES LIST (FOR CURRENT PRODUCT) */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                Product Shades ({currentShades.length})
              </span>
              <span className="text-[10px] text-indigo-400">
                {currentShades.filter(s => s.isActive !== false).length} Active
              </span>
            </div>

            {currentShades.length === 0 ? (
              <p className="text-xs text-slate-500 italic py-2">
                No shades saved yet. Click the image to add your first shade.
              </p>
            ) : (
              <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                {currentShades.map((s, idx) => (
                  <div
                    key={s.id || idx}
                    className="p-2 rounded-xl bg-slate-900 border border-slate-800/90 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className="w-5 h-5 rounded-md border border-slate-700 shrink-0 flex items-center justify-center font-mono text-[8px] font-bold text-black/70"
                        style={{ backgroundColor: s.colorHex || '#CBD5E1' }}
                      />
                      <span className="text-xs font-bold text-white truncate">{s.name}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-950 text-[10px] font-mono text-indigo-300 border border-slate-800">
                        {s.code}
                      </span>
                    </div>

                    <span className="text-[10px] text-emerald-400 shrink-0 font-semibold">
                      Saved
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
