import React, { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  Trash2,
  Edit3,
  Check,
  X,
  Search,
  RefreshCw,
  Percent,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  Filter,
  Layers,
  Copy,
  Info
} from 'lucide-react';
import { Coupon } from '../types';
import {
  loadCouponsFromStorage,
  saveCouponsToStorage,
  fetchCouponsFromBackend,
  saveCouponSingle,
  deleteCouponFromStorage
} from '../utils/storage';

export const AdminCouponsManager: React.FC = () => {
  const [coupons, setCoupons] = useState<Coupon[]>(() => loadCouponsFromStorage());
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled' | 'expired'>('all');
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Form State
  const [formCode, setFormCode] = useState<string>('');
  const [formDiscount, setFormDiscount] = useState<number>(10);
  const [formIsEnabled, setFormIsEnabled] = useState<boolean>(true);
  const [formExpiryDate, setFormExpiryDate] = useState<string>('');
  const [formMinOrder, setFormMinOrder] = useState<string>('');
  const [formMaxDiscount, setFormMaxDiscount] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    loadFreshCoupons();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3500);
  };

  const loadFreshCoupons = async () => {
    setLoading(true);
    try {
      const data = await fetchCouponsFromBackend();
      setCoupons(data);
    } catch (e) {
      console.warn('Error loading coupons:', e);
    } finally {
      setLoading(false);
    }
  };

  const isCouponExpired = (c: Coupon): boolean => {
    if (!c.expiryDate) return false;
    const exp = new Date(c.expiryDate);
    if (isNaN(exp.getTime())) return false;
    exp.setHours(23, 59, 59, 999);
    return Date.now() > exp.getTime();
  };

  const getCouponStatus = (c: Coupon): { label: string; color: string; bg: string; border: string } => {
    if (!c.isEnabled) {
      return { label: 'Disabled', color: 'text-slate-400', bg: 'bg-slate-100 dark:bg-slate-800', border: 'border-slate-300 dark:border-slate-700' };
    }
    if (isCouponExpired(c)) {
      return { label: 'Expired', color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-950/40', border: 'border-rose-200 dark:border-rose-900' };
    }
    return { label: 'Active', color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-900' };
  };

  const handleOpenCreate = () => {
    setEditingCoupon(null);
    setFormCode('');
    setFormDiscount(10);
    setFormIsEnabled(true);
    setFormExpiryDate('');
    setFormMinOrder('');
    setFormMaxDiscount('');
    setFormDescription('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Coupon) => {
    setEditingCoupon(c);
    setFormCode(c.code);
    setFormDiscount(c.discountPercentage);
    setFormIsEnabled(c.isEnabled !== false);
    setFormExpiryDate(c.expiryDate ? c.expiryDate.split('T')[0] : '');
    setFormMinOrder(c.minOrderAmount ? String(c.minOrderAmount) : '');
    setFormMaxDiscount(c.maxDiscountAmount ? String(c.maxDiscountAmount) : '');
    setFormDescription(c.description || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleToggleEnable = async (c: Coupon) => {
    const updated = { ...c, isEnabled: !c.isEnabled, updatedAt: new Date().toISOString() };
    const newList = coupons.map(item => (item.id === c.id ? updated : item));
    setCoupons(newList);
    const res = await saveCouponsToStorage(newList);
    if (res.success) {
      showToast(`Coupon "${c.code}" ${updated.isEnabled ? 'enabled' : 'disabled'}.`);
    } else {
      showToast('Failed to update status in Supabase.', 'error');
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Are you sure you want to permanently delete coupon "${code}"?`)) {
      return;
    }
    const newList = coupons.filter(c => c.id !== id);
    setCoupons(newList);
    const res = await deleteCouponFromStorage(id);
    if (res.success) {
      showToast(`Coupon "${code}" deleted.`);
    } else {
      showToast('Failed to delete coupon.', 'error');
    }
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = formCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '');
    if (!cleanCode) {
      setFormError('Please enter a valid coupon code (letters, numbers, hyphens).');
      return;
    }

    // Check duplicate code
    const isDuplicate = coupons.some(
      c => c.code.trim().toUpperCase() === cleanCode && (!editingCoupon || c.id !== editingCoupon.id)
    );
    if (isDuplicate) {
      setFormError(`A coupon with code "${cleanCode}" already exists. Please choose a unique code.`);
      return;
    }

    const discountVal = parseFloat(String(formDiscount));
    if (isNaN(discountVal) || discountVal <= 0 || discountVal > 100) {
      setFormError('Discount percentage must be between 1% and 100%.');
      return;
    }

    const minOrderVal = formMinOrder ? parseFloat(formMinOrder) : undefined;
    if (minOrderVal !== undefined && (isNaN(minOrderVal) || minOrderVal < 0)) {
      setFormError('Minimum order amount must be a positive number.');
      return;
    }

    const maxDiscountVal = formMaxDiscount ? parseFloat(formMaxDiscount) : undefined;
    if (maxDiscountVal !== undefined && (isNaN(maxDiscountVal) || maxDiscountVal < 0)) {
      setFormError('Maximum discount cap must be a positive number.');
      return;
    }

    const newCoupon: Coupon = {
      id: editingCoupon ? editingCoupon.id : `coupon-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      code: cleanCode,
      discountPercentage: discountVal,
      isEnabled: formIsEnabled,
      expiryDate: formExpiryDate.trim() || undefined,
      minOrderAmount: minOrderVal && minOrderVal > 0 ? minOrderVal : undefined,
      maxDiscountAmount: maxDiscountVal && maxDiscountVal > 0 ? maxDiscountVal : undefined,
      description: formDescription.trim() || undefined,
      usageCount: editingCoupon ? (editingCoupon.usageCount || 0) : 0,
      createdAt: editingCoupon?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    let updatedList: Coupon[];
    if (editingCoupon) {
      updatedList = coupons.map(c => (c.id === editingCoupon.id ? newCoupon : c));
    } else {
      updatedList = [newCoupon, ...coupons];
    }

    setCoupons(updatedList);
    setIsModalOpen(false);

    const res = await saveCouponsToStorage(updatedList);
    if (res.success) {
      showToast(`Coupon "${cleanCode}" saved successfully to Supabase.`);
    } else {
      showToast('Saved locally. Supabase sync notice: ' + (res.error || 'Check network'), 'error');
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Filtered List
  const filteredCoupons = coupons.filter(c => {
    const matchesSearch =
      c.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.description && c.description.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusFilter === 'active') {
      return c.isEnabled !== false && !isCouponExpired(c);
    }
    if (statusFilter === 'disabled') {
      return c.isEnabled === false;
    }
    if (statusFilter === 'expired') {
      return isCouponExpired(c);
    }
    return true;
  });

  const totalCoupons = coupons.length;
  const activeCouponsCount = coupons.filter(c => c.isEnabled !== false && !isCouponExpired(c)).length;
  const expiredCount = coupons.filter(c => isCouponExpired(c)).length;
  const disabledCount = coupons.filter(c => c.isEnabled === false).length;

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2.5 text-xs font-bold transition-all animate-bounce ${
            toastMessage.type === 'success'
              ? 'bg-emerald-600 text-white'
              : 'bg-rose-600 text-white'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Tag className="w-4 h-4" />
            <span>Store Discounts & Promotions</span>
          </div>
          <h2 className="text-2xl font-black font-serif tracking-tight text-white">
            Coupons & Promo Codes
          </h2>
          <p className="text-slate-300 text-xs mt-1 max-w-xl leading-relaxed">
            Create and manage promotional discount codes stored permanently in Supabase. Customer validation runs securely with automatic percentage calculations and checkout verification.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={loadFreshCoupons}
            disabled={loading}
            className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-bold"
            title="Refresh from Supabase"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="py-3 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Coupon</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 block uppercase tracking-wider">Total Promo Codes</span>
          <span className="text-2xl font-black text-slate-900 dark:text-white font-mono mt-1 block">
            {totalCoupons}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 block uppercase tracking-wider">Active Codes</span>
          <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300 font-mono mt-1 block">
            {activeCouponsCount}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/50 shadow-sm">
          <span className="text-[11px] font-bold text-rose-700 dark:text-rose-400 block uppercase tracking-wider">Expired Codes</span>
          <span className="text-2xl font-black text-rose-700 dark:text-rose-300 font-mono mt-1 block">
            {expiredCount}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 shadow-sm">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">Disabled Codes</span>
          <span className="text-2xl font-black text-slate-700 dark:text-slate-300 font-mono mt-1 block">
            {disabledCount}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by promo code or note..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:border-indigo-500"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {(['all', 'active', 'expired', 'disabled'] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all cursor-pointer whitespace-nowrap ${
                statusFilter === filter
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Coupons Table / Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {filteredCoupons.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-500 mx-auto">
              <Tag className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">No Coupons Found</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {searchQuery ? 'No coupons match your current search query.' : 'Create your first promo code to offer customers real-time percentage discounts.'}
            </p>
            {!searchQuery && (
              <button
                type="button"
                onClick={handleOpenCreate}
                className="mt-2 py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Create Coupon</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="py-3.5 px-4">Coupon Code</th>
                  <th className="py-3.5 px-4">Discount</th>
                  <th className="py-3.5 px-4">Rules / Limits</th>
                  <th className="py-3.5 px-4">Expiry Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredCoupons.map((c) => {
                  const status = getCouponStatus(c);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Code & Description */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm tracking-wider text-slate-900 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700">
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopyCode(c.code)}
                            className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Copy code"
                          >
                            {copiedCode === c.code ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                        {c.description && (
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate max-w-xs">
                            {c.description}
                          </p>
                        )}
                      </td>

                      {/* Discount Percentage */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1 font-extrabold text-indigo-600 dark:text-indigo-400 font-mono text-sm bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-100 dark:border-indigo-900/50">
                          <Percent className="w-3 h-3" />
                          <span>{c.discountPercentage}% OFF</span>
                        </div>
                      </td>

                      {/* Rules & Limits */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300 text-[11px] space-y-0.5">
                        {c.minOrderAmount ? (
                          <div className="font-medium">
                            <span className="text-slate-400">Min Order: </span>
                            <span className="font-bold font-mono">Rs. {c.minOrderAmount.toLocaleString('en-PK')}</span>
                          </div>
                        ) : (
                          <div className="text-slate-400">No minimum order</div>
                        )}
                        {c.maxDiscountAmount ? (
                          <div className="font-medium text-amber-600 dark:text-amber-400">
                            <span>Max Cap: </span>
                            <span className="font-bold font-mono">Rs. {c.maxDiscountAmount.toLocaleString('en-PK')}</span>
                          </div>
                        ) : null}
                      </td>

                      {/* Expiry Date */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                        {c.expiryDate ? (
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className={`font-medium ${isCouponExpired(c) ? 'text-rose-500 font-bold' : ''}`}>
                              {new Date(c.expiryDate).toLocaleDateString('en-PK', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-medium">Never expires</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggleEnable(c)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all cursor-pointer ${status.bg} ${status.color} ${status.border}`}
                          title="Click to toggle enable/disable"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                          <span>{status.label}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-300 hover:text-indigo-600 transition-colors cursor-pointer"
                            title="Edit Coupon"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id, c.code)}
                            className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/50 text-slate-600 dark:text-slate-300 hover:text-rose-600 transition-colors cursor-pointer"
                            title="Delete Coupon"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE / EDIT COUPON MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/40 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif">
                    {editingCoupon ? 'Edit Coupon Code' : 'Create New Coupon'}
                  </h3>
                  <p className="text-[11px] text-slate-300">
                    Saves directly to Supabase and enables customer checkout validation.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveForm} className="p-6 space-y-4 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Coupon Code & Discount % */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Coupon / Promo Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. WELCOME10, EID20"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value.toUpperCase().replace(/\s+/g, ''))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold uppercase focus:border-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Matched case-insensitively.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Discount Percentage (%) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1"
                      max="100"
                      step="0.5"
                      placeholder="10"
                      value={formDiscount}
                      onChange={(e) => setFormDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold focus:border-indigo-500 outline-none"
                    />
                    <Percent className="w-4 h-4 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Exact percentage deducted from subtotal.</p>
                </div>
              </div>

              {/* Minimum Order Amount & Maximum Discount Cap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Min Order Subtotal (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Optional (e.g. 2000)"
                    value={formMinOrder}
                    onChange={(e) => setFormMinOrder(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:border-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Leave blank for no minimum.</p>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                    Max Discount Cap (PKR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100"
                    placeholder="Optional (e.g. 5000)"
                    value={formMaxDiscount}
                    onChange={(e) => setFormMaxDiscount(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-mono focus:border-indigo-500 outline-none"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Maximum rupee discount limit.</p>
                </div>
              </div>

              {/* Expiry Date */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Expiry Date (Optional)
                </label>
                <div className="relative">
                  <input
                    type="date"
                    value={formExpiryDate}
                    onChange={(e) => setFormExpiryDate(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:border-indigo-500 outline-none cursor-pointer"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">Coupon automatically expires after this date.</p>
              </div>

              {/* Description / Admin Notes */}
              <div>
                <label className="block font-bold text-slate-700 dark:text-slate-200 mb-1">
                  Description / Campaign Note
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ramadan Special Promotion, Welcome Gift"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:border-indigo-500 outline-none"
                />
              </div>

              {/* Enable / Disable Status Switch */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 dark:text-white block">Active & Usable</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Customers can immediately apply this coupon if enabled.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsEnabled(!formIsEnabled)}
                  className={`w-12 h-7 rounded-full transition-colors flex items-center p-1 cursor-pointer ${
                    formIsEnabled ? 'bg-indigo-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                  }`}
                >
                  <div className="w-5 h-5 rounded-full bg-white shadow-md"></div>
                </button>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-4 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingCoupon ? 'Update Coupon' : 'Create & Save to Supabase'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
