import type { SupabaseClient } from "@supabase/supabase-js";

export type DeliveryStatus = "assigned" | "picked_up" | "in_transit" | "delivered" | "failed";

export interface CourierProfileDTO {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  vehicle: string;
  equipment: string;
  isOnline: boolean;
  status: string;
}

export interface TempLogEntry {
  temp: number;
  recordedAt: string;
  note?: string;
}

export interface ManifestItemDTO {
  id: string;
  name: string;
  unit: string;
  quantity: number;
  price: number;
  totalPrice: number;
  checked: boolean;
}

export interface CourierDeliveryDTO {
  id: string;
  vendorOrderId: string;
  orderId: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  pickupAddress: string;
  dropoffAddress: string;
  customerName: string;
  customerPhone: string;
  deliveryInstructions: string | null;
  deliveryWindow: string | null;
  status: DeliveryStatus;
  vendorOrderStatus: string;
  bagTempCelsius: number;
  courierFee: number;
  tipAmount: number;
  proofNote: string | null;
  pickedUpAt: string | null;
  completedAt: string | null;
  createdAt: string;
  checkedItems: string[];
  tempLog: TempLogEntry[];
  items: ManifestItemDTO[];
}

export interface AvailableDeliveryDTO {
  vendorOrderId: string;
  orderId: string;
  orderNumber: string;
  storeId: string;
  storeName: string;
  pickupAddress: string;
  dropoffAddress: string;
  customerName: string;
  deliveryWindow: string | null;
  vendorOrderStatus: string;
  subtotal: number;
  estimatedFee: number;
  estimatedTip: number;
  itemCount: number;
  createdAt: string;
}

export interface CourierNotificationDTO {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  link: string | null;
  createdAt: string;
}

export interface DailyEarningsDTO {
  date: string;
  trips: number;
  fees: number;
  tips: number;
  total: number;
}

export interface CourierPayoutDTO {
  id: string;
  payoutNumber: string;
  amount: number;
  method: string;
  status: string;
  createdAt: string;
}

export function formatShippingAddress(addr: any): string {
  if (!addr) return "Address on file";
  if (typeof addr === "string") return addr;
  const parts = [addr.line1, addr.line2, addr.city, addr.state, addr.zip].filter(Boolean);
  return parts.join(", ") || "Address on file";
}

export async function verifyCourierProfile(admin: SupabaseClient, courierId: string) {
  if (!courierId) return { ok: false as const, error: "Missing user ID." };
  const { data, error } = await admin
    .from("profiles")
    .select("id, role, full_name, email, phone, vehicle, equipment, is_online, status")
    .eq("id", courierId)
    .maybeSingle();

  if (error || !data) {
    return { ok: false as const, error: "Courier profile not found." };
  }
  if (data.role !== "courier" && data.role !== "admin") {
    return { ok: false as const, error: "Unauthorized: Courier role required." };
  }
  return {
    ok: true as const,
    role: data.role as string,
    profile: {
      id: data.id,
      fullName: data.full_name || "Courier Partner",
      email: data.email || "",
      phone: data.phone || "",
      vehicle: data.vehicle || "Eco E-Bike",
      equipment: data.equipment || "Thermal Cold-Chain Box (40L)",
      isOnline: Boolean(data.is_online),
      status: data.status || "active",
    } satisfies CourierProfileDTO,
  };
}

export async function fetchCourierDeliveries(
  admin: SupabaseClient,
  courierId: string,
  statuses?: DeliveryStatus[]
): Promise<CourierDeliveryDTO[]> {
  let query = admin
    .from("deliveries")
    .select(`
      id,
      vendor_order_id,
      courier_id,
      status,
      pickup_address,
      dropoff_address,
      bag_temp_celsius,
      courier_fee,
      tip_amount,
      proof_note,
      picked_up_at,
      completed_at,
      created_at,
      checked_items,
      temp_log,
      vendor_orders (
        id,
        order_id,
        store_id,
        status,
        stores ( id, name, address ),
        orders (
          id,
          order_number,
          customer_id,
          shipping_address,
          delivery_instructions,
          delivery_window,
          profiles ( full_name, phone )
        ),
        order_items ( id, name, unit, quantity, price, total_price )
      )
    `)
    .eq("courier_id", courierId)
    .order("created_at", { ascending: false });

  if (statuses && statuses.length > 0) {
    query = query.in("status", statuses);
  }

  const { data, error } = await query;
  if (error || !data) {
    console.error("fetchCourierDeliveries error:", error);
    return [];
  }

  return data.map((row: any) => {
    const vo = row.vendor_orders || {};
    const store = vo.stores || {};
    const order = vo.orders || {};
    const customerProfile = order.profiles || {};
    const shipping = order.shipping_address || {};
    const checkedItems: string[] = Array.isArray(row.checked_items) ? row.checked_items : [];
    const tempLog: TempLogEntry[] = Array.isArray(row.temp_log) ? row.temp_log : [];
    const rawItems: any[] = Array.isArray(vo.order_items) ? vo.order_items : [];

    return {
      id: row.id,
      vendorOrderId: row.vendor_order_id,
      orderId: vo.order_id || "",
      orderNumber: order.order_number || "FM-ORDER",
      storeId: vo.store_id || store.id || "",
      storeName: store.name || "FreshMart Partner Store",
      pickupAddress: row.pickup_address || store.address || "Store Pickup",
      dropoffAddress: row.dropoff_address || formatShippingAddress(shipping),
      customerName: shipping.name || customerProfile.full_name || "Customer",
      customerPhone: shipping.phone || customerProfile.phone || "",
      deliveryInstructions: order.delivery_instructions || null,
      deliveryWindow: order.delivery_window || null,
      status: (row.status || "assigned") as DeliveryStatus,
      vendorOrderStatus: vo.status || "ready",
      bagTempCelsius: Number(row.bag_temp_celsius ?? 3.4),
      courierFee: Number(row.courier_fee ?? 0),
      tipAmount: Number(row.tip_amount ?? 0),
      proofNote: row.proof_note || null,
      pickedUpAt: row.picked_up_at || null,
      completedAt: row.completed_at || null,
      createdAt: row.created_at,
      checkedItems,
      tempLog,
      items: rawItems.map((it) => ({
        id: it.id,
        name: it.name,
        unit: it.unit || "Each",
        quantity: Number(it.quantity || 1),
        price: Number(it.price || 0),
        totalPrice: Number(it.total_price || 0),
        checked: checkedItems.includes(it.id),
      })),
    };
  });
}

export async function fetchAvailableVendorOrders(admin: SupabaseClient): Promise<AvailableDeliveryDTO[]> {
  const { data, error } = await admin
    .from("vendor_orders")
    .select(`
      id,
      order_id,
      store_id,
      status,
      subtotal,
      created_at,
      stores ( id, name, address ),
      orders (
        id,
        order_number,
        delivery_fee,
        tip_amount,
        delivery_window,
        shipping_address,
        order_status
      ),
      order_items ( id )
    `)
    .is("courier_id", null)
    .in("status", ["ready", "preparing", "accepted"])
    .order("created_at", { ascending: false });

  if (error || !data) {
    console.error("fetchAvailableVendorOrders error:", error);
    return [];
  }

  return data
    .filter((row: any) => {
      const orderStatus = row.orders?.order_status;
      return orderStatus !== "cancelled" && orderStatus !== "delivered";
    })
    .map((row: any) => {
      const store = row.stores || {};
      const order = row.orders || {};
      const shipping = order.shipping_address || {};
      const baseFee = Math.max(5.5, Number(order.delivery_fee || 2.99) + 3.5);
      const tip = Number(order.tip_amount || 0);
      return {
        vendorOrderId: row.id,
        orderId: row.order_id,
        orderNumber: order.order_number || "FM-ORDER",
        storeId: row.store_id,
        storeName: store.name || "Partner Store",
        pickupAddress: store.address || "Store Address",
        dropoffAddress: formatShippingAddress(shipping),
        customerName: shipping.name || "Customer",
        deliveryWindow: order.delivery_window || null,
        vendorOrderStatus: row.status,
        subtotal: Number(row.subtotal || 0),
        estimatedFee: Math.round(baseFee * 100) / 100,
        estimatedTip: Math.round(tip * 100) / 100,
        itemCount: Array.isArray(row.order_items) ? row.order_items.length : 0,
        createdAt: row.created_at,
      };
    });
}

export async function fetchCourierNotifications(
  admin: SupabaseClient,
  courierId: string
): Promise<CourierNotificationDTO[]> {
  const { data, error } = await admin
    .from("notifications")
    .select("id, title, message, type, is_read, link, created_at")
    .eq("user_id", courierId)
    .order("created_at", { ascending: false })
    .limit(15);

  if (error || !data) return [];
  return data.map((n: any) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    isRead: Boolean(n.is_read),
    link: n.link || null,
    createdAt: n.created_at,
  }));
}

export async function fetchCourierPayouts(
  admin: SupabaseClient,
  courierId: string
): Promise<CourierPayoutDTO[]> {
  const { data, error } = await admin
    .from("audit_logs")
    .select("id, details, created_at")
    .eq("user_id", courierId)
    .eq("action", "courier_cashout")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error || !data) return [];
  return data.map((row: any) => {
    const details = row.details || {};
    return {
      id: row.id,
      payoutNumber: details.payout_number || `ACH-${row.id.slice(0, 6).toUpperCase()}`,
      amount: Number(details.amount || 0),
      method: details.method || "Free ACH",
      status: details.status || "completed",
      createdAt: row.created_at,
    };
  });
}
