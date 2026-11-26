"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

async function verifyProductStoreAccess(
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

export interface ProductFormData {
  storeId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  unit: string;
  origin?: string;
  stock: number;
  lowStockThreshold?: number;
  isAvailable?: boolean;
  organic?: boolean;
  harvestDate?: string;
  expiryDate?: string;
  batchNumber?: string;
  image: string;
}

export async function createProduct(data: ProductFormData, userId?: string) {
  try {
    const adminSupabase = createAdminClient();
    const auth = await verifyProductStoreAccess(adminSupabase, userId, data.storeId);
    if (!auth.ok) return { success: false, error: auth.error };

    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const { data: product, error } = await adminSupabase
      .from("products")
      .insert({
        store_id: data.storeId,
        category_id: data.categoryId,
        name: data.name,
        slug: `${slug}-${Date.now()}`,
        description: data.description || "",
        price: data.price,
        original_price: data.originalPrice || null,
        unit: data.unit,
        origin: data.origin || "Local Farm",
        stock: data.stock,
        low_stock_threshold: data.lowStockThreshold ?? 15,
        is_available: data.isAvailable !== undefined ? data.isAvailable : true,
        organic: data.organic !== undefined ? data.organic : false,
        harvest_date: data.harvestDate || null,
        expiry_date: data.expiryDate || null,
        batch_number: data.batchNumber || `LOT-${Date.now().toString().slice(-6)}`,
        image: data.image,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/vendor/products");
    revalidatePath("/vendor/inventory");
    revalidatePath("/vendor/expiry");
    revalidatePath("/categories");

    return { success: true, product };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create product." };
  }
}

export async function updateProduct(
  productId: string,
  data: Partial<ProductFormData>,
  userId?: string
) {
  try {
    const adminSupabase = createAdminClient();
    const { data: existing } = await adminSupabase
      .from("products")
      .select("id, store_id")
      .eq("id", productId)
      .maybeSingle();

    if (!existing) return { success: false, error: "Product not found." };
    const auth = await verifyProductStoreAccess(adminSupabase, userId, existing.store_id);
    if (!auth.ok) return { success: false, error: auth.error };

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) updates.name = data.name;
    if (data.categoryId !== undefined) updates.category_id = data.categoryId;
    if (data.description !== undefined) updates.description = data.description;
    if (data.price !== undefined) updates.price = data.price;
    if (data.originalPrice !== undefined) updates.original_price = data.originalPrice || null;
    if (data.unit !== undefined) updates.unit = data.unit;
    if (data.origin !== undefined) updates.origin = data.origin;
    if (data.stock !== undefined) updates.stock = Math.max(0, data.stock);
    if (data.lowStockThreshold !== undefined) updates.low_stock_threshold = Math.max(0, data.lowStockThreshold);
    if (data.isAvailable !== undefined) updates.is_available = data.isAvailable;
    if (data.organic !== undefined) updates.organic = data.organic;
    if (data.harvestDate !== undefined) updates.harvest_date = data.harvestDate || null;
    if (data.expiryDate !== undefined) updates.expiry_date = data.expiryDate || null;
    if (data.batchNumber !== undefined) updates.batch_number = data.batchNumber || null;
    if (data.image !== undefined) updates.image = data.image;

    const { data: product, error } = await adminSupabase
      .from("products")
      .update(updates)
      .eq("id", productId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/vendor/products");
    revalidatePath("/vendor/inventory");
    revalidatePath("/vendor/expiry");
    revalidatePath("/categories");

    return { success: true, product };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update product." };
  }
}

export async function deleteProduct(productId: string, storeId: string, userId?: string) {
  try {
    const adminSupabase = createAdminClient();
    const auth = await verifyProductStoreAccess(adminSupabase, userId, storeId);
    if (!auth.ok) return { success: false, error: auth.error };

    const { error } = await adminSupabase
      .from("products")
      .delete()
      .eq("id", productId)
      .eq("store_id", storeId);

    if (error) {
      // If referenced by order_items, archive it instead of failing hard
      if (error.code === "23503") {
        const { error: archiveErr } = await adminSupabase
          .from("products")
          .update({ is_available: false, stock: 0, updated_at: new Date().toISOString() })
          .eq("id", productId)
          .eq("store_id", storeId);
        if (archiveErr) return { success: false, error: archiveErr.message };
        revalidatePath("/vendor/products");
        revalidatePath("/vendor/inventory");
        return { success: true, archived: true };
      }
      return { success: false, error: error.message };
    }

    revalidatePath("/vendor/products");
    revalidatePath("/vendor/inventory");
    revalidatePath("/vendor/expiry");
    return { success: true, archived: false };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to delete product." };
  }
}

export async function updateProductStock(
  productId: string,
  stock: number,
  isAvailable?: boolean,
  lowStockThreshold?: number,
  userId?: string
) {
  try {
    const adminSupabase = createAdminClient();
    const { data: existing } = await adminSupabase
      .from("products")
      .select("id, store_id")
      .eq("id", productId)
      .maybeSingle();

    if (!existing) return { success: false, error: "Product not found." };
    const auth = await verifyProductStoreAccess(adminSupabase, userId, existing.store_id);
    if (!auth.ok) return { success: false, error: auth.error };

    const updates: Record<string, any> = {
      stock: Math.max(0, stock),
      updated_at: new Date().toISOString(),
    };
    if (isAvailable !== undefined) {
      updates.is_available = isAvailable;
    }
    if (lowStockThreshold !== undefined) {
      updates.low_stock_threshold = Math.max(0, lowStockThreshold);
    }

    const { data, error } = await adminSupabase
      .from("products")
      .update(updates)
      .eq("id", productId)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/vendor/inventory");
    revalidatePath("/vendor/products");

    return { success: true, product: data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update product stock." };
  }
}

export async function toggleProductFlashDiscount(
  productId: string,
  discountPercent: number,
  userId?: string
) {
  try {
    const adminSupabase = createAdminClient();

    const { data: prod } = await adminSupabase
      .from("products")
      .select("store_id, price, original_price")
      .eq("id", productId)
      .single();

    if (!prod) {
      return { success: false, error: "Product not found" };
    }
    const auth = await verifyProductStoreAccess(adminSupabase, userId, prod.store_id);
    if (!auth.ok) return { success: false, error: auth.error };

    const basePrice = Number(prod.original_price || prod.price);
    const pct = Math.max(0, Math.min(90, Math.round(discountPercent)));
    const discountedPrice =
      pct > 0 ? Math.round(basePrice * (1 - pct / 100) * 100) / 100 : basePrice;

    const { data, error } = await adminSupabase
      .from("products")
      .update({
        original_price: pct > 0 ? basePrice : null,
        price: discountedPrice,
        markdown_percent: pct,
        discount_badge: pct > 0 ? `-${pct}% Near Expiry` : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/vendor/products");
    revalidatePath("/vendor/inventory");
    revalidatePath("/vendor/expiry");

    return { success: true, product: data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to apply discount." };
  }
}

export async function updateProductBatchExpiry(
  productId: string,
  data: { batchNumber?: string; harvestDate?: string; expiryDate?: string },
  userId?: string
) {
  try {
    const adminSupabase = createAdminClient();
    const { data: prod } = await adminSupabase
      .from("products")
      .select("store_id")
      .eq("id", productId)
      .maybeSingle();

    if (!prod) return { success: false, error: "Product not found." };
    const auth = await verifyProductStoreAccess(adminSupabase, userId, prod.store_id);
    if (!auth.ok) return { success: false, error: auth.error };

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (data.batchNumber !== undefined) updates.batch_number = data.batchNumber;
    if (data.harvestDate !== undefined) updates.harvest_date = data.harvestDate;
    if (data.expiryDate !== undefined) updates.expiry_date = data.expiryDate;

    const { data: updated, error } = await adminSupabase
      .from("products")
      .update(updates)
      .eq("id", productId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    revalidatePath("/vendor/expiry");
    return { success: true, product: updated };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to update batch info." };
  }
}
