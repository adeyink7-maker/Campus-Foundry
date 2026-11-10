import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  CreditCard,
  X, 
  Store, 
  Plus, 
  Edit3, 
  Trash2, 
  AlertCircle, 
  RefreshCw, 
  Package, 
  Clock, 
  MapPin, 
  Phone, 
  ExternalLink,
  Eye,
  EyeOff,
  TrendingUp,
  KeyRound,
  CheckCircle2,
  Building2,
  XCircle,
  ShoppingBag
} from 'lucide-react';
import { Product, ProductKind, StudentBusiness, MarketplaceOrder, OrderStatus, DashboardStats } from '../types';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { 
  uploadProductImage, 
  deleteProduct, 
  formatNaira, 
  mapMarketplaceError,
  fetchTraderOrders,
  updateOrderStatus,
  confirmDelivery,
  updateOrderPaymentStatus,
  fetchDashboardStats,
  subscribeToTraderOrders
} from '../services/marketplace';
import { useAuth } from '../context/AuthContext';
import { CATEGORIES } from '../data/mockData';

export interface MyStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  myStore: StudentBusiness;
  onUpdateStore?: (updated: StudentBusiness) => void;
  onOpenStorePublicView?: (store: StudentBusiness) => void;
}

type MainTab = 'products' | 'orders' | 'stats';
type OrderTab = 'new' | 'active' | 'done';

export const MyStoreModal: React.FC<MyStoreModalProps> = ({
  isOpen,
  onClose,
  myStore,
  onUpdateStore,
  onOpenStorePublicView,
}) => {
  const { currentUser } = useAuth();

  // Active Main Tab: 'products' | 'orders' | 'stats'
  const [activeMainTab, setActiveMainTab] = useState<MainTab>('products');

  // Orders Sub-tab: 'new' (placed) | 'active' (accepted, preparing, in_transit) | 'done' (delivered, cancelled)
  const [orderSubTab, setOrderSubTab] = useState<OrderTab>('new');

  // Products List State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);

  // Trader Orders State
  const [orders, setOrders] = useState<MarketplaceOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState<string | null>(null);

  // Dashboard Stats State
  const [statsDays, setStatsDays] = useState<7 | 30>(30);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);

  // Mark Delivered PIN Modal State
  const [pinModalOrder, setPinModalOrder] = useState<MarketplaceOrder | null>(null);
  const [deliveryPinInput, setDeliveryPinInput] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [attemptsLeftMsg, setAttemptsLeftMsg] = useState<string | null>(null);
  const [isVerifyingPin, setIsVerifyingPin] = useState(false);

  // Cancel Order Modal State
  const [cancelModalOrder, setCancelModalOrder] = useState<MarketplaceOrder | null>(null);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Form Submodal State (for Add or Edit Product)
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Product Form Field States
  const [formKind, setFormKind] = useState<ProductKind>('good');
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formPrice, setFormPrice] = useState('');
  const [formCategory, setFormCategory] = useState(myStore.category || 'Food & Pastries');
  const [formEstimatedTime, setFormEstimatedTime] = useState('15 - 30 mins');
  const [formStockQuantity, setFormStockQuantity] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formImages, setFormImages] = useState<string[]>([]);

  // Image Uploading & Form Error States
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [imageUploadError, setImageUploadError] = useState<string | null>(null);
  const [formSubmitError, setFormSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Action status toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Owner bank details loaded via get_payment_details RPC
  const [bankDetails, setBankDetails] = useState<{
    bank_name?: string;
    account_number?: string;
    account_name?: string;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadPaymentDetails() {
      if (isOpen && isSupabaseConfigured && myStore?.id) {
        try {
          const { data } = await supabase.rpc('get_payment_details', { p_business: myStore.id });
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
  }, [isOpen, myStore?.id]);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Lock scroll when modal or form is open
  useEffect(() => {
    if (isOpen || isFormOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen, isFormOpen]);

  // Load Products
  const loadStoreProducts = useCallback(async () => {
    if (!isSupabaseConfigured || !myStore?.id || !currentUser?.id) {
      setIsLoadingProducts(false);
      return;
    }

    try {
      setIsLoadingProducts(true);
      setProductsError(null);

      const { data, error } = await supabase
        .from('products')
        .select(`
          id, business_id, owner_id, kind, title, description, price, images,
          category, estimated_time, stock_quantity, is_active, sold_count,
          created_at, updated_at
        `)
        .eq('business_id', myStore.id)
        .eq('owner_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === '42501') {
          if (myStore.services && Array.isArray(myStore.services) && myStore.services.length > 0) {
            const fallbackProducts: Product[] = myStore.services.map((s, idx) => ({
              id: s.id || `srv_${myStore.id}_${idx}`,
              businessId: myStore.id,
              ownerId: currentUser.id,
              kind: 'service',
              title: s.name,
              description: s.description || '',
              price: Number(s.price) || 0,
              images: [myStore.imageUrl],
              category: myStore.category,
              estimatedTime: 'Same Day',
              stockQuantity: null,
              isActive: true,
              soldCount: 0,
            }));
            setProducts(fallbackProducts);
            setProductsError(null);
            return;
          }
          setProducts([]);
          setProductsError(null);
          return;
        }
        setProductsError('Unable to load products. Please check your connection.');
        return;
      }

      const mapped: Product[] = (data || []).map((row: any) => ({
        id: row.id,
        businessId: row.business_id,
        ownerId: row.owner_id,
        kind: row.kind,
        title: row.title,
        description: row.description || '',
        price: Number(row.price) || 0,
        images: Array.isArray(row.images) ? row.images : [],
        category: row.category,
        estimatedTime: row.estimated_time,
        stockQuantity: row.stock_quantity != null ? Number(row.stock_quantity) : null,
        isActive: row.is_active !== false,
        soldCount: Number(row.sold_count) || 0,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }));

      setProducts(mapped);
    } catch (err: any) {
      setProductsError('Unable to load products. Please try again.');
    } finally {
      setIsLoadingProducts(false);
    }
  }, [myStore?.id, currentUser?.id]);

  // Load Trader Orders
  const loadTraderOrdersList = useCallback(async () => {
    if (!isSupabaseConfigured || !myStore?.id) {
      setIsLoadingOrders(false);
      return;
    }

    try {
      setIsLoadingOrders(true);
      setOrdersError(null);
      const data = await fetchTraderOrders({
        businessId: myStore.id,
        status: 'all',
      });
      setOrders(data);
    } catch (err: unknown) {
      console.warn('[MyStore] loadTraderOrders error:', err);
      setOrdersError(mapMarketplaceError(err));
    } finally {
      setIsLoadingOrders(false);
    }
  }, [myStore?.id]);

  // Load Dashboard Stats
  const loadTraderStats = useCallback(async () => {
    if (!isSupabaseConfigured || !myStore?.id) return;

    try {
      setIsLoadingStats(true);
      setStatsError(null);
      const data = await fetchDashboardStats(myStore.id, statsDays);
      setStats(data);
    } catch (err: unknown) {
      console.warn('[MyStore] loadTraderStats error:', err);
      setStatsError(mapMarketplaceError(err));
    } finally {
      setIsLoadingStats(false);
    }
  }, [myStore?.id, statsDays]);

  useEffect(() => {
    if (isOpen) {
      loadStoreProducts();
      loadTraderOrdersList();
      loadTraderStats();
    }
  }, [isOpen, loadStoreProducts, loadTraderOrdersList, loadTraderStats]);

  // Realtime subscription + 30-second polling fallback for orders
  useEffect(() => {
    if (!isOpen || !myStore?.id) return;

    const unsubscribe = subscribeToTraderOrders(myStore.id, () => {
      loadTraderOrdersList();
      loadTraderStats();
    });

    const intervalId = setInterval(() => {
      loadTraderOrdersList();
      loadTraderStats();
    }, 30000);

    return () => {
      unsubscribe();
      clearInterval(intervalId);
    };
  }, [isOpen, myStore?.id, loadTraderOrdersList, loadTraderStats]);

  // Count of new orders (status = 'placed') for red badge
  const newOrdersCount = orders.filter((o) => o.status === 'placed').length;

  // Categorize orders into the 3 sub-tabs
  const newOrders = orders.filter((o) => o.status === 'placed');
  const activeOrders = orders.filter((o) => ['accepted', 'preparing', 'in_transit'].includes(o.status));
  const doneOrders = orders.filter((o) => ['delivered', 'cancelled'].includes(o.status));

  const currentTabOrders = 
    orderSubTab === 'new' ? newOrders :
    orderSubTab === 'active' ? activeOrders :
    doneOrders;

  // Status Action Transitions
  const handleTransitionStatus = async (order: MarketplaceOrder, nextStatus: OrderStatus) => {
    if (nextStatus === 'delivered') {
      setPinModalOrder(order);
      setDeliveryPinInput('');
      setPinError(null);
      setAttemptsLeftMsg(null);
      return;
    }

    try {
      await updateOrderStatus({
        orderId: order.id,
        status: nextStatus,
      });
      await loadTraderOrdersList();
      await loadTraderStats();
      showToast(`Order status updated to ${nextStatus.replace('_', ' ')}.`);
    } catch (err: unknown) {
      showToast(mapMarketplaceError(err));
    }
  };

  // Submit Delivered PIN
  const handleVerifyDeliveredPin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinModalOrder || !deliveryPinInput.trim()) return;

    try {
      setIsVerifyingPin(true);
      setPinError(null);
      setAttemptsLeftMsg(null);

      const success = await confirmDelivery(pinModalOrder.id, deliveryPinInput.trim());

      if (!success) {
        setPinError(`That PIN is not correct. Please confirm with the buyer.`);
        return;
      }

      setPinModalOrder(null);
      setDeliveryPinInput('');
      await loadTraderOrdersList();
      await loadTraderStats();
      showToast('Order successfully marked as delivered!');
    } catch (err: unknown) {
      setPinError(mapMarketplaceError(err));
    } finally {
      setIsVerifyingPin(false);
    }
  };

  // Submit Cancel Order with Reason
  const handleConfirmCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelModalOrder || !cancelReasonInput.trim()) return;

    try {
      setIsCancelling(true);
      setCancelError(null);
      await updateOrderStatus({
        orderId: cancelModalOrder.id,
        status: 'cancelled',
        reason: cancelReasonInput.trim(),
      });
      setCancelModalOrder(null);
      setCancelReasonInput('');
      await loadTraderOrdersList();
      await loadTraderStats();
      showToast('Order cancelled.');
    } catch (err: unknown) {
      setCancelError(mapMarketplaceError(err));
    } finally {
      setIsCancelling(false);
    }
  };

  // Trader updates payment_status directly
  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded') => {
    try {
      await updateOrderPaymentStatus(orderId, paymentStatus);
      setOrders((prev: MarketplaceOrder[]) =>
        prev.map((o) => (o.id === orderId ? { ...o, paymentStatus } : o))
      );
      showToast(`Payment status updated to ${paymentStatus}.`);
    } catch (err: unknown) {
      showToast(mapMarketplaceError(err));
    }
  };

  if (!isOpen) return null;

  // Open Form for Adding New Product
  const handleOpenAddProduct = () => {
    setEditingProduct(null);
    setFormKind('good');
    setFormTitle('');
    setFormDescription('');
    setFormPrice('');
    setFormCategory(myStore.category || 'Food & Pastries');
    setFormEstimatedTime('15 - 30 mins');
    setFormStockQuantity('');
    setFormIsActive(true);
    setFormImages(myStore.imageUrl ? [myStore.imageUrl] : []);
    setImageUploadError(null);
    setFormSubmitError(null);
    setIsFormOpen(true);
  };

  // Open Form for Editing Existing Product
  const handleOpenEditProduct = (prod: Product) => {
    setEditingProduct(prod);
    setFormKind(prod.kind);
    setFormTitle(prod.title);
    setFormDescription(prod.description);
    setFormPrice(prod.price.toString());
    setFormCategory(prod.category || myStore.category);
    setFormEstimatedTime(prod.estimatedTime || '15 - 30 mins');
    setFormStockQuantity(prod.stockQuantity != null ? prod.stockQuantity.toString() : '');
    setFormIsActive(prod.isActive);
    setFormImages(Array.isArray(prod.images) ? [...prod.images] : []);
    setImageUploadError(null);
    setFormSubmitError(null);
    setIsFormOpen(true);
  };

  // Handle Image Upload using uploadProductImage into product-images bucket
  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !currentUser) return;

    if (formImages.length + files.length > 4) {
      setImageUploadError('Maximum of 4 images allowed per product listing.');
      return;
    }

    setIsUploadingImage(true);
    setImageUploadError(null);

    try {
      const newUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const url = await uploadProductImage(file, currentUser.id);
        newUrls.push(url);
      }

      setFormImages((prev) => [...prev, ...newUrls].slice(0, 4));
      showToast('Image uploaded and optimized.');
    } catch (err: any) {
      console.error('[MyStore] Image upload error:', err);
      setImageUploadError(err.message || 'Image upload failed.');
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setFormImages((prev) => prev.filter((_, i) => i !== indexToRemove));
  };

  // Toggle Product Active / Inactive Status
  const handleToggleProductActive = async (prod: Product) => {
    if (!currentUser) return;
    const nextStatus = !prod.isActive;

    setProducts((prev) => prev.map((p) => (p.id === prod.id ? { ...p, isActive: nextStatus } : p)));

    try {
      const { error } = await supabase
        .from('products')
        .update({
          is_active: nextStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prod.id)
        .eq('owner_id', currentUser.id);

      if (error) throw error;
      showToast(`Product ${nextStatus ? 'activated' : 'hidden from market'}.`);
    } catch (err: any) {
      setProducts((prev) => prev.map((p) => (p.id === prod.id ? { ...p, isActive: prod.isActive } : p)));
      showToast('Failed to update product status.');
    }
  };

  // Delete Product Directly
  const handleDeleteProduct = async (prod: Product) => {
    if (!currentUser) return;
    const confirmed = window.confirm(`Are you sure you want to delete "${prod.title}"? This cannot be undone.`);
    if (!confirmed) return;

    try {
      await deleteProduct(prod.id, currentUser.id);
      setProducts((prev) => prev.filter((p) => p.id !== prod.id));
      showToast(`"${prod.title}" deleted successfully.`);
    } catch (err: any) {
      showToast('Failed to delete product. Please try again.');
    }
  };

  // Handle Add/Edit Product Submission
  const handleFormSubmit = async (e?: React.FormEvent) => {
    if (e?.preventDefault) e.preventDefault();
    if (!currentUser) return;

    const trimmedTitle = formTitle.trim();
    if (trimmedTitle.length < 2 || trimmedTitle.length > 120) {
      setFormSubmitError('Product title must be between 2 and 120 characters.');
      return;
    }

    if (formDescription.length > 2000) {
      setFormSubmitError('Description cannot exceed 2000 characters.');
      return;
    }

    const parsedPrice = Number(formPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormSubmitError('Price must be 0 or more in Nigerian Naira.');
      return;
    }

    let parsedStock: number | null = null;
    if (formStockQuantity.trim() !== '') {
      const parsed = parseInt(formStockQuantity, 10);
      if (isNaN(parsed) || parsed < 0) {
        setFormSubmitError('Stock quantity must be 0 or more (or leave blank for unlimited).');
        return;
      }
      parsedStock = parsed;
    }

    setIsSubmitting(true);
    setFormSubmitError(null);

    try {
      if (editingProduct) {
        const payload = {
          kind: formKind,
          title: trimmedTitle,
          description: formDescription.trim(),
          price: Math.max(0, Math.round(parsedPrice)),
          category: formCategory,
          estimated_time: formEstimatedTime.trim() || null,
          stock_quantity: parsedStock,
          is_active: formIsActive,
          images: formImages.slice(0, 4),
          updated_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
          .from('products')
          .update(payload)
          .eq('id', editingProduct.id)
          .eq('owner_id', currentUser.id)
          .select(`
            id, business_id, owner_id, kind, title, description, price, images,
            category, estimated_time, stock_quantity, is_active, sold_count,
            created_at, updated_at
          `)
          .single();

        if (error) throw new Error(mapMarketplaceError(error));

        const updatedProd: Product = {
          id: data.id,
          businessId: data.business_id,
          ownerId: data.owner_id,
          kind: data.kind,
          title: data.title,
          description: data.description || '',
          price: Number(data.price) || 0,
          images: Array.isArray(data.images) ? data.images : [],
          category: data.category,
          estimatedTime: data.estimated_time,
          stockQuantity: data.stock_quantity != null ? Number(data.stock_quantity) : null,
          isActive: data.is_active !== false,
          soldCount: Number(data.sold_count) || 0,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setProducts((prev) => prev.map((p) => (p.id === updatedProd.id ? updatedProd : p)));
        showToast('Product updated successfully!');
      } else {
        const payload = {
          business_id: myStore.id,
          owner_id: currentUser.id,
          kind: formKind,
          title: trimmedTitle,
          description: formDescription.trim(),
          price: Math.max(0, Math.round(parsedPrice)),
          category: formCategory,
          estimated_time: formEstimatedTime.trim() || null,
          stock_quantity: parsedStock,
          is_active: formIsActive,
          images: formImages.slice(0, 4),
        };

        const { data, error } = await supabase
          .from('products')
          .insert(payload)
          .select(`
            id, business_id, owner_id, kind, title, description, price, images,
            category, estimated_time, stock_quantity, is_active, sold_count,
            created_at, updated_at
          `)
          .single();

        if (error) throw new Error(mapMarketplaceError(error));

        const newProd: Product = {
          id: data.id,
          businessId: data.business_id,
          ownerId: data.owner_id,
          kind: data.kind,
          title: data.title,
          description: data.description || '',
          price: Number(data.price) || 0,
          images: Array.isArray(data.images) ? data.images : [],
          category: data.category,
          estimatedTime: data.estimated_time,
          stockQuantity: data.stock_quantity != null ? Number(data.stock_quantity) : null,
          isActive: data.is_active !== false,
          soldCount: Number(data.sold_count) || 0,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        setProducts((prev) => [newProd, ...prev]);
        showToast('New product added to your store!');
      }

      setIsFormOpen(false);
    } catch (err: any) {
      setFormSubmitError(err.message || 'Failed to save product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div 
        className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      >
        <div 
          className="relative flex flex-col max-h-[90dvh] h-full sm:h-auto w-full sm:max-w-3xl overflow-hidden rounded-t-3xl sm:rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl text-white"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="shrink-0 flex items-center justify-between border-b border-neutral-800 bg-gradient-to-r from-orange-950/80 via-neutral-900 to-neutral-950 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30 shrink-0">
                <Store className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-extrabold text-white">{myStore.name}</h2>
                  {newOrdersCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-600 text-white animate-pulse">
                      {newOrdersCount} NEW
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400">
                  {myStore.category} • {myStore.hostelLocation}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenStorePublicView && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenStorePublicView(myStore);
                  }}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold transition-colors"
                  title="View how buyers see your store"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-neutral-400" />
                  <span>Public View</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Top Main Navigation Tabs: Products | Orders | Stats */}
          <div className="shrink-0 flex items-center gap-2 border-b border-neutral-800 bg-neutral-950 px-6 py-2 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveMainTab('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === 'products'
                  ? 'bg-orange-500 text-neutral-950 shadow-md'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>Products ({products.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer relative ${
                activeMainTab === 'orders'
                  ? 'bg-orange-500 text-neutral-950 shadow-md'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Trader Orders</span>
              {newOrdersCount > 0 && (
                <span className="ml-1 px-2 py-0.2 rounded-full bg-rose-600 text-white text-[10px] font-black">
                  {newOrdersCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveMainTab('stats')}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeMainTab === 'stats'
                  ? 'bg-orange-500 text-neutral-950 shadow-md'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>Stats Card</span>
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-6 overscroll-contain">
            
            {/* TAB 1: PRODUCTS & CATALOG MANAGEMENT */}
            {activeMainTab === 'products' && (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-3.5 text-center">
                    <span className="text-[11px] font-medium text-neutral-400 block">Total Listings</span>
                    <span className="text-lg font-mono font-bold text-white mt-0.5 block">{products.length}</span>
                  </div>
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-3.5 text-center">
                    <span className="text-[11px] font-medium text-neutral-400 block">Active Live</span>
                    <span className="text-lg font-mono font-bold text-emerald-400 mt-0.5 block">
                      {products.filter((p) => p.isActive).length}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-3.5 text-center">
                    <span className="text-[11px] font-medium text-neutral-400 block">Hostel Delivery</span>
                    <span className="text-xs font-bold text-amber-400 mt-1.5 block">
                      {myStore.acceptsHostelDelivery ? 'Enabled' : 'Pickup Only'}
                    </span>
                  </div>
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-3.5 text-center">
                    <span className="text-[11px] font-medium text-neutral-400 block">WhatsApp Contact</span>
                    <span className="text-xs font-mono text-neutral-300 mt-1.5 block truncate">
                      {myStore.whatsapp}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 uppercase tracking-wider">
                      <Package className="h-4 w-4 text-orange-400" />
                      <span>Store Products ({products.length})</span>
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAddProduct}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    <Plus className="h-4 w-4 stroke-[2.5]" />
                    <span>Add Product</span>
                  </button>
                </div>

                {isLoadingProducts ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 flex items-center gap-3 animate-pulse">
                        <div className="h-16 w-16 rounded-xl bg-neutral-800 shrink-0" />
                        <div className="space-y-2 flex-1">
                          <div className="h-4 w-1/3 rounded bg-neutral-800" />
                          <div className="h-3 w-1/2 rounded bg-neutral-800" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : productsError ? (
                  <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-8 text-center space-y-3">
                    <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">{productsError}</h4>
                    <button
                      type="button"
                      onClick={loadStoreProducts}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-neutral-800 text-xs font-bold text-white border border-neutral-700"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Retry</span>
                    </button>
                  </div>
                ) : products.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-neutral-800 bg-neutral-950/40 p-8 text-center space-y-4">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400 border border-orange-500/20">
                      <Package className="h-7 w-7" />
                    </div>
                    <h4 className="text-base font-bold text-white">Add your first product</h4>
                    <button
                      type="button"
                      onClick={handleOpenAddProduct}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-bold"
                    >
                      <Plus className="h-4 w-4 stroke-[2.5]" />
                      <span>+ Add Your First Product</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {products.map((prod) => (
                      <div
                        key={prod.id}
                        className={`rounded-2xl border p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          prod.isActive
                            ? 'border-neutral-800 bg-neutral-950/70 hover:border-neutral-700'
                            : 'border-neutral-800/60 bg-neutral-950/30 opacity-70'
                        }`}
                      >
                        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
                          <div className="relative h-16 w-16 rounded-xl bg-neutral-900 border border-neutral-800 shrink-0 overflow-hidden">
                            {prod.images && prod.images.length > 0 ? (
                              <img src={prod.images[0]} alt={prod.title} className="h-full w-full object-cover" />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center text-neutral-500">
                                <Package className="h-6 w-6" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm font-bold text-white truncate">{prod.title}</h4>
                            <div className="flex items-center gap-3 mt-1.5 text-xs">
                              <span className="font-mono font-bold text-orange-400">{formatNaira(prod.price)}</span>
                              <span className="text-neutral-500">·</span>
                              <span className="text-neutral-400 text-[11px]">
                                {prod.stockQuantity == null ? 'Unlimited Stock' : `${prod.stockQuantity} in stock`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-neutral-800">
                          <button
                            type="button"
                            onClick={() => handleToggleProductActive(prod)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              prod.isActive
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                                : 'bg-neutral-800 border-neutral-700 text-neutral-400'
                            }`}
                          >
                            {prod.isActive ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            <span>{prod.isActive ? 'Active' : 'Hidden'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(prod)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-neutral-700 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                            <span>Edit</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod)}
                            className="p-2 rounded-xl border border-neutral-800 bg-neutral-900 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: TRADER ORDERS SCREEN */}
            {activeMainTab === 'orders' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setOrderSubTab('new')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        orderSubTab === 'new'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                      }`}
                    >
                      <span>New</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-neutral-800 text-[10px] font-mono">
                        {newOrders.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderSubTab('active')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        orderSubTab === 'active'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                      }`}
                    >
                      <span>Active</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-neutral-800 text-[10px] font-mono">
                        {activeOrders.length}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setOrderSubTab('done')}
                      className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                        orderSubTab === 'done'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : 'bg-neutral-950 text-neutral-400 border border-neutral-800 hover:text-white'
                      }`}
                    >
                      <span>Done</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-neutral-800 text-[10px] font-mono">
                        {doneOrders.length}
                      </span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={loadTraderOrdersList}
                    className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
                    title="Refresh orders"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingOrders ? 'animate-spin' : ''}`} />
                  </button>
                </div>

                {ordersError ? (
                  <div className="p-8 rounded-3xl bg-neutral-950 border border-neutral-800 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">{ordersError}</h4>
                    <button
                      type="button"
                      onClick={loadTraderOrdersList}
                      className="px-4 py-2 rounded-xl bg-neutral-800 text-white font-bold text-xs"
                    >
                      Retry
                    </button>
                  </div>
                ) : isLoadingOrders && orders.length === 0 ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="h-36 rounded-3xl bg-neutral-950 animate-pulse border border-neutral-800" />
                    ))}
                  </div>
                ) : currentTabOrders.length === 0 ? (
                  <div className="text-center py-16 px-4 bg-neutral-950 rounded-3xl border border-neutral-800 space-y-2">
                    <Package className="w-10 h-10 text-neutral-600 mx-auto" />
                    <h4 className="text-sm font-bold text-white">No orders yet</h4>
                    <p className="text-xs text-neutral-400">
                      {orderSubTab === 'new' ? 'New orders placed by students will appear here in real time.' :
                       orderSubTab === 'active' ? 'Orders currently accepted, being prepared or in transit.' :
                       'Completed and cancelled orders will be archived here.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {currentTabOrders.map((order) => {
                      const buyerPhone = order.buyerPhone || order.phone || '';
                      const statusColor = 
                        order.status === 'delivered' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' :
                        order.status === 'cancelled' ? 'text-rose-400 bg-rose-500/10 border-rose-500/30' :
                        'text-amber-400 bg-amber-500/10 border-amber-500/30';

                      return (
                        <div
                          key={order.id}
                          className="p-5 rounded-3xl bg-neutral-950 border border-neutral-800 space-y-3.5 hover:border-neutral-700 transition-all shadow-lg"
                        >
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-neutral-800">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-extrabold text-white">
                                  Order #{order.orderNumber || order.id.slice(0, 8)}
                                </span>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColor}`}>
                                  {order.status.replace('_', ' ')}
                                </span>
                              </div>
                              <p className="text-xs text-neutral-400 mt-0.5">
                                Buyer: <strong className="text-white">{order.buyerName || 'Student Buyer'}</strong> · {new Date(order.createdAt).toLocaleString()}
                              </p>
                            </div>

                            <div className="text-base font-black font-mono text-orange-400">
                              {formatNaira(order.grandTotal || order.totalAmount)}
                            </div>
                          </div>

                          <div className="text-xs text-neutral-300 space-y-1 bg-neutral-900/70 p-3.5 rounded-2xl border border-neutral-800/80">
                            {(order.items || []).map((item) => (
                              <div key={item.id} className="flex items-center justify-between">
                                <span>{item.quantity}x {item.productTitle || 'Campus Item'}</span>
                                <span className="font-mono text-neutral-400">{formatNaira(item.unitPrice * item.quantity)}</span>
                              </div>
                            ))}
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-neutral-900/50 p-3.5 rounded-2xl border border-neutral-800/60">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 text-neutral-200">
                                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                <span>Address: <strong>{order.deliveryAddress}</strong></span>
                              </div>
                              {order.notes && (
                                <p className="text-[11px] text-neutral-400 italic">
                                  Notes: "{order.notes}"
                                </p>
                              )}
                              <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-neutral-400 pt-1">
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

                            <div className="flex items-center gap-2 sm:justify-end">
                              {buyerPhone ? (
                                <>
                                  <a
                                    href={`tel:${buyerPhone}`}
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold transition-colors"
                                  >
                                    <Phone className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Call Buyer</span>
                                  </a>
                                  <a
                                    href={`https://wa.me/${buyerPhone.replace(/[^0-9]/g, '')}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-bold transition-colors"
                                  >
                                    <span>WhatsApp</span>
                                  </a>
                                </>
                              ) : (
                                <span className="text-neutral-500 text-[11px]">No contact phone</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-3 pt-2 border-t border-neutral-800">
                            {order.status !== 'delivered' && order.status !== 'cancelled' ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setCancelModalOrder(order);
                                  setCancelReasonInput('');
                                  setCancelError(null);
                                }}
                                className="px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs font-bold transition-colors cursor-pointer"
                              >
                                Cancel Order
                              </button>
                            ) : (
                              <div />
                            )}

                            <div className="flex items-center gap-2">
                              {order.status === 'placed' && (
                                <button
                                  type="button"
                                  onClick={() => handleTransitionStatus(order, 'accepted')}
                                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-extrabold transition-all shadow-md cursor-pointer"
                                >
                                  Accept Order →
                                </button>
                              )}

                              {order.status === 'accepted' && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => handleTransitionStatus(order, 'preparing')}
                                    className="px-3.5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-neutral-950 text-xs font-extrabold transition-all shadow-md cursor-pointer"
                                  >
                                    Preparing
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTransitionStatus(order, 'in_transit')}
                                    className="px-3.5 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-extrabold transition-all shadow-md cursor-pointer"
                                  >
                                    Out for Delivery →
                                  </button>
                                </>
                              )}

                              {order.status === 'preparing' && (
                                <button
                                  type="button"
                                  onClick={() => handleTransitionStatus(order, 'in_transit')}
                                  className="px-4 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white text-xs font-extrabold transition-all shadow-md cursor-pointer"
                                >
                                  Out for Delivery →
                                </button>
                              )}

                              {order.status === 'in_transit' && (
                                <button
                                  type="button"
                                  onClick={() => handleTransitionStatus(order, 'delivered')}
                                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-extrabold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                  <span>Mark Delivered</span>
                                </button>
                              )}

                              {order.status === 'delivered' && (
                                <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-4 h-4" /> Order Completed
                                </span>
                              )}

                              {order.status === 'cancelled' && (
                                <span className="text-xs text-rose-400 font-medium">
                                  Cancelled ({order.cancellationReason || order.cancelReason || 'No reason'})
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

            {/* TAB 3: STATS CARD */}
            {activeMainTab === 'stats' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                  <div>
                    <h3 className="text-sm font-bold text-white">Store Analytics & Revenue</h3>
                    <p className="text-xs text-neutral-400">Live statistics computed via trader_dashboard_stats RPC</p>
                  </div>

                  <div className="flex items-center gap-1 bg-neutral-900 p-1 rounded-xl border border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setStatsDays(7)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        statsDays === 7 ? 'bg-orange-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      7 Days
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatsDays(30)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        statsDays === 30 ? 'bg-orange-500 text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      30 Days
                    </button>
                  </div>
                </div>

                {/* Owner Bank Payout Card (via get_payment_details RPC) */}
                <div className="p-4 rounded-2xl bg-neutral-950 border border-orange-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Owner Bank Details</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-orange-500/10 text-orange-300 font-normal">RPC Secured</span>
                      </h4>
                      <p className="text-[11px] text-neutral-400">Destination for bank transfers & direct payouts</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-xs w-full sm:w-auto bg-neutral-900 px-4 py-2.5 rounded-xl border border-neutral-800">
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase font-semibold">Bank Name</span>
                      <span className="font-semibold text-white">{bankDetails?.bank_name || 'Not Configured'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase font-semibold">Account Number</span>
                      <span className="font-mono font-semibold text-orange-400">{bankDetails?.account_number || 'Not Configured'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-neutral-500 block uppercase font-semibold">Account Name</span>
                      <span className="font-semibold text-white">{bankDetails?.account_name || 'Not Configured'}</span>
                    </div>
                  </div>
                </div>

                {statsError ? (
                  <div className="p-8 rounded-3xl bg-neutral-950 border border-neutral-800 text-center space-y-3">
                    <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                    <h4 className="text-sm font-bold text-white">{statsError}</h4>
                    <button
                      type="button"
                      onClick={loadTraderStats}
                      className="px-4 py-2 rounded-xl bg-neutral-800 text-white font-bold text-xs"
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                        <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                          Revenue (All Time)
                        </span>
                        <div className="text-lg sm:text-2xl font-black text-amber-400 font-mono">
                          {formatNaira(stats?.revenueTotal || 0)}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                        <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                          Revenue ({statsDays} Days)
                        </span>
                        <div className="text-lg sm:text-2xl font-black text-amber-400 font-mono">
                          {formatNaira(stats?.revenuePeriod || 0)}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                        <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                          New Orders
                        </span>
                        <div className="text-lg sm:text-2xl font-black text-rose-400 font-mono">
                          {stats?.ordersNew || 0}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                        <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                          Active Orders
                        </span>
                        <div className="text-lg sm:text-2xl font-black text-sky-400 font-mono">
                          {stats?.ordersActive || 0}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                        <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                          Delivered Orders
                        </span>
                        <div className="text-lg sm:text-2xl font-black text-emerald-400 font-mono">
                          {stats?.ordersDelivered || 0}
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-1">
                        <span className="text-[11px] text-neutral-400 uppercase tracking-wider font-semibold">
                          Cancelled Orders
                        </span>
                        <div className="text-lg sm:text-2xl font-black text-neutral-400 font-mono">
                          {stats?.ordersCancelled || 0}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 rounded-3xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-white">Daily Revenue Activity</h3>
                        <span className="text-xs font-mono text-amber-400 font-bold">
                          {stats?.daily?.length || 0} days
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
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 px-2 py-0.5 rounded bg-neutral-900 text-[10px] font-mono text-white whitespace-nowrap border border-neutral-700 pointer-events-none z-10">
                                    {d.day}: {formatNaira(d.revenue)} ({d.orders} orders)
                                  </div>
                                  <div 
                                    style={{ height: `${heightPercent}%` }}
                                    className="w-full rounded-t-md bg-gradient-to-t from-orange-600 to-orange-400 transition-all group-hover:brightness-125"
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
                          No daily sales activity recorded in this period yet.
                        </div>
                      )}
                    </div>

                    <div className="p-5 rounded-3xl bg-neutral-950 border border-neutral-800 space-y-3">
                      <h3 className="text-sm font-bold text-white">Top Products</h3>
                      {stats?.topProducts && stats.topProducts.length > 0 ? (
                        <div className="divide-y divide-neutral-800">
                          {stats.topProducts.map((p, idx) => (
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
                          Top products will be calculated once orders are delivered.
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

          </div>

          {/* Toast Notification */}
          {toastMessage && (
            <div className="absolute bottom-4 left-6 right-6 z-50 flex items-center justify-center pointer-events-none">
              <div className="rounded-2xl border border-orange-500/40 bg-neutral-950/95 px-4 py-2.5 text-xs font-bold text-orange-300 shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-bottom-2">
                {toastMessage}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: 4-DIGIT DELIVERY PIN VERIFICATION MODAL */}
      {pinModalOrder && (
        <div 
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setPinModalOrder(null)}
        >
          <div 
            className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
                <KeyRound className="w-5 h-5" />
                <span>Verify Delivery PIN</span>
              </div>
              <button
                type="button"
                onClick={() => setPinModalOrder(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-neutral-200 font-medium">
                Ask the buyer for their delivery PIN.
              </p>

              {pinModalOrder.paymentMethod === 'transfer' && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Confirm the transfer arrived before handing over the goods.</span>
                </div>
              )}
            </div>

            {pinError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs space-y-1">
                <div>{pinError}</div>
                {attemptsLeftMsg && <div className="font-bold text-rose-200">{attemptsLeftMsg}</div>}
              </div>
            )}

            <form onSubmit={handleVerifyDeliveredPin} className="space-y-4">
              <input
                type="text"
                pattern="[0-9]*"
                maxLength={4}
                required
                autoFocus
                value={deliveryPinInput}
                onChange={(e) => setDeliveryPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder="1234"
                className="w-full text-center text-3xl font-mono tracking-widest bg-neutral-950 border border-neutral-800 rounded-2xl py-3 text-orange-400 focus:outline-none focus:border-orange-500"
              />

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPinModalOrder(null)}
                  className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isVerifyingPin || deliveryPinInput.length !== 4}
                  className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-neutral-950 text-xs font-extrabold transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isVerifyingPin ? 'Verifying PIN...' : 'Confirm Delivery'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CANCEL ORDER REASON MODAL */}
      {cancelModalOrder && (
        <div 
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
          onClick={() => setCancelModalOrder(null)}
        >
          <div 
            className="w-full max-w-md rounded-3xl bg-neutral-900 border border-neutral-800 p-6 shadow-2xl text-white space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-sm font-bold text-rose-400 flex items-center gap-2">
                <XCircle className="w-5 h-5" />
                <span>Cancel Order #{cancelModalOrder.orderNumber || cancelModalOrder.id.slice(0, 8)}</span>
              </h3>
              <button
                type="button"
                onClick={() => setCancelModalOrder(null)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {cancelError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                {cancelError}
              </div>
            )}

            <form onSubmit={handleConfirmCancel} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Reason for Cancellation <span className="text-rose-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancelReasonInput}
                  onChange={(e) => setCancelReasonInput(e.target.value)}
                  placeholder="e.g. Item out of stock, hostel delivery restricted at this hour..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-rose-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCancelModalOrder(null)}
                  className="flex-1 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-bold transition-colors"
                >
                  Keep Order
                </button>
                <button
                  type="submit"
                  disabled={isCancelling || !cancelReasonInput.trim()}
                  className="flex-1 py-3 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-all disabled:opacity-40 cursor-pointer"
                >
                  {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD / EDIT PRODUCT BOTTOM SHEET FORM */}
      {isFormOpen && (
        <div 
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => { if (!isSubmitting) setIsFormOpen(false); }}
        >
          <div 
            className="relative flex flex-col w-full sm:max-w-xl max-h-[90dvh] h-full sm:h-auto rounded-t-3xl sm:rounded-3xl border border-neutral-800 bg-neutral-900 shadow-2xl overflow-hidden text-white"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="shrink-0 flex items-center justify-between border-b border-neutral-800 px-5 sm:px-6 py-4 bg-neutral-950/90 backdrop-blur-md">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Package className="h-4 w-4 text-orange-400" />
                <span>{editingProduct ? 'Edit Product / Service' : 'Add New Product or Service'}</span>
              </h3>
              <button
                type="button"
                onClick={() => { if (!isSubmitting) setIsFormOpen(false); }}
                className="text-neutral-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4 overscroll-contain">
              {formSubmitError && (
                <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                  {formSubmitError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Listing Type <span className="text-orange-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormKind('good')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      formKind === 'good'
                        ? 'bg-sky-500/20 border-sky-500 text-sky-400 shadow-sm'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Package className="h-4 w-4" />
                    <span>Physical Good / Item</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormKind('service')}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      formKind === 'service'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-400 shadow-sm'
                        : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                    <span>Campus Service</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-neutral-300">
                    Product / Service Title <span className="text-orange-400">*</span>
                  </label>
                  <span className={`text-[10px] font-mono ${
                    formTitle.length > 120 || (formTitle.length > 0 && formTitle.length < 2)
                      ? 'text-rose-400 font-bold'
                      : 'text-neutral-400'
                  }`}>
                    {formTitle.length}/120
                  </span>
                </div>
                <input
                  type="text"
                  required
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  onFocus={(e) => (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  placeholder="e.g. Fresh Meatpie & Chilled Zobo (Pack of 2)"
                  maxLength={120}
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2.5 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Price (in ₦ Naira) <span className="text-orange-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 font-mono font-bold text-neutral-400 text-xs">
                      ₦
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={formPrice}
                      onChange={(e) => setFormPrice(e.target.value)}
                      onFocus={(e) => (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                      placeholder="1500"
                      className="w-full rounded-xl border border-neutral-800 bg-neutral-950 pl-8 pr-3.5 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Category <span className="text-orange-400">*</span>
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    onFocus={(e) => (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs sm:text-sm text-white focus:border-orange-500 focus:outline-none"
                  >
                    {CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Turnaround / Delivery Time
                  </label>
                  <input
                    type="text"
                    value={formEstimatedTime}
                    onChange={(e) => setFormEstimatedTime(e.target.value)}
                    onFocus={(e) => (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder="e.g. 15-30 mins"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Stock Quantity (blank = unlimited)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={formStockQuantity}
                    onChange={(e) => setFormStockQuantity(e.target.value)}
                    onFocus={(e) => (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                    placeholder="Unlimited"
                    className="w-full rounded-xl border border-neutral-800 bg-neutral-950 px-3.5 py-2 text-xs sm:text-sm text-white placeholder-neutral-500 focus:border-orange-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Product Description
                </label>
                <textarea
                  rows={3}
                  maxLength={2000}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  onFocus={(e) => (e.target as HTMLElement).scrollIntoView({ behavior: 'smooth', block: 'center' })}
                  placeholder="Describe portions, sizing or ingredients..."
                  className="w-full rounded-xl border border-neutral-800 bg-neutral-950 p-3 text-xs sm:text-sm text-white focus:border-orange-500 focus:outline-none resize-none"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-950 border border-neutral-800">
                <div>
                  <span className="text-xs font-bold text-white block">List Live in Marketplace</span>
                  <span className="text-[11px] text-neutral-400">When active, buyers can see and order this item.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIsActive(!formIsActive)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                    formIsActive ? 'bg-orange-500' : 'bg-neutral-800'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      formIsActive ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Photos Picker */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-semibold text-neutral-300">
                    Product Photos ({formImages.length}/4)
                  </label>
                  <span className="text-[10px] text-neutral-400">Max 4 photos</span>
                </div>

                {imageUploadError && (
                  <div className="p-2.5 mb-2 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs">
                    {imageUploadError}
                  </div>
                )}

                <div className="grid grid-cols-4 gap-2">
                  {formImages.map((imgUrl, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl bg-neutral-950 border border-neutral-800 overflow-hidden group">
                      <img src={imgUrl} alt={`Product ${idx + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 rounded-full bg-black/70 text-rose-400 hover:text-white transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}

                  {formImages.length < 4 && (
                    <label className="relative aspect-square rounded-xl border-2 border-dashed border-neutral-800 hover:border-orange-500/50 bg-neutral-950/60 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all hover:bg-neutral-950">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageFileChange}
                        disabled={isUploadingImage}
                        className="hidden"
                      />
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="w-4 h-4 border-2 border-orange-400 border-t-transparent rounded-full animate-spin" />
                          <span className="text-[9px] text-neutral-400 font-bold">Uploading</span>
                        </div>
                      ) : (
                        <>
                          <Plus className="h-5 w-5 text-orange-400" />
                          <span className="text-[9px] font-bold text-neutral-400 text-center px-1">Add photo</span>
                        </>
                      )}
                    </label>
                  )}
                </div>
              </div>
            </div>

            <div className="shrink-0 p-4 border-t border-neutral-800 bg-neutral-950 flex items-center justify-end gap-3" style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="px-4 py-2.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs font-bold text-neutral-300"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || isUploadingImage}
                onClick={() => handleFormSubmit()}
                className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-neutral-950 text-xs font-extrabold shadow-md disabled:opacity-40"
              >
                {isSubmitting ? 'Saving...' : 'Save Product'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body
  );
};

