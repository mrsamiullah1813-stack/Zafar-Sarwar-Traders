import React, { useState } from 'react';
import { 
  BookOpen, Plus, Trash2, ArrowUp, ArrowDown, Save, Eye, CheckCircle2, 
  ShoppingBag, MapPin, CreditCard, ShieldCheck, Truck, Phone, 
  MessageSquare, Sparkles, ChevronDown, ChevronUp, RefreshCw, AlertCircle
} from 'lucide-react';
import { HowToOrderConfig, HowToOrderStep } from '../types';
import { defaultHowToOrderConfig, loadHowToOrderConfig, saveHowToOrderConfig } from '../utils/storage';

interface AdminHowToOrderManagerProps {
  onShowToast?: (message: string) => void;
}

const AVAILABLE_ICONS = [
  { id: 'cart', label: 'Shopping Cart', icon: ShoppingBag },
  { id: 'address', label: 'Delivery Address', icon: MapPin },
  { id: 'payment', label: 'Payment Method', icon: CreditCard },
  { id: 'verify', label: 'Security & Verification', icon: ShieldCheck },
  { id: 'truck', label: 'Delivery / Shipping', icon: Truck },
  { id: 'phone', label: 'Phone Call Support', icon: Phone },
  { id: 'whatsapp', label: 'WhatsApp Confirmation', icon: MessageSquare },
  { id: 'check', label: 'Confirmation Check', icon: CheckCircle2 },
];

export const AdminHowToOrderManager: React.FC<AdminHowToOrderManagerProps> = ({ onShowToast }) => {
  const [config, setConfig] = useState<HowToOrderConfig>(() => loadHowToOrderConfig());
  const [isSaving, setIsSaving] = useState(false);
  const [previewExpanded, setPreviewExpanded] = useState(true);

  const handleToggleEnabled = () => {
    setConfig(prev => ({ ...prev, isEnabled: !prev.isEnabled }));
  };

  const handleUpdateField = (field: keyof HowToOrderConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const handleAddStep = () => {
    const newStepNumber = config.steps.length + 1;
    const newStep: HowToOrderStep = {
      id: `step_${Date.now()}`,
      stepNumber: newStepNumber,
      title: `Step ${newStepNumber}: New Step Title`,
      description: 'Describe what the customer needs to do in this step.',
      tip: 'Pro tip or helpful advice for the customer (optional).',
      icon: 'cart'
    };

    setConfig(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
  };

  const handleUpdateStep = (stepId: string, field: keyof HowToOrderStep, value: any) => {
    setConfig(prev => ({
      ...prev,
      steps: prev.steps.map(s => s.id === stepId ? { ...s, [field]: value } : s)
    }));
  };

  const handleDeleteStep = (stepId: string) => {
    setConfig(prev => {
      const filtered = prev.steps.filter(s => s.id !== stepId);
      // Re-number remaining steps
      const renumbered = filtered.map((s, idx) => ({
        ...s,
        stepNumber: idx + 1
      }));
      return { ...prev, steps: renumbered };
    });
  };

  const handleMoveStep = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= config.steps.length) return;

    setConfig(prev => {
      const copy = [...prev.steps];
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;

      // Re-number sequentially
      return {
        ...prev,
        steps: copy.map((s, idx) => ({ ...s, stepNumber: idx + 1 }))
      };
    });
  };

  const handleResetToDefault = () => {
    if (window.confirm('Reset all "How to Order" instructions back to professional default steps?')) {
      setConfig({ ...defaultHowToOrderConfig });
      if (onShowToast) onShowToast('Reset to default instructions. Click Save to persist.');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await saveHowToOrderConfig(config);
      if (res.success) {
        if (onShowToast) {
          onShowToast('How to Order Guide updated successfully across the site!');
        }
      } else {
        if (onShowToast) {
          onShowToast(`Saved locally (Warning: ${res.error || 'Server sync error'})`);
        }
      }
    } catch (err: any) {
      if (onShowToast) {
        onShowToast(`Failed to save: ${err?.message || 'Unknown error'}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const renderStepIcon = (iconName?: string) => {
    switch (iconName) {
      case 'address': return <MapPin className="w-4 h-4 text-rose-400" />;
      case 'payment': return <CreditCard className="w-4 h-4 text-emerald-400" />;
      case 'verify': return <ShieldCheck className="w-4 h-4 text-amber-400" />;
      case 'truck': return <Truck className="w-4 h-4 text-cyan-400" />;
      case 'phone': return <Phone className="w-4 h-4 text-indigo-400" />;
      case 'whatsapp': return <MessageSquare className="w-4 h-4 text-emerald-400" />;
      case 'check': return <CheckCircle2 className="w-4 h-4 text-teal-400" />;
      default: return <ShoppingBag className="w-4 h-4 text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/20 text-blue-400 border border-blue-500/30 flex items-center justify-center shrink-0">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold font-serif text-white">
                "How to Order" Guide Configuration
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-blue-500/20 text-blue-300 border border-blue-500/30">
                Checkout Flow
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Customize the interactive step-by-step instructions shown at the bottom of the customer Checkout page.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Reset to default guide content"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 md:flex-initial px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving Changes...' : 'Save Guide Changes'}</span>
          </button>
        </div>
      </div>

      {/* Main Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Form Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* General Visibility & Labels Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>General Guide Settings</span>
            </h3>

            {/* Enable/Disable Toggle */}
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
              <div>
                <span className="text-xs font-bold text-white block">Display Guide on Checkout</span>
                <span className="text-[11px] text-slate-400">
                  When enabled, customers will see the "Learn how to order" button at the bottom of checkout.
                </span>
              </div>
              <button
                type="button"
                onClick={handleToggleEnabled}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  config.isEnabled ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                    config.isEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Button Label Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Expand Button / Link Text
              </label>
              <input
                type="text"
                value={config.buttonLabel || ''}
                onChange={(e) => handleUpdateField('buttonLabel', e.target.value)}
                placeholder="e.g. Learn how to order (Step-by-step guide)"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
              <span className="text-[10px] text-slate-400 block">
                The label shown on the button at the bottom of the checkout screen.
              </span>
            </div>

            {/* Guide Title & Subtitle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Guide Heading Title
                </label>
                <input
                  type="text"
                  value={config.title || ''}
                  onChange={(e) => handleUpdateField('title', e.target.value)}
                  placeholder="e.g. How to Order from Zafar Sarwar Traders"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  Support WhatsApp / Phone (Optional)
                </label>
                <input
                  type="text"
                  value={config.supportWhatsapp || ''}
                  onChange={(e) => handleUpdateField('supportWhatsapp', e.target.value)}
                  placeholder="+92 300 6603063"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Subtitle / Intro Instructions
              </label>
              <textarea
                rows={2}
                value={config.subtitle || ''}
                onChange={(e) => handleUpdateField('subtitle', e.target.value)}
                placeholder="e.g. Follow these simple steps to place your order with 100% genuine quality guarantee:"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300 block">
                Footer Assurance Note (Optional)
              </label>
              <input
                type="text"
                value={config.customNote || ''}
                onChange={(e) => handleUpdateField('customNote', e.target.value)}
                placeholder="e.g. All orders are verified via WhatsApp or call within 15-30 minutes."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Steps Manager Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                  <span>Ordering Steps ({config.steps.length})</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Add, edit, reorder or remove step-by-step guidance.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAddStep}
                className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Step</span>
              </button>
            </div>

            {/* List of Step Cards */}
            <div className="space-y-3 pt-1">
              {config.steps.map((step, idx) => (
                <div 
                  key={step.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 hover:border-slate-700 transition-colors"
                >
                  {/* Step Header with Reorder & Delete */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-blue-600/30 text-blue-400 border border-blue-500/40 text-xs font-bold flex items-center justify-center font-mono">
                        {step.stepNumber}
                      </span>
                      <span className="text-xs font-bold text-white">
                        Step #{step.stepNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveStep(idx, 'up')}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer"
                        title="Move step up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === config.steps.length - 1}
                        onClick={() => handleMoveStep(idx, 'down')}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-slate-300 transition-colors cursor-pointer"
                        title="Move step down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteStep(step.id)}
                        className="p-1.5 rounded-lg bg-rose-950/70 hover:bg-rose-900 border border-rose-800/50 text-rose-300 transition-colors cursor-pointer ml-1"
                        title="Delete step"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Step Title & Icon Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
                    <div className="sm:col-span-8 space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 block">
                        Step Title
                      </label>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleUpdateStep(step.id, 'title', e.target.value)}
                        placeholder="e.g. Choose Payment Method & Review"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    <div className="sm:col-span-4 space-y-1">
                      <label className="text-[11px] font-bold text-slate-400 block">
                        Step Icon
                      </label>
                      <select
                        value={step.icon || 'cart'}
                        onChange={(e) => handleUpdateStep(step.id, 'icon', e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                      >
                        {AVAILABLE_ICONS.map(ic => (
                          <option key={ic.id} value={ic.id}>{ic.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Step Description */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 block">
                      Step Instructions / Description
                    </label>
                    <textarea
                      rows={2}
                      value={step.description}
                      onChange={(e) => handleUpdateStep(step.id, 'description', e.target.value)}
                      placeholder="Detailed instructions for the customer..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  {/* Helpful Tip */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-400 block">
                      Helpful Tip / Note (Optional)
                    </label>
                    <input
                      type="text"
                      value={step.tip || ''}
                      onChange={(e) => handleUpdateStep(step.id, 'tip', e.target.value)}
                      placeholder="e.g. Tip: Check delivery availability for your city."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-amber-300/90 focus:outline-none focus:border-blue-500 placeholder-slate-600"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* Right Column: Live Customer Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="sticky top-6">
            <div className="bg-slate-900/95 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Live Checkout Preview
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {config.isEnabled ? 'ACTIVE ON CHECKOUT' : 'DISABLED'}
                </span>
              </div>

              {/* Simulated Checkout Bottom Bar */}
              <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
                <div className="text-[11px] text-slate-400 font-mono flex items-center justify-between">
                  <span>Simulated Checkout Bottom</span>
                  <span className="text-emerald-600 font-bold font-sans">Preview Mode</span>
                </div>

                {/* The "Learn how to order" Button */}
                <button
                  type="button"
                  onClick={() => setPreviewExpanded(!previewExpanded)}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>{config.buttonLabel || 'Learn how to order (Step-by-step guide)'}</span>
                  </div>
                  {previewExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {/* Expanded Guide Preview */}
                {previewExpanded && (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-fadeIn text-slate-800">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                        <span>{config.title || 'How to Place Your Order'}</span>
                      </h4>
                      {config.subtitle && (
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {config.subtitle}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {config.steps.map((step) => (
                        <div 
                          key={step.id}
                          className="p-3 rounded-lg bg-white border border-slate-200 space-y-1 shadow-2xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center font-mono shrink-0">
                              {step.stepNumber}
                            </span>
                            <span className="text-xs font-bold text-slate-900">
                              {step.title}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-600 pl-7 leading-relaxed">
                            {step.description}
                          </p>
                          {step.tip && (
                            <div className="ml-7 p-1.5 rounded bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-medium flex items-center gap-1">
                              <span>💡 {step.tip}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {config.customNote && (
                      <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 text-[11px] text-blue-900 font-medium">
                        🛡️ {config.customNote}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
