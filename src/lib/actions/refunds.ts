"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { isStripeConfigured } from "@/lib/server/orderHelpers";
import { RefundRequestSchema, type RefundRequestInput } from "@/lib/validations/orders";
import { revalidatePath } from "next/cache";

export async function submitRefundClaim(rawInput: RefundRequestInput) {
  try {
    const input = RefundRequestSchema.parse(rawInput);
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    let customerId = user?.id;

    if (input.customerId) {
      const { data: verified } = await adminSupabase
        .from("profiles")
        .select("id")
        .eq("id", input.customerId)
        .maybeSingle();
      if (verified) customerId = verified.id;
    }
    if (!customerId) customerId = "00000000-0000-0000-0000-000000000001";

    // Verify order ownership
    const { data: orderRow } = await adminSupabase
      .from("orders")
      .select("id, customer_id")
      .eq("id", input.orderId)
      .maybeSingle();
    if (!orderRow) {
      return { success: false, error: "Selected order not found." };
    }
    if (orderRow.customer_id !== customerId) {
      return { success: false, error: "You can only submit claims for your own orders." };
    }

    const claimNumber = `CLM-${Math.floor(100000 + Math.random() * 900000)}`;

    const totalRefundAmount = input.items.reduce((sum, item) => sum + item.amount, 0);

    // 1. Insert refund claim
    const { data: claim, error: claimError } = await adminSupabase
      .from("refund_requests")
      .insert({
        claim_number: claimNumber,
        order_id: input.orderId,
        vendor_order_id: input.vendorOrderId || null,
        customer_id: customerId,
        store_id: input.storeId,
        amount: Math.round(totalRefundAmount * 100) / 100,
        reason: input.reason,
        additional_details: input.additionalDetails,
        image_url: input.imageUrl || null,
        status: "requested",
      })
      .select()
      .single();

    if (claimError || !claim) {
      console.error("Submit refund claim failed:", claimError);
      return { success: false, error: claimError?.message || "Failed to submit refund claim." };
    }

    // 2. Insert individual refund items
    const refundItemsData = input.items.map((item) => ({
      refund_request_id: claim.id,
      order_item_id: item.orderItemId,
      quantity: item.quantity,
      amount: item.amount,
    }));

    await adminSupabase.from("refund_items").insert(refundItemsData);

    // 3. Notify Admin and Vendor
    await adminSupabase.from("notifications").insert([
      {
        user_id: customerId,
        title: `Refund Claim ${claimNumber} Submitted`,
        message: `Your quality guarantee claim for $${totalRefundAmount.toFixed(2)} is currently under review by our operations team.`,
        type: "refund",
        link: `/refunds`,
      },
    ]);

    revalidatePath("/refunds");
    revalidatePath("/admin/refunds");
    revalidatePath("/vendor/refunds");

    return {
      success: true,
      claimId: claim.id,
      claimNumber: claimNumber,
      amount: totalRefundAmount,
    };
  } catch (err: any) {
    console.error("submitRefundClaim exception:", err);
    return { success: false, error: err.message || "Failed to process refund request." };
  }
}

export async function approveRefund(
  claimId: string,
  adminNotes?: string,
  approvedAmount?: number,
  callerId?: string
) {
  try {
    const adminSupabase = createAdminClient();

    // Fetch claim and related order
    const { data: claim, error: fetchError } = await adminSupabase
      .from("refund_requests")
      .select(`
        *,
        orders (
          id,
          total_amount,
          stripe_payment_intent_id
        )
      `)
      .eq("id", claimId)
      .single();

    if (fetchError || !claim) {
      return { success: false, error: "Refund claim not found." };
    }

    if (callerId) {
      const { data: caller } = await adminSupabase
        .from("profiles")
        .select("id, role")
        .eq("id", callerId)
        .maybeSingle();
      if (!caller || (caller.role !== "admin" && caller.role !== "vendor")) {
        return { success: false, error: "Unauthorized to approve refunds." };
      }
      if (caller.role === "vendor") {
        const { data: store } = await adminSupabase
          .from("stores")
          .select("id")
          .eq("id", claim.store_id)
          .eq("vendor_id", callerId)
          .maybeSingle();
        if (!store) return { success: false, error: "Unauthorized for this store's refund." };
      }
    }

    if (["refunded", "rejected"].includes(claim.status)) {
      return { success: false, error: `Claim is already ${claim.status}.` };
    }

    const requestedAmt = Number(claim.amount);
    const finalAmount =
      approvedAmount !== undefined && Number.isFinite(Number(approvedAmount))
        ? Math.round(Number(approvedAmount) * 100) / 100
        : requestedAmt;

    if (finalAmount <= 0 || finalAmount > requestedAmt) {
      return { success: false, error: `Approved amount must be between $0.01 and $${requestedAmt.toFixed(2)}.` };
    }

    let stripeRefundId = `re_test_${Date.now()}`;
    let refundMode: "stripe" | "test_mode" = "test_mode";

    // If Stripe is configured and a real payment intent exists, trigger real Stripe refund
    const paymentIntentId = (claim.orders as any)?.stripe_payment_intent_id;
    if (isStripeConfigured() && paymentIntentId && !paymentIntentId.startsWith("pi_mock_")) {
      try {
        const stripeRefund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: Math.round(finalAmount * 100),
          reason: "requested_by_customer",
        });
        stripeRefundId = stripeRefund.id;
        refundMode = "stripe";
      } catch (stripeErr: any) {
        console.error("Stripe refund trigger error:", stripeErr);
        return { success: false, error: `Stripe refund failed: ${stripeErr.message}` };
      }
    }

    const now = new Date().toISOString();

    // Update claim status to 'refunded'
    const { error: updateErr } = await adminSupabase
      .from("refund_requests")
      .update({
        status: "refunded",
        approved_amount: finalAmount,
        admin_notes: adminNotes?.trim() || null,
        refund_mode: refundMode,
        stripe_refund_id: stripeRefundId,
        updated_at: now,
      })
      .eq("id", claimId);

    if (updateErr) {
      return { success: false, error: updateErr.message };
    }

    // Update parent order payment status
    const orderTotal = Number((claim.orders as any)?.total_amount || 0);
    const nextPaymentStatus = orderTotal > 0 && finalAmount < orderTotal ? "partially_refunded" : "refunded";
    await adminSupabase
      .from("orders")
      .update({
        payment_status: nextPaymentStatus,
        updated_at: now,
      })
      .eq("id", claim.order_id);

    // Adjust vendor balance
    try {
      const { data: vendorBal } = await adminSupabase
        .from("vendor_balances")
        .select("id, pending_balance, available_balance")
        .eq("store_id", claim.store_id)
        .single();

      if (vendorBal) {
        const netDeduction = Math.round(finalAmount * 0.92 * 100) / 100;
        const newPending = Math.max(0, Number(vendorBal.pending_balance) - netDeduction);
        await adminSupabase
          .from("vendor_balances")
          .update({
            pending_balance: newPending,
            updated_at: now,
          })
          .eq("id", vendorBal.id);
      }
    } catch (balErr) {
      console.warn("Could not adjust vendor balance:", balErr);
    }

    // Notify customer
    await adminSupabase.from("notifications").insert({
      user_id: claim.customer_id,
      title: `Refund Approved (${claim.claim_number})`,
      message: `Your refund for $${finalAmount.toFixed(2)} has been approved (${refundMode === "stripe" ? "Stripe refund issued" : "processed in test mode"}).`,
      type: "refund",
      link: `/refunds`,
    });

    if (callerId) {
      await adminSupabase.from("audit_logs").insert({
        user_id: callerId,
        action: "approve_refund",
        entity_type: "refund_request",
        entity_id: claimId,
        details: { approvedAmount: finalAmount, refundMode, adminNotes },
      });
    }

    revalidatePath("/refunds");
    revalidatePath("/admin/refunds");
    revalidatePath("/vendor/refunds");

    return { success: true, stripeRefundId, refundMode, approvedAmount: finalAmount };
  } catch (err: any) {
    console.error("approveRefund exception:", err);
    return { success: false, error: err.message || "Failed to approve refund." };
  }
}

export async function rejectRefund(claimId: string, rejectionReason: string, callerId?: string) {
  try {
    const reason = rejectionReason?.trim();
    if (!reason) {
      return { success: false, error: "A rejection reason is required." };
    }
    const adminSupabase = createAdminClient();

    if (callerId) {
      const { data: caller } = await adminSupabase
        .from("profiles")
        .select("id, role")
        .eq("id", callerId)
        .maybeSingle();
      if (!caller || (caller.role !== "admin" && caller.role !== "vendor")) {
        return { success: false, error: "Unauthorized to reject refunds." };
      }
    }

    const { data: claim, error } = await adminSupabase
      .from("refund_requests")
      .update({
        status: "rejected",
        rejection_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .eq("id", claimId)
      .select()
      .single();

    if (error || !claim) {
      return { success: false, error: error?.message || "Failed to reject claim." };
    }

    // Notify customer
    await adminSupabase.from("notifications").insert({
      user_id: claim.customer_id,
      title: `Refund Request Updated (${claim.claim_number})`,
      message: `Your refund claim was reviewed and could not be approved: ${reason}`,
      type: "refund",
      link: `/refunds`,
    });

    if (callerId) {
      await adminSupabase.from("audit_logs").insert({
        user_id: callerId,
        action: "reject_refund",
        entity_type: "refund_request",
        entity_id: claimId,
        details: { rejectionReason: reason },
      });
    }

    revalidatePath("/refunds");
    revalidatePath("/admin/refunds");
    revalidatePath("/vendor/refunds");

    return { success: true, claim };
  } catch (err: any) {
    console.error("rejectRefund exception:", err);
    return { success: false, error: err.message || "Failed to reject refund." };
  }
}

export async function getRefundRequests(filters?: { storeId?: string; customerId?: string }) {
  const adminSupabase = createAdminClient();

  let query = adminSupabase
    .from("refund_requests")
    .select(`
      *,
      stores (
        name,
        logo
      ),
      orders (
        order_number,
        created_at
      )
    `)
    .order("created_at", { ascending: false });

  if (filters?.storeId) {
    query = query.eq("store_id", filters.storeId);
  }
  if (filters?.customerId) {
    query = query.eq("customer_id", filters.customerId);
  }

  const { data, error } = await query;
  if (error) {
    console.error("getRefundRequests error:", error);
    return [];
  }
  return data;
}
