"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { validateCouponCode } from "@/lib/server/orderHelpers";
import { revalidatePath } from "next/cache";

async function verifyProfile(userId: string) {
  if (!userId) return null;
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, full_name, role")
    .eq("id", userId)
    .maybeSingle();
  return data;
}

export async function validateCouponAction(code: string, subtotal: number) {
  const admin = createAdminClient();
  return validateCouponCode(admin, code, subtotal);
}

export async function toggleWishlistAction(userId: string, productId: string) {
  const profile = await verifyProfile(userId);
  if (!profile) return { success: false, error: "Invalid user profile." };

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("wishlists")
    .select("id")
    .eq("user_id", userId)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await admin.from("wishlists").delete().eq("id", existing.id);
    if (error) return { success: false, error: error.message };
    revalidatePath("/account");
    return { success: true, wishlisted: false };
  }

  const { error } = await admin.from("wishlists").insert({
    user_id: userId,
    product_id: productId,
  });
  if (error) return { success: false, error: error.message };
  revalidatePath("/account");
  return { success: true, wishlisted: true };
}

export async function submitProductReviewAction(input: {
  userId: string;
  productId: string;
  rating: number;
  comment: string;
}) {
  const profile = await verifyProfile(input.userId);
  if (!profile) return { success: false, error: "Please sign in to submit a review." };
  if (input.rating < 1 || input.rating > 5) {
    return { success: false, error: "Rating must be between 1 and 5." };
  }
  if (!input.comment || input.comment.trim().length < 5) {
    return { success: false, error: "Please write at least 5 characters for your review." };
  }

  const admin = createAdminClient();
  const { data: review, error } = await admin
    .from("reviews")
    .insert({
      user_id: input.userId,
      product_id: input.productId,
      reviewer_name: profile.full_name || "FreshMart Customer",
      rating: input.rating,
      comment: input.comment.trim(),
    })
    .select()
    .single();

  if (error) return { success: false, error: error.message };

  // Recompute product rating & reviews_count
  const { data: allReviews } = await admin
    .from("reviews")
    .select("rating")
    .eq("product_id", input.productId);

  if (allReviews && allReviews.length > 0) {
    const avg = allReviews.reduce((s, r) => s + Number(r.rating), 0) / allReviews.length;
    await admin
      .from("products")
      .update({
        rating: Math.round(avg * 10) / 10,
        reviews_count: allReviews.length,
      })
      .eq("id", input.productId);
  }

  revalidatePath(`/product/${input.productId}`);
  revalidatePath("/account");
  return { success: true, review };
}

export async function deleteReviewAction(userId: string, reviewId: string) {
  const profile = await verifyProfile(userId);
  if (!profile) return { success: false, error: "Unauthorized." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("reviews")
    .delete()
    .eq("id", reviewId)
    .eq("user_id", userId);

  if (error) return { success: false, error: error.message };
  revalidatePath("/account");
  return { success: true };
}

export async function saveAddressAction(input: {
  id?: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  state: string;
  zipCode: string;
  instructions?: string;
  isDefault?: boolean;
}) {
  const profile = await verifyProfile(input.userId);
  if (!profile) return { success: false, error: "Invalid user profile." };

  const admin = createAdminClient();
  if (input.isDefault) {
    await admin
      .from("addresses")
      .update({ is_default: false })
      .eq("user_id", input.userId);
  }

  const payload = {
    user_id: input.userId,
    label: input.label.trim() || "Home",
    full_name: input.fullName.trim(),
    phone: input.phone.trim(),
    address: input.address.trim(),
    apartment: input.apartment?.trim() || null,
    city: input.city.trim(),
    state: input.state.trim(),
    zip_code: input.zipCode.trim(),
    instructions: input.instructions?.trim() || null,
    is_default: Boolean(input.isDefault),
  };

  if (input.id) {
    const { data, error } = await admin
      .from("addresses")
      .update(payload)
      .eq("id", input.id)
      .eq("user_id", input.userId)
      .select()
      .single();
    if (error) return { success: false, error: error.message };
    revalidatePath("/account");
    revalidatePath("/checkout");
    return { success: true, address: data };
  }

  const { data, error } = await admin
    .from("addresses")
    .insert(payload)
    .select()
    .single();
  if (error) return { success: false, error: error.message };
  revalidatePath("/account");
  revalidatePath("/checkout");
  return { success: true, address: data };
}

export async function deleteAddressAction(userId: string, addressId: string) {
  const profile = await verifyProfile(userId);
  if (!profile) return { success: false, error: "Unauthorized." };

  const admin = createAdminClient();
  const { error } = await admin
    .from("addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", userId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/account");
  return { success: true };
}

export async function setDefaultAddressAction(userId: string, addressId: string) {
  const profile = await verifyProfile(userId);
  if (!profile) return { success: false, error: "Unauthorized." };

  const admin = createAdminClient();
  await admin.from("addresses").update({ is_default: false }).eq("user_id", userId);
  const { error } = await admin
    .from("addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("user_id", userId);
  if (error) return { success: false, error: error.message };
  revalidatePath("/account");
  return { success: true };
}

export async function markNotificationReadAction(userId: string, notificationId?: string) {
  const profile = await verifyProfile(userId);
  if (!profile) return { success: false, error: "Unauthorized." };

  const admin = createAdminClient();
  let query = admin.from("notifications").update({ is_read: true }).eq("user_id", userId);
  if (notificationId) {
    query = query.eq("id", notificationId);
  }
  const { error } = await query;
  if (error) return { success: false, error: error.message };
  revalidatePath("/account");
  return { success: true };
}
