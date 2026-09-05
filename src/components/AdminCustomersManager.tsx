import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  User, 
  Phone, 
  MapPin, 
  ShoppingBag, 
  DollarSign, 
  Calendar, 
  MessageSquare, 
  ChevronRight, 
  Filter, 
  CheckCircle2, 
  Clock, 
  XCircle,
  FileText
} from 'lucide-react';
import { CustomerOrder, CustomerProfile } from '../types';
import { loadStoredOrders } from '../utils/storage';
import { loadCustomerProfile } from '../utils/customerStorage';
import { fetchOrdersFromSupabase, isSupabaseConfigured } from '../services/supabaseService';

interface CustomerSummary {
  customerId: string;
  name: string;
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  area: string;
  address: string;
  totalOrders: number;
  activeOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  firstOrderDate: string;
  lastOrderDate: string;
  orders: CustomerOrder[];
}

interface AdminCustomersManagerProps {
  onShowToast: (message: string) => void;
}

export const AdminCustomersManager: React.FC<AdminCustomersManagerProps> = ({ onShowToast }) => {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerSummary | null>(null);

  useEffect(() => {
    let isMounted = true;
    const loadOrders = async () => {
      const local = loadStoredOrders();
      if (isMounted) setOrders(local);

      const dbOrders = await fetchOrdersFromSupabase();
      if (dbOrders !== null && Array.isArray(dbOrders)) {
        const orderMap = new Map<string, CustomerOrder>();
        (local || []).forEach(o => { if (o?.id) orderMap.set(String(o.id), o); });
        dbOrders.forEach(o => {
          if (o?.id) {
            const existing = orderMap.get(String(o.id));
            orderMap.set(String(o.id), { ...(existing || {}), ...o });
          }
        });
        const merged = Array.from(orderMap.values()).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        if (isMounted) setOrders(merged);
        return;
      }
    };
    loadOrders();
    return () => { isMounted = false; };
  }, []);

  // Group orders into unique customer records
  const customerMap = new Map<string, CustomerSummary>();

  // Include current local profile if saved
  const primaryProfile = loadCustomerProfile();
  if (primaryProfile && primaryProfile.customerId && (primaryProfile.fullName || primaryProfile.phoneNumber)) {
    const custKey = primaryProfile.customerId;
    customerMap.set(custKey, {
      customerId: primaryProfile.customerId,
      name: primaryProfile.fullName || 'Registered Customer',
      phone: primaryProfile.phoneNumber || 'N/A',
      whatsapp: primaryProfile.whatsappNumber || primaryProfile.phoneNumber || 'N/A',
      email: primaryProfile.email || 'N/A',
      city: primaryProfile.city || 'Lahore',
      area: primaryProfile.areaLocality || '',
      address: primaryProfile.completeAddress || '',
      totalOrders: 0,
      activeOrders: 0,
      deliveredOrders: 0,
      cancelledOrders: 0,
      totalSpent: 0,
      firstOrderDate: primaryProfile.createdAt || new Date().toISOString(),
      lastOrderDate: primaryProfile.createdAt || new Date().toISOString(),
      orders: []
    });
  }

  // Aggregate orders into customer summaries
  orders.forEach(o => {
    const rawKey = o.customerId || (o.phoneNumber ? `PHONE-${o.phoneNumber.replace(/\D/g, '')}` : `ORDER-${o.id}`);
    
    let summary = customerMap.get(rawKey);
    if (!summary) {
      // Check if matching phone existing
      for (const [k, v] of customerMap.entries()) {
        if (o.phoneNumber && v.phone && o.phoneNumber.replace(/\D/g, '') === v.phone.replace(/\D/g, '')) {
          summary = v;
          break;
        }
      }
    }

    if (!summary) {
      summary = {
        customerId: o.customerId || `ZFT-CUST-${1000 + customerMap.size + 1}`,
        name: o.customerName || 'Guest Customer',
        phone: o.phoneNumber || 'N/A',
        whatsapp: o.whatsappNumber || o.phoneNumber || 'N/A',
        email: o.email || 'N/A',
        city: o.city || 'Lahore',
        area: o.areaLocality || '',
        address: o.deliveryAddress || '',
        totalOrders: 0,
        activeOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0,
        totalSpent: 0,
        firstOrderDate: o.createdAt,
        lastOrderDate: o.createdAt,
        orders: []
      };
      customerMap.set(summary.customerId, summary);
    }

    // Update statistics
    summary.orders.push(o);
    summary.totalOrders += 1;
    if (o.status === 'Delivered') {
      summary.deliveredOrders += 1;
      summary.totalSpent += (o.grandTotal || 0);
    } else if (o.status === 'Cancelled') {
      summary.cancelledOrders += 1;
    } else {
      summary.activeOrders += 1;
      summary.totalSpent += (o.grandTotal || 0);
    }

    if (new Date(o.createdAt) < new Date(summary.firstOrderDate)) {
      summary.firstOrderDate = o.createdAt;
    }
    if (new Date(o.createdAt) > new Date(summary.lastOrderDate)) {
      summary.lastOrderDate = o.createdAt;
    }
  });

  const customerList = Array.from(customerMap.values());

  // Cities list
  const uniqueCities = Array.from(new Set(customerList.map(c => c.city).filter(Boolean)));

  const filteredCustomers = customerList.filter(c => {
    if (!c) return false;
    const q = (searchQuery || '').toLowerCase();
    const custId = (c.customerId || '').toLowerCase();
    const name = (c.name || '').toLowerCase();
    const phone = (c.phone || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const city = (c.city || '').toLowerCase();

    const matchesSearch = 
      custId.includes(q) ||
      name.includes(q) ||
      phone.includes(q) ||
      email.includes(q) ||
      city.includes(q);
    
    const matchesCity = cityFilter === 'all' || c.city === cityFilter;
    return matchesSearch && matchesCity;
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-serif font-bold text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            <span>Customer Directory & Lifetime Records</span>
          </h2>
          <p className="text-xs text-slate-400">
            Total {customerList.length} unique registered & guest buyers • Lifetime order history, addresses & WhatsApp contacts.
          </p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-xl border border-slate-800">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by Customer ID, Name, Phone, Email, or City..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">City Filter:</span>
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 font-medium"
          >
            <option value="all">All Cities</option>
            {uniqueCities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950 text-slate-400 font-semibold uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3.5 px-4">Customer ID & Name</th>
                <th className="py-3.5 px-4">Phone & WhatsApp</th>
                <th className="py-3.5 px-4">City / Location</th>
                <th className="py-3.5 px-4 text-center">Orders Summary</th>
                <th className="py-3.5 px-4 text-right">Lifetime Spent</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500 italic">
                    No customer profiles found. Orders placed by users will automatically populate customer directory.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(cust => (
                  <tr key={cust.customerId} className="hover:bg-slate-800/40 transition-colors">
                    
                    {/* ID & Name */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-0.5">
                        <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-500/30 text-blue-300 font-mono text-[10px] font-bold">
                          {cust.customerId}
                        </span>
                        <div className="font-bold text-white text-sm pt-1">{cust.name}</div>
                        {cust.email !== 'N/A' && (
                          <div className="text-[10px] text-slate-400">{cust.email}</div>
                        )}
                      </div>
                    </td>

                    {/* Phone */}
                    <td className="py-3.5 px-4 font-mono">
                      <div className="text-emerald-400 font-bold">{cust.phone}</div>
                      <a
                        href={`https://wa.me/${cust.whatsapp.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] text-blue-400 hover:underline inline-flex items-center gap-1 pt-0.5"
                      >
                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                        <span>Chat on WhatsApp</span>
                      </a>
                    </td>

                    {/* Location */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-200">{cust.city}</div>
                      <div className="text-[10px] text-slate-400 truncate max-w-xs">{cust.area || cust.address}</div>
                    </td>

                    {/* Orders Breakdown */}
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-1.5 font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-white font-bold" title="Total Orders">
                          {cust.totalOrders} Total
                        </span>
                        {cust.activeOrders > 0 && (
                          <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30" title="Active Orders">
                            {cust.activeOrders} Active
                          </span>
                        )}
                        <span className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30" title="Delivered">
                          {cust.deliveredOrders} ✓
                        </span>
                      </div>
                    </td>

                    {/* Lifetime Spent */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400 text-sm">
                      Rs. {(cust.totalSpent ?? 0).toLocaleString()}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => setSelectedCustomer(cust)}
                        className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white text-xs font-bold transition-all flex items-center gap-1 ml-auto"
                      >
                        <span>View Orders</span>
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Orders History Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[110] bg-slate-950/80 backdrop-blur-sm flex justify-center items-start sm:items-center p-3 sm:p-6 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full my-auto max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-white">{selectedCustomer.name}</h3>
                  <span className="px-2.5 py-0.5 rounded bg-blue-950 border border-blue-500/40 text-blue-300 font-mono text-xs font-bold">
                    {selectedCustomer.customerId}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {selectedCustomer.phone} • {selectedCustomer.city} • Lifetime Spent: <strong className="text-emerald-400">Rs. {(selectedCustomer.totalSpent ?? 0).toLocaleString()}</strong>
                </p>
              </div>

              <button
                onClick={() => setSelectedCustomer(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">
                Order Records ({selectedCustomer.orders.length})
              </h4>

              {selectedCustomer.orders.length === 0 ? (
                <p className="text-xs text-slate-500 italic">No orders recorded for this customer profile yet.</p>
              ) : (
                selectedCustomer.orders.map(order => (
                  <div key={order.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-300">#{order.orderNumber || order.id}</span>
                        <span className="text-slate-400">• {new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-200 font-bold">
                        {order.status}
                      </span>
                    </div>

                    <p className="text-slate-300">
                      Address: {order.deliveryAddress}, {order.areaLocality}, {order.city}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-800 font-mono font-bold text-slate-200">
                      <span>Total Amount:</span>
                      <span className="text-emerald-400">Rs. {(order.grandTotal ?? 0).toLocaleString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
