import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Truck, 
  XCircle, 
  MessageSquare, 
  Settings, 
  DollarSign, 
  Save, 
  User, 
  Phone, 
  MapPin, 
  Calendar, 
  Tag, 
  FileText,
  AlertCircle,
  AlertTriangle,
  Send,
  Plus,
  CreditCard,
  Eye,
  ExternalLink,
  ShieldCheck,
  Check,
  X,
  RefreshCw,
  Image as ImageIcon,
  BookOpen
} from 'lucide-react';
import { CustomerOrder, CheckoutSettings, OrderStatus, OrderStatusHistoryItem, PaymentStatus } from '../types';
import { loadStoredOrders, saveStoredOrders, loadCheckoutSettings, saveCheckoutSettings, updateOrderPaymentStatusInStorage } from '../utils/storage';
import { fetchOrdersFromSupabase, updateOrderStatusInSupabase, isSupabaseConfigured } from '../services/supabaseService';
import { supabase } from '../lib/supabase';
import { AdminPaymentMethodsManager } from './AdminPaymentMethodsManager';
import { AdminHowToOrderManager } from './AdminHowToOrderManager';

interface AdminOrdersManagerProps {
  onShowToast: (message: string) => void;
}

export const ORDER_STATUSES = [
  'Order Received',
  'Pending Payment',
  'Payment Proof Submitted',
  'Advance Payment Under Review',
  'Payment Verified',
  'Payment Rejected',
  'Confirmed',
  'Preparing',
  'Packed',
  'Ready for Dispatch',
  'Shipped',
  'On The Way',
  'Out for Delivery',
  'Delivered',
  'Cancelled',
  'On Hold',
  'Delayed'
] as const;

export const QUICK_REJECTION_REASONS = [
  'Blurry or unreadable screenshot receipt',
  'Transferred amount does not match order requirement',
  'Transaction reference / TR ID not found in bank statement',
  'Duplicate or previously used receipt submitted',
  'Incorrect bank / wallet receiving account chosen'
];

export const AdminOrdersManager: React.FC<AdminOrdersManagerProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'payments' | 'guide' | 'settings'>('orders');
  const [orders, setOrders] = useState<CustomerOrder[]>(loadStoredOrders());
  const [settings, setSettings] = useState<CheckoutSettings>(loadCheckoutSettings());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Editing order details state
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);
  const [newStatusNote, setNewStatusNote] = useState('');

  // Proof Viewer Modal
  const [viewingProofOrder, setViewingProofOrder] = useState<CustomerOrder | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [showRejectInput, setShowRejectInput] = useState<boolean>(false);

  // WhatsApp Business Settings & Logs State
  const [waNumber, setWaNumber] = useState('+92 310 8002863');
  const [waEnabled, setWaEnabled] = useState(true);
  const [waProvider, setWaProvider] = useState<'direct' | 'cloud_api' | 'webhook' | 'ultramsg'>('direct');
  const [waPhoneNumberId, setWaPhoneNumberId] = useState('');
  const [waAccessToken, setWaAccessToken] = useState('');
  const [waWebhookUrl, setWaWebhookUrl] = useState('');
  const [waTemplate, setWaTemplate] = useState('');
  const [waLogs, setWaLogs] = useState<any[]>([]);
  const [isTestingWa, setIsTestingWa] = useState(false);
  const [isSavingWa, setIsSavingWa] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const fetchWaSettings = async () => {
    try {
      const token = localStorage.getItem('zst_admin_token');
      const res = await fetch('/api/notifications/whatsapp/settings', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data?.success && data.settings) {
        setWaNumber(data.settings.businessPhoneNumber || '+92 310 8002863');
        setWaEnabled(data.settings.notificationsEnabled ?? true);
        setWaProvider(data.settings.provider || 'direct');
        setWaPhoneNumberId(data.settings.phoneNumberId || '');
        setWaAccessToken(data.settings.accessTokenMasked || '');
        setWaWebhookUrl(data.settings.webhookUrl || '');
        setWaTemplate(data.settings.customTemplate || '');
      }
    } catch (err) {
      console.warn('Failed to load WhatsApp settings:', err);
    }
  };

  const fetchWaLogs = async () => {
    try {
      const token = localStorage.getItem('zst_admin_token');
      const res = await fetch('/api/notifications/whatsapp/logs', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      if (data?.success && Array.isArray(data.logs)) {
        setWaLogs(data.logs);
      }
    } catch (err) {
      console.warn('Failed to load WhatsApp logs:', err);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState<string>('');

  const loadOrders = async (silent = false) => {
    if (!silent) setIsRefreshing(true);
    try {
      setSettings(loadCheckoutSettings());
      fetchWaSettings();
      fetchWaLogs();

      // 1. Start with local cached orders
      const local = loadStoredOrders();
      const orderMap = new Map<string, CustomerOrder>();
      (local || []).forEach(o => {
        if (o && o.id) orderMap.set(String(o.id), o);
      });

      // 2. Fetch authoritative database / server CMS orders
      if (isSupabaseConfigured) {
        const dbOrders = await fetchOrdersFromSupabase();
        if (dbOrders !== null && Array.isArray(dbOrders)) {
          dbOrders.forEach(o => {
            if (o && o.id) {
              const existing = orderMap.get(String(o.id));
              // Merge cleanly, preserving complete item descriptions, variant details, and customer info
              orderMap.set(String(o.id), {
                ...(existing || {}),
                ...o,
                items: (Array.isArray(o.items) && o.items.length > 0) ? o.items : (existing?.items || [])
              });
            }
          });
        }
      }

      const merged = Array.from(orderMap.values()).sort((a, b) => {
        const tA = new Date(a.createdAt || 0).getTime();
        const tB = new Date(b.createdAt || 0).getTime();
        return tB - tA;
      });

      setOrders(merged);
      saveStoredOrders(merged);
      setLastRefreshTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err) {
      console.warn('[Admin Orders] Failed to refresh orders:', err);
    } finally {
      if (!silent) setIsRefreshing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    loadOrders(false);

    // Supabase Realtime live event subscription
    let channel: any = null;
    if (isSupabaseConfigured && supabase) {
      try {
        channel = supabase
          .channel('public:orders:admin-realtime')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
            console.log('[Realtime Orders] Database event:', payload.eventType);
            if (isMounted) loadOrders(true);
          })
          .subscribe();
      } catch (rtErr) {
        console.warn('[Realtime Orders] Subscription fallback:', rtErr);
      }
    }

    // Auto-refresh polling every 30 seconds
    const interval = setInterval(() => {
      if (isMounted) loadOrders(true);
    }, 30000);

    // Refresh whenever admin tab regains focus
    const handleFocus = () => {
      if (isMounted) loadOrders(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      if (channel && supabase) {
        try { supabase.removeChannel(channel); } catch {}
      }
    };
  }, []);

  const uniqueCities = Array.from(new Set(orders.map(o => o.city).filter(Boolean)));

  const handleUpdateStatus = async (orderId: string, newStatus: string, note?: string) => {
    const isApproval = ['approved', 'confirmed', 'payment verified', 'verified'].includes(newStatus.toLowerCase());

    if (isApproval) {
      await updateOrderPaymentStatusInStorage(orderId, 'Payment Verified', newStatus as any, note);
    } else {
      if (isSupabaseConfigured) {
        const res = await updateOrderStatusInSupabase(orderId, newStatus as any, note);
        if (!res.success) {
          onShowToast(`Failed to update order in Supabase: ${res.error || 'Database error'}`);
          return;
        }
      }
    }

    const nowStr = new Date().toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
    const updated: CustomerOrder[] = orders.map(o => {
      if (o.id === orderId) {
        const existingHistory = o.statusHistory || [];
        const newHistoryItem: OrderStatusHistoryItem = {
          status: newStatus as OrderStatus,
          timestamp: nowStr,
          note: note || `Status updated to ${newStatus} by Admin`,
          updatedBy: 'Admin'
        };
        return {
          ...o,
          status: newStatus as OrderStatus,
          paymentStatus: isApproval ? ('Payment Verified' as PaymentStatus) : o.paymentStatus,
          paymentVerifiedAt: isApproval ? new Date().toISOString() : o.paymentVerifiedAt,
          paymentVerifiedBy: isApproval ? 'Admin' : o.paymentVerifiedBy,
          statusHistory: [...existingHistory, newHistoryItem]
        };
      }
      return o;
    });
    setOrders(updated);
    saveStoredOrders(updated);
    if (editingOrder && editingOrder.id === orderId) {
      setEditingOrder(updated.find(o => o.id === orderId) || null);
    }
    onShowToast(`Order #${orderId.slice(-6)} status updated to "${newStatus}"${isApproval ? ' & Payment Verified' : ''}`);
  };

  const handleVerifyPayment = async (orderId: string, customNote?: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    const isCodAdvance = Boolean(targetOrder?.isCodAdvanceRequired);
    const advanceAmount = targetOrder?.codAdvanceAmountPaid || targetOrder?.codAdvanceAmountRequired || 0;
    const remainingBalance = targetOrder?.codRemainingBalance || 0;

    const defaultNote = isCodAdvance
      ? `Advance payment of PKR ${advanceAmount.toLocaleString('en-PK')} verified and approved by Admin. Remaining balance of PKR ${remainingBalance.toLocaleString('en-PK')} to be collected upon Cash on Delivery.`
      : 'Payment proof verified and approved by Admin';

    const note = customNote || defaultNote;
    const nextOrderStatus: OrderStatus = isCodAdvance ? 'Confirmed' : 'Payment Verified';

    await updateOrderPaymentStatusInStorage(orderId, 'Payment Verified', nextOrderStatus, note);
    
    const updated = orders.map(o => {
      if (o.id === orderId) {
        const history = Array.isArray(o.statusHistory) ? [...o.statusHistory] : [];
        history.push({
          status: nextOrderStatus,
          timestamp: new Date().toISOString(),
          note,
          updatedBy: 'Admin'
        });
        return {
          ...o,
          paymentStatus: 'Payment Verified' as PaymentStatus,
          status: nextOrderStatus,
          codAdvanceVerified: isCodAdvance ? true : o.codAdvanceVerified,
          paymentVerifiedAt: new Date().toISOString(),
          paymentVerifiedBy: 'Admin',
          paymentNotes: note,
          statusHistory: history
        };
      }
      return o;
    });

    setOrders(updated);
    if (editingOrder && editingOrder.id === orderId) {
      setEditingOrder(updated.find(o => o.id === orderId) || null);
    }
    if (viewingProofOrder && viewingProofOrder.id === orderId) {
      setViewingProofOrder(updated.find(o => o.id === orderId) || null);
    }
    onShowToast(`Payment verified for Order #${orderId.slice(-6)}! Status updated to ${nextOrderStatus}.`);
  };

  const handleRejectPayment = async (orderId: string, reason: string) => {
    const targetOrder = orders.find(o => o.id === orderId);
    const isCodAdvance = Boolean(targetOrder?.isCodAdvanceRequired);
    const cleanReason = reason || 'Invalid or unreadable screenshot receipt';
    const note = `${isCodAdvance ? 'COD Advance' : 'Payment'} proof rejected by Admin: ${cleanReason}`;
    
    await updateOrderPaymentStatusInStorage(orderId, 'Payment Rejected', 'Payment Rejected', note, cleanReason);

    const updated = orders.map(o => {
      if (o.id === orderId) {
        const history = Array.isArray(o.statusHistory) ? [...o.statusHistory] : [];
        history.push({
          status: 'Payment Rejected',
          timestamp: new Date().toISOString(),
          note,
          updatedBy: 'Admin'
        });
        return {
          ...o,
          paymentStatus: 'Payment Rejected' as PaymentStatus,
          status: 'Payment Rejected' as OrderStatus,
          paymentRejectionReason: cleanReason,
          paymentNotes: note,
          statusHistory: history
        };
      }
      return o;
    });

    setOrders(updated);
    if (editingOrder && editingOrder.id === orderId) {
      setEditingOrder(updated.find(o => o.id === orderId) || null);
    }
    if (viewingProofOrder && viewingProofOrder.id === orderId) {
      setViewingProofOrder(updated.find(o => o.id === orderId) || null);
    }
    setShowRejectInput(false);
    setRejectionReason('');
    onShowToast(`Payment rejected for Order #${orderId.slice(-6)}.`);
  };

  const handleSaveDeliveryAndDelay = async (
    orderId: string, 
    estDays: string, 
    trackingRef: string, 
    isDelayed: boolean, 
    delayReason: string
  ) => {
    if (isSupabaseConfigured) {
      const { error } = await supabase.from('orders').update({
        estimated_delivery_days: estDays || null,
        tracking_reference: trackingRef || null,
        is_delayed: isDelayed,
        delivery_delay_note: delayReason || null,
        updated_at: new Date().toISOString()
      }).eq('id', orderId);

      if (error) {
        onShowToast(`Failed to save preferences in Supabase: ${error.message}`);
        return;
      }
    }

    const updated = orders.map(o => {
      if (o.id === orderId) {
        return {
          ...o,
          estimatedDeliveryDays: estDays,
          trackingReference: trackingRef,
          isDelayed,
          deliveryDelayNote: delayReason
        };
      }
      return o;
    });
    setOrders(updated);
    saveStoredOrders(updated);
    if (editingOrder && editingOrder.id === orderId) {
      setEditingOrder(updated.find(o => o.id === orderId) || null);
    }
    onShowToast(`Delivery & delay preferences saved for Order #${orderId.slice(-6)}`);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (confirm('Are you sure you want to delete this order record permanently?')) {
      try {
        const token = localStorage.getItem('zst_admin_token');
        await fetch(`/api/db/orders/${encodeURIComponent(orderId)}`, {
          method: 'DELETE',
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
      } catch (e) {
        console.warn('Server delete error:', e);
      }

      if (isSupabaseConfigured) {
        try {
          await supabase.from('order_items').delete().eq('order_id', orderId);
          await supabase.from('orders').delete().eq('id', orderId);
        } catch (sbErr) {
          console.warn('Supabase delete error:', sbErr);
        }
      }

      const updated = orders.filter(o => o.id !== orderId);
      setOrders(updated);
      saveStoredOrders(updated);
      if (editingOrder?.id === orderId) setEditingOrder(null);
      onShowToast('Order record deleted permanently.');
    }
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    saveCheckoutSettings(settings);
    onShowToast('Checkout & Delivery settings saved permanently!');
  };

  const handleSaveWaConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingWa(true);
    try {
      const token = localStorage.getItem('zst_admin_token');
      const res = await fetch('/api/notifications/whatsapp/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          businessPhoneNumber: waNumber,
          notificationsEnabled: waEnabled,
          provider: waProvider,
          phoneNumberId: waPhoneNumberId,
          accessToken: waAccessToken,
          webhookUrl: waWebhookUrl,
          customTemplate: waTemplate
        })
      });
      const data = await res.json();
      if (data?.success) {
        onShowToast('WhatsApp Business notification settings saved permanently!');
        fetchWaSettings();
      } else {
        onShowToast(`Failed to save WhatsApp settings: ${data?.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      onShowToast(`Error saving WhatsApp settings: ${err.message}`);
    } finally {
      setIsSavingWa(false);
    }
  };

  const handleSendTestWa = async () => {
    setIsTestingWa(true);
    setTestResult(null);
    try {
      const token = localStorage.getItem('zst_admin_token');
      const res = await fetch('/api/notifications/whatsapp/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          recipientNumber: waNumber,
          provider: waProvider,
          phoneNumberId: waPhoneNumberId,
          accessToken: waAccessToken,
          webhookUrl: waWebhookUrl
        })
      });
      const data = await res.json();
      setTestResult(data);
      if (data?.success) {
        onShowToast('Test WhatsApp message dispatched successfully!');
        fetchWaLogs();
      } else {
        onShowToast(`Test message failed: ${data?.error || 'Check credentials'}`);
      }
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
      onShowToast(`Test error: ${err.message}`);
    } finally {
      setIsTestingWa(false);
    }
  };

  const handleResendOrderNotification = async (order: CustomerOrder) => {
    try {
      onShowToast(`Dispatching WhatsApp notification for #${order.orderNumber || order.id.slice(-6)}...`);
      const token = localStorage.getItem('zst_admin_token');
      const res = await fetch('/api/notifications/whatsapp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ order, orderId: order.id })
      });
      const data = await res.json();
      if (data?.success) {
        onShowToast(`WhatsApp notification sent successfully for Order #${order.orderNumber || order.id.slice(-6)}!`);
        fetchWaLogs();
      } else {
        onShowToast(`WhatsApp dispatch error: ${data?.error || 'Failed'}`);
      }
    } catch (err: any) {
      onShowToast(`Failed to send WhatsApp notification: ${err.message}`);
    }
  };

  const filteredOrders = (orders || []).filter(o => {
    if (!o) return false;
    const q = (searchQuery || '').toLowerCase();
    const phone = o.phoneNumber || (o as any).customerPhone || '';
    const name = o.customerName || '';
    const city = o.city || '';
    const area = o.areaLocality || '';
    const addr = o.deliveryAddress || '';
    const id = o.id || '';
    const custId = o.customerId || '';
    
    const itemsMatch = Array.isArray(o.items) && o.items.some(i => i && (i.productName || '').toLowerCase().includes(q));

    const matchesSearch = 
      id.toLowerCase().includes(q) ||
      custId.toLowerCase().includes(q) ||
      name.toLowerCase().includes(q) ||
      phone.toLowerCase().includes(q) ||
      city.toLowerCase().includes(q) ||
      area.toLowerCase().includes(q) ||
      addr.toLowerCase().includes(q) ||
      itemsMatch;
    
    const matchesStatus = statusFilter === 'all' || o.status === statusFilter;
    const matchesCity = cityFilter === 'all' || o.city === cityFilter;
    
    const matchesPayment = paymentFilter === 'all' || 
      (paymentFilter === 'needs_review' && (o.paymentStatus === 'Payment Proof Submitted' || o.status === 'Payment Proof Submitted' || o.paymentStatus === 'Advance Payment Under Review' || o.status === 'Advance Payment Under Review' || (Boolean(o.paymentProofUrl) && o.paymentStatus !== 'Payment Verified'))) ||
      (paymentFilter === 'advance_under_review' && (o.paymentStatus === 'Advance Payment Under Review' || o.status === 'Advance Payment Under Review' || (o.isCodAdvanceRequired && o.paymentStatus !== 'Payment Verified' && Boolean(o.paymentProofUrl)))) ||
      (paymentFilter === 'proof_submitted' && (o.paymentStatus === 'Payment Proof Submitted' || o.status === 'Payment Proof Submitted')) ||
      (paymentFilter === 'verified' && (o.paymentStatus === 'Payment Verified' || o.status === 'Payment Verified' || o.codAdvanceVerified === true)) ||
      (paymentFilter === 'rejected' && (o.paymentStatus === 'Payment Rejected' || o.status === 'Payment Rejected')) ||
      (paymentFilter === 'cod' && (o.paymentStatus === 'Cash on Delivery' || o.paymentMethodName?.toLowerCase().includes('cash'))) ||
      (paymentFilter === 'pending' && (!o.paymentStatus || o.paymentStatus === 'Pending Payment'));

    let matchesDate = true;
    if (dateFilter) {
      try {
        const d = new Date(o.createdAt);
        if (!isNaN(d.getTime())) {
          matchesDate = d.toISOString().split('T')[0] === dateFilter;
        } else {
          matchesDate = false;
        }
      } catch {
        matchesDate = false;
      }
    }

    return matchesSearch && matchesStatus && matchesCity && matchesPayment && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Order Received':
      case 'New':
      case 'Pending':
        return <span className="px-2.5 py-1 rounded-full bg-blue-950/90 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Order Received</span>;
      case 'Advance Payment Under Review':
        return <span className="px-2.5 py-1 rounded-full bg-amber-950/90 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse"><Clock className="w-3.5 h-3.5 text-amber-400" /> Advance Under Review</span>;
      case 'Payment Proof Submitted':
        return <span className="px-2.5 py-1 rounded-full bg-amber-950/90 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-400" /> Payment Proof Submitted</span>;
      case 'Payment Verified':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Payment Verified</span>;
      case 'Payment Rejected':
        return <span className="px-2.5 py-1 rounded-full bg-rose-950/90 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-rose-400" /> Payment Rejected</span>;
      case 'Pending Payment':
        return <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Pending Payment</span>;
      case 'Confirmed':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5" /> Confirmed</span>;
      case 'Preparing':
      case 'Packed':
        return <span className="px-2.5 py-1 rounded-full bg-indigo-950/90 border border-indigo-500/40 text-indigo-300 text-xs font-bold flex items-center gap-1.5"><Tag className="w-3.5 h-3.5" /> {status}</span>;
      case 'Ready for Dispatch':
      case 'Shipped':
      case 'On The Way':
      case 'Out for Delivery':
        return <span className="px-2.5 py-1 rounded-full bg-amber-950/90 border border-amber-500/40 text-amber-300 text-xs font-bold flex items-center gap-1.5"><Truck className="w-3.5 h-3.5 text-amber-400" /> {status}</span>;
      case 'Delivered':
        return <span className="px-2.5 py-1 rounded-full bg-emerald-900 border border-emerald-400 text-emerald-100 text-xs font-bold flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" /> Delivered</span>;
      case 'On Hold':
        return <span className="px-2.5 py-1 rounded-full bg-amber-900/60 border border-amber-600/50 text-amber-200 text-xs font-bold flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> On Hold</span>;
      case 'Delayed':
        return <span className="px-2.5 py-1 rounded-full bg-rose-950/90 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5 text-rose-400" /> Delayed</span>;
      case 'Cancelled':
        return <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-400 text-xs font-bold flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Cancelled</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full bg-slate-800 text-slate-300 text-xs font-bold">{status}</span>;
    }
  };

  const getPaymentBadge = (order: CustomerOrder) => {
    if (order.isCodAdvanceRequired) {
      if (order.paymentStatus === 'Payment Verified' || order.codAdvanceVerified || order.status === 'Payment Verified') {
        return (
          <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Advance Verified (Bal: Rs. {(order.codRemainingBalance || 0).toLocaleString('en-PK')})</span>
          </span>
        );
      }
      if (order.paymentStatus === 'Payment Rejected' || order.status === 'Payment Rejected') {
        return (
          <span className="px-2.5 py-1 rounded-full bg-rose-950/90 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5 text-rose-400" />
            <span>Advance Proof Rejected</span>
          </span>
        );
      }
      if (order.paymentStatus === 'Advance Payment Under Review' || order.status === 'Advance Payment Under Review' || order.paymentProofUrl) {
        return (
          <span className="px-2.5 py-1 rounded-full bg-amber-950/90 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Advance Under Review (Rs. {(order.codAdvanceAmountPaid || order.codAdvanceAmountRequired || 0).toLocaleString('en-PK')})</span>
          </span>
        );
      }
    }

    if (order.paymentStatus === 'Payment Verified' || order.status === 'Payment Verified') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Payment Verified</span>
        </span>
      );
    }
    if (order.paymentStatus === 'Payment Rejected' || order.status === 'Payment Rejected') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-rose-950/90 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-1.5">
          <XCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>Payment Rejected</span>
        </span>
      );
    }
    if (order.paymentProofUrl || order.paymentStatus === 'Payment Proof Submitted' || order.status === 'Payment Proof Submitted') {
      return (
        <span className="px-2.5 py-1 rounded-full bg-amber-950/90 border border-amber-500/50 text-amber-300 text-xs font-bold flex items-center gap-1.5 animate-pulse">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span>Proof Submitted</span>
        </span>
      );
    }
    if (order.paymentStatus === 'Cash on Delivery' || order.paymentMethodName?.toLowerCase().includes('cash')) {
      return (
        <span className="px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cash on Delivery</span>
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-slate-400 text-xs font-medium">
        {order.paymentStatus || 'Pending Payment'}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <span>Order Management & Payment Verification</span>
          </h2>
          <p className="text-xs text-slate-400">
            View orders, verify customer payment proof receipts, configure manual payment methods, and manage delivery rules.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Customer Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('payments')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'payments'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-400" />
            <span>Payment Methods</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'guide'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <BookOpen className="w-4 h-4 text-cyan-400" />
            <span>"How to Order" Guide</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Checkout Settings</span>
          </button>
        </div>
      </div>

      {activeTab === 'orders' ? (
        <div className="space-y-4">
          
          {/* Action & Sync Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/90 px-4 py-3 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  loadOrders(false);
                  onShowToast('Refreshed orders from server and database.');
                }}
                disabled={isRefreshing}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
                title="Force refresh orders from Supabase database and server storage"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Syncing Orders...' : 'Refresh Orders'}</span>
              </button>

              <div className="hidden sm:flex items-center gap-2 text-slate-400">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-medium text-emerald-400">Live Auto-Sync</span>
                {lastRefreshTime && (
                  <span className="text-[11px] text-slate-500">· Last checked: {lastRefreshTime}</span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-300 font-medium">
                Showing <strong className="text-white">{filteredOrders.length}</strong> of <strong className="text-slate-400">{orders.length}</strong> orders
              </span>
              {(searchQuery || statusFilter !== 'all' || paymentFilter !== 'all' || cityFilter !== 'all' || dateFilter) && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setPaymentFilter('all');
                    setCityFilter('all');
                    setDateFilter('');
                  }}
                  className="text-amber-400 hover:text-amber-300 underline font-medium text-[11px]"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>

          {/* Controls: Search, Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="relative lg:col-span-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search Order ID, Customer, Phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="all">All Order Statuses</option>
                {ORDER_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="all">All Payment Statuses</option>
                <option value="proof_submitted">Proof Submitted (Requires Review)</option>
                <option value="verified">Payment Verified</option>
                <option value="rejected">Payment Rejected</option>
                <option value="cod">Cash on Delivery</option>
                <option value="pending">Pending Payment</option>
              </select>
            </div>

            <div>
              <select
                value={cityFilter}
                onChange={(e) => setCityFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
              >
                <option value="all">All Cities</option>
                {uniqueCities.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Orders List */}
          {filteredOrders.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800/80 space-y-2">
              <ShoppingBag className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-slate-300 font-bold text-base">No Orders Found</h3>
              <p className="text-slate-500 text-xs">No order records match your query or filters.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <div key={order.id} className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-lg space-y-4 p-5">
                  
                  {/* Order Top Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                    <div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-sm font-extrabold text-blue-400 font-mono">#{order.orderNumber || order.id}</span>
                        {order.customerId && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                            Cust ID: {order.customerId}
                          </span>
                        )}
                        {getStatusBadge(order.status)}
                        {getPaymentBadge(order)}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(order.createdAt).toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                        className="bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-blue-500"
                      >
                        {ORDER_STATUSES.map(s => (
                          <option key={s} value={s}>Set Status: {s}</option>
                        ))}
                      </select>

                      <button
                        onClick={() => setEditingOrder(order)}
                        className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors"
                        title="View Full Order Details & Tracking History"
                      >
                        View Details
                      </button>

                      <a
                        href={`https://wa.me/${order.customerPhone ? order.customerPhone.replace(/[^0-9]/g, '') : ''}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                        title="Chat with Customer on WhatsApp"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span className="hidden sm:inline">WhatsApp</span>
                      </a>

                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="p-2 rounded-xl bg-slate-800 hover:bg-rose-600 text-slate-400 hover:text-white transition-colors"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Customer & Address Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 text-xs">
                    <div className="space-y-1">
                      <div className="text-slate-500 font-bold flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-blue-400" /> Customer Name
                      </div>
                      <div className="font-bold text-white text-sm">{order.customerName}</div>
                      <div className="text-[11px] font-mono text-emerald-400 font-bold flex items-center gap-1 pt-1">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        {order.phoneNumber || order.customerPhone}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-slate-500 font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" /> City & Area
                      </div>
                      <div className="font-bold text-white">{order.city || 'N/A'}</div>
                      {order.areaLocality && (
                        <div className="text-slate-300 font-medium">{order.areaLocality}</div>
                      )}
                    </div>

                    <div className="space-y-1 lg:col-span-2">
                      <div className="text-slate-500 font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" /> Full Delivery Address
                      </div>
                      <div className="text-slate-200 font-medium leading-relaxed bg-slate-900/80 p-2 rounded-lg border border-slate-800/80">
                        {order.deliveryAddress}
                      </div>
                      {order.landmark && (
                        <div className="text-amber-300/90 text-[11px] font-medium pt-0.5">
                          📍 Landmark: <strong>{order.landmark}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Order Items Table */}
                  <div className="space-y-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Ordered Products ({(order.items || []).length}):</span>
                    <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
                      {(order.items || []).map((item, i) => {
                        const imgSrc = item.image || (item as any).productImage;
                        const unitP = item.unitPrice || (item as any).price;
                        return (
                          <div key={i} className="p-3 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3 min-w-0">
                              {imgSrc && (
                                <img src={imgSrc} alt={item.productName} className="w-10 h-10 rounded-lg object-cover border border-slate-800 bg-slate-900 shrink-0" />
                              )}
                              <div className="min-w-0">
                                {item.brand && <span className="text-[10px] font-bold text-blue-400 uppercase block">{item.brand}</span>}
                                <h5 className="font-bold text-white truncate">{item.productName}</h5>
                                <div className="flex flex-wrap gap-1.5 pt-0.5 text-[10px]">
                                  {item.selectedVariant && (
                                    <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                                      Option: {item.selectedVariant}
                                    </span>
                                  )}
                                  {item.selectedShade && (
                                    <span className="px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 flex items-center gap-1">
                                      {item.selectedShadeColor && (
                                        <span className="w-2 h-2 rounded-full border border-slate-500 inline-block" style={{ backgroundColor: item.selectedShadeColor }} />
                                      )}
                                      <span>Shade: {item.selectedShade} {item.selectedShadeCode ? `(${item.selectedShadeCode})` : ''}</span>
                                    </span>
                                  )}
                                  {item.selectedColor && !item.selectedShade && (
                                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                      Color: {item.selectedColor}
                                    </span>
                                  )}
                                  {item.selectedSize && !item.selectedVariant && (
                                    <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                                      Size: {item.selectedSize}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="text-right shrink-0 font-mono">
                              <div className="text-slate-400 text-[11px]">Qty: <strong className="text-white">{item.quantity}</strong> × {unitP}</div>
                              <div className="font-bold text-emerald-400 text-xs">PKR {item.lineTotal ? item.lineTotal.toLocaleString('en-PK') : '0'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Order Summary Total & COD Advance Summary */}
                  <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-start gap-3 pt-1">
                    {order.isCodAdvanceRequired && (
                      <div className="w-full sm:w-80 bg-amber-950/40 p-3.5 rounded-xl border border-amber-500/40 text-xs space-y-1.5">
                        <div className="flex items-center gap-1.5 text-amber-300 font-bold border-b border-amber-500/30 pb-1.5">
                          <ShieldCheck className="w-4 h-4 text-amber-400" />
                          <span>COD Advance Protection Applied</span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Advance Required / Transferred:</span>
                          <span className="font-mono font-bold text-amber-300">
                            PKR {(order.codAdvanceAmountPaid || order.codAdvanceAmountRequired || 0).toLocaleString('en-PK')}
                          </span>
                        </div>
                        <div className="flex justify-between text-slate-300">
                          <span>Remaining COD to Collect:</span>
                          <span className="font-mono font-bold text-emerald-400">
                            PKR {(order.codRemainingBalance || 0).toLocaleString('en-PK')}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-amber-500/20">
                          <span>Advance Status:</span>
                          <span className="font-semibold text-amber-200">
                            {order.codAdvanceVerified ? '✅ Advance Verified' : '⏳ Proof Under Review'}
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="w-full sm:w-72 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5 self-end">
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal:</span>
                        <span className="font-mono text-slate-200">PKR {order.subtotal?.toLocaleString('en-PK')}</span>
                      </div>
                      {order.appliedCouponCode && (
                        <div className="flex justify-between text-amber-400 font-semibold">
                          <span>Coupon ({order.appliedCouponCode}{order.couponDiscountPercentage ? ` - ${order.couponDiscountPercentage}%` : ''}):</span>
                          <span className="font-mono">-PKR {order.couponDiscountAmount?.toLocaleString('en-PK') || 0}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-400">
                        <span>Delivery Fee:</span>
                        <span className="font-mono text-slate-200">
                          {order.deliveryCharges === 0 ? <span className="text-emerald-400 font-bold">FREE</span> : `PKR ${order.deliveryCharges}`}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-800 flex justify-between font-extrabold text-sm text-white">
                        <span>Grand Total:</span>
                        <span className="font-mono text-emerald-400 text-base">PKR {order.grandTotal?.toLocaleString('en-PK')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Payment Info & Proof Verification Bar */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 text-xs">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <span className="text-slate-400 text-[11px] block">Payment Method:</span>
                          <span className="font-bold text-white text-xs">{order.paymentMethodName || 'Cash on Delivery'}</span>
                        </div>
                      </div>

                      {order.isCodAdvanceRequired && (
                        <div className="pl-3 border-l border-slate-800">
                          <span className="text-slate-400 text-[11px] block">Advance Verification:</span>
                          <span className={`font-bold text-xs ${order.codAdvanceVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {order.codAdvanceVerified ? 'Verified' : 'Under Review'}
                          </span>
                        </div>
                      )}

                      {order.transactionReference && (
                        <div className="pl-3 border-l border-slate-800">
                          <span className="text-slate-400 text-[11px] block">Txn Reference:</span>
                          <span className="font-mono text-cyan-300 font-bold text-xs">{order.transactionReference}</span>
                        </div>
                      )}

                      {order.paymentNotes && (
                        <div className="pl-3 border-l border-slate-800 max-w-xs truncate">
                          <span className="text-slate-400 text-[11px] block">Note:</span>
                          <span className="text-slate-300 text-[11px] italic">{order.paymentNotes}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleResendOrderNotification(order)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs transition-colors"
                        title="Send / Resend automated WhatsApp alert to Business number"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Send WhatsApp Alert</span>
                      </button>

                      {order.paymentProofUrl ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setViewingProofOrder(order)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/40 font-bold text-xs transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>{order.isCodAdvanceRequired ? 'View Advance Proof' : 'View Proof Receipt'}</span>
                          </button>

                          {order.paymentStatus !== 'Payment Verified' && (
                            <button
                              onClick={() => handleVerifyPayment(order.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors shadow-sm"
                              title={order.isCodAdvanceRequired ? "Approve Advance Payment & Confirm Order" : "Verify Payment"}
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>{order.isCodAdvanceRequired ? 'Approve Advance' : 'Verify'}</span>
                            </button>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">No proof required (Standard COD)</span>
                      )}
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      ) : activeTab === 'payments' ? (
        <AdminPaymentMethodsManager onSaveNotice={onShowToast} />
      ) : activeTab === 'guide' ? (
        <AdminHowToOrderManager onShowToast={onShowToast} />
      ) : (
        /* CHECKOUT & WHATSAPP BUSINESS SETTINGS FORM */
        <div className="space-y-6 max-w-4xl">
          {/* 1. CART & CHECKOUT RULES */}
          <form onSubmit={handleSaveSettings} className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold font-serif text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                <span>Cart & Delivery Rules Configuration</span>
              </h3>
              <p className="text-xs text-slate-400">Configure standard delivery fees, free shipping thresholds, and public contact WhatsApp.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Default Delivery Charge (Rs.)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    value={settings.deliveryFee}
                    onChange={(e) => setSettings({ ...settings, deliveryFee: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                    placeholder="250"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Free Delivery Threshold (Rs.)</label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3" />
                  <input
                    type="number"
                    value={settings.freeDeliveryThreshold || ''}
                    onChange={(e) => setSettings({ ...settings, freeDeliveryThreshold: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono font-bold"
                    placeholder="50000"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-300 mb-1">Public Store Inquiry WhatsApp (+92 310 8002863)</label>
                <input
                  type="text"
                  value={settings.whatsappNumber || '+92 310 8002863'}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              className="py-2.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Cart & Delivery Settings</span>
            </button>
          </form>

          {/* 2. ADMIN WHATSAPP BUSINESS NOTIFICATIONS CONFIGURATION */}
          <form onSubmit={handleSaveWaConfig} className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-bold font-serif text-white flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                  <span>Admin WhatsApp Business Notification Engine</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Instant server-side alerts for new customer orders & payment proof receipts sent directly to your business phone.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={waEnabled}
                  onChange={(e) => setWaEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ml-3 text-xs font-bold text-slate-200">
                  {waEnabled ? 'Notifications Active' : 'Disabled'}
                </span>
              </label>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Business WhatsApp Recipient Number <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-emerald-500 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={waNumber}
                      onChange={(e) => setWaNumber(e.target.value)}
                      placeholder="+92 310 8002863"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono font-bold"
                      required
                    />
                  </div>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    Internal business number. This is securely stored on the backend and NEVER exposed to customers.
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Notification Dispatch Gateway
                  </label>
                  <select
                    value={waProvider}
                    onChange={(e) => setWaProvider(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-bold"
                  >
                    <option value="direct">Direct Webhook / Admin Gateway (Universal)</option>
                    <option value="cloud_api">Meta WhatsApp Cloud API (Official Business)</option>
                    <option value="webhook">Custom Webhook (Zapier / Make / n8n / REST)</option>
                    <option value="ultramsg">UltraMsg / WPPConnect Gateway</option>
                  </select>
                  <span className="text-[11px] text-slate-500 mt-1 block">
                    {waProvider === 'direct' && 'Dispatches formatted order alerts with direct preview & tracking payload.'}
                    {waProvider === 'cloud_api' && 'Sends automated messages via official Meta WhatsApp Business Cloud API.'}
                    {waProvider === 'webhook' && 'Forwards JSON order payloads to your external automation webhook.'}
                    {waProvider === 'ultramsg' && 'Sends instant WhatsApp text via UltraMsg API instance.'}
                  </span>
                </div>
              </div>

              {/* Provider-specific Credentials */}
              {waProvider === 'cloud_api' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-emerald-400 block">Meta WhatsApp Cloud API Credentials</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Phone Number ID</label>
                      <input
                        type="text"
                        value={waPhoneNumberId}
                        onChange={(e) => setWaPhoneNumberId(e.target.value)}
                        placeholder="e.g. 104829104829104"
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-400 mb-1">Permanent Access Token</label>
                      <input
                        type="password"
                        value={waAccessToken}
                        onChange={(e) => setWaAccessToken(e.target.value)}
                        placeholder="EAAB..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {waProvider === 'webhook' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <span className="text-xs font-bold text-emerald-400 block">Automation Webhook URL</span>
                  <input
                    type="url"
                    value={waWebhookUrl}
                    onChange={(e) => setWaWebhookUrl(e.target.value)}
                    placeholder="https://hook.eu1.make.com/... or https://n8n.yourserver.com/webhook/..."
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  />
                </div>
              )}

              {/* Custom Template Editor */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Custom Notification Template (Optional)
                </label>
                <textarea
                  rows={4}
                  value={waTemplate}
                  onChange={(e) => setWaTemplate(e.target.value)}
                  placeholder={`Leave blank to use the standard high-clarity template with order items, totals, addresses, and payment receipt links.\n\nAvailable variables: {order_number}, {customer_name}, {phone}, {city}, {address}, {items}, {total}, {payment_method}, {proof_url}`}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Action Buttons & Live Test */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleSendTestWa}
                  disabled={isTestingWa}
                  className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isTestingWa ? 'animate-spin' : ''}`} />
                  <span>{isTestingWa ? 'Dispatching Test Message...' : 'Send Test WhatsApp Message'}</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingWa}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingWa ? 'Saving...' : 'Save WhatsApp Configuration'}</span>
                </button>
              </div>

              {/* Test Result Feedback */}
              {testResult && (
                <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.success 
                    ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                    : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}>
                  {testResult.success ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />}
                  <div className="space-y-1">
                    <p className="font-bold">{testResult.message || (testResult.success ? 'Test WhatsApp notification delivered!' : 'Failed to send test message')}</p>
                    {testResult.recipient && <p className="text-[11px] font-mono text-slate-300">Recipient: {testResult.recipient}</p>}
                    {testResult.note && <p className="text-[11px] text-slate-400">{testResult.note}</p>}
                  </div>
                </div>
              )}
            </div>
          </form>

          {/* 3. NOTIFICATION LOGS & HISTORY */}
          <div className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-serif text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span>Recent WhatsApp Dispatch Logs</span>
                </h3>
                <p className="text-xs text-slate-400">Status history of automated business order notifications.</p>
              </div>
              <button
                type="button"
                onClick={fetchWaLogs}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-bold"
              >
                Refresh Logs
              </button>
            </div>

            {waLogs.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-4 text-center border border-slate-800 rounded-xl bg-slate-950">
                No notification dispatch logs recorded yet. Place an order or click "Send Test WhatsApp Message" above to generate a log.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="text-[11px] font-bold text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Order</th>
                      <th className="p-3">Recipient</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {waLogs.slice(0, 10).map((log, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="p-3 font-mono text-slate-400 text-[11px]">
                          {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="p-3 font-bold text-white">
                          #{log.orderNumber || log.orderId?.slice(-6) || 'TEST'}
                        </td>
                        <td className="p-3 font-mono text-slate-300">
                          {log.recipientNumber}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                            log.status === 'sent' 
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' 
                              : log.status === 'failed'
                              ? 'bg-rose-950 text-rose-400 border border-rose-500/30'
                              : 'bg-amber-950 text-amber-400 border border-amber-500/30'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 text-[11px] max-w-xs truncate">
                          {log.error || log.provider || 'Delivered'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* EDIT ORDER DETAILS & STATUS TRACKING MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm flex justify-center items-start sm:items-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full my-auto max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif">Order Details & Status Timeline</h3>
                <p className="text-xs text-slate-400">#{editingOrder.orderNumber || editingOrder.id} • {editingOrder.customerName}</p>
              </div>
              <button
                onClick={() => setEditingOrder(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Quick Status Setter with Note */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block">Update Order Status</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={editingOrder.status}
                  onChange={(e) => handleUpdateStatus(editingOrder.id, e.target.value, newStatusNote)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-bold"
                >
                  {ORDER_STATUSES.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>

                <input
                  type="text"
                  placeholder="Optional status note for customer..."
                  value={newStatusNote}
                  onChange={(e) => setNewStatusNote(e.target.value)}
                  className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>

            {/* Status Timeline History */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Status History Timeline</span>
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {(editingOrder.statusHistory || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No previous status updates recorded.</p>
                ) : (
                  editingOrder.statusHistory?.map((h, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-white">{h.status}</span>
                        {h.note && <p className="text-[11px] text-slate-400 italic">{h.note}</p>}
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">{h.timestamp}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Payment & Verification Section */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block flex items-center justify-between">
                <span>Payment Verification & Proof Receipt</span>
                {getPaymentBadge(editingOrder)}
              </span>

              {editingOrder.isCodAdvanceRequired && (
                <div className="bg-amber-950/40 p-3.5 rounded-xl border border-amber-500/40 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-amber-300 font-bold">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>COD Advance Protection Applied</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
                    <div className="flex justify-between bg-slate-950/80 p-2 rounded-lg border border-amber-500/20">
                      <span>Advance Required / Paid:</span>
                      <span className="font-mono font-bold text-amber-300">
                        PKR {(editingOrder.codAdvanceAmountPaid || editingOrder.codAdvanceAmountRequired || 0).toLocaleString('en-PK')}
                      </span>
                    </div>
                    <div className="flex justify-between bg-slate-950/80 p-2 rounded-lg border border-amber-500/20">
                      <span>Remaining Balance (COD):</span>
                      <span className="font-mono font-bold text-emerald-400">
                        PKR {(editingOrder.codRemainingBalance || 0).toLocaleString('en-PK')}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Payment Method</label>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-white font-bold">
                    {editingOrder.paymentMethodName || 'Cash on Delivery'}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Transaction / Reference ID</label>
                  <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-mono font-bold">
                    {editingOrder.transactionReference || 'Not provided'}
                  </div>
                </div>
              </div>

              {editingOrder.paymentProofUrl ? (
                <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                      <ImageIcon className="w-4 h-4 text-blue-400" />
                      <span>{editingOrder.isCodAdvanceRequired ? 'Customer Advance Proof Screenshot' : 'Customer Payment Receipt Screenshot'}</span>
                    </span>
                    <button
                      onClick={() => setViewingProofOrder(editingOrder)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1 transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Expand / Full View</span>
                    </button>
                  </div>

                  <div 
                    onClick={() => setViewingProofOrder(editingOrder)}
                    className="relative cursor-pointer group rounded-xl overflow-hidden border border-slate-800 bg-slate-950 flex justify-center items-center max-h-56"
                  >
                    <img 
                      src={editingOrder.paymentProofUrl} 
                      alt="Payment proof receipt" 
                      className="max-h-56 w-auto object-contain rounded-xl transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-bold">
                      <Eye className="w-4 h-4" /> Click to Zoom
                    </div>
                  </div>

                  {/* Verification action buttons */}
                  <div className="flex gap-2 pt-2 border-t border-slate-800">
                    <button
                      onClick={() => handleVerifyPayment(editingOrder.id)}
                      className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>{editingOrder.isCodAdvanceRequired ? 'Approve Advance & Confirm Order' : 'Approve & Verify Payment'}</span>
                    </button>

                    <button
                      onClick={() => {
                        setViewingProofOrder(editingOrder);
                        setShowRejectInput(true);
                      }}
                      className="py-2 px-3 rounded-xl bg-rose-950/90 hover:bg-rose-900 border border-rose-600/50 text-rose-300 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-400 text-xs italic">
                  No payment screenshot uploaded for this order (Standard Cash on Delivery).
                </div>
              )}
            </div>

            {/* Delivery Estimation & Delay Configuration */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">Delivery & Tracking Preferences</span>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Estimated Delivery Days / Time</label>
                  <input
                    type="text"
                    defaultValue={editingOrder.estimatedDeliveryDays || '2-3 Business Days'}
                    id="edit_est_days"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-400 mb-1">Tracking Ref / Courier Code</label>
                  <input
                    type="text"
                    defaultValue={editingOrder.trackingReference || ''}
                    id="edit_tracking_ref"
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                    placeholder="e.g. TCS-94829"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label className="flex items-center gap-2 text-xs text-rose-300 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    defaultChecked={editingOrder.isDelayed || false}
                    id="edit_is_delayed"
                    className="rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-0"
                  />
                  <span>Mark Order as Delayed</span>
                </label>

                <input
                  type="text"
                  defaultValue={editingOrder.deliveryDelayNote || ''}
                  id="edit_delay_note"
                  placeholder="Delay Reason (e.g. Rain / Courier Backlog)..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
                />
              </div>

              <button
                onClick={() => {
                  const estDays = (document.getElementById('edit_est_days') as HTMLInputElement)?.value;
                  const trackingRef = (document.getElementById('edit_tracking_ref') as HTMLInputElement)?.value;
                  const isDelayed = (document.getElementById('edit_is_delayed') as HTMLInputElement)?.checked;
                  const delayNote = (document.getElementById('edit_delay_note') as HTMLInputElement)?.value;
                  handleSaveDeliveryAndDelay(editingOrder.id, estDays, trackingRef, isDelayed, delayNote);
                }}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-slate-950 font-black text-xs transition-all"
              >
                Save Delivery & Tracking Information
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL PAYMENT PROOF VIEWER & VERIFICATION MODAL */}
      {viewingProofOrder && (
        <div className="fixed inset-0 z-[120] bg-slate-950/90 backdrop-blur-md flex justify-center items-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full my-auto max-h-[95vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-bold text-white font-serif flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Payment Proof Verification</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Order #{viewingProofOrder.orderNumber || viewingProofOrder.id} • {viewingProofOrder.customerName} ({viewingProofOrder.phoneNumber || viewingProofOrder.customerPhone})
                </p>
              </div>

              <button
                onClick={() => {
                  setViewingProofOrder(null);
                  setShowRejectInput(false);
                }}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Order & Payment Summary Badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950 p-3.5 rounded-xl border border-slate-800">
              <div>
                <span className="text-[11px] text-slate-500 block">Total Order Value:</span>
                <span className="font-mono font-extrabold text-emerald-400 text-sm">
                  PKR {viewingProofOrder.grandTotal?.toLocaleString('en-PK')}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">Payment Type:</span>
                <span className="font-bold text-white">
                  {viewingProofOrder.isCodAdvanceRequired ? 'COD Advance Protection' : (viewingProofOrder.paymentMethodName || 'Direct Transfer')}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">Txn Reference:</span>
                <span className="font-mono text-cyan-300 font-bold">
                  {viewingProofOrder.transactionReference || 'N/A'}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block">Current Status:</span>
                {getPaymentBadge(viewingProofOrder)}
              </div>
            </div>

            {/* COD Advance Protection Highlight (if applicable) */}
            {viewingProofOrder.isCodAdvanceRequired && (
              <div className="bg-amber-950/40 p-4 rounded-xl border border-amber-500/40 text-xs space-y-2">
                <div className="flex items-center gap-2 text-amber-300 font-bold">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span>Cash on Delivery Advance Protection Details</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-amber-500/20">
                    <span className="text-[10px] text-slate-400 block">Advance Amount Transferred:</span>
                    <span className="font-mono font-bold text-amber-300 text-sm">
                      PKR {(viewingProofOrder.codAdvanceAmountPaid || viewingProofOrder.codAdvanceAmountRequired || 0).toLocaleString('en-PK')}
                    </span>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-amber-500/20">
                    <span className="text-[10px] text-slate-400 block">Remaining Balance (COD):</span>
                    <span className="font-mono font-bold text-emerald-400 text-sm">
                      PKR {(viewingProofOrder.codRemainingBalance || 0).toLocaleString('en-PK')}
                    </span>
                  </div>
                  <div className="bg-slate-950/80 p-2.5 rounded-lg border border-amber-500/20">
                    <span className="text-[10px] text-slate-400 block">Advance Channel:</span>
                    <span className="font-bold text-slate-200 text-xs truncate block">
                      {viewingProofOrder.paymentMethodName || 'Online Account'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Receipt Image Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>{viewingProofOrder.isCodAdvanceRequired ? 'Advance Payment Screenshot' : 'Payment Screenshot / Receipt'}</span>
                {viewingProofOrder.paymentProofUrl && (
                  <a 
                    href={viewingProofOrder.paymentProofUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-bold"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Full Image in New Tab</span>
                  </a>
                )}
              </div>

              {viewingProofOrder.paymentProofUrl ? (
                <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 flex justify-center items-center p-3">
                  <img 
                    src={viewingProofOrder.paymentProofUrl} 
                    alt="Customer Payment Receipt" 
                    className="max-h-[50vh] w-auto object-contain rounded-xl"
                  />
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs">
                  No payment proof uploaded.
                </div>
              )}
            </div>

            {/* Rejection Note Form (Conditional) */}
            {showRejectInput && (
              <div className="p-4 rounded-xl bg-rose-950/50 border border-rose-500/40 space-y-3">
                <span className="text-xs font-bold text-rose-300 block">Specify Rejection Reason:</span>
                
                {/* Quick Rejection Presets */}
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REJECTION_REASONS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setRejectionReason(preset)}
                      className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-[11px] border border-rose-700/50 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="e.g. Incomplete transaction, incorrect amount, blurry receipt..."
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full bg-slate-950 border border-rose-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-400"
                />
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowRejectInput(false)}
                    className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleRejectPayment(viewingProofOrder.id, rejectionReason)}
                    className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                  >
                    Confirm Rejection
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <a
                href={`https://wa.me/${(viewingProofOrder.phoneNumber || viewingProofOrder.customerPhone || '').replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Contact Customer on WhatsApp</span>
              </a>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => setShowRejectInput(!showRejectInput)}
                  className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-rose-900/60 border border-slate-700 hover:border-rose-600 text-rose-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Reject Payment</span>
                </button>

                <button
                  onClick={() => handleVerifyPayment(viewingProofOrder.id)}
                  className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950 transition-colors"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>
                    {viewingProofOrder.isCodAdvanceRequired 
                      ? 'Approve Advance Payment & Confirm Order' 
                      : 'Verify & Approve Payment'}
                  </span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
