import React, { useState, useEffect } from 'react';
import { 
  Type, 
  Palette, 
  RotateCcw, 
  Check, 
  Save, 
  Sparkles, 
  Layers, 
  Eye, 
  Sliders, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  Tag,
  Star,
  Info
} from 'lucide-react';
import { PricingTypographySettings, defaultPricingTypography } from '../types';
import { 
  loadPricingTypographySettings, 
  savePricingTypographySettings, 
  applyPricingTypographyToRoot 
} from '../utils/storage';

interface AdminPricingAppearanceManagerProps {
  onSaved?: (settings: PricingTypographySettings) => void;
}

const PRESET_COLORS = [
  { name: 'Showroom Amber Gold', hex: '#e5a93d', desc: 'Warm luxury & premium retail' },
  { name: 'Emerald Green', hex: '#10b981', desc: 'Trust & commercial clarity' },
  { name: 'Architectural Blue', hex: '#2563eb', desc: 'Modern showroom & tech precision' },
  { name: 'Vibrant Cyan', hex: '#06b6d4', desc: 'High-contrast modern bathroom' },
  { name: 'Ruby Crimson', hex: '#ef4444', desc: 'High urgency & bold emphasis' },
  { name: 'Sunset Orange', hex: '#f97316', desc: 'Inviting & energetic' },
  { name: 'Royal Purple', hex: '#8b5cf6', desc: 'Boutique luxury & elegance' },
  { name: 'Pure Crisp White', hex: '#ffffff', desc: 'Clean contrast on dark themes' },
  { name: 'Obsidian Black', hex: '#0f172a', desc: 'Deep architectural slate' },
  { name: 'Cool Slate Gray', hex: '#64748b', desc: 'Subtle & refined neutral' },
];

const FONT_FAMILIES = [
  { 
    id: 'Plus Jakarta Sans', 
    name: 'Plus Jakarta Sans', 
    tagline: 'Modern Geometric & Clean (Recommended)', 
    cssFont: '"Plus Jakarta Sans", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Inter', 
    name: 'Inter', 
    tagline: 'Ultra-Neutral & High Legibility', 
    cssFont: '"Inter", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Poppins', 
    name: 'Poppins', 
    tagline: 'Geometric & Friendly Rounded', 
    cssFont: '"Poppins", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Montserrat', 
    name: 'Montserrat', 
    tagline: 'Architectural & Bold Structure', 
    cssFont: '"Montserrat", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Playfair Display', 
    name: 'Playfair Display', 
    tagline: 'Luxury Boutique Serif & Elegance', 
    cssFont: '"Playfair Display", serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'DM Sans', 
    name: 'DM Sans', 
    tagline: 'Minimalist European Design', 
    cssFont: '"DM Sans", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Roboto', 
    name: 'Roboto', 
    tagline: 'Crisp Standard Sans-Serif', 
    cssFont: '"Roboto", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Open Sans', 
    name: 'Open Sans', 
    tagline: 'Clean & Open Letterforms', 
    cssFont: '"Open Sans", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Lato', 
    name: 'Lato', 
    tagline: 'Warm Contemporary Curves', 
    cssFont: '"Lato", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'System Default', 
    name: 'System Default UI', 
    tagline: 'Native Device Typography (Fastest)', 
    cssFont: 'system-ui, -apple-system, sans-serif',
    sample: 'Rs. 24,500'
  },
];

const FONT_WEIGHTS: Array<{ label: string; value: PricingTypographySettings['fontWeight']; num: number; desc: string }> = [
  { label: 'Regular (400)', value: '400', num: 400, desc: 'Clean & subtle standard weight' },
  { label: 'Medium (500)', value: '500', num: 500, desc: 'Balanced readability' },
  { label: 'Semi Bold (600)', value: '600', num: 600, desc: 'Firm, noticeable emphasis' },
  { label: 'Bold (700)', value: '700', num: 700, desc: 'High showroom impact (Standard)' },
  { label: 'Extra Bold (800)', value: '800', num: 800, desc: 'Maximum contrast & standout' },
];

const FONT_SIZES: Array<{ label: string; value: PricingTypographySettings['fontSizeScale']; scale: string; desc: string }> = [
  { label: 'Small', value: 'sm', scale: '90%', desc: 'Compact dense catalogs' },
  { label: 'Medium (Default)', value: 'md', scale: '100%', desc: 'Standard showroom scale' },
  { label: 'Large', value: 'lg', scale: '115%', desc: 'Prominent price prominence' },
  { label: 'Extra Large', value: 'xl', scale: '130%', desc: 'Maximum luxury showcase' },
];

const LETTER_SPACINGS: Array<{ label: string; value: PricingTypographySettings['letterSpacing'] }> = [
  { label: 'Tight (-0.02em)', value: 'tight' },
  { label: 'Normal (0em)', value: 'normal' },
  { label: 'Wide (+0.04em)', value: 'wide' },
];

export const AdminPricingAppearanceManager: React.FC<AdminPricingAppearanceManagerProps> = ({ onSaved }) => {
  const [settings, setSettings] = useState<PricingTypographySettings>(() => loadPricingTypographySettings());
  const [hexInput, setHexInput] = useState<string>(() => settings.color || defaultPricingTypography.color);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [previewSaleActive, setPreviewSaleActive] = useState<boolean>(false);
  const [previewSamplePrice, setPreviewSamplePrice] = useState<string>('18,500');

  // Sync state with storage on mount
  useEffect(() => {
    const loaded = loadPricingTypographySettings();
    setSettings(loaded);
    setHexInput(loaded.color);
    applyPricingTypographyToRoot(loaded);
  }, []);

  // When settings change in local state, apply live CSS variables immediately for real-time preview
  const updateSettings = (partial: Partial<PricingTypographySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial, updatedAt: new Date().toISOString() };
      applyPricingTypographyToRoot(next);
      return next;
    });
    setSaveStatus('idle');
  };

  // Handle color change from picker or preset
  const handleColorChange = (newHex: string) => {
    let formatted = newHex.trim();
    if (!formatted.startsWith('#')) {
      formatted = '#' + formatted;
    }
    setHexInput(formatted);
    if (/^#[0-9A-Fa-f]{6}$/.test(formatted) || /^#[0-9A-Fa-f]{3}$/.test(formatted)) {
      updateSettings({ color: formatted });
    }
  };

  // Handle manual HEX input
  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    if (!val.startsWith('#') && val.length > 0) {
      val = '#' + val;
    }
    setHexInput(val);
    if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
      updateSettings({ color: val });
    }
  };

  // Save changes to Supabase & LocalStorage
  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');
    try {
      const result = await savePricingTypographySettings(settings);
      if (result.success) {
        setSaveStatus('success');
        setStatusMessage('Pricing appearance saved successfully to database & synchronized across website!');
        if (onSaved) onSaved(settings);
        setTimeout(() => setSaveStatus('idle'), 5000);
      } else {
        setSaveStatus('error');
        setStatusMessage(result.error || 'Failed to save to database.');
      }
    } catch (err: any) {
      setSaveStatus('error');
      setStatusMessage(err?.message || 'Unexpected network error.');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset to default settings
  const handleReset = () => {
    if (confirm('Reset pricing appearance to standard showroom default?')) {
      setSettings(defaultPricingTypography);
      setHexInput(defaultPricingTypography.color);
      applyPricingTypographyToRoot(defaultPricingTypography);
      setSaveStatus('idle');
    }
  };

  // Helper to compute CSS inline styling for preview
  const previewPriceStyle: React.CSSProperties = {
    color: settings.color,
    fontFamily: settings.fontFamily === 'System Default' ? 'system-ui, -apple-system, sans-serif' : `"${settings.fontFamily}", sans-serif`,
    fontWeight: Number(settings.fontWeight) || 700,
    letterSpacing: settings.letterSpacing === 'tight' ? '-0.02em' : settings.letterSpacing === 'wide' ? '0.04em' : '0em',
    transform: settings.fontSizeScale === 'xl' ? 'scale(1.30)' : settings.fontSizeScale === 'lg' ? 'scale(1.15)' : settings.fontSizeScale === 'sm' ? 'scale(0.90)' : 'scale(1.0)',
    transformOrigin: 'left center',
    display: 'inline-block'
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Top Banner & Context */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400">
              <Type className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
                <span>Pricing Appearance & Typography</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/30">
                  NEW
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-light">
                Configure the dedicated font color, family, weight, and size for product pricing throughout the showroom.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700"
            title="Reset to default settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-bold transition-all shadow-lg shadow-blue-900/40 disabled:opacity-50"
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{isSaving ? 'Saving to Database...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>

      {/* Safety Notice Card */}
      <div className="p-4 rounded-2xl bg-blue-950/40 border border-blue-800/60 flex items-start gap-3 text-xs text-blue-200">
        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white">Strict Scope & Safety Guarantee: </span>
          Settings in this section <span className="underline font-semibold">strictly control product price tags</span> only. They will never alter your website navigation, product descriptions, buttons, or page headings.
        </div>
      </div>

      {/* Status Toasts */}
      {saveStatus === 'success' && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center gap-3 text-emerald-300 text-xs font-medium animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center gap-3 text-rose-300 text-xs font-medium animate-fadeIn">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Main Grid: Controls (Left) + Live Showroom Preview (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">

          {/* SECTION 1: PRICE COLOR */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  1. Price Font Color
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Active: <span className="font-bold text-white">{settings.color}</span>
              </span>
            </div>

            {/* Visual Color Picker & Hex Input */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
              
              {/* Native Color Input & Preview Box */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800">
                <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-700 shrink-0 shadow-inner">
                  <input
                    type="color"
                    value={settings.color}
                    onChange={(e) => handleColorChange(e.target.value)}
                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                  />
                  <div 
                    className="w-full h-full transition-colors"
                    style={{ backgroundColor: settings.color }}
                  />
                </div>
                <div>
                  <span className="text-xs font-bold text-white block">Click to Pick Color</span>
                  <span className="text-[11px] text-slate-400">Opens custom RGB palette</span>
                </div>
              </div>

              {/* Manual HEX Input */}
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
                <label className="block text-[11px] font-semibold text-slate-400">Manual HEX Code</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={hexInput}
                    onChange={handleHexInputChange}
                    placeholder="#E5A93D"
                    maxLength={7}
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white font-mono uppercase focus:border-blue-500 focus:outline-none"
                  />
                </div>
              </div>

            </div>

            {/* Quick Preset Palette Swatches */}
            <div className="space-y-2.5 pt-2">
              <span className="text-xs font-semibold text-slate-300 block">Popular Showroom Color Palettes:</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {PRESET_COLORS.map((preset) => {
                  const isSelected = settings.color.toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => handleColorChange(preset.hex)}
                      className={`p-2 rounded-xl border text-left transition-all flex flex-col gap-1.5 ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-950/40 ring-2 ring-blue-500/30' 
                          : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span 
                          className="w-4 h-4 rounded-full border border-black/20 shadow-sm shrink-0"
                          style={{ backgroundColor: preset.hex }}
                        />
                        {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                      </div>
                      <span className="text-[11px] font-bold text-white truncate">{preset.name}</span>
                      <span className="text-[9px] font-mono text-slate-400">{preset.hex}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

          {/* SECTION 2: FONT FAMILY */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  2. Price Font Family
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Selected: <span className="font-bold text-white">{settings.fontFamily}</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
              {FONT_FAMILIES.map((font) => {
                const isSelected = settings.fontFamily === font.name;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => updateSettings({ fontFamily: font.name })}
                    className={`p-3 rounded-2xl border text-left transition-all flex items-center justify-between ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-950/50 shadow-md shadow-blue-950 ring-1 ring-blue-500/40' 
                        : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <span className="text-xs font-bold text-white block truncate">{font.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate">{font.tagline}</span>
                    </div>

                    <div className="text-right shrink-0">
                      <span 
                        className="text-xs font-black"
                        style={{ fontFamily: font.cssFont, color: settings.color }}
                      >
                        {font.sample}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: FONT WEIGHT & SIZE SCALE */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                3. Font Weight & Scale Dimensions
              </h3>
            </div>

            {/* Font Weight Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Font Weight (Thickness)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {FONT_WEIGHTS.map((w) => {
                  const isSelected = settings.fontWeight === w.value;
                  return (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => updateSettings({ fontWeight: w.value })}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isSelected 
                          ? 'border-cyan-500 bg-cyan-950/50 text-white shadow-sm ring-1 ring-cyan-500/40' 
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs block font-bold" style={{ fontWeight: w.num }}>
                        {w.label}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">{w.num}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Size Scale Selector */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300">
                Relative Size Scale
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {FONT_SIZES.map((s) => {
                  const isSelected = settings.fontSizeScale === s.value;
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => updateSettings({ fontSizeScale: s.value })}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-950/50 text-white shadow-sm ring-1 ring-blue-500/40' 
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold block">{s.label}</span>
                      <span className="text-[10px] font-mono text-slate-500">{s.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Letter Spacing */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300">
                Letter Spacing (Kerning)
              </label>
              <div className="grid grid-cols-3 gap-2">
                {LETTER_SPACINGS.map((ls) => {
                  const isSelected = settings.letterSpacing === ls.value;
                  return (
                    <button
                      key={ls.value}
                      type="button"
                      onClick={() => updateSettings({ letterSpacing: ls.value })}
                      className={`p-2 rounded-xl border text-center text-xs transition-all ${
                        isSelected 
                          ? 'border-amber-500 bg-amber-950/50 text-white shadow-sm ring-1 ring-amber-500/40 font-bold' 
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      {ls.label}
                    </button>
                  );
                })}
              </div>
            </div>

          </div>

        </div>

        {/* RIGHT COLUMN: Live Interactive Showroom Product Mockup (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-24">
          
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Live Showroom Product Preview
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                REAL-TIME
              </span>
            </div>

            {/* Quick Interactive Preview Toolbar */}
            <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800">
              <label className="text-[11px] text-slate-300 font-semibold flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={previewSaleActive}
                  onChange={(e) => setPreviewSaleActive(e.target.checked)}
                  className="rounded border-slate-700 text-blue-600 focus:ring-0 w-3.5 h-3.5"
                />
                <span>Simulate Special Sale Offer</span>
              </label>

              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-slate-400 font-mono">Sample:</span>
                <input
                  type="text"
                  value={previewSamplePrice}
                  onChange={(e) => setPreviewSamplePrice(e.target.value)}
                  className="w-20 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px] text-white font-mono text-center"
                />
              </div>
            </div>

            {/* Realistic Product Card Render */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden shadow-xl group">
              
              {/* Product Image */}
              <div className="relative h-48 bg-slate-900 flex items-center justify-center p-4 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80"
                  alt="Single-Lever Basin Mixer Chrome"
                  referrerPolicy="no-referrer"
                  className="h-full max-w-full object-contain filter drop-shadow-lg group-hover:scale-105 transition-transform duration-500"
                />
                
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-blue-600 text-white font-bold text-[9px] shadow-sm">
                    FEATURED
                  </span>
                  {previewSaleActive && (
                    <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[9px] shadow-sm">
                      SALE 25% OFF
                    </span>
                  )}
                </div>

                <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-950/80 border border-slate-700 text-slate-300 text-[9px] font-bold">
                  SKU: GS-204
                </div>
              </div>

              {/* Product Card Body */}
              <div className="p-4 space-y-3">
                <div>
                  <div className="flex items-center justify-between text-[11px] font-semibold text-blue-400 uppercase tracking-wider mb-1">
                    <span>GROHE • Luxury Bathrooms</span>
                    <div className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3 fill-amber-400" />
                      <span className="font-mono text-[10px] text-slate-300 font-bold">4.9</span>
                    </div>
                  </div>

                  <h4 className="font-bold text-white text-sm leading-snug">
                    Single-Lever Basin Mixer Concealed Chrome
                  </h4>

                  <p className="mt-1 text-slate-400 text-xs line-clamp-2 leading-relaxed">
                    German engineered ceramic cartridge with water-saving eco-flow technology and 10-year warranty.
                  </p>
                </div>

                {/* Price Display Area - DIRECT LIVE TARGET */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Showroom Price
                  </span>

                  {previewSaleActive ? (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        {/* THE CUSTOM TYPOGRAPHY TARGET */}
                        <span 
                          style={previewPriceStyle}
                          className="text-base font-black font-mono transition-all"
                        >
                          Rs. {previewSamplePrice || '18,500'}
                        </span>
                        <span className="text-xs text-slate-500 line-through font-mono">
                          Rs. 24,650
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 font-black text-[9px] font-mono border border-rose-500/30">
                          25% OFF
                        </span>
                      </div>
                      <div className="text-[10px] font-bold text-emerald-400">
                        🎉 Save Rs. 6,150 on this item!
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-baseline gap-2">
                      {/* THE CUSTOM TYPOGRAPHY TARGET */}
                      <span 
                        style={previewPriceStyle}
                        className="text-base font-black font-mono transition-all"
                      >
                        Rs. {previewSamplePrice || '18,500'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Button to showcase that button styles are NOT affected */}
                <div className="pt-1">
                  <button 
                    type="button"
                    className="w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow hover:bg-blue-500 transition-colors"
                  >
                    View Product Details
                  </button>
                </div>

              </div>

            </div>

            {/* Diagnostics & Specs Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]">
              <span className="font-bold text-slate-300 block">Applied CSS Variables:</span>
              <div className="font-mono text-[10px] text-slate-400 space-y-0.5">
                <div>--product-price-color: <span className="text-amber-400 font-bold">{settings.color}</span></div>
                <div>--product-price-font: <span className="text-blue-400 font-bold">{settings.fontFamily}</span></div>
                <div>--product-price-weight: <span className="text-cyan-400 font-bold">{settings.fontWeight}</span></div>
                <div>--product-price-scale: <span className="text-emerald-400 font-bold">{settings.fontSizeScale}</span></div>
                <div>--product-price-letter-spacing: <span className="text-pink-400 font-bold">{settings.letterSpacing}</span></div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};
