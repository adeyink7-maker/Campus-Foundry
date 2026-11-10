import { supabase, isSupabaseConfigured } from '../../../services/supabase';
import { MarketplaceOrder, OrderItem, OrderStatus, PaymentMethod } from '../../../types';
import { getFriendlyError } from '../../../utils/friendlyErrors';

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
    throw new Error(getFriendlyError(error, 'checkout'));
  }

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
    throw new Error(getFriendlyError(error, 'order'));
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

export async function confirmDeliveryRPC(orderId: string, pin: string): Promise<boolean> {
  if (!isSupabaseConfigured) return true;
  const res = await updateOrderStatus({
    orderId,
    status: 'delivered',
    pin,
  });
  if (!res.ok) {
    throw new Error(res.error || 'Incorrect 4-digit PIN');
  }
  return true;
}

export async function confirmDelivery(orderId: string, pin: string): Promise<boolean> {
  return confirmDeliveryRPC(orderId, pin);
}

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
    throw new Error(getFriendlyError(error, 'order'));
  }
}

export async function getDeliveryPin(orderId: string): Promise<string | null> {
  if (!isSupabaseConfigured || !orderId) return null;

  const { data, error } = await supabase
    .from('order_secrets')
    .select('delivery_pin')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error || !data) return null;
  return data.delivery_pin || null;
}

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

  if (error) return [];
  return ((data as unknown as DbOrderRow[]) || []).map(mapDbOrder);
}

export async function fetchTraderOrders(businessId: string): Promise<MarketplaceOrder[]> {
  if (!isSupabaseConfigured || !businessId) return [];

  const { data, error } = await supabase
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
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });

  if (error) return [];
  return ((data as unknown as DbOrderRow[]) || []).map(mapDbOrder);
}

export function subscribeToTraderOrders(businessId: string, onOrderChange: () => void): () => void {
  if (!isSupabaseConfigured || !businessId) return () => {};

  const channel = supabase
    .channel(`marketplace_trader_orders_${businessId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders', filter: `business_id=eq.${businessId}` },
      () => onOrderChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export function subscribeToMyOrders(userId: string, onOrderChange: () => void): () => void {
  if (!isSupabaseConfigured || !userId) return () => {};

  const channel = supabase
    .channel(`marketplace_my_orders_${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      () => onOrderChange()
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
