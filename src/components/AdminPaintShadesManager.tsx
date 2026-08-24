import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Palette, Plus, Trash2, ArrowUp, ArrowDown, Copy, Check, Upload,
  Sparkles, AlertCircle, Eye, RefreshCw, X, Image as ImageIcon,
  Search, FileText, CheckCircle2, ZoomIn, ZoomOut, Info, Pipette,
  CheckCheck, AlertTriangle, Layers, Edit2, ShieldAlert
} from 'lucide-react';
import { PaintShade, PaintShadesConfig } from '../types';
import {
  POPULAR_PAINT_SHADE_PRESETS,
  PaintShadePreset,
  searchPaintShades,
  findDuplicateShade,
  extractColorFromCanvas,
  getColorFamily
} from '../utils/paintShadeUtils';
import { uploadMediaToSupabase } from '../services/supabaseService';

interface AdminPaintShadesManagerProps {
  shadesConfig?: PaintShadesConfig;
  shadesEnabled?: boolean;
  shadesTitle?: string;
  shadeSheetUrl?: string;
  shadesList?: PaintShade[];
  onChange: (updatedConfig: PaintShadesConfig) => void;
  categoryName?: string;
}

export const AdminPaintShadesManager: React.FC<AdminPaintShadesManagerProps> = ({
  shadesConfig,
  shadesEnabled = false,
  shadesTitle = 'Choose Shade',
  shadeSheetUrl,
  shadesList = [],
  onChange,
  categoryName
}) => {
  // Master on/off switch & config resolving
  const isEnabled = Boolean(shadesEnabled || shadesConfig?.shadesEnabled);
  const currentTitle = shadesConfig?.shadesTitle || shadesTitle || 'Choose Shade';
  const currentShadeSheet = shadesConfig?.shadeSheetUrl || shadeSheetUrl || '';
  const list: PaintShade[] = (shadesList && shadesList.length > 0)
    ? shadesList
    : (shadesConfig?.shades || []);

  const [uploadingShadeId, setUploadingShadeId] = useState<string | null>(null);
  const [uploadingSheet, setUploadingSheet] = useState<boolean>(false);
  const [showPresetsModal, setShowPresetsModal] = useState<boolean>(false);
  const [showSheetViewerModal, setShowSheetViewerModal] = useState<boolean>(false);
  const [showVisualPickerModal, setShowVisualPickerModal] = useState<boolean>(false);
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');

  // Visual Picker interactive state
  const [pickedColorHex, setPickedColorHex] = useState<string>('#3B82F6');
  const [pickedThumbDataUrl, setPickedThumbDataUrl] = useState<string>('');
  const [pickedShadeName, setPickedShadeName] = useState<string>('');
  const [pickedShadeCode, setPickedShadeCode] = useState<string>('');
  const [pickedPriceDelta, setPickedPriceDelta] = useState<number>(0);
  const [justSavedNotice, setJustSavedNotice] = useState<string | null>(null);
  const [editingShadeId, setEditingShadeId] = useState<string | null>(null);
  const [pickerZoom, setPickerZoom] = useState<number>(1);
  const [hoverColor, setHoverColor] = useState<string | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number } | null>(null);

  const sheetImgRef = useRef<HTMLImageElement | null>(null);
  const shadeNameInputRef = useRef<HTMLInputElement | null>(null);

  // Filtered shades for admin list
  const filteredList = useMemo(() => {
    return searchPaintShades(list, adminSearchQuery);
  }, [list, adminSearchQuery]);

  // Duplicate shade detection in current picker state
  const duplicateShade = useMemo(() => {
    return findDuplicateShade(list, pickedShadeCode, editingShadeId || undefined);
  }, [list, pickedShadeCode, editingShadeId]);

  const updateMasterSwitch = (enabled: boolean) => {
    onChange({
      shadesEnabled: enabled,
      shadesTitle: currentTitle,
      shadeSheetUrl: currentShadeSheet,
      shades: list
    });
  };

  const updateTitle = (title: string) => {
    onChange({
      shadesEnabled: isEnabled,
      shadesTitle: title,
      shadeSheetUrl: currentShadeSheet,
      shades: list
    });
  };

  const updateShadeSheetUrl = (url?: string) => {
    onChange({
      shadesEnabled: isEnabled,
      shadesTitle: currentTitle,
      shadeSheetUrl: url,
      shades: list
    });
  };

  const updateShade = (id: string, updates: Partial<PaintShade>) => {
    const updated = list.map(s => s.id === id ? { ...s, ...updates } : s);
    onChange({
      shadesEnabled: isEnabled,
      shadesTitle: currentTitle,
      shadeSheetUrl: currentShadeSheet,
      shades: updated
    });
  };

  const addShade = () => {
    const nextNum = list.length + 1;
    const newShade: PaintShade = {
      id: `shade-${Date.now()}-${nextNum}`,
      name: `Shade ${nextNum}`,
      code: `${3000 + nextNum}`,
      referenceImage: '',
      image: '',
      colorHex: '#C5CCD3',
      isActive: true,
      displayOrder: list.length,
      priceAdjustment: 0
    };
    onChange({
      shadesEnabled: true,
      shadesTitle: currentTitle,
      shadeSheetUrl: currentShadeSheet,
      shades: [...list, newShade]
    });
  };

  const duplicateExistingShade = (shade: PaintShade) => {
    const duplicated: PaintShade = {
      ...shade,
      id: `shade-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${shade.name} (Copy)`,
      code: shade.code ? `${shade.code}-C` : `${Date.now().toString().slice(-4)}`,
      displayOrder: list.length
    };
    onChange({
      shadesEnabled: isEnabled,
      shadesTitle: currentTitle,
      shadeSheetUrl: currentShadeSheet,
      shades: [...list, duplicated]
    });
  };

  const deleteShade = (id: string) => {
    const updated = list.filter(s => s.id !== id);
    onChange({
      shadesEnabled: isEnabled,
      shadesTitle: currentTitle,
      shadeSheetUrl: currentShadeSheet,
      shades: updated
    });
  };

  const moveShade = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= list.length) return;

    const updated = [...list];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    updated.forEach((s, idx) => {
      s.displayOrder = idx;
    });

    onChange({
      shadesEnabled: isEnabled,
      shadesTitle: currentTitle,
      shadeSheetUrl: currentShadeSheet,
      shades: updated
    });
  };

  const addPreset = (preset: PaintShadePreset) => {
    const newShade: PaintShade = {
      id: `shade-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: preset.name,
      code: preset.code,
      referenceImage: preset.sampleImageUrl || '',
      image: preset.sampleImageUrl || '',
      colorHex: preset.colorHex || '#CBD5E1',
      isActive: true,
      displayOrder: list.length,
      priceAdjustment: 0
    };
    onChange({
      shadesEnabled: true,
      shadesTitle: currentTitle,
      shadeSheetUrl: currentShadeSheet,
      shades: [...list, newShade]
    });
  };

  const addAllPresetsInCategory = (category: string) => {
    const presetsToAdd = POPULAR_PAINT_SHADE_PRESETS.filter(p => p.category === category);
    const newShades: PaintShade[] = presetsToAdd.map((preset, idx) => ({
      id: `shade-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name: preset.name,
      code: preset.code,
      referenceImage: preset.sampleImageUrl || '',
      image: preset.sampleImageUrl || '',
      colorHex: preset.colorHex || '#CBD5E1',
      isActive: true,
      displayOrder: list.length + idx,
      priceAdjustment: 0
    }));

    onChange({
      shadesEnabled: true,
      shadesTitle: currentTitle,
      shadeSheetUrl: currentShadeSheet,
      shades: [...list, ...newShades]
    });
    setShowPresetsModal(false);
  };

  // Upload individual real shade reference image / crop
  const handleShadeReferenceUpload = async (shadeId: string, file: File) => {
    setUploadingShadeId(shadeId);
    try {
      // 1. Read preview immediately for responsive UI
      const reader = new FileReader();
      reader.onload = async (e) => {
        const previewUrl = e.target?.result as string;
        updateShade(shadeId, {
          referenceImage: previewUrl,
          image: previewUrl
        });

        // 2. Upload to Supabase/server in background
        const res = await uploadMediaToSupabase(file, 'product-media', `shade-ref-${shadeId}-${Date.now()}`);
        if (res?.url && res.url !== previewUrl) {
          updateShade(shadeId, {
            referenceImage: res.url,
            image: res.url
          });
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      console.warn('Shade reference upload notice:', err);
    } finally {
      setUploadingShadeId(null);
    }
  };

  // Helper: optimize/compress image if large before saving to state/storage to avoid LocalStorage quota issues
  const processImageFile = async (file: File, maxDim: number = 2000, quality: number = 0.85): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const optimized = canvas.toDataURL('image/jpeg', quality);
            resolve(optimized);
            return;
          }
          resolve(rawUrl);
        };
        img.onerror = () => resolve(rawUrl);
        img.src = rawUrl;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Upload manufacturer shade sheet / catalogue reference
  const handleShadeSheetUpload = async (file: File) => {
    if (!file) return;
    setUploadingSheet(true);
    try {
      // 1. Compress & produce optimized data URL immediately
      const optimizedDataUrl = await processImageFile(file, 2200, 0.86);
      if (optimizedDataUrl) {
        updateShadeSheetUrl(optimizedDataUrl);
        setJustSavedNotice('Shade sheet loaded successfully!');
      }

      // 2. Persist to storage / server backend proxy in parallel
      try {
        const res = await uploadMediaToSupabase(file, 'product-media', `shade-sheet-${Date.now()}`);
        if (res?.url && res.url !== optimizedDataUrl) {
          updateShadeSheetUrl(res.url);
          setJustSavedNotice('Shade sheet uploaded and saved to cloud storage!');
        }
      } catch (uploadErr) {
        console.warn('Shade sheet remote storage sync:', uploadErr);
      }
    } catch (err: any) {
      console.warn('Shade sheet upload error:', err);
      alert('Error reading shade sheet file. Please try another image.');
    } finally {
      setUploadingSheet(false);
      setTimeout(() => setJustSavedNotice(null), 3000);
    }
  };

  // Handle click on shade sheet in Visual Shade Picker Modal
  const handleImageClick = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!sheetImgRef.current) return;
    const img = sheetImgRef.current;
    const rect = img.getBoundingClientRect();
    const result = extractColorFromCanvas(img, e.clientX, e.clientY, rect);

    if (result) {
      setPickedColorHex(result.hex);
      if (result.sampleDataUrl) {
        setPickedThumbDataUrl(result.sampleDataUrl);
      }
      // Auto-suggest next shade code if empty
      if (!pickedShadeCode) {
        const nextCode = `${3000 + list.length + 1}`;
        setPickedShadeCode(nextCode);
      }
      if (!pickedShadeName) {
        setPickedShadeName(`Shade ${list.length + 1}`);
      }

      // Focus the shade name input for rapid typing
      setTimeout(() => {
        shadeNameInputRef.current?.focus();
        shadeNameInputRef.current?.select();
      }, 50);
    }
  };

  // Handle mouse move for real-time loupe/preview
  const handleImageMouseMove = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!sheetImgRef.current) return;
    const img = sheetImgRef.current;
    const rect = img.getBoundingClientRect();
    setHoverPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });

    const result = extractColorFromCanvas(img, e.clientX, e.clientY, rect, 1);
    if (result) {
      setHoverColor(result.hex);
    }
  };

  // Save picked shade from Visual Picker
  const handleSavePickedShade = (forceOverwriteId?: string) => {
    const trimmedName = (pickedShadeName || `Shade ${list.length + 1}`).trim();
    const trimmedCode = (pickedShadeCode || `${3000 + list.length + 1}`).trim();

    if (forceOverwriteId || editingShadeId) {
      const targetId = forceOverwriteId || editingShadeId!;
      const updated = list.map(s => {
        if (s.id === targetId) {
          return {
            ...s,
            name: trimmedName,
            code: trimmedCode,
            colorHex: pickedColorHex,
            referenceImage: pickedThumbDataUrl || s.referenceImage || '',
            image: pickedThumbDataUrl || s.image || '',
            priceAdjustment: pickedPriceDelta || 0
          };
        }
        return s;
      });

      onChange({
        shadesEnabled: true,
        shadesTitle: currentTitle,
        shadeSheetUrl: currentShadeSheet,
        shades: updated
      });

      setJustSavedNotice(`Updated: ${trimmedName} (${trimmedCode})`);
    } else {
      const newShade: PaintShade = {
        id: `shade-${Date.now()}-${list.length + 1}`,
        name: trimmedName,
        code: trimmedCode,
        colorHex: pickedColorHex,
        referenceImage: pickedThumbDataUrl || '',
        image: pickedThumbDataUrl || '',
        isActive: true,
        displayOrder: list.length,
        priceAdjustment: pickedPriceDelta || 0
      };

      onChange({
        shadesEnabled: true,
        shadesTitle: currentTitle,
        shadeSheetUrl: currentShadeSheet,
        shades: [...list, newShade]
      });

      setJustSavedNotice(`Saved: ${trimmedName} (${trimmedCode})`);
    }

    // Reset picker inputs for the next shade
    setEditingShadeId(null);
    setPickedShadeName('');
    setPickedShadeCode('');
    setPickedPriceDelta(0);

    setTimeout(() => {
      setJustSavedNotice(null);
    }, 2500);
  };

  const openVisualPickerForShade = (shade?: PaintShade) => {
    if (shade) {
      setEditingShadeId(shade.id);
      setPickedShadeName(shade.name);
      setPickedShadeCode(shade.code);
      setPickedColorHex(shade.colorHex || '#CBD5E1');
      setPickedThumbDataUrl(shade.referenceImage || shade.image || '');
      setPickedPriceDelta(shade.priceAdjustment || 0);
    } else {
      setEditingShadeId(null);
      setPickedShadeName(`Shade ${list.length + 1}`);
      setPickedShadeCode(`${3000 + list.length + 1}`);
      setPickedColorHex('#3B82F6');
      setPickedThumbDataUrl('');
      setPickedPriceDelta(0);
    }
    setShowVisualPickerModal(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. MASTER TOGGLE HEADER */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/90 via-slate-900 to-slate-950 border border-indigo-500/40 flex items-center justify-between gap-4 flex-wrap shadow-lg shadow-black/40">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/40">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">Paint Shade System</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/40">
                Visual Shade Picker
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Upload manufacturer shade card, click anywhere on the sheet to sample real colors, and set exact shade codes.
            </p>
          </div>
        </div>

        {/* Master ON/OFF Switch */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold font-mono">
            {isEnabled ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                SHADES ACTIVE [ON]
              </span>
            ) : (
              <span className="text-slate-500">SHADES DISABLED [OFF]</span>
            )}
          </span>
          <button
            type="button"
            onClick={() => updateMasterSwitch(!isEnabled)}
            className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none ${
              isEnabled ? 'bg-indigo-600' : 'bg-slate-700'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                isEnabled ? 'translate-x-8' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {!isEnabled ? (
        <div className="p-8 rounded-2xl bg-slate-900/40 border border-dashed border-slate-800 text-center space-y-3">
          <Palette className="w-8 h-8 text-slate-600 mx-auto" />
          <div className="max-w-md mx-auto">
            <h4 className="text-sm font-bold text-slate-300">Paint Shades are currently turned OFF</h4>
            <p className="text-xs text-slate-400 mt-1">
              When shades are OFF, this product behaves like a standard single-color paint item. Toggle the switch to [ON] to configure customer shade swatches.
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateMasterSwitch(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Enable Real Paint Shades</span>
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* SECTION 2: SHADE SHEET UPLOAD & VISUAL SHADE PICKER HERO */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-indigo-900/50 space-y-3.5 shadow-md">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Manufacturer Paint Shade Sheet</h4>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-indigo-300 font-semibold">
                      Admin Source of Truth
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Upload ONE full shade-sheet image (containing 20 to 100+ shades). Then click <strong>"Open Visual Shade Picker"</strong> to click on any color swatch and extract it with 1 click!
                  </p>
                </div>
              </div>

              {/* Upload or View / Visual Picker Actions */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {currentShadeSheet ? (
                  <>
                    <button
                      type="button"
                      onClick={() => openVisualPickerForShade()}
                      className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30 active:scale-95"
                    >
                      <Pipette className="w-3.5 h-3.5" />
                      <span>Open Visual Shade Picker</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowSheetViewerModal(true)}
                      className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Sheet</span>
                    </button>
                    <label className="cursor-pointer px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5">
                      {uploadingSheet ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-slate-400" />
                      )}
                      <span>Replace</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleShadeSheetUpload(file);
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      onClick={() => updateShadeSheetUrl(undefined)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 transition-colors"
                      title="Remove Shade Sheet"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="cursor-pointer px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/30">
                      {uploadingSheet ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Upload className="w-4 h-4 text-white" />
                      )}
                      <span>Upload Shade Sheet / Card Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleShadeSheetUpload(file);
                        }}
                      />
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        const url = window.prompt('Enter or paste shade sheet image URL (https://...):', currentShadeSheet || '');
                        if (url && url.trim()) {
                          updateShadeSheetUrl(url.trim());
                          setJustSavedNotice('Shade sheet URL updated!');
                          setTimeout(() => setJustSavedNotice(null), 2500);
                        }
                      }}
                      className="px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <span>Or Paste URL</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Note confirming separation of main product image */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/90 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>
                <strong>Isolated & Safe:</strong> Uploading a Shade Sheet does <u>NOT</u> alter the main paint can product photo. The product keeps its main image intact.
              </span>
            </div>
          </div>

          {/* SECTION CONTROLS BAR: Storefront Title + Presets + Add Shade */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-6 space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Selector Title on Storefront
              </label>
              <input
                type="text"
                value={currentTitle}
                onChange={(e) => updateTitle(e.target.value)}
                placeholder="e.g. Choose Shade / Color"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="md:col-span-6 flex items-center justify-end gap-2 flex-wrap pt-2 md:pt-0">
              {currentShadeSheet && (
                <button
                  type="button"
                  onClick={() => openVisualPickerForShade()}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  <Pipette className="w-3.5 h-3.5" />
                  <span>Visual Eyedropper</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowPresetsModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Preset Codes</span>
              </button>

              <button
                type="button"
                onClick={addShade}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>+ Custom Shade</span>
              </button>
            </div>
          </div>

          {/* SHADES LIST SEARCH & STATS */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Configured Shades ({list.length})
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold">
                  {list.filter(s => s.isActive !== false).length} Active for Customers
                </span>
              </div>

              {/* Real-time search inside Admin list */}
              {list.length > 3 && (
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    placeholder="Search by code (e.g. 3044) or name..."
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  {adminSearchQuery && (
                    <button
                      onClick={() => setAdminSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 hover:text-white"
                    >
                      Clear
                    </button>
                  )}
                </div>
              )}
            </div>

            {list.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/50 border border-dashed border-slate-800 text-center space-y-3">
                <Palette className="w-8 h-8 text-indigo-400/60 mx-auto" />
                <h4 className="text-sm font-bold text-white">No Shades Added Yet</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Upload a shade sheet to click and pick colors visually, browse authentic manufacturer presets, or add custom shade codes.
                </p>
                <div className="flex justify-center gap-2 pt-1 flex-wrap">
                  {currentShadeSheet && (
                    <button
                      type="button"
                      onClick={() => openVisualPickerForShade()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-500 transition-colors flex items-center gap-1.5"
                    >
                      <Pipette className="w-3.5 h-3.5" />
                      <span>Pick from Shade Sheet</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowPresetsModal(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-950 text-indigo-300 text-xs font-bold border border-indigo-500/40 hover:bg-indigo-900 transition-colors"
                  >
                    Browse Presets (3044, etc.)
                  </button>
                  <button
                    type="button"
                    onClick={addShade}
                    className="px-4 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold border border-slate-700 hover:bg-slate-700 transition-colors"
                  >
                    + Add Custom Shade
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredList.map((shade, idx) => {
                  const actualIdx = list.findIndex(s => s.id === shade.id);
                  const isAvailable = shade.isActive !== false;
                  const shadeImg = shade.referenceImage || shade.image;

                  return (
                    <div
                      key={shade.id}
                      className={`p-3 sm:p-4 rounded-2xl border transition-all ${
                        isAvailable
                          ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-sm'
                          : 'bg-slate-950/70 border-slate-900 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-3.5">
                        {/* 1. REAL COLOR SWATCH / THUMBNAIL */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div
                            className="relative group w-12 h-12 rounded-xl border-2 border-slate-700 overflow-hidden bg-slate-950 shadow-inner flex items-center justify-center cursor-pointer"
                            onClick={() => currentShadeSheet && openVisualPickerForShade(shade)}
                            title={currentShadeSheet ? "Click to re-sample color from Shade Sheet" : undefined}
                          >
                            {shadeImg ? (
                              <img
                                src={shadeImg}
                                alt={shade.name}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div
                                className="w-full h-full flex flex-col items-center justify-center p-1 text-center"
                                style={{ backgroundColor: shade.colorHex || '#CBD5E1' }}
                              >
                                <span className="text-[8px] font-black text-black/70 uppercase leading-none font-mono">
                                  {shade.code || 'SHADE'}
                                </span>
                              </div>
                            )}

                            {/* Hover overlay to re-pick or upload */}
                            <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-1">
                              <Edit2 className="w-3.5 h-3.5 text-white" />
                              <span className="text-[8px] text-slate-200 font-bold text-center leading-tight mt-0.5">
                                Edit
                              </span>
                            </div>
                          </div>

                          {/* Quick color hex input & sample upload */}
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="color"
                                value={shade.colorHex && shade.colorHex.startsWith('#') ? shade.colorHex : '#CBD5E1'}
                                onChange={(e) => updateShade(shade.id, { colorHex: e.target.value })}
                                className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent"
                                title="Click to fine-tune HEX color"
                              />
                              <span className="text-[10px] font-mono text-slate-400">
                                {shade.colorHex || '#CBD5E1'}
                              </span>
                            </div>

                            <label className="cursor-pointer text-[10px] text-indigo-400 hover:text-indigo-300 font-medium block">
                              {shadeImg ? 'Replace Sample' : '+ Upload Sample'}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handleShadeReferenceUpload(shade.id, file);
                                }}
                              />
                            </label>
                          </div>
                        </div>

                        {/* 2. SHADE NAME & EXACT SHADE CODE */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
                          {/* Shade Name */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-300 uppercase tracking-wider block">
                              Shade Name *
                            </label>
                            <input
                              type="text"
                              value={shade.name}
                              onChange={(e) => updateShade(shade.id, { name: e.target.value })}
                              placeholder="e.g. Emerald or Grey Mist"
                              className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          {/* Exact Shade Code */}
                          <div>
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                                Shade Code *
                              </label>
                              <span className="text-[9px] text-slate-500 font-mono">Invoice Match</span>
                            </div>
                            <input
                              type="text"
                              value={shade.code}
                              onChange={(e) => updateShade(shade.id, { code: e.target.value })}
                              placeholder="e.g. 3044"
                              className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl bg-slate-950 border border-indigo-900/60 text-indigo-300 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          {/* Optional Price Delta */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                              Price Delta (PKR)
                            </label>
                            <input
                              type="number"
                              value={shade.priceAdjustment || 0}
                              onChange={(e) => updateShade(shade.id, { priceAdjustment: parseFloat(e.target.value) || 0 })}
                              placeholder="0"
                              className="w-full px-3 py-1.5 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        {/* 3. AVAILABILITY TOGGLE & ROW ACTIONS */}
                        <div className="flex items-center justify-between lg:justify-end gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                          {/* Available Switch (ON / OFF) */}
                          <button
                            type="button"
                            onClick={() => updateShade(shade.id, { isActive: !isAvailable })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 border ${
                              isAvailable
                                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-sm'
                                : 'bg-slate-900 border-slate-800 text-slate-500'
                            }`}
                            title="Toggle customer availability"
                          >
                            <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                            <span>{isAvailable ? 'Available: ON' : 'Unavailable: OFF'}</span>
                          </button>

                          {/* Reordering */}
                          <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-0.5">
                            <button
                              type="button"
                              disabled={actualIdx === 0}
                              onClick={() => moveShade(actualIdx, 'up')}
                              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={actualIdx === list.length - 1}
                              onClick={() => moveShade(actualIdx, 'down')}
                              className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 rounded-lg"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Duplicate */}
                          <button
                            type="button"
                            onClick={() => duplicateExistingShade(shade)}
                            className="p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-indigo-300 border border-slate-800 transition-colors"
                            title="Duplicate shade"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => deleteShade(shade.id)}
                            className="p-2 rounded-xl bg-slate-950 text-slate-400 hover:text-rose-400 border border-slate-800 transition-colors"
                            title="Delete shade"
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
          </div>
        </div>
      )}

      {/* 2. INTERACTIVE VISUAL SHADE PICKER MODAL (CLICK ON SHADE SHEET TO EXTRACT COLOR & SAVE) */}
      {showVisualPickerModal && currentShadeSheet && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-5">
          <div className="bg-slate-950 border border-indigo-900/60 rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/30">
                  <Pipette className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Visual Paint Shade Eyedropper</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-950 border border-indigo-500/40 text-[10px] text-indigo-300 font-mono">
                      {list.length} Shades Saved
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Click anywhere on the shade card to capture the color swatch, enter Name & Code, then click Save.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Zoom controls for high-density shade sheets */}
                <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
                  <button
                    type="button"
                    onClick={() => setPickerZoom(z => Math.max(0.5, z - 0.25))}
                    className="p-1 text-slate-400 hover:text-white rounded"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 px-1">
                    {Math.round(pickerZoom * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setPickerZoom(z => Math.min(2.5, z + 0.25))}
                    className="p-1 text-slate-400 hover:text-white rounded"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setShowVisualPickerModal(false)}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Split view (Left: Interactive Image Sheet, Right: Color Capture Dock) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 flex-1 overflow-hidden">
              {/* Left Column: Interactive Shade Sheet Viewport */}
              <div className="lg:col-span-7 xl:col-span-8 bg-slate-950 border-b lg:border-b-0 lg:border-r border-slate-800 p-4 overflow-auto flex items-center justify-center relative select-none">
                <div className="relative inline-block" style={{ transform: `scale(${pickerZoom})`, transformOrigin: 'center center', transition: 'transform 0.15s ease-out' }}>
                  <img
                    ref={sheetImgRef}
                    src={currentShadeSheet}
                    alt="Manufacturer Shade Sheet"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onClick={handleImageClick}
                    onMouseMove={handleImageMouseMove}
                    onMouseLeave={() => { setHoverColor(null); setHoverPos(null); }}
                    className="max-w-full max-h-[60vh] object-contain rounded-xl border border-slate-800 cursor-crosshair shadow-2xl block"
                  />

                  {/* Live Hover Loupe / Eyedropper Pointer */}
                  {hoverPos && hoverColor && (
                    <div
                      className="absolute pointer-events-none -translate-x-1/2 -translate-y-12 flex flex-col items-center z-30"
                      style={{ left: hoverPos.x, top: hoverPos.y }}
                    >
                      <div className="p-1 rounded-full bg-black/90 border-2 border-white shadow-xl flex items-center gap-1.5 backdrop-blur-sm">
                        <div
                          className="w-5 h-5 rounded-full border border-black/50 shadow-inner"
                          style={{ backgroundColor: hoverColor }}
                        />
                        <span className="text-[10px] font-mono font-bold text-white px-1">
                          {hoverColor}
                        </span>
                      </div>
                      <div className="w-1.5 h-1.5 bg-white rotate-45 -mt-1 shadow-sm" />
                    </div>
                  )}
                </div>

                {/* Floating instruction pill */}
                <div className="absolute bottom-3 left-3 right-3 sm:right-auto bg-black/80 backdrop-blur-md border border-slate-800 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 flex items-center gap-2 shadow-lg">
                  <Pipette className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span>Click any color swatch on the sheet above to sample it.</span>
                </div>
              </div>

              {/* Right Column: Capture Dock / Save Form */}
              <div className="lg:col-span-5 xl:col-span-4 bg-slate-900/90 p-5 overflow-y-auto space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Just saved banner feedback */}
                  {justSavedNotice && (
                    <div className="p-3 rounded-xl bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                      <CheckCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>{justSavedNotice}</span>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                      {editingShadeId ? 'Edit Shade Details' : 'Sampled Shade Swatch'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-indigo-400 border border-slate-800">
                      {getColorFamily(pickedColorHex)}
                    </span>
                  </div>

                  {/* Captured Swatch Preview Card */}
                  <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                    <div className="flex items-center gap-3">
                      {/* Big Color Swatch */}
                      <div
                        className="w-16 h-16 rounded-2xl border-2 border-slate-700 shadow-lg flex items-center justify-center shrink-0 relative overflow-hidden"
                        style={{ backgroundColor: pickedColorHex }}
                      >
                        {pickedThumbDataUrl && (
                          <img
                            src={pickedThumbDataUrl}
                            alt="Sample"
                            className="w-full h-full object-cover opacity-80 mix-blend-overlay"
                          />
                        )}
                        <span className="absolute bottom-1 text-[8px] font-mono font-black text-black/75 bg-white/70 px-1 rounded">
                          {pickedShadeCode || 'PREVIEW'}
                        </span>
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={pickedColorHex.startsWith('#') ? pickedColorHex : '#3B82F6'}
                            onChange={(e) => setPickedColorHex(e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer border-0 bg-transparent"
                            title="Fine-tune hex color"
                          />
                          <span className="text-xs font-mono font-bold text-white">
                            {pickedColorHex}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-tight">
                          Color extracted directly from sheet pixel data.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Shade Name Input */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                      Shade Name *
                    </label>
                    <input
                      ref={shadeNameInputRef}
                      type="text"
                      value={pickedShadeName}
                      onChange={(e) => setPickedShadeName(e.target.value)}
                      placeholder="e.g. Emerald, Grey Mist, Royal Navy"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-semibold"
                    />
                  </div>

                  {/* Shade Code Input */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">
                        Exact Shade Code *
                      </label>
                      <span className="text-[10px] text-slate-500 font-mono">Invoice Match</span>
                    </div>
                    <input
                      type="text"
                      value={pickedShadeCode}
                      onChange={(e) => setPickedShadeCode(e.target.value)}
                      placeholder="e.g. 3044, 3001"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-mono font-bold rounded-xl bg-slate-950 border border-indigo-900/80 text-indigo-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Duplicate Shade Warning Protection */}
                  {duplicateShade && (
                    <div className="p-3 rounded-xl bg-amber-950/80 border border-amber-500/40 text-amber-300 text-xs space-y-2 animate-in fade-in">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">
                            Shade code <strong>{pickedShadeCode}</strong> is already added as "{duplicateShade.name}".
                          </p>
                          <p className="text-[11px] text-amber-400/80 mt-0.5">
                            Would you like to overwrite its color or save with a new code?
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleSavePickedShade(duplicateShade.id)}
                          className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold shadow"
                        >
                          Update Existing ({duplicateShade.code})
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Optional Price Delta */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                      Price Adjustment (Optional PKR)
                    </label>
                    <input
                      type="number"
                      value={pickedPriceDelta || 0}
                      onChange={(e) => setPickedPriceDelta(parseFloat(e.target.value) || 0)}
                      placeholder="0"
                      className="w-full px-3.5 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Bottom Action Buttons */}
                <div className="space-y-2 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => handleSavePickedShade()}
                    disabled={!pickedShadeCode.trim() && !pickedShadeName.trim()}
                    className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs sm:text-sm font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Check className="w-4 h-4" />
                    <span>
                      {editingShadeId
                        ? 'Update Shade'
                        : duplicateShade
                        ? 'Save as New Shade'
                        : 'Save Shade & Pick Next'}
                    </span>
                  </button>

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingShadeId(null);
                        setPickedShadeName('');
                        setPickedShadeCode('');
                      }}
                      className="text-[11px] text-slate-400 hover:text-white"
                    >
                      Clear Inputs
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowVisualPickerModal(false)}
                      className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold"
                    >
                      Finish & Done ({list.length} shades)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. FULL SHADE SHEET VIEWER MODAL */}
      {showSheetViewerModal && currentShadeSheet && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-400">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Manufacturer Paint Shade Sheet</h3>
                  <p className="text-xs text-slate-400">Reference catalogue to verify exact shade names and codes</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSheetViewerModal(false)}
                className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-auto flex-1 flex items-center justify-center bg-slate-950">
              <img
                src={currentShadeSheet}
                alt="Manufacturer Shade Sheet Reference"
                referrerPolicy="no-referrer"
                className="max-w-full max-h-[70vh] object-contain rounded-xl border border-slate-800 shadow-2xl"
              />
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
              <span className="text-xs text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-indigo-400" />
                This sheet is preserved for Admin reference and does not alter the customer main product image.
              </span>
              <button
                type="button"
                onClick={() => setShowSheetViewerModal(false)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold"
              >
                Close Viewer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. PRESET PALETTES PICKER MODAL */}
      {showPresetsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Authentic Manufacturer Shade Codes</h3>
                  <p className="text-xs text-slate-400">Add popular standard shade codes (e.g. 3044, 3001, 3002) in 1 click</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowPresetsModal(false)}
                className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-6">
              {(['Popular Greys & Neutrals', 'Whites, Creams & Off-Whites', 'Pastels & Cool Blues', 'Earthy & Warm Tones', 'Rich Accent & Deep Shades'] as const).map((cat) => {
                const presetsInCat = POPULAR_PAINT_SHADE_PRESETS.filter(p => p.category === cat);
                return (
                  <div key={cat} className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                        {cat}
                      </h4>
                      <button
                        type="button"
                        onClick={() => addAllPresetsInCategory(cat)}
                        className="text-[11px] font-bold text-indigo-400 hover:text-indigo-300 hover:underline"
                      >
                        + Add all {presetsInCat.length} shades
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {presetsInCat.map((preset) => {
                        const isAlreadyAdded = list.some(s => s.code === preset.code);
                        return (
                          <div
                            key={preset.code + preset.name}
                            onClick={() => addPreset(preset)}
                            className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                              isAlreadyAdded
                                ? 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700'
                                : 'bg-slate-900 border-slate-800 hover:border-indigo-500 hover:bg-slate-850'
                            }`}
                          >
                            <div className="flex items-center gap-2.5">
                              <div
                                className="w-7 h-7 rounded-lg border border-slate-600 shadow-sm shrink-0 flex items-center justify-center font-mono text-[9px] font-black text-black/70"
                                style={{ backgroundColor: preset.colorHex }}
                              />
                              <div>
                                <span className="text-xs font-bold text-white block">{preset.name}</span>
                                <span className="text-[10px] font-mono font-bold text-indigo-400">Code: {preset.code}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 hover:bg-indigo-600 hover:text-white text-[11px] font-bold transition-colors shrink-0 border border-indigo-500/30"
                            >
                              {isAlreadyAdded ? '+ Add Another' : '+ Add'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPresetsModal(false)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
              >
                Close Presets
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
