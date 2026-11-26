"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CheckoutOrderSchema, type CheckoutOrderInput } from "@/lib/validations/orders";
import { validateCouponCode } from "@/lib/server/orderHelpers";
import { revalidatePath } from "next/cache";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface OrderCreationResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  total?: number;
  subtotal?: number;
  deliveryFee?: number;
  serviceFee?: number;
  discountAmount?: number;
  vendorOrdersCount?: number;
  error?: string;
}

export async function createMultiVendorOrder(rawInput: CheckoutOrderInput): Promise<OrderCreationResult> {
  try {
    const input = CheckoutOrderSchema.parse(rawInput);
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Identify and verify customer against profiles table
    let customerId: string = "00000000-0000-0000-0000-000000000001";
    if (input.customerId && UUID_REGEX.test(input.customerId)) {
      customerId = input.customerId;
    } else {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id && UUID_REGEX.test(user.id)) {
        customerId = user.id;
      }
    }

    // 2. Validate stock for real DB products and group items by store
    const storeMap = new Map<string, { storeName: string; items: typeof input.items; subtotal: number }>();
    let subtotal = 0;

    for (const item of input.items) {
      if (UUID_REGEX.test(item.id)) {
        const { data: prod } = await adminSupabase
          .from("products")
          .select("id, name, stock, is_available, price")
          .eq("id", item.id)
          .maybeSingle();

        if (!prod) {
          return { success: false, error: `Product "${item.name}" is no longer available.` };
        }
        if (!prod.is_available || Number(prod.stock) < item.quantity) {
          return {
            success: false,
            error: `Insufficient stock for "${prod.name}". Only ${prod.stock} left.`,
          };
        }
      }

      const itemTotal = item.price * item.quantity;
      subtotal += itemTotal;

      if (!storeMap.has(item.storeId)) {
        storeMap.set(item.storeId, {
          storeName: item.storeName,
          items: [],
          subtotal: 0,
        });
      }
      const group = storeMap.get(item.storeId)!;
      group.items.push(item);
      group.subtotal += itemTotal;
    }

    // Round values
    subtotal = Math.round(subtotal * 100) / 100;
    const storeCount = storeMap.size;
    const deliveryFee =
      input.deliveryFeeOverride !== undefined
        ? Math.round(input.deliveryFeeOverride * 100) / 100
        : Math.round((2.99 + Math.max(0, storeCount - 1) * 1.5) * 100) / 100;
    const serviceFee = Math.round(subtotal * 0.05 * 100) / 100;
    const tipAmount = Math.round((input.tipAmount || 0) * 100) / 100;

    // 2b. Validate coupon code if provided
    let discountAmount = 0;
    let appliedCouponId: string | null = null;
    let appliedCouponCode: string | null = null;
    if (input.couponCode && input.couponCode.trim()) {
      const couponRes = await validateCouponCode(adminSupabase, input.couponCode, subtotal);
      if (!couponRes.ok) {
        return { success: false, error: couponRes.error || "Invalid promo code." };
      }
      discountAmount = couponRes.discount;
      appliedCouponId = couponRes.coupon?.id || null;
      appliedCouponCode = couponRes.coupon?.code || null;
    }

    const totalAmount = Math.max(
      0,
      Math.round((subtotal + deliveryFee + serviceFee + tipAmount - discountAmount) * 100) / 100
    );

    const orderNumber = `FM-${Math.floor(100000 + Math.random() * 900000)}`;

    // 3. Insert Parent Order
    const { data: parentOrder, error: parentOrderError } = await adminSupabase
      .from("orders")
      .insert({
        order_number: orderNumber,
        customer_id: customerId,
        total_amount: totalAmount,
        subtotal: subtotal,
        delivery_fee: deliveryFee,
        service_fee: serviceFee,
        tip_amount: tipAmount,
        discount_amount: discountAmount,
        coupon_code: appliedCouponCode,
        payment_method: input.paymentMethod,
        payment_status: "pending",
        order_status: "pending",
        shipping_address: input.shippingAddress,
        delivery_instructions: input.deliveryInstructions || null,
        delivery_window: input.deliveryWindow,
      })
      .select()
      .single();

    if (parentOrderError || !parentOrder) {
      console.error("Parent order creation error:", parentOrderError);
      return { success: false, error: parentOrderError?.message || "Failed to create order record." };
    }

    const parentOrderId = parentOrder.id;

    // 4. For each participating store, create a Vendor Sub-Order and its Order Items
    for (const [storeId, group] of Array.from(storeMap.entries())) {
      const storeSubtotal = Math.round(group.subtotal * 100) / 100;
      const platformFee = Math.round(storeSubtotal * 0.08 * 100) / 100;
      const vendorPayout = Math.round((storeSubtotal - platformFee) * 100) / 100;

      const { data: storeData } = await adminSupabase
        .from("stores")
        .select("id, vendor_id")
        .eq("id", storeId)
        .maybeSingle();

      const vendorId = storeData?.vendor_id || customerId;

      const { data: vendorOrder, error: vendorOrderError } = await adminSupabase
        .from("vendor_orders")
        .insert({
          order_id: parentOrderId,
          store_id: storeData?.id || storeId,
          vendor_id: vendorId,
          subtotal: storeSubtotal,
          vendor_payout_amount: vendorPayout,
          platform_fee_amount: platformFee,
          commission_rate: 0.08,
          status: input.paymentMethod === "cod" ? "accepted" : "pending",
        })
        .select()
        .single();

      if (vendorOrderError || !vendorOrder) {
        console.error("Vendor order insertion failed:", vendorOrderError);
        continue;
      }

      const orderItemsToInsert = group.items.map((item) => ({
        order_id: parentOrderId,
        vendor_order_id: vendorOrder.id,
        product_id: UUID_REGEX.test(item.id) ? item.id : null,
        name: item.name,
        unit: item.unit,
        price: item.price,
        quantity: item.quantity,
        total_price: Math.round(item.price * item.quantity * 100) / 100,
      }));

      await adminSupabase.from("order_items").insert(orderItemsToInsert);

      // Decrement stock for each real product
      for (const item of group.items) {
        if (UUID_REGEX.test(item.id)) {
          await adminSupabase.rpc("decrement_stock", {
            p_product: item.id,
            p_qty: item.quantity,
          });
        }
      }

      // Add to Vendor Pending Balance
      try {
        const { data: balanceRecord } = await adminSupabase
          .from("vendor_balances")
          .select("id, pending_balance")
          .eq("store_id", storeData?.id || storeId)
          .maybeSingle();

        if (balanceRecord) {
          await adminSupabase
            .from("vendor_balances")
            .update({
              pending_balance: Number(balanceRecord.pending_balance) + vendorPayout,
              updated_at: new Date().toISOString(),
            })
            .eq("id", balanceRecord.id);
        }
      } catch (balErr) {
        console.warn("Could not update vendor balance table:", balErr);
      }

      // Notify vendor
      await adminSupabase.from("notifications").insert({
        user_id: vendorId,
        title: `New Order Received (${orderNumber})`,
        message: `You received an order with ${group.items.length} items totaling $${storeSubtotal.toFixed(2)}.`,
        type: "order",
        link: `/vendor/orders`,
      });
    }

    // Increment coupon used_count
    if (appliedCouponId) {
      const { data: cRow } = await adminSupabase
        .from("coupons")
        .select("used_count")
        .eq("id", appliedCouponId)
        .maybeSingle();
      if (cRow) {
        await adminSupabase
          .from("coupons")
          .update({ used_count: Number(cRow.used_count || 0) + 1 })
          .eq("id", appliedCouponId);
      }
    }

    // Notify customer
    await adminSupabase.from("notifications").insert({
      user_id: customerId,
      title: `Order Placed (${orderNumber})`,
      message: `Your order of $${totalAmount.toFixed(2)} across ${storeMap.size} store(s) has been received.`,
      type: "order",
      link: `/order-success?order_id=${parentOrderId}&orderNumber=${orderNumber}`,
    });

    revalidatePath("/account");
    revalidatePath("/vendor/orders");
    revalidatePath("/admin/orders");

    return {
      success: true,
      orderId: parentOrderId,
      orderNumber: orderNumber,
      total: totalAmount,
      subtotal: subtotal,
      deliveryFee: deliveryFee,
      serviceFee: serviceFee,
      discountAmount: discountAmount,
      vendorOrdersCount: storeMap.size,
    };
  } catch (err: any) {
    console.error("createMultiVendorOrder exception:", err);
    return { success: false, error: err.message || "Failed to process multi-vendor checkout." };
  }
}

export async function getOrderDetails(orderId: string) {
  const adminSupabase = createAdminClient();

  const { data: order, error } = await adminSupabase
    .from("orders")
    .select(`
      *,
      vendor_orders (
        id,
        store_id,
        subtotal,
        vendor_payout_amount,
        platform_fee_amount,
        status,
        tracking_number,
        courier_id,
        stores (
          name,
          logo,
          address,
          phone
        ),
        order_items (
          id,
          name,
          unit,
          price,
          quantity,
          total_price
        )
      )
    `)
    .eq("id", orderId)
    .single();

  if (error) {
    console.error("getOrderDetails error:", error);
    return null;
  }

  return order;
}

export async function updateVendorOrderStatus(
  vendorOrderId: string,
  status: string,
  userId?: string
) {
  try {
    const adminSupabase = createAdminClient();
    const normalizedStatus = status.toLowerCase();
    const validStatuses = [
      "pending",
      "accepted",
      "preparing",
      "ready",
      "dispatched",
      "completed",
      "rejected",
      "cancelled",
    ];
    if (!validStatuses.includes(normalizedStatus)) {
      return { success: false, error: `Invalid order status: ${status}` };
    }

    const { data: existingVo, error: fetchErr } = await adminSupabase
      .from("vendor_orders")
      .select(`
        *,
        stores ( id, vendor_id, name, address ),
        orders ( id, order_number, customer_id, shipping_address, tip_amount )
      `)
      .eq("id", vendorOrderId)
      .single();

    if (fetchErr || !existingVo) {
      return { success: false, error: "Vendor order not found." };
    }

    if (userId) {
      const { data: profile } = await adminSupabase
        .from("profiles")
        .select("id, role")
        .eq("id", userId)
        .maybeSingle();

      if (!profile) return { success: false, error: "Caller profile not found." };
      if (profile.role !== "admin") {
        if (profile.role !== "vendor" || existingVo.stores?.vendor_id !== userId) {
          return { success: false, error: "Unauthorized to update this order." };
        }
      }
    }

    const now = new Date().toISOString();
    const { data, error } = await adminSupabase
      .from("vendor_orders")
      .update({ status: normalizedStatus, updated_at: now })
      .eq("id", vendorOrderId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Propagate status to parent orders table
    const { data: siblingOrders } = await adminSupabase
      .from("vendor_orders")
      .select("status")
      .eq("order_id", existingVo.order_id);

    const statuses = (siblingOrders || []).map((s: any) => s.status);
    let parentOrderStatus: string | null = null;
    if (statuses.length > 0) {
      if (statuses.every((s) => s === "rejected" || s === "cancelled")) {
        parentOrderStatus = "cancelled";
      } else if (statuses.every((s) => s === "completed")) {
        parentOrderStatus = "delivered";
      } else if (statuses.some((s) => s === "dispatched")) {
        parentOrderStatus = "out_for_delivery";
      } else if (statuses.some((s) => s === "ready") && !statuses.some((s) => ["pending", "accepted", "preparing"].includes(s))) {
        parentOrderStatus = "ready_for_pickup";
      } else if (statuses.some((s) => s === "preparing" || s === "accepted")) {
        parentOrderStatus = "preparing";
      }
    }

    if (parentOrderStatus) {
      await adminSupabase
        .from("orders")
        .update({ order_status: parentOrderStatus, updated_at: now })
        .eq("id", existingVo.order_id);
    }

    // Create or update deliveries row when ready for dispatch or dispatched
    if (normalizedStatus === "ready" || normalizedStatus === "dispatched") {
      const { data: existingDelivery } = await adminSupabase
        .from("deliveries")
        .select("id, courier_id")
        .eq("vendor_order_id", vendorOrderId)
        .maybeSingle();

      if (!existingDelivery) {
        const { data: courier } = await adminSupabase
          .from("profiles")
          .select("id")
          .eq("role", "courier")
          .order("is_online", { ascending: false })
          .limit(1)
          .maybeSingle();

        const courierId = courier?.id || "44444444-4444-4444-4444-444444444444";
        const addr = existingVo.orders?.shipping_address || {};
        const dropoff = [addr.address, addr.apartment, addr.city, addr.state, addr.zipCode]
          .filter(Boolean)
          .join(", ") || "Customer Address";

        await adminSupabase.from("deliveries").insert({
          vendor_order_id: vendorOrderId,
          courier_id: courierId,
          status: normalizedStatus === "dispatched" ? "in_transit" : "assigned",
          pickup_address: existingVo.stores?.address || "FreshMart Partner Store",
          dropoff_address: dropoff,
          picked_up_at: normalizedStatus === "dispatched" ? now : null,
          courier_fee: 4.5,
          tip_amount: Number(existingVo.orders?.tip_amount || 0),
        });
      } else if (normalizedStatus === "dispatched") {
        await adminSupabase
          .from("deliveries")
          .update({ status: "in_transit", picked_up_at: now })
          .eq("id", existingDelivery.id);
      }
    }

    // Handle balance / stock on completion or rejection
    if (normalizedStatus === "completed" && existingVo.status !== "completed") {
      const { data: bal } = await adminSupabase
        .from("vendor_balances")
        .select("id, available_balance, pending_balance")
        .eq("store_id", existingVo.store_id)
        .maybeSingle();
      if (bal) {
        const payoutAmt = Number(existingVo.vendor_payout_amount || 0);
        await adminSupabase
          .from("vendor_balances")
          .update({
            pending_balance: Math.max(0, Number(bal.pending_balance) - payoutAmt),
            available_balance: Number(bal.available_balance) + payoutAmt,
            updated_at: now,
          })
          .eq("id", bal.id);
      }
    } else if (normalizedStatus === "rejected" && existingVo.status !== "rejected") {
      const { data: items } = await adminSupabase
        .from("order_items")
        .select("product_id, quantity")
        .eq("vendor_order_id", vendorOrderId);

      for (const it of items || []) {
        if (it.product_id) {
          const { data: prod } = await adminSupabase
            .from("products")
            .select("stock")
            .eq("id", it.product_id)
            .maybeSingle();
          if (prod) {
            await adminSupabase
              .from("products")
              .update({ stock: Number(prod.stock) + Number(it.quantity), updated_at: now })
              .eq("id", it.product_id);
          }
        }
      }

      const { data: bal } = await adminSupabase
        .from("vendor_balances")
        .select("id, pending_balance")
        .eq("store_id", existingVo.store_id)
        .maybeSingle();
      if (bal) {
        await adminSupabase
          .from("vendor_balances")
          .update({
            pending_balance: Math.max(0, Number(bal.pending_balance) - Number(existingVo.vendor_payout_amount || 0)),
            updated_at: now,
          })
          .eq("id", bal.id);
      }
    }

    // Notify customer
    if (existingVo.orders?.customer_id) {
      const statusLabels: Record<string, string> = {
        accepted: "accepted by the store",
        preparing: "being packed by the store",
        ready: "ready for courier pickup",
        dispatched: "out for delivery with a courier",
        completed: "delivered",
        rejected: "rejected by the store",
        cancelled: "cancelled",
      };
      await adminSupabase.from("notifications").insert({
        user_id: existingVo.orders.customer_id,
        title: `Order ${existingVo.orders.order_number} Update`,
        message: `${existingVo.stores?.name || "Your vendor"} marked your items as ${statusLabels[normalizedStatus] || normalizedStatus}.`,
        type: "order",
        link: `/account/orders`,
      });
    }

    revalidatePath("/vendor");
    revalidatePath("/vendor/orders");
    revalidatePath("/courier");
    revalidatePath("/admin/orders");
    revalidatePath("/account/orders");

    return { success: true, vendorOrder: data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update order status." };
  }
}
