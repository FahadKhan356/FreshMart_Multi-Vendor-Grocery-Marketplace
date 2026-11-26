import { createClient } from "@supabase/supabase-js";
import { Product, Store, Category } from "../../data/mockData";

// Initialize Supabase public browser/server client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://yxceligmjaxpqeoqhgeq.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl4Y2VsaWdtamF4cHFlb3FoZ2VxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTU2MjM0MDUsImV4cCI6MjExMTE5OTQwNX0.MIwHMrBgcIexQJkodVsVKTTbS4iLdztT7sKnw3U_aD0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export function mapSupabaseProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    storeId: row.store_id || row.stores?.id || "a1111111-1111-1111-1111-111111111111",
    storeName: row.stores?.name || "GreenField Organic Market",
    price: Number(row.price),
    originalPrice: row.original_price ? Number(row.original_price) : undefined,
    discountBadge: row.discount_badge || undefined,
    unit: row.unit || "Each",
    category: row.category_id || "fruits-veggies",
    rating: Number(row.rating || 4.9),
    reviewsCount: Number(row.reviews_count || 95),
    image: row.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
    stock: Number(row.stock || 20),
    organic: Boolean(row.organic),
    origin: row.origin || "Hudson Valley, NY",
    description: row.description || "Farm fresh organic produce harvested daily.",
    nutrition: row.nutrition || undefined,
    harvestDate: row.harvest_date || undefined,
    expiryDate: row.expiry_date || undefined,
  };
}

export function mapSupabaseStore(row: any): Store {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    rating: Number(row.rating || 4.9),
    reviewsCount: Number(row.reviews_count || 240),
    deliveryTime: row.delivery_time || "25-35 mins",
    deliveryFee: Number(row.delivery_fee || 1.99),
    minOrder: Number(row.min_order || 15.00),
    distance: row.distance || "1.2 miles",
    tags: Array.isArray(row.tags) ? row.tags : ["100% Certified Organic", "Local Farm", "Cold-Chain Verified"],
    logo: row.logo || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80",
    banner: row.banner || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80",
    description: row.description || "Certified organic local marketplace grocer.",
    address: row.address || "Brooklyn, NY",
    featured: row.status === "approved",
  };
}

// 1. Fetch live categories
export async function getLiveCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .order("item_count", { ascending: false });

    if (error || !data || data.length === 0) return [];
    return data.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon || "Salad",
      itemCount: c.item_count || 120,
      bgColor: c.bg_color || "bg-emerald-50",
      textColor: c.text_color || "text-emerald-700",
    }));
  } catch (err) {
    console.error("getLiveCategories error:", err);
    return [];
  }
}

// 2. Fetch live stores
export async function getLiveStores(onlyApproved: boolean = true): Promise<Store[]> {
  try {
    let query = supabase.from("stores").select("*").order("name");
    if (onlyApproved) {
      query = query.eq("status", "approved");
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(mapSupabaseStore);
  } catch (err) {
    console.error("getLiveStores error:", err);
    return [];
  }
}

// 3. Fetch single store by slug
export async function getLiveStoreBySlug(slug: string): Promise<Store | null> {
  try {
    const { data, error } = await supabase
      .from("stores")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) return null;
    return mapSupabaseStore(data);
  } catch (err) {
    console.error("getLiveStoreBySlug error:", err);
    return null;
  }
}

// 4. Fetch live products
export async function getLiveProducts(filters?: {
  categoryId?: string;
  storeId?: string;
  organicOnly?: boolean;
}): Promise<Product[]> {
  try {
    let query = supabase
      .from("products")
      .select("*, stores(id, name, slug)")
      .eq("is_available", true)
      .order("created_at", { ascending: false });

    if (filters?.categoryId && filters.categoryId !== "all") {
      query = query.eq("category_id", filters.categoryId);
    }
    if (filters?.storeId && filters.storeId !== "all") {
      query = query.eq("store_id", filters.storeId);
    }
    if (filters?.organicOnly) {
      query = query.eq("organic", true);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data.map(mapSupabaseProduct);
  } catch (err) {
    console.error("getLiveProducts error:", err);
    return [];
  }
}

// 5. Fetch single product by ID
export async function getLiveProductById(id: string): Promise<Product | null> {
  try {
    const { data, error } = await supabase
      .from("products")
      .select("*, stores(id, name, slug)")
      .eq("id", id)
      .single();

    if (error || !data) return null;
    return mapSupabaseProduct(data);
  } catch (err) {
    console.error("getLiveProductById error:", err);
    return null;
  }
}

// 6. Fetch live customer orders
export async function getLiveCustomerOrders(customerId?: string) {
  try {
    let query = supabase
      .from("orders")
      .select(`
        *,
        vendor_orders (
          id,
          subtotal,
          status,
          tracking_number,
          stores (name),
          order_items (*)
        )
      `)
      .order("created_at", { ascending: false });

    if (customerId) {
      query = query.eq("customer_id", customerId);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error("getLiveCustomerOrders error:", err);
    return [];
  }
}

// 7. Create new live product
export async function createLiveProduct(payload: {
  name: string;
  price: number;
  stock: number;
  unit?: string;
  store_id?: string;
  category_id?: string;
  description?: string;
  image?: string;
  organic?: boolean;
  origin?: string;
}) {
  try {
    const { data, error } = await supabase
      .from("products")
      .insert({
        name: payload.name,
        price: payload.price,
        stock: payload.stock,
        unit: payload.unit || "Each",
        store_id: payload.store_id || "a1111111-1111-1111-1111-111111111111",
        category_id: payload.category_id || "fruits-veggies",
        description: payload.description || "Farm fresh organic produce harvested daily.",
        image: payload.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
        organic: payload.organic ?? true,
        origin: payload.origin || "Hudson Valley, NY",
        rating: 5.0,
        reviews_count: 1,
        is_available: true,
      })
      .select("*, stores(id, name, slug)")
      .single();

    if (error) {
      console.error("createLiveProduct error:", error);
      return null;
    }
    return mapSupabaseProduct(data);
  } catch (err) {
    console.error("createLiveProduct exception:", err);
    return null;
  }
}

// 8. Update store KYC/verification status (Admin)
export async function updateStoreStatus(storeId: string, status: "approved" | "rejected" | "suspended" | "pending_review") {
  try {
    const { data, error } = await supabase
      .from("stores")
      .update({ status })
      .eq("id", storeId)
      .select()
      .single();

    if (error) {
      console.error("updateStoreStatus error:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("updateStoreStatus exception:", err);
    return false;
  }
}

// 9. Fetch all admin orders
export async function getLiveAdminOrders() {
  try {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        *,
        vendor_orders (
          id,
          subtotal,
          status,
          tracking_number,
          stores (name),
          order_items (*)
        )
      `)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data;
  } catch (err) {
    console.error("getLiveAdminOrders error:", err);
    return [];
  }
}

