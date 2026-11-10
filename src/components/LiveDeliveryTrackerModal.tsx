import React from 'react';
import { 
  X, 
  MapPin, 
  Phone, 
  Package, 
  Store, 
  MessageSquare, 
  KeyRound, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { formatNaira } from '../services/marketplace';
import { useMarketplaceChat } from '../context/MarketplaceChatContext';
import { OrderStatus } from '../types';

export interface TrackerOrderData {
  id: string;
  orderNumber?: string;
  businessId: string;
  businessName: string;
  businessHostel?: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryAddress: string;
  phone: string;
  notes?: string;
  deliveryPin?: string;
  items?: Array<{ name?: string; productTitle?: string; quantity: number; price?: number; unitPrice?: number }>;
  createdAt?: string;
}

interface LiveDeliveryTrackerModalProps {
  order: TrackerOrderData | null;
  isOpen: boolean;
  onClose: () => void;
}

const ORDER_STEPS: Array<{ key: OrderStatus; label: string; desc: string }> = [
  { key: 'placed', label: 'Placed', desc: 'Order received by trader' },
  { key: 'accepted', label: 'Accepted', desc: 'Confirmed by trader' },
  { key: 'preparing', label: 'Preparing', desc: 'In production / packaged' },
  { key: 'in_transit', label: 'In Transit', desc: 'Hostel courier on route' },
  { key: 'delivered', label: 'Delivered', desc: 'Order handed over' },
];

export const LiveDeliveryTrackerModal: React.FC<LiveDeliveryTrackerModalProps> = ({
  order,
  isOpen,
  onClose,
}) => {
  const { openChatWithBusiness } = useMarketplaceChat();

  if (!isOpen || !order) return null;

  const currentStepIndex = order.status === 'cancelled'
    ? -1
    : ORDER_STEPS.findIndex((s) => s.key === order.status);

  const handleMessageTrader = async () => {
    try {
      onClose();
      await openChatWithBusiness(order.businessId, order.id);
    } catch (err) {
      console.error('Failed to open marketplace chat:', err);
    }
  };

  const displayOrderNumber = order.orderNumber || order.id.slice(0, 8);

  return (
    <div 
      className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative flex flex-col w-full max-w-lg rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden max-h-[92vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-5 py-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <Package className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Order #{displayOrderNumber}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase ${
                  order.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                  order.status === 'cancelled' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                  'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {order.status}
                </span>
              </div>
              <p className="text-[11px] text-neutral-400 font-mono">
                {order.businessName}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          
          {/* DELIVERY PIN DISPLAY (Glovo/Jumia model) */}
          {order.deliveryPin && order.status !== 'cancelled' && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-neutral-900 border border-amber-500/40 space-y-1.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  <span className="text-xs font-bold text-white">Your Delivery PIN</span>
                </div>
                <span className="font-mono text-xl font-black tracking-widest text-amber-400 px-3.5 py-1 rounded-xl bg-neutral-950 border border-amber-500/30 shadow-inner">
                  {order.deliveryPin}
                </span>
              </div>
              <p className="text-xs text-amber-300 font-medium">
                Give this PIN to the trader only when you have received your order.
              </p>
            </div>
          )}

          {/* Status Timeline */}
          {order.status === 'cancelled' ? (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
              <strong className="block font-bold">This Order Was Cancelled</strong>
              <p className="text-[11px] text-rose-400/80">
                The order could not be fulfilled and has been closed.
              </p>
            </div>
          ) : (
            <div className="space-y-2 p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
              <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Status Timeline</h5>
              <div className="grid grid-cols-5 gap-1 pt-2">
                {ORDER_STEPS.map((step, idx) => {
                  const isCompleted = currentStepIndex >= idx;
                  const isCurrent = currentStepIndex === idx;

                  return (
                    <div key={step.key} className="flex flex-col items-center text-center space-y-1.5">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                        isCurrent
                          ? 'bg-amber-500 text-neutral-950 ring-4 ring-amber-500/30 font-black'
                          : isCompleted
                          ? 'bg-emerald-500 text-neutral-950'
                          : 'bg-neutral-800 text-neutral-500'
                      }`}>
                        {isCompleted && !isCurrent ? '✓' : idx + 1}
                      </div>
                      <span className={`text-[10px] font-bold truncate max-w-full ${
                        isCurrent ? 'text-amber-400' : isCompleted ? 'text-neutral-200' : 'text-neutral-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Order Details & Items */}
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Order Items</h5>
            <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
              {(order.items || []).map((item, idx) => {
                const title = item.productTitle || item.name || 'Campus Item';
                const unitPrice = item.unitPrice || item.price || 0;
                return (
                  <div key={idx} className="flex items-center justify-between text-neutral-300">
                    <span>{item.quantity}x {title}</span>
                    <span className="font-mono text-neutral-400">{formatNaira(unitPrice * item.quantity)}</span>
                  </div>
                );
              })}

              <div className="pt-2 mt-2 border-t border-neutral-800 flex items-center justify-between font-bold">
                <span className="text-white">Total Amount</span>
                <span className="text-amber-400 font-mono text-sm">{formatNaira(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Contact Info */}
          <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-neutral-300">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Hostel: <strong>{order.deliveryAddress}</strong></span>
            </div>
            <div className="flex items-center gap-2 text-neutral-300">
              <Phone className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Contact: <strong>{order.phone}</strong></span>
            </div>
            {order.notes && (
              <p className="text-[11px] text-neutral-400 pt-1">
                Note: {order.notes}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-neutral-800 bg-neutral-950 flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleMessageTrader}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-400 text-xs font-bold transition-colors cursor-pointer"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Message Trader</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="py-3 px-6 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
