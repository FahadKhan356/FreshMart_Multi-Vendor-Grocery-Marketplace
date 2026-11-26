// Server-only helpers shared by server actions & API routes (NOT a "use server" file on purpose,
// so none of these are exposed as callable server actions).
import type { SupabaseClient } from "@supabase/supabase-js";

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY || "";
  return /^sk_(test|live)_[A-Za-z0-9]{16,}$/.test(key) && !key.includes("placeholder");
}

export interface CouponCheck {
  ok: boolean;
  error?: string;
  coupon?: { id: string; code: string; discount_type: string; value: number; min_order: number };
  discount: number;
}

export async function validateCouponCode(
  admin: SupabaseClient,
  rawCode: string,
  subtotal: number
): Promise<CouponCheck> {
  const code = (rawCode || "").trim().toUpperCase();
  if (!code) return { ok: false, error: "Enter a discount code.", discount: 0 };

  const { data: c, error } = await admin.from("coupons").select("*").ilike("code", code).maybeSingle();
  if (error || !c) return { ok: false, error: "Invalid discount code.", discount: 0 };
  if (!c.is_active) return { ok: false, error: "This discount code is no longer active.", discount: 0 };
  if (c.expires_at && new Date(c.expires_at).getTime() < Date.now())
    return { ok: false, error: "This discount code has expired.", discount: 0 };
  if (c.usage_limit != null && Number(c.used_count || 0) >= Number(c.usage_limit))
    return { ok: false, error: "This discount code has reached its usage limit.", discount: 0 };
  if (subtotal < Number(c.min_order || 0))
    return {
      ok: false,
      error: `Minimum order of $${Number(c.min_order).toFixed(2)} required for ${c.code}.`,
      discount: 0,
    };

  const value = Number(c.value);
  let discount = c.discount_type === "percent" ? (subtotal * value) / 100 : value;
  discount = Math.round(Math.min(discount, subtotal) * 100) / 100;
  return {
    ok: true,
    discount,
    coupon: {
      id: c.id,
      code: c.code,
      discount_type: c.discount_type,
      value,
      min_order: Number(c.min_order || 0),
    },
  };
}

/** Idempotently mark an order paid and accept its vendor sub-orders. */
export async function markOrderPaid(admin: SupabaseClient, orderId: string, paymentIntentId?: string | null) {
  const { data: order } = await admin.from("orders").select("id, payment_status, customer_id, order_number").eq("id", orderId).single();
  if (!order) return false;
  if (order.payment_status === "paid") return true;

  const now = new Date().toISOString();
  await admin
    .from("orders")
    .update({
      payment_status: "paid",
      order_status: "paid",
      ...(paymentIntentId ? { stripe_payment_intent_id: paymentIntentId } : {}),
      updated_at: now,
    })
    .eq("id", orderId);
  await admin
    .from("vendor_orders")
    .update({ status: "accepted", updated_at: now })
    .eq("order_id", orderId)
    .eq("status", "pending");
  await admin.from("notifications").insert({
    user_id: order.customer_id,
    title: `Payment received (${order.order_number})`,
    message: "Your payment was confirmed and the stores are preparing your groceries.",
    type: "order",
    link: `/order-success?order_id=${orderId}`,
  });
  return true;
}

/** Give reserved stock back (order cancelled / payment expired). */
export async function restoreOrderStock(admin: SupabaseClient, orderId: string) {
  const { data: items } = await admin.from("order_items").select("product_id, quantity").eq("order_id", orderId);
  for (const it of items || []) {
    if (it.product_id) await admin.rpc("increment_stock", { p_product: it.product_id, p_qty: it.quantity });
  }
}

/** Reduce vendors' pending balance after a cancellation. */
export async function reverseVendorBalances(admin: SupabaseClient, orderId: string) {
  const { data: vos } = await admin.from("vendor_orders").select("store_id, vendor_payout_amount").eq("order_id", orderId);
  for (const vo of vos || []) {
    const { data: bal } = await admin.from("vendor_balances").select("id, pending_balance").eq("store_id", vo.store_id).maybeSingle();
    if (bal) {
      await admin
        .from("vendor_balances")
        .update({
          pending_balance: Math.max(0, Number(bal.pending_balance) - Number(vo.vendor_payout_amount)),
          updated_at: new Date().toISOString(),
        })
        .eq("id", bal.id);
    }
  }
}
