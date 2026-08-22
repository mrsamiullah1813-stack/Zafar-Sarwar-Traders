import React, { useState, useMemo } from 'react';
import {
  Palette, Plus, Trash2, ArrowUp, ArrowDown, Copy, Check, Upload,
  Sparkles, AlertCircle, Eye, RefreshCw, X, Image as ImageIcon,
  Search, FileText, CheckCircle2, ZoomIn, Info, HelpCircle
} from 'lucide-react';
import { PaintShade, PaintShadesConfig } from '../types';
import { POPULAR_PAINT_SHADE_PRESETS, PaintShadePreset, searchPaintShades } from '../utils/paintShadeUtils';
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
  // Resolve current active state
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
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');

  // Filtered shades for admin list
  const filteredList = useMemo(() => {
    return searchPaintShades(list, adminSearchQuery);
  }, [list, adminSearchQuery]);

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

  const duplicateShade = (shade: PaintShade) => {
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

    // re-assign display orders
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
      const res = await uploadMediaToSupabase(file, 'product-media', `shade-ref-${shadeId}-${Date.now()}`);
      if (res.url) {
        updateShade(shadeId, {
          referenceImage: res.url,
          image: res.url
        });
      } else {
        alert(res.error || 'Failed to upload shade reference image to Supabase');
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message || String(err)}`);
    } finally {
      setUploadingShadeId(null);
    }
  };

  // Upload manufacturer shade sheet / catalogue reference
  const handleShadeSheetUpload = async (file: File) => {
    setUploadingSheet(true);
    try {
      const res = await uploadMediaToSupabase(file, 'product-media', `shade-sheet-${Date.now()}`);
      if (res.url) {
        updateShadeSheetUrl(res.url);
      } else {
        alert(res.error || 'Failed to upload manufacturer shade sheet to Supabase');
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message || String(err)}`);
    } finally {
      setUploadingSheet(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Master Toggle Header */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/40 flex items-center justify-between gap-4 flex-wrap shadow-lg shadow-black/40">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/40">
            <Palette className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">Real Paint Shade Reference System</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider border border-indigo-500/40">
                Code & Real Reference Based
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Manage exact manufacturer shade codes (e.g. <strong>3044</strong>) and uploaded real shade reference images.
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
              Toggle the switch above to [ON] to configure manufacturer shade codes, uploaded shade reference samples, and catalogue sheet references.
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
          {/* SECTION 2: MANUFACTURER SHADE SHEET / CATALOGUE UPLOAD (ADMIN REFERENCE ONLY) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-indigo-900/40 space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-400 shrink-0 mt-0.5">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Manufacturer Paint Shade Sheet / Catalogue</h4>
                    <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] text-indigo-300 font-semibold">
                      Admin Reference Only
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Upload the complete physical shade card / catalogue image so you can verify exact shade codes & names while editing.
                  </p>
                </div>
              </div>

              {/* Upload or View Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {currentShadeSheet ? (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowSheetViewerModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-900/60 hover:bg-indigo-800/80 border border-indigo-500/40 text-indigo-200 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Full Shade Sheet</span>
                    </button>
                    <label className="cursor-pointer px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1.5">
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
                      className="p-1.5 rounded-xl bg-slate-900 hover:bg-rose-950 text-slate-400 hover:text-rose-300 border border-slate-800 transition-colors"
                      title="Remove Shade Sheet"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <label className="cursor-pointer px-4 py-2 rounded-xl bg-indigo-950 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all flex items-center gap-2 shadow-sm">
                    {uploadingSheet ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    ) : (
                      <Upload className="w-3.5 h-3.5 text-indigo-400" />
                    )}
                    <span>Upload Shade Sheet / Card</span>
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
                )}
              </div>
            </div>

            {/* Note confirming separation of main product image */}
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-900/80 border border-slate-800/90 text-[11px] text-slate-400">
              <Info className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span>
                <strong>Important:</strong> Uploading a Shade Sheet does <u>NOT</u> replace the main Paint Box product image. The product maintains its separate hero photo.
              </span>
            </div>
          </div>

          {/* SECTION CONTROLS BAR: Storefront Title + Presets + Add Shade */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            <div className="md:col-span-6 space-y-1">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                Selector Title on Product Page
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
              <button
                type="button"
                onClick={() => setShowPresetsModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-950/90 hover:bg-indigo-900 border border-indigo-500/40 text-indigo-300 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                <span>Preset Manufacturer Codes</span>
              </button>

              <button
                type="button"
                onClick={addShade}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
              >
                <Plus className="w-4 h-4" />
                <span>+ Add Real Shade</span>
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
                  {list.filter(s => s.isActive !== false).length} Available for Customers
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
                  Click <strong>"+ Add Real Shade"</strong> to enter authentic shade names, codes (e.g. 3044), and reference images, or browse preset codes.
                </p>
                <div className="flex justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowPresetsModal(true)}
                    className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-500 transition-colors"
                  >
                    Browse Manufacturer Presets
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
              <div className="space-y-3">
                {filteredList.map((shade, idx) => {
                  const actualIdx = list.findIndex(s => s.id === shade.id);
                  const isAvailable = shade.isActive !== false;
                  const shadeImg = shade.referenceImage || shade.image;

                  return (
                    <div
                      key={shade.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        isAvailable
                          ? 'bg-slate-900/90 border-slate-800 hover:border-slate-700 shadow-sm'
                          : 'bg-slate-950/70 border-slate-900 opacity-60'
                      }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                        {/* 1. REAL SHADE REFERENCE THUMBNAIL & UPLOADER */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="relative group w-14 h-14 rounded-xl border-2 border-slate-700 overflow-hidden bg-slate-950 shadow-inner flex items-center justify-center">
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
                                <span className="text-[9px] font-black text-black/70 uppercase leading-none font-mono">
                                  {shade.code || 'NO IMG'}
                                </span>
                              </div>
                            )}

                            {/* Hover overlay to upload reference sample */}
                            <label className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer p-1">
                              <Upload className="w-4 h-4 text-white" />
                              <span className="text-[8px] text-slate-200 font-bold text-center leading-tight mt-0.5">
                                {shadeImg ? 'Replace' : 'Upload'}
                              </span>
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

                          {/* Quick upload button if not uploaded yet */}
                          <div className="space-y-1">
                            <label className="cursor-pointer px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold transition-colors flex items-center gap-1.5 border border-slate-700">
                              {uploadingShadeId === shade.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin text-indigo-400" />
                              ) : (
                                <Upload className="w-3 h-3 text-slate-400" />
                              )}
                              <span>{shadeImg ? 'Change Sample' : 'Upload Reference'}</span>
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

                            {shadeImg && (
                              <button
                                type="button"
                                onClick={() => updateShade(shade.id, { referenceImage: '', image: '' })}
                                className="text-[10px] text-rose-400 hover:text-rose-300 hover:underline block text-left"
                              >
                                Remove Sample
                              </button>
                            )}
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
                              placeholder="e.g. Grey Mist"
                              className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white font-semibold focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          {/* Exact Shade Code (Primary Reference) */}
                          <div>
                            <div className="flex items-center justify-between">
                              <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider block">
                                Exact Shade Code *
                              </label>
                              <span className="text-[9px] text-slate-500 font-mono">Source of Truth</span>
                            </div>
                            <input
                              type="text"
                              value={shade.code}
                              onChange={(e) => updateShade(shade.id, { code: e.target.value })}
                              placeholder="e.g. 3044 or 3001"
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
                        <div className="flex items-center justify-between lg:justify-end gap-2 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
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
                            onClick={() => duplicateShade(shade)}
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

      {/* FULL SHADE SHEET VIEWER MODAL (FOR ADMIN REFERENCE) */}
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

      {/* PRESET PALETTES PICKER MODAL */}
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
