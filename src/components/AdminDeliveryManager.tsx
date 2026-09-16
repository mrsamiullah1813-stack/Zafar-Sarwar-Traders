import React, { useState, useMemo, useEffect } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Check, 
  X, 
  Search, 
  Building2, 
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  CheckCircle2,
  Info,
  LayoutGrid,
  List,
  Star,
  DollarSign,
  ArrowUp,
  ArrowDown,
  Layers,
  AlertTriangle,
  Sparkles,
  Send,
  RefreshCw,
  Globe,
  Zap,
  Calculator,
  Sliders,
  CheckSquare,
  Square,
  HelpCircle,
  Scale
} from 'lucide-react';
import { DeliverySettings, CityDeliveryInfo, DeliveryFeeTier, DeliveryWeightTier } from '../types';
import { loadDeliverySettings, saveDeliverySettings, sanitizeAndDeduplicateCities, defaultDeliverySettings } from '../utils/storage';
import { 
  validateDeliveryTiers, 
  generateDefaultCityTiers, 
  validateWeightTiers,
  generateDefaultCityWeightTiers,
  formatTierRange, 
  formatTierFee,
  formatWeightTierRange,
  formatWeightTierFee,
  calculateCityDeliveryFee
} from '../utils/deliveryFeeCalculator';
import { 
  fetchDeliveryCitiesFromSupabase,
  fetchSiteSettingFromSupabase,
  upsertDeliveryCityInSupabase, 
  saveSiteSettingToSupabase,
  deleteDeliveryCityFromSupabase,
  saveDeliveryCitiesToSupabase
} from '../services/supabaseService';

interface AdminDeliveryManagerProps {
  onShowToast: (message: string) => void;
}

export const AdminDeliveryManager: React.FC<AdminDeliveryManagerProps> = ({ onShowToast }) => {
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(() => loadDeliverySettings());
  const [citySearch, setCitySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'punjab' | 'available' | 'custom_rules' | 'fallback' | 'unavailable'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isSaving, setIsSaving] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'applied' | 'saved' | 'unsaved'>('applied');
  const [lastAppliedTime, setLastAppliedTime] = useState<string>('Live on Storefront');
  
  // City Edit Modal State
  const [editingCity, setEditingCity] = useState<CityDeliveryInfo | null>(null);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [coverageInput, setCoverageInput] = useState('');

  // Live Testbench State
  const [testCityId, setTestCityId] = useState<string>('city-chiniot');
  const [testSubtotal, setTestSubtotal] = useState<number>(7500);
  const [testWeightKg, setTestWeightKg] = useState<number>(0);

  // New Note Input
  const [newNoteText, setNewNoteText] = useState('');

  // Auto-sync real-time delivery rules from Supabase production database on mount
  useEffect(() => {
    let isMounted = true;
    async function loadCloudDeliveryData() {
      try {
        const [cloudSettings, cloudCities] = await Promise.all([
          fetchSiteSettingFromSupabase<DeliverySettings>('delivery_settings'),
          fetchDeliveryCitiesFromSupabase()
        ]);
        if (!isMounted) return;

        setDeliverySettings(prev => {
          let updated = { ...prev };
          if (cloudSettings && typeof cloudSettings === 'object') {
            updated = { ...updated, ...cloudSettings };
          }
          if (Array.isArray(cloudCities) && cloudCities.length > 0) {
            // Merge cloud cities with any additional cities in prev/default so all cities are preserved
            const combined = sanitizeAndDeduplicateCities([
              ...cloudCities,
              ...(updated.cities || []),
              ...defaultDeliverySettings.cities
            ]);
            updated.cities = combined;
          } else {
            updated.cities = sanitizeAndDeduplicateCities(updated.cities || defaultDeliverySettings.cities);
          }
          saveDeliverySettings(updated);
          return updated;
        });
      } catch (err) {
        console.warn('[AdminDeliveryManager] Error loading cloud delivery data:', err);
      }
    }
    loadCloudDeliveryData();
    return () => { isMounted = false; };
  }, []);

  // Save changes locally to draft
  const handleSaveChanges = () => {
    try {
      saveDeliverySettings(deliverySettings);
      setSyncStatus('saved');
      onShowToast('✓ Saved: Delivery fee rules saved in draft! Click [APPLY TO WEBSITE] to push live.');
    } catch (err: any) {
      onShowToast('Failed to save settings: ' + (err?.message || String(err)));
    }
  };

  // Push changes live to Supabase production database & broadcast checkout update
  const executeApplyToWebsite = async (settingsToApply: DeliverySettings) => {
    setIsApplying(true);
    try {
      // 1. Save locally
      saveDeliverySettings(settingsToApply);

      // 2. Push city delivery slabs to Supabase
      const citiesRes = await saveDeliveryCitiesToSupabase(settingsToApply.cities);
      if (citiesRes && citiesRes.success === false) {
        throw new Error(citiesRes.error || 'Failed to save delivery cities to database');
      }

      // 3. Push general site delivery settings to Supabase
      const settingsRes = await saveSiteSettingToSupabase('delivery_settings', settingsToApply);
      if (settingsRes && settingsRes.success === false) {
        throw new Error(settingsRes.error || 'Failed to sync delivery settings to database');
      }

      // 4. Dispatch browser custom event for instant frontend checkout recalculation
      window.dispatchEvent(new CustomEvent('zst_delivery_settings_updated', { detail: settingsToApply }));

      setSyncStatus('applied');
      setLastAppliedTime(new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }));
      onShowToast('🚀 LIVE: Delivery fee rules and slabs successfully applied to production database & checkout!');
    } catch (err: any) {
      console.error('[Delivery Manager] Apply failed:', err);
      onShowToast('⚠️ Error applying to database: ' + (err?.message || 'Check database connection.'));
    } finally {
      setIsApplying(false);
    }
  };

  const handleApplyToWebsite = async () => {
    await executeApplyToWebsite(deliverySettings);
  };

  const handleToggleCityStatus = (cityId: string) => {
    const targetCity = deliverySettings.cities.find(c => c.id === cityId);
    if (!targetCity) return;

    const newIsEnabled = targetCity.isEnabled === false ? true : false;
    const updatedCities = deliverySettings.cities.map(c => 
      c.id === cityId ? { ...c, isEnabled: newIsEnabled } : c
    );
    const updated = { ...deliverySettings, cities: updatedCities };
    setDeliverySettings(updated);
    saveDeliverySettings(updated);
    setSyncStatus('unsaved');
    
    // Also update single record in Supabase in background
    upsertDeliveryCityInSupabase({ ...targetCity, isEnabled: newIsEnabled });

    onShowToast(`Delivery for ${targetCity.cityName} set to ${newIsEnabled ? 'Enabled' : 'Disabled'}! Click [APPLY TO WEBSITE] to push live.`);
  };

  const handleToggleCustomRules = (cityId: string) => {
    const targetCity = deliverySettings.cities.find(c => c.id === cityId);
    if (!targetCity) return;

    const newUseCustomRules = targetCity.useCustomRules === false ? true : false;
    const updatedCities = deliverySettings.cities.map(c => 
      c.id === cityId ? { ...c, useCustomRules: newUseCustomRules, isOptional: !newUseCustomRules } : c
    );
    const updated = { ...deliverySettings, cities: updatedCities };
    setDeliverySettings(updated);
    saveDeliverySettings(updated);
    setSyncStatus('unsaved');
    
    onShowToast(`${targetCity.cityName}: Custom fee rules ${newUseCustomRules ? 'ACTIVATED' : 'SET TO GLOBAL FALLBACK'}!`);
  };

  const handleSetDefaultCity = async (cityId: string) => {
    const updated = { ...deliverySettings, defaultSelectedCityId: cityId };
    setDeliverySettings(updated);
    saveDeliverySettings(updated);
    setSyncStatus('unsaved');
    await saveSiteSettingToSupabase('delivery_settings', updated);
    const cName = deliverySettings.cities.find(c => c.id === cityId)?.cityName || cityId;
    onShowToast(`Set ${cName} as default selected delivery city! Click [APPLY TO WEBSITE] to push live.`);
  };

  const handleDeleteCity = async (cityId: string, cityName: string) => {
    if (confirm(`Are you sure you want to permanently delete ${cityName} from delivery zones?`)) {
      const updatedCities = deliverySettings.cities.filter(c => c.id !== cityId);
      const updated = { ...deliverySettings, cities: updatedCities };
      setDeliverySettings(updated);
      saveDeliverySettings(updated);
      setSyncStatus('unsaved');
      
      // Delete in DB
      await deleteDeliveryCityFromSupabase(cityId);
      onShowToast(`Deleted ${cityName} from delivery cities. Click [APPLY TO WEBSITE] to confirm live.`);
    }
  };

  const tierValidation = useMemo(() => {
    if (!editingCity || editingCity.deliveryFeeType !== 'tiered') {
      return { isValid: true, errors: [], warnings: [] };
    }
    return validateDeliveryTiers(editingCity.deliveryTiers || []);
  }, [editingCity?.deliveryTiers, editingCity?.deliveryFeeType]);

  const weightTierValidation = useMemo(() => {
    if (!editingCity || !editingCity.enableWeightTiers) {
      return { isValid: true, errors: [], warnings: [] };
    }
    return validateWeightTiers(editingCity.weightTiers || []);
  }, [editingCity?.weightTiers, editingCity?.enableWeightTiers]);

  const handleAddTier = () => {
    if (!editingCity) return;
    const currentTiers = editingCity.deliveryTiers || [];
    let nextMin = 0;
    if (currentTiers.length > 0) {
      const lastTier = currentTiers[currentTiers.length - 1];
      if (lastTier.maxAmount !== null && lastTier.maxAmount !== undefined) {
        nextMin = lastTier.maxAmount + 1;
      } else {
        nextMin = lastTier.minAmount + 5000;
      }
    }
    const newTier: DeliveryFeeTier = {
      id: `tier-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      minAmount: nextMin,
      maxAmount: null,
      fee: 0,
      isFree: true,
      label: ''
    };
    setEditingCity({
      ...editingCity,
      deliveryTiers: [...currentTiers, newTier]
    });
  };

  const handleUpdateTier = (idx: number, updates: Partial<DeliveryFeeTier>) => {
    if (!editingCity) return;
    const currentTiers = [...(editingCity.deliveryTiers || [])];
    if (!currentTiers[idx]) return;
    currentTiers[idx] = { ...currentTiers[idx], ...updates };
    setEditingCity({
      ...editingCity,
      deliveryTiers: currentTiers
    });
  };

  const handleDeleteTier = (idx: number) => {
    if (!editingCity) return;
    const currentTiers = (editingCity.deliveryTiers || []).filter((_, i) => i !== idx);
    setEditingCity({
      ...editingCity,
      deliveryTiers: currentTiers
    });
  };

  const handleMoveTier = (idx: number, direction: 'up' | 'down') => {
    if (!editingCity) return;
    const currentTiers = [...(editingCity.deliveryTiers || [])];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentTiers.length) return;
    const temp = currentTiers[idx];
    currentTiers[idx] = currentTiers[targetIdx];
    currentTiers[targetIdx] = temp;
    setEditingCity({
      ...editingCity,
      deliveryTiers: currentTiers
    });
  };

  const handleLoadDefaultTiers = () => {
    if (!editingCity) return;
    setEditingCity({
      ...editingCity,
      deliveryFeeType: 'tiered',
      deliveryTiers: generateDefaultCityTiers(editingCity.cityName || 'City')
    });
  };

  // Weight Tiers Handlers
  const handleAddWeightTier = () => {
    if (!editingCity) return;
    const currentTiers = editingCity.weightTiers || [];
    let nextMin = 0;
    if (currentTiers.length > 0) {
      const lastTier = currentTiers[currentTiers.length - 1];
      if (lastTier.maxWeightKg !== null && lastTier.maxWeightKg !== undefined) {
        nextMin = lastTier.maxWeightKg + 0.1;
      } else {
        nextMin = lastTier.minWeightKg + 10;
      }
    }
    const newTier: DeliveryWeightTier = {
      id: `wt-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      minWeightKg: Math.round(nextMin * 10) / 10,
      maxWeightKg: null,
      fee: 300,
      isFree: false,
      label: ''
    };
    setEditingCity({
      ...editingCity,
      weightTiers: [...currentTiers, newTier]
    });
  };

  const handleUpdateWeightTier = (idx: number, updates: Partial<DeliveryWeightTier>) => {
    if (!editingCity) return;
    const currentTiers = [...(editingCity.weightTiers || [])];
    if (!currentTiers[idx]) return;
    currentTiers[idx] = { ...currentTiers[idx], ...updates };
    setEditingCity({
      ...editingCity,
      weightTiers: currentTiers
    });
  };

  const handleDeleteWeightTier = (idx: number) => {
    if (!editingCity) return;
    const currentTiers = (editingCity.weightTiers || []).filter((_, i) => i !== idx);
    setEditingCity({
      ...editingCity,
      weightTiers: currentTiers
    });
  };

  const handleMoveWeightTier = (idx: number, direction: 'up' | 'down') => {
    if (!editingCity) return;
    const currentTiers = [...(editingCity.weightTiers || [])];
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= currentTiers.length) return;
    const temp = currentTiers[idx];
    currentTiers[idx] = currentTiers[targetIdx];
    currentTiers[targetIdx] = temp;
    setEditingCity({
      ...editingCity,
      weightTiers: currentTiers
    });
  };

  const handleLoadDefaultWeightTiers = () => {
    if (!editingCity) return;
    setEditingCity({
      ...editingCity,
      enableWeightTiers: true,
      weightPricingMode: editingCity.weightPricingMode || 'highest',
      weightTiers: generateDefaultCityWeightTiers()
    });
  };

  const handleOpenAddCityModal = () => {
    const newId = `city-${Date.now()}`;
    setEditingCity({
      id: newId,
      cityName: '',
      areaTown: '',
      status: 'available',
      estimatedDays: '1–2 Working Days',
      deliveryFee: 200,
      baseFee: 200,
      minFee: 0,
      maxFee: 5000,
      freeDeliveryThreshold: 10000,
      deliveryFeeType: 'tiered',
      deliveryFeeCustomText: '',
      freeDelivery: false,
      minOrderAmount: undefined,
      additionalAddress: '',
      isSameDayAvailable: false,
      isNextDayAvailable: true,
      isEnabled: true,
      isOptional: false,
      useCustomRules: true,
      notes: '',
      coverageAreas: [],
      displayOrder: deliverySettings.cities.length + 1,
      deliveryTiers: generateDefaultCityTiers('New City'),
      enableWeightTiers: false,
      weightPricingMode: 'highest',
      weightTiers: generateDefaultCityWeightTiers()
    });
    setCoverageInput('');
    setIsCityModalOpen(true);
  };

  const handleOpenEditCityModal = (city: CityDeliveryInfo) => {
    const hasTiers = Array.isArray(city.deliveryTiers) && city.deliveryTiers.length > 0;
    const feeType = city.deliveryFeeType || (hasTiers ? 'tiered' : (city.deliveryFee === 0 ? 'free' : 'fixed'));
    const hasWeightTiers = Array.isArray(city.weightTiers) && city.weightTiers.length > 0;

    setEditingCity({ 
      ...city,
      status: city.status || 'available',
      deliveryFeeType: feeType,
      useCustomRules: city.useCustomRules !== false,
      baseFee: city.baseFee ?? city.deliveryFee ?? 200,
      minFee: city.minFee ?? 0,
      maxFee: city.maxFee ?? 5000,
      freeDeliveryThreshold: city.freeDeliveryThreshold ?? (feeType === 'free' ? 0 : 10000),
      freeDelivery: city.freeDelivery !== undefined ? city.freeDelivery : (city.deliveryFee === 0 || feeType === 'free'),
      deliveryTiers: hasTiers 
        ? [...city.deliveryTiers!] 
        : (feeType === 'tiered' ? generateDefaultCityTiers(city.cityName) : []),
      enableWeightTiers: Boolean(city.enableWeightTiers),
      weightPricingMode: city.weightPricingMode || 'highest',
      weightTiers: hasWeightTiers ? [...city.weightTiers!] : generateDefaultCityWeightTiers()
    });
    setCoverageInput(Array.isArray(city.coverageAreas) ? city.coverageAreas.join(', ') : '');
    setIsCityModalOpen(true);
  };

  const handleSaveCity = async (e?: React.FormEvent, andApplyLive: boolean = false) => {
    if (e) e.preventDefault();
    if (!editingCity || !editingCity.cityName.trim()) {
      alert('City name is required.');
      return;
    }

    if (editingCity.deliveryFeeType === 'tiered') {
      const tiers = editingCity.deliveryTiers || [];
      if (tiers.length === 0) {
        alert('Please add at least one order-value pricing tier or select a different delivery fee mode.');
        return;
      }
      const validation = validateDeliveryTiers(tiers);
      if (!validation.isValid) {
        alert(`Cannot save tiered pricing:\n• ${validation.errors.join('\n• ')}`);
        return;
      }
    }

    if (editingCity.enableWeightTiers) {
      const wTiers = editingCity.weightTiers || [];
      if (wTiers.length === 0) {
        alert('Weight-based delivery is enabled, but no weight tiers are defined. Please add at least one weight tier or disable weight-based delivery.');
        return;
      }
      const wValidation = validateWeightTiers(wTiers);
      if (!wValidation.isValid) {
        alert(`Cannot save weight-based tiers:\n• ${wValidation.errors.join('\n• ')}`);
        return;
      }
    }

    const coverageArray = coverageInput
      ? coverageInput.split(',').map(s => s.trim()).filter(Boolean)
      : (editingCity.coverageAreas || []);

    const sortedTiers = (editingCity.deliveryFeeType === 'tiered' && editingCity.deliveryTiers)
      ? [...editingCity.deliveryTiers].sort((a, b) => a.minAmount - b.minAmount)
      : (editingCity.deliveryTiers || undefined);

    const sortedWeightTiers = (editingCity.enableWeightTiers && editingCity.weightTiers)
      ? [...editingCity.weightTiers].sort((a, b) => a.minWeightKg - b.minWeightKg)
      : (editingCity.weightTiers || undefined);

    const updatedCityRecord: CityDeliveryInfo = {
      ...editingCity,
      cityName: editingCity.cityName.trim(),
      areaTown: editingCity.areaTown ? editingCity.areaTown.trim() : undefined,
      notes: editingCity.notes ? editingCity.notes.trim() : undefined,
      additionalAddress: editingCity.additionalAddress ? editingCity.additionalAddress.trim() : undefined,
      coverageAreas: coverageArray,
      deliveryTiers: sortedTiers,
      enableWeightTiers: Boolean(editingCity.enableWeightTiers),
      weightPricingMode: editingCity.weightPricingMode || 'highest',
      weightTiers: sortedWeightTiers,
      baseFee: editingCity.baseFee ?? editingCity.deliveryFee ?? 200,
      minFee: typeof editingCity.minFee === 'number' ? editingCity.minFee : 0,
      maxFee: typeof editingCity.maxFee === 'number' ? editingCity.maxFee : 5000,
      freeDeliveryThreshold: typeof editingCity.freeDeliveryThreshold === 'number' ? editingCity.freeDeliveryThreshold : undefined,
      useCustomRules: editingCity.useCustomRules !== false,
      isOptional: editingCity.useCustomRules === false,
      freeDelivery: Boolean(
        editingCity.deliveryFeeType === 'free' || 
        (editingCity.deliveryFeeType === 'fixed' && editingCity.deliveryFee === 0 && (!sortedTiers || sortedTiers.length === 0))
      )
    };

    const existsIndex = deliverySettings.cities.findIndex(c => c.id === updatedCityRecord.id);
    let updatedCities = [...deliverySettings.cities];

    if (existsIndex > -1) {
      updatedCities[existsIndex] = updatedCityRecord;
    } else {
      updatedCities.push(updatedCityRecord);
    }

    // Sort by display order or city name
    updatedCities.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));

    const updated = { ...deliverySettings, cities: updatedCities };
    setDeliverySettings(updated);
    saveDeliverySettings(updated);

    if (andApplyLive) {
      setIsCityModalOpen(false);
      setEditingCity(null);
      await executeApplyToWebsite(updated);
    } else {
      setSyncStatus('unsaved');
      setIsCityModalOpen(false);
      setEditingCity(null);
      // Sync single city in Supabase
      upsertDeliveryCityInSupabase(updatedCityRecord);
      onShowToast(`City "${updatedCityRecord.cityName}" updated in draft! Click [APPLY TO WEBSITE] to push live.`);
    }
  };

  const handleAddDeliveryNote = () => {
    if (!newNoteText.trim()) return;
    const formatted = newNoteText.trim().startsWith('✓') ? newNoteText.trim() : `✓ ${newNoteText.trim()}`;
    const updatedNotes = [...(deliverySettings.deliveryNotes || []), formatted];
    const updated = { ...deliverySettings, deliveryNotes: updatedNotes };
    setDeliverySettings(updated);
    saveDeliverySettings(updated);
    setNewNoteText('');
    onShowToast('New delivery note added!');
  };

  const handleRemoveDeliveryNote = (index: number) => {
    const updatedNotes = (deliverySettings.deliveryNotes || []).filter((_, i) => i !== index);
    const updated = { ...deliverySettings, deliveryNotes: updatedNotes };
    setDeliverySettings(updated);
    saveDeliverySettings(updated);
    onShowToast('Delivery note removed.');
  };

  const filteredCities = useMemo(() => {
    const matches = (deliverySettings?.cities || []).filter(c => {
      if (!c) return false;
      // 1. Search Query
      const q = (citySearch || '').toLowerCase().trim();
      let matchesSearch = true;
      if (q) {
        const nameMatch = (c.cityName || '').toLowerCase().includes(q);
        const areaMatch = (c.areaTown || '').toLowerCase().includes(q);
        const daysMatch = (c.estimatedDays || '').toLowerCase().includes(q);
        const notesMatch = (c.notes || '').toLowerCase().includes(q);
        const provinceMatch = (c.province || '').toLowerCase().includes(q);
        const coverageMatch = Array.isArray(c.coverageAreas) && c.coverageAreas.some(a => a.toLowerCase().includes(q));
        matchesSearch = nameMatch || areaMatch || daysMatch || notesMatch || coverageMatch || provinceMatch;
      }

      // 2. Status Filter
      let matchesStatus = true;
      if (statusFilter === 'punjab') {
        matchesStatus = (c.province === 'Punjab' || !c.province || c.province === '') && 
                        c.province !== 'Sindh' && 
                        c.province !== 'KPK' && 
                        c.province !== 'Balochistan' && 
                        c.province !== 'Federal Capital';
      } else if (statusFilter === 'available') {
        matchesStatus = (!c.status || c.status === 'available') && c.isEnabled !== false;
      } else if (statusFilter === 'custom_rules') {
        matchesStatus = c.useCustomRules !== false;
      } else if (statusFilter === 'fallback') {
        matchesStatus = c.useCustomRules === false;
      } else if (statusFilter === 'unavailable') {
        matchesStatus = c.status === 'unavailable' || c.isEnabled === false;
      }

      return matchesSearch && matchesStatus;
    });
    return sanitizeAndDeduplicateCities(matches);
  }, [deliverySettings.cities, citySearch, statusFilter]);

  // Live Test Calculation
  const selectedTestCity = deliverySettings.cities.find(c => c.id === testCityId) || deliverySettings.cities[0];
  const liveTestResult = useMemo(() => {
    const fallbackRate = deliverySettings.globalFallbackFee ?? deliverySettings.globalDeliveryFeeAmount ?? 250;
    const globalFree = deliverySettings.globalFreeDeliveryThreshold ?? deliverySettings.freeDeliveryThreshold;
    return calculateCityDeliveryFee(
      selectedTestCity,
      testSubtotal,
      fallbackRate,
      globalFree,
      deliverySettings.minDeliveryFee,
      deliverySettings.maxDeliveryFee,
      testWeightKg
    );
  }, [selectedTestCity, testSubtotal, deliverySettings, testWeightKg]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30 text-[11px] font-bold tracking-wide uppercase">
                <Truck className="w-3.5 h-3.5 text-amber-400" />
                <span>Dynamic City-Wise Delivery Fee Management</span>
              </span>

              {/* Real-time sync status pill */}
              {syncStatus === 'unsaved' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold animate-pulse">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>● Unsaved Changes (Draft)</span>
                </span>
              )}
              {syncStatus === 'saved' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/40 text-[11px] font-bold">
                  <Check className="w-3 h-3 text-sky-400" />
                  <span>✓ Saved to Draft (Ready to Apply)</span>
                </span>
              )}
              {syncStatus === 'applied' && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                  <span>● Live on Website & Checkout ({lastAppliedTime})</span>
                </span>
              )}
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight">Delivery Fee Management</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
              Configure unlimited delivery cities across Pakistan with customizable base fees, minimum/maximum fee caps, optional city toggles, free shipping thresholds, and order-value slabs that calculate automatically on checkout.
            </p>
          </div>

          {/* Top Admin Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleOpenAddCityModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add City</span>
            </button>

            <button
              type="button"
              onClick={handleSaveChanges}
              disabled={isSaving}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold rounded-2xl flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              title="Save local changes to draft"
            >
              <Save className="w-4 h-4 text-amber-400" />
              <span>Save Draft</span>
            </button>

            <button
              type="button"
              onClick={handleApplyToWebsite}
              disabled={isApplying}
              className={`px-5 py-2.5 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                syncStatus !== 'applied'
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-400/50 shadow-emerald-500/30 font-black'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
              }`}
              title="Deploy all city rules and slabs directly to production database & checkout"
            >
              <Zap className={`w-4 h-4 ${isApplying ? 'animate-spin' : ''}`} />
              <span>{isApplying ? 'Applying Live...' : 'Apply to Website'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Fallback Fee & Storewide Thresholds Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-base font-serif font-bold text-white">Global Fallback Fee & Nationwide Rules</h3>
              <p className="text-xs text-slate-400">
                Applied to unconfigured cities, custom addresses, or cities with the "Optional Custom Rule" toggle turned OFF.
              </p>
            </div>
          </div>

          <span className="text-[11px] font-mono font-bold text-amber-300 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/25">
            Fallback Rate: PKR {(deliverySettings.globalFallbackFee ?? deliverySettings.globalDeliveryFeeAmount ?? 250).toLocaleString()}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          {/* Global Fallback Fee */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="block font-semibold text-slate-300">
              Default Fallback Fee (PKR) *
            </label>
            <input
              type="number"
              min={0}
              value={deliverySettings.globalFallbackFee ?? deliverySettings.globalDeliveryFeeAmount ?? 250}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value) || 0);
                setDeliverySettings({ ...deliverySettings, globalFallbackFee: val, globalDeliveryFeeAmount: val });
                setSyncStatus('unsaved');
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-slate-500">Charged for standard cities without custom slabs.</p>
          </div>

          {/* Storewide Free Delivery Over */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="block font-semibold text-slate-300">
              Storewide Free Shipping Over (PKR)
            </label>
            <input
              type="number"
              min={0}
              placeholder="e.g. 50000"
              value={deliverySettings.globalFreeDeliveryThreshold ?? deliverySettings.freeDeliveryThreshold ?? 50000}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value) || 0);
                setDeliverySettings({ ...deliverySettings, globalFreeDeliveryThreshold: val, freeDeliveryThreshold: val });
                setSyncStatus('unsaved');
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-slate-500">Cart subtotal threshold for 100% free delivery nationwide.</p>
          </div>

          {/* Min Delivery Fee Floor */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="block font-semibold text-slate-300">
              Global Min Fee Floor (PKR)
            </label>
            <input
              type="number"
              min={0}
              placeholder="0"
              value={deliverySettings.minDeliveryFee ?? 0}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value) || 0);
                setDeliverySettings({ ...deliverySettings, minDeliveryFee: val });
                setSyncStatus('unsaved');
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-slate-500">Lowest possible fee charged for any delivery.</p>
          </div>

          {/* Max Delivery Fee Cap */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-1.5">
            <label className="block font-semibold text-slate-300">
              Global Max Fee Cap (PKR)
            </label>
            <input
              type="number"
              min={0}
              placeholder="5000"
              value={deliverySettings.maxDeliveryFee ?? 5000}
              onChange={(e) => {
                const val = Math.max(0, parseInt(e.target.value) || 0);
                setDeliverySettings({ ...deliverySettings, maxDeliveryFee: val });
                setSyncStatus('unsaved');
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
            />
            <p className="text-[10px] text-slate-500">Ceiling cap: Fee will never exceed this amount.</p>
          </div>
        </div>
      </div>

      {/* Main Settings Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Cities Management (Table / Cards) */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            {/* Header & Filter Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="text-base font-serif font-bold text-white">Configured Delivery Cities & Fee Slabs</h3>
                  <p className="text-xs text-slate-400">
                    Total {deliverySettings.cities.length} cities ({deliverySettings.cities.filter(c => c.useCustomRules !== false).length} with custom rules active)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setViewMode('table')}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'table' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                    title="Table View"
                  >
                    <List className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('cards')}
                    className={`p-1.5 rounded-lg text-xs transition-colors ${viewMode === 'cards' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
                    title="Grid Cards View"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleOpenAddCityModal}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl flex items-center gap-1.5 shadow transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ City</span>
                </button>
              </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search city by name, town, or area..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1 sm:pb-0">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all border whitespace-nowrap ${
                    statusFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  All ({deliverySettings.cities.length})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('punjab')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all border whitespace-nowrap ${
                    statusFilter === 'punjab'
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="Filter Punjab cities"
                >
                  📍 Punjab ({deliverySettings.cities.filter(c => (c.province === 'Punjab' || !c.province || c.province === '') && c.province !== 'Sindh' && c.province !== 'KPK' && c.province !== 'Balochistan' && c.province !== 'Federal Capital').length})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('custom_rules')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all border whitespace-nowrap ${
                    statusFilter === 'custom_rules'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="Cities with custom fee rules active"
                >
                  Custom Slabs ({deliverySettings.cities.filter(c => c.useCustomRules !== false).length})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('fallback')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all border whitespace-nowrap ${
                    statusFilter === 'fallback'
                      ? 'bg-sky-500 text-slate-950 border-sky-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                  title="Cities set to use global fallback rate"
                >
                  Global Fallback ({deliverySettings.cities.filter(c => c.useCustomRules === false).length})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('unavailable')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all border whitespace-nowrap ${
                    statusFilter === 'unavailable'
                      ? 'bg-rose-500 text-slate-950 border-rose-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  Disabled ({deliverySettings.cities.filter(c => c.status === 'unavailable' || c.isEnabled === false).length})
                </button>
              </div>
            </div>

            {/* TABLE VIEW: CITY | ACTIVE / OPTIONAL TOGGLE | SLABS & LIMITS | CURRENT DELIVERY CONFIGURATION | TIME | ACTIONS */}
            {viewMode === 'table' ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">City Name</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Custom Rule</th>
                      <th className="p-3">Delivery Slabs & Limits</th>
                      <th className="p-3">Fee Configuration</th>
                      <th className="p-3">Est. Time</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {filteredCities.map((city, cIdx) => {
                      const isDefault = deliverySettings.defaultSelectedCityId === city.id;
                      const isFree = city.freeDelivery || city.deliveryFeeType === 'free' || city.deliveryFee === 0;
                      const hasTiers = Array.isArray(city.deliveryTiers) && city.deliveryTiers.length > 0;
                      const useCustom = city.useCustomRules !== false;

                      return (
                        <tr key={city.id ? `${city.id}-${cIdx}` : `city-row-${city.cityName}-${cIdx}`} className="hover:bg-slate-800/40 transition-colors">
                          {/* CITY NAME */}
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{city.cityName}</span>
                              {isDefault && (
                                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                                  Default
                                </span>
                              )}
                            </div>
                            {city.areaTown && (
                              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[160px]">
                                📍 {city.areaTown}
                              </p>
                            )}
                          </td>

                          {/* STATUS (ENABLED / DISABLED) */}
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleToggleCityStatus(city.id)}
                                title={city.isEnabled !== false ? 'Click to disable' : 'Click to enable'}
                                className="inline-flex items-center"
                              >
                                {city.isEnabled !== false ? (
                                  <ToggleRight className="w-6 h-6 text-emerald-400 hover:text-emerald-300 transition-colors" />
                                ) : (
                                  <ToggleLeft className="w-6 h-6 text-slate-600 hover:text-slate-500 transition-colors" />
                                )}
                              </button>
                              <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${
                                city.isEnabled !== false && city.status !== 'unavailable'
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                              }`}>
                                {city.isEnabled !== false && city.status !== 'unavailable' ? 'Active' : 'Disabled'}
                              </span>
                            </div>
                          </td>

                          {/* OPTIONAL CUSTOM RULES TOGGLE */}
                          <td className="p-3 text-center">
                            <button
                              type="button"
                              onClick={() => handleToggleCustomRules(city.id)}
                              title={useCustom ? 'Custom rules active (click to use global fallback)' : 'Using global fallback rate (click to activate custom rules)'}
                              className={`px-2 py-1 rounded-xl text-[10px] font-bold border transition-all inline-flex items-center gap-1 ${
                                useCustom 
                                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/20' 
                                  : 'bg-sky-500/10 text-sky-300 border-sky-500/30 hover:bg-sky-500/20'
                              }`}
                            >
                              {useCustom ? <CheckSquare className="w-3 h-3 text-emerald-400" /> : <Square className="w-3 h-3 text-sky-400" />}
                              <span>{useCustom ? 'Custom' : 'Fallback'}</span>
                            </button>
                          </td>

                          {/* SLABS & LIMITS */}
                          <td className="p-3">
                            {useCustom ? (
                              hasTiers ? (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/25">
                                    <Layers className="w-3 h-3 text-amber-400" />
                                    <span>{city.deliveryTiers!.length} Slabs</span>
                                  </span>
                                  {city.enableWeightTiers && city.weightTiers && city.weightTiers.length > 0 && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-300 bg-sky-500/10 px-2 py-0.5 rounded-lg border border-sky-500/25">
                                      <Scale className="w-2.5 h-2.5 text-sky-400" />
                                      <span>{city.weightTiers.length} Weight Slabs</span>
                                    </span>
                                  )}
                                  {city.freeDeliveryThreshold && (
                                    <p className="text-[10px] text-emerald-400 font-mono">
                                      Free over: PKR {city.freeDeliveryThreshold.toLocaleString()}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="text-[11px] text-slate-300 font-medium bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                    {isFree ? 'Free Flat' : `Flat: PKR ${(city.baseFee ?? city.deliveryFee ?? 0).toLocaleString()}`}
                                  </span>
                                  {(city.minFee || city.maxFee) && (
                                    <p className="text-[10px] text-slate-400 font-mono">
                                      Limits: {city.minFee || 0} – {city.maxFee || '∞'}
                                    </p>
                                  )}
                                </div>
                              )
                            ) : (
                              <span className="text-[11px] text-sky-400 italic">
                                Global Fallback Rate
                              </span>
                            )}
                          </td>

                          {/* CURRENT DELIVERY CONFIGURATION */}
                          <td className="p-3">
                            {useCustom ? (
                              hasTiers ? (
                                <div className="flex flex-wrap gap-1 max-w-xs">
                                  {city.deliveryTiers!.map((tier, tIdx) => {
                                    const tierIsFree = tier.isFree || tier.fee === 0;
                                    return (
                                      <span 
                                        key={tIdx} 
                                        className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300"
                                      >
                                        <span className="text-amber-400/90">{formatTierRange(tier)}:</span>
                                        <strong className={tierIsFree ? 'text-emerald-400' : 'text-white'}>
                                          {formatTierFee(tier)}
                                        </strong>
                                      </span>
                                    );
                                  })}
                                </div>
                              ) : (
                                <span className={`font-mono font-bold text-xs ${isFree ? 'text-emerald-400' : 'text-white'}`}>
                                  {isFree ? 'Always FREE Delivery' : `PKR ${(city.baseFee ?? city.deliveryFee ?? 0).toLocaleString()}`}
                                </span>
                              )
                            ) : (
                              <span className="text-xs font-mono text-slate-300">
                                PKR {(deliverySettings.globalFallbackFee ?? deliverySettings.globalDeliveryFeeAmount ?? 250).toLocaleString()} (Standard)
                              </span>
                            )}
                          </td>

                          {/* TIME */}
                          <td className="p-3">
                            <span className="text-slate-300 text-xs">{city.estimatedDays || '1–2 Days'}</span>
                          </td>

                          {/* ACTIONS */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenEditCityModal(city)}
                                title="Edit City Delivery Slabs"
                                className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center gap-1 transition-all"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleSetDefaultCity(city.id)}
                                title={isDefault ? 'Current Default City' : 'Set as Default City'}
                                className={`p-1.5 rounded-xl transition-colors ${isDefault ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-amber-400'}`}
                              >
                                <Star className="w-4 h-4 fill-current" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDeleteCity(city.id, city.cityName)}
                                title="Delete City"
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* CARDS GRID VIEW */
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[580px] overflow-y-auto pr-1">
                {filteredCities.map((city, cIdx) => {
                  const isDefault = deliverySettings.defaultSelectedCityId === city.id;
                  const isFree = city.freeDelivery || city.deliveryFeeType === 'free' || city.deliveryFee === 0;
                  const hasTiers = Array.isArray(city.deliveryTiers) && city.deliveryTiers.length > 0;
                  const useCustom = city.useCustomRules !== false;

                  return (
                    <div 
                      key={city.id ? `${city.id}-${cIdx}` : `city-card-${city.cityName}-${cIdx}`}
                      className={`p-4 rounded-2xl border transition-all ${
                        city.isEnabled !== false 
                          ? 'bg-slate-950/90 border-slate-800 hover:border-slate-700' 
                          : 'bg-slate-950/30 border-slate-900 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-white text-base">{city.cityName}</span>
                            {isDefault && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[9px] font-bold">
                                Default
                              </span>
                            )}
                          </div>

                          {city.areaTown && (
                            <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                              📍 {city.areaTown}
                            </p>
                          )}

                          <p className="text-xs text-amber-400 font-medium mt-1">
                            ⏱️ {city.estimatedDays || '1–2 Working Days'}
                          </p>
                        </div>

                        {/* Top quick controls */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleCustomRules(city.id)}
                            title={useCustom ? 'Custom rules active' : 'Using global fallback rate'}
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                              useCustom ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' : 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                            }`}
                          >
                            {useCustom ? 'Custom' : 'Fallback'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleCityStatus(city.id)}
                            title={city.isEnabled !== false ? 'Click to Disable' : 'Click to Enable'}
                            className="p-1.5 text-slate-400 hover:text-white transition-colors"
                          >
                            {city.isEnabled !== false ? (
                              <ToggleRight className="w-5 h-5 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-slate-600" />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteCity(city.id, city.cityName)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete City"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Delivery Slabs / Configuration Breakdown */}
                      <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                            city.isEnabled !== false
                              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                          }`}>
                            {city.isEnabled !== false ? 'Active' : 'Disabled'}
                          </span>

                          {useCustom ? (
                            hasTiers ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[10px] font-bold">
                                <Layers className="w-3 h-3 text-amber-400" />
                                <span>{city.deliveryTiers!.length} Pricing Slabs</span>
                              </span>
                            ) : (
                              <span className="font-bold text-emerald-400 font-mono text-xs">
                                {isFree ? 'FREE DELIVERY' : `Rs. ${(city.baseFee ?? city.deliveryFee ?? 0).toLocaleString()}`}
                              </span>
                            )
                          ) : (
                            <span className="text-xs font-mono text-sky-400">
                              Global Fallback Rate
                            </span>
                          )}
                        </div>

                        {/* List of slabs inside card */}
                        {useCustom && hasTiers && (
                          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1">
                            {city.deliveryTiers!.map((t, idx) => (
                              <div key={idx} className="flex items-center justify-between text-[11px] font-mono">
                                <span className="text-slate-400">{formatTierRange(t)}:</span>
                                <span className={t.isFree || t.fee === 0 ? 'text-emerald-400 font-bold' : 'text-amber-300 font-bold'}>
                                  {formatTierFee(t)}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Edit Button in Card */}
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEditCityModal(city)}
                            className="w-full py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit City Slabs</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredCities.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-xs">
                No cities found matching "{citySearch}". Click "Add City" to create one.
              </div>
            )}
          </div>

          {/* Delivery Notes & Customer Policy Messages */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <span>Customer Delivery Information Disclaimers</span>
            </h3>

            <p className="text-xs text-slate-400">
              These policy notes appear under the Delivery Information section on Product pages.
            </p>

            <div className="space-y-2">
              {(deliverySettings?.deliveryNotes || []).map((note, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300">
                  <span>{note}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDeliveryNote(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <input
                type="text"
                placeholder="Add custom note (e.g. ✓ Free wooden crate packing for fragile ceramics)..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={handleAddDeliveryNote}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-2xl flex items-center gap-1 transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Add Note</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right 1 Column: Live Test Sandbox, Timings & Logistics */}
        <div className="space-y-6">
          
          {/* LIVE TESTBENCH / FEE CALCULATOR SANDBOX */}
          <div className="bg-slate-900/90 border border-amber-500/30 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
              <Calculator className="w-4 h-4 text-amber-400" />
              <h3 className="text-base font-serif font-bold text-white">Live Fee Calculator Testbench</h3>
            </div>
            <p className="text-[11px] text-slate-400">
              Simulate live checkout calculations instantly to verify city rules and slabs.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Test City</label>
                <select
                  value={testCityId}
                  onChange={(e) => setTestCityId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  {deliverySettings.cities.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.cityName} {c.useCustomRules === false ? '(Fallback Rate)' : (c.deliveryTiers && c.deliveryTiers.length > 0 ? `(${c.deliveryTiers.length} Slabs)` : `(PKR ${c.baseFee ?? c.deliveryFee ?? 0})`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Cart Subtotal (PKR)</label>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={testSubtotal}
                  onChange={(e) => setTestSubtotal(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-400" />
                    <span>Cart Weight (kg) [Optional]</span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-mono">{testWeightKg} kg</span>
                </div>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={testWeightKg}
                  onChange={(e) => setTestWeightKg(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                />
                <div className="flex gap-1.5 mt-1.5">
                  {[0, 5, 15, 35].map(w => (
                    <button
                      key={w}
                      type="button"
                      onClick={() => setTestWeightKg(w)}
                      className={`px-2 py-0.5 rounded text-[10px] font-mono border transition-all ${
                        testWeightKg === w
                          ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {w} kg
                    </button>
                  ))}
                </div>
              </div>

              {/* Result Preview Box */}
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 mt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Calculated Fee:</span>
                  <span className={`font-mono font-bold text-sm ${liveTestResult.isFree ? 'text-emerald-400' : 'text-amber-300'}`}>
                    {liveTestResult.isFree ? 'FREE DELIVERY (Rs. 0)' : `Rs. ${liveTestResult.deliveryFee.toLocaleString()}`}
                  </span>
                </div>

                <div className="text-[11px] text-slate-300 font-mono bg-slate-900 p-2 rounded-lg border border-slate-800 space-y-1">
                  <div>{liveTestResult.tierDescription}</div>
                  {liveTestResult.weightTierDescription && (
                    <div className="text-amber-300 pt-1 border-t border-slate-800/80">
                      ⚖️ {liveTestResult.weightTierDescription}
                    </div>
                  )}
                </div>

                {liveTestResult.nextFreeTierNotice && (
                  <p className="text-[11px] text-emerald-400 font-medium">
                    ✨ {liveTestResult.nextFreeTierNotice}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Showroom Hours & Dispatch</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Same-Day Order Cut-off Time
              </label>
              <input
                type="text"
                value={deliverySettings.orderCutoffTime || '05:00 PM'}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, orderCutoffTime: e.target.value })}
                placeholder="e.g. 05:00 PM"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Opening Time
                </label>
                <input
                  type="text"
                  value={deliverySettings.storeOpeningTime || '09:00 AM'}
                  onChange={(e) => setDeliverySettings({ ...deliverySettings, storeOpeningTime: e.target.value })}
                  placeholder="09:00 AM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Closing Time
                </label>
                <input
                  type="text"
                  value={deliverySettings.storeClosingTime || '09:00 PM'}
                  onChange={(e) => setDeliverySettings({ ...deliverySettings, storeClosingTime: e.target.value })}
                  placeholder="09:00 PM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Working Days
              </label>
              <input
                type="text"
                value={deliverySettings.workingDays || 'Monday - Saturday'}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, workingDays: e.target.value })}
                placeholder="Monday - Saturday"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Logistics Partner & WhatsApp Configuration */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>Logistics & WhatsApp Contact</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Nationwide Banner Headline
              </label>
              <input
                type="text"
                value={deliverySettings.acrossPakistanHeadline || 'Express Delivery Available Across Pakistan'}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, acrossPakistanHeadline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Logistics Fleet / Courier Partner
              </label>
              <input
                type="text"
                value={deliverySettings.deliveryPartner || 'ZST Dedicated Freight & TCS'}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, deliveryPartner: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                WhatsApp Delivery Support Number
              </label>
              <input
                type="text"
                value={deliverySettings.whatsappSupportNumber || '+92 310 8002863'}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, whatsappSupportNumber: e.target.value })}
                placeholder="+92 310 8002863"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="button"
              onClick={() => handleSaveChanges()}
              disabled={isSaving}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-3 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Logistics Configuration'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* ======================================================== */}
      {/* CITY EDIT / ADD MODAL */}
      {/* ======================================================== */}
      {isCityModalOpen && editingCity && (
        <div className="fixed inset-0 z-[110] flex justify-center items-start sm:items-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl my-auto p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>{editingCity.cityName ? `Edit ${editingCity.cityName}` : 'Add Delivery City'}</span>
              </h3>
              <button
                onClick={() => setIsCityModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCity} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    City Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chiniot, Lahore, Faisalabad, Jhang..."
                    value={editingCity.cityName}
                    onChange={(e) => setEditingCity({ ...editingCity, cityName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Specific Area / Town / Tehsil (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Chenab Nagar, Bhowana, Lalian..."
                    value={editingCity.areaTown || ''}
                    onChange={(e) => setEditingCity({ ...editingCity, areaTown: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Province / Territory
                  </label>
                  <select
                    value={editingCity.province || 'Punjab'}
                    onChange={(e) => setEditingCity({ ...editingCity, province: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Punjab">Punjab</option>
                    <option value="Federal Capital">Federal Capital (Islamabad)</option>
                    <option value="Sindh">Sindh</option>
                    <option value="KPK">KPK</option>
                    <option value="Balochistan">Balochistan</option>
                    <option value="Azad Kashmir">Azad Kashmir</option>
                    <option value="Gilgit-Baltistan">Gilgit-Baltistan</option>
                  </select>
                </div>
              </div>

              {/* Delivery Availability Status & Custom Rules Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Delivery Availability Status
                  </label>
                  <select
                    value={editingCity.status || 'available'}
                    onChange={(e) => setEditingCity({ ...editingCity, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="available">✅ Active & Available</option>
                    <option value="contact_to_confirm">⚠️ Contact to Confirm</option>
                    <option value="unavailable">❌ Disabled / Unavailable</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Custom City Rules Toggle
                  </label>
                  <select
                    value={editingCity.useCustomRules !== false ? 'custom' : 'fallback'}
                    onChange={(e) => setEditingCity({ 
                      ...editingCity, 
                      useCustomRules: e.target.value === 'custom',
                      isOptional: e.target.value !== 'custom'
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="custom">🎯 Custom City Fee Rules (Active)</option>
                    <option value="fallback">🌐 Use Global Fallback Fee</option>
                  </select>
                </div>
              </div>

              {/* Estimated Delivery Time & Fee Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Estimated Delivery Time *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1–2 Working Days"
                    value={editingCity.estimatedDays}
                    onChange={(e) => setEditingCity({ ...editingCity, estimatedDays: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Delivery Fee Type */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Delivery Fee Calculation Mode
                  </label>
                  <select
                    value={editingCity.deliveryFeeType || (editingCity.deliveryTiers && editingCity.deliveryTiers.length > 0 ? 'tiered' : (editingCity.deliveryFee === 0 ? 'free' : 'fixed'))}
                    onChange={(e) => {
                      const mode = e.target.value as any;
                      const hasTiers = editingCity.deliveryTiers && editingCity.deliveryTiers.length > 0;
                      setEditingCity({ 
                        ...editingCity, 
                        deliveryFeeType: mode,
                        freeDelivery: mode === 'free',
                        deliveryTiers: mode === 'tiered' && !hasTiers 
                          ? generateDefaultCityTiers(editingCity.cityName || 'City')
                          : editingCity.deliveryTiers
                      });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="tiered">🎯 Order-Value Tiered Slabs</option>
                    <option value="fixed">💰 Base / Flat Amount (PKR)</option>
                    <option value="free">🎉 Always Free Delivery</option>
                    <option value="contact">📞 Contact Us for Fee</option>
                  </select>
                </div>
              </div>

              {/* City Limits: Min Fee Floor, Max Fee Cap, Free Delivery Threshold */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Min Fee (Floor PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="0"
                    value={editingCity.minFee ?? 0}
                    onChange={(e) => setEditingCity({ ...editingCity, minFee: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Max Fee (Cap PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="5000"
                    value={editingCity.maxFee ?? 5000}
                    onChange={(e) => setEditingCity({ ...editingCity, maxFee: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Free Delivery Over (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="e.g. 10000"
                    value={editingCity.freeDeliveryThreshold ?? ''}
                    onChange={(e) => setEditingCity({ 
                      ...editingCity, 
                      freeDeliveryThreshold: e.target.value ? Math.max(0, parseInt(e.target.value) || 0) : undefined 
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* TIERED DELIVERY PRICING BUILDER */}
              {editingCity.deliveryFeeType === 'tiered' && (
                <div className="p-4 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Layers className="w-4 h-4 text-amber-400" />
                        <span>Order-Value Delivery Pricing Tiers</span>
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Define automatic delivery fee rules for {editingCity.cityName || 'this city'} based on customer's cart subtotal.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleLoadDefaultTiers}
                        title="Load standard 0-5k (200), 5k-10k (100), 10k+ (Free) rules"
                        className="px-2.5 py-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Standard Template</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAddTier}
                        className="px-2.5 py-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Tier</span>
                      </button>
                    </div>
                  </div>

                  {/* Validation Error/Warning Card */}
                  {!tierValidation.isValid && (
                    <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs space-y-1">
                      <div className="flex items-center gap-1.5 font-bold">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span>Tier Configuration Conflicts Detected:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                        {tierValidation.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {tierValidation.warnings.length > 0 && tierValidation.isValid && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-0.5">
                      {tierValidation.warnings.map((warn, i) => (
                        <p key={i} className="flex items-center gap-1">
                          <span>⚠️</span> <span>{warn}</span>
                        </p>
                      ))}
                    </div>
                  )}

                  {/* Tiers List */}
                  <div className="space-y-2.5">
                    {(!editingCity.deliveryTiers || editingCity.deliveryTiers.length === 0) ? (
                      <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                        <p>No pricing tiers defined for this city yet.</p>
                        <button
                          type="button"
                          onClick={handleLoadDefaultTiers}
                          className="mt-2 text-amber-400 underline hover:text-amber-300 font-bold"
                        >
                          Click here to load standard 3-tier rules
                        </button>
                      </div>
                    ) : (
                      editingCity.deliveryTiers.map((tier, idx) => {
                        const isNoUpperLimit = tier.maxAmount === null || tier.maxAmount === undefined;
                        const isFree = tier.isFree || tier.fee === 0;

                        return (
                          <div 
                            key={tier.id || `tier-${idx}`} 
                            className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5"
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-white flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center text-[10px] font-mono">
                                  {idx + 1}
                                </span>
                                <span>Tier #{idx + 1}</span>
                                <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                  {formatTierRange(tier)} → <strong className={isFree ? 'text-emerald-400' : 'text-amber-300'}>{formatTierFee(tier)}</strong>
                                </span>
                              </span>

                              <div className="flex items-center gap-1">
                                {idx > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveTier(idx, 'up')}
                                    title="Move tier up"
                                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {idx < (editingCity.deliveryTiers?.length || 0) - 1 && (
                                  <button
                                    type="button"
                                    onClick={() => handleMoveTier(idx, 'down')}
                                    title="Move tier down"
                                    className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteTier(idx)}
                                  title="Delete this tier"
                                  className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {/* Inputs Row */}
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                              {/* Min Amount */}
                              <div className="sm:col-span-4">
                                <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                                  Min Cart (PKR)
                                </label>
                                <input
                                  type="number"
                                  min={0}
                                  value={tier.minAmount}
                                  onChange={(e) => handleUpdateTier(idx, { minAmount: Math.max(0, parseInt(e.target.value) || 0) })}
                                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                                />
                              </div>

                              {/* Max Amount */}
                              <div className="sm:col-span-4">
                                <div className="flex items-center justify-between mb-0.5">
                                  <label className="text-[10px] font-semibold text-slate-400">
                                    Max Cart (PKR)
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer text-[10px] text-amber-400 font-bold">
                                    <input
                                      type="checkbox"
                                      checked={isNoUpperLimit}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          handleUpdateTier(idx, { maxAmount: null });
                                        } else {
                                          handleUpdateTier(idx, { maxAmount: tier.minAmount + 4999 });
                                        }
                                      }}
                                      className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                                    />
                                    <span>∞ No Max</span>
                                  </label>
                                </div>
                                <input
                                  type="number"
                                  min={tier.minAmount}
                                  disabled={isNoUpperLimit}
                                  value={isNoUpperLimit ? '' : (tier.maxAmount ?? '')}
                                  placeholder={isNoUpperLimit ? '∞ (Above / No Max)' : 'e.g. 4999'}
                                  onChange={(e) => handleUpdateTier(idx, { 
                                    maxAmount: e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0) 
                                  })}
                                  className={`w-full bg-slate-950 border rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-none ${
                                    isNoUpperLimit 
                                      ? 'border-slate-800 text-slate-500 italic bg-slate-950/50' 
                                      : 'border-slate-700 text-white focus:border-amber-500'
                                  }`}
                                />
                              </div>

                              {/* Delivery Fee */}
                              <div className="sm:col-span-4">
                                <div className="flex items-center justify-between mb-0.5">
                                  <label className="text-[10px] font-semibold text-slate-400">
                                    Delivery Fee
                                  </label>
                                  <label className="flex items-center gap-1 cursor-pointer text-[10px] text-emerald-400 font-bold">
                                    <input
                                      type="checkbox"
                                      checked={isFree}
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          handleUpdateTier(idx, { fee: 0, isFree: true });
                                        } else {
                                          handleUpdateTier(idx, { fee: 200, isFree: false });
                                        }
                                      }}
                                      className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                                    />
                                    <span>Free</span>
                                  </label>
                                </div>
                                <div className="relative">
                                  <input
                                    type="number"
                                    min={0}
                                    disabled={isFree}
                                    value={isFree ? 0 : tier.fee}
                                    onChange={(e) => handleUpdateTier(idx, { 
                                      fee: Math.max(0, parseInt(e.target.value) || 0),
                                      isFree: (parseInt(e.target.value) || 0) === 0
                                    })}
                                    className={`w-full bg-slate-950 border rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-none ${
                                      isFree 
                                        ? 'border-emerald-500/40 text-emerald-400 font-bold bg-emerald-950/20' 
                                        : 'border-slate-700 text-white focus:border-amber-500'
                                    }`}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Optional Tier Label / Description */}
                            <div>
                              <input
                                type="text"
                                placeholder="Tier Label (optional, e.g. Standard Delivery, Free Delivery on 10k+)"
                                value={tier.label || ''}
                                onChange={(e) => handleUpdateTier(idx, { label: e.target.value })}
                                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                              />
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}

              {editingCity.deliveryFeeType === 'fixed' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Base / Flat Delivery Fee (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingCity.baseFee ?? editingCity.deliveryFee ?? 0}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value) || 0);
                      setEditingCity({ ...editingCity, baseFee: val, deliveryFee: val });
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              )}

              {/* Optional Weight-Based Surcharges / Tiers Section */}
              <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <Scale className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-amber-300">
                        Optional Weight Surcharges & Slabs (Parcels / Freight)
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Configure parcel weight rules for {editingCity.cityName || 'this city'} (e.g. 0–10 kg, 10.1–30 kg, 30+ kg).
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const willEnable = !editingCity.enableWeightTiers;
                      setEditingCity({
                        ...editingCity,
                        enableWeightTiers: willEnable,
                        weightPricingMode: editingCity.weightPricingMode || 'highest',
                        weightTiers: willEnable && (!editingCity.weightTiers || editingCity.weightTiers.length === 0)
                          ? generateDefaultCityWeightTiers()
                          : editingCity.weightTiers
                      });
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
                      editingCity.enableWeightTiers
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                        : 'bg-slate-900 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    {editingCity.enableWeightTiers ? (
                      <>
                        <ToggleRight className="w-4 h-4 text-amber-400" />
                        <span>Weight Rules Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4 text-slate-500" />
                        <span>Weight Rules Disabled</span>
                      </>
                    )}
                  </button>
                </div>

                {editingCity.enableWeightTiers && (
                  <div className="space-y-4 pt-1 animate-fadeIn">
                    {/* Mode Selector */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-300 mb-1.5">
                        Weight Pricing Calculation Mode:
                      </label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {[
                          {
                            id: 'highest',
                            title: 'Highest of Both (Recommended)',
                            desc: 'Max(Cart Value Fee, Weight Fee). Free cart rules still protect the customer.'
                          },
                          {
                            id: 'additive',
                            title: 'Additive Surcharge',
                            desc: 'Cart Value Fee + Weight Surcharge added together.'
                          },
                          {
                            id: 'weight_only',
                            title: 'Weight Rate Only',
                            desc: 'Ignore order value; charge solely based on weight tier.'
                          }
                        ].map((m) => {
                          const isSelected = (editingCity.weightPricingMode || 'highest') === m.id;
                          return (
                            <button
                              key={m.id}
                              type="button"
                              onClick={() => setEditingCity({ ...editingCity, weightPricingMode: m.id as any })}
                              className={`p-2.5 rounded-xl text-left border transition-all ${
                                isSelected
                                  ? 'bg-amber-500/10 border-amber-500 text-white'
                                  : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold text-xs">
                                <span className={isSelected ? 'text-amber-400' : 'text-slate-500'}>
                                  {isSelected ? '●' : '○'}
                                </span>
                                <span>{m.title}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                                {m.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quick Presets & Add Slabs Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-xs font-semibold text-slate-300">
                        Weight Slabs ({editingCity.weightTiers?.length || 0})
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleLoadDefaultWeightTiers}
                          title="Load 0-10kg (200 PKR), 10.1-30kg (400 PKR), 30+kg (800 PKR)"
                          className="px-2.5 py-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-colors flex items-center gap-1"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>Load Standard Slabs</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleAddWeightTier}
                          className="px-2.5 py-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-colors flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Add Weight Slab</span>
                        </button>
                      </div>
                    </div>

                    {/* Weight Validation Feedback */}
                    {!weightTierValidation.isValid && (
                      <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs space-y-1">
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                          <span>Weight Slab Configuration Conflicts Detected:</span>
                        </div>
                        <ul className="list-disc list-inside space-y-0.5 text-[11px] pl-1">
                          {weightTierValidation.errors.map((err, i) => (
                            <li key={i}>{err}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {weightTierValidation.warnings.length > 0 && weightTierValidation.isValid && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[11px] space-y-0.5">
                        {weightTierValidation.warnings.map((warn, i) => (
                          <p key={i} className="flex items-center gap-1">
                            <span>⚠️</span> <span>{warn}</span>
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Weight Tiers List */}
                    <div className="space-y-2.5">
                      {(!editingCity.weightTiers || editingCity.weightTiers.length === 0) ? (
                        <div className="text-center py-6 border border-dashed border-slate-800 rounded-xl text-slate-500 text-xs">
                          <p>No weight tiers configured yet.</p>
                          <button
                            type="button"
                            onClick={handleLoadDefaultWeightTiers}
                            className="mt-2 text-amber-400 underline hover:text-amber-300 font-bold"
                          >
                            Click to load standard slabs (0–10kg, 10–30kg, 30+kg)
                          </button>
                        </div>
                      ) : (
                        editingCity.weightTiers.map((wt, idx) => {
                          const isNoMax = wt.maxWeightKg === null || wt.maxWeightKg === undefined;
                          const isFree = wt.isFree || wt.fee === 0;

                          return (
                            <div
                              key={wt.id || `wt-${idx}`}
                              className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2.5"
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className="font-bold text-white flex items-center gap-2">
                                  <span className="w-5 h-5 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center text-[10px] font-mono">
                                    W{idx + 1}
                                  </span>
                                  <span>Weight Slab #{idx + 1}</span>
                                  <span className="text-[10px] text-slate-400 font-mono bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                                    {formatWeightTierRange(wt)} → <strong className={isFree ? 'text-emerald-400' : 'text-amber-300'}>{formatWeightTierFee(wt)}</strong>
                                  </span>
                                </span>

                                <div className="flex items-center gap-1">
                                  {idx > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => handleMoveWeightTier(idx, 'up')}
                                      title="Move weight slab up"
                                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  {idx < (editingCity.weightTiers?.length || 0) - 1 && (
                                    <button
                                      type="button"
                                      onClick={() => handleMoveWeightTier(idx, 'down')}
                                      title="Move weight slab down"
                                      className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteWeightTier(idx)}
                                    title="Delete this weight slab"
                                    className="p-1 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>

                              {/* Weight Inputs */}
                              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 text-xs">
                                {/* Min Weight */}
                                <div className="sm:col-span-4">
                                  <label className="block text-[10px] font-semibold text-slate-400 mb-0.5">
                                    Min Weight (kg)
                                  </label>
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.1}
                                    value={wt.minWeightKg}
                                    onChange={(e) => handleUpdateWeightTier(idx, { minWeightKg: Math.max(0, parseFloat(e.target.value) || 0) })}
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-1.5 text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
                                  />
                                </div>

                                {/* Max Weight */}
                                <div className="sm:col-span-4">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <label className="text-[10px] font-semibold text-slate-400">
                                      Max Weight (kg)
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer text-[10px] text-amber-400 font-bold">
                                      <input
                                        type="checkbox"
                                        checked={isNoMax}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            handleUpdateWeightTier(idx, { maxWeightKg: null });
                                          } else {
                                            handleUpdateWeightTier(idx, { maxWeightKg: wt.minWeightKg + 10 });
                                          }
                                        }}
                                        className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
                                      />
                                      <span>∞ No Max</span>
                                    </label>
                                  </div>
                                  <input
                                    type="number"
                                    min={wt.minWeightKg}
                                    step={0.1}
                                    disabled={isNoMax}
                                    value={isNoMax ? '' : (wt.maxWeightKg ?? '')}
                                    placeholder={isNoMax ? '∞ (Above / Heavy Cargo)' : 'e.g. 10.0'}
                                    onChange={(e) => handleUpdateWeightTier(idx, { 
                                      maxWeightKg: e.target.value === '' ? null : Math.max(0, parseFloat(e.target.value) || 0) 
                                    })}
                                    className={`w-full bg-slate-950 border rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-none ${
                                      isNoMax 
                                        ? 'border-slate-800 text-slate-500 italic bg-slate-950/50' 
                                        : 'border-slate-700 text-white focus:border-amber-500'
                                    }`}
                                  />
                                </div>

                                {/* Fee */}
                                <div className="sm:col-span-4">
                                  <div className="flex items-center justify-between mb-0.5">
                                    <label className="text-[10px] font-semibold text-slate-400">
                                      Delivery Fee (PKR)
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer text-[10px] text-emerald-400 font-bold">
                                      <input
                                        type="checkbox"
                                        checked={isFree}
                                        onChange={(e) => {
                                          if (e.target.checked) {
                                            handleUpdateWeightTier(idx, { fee: 0, isFree: true });
                                          } else {
                                            handleUpdateWeightTier(idx, { fee: 300, isFree: false });
                                          }
                                        }}
                                        className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0"
                                      />
                                      <span>Free</span>
                                    </label>
                                  </div>
                                  <input
                                    type="number"
                                    min={0}
                                    step={50}
                                    disabled={isFree}
                                    value={isFree ? 0 : wt.fee}
                                    onChange={(e) => handleUpdateWeightTier(idx, { 
                                      fee: Math.max(0, parseInt(e.target.value) || 0),
                                      isFree: (parseInt(e.target.value) || 0) === 0
                                    })}
                                    className={`w-full bg-slate-950 border rounded-xl px-2.5 py-1.5 text-xs font-mono focus:outline-none ${
                                      isFree 
                                        ? 'border-emerald-500/40 text-emerald-400 font-bold bg-emerald-950/20' 
                                        : 'border-slate-700 text-white focus:border-amber-500'
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* Label */}
                              <div>
                                <input
                                  type="text"
                                  placeholder="Weight Slab Label (optional, e.g. Standard Parcel 0–10kg, Heavy Freight 30kg+)"
                                  value={wt.label || ''}
                                  onChange={(e) => handleUpdateWeightTier(idx, { label: e.target.value })}
                                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-[11px] text-slate-300 placeholder-slate-600 focus:outline-none focus:border-amber-500"
                                />
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Minimum Order Amount (Optional) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Minimum Order Amount (PKR, Optional)
                </label>
                <input
                  type="number"
                  min={0}
                  placeholder="e.g. 5000 (leave blank if no minimum)"
                  value={editingCity.minOrderAmount ?? ''}
                  onChange={(e) => setEditingCity({ 
                    ...editingCity, 
                    minOrderAmount: e.target.value ? parseInt(e.target.value) || undefined : undefined 
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Display Order */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Display Order / Priority
                </label>
                <input
                  type="number"
                  min={1}
                  value={editingCity.displayOrder || 1}
                  onChange={(e) => setEditingCity({ ...editingCity, displayOrder: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              {/* Coverage Sub-localities */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Coverage Sub-Areas / Towns (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Model Town, Gulberg, Cantt, Garden Town"
                  value={coverageInput}
                  onChange={(e) => setCoverageInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Special City Delivery Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Direct showroom truck delivery available"
                  value={editingCity.notes || ''}
                  onChange={(e) => setEditingCity({ ...editingCity, notes: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Toggles */}
              <div className="space-y-2.5 pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingCity.freeDelivery || editingCity.deliveryFeeType === 'free'}
                    onChange={(e) => setEditingCity({ 
                      ...editingCity, 
                      freeDelivery: e.target.checked,
                      deliveryFeeType: e.target.checked ? 'free' : 'fixed'
                    })}
                    className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>🎉 Free Delivery Enabled for this City</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingCity.isEnabled !== false}
                    onChange={(e) => setEditingCity({ ...editingCity, isEnabled: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>Active & Visible in Customer Delivery City Selector</span>
                </label>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-2.5 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCityModalOpen(false)}
                  className="px-4 py-2.5 text-xs text-slate-400 hover:text-white rounded-2xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={(e) => handleSaveCity(e, false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 text-xs font-bold rounded-2xl transition-all"
                >
                  Save to Draft
                </button>
                <button
                  type="button"
                  onClick={(e) => handleSaveCity(e, true)}
                  disabled={isApplying}
                  className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-2xl shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isApplying ? 'Applying...' : 'Save & Apply Live'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
