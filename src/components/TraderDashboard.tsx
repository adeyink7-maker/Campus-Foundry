import React, { useState, useEffect, useCallback } from 'react';
import { 
  CreditCard,
  Store, 
  ShoppingBag, 
  TrendingUp, 
  Package, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  MapPin, 
  KeyRound, 
  X, 
  Plus, 
  Edit3, 
  RefreshCw, 
  Eye, 
  EyeOff, 
  ExternalLink,
  ChevronDown,
  Upload,
  Check
} from 'lucide-react';
import { supabase } from '../services/supabase';
import { 
  StudentBusiness, 
  MarketplaceOrder, 
  Product, 
  ProductKind, 
  DashboardStats, 
  OrderStatus 
} from '../types';
import { 
  fetchDashboardStats, 
  fetchTraderOrders, 
  updateOrderStatus, 
  confirmDelivery,
  updateOrderPaymentStatus,
  listProducts, 
  createProduct, 
  updateProduct, 
  setProductActive, 
  uploadProductImage, 
  formatNaira, 
  isSupabaseConfigured,
  mapMarketplaceError
} from '../services/marketplace';
import { getFriendlyError } from '../utils/friendlyErrors';
import { FriendlyAlert } from './FriendlyAlert';
import { useAuth } from '../context/AuthContext';
import { useMarketplaceChat } from '../context/MarketplaceChatContext';

interface TraderDashboardProps {
  myBusinesses: StudentBusiness[];
  activeBusinessId?: string;
  onSelectBusiness?: (biz: StudentBusiness) => void;
  onClose?: () => void;
}

export const TraderDashboard: React.FC<TraderDashboardProps> = ({
  myBusinesses,
  activeBusinessId: propBusinessId,
  onSelectBusiness,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const { openMarketplaceChat, conversations } = useMarketplaceChat();

  // Selected Business (Switcher if multiple)
  const [selectedBizId, setSelectedBizId] = useState<string>(() => {
    return propBusinessId || myBusinesses[0]?.id || '';
  });

  const activeBiz = myBusinesses.find((b) => b.id === selectedBizId) || myBusinesses[0];

  // Active Tab: 'overview' | 'orders' | 'products' | 'messages'
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'products' | 'messages'>('overview');

  // Stats State
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Orders State
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatus | 'all'>('all');
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  // Products State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);

  // Mark Delivered PIN Modal State
  const [pinModalOrder, setPinModalOrder] = useState<MarketplaceOrder | null>(null);
  const [deliveryPinInput, setDeliveryPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Cancel Order Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState<MarketplaceOrder | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);

  // Add/Edit Product Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productTitle, setProductTitle] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productKind, setProductKind] = useState<ProductKind>('good');
  const [productCategory, setProductCategory] = useState('Food & Grills');
  const [productEstimatedTime, setProductEstimatedTime] = useState('');
  const [isUnlimitedStock, setIsUnlimitedStock] = useState(true);
  const [productStock, setProductStock] = useState('10');
  const [productImages, setProductImages] = useState<string[]>([]);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isSavingProduct, setIsSavingProduct] = useState(false);
  const [productFormError, setProductFormError] = useState<string | null>(null);

  // Global Error Notice
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Owner bank payout details loaded via get_payment_details RPC
  const [bankDetails, setBankDetails] = useState<{
    bank_name?: string;
    account_number?: string;
    account_name?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPaymentDetails() {
      if (isSupabaseConfigured && activeBiz?.id) {
        try {
          const { data } = await supabase.rpc('get_payment_details', { p_business: activeBiz.id });
          if (isMounted) {
            if (data) {
              setBankDetails({
                bank_name: data.bank_name || undefined,
                account_number: data.account_number || undefined,
                account_name: data.account_name || undefined,
              });
            } else {
              setBankDetails(null);
            }
          }
        } catch {
          if (isMounted) setBankDetails(null);
        }
      }
    }
    loadPaymentDetails();
    return () => { isMounted = false; };
  }, [activeBiz?.id]);

  // Load Dashboard Stats
  const loadStats = useCallback(async () => {
    if (!isSupabaseConfigured || !activeBiz?.id) return;
    try {
      setIsLoadingStats(true);
      const data = await fetchDashboardStats(activeBiz.id, 30);
      setStats(data);
    } catch (err: unknown) {
      console.warn('[TraderDashboard] loadStats warning:', err);
    } finally {
      setIsLoadingStats(false);
    }
  }, [activeBiz?.id]);

  // Load Trader Orders
  const loadOrders = useCallback(async () => {
    if (!isSupabaseConfigured || !activeBiz?.id) return;
    try {
      setIsLoadingOrders(true);
      const data = await fetchTraderOrders({
        businessId: activeBiz.id,
        status: orderStatusFilter,
      });
      setOrders(data);
    } catch (err: unknown) {
      console.warn('[TraderDashboard] loadOrders warning:', err);
      setErrorMessage(mapMarketplaceError(err));
    } finally {
      setIsLoadingOrders(false);
    }
  }, [activeBiz?.id, orderStatusFilter]);

  // Load Trader Products
  const loadProducts = useCallback(async () => {
    if (!isSupabaseConfigured || !activeBiz?.id) return;
    try {
      setIsLoadingProducts(true);
      // Fetch both active and inactive products for the owner
      const { products: data } = await listProducts({
        businessId: activeBiz.id,
        isActive: undefined,
        pageSize: 100,
      });
      setProducts(data);
    } catch (err: unknown) {
      console.warn('[TraderDashboard] loadProducts warning:', err);
    } finally {
      setIsLoadingProducts(false);
    }
  }, [activeBiz?.id]);

  useEffect(() => {
    if (activeBiz?.id) {
      loadStats();
      loadOrders();
      loadProducts();
    }
  }, [activeBiz?.id, loadStats, loadOrders, loadProducts]);

  // Compute count of new orders for red badge
  const newOrdersCount = orders.filter((o) => o.status === 'placed').length;

  // Handle Order Status Transitions
  const handleTransitionStatus = async (order: MarketplaceOrder, nextStatus: OrderStatus) => {
    if (nextStatus === 'delivered') {
      // Prompt for PIN modal
      setPinModalOrder(order);
      setDeliveryPinInput('');
      setPinError(null);
      return;
    }

    try {
      setErrorMessage(null);
      await updateOrderStatus({
        orderId: order.id,
        status: nextStatus,
      });
      await loadOrders();
      await loadStats();
    } catch (err: unknown) {
      setErrorMessage(mapMarketplaceError(err));
    }
  };

  // Submit Delivered PIN via confirm_delivery RPC
  const handleVerifyDeliveredPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModalOrder || !deliveryPinInput.trim()) return;

    try {
      setIsVerifyingPin(true);
      setPinError(null);

      const success = await confirmDelivery(pinModalOrder.id, deliveryPinInput.trim());

      if (!success) {
        setPinError('That PIN is not correct. Please confirm with the buyer.');
        return;
      }

      // Success
      setPinModalOrder(null);
      setDeliveryPinInput('');
      await loadOrders();
      await loadStats();
    } catch (err: unknown) {
      setPinError(mapMarketplaceError(err));
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Trader updates payment status directly
  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded') => {
    try {
      await updateOrderPaymentStatus(orderId, paymentStatus);
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o))
      );
    } catch (err: unknown) {
      alert(mapMarketplaceError(err));
    }
  };

  // Submit Cancel Order
  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder || !cancelReasonInput.trim()) return;

    try {
      setIsCancelling(true);
      await updateOrderStatus({
        orderId: cancelModalOrder.id,
        status: 'cancelled',
        reason: cancelReasonInput.trim(),
      });
      setCancelModalOrder(null);
      setCancelReasonInput('');
      await loadOrders();
      await loadStats();
    } catch (err: unknown) {
      setErrorMessage(mapMarketplaceError(err));
    } finally {
      setIsCancelling(false);
    }
  };

  // Toggle Product Active State
  const handleToggleProductActive = async (prod: Product) => {
    try {
      await setProductActive(prod.id, !prod.isActive);
      setProducts((prev) =>
        prev.map((p) => (p.id === prod.id ? { ...p, isActive: !p.isActive } : p))
      );
    } catch (err: unknown) {
      setErrorMessage(mapMarketplaceError(err));
    }
  };

  // Open Product Modal (Add or Edit)
  const handleOpenProductModal = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setProductTitle(prod.title);
      setProductDescription(prod.description);
      setProductPrice(String(prod.price));
      setProductKind(prod.kind);
      setProductCategory(prod.category || 'Food & Grills');
      setProductEstimatedTime(prod.estimatedTime || '');
      setIsUnlimitedStock(prod.stockQuantity == null);
      setProductStock(prod.stockQuantity != null ? String(prod.stockQuantity) : '10');
      setProductImages(prod.images || []);
    } else {
      setEditingProduct(null);
      setProductTitle('');
      setProductDescription('');
      setProductPrice('');
      setProductKind('good');
      setProductCategory('Food & Grills');
      setProductEstimatedTime('');
      setIsUnlimitedStock(true);
      setProductStock('10');
      setProductImages([]);
    }
    setProductFormError(null);
    setIsProductModalOpen(true);
  };

  // Handle Image Upload for Product
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentUser) return;
    if (productImages.length >= 5) {
      setProductFormError('Maximum 5 images allowed per product.');
      return;
    }

    try {
      setIsUploadingImage(true);
      setProductFormError(null);
      const file = files[0];
      const uploadedUrl = await uploadProductImage(file, currentUser.id);
      setProductImages((prev) => [...prev, uploadedUrl].slice(0, 5));
    } catch (err: unknown) {
      setProductFormError(err instanceof Error ? err.message : 'Image upload failed');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Save Product (Create or Update)
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productTitle.trim() || !productPrice || !activeBiz?.id || !currentUser) return;

    try {
      setIsSavingProduct(true);
      setProductFormError(null);

      const price = Number(productPrice);
      if (isNaN(price) || price < 0) {
        setProductFormError('Please enter a valid price in Naira.');
        return;
      }

      const stockQuantity = isUnlimitedStock ? null : Math.max(0, parseInt(productStock, 10) || 0);

      if (editingProduct) {
        // UPDATE (only kind, title, description, price, images, category, estimated_time, stock_quantity, is_active)
        await updateProduct(editingProduct.id, {
          kind: productKind,
          title: productTitle.trim(),
          description: productDescription.trim(),
          price,
          images: productImages,
          category: productCategory,
          estimatedTime: productEstimatedTime.trim() || null,
          stockQuantity,
        });
      } else {
        // INSERT (only business_id, owner_id, kind, title, description, price, images, category, estimated_time, stock_quantity, is_active)
        await createProduct({
          businessId: activeBiz.id,
          ownerId: currentUser.id,
          kind: productKind,
          title: productTitle.trim(),
          description: productDescription.trim(),
          price,
          images: productImages,
          category: productCategory,
          estimatedTime: productEstimatedTime.trim() || null,
          stockQuantity,
          isActive: true,
        });
      }

      setIsProductModalOpen(false);
      await loadProducts();
    } catch (err: unknown) {
      setProductFormError(mapMarketplaceError(err));
    } finally {
      setIsSavingProduct(false);
    }
  };

  // Filter messages for this business
  const bizConversations = conversations.filter((c) => c.businessId === activeBiz?.id);

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-6 text-white font-sans space-y-6">
      
      {/* Top Header & Business Switcher */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-3xl bg-neutral-900 border border-neutral-800 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white">Verified Trader Operations Hub</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Supabase Engine
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              Live orders, PIN verification, product catalog, and buyer communications
            </p>
          </div>
        </div>

        {/* Business Switcher & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
          {myBusinesses.length > 1 && (
            <div className="relative">
              <select
                value={selectedBizId}
                onChange={(e) => {
                  setSelectedBizId(e.target.value);
                  const found = myBusinesses.find((b) => b.id === e.target.value);
                  if (found) onSelectBusiness?.(found);
                }}
                className="bg-neutral-950 border border-neutral-700 text-xs font-bold rounded-xl px-3 py-2 pr-8 text-white focus:outline-none focus:border-amber-500 appearance-none cursor-pointer"
              >
                {myBusinesses.map((biz) => (
                  <option key={biz.id} value={biz.id}>
                    {biz.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <FriendlyAlert
          message={errorMessage}
          onRetry={() => {
            loadStats();
            loadOrders();
            loadProducts();
          }}
          onDismiss={() => setErrorMessage(null)}
          variant="warning"
          isRetrying={isLoadingStats || isLoadingOrders || isLoadingProducts}
        />
      )}

      {/* Navigation Tabs (4 Tabs) */}
      <div className="flex items-center gap-2 border-b border-neutral-800 pb-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('orders')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
            activeTab === 'orders'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          <Package className="w-3.5 h-3.5" />
          <span>Orders</span>
          {newOrdersCount > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black">
              {newOrdersCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('products')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'products'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Products ({products.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('messages')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'messages'
              ? 'bg-amber-500 text-neutral-950 shadow-md'
              : 'bg-neutral-900 text-neutral-400 hover:text-white'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Messages ({bizConversations.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: OVERVIEW (Stats & Analytics)                      */}
      {/* ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* 4 Revenue & Activity Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                Revenue (Last 30 Days)
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {formatNaira(stats?.revenuePeriod || 0)}
              </div>
              <span className="text-[10px] text-neutral-500 block">
                Total All-Time: {formatNaira(stats?.revenueTotal || 0)}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                New Placed Orders
              </span>
              <div className="text-xl sm:text-2xl font-black text-rose-400 font-mono">
                {stats?.ordersNew || 0}
              </div>
              <span className="text-[10px] text-neutral-500 block">Needs immediate trader confirmation</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                Active in Prep / Transit
              </span>
              <div className="text-xl sm:text-2xl font-black text-sky-400 font-mono">
                {stats?.ordersActive || 0}
              </div>
              <span className="text-[10px] text-neutral-500 block">Hostel couriers moving</span>
            </div>

            <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 space-y-1">
              <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                Delivered Orders
              </span>
              <div className="text-xl sm:text-2xl font-black text-emerald-400 font-mono">
                {stats?.ordersDelivered || 0}
              </div>
              <span className="text-[10px] text-neutral-500 block">Verified via buyer PIN</span>
            </div>
          </div>

          {/* Owner Bank Payment Details Card (Loaded via get_payment_details RPC) */}
          <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <CreditCard className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Bank Payout Details</span>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/10 text-amber-300 font-normal">RPC Verified</span>
                </h4>
                <p className="text-[11px] text-neutral-400">Secured bank transfer destination for customer payouts</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3 text-xs w-full sm:w-auto bg-neutral-950 px-4 py-2.5 rounded-xl border border-neutral-800">
              <div>
                <span className="text-[10px] text-neutral-500 block uppercase font-semibold">Bank Name</span>
                <span className="font-semibold text-white">{bankDetails?.bank_name || 'Not Configured'}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 block uppercase font-semibold">Account Number</span>
                <span className="font-mono font-semibold text-amber-400">{bankDetails?.account_number || 'Not Configured'}</span>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500 block uppercase font-semibold">Account Name</span>
                <span className="font-semibold text-white">{bankDetails?.account_name || 'Not Configured'}</span>
              </div>
            </div>
          </div>

          {/* Simple 30-Day Revenue Bar Chart */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">30-Day Daily Revenue Activity</h3>
                <p className="text-[11px] text-neutral-400">Daily sales trend generated from completed hostel orders</p>
              </div>
              <span className="text-xs font-mono font-bold text-amber-400">
                {stats?.daily?.length || 0} active days
              </span>
            </div>

            {stats?.daily && stats.daily.length > 0 ? (
              <div className="h-44 flex items-end gap-1.5 pt-4 pb-2 border-b border-neutral-800 overflow-x-auto">
                {(() => {
                  const maxDailyRev = Math.max(...stats.daily.map((d) => d.revenue), 1000);
                  return stats.daily.map((d, idx) => {
                    const heightPercent = Math.max(8, Math.round((d.revenue / maxDailyRev) * 100));
                    return (
                      <div key={idx} className="flex-1 min-w-[20px] flex flex-col items-center gap-1 group relative">
                        {/* Hover Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-0.5 rounded bg-neutral-950 text-[10px] font-mono text-white whitespace-nowrap border border-neutral-700 pointer-events-none z-10">
                          {d.day}: {formatNaira(d.revenue)} ({d.orders} orders)
                        </div>
                        {/* Bar */}
                        <div 
                          style={{ height: `${heightPercent}%` }}
                          className="w-full rounded-t-md bg-gradient-to-t from-amber-600 to-amber-400 transition-all group-hover:brightness-125"
                        />
                        <span className="text-[9px] text-neutral-500 font-mono truncate max-w-[24px]">
                          {d.day.slice(-2)}
                        </span>
                      </div>
                    );
                  });
                })()}
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-xs text-neutral-500 border border-dashed border-neutral-800 rounded-2xl">
                No completed revenue recorded in the last 30 days yet.
              </div>
            )}
          </div>

          {/* Top 5 Products */}
          <div className="p-5 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3">
            <h3 className="text-sm font-bold text-white">Top 5 Campus Favorites</h3>
            {stats?.topProducts && stats.topProducts.length > 0 ? (
              <div className="divide-y divide-neutral-800">
                {stats.topProducts.slice(0, 5).map((p, idx) => (
                  <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-neutral-800 text-[10px] font-bold flex items-center justify-center text-neutral-400">
                        {idx + 1}
                      </span>
                      <span className="font-semibold text-white">{p.name}</span>
                    </div>
                    <div className="flex items-center gap-4 font-mono">
                      <span className="text-neutral-400">{p.qty} sold</span>
                      <span className="text-amber-400 font-bold">{formatNaira(p.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-neutral-500 py-4 text-center">
                Top products will appear here once orders are delivered.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: LIVE ORDERS INBOX                                 */}
      {/* ======================================================== */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          {/* Status Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(['all', 'placed', 'accepted', 'preparing', 'in_transit', 'delivered', 'cancelled'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setOrderStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                  orderStatusFilter === st
                    ? 'bg-amber-500 text-neutral-950'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                }`}
              >
                {st === 'all' ? 'All Orders' : st.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Orders List */}
          {isLoadingOrders ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-32 rounded-3xl bg-neutral-900 animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 px-4 bg-neutral-900 rounded-3xl border border-neutral-800 space-y-2">
              <Package className="w-10 h-10 text-neutral-600 mx-auto" />
              <h4 className="text-sm font-bold text-neutral-300">No orders found</h4>
              <p className="text-xs text-neutral-500">
                Orders placed by students for your items will appear in real time here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((order) => {
                const statusColor = 
                  order.status === 'delivered' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                  order.status === 'cancelled' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
                  'text-amber-400 bg-amber-500/10 border-amber-500/30';

                return (
                  <div
                    key={order.id}
                    className="p-4 sm:p-5 rounded-3xl bg-neutral-900 border border-neutral-800 space-y-3 hover:border-neutral-700 transition-colors"
                  >
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-2 border-b border-neutral-800/80">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-white">Order #{order.id.slice(0, 8)}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
                          {order.status}
                        </span>
                        <span className="text-[11px] text-neutral-400 font-mono">
                          {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="text-sm font-black font-mono text-amber-400">
                        {formatNaira(order.totalAmount)}
                      </div>
                    </div>

                    {/* Items List */}
                    <div className="text-xs text-neutral-300 space-y-1 bg-neutral-950 p-3 rounded-2xl border border-neutral-800/60">
                      {(order.items || []).map((item) => (
                        <div key={item.id} className="flex items-center justify-between">
                          <span>{item.quantity}x {item.productTitle || 'Campus Item'}</span>
                          <span className="font-mono text-neutral-400">{formatNaira(item.unitPrice * item.quantity)}</span>
                        </div>
                      ))}
                    </div>

                    {/* Buyer Details with Call / WhatsApp Links */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-neutral-950/60 p-3 rounded-2xl border border-neutral-800/60">
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5 text-neutral-200">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span>Delivery: <strong>{order.deliveryAddress}</strong></span>
                        </div>
                        {order.notes && (
                          <p className="text-[11px] text-neutral-400 italic">
                            Notes: "{order.notes}"
                          </p>
                        )}
                        <div className="flex items-center gap-2 pt-1 text-[11px] text-neutral-400">
                          <span>Payment: <strong className="text-white capitalize">{order.paymentMethod === 'transfer' ? 'Bank Transfer' : 'Pay on Delivery'}</strong></span>
                          <select
                            value={order.paymentStatus || 'pending'}
                            onChange={(e) => handleUpdatePaymentStatus(order.id, e.target.value as any)}
                            className="bg-neutral-800 text-amber-300 font-bold px-2 py-0.5 rounded border border-neutral-700 text-[10px] cursor-pointer"
                            title="Update payment status"
                          >
                            <option value="pending">Pending</option>
                            <option value="paid">Paid</option>
                            <option value="failed">Failed</option>
                            <option value="refunded">Refunded</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 sm:justify-end">
                        <span className="text-neutral-400">Contact:</span>
                        <a
                          href={`tel:${order.phone}`}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-medium"
                        >
                          <Phone className="w-3 h-3 text-amber-400" />
                          <span>Call</span>
                        </a>
                        <a
                          href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold"
                        >
                          <span>WhatsApp</span>
                        </a>
                      </div>
                    </div>

                    {/* ACTION BUTTONS (The ONE valid next action + Cancel) */}
                    <div className="flex items-center justify-between gap-3 pt-1">
                      {/* Cancel Option */}
                      {order.status !== 'delivered' && order.status !== 'cancelled' ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCancelModalOrder(order);
                            setCancelReasonInput('');
                          }}
                          className="text-xs text-rose-400 hover:text-rose-300 font-medium underline"
                        >
                          Cancel order
                        </button>
                      ) : (
                        <div />
                      )}

                      {/* Valid Next Action */}
                      <div className="flex items-center gap-2">
                        {order.status === 'placed' && (
                          <button
                            type="button"
                            onClick={() => handleTransitionStatus(order, 'accepted')}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md"
                          >
                            Accept Order →
                          </button>
                        )}

                        {order.status === 'accepted' && (
                          <button
                            type="button"
                            onClick={() => handleTransitionStatus(order, 'preparing')}
                            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-neutral-950 text-xs font-bold transition-all shadow-md"
                          >
                            Mark Preparing →
                          </button>
                        )}

                        {order.status === 'preparing' && (
                          <button
                            type="button"
                            onClick={() => handleTransitionStatus(order, 'in_transit')}
                            className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-bold transition-all shadow-md"
                          >
                            Out for Delivery (In Transit) →
                          </button>
                        )}

                        {order.status === 'in_transit' && (
                          <button
                            type="button"
                            onClick={() => handleTransitionStatus(order, 'delivered')}
                            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            <span>Mark Delivered (Enter PIN)</span>
                          </button>
                        )}

                        {order.status === 'delivered' && (
                          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4" /> Delivered & Completed
                          </span>
                        )}

                        {order.status === 'cancelled' && (
                          <span className="text-xs text-rose-400 font-bold">
                            Cancelled: {order.cancellationReason || 'No reason provided'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: PRODUCTS & SERVICES CATALOG                       */}
      {/* ======================================================== */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-neutral-400">
              Manage items, prices, turnaround, stock quantity, and visibility.
            </p>
            <button
              type="button"
              onClick={() => handleOpenProductModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold transition-all shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product / Service</span>
            </button>
          </div>

          {isLoadingProducts ? (
            <div className="space-y-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-20 rounded-2xl bg-neutral-900 animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 px-4 bg-neutral-900 rounded-3xl border border-neutral-800 space-y-3">
              <ShoppingBag className="w-10 h-10 text-neutral-600 mx-auto" />
              <h4 className="text-sm font-bold text-neutral-300">No products listed yet</h4>
              <p className="text-xs text-neutral-500 max-w-sm mx-auto">
                Add food combos, hostel laundry services, tech repair packages, or notes to start receiving student orders.
              </p>
              <button
                type="button"
                onClick={() => handleOpenProductModal()}
                className="px-4 py-2 rounded-xl bg-amber-500 text-neutral-950 font-bold text-xs"
              >
                + Add Your First Item
              </button>
            </div>
          ) : (
            <div className="divide-y divide-neutral-800 rounded-3xl bg-neutral-900 border border-neutral-800 overflow-hidden">
              {products.map((prod) => (
                <div
                  key={prod.id}
                  className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-neutral-850 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prod.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                      alt=""
                      className="w-12 h-12 rounded-xl object-cover border border-neutral-800 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate">{prod.title}</h4>
                        <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold uppercase ${
                          prod.kind === 'good' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {prod.kind}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-0.5">
                        <span className="font-mono text-amber-400 font-bold">{formatNaira(prod.price)}</span>
                        <span>•</span>
                        <span>{prod.stockQuantity == null ? 'Unlimited Stock' : `${prod.stockQuantity} in stock`}</span>
                        <span>•</span>
                        <span>{prod.soldCount} sold</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    {/* Toggle Active status */}
                    <button
                      type="button"
                      onClick={() => handleToggleProductActive(prod)}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                        prod.isActive
                          ? 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                          : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700'
                      }`}
                      title={prod.isActive ? 'Deactivate item' : 'Activate item'}
                    >
                      {prod.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{prod.isActive ? 'Active' : 'Hidden'}</span>
                    </button>

                    {/* Edit Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenProductModal(prod)}
                      className="p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
                      title="Edit product details"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: MESSAGES                                          */}
      {/* ======================================================== */}
      {activeTab === 'messages' && (
        <div className="space-y-3">
          <p className="text-xs text-neutral-400">
            Direct buyer messages for {activeBiz?.name}. Tapping any opens the marketplace conversation drawer.
          </p>

          {bizConversations.length === 0 ? (
            <div className="text-center py-16 px-4 bg-neutral-900 rounded-3xl border border-neutral-800 space-y-2">
              <MessageSquare className="w-10 h-10 text-neutral-600 mx-auto" />
              <h4 className="text-sm font-bold text-neutral-300">No buyer messages yet</h4>
              <p className="text-xs text-neutral-500">
                When students message your store about products or orders, they appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {bizConversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => openMarketplaceChat(conv.id)}
                  className="w-full p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-700 flex items-center justify-between text-left transition-colors"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white truncate">Buyer Inquiry</span>
                      {conv.status === 'blocked' && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-300">
                          Blocked
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-300 truncate mt-0.5">
                      {conv.lastMessage || 'No messages yet'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {conv.traderUnread > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500 text-neutral-950 text-[10px] font-black">
                        {conv.traderUnread}
                      </span>
                    )}
                    <span className="text-xs text-amber-400 font-bold">Open Chat →</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 1: DELIVERY PIN VERIFICATION MODAL                */}
      {/* ======================================================== */}
      {pinModalOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <KeyRound className="w-5 h-5" />
                <span>Verify Buyer Delivery PIN</span>
              </div>
              <button
                type="button"
                onClick={() => setPinModalOrder(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              Ask the student buyer for their <strong>4-digit PIN</strong> displayed on their order screen to confirm physical handover.
            </p>

            <form onSubmit={handleVerifyDeliveredPin} className="space-y-4">
              <input
                type="text"
                maxLength={4}
                autoFocus
                value={deliveryPinInput}
                onChange={(e) => setDeliveryPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="4-digit PIN (e.g. 8492)"
                className="w-full text-center font-mono text-2xl tracking-widest bg-neutral-950 border border-neutral-700 rounded-2xl py-3 text-amber-400 focus:outline-none focus:border-amber-500"
              />

              {pinError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                  {pinError}
                </div>
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPinModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-bold text-xs hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deliveryPinInput.length !== 4 || isVerifyingPin}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold text-xs transition-all disabled:opacity-40"
                >
                  {isVerifyingPin ? 'Verifying...' : 'Confirm Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: CANCEL ORDER WITH REASON                        */}
      {/* ======================================================== */}
      {cancelModalOrder && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-sm rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold text-rose-400">Cancel Order #{cancelModalOrder.id.slice(0, 8)}</h4>
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-neutral-300">
              Please provide a cancellation reason that will be displayed to the buyer.
            </p>

            <form onSubmit={handleConfirmCancel} className="space-y-3">
              <textarea
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="e.g. Ingredients ran out, storm prevented delivery..."
                rows={3}
                required
                className="w-full bg-neutral-950 border border-neutral-700 rounded-2xl p-3 text-xs text-white focus:outline-none focus:border-rose-500"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOrder(null)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-bold text-xs hover:bg-neutral-700"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!cancelReasonInput.trim() || isCancelling}
                  className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all disabled:opacity-40"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: ADD / EDIT PRODUCT                              */}
      {/* ======================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div 
            className="w-full max-w-lg rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-white space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
              <h3 className="text-sm font-bold text-white">
                {editingProduct ? 'Edit Product Details' : 'Add New Product / Service'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {productFormError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold">
                {productFormError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="space-y-4">
              {/* Kind Toggle: Good vs Service */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProductKind('good')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                    productKind === 'good'
                      ? 'bg-amber-500 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  Physical Good (Food, Tech, Fashion)
                </button>
                <button
                  type="button"
                  onClick={() => setProductKind('service')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                    productKind === 'service'
                      ? 'bg-emerald-500 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  Student Service (Repairs, Tutoring)
                </button>
              </div>

              {/* Title */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Product / Service Title *</label>
                <input
                  type="text"
                  required
                  value={productTitle}
                  onChange={(e) => setProductTitle(e.target.value)}
                  placeholder="e.g. Smoky Jollof with Turkey, iPhone Screen Replacement"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Price & Category */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Price (₦ Naira) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={productPrice}
                    onChange={(e) => setProductPrice(e.target.value)}
                    placeholder="2500"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-neutral-300">Category</label>
                  <select
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Food & Grills">Food & Grills</option>
                    <option value="Tech & Gadgets">Tech & Gadgets</option>
                    <option value="Fashion & Thrift">Fashion & Thrift</option>
                    <option value="Academics & Print">Academics & Print</option>
                    <option value="Beauty & Hair">Beauty & Hair</option>
                    <option value="Services & Repairs">Services & Repairs</option>
                  </select>
                </div>
              </div>

              {/* Estimated Time */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Estimated Turnaround / Prep Time</label>
                <input
                  type="text"
                  value={productEstimatedTime}
                  onChange={(e) => setProductEstimatedTime(e.target.value)}
                  placeholder="e.g. 15-20 Mins, Same Day, 2 Hours"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Stock Quantity */}
              <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-neutral-300">Stock Availability</span>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isUnlimitedStock}
                      onChange={(e) => setIsUnlimitedStock(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    <span>Unlimited Stock</span>
                  </label>
                </div>

                {!isUnlimitedStock && (
                  <div className="flex items-center gap-2 pt-1">
                    <span className="text-xs text-neutral-400">Available Quantity:</span>
                    <input
                      type="number"
                      min={0}
                      value={productStock}
                      onChange={(e) => setProductStock(e.target.value)}
                      className="w-24 bg-neutral-900 border border-neutral-700 rounded-xl px-3 py-1.5 text-xs text-white font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-neutral-300">Description</label>
                <textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  placeholder="Provide ingredients, specs, or delivery terms..."
                  rows={3}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Images (Max 5, uploaded to product-images bucket) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-neutral-300">
                    Product Images ({productImages.length}/5)
                  </label>
                  <label className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Image</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={isUploadingImage || productImages.length >= 5}
                      className="hidden"
                    />
                  </label>
                </div>

                {isUploadingImage && (
                  <p className="text-xs text-amber-400/80 animate-pulse">Compressing and uploading image...</p>
                )}

                {productImages.length > 0 && (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {productImages.map((url, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-neutral-700 shrink-0 group">
                        <img src={url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setProductImages((prev) => prev.filter((_, i) => i !== idx))}
                          className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 font-bold text-xs hover:bg-neutral-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProduct || !productTitle.trim() || !productPrice}
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs transition-all disabled:opacity-40"
                >
                  {isSavingProduct ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
