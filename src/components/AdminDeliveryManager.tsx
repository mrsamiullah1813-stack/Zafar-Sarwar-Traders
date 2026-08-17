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
  ShieldCheck
} from 'lucide-react';
import { DeliverySettings, CityDeliveryInfo } from '../types';
import { loadDeliverySettings, saveDeliverySettings } from '../utils/storage';

interface AdminDeliveryManagerProps {
  onShowToast: (message: string) => void;
}

export const AdminDeliveryManager: React.FC<AdminDeliveryManagerProps> = ({ onShowToast }) => {
  const [deliverySettings, setDeliverySettings] = useState<DeliverySettings>(() => loadDeliverySettings());
  const [citySearch, setCitySearch] = useState('');
  
  // City Edit Modal State
  const [editingCity, setEditingCity] = useState<CityDeliveryInfo | null>(null);
  const [isCityModalOpen, setIsCityModalOpen] = useState(false);

  // New Note Input
  const [newNoteText, setNewNoteText] = useState('');

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveDeliverySettings(deliverySettings);
    onShowToast('Delivery Settings & Timings saved successfully!');
  };

  const handleToggleCityStatus = (cityId: string) => {
    const updatedCities = deliverySettings.cities.map(c => 
      c.id === cityId ? { ...c, isEnabled: !c.isEnabled } : c
    );
    const updated = { ...deliverySettings, cities: updatedCities };
    setDeliverySettings(updated);
    saveDeliverySettings(updated);
    onShowToast('City delivery status updated!');
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
      estimatedDays: '2–3 Working Days',
      deliveryFee: 300,
      isSameDayAvailable: false,
      isNextDayAvailable: true,
      isEnabled: true,
      displayOrder: deliverySettings.cities.length + 1
    });
    setIsCityModalOpen(true);
  };

  const handleOpenEditCityModal = (city: CityDeliveryInfo) => {
    setEditingCity({ ...city });
    setIsCityModalOpen(true);
  };

  const handleSaveCity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCity || !editingCity.cityName.trim()) {
      alert('City name is required.');
      return;
    }

    const existsIndex = deliverySettings.cities.findIndex(c => c.id === editingCity.id);
    let updatedCities = [...deliverySettings.cities];

    if (existsIndex > -1) {
      updatedCities[existsIndex] = editingCity;
    } else {
      updatedCities.push(editingCity);
    }

    // Sort by display order or city name
    updatedCities.sort((a, b) => (a.displayOrder || 99) - (b.displayOrder || 99));

    const updated = { ...deliverySettings, cities: updatedCities };
    setDeliverySettings(updated);
    saveDeliverySettings(updated);
    setIsCityModalOpen(false);
    setEditingCity(null);
    onShowToast(`City details saved for ${editingCity.cityName}!`);
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

  const filteredCities = (deliverySettings?.cities || []).filter(c => 
    c && (
      (c.cityName || '').toLowerCase().includes((citySearch || '').toLowerCase()) ||
      (c.estimatedDays || '').toLowerCase().includes((citySearch || '').toLowerCase())
    )
  );

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-blue-400 text-xs font-bold uppercase tracking-wider mb-1">
              <Truck className="w-4 h-4" />
              <span>Smart Delivery Estimation System</span>
            </div>
            <h2 className="text-2xl font-serif font-bold text-white">Delivery & Logistics Management</h2>
            <p className="text-slate-400 text-sm mt-1">
              Configure cities across Pakistan, estimated delivery timelines, delivery charges, store hours, order cut-off times, and WhatsApp support.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                saveDeliverySettings(deliverySettings);
                onShowToast('All delivery settings synchronized!');
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-blue-900/40 transition-all"
            >
              <Save className="w-4 h-4" />
              <span>Save All Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Form Grid */}
      <form onSubmit={handleSaveGeneralSettings} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Columns: Cities Management */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <span>Pakistan Cities & Delivery Estimates ({deliverySettings.cities.length})</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Set delivery days, charges, and availability per city.
                </p>
              </div>

              <button
                type="button"
                onClick={handleOpenAddCityModal}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Add New City</span>
              </button>
            </div>

            {/* City Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search city by name or estimated timeline..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>

            {/* City Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {filteredCities.map((city) => (
                <div 
                  key={city.id}
                  className={`p-4 rounded-xl border transition-all ${
                    city.isEnabled 
                      ? 'bg-slate-950/80 border-slate-800 hover:border-slate-700' 
                      : 'bg-slate-950/30 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif font-bold text-white text-sm">{city.cityName}</span>
                        {city.isSameDayAvailable && (
                          <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800/50 text-[9px] font-bold">
                            Same Day
                          </span>
                        )}
                        {city.isNextDayAvailable && (
                          <span className="px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/50 text-[9px] font-bold">
                            Next Day
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 font-medium mt-1">
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
                        className="p-1.5 text-slate-400 hover:text-blue-400 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCity(city.id, city.cityName)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
                    <span>Standard Fee:</span>
                    <span className="font-bold text-emerald-400 font-mono">
                      {city.deliveryFee === 0 ? 'FREE' : `PKR ${(city.deliveryFee ?? 0).toLocaleString()}`}
                    </span>
                  </div>
                </div>
              ))}

              {filteredCities.length === 0 && (
                <div className="col-span-full text-center py-8 text-slate-500 text-xs">
                  No cities found matching "{citySearch}". Click "Add New City" to add one.
                </div>
              )}
            </div>
          </div>

          {/* Delivery Notes & Policy Customer Messages */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <MessageSquare className="w-5 h-5 text-amber-400" />
              <span>Customer Delivery Notes & Disclaimers</span>
            </h3>

            <p className="text-xs text-slate-400">
              These notes will appear under the Delivery Information section on Product pages.
            </p>

            <div className="space-y-2">
              {(deliverySettings?.deliveryNotes || []).map((note, idx) => (
                <div key={idx} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300">
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
                placeholder="Add custom note (e.g. ✓ Free insurance on fragile marble goods)..."
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={handleAddDeliveryNote}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl flex items-center gap-1 transition-all"
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
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-5">
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>Store Operating Hours & Cut-off</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Order Cut-off Time (Daily)
              </label>
              <input
                type="text"
                value={deliverySettings.orderCutoffTime}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, orderCutoffTime: e.target.value })}
                placeholder="e.g. 05:00 PM"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Orders before this time process same day.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Store Opening
                </label>
                <input
                  type="text"
                  value={deliverySettings.storeOpeningTime}
                  onChange={(e) => setDeliverySettings({ ...deliverySettings, storeOpeningTime: e.target.value })}
                  placeholder="e.g. 09:00 AM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Store Closing
                </label>
                <input
                  type="text"
                  value={deliverySettings.storeClosingTime}
                  onChange={(e) => setDeliverySettings({ ...deliverySettings, storeClosingTime: e.target.value })}
                  placeholder="e.g. 09:00 PM"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Working Days
              </label>
              <input
                type="text"
                value={deliverySettings.workingDays}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, workingDays: e.target.value })}
                placeholder="e.g. Monday - Saturday"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Friday Timings (Optional)
              </label>
              <textarea
                rows={2}
                value={deliverySettings.fridayTiming || ''}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, fridayTiming: e.target.value })}
                placeholder="e.g. 09:00 AM - 01:00 PM & 03:00 PM - 09:00 PM"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Holiday Schedule
              </label>
              <input
                type="text"
                value={deliverySettings.holidaySchedule || ''}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, holidaySchedule: e.target.value })}
                placeholder="e.g. Closed on Sundays & Gazetted Public Holidays"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Custom City / Address Control Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Custom City / Address Settings</span>
            </h3>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <span className="text-xs font-bold text-white block">Enable Custom City / Address Option</span>
                <p className="text-[11px] text-slate-400">Allows customers from any unlisted city, town, or area to order.</p>
              </div>
              <button
                type="button"
                onClick={() => setDeliverySettings({ 
                  ...deliverySettings, 
                  enableCustomCity: deliverySettings.enableCustomCity === false ? true : false 
                })}
                className="text-2xl text-slate-300 hover:text-white transition-colors"
              >
                {deliverySettings.enableCustomCity !== false ? (
                  <ToggleRight className="w-7 h-7 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-7 h-7 text-slate-600" />
                )}
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Custom City Selector Option Label
              </label>
              <input
                type="text"
                value={deliverySettings.customCityLabel || '➕ Custom City / Address'}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, customCityLabel: e.target.value })}
                placeholder="➕ Custom City / Address"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Default Notice for Unknown / Custom Locations
              </label>
              <textarea
                rows={2}
                value={deliverySettings.customCityNotice || 'Delivery time for this location will be confirmed by our team.'}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, customCityNotice: e.target.value })}
                placeholder="Delivery time for this location will be confirmed by our team."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500 resize-none"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Shown when a customer selects Custom City instead of predefined city estimates.
              </p>
            </div>
          </div>

          {/* Logistics Partner & Headline */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-lg space-y-4">
            <h3 className="text-base font-serif font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
              <Truck className="w-4 h-4 text-sky-400" />
              <span>Logistics & Headlines</span>
            </h3>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Across Pakistan Banner Headline
              </label>
              <input
                type="text"
                value={deliverySettings.acrossPakistanHeadline}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, acrossPakistanHeadline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Delivery Courier / Logistics Fleet
              </label>
              <input
                type="text"
                value={deliverySettings.deliveryPartner}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, deliveryPartner: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                WhatsApp Delivery Support Number
              </label>
              <input
                type="text"
                value={deliverySettings.whatsappSupportNumber}
                onChange={(e) => setDeliverySettings({ ...deliverySettings, whatsappSupportNumber: e.target.value })}
                placeholder="+92 310 8002863"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Used for the "Confirm Delivery Time on WhatsApp" button.
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 mt-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Logistics Configuration</span>
            </button>
          </div>

        </div>

      </form>

      {/* City Edit Modal */}
      {isCityModalOpen && editingCity && (
        <div className="fixed inset-0 z-[110] flex justify-center items-start sm:items-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-fadeIn overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg my-auto p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-400" />
                <span>{editingCity.cityName ? `Edit ${editingCity.cityName}` : 'Add New Pakistan City'}</span>
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
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  City Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lahore, Islamabad, Chiniot..."
                  value={editingCity.cityName}
                  onChange={(e) => setEditingCity({ ...editingCity, cityName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Estimated Delivery Time *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 1–2 Working Days"
                    value={editingCity.estimatedDays}
                    onChange={(e) => setEditingCity({ ...editingCity, estimatedDays: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Delivery Fee (PKR) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={editingCity.deliveryFee}
                    onChange={(e) => setEditingCity({ ...editingCity, deliveryFee: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2.5 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingCity.isSameDayAvailable || false}
                    onChange={(e) => setEditingCity({ ...editingCity, isSameDayAvailable: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                  />
                  <span>Same Day Delivery Available</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingCity.isNextDayAvailable || false}
                    onChange={(e) => setEditingCity({ ...editingCity, isNextDayAvailable: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                  />
                  <span>Next Working Day Delivery Available</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={editingCity.isEnabled}
                    onChange={(e) => setEditingCity({ ...editingCity, isEnabled: e.target.checked })}
                    className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0"
                  />
                  <span>Enable Delivery for this City</span>
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
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                >
                  Save City Details
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
