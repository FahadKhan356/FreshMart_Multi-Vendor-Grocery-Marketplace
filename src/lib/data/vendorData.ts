import { supabase } from "./supabaseData";

export interface VendorStore {
  id: string;
  vendor_id: string;
  name: string;
  slug: string;
  description: string;
  logo: string;
  banner: string;
  address: string;
  phone: string;
  commission_rate: number;
  status: string;
  min_order: number;
  delivery_fee: number;
  delivery_time: string;
  is_open: boolean;
  opening_time: string;
  closing_time: string;
  delivery_radius: number;
  bank_name: string;
  bank_account_last4: string;
  bank_routing: string;
  bank_account_holder: string;
  rating: number;
  reviews_count: number;
}

export interface VendorProduct {
  id: string;
  store_id: string;
  category_id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  discount_badge: string | null;
  unit: string;
  origin: string;
  organic: boolean;
  harvest_date: string | null;
  expiry_date: string | null;
  batch_number: string | null;
  markdown_percent: number;
  stock: number;
  low_stock_threshold: number;
  is_available: boolean;
  image: string;
  rating: number;
  reviews_count: number;
  approval_status: string | null;
}

export interface VendorCategory {
  id: string;
  name: string;
  slug: string;
}

export interface VendorOrderItem {
  id: string;
  product_id: string | null;
  name: string;
  unit: string;
  price: number;
  quantity: number;
  total_price: number;
}

export interface VendorOrderRow {
  id: string;
  order_id: string;
  order_number: string;
  store_id: string;
  subtotal: number;
  vendor_payout_amount: number;
  platform_fee_amount: number;
  commission_rate: number;
  status: string;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address: Record<string, any>;
  delivery_instructions: string | null;
  delivery_window: string | null;
  payment_status: string;
  items: VendorOrderItem[];
}

export interface VendorReviewRow {
  id: string;
  product_id: string;
  product_name: string;
  product_image: string;
  user_id: string;
  reviewer_name: string;
  rating: number;
  comment: string;
  vendor_reply: string | null;
  vendor_reply_at: string | null;
  created_at: string;
}

export interface VendorPayoutRow {
  id: string;
  payout_number: string;
  store_id: string;
  amount: number;
  platform_fee: number;
  net_payout: number;
  status: string;
  bank_account_last4: string | null;
  stripe_transfer_id: string | null;
  period_start: string | null;
  period_end: string | null;
  created_at: string;
}

export interface VendorNotificationRow {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

function mapStore(row: any): VendorStore {
  return {
    id: row.id,
    vendor_id: row.vendor_id,
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    logo: row.logo || "",
    banner: row.banner || "",
    address: row.address || "",
    phone: row.phone || "",
    commission_rate: Number(row.commission_rate ?? 0.08),
    status: row.status || "approved",
    min_order: Number(row.min_order ?? 15),
    delivery_fee: Number(row.delivery_fee ?? 2.99),
    delivery_time: row.delivery_time || "25-35 mins",
    is_open: row.is_open !== false,
    opening_time: row.opening_time || "07:00 AM",
    closing_time: row.closing_time || "09:00 PM",
    delivery_radius: Number(row.delivery_radius ?? 5.0),
    bank_name: row.bank_name || "Chase Business Checking",
    bank_account_last4: row.bank_account_last4 || "8821",
    bank_routing: row.bank_routing || "021000021",
    bank_account_holder: row.bank_account_holder || row.name || "",
    rating: Number(row.rating ?? 4.9),
    reviews_count: Number(row.reviews_count ?? 0),
  };
}

export async function getVendorStores(userId: string, role: string): Promise<VendorStore[]> {
  let query = supabase.from("stores").select("*").order("created_at", { ascending: true });
  if (role !== "admin") {
    query = query.eq("vendor_id", userId);
  }
  const { data, error } = await query;
  if (error || !data) return [];
  return data.map(mapStore);
}

export async function getVendorStoreById(storeId: string): Promise<VendorStore | null> {
  const { data, error } = await supabase.from("stores").select("*").eq("id", storeId).maybeSingle();
  if (error || !data) return null;
  return mapStore(data);
}

export async function getVendorProducts(storeId: string): Promise<VendorProduct[]> {
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((p: any) => ({
    id: p.id,
    store_id: p.store_id,
    category_id: p.category_id,
    name: p.name,
    slug: p.slug,
    description: p.description || "",
    price: Number(p.price),
    original_price: p.original_price != null ? Number(p.original_price) : null,
    discount_badge: p.discount_badge || null,
    unit: p.unit || "Each",
    origin: p.origin || "Local Farm",
    organic: Boolean(p.organic),
    harvest_date: p.harvest_date || null,
    expiry_date: p.expiry_date || null,
    batch_number: p.batch_number || null,
    markdown_percent: Number(p.markdown_percent ?? 0),
    stock: Number(p.stock ?? 0),
    low_stock_threshold: Number(p.low_stock_threshold ?? 15),
    is_available: Boolean(p.is_available),
    image: p.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
    rating: Number(p.rating ?? 4.9),
    reviews_count: Number(p.reviews_count ?? 0),
    approval_status: p.approval_status || "approved",
  }));
}

export async function getCategoriesList(): Promise<VendorCategory[]> {
  const { data, error } = await supabase.from("categories").select("id, name, slug").order("name");
  if (error || !data) return [];
  return data;
}

export function getDaysUntilExpiry(expiryDateStr: string | null): number | null {
  if (!expiryDateStr) return null;
  const parsed = new Date(expiryDateStr);
  if (Number.isNaN(parsed.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  parsed.setHours(0, 0, 0, 0);
  return Math.ceil((parsed.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export async function getVendorOrders(storeId: string): Promise<VendorOrderRow[]> {
  const { data, error } = await supabase
    .from("vendor_orders")
    .select(`
      *,
      orders (
        id,
        order_number,
        customer_id,
        shipping_address,
        delivery_instructions,
        delivery_window,
        payment_status,
        order_status,
        profiles:customer_id ( full_name, email, phone )
      ),
      order_items (
        id,
        product_id,
        name,
        unit,
        price,
        quantity,
        total_price
      )
    `)
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];

  return data.map((vo: any) => {
    const order = vo.orders || {};
    const customer = order.profiles || {};
    return {
      id: vo.id,
      order_id: vo.order_id,
      order_number: order.order_number || `VO-${vo.id.slice(0, 6).toUpperCase()}`,
      store_id: vo.store_id,
      subtotal: Number(vo.subtotal),
      vendor_payout_amount: Number(vo.vendor_payout_amount),
      platform_fee_amount: Number(vo.platform_fee_amount),
      commission_rate: Number(vo.commission_rate ?? 0.08),
      status: vo.status,
      tracking_number: vo.tracking_number || null,
      created_at: vo.created_at,
      updated_at: vo.updated_at,
      customer_name: customer.full_name || order.shipping_address?.fullName || "Customer",
      customer_email: customer.email || "",
      customer_phone: customer.phone || order.shipping_address?.phone || "",
      shipping_address: order.shipping_address || {},
      delivery_instructions: order.delivery_instructions || null,
      delivery_window: order.delivery_window || null,
      payment_status: order.payment_status || "paid",
      items: (vo.order_items || []).map((it: any) => ({
        id: it.id,
        product_id: it.product_id,
        name: it.name,
        unit: it.unit,
        price: Number(it.price),
        quantity: Number(it.quantity),
        total_price: Number(it.total_price),
      })),
    };
  });
}

export async function getVendorReviews(storeId: string): Promise<VendorReviewRow[]> {
  const { data: prods } = await supabase
    .from("products")
    .select("id, name, image")
    .eq("store_id", storeId);

  if (!prods || prods.length === 0) return [];
  const prodMap = new Map<string, { name: string; image: string }>();
  for (const p of prods) {
    prodMap.set(p.id, { name: p.name, image: p.image });
  }

  const { data, error } = await supabase
    .from("reviews")
    .select("*")
    .in("product_id", Array.from(prodMap.keys()))
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((r: any) => {
    const prod = prodMap.get(r.product_id);
    return {
      id: r.id,
      product_id: r.product_id,
      product_name: prod?.name || "Store Product",
      product_image: prod?.image || "",
      user_id: r.user_id,
      reviewer_name: r.reviewer_name || "Verified Buyer",
      rating: Number(r.rating),
      comment: r.comment || "",
      vendor_reply: r.vendor_reply || null,
      vendor_reply_at: r.vendor_reply_at || null,
      created_at: r.created_at,
    };
  });
}

export async function getVendorPayouts(storeId: string): Promise<VendorPayoutRow[]> {
  const { data, error } = await supabase
    .from("vendor_payouts")
    .select("*")
    .eq("store_id", storeId)
    .order("created_at", { ascending: false });

  if (error || !data) return [];
  return data.map((p: any) => ({
    id: p.id,
    payout_number: p.payout_number,
    store_id: p.store_id,
    amount: Number(p.amount),
    platform_fee: Number(p.platform_fee),
    net_payout: Number(p.net_payout),
    status: p.status,
    bank_account_last4: p.bank_account_last4 || null,
    stripe_transfer_id: p.stripe_transfer_id || null,
    period_start: p.period_start || null,
    period_end: p.period_end || null,
    created_at: p.created_at,
  }));
}

export async function getVendorBalanceRow(storeId: string) {
  const { data } = await supabase
    .from("vendor_balances")
    .select("*")
    .eq("store_id", storeId)
    .maybeSingle();

  return {
    available_balance: Number(data?.available_balance ?? 0),
    pending_balance: Number(data?.pending_balance ?? 0),
    total_withdrawn: Number(data?.total_withdrawn ?? 0),
  };
}

export async function getVendorSidebarBadges(storeId: string) {
  const [{ data: products }, { count: newOrdersCount }] = await Promise.all([
    supabase.from("products").select("id, expiry_date").eq("store_id", storeId),
    supabase
      .from("vendor_orders")
      .select("id", { count: "exact", head: true })
      .eq("store_id", storeId)
      .in("status", ["pending", "accepted"]),
  ]);

  let nearExpiryCount = 0;
  for (const p of products || []) {
    const days = getDaysUntilExpiry(p.expiry_date);
    if (days !== null && days <= 5) {
      nearExpiryCount += 1;
    }
  }

  return {
    nearExpiryCount,
    newOrdersCount: newOrdersCount ?? 0,
  };
}

export async function getVendorNotifications(userId: string): Promise<VendorNotificationRow[]> {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, type, is_read, link, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(15);

  if (error || !data) return [];
  return data;
}
