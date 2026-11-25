"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface ProductFormData {
  storeId: string;
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  originalPrice?: number;
  unit: string;
  stock: number;
  lowStockThreshold?: number;
  isAvailable?: boolean;
  organic?: boolean;
  image: string;
}

export async function createProduct(data: ProductFormData) {
  try {
    const adminSupabase = createAdminClient();
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
        stock: data.stock,
        low_stock_threshold: data.lowStockThreshold || 15,
        is_available: data.isAvailable !== undefined ? data.isAvailable : true,
        organic: data.organic !== undefined ? data.organic : false,
        image: data.image,
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    revalidatePath("/vendor/products");
    revalidatePath("/vendor/inventory");
    revalidatePath("/categories");

    return { success: true, product };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to create product." };
  }
}

export async function updateProductStock(productId: string, stock: number, isAvailable?: boolean) {
  try {
    const adminSupabase = createAdminClient();

    const updates: any = {
      stock,
      updated_at: new Date().toISOString(),
    };
    if (isAvailable !== undefined) {
      updates.is_available = isAvailable;
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

export async function toggleProductFlashDiscount(productId: string, discountPercent: number) {
  try {
    const adminSupabase = createAdminClient();

    const { data: prod } = await adminSupabase
      .from("products")
      .select("price, original_price")
      .eq("id", productId)
      .single();

    if (!prod) {
      return { success: false, error: "Product not found" };
    }

    const originalPrice = prod.original_price || prod.price;
    const discountedPrice = Math.round(originalPrice * (1 - discountPercent / 100) * 100) / 100;

    const { data, error } = await adminSupabase
      .from("products")
      .update({
        original_price: originalPrice,
        price: discountedPrice,
        discount_badge: discountPercent > 0 ? `-${discountPercent}% Near Expiry` : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", productId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };

    revalidatePath("/vendor/products");
    revalidatePath("/vendor/inventory");

    return { success: true, product: data };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to apply discount." };
  }
}
