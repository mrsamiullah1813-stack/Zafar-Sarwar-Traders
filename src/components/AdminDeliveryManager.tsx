import React, { useState } from 'react';
import { 
  Truck, 
  MapPin, 
  Clock, 
  Calendar, 
  Plus, 
  Edit3, 
  Trash2, 
  Save, 
  Check, 
  X, 
  AlertCircle, 
  MessageSquare, 
  Search, 
  Building2, 
  PhoneCall, 
  HelpCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  DollarSign,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { DeliverySettings, CityDeliveryInfo } from '../types';
import { loadDeliverySettings, saveDeliverySettings } from '../utils/storage';
import { upsertDeliveryCityInSupabase, saveSiteSettingToSupabase } from '../services/supabaseService';

interface AdminDeliveryManagerProps {
  onShowToast: (message: string) => void;
}

export const AdminDeliveryManager: React.FC<AdminDeliveryManagerProps> = ({ onShowToast }) => {
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(() => loadDeliverySettings());
  const [citySearch, setCitySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'contact_to_confirm' | 'unavailable'>('all');
  const [isSaving, setIsSaving] = useState(false);
  
  // City Edit Modal State
  const [editingCity, setEditingCity] = useState<CityDeliveryInfo | null>(null);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);
  const [coverageInput, setCoverageInput] = useState('');

  // New Note Input
  const [newNoteText, setNewNoteText] = useState('');

  const handleSaveGeneralSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);
    try {
      saveDeliverySettings(deliverySettings);
      await saveSiteSettingToSupabase('delivery_settings', deliverySettings);
      onShowToast('Delivery Settings & Logistics synchronized successfully!');
    } catch (err) {
      console.warn('Sync warning:', err);
      onShowToast('Delivery settings saved locally!');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleCityStatus = async (cityId: string) => {
    const targetCity = deliverySettings.cities.find(c => c.id === cityId);
    if (!targetCity) return;

    const updatedCities = deliverySettings.cities.map(c => 
      c.id === cityId ? { ...c, isEnabled: !c.isEnabled } : c
    );
    const updated = { ...deliverySettings, cities: updatedCities };
    setDeliverySettings(updated);
    saveDeliverySettings(updated);
    
    // Save to DB
    const updatedCity = { ...targetCity, isEnabled: !targetCity.isEnabled };
    upsertDeliveryCityInSupabase(updatedCity);

    onShowToast(`Delivery status updated for ${targetCity.cityName}!`);
  };

  const handleDeleteCity = (cityId: string, cityName: string) => {
    if (confirm(`Are you sure you want to remove ${cityName} from delivery cities?`)) {
      const updatedCities = deliverySettings.cities.filter(c => c.id !== cityId);
      const updated = { ...deliverySettings, cities: updatedCities };
      setDeliverySettings(updated);
      saveDeliverySettings(updated);
      onShowToast(`${cityName} removed from delivery list.`);
    }
  };

  const handleOpenAddCityModal = () => {
    const newId = `city-${Date.now()}`;
    setEditingCity({
      id: newId,
      cityName: '',
      areaTown: '',
      status: 'available',
      estimatedDays: '1–2 Working Days',
      deliveryFee: 0,
      deliveryFeeType: 'free',
      deliveryFeeCustomText: '',
      isSameDayAvailable: false,
      isNextDayAvailable: true,
      isEnabled: true,
      notes: '',
      coverageAreas: [],
      displayOrder: deliverySettings.cities.length + 1
    });
    setCoverageInput('');
    setIsCityModalOpen(true);
  };

  const handleOpenEditCityModal = (city: CityDeliveryInfo) => {
    setEditingCity({ 
      ...city,
      status: city.status || 'available',
      deliveryFeeType: city.deliveryFeeType || (city.deliveryFee === 0 ? 'free' : 'fixed')
    });
    setCoverageInput(Array.isArray(city.coverageAreas) ? city.coverageAreas.join(', ') : '');
    setIsCityModalOpen(true);
  };

  const handleSaveCity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCity || !editingCity.cityName.trim()) {
      alert('City name is required.');
      return;
    }

    const coverageArray = coverageInput
      ? coverageInput.split(',').map(s => s.trim()).filter(Boolean)
      : (editingCity.coverageAreas || []);

    const updatedCityRecord: CityDeliveryInfo = {
      ...editingCity,
      cityName: editingCity.cityName.trim(),
      areaTown: editingCity.areaTown ? editingCity.areaTown.trim() : '',
      coverageAreas: coverageArray
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
    
    // Push city to DB
    await upsertDeliveryCityInSupabase(updatedCityRecord);

    setIsCityModalOpen(false);
    setEditingCity(null);
    onShowToast(`Delivery zone saved for ${updatedCityRecord.cityName}!`);
  };

  const handleAddDeliveryNote = () => {
    if (!newNoteText.trim()) return;
    const formatted = newNoteText.trim().startsWith('✓') ? newNoteText.trim() : `✓ ${newNoteText.trim()}`;
    const updatedNotes = [...deliverySettings.deliveryNotes, formatted];
    const updated = { ...deliverySettings, deliveryNotes: updatedNotes };
    setDeliverySettings(updated);
    saveDeliverySettings(updated);
    setNewNoteText('');
    onShowToast('New delivery note added!');
  };

  const handleRemoveDeliveryNote = (index: number) => {
    const updatedNotes = deliverySettings.deliveryNotes.filter((_, i) => i !== index);
    const updated = { ...deliverySettings, deliveryNotes: updatedNotes };
    setDeliverySettings(updated);
    saveDeliverySettings(updated);
    onShowToast('Delivery note removed.');
  };

  const filteredCities = (deliverySettings?.cities || []).filter(c => {
    if (!c) return false;
    // 1. Search Query
    const q = (citySearch || '').toLowerCase().trim();
    let matchesSearch = true;
    if (q) {
      const nameMatch = (c.cityName || '').toLowerCase().includes(q);
      const areaMatch = (c.areaTown || '').toLowerCase().includes(q);
      const daysMatch = (c.estimatedDays || '').toLowerCase().includes(q);
      const notesMatch = (c.notes || '').toLowerCase().includes(q);
      const coverageMatch = Array.isArray(c.coverageAreas) && c.coverageAreas.some(a => a.toLowerCase().includes(q));
      matchesSearch = nameMatch || areaMatch || daysMatch || notesMatch || coverageMatch;
    }

    // 2. Status Filter
    let matchesStatus = true;
    if (statusFilter !== 'all') {
      const currentStatus = c.status || 'available';
      matchesStatus = currentStatus === statusFilter;
    }

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Truck className="w-4 h-4" />
              <span>Smart Delivery Logistics & Checker Management</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">Delivery & Shipping Manager</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Manage nationwide cities, delivery durations, custom text notes, shipping fees, same-day dispatch zones, working hours, and WhatsApp inquiry numbers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleSaveGeneralSettings()}
              disabled={isSaving}
              className="px-5 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Synchronizing...' : 'Save All Settings'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Form Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Cities & Delivery Areas Management */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Global Store Delivery Rules Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-serif font-bold text-white">
                    Global Store Delivery Display Format
                  </h3>
                  <p className="text-xs text-slate-400">Default delivery format when a product doesn't have a custom override.</p>
                </div>
              </div>
            </div>

            {/* Delivery Type Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">
                Default Store Delivery Format
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setDeliverySettings({ ...deliverySettings, globalDeliveryType: 'standard' })}
                  className={`p-3 rounded-2xl text-xs font-bold border transition-all text-center ${
                    deliverySettings.globalDeliveryType === 'standard' || !deliverySettings.globalDeliveryType
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  ⏱️ Standard (Numeric)
                  <span className="block text-[10px] font-normal text-slate-400 mt-0.5">e.g. 2–4 Days</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliverySettings({ ...deliverySettings, globalDeliveryType: 'custom' })}
                  className={`p-3 rounded-2xl text-xs font-bold border transition-all text-center ${
                    deliverySettings.globalDeliveryType === 'custom'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  ✍️ Custom Text
                  <span className="block text-[10px] font-normal text-slate-400 mt-0.5">e.g. Price on Call / Free</span>
                </button>

                <button
                  type="button"
                  onClick={() => setDeliverySettings({ ...deliverySettings, globalDeliveryType: 'both' })}
                  className={`p-3 rounded-2xl text-xs font-bold border transition-all text-center ${
                    deliverySettings.globalDeliveryType === 'both'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300 shadow-sm'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                  }`}
                >
                  ✨ Both (Number + Text)
                  <span className="block text-[10px] font-normal text-slate-400 mt-0.5">Days + Special Note</span>
                </button>
              </div>
            </div>

            {/* Global Custom Message Input if Custom or Both */}
            {(deliverySettings.globalDeliveryType === 'custom' || deliverySettings.globalDeliveryType === 'both') && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                <label className="block text-xs font-semibold text-slate-300">
                  Global Custom Delivery Message / Notice
                </label>
                <textarea
                  rows={2}
                  value={deliverySettings.globalCustomDeliveryMessage || ''}
                  onChange={(e) => setDeliverySettings({ ...deliverySettings, globalCustomDeliveryMessage: e.target.value })}
                  placeholder="e.g. Delivery charges depend on your city and order weight. Contact us for exact quote."
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500"
                />

                {/* Quick Presets */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  <span className="text-[10px] text-slate-400 self-center mr-1 font-semibold">Presets:</span>
                  {[
                    'Price on Call',
                    'Delivery Available — Contact Us',
                    'Delivery charges depend on your location.',
                    'Free delivery in Chiniot city on selected orders.'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDeliverySettings({ ...deliverySettings, globalCustomDeliveryMessage: preset })}
                      className="px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-[10px] text-slate-300 transition-colors border border-slate-700"
                    >
                      + {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Global Min / Max time */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Default Min Days
                </label>
                <input
                  type="number"
                  min="1"
                  value={deliverySettings.globalMinDeliveryTime || 2}
                  onChange={(e) => setDeliverySettings({ ...deliverySettings, globalMinDeliveryTime: Math.max(1, parseInt(e.target.value) || 1) })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Default Max Days
                </label>
                <input
                  type="number"
                  min={deliverySettings.globalMinDeliveryTime || 2}
                  value={deliverySettings.globalMaxDeliveryTime || 4}
                  onChange={(e) => setDeliverySettings({ ...deliverySettings, globalMaxDeliveryTime: Math.max(deliverySettings.globalMinDeliveryTime || 1, parseInt(e.target.value) || 2) })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">
                  Default Time Unit
                </label>
                <select
                  value={deliverySettings.globalDeliveryTimeUnit || 'Days'}
                  onChange={(e) => setDeliverySettings({ ...deliverySettings, globalDeliveryTimeUnit: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-amber-500"
                >
                  <option value="Days">Days</option>
                  <option value="Hours">Hours</option>
                  <option value="Working Days">Working Days</option>
                </select>
              </div>
            </div>
          </div>

          {/* Pakistan Cities & Areas Manager Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-amber-400" />
                  <span>Pakistan Cities & Delivery Areas ({deliverySettings.cities.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure specific cities, local tehsils/areas, availability status, timelines, and shipping fees.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddCityModal}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-2xl flex items-center gap-1.5 transition-all shadow-md shadow-emerald-950/40"
              >
                <Plus className="w-4 h-4" />
                <span>Add Delivery Area</span>
              </button>
            </div>

            {/* Filter Tabs & Search Bar */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  placeholder="Search city, area (e.g. Chiniot, Chenab Nagar, Bhowana, Lahore, DHA)..."
                  value={citySearch}
                  onChange={(e) => setCitySearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setStatusFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all border ${
                    statusFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  All ({deliverySettings.cities.length})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('available')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all border ${
                    statusFilter === 'available'
                      ? 'bg-emerald-500 text-slate-950 border-emerald-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  ✅ Available ({deliverySettings.cities.filter(c => (!c.status || c.status === 'available') && c.isEnabled !== false).length})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('contact_to_confirm')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all border ${
                    statusFilter === 'contact_to_confirm'
                      ? 'bg-amber-500 text-slate-950 border-amber-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  ⚠️ Contact to Confirm ({deliverySettings.cities.filter(c => c.status === 'contact_to_confirm').length})
                </button>

                <button
                  type="button"
                  onClick={() => setStatusFilter('unavailable')}
                  className={`px-3 py-1.5 rounded-xl font-semibold transition-all border ${
                    statusFilter === 'unavailable'
                      ? 'bg-rose-500 text-slate-950 border-rose-400'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  ❌ Unavailable ({deliverySettings.cities.filter(c => c.status === 'unavailable' || c.isEnabled === false).length})
                </button>
              </div>
            </div>

            {/* City Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[550px] overflow-y-auto pr-1">
              {filteredCities.map((city) => {
                const currentStatus = city.status || 'available';
                return (
                  <div 
                    key={city.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      city.isEnabled 
                        ? 'bg-slate-950/90 border-slate-800 hover:border-slate-700' 
                        : 'bg-slate-950/30 border-slate-900 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif font-bold text-white text-sm">{city.cityName}</span>
                          {city.isSameDayAvailable && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[9px] font-bold">
                              Same Day
                            </span>
                          )}
                          {city.isNextDayAvailable && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[9px] font-bold">
                              Next Day
                            </span>
                          )}
                        </div>

                        {city.areaTown && (
                          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                            📍 {city.areaTown}
                          </p>
                        )}

                        <p className="text-xs text-amber-400 font-medium mt-1">
                          ⏱️ {city.estimatedDays}
                        </p>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleCityStatus(city.id)}
                          title={city.isEnabled ? 'Disable Delivery' : 'Enable Delivery'}
                          className="p-1.5 text-slate-400 hover:text-white transition-colors"
                        >
                          {city.isEnabled ? (
                            <ToggleRight className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-slate-600" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditCityModal(city)}
                          className="p-1.5 text-slate-400 hover:text-amber-400 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteCity(city.id, city.cityName)}
                          className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Status badge & Fee */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                        currentStatus === 'available'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                          : currentStatus === 'contact_to_confirm'
                          ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                      }`}>
                        {currentStatus === 'available' ? 'Available' : currentStatus === 'contact_to_confirm' ? 'Contact to Confirm' : 'Unavailable'}
                      </span>

                      <span className="font-bold text-emerald-400 font-mono">
                        {city.deliveryFeeType === 'free' || city.deliveryFee === 0 
                          ? 'FREE DELIVERY' 
                          : city.deliveryFeeType === 'contact' 
                          ? 'Contact for Fee'
                          : city.deliveryFeeType === 'custom'
                          ? (city.deliveryFeeCustomText || 'Custom Fee')
                          : `PKR ${(city.deliveryFee ?? 0).toLocaleString()}`}
                      </span>
                    </div>

                    {city.notes && (
                      <p className="text-[10px] text-slate-400 mt-2 bg-slate-900/60 p-2 rounded-xl border border-slate-800/60">
                        {city.notes}
                      </p>
                    )}
                  </div>
                );
              })}

              {filteredCities.length === 0 && (
                <div className="col-span-full text-center py-10 text-slate-500 text-xs">
                  No cities found matching "{citySearch}". Click "Add Delivery Area" to add one.
                </div>
              )}
            </div>
          </div>

          {/* Delivery Notes & Policy Customer Messages */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              <span>Customer Delivery Disclaimers & Notes</span>
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
                placeholder="Add custom note (e.g. ✓ Free wooden crate insurance on fragile marble goods)..."
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

        {/* Right 1 Column: Timings, Cut-Off, Logistics & WhatsApp */}
        <div className="space-y-6">
          
          {/* Store Hours & Cut-off Settings */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Showroom Hours & Cut-off</span>
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
              <p className="text-[10px] text-slate-500 mt-1">
                Orders before this time dispatch the same working day.
              </p>
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

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Friday Schedule
              </label>
              <textarea
                rows={2}
                value={deliverySettings.fridayTiming || ''}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, fridayTiming: e.target.value })}
                placeholder="09:00 AM - 01:00 PM & 03:00 PM - 09:00 PM"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-amber-500 resize-none"
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
              onClick={() => handleSaveGeneralSettings()}
              disabled={isSaving}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 mt-3 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Synchronizing...' : 'Save Logistics Configuration'}</span>
            </button>
          </div>

        </div>

      </div>

      {/* City Edit / Add Modal */}
      {isCityModalOpen && editingCity && (
        <div className="fixed inset-0 z-[110] flex justify-center items-start sm:items-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg my-auto p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <span>{editingCity.cityName ? `Edit ${editingCity.cityName}` : 'Add New Pakistan Delivery Zone'}</span>
              </h3>
              <button
                onClick={() => setIsCityModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCity} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  City Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chiniot, Lahore, Faisalabad..."
                  value={editingCity.cityName}
                  onChange={(e) => setEditingCity({ ...editingCity, cityName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Specific Area / Town / Neighborhood (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chenab Nagar, Bhowana, Lalian, DHA & Gulberg..."
                  value={editingCity.areaTown || ''}
                  onChange={(e) => setEditingCity({ ...editingCity, areaTown: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Delivery Availability Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Delivery Availability Status
                </label>
                <select
                  value={editingCity.status || 'available'}
                  onChange={(e) => setEditingCity({ ...editingCity, status: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="available">✅ Available (Standard Delivery Route)</option>
                  <option value="contact_to_confirm">⚠️ Contact to Confirm (Requires Route Approval)</option>
                  <option value="unavailable">❌ Unavailable (Not on Standard Route)</option>
                </select>
              </div>

              {/* Estimated Delivery Time */}
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
                    Delivery Fee Type
                  </label>
                  <select
                    value={editingCity.deliveryFeeType || 'fixed'}
                    onChange={(e) => setEditingCity({ ...editingCity, deliveryFeeType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="free">🎉 Free Delivery</option>
                    <option value="fixed">💰 Fixed Amount (PKR)</option>
                    <option value="contact">📞 Contact Us for Fee</option>
                    <option value="custom">✍️ Custom Text Message</option>
                  </select>
                </div>
              </div>

              {editingCity.deliveryFeeType === 'fixed' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Delivery Fee Amount (PKR)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={editingCity.deliveryFee ?? 0}
                    onChange={(e) => setEditingCity({ ...editingCity, deliveryFee: Math.max(0, parseInt(e.target.value) || 0) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              )}

              {editingCity.deliveryFeeType === 'custom' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Custom Fee Text
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Depends on order weight"
                    value={editingCity.deliveryFeeCustomText || ''}
                    onChange={(e) => setEditingCity({ ...editingCity, deliveryFeeCustomText: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Coverage Sub-localities */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Coverage Sub-Areas / Localities (Comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Model Town, Gulberg, Cantt, Garden Town"
                  value={coverageInput}
                  onChange={(e) => setCoverageInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Logistics Notes for Area */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Area Logistics Notes (Optional)
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
                    checked={editingCity.isSameDayAvailable || false}
                    onChange={(e) => setEditingCity({ ...editingCity, isSameDayAvailable: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>⚡ Same Day Delivery Available for this Zone</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingCity.isNextDayAvailable || false}
                    onChange={(e) => setEditingCity({ ...editingCity, isNextDayAvailable: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>🚀 Next Working Day Delivery Available</span>
                </label>

                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingCity.isEnabled}
                    onChange={(e) => setEditingCity({ ...editingCity, isEnabled: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-amber-500 focus:ring-0"
                  />
                  <span>Active & Visible in Customer Delivery Checker</span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCityModalOpen(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-2xl shadow-lg transition-all"
                >
                  Save Delivery Zone
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
