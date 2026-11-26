import { supabase, mapSupabaseProduct, mapSupabaseStore } from "./supabaseData";
import type { Product, Store } from "../../data/mockData";

export interface CustomerAddress {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  apartment?: string | null;
  city: string;
  state: string;
  zip_code: string;
  instructions?: string | null;
  is_default: boolean;
  created_at: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  created_at: string;
  products?: { id: string; name: string; image: string } | null;
}

export interface WishlistEntry {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product: Product | null;
}

export interface CustomerNotification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link?: string | null;
  created_at: string;
}

export async function searchCatalogLive(query: string, storeId?: string): Promise<{ products: Product[]; stores: Store[] }> {
  const q = query.trim();
  if (!q) return { products: [], stores: [] };

  let prodQuery = supabase
    .from("products")
    .select("*, stores(id, name, slug)")
    .eq("is_available", true)
    .ilike("name", `%${q}%`)
    .limit(6);

  if (storeId && storeId !== "all") {
    prodQuery = prodQuery.eq("store_id", storeId);
  }

  const [prodRes, storeRes] = await Promise.all([
    prodQuery,
    supabase
      .from("stores")
      .select("*")
      .eq("status", "approved")
      .ilike("name", `%${q}%`)
      .limit(3),
  ]);

  return {
    products: (prodRes.data || []).map(mapSupabaseProduct),
    stores: (storeRes.data || []).map(mapSupabaseStore),
  };
}

export async function getProductReviews(productId: string): Promise<ProductReview[]> {
  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function getStoreSlugById(storeId: string): Promise<string | null> {
  const { data } = await supabase.from("stores").select("slug").eq("id", storeId).maybeSingle();
  return data?.slug || null;
}

export async function getActiveCoupons(): Promise<{ code: string; discount_type: string; value: number; min_order: number }[]> {
  const { data, error } = await supabase
    .from("coupons")
    .select("code, discount_type, value, min_order")
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((c) => ({
    code: c.code,
    discount_type: c.discount_type,
    value: Number(c.value),
    min_order: Number(c.min_order || 0),
  }));
}

export async function getFlashDealProducts(): Promise<Product[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*, stores(id, name, slug)")
    .eq("is_available", true)
    .not("discount_badge", "is", null)
    .order("created_at", { ascending: false })
    .limit(2);

  if (error || !data || data.length === 0) return [];
  return data.map(mapSupabaseProduct);
}

export async function getCustomerWishlistIds(userId: string): Promise<string[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("wishlists")
    .select("product_id")
    .eq("user_id", userId);
  if (error || !data) return [];
  return data.map((r) => r.product_id);
}

export async function getCustomerWishlist(userId: string): Promise<WishlistEntry[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("wishlists")
    .select("id, user_id, product_id, created_at, products(*, stores(id, name, slug))")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((row: any) => ({
    id: row.id,
    user_id: row.user_id,
    product_id: row.product_id,
    created_at: row.created_at,
    product: row.products ? mapSupabaseProduct(row.products) : null,
  }));
}

export async function getCustomerAddresses(userId: string): Promise<CustomerAddress[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("addresses")
    .select("*")
    .eq("user_id", userId)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function getCustomerReviews(userId: string): Promise<ProductReview[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("reviews")
    .select("*, products(id, name, image)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}

export async function getCustomerNotifications(userId: string): Promise<CustomerNotification[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(30);

  if (error || !data) return [];
  return data;
}

export async function getCustomerOrdersWithTracking(customerId: string) {
  if (!customerId) return [];
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      vendor_orders (
        id,
        store_id,
        subtotal,
        status,
        tracking_number,
        courier_id,
        stores (id, name, slug, logo),
        order_items (
          id,
          product_id,
          name,
          unit,
          price,
          quantity,
          total_price
        ),
        deliveries (
          id,
          status,
          bag_temp_celsius,
          pickup_address,
          dropoff_address,
          completed_at
        )
      )
    `)
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data;
}
