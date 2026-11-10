import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { CartItem, WishlistItem, StudentBusiness } from '../types';
import { useAuth } from './AuthContext';
import { 
  placeOrder as apiPlaceOrder, 
  getDeliveryPin as apiGetDeliveryPin, 
  fetchOrderPlacedDetails,
  PaymentMethod,
  isSupabaseConfigured,
  mapMarketplaceError
} from '../services/marketplace';
import { supabase, emitAppToast } from '../services/supabase';

export interface CheckoutResult {
  orderId: string;
  orderNumber: string;
  deliveryPin: string | null;
  businessId: string;
  businessName: string;
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  totalAmount: number;
  deliveryAddress: string;
  phone: string;
  notes?: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  bankDetails?: {
    hasBank: boolean;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  items: CartItem[];
}

interface CartContextType {
  cartItems: CartItem[];
  wishlistItems: WishlistItem[];
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  addToCart: (item: Omit<CartItem, 'id' | 'addedAt'>) => boolean;
  updateQuantity: (cartItemId: string, quantity: number) => void;
  removeFromCart: (cartItemId: string) => CartItem | null;
  undoLastRemoval: () => void;
  clearCart: () => void;
  totalItemCount: number;
  subtotal: number;
  deliveryFeeTotal: number;
  grandTotal: number;
  toggleWishlist: (business: StudentBusiness) => boolean;
  isWishlisted: (businessId: string) => boolean;
  checkoutOrder: (details: {
    deliveryAddress: string;
    phone?: string;
    notes?: string;
    paymentMethod: PaymentMethod;
  }) => Promise<CheckoutResult[]>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const STORAGE_GUEST_TOKEN_KEY = 'campus_foundry_guest_token_v2';
const STORAGE_CART_PREFIX = 'campus_foundry_cart_';
const STORAGE_WISHLIST_PREFIX = 'campus_foundry_wishlist_';

function getOrCreateGuestToken(): string {
  try {
    let token = localStorage.getItem(STORAGE_GUEST_TOKEN_KEY);
    if (!token) {
      token = 'guest_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
      localStorage.setItem(STORAGE_GUEST_TOKEN_KEY, token);
    }
    return token;
  } catch {
    return 'guest_fallback_' + Date.now();
  }
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [guestToken] = useState<string>(() => getOrCreateGuestToken());
  const [lastRemovedItem, setLastRemovedItem] = useState<CartItem | null>(null);

  // Active storage identity: user ID if authenticated, or guest token if anonymous
  const activeIdentity = useMemo(() => {
    return currentUser ? `user_${currentUser.id}` : `guest_${guestToken}`;
  }, [currentUser, guestToken]);

  // Persistent Cart state in localStorage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const key = `${STORAGE_CART_PREFIX}${currentUser ? `user_${currentUser.id}` : `guest_${getOrCreateGuestToken()}`}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persistent Wishlist state in localStorage
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>(() => {
    try {
      const key = `${STORAGE_WISHLIST_PREFIX}${currentUser ? `user_${currentUser.id}` : `guest_${getOrCreateGuestToken()}`}`;
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Save Cart to persistent storage whenever cartItems change
  useEffect(() => {
    try {
      const key = `${STORAGE_CART_PREFIX}${activeIdentity}`;
      localStorage.setItem(key, JSON.stringify(cartItems));
    } catch (e) {
      console.error('Failed saving cart to storage:', e);
    }
  }, [cartItems, activeIdentity]);

  // Save Wishlist to persistent storage whenever wishlistItems change
  useEffect(() => {
    try {
      const key = `${STORAGE_WISHLIST_PREFIX}${activeIdentity}`;
      localStorage.setItem(key, JSON.stringify(wishlistItems));
    } catch (e) {
      console.error('Failed saving wishlist to storage:', e);
    }
  }, [wishlistItems, activeIdentity]);

  // Merge guest cart into user cart on login
  useEffect(() => {
    if (!currentUser) return;
    try {
      const guestKey = `${STORAGE_CART_PREFIX}guest_${guestToken}`;
      const guestCartRaw = localStorage.getItem(guestKey);
      const userKey = `${STORAGE_CART_PREFIX}user_${currentUser.id}`;
      const userCartRaw = localStorage.getItem(userKey);
      const userCart: CartItem[] = userCartRaw ? JSON.parse(userCartRaw) : [];

      if (guestCartRaw) {
        const guestCart: CartItem[] = JSON.parse(guestCartRaw);
        if (guestCart.length > 0) {
          setCartItems(guestCart);
          localStorage.setItem(userKey, JSON.stringify(guestCart));
          localStorage.removeItem(guestKey);
          return;
        }
      }
      setCartItems(userCart);
    } catch (err) {
      console.error('Failed merging cart on auth:', err);
    }
  }, [currentUser, guestToken]);

  // Cart Operations: Multi-store allowed. Items are grouped during checkout.
  const addToCart = useCallback((item: Omit<CartItem, 'id' | 'addedAt'>): boolean => {
    setCartItems((prev) => {
      const matchId = item.productId || item.serviceId;
      const existingIdx = prev.findIndex(
        (ci) => ci.businessId === item.businessId && (ci.productId === matchId || ci.serviceId === matchId)
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: updated[existingIdx].quantity + item.quantity,
          customNotes: item.customNotes || updated[existingIdx].customNotes,
        };
        return updated;
      }

      const newItem: CartItem = {
        ...item,
        productId: item.productId || item.serviceId,
        id: 'ci_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now(),
        addedAt: new Date().toISOString(),
      };
      return [...prev, newItem];
    });

    setIsCartOpen(true);
    return true;
  }, []);

  const updateQuantity = useCallback((cartItemId: string, newQuantity: number) => {
    setCartItems((prev) => {
      if (newQuantity <= 0) {
        return prev.filter((item) => item.id !== cartItemId);
      }
      return prev.map((item) =>
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item
      );
    });
  }, []);

  const removeFromCart = useCallback((cartItemId: string) => {
    let removed: CartItem | null = null;
    setCartItems((prev) => {
      const found = prev.find((item) => item.id === cartItemId);
      if (found) {
        removed = found;
        setLastRemovedItem(found);
      }
      return prev.filter((item) => item.id !== cartItemId);
    });
    return removed;
  }, []);

  const undoLastRemoval = useCallback(() => {
    if (lastRemovedItem) {
      setCartItems((prev) => [...prev, lastRemovedItem]);
      setLastRemovedItem(null);
    }
  }, [lastRemovedItem]);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  // Wishlist Operations
  const toggleWishlist = useCallback((business: StudentBusiness): boolean => {
    let isNowSaved = false;
    setWishlistItems((prev) => {
      const exists = prev.some((w) => w.businessId === business.id);
      if (exists) {
        isNowSaved = false;
        return prev.filter((w) => w.businessId !== business.id);
      }
      isNowSaved = true;
      const newItem: WishlistItem = {
        id: 'wl_' + Math.random().toString(36).substring(2, 9),
        businessId: business.id,
        businessName: business.name,
        businessCategory: business.category,
        campus: business.campus,
        hostelLocation: business.hostelLocation,
        imageUrl: business.imageUrl,
        startingPrice: business.startingPrice,
        savedAt: new Date().toISOString(),
      };
      return [...prev, newItem];
    });
    return isNowSaved;
  }, []);

  const isWishlisted = useCallback((businessId: string): boolean => {
    return wishlistItems.some((w) => w.businessId === businessId);
  }, [wishlistItems]);

  // Calculations for UI preview estimated subtotal (database decides final price & totals)
  const { totalItemCount, subtotal, deliveryFeeTotal, grandTotal } = useMemo(() => {
    let count = 0;
    let sum = 0;
    const storeIds = new Set<string>();
    for (let i = 0; i < cartItems.length; i++) {
      count += cartItems[i].quantity;
      sum += cartItems[i].price * cartItems[i].quantity;
      if (cartItems[i].businessId) {
        storeIds.add(cartItems[i].businessId);
      }
    }
    const deliveryFee = storeIds.size > 0 ? storeIds.size * 300 : 0;
    return {
      totalItemCount: count,
      subtotal: sum,
      deliveryFeeTotal: deliveryFee,
      grandTotal: sum + deliveryFee,
    };
  }, [cartItems]);

  // Real Supabase Checkout: Splits cart by businessId and calls place_order RPC for each store
  const checkoutOrder = useCallback(async (details: {
    deliveryAddress: string;
    phone?: string;
    notes?: string;
    paymentMethod: PaymentMethod;
  }): Promise<CheckoutResult[]> => {
    if (cartItems.length === 0) {
      throw new Error('Your cart is empty.');
    }
    if (!isSupabaseConfigured) {
      throw new Error('Supabase backend not connected.');
    }
    if (!currentUser) {
      throw new Error('Please sign in to place your order.');
    }

    const trimmedAddress = details.deliveryAddress.trim();
    if (trimmedAddress.length < 3) {
      throw new Error('Delivery address is required (at least 3 characters).');
    }

    const phoneToUse = details.phone?.trim() || currentUser.whatsapp || '';

    // Group items by businessId
    const itemsByBusiness = new Map<string, CartItem[]>();
    for (const item of cartItems) {
      const list = itemsByBusiness.get(item.businessId) || [];
      list.push(item);
      itemsByBusiness.set(item.businessId, list);
    }

    const placedResults: CheckoutResult[] = [];

    for (const [bizId, bizItems] of itemsByBusiness.entries()) {
      // Guard: trader must not be able to order from their own store
      if (currentUser.businessProfileId === bizId) {
        emitAppToast('This is your own store', 'error');
        throw new Error('This is your own store');
      }

      try {
        const { data: biz } = await supabase
          .from('student_businesses')
          .select('owner_id')
          .eq('id', bizId)
          .maybeSingle();

        if (biz && biz.owner_id === currentUser.id) {
          emitAppToast('This is your own store', 'error');
          throw new Error('This is your own store');
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.message === 'This is your own store') {
          throw err;
        }
      }

      const bizName = bizItems[0].businessName || 'Campus Store';
      const itemsPayload = bizItems.map((ci) => ({
        productId: (ci.productId || ci.serviceId)!,
        quantity: ci.quantity,
      }));

      // 1. Call database place_order RPC (sends ONLY product_id and quantity; database sets price)
      let orderId: string;
      try {
        orderId = await apiPlaceOrder({
          businessId: bizId,
          items: itemsPayload,
          deliveryAddress: trimmedAddress,
          phone: phoneToUse,
          notes: details.notes?.trim() || undefined,
          paymentMethod: details.paymentMethod,
        });
      } catch (placeErr: unknown) {
        const mapped = mapMarketplaceError(placeErr);
        emitAppToast(mapped, 'error');
        throw new Error(mapped);
      }

      // 2. Fetch placed order details from DB (order_number, grand_total, delivery_fee, order_secrets delivery_pin, bank details)
      const placedDetails = await fetchOrderPlacedDetails(orderId);

      const itemsSnapshot = [...bizItems];
      const estSubtotal = itemsSnapshot.reduce((sum, i) => sum + i.price * i.quantity, 0);

      placedResults.push({
        orderId,
        orderNumber: placedDetails?.orderNumber || orderId.slice(0, 8).toUpperCase(),
        deliveryPin: placedDetails?.deliveryPin || null,
        businessId: bizId,
        businessName: bizName,
        subtotal: placedDetails?.subtotal ?? estSubtotal,
        deliveryFee: placedDetails?.deliveryFee ?? 0,
        grandTotal: placedDetails?.grandTotal ?? estSubtotal,
        totalAmount: placedDetails?.grandTotal ?? estSubtotal,
        deliveryAddress: trimmedAddress,
        phone: phoneToUse,
        notes: details.notes,
        paymentMethod: details.paymentMethod,
        paymentStatus: placedDetails?.paymentStatus || 'pending',
        bankDetails: placedDetails?.bankDetails,
        items: itemsSnapshot,
      });
    }

    // Clear cart after placing all orders
    setCartItems([]);
    setIsCartOpen(false);

    return placedResults;
  }, [cartItems, currentUser]);

  const contextValue = useMemo(
    () => ({
      cartItems,
      wishlistItems,
      isCartOpen,
      setIsCartOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      undoLastRemoval,
      clearCart,
      totalItemCount,
      subtotal,
      deliveryFeeTotal,
      grandTotal,
      toggleWishlist,
      isWishlisted,
      checkoutOrder,
    }),
    [
      cartItems,
      wishlistItems,
      isCartOpen,
      addToCart,
      updateQuantity,
      removeFromCart,
      undoLastRemoval,
      clearCart,
      totalItemCount,
      subtotal,
      deliveryFeeTotal,
      grandTotal,
      toggleWishlist,
      isWishlisted,
      checkoutOrder,
    ]
  );

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

