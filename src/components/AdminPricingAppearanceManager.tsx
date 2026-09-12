import React, { useState, useEffect, useMemo } from 'react';
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
  Info,
  Search,
  Crown,
  Zap,
  CheckCheck
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

export interface FontFamilyDefinition {
  id: string;
  name: string;
  category: 'luxury-serif' | 'modern-geometric' | 'high-impact' | 'clean-sans';
  categoryLabel: string;
  tagline: string;
  badge?: string;
  badgeColor?: string;
  cssFont: string;
  sample: string;
}

const FONT_FAMILIES: FontFamilyDefinition[] = [
  // 1. LUXURY & BOUTIQUE SERIFS
  { 
    id: 'Cinzel', 
    name: 'Cinzel', 
    category: 'luxury-serif',
    categoryLabel: 'Luxury Serif',
    tagline: 'Regal Roman Elegance & High-End Showroom', 
    badge: '👑 ROYAL LUXURY',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    cssFont: '"Cinzel", serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Cormorant Garamond', 
    name: 'Cormorant Garamond', 
    category: 'luxury-serif',
    categoryLabel: 'Luxury Serif',
    tagline: 'Ultra-Refined Editorial Italian Luxury', 
    badge: '💎 EDITORIAL',
    badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    cssFont: '"Cormorant Garamond", serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Playfair Display', 
    name: 'Playfair Display', 
    category: 'luxury-serif',
    categoryLabel: 'Luxury Serif',
    tagline: 'Boutique High-Contrast Serif & Luxury Fashion', 
    badge: '✨ BOUTIQUE',
    badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    cssFont: '"Playfair Display", serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Prata', 
    name: 'Prata', 
    category: 'luxury-serif',
    categoryLabel: 'Luxury Serif',
    tagline: 'Graceful Craftsmanship & Refined Contrast', 
    badge: '🌟 ELEGANCE',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    cssFont: '"Prata", serif',
    sample: 'Rs. 24,500'
  },

  // 2. MODERN GEOMETRIC & CONTEMPORARY
  { 
    id: 'Plus Jakarta Sans', 
    name: 'Plus Jakarta Sans', 
    category: 'modern-geometric',
    categoryLabel: 'Modern Geometric',
    tagline: 'Modern Geometric & Clean Balance (Showroom Standard)', 
    badge: '★ POPULAR',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    cssFont: '"Plus Jakarta Sans", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Outfit', 
    name: 'Outfit', 
    category: 'modern-geometric',
    categoryLabel: 'Modern Geometric',
    tagline: 'Contemporary Luxury & High Tech Precision', 
    badge: '⚡ MODERN LUXURY',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    cssFont: '"Outfit", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Urbanist', 
    name: 'Urbanist', 
    category: 'modern-geometric',
    categoryLabel: 'Modern Geometric',
    tagline: 'Sleek Architectural & Digital Precision', 
    badge: '🏛️ ARCHITECTURAL',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    cssFont: '"Urbanist", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Syne', 
    name: 'Syne', 
    category: 'modern-geometric',
    categoryLabel: 'Modern Geometric',
    tagline: 'Artisanal Avant-Garde & High Fashion Impact', 
    badge: '🎨 AVANT-GARDE',
    badgeColor: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    cssFont: '"Syne", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Sora', 
    name: 'Sora', 
    category: 'modern-geometric',
    categoryLabel: 'Modern Geometric',
    tagline: 'High Precision Tech-Crafted Aesthetics', 
    badge: '🔷 PRECISION',
    badgeColor: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
    cssFont: '"Sora", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Manrope', 
    name: 'Manrope', 
    category: 'modern-geometric',
    categoryLabel: 'Modern Geometric',
    tagline: 'Modern Semi-Geometric Precision & High Clarity', 
    badge: '📐 GEOMETRIC',
    badgeColor: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
    cssFont: '"Manrope", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Montserrat', 
    name: 'Montserrat', 
    category: 'modern-geometric',
    categoryLabel: 'Modern Geometric',
    tagline: 'Architectural & Bold Urban Structure', 
    badge: '🏢 URBAN BOLD',
    badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    cssFont: '"Montserrat", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Poppins', 
    name: 'Poppins', 
    category: 'modern-geometric',
    categoryLabel: 'Modern Geometric',
    tagline: 'Geometric & Friendly Rounded Curves', 
    badge: '✨ FRIENDLY',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    cssFont: '"Poppins", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'DM Sans', 
    name: 'DM Sans', 
    category: 'modern-geometric',
    categoryLabel: 'Modern Geometric',
    tagline: 'Minimalist European Design & Balanced Kerning', 
    badge: '🇪🇺 EUROPEAN',
    badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    cssFont: '"DM Sans", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Lexend', 
    name: 'Lexend', 
    category: 'modern-geometric',
    categoryLabel: 'Modern Geometric',
    tagline: 'Engineered for Maximum Reading Clarity & Numeral Distinction', 
    badge: '👁️ ULTRA CLARITY',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    cssFont: '"Lexend", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Space Grotesk', 
    name: 'Space Grotesk', 
    category: 'modern-geometric',
    categoryLabel: 'Modern Geometric',
    tagline: 'Tech-Forward Modernist Proportions', 
    badge: '🚀 TECH-MODERN',
    badgeColor: 'bg-violet-500/20 text-violet-300 border-violet-500/30',
    cssFont: '"Space Grotesk", sans-serif',
    sample: 'Rs. 24,500'
  },

  // 3. HIGH IMPACT & CONDENSED SHOWROOM DISPLAY
  { 
    id: 'Bebas Neue', 
    name: 'Bebas Neue', 
    category: 'high-impact',
    categoryLabel: 'High Impact',
    tagline: 'Tall Ultra-Condensed Bold Price Tags (All-Caps Impact)', 
    badge: '🔥 BOLD IMPACT',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/30',
    cssFont: '"Bebas Neue", sans-serif',
    sample: 'RS. 24,500'
  },
  { 
    id: 'Oswald', 
    name: 'Oswald', 
    category: 'high-impact',
    categoryLabel: 'High Impact',
    tagline: 'Classic Showroom Condensed Commercial Authority', 
    badge: '🏷️ SHOWROOM TAG',
    badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    cssFont: '"Oswald", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Rajdhani', 
    name: 'Rajdhani', 
    category: 'high-impact',
    categoryLabel: 'High Impact',
    tagline: 'Industrial Sharp Precision & Bold Numerals', 
    badge: '⚙️ INDUSTRIAL',
    badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    cssFont: '"Rajdhani", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Chakra Petch', 
    name: 'Chakra Petch', 
    category: 'high-impact',
    categoryLabel: 'High Impact',
    tagline: 'Modern Mechanical & Angular Showroom Display', 
    badge: '⚡ MECHANICAL',
    badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    cssFont: '"Chakra Petch", sans-serif',
    sample: 'Rs. 24,500'
  },

  // 4. CLEAN & STANDARD SANS
  { 
    id: 'Inter', 
    name: 'Inter', 
    category: 'clean-sans',
    categoryLabel: 'Clean Sans',
    tagline: 'Ultra-Neutral & High Legibility on All Screens', 
    badge: '🎯 HIGH LEGIBILITY',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    cssFont: '"Inter", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Roboto', 
    name: 'Roboto', 
    category: 'clean-sans',
    categoryLabel: 'Clean Sans',
    tagline: 'Crisp Standard Sans-Serif Letterforms', 
    badge: '📱 STANDARD',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    cssFont: '"Roboto", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Open Sans', 
    name: 'Open Sans', 
    category: 'clean-sans',
    categoryLabel: 'Clean Sans',
    tagline: 'Clean & Open Letterforms for Wide Displays', 
    badge: '📖 OPEN FORM',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    cssFont: '"Open Sans", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'Lato', 
    name: 'Lato', 
    category: 'clean-sans',
    categoryLabel: 'Clean Sans',
    tagline: 'Warm Contemporary Curves & Neutral Harmony', 
    badge: '🌿 WARM SANS',
    badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    cssFont: '"Lato", sans-serif',
    sample: 'Rs. 24,500'
  },
  { 
    id: 'System Default', 
    name: 'System Default UI', 
    category: 'clean-sans',
    categoryLabel: 'Clean Sans',
    tagline: 'Native Device Hardware Typography (Instant)', 
    badge: '⚡ ZERO LATENCY',
    badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
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
  { label: 'Black (900)', value: '900', num: 900, desc: 'Ultra-heavy luxury presence' },
];

const FONT_SIZES: Array<{ label: string; value: PricingTypographySettings['fontSizeScale']; scale: string; desc: string }> = [
  { label: 'Small', value: 'sm', scale: '90%', desc: 'Compact dense catalogs' },
  { label: 'Medium (Default)', value: 'md', scale: '100%', desc: 'Standard showroom scale' },
  { label: 'Large', value: 'lg', scale: '115%', desc: 'Prominent price prominence' },
  { label: 'Extra Large', value: 'xl', scale: '130%', desc: 'Maximum luxury showcase' },
];

const LETTER_SPACINGS: Array<{ label: string; value: PricingTypographySettings['letterSpacing'] }> = [
  { label: 'Tight (-0.025em)', value: 'tight' },
  { label: 'Normal (0em)', value: 'normal' },
  { label: 'Wide (+0.04em)', value: 'wide' },
  { label: 'Ultra-Wide (+0.08em)', value: 'ultra-wide' },
];

const PRICE_STYLES: Array<{ label: string; value: PricingTypographySettings['priceStyle']; desc: string }> = [
  { label: 'Normal', value: 'normal', desc: 'Standard posture' },
  { label: 'Italic (Luxury Tilt)', value: 'italic', desc: 'Refined cursive luxury angle' },
];

export const AdminPricingAppearanceManager: React.FC<AdminPricingAppearanceManagerProps> = ({ onSaved }) => {
  const [settings, setSettings] = useState<PricingTypographySettings>(() => loadPricingTypographySettings());
  const [hexInput, setHexInput] = useState<string>(() => settings.color || defaultPricingTypography.color);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [previewSaleActive, setPreviewSaleActive] = useState<boolean>(false);
  const [previewSamplePrice, setPreviewSamplePrice] = useState<string>('18,500');

  // Font category filter & search
  const [fontCategoryFilter, setFontCategoryFilter] = useState<'all' | 'luxury-serif' | 'modern-geometric' | 'high-impact' | 'clean-sans'>('all');
  const [fontSearchQuery, setFontSearchQuery] = useState<string>('');

  // Filtered font families
  const filteredFonts = useMemo(() => {
    return FONT_FAMILIES.filter((font) => {
      const matchCategory = fontCategoryFilter === 'all' || font.category === fontCategoryFilter;
      const q = fontSearchQuery.trim().toLowerCase();
      const matchQuery = !q || font.name.toLowerCase().includes(q) || font.tagline.toLowerCase().includes(q) || font.categoryLabel.toLowerCase().includes(q);
      return matchCategory && matchQuery;
    });
  }, [fontCategoryFilter, fontSearchQuery]);

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
  const serifList = ['Playfair Display', 'Cinzel', 'Cormorant Garamond', 'Prata'];
  const isSerif = serifList.includes(settings.fontFamily);
  const fallbackGeneric = isSerif ? 'serif' : 'sans-serif';

  const previewPriceStyle: React.CSSProperties = {
    color: settings.color,
    fontFamily: settings.fontFamily === 'System Default' || settings.fontFamily === 'System Sans' 
      ? 'system-ui, -apple-system, sans-serif' 
      : `"${settings.fontFamily}", ${fallbackGeneric}`,
    fontWeight: Number(settings.fontWeight) || 700,
    fontStyle: settings.priceStyle === 'italic' ? 'italic' : 'normal',
    letterSpacing: settings.letterSpacing === 'tight' 
      ? '-0.025em' 
      : settings.letterSpacing === 'wide' 
      ? '0.04em' 
      : settings.letterSpacing === 'ultra-wide'
      ? '0.08em'
      : '0em',
    transform: settings.fontSizeScale === 'xl' 
      ? 'scale(1.30)' 
      : settings.fontSizeScale === 'lg' 
      ? 'scale(1.15)' 
      : settings.fontSizeScale === 'sm' 
      ? 'scale(0.90)' 
      : 'scale(1.0)',
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
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white font-serif flex items-center gap-2">
                <span>Pricing Appearance & Typography</span>
                <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-600/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40 shadow-sm">
                  PRO STYLISH FONTS
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-light">
                Configure luxury serif, modern geometric, high-impact condensed, or clean sans fonts for product price tags across the showroom.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-700 active:scale-95 cursor-pointer"
            title="Reset to default settings"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 active:scale-95 text-white text-xs font-bold transition-all shadow-lg shadow-blue-900/40 disabled:opacity-50 cursor-pointer"
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
          <span className="font-bold text-white">Dedicated Scope Guarantee: </span>
          Settings in this section <span className="underline font-semibold">strictly format product price values</span> across cards, hero highlights, modals, and checkout tags. All other site typography, navigation, and descriptions remain untouched.
        </div>
      </div>

      {/* Status Toasts */}
      {saveStatus === 'success' && (
        <div className="p-4 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 flex items-center gap-3 text-emerald-300 text-xs font-medium animate-fadeIn shadow-lg">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="p-4 rounded-2xl bg-rose-950/80 border border-rose-500/40 flex items-center gap-3 text-rose-300 text-xs font-medium animate-fadeIn shadow-lg">
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
                      className={`p-2 rounded-xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
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

          {/* SECTION 2: PRO & STYLISH FONT FAMILIES */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  2. Best & Professional Font Family ({FONT_FAMILIES.length} Available)
                </h3>
              </div>
              <span className="text-xs text-slate-400">
                Selected: <span className="font-bold text-white">{settings.fontFamily}</span>
              </span>
            </div>

            {/* Filter Tabs & Search Header */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {[
                  { key: 'all', label: `All (${FONT_FAMILIES.length})` },
                  { key: 'luxury-serif', label: '👑 Luxury Serif' },
                  { key: 'modern-geometric', label: '✨ Modern Geometric' },
                  { key: 'high-impact', label: '⚡ High Impact' },
                  { key: 'clean-sans', label: '🎯 Clean Sans' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setFontCategoryFilter(tab.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      fontCategoryFilter === tab.key
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Quick Font Search */}
              <div className="relative shrink-0 sm:w-48">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={fontSearchQuery}
                  onChange={(e) => setFontSearchQuery(e.target.value)}
                  placeholder="Search font..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Font Family Selection Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[460px] overflow-y-auto pr-1">
              {filteredFonts.map((font) => {
                const isSelected = settings.fontFamily === font.name;
                return (
                  <button
                    key={font.id}
                    type="button"
                    onClick={() => updateSettings({ fontFamily: font.name })}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-2.5 cursor-pointer relative group ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-950/60 shadow-lg shadow-blue-950/80 ring-2 ring-blue-500/40' 
                        : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-950'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="min-w-0 pr-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-bold text-white block truncate">{font.name}</span>
                          {font.badge && (
                            <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-bold border ${font.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'}`}>
                              {font.badge}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate mt-0.5">{font.tagline}</span>
                      </div>

                      {isSelected ? (
                        <span className="p-1 rounded-full bg-blue-600 text-white shrink-0 shadow-sm">
                          <Check className="w-3 h-3" />
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-600 uppercase">
                          {font.categoryLabel}
                        </span>
                      )}
                    </div>

                    {/* Real-time Rendered Price Sample in this font */}
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between w-full">
                      <span className="text-[10px] text-slate-500 font-mono">Sample:</span>
                      <span 
                        className="text-sm font-black transition-transform group-hover:scale-105"
                        style={{ 
                          fontFamily: font.cssFont, 
                          color: settings.color,
                          fontWeight: Number(settings.fontWeight) || 700,
                          fontStyle: settings.priceStyle === 'italic' ? 'italic' : 'normal'
                        }}
                      >
                        {font.sample}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {filteredFonts.length === 0 && (
              <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
                No fonts matching "{fontSearchQuery}". Try changing category or clearing your search.
              </div>
            )}

          </div>

          {/* SECTION 3: FONT WEIGHT, STYLE & SCALE DIMENSIONS */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                3. Font Weight, Posture & Scale
              </h3>
            </div>

            {/* Font Weight Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Font Weight (Thickness)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
                {FONT_WEIGHTS.map((w) => {
                  const isSelected = settings.fontWeight === w.value;
                  return (
                    <button
                      key={w.value}
                      type="button"
                      onClick={() => updateSettings({ fontWeight: w.value })}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-cyan-500 bg-cyan-950/50 text-white shadow-sm ring-1 ring-cyan-500/40' 
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs block font-bold" style={{ fontWeight: w.num }}>
                        {w.label.split(' ')[0]}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500">{w.num}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Price Posture Style (Normal vs Italic) */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="block text-xs font-semibold text-slate-300">
                Price Posture Style
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PRICE_STYLES.map((ps) => {
                  const isSelected = (settings.priceStyle || 'normal') === ps.value;
                  return (
                    <button
                      key={ps.value}
                      type="button"
                      onClick={() => updateSettings({ priceStyle: ps.value })}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected 
                          ? 'border-purple-500 bg-purple-950/50 text-white shadow-sm ring-1 ring-purple-500/40' 
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-white hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${ps.value === 'italic' ? 'italic' : ''}`}>
                          {ps.label}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-purple-400" />}
                      </div>
                      <span className="text-[10px] text-slate-500 block mt-0.5">{ps.desc}</span>
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
                      className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {LETTER_SPACINGS.map((ls) => {
                  const isSelected = settings.letterSpacing === ls.value;
                  return (
                    <button
                      key={ls.value}
                      type="button"
                      onClick={() => updateSettings({ letterSpacing: ls.value })}
                      className={`p-2 rounded-xl border text-center text-xs transition-all cursor-pointer ${
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
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 font-mono font-bold border border-emerald-500/30">
                REAL-TIME LIVE
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
                  className="w-20 px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[11px] text-white font-mono text-center focus:border-blue-500 focus:outline-none"
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
                          className="text-base font-black transition-all"
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
                        className="text-base font-black transition-all"
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
                    className="w-full py-2 rounded-xl bg-blue-600 text-white text-xs font-bold shadow hover:bg-blue-500 transition-colors cursor-pointer"
                  >
                    View Product Details
                  </button>
                </div>

              </div>

            </div>

            {/* Diagnostics & Specs Summary */}
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5 text-[11px]">
              <span className="font-bold text-slate-300 block">Active Applied Price Typography:</span>
              <div className="font-mono text-[10px] text-slate-400 space-y-0.5">
                <div>--product-price-color: <span className="text-amber-400 font-bold">{settings.color}</span></div>
                <div>--product-price-font: <span className="text-blue-400 font-bold">{settings.fontFamily}</span></div>
                <div>--product-price-weight: <span className="text-cyan-400 font-bold">{settings.fontWeight}</span></div>
                <div>--product-price-style: <span className="text-purple-400 font-bold">{settings.priceStyle || 'normal'}</span></div>
                <div>--product-price-scale: <span className="text-emerald-400 font-bold">{settings.fontSizeScale}</span></div>
                <div>--product-price-letter-spacing: <span className="text-pink-400 font-bold">{settings.letterSpacing || 'normal'}</span></div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

