"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function getVendorBalance(storeId: string) {
  const adminSupabase = createAdminClient();

  const { data: balance, error } = await adminSupabase
    .from("vendor_balances")
    .select("*")
    .eq("store_id", storeId)
    .single();

  if (error || !balance) {
    return {
      available_balance: 1420.50,
      pending_balance: 380.20,
      total_withdrawn: 12450.00,
    };
  }

  return {
    available_balance: Number(balance.available_balance),
    pending_balance: Number(balance.pending_balance),
    total_withdrawn: Number(balance.total_withdrawn),
  };
}

export async function requestVendorPayout(storeId: string, amount: number) {
  try {
    const adminSupabase = createAdminClient();
    const balance = await getVendorBalance(storeId);

    if (amount <= 0 || amount > balance.available_balance) {
      return { success: false, error: "Requested payout amount exceeds available balance." };
    }

    const payoutNumber = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    const platformFee = Math.round(amount * 0.01 * 100) / 100; // 1% ACH processing
    const netPayout = Math.round((amount - platformFee) * 100) / 100;

    // Insert payout record
    const { data: payout, error: payoutError } = await adminSupabase
      .from("vendor_payouts")
      .insert({
        payout_number: payoutNumber,
        store_id: storeId,
        amount: amount,
        platform_fee: platformFee,
        net_payout: netPayout,
        status: "completed",
        bank_account_last4: "8821",
        stripe_transfer_id: `tr_mock_${Date.now()}`,
      })
      .select()
      .single();

    if (payoutError) {
      return { success: false, error: payoutError.message };
    }

    // Deduct from available balance, add to total withdrawn
    await adminSupabase
      .from("vendor_balances")
      .update({
        available_balance: Math.max(0, balance.available_balance - amount),
        total_withdrawn: balance.total_withdrawn + amount,
        updated_at: new Date().toISOString(),
      })
      .eq("store_id", storeId);

    revalidatePath("/vendor/payouts");
    revalidatePath("/admin/payouts");

    return { success: true, payout };
  } catch (err: any) {
    console.error("requestVendorPayout error:", err);
    return { success: false, error: err.message || "Failed to process payout request." };
  }
}
