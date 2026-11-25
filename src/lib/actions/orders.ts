"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CheckoutOrderSchema, type CheckoutOrderInput } from "@/lib/validations/orders";
import { revalidatePath } from "next/cache";

export interface OrderCreationResult {
  success: boolean;
  orderId?: string;
  orderNumber?: string;
  total?: number;
  subtotal?: number;
  deliveryFee?: number;
  serviceFee?: number;
  vendorOrdersCount?: number;
  error?: string;
}

export async function createMultiVendorOrder(rawInput: CheckoutOrderInput): Promise<OrderCreationResult> {
  try {
    const input = CheckoutOrderSchema.parse(rawInput);
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // 1. Identify customer
    const { data: { user } } = await supabase.auth.getUser();
    let customerId = user?.id;

    // Fallback: If demo/guest mode without auth session, find or create default customer
    if (!customerId) {
      const { data: existingCustomer } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("role", "customer")
        .limit(1)
        .single();

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        // Fallback test customer UUID
        customerId = "00000000-0000-0000-0000-000000000001";
      }
    }

    // 2. Group items by store to establish Multi-Vendor partitions
    const storeMap = new Map<string, { storeName: string; items: typeof input.items; subtotal: number }>();
    let subtotal = 0;

    for (const item of input.items) {
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
    const deliveryFee = Math.round((2.99 + Math.max(0, storeCount - 1) * 1.5) * 100) / 100;
    const serviceFee = Math.round(subtotal * 0.05 * 100) / 100;
    const tipAmount = Math.round((input.tipAmount || 0) * 100) / 100;
    const totalAmount = Math.round((subtotal + deliveryFee + serviceFee + tipAmount) * 100) / 100;

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
        discount_amount: 0,
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
      // 8% platform fee, 92% vendor net payout
      const platformFee = Math.round(storeSubtotal * 0.08 * 100) / 100;
      const vendorPayout = Math.round((storeSubtotal - platformFee) * 100) / 100;

      // Lookup store's vendor_id
      const { data: storeData } = await adminSupabase
        .from("stores")
        .select("id, vendor_id")
        .eq("id", storeId)
        .single();

      const vendorId = storeData?.vendor_id || customerId; // fallback vendor UUID

      // Create vendor sub-order
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
          status: "pending",
        })
        .select()
        .single();

      if (vendorOrderError || !vendorOrder) {
        console.error("Vendor order insertion failed:", vendorOrderError);
        continue;
      }

      // Insert Order Items for this vendor sub-order
      const orderItemsToInsert = group.items.map((item) => ({
        order_id: parentOrderId,
        vendor_order_id: vendorOrder.id,
        product_id: item.id.startsWith("prod-") ? null : item.id, // handle demo UUID vs raw ID
        name: item.name,
        unit: item.unit,
        price: item.price,
        quantity: item.quantity,
        total_price: Math.round(item.price * item.quantity * 100) / 100,
      }));

      await adminSupabase.from("order_items").insert(orderItemsToInsert);

      // Add to Vendor Pending Balance
      try {
        const { data: balanceRecord } = await adminSupabase
          .from("vendor_balances")
          .select("id, pending_balance")
          .eq("store_id", storeData?.id || storeId)
          .single();

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

    revalidatePath("/account/orders");
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

export async function updateVendorOrderStatus(vendorOrderId: string, status: string) {
  const adminSupabase = createAdminClient();

  const { data, error } = await adminSupabase
    .from("vendor_orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", vendorOrderId)
    .select()
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/vendor/orders");
  revalidatePath("/courier");
  revalidatePath("/admin/orders");

  return { success: true, vendorOrder: data };
}
