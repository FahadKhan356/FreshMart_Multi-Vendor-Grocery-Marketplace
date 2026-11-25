"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { stripe } from "@/lib/stripe";
import { RefundRequestSchema, type RefundRequestInput } from "@/lib/validations/orders";
import { revalidatePath } from "next/cache";

export async function submitRefundClaim(rawInput: RefundRequestInput) {
  try {
    const input = RefundRequestSchema.parse(rawInput);
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    const { data: { user } } = await supabase.auth.getUser();
    const customerId = user?.id || "00000000-0000-0000-0000-000000000001";

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

export async function approveRefund(claimId: string, adminNotes?: string) {
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

    let stripeRefundId = `re_mock_${Date.now()}`;

    // If Stripe is configured and payment intent exists, trigger real Stripe refund
    const paymentIntentId = (claim.orders as any)?.stripe_payment_intent_id;
    if (
      process.env.STRIPE_SECRET_KEY &&
      !process.env.STRIPE_SECRET_KEY.includes("placeholder") &&
      paymentIntentId &&
      !paymentIntentId.startsWith("pi_mock_")
    ) {
      try {
        const stripeRefund = await stripe.refunds.create({
          payment_intent: paymentIntentId,
          amount: Math.round(Number(claim.amount) * 100),
          reason: "requested_by_customer",
        });
        stripeRefundId = stripeRefund.id;
      } catch (stripeErr: any) {
        console.error("Stripe refund trigger error:", stripeErr);
        // Continue processing status update
      }
    }

    // Update claim status to 'refunded'
    await adminSupabase
      .from("refund_requests")
      .update({
        status: "refunded",
        stripe_refund_id: stripeRefundId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", claimId);

    // Update parent order payment status
    await adminSupabase
      .from("orders")
      .update({
        payment_status: "refunded",
        updated_at: new Date().toISOString(),
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
        const netDeduction = Math.round(Number(claim.amount) * 0.92 * 100) / 100;
        const newPending = Math.max(0, Number(vendorBal.pending_balance) - netDeduction);
        await adminSupabase
          .from("vendor_balances")
          .update({
            pending_balance: newPending,
            updated_at: new Date().toISOString(),
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
      message: `Your refund for $${Number(claim.amount).toFixed(2)} has been successfully approved and issued back to your payment card.`,
      type: "refund",
      link: `/refunds`,
    });

    revalidatePath("/refunds");
    revalidatePath("/admin/refunds");
    revalidatePath("/vendor/refunds");

    return { success: true, stripeRefundId };
  } catch (err: any) {
    console.error("approveRefund exception:", err);
    return { success: false, error: err.message || "Failed to approve refund." };
  }
}

export async function rejectRefund(claimId: string, rejectionReason: string) {
  try {
    const adminSupabase = createAdminClient();

    const { data: claim, error } = await adminSupabase
      .from("refund_requests")
      .update({
        status: "rejected",
        rejection_reason: rejectionReason,
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
      message: `Your refund claim was reviewed and could not be approved: ${rejectionReason}`,
      type: "refund",
      link: `/refunds`,
    });

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
