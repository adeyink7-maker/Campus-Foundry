import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Store, 
  CreditCard, 
  Wallet, 
  AlertCircle,
  Package,
  MessageSquare,
  Building2
} from 'lucide-react';
import { useCart, CheckoutResult } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useMarketplaceChat } from '../context/MarketplaceChatContext';
import { ALL_UNILORIN_HOSTELS } from '../data/mockData';
import { HostelSelectMenu } from './HostelSelectMenu';
import { LiveDeliveryTrackerModal, TrackerOrderData } from './LiveDeliveryTrackerModal';
import { PaymentMethod, formatNaira, isSupabaseConfigured } from '../services/marketplace';
import { getFriendlyError } from '../utils/friendlyErrors';
import { FriendlyAlert } from './FriendlyAlert';

interface CartDrawerProps {
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
  onExploreBusinesses?: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  onOpenAuth,
  onExploreBusinesses,
}) => {
  const {
    isCartOpen,
    setIsCartOpen,
    cartItems,
    updateQuantity,
    removeFromCart,
    clearCart,
    totalItemCount,
    subtotal,
    deliveryFeeTotal,
    grandTotal,
    checkoutOrder,
  } = useCart();

  const { currentUser } = useAuth();
  const { openChatWithBusiness } = useMarketplaceChat();

  const [deliveryHostel, setDeliveryHostel] = useState(() => {
    return ALL_UNILORIN_HOSTELS.find((h) => currentUser?.hostelLocation?.includes(h)) || 'Lagos Hostel (Male)';
  });
  const [deliveryRoom, setDeliveryRoom] = useState('');
  const [phoneNumber, setPhoneNumber] = useState(currentUser?.whatsapp || '');
  const [notes, setNotes] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>('cash_on_delivery');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Success state: showing placed orders (can be multiple stores)
  const [placedOrders, setPlacedOrders] = useState<CheckoutResult[]>([]);
  const [trackedOrder, setTrackedOrder] = useState<TrackerOrderData | null>(null);

  // Sync profile details when currentUser changes
  useEffect(() => {
    if (currentUser?.hostelLocation) {
      const match = ALL_UNILORIN_HOSTELS.find((h) => currentUser.hostelLocation?.includes(h));
      if (match) setDeliveryHostel(match);
    }
    if (currentUser?.whatsapp) {
      setPhoneNumber(currentUser.whatsapp);
    }
  }, [currentUser]);

  // Group current cart items by business
  const groupedCartItems = React.useMemo(() => {
    const map = new Map<string, { businessName: string; items: typeof cartItems }>();
    for (const item of cartItems) {
      const bizId = item.businessId;
      const existing = map.get(bizId) || { businessName: item.businessName || 'Campus Store', items: [] };
      existing.items.push(item);
      map.set(bizId, existing);
    }
    return Array.from(map.entries());
  }, [cartItems]);

  if (!isCartOpen && placedOrders.length === 0 && !trackedOrder) return null;

  const handleConfirmOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onOpenAuth?.('signin');
      return;
    }

    const fullHostelAddress = `${deliveryHostel}${deliveryRoom.trim() ? `, Room ${deliveryRoom.trim()}` : ''}`.trim();
    if (fullHostelAddress.length < 3) {
      setErrorMessage('Delivery address is required (at least 3 characters).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const results = await checkoutOrder({
        deliveryAddress: fullHostelAddress,
        phone: phoneNumber.trim() || undefined,
        notes: notes.trim().slice(0, 500) || undefined,
        paymentMethod: selectedPayment,
      });

      setPlacedOrders(results);
    } catch (err: unknown) {
      setErrorMessage(getFriendlyError(err, 'order'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenTrackingFromPlaced = (order: CheckoutResult) => {
    setTrackedOrder({
      id: order.orderId,
      orderNumber: order.orderNumber,
      businessId: order.businessId,
      businessName: order.businessName,
      status: 'placed',
      totalAmount: order.grandTotal,
      deliveryAddress: order.deliveryAddress,
      phone: order.phone,
      notes: order.notes,
      deliveryPin: order.deliveryPin || undefined,
      items: order.items.map((i) => ({
        productTitle: i.name,
        quantity: i.quantity,
        unitPrice: i.price,
      })),
      createdAt: new Date().toISOString(),
    });
    setPlacedOrders([]);
  };

  const handleMessageTrader = async (businessId: string, orderId: string) => {
    try {
      setPlacedOrders([]);
      setIsCartOpen(false);
      await openChatWithBusiness(businessId, orderId);
    } catch (err) {
      console.error('Failed to open chat with trader:', err);
    }
  };

  return (
    <>
      {/* 1. ORDER SUCCESS MODAL WITH PIN & BANK DETAILS */}
      {placedOrders.length > 0 && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setPlacedOrders([])}
        >
          <div 
            className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-2xl text-white space-y-5 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center space-y-2">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">Order Placed Successfully!</h3>
              <p className="text-xs text-neutral-400">
                {placedOrders.length === 1 
                  ? `Your order has been sent to ${placedOrders[0].businessName}`
                  : `Your cart was split into ${placedOrders.length} separate store orders`}
              </p>
            </div>

            {/* Loop through each placed order */}
            <div className="space-y-4">
              {placedOrders.map((order) => (
                <div key={order.orderId} className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 text-left">
                  <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2.5">
                    <div>
                      <span className="text-xs font-bold text-white">{order.businessName}</span>
                      <span className="text-[11px] text-neutral-400 font-mono block">Order #{order.orderNumber}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleMessageTrader(order.businessId, order.orderId)}
                      className="px-2.5 py-1 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-bold flex items-center gap-1 transition-colors"
                    >
                      <MessageSquare className="w-3 h-3" />
                      <span>Message Trader</span>
                    </button>
                  </div>

                  {/* MANDATORY PIN DISPLAY */}
                  {order.deliveryPin && (
                    <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/10 to-neutral-900 border border-amber-500/40 space-y-1">
                      <span className="text-[11px] font-semibold text-neutral-400 block">4-Digit Delivery Verification PIN</span>
                      <div className="font-mono text-xl font-black tracking-widest text-amber-400">
                        {order.deliveryPin}
                      </div>
                      <p className="text-[11px] text-amber-300 font-medium">
                        Give this PIN to the trader only when your order arrives.
                      </p>
                    </div>
                  )}

                  {/* Bank Details for Transfer Payment */}
                  {order.paymentMethod === 'transfer' && (
                    <div className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 space-y-1 text-xs">
                      <div className="flex items-center gap-1.5 text-amber-400 font-bold mb-1">
                        <Building2 className="w-4 h-4" />
                        <span>Bank Transfer Details</span>
                      </div>
                      {order.bankDetails?.hasBank ? (
                        <div className="space-y-1 font-mono text-[11px] text-neutral-200">
                          {order.bankDetails.bankName && <div>Bank: <strong>{order.bankDetails.bankName}</strong></div>}
                          {order.bankDetails.accountNumber && <div>Account No: <strong className="text-amber-400 text-xs">{order.bankDetails.accountNumber}</strong></div>}
                          {order.bankDetails.accountName && <div>Account Name: <strong>{order.bankDetails.accountName}</strong></div>}
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-300">
                          The trader will send account details in chat.
                        </p>
                      )}
                    </div>
                  )}

                  {/* Financial breakdown */}
                  <div className="text-[11px] text-neutral-400 space-y-1 pt-1 font-mono">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="text-neutral-200">{formatNaira(order.subtotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span className="text-neutral-200">{formatNaira(order.deliveryFee)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-amber-400 pt-1 border-t border-neutral-800 text-xs">
                      <span>Grand Total:</span>
                      <span>{formatNaira(order.grandTotal)}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenTrackingFromPlaced(order)}
                    className="w-full py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-amber-400 text-xs font-bold transition-all border border-neutral-800 flex items-center justify-center gap-1.5 mt-2"
                  >
                    <Package className="w-4 h-4" />
                    <span>Track Live Delivery Status</span>
                  </button>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setPlacedOrders([])}
              className="w-full py-3 rounded-2xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-bold transition-colors"
            >
              Done & Close
            </button>
          </div>
        </div>
      )}

      {/* 2. LIVE TRACKER MODAL */}
      <LiveDeliveryTrackerModal
        order={trackedOrder}
        isOpen={Boolean(trackedOrder)}
        onClose={() => setTrackedOrder(null)}
      />

      {/* 3. MAIN CART DRAWER */}
      {isCartOpen && (
        <div 
          className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-md animate-in fade-in"
          onClick={() => setIsCartOpen(false)}
        >
          <div 
            className="w-full sm:max-w-lg h-[100dvh] bg-neutral-900 border-l border-neutral-800 shadow-2xl flex flex-col text-white pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-neutral-800 bg-neutral-950 px-5 py-4 shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Campus Cart ({totalItemCount})</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Error Notice */}
            {errorMessage && (
              <div className="mx-4 mt-4">
                <FriendlyAlert
                  message={errorMessage}
                  onRetry={() => {
                    const fakeEvent = { preventDefault: () => {} } as React.FormEvent;
                    handleConfirmOrder(fakeEvent);
                  }}
                  onDismiss={() => setErrorMessage(null)}
                  variant="warning"
                  isRetrying={isSubmitting}
                />
              </div>
            )}

            {/* Backend warning */}
            {!isSupabaseConfigured && (
              <div className="m-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>Backend not connected. Connect Supabase with environment keys to place orders.</span>
              </div>
            )}

            {/* Content Body */}
            <div className={`flex-1 overflow-y-auto p-5 ${cartItems.length === 0 ? 'flex flex-col items-center justify-center' : 'space-y-5'}`}>
              {cartItems.length === 0 ? (
                <div className="p-6 text-center text-neutral-500 space-y-3 max-w-sm">
                  <ShoppingBag className="h-12 w-12 mx-auto text-neutral-600" />
                  <h4 className="text-sm font-bold text-white">Your Campus Cart is Empty</h4>
                  <p className="text-xs text-neutral-400">
                    Explore student shops, restaurants, tech repairs, and dorm essentials in the marketplace.
                  </p>
                  {onExploreBusinesses && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCartOpen(false);
                        onExploreBusinesses();
                      }}
                      className="mt-3 px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs"
                    >
                      Browse Marketplace
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {/* Multi-store Grouped List */}
                  <div className="space-y-4">
                    {groupedCartItems.map(([bizId, group]) => (
                      <div key={bizId} className="p-3.5 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3">
                        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
                          <div className="flex items-center gap-2">
                            <Store className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="text-xs font-bold text-white truncate">{group.businessName}</span>
                          </div>
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold">
                            1 Order
                          </span>
                        </div>

                        <div className="space-y-2">
                          {group.items.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center justify-between gap-3 text-xs bg-neutral-900/60 p-2.5 rounded-xl border border-neutral-800/60"
                            >
                              <div className="min-w-0 flex-1 space-y-0.5">
                                <h4 className="font-bold text-white truncate">{item.name}</h4>
                                <span className="font-mono text-amber-400 font-bold block">
                                  {formatNaira(item.price)} each
                                </span>
                              </div>

                              {/* Quantity Controls */}
                              <div className="flex items-center gap-2 shrink-0">
                                <div className="flex items-center gap-1 bg-neutral-900 border border-neutral-800 rounded-xl p-1">
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                    className="p-1 rounded-lg text-neutral-400 hover:text-white"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="font-mono font-bold text-xs px-1 min-w-[18px] text-center">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                    className="p-1 rounded-lg text-neutral-400 hover:text-white"
                                  >
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => removeFromCart(item.id)}
                                  className="p-1.5 rounded-lg text-neutral-500 hover:text-rose-400"
                                  title="Remove"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={clearCart}
                        className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear All Items</span>
                      </button>
                    </div>
                  </div>

                  {/* Checkout Form */}
                  <form onSubmit={handleConfirmOrder} className="space-y-4 pt-2 border-t border-neutral-800">
                    <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                      Hostel Delivery Details
                    </h4>

                    {/* Hostel Selection */}
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 font-medium">Select UNILORIN Hostel *</label>
                      <HostelSelectMenu
                        selectedHostel={deliveryHostel}
                        onHostelChange={(h: string) => setDeliveryHostel(h)}
                      />
                    </div>

                    {/* Room Number */}
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 font-medium">Hostel Room Number / Block</label>
                      <input
                        type="text"
                        value={deliveryRoom}
                        onChange={(e) => setDeliveryRoom(e.target.value)}
                        placeholder="e.g. Room 204, Block B"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Phone Number */}
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 font-medium">Phone Number (Optional - falls back to profile)</label>
                      <input
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        placeholder={currentUser?.whatsapp || '08012345678'}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    {/* Delivery Notes */}
                    <div className="space-y-1">
                      <label className="text-xs text-neutral-400 font-medium">Delivery Notes (Max 500 characters)</label>
                      <textarea
                        maxLength={500}
                        rows={2}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="e.g. Leave at porter lodge if in class..."
                        className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    {/* Payment Choice */}
                    <div className="space-y-2 pt-1">
                      <label className="text-xs text-neutral-400 font-medium block">
                        Payment Method
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedPayment('cash_on_delivery')}
                          className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                            selectedPayment === 'cash_on_delivery'
                              ? 'bg-amber-500/20 border-amber-500 text-white'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <span className="font-bold block text-white">Pay on Delivery</span>
                          <span className="text-[10px] text-neutral-400 mt-0.5 block">Pay cash when order arrives</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedPayment('transfer')}
                          className={`p-3 rounded-2xl border text-left text-xs transition-all ${
                            selectedPayment === 'transfer'
                              ? 'bg-amber-500/20 border-amber-500 text-white'
                              : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                        >
                          <span className="font-bold block text-white">Bank Transfer</span>
                          <span className="text-[10px] text-neutral-400 mt-0.5 block">Transfer on delivery arrival</span>
                        </button>
                      </div>
                    </div>

                    {/* Financial Summary */}
                    <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-neutral-400">
                        <span>Items Subtotal (Estimate)</span>
                        <span className="font-mono text-white">{formatNaira(subtotal)}</span>
                      </div>
                      <p className="text-[11px] text-neutral-400 italic">
                        Delivery fee is confirmed on the order.
                      </p>
                    </div>

                    {/* Checkout Button - Disabled while submitting */}
                    <div className="pt-2">
                      {!currentUser ? (
                        <button
                          type="button"
                          onClick={() => onOpenAuth?.('signin')}
                          className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs shadow-lg transition-all"
                        >
                          Sign In to Place Order
                        </button>
                      ) : (
                        <button
                          type="submit"
                          disabled={isSubmitting || !isSupabaseConfigured}
                          className="w-full py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-extrabold text-xs shadow-lg transition-all disabled:opacity-40 cursor-pointer"
                        >
                          {isSubmitting ? 'Placing Order in Supabase...' : `Confirm Order (${formatNaira(subtotal)})`}
                        </button>
                      )}
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
