import React, { useState, useEffect } from 'react';
import { Search, PackageCheck, Clock, CheckCircle2, Truck, ShieldCheck, AlertCircle, Calendar, MapPin, Phone, User, ShoppingBag, X, ChevronRight, FileText, Lock } from 'lucide-react';
import { CustomerOrder, OrderStatus } from '../types';
import { loadStoredOrders } from '../utils/storage';
import { fetchOrdersFromSupabase, isSupabaseConfigured } from '../services/supabaseService';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string;
}

const ORDER_STEPS: { status: OrderStatus; label: string; desc: string }[] = [
  { status: 'Order Received', label: 'Order Received', desc: 'Order logged & placed successfully' },
  { status: 'Confirmed', label: 'Confirmed', desc: 'Verified by shop management' },
  { status: 'Preparing', label: 'Preparing', desc: 'Packing & quality inspection at warehouse' },
  { status: 'Ready for Delivery', label: 'Ready for Dispatch', desc: 'Handed to courier / delivery fleet' },
  { status: 'Out for Delivery', label: 'Out for Delivery', desc: 'Courier agent on the way to your address' },
  { status: 'Delivered', label: 'Delivered', desc: 'Package delivered to customer' },
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  initialOrderId = ''
}) => {
  const [inputOrderId, setInputOrderId] = useState(initialOrderId);
  const [inputPhoneDigits, setInputPhoneDigits] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<CustomerOrder | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (initialOrderId) {
      setInputOrderId(initialOrderId);
      handlePerformSearch(initialOrderId);
    }
  }, [initialOrderId, isOpen]);

  const handlePerformSearch = async (orderIdToSearch?: string) => {
    const rawId = (orderIdToSearch || inputOrderId).trim();
    if (!rawId) {
      setErrorMessage('Please enter a valid Order ID (e.g. ZFT-1025 or ZST-00001).');
      return;
    }

    setErrorMessage(null);
    setHasSearched(true);

    const orders = loadStoredOrders();
    const cleanQuery = rawId.replace('#', '').toLowerCase();

    let found = orders.find(o => {
      const cleanOrder = (o.id || '').replace('#', '').toLowerCase();
      return cleanOrder === cleanQuery || cleanOrder.includes(cleanQuery);
    });

    if (!found && isSupabaseConfigured) {
      const dbOrders = await fetchOrdersFromSupabase();
      if (dbOrders) {
        found = dbOrders.find(o => {
          const cleanOrder = (o.id || '').replace('#', '').toLowerCase();
          return cleanOrder === cleanQuery || cleanOrder.includes(cleanQuery);
        });
      }
    }

    // Phone number verification check if user supplied phone digits
    if (found && inputPhoneDigits.trim()) {
      const cleanInputPhone = inputPhoneDigits.replace(/\D/g, '');
      const cleanOrderPhone = (found.phoneNumber || '').replace(/\D/g, '');
      if (cleanInputPhone.length >= 4 && !cleanOrderPhone.endsWith(cleanInputPhone) && !cleanInputPhone.endsWith(cleanOrderPhone.slice(-7))) {
        setErrorMessage('Phone number verification failed for this Order ID.');
        setSearchedOrder(null);
        return;
      }
    }

    if (found) {
      setSearchedOrder(found);
    } else {
      setSearchedOrder(null);
    }
  };

  const getStepIndex = (status: OrderStatus): number => {
    switch (status) {
      case 'Order Received':
      case 'New':
      case 'Pending':
        return 0;
      case 'Confirmed':
      case 'Processing':
        return 1;
      case 'Preparing':
        return 2;
      case 'Ready for Delivery':
        return 3;
      case 'Out for Delivery':
        return 4;
      case 'Delivered':
        return 5;
      default:
        return 0;
    }
  };

  if (!isOpen) return null;

  const currentStepIdx = searchedOrder ? getStepIndex(searchedOrder.status) : -1;
  const isCancelled = searchedOrder?.status === 'Cancelled';
  const isOnHold = searchedOrder?.status === 'On Hold';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* MODAL HEADER */}
        <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center border border-blue-500/30">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black uppercase tracking-tight font-serif text-white">
                Live Order Status Tracking
              </h2>
              <p className="text-[11px] text-slate-400">
                Track real-time progress, estimated delivery & status history
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SEARCH FORM */}
        <div className="p-5 sm:p-6 bg-slate-50 border-b border-slate-200">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2 font-mono">
            Enter Your Order ID & Mobile Number (Verification)
          </label>

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handlePerformSearch();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                value={inputOrderId}
                onChange={(e) => setInputOrderId(e.target.value)}
                placeholder="e.g. ZFT-1025 or ZST-00001"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm uppercase"
              />
            </div>

            <div className="relative flex-1">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="tel"
                value={inputPhoneDigits}
                onChange={(e) => setInputPhoneDigits(e.target.value)}
                placeholder="Phone Number (Verification)"
                className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white border border-slate-300 text-xs font-mono font-bold text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 shadow-sm"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2"
            >
              <PackageCheck className="w-4 h-4" />
              <span>Track Order</span>
            </button>
          </form>

          {errorMessage && (
            <p className="text-xs text-rose-600 font-medium mt-2 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{errorMessage}</span>
            </p>
          )}
        </div>

        {/* TRACKING CONTENT RESULTS */}
        <div className="p-5 sm:p-6 max-h-[65vh] overflow-y-auto space-y-6">
          
          {hasSearched && !searchedOrder && (
            <div className="text-center py-10 space-y-3">
              <div className="w-16 h-16 mx-auto rounded-full bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
                <AlertCircle className="w-8 h-8" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">
                Order ID Not Found
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                No active order matched "{inputOrderId}". Please double check your receipt or WhatsApp order confirmation message.
              </p>
            </div>
          )}

          {searchedOrder && (
            <div className="space-y-6">
              
              {/* ORDER SUMMARY CARD */}
              <div className="p-5 rounded-2xl bg-slate-900 text-white flex flex-wrap items-center justify-between gap-4 border border-slate-800 shadow-lg">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">
                      Order ID
                    </span>
                    <span className="text-base font-black font-mono text-white">
                      #{searchedOrder.id}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>Placed on: {new Date(searchedOrder.createdAt).toLocaleString()}</span>
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-0.5">
                    Current Status
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wide inline-block ${
                    isCancelled ? 'bg-rose-950 text-rose-300 border border-rose-500/40' :
                    isOnHold ? 'bg-amber-950 text-amber-300 border border-amber-500/40' :
                    searchedOrder.status === 'Delivered' ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40' :
                    'bg-blue-950 text-blue-300 border border-blue-500/40'
                  }`}>
                    {searchedOrder.status}
                  </span>
                </div>
              </div>

              {/* ESTIMATED DELIVERY NOTICE & ADMIN DELAY NOTES */}
              {(searchedOrder.estimatedDeliveryDays || searchedOrder.deliveryDelayNote) && (
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Estimated Delivery: {searchedOrder.estimatedDeliveryDays || '1–3 Working Days'}</span>
                  </div>
                  {searchedOrder.deliveryDelayNote && (
                    <p className="text-xs text-blue-800 font-medium pl-6">
                      ⚠️ Note: {searchedOrder.deliveryDelayNote}
                    </p>
                  )}
                </div>
              )}

              {/* SPECIAL STATUS NOTICE (CANCELLED / ON HOLD) */}
              {isCancelled && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                  <span>This order was cancelled. Please contact customer support on WhatsApp for queries.</span>
                </div>
              )}

              {isOnHold && (
                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>This order is currently on hold. Our team is reviewing item availability or delivery address verification.</span>
                </div>
              )}

              {/* VISUAL STATUS TIMELINE */}
              {!isCancelled && (
                <div className="p-5 rounded-3xl bg-slate-50 border border-slate-200 space-y-4">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800 font-mono">
                    Order Timeline & Status Progress
                  </h3>

                  <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {ORDER_STEPS.map((step, idx) => {
                      const isCompleted = idx <= currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      // Find timestamp if stored in statusHistory
                      const historyItem = searchedOrder.statusHistory?.find(h => h.status === step.status);

                      return (
                        <div key={idx} className="relative flex items-start gap-4">
                          <div className={`absolute -left-6 top-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isCompleted
                              ? 'bg-emerald-600 border-emerald-600 text-white'
                              : 'bg-white border-slate-300 text-transparent'
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-xs font-bold ${
                                isCurrent ? 'text-blue-700 font-black' : isCompleted ? 'text-slate-900' : 'text-slate-400'
                              }`}>
                                {step.label}
                              </h4>
                              {historyItem && (
                                <span className="text-[10px] text-slate-400 font-mono">
                                  {historyItem.timestamp}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {step.desc}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ORDER ITEMS BREAKDOWN & SHIPPING ADDRESS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* ITEMS LIST */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-blue-600" />
                    <span>Ordered Items ({searchedOrder.items.length})</span>
                  </h4>

                  <div className="space-y-2.5 divide-y divide-slate-100">
                    {searchedOrder.items.map((item, i) => (
                      <div key={i} className="pt-2 first:pt-0 flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          {item.image && (
                            <img src={item.image} alt={item.productName} className="w-9 h-9 rounded-lg object-cover border" />
                          )}
                          <div>
                            <p className="font-bold text-slate-900 line-clamp-1">{item.productName}</p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              Qty: {item.quantity} × {item.unitPrice}
                              {item.selectedVariant && ` • ${item.selectedVariant}`}
                              {item.selectedShade && ` • Shade: ${item.selectedShade}`}
                            </p>
                          </div>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          Rs {item.lineTotal.toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 text-xs font-mono font-bold flex justify-between">
                    <span>Grand Total</span>
                    <span className="text-blue-700">Rs {searchedOrder.grandTotal.toLocaleString()}</span>
                  </div>
                </div>

                {/* DESTINATION ADDRESS */}
                <div className="p-4 rounded-2xl bg-white border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 font-mono flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delivery Destination</span>
                  </h4>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2 font-bold text-slate-900">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{searchedOrder.customerName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-600">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{searchedOrder.phoneNumber}</span>
                    </div>

                    <div className="flex items-start gap-2 text-slate-600">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{searchedOrder.deliveryAddress}, {searchedOrder.areaLocality || ''} {searchedOrder.city}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
