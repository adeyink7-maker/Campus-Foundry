import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  ShoppingBag, 
  Package, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Star, 
  KeyRound, 
  RefreshCw,
  MapPin,
  Phone,
  Building2
} from 'lucide-react';
import { MarketplaceOrder, OrderStatus } from '../types';
import { 
  fetchMyOrders, 
  updateOrderStatus, 
  createReview, 
  formatNaira, 
  subscribeToMyOrders,
  isSupabaseConfigured,
  mapMarketplaceError
} from '../services/marketplace';
import { useAuth } from '../context/AuthContext';
import { useMarketplaceChat } from '../context/MarketplaceChatContext';

interface MyOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialOrderId?: string | null;
}

const ORDER_STEPS: Array<{ key: OrderStatus; label: string; desc: string }> = [
  { key: 'placed', label: 'Placed', desc: 'Order sent to trader' },
  { key: 'accepted', label: 'Accepted', desc: 'Trader confirmed order' },
  { key: 'preparing', label: 'Preparing', desc: 'Item being prepared' },
  { key: 'in_transit', label: 'In Transit', desc: 'Out for hostel delivery' },
  { key: 'delivered', label: 'Delivered', desc: 'Successfully delivered' },
];

export const MyOrdersModal: React.FC<MyOrdersModalProps> = ({ isOpen, onClose, initialOrderId }) => {
  const { currentUser } = useAuth();
  const { openChatWithBusiness } = useMarketplaceChat();

  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(initialOrderId || null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Review Form State
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewedOrderIds, setReviewedOrderIds] = useState<Set<string>>(new Set());

  const loadOrders = useCallback(async () => {
    if (!isSupabaseConfigured || !currentUser) {
      setOrders([]);
      return;
    }
    try {
      setIsLoading(true);
      setErrorMessage(null);
      const data = await fetchMyOrders();
      setOrders(data);
      if (initialOrderId && !selectedOrderId) {
        setSelectedOrderId(initialOrderId);
      }
    } catch (err: unknown) {
      console.warn('[MyOrders] Load orders error:', err);
      setErrorMessage(mapMarketplaceError(err));
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, initialOrderId, selectedOrderId]);

  useEffect(() => {
    if (isOpen) {
      loadOrders();
    }
  }, [isOpen, loadOrders]);

  useEffect(() => {
    if (initialOrderId) {
      setSelectedOrderId(initialOrderId);
    }
  }, [initialOrderId]);

  // Realtime subscription for buyer orders
  useEffect(() => {
    if (!isOpen || !currentUser) return;
    const unsubscribe = subscribeToMyOrders(currentUser.id, () => {
      loadOrders();
    });
    return () => unsubscribe();
  }, [isOpen, currentUser, loadOrders]);

  if (!isOpen) return null;

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || (orders.length > 0 && selectedOrderId ? null : orders[0]);

  const handleCancelOrder = async (orderId: string) => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    try {
      setIsCancelling(true);
      setErrorMessage(null);
      await updateOrderStatus({
        orderId,
        status: 'cancelled',
        reason: 'Cancelled by buyer while pending.',
      });
      await loadOrders();
    } catch (err: unknown) {
      setErrorMessage(mapMarketplaceError(err));
    } finally {
      setIsCancelling(false);
    }
  };

  const handleOpenChat = async (businessId: string, orderId: string) => {
    try {
      onClose();
      await openChatWithBusiness(businessId, orderId);
    } catch (err) {
      console.error('Failed to open chat from orders:', err);
    }
  };

  const handleSubmitReview = async (order: MarketplaceOrder) => {
    if (!reviewComment.trim() || !currentUser) return;
    try {
      setIsSubmittingReview(true);
      setErrorMessage(null);
      await createReview({
        businessId: order.businessId,
        orderId: order.id,
        reviewerId: currentUser.id,
        reviewerName: currentUser.fullName || 'Student Buyer',
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setReviewedOrderIds((prev) => new Set([...prev, order.id]));
      setReviewComment('');
    } catch (err: unknown) {
      setErrorMessage(mapMarketplaceError(err));
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const getStepIndex = (status: OrderStatus) => {
    if (status === 'cancelled') return -1;
    return ORDER_STEPS.findIndex((s) => s.key === status);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-800 bg-neutral-950 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">My Orders</h3>
              <p className="text-[11px] text-neutral-400">Track order history and delivery PINs</p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={loadOrders}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              title="Refresh orders"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Backend notice */}
        {!isSupabaseConfigured && (
          <div className="p-3 m-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Backend not connected. Connect Supabase to see real orders.</span>
          </div>
        )}

        {/* Error state with Retry button */}
        {errorMessage && (
          <div className="p-3.5 m-4 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between gap-3">
            <span>{errorMessage}</span>
            <button
              type="button"
              onClick={loadOrders}
              className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-bold text-[11px] shrink-0 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-neutral-800">
          
          {/* Left Column: Order List */}
          <div className="w-full md:w-5/12 p-3 space-y-2 overflow-y-auto max-h-[40vh] md:max-h-full">
            {isLoading && orders.length === 0 ? (
              <div className="space-y-2 p-2">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-16 rounded-2xl bg-neutral-950 animate-pulse" />
                ))}
              </div>
            ) : orders.length === 0 ? (
              <div className="text-center py-12 px-4 space-y-2">
                <Package className="w-8 h-8 text-neutral-600 mx-auto" />
                <p className="text-xs font-bold text-white">No orders yet</p>
                <p className="text-[11px] text-neutral-400">When you order from campus traders, your order history will appear here.</p>
              </div>
            ) : (
              orders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                const statusColor = 
                  order.status === 'delivered' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                  order.status === 'cancelled' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
                  'text-amber-400 bg-amber-500/10 border-amber-500/30';

                return (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrderId(order.id)}
                    className={`w-full p-3 rounded-2xl text-left transition-all border ${
                      isSelected
                        ? 'bg-neutral-800/90 border-amber-500/50 shadow-md'
                        : 'bg-neutral-950/60 border-neutral-800/70 hover:bg-neutral-950'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold text-white truncate">
                        #{order.orderNumber || order.id.slice(0, 8)}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
                        {order.status}
                      </span>
                    </div>

                    <div className="text-xs text-neutral-300 font-medium truncate mt-1">
                      {order.businessName || 'Campus Trade'}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-1">
                      <span className="font-mono font-bold text-amber-400">{formatNaira(order.grandTotal || order.totalAmount)}</span>
                      <span className="capitalize">{order.paymentMethod === 'transfer' ? 'Transfer' : 'Cash'} · {order.paymentStatus || 'pending'}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Right Column: Order Detail */}
          <div className="w-full md:w-7/12 p-4 sm:p-5 overflow-y-auto space-y-4">
            {selectedOrder ? (
              <div className="space-y-4">
                {/* Order Summary Header */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm sm:text-base font-bold text-white">
                        Order #{selectedOrder.orderNumber || selectedOrder.id.slice(0, 8)}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        selectedOrder.status === 'delivered' ? 'bg-emerald-500/20 text-emerald-300' :
                        selectedOrder.status === 'cancelled' ? 'bg-rose-500/20 text-rose-300' :
                        'bg-amber-500/20 text-amber-300'
                      }`}>
                        {selectedOrder.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Store: <strong>{selectedOrder.businessName || 'Campus Trader'}</strong> · {new Date(selectedOrder.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenChat(selectedOrder.businessId, selectedOrder.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold transition-colors shrink-0"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Message Trader</span>
                  </button>
                </div>

                {/* DELIVERY PIN DISPLAY WHILE OPEN */}
                {selectedOrder.deliveryPin && selectedOrder.status !== 'cancelled' && (
                  <div className="p-3.5 rounded-2xl bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-neutral-900 border border-amber-500/40 space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <KeyRound className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-bold text-white">Delivery Verification PIN</span>
                      </div>
                      <span className="font-mono text-base font-black tracking-widest text-amber-400 px-3 py-0.5 rounded-lg bg-neutral-950 border border-amber-500/30">
                        {selectedOrder.deliveryPin}
                      </span>
                    </div>
                    <p className="text-[11px] text-amber-300/80">
                      Give this PIN to the trader only when your order arrives.
                    </p>
                  </div>
                )}

                {/* Status Timeline */}
                {selectedOrder.status === 'cancelled' ? (
                  <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs space-y-1">
                    <strong className="block font-bold">Order Cancelled</strong>
                    <p className="text-[11px] text-rose-400/80">
                      {selectedOrder.cancellationReason || selectedOrder.cancelReason || 'This order was cancelled.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 py-1">
                    <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Status Timeline</h5>
                    <div className="grid grid-cols-5 gap-1 pt-1">
                      {ORDER_STEPS.map((step, idx) => {
                        const currentIdx = getStepIndex(selectedOrder.status);
                        const isCompleted = currentIdx >= idx;
                        const isCurrent = currentIdx === idx;

                        return (
                          <div key={step.key} className="flex flex-col items-center text-center space-y-1">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                              isCurrent
                                ? 'bg-amber-500 text-neutral-950 ring-4 ring-amber-500/20'
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

                {/* Items List */}
                <div className="space-y-2 pt-1">
                  <h5 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Ordered Items</h5>
                  <div className="space-y-1.5 rounded-2xl bg-neutral-950 p-3 border border-neutral-800">
                    {(selectedOrder.items || []).map((item) => (
                      <div key={item.id} className="flex items-center justify-between text-xs py-1">
                        <span className="text-neutral-200">
                          {item.quantity}x {item.productTitle || 'Campus Item'}
                        </span>
                        <span className="font-mono text-neutral-400">
                          {formatNaira(item.unitPrice * item.quantity)}
                        </span>
                      </div>
                    ))}

                    <div className="pt-2 mt-2 border-t border-neutral-800 space-y-1 text-xs">
                      <div className="flex justify-between text-neutral-400">
                        <span>Subtotal</span>
                        <span className="font-mono">{formatNaira(selectedOrder.subtotal)}</span>
                      </div>
                      <div className="flex justify-between text-neutral-400">
                        <span>Delivery Fee</span>
                        <span className="font-mono">{formatNaira(selectedOrder.deliveryFee)}</span>
                      </div>
                      <div className="flex items-center justify-between font-bold pt-1 border-t border-neutral-800 text-sm">
                        <span className="text-white">Grand Total</span>
                        <span className="text-amber-400 font-mono">{formatNaira(selectedOrder.grandTotal || selectedOrder.totalAmount)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Delivery Info */}
                <div className="text-xs bg-neutral-950 p-3 rounded-2xl border border-neutral-800 space-y-1">
                  <div className="flex items-center gap-1.5 text-neutral-300">
                    <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Delivery Address: <strong>{selectedOrder.deliveryAddress}</strong></span>
                  </div>
                  {selectedOrder.phone && (
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <Phone className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Phone: <strong>{selectedOrder.phone}</strong></span>
                    </div>
                  )}
                  <div className="text-neutral-400 pt-1">
                    Payment Method: <strong className="text-white capitalize">{selectedOrder.paymentMethod === 'transfer' ? 'Bank Transfer' : 'Pay on Delivery'}</strong> ({selectedOrder.paymentStatus || 'pending'})
                  </div>
                  {selectedOrder.notes && (
                    <p className="text-[11px] text-neutral-400 pt-1">
                      Notes: {selectedOrder.notes}
                    </p>
                  )}
                </div>

                {/* Buyer Actions: CANCEL ORDER BUTTON ONLY WHILE STATUS IS PENDING */}
                {(selectedOrder.status === 'pending' || selectedOrder.status === 'placed') && (
                  <div className="pt-1">
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={() => handleCancelOrder(selectedOrder.id)}
                      className="w-full py-2.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                    </button>
                  </div>
                )}

                {/* Buyer Actions: Leave Review once delivered */}
                {selectedOrder.status === 'delivered' && !reviewedOrderIds.has(selectedOrder.id) && (
                  <div className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2.5">
                    <h5 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>Review Your Trader Experience</span>
                    </h5>
                    
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setReviewRating(star)}
                          className="p-1 hover:scale-110 transition-transform"
                        >
                          <Star className={`w-5 h-5 ${star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-neutral-600'}`} />
                        </button>
                      ))}
                      <span className="text-xs text-neutral-400 ml-2 font-bold">{reviewRating} / 5</span>
                    </div>

                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="How was the hostel delivery and item quality?"
                      rows={2}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/60"
                    />

                    <button
                      type="button"
                      disabled={!reviewComment.trim() || isSubmittingReview}
                      onClick={() => handleSubmitReview(selectedOrder)}
                      className="w-full py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all disabled:opacity-40"
                    >
                      {isSubmittingReview ? 'Submitting Review...' : 'Submit Verified Review'}
                    </button>
                  </div>
                )}

                {reviewedOrderIds.has(selectedOrder.id) && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs text-center font-bold">
                    Thank you! Your verified review has been submitted.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 text-xs text-neutral-500">
                Select an order on the left to view details and tracking.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
