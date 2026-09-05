import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Upload, 
  Image as ImageIcon, 
  QrCode, 
  Smartphone, 
  Building2, 
  Banknote, 
  HelpCircle, 
  RefreshCw, 
  Save, 
  ExternalLink,
  ShieldCheck,
  Eye,
  AlertCircle,
  Percent,
  Sliders
} from 'lucide-react';
import { PaymentMethodConfig, PaymentMethodType, CheckoutSettings } from '../types';
import { defaultPaymentMethods, loadPaymentMethods, savePaymentMethods, loadCheckoutSettings, saveCheckoutSettings } from '../utils/storage';
import { uploadMediaToSupabase } from '../services/supabaseService';

interface AdminPaymentMethodsManagerProps {
  onSaveNotice?: (message: string) => void;
}

export const AdminPaymentMethodsManager: React.FC<AdminPaymentMethodsManagerProps> = ({ onSaveNotice }) => {
  const [methods, setMethods] = useState<PaymentMethodConfig[]>([]);
  const [checkoutSettings, setCheckoutSettings] = useState<CheckoutSettings>(() => loadCheckoutSettings());
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editingMethod, setEditingMethod] = useState<Partial<PaymentMethodConfig> | null>(null);
  const [isUploadingQr, setIsUploadingQr] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [activePreviewMethodId, setActivePreviewMethodId] = useState<string | null>(null);

  useEffect(() => {
    const loaded = loadPaymentMethods();
    setMethods(loaded);
    setCheckoutSettings(loadCheckoutSettings());
  }, []);

  const handleToggleEnable = async (id: string) => {
    const updated = methods.map(m => m.id === id ? { ...m, isEnabled: !m.isEnabled } : m);
    setMethods(updated);
    await persistMethods(updated, 'Payment method status updated');
  };

  const persistMethods = async (list: PaymentMethodConfig[], msg: string = 'Payment methods saved') => {
    setIsSaving(true);
    const res = await savePaymentMethods(list);
    setIsSaving(false);
    if (res.success) {
      setSaveStatus(msg);
      if (onSaveNotice) onSaveNotice(msg);
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus(`Failed to save: ${res.error}`);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleSaveCodAdvanceSettings = async () => {
    setIsSaving(true);
    const res = await saveCheckoutSettings(checkoutSettings);
    setIsSaving(false);
    if (res.success) {
      setSaveStatus('COD Advance Protection settings saved to Supabase');
      if (onSaveNotice) onSaveNotice('COD Advance Protection settings saved');
      setTimeout(() => setSaveStatus(null), 3000);
    } else {
      setSaveStatus(`Failed to save COD advance settings: ${res.error}`);
      setTimeout(() => setSaveStatus(null), 4000);
    }
  };

  const handleOpenEdit = (method?: PaymentMethodConfig) => {
    if (method) {
      setEditingMethod({ ...method });
    } else {
      // New custom method
      setEditingMethod({
        id: `custom_${Date.now()}`,
        type: 'custom',
        name: '',
        isEnabled: true,
        accountTitle: '',
        accountNumber: '',
        bankName: '',
        iban: '',
        instructions: 'Please transfer the exact amount and upload your payment proof screenshot below.',
        whatsappNumber: '+92 310 8002863',
        requiresProof: true,
        badgeText: 'Manual Transfer',
        displayOrder: methods.length + 1
      });
    }
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!editingMethod || !editingMethod.name?.trim()) {
      alert('Please enter a payment method name');
      return;
    }

    const cleaned: PaymentMethodConfig = {
      id: editingMethod.id || `method_${Date.now()}`,
      type: editingMethod.type || 'custom',
      name: editingMethod.name.trim(),
      isEnabled: editingMethod.isEnabled ?? true,
      accountTitle: editingMethod.accountTitle?.trim() || undefined,
      accountNumber: editingMethod.accountNumber?.trim() || undefined,
      bankName: editingMethod.bankName?.trim() || undefined,
      iban: editingMethod.iban?.trim() || undefined,
      branchCode: editingMethod.branchCode?.trim() || undefined,
      qrCodeUrl: editingMethod.qrCodeUrl?.trim() || undefined,
      instructions: editingMethod.instructions?.trim() || undefined,
      whatsappNumber: editingMethod.whatsappNumber?.trim() || undefined,
      displayOrder: editingMethod.displayOrder ?? (methods.length + 1),
      requiresProof: editingMethod.type === 'cod' ? false : (editingMethod.requiresProof ?? true),
      badgeText: editingMethod.badgeText?.trim() || undefined
    };

    const exists = methods.some(m => m.id === cleaned.id);
    let updated: PaymentMethodConfig[];
    if (exists) {
      updated = methods.map(m => m.id === cleaned.id ? cleaned : m);
    } else {
      updated = [...methods, cleaned];
    }

    setMethods(updated);
    setIsEditing(false);
    setEditingMethod(null);
    await persistMethods(updated, `Payment method "${cleaned.name}" saved successfully`);
  };

  const handleDeleteMethod = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete payment method "${name}"?`)) {
      const updated = methods.filter(m => m.id !== id);
      setMethods(updated);
      await persistMethods(updated, `Payment method "${name}" deleted`);
    }
  };

  const handleResetDefaults = async () => {
    if (confirm('Reset payment methods to standard defaults (Cash on Delivery, Meezan Bank, Easypaisa, JazzCash)? This will replace your current list.')) {
      setMethods(defaultPaymentMethods);
      await persistMethods(defaultPaymentMethods, 'Payment methods reset to default');
    }
  };

  const handleQrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size exceeds 10MB limit. Please choose a smaller image.');
      return;
    }

    setIsUploadingQr(true);
    try {
      const uploadRes = await uploadMediaToSupabase(file, 'payment-proofs', `qr-${Date.now()}-${file.name}`);
      if (uploadRes.url) {
        setEditingMethod(prev => prev ? { ...prev, qrCodeUrl: uploadRes.url } : null);
      } else {
        alert(`Failed to upload QR code: ${uploadRes.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Upload error: ${err?.message || String(err)}`);
    } finally {
      setIsUploadingQr(false);
    }
  };

  const getMethodIcon = (type: PaymentMethodType) => {
    switch (type) {
      case 'cod':
        return <Banknote className="w-5 h-5 text-emerald-600" />;
      case 'bank_transfer':
        return <Building2 className="w-5 h-5 text-sky-600" />;
      case 'easypaisa':
        return <Smartphone className="w-5 h-5 text-emerald-500" />;
      case 'jazzcash':
        return <Smartphone className="w-5 h-5 text-amber-500" />;
      default:
        return <CreditCard className="w-5 h-5 text-amber-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-xl shadow-sm border border-stone-200 p-5 md:p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 bg-amber-50 rounded-lg text-amber-800">
                <CreditCard className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-stone-900">Payment Methods & Accounts</h2>
            </div>
            <p className="text-sm text-stone-500 mt-1 max-w-2xl">
              Configure payment options for customers at checkout (Cash on Delivery, Bank Transfer, Easypaisa, JazzCash, or custom accounts). Only enabled methods will appear on the customer checkout screen.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleResetDefaults}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
              title="Reset to default Pakistani payment options"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reset Defaults
            </button>
            <button
              onClick={() => handleOpenEdit()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Payment Method
            </button>
          </div>
        </div>

        {saveStatus && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center justify-between text-xs text-emerald-800 font-medium animate-fadeIn">
            <span className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              {saveStatus}
            </span>
            <button onClick={() => setSaveStatus(null)} className="text-emerald-600 hover:text-emerald-800">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* COD Advance Protection Card */}
      <div className="bg-gradient-to-br from-amber-950 via-stone-900 to-slate-900 rounded-2xl p-5 md:p-6 text-white shadow-lg border border-amber-900/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-stone-800 pb-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">Cash on Delivery (COD) Advance Protection</h3>
                <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${
                  checkoutSettings.codAdvanceRequired
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                    : 'bg-stone-800 text-stone-400 border-stone-700'
                }`}>
                  {checkoutSettings.codAdvanceRequired ? `Active • ${checkoutSettings.codAdvancePercentage || 30}% Advance Required` : 'Standard 100% COD Mode'}
                </span>
              </div>
              <p className="text-xs text-stone-400 mt-1 max-w-2xl leading-relaxed">
                Require customers placing Cash on Delivery orders to pay a partial advance deposit (e.g. 30%, 35%, 40%) online via Easypaisa / JazzCash / Bank Transfer, and pay the remaining balance in cash upon delivery.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-end md:self-auto">
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer"
                checked={Boolean(checkoutSettings.codAdvanceRequired)}
                onChange={e => setCheckoutSettings(prev => ({ ...prev, codAdvanceRequired: e.target.checked }))}
              />
              <div className="w-14 h-7 bg-stone-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-amber-500"></div>
            </label>
          </div>
        </div>

        {/* Configuration inputs if enabled */}
        {checkoutSettings.codAdvanceRequired && (
          <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-fadeIn">
            {/* Advance Percentage Picker */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                Advance Percentage Required (%)
              </label>
              <div className="flex items-center gap-2">
                {[30, 35, 40, 50].map(pct => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => setCheckoutSettings(prev => ({ ...prev, codAdvancePercentage: pct }))}
                    className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                      (checkoutSettings.codAdvancePercentage || 30) === pct
                        ? 'bg-amber-500 text-stone-950 shadow-md'
                        : 'bg-stone-800 text-stone-300 hover:bg-stone-700'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
                <div className="relative flex-1">
                  <input
                    type="number"
                    min="5"
                    max="95"
                    value={checkoutSettings.codAdvancePercentage || 30}
                    onChange={e => setCheckoutSettings(prev => ({ ...prev, codAdvancePercentage: parseInt(e.target.value) || 30 }))}
                    className="w-full px-2.5 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-white font-bold font-mono focus:ring-1 focus:ring-amber-500 text-xs"
                  />
                  <span className="absolute right-2 top-1.5 text-stone-400 font-bold">%</span>
                </div>
              </div>
              <p className="text-[11px] text-stone-400">
                Calculates required deposit automatically on checkout total.
              </p>
            </div>

            {/* Minimum Advance PKR Amount (Optional) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                Minimum Advance (PKR)
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={checkoutSettings.codAdvanceMinAmount || 500}
                onChange={e => setCheckoutSettings(prev => ({ ...prev, codAdvanceMinAmount: parseInt(e.target.value) || 0 }))}
                placeholder="e.g. 500"
                className="w-full px-3 py-1.5 bg-stone-950 border border-stone-700 rounded-lg text-white font-bold font-mono focus:ring-1 focus:ring-amber-500 text-xs"
              />
              <p className="text-[11px] text-stone-400">
                Minimum flat advance amount required even on small orders.
              </p>
            </div>

            {/* Save Button for COD Settings */}
            <div className="space-y-2 flex flex-col justify-end">
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                Apply & Persist to Database
              </label>
              <button
                type="button"
                onClick={handleSaveCodAdvanceSettings}
                disabled={isSaving}
                className="w-full py-2 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold flex items-center justify-center gap-2 transition-all shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save COD Advance Settings'}
              </button>
            </div>

            {/* Custom Instructions for COD Advance */}
            <div className="md:col-span-3 space-y-1.5 pt-2 border-t border-stone-800">
              <label className="block text-xs font-bold text-stone-300 uppercase tracking-wider">
                Custom COD Advance Instructions (Shown to Customer at Checkout)
              </label>
              <textarea
                rows={2}
                value={checkoutSettings.codAdvanceInstructions || ''}
                onChange={e => setCheckoutSettings(prev => ({ ...prev, codAdvanceInstructions: e.target.value }))}
                placeholder="To confirm Cash on Delivery, a 30% advance payment is required. The remaining balance is payable in cash upon delivery."
                className="w-full px-3 py-2 bg-stone-950 border border-stone-700 rounded-lg text-white text-xs focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {methods.map((method) => {
          const isPreviewOpen = activePreviewMethodId === method.id;
          return (
            <div 
              key={method.id}
              className={`bg-white rounded-xl border transition-all p-5 flex flex-col justify-between ${
                method.isEnabled 
                  ? 'border-stone-200 shadow-sm hover:border-amber-400' 
                  : 'border-stone-200 bg-stone-50/70 opacity-70'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-stone-100 border border-stone-200">
                      {getMethodIcon(method.type)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-stone-900 text-base">{method.name}</h3>
                        {method.badgeText && (
                          <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-50 text-amber-800 border border-amber-200">
                            {method.badgeText}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-stone-500 capitalize">
                        {method.type === 'cod' ? 'Cash On Delivery' : `${method.type.replace('_', ' ')} • Proof Required`}
                      </span>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={method.isEnabled}
                      onChange={() => handleToggleEnable(method.id)}
                    />
                    <div className="w-11 h-6 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                {/* Account Details Box */}
                {method.type !== 'cod' && (
                  <div className="bg-stone-50 rounded-lg p-3 border border-stone-200 space-y-1.5 text-xs text-stone-700 my-3">
                    {method.bankName && (
                      <div className="flex justify-between">
                        <span className="text-stone-500">Bank / Provider:</span>
                        <span className="font-semibold text-stone-900">{method.bankName}</span>
                      </div>
                    )}
                    {method.accountTitle && (
                      <div className="flex justify-between">
                        <span className="text-stone-500">Account Title:</span>
                        <span className="font-semibold text-stone-900">{method.accountTitle}</span>
                      </div>
                    )}
                    {method.accountNumber && (
                      <div className="flex justify-between">
                        <span className="text-stone-500">Account Number:</span>
                        <span className="font-mono font-bold text-amber-900">{method.accountNumber}</span>
                      </div>
                    )}
                    {method.iban && (
                      <div className="flex justify-between">
                        <span className="text-stone-500">IBAN:</span>
                        <span className="font-mono text-[11px] text-stone-800">{method.iban}</span>
                      </div>
                    )}
                    {method.whatsappNumber && (
                      <div className="flex justify-between">
                        <span className="text-stone-500">Proof WhatsApp:</span>
                        <span className="font-semibold text-emerald-700">{method.whatsappNumber}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Instructions snippet */}
                {method.instructions && (
                  <p className="text-xs text-stone-500 line-clamp-2 italic mb-3">
                    "{method.instructions}"
                  </p>
                )}

                {/* QR Code thumbnail */}
                {method.qrCodeUrl && (
                  <div className="flex items-center gap-2 text-xs text-stone-600 mb-3 bg-amber-50/60 p-2 rounded-lg border border-amber-200/60">
                    <img 
                      src={method.qrCodeUrl} 
                      alt="Payment QR" 
                      className="w-8 h-8 rounded border border-stone-300 object-cover bg-white"
                      referrerPolicy="no-referrer"
                    />
                    <span>QR Code configured for instant scanning at checkout</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-stone-200 text-xs mt-2">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 font-medium ${method.isEnabled ? 'text-emerald-700' : 'text-stone-400'}`}>
                    <span className={`w-2 h-2 rounded-full ${method.isEnabled ? 'bg-emerald-500' : 'bg-stone-300'}`}></span>
                    {method.isEnabled ? 'Active at Checkout' : 'Disabled'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenEdit(method)}
                    className="p-1.5 text-stone-600 hover:text-amber-800 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Edit Method Details"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  {/* Allow deleting any method or custom methods */}
                  <button
                    onClick={() => handleDeleteMethod(method.id, method.name)}
                    className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Method"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Add Modal */}
      {isEditing && editingMethod && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-800 rounded-lg">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 text-lg">
                    {editingMethod.id && methods.some(m => m.id === editingMethod.id) ? 'Edit Payment Method' : 'Add New Payment Method'}
                  </h3>
                  <p className="text-xs text-stone-500">Configure account details, instructions, and payment QR code</p>
                </div>
              </div>
              <button
                onClick={() => { setIsEditing(false); setEditingMethod(null); }}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-lg hover:bg-stone-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Method Name */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Payment Method Name *
                  </label>
                  <input
                    type="text"
                    value={editingMethod.name || ''}
                    onChange={e => setEditingMethod({ ...editingMethod, name: e.target.value })}
                    placeholder="e.g. Meezan Bank Transfer, Easypaisa, Cash on Delivery"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                {/* Method Type */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Type
                  </label>
                  <select
                    value={editingMethod.type || 'custom'}
                    onChange={e => {
                      const newType = e.target.value as PaymentMethodType;
                      setEditingMethod({ 
                        ...editingMethod, 
                        type: newType,
                        requiresProof: newType === 'cod' ? false : true
                      });
                    }}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white"
                  >
                    <option value="cod">Cash on Delivery (COD)</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="easypaisa">Easypaisa</option>
                    <option value="jazzcash">JazzCash</option>
                    <option value="custom">Other / Custom Payment Method</option>
                  </select>
                </div>
              </div>

              {/* Badge Text & Enabled toggle */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                    Badge Text (Optional)
                  </label>
                  <input
                    type="text"
                    value={editingMethod.badgeText || ''}
                    onChange={e => setEditingMethod({ ...editingMethod, badgeText: e.target.value })}
                    placeholder="e.g. Instant 0% Fee, Pay on Delivery"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-6 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editingMethod.isEnabled ?? true}
                      onChange={e => setEditingMethod({ ...editingMethod, isEnabled: e.target.checked })}
                      className="w-4 h-4 rounded text-amber-800 focus:ring-amber-500 border-stone-300"
                    />
                    <span className="text-xs font-semibold text-stone-800">Enabled at Checkout</span>
                  </label>

                  {editingMethod.type !== 'cod' && (
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingMethod.requiresProof ?? true}
                        onChange={e => setEditingMethod({ ...editingMethod, requiresProof: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-800 focus:ring-amber-500 border-stone-300"
                      />
                      <span className="text-xs font-semibold text-stone-800">Requires Payment Proof</span>
                    </label>
                  )}
                </div>
              </div>

              {/* Account details (for non-COD) */}
              {editingMethod.type !== 'cod' && (
                <div className="border-t border-stone-200 pt-4 space-y-4">
                  <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">
                    Bank / Account Credentials
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Bank / Provider Name
                      </label>
                      <input
                        type="text"
                        value={editingMethod.bankName || ''}
                        onChange={e => setEditingMethod({ ...editingMethod, bankName: e.target.value })}
                        placeholder="e.g. Meezan Bank, HBL, Telenor Bank"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Account Title
                      </label>
                      <input
                        type="text"
                        value={editingMethod.accountTitle || ''}
                        onChange={e => setEditingMethod({ ...editingMethod, accountTitle: e.target.value })}
                        placeholder="e.g. Zafar Sarwar Traders"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        Account Number
                      </label>
                      <input
                        type="text"
                        value={editingMethod.accountNumber || ''}
                        onChange={e => setEditingMethod({ ...editingMethod, accountNumber: e.target.value })}
                        placeholder="e.g. 03108002863 or 02010108920192"
                        className="w-full px-3 py-2 font-mono border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                        IBAN (Optional)
                      </label>
                      <input
                        type="text"
                        value={editingMethod.iban || ''}
                        onChange={e => setEditingMethod({ ...editingMethod, iban: e.target.value })}
                        placeholder="e.g. PK64MEZN0002010108920192"
                        className="w-full px-3 py-2 font-mono text-xs border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* QR Code Upload / Link */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      Account QR Code (Optional)
                    </label>
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                      {editingMethod.qrCodeUrl ? (
                        <div className="relative group">
                          <img 
                            src={editingMethod.qrCodeUrl} 
                            alt="QR Code" 
                            className="w-16 h-16 rounded-lg border border-stone-300 object-cover bg-white"
                            referrerPolicy="no-referrer"
                          />
                          <button
                            type="button"
                            onClick={() => setEditingMethod({ ...editingMethod, qrCodeUrl: undefined })}
                            className="absolute -top-2 -right-2 p-1 bg-rose-600 text-white rounded-full hover:bg-rose-700 shadow-sm"
                            title="Remove QR code"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 rounded-lg border border-dashed border-stone-300 flex items-center justify-center text-stone-400 bg-stone-50">
                          <QrCode className="w-8 h-8" />
                        </div>
                      )}

                      <div className="flex-1 space-y-2 w-full">
                        <div className="flex items-center gap-2">
                          <label className={`inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-300 bg-white hover:bg-stone-50 cursor-pointer text-stone-700 transition-colors ${isUploadingQr ? 'opacity-50 pointer-events-none' : ''}`}>
                            <Upload className="w-3.5 h-3.5" />
                            {isUploadingQr ? 'Uploading...' : 'Upload QR Image'}
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              onChange={handleQrUpload}
                              disabled={isUploadingQr}
                            />
                          </label>
                          <span className="text-xs text-stone-400">or paste image URL:</span>
                        </div>
                        <input
                          type="text"
                          value={editingMethod.qrCodeUrl || ''}
                          onChange={e => setEditingMethod({ ...editingMethod, qrCodeUrl: e.target.value })}
                          placeholder="https://example.com/qr-code.png"
                          className="w-full px-3 py-1.5 text-xs border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* WhatsApp Number for Proof Submission */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                      WhatsApp Number for Proof Submission
                    </label>
                    <input
                      type="text"
                      value={editingMethod.whatsappNumber || ''}
                      onChange={e => setEditingMethod({ ...editingMethod, whatsappNumber: e.target.value })}
                      placeholder="e.g. +92 310 8002863"
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    />
                    <p className="text-[11px] text-stone-400 mt-1">
                      When customer places the order with this payment method, the WhatsApp proof message will be directed to this number.
                    </p>
                  </div>
                </div>
              )}

              {/* Payment Instructions */}
              <div>
                <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-1">
                  Payment Instructions (Shown to Customer at Checkout)
                </label>
                <textarea
                  rows={3}
                  value={editingMethod.instructions || ''}
                  onChange={e => setEditingMethod({ ...editingMethod, instructions: e.target.value })}
                  placeholder="Instructions explaining how to pay and how to submit proof..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-stone-900 focus:ring-2 focus:ring-amber-500 focus:border-amber-500 text-xs"
                />
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => { setIsEditing(false); setEditingMethod(null); }}
                className="px-4 py-2 text-sm font-semibold text-stone-600 hover:text-stone-800 hover:bg-stone-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-amber-800 hover:bg-amber-900 rounded-lg shadow-sm transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Payment Method'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
