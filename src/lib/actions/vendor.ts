"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function verifyVendorOwnership(
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
  if (profile.role !== "vendor") {
    return { ok: false, error: "Only vendors or admins can perform this action." };
  }

  const { data: store } = await adminSupabase
    .from("stores")
    .select("id, vendor_id")
    .eq("id", storeId)
    .maybeSingle();

  if (!store || store.vendor_id !== userId) {
    return { ok: false, error: "You do not have permission to modify this store." };
  }
  return { ok: true };
}

export interface StoreSettingsInput {
  name: string;
  description: string;
  address: string;
  phone: string;
  logo: string;
  banner: string;
  is_open: boolean;
  delivery_fee: number;
  min_order: number;
  delivery_time: string;
  opening_time: string;
  closing_time: string;
  delivery_radius: number;
}

export async function updateStoreSettings(
  storeId: string,
  data: Partial<StoreSettingsInput>,
  userId?: string
) {
  try {
    const adminSupabase = createAdminClient();
    const auth = await verifyVendorOwnership(adminSupabase, userId, storeId);
    if (!auth.ok) return { success: false, error: auth.error };

    const { data: updated, error } = await adminSupabase
      .from("stores")
      .update({
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.address !== undefined ? { address: data.address } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.logo !== undefined ? { logo: data.logo } : {}),
        ...(data.banner !== undefined ? { banner: data.banner } : {}),
        ...(data.is_open !== undefined ? { is_open: data.is_open } : {}),
        ...(data.delivery_fee !== undefined ? { delivery_fee: data.delivery_fee } : {}),
        ...(data.min_order !== undefined ? { min_order: data.min_order } : {}),
        ...(data.delivery_time !== undefined ? { delivery_time: data.delivery_time } : {}),
        ...(data.opening_time !== undefined ? { opening_time: data.opening_time } : {}),
        ...(data.closing_time !== undefined ? { closing_time: data.closing_time } : {}),
        ...(data.delivery_radius !== undefined ? { delivery_radius: data.delivery_radius } : {}),
      })
      .eq("id", storeId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/vendor");
    revalidatePath("/vendor/settings");
    revalidatePath("/stores");
    return { success: true, store: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update store settings." };
  }
}

export async function toggleStoreOpen(storeId: string, isOpen: boolean, userId?: string) {
  return updateStoreSettings(storeId, { is_open: isOpen }, userId);
}

export async function replyToReview(
  reviewId: string,
  storeId: string,
  replyText: string,
  userId?: string
) {
  try {
    const trimmed = replyText.trim();
    if (!trimmed) return { success: false, error: "Reply cannot be empty." };

    const adminSupabase = createAdminClient();
    const auth = await verifyVendorOwnership(adminSupabase, userId, storeId);
    if (!auth.ok) return { success: false, error: auth.error };

    const { data: review } = await adminSupabase
      .from("reviews")
      .select("id, product_id, products(store_id)")
      .eq("id", reviewId)
      .maybeSingle();

    if (!review || (review as any).products?.store_id !== storeId) {
      return { success: false, error: "Review does not belong to your store." };
    }

    const { data, error } = await adminSupabase
      .from("reviews")
      .update({
        vendor_reply: trimmed,
        vendor_reply_at: new Date().toISOString(),
      })
      .eq("id", reviewId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/vendor/reviews");
    return { success: true, review: data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to save reply." };
  }
}

export async function markVendorNotificationsRead(userId: string) {
  try {
    const adminSupabase = createAdminClient();
    const { error } = await adminSupabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to mark notifications read." };
  }
}
