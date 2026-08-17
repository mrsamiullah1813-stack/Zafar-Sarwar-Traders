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
  Plus
} from 'lucide-react';
import { CustomerOrder, CheckoutSettings } from '../types';
import { loadStoredOrders, saveStoredOrders, loadCheckoutSettings, saveCheckoutSettings } from '../utils/storage';
import { fetchOrdersFromSupabase, updateOrderStatusInSupabase, isSupabaseConfigured } from '../services/supabaseService';
import { supabase } from '../lib/supabase';

interface AdminOrdersManagerProps {
  onShowToast: (message: string) => void;
}

export const ORDER_STATUSES = [
  'Order Received',
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

export const AdminOrdersManager: React.FC<AdminOrdersManagerProps> = ({ onShowToast }) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'settings'>('orders');
  const [orders, setOrders] = useState<CustomerOrder[]>(loadStoredOrders());
  const [settings, setSettings] = useState<CheckoutSettings>(loadCheckoutSettings());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');

  // Editing order details state
  const [editingOrder, setEditingOrder] = useState<CustomerOrder | null>(null);
  const [newStatusNote, setNewStatusNote] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadOrders = async () => {
      if (isMounted) setSettings(loadCheckoutSettings());
      if (isSupabaseConfigured) {
        const dbOrders = await fetchOrdersFromSupabase();
        if (dbOrders !== null) {
          if (isMounted) {
            setOrders(dbOrders);
            saveStoredOrders(dbOrders);
          }
          return;
        }
      }
      if (isMounted) setOrders(loadStoredOrders());
    };
    loadOrders();
    return () => { isMounted = false; };
  }, []);

  const uniqueCities = Array.from(new Set(orders.map(o => o.city).filter(Boolean)));

  const handleUpdateStatus = async (orderId: string, newStatus: string, note?: string) => {
    if (isSupabaseConfigured) {
      const res = await updateOrderStatusInSupabase(orderId, newStatus as any, note);
      if (!res.success) {
        onShowToast(`Failed to update order in Supabase: ${res.error || 'Database error'}`);
        return;
      }
    }

    const nowStr = new Date().toLocaleString('en-PK', { dateStyle: 'medium', timeStyle: 'short' });
    const updated = orders.map(o => {
      if (o.id === orderId) {
        const existingHistory = o.statusHistory || [];
        const newHistoryItem = {
          status: newStatus,
          timestamp: nowStr,
          note: note || `Status updated to ${newStatus} by Admin`,
          updatedBy: 'Admin'
        };
        return {
          ...o,
          status: newStatus as any,
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
    onShowToast(`Order #${orderId.slice(-6)} status updated to "${newStatus}"`);
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
      if (isSupabaseConfigured) {
        await supabase.from('order_items').delete().eq('order_id', orderId);
        const { error } = await supabase.from('orders').delete().eq('id', orderId);
        if (error) {
          onShowToast(`Failed to delete order from Supabase: ${error.message}`);
          return;
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
    
    let matchesDate = true;
    if (dateFilter) {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      matchesDate = orderDate === dateFilter;
    }

    return matchesSearch && matchesStatus && matchesCity && matchesDate;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Order Received':
      case 'New':
      case 'Pending':
        return <span className="px-2.5 py-1 rounded-full bg-blue-950/90 border border-blue-500/40 text-blue-300 text-xs font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Order Received</span>;
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

  return (
    <div className="space-y-6">
      
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-400" />
            <span>Order Management & Cart Rules</span>
          </h2>
          <p className="text-xs text-slate-400">
            View orders, search by ID, customer name, phone, city, or date, and edit order tracking & status history.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Customer Orders ({orders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
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
          
          {/* Controls: Search, Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
            <div className="relative">
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
                <option value="all">All Statuses</option>
                {ORDER_STATUSES.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
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

                  {/* Order Summary Total */}
                  <div className="flex justify-end pt-1">
                    <div className="w-full sm:w-72 bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal:</span>
                        <span className="font-mono text-slate-200">PKR {order.subtotal?.toLocaleString('en-PK')}</span>
                      </div>
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

                </div>
              ))}
            </div>
          )}

        </div>
      ) : (
        /* CHECKOUT SETTINGS FORM */
        <form onSubmit={handleSaveSettings} className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 space-y-6 max-w-2xl">
          <div className="border-b border-slate-800 pb-4">
            <h3 className="text-lg font-bold font-serif text-white flex items-center gap-2">
              <Settings className="w-5 h-5 text-blue-400" />
              <span>Cart & Checkout Rules Configuration</span>
            </h3>
            <p className="text-xs text-slate-400">Configure standard delivery fees, free shipping thresholds, taxes, and checkout WhatsApp numbers.</p>
          </div>

          <div className="space-y-4">
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
              <span className="text-[11px] text-slate-500 mt-1 block">Orders equal to or exceeding this total get free delivery automatically.</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Store WhatsApp Number (+92 310 8002863)</label>
              <input
                type="text"
                value={settings.whatsappNumber || '+92 310 8002863'}
                onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Cart & Checkout Settings</span>
            </button>
          </div>
        </form>
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

    </div>
  );
};
