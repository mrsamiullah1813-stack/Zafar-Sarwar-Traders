import React, { useState } from 'react';
import { 
  X, 
  User, 
  Package, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Truck, 
  MessageSquare, 
  ChevronRight, 
  Building, 
  Edit3, 
  Save, 
  Plus, 
  ShieldAlert, 
  ExternalLink,
  ShoppingBag,
  ArrowLeft
} from 'lucide-react';
import { CustomerProfile, CustomerOrder, BusinessConfig } from '../types';
import { saveCustomerProfile } from '../utils/customerStorage';

interface CustomerAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: CustomerProfile;
  orders: CustomerOrder[];
  config: BusinessConfig;
  onUpdateProfile: (updated: CustomerProfile) => void;
}

const ORDER_TIMELINE_STEPS = [
  'Order Received',
  'Confirmed',
  'Preparing',
  'Packed',
  'Ready for Dispatch',
  'Shipped',
  'On The Way',
  'Out for Delivery',
  'Delivered'
];

export const CustomerAccountModal: React.FC<CustomerAccountModalProps> = ({
  isOpen,
  onClose,
  profile,
  orders,
  config,
  onUpdateProfile
}) => {
  const [activeTab, setActiveTab] = useState<'orders' | 'profile' | 'addresses'>('orders');
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState<CustomerProfile>({ ...profile });
  const [orderFilter, setOrderFilter] = useState<'all' | 'active' | 'delivered' | 'cancelled'>('all');

  if (!isOpen) return null;

  // Filter orders isolating only those for this customer
  const myOrders = orders.filter(o => {
    if (o.customerId && profile.customerId && o.customerId === profile.customerId) return true;
    if (profile.phoneNumber && o.phoneNumber) {
      const clean1 = profile.phoneNumber.replace(/\D/g, '');
      const clean2 = o.phoneNumber.replace(/\D/g, '');
      return clean1.length >= 7 && clean1 === clean2;
    }
    return false;
  });

  const filteredOrders = myOrders.filter(o => {
    if (orderFilter === 'active') return !['Delivered', 'Cancelled'].includes(o.status);
    if (orderFilter === 'delivered') return o.status === 'Delivered';
    if (orderFilter === 'cancelled') return o.status === 'Cancelled';
    return true;
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomerProfile(profileForm);
    onUpdateProfile(profileForm);
    setIsEditingProfile(false);
  };

  const getStatusIndex = (status: string) => {
    const norm = status.toLowerCase();
    if (norm.includes('received') || norm.includes('pending')) return 0;
    if (norm.includes('confirm')) return 1;
    if (norm.includes('prepar') || norm.includes('process')) return 2;
    if (norm.includes('pack')) return 3;
    if (norm.includes('ready')) return 4;
    if (norm.includes('ship')) return 5;
    if (norm.includes('way')) return 6;
    if (norm.includes('out')) return 7;
    if (norm.includes('deliver')) return 8;
    return 1;
  };

  const handleWhatsAppOrderInquiry = (order: CustomerOrder) => {
    const rawPhone = config.whatsapp || config.phone || '923001234567';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const message = encodeURIComponent(
      `Hello ${config.name || 'Zafar Sarwar Traders'},\n\nI want an update about my Order #${order.orderNumber || order.id}.\nCustomer ID: ${profile.customerId}\nName: ${profile.fullName || order.customerName}\nCurrent Status: ${order.status}\n\nThank you!`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-cyan-400 font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-serif">Customer Portal</h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-950 border border-blue-500/40 text-blue-300 font-mono text-xs font-bold">
                  {profile.customerId}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {profile.fullName ? `Welcome back, ${profile.fullName}` : 'Manage your orders & delivery details'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-5 pt-3 border-b border-slate-800 bg-slate-950/40">
          <button
            onClick={() => { setActiveTab('orders'); setSelectedOrder(null); }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'orders'
                ? 'border-blue-500 text-blue-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>My Orders ({myOrders.length})</span>
          </button>

          <button
            onClick={() => { setActiveTab('profile'); setSelectedOrder(null); }}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Account Profile</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-200">
          
          {/* TAB 1: ORDERS & TRACKING */}
          {activeTab === 'orders' && (
            <div>
              {!selectedOrder ? (
                <div className="space-y-6">
                  {/* Order Filter Pills */}
                  <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      {(['all', 'active', 'delivered', 'cancelled'] as const).map(filter => (
                        <button
                          key={filter}
                          onClick={() => setOrderFilter(filter)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${
                            orderFilter === filter
                              ? 'bg-blue-600 text-white shadow-md'
                              : 'bg-slate-800/80 text-slate-400 hover:text-white'
                          }`}
                        >
                          {filter === 'all' ? 'All Orders' : filter}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Orders List */}
                  {filteredOrders.length === 0 ? (
                    <div className="py-12 text-center space-y-3 bg-slate-950/40 rounded-2xl border border-slate-800/60 p-6">
                      <ShoppingBag className="w-12 h-12 mx-auto text-slate-600" />
                      <h3 className="text-base font-bold text-slate-300">No Orders Found</h3>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        {orderFilter === 'all' 
                          ? 'You haven\'t placed any orders yet. Browse our catalog and place your first order!'
                          : `No ${orderFilter} orders matched your criteria.`}
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {filteredOrders.map(order => (
                        <div
                          key={order.id}
                          className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 hover:border-blue-500/50 transition-all shadow-md space-y-4"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white font-mono">
                                  #{order.orderNumber || order.id}
                                </span>
                                <span className="text-xs text-slate-400">
                                  • {new Date(order.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-400">
                                {order.items?.length || 0} Item(s) • Total: <span className="text-cyan-400 font-bold">Rs. {(order.grandTotal ?? 0).toLocaleString()}</span>
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                order.status === 'Delivered' 
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' 
                                  : order.status === 'Cancelled'
                                  ? 'bg-red-950 text-red-400 border border-red-500/40'
                                  : 'bg-blue-950 text-cyan-300 border border-cyan-500/40'
                              }`}>
                                {order.status}
                              </span>

                              <button
                                onClick={() => setSelectedOrder(order)}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-blue-600 text-white text-xs font-bold transition-all flex items-center gap-1"
                              >
                                <span>Track Order</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Quick Delivery Preview */}
                          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2 text-slate-300">
                              <MapPin className="w-4 h-4 text-slate-400" />
                              <span>{order.city}, {order.areaLocality || order.deliveryAddress}</span>
                            </div>
                            {order.estimatedDeliveryDate && (
                              <div className="flex items-center gap-1.5 text-slate-400">
                                <Clock className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Estimated Arrival: <strong className="text-white">{order.estimatedDeliveryDate}</strong></span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* SELECTED ORDER DETAILED TRACKING VIEW */
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Back button */}
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Orders List</span>
                  </button>

                  {/* Delay Warning Banner if flagged */}
                  {selectedOrder.isDelayed && (
                    <div className="p-4 rounded-2xl bg-amber-950/60 border border-amber-500/40 text-amber-200 text-xs space-y-1 flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-sm font-bold text-amber-300">Delivery Delayed Notice</strong>
                        <p>
                          {selectedOrder.delayReason || 'Your order has been delayed. Our logistics team is working to expedite delivery and will update you shortly.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Order Top Summary Card */}
                  <div className="p-6 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-4">
                    <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-800/80 pb-4">
                      <div>
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Order Tracking Number</span>
                        <h3 className="text-xl font-bold font-mono text-cyan-300">#{selectedOrder.orderNumber || selectedOrder.id}</h3>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleWhatsAppOrderInquiry(selectedOrder)}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-all"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Ask About Delivery on WhatsApp</span>
                        </button>
                      </div>
                    </div>

                    {/* Timeline Visual */}
                    <div className="py-4 space-y-3">
                      <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Live Order Timeline</h4>
                      
                      {/* Desktop Horizontal Timeline */}
                      <div className="hidden md:flex items-center justify-between relative py-2">
                        {ORDER_TIMELINE_STEPS.map((stepName, idx) => {
                          const currentIdx = getStatusIndex(selectedOrder.status);
                          const isDone = idx <= currentIdx;
                          const isCurrent = idx === currentIdx;

                          return (
                            <div key={stepName} className="flex-1 text-center relative group">
                              <div className={`w-7 h-7 mx-auto rounded-full flex items-center justify-center font-bold text-xs transition-all z-10 relative ${
                                isCurrent
                                  ? 'bg-cyan-500 text-slate-950 ring-4 ring-cyan-500/30'
                                  : isDone
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-800 text-slate-500 border border-slate-700'
                              }`}>
                                {isDone ? <CheckCircle2 className="w-4 h-4 stroke-[3]" /> : idx + 1}
                              </div>
                              <span className={`block text-[10px] mt-2 font-medium leading-tight ${
                                isCurrent ? 'text-cyan-300 font-bold' : isDone ? 'text-slate-200' : 'text-slate-500'
                              }`}>
                                {stepName}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Mobile Vertical Timeline */}
                      <div className="md:hidden space-y-3 border-l-2 border-slate-800 pl-4 ml-2">
                        {ORDER_TIMELINE_STEPS.map((stepName, idx) => {
                          const currentIdx = getStatusIndex(selectedOrder.status);
                          const isDone = idx <= currentIdx;
                          const isCurrent = idx === currentIdx;

                          return (
                            <div key={stepName} className="relative flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                                isCurrent
                                  ? 'bg-cyan-400 text-slate-950 ring-2 ring-cyan-400/40'
                                  : isDone
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-800 text-slate-600'
                              }`}>
                                {isDone ? '✓' : idx + 1}
                              </div>
                              <span className={`text-xs ${isCurrent ? 'text-cyan-300 font-bold' : isDone ? 'text-slate-200' : 'text-slate-500'}`}>
                                {stepName}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Delivery Information Box */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Delivery Address & Contact
                        </span>
                        <p className="text-xs font-bold text-white">{selectedOrder.customerName}</p>
                        <p className="text-xs text-slate-300">{selectedOrder.deliveryAddress}</p>
                        <p className="text-xs text-slate-400">{selectedOrder.areaLocality}, {selectedOrder.city}</p>
                        <p className="text-xs text-cyan-400 font-mono pt-1">Phone: {selectedOrder.phoneNumber}</p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                          Expected Delivery Schedule
                        </span>
                        <div className="text-xs space-y-1">
                          <p className="text-slate-300">
                            Estimated Date: <strong className="text-white">{selectedOrder.estimatedDeliveryDate || '2-4 Business Days'}</strong>
                          </p>
                          <p className="text-slate-300">
                            Time Window: <strong className="text-white">{selectedOrder.estimatedDeliveryTime || '10:00 AM – 6:00 PM'}</strong>
                          </p>
                          {selectedOrder.trackingReference && (
                            <p className="text-slate-300 pt-1">
                              Courier Reference: <span className="text-cyan-300 font-mono">{selectedOrder.trackingReference}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Products Purchased Table */}
                    <div className="space-y-2 pt-2">
                      <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Order Items</h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {selectedOrder.items?.map((item, idx) => (
                          <div key={item.productId || idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-900/90 border border-slate-800/80 text-xs">
                            <div className="flex items-center gap-3">
                              <img src={item.image || 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=200'} alt={item.productName} className="w-10 h-10 object-contain bg-slate-950 rounded-lg p-1 border border-slate-800" />
                              <div>
                                <p className="font-bold text-white">{item.productName}</p>
                                <p className="text-[10px] text-slate-400">Qty: {item.quantity} × Rs. {(item.numericPrice ?? 0).toLocaleString()}</p>
                              </div>
                            </div>
                            <span className="font-bold text-cyan-300">Rs. {((item.numericPrice || 0) * (item.quantity || 1)).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>

                      <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs font-bold">
                        <span>Grand Total</span>
                        <span className="text-sm text-cyan-400 font-bold">Rs. {(selectedOrder.grandTotal ?? 0).toLocaleString()}</span>
                      </div>
                    </div>

                  </div>

                </div>
              )}
            </div>
          )}

          {/* TAB 2: PROFILE DETAILS */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white">Customer Account Profile</h3>
                  <p className="text-xs text-slate-400">Update your primary delivery contact and personal details</p>
                </div>

                {!isEditingProfile && (
                  <button
                    onClick={() => setIsEditingProfile(true)}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2 transition-all"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Profile</span>
                  </button>
                )}
              </div>

              {isEditingProfile ? (
                <form onSubmit={handleSaveProfile} className="space-y-4 bg-slate-950/60 p-5 rounded-2xl border border-slate-800">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Full Name</label>
                      <input
                        type="text"
                        value={profileForm.fullName}
                        onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={profileForm.phoneNumber}
                        onChange={(e) => setProfileForm({ ...profileForm, phoneNumber: e.target.value })}
                        required
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">WhatsApp Number</label>
                      <input
                        type="text"
                        value={profileForm.whatsappNumber || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, whatsappNumber: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Email Address</label>
                      <input
                        type="email"
                        value={profileForm.email || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">City</label>
                      <input
                        type="text"
                        value={profileForm.city || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, city: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Area / Locality</label>
                      <input
                        type="text"
                        value={profileForm.areaLocality || ''}
                        onChange={(e) => setProfileForm({ ...profileForm, areaLocality: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Complete Address</label>
                    <textarea
                      rows={2}
                      value={profileForm.completeAddress || ''}
                      onChange={(e) => setProfileForm({ ...profileForm, completeAddress: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save Profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingProfile(false)}
                      className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Customer ID</span>
                    <p className="text-sm font-bold font-mono text-cyan-400">{profile.customerId}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Full Name</span>
                    <p className="text-sm font-bold text-white">{profile.fullName || 'Not provided'}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Phone & WhatsApp</span>
                    <p className="text-sm font-semibold text-slate-200">{profile.phoneNumber || 'Not provided'}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">City & Location</span>
                    <p className="text-sm font-semibold text-slate-200">{profile.city || 'Lahore'}, {profile.areaLocality || ''}</p>
                  </div>

                  <div className="md:col-span-2 p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
                    <span className="text-[11px] font-bold text-slate-500 uppercase">Primary Shipping Address</span>
                    <p className="text-xs text-slate-300">{profile.completeAddress || 'No primary address set yet.'}</p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
