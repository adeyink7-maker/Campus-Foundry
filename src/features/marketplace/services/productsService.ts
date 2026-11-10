import { supabase, isSupabaseConfigured } from '../../../services/supabase';
import { Product, ProductKind } from '../../../types';
import { getFriendlyError } from '../../../utils/friendlyErrors';

export function formatNaira(amount: number | null | undefined): string {
  if (amount == null || isNaN(amount)) return '₦0';
  return `₦${new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 }).format(amount)}`;
}

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
  stockQuantity: number | null;
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

  if (error || !data) return null;
  return mapDbProduct(data as unknown as DbProductRow);
}

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
    throw new Error(getFriendlyError(error, 'marketplace'));
  }

  return mapDbProduct(data as unknown as DbProductRow);
}

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
    throw new Error(getFriendlyError(error, 'marketplace'));
  }

  return mapDbProduct(data as unknown as DbProductRow);
}

export async function setProductActive(id: string, isActive: boolean): Promise<void> {
  await updateProduct(id, { isActive });
}

export async function uploadProductImage(file: File, userId: string): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error('Supabase Storage is not configured.');
  }

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
        if (!ctx) return reject(new Error('Could not get canvas context'));

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => (blob ? resolve(blob) : reject(new Error('Canvas conversion failed'))),
          'image/webp',
          0.85
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });

  const uuid = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

  const filePath = `${userId}/${uuid}.webp`;

  const { error: uploadError } = await supabase.storage
    .from('product-images')
    .upload(filePath, compressedBlob, {
      contentType: 'image/webp',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(getFriendlyError(uploadError, 'upload'));
  }

  const { data: publicUrlData } = supabase.storage
    .from('product-images')
    .getPublicUrl(filePath);

  return publicUrlData.publicUrl;
}

export async function deleteProduct(id: string, userId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  const { error } = await supabase
    .from('products')
    .delete()
    .eq('id', id)
    .eq('owner_id', userId);

  if (error) {
    throw new Error(getFriendlyError(error, 'marketplace'));
  }
}
