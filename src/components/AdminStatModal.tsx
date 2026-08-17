import React, { useState, useEffect } from 'react';
import { X, Check, Trash2, Sparkles } from 'lucide-react';
import { StatCounter } from '../types';

interface AdminStatModalProps {
  stat: StatCounter | null;
  onSave: (stat: StatCounter) => void;
  onDelete?: (statId: string) => void;
  onClose: () => void;
}

export const AdminStatModal: React.FC<AdminStatModalProps> = ({
  stat,
  onSave,
  onDelete,
  onClose
}) => {
  const [formData, setFormData] = useState<Partial<StatCounter>>({
    id: `stat-${Date.now()}`,
    title: '',
    numberValue: 100,
    suffix: '+',
    prefix: '',
    iconName: 'Sparkles',
    description: '',
    displayOrder: 1,
    isHidden: false,
    enableAnimation: true
  });

  useEffect(() => {
    if (stat) {
      setFormData({ ...stat });
    }
  }, [stat]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    const finalStat: StatCounter = {
      id: formData.id || `stat-${Date.now()}`,
      title: formData.title,
      numberValue: Number(formData.numberValue) || 0,
      suffix: formData.suffix || '',
      prefix: formData.prefix || '',
      iconName: formData.iconName || 'Sparkles',
      description: formData.description || '',
      displayOrder: formData.displayOrder || 1,
      isHidden: formData.isHidden || false,
      enableAnimation: formData.enableAnimation !== false
    };

    onSave(finalStat);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex justify-center items-start sm:items-center p-3 sm:p-6 animate-fadeIn overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full my-auto shadow-2xl relative p-6 sm:p-8 max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/80 border border-slate-800 text-slate-400 hover:text-white transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-6">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Milestone Control</span>
          <h3 className="text-2xl font-bold text-white font-serif">
            {stat ? 'Edit Business Statistic' : 'Add New Business Counter'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Title / Label *</label>
            <input
              type="text"
              required
              value={formData.title || ''}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Products Stocked / Happy Customers"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Number Value *</label>
              <input
                type="number"
                required
                value={formData.numberValue || 0}
                onChange={(e) => setFormData({ ...formData, numberValue: parseInt(e.target.value) || 0 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Prefix</label>
              <input
                type="text"
                value={formData.prefix || ''}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                placeholder="e.g., $"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Suffix</label>
              <input
                type="text"
                value={formData.suffix || ''}
                onChange={(e) => setFormData({ ...formData, suffix: e.target.value })}
                placeholder="e.g., + or %"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Icon Name</label>
              <select
                value={formData.iconName || 'Package'}
                onChange={(e) => setFormData({ ...formData, iconName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="Package">Package (Box)</option>
                <option value="Building2">Building2 (Company)</option>
                <option value="Award">Award (Badge)</option>
                <option value="Users">Users (Customers)</option>
                <option value="Clock">Clock (Years)</option>
                <option value="ShieldCheck">ShieldCheck (Security)</option>
                <option value="TrendingUp">TrendingUp (Growth)</option>
                <option value="Sparkles">Sparkles (Quality)</option>
                <option value="Wrench">Wrench (Plumbing)</option>
                <option value="Star">Star (Rating)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Display Priority</label>
              <input
                type="number"
                value={formData.displayOrder || 1}
                onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 1 })}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Sub-description</label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g., Authentic hardware items stocked"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/80 border border-slate-800">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={formData.enableAnimation !== false}
                onChange={(e) => setFormData({ ...formData, enableAnimation: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-800"
              />
              <span>Enable Count-Up Animation</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-200">
              <input
                type="checkbox"
                checked={formData.isHidden || false}
                onChange={(e) => setFormData({ ...formData, isHidden: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-900 border-slate-800"
              />
              <span>Hide Counter</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            {stat && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Delete this statistic permanently?')) {
                    onDelete(stat.id);
                    onClose();
                  }
                }}
                className="py-2.5 px-4 rounded-xl bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="py-2.5 px-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-white text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-950 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Counter</span>
              </button>
            </div>
          </div>

        </form>

      </div>
    </div>
  );
};
