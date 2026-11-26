"use server";

import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchAvailableVendorOrders,
  fetchCourierDeliveries,
  fetchCourierNotifications,
  fetchCourierPayouts,
  formatShippingAddress,
  verifyCourierProfile,
  type AvailableDeliveryDTO,
  type CourierDeliveryDTO,
  type CourierNotificationDTO,
  type CourierPayoutDTO,
  type CourierProfileDTO,
  type DailyEarningsDTO,
} from "@/lib/data/courier";

export async function getCourierLayoutData(courierId: string): Promise<{
  success: boolean;
  error?: string;
  profile?: CourierProfileDTO;
  activeCount?: number;
  latestTemp?: number | null;
  notifications?: CourierNotificationDTO[];
}> {
  const admin = createAdminClient();
  const auth = await verifyCourierProfile(admin, courierId);
  if (!auth.ok) return { success: false, error: auth.error };

  const [activeDeliveries, notifications] = await Promise.all([
    fetchCourierDeliveries(admin, courierId, ["assigned", "picked_up", "in_transit"]),
    fetchCourierNotifications(admin, courierId),
  ]);

  return {
    success: true,
    profile: auth.profile,
    activeCount: activeDeliveries.length,
    latestTemp: activeDeliveries[0]?.bagTempCelsius ?? null,
    notifications,
  };
}

export async function getCourierDashboardData(courierId: string): Promise<{
  success: boolean;
  error?: string;
  assigned?: CourierDeliveryDTO[];
  completed?: CourierDeliveryDTO[];
  available?: AvailableDeliveryDTO[];
}> {
  const admin = createAdminClient();
  const auth = await verifyCourierProfile(admin, courierId);
  if (!auth.ok) return { success: false, error: auth.error };

  const [allDeliveries, available] = await Promise.all([
    fetchCourierDeliveries(admin, courierId),
    fetchAvailableVendorOrders(admin),
  ]);

  return {
    success: true,
    assigned: allDeliveries.filter((d) => ["assigned", "picked_up", "in_transit"].includes(d.status)),
    completed: allDeliveries.filter((d) => d.status === "delivered"),
    available,
  };
}

export async function getCourierLiveRouteData(courierId: string): Promise<{
  success: boolean;
  error?: string;
  activeDeliveries?: CourierDeliveryDTO[];
}> {
  const admin = createAdminClient();
  const auth = await verifyCourierProfile(admin, courierId);
  if (!auth.ok) return { success: false, error: auth.error };

  const activeDeliveries = await fetchCourierDeliveries(admin, courierId, [
    "assigned",
    "picked_up",
    "in_transit",
  ]);
  return { success: true, activeDeliveries };
}

export async function getCourierManifestData(courierId: string): Promise<{
  success: boolean;
  error?: string;
  activeDeliveries?: CourierDeliveryDTO[];
}> {
  const admin = createAdminClient();
  const auth = await verifyCourierProfile(admin, courierId);
  if (!auth.ok) return { success: false, error: auth.error };

  const activeDeliveries = await fetchCourierDeliveries(admin, courierId, [
    "assigned",
    "picked_up",
    "in_transit",
  ]);
  return { success: true, activeDeliveries };
}

export async function getCourierEarningsData(courierId: string): Promise<{
  success: boolean;
  error?: string;
  todayTotal?: number;
  todayTrips?: number;
  totalTips?: number;
  avgTip?: number;
  lifetimeEarned?: number;
  totalCashedOut?: number;
  availableBalance?: number;
  dailyTotals?: DailyEarningsDTO[];
  completedDeliveries?: CourierDeliveryDTO[];
  payouts?: CourierPayoutDTO[];
}> {
  const admin = createAdminClient();
  const auth = await verifyCourierProfile(admin, courierId);
  if (!auth.ok) return { success: false, error: auth.error };

  const [completedDeliveries, payouts] = await Promise.all([
    fetchCourierDeliveries(admin, courierId, ["delivered"]),
    fetchCourierPayouts(admin, courierId),
  ]);

  const todayKey = new Date().toISOString().slice(0, 10);
  let todayTotal = 0;
  let todayTrips = 0;
  let totalTips = 0;
  let lifetimeEarned = 0;
  const dayMap = new Map<string, DailyEarningsDTO>();

  for (const d of completedDeliveries) {
    const dateKey = (d.completedAt || d.createdAt).slice(0, 10);
    const fee = Number(d.courierFee || 0);
    const tip = Number(d.tipAmount || 0);
    const total = fee + tip;

    lifetimeEarned += total;
    totalTips += tip;
    if (dateKey === todayKey) {
      todayTotal += total;
      todayTrips += 1;
    }

    const existing = dayMap.get(dateKey) || { date: dateKey, trips: 0, fees: 0, tips: 0, total: 0 };
    existing.trips += 1;
    existing.fees = Math.round((existing.fees + fee) * 100) / 100;
    existing.tips = Math.round((existing.tips + tip) * 100) / 100;
    existing.total = Math.round((existing.total + total) * 100) / 100;
    dayMap.set(dateKey, existing);
  }

  const totalCashedOut = payouts.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const availableBalance = Math.max(0, Math.round((lifetimeEarned - totalCashedOut) * 100) / 100);
  const avgTip = completedDeliveries.length > 0 ? totalTips / completedDeliveries.length : 0;

  return {
    success: true,
    todayTotal: Math.round(todayTotal * 100) / 100,
    todayTrips,
    totalTips: Math.round(totalTips * 100) / 100,
    avgTip: Math.round(avgTip * 100) / 100,
    lifetimeEarned: Math.round(lifetimeEarned * 100) / 100,
    totalCashedOut: Math.round(totalCashedOut * 100) / 100,
    availableBalance,
    dailyTotals: Array.from(dayMap.values()).sort((a, b) => b.date.localeCompare(a.date)),
    completedDeliveries,
    payouts,
  };
}

export async function getCourierProfileData(courierId: string): Promise<{
  success: boolean;
  error?: string;
  profile?: CourierProfileDTO;
  completedCount?: number;
}> {
  const admin = createAdminClient();
  const auth = await verifyCourierProfile(admin, courierId);
  if (!auth.ok) return { success: false, error: auth.error };

  const { count } = await admin
    .from("deliveries")
    .select("id", { count: "exact", head: true })
    .eq("courier_id", courierId)
    .eq("status", "delivered");

  return {
    success: true,
    profile: auth.profile,
    completedCount: count || 0,
  };
}

export async function toggleCourierOnlineStatus(courierId: string, isOnline: boolean) {
  const admin = createAdminClient();
  const auth = await verifyCourierProfile(admin, courierId);
  if (!auth.ok) return { success: false, error: auth.error };

  const { error } = await admin
    .from("profiles")
    .update({ is_online: isOnline, updated_at: new Date().toISOString() })
    .eq("id", courierId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/courier");
  return { success: true, isOnline };
}

export async function acceptAvailableDelivery(courierId: string, vendorOrderId: string) {
  const admin = createAdminClient();
  const auth = await verifyCourierProfile(admin, courierId);
  if (!auth.ok) return { success: false, error: auth.error };

  const { data: vo, error: voErr } = await admin
    .from("vendor_orders")
    .select(`
      id,
      order_id,
      store_id,
      courier_id,
      status,
      stores ( name, address ),
      orders ( id, order_number, customer_id, delivery_fee, tip_amount, shipping_address )
    `)
    .eq("id", vendorOrderId)
    .maybeSingle();

  if (voErr || !vo) return { success: false, error: "Vendor order not found." };
  if (vo.courier_id) return { success: false, error: "This delivery has already been claimed." };

  const store: any = vo.stores || {};
  const order: any = vo.orders || {};

  // Claim vendor_order atomically (only if courier_id is still null)
  const { data: claimed, error: claimErr } = await admin
    .from("vendor_orders")
    .update({
      courier_id: courierId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", vendorOrderId)
    .is("courier_id", null)
    .select("id")
    .maybeSingle();

  if (claimErr || !claimed) {
    return { success: false, error: "Unable to claim delivery (may have been taken)." };
  }

  const courierFee = Math.round(Math.max(5.5, Number(order.delivery_fee || 2.99) + 3.5) * 100) / 100;
  const tipAmount = Math.round(Number(order.tip_amount || 0) * 100) / 100;

  const { data: delivery, error: delErr } = await admin
    .from("deliveries")
    .insert({
      vendor_order_id: vendorOrderId,
      courier_id: courierId,
      status: "assigned",
      pickup_address: store.address || "Partner Store",
      dropoff_address: formatShippingAddress(order.shipping_address),
      bag_temp_celsius: 3.4,
      courier_fee: courierFee,
      tip_amount: tipAmount,
    })
    .select("id")
    .single();

  if (delErr || !delivery) {
    // Rollback claim
    await admin.from("vendor_orders").update({ courier_id: null }).eq("id", vendorOrderId);
    return { success: false, error: delErr?.message || "Failed to create delivery record." };
  }

  if (order.customer_id) {
    await admin.from("notifications").insert({
      user_id: order.customer_id,
      title: `Courier assigned (${order.order_number})`,
      message: `${auth.profile.fullName} accepted your pickup from ${store.name || "the store"}.`,
      type: "delivery",
      link: `/orders`,
    });
  }

  revalidatePath("/courier");
  return { success: true, deliveryId: delivery.id };
}

export async function updateDeliveryStatus(
  courierId: string,
  deliveryId: string,
  nextStatus: "picked_up" | "in_transit" | "delivered",
  opts?: { bagTempCelsius?: number; proofNote?: string }
) {
  const admin = createAdminClient();
  const auth = await verifyCourierProfile(admin, courierId);
  if (!auth.ok) return { success: false, error: auth.error };

  const { data: del, error: delFetchErr } = await admin
    .from("deliveries")
    .select(`
      id,
      courier_id,
      vendor_order_id,
      status,
      bag_temp_celsius,
      vendor_orders (
        id,
        order_id,
        stores ( name ),
        orders ( id, order_number, customer_id, order_status )
      )
    `)
    .eq("id", deliveryId)
    .maybeSingle();

  if (delFetchErr || !del) return { success: false, error: "Delivery not found." };
  if (del.courier_id !== courierId && auth.role !== "admin") {
    return { success: false, error: "Unauthorized: Delivery belongs to another courier." };
  }

  const now = new Date().toISOString();
  const updatePayload: Record<string, any> = { status: nextStatus };

  if (opts?.bagTempCelsius !== undefined && !Number.isNaN(opts.bagTempCelsius)) {
    updatePayload.bag_temp_celsius = opts.bagTempCelsius;
  }
  if (opts?.proofNote !== undefined) {
    updatePayload.proof_note = opts.proofNote.trim() || null;
  }
  if (nextStatus === "picked_up") {
    updatePayload.picked_up_at = now;
  }
  if (nextStatus === "delivered") {
    updatePayload.completed_at = now;
  }

  const { error: updErr } = await admin.from("deliveries").update(updatePayload).eq("id", deliveryId);
  if (updErr) return { success: false, error: updErr.message };

  const vo: any = del.vendor_orders || {};
  const order: any = vo.orders || {};
  const storeName = vo.stores?.name || "the store";

  // Update vendor_orders status
  const nextVoStatus = nextStatus === "delivered" ? "completed" : "dispatched";
  await admin
    .from("vendor_orders")
    .update({ status: nextVoStatus, updated_at: now })
    .eq("id", del.vendor_order_id);

  // Update parent order status
  if (vo.order_id) {
    if (nextStatus === "delivered") {
      const { data: siblingVos } = await admin
        .from("vendor_orders")
        .select("id, status")
        .eq("order_id", vo.order_id);

      const allDone =
        siblingVos &&
        siblingVos.length > 0 &&
        siblingVos.every((s: any) => ["completed", "cancelled", "rejected"].includes(s.status));

      if (allDone) {
        await admin
          .from("orders")
          .update({ order_status: "delivered", updated_at: now })
          .eq("id", vo.order_id);
      }
    } else if (order.order_status !== "delivered" && order.order_status !== "out_for_delivery") {
      await admin
        .from("orders")
        .update({ order_status: "out_for_delivery", updated_at: now })
        .eq("id", vo.order_id);
    }
  }

  // Notify customer
  if (order.customer_id) {
    const titleMap = {
      picked_up: `Order picked up (${order.order_number})`,
      in_transit: `Out for delivery (${order.order_number})`,
      delivered: `Order delivered (${order.order_number})`,
    };
    const msgMap = {
      picked_up: `Your courier picked up your groceries from ${storeName}.`,
      in_transit: `${auth.profile.fullName} is on the way with your order from ${storeName}.`,
      delivered: `Your delivery from ${storeName} is complete.${opts?.proofNote ? ` Note: ${opts.proofNote}` : ""}`,
    };
    await admin.from("notifications").insert({
      user_id: order.customer_id,
      title: titleMap[nextStatus],
      message: msgMap[nextStatus],
      type: "delivery",
      link: `/orders`,
    });
  }

  revalidatePath("/courier");
  revalidatePath("/courier/live-route");
  revalidatePath("/courier/earnings");
  return { success: true, status: nextStatus };
}

export async function toggleManifestItem(courierId: string, deliveryId: string, orderItemId: string) {
  const admin = createAdminClient();
  const auth = await verifyCourierProfile(admin, courierId);
  if (!auth.ok) return { success: false, error: auth.error };

  const { data: del, error } = await admin
    .from("deliveries")
    .select("id, courier_id, checked_items")
    .eq("id", deliveryId)
    .maybeSingle();

  if (error || !del) return { success: false, error: "Delivery not found." };
  if (del.courier_id !== courierId && auth.role !== "admin") {
    return { success: false, error: "Unauthorized." };
  }

  const current: string[] = Array.isArray(del.checked_items) ? del.checked_items : [];
  const next = current.includes(orderItemId)
    ? current.filter((id) => id !== orderItemId)
    : [...current, orderItemId];

  const { error: updErr } = await admin
    .from("deliveries")
    .update({ checked_items: next })
    .eq("id", deliveryId);

  if (updErr) return { success: false, error: updErr.message };
  revalidatePath("/courier/manifest");
  return { success: true, checkedItems: next };
}

export async function logDeliveryTemperature(
  courierId: string,
  deliveryId: string,
  tempCelsius: number,
  note?: string
) {
  const admin = createAdminClient();
  const auth = await verifyCourierProfile(admin, courierId);
  if (!auth.ok) return { success: false, error: auth.error };

  if (Number.isNaN(tempCelsius) || tempCelsius < -30 || tempCelsius > 40) {
    return { success: false, error: "Enter a valid temperature between -30°C and 40°C." };
  }

  const { data: del, error } = await admin
    .from("deliveries")
    .select("id, courier_id, temp_log")
    .eq("id", deliveryId)
    .maybeSingle();

  if (error || !del) return { success: false, error: "Delivery not found." };
  if (del.courier_id !== courierId && auth.role !== "admin") {
    return { success: false, error: "Unauthorized." };
  }

  const existingLog = Array.isArray(del.temp_log) ? del.temp_log : [];
  const entry = {
    temp: Math.round(tempCelsius * 10) / 10,
    recordedAt: new Date().toISOString(),
    note: note?.trim() || "Cold-chain check",
  };
  const nextLog = [entry, ...existingLog].slice(0, 20);

  const { error: updErr } = await admin
    .from("deliveries")
    .update({
      bag_temp_celsius: entry.temp,
      temp_log: nextLog,
    })
    .eq("id", deliveryId);

  if (updErr) return { success: false, error: updErr.message };
  revalidatePath("/courier/manifest");
  revalidatePath("/courier");
  return { success: true, bagTempCelsius: entry.temp, tempLog: nextLog };
}

export async function requestCourierCashout(courierId: string) {
  const admin = createAdminClient();
  const auth = await verifyCourierProfile(admin, courierId);
  if (!auth.ok) return { success: false, error: auth.error };

  const earnings = await getCourierEarningsData(courierId);
  if (!earnings.success) return { success: false, error: earnings.error };

  const available = earnings.availableBalance || 0;
  if (available <= 0) {
    return { success: false, error: "No available balance to cash out." };
  }

  const payoutNumber = `ACH-${Math.floor(100000 + Math.random() * 900000)}`;
  const { error } = await admin.from("audit_logs").insert({
    user_id: courierId,
    action: "courier_cashout",
    entity_type: "courier_payout",
    entity_id: payoutNumber,
    details: {
      payout_number: payoutNumber,
      amount: available,
      method: "Free ACH",
      status: "completed",
    },
  });

  if (error) return { success: false, error: error.message };

  await admin.from("notifications").insert({
    user_id: courierId,
    title: `Cashout sent (${payoutNumber})`,
    message: `$${available.toFixed(2)} has been initiated via Free ACH.`,
    type: "payout",
    link: "/courier/earnings",
  });

  revalidatePath("/courier/earnings");
  return { success: true, amount: available, payoutNumber };
}

export async function updateCourierProfile(
  courierId: string,
  input: { fullName: string; phone: string; vehicle: string; equipment: string }
) {
  const admin = createAdminClient();
  const auth = await verifyCourierProfile(admin, courierId);
  if (!auth.ok) return { success: false, error: auth.error };

  const fullName = input.fullName.trim();
  if (!fullName) return { success: false, error: "Full name is required." };

  const { error } = await admin
    .from("profiles")
    .update({
      full_name: fullName,
      phone: input.phone.trim() || null,
      vehicle: input.vehicle.trim() || null,
      equipment: input.equipment.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", courierId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/courier");
  revalidatePath("/courier/profile");
  return { success: true };
}

export async function markCourierNotificationsRead(courierId: string) {
  const admin = createAdminClient();
  const auth = await verifyCourierProfile(admin, courierId);
  if (!auth.ok) return { success: false, error: auth.error };

  const { error } = await admin
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", courierId)
    .eq("is_read", false);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
