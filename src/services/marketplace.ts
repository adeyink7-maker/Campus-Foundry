import { supabase, isSupabaseConfigured, isMockConversation, isValidUuid, toSafeUuid, emitAppToast, confirmDeliveryRPC } from './supabase';
import { getFriendlyError } from '../utils/friendlyErrors';
export { isSupabaseConfigured };
import { 
  Product, 
  ProductKind, 
  MarketplaceOrder, 
  OrderItem, 
  OrderStatus, 
  PaymentMethod,
  MarketplaceConversation, 
  MarketplaceMessage, 
  MarketplaceReview, 
  DashboardStats 
} from '../types';
export type { PaymentMethod };

/**
 * Currency formatter for Nigerian Naira (₦12,500)
 */
export function formatNaira(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₦0';
  return `₦${new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(amount)}`;
}

/**
 * Real error messages returned from Supabase backend codes / RPC exceptions
 */
export function mapMarketplaceError(err: unknown): string {
  if (!err) return 'Something went wrong. Please try again.';
  if (typeof err === 'string') return err;
  if (err instanceof Error) return err.message;
  if (typeof err === 'object' && err !== null) {
    const obj = err as Record<string, unknown>;
    if (obj.message && typeof obj.message === 'string') return obj.message;
    if (obj.error && typeof obj.error === 'string') return obj.error;
    if (obj.details && typeof obj.details === 'string') return obj.details;
  }
  return String(err);
}

// ==========================================
// Product Management (INSERT & UPDATE only)
// ==========================================

export interface ListProductsParams {
  search?: string;
  category?: string;
  kind?: ProductKind | 'all';
  businessId?: string;
  ownerId?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateProductInput {
  businessId: string;
  ownerId: string;
  kind: ProductKind;
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  estimatedTime?: string | null;
  stockQuantity: number | null; // null = unlimited, 0 = sold out
  isActive?: boolean;
}

export interface UpdateProductInput {
  kind?: ProductKind;
  title?: string;
  description?: string;
  price?: number;
  images?: string[];
  category?: string;
  estimatedTime?: string | null;
  stockQuantity?: number | null;
  isActive?: boolean;
}

// Database Row mapper
interface DbProductRow {
  id: string;
  business_id: string;
  owner_id: string;
  kind: 'good' | 'service';
  title: string;
  description: string;
  price: number;
  images: string[] | null;
  category: string;
  estimated_time: string | null;
  stock_quantity: number | null;
  is_active: boolean;
  sold_count: number;
  created_at?: string;
  updated_at?: string;
  student_businesses?: {
    id: string;
    name: string;
    image_url: string;
    hostel_location: string;
    rating: number;
    category: string;
    whatsapp?: string;
  } | null;
}

function mapDbProduct(row: DbProductRow): Product {
  const biz = row.student_businesses;
  return {
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
    businessName: biz?.name,
    businessImageUrl: biz?.image_url,
    businessHostel: biz?.hostel_location,
    businessRating: biz?.rating != null ? Number(biz.rating) : 5.0,
    businessCategory: biz?.category,
    businessWhatsapp: biz?.whatsapp,
  };
}

export async function listProducts(params: ListProductsParams = {}): Promise<{ products: Product[]; totalCount: number }> {
  if (!isSupabaseConfigured) {
    return { products: [], totalCount: 0 };
  }

  const {
    search = '',
    category = 'All',
    kind = 'all',
    businessId,
    ownerId,
    isActive = true,
    page = 1,
    pageSize = 24,
  } = params;

  let query = supabase
    .from('products')
    .select(
      `
      id,
      business_id,
      owner_id,
      kind,
      title,
      description,
      price,
      images,
      category,
      estimated_time,
      stock_quantity,
      is_active,
      sold_count,
      created_at,
      updated_at,
      student_businesses (
        id,
        name,
        image_url,
        hostel_location,
        rating,
        category,
        whatsapp
      )
    `,
      { count: 'exact' }
    );

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }

  if (businessId) {
    query = query.eq('business_id', businessId);
  }

  if (ownerId) {
    query = query.eq('owner_id', ownerId);
  }

  if (kind && kind !== 'all') {
    query = query.eq('kind', kind);
  }

  if (category && category !== 'All') {
    query = query.eq('category', category);
  }

  if (search.trim()) {
    query = query.ilike('title', `%${search.trim()}%`);
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;

  if (error) {
    if (error.code === '42501') {
      console.warn(
        `[Marketplace listProducts Notice]: products table query restricted by database privileges (42501). Returning empty list.`
      );
      return { products: [], totalCount: 0 };
    }
    console.warn('[Marketplace listProducts Notice]:', error.message || error);
    return { products: [], totalCount: 0 };
  }

  const products = ((data as unknown as DbProductRow[]) || []).map(mapDbProduct);
  return { products, totalCount: count || 0 };
}

export async function getProduct(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured || !id) return null;

  const { data, error } = await supabase
    .from('products')
    .select(`
      id,
      business_id,
      owner_id,
      kind,
      title,
      description,
      price,
      images,
      category,
      estimated_time,
      stock_quantity,
      is_active,
      sold_count,
      created_at,
      updated_at,
      student_businesses (
        id,
        name,
        image_url,
        hostel_location,
        rating,
        category,
        whatsapp
      )
    `)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    if (error.code === '42501') {
      console.warn('[Marketplace getProduct Notice]: products table query restricted by database privileges (42501).');
      return null;
    }
    console.warn('[Marketplace getProduct Notice]:', error.message || error);
    return null;
  }

  if (!data) return null;
  return mapDbProduct(data as unknown as DbProductRow);
}

/**
 * Clients may ONLY insert (business_id, owner_id, kind, title, description, price, images, category, estimated_time, stock_quantity, is_active).
 * Never upsert.
 */
export async function createProduct(input: CreateProductInput): Promise<Product> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const payload = {
    business_id: input.businessId,
    owner_id: input.ownerId,
    kind: input.kind,
    title: input.title.trim(),
    description: input.description.trim(),
    price: Math.max(0, Math.round(input.price)),
    images: input.images.slice(0, 5),
    category: input.category,
    estimated_time: input.estimatedTime || null,
    stock_quantity: input.stockQuantity != null ? Math.max(0, input.stockQuantity) : null,
    is_active: input.isActive !== false,
  };

  const { data, error } = await supabase
    .from('products')
    .insert(payload)
    .select(`
      id,
      business_id,
      owner_id,
      kind,
      title,
      description,
      price,
      images,
      category,
      estimated_time,
      stock_quantity,
      is_active,
      sold_count,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    console.error('[Marketplace createProduct Error]:', error);
    throw new Error(mapMarketplaceError(error));
  }

  return mapDbProduct(data as unknown as DbProductRow);
}

/**
 * Clients may ONLY update (kind, title, description, price, images, category, estimated_time, stock_quantity, is_active).
 * Never upsert.
 */
export async function updateProduct(id: string, input: UpdateProductInput): Promise<Product> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const payload: Record<string, unknown> = {};

  if (input.kind !== undefined) payload.kind = input.kind;
  if (input.title !== undefined) payload.title = input.title.trim();
  if (input.description !== undefined) payload.description = input.description.trim();
  if (input.price !== undefined) payload.price = Math.max(0, Math.round(input.price));
  if (input.images !== undefined) payload.images = input.images.slice(0, 5);
  if (input.category !== undefined) payload.category = input.category;
  if (input.estimatedTime !== undefined) payload.estimated_time = input.estimatedTime || null;
  if (input.stockQuantity !== undefined) {
    payload.stock_quantity = input.stockQuantity != null ? Math.max(0, input.stockQuantity) : null;
  }
  if (input.isActive !== undefined) payload.is_active = input.isActive;

  const { data, error } = await supabase
    .from('products')
    .update(payload)
    .eq('id', id)
    .select(`
      id,
      business_id,
      owner_id,
      kind,
      title,
      description,
      price,
      images,
      category,
      estimated_time,
      stock_quantity,
      is_active,
      sold_count,
      created_at,
      updated_at
    `)
    .single();

  if (error) {
    console.error('[Marketplace updateProduct Error]:', error);
    throw new Error(mapMarketplaceError(error));
  }

  return mapDbProduct(data as unknown as DbProductRow);
}

export async function setProductActive(id: string, isActive: boolean): Promise<void> {
  await updateProduct(id, { isActive });
}

/**
 * Compresses an image to max 1200px webp and uploads to Supabase Storage 'product-images' bucket
 * Upload path must start with the user's id: `${userId}/${uuid}.webp`.
 */
export async function uploadProductImage(file: File, userId: string): Promise<string> {
  if (!isSupabaseConfigured) {
    const err = new Error('Supabase Storage is not configured for product images.');
    console.error('[Marketplace uploadProductImage Error]:', {
      message: err.message,
      code: 'STORAGE_NOT_CONFIGURED',
      details: 'VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing',
    });
    throw err;
  }


  // 1. Client-side canvas compression to max 1200px WebP
  const compressedBlob = await new Promise<Blob>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read image file'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Failed to load image for compression'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        const maxDimension = 1200;

        if (width > maxDimension || height > maxDimension) {
          const ratio = Math.min(maxDimension / width, maxDimension / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error('Canvas to WebP blob conversion failed'));
            }
          },
          'image/webp',
          0.85
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });

  // 2. Generate random UUID
  const uuid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  // Path format required: ${userId}/${uuid}.webp
  const filePath = `${userId}/${uuid}.webp`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, compressedBlob, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (uploadError) {
    console.error('[Marketplace uploadProductImage Error]:', uploadError);
    const msg = (uploadError.message || '').toLowerCase();
    if (msg.includes('bucket not found') || msg.includes('not_found') || (uploadError as any)?.statusCode === 404) {
      throw new Error("Missing storage bucket: The 'product-images' bucket does not exist. Please create a public bucket named 'product-images' in Supabase Storage.");
    }
    if (msg.includes('row-level security') || msg.includes('policy') || msg.includes('violates') || (uploadError as any)?.statusCode === 403) {
      throw new Error(`Missing storage RLS policy: Missing insert policy on 'product-images' bucket for path '${userId}/*'. Please add an INSERT policy for authenticated users on their user folder.`);
    }
    throw new Error(`Failed to upload product image: ${uploadError.message}. Please check 'product-images' bucket and RLS policies.`);
  }

  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

/**
 * Direct product deletion by store owner
 */
export async function deleteProduct(id: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('owner_id', userId);

  if (error) {
    console.error('[Marketplace deleteProduct Error]:', error);
    throw new Error(mapMarketplaceError(error));
  }
}

// ==========================================
// Orders & Checkout (RPC: place_order, update_order_status)
// ==========================================

export interface PlaceOrderParams {
  businessId: string;
  items: Array<{ productId: string; quantity: number }>;
  deliveryAddress: string;
  phone: string;
  notes?: string;
  paymentMethod: PaymentMethod;
}

export async function placeOrder(params: PlaceOrderParams): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const rpcItems = params.items.map((i) => ({
    product_id: i.productId,
    quantity: i.quantity,
  }));

  const { data, error } = await supabase.rpc('place_order', {
    p_business_id: params.businessId,
    p_items: rpcItems,
    p_delivery_address: params.deliveryAddress.trim(),
    p_phone: params.phone.trim(),
    p_notes: params.notes?.trim() || null,
    p_payment_method: params.paymentMethod,
  });

  if (error) {
    console.error('[Marketplace placeOrder Error]:', error);
    throw new Error(mapMarketplaceError(error));
  }

  // Returns order uuid
  return typeof data === 'string' ? data : (data as { id?: string })?.id || String(data);
}

export interface UpdateOrderStatusParams {
  orderId: string;
  status: OrderStatus;
  pin?: string;
  reason?: string;
}

export interface UpdateOrderStatusResult {
  ok: boolean;
  error?: string;
  attemptsLeft?: number;
}

export async function updateOrderStatus(params: UpdateOrderStatusParams): Promise<UpdateOrderStatusResult> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.rpc('update_order_status', {
    p_order_id: params.orderId,
    p_status: params.status,
    p_pin: params.pin?.trim() || null,
    p_reason: params.reason?.trim() || null,
  });

  if (error) {
    console.error('[Marketplace updateOrderStatus RPC error]:', error);
    throw new Error(mapMarketplaceError(error));
  }

  const res = data as { ok?: boolean; error?: string; attempts_left?: number } | null;

  if (res && res.ok === false) {
    return {
      ok: false,
      error: res.error,
      attemptsLeft: res.attempts_left,
    };
  }

  return { ok: true };
}

export async function confirmDelivery(orderId: string, pin: string): Promise<boolean> {
  return confirmDeliveryRPC(orderId, pin);
}

/**
 * Only traders set payment_status on orders.
 */
export async function updateOrderPaymentStatus(
  orderId: string,
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('You must be signed in as a trader to update payment status.');
  }

  const { error } = await supabase
    .from('orders')
    .update({
      payment_status: paymentStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('trader_id', user.id);

  if (error) {
    console.error('[Marketplace updateOrderPaymentStatus Error]:', error);
    throw new Error(mapMarketplaceError(error));
  }
}

export async function getDeliveryPin(orderId: string): Promise<string | null> {
  if (!isSupabaseConfigured || !orderId) return null;

  // Rule: Only buyers should be able to read order_secrets. 
  // Traders should use confirm_delivery RPC with the PIN provided by the buyer.
  const { data, error } = await supabase
    .from('order_secrets')
    .select('delivery_pin')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) {
    if (error.code === '42501') {
      // Permission denied (e.g. trader trying to read)
      return null;
    }
    console.warn('[Marketplace getDeliveryPin Notice]:', error.message);
    return null;
  }

  return data?.delivery_pin || null;
}

// Database Order Row Mapper
interface DbOrderRow {
  id: string;
  order_number?: string;
  business_id: string;
  buyer_id: string;
  trader_id?: string;
  buyer_name?: string;
  buyer_phone?: string;
  status: OrderStatus;
  subtotal?: number;
  delivery_fee?: number;
  grand_total?: number;
  total_amount?: number;
  delivery_address: string;
  phone?: string;
  notes: string | null;
  payment_method: PaymentMethod;
  payment_status?: 'pending' | 'paid' | 'failed' | 'refunded';
  cancel_reason?: string | null;
  cancellation_reason?: string | null;
  accepted_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  created_at: string;
  updated_at?: string;
  student_businesses?: {
    id: string;
    name: string;
    image_url: string;
    hostel_location: string;
    whatsapp?: string;
    bank_name?: string;
    account_number?: string;
    account_name?: string;
  } | null;
  buyer_profile?: {
    full_name: string;
    whatsapp?: string;
  } | null;
  order_items?: Array<{
    id: string;
    order_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    products?: {
      title: string;
      images: string[] | null;
    } | null;
  }> | null;
  order_secrets?: {
    delivery_pin: string;
  }[] | { delivery_pin: string } | null;
}

function mapDbOrder(row: DbOrderRow): MarketplaceOrder {
  const biz = row.student_businesses;
  const buyer = row.buyer_profile;
  const secret = Array.isArray(row.order_secrets) ? row.order_secrets[0] : row.order_secrets;

  const items: OrderItem[] = (row.order_items || []).map((oi) => ({
    id: oi.id,
    orderId: oi.order_id,
    productId: oi.product_id,
    productTitle: oi.products?.title,
    productImage: oi.products?.images?.[0],
    quantity: Number(oi.quantity),
    unitPrice: Number(oi.unit_price),
    subtotal: Number(oi.quantity) * Number(oi.unit_price),
  }));

  const grandTotal = Number(row.grand_total ?? row.total_amount ?? 0);
  const subtotal = Number(row.subtotal ?? grandTotal);
  const deliveryFee = Number(row.delivery_fee ?? 0);

  return {
    id: row.id,
    orderNumber: row.order_number || row.id.slice(0, 8).toUpperCase(),
    businessId: row.business_id,
    businessName: biz?.name,
    businessImageUrl: biz?.image_url,
    businessHostel: biz?.hostel_location,
    businessWhatsapp: biz?.whatsapp,
    traderId: row.trader_id,
    buyerId: row.buyer_id,
    buyerName: row.buyer_name || buyer?.full_name,
    buyerPhone: row.buyer_phone || buyer?.whatsapp || row.phone || '',
    status: row.status,
    subtotal,
    deliveryFee,
    grandTotal,
    totalAmount: grandTotal,
    deliveryAddress: row.delivery_address,
    phone: row.phone || row.buyer_phone || '',
    notes: row.notes || undefined,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status || 'pending',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    acceptedAt: row.accepted_at,
    deliveredAt: row.delivered_at,
    cancelledAt: row.cancelled_at,
    items,
    deliveryPin: secret?.delivery_pin,
    cancellationReason: row.cancel_reason || row.cancellation_reason || undefined,
    cancelReason: row.cancel_reason || row.cancellation_reason || undefined,
  };
}

export interface PlacedOrderDetails {
  orderId: string;
  orderNumber: string;
  businessId: string;
  businessName: string;
  subtotal: number;
  deliveryFee: number;
  grandTotal: number;
  deliveryPin: string | null;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  deliveryAddress: string;
  phone: string;
  notes?: string;
  bankDetails?: {
    hasBank: boolean;
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
}

export async function fetchOrderPlacedDetails(orderId: string): Promise<PlacedOrderDetails | null> {
  if (!isSupabaseConfigured || !orderId) return null;

  try {
    const { data: orderRow, error: orderErr } = await supabase
      .from('orders')
      .select(`
        id,
        order_number,
        business_id,
        trader_id,
        buyer_id,
        buyer_name,
        buyer_phone,
        delivery_address,
        notes,
        subtotal,
        delivery_fee,
        grand_total,
        status,
        payment_method,
        payment_status,
        created_at,
        student_businesses (
          id,
          name,
          hostel_location,
          image_url,
          whatsapp
        ),
        order_secrets (
          delivery_pin
        )
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (orderErr || !orderRow) {
      console.warn('[Marketplace fetchOrderPlacedDetails Warning]:', orderErr);
      return null;
    }

    const secret = Array.isArray(orderRow.order_secrets)
      ? orderRow.order_secrets[0]
      : orderRow.order_secrets;

    // Check whether student_businesses has bank or account columns
    let bankDetails: { hasBank: boolean; bankName?: string; accountNumber?: string; accountName?: string } = {
      hasBank: false,
    };

    if (orderRow.business_id) {
      const { data: payData, error: payErr } = await supabase
        .rpc('get_payment_details', { p_business: orderRow.business_id });

      if (!payErr && payData) {
        const bName = payData.bank_name;
        const aNum = payData.account_number;
        const aName = payData.account_name;
        if (bName || aNum) {
          bankDetails = {
            hasBank: true,
            bankName: bName ? String(bName) : undefined,
            accountNumber: aNum ? String(aNum) : undefined,
            accountName: aName ? String(aName) : undefined,
          };
        }
      }
    }

    const grandTotal = Number(orderRow.grand_total ?? 0);
    const subtotal = Number(orderRow.subtotal ?? grandTotal);
    const deliveryFee = Number(orderRow.delivery_fee ?? 0);

    return {
      orderId: orderRow.id,
      orderNumber: orderRow.order_number || orderRow.id.slice(0, 8).toUpperCase(),
      businessId: orderRow.business_id,
      businessName: (orderRow.student_businesses as any)?.name || 'Campus Trader',
      subtotal,
      deliveryFee,
      grandTotal,
      deliveryPin: secret?.delivery_pin || null,
      paymentMethod: orderRow.payment_method,
      paymentStatus: orderRow.payment_status || 'pending',
      deliveryAddress: orderRow.delivery_address || '',
      phone: orderRow.buyer_phone || '',
      notes: orderRow.notes || undefined,
      bankDetails,
    };
  } catch (err) {
    console.warn('[Marketplace fetchOrderPlacedDetails Exception]:', err);
    return null;
  }
}

export async function fetchMyOrders(): Promise<MarketplaceOrder[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('orders')
    .select(`
      id,
      order_number,
      business_id,
      buyer_id,
      trader_id,
      buyer_name,
      buyer_phone,
      delivery_address,
      notes,
      subtotal,
      delivery_fee,
      grand_total,
      status,
      payment_method,
      payment_status,
      cancel_reason,
      accepted_at,
      delivered_at,
      cancelled_at,
      created_at,
      updated_at,
      student_businesses (
        id,
        name,
        image_url,
        hostel_location,
        whatsapp
      ),
      order_items (
        id,
        order_id,
        product_id,
        quantity,
        unit_price,
        products (
          title,
          images
        )
      ),
      order_secrets (
        delivery_pin
      )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    if (error.code === '42501' || error.code === '42703') {
      console.warn(
        `[Marketplace fetchMyOrders Notice]: Access to orders restricted or column missing (${error.code}: ${error.message || 'permission denied'}). Returning empty orders list.`
      );
      return [];
    }
    console.error('[Marketplace fetchMyOrders Error]:', error);
    throw new Error(mapMarketplaceError(error));
  }

  return ((data as unknown as DbOrderRow[]) || []).map(mapDbOrder);
}

export interface FetchTraderOrdersParams {
  businessId: string;
  status?: OrderStatus | 'all';
  page?: number;
  pageSize?: number;
}

export async function fetchTraderOrders(params: FetchTraderOrdersParams): Promise<MarketplaceOrder[]> {
  if (!isSupabaseConfigured || !params.businessId) return [];

  let query = supabase
    .from('orders')
    .select(`
      id,
      order_number,
      business_id,
      trader_id,
      buyer_id,
      buyer_name,
      buyer_phone,
      delivery_address,
      notes,
      subtotal,
      delivery_fee,
      grand_total,
      total_amount,
      status,
      payment_method,
      payment_status,
      cancel_reason,
      created_at,
      updated_at,
      order_items (
        id,
        order_id,
        product_id,
        quantity,
        unit_price,
        products (
          title,
          images
        )
      )
    `)
    .eq('business_id', params.businessId);

  if (params.status && params.status !== 'all') {
    query = query.eq('status', params.status);
  }

  const page = params.page || 1;
  const pageSize = params.pageSize || 30;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, error } = await query;

  if (error) {
    if (error.code === '42501' || error.code === '42703') {
      console.warn(
        `[Marketplace fetchTraderOrders Notice]: Database query notice (${error.code}: ${error.message || 'permission or column issue'}). Returning empty orders list.`
      );
      return [];
    }
    console.error('[Marketplace fetchTraderOrders Error]:', error);
    throw new Error(mapMarketplaceError(error));
  }

  return ((data as unknown as DbOrderRow[]) || []).map(mapDbOrder);
}

export function subscribeToTraderOrders(
  businessId: string,
  onOrderChange: () => void
): () => void {
  if (!isSupabaseConfigured || !businessId) return () => {};

  const channel = supabase
    .channel(`marketplace_trader_orders_${businessId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
        filter: `business_id=eq.${businessId}`,
      },
      () => {
        onOrderChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}


// ==========================================
// Marketplace Chat (RPC & marketplace_* tables)
// ==========================================

export async function getOrCreateConversation(businessId: string): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  const { data, error } = await supabase.rpc('get_or_create_conversation', {
    p_business_id: businessId,
  });

  if (error) {
    console.error('[Marketplace getOrCreateConversation Error]:', error);
    throw new Error(mapMarketplaceError(error));
  }

  return typeof data === 'string' ? data : (data as { id?: string })?.id || String(data);
}

export async function markConversationRead(conversationId: string): Promise<void> {
  if (!isSupabaseConfigured || !conversationId || isMockConversation(conversationId) || !isValidUuid(conversationId)) return;

  const { error } = await supabase.rpc('mark_conversation_read', {
    p_conversation_id: conversationId,
  });

  if (error) {
    console.warn('[Marketplace markConversationRead Notice]:', error.message);
  }
}

export async function setConversationStatus(
  conversationId: string,
  status: 'accepted' | 'declined' | 'blocked'
): Promise<void> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  if (isMockConversation(conversationId) || !isValidUuid(conversationId)) {
    return;
  }

  const { error } = await supabase.rpc('set_conversation_status', {
    p_conversation_id: conversationId,
    p_status: status,
  });

  if (error) {
    console.error('[Marketplace setConversationStatus Error]:', error);
    throw new Error(mapMarketplaceError(error));
  }
}

interface DbConversationRow {
  id: string;
  business_id: string;
  buyer_id: string;
  trader_id: string;
  status: 'accepted' | 'declined' | 'blocked';
  last_message: string | null;
  last_message_at: string | null;
  buyer_unread: number;
  trader_unread: number;
  created_at: string;
  student_businesses?: {
    id: string;
    name: string;
    image_url: string;
  } | null;
}

export async function fetchConversations(): Promise<MarketplaceConversation[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from('marketplace_conversations')
    .select(`
      id,
      business_id,
      buyer_id,
      trader_id,
      status,
      last_message,
      last_message_at,
      buyer_unread,
      trader_unread,
      created_at,
      student_businesses (
        id,
        name,
        image_url
      )
    `)
    .order('last_message_at', { ascending: false });

  if (error) {
    if (error.code === '42501') {
      console.warn(
        `[Marketplace fetchConversations Notice]: Access to marketplace_conversations restricted by database privileges (${error.message || 'permission denied'}). Returning empty conversations list.`
      );
    } else {
      console.warn('[Marketplace fetchConversations Notice]:', error.message || error);
    }
    return [];
  }

  return ((data as unknown as DbConversationRow[]) || []).map((row) => ({
    id: row.id,
    kind: 'marketplace' as const,
    businessId: row.business_id,
    businessName: row.student_businesses?.name,
    businessImageUrl: row.student_businesses?.image_url,
    buyerId: row.buyer_id,
    traderId: row.trader_id,
    status: row.status,
    lastMessage: row.last_message,
    lastMessageAt: row.last_message_at,
    buyerUnread: Number(row.buyer_unread) || 0,
    traderUnread: Number(row.trader_unread) || 0,
    createdAt: row.created_at,
  }));
}

interface DbMessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  order_id: string | null;
  attachment_url: string | null;
  attachment_type: string | null;
  voice_note_url: string | null;
  voice_duration: number | null;
  read_at: string | null;
  created_at: string;
}

export async function fetchMessages(conversationId: string, before?: string): Promise<MarketplaceMessage[]> {
  if (!isSupabaseConfigured || !conversationId || isMockConversation(conversationId) || !isValidUuid(conversationId)) {
    return [];
  }

  let query = supabase
    .from('marketplace_messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      body,
      order_id,
      attachment_url,
      attachment_type,
      voice_note_url,
      voice_duration,
      read_at,
      created_at
    `)
    .eq('conversation_id', conversationId);

  if (before) {
    query = query.lt('created_at', before);
  }

  query = query.order('created_at', { ascending: false }).limit(30);

  const { data, error } = await query;

  if (error) {
    if (error.code === '42501') {
      console.warn(
        `[Marketplace fetchMessages Notice]: Access to marketplace_messages restricted by database privileges (${error.message || 'permission denied'}). Returning empty messages.`
      );
    } else {
      console.warn('[Marketplace fetchMessages Notice]:', error.message || error);
    }
    return [];
  }

  const rows = ((data as unknown as DbMessageRow[]) || []).reverse();

  return rows.map((r) => ({
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    body: r.body,
    orderId: r.order_id,
    attachmentUrl: r.attachment_url,
    attachmentType: r.attachment_type,
    voiceNoteUrl: r.voice_note_url,
    voiceDuration: r.voice_duration,
    readAt: r.read_at,
    createdAt: r.created_at,
  }));
}

/**
 * Inserts a new marketplace message.
 * Marketplace messages: INSERT strictly into marketplace_messages (conversation_id, sender_id, body, order_id, voice_note_url, voice_duration, attachment_url, attachment_type).
 */
export async function sendMessage(
  conversationId: string,
  body: string,
  senderId: string,
  orderId?: string,
  options?: {
    voiceNoteUrl?: string;
    voiceDuration?: number;
    attachmentUrl?: string;
    attachmentType?: string;
    replyTo?: string;
  }
) {
  let cleanBody = body.trim();
  if (!cleanBody) {
    if (options?.voiceNoteUrl) {
      cleanBody = '🎤 Voice message';
    } else if (options?.attachmentUrl) {
      cleanBody = '📎 Attachment';
    } else {
      cleanBody = 'Message';
    }
  }

  if (isMockConversation(conversationId) || !isValidUuid(conversationId) || !isSupabaseConfigured) {
    return {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      conversationId,
      senderId,
      body: cleanBody,
      orderId: orderId || null,
      attachmentUrl: options?.attachmentUrl || null,
      attachmentType: options?.attachmentType || null,
      voiceNoteUrl: options?.voiceNoteUrl || null,
      voiceDuration: options?.voiceDuration != null ? Math.round(options.voiceDuration) : null,
      readAt: null,
      createdAt: new Date().toISOString(),
    };
  }

  // Strictly target ground truth columns: conversation_id, sender_id, body, order_id, voice_note_url, voice_duration, attachment_url, attachment_type, reply_to
  const payload: Record<string, any> = {
    conversation_id: conversationId,
    sender_id: senderId,
    body: cleanBody,
  };

  if (orderId) {
    payload.order_id = orderId;
  }
  if (options?.voiceNoteUrl) {
    payload.voice_note_url = options.voiceNoteUrl;
    payload.voice_duration = options.voiceDuration != null ? Math.round(options.voiceDuration) : null;
  }
  if (options?.attachmentUrl) {
    payload.attachment_url = options.attachmentUrl;
    payload.attachment_type = options.attachmentType || 'file';
  }
  if (options?.replyTo) {
    payload.reply_to = toSafeUuid(options.replyTo);
  }

  const { data, error } = await supabase
    .from('marketplace_messages')
    .insert(payload)
    .select(`
      id,
      conversation_id,
      sender_id,
      body,
      order_id,
      attachment_url,
      attachment_type,
      voice_note_url,
      voice_duration,
      read_at,
      created_at
    `)
    .single();

  if (error) {
    if (error.code === '42501' || error.message?.includes('permission denied')) {
      console.warn('[Supabase save notice (RLS permission 42501)]:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        payload,
      });
      return {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        conversationId,
        senderId,
        body: cleanBody,
        orderId: orderId || null,
        attachmentUrl: options?.attachmentUrl || null,
        attachmentType: options?.attachmentType || null,
        voiceNoteUrl: options?.voiceNoteUrl || null,
        voiceDuration: options?.voiceDuration != null ? Math.round(options.voiceDuration) : null,
        readAt: null,
        createdAt: new Date().toISOString(),
      };
    }

    console.error('[Supabase save error]:', {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      payload,
    });
    emitAppToast(getFriendlyError(error, 'marketplace'), 'error');
    throw new Error(mapMarketplaceError(error));
  }

  const r = data as unknown as DbMessageRow;
  return {
    id: r.id,
    conversationId: r.conversation_id,
    senderId: r.sender_id,
    body: r.body,
    orderId: r.order_id,
    attachmentUrl: r.attachment_url,
    attachmentType: r.attachment_type,
    voiceNoteUrl: r.voice_note_url,
    voiceDuration: r.voice_duration,
    readAt: r.read_at,
    createdAt: r.created_at,
  };
}

// ==========================================
// Reviews (reviews table)
// ==========================================

export interface CreateReviewParams {
  businessId: string;
  orderId: string;
  reviewerId: string;
  reviewerName: string;
  rating: number; // 1-5
  comment: string;
}

export async function createReview(params: CreateReviewParams): Promise<MarketplaceReview> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase is not configured.');
  }

  // Reviews are allowed only after an order is delivered
  if (params.orderId) {
    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .select('status')
      .eq('id', params.orderId)
      .maybeSingle();

    if (orderErr) {
      throw new Error(mapMarketplaceError(orderErr));
    }

    if (!orderData || orderData.status !== 'delivered') {
      throw new Error('Reviews are allowed only after an order is delivered.');
    }
  }

  const payload = {
    business_id: params.businessId,
    order_id: params.orderId,
    reviewer_id: params.reviewerId,
    reviewer_name: params.reviewerName.trim(),
    rating: Math.min(5, Math.max(1, Math.round(params.rating))),
    comment: params.comment.trim(),
  };

  const { data, error } = await supabase
    .from('reviews')
    .insert(payload)
    .select(`
      id,
      business_id,
      order_id,
      reviewer_id,
      reviewer_name,
      rating,
      comment,
      created_at
    `)
    .single();

  if (error) {
    console.error('[Marketplace createReview Error]:', error);
    throw new Error(mapMarketplaceError(error));
  }

  const r = data as {
    id: string;
    business_id: string;
    order_id: string;
    reviewer_id: string;
    reviewer_name: string;
    rating: number;
    comment: string;
    created_at: string;
  };

  return {
    id: r.id,
    businessId: r.business_id,
    orderId: r.order_id,
    reviewerId: r.reviewer_id,
    reviewerName: r.reviewer_name,
    rating: Number(r.rating),
    comment: r.comment,
    createdAt: r.created_at,
  };
}

export async function fetchReviews(businessId: string): Promise<MarketplaceReview[]> {
  if (!isSupabaseConfigured || !businessId) return [];

  const { data, error } = await supabase
    .from('reviews')
    .select(`
      id,
      business_id,
      order_id,
      reviewer_id,
      reviewer_name,
      rating,
      comment,
      created_at
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Marketplace fetchReviews Error]:', error);
    throw new Error(mapMarketplaceError(error));
  }

  return (data || []).map((r) => ({
    id: r.id,
    businessId: r.business_id,
    orderId: r.order_id,
    reviewerId: r.reviewer_id,
    reviewerName: r.reviewer_name,
    rating: Number(r.rating),
    comment: r.comment,
    createdAt: r.created_at,
  }));
}

// ==========================================
// Trader Dashboard Stats (RPC: trader_dashboard_stats)
// ==========================================

export async function fetchDashboardStats(businessId: string, days = 30): Promise<DashboardStats> {
  if (!isSupabaseConfigured || !businessId) {
    return {
      revenueTotal: 0,
      revenuePeriod: 0,
      ordersTotal: 0,
      ordersNew: 0,
      ordersActive: 0,
      ordersDelivered: 0,
      ordersCancelled: 0,
      daily: [],
      topProducts: [],
    };
  }

  const { data, error } = await supabase.rpc('trader_dashboard_stats', {
    p_business_id: businessId,
    p_days: days,
  });

  if (error) {
    if (error.code === '42501' || error.code === '42703' || error.message?.includes('permission denied')) {
      console.warn(
        `[Marketplace trader_dashboard_stats Notice]: Database permission or RPC notice (${error.code}: ${error.message || 'permission denied'}). Returning fallback zero stats.`
      );
      return {
        revenueTotal: 0,
        revenuePeriod: 0,
        ordersTotal: 0,
        ordersNew: 0,
        ordersActive: 0,
        ordersDelivered: 0,
        ordersCancelled: 0,
        daily: [],
        topProducts: [],
      };
    }
    console.error('[Marketplace trader_dashboard_stats Error]:', error);
    throw new Error(mapMarketplaceError(error));
  }

  const res = (data as {
    revenue_total?: number;
    revenue_period?: number;
    orders_total?: number;
    orders_new?: number;
    orders_active?: number;
    orders_delivered?: number;
    orders_cancelled?: number;
    daily?: Array<{ day: string; revenue: number; orders: number }>;
    top_products?: Array<{ name: string; qty: number; revenue: number }>;
  }) || {};

  return {
    revenueTotal: Number(res.revenue_total) || 0,
    revenuePeriod: Number(res.revenue_period) || 0,
    ordersTotal: Number(res.orders_total) || 0,
    ordersNew: Number(res.orders_new) || 0,
    ordersActive: Number(res.orders_active) || 0,
    ordersDelivered: Number(res.orders_delivered) || 0,
    ordersCancelled: Number(res.orders_cancelled) || 0,
    daily: res.daily || [],
    topProducts: res.top_products || [],
  };
}

// ==========================================
// Realtime Subscriptions (returns cleanup function)
// ==========================================

export function subscribeToMessages(
  conversationId: string,
  onNewMessage: (msg: MarketplaceMessage) => void
): () => void {
  if (!isSupabaseConfigured || !conversationId) return () => {};

  const channel = supabase
    .channel(`marketplace_msgs_${conversationId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'marketplace_messages',
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => {
        const r = payload.new as DbMessageRow;
        if (!r) return;
        onNewMessage({
          id: r.id,
          conversationId: r.conversation_id,
          senderId: r.sender_id,
          body: r.body,
          orderId: r.order_id,
          attachmentUrl: r.attachment_url,
          attachmentType: r.attachment_type,
          voiceNoteUrl: r.voice_note_url,
          voiceDuration: r.voice_duration,
          replyTo: (r as any).reply_to || null,
          readAt: r.read_at,
          createdAt: r.created_at,
        });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToMyOrders(
  userId: string,
  onOrderChange: () => void
): () => void {
  if (!isSupabaseConfigured || !userId) return () => {};

  const channel = supabase
    .channel(`marketplace_my_orders_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'orders',
      },
      () => {
        onOrderChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToMyConversations(
  userId: string,
  onConvChange: () => void
): () => void {
  if (!isSupabaseConfigured || !userId) return () => {};

  const channel = supabase
    .channel(`marketplace_my_convs_${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'marketplace_conversations',
      },
      () => {
        onConvChange();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
