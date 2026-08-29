import React, { useState, useMemo } from 'react';
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
  DollarSign
} from 'lucide-react';
import { DeliverySettings, CityDeliveryInfo } from '../types';
import { loadDeliverySettings, saveDeliverySettings } from '../utils/storage';
import { 
  upsertDeliveryCityInSupabase, 
  saveSiteSettingToSupabase,
  deleteDeliveryCityFromSupabase 
} from '../services/supabaseService';

interface AdminDeliveryManagerProps {
  onShowToast: (message: string) => void;
}

export const AdminDeliveryManager: React.FC<AdminDeliveryManagerProps> = ({ onShowToast }) => {
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(() => loadDeliverySettings());
  const [citySearch, setCitySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'contact_to_confirm' | 'unavailable'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
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
      const res = await saveSiteSettingToSupabase('delivery_settings', deliverySettings);
      if (res.success) {
        onShowToast('Delivery Settings & Logistics synchronized with database successfully!');
      } else {
        onShowToast('Saved locally. Database sync warning: ' + (res.error || 'Check connection'));
      }
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

    const newIsEnabled = targetCity.isEnabled === false ? true : false;
    const updatedCities = deliverySettings.cities.map(c => 
      c.id === cityId ? { ...c, isEnabled: newIsEnabled } : c
    );
    const updated = { ...deliverySettings, cities: updatedCities };
    setDeliverySettings(updated);
    saveDeliverySettings(updated);
    
    // Save to DB
    const updatedCity = { ...targetCity, isEnabled: newIsEnabled };
    upsertDeliveryCityInSupabase(updatedCity);

    onShowToast(`Delivery ${newIsEnabled ? 'enabled' : 'disabled'} for ${targetCity.cityName}!`);
  };

  const handleSetDefaultCity = async (cityId: string) => {
    const updated = { ...deliverySettings, defaultSelectedCityId: cityId };
    setDeliverySettings(updated);
    saveDeliverySettings(updated);
    await saveSiteSettingToSupabase('delivery_settings', updated);
    const cName = deliverySettings.cities.find(c => c.id === cityId)?.cityName || cityId;
    onShowToast(`Set ${cName} as default selected delivery city!`);
  };

  const handleDeleteCity = async (cityId: string, cityName: string) => {
    if (confirm(`Are you sure you want to permanently delete ${cityName} from delivery zones?`)) {
      const updatedCities = deliverySettings.cities.filter(c => c.id !== cityId);
      const updated = { ...deliverySettings, cities: updatedCities };
      setDeliverySettings(updated);
      saveDeliverySettings(updated);
      
      // Delete in DB
      await deleteDeliveryCityFromSupabase(cityId);
      onShowToast(`${cityName} deleted from delivery cities.`);
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
      freeDelivery: true,
      minOrderAmount: undefined,
      additionalAddress: '',
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
      deliveryFeeType: city.deliveryFeeType || (city.deliveryFee === 0 ? 'free' : 'fixed'),
      freeDelivery: city.freeDelivery !== undefined ? city.freeDelivery : (city.deliveryFee === 0 || city.deliveryFeeType === 'free')
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
      areaTown: editingCity.areaTown ? editingCity.areaTown.trim() : undefined,
      notes: editingCity.notes ? editingCity.notes.trim() : undefined,
      additionalAddress: editingCity.additionalAddress ? editingCity.additionalAddress.trim() : undefined,
      coverageAreas: coverageArray,
      freeDelivery: Boolean(editingCity.freeDelivery || editingCity.deliveryFeeType === 'free' || editingCity.deliveryFee === 0)
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
    return (deliverySettings?.cities || []).filter(c => {
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
  }, [deliverySettings.cities, citySearch, statusFilter]);

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Truck className="w-4 h-4" />
              <span>Admin Delivery Cities & Logistics Management</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white">Delivery Cities & Shipping</h2>
            <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-2xl">
              Control nationwide destination cities, delivery availability, charges, estimated durations, and WhatsApp checkout preferences.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleOpenAddCityModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Add Delivery City</span>
            </button>

            <button
              onClick={() => handleSaveGeneralSettings()}
              disabled={isSaving}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
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
                  <h3 className="text-base font-serif font-bold text-white">Delivery Cities Directory</h3>
                  <p className="text-xs text-slate-400">Total {deliverySettings.cities.length} cities configured</p>
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

              <div className="flex items-center gap-1.5 text-xs">
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
                  Available ({deliverySettings.cities.filter(c => (!c.status || c.status === 'available') && c.isEnabled !== false).length})
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
                  Disabled ({deliverySettings.cities.filter(c => c.status === 'unavailable' || c.isEnabled === false).length})
                </button>
              </div>
            </div>

            {/* TABLE VIEW: CITY | DELIVERY | FEE | TIME | STATUS | ACTIONS */}
            {viewMode === 'table' ? (
              <div className="overflow-x-auto rounded-2xl border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="p-3">City</th>
                      <th className="p-3 text-center">Delivery</th>
                      <th className="p-3">Fee</th>
                      <th className="p-3">Time</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                    {filteredCities.map((city) => {
                      const isDefault = deliverySettings.defaultSelectedCityId === city.id;
                      const isFree = city.freeDelivery || city.deliveryFeeType === 'free' || city.deliveryFee === 0;

                      return (
                        <tr key={city.id} className="hover:bg-slate-800/40 transition-colors">
                          {/* CITY */}
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white text-sm">{city.cityName}</span>
                              {isDefault && (
                                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[9px] font-bold">
                                  Default
                                </span>
                              )}
                            </div>
                            {city.areaTown && (
                              <p className="text-[11px] text-slate-400 font-medium truncate max-w-[180px]">
                                {city.areaTown}
                              </p>
                            )}
                          </td>

                          {/* DELIVERY */}
                          <td className="p-3 text-center">
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
                          </td>

                          {/* FEE */}
                          <td className="p-3">
                            <span className={`font-mono font-bold ${isFree ? 'text-emerald-400' : 'text-white'}`}>
                              {isFree ? 'FREE' : `Rs. ${(city.deliveryFee ?? 0).toLocaleString()}`}
                            </span>
                          </td>

                          {/* TIME */}
                          <td className="p-3">
                            <span className="text-slate-300">{city.estimatedDays || '1–2 Days'}</span>
                          </td>

                          {/* STATUS */}
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                              city.isEnabled !== false && city.status !== 'unavailable'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            }`}>
                              {city.isEnabled !== false && city.status !== 'unavailable' ? 'Active' : 'Disabled'}
                            </span>
                          </td>

                          {/* ACTIONS */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleSetDefaultCity(city.id)}
                                title={isDefault ? 'Current Default City' : 'Set as Default City'}
                                className={`p-1.5 rounded-lg transition-colors ${isDefault ? 'text-amber-400 bg-amber-500/10' : 'text-slate-500 hover:text-amber-400'}`}
                              >
                                <Star className="w-4 h-4 fill-current" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditCityModal(city)}
                                title="Edit City"
                                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCity(city.id, city.cityName)}
                                title="Delete City"
                                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[550px] overflow-y-auto pr-1">
                {filteredCities.map((city) => {
                  const isDefault = deliverySettings.defaultSelectedCityId === city.id;
                  const isFree = city.freeDelivery || city.deliveryFeeType === 'free' || city.deliveryFee === 0;

                  return (
                    <div 
                      key={city.id}
                      className={`p-4 rounded-2xl border transition-all ${
                        city.isEnabled !== false 
                          ? 'bg-slate-950/90 border-slate-800 hover:border-slate-700' 
                          : 'bg-slate-950/30 border-slate-900 opacity-60'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-serif font-bold text-white text-sm">{city.cityName}</span>
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
                            ⏱️ {city.estimatedDays}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleToggleCityStatus(city.id)}
                            title={city.isEnabled !== false ? 'Disable Delivery' : 'Enable Delivery'}
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
                          city.isEnabled !== false
                            ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}>
                          {city.isEnabled !== false ? 'Active' : 'Disabled'}
                        </span>

                        <span className="font-bold text-emerald-400 font-mono">
                          {isFree ? 'FREE DELIVERY' : `Rs. ${(city.deliveryFee ?? 0).toLocaleString()}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {filteredCities.length === 0 && (
              <div className="text-center py-10 text-slate-500 text-xs">
                No cities found matching "{citySearch}". Click "Add Delivery City" to create one.
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

        {/* Right 1 Column: Timings, Logistics & WhatsApp */}
        <div className="space-y-6">
          
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
              onClick={() => handleSaveGeneralSettings()}
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
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg my-auto p-6 sm:p-7 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
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
                  Specific Area / Town / Neighborhood (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chenab Nagar, Bhowana, Lalian..."
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
                  <option value="available">✅ Active & Available</option>
                  <option value="contact_to_confirm">⚠️ Contact to Confirm</option>
                  <option value="unavailable">❌ Disabled / Unavailable</option>
                </select>
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
                    Delivery Fee Mode
                  </label>
                  <select
                    value={editingCity.deliveryFeeType || (editingCity.deliveryFee === 0 ? 'free' : 'fixed')}
                    onChange={(e) => setEditingCity({ 
                      ...editingCity, 
                      deliveryFeeType: e.target.value as any,
                      freeDelivery: e.target.value === 'free'
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="free">🎉 Free Delivery</option>
                    <option value="fixed">💰 Fixed Amount (PKR)</option>
                    <option value="contact">📞 Contact Us for Fee</option>
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
                  Save Delivery City
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
