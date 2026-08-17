import React, { useState } from 'react';
import { Megaphone, Plus, Trash2, ArrowUp, ArrowDown, Check, RefreshCw, ToggleLeft, ToggleRight, Truck, Flame, Gift, Package, Sparkles, Tag, AlertCircle, Clock, Calendar, Palette } from 'lucide-react';
import { AnnouncementBarSettings, AnnouncementItem } from '../types';
import { defaultAnnouncementSettings, saveAnnouncementSettings } from '../utils/storage';

interface AdminAnnouncementManagerProps {
  settings?: AnnouncementBarSettings;
  onSaveSettings?: (newSettings: AnnouncementBarSettings) => void;
  onShowToast?: (msg: string) => void;
}

export const AdminAnnouncementManager: React.FC<AdminAnnouncementManagerProps> = ({
  settings,
  onSaveSettings,
  onShowToast,
}) => {
  const [formState, setFormState] = useState<AnnouncementBarSettings>(() => settings || defaultAnnouncementSettings);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    if (onShowToast) onShowToast(msg);
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleGlobalToggle = () => {
    setFormState(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
  };

  const handleAddAnnouncement = () => {
    const newItem: AnnouncementItem = {
      id: 'ann-' + Date.now(),
      text: '🎉 New Promotion or Delivery Update Announcement Text Here',
      iconName: 'Sparkles',
      bgColor: '#1e3a8a',
      textColor: '#ffffff',
      accentColor: '#38bdf8',
      isActive: true,
      displayOrder: (formState.announcements?.length || 0) + 1,
    };

    setFormState(prev => ({
      ...prev,
      announcements: [...(prev.announcements || []), newItem]
    }));
    showToast('New announcement created! Edit details below and save.');
  };

  const handleDeleteAnnouncement = (id: string) => {
    if (confirm('Are you sure you want to delete this announcement?')) {
      setFormState(prev => ({
        ...prev,
        announcements: (prev.announcements || []).filter(a => a.id !== id)
      }));
      showToast('Announcement removed.');
    }
  };

  const handleUpdateItem = (id: string, updates: Partial<AnnouncementItem>) => {
    setFormState(prev => ({
      ...prev,
      announcements: (prev.announcements || []).map(a => 
        a.id === id ? { ...a, ...updates } : a
      )
    }));
  };

  const handleMoveItem = (index: number, direction: 'up' | 'down') => {
    const items = [...(formState.announcements || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= items.length) return;
    const temp = items[index];
    items[index] = items[targetIndex];
    items[targetIndex] = temp;
    setFormState(prev => ({ ...prev, announcements: items }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formState);
    saveAnnouncementSettings(formState);
    showToast('Announcement Bar Settings saved & updated live across the website!');
  };

  const handleReset = () => {
    if (confirm('Reset Announcement Bar to factory default messages?')) {
      setFormState(defaultAnnouncementSettings);
      onSaveSettings(defaultAnnouncementSettings);
      saveAnnouncementSettings(defaultAnnouncementSettings);
      showToast('Reset to default announcements.');
    }
  };

  const iconOptions = ['Truck', 'Flame', 'Gift', 'Package', 'Sparkles', 'Megaphone', 'Tag', 'AlertCircle'];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[120] px-4 py-3 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-2 animate-fadeIn">
          <Check className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* HEADER BAR */}
      <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-black text-white font-serif uppercase tracking-tight">
              Top Announcement Bar Management
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure slim promotional header banner, delivery notices, rotating slides, dates & colors
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-lg shadow-blue-950"
          >
            <Check className="w-4 h-4" />
            <span>Save Announcements</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* GLOBAL TOGGLE & TIMING */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-blue-400" />
                <span>Global Announcement Bar Display</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Show or hide the slim header announcement bar at the top of every page.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGlobalToggle}
              className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                formState.isEnabled
                  ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400 shadow-lg shadow-emerald-950'
                  : 'bg-slate-950 border border-slate-800 text-slate-500'
              }`}
            >
              {formState.isEnabled ? (
                <>
                  <ToggleRight className="w-5 h-5 text-emerald-400" />
                  <span>Announcement Bar Enabled</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-slate-600" />
                  <span>Announcement Bar Disabled</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span>Rotation Slide Duration (Seconds)</span>
              </label>
              <select
                value={formState.displayDurationSeconds || 4}
                onChange={(e) => setFormState(prev => ({ ...prev, displayDurationSeconds: Number(e.target.value) }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              >
                <option value={2}>2 Seconds (Very Fast)</option>
                <option value={3}>3 Seconds (Fast)</option>
                <option value={4}>4 Seconds (Standard)</option>
                <option value={5}>5 Seconds (Relaxed)</option>
                <option value={8}>8 Seconds (Slow)</option>
                <option value={10}>10 Seconds (Very Slow)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-cyan-400" />
                <span>Rotation Transition Style</span>
              </label>
              <select
                value={formState.rotationMode || 'carousel'}
                onChange={(e) => setFormState(prev => ({ ...prev, rotationMode: e.target.value as any }))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              >
                <option value="carousel">Auto Slide Carousel</option>
                <option value="fade">Smooth Fade Transition</option>
              </select>
            </div>
          </div>
        </div>

        {/* ANNOUNCEMENT ITEMS LIST */}
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                Active Announcements List ({formState.announcements?.length || 0})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Add multiple messages. If multiple are enabled, they will rotate automatically.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddAnnouncement}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>Add Announcement</span>
            </button>
          </div>

          <div className="space-y-4">
            {(formState.announcements || []).map((item, index) => (
              <div
                key={item.id}
                className={`p-5 rounded-2xl border transition-all ${
                  item.isActive
                    ? 'bg-slate-950 border-slate-800'
                    : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 border-b border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-blue-950 text-blue-400 font-mono text-xs font-bold flex items-center justify-center">
                      #{index + 1}
                    </span>
                    <span className="text-xs font-bold text-white font-mono">
                      ID: {item.id}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleMoveItem(index, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Move Up"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleMoveItem(index, 'down')}
                      disabled={index === (formState.announcements?.length || 0) - 1}
                      className="p-1.5 rounded-lg bg-slate-900 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Move Down"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleUpdateItem(item.id, { isActive: !item.isActive })}
                      className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                        item.isActive
                          ? 'bg-emerald-950 border border-emerald-500/40 text-emerald-400'
                          : 'bg-slate-900 border border-slate-800 text-slate-500'
                      }`}
                    >
                      {item.isActive ? <ToggleRight className="w-4 h-4 text-emerald-400" /> : <ToggleLeft className="w-4 h-4 text-slate-600" />}
                      <span>{item.isActive ? 'Active' : 'Disabled'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(item.id)}
                      className="p-1.5 rounded-lg bg-rose-950/80 text-rose-400 hover:bg-rose-900 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Announcement Text */}
                  <div className="md:col-span-2 space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Announcement Text Content *
                    </label>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => handleUpdateItem(item.id, { text: e.target.value })}
                      placeholder="e.g. 🚚 Express Delivery Available Across Pakistan"
                      className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Icon Selector */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Icon
                    </label>
                    <select
                      value={item.iconName || 'Truck'}
                      onChange={(e) => handleUpdateItem(item.id, { iconName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      {iconOptions.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>

                  {/* Colors */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">Background Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={item.bgColor || '#1e3a8a'}
                        onChange={(e) => handleUpdateItem(item.id, { bgColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={item.bgColor || '#1e3a8a'}
                        onChange={(e) => handleUpdateItem(item.id, { bgColor: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">Text Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={item.textColor || '#ffffff'}
                        onChange={(e) => handleUpdateItem(item.id, { textColor: e.target.value })}
                        className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                      />
                      <input
                        type="text"
                        value={item.textColor || '#ffffff'}
                        onChange={(e) => handleUpdateItem(item.id, { textColor: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-200 font-mono"
                      />
                    </div>
                  </div>

                  {/* Optional Target Link */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300">
                      Optional Target URL / Link
                    </label>
                    <input
                      type="text"
                      value={item.linkUrl || ''}
                      onChange={(e) => handleUpdateItem(item.id, { linkUrl: e.target.value })}
                      placeholder="e.g. #products or /#delivery"
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Schedule Start & End Date */}
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-blue-400" />
                      <span>Start Date (Optional)</span>
                    </label>
                    <input
                      type="date"
                      value={item.startDate || ''}
                      onChange={(e) => handleUpdateItem(item.id, { startDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-300 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-rose-400" />
                      <span>End Date (Optional)</span>
                    </label>
                    <input
                      type="date"
                      value={item.endDate || ''}
                      onChange={(e) => handleUpdateItem(item.id, { endDate: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Live Banner Preview Box */}
                <div className="mt-4 p-3 rounded-xl border flex items-center justify-between text-xs font-semibold" style={{ backgroundColor: item.bgColor || '#1e3a8a', color: item.textColor || '#ffffff' }}>
                  <div className="flex items-center gap-2 truncate">
                    <Truck className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.text}</span>
                  </div>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-black/20 text-white/80">
                    Live Preview
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </form>
    </div>
  );
};
