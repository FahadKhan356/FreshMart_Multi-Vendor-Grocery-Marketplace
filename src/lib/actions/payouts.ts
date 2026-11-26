"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function verifyPayoutStoreAccess(
  adminSupabase: ReturnType<typeof createAdminClient>,
  userId: string | undefined,
  storeId: string
): Promise<{ ok: boolean; error?: string }> {
  if (!userId) return { ok: true };
  const { data: profile } = await adminSupabase
    .from("profiles")
    .select("id, role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile) return { ok: false, error: "Caller profile not found." };
  if (profile.role === "admin") return { ok: true };
  if (profile.role !== "vendor") return { ok: false, error: "Vendor access required." };

  const { data: store } = await adminSupabase
    .from("stores")
    .select("id, vendor_id")
    .eq("id", storeId)
    .maybeSingle();

  if (!store || store.vendor_id !== userId) {
    return { ok: false, error: "Unauthorized for this store." };
  }
  return { ok: true };
}

export async function getVendorBalance(storeId: string) {
  const adminSupabase = createAdminClient();

  const { data: balance, error } = await adminSupabase
    .from("vendor_balances")
    .select("*")
    .eq("store_id", storeId)
    .maybeSingle();

  if (error || !balance) {
    return {
      available_balance: 0,
      pending_balance: 0,
      total_withdrawn: 0,
    };
  }

  return {
    available_balance: Number(balance.available_balance),
    pending_balance: Number(balance.pending_balance),
    total_withdrawn: Number(balance.total_withdrawn),
  };
}

export async function requestVendorPayout(storeId: string, amount: number, userId?: string) {
  try {
    const adminSupabase = createAdminClient();
    const auth = await verifyPayoutStoreAccess(adminSupabase, userId, storeId);
    if (!auth.ok) return { success: false, error: auth.error };

    const balance = await getVendorBalance(storeId);
    const cleanAmount = Math.round(Number(amount) * 100) / 100;

    if (!Number.isFinite(cleanAmount) || cleanAmount <= 0 || cleanAmount > balance.available_balance) {
      return { success: false, error: "Requested payout amount must be positive and within available balance." };
    }

    const { data: storeRow } = await adminSupabase
      .from("stores")
      .select("bank_account_last4, vendor_id, name")
      .eq("id", storeId)
      .maybeSingle();

    const payoutNumber = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
    const platformFee = Math.round(cleanAmount * 0.01 * 100) / 100; // 1% ACH instant transfer fee
    const netPayout = Math.round((cleanAmount - platformFee) * 100) / 100;
    const now = new Date().toISOString();

    // Insert payout record
    const { data: payout, error: payoutError } = await adminSupabase
      .from("vendor_payouts")
      .insert({
        payout_number: payoutNumber,
        store_id: storeId,
        amount: cleanAmount,
        platform_fee: platformFee,
        net_payout: netPayout,
        status: "completed",
        bank_account_last4: storeRow?.bank_account_last4 || "8821",
        stripe_transfer_id: `tr_ach_${Date.now()}`,
        period_start: now,
        period_end: now,
        paid_at: now,
      })
      .select()
      .single();

    if (payoutError) {
      return { success: false, error: payoutError.message };
    }

    // Deduct from available balance, add to total withdrawn
    const newAvailable = Math.round(Math.max(0, balance.available_balance - cleanAmount) * 100) / 100;
    const newWithdrawn = Math.round((balance.total_withdrawn + cleanAmount) * 100) / 100;

    await adminSupabase
      .from("vendor_balances")
      .update({
        available_balance: newAvailable,
        total_withdrawn: newWithdrawn,
        updated_at: now,
      })
      .eq("store_id", storeId);

    if (storeRow?.vendor_id) {
      await adminSupabase.from("notifications").insert({
        user_id: storeRow.vendor_id,
        title: `Payout Initiated (${payoutNumber})`,
        message: `Net transfer of $${netPayout.toFixed(2)} sent to account ending in ${storeRow.bank_account_last4 || "8821"}.`,
        type: "payout",
        link: "/vendor/payouts",
      });
    }

    revalidatePath("/vendor/payouts");
    revalidatePath("/vendor");
    revalidatePath("/admin/payouts");

    return { success: true, payout };
  } catch (err: any) {
    console.error("requestVendorPayout error:", err);
    return { success: false, error: err.message || "Failed to process payout request." };
  }
}

export async function updateVendorBankSettings(
  storeId: string,
  data: {
    bank_name: string;
    bank_account_last4: string;
    bank_routing: string;
    bank_account_holder: string;
  },
  userId?: string
) {
  try {
    const adminSupabase = createAdminClient();
    const auth = await verifyPayoutStoreAccess(adminSupabase, userId, storeId);
    if (!auth.ok) return { success: false, error: auth.error };

    const last4 = data.bank_account_last4.replace(/\D/g, "").slice(-4);
    const routing = data.bank_routing.replace(/\D/g, "").slice(0, 9);
    if (last4.length !== 4) {
      return { success: false, error: "Please enter the last 4 digits of your bank account." };
    }
    if (routing.length !== 9) {
      return { success: false, error: "Routing number must be 9 digits." };
    }

    const { data: updated, error } = await adminSupabase
      .from("stores")
      .update({
        bank_name: data.bank_name.trim(),
        bank_account_last4: last4,
        bank_routing: routing,
        bank_account_holder: data.bank_account_holder.trim(),
      })
      .eq("id", storeId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/vendor/payouts");
    return { success: true, store: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update bank settings." };
  }
}

async function verifyAdminCaller(adminId: string) {
  if (!adminId) throw new Error("Not signed in as admin.");
  const db = createAdminClient();
  const { data } = await db.from("profiles").select("id, role, status").eq("id", adminId).maybeSingle();
  if (!data || data.role !== "admin") throw new Error("Admin privileges required.");
  if (data.status === "suspended") throw new Error("Admin account is suspended.");
  return db;
}

export async function approveVendorPayout(adminId: string, payoutId: string) {
  try {
    const db = await verifyAdminCaller(adminId);
    const { data: payout, error: fetchErr } = await db
      .from("vendor_payouts")
      .select("*, stores(name, vendor_id)")
      .eq("id", payoutId)
      .single();

    if (fetchErr || !payout) return { success: false, error: "Payout not found." };
    if (payout.status !== "pending") {
      return { success: false, error: `Payout is already ${payout.status}.` };
    }

    const { error } = await db
      .from("vendor_payouts")
      .update({ status: "processing" })
      .eq("id", payoutId);
    if (error) return { success: false, error: error.message };

    if ((payout as any).stores?.vendor_id) {
      await db.from("notifications").insert({
        user_id: (payout as any).stores.vendor_id,
        title: `Payout ${payout.payout_number} Approved`,
        message: `Your payout of $${Number(payout.net_payout).toFixed(2)} is now processing for ACH transfer.`,
        type: "payout",
        link: "/vendor/payouts",
      });
    }

    await db.from("audit_logs").insert({
      user_id: adminId,
      action: "approve_payout",
      entity_type: "vendor_payout",
      entity_id: payoutId,
    });

    revalidatePath("/admin/payouts");
    revalidatePath("/vendor/payouts");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to approve payout." };
  }
}

export async function markPayoutPaid(adminId: string, payoutId: string, transferRef?: string) {
  try {
    const db = await verifyAdminCaller(adminId);
    const { data: payout, error: fetchErr } = await db
      .from("vendor_payouts")
      .select("*, stores(name, vendor_id)")
      .eq("id", payoutId)
      .single();

    if (fetchErr || !payout) return { success: false, error: "Payout not found." };
    if (payout.status === "completed") return { success: false, error: "Payout is already marked paid." };
    if (payout.status === "failed") return { success: false, error: "Failed payout cannot be marked paid." };

    const now = new Date().toISOString();
    const ref = transferRef?.trim() || payout.stripe_transfer_id || `tr_ach_${Date.now()}`;

    const { error } = await db
      .from("vendor_payouts")
      .update({
        status: "completed",
        paid_at: now,
        stripe_transfer_id: ref,
      })
      .eq("id", payoutId);
    if (error) return { success: false, error: error.message };

    // If payout was pending and balance wasn't deducted yet, ensure vendor_balances reflects it
    if (payout.status === "pending") {
      const { data: bal } = await db
        .from("vendor_balances")
        .select("id, available_balance, total_withdrawn")
        .eq("store_id", payout.store_id)
        .maybeSingle();
      if (bal) {
        const amt = Number(payout.amount);
        await db
          .from("vendor_balances")
          .update({
            available_balance: Math.max(0, Number(bal.available_balance) - amt),
            total_withdrawn: Number(bal.total_withdrawn) + amt,
            updated_at: now,
          })
          .eq("id", bal.id);
      }
    }

    if ((payout as any).stores?.vendor_id) {
      await db.from("notifications").insert({
        user_id: (payout as any).stores.vendor_id,
        title: `Payout ${payout.payout_number} Paid`,
        message: `$${Number(payout.net_payout).toFixed(2)} has been dispatched to your bank (Ref: ${ref}).`,
        type: "payout",
        link: "/vendor/payouts",
      });
    }

    await db.from("audit_logs").insert({
      user_id: adminId,
      action: "mark_payout_paid",
      entity_type: "vendor_payout",
      entity_id: payoutId,
      details: { transferRef: ref },
    });

    revalidatePath("/admin/payouts");
    revalidatePath("/vendor/payouts");
    return { success: true, transferRef: ref };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to mark payout paid." };
  }
}

export async function rejectVendorPayout(adminId: string, payoutId: string, reason: string) {
  try {
    const db = await verifyAdminCaller(adminId);
    if (!reason?.trim()) return { success: false, error: "A rejection reason is required." };
    const { data: payout, error: fetchErr } = await db
      .from("vendor_payouts")
      .select("*, stores(name, vendor_id)")
      .eq("id", payoutId)
      .single();

    if (fetchErr || !payout) return { success: false, error: "Payout not found." };
    if (payout.status === "completed") return { success: false, error: "Completed payout cannot be rejected." };

    const { error } = await db.from("vendor_payouts").update({ status: "failed" }).eq("id", payoutId);
    if (error) return { success: false, error: error.message };

    if ((payout as any).stores?.vendor_id) {
      await db.from("notifications").insert({
        user_id: (payout as any).stores.vendor_id,
        title: `Payout ${payout.payout_number} Declined`,
        message: `Your payout request could not be processed: ${reason.trim()}`,
        type: "payout",
        link: "/vendor/payouts",
      });
    }

    await db.from("audit_logs").insert({
      user_id: adminId,
      action: "reject_payout",
      entity_type: "vendor_payout",
      entity_id: payoutId,
      details: { reason: reason.trim() },
    });

    revalidatePath("/admin/payouts");
    revalidatePath("/vendor/payouts");
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to decline payout." };
  }
}

export async function executeBatchStorePayout(adminId: string, storeIds?: string[]) {
  try {
    const db = await verifyAdminCaller(adminId);
    const { data: setting } = await db
      .from("platform_settings")
      .select("value")
      .eq("key", "payout_fee_pct")
      .maybeSingle();
    const feePct = Number(setting?.value || 1) / 100;

    let balQuery = db
      .from("vendor_balances")
      .select("id, store_id, available_balance, total_withdrawn, stores(name, vendor_id)")
      .gt("available_balance", 0);
    if (storeIds?.length) balQuery = balQuery.in("store_id", storeIds);

    const { data: balances, error } = await balQuery;
    if (error) return { success: false, error: error.message };
    if (!balances || balances.length === 0) {
      return { success: false, error: "No stores have a positive available balance." };
    }

    const now = new Date().toISOString();
    let count = 0;

    for (const b of balances) {
      const amount = Math.round(Number(b.available_balance) * 100) / 100;
      if (amount <= 0) continue;
      const fee = Math.round(amount * feePct * 100) / 100;
      const net = Math.round((amount - fee) * 100) / 100;
      const payoutNumber = `PAY-${Math.floor(100000 + Math.random() * 900000)}`;
      const transferId = `tr_ach_${Date.now()}_${count}`;

      const { error: insErr } = await db.from("vendor_payouts").insert({
        payout_number: payoutNumber,
        store_id: b.store_id,
        amount,
        platform_fee: fee,
        net_payout: net,
        status: "completed",
        bank_account_last4: "8821",
        stripe_transfer_id: transferId,
        paid_at: now,
      });
      if (insErr) continue;

      await db
        .from("vendor_balances")
        .update({
          available_balance: 0,
          total_withdrawn: Number(b.total_withdrawn) + amount,
          updated_at: now,
        })
        .eq("id", b.id);

      if ((b as any).stores?.vendor_id) {
        await db.from("notifications").insert({
          user_id: (b as any).stores.vendor_id,
          title: `Batch Payout ${payoutNumber} Sent`,
          message: `$${net.toFixed(2)} has been settled to your bank account.`,
          type: "payout",
          link: "/vendor/payouts",
        });
      }
      count++;
    }

    await db.from("audit_logs").insert({
      user_id: adminId,
      action: "batch_payout",
      entity_type: "vendor_payout",
      entity_id: "batch",
      details: { count },
    });

    revalidatePath("/admin/payouts");
    revalidatePath("/vendor/payouts");
    return { success: true, count };
  } catch (err: any) {
    return { success: false, error: err.message || "Batch payout failed." };
  }
}
