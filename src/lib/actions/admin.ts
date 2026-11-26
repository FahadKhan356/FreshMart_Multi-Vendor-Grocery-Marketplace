"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

type Res<T = any> = { success: boolean; error?: string; data?: T };

const ok = <T,>(data?: T): Res<T> => ({ success: true, data });
const fail = (e: any): Res => ({ success: false, error: typeof e === "string" ? e : e?.message || "Operation failed" });

async function assertAdmin(adminId?: string) {
  if (!adminId) throw new Error("Not signed in as admin.");
  const db = createAdminClient();
  const { data } = await db.from("profiles").select("id, role, status").eq("id", adminId).maybeSingle();
  if (!data || data.role !== "admin") throw new Error("Admin privileges required.");
  if (data.status === "suspended") throw new Error("Your admin account is suspended.");
  return db;
}

async function audit(db: any, adminId: string, action: string, entity: string, entityId: string, details?: any) {
  try {
    await db.from("audit_logs").insert({ user_id: adminId, action, entity_type: entity, entity_id: entityId, details: details || null });
  } catch {}
}

async function notify(db: any, userId: string | null | undefined, title: string, message: string, type: string, link?: string) {
  if (!userId) return;
  try {
    await db.from("notifications").insert({ user_id: userId, title, message, type, metadata: link ? { link } : null });
  } catch {}
}

const money = (n: any) => Math.round(Number(n || 0) * 100) / 100;

// ------------------------------------------------------------------ counts
export async function getAdminCounts(adminId: string) {
  try {
    const db = await assertAdmin(adminId);
    const head = { count: "exact" as const, head: true };
    const [v, r, p, t, po] = await Promise.all([
      db.from("stores").select("id", head).eq("status", "pending_review"),
      db.from("refund_requests").select("id", head).in("status", ["requested", "under_review"]),
      db.from("products").select("id", head).eq("approval_status", "pending"),
      db.from("support_tickets").select("id", head).eq("status", "open"),
      db.from("vendor_payouts").select("id", head).in("status", ["pending", "processing"]),
    ]);
    return ok({
      pendingVendors: v.count || 0,
      newRefunds: r.count || 0,
      pendingProducts: p.count || 0,
      openTickets: t.count || 0,
      pendingPayouts: po.count || 0,
    });
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------- overview
export async function getAdminOverview(adminId: string) {
  try {
    const db = await assertAdmin(adminId);
    const head = { count: "exact" as const, head: true };
    const [orders, vos, customers, vendors, pendingStores, couriers, refunds, storesList, pendingProducts, claimCount] = await Promise.all([
      db.from("orders").select("id,total_amount,payment_status,order_status,created_at,order_number").order("created_at", { ascending: false }),
      db.from("vendor_orders").select("order_id,store_id,subtotal,platform_fee_amount,status"),
      db.from("profiles").select("id", head).eq("role", "customer"),
      db.from("stores").select("id", head).eq("status", "approved"),
      db.from("stores").select("id", head).eq("status", "pending_review"),
      db.from("profiles").select("id,status").eq("role", "courier"),
      db.from("refund_requests").select("id", head).in("status", ["requested", "under_review"]),
      db.from("stores").select("id,name,status,created_at,tags").order("created_at", { ascending: false }).limit(6),
      db.from("products").select("id", head).eq("approval_status", "pending"),
      db.from("refund_requests").select("id", head),
    ]);
    const all = orders.data || [];
    const live = all.filter((o: any) => o.order_status !== "cancelled");
    const revenue = money(all.filter((o: any) => ["paid", "partially_refunded"].includes(o.payment_status)).reduce((s: number, o: any) => s + Number(o.total_amount), 0));
    const gmv = money(live.reduce((s: number, o: any) => s + Number(o.total_amount), 0));
    const liveIds = new Set(live.map((o: any) => o.id));
    const commission = money((vos.data || []).filter((v: any) => liveIds.has(v.order_id)).reduce((s: number, v: any) => s + Number(v.platform_fee_amount), 0));
    // 14-day chart
    const days: { label: string; key: string; gmv: number; orders: number }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push({ key: d.toISOString().slice(0, 10), label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), gmv: 0, orders: 0 });
    }
    for (const o of live) {
      const k = String(o.created_at).slice(0, 10);
      const slot = days.find((d) => d.key === k);
      if (slot) {
        slot.gmv = money(slot.gmv + Number(o.total_amount));
        slot.orders += 1;
      }
    }
    const activeCouriers = (couriers.data || []).filter((c: any) => c.status !== "suspended").length;
    return ok({
      revenue,
      gmv,
      commission,
      customers: customers.count || 0,
      vendors: vendors.count || 0,
      pendingVendors: pendingStores.count || 0,
      couriers: activeCouriers,
      totalOrders: all.length,
      pendingRefunds: refunds.count || 0,
      pendingProducts: pendingProducts.count || 0,
      claimRate: all.length ? Math.round(((claimCount.count || 0) / all.length) * 10000) / 100 : 0,
      deliveredRate: all.length ? Math.round((all.filter((o: any) => o.order_status === "delivered").length / all.length) * 1000) / 10 : 0,
      chart: days,
      recentStores: storesList.data || [],
      recentOrders: all.slice(0, 5),
    });
  } catch (e) {
    return fail(e);
  }
}

// ----------------------------------------------------------------- vendors
export async function getAdminVendors(adminId: string) {
  try {
    const db = await assertAdmin(adminId);
    const { data, error } = await db.from("stores").select("*, profiles:vendor_id(full_name,email,phone)").order("created_at", { ascending: false });
    if (error) throw error;
    return ok(data || []);
  } catch (e) {
    return fail(e);
  }
}

export async function setVendorStatus(adminId: string, storeId: string, status: "approved" | "rejected" | "suspended", reason?: string) {
  try {
    const db = await assertAdmin(adminId);
    if ((status === "rejected" || status === "suspended") && !reason?.trim()) return fail("A reason is required.");
    const { data: store, error } = await db
      .from("stores")
      .update({ status, status_reason: status === "approved" ? null : reason!.trim() })
      .eq("id", storeId)
      .select("id,name,vendor_id")
      .single();
    if (error || !store) return fail(error?.message || "Store not found");
    const msg =
      status === "approved"
        ? `${store.name} has been approved and is now live on FreshMart.`
        : `${store.name} was ${status}. Reason: ${reason}`;
    await notify(db, store.vendor_id, `Store ${status}`, msg, "vendor", "/vendor");
    await audit(db, adminId, `store_${status}`, "store", storeId, { reason });
    revalidatePath("/admin/vendors");
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// ------------------------------------------------------------------ orders
export async function getAdminOrders(adminId: string) {
  try {
    const db = await assertAdmin(adminId);
    const { data: orders, error } = await db.from("orders").select("*").order("created_at", { ascending: false }).limit(300);
    if (error) throw error;
    const ids = (orders || []).map((o: any) => o.id);
    if (!ids.length) return ok({ orders: [], couriers: [] });
    const [vos, items, custs, couriers] = await Promise.all([
      db.from("vendor_orders").select("*, stores(name,address,phone)").in("order_id", ids),
      db.from("order_items").select("*").in("order_id", ids),
      db.from("profiles").select("id,full_name,email,phone").in("id", Array.from(new Set((orders || []).map((o: any) => o.customer_id)))),
      db.from("profiles").select("id,full_name,phone,status").eq("role", "courier"),
    ]);
    const voIds = (vos.data || []).map((v: any) => v.id);
    const dels = voIds.length ? await db.from("deliveries").select("*").in("vendor_order_id", voIds) : { data: [] as any[] };
    const cMap = new Map((couriers.data || []).map((c: any) => [c.id, c]));
    const custMap = new Map((custs.data || []).map((c: any) => [c.id, c]));
    const result = (orders || []).map((o: any) => ({
      ...o,
      customer: custMap.get(o.customer_id) || null,
      vendor_orders: (vos.data || [])
        .filter((v: any) => v.order_id === o.id)
        .map((v: any) => ({
          ...v,
          courier: v.courier_id ? cMap.get(v.courier_id) || null : null,
          delivery: (dels.data || []).find((d: any) => d.vendor_order_id === v.id) || null,
          items: (items.data || []).filter((i: any) => i.vendor_order_id === v.id),
        })),
    }));
    return ok({ orders: result, couriers: couriers.data || [] });
  } catch (e) {
    return fail(e);
  }
}

function fmtAddr(a: any) {
  if (!a) return "Customer address";
  if (typeof a === "string") return a;
  return [a.address || a.line1 || a.street, a.apt || a.line2, a.city, a.state, a.zip || a.postal_code].filter(Boolean).join(", ") || "Customer address";
}

export async function assignCourier(adminId: string, vendorOrderId: string, courierId: string) {
  try {
    const db = await assertAdmin(adminId);
    const { data: courier } = await db.from("profiles").select("id,full_name,role,status").eq("id", courierId).maybeSingle();
    if (!courier || courier.role !== "courier") return fail("Selected user is not a courier.");
    if (courier.status === "suspended") return fail("Courier is suspended.");
    const { data: vo } = await db.from("vendor_orders").select("id,order_id,status, stores(name,address), orders(order_number,shipping_address,order_status)").eq("id", vendorOrderId).single();
    if (!vo) return fail("Sub-order not found.");
    if ((vo as any).orders?.order_status === "cancelled" || ["cancelled", "rejected", "completed"].includes(vo.status)) return fail(`Cannot assign courier to a ${vo.status} sub-order.`);
    const { error: e1 } = await db.from("vendor_orders").update({ courier_id: courierId, updated_at: new Date().toISOString() }).eq("id", vendorOrderId);
    if (e1) throw e1;
    const { data: existing } = await db.from("deliveries").select("id,status").eq("vendor_order_id", vendorOrderId).maybeSingle();
    if (existing) {
      const { error } = await db.from("deliveries").update({ courier_id: courierId, status: existing.status === "failed" ? "assigned" : existing.status }).eq("id", existing.id);
      if (error) throw error;
    } else {
      const { error } = await db.from("deliveries").insert({
        vendor_order_id: vendorOrderId,
        courier_id: courierId,
        status: "assigned",
        pickup_address: (vo as any).stores?.address || "Store pickup",
        dropoff_address: fmtAddr((vo as any).orders?.shipping_address),
      });
      if (error) throw error;
    }
    await notify(db, courierId, "New delivery assigned", `Order ${(vo as any).orders?.order_number} from ${(vo as any).stores?.name} is assigned to you.`, "delivery", "/courier");
    await audit(db, adminId, "assign_courier", "vendor_order", vendorOrderId, { courierId });
    revalidatePath("/admin/orders");
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function cancelOrder(adminId: string, orderId: string, reason: string) {
  try {
    const db = await assertAdmin(adminId);
    if (!reason?.trim()) return fail("A cancellation reason is required.");
    const { data: order } = await db.from("orders").select("id,order_number,customer_id,order_status,payment_status,stripe_payment_intent_id").eq("id", orderId).single();
    if (!order) return fail("Order not found.");
    if (["delivered", "cancelled"].includes(order.order_status)) return fail(`A ${order.order_status} order cannot be cancelled.`);
    const wasPaid = order.payment_status === "paid";
    const now = new Date().toISOString();
    const { error } = await db
      .from("orders")
      .update({ order_status: "cancelled", cancel_reason: reason.trim(), payment_status: wasPaid ? "refunded" : order.payment_status, updated_at: now })
      .eq("id", orderId);
    if (error) throw error;
    const { data: vos } = await db.from("vendor_orders").select("id").eq("order_id", orderId);
    const voIds = (vos || []).map((v: any) => v.id);
    if (voIds.length) {
      await db.from("vendor_orders").update({ status: "cancelled", updated_at: now }).in("id", voIds).neq("status", "completed");
      await db.from("deliveries").update({ status: "failed" }).in("vendor_order_id", voIds).neq("status", "delivered");
    }
    let stripeNote = "";
    const key = process.env.STRIPE_SECRET_KEY || "";
    if (wasPaid && order.stripe_payment_intent_id && key && !key.includes("placeholder") && !order.stripe_payment_intent_id.startsWith("pi_mock_")) {
      try {
        const { stripe } = await import("@/lib/stripe");
        await stripe.refunds.create({ payment_intent: order.stripe_payment_intent_id });
        stripeNote = " Payment refunded via Stripe.";
      } catch (se: any) {
        stripeNote = ` (Stripe refund failed: ${se.message})`;
      }
    } else if (wasPaid) stripeNote = " Payment marked refunded (test mode, no live Stripe charge).";
    await notify(db, order.customer_id, `Order ${order.order_number} cancelled`, `Your order was cancelled by FreshMart. Reason: ${reason}`, "order", "/orders");
    await audit(db, adminId, "cancel_order", "order", orderId, { reason });
    revalidatePath("/admin/orders");
    return ok({ note: stripeNote });
  } catch (e) {
    return fail(e);
  }
}

// ----------------------------------------------------------------- refunds
export async function getAdminRefunds(adminId: string) {
  try {
    const db = await assertAdmin(adminId);
    const { data, error } = await db
      .from("refund_requests")
      .select("*, stores(name), orders(order_number,total_amount,stripe_payment_intent_id,payment_status), refund_items(id,quantity,amount,order_items(name,unit))")
      .order("created_at", { ascending: false });
    if (error) throw error;
    const custIds = Array.from(new Set((data || []).map((r: any) => r.customer_id)));
    const { data: custs } = custIds.length ? await db.from("profiles").select("id,full_name,email").in("id", custIds) : { data: [] as any[] };
    const cm = new Map((custs || []).map((c: any) => [c.id, c]));
    return ok((data || []).map((r: any) => ({ ...r, customer: cm.get(r.customer_id) || null })));
  } catch (e) {
    return fail(e);
  }
}

export async function markRefundUnderReview(adminId: string, claimId: string) {
  try {
    const db = await assertAdmin(adminId);
    const { data: c, error } = await db
      .from("refund_requests")
      .update({ status: "under_review", updated_at: new Date().toISOString() })
      .eq("id", claimId)
      .eq("status", "requested")
      .select("customer_id,claim_number")
      .maybeSingle();
    if (error) throw error;
    if (!c) return fail("Claim is not awaiting review.");
    await notify(db, c.customer_id, `Claim ${c.claim_number} under review`, "Our team has started reviewing your claim.", "refund", "/refunds");
    revalidatePath("/admin/refunds");
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// --------------------------------------------------------------- customers
export async function getAdminCustomers(adminId: string) {
  try {
    const db = await assertAdmin(adminId);
    const [{ data: custs, error }, { data: orders }] = await Promise.all([
      db.from("profiles").select("*").eq("role", "customer").order("created_at", { ascending: false }),
      db.from("orders").select("customer_id,total_amount,order_status"),
    ]);
    if (error) throw error;
    return ok(
      (custs || []).map((c: any) => {
        const mine = (orders || []).filter((o: any) => o.customer_id === c.id && o.order_status !== "cancelled");
        return { ...c, orderCount: mine.length, totalSpend: money(mine.reduce((s: number, o: any) => s + Number(o.total_amount), 0)) };
      })
    );
  } catch (e) {
    return fail(e);
  }
}

export async function setUserStatus(adminId: string, userId: string, status: "active" | "suspended") {
  try {
    const db = await assertAdmin(adminId);
    if (userId === adminId) return fail("You cannot suspend yourself.");
    const { data, error } = await db.from("profiles").update({ status, updated_at: new Date().toISOString() }).eq("id", userId).select("id,role,full_name").single();
    if (error || !data) return fail(error?.message || "User not found");
    await notify(db, userId, status === "suspended" ? "Account suspended" : "Account reactivated", status === "suspended" ? "Your account has been suspended by FreshMart support." : "Your account is active again.", "account");
    await audit(db, adminId, `user_${status}`, "profile", userId);
    revalidatePath("/admin/customers");
    revalidatePath("/admin/couriers");
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// ----------------------------------------------------------------- couriers
export async function getAdminCouriers(adminId: string) {
  try {
    const db = await assertAdmin(adminId);
    const [{ data: cs, error }, { data: dels }] = await Promise.all([
      db.from("profiles").select("*").eq("role", "courier").order("created_at", { ascending: false }),
      db.from("deliveries").select("courier_id,status"),
    ]);
    if (error) throw error;
    return ok(
      (cs || []).map((c: any) => {
        const mine = (dels || []).filter((d: any) => d.courier_id === c.id);
        return {
          ...c,
          activeDeliveries: mine.filter((d: any) => ["assigned", "picked_up", "in_transit"].includes(d.status)).length,
          completed: mine.filter((d: any) => d.status === "delivered").length,
        };
      })
    );
  } catch (e) {
    return fail(e);
  }
}

export async function saveCourier(adminId: string, input: { id?: string; fullName: string; email: string; phone?: string; vehicle?: string }) {
  try {
    const db = await assertAdmin(adminId);
    const fullName = input.fullName?.trim();
    const email = input.email?.trim().toLowerCase();
    if (!fullName || !email || !/^\S+@\S+\.\S+$/.test(email)) return fail("Valid name and email are required.");
    if (input.id) {
      const { error } = await db.from("profiles").update({ full_name: fullName, email, phone: input.phone || null, vehicle: input.vehicle || null, updated_at: new Date().toISOString() }).eq("id", input.id).eq("role", "courier");
      if (error) throw error;
    } else {
      const { data: dup } = await db.from("profiles").select("id").eq("email", email).maybeSingle();
      if (dup) return fail("A user with this email already exists.");
      const { data: created, error: ae } = await db.auth.admin.createUser({
        email,
        password: crypto.randomUUID() + "Aa1!",
        email_confirm: true,
        user_metadata: { full_name: fullName, role: "courier" },
      });
      if (ae || !created?.user) return fail(ae?.message || "Could not create courier account.");
      const row = { id: created.user.id, role: "courier", full_name: fullName, email, phone: input.phone || null, vehicle: input.vehicle || null, status: "active" };
      // a DB trigger may have already created the profile row
      const { error } = await db.from("profiles").upsert(row, { onConflict: "id" });
      if (error) {
        await db.auth.admin.deleteUser(created.user.id);
        throw error;
      }
    }
    await audit(db, adminId, input.id ? "update_courier" : "create_courier", "profile", input.id || email);
    revalidatePath("/admin/couriers");
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCourier(adminId: string, courierId: string) {
  try {
    const db = await assertAdmin(adminId);
    const { count } = await db.from("deliveries").select("id", { count: "exact", head: true }).eq("courier_id", courierId);
    const { count: c2 } = await db.from("vendor_orders").select("id", { count: "exact", head: true }).eq("courier_id", courierId);
    if ((count || 0) + (c2 || 0) > 0) return fail("This courier has delivery history. Suspend them instead of deleting.");
    const { error } = await db.from("profiles").delete().eq("id", courierId).eq("role", "courier");
    if (error) throw error;
    await db.auth.admin.deleteUser(courierId);
    await audit(db, adminId, "delete_courier", "profile", courierId);
    revalidatePath("/admin/couriers");
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------- products
export async function getAdminProducts(adminId: string) {
  try {
    const db = await assertAdmin(adminId);
    const { data, error } = await db.from("products").select("id,name,price,unit,image,stock,is_available,approval_status,rejection_reason,created_at,category_id,stores(name,vendor_id),categories(name)").order("created_at", { ascending: false });
    if (error) throw error;
    return ok(data || []);
  } catch (e) {
    return fail(e);
  }
}

export async function moderateProduct(adminId: string, productId: string, decision: "approved" | "rejected" | "pending", reason?: string) {
  try {
    const db = await assertAdmin(adminId);
    if (decision === "rejected" && !reason?.trim()) return fail("A rejection reason is required.");
    const patch: any = { approval_status: decision, rejection_reason: decision === "rejected" ? reason!.trim() : null, updated_at: new Date().toISOString() };
    if (decision === "rejected") patch.is_available = false;
    if (decision === "approved") patch.is_available = true;
    const { data, error } = await db.from("products").update(patch).eq("id", productId).select("name,stores(vendor_id)").single();
    if (error || !data) return fail(error?.message || "Product not found");
    await notify(db, (data as any).stores?.vendor_id, `Product ${decision}`, decision === "rejected" ? `"${data.name}" was rejected: ${reason}` : `"${data.name}" is ${decision}.`, "product", "/vendor/products");
    await audit(db, adminId, `product_${decision}`, "product", productId, { reason });
    revalidatePath("/admin/products");
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// -------------------------------------------------------------- categories
export async function getAdminCategories(adminId: string) {
  try {
    const db = await assertAdmin(adminId);
    const [{ data, error }, { data: prods }] = await Promise.all([db.from("categories").select("*").order("name"), db.from("products").select("category_id")]);
    if (error) throw error;
    return ok((data || []).map((c: any) => ({ ...c, productCount: (prods || []).filter((p: any) => p.category_id === c.id).length })));
  } catch (e) {
    return fail(e);
  }
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export async function saveCategory(adminId: string, input: { id?: string; name: string; icon: string; bg_color?: string; text_color?: string }) {
  try {
    const db = await assertAdmin(adminId);
    const name = input.name?.trim();
    if (!name) return fail("Name is required.");
    const fields = { name, icon: input.icon?.trim() || "🥬", bg_color: input.bg_color || "bg-emerald-50", text_color: input.text_color || "text-emerald-700" };
    if (input.id) {
      const { error } = await db.from("categories").update(fields).eq("id", input.id);
      if (error) throw error;
    } else {
      const slug = slugify(name);
      if (!slug) return fail("Invalid name.");
      const { error } = await db.from("categories").insert({ id: slug, slug, item_count: 0, ...fields });
      if (error) return fail(error.code === "23505" ? "A category with this name already exists." : error.message);
    }
    revalidatePath("/admin/categories");
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCategory(adminId: string, id: string) {
  try {
    const db = await assertAdmin(adminId);
    const { count } = await db.from("products").select("id", { count: "exact", head: true }).eq("category_id", id);
    if (count) return fail(`Cannot delete: ${count} product(s) use this category.`);
    const { error } = await db.from("categories").delete().eq("id", id);
    if (error) throw error;
    revalidatePath("/admin/categories");
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// ----------------------------------------------------------------- coupons
export async function getAdminCoupons(adminId: string) {
  try {
    const db = await assertAdmin(adminId);
    const { data, error } = await db.from("coupons").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return ok(data || []);
  } catch (e) {
    return fail(e);
  }
}

export async function saveCoupon(adminId: string, input: { id?: string; code: string; discount_type: "percent" | "fixed"; value: number; min_order?: number; expires_at?: string | null; usage_limit?: number | null; is_active?: boolean }) {
  try {
    const db = await assertAdmin(adminId);
    const code = input.code?.trim().toUpperCase();
    if (!code || !/^[A-Z0-9_-]{3,24}$/.test(code)) return fail("Code must be 3-24 letters/numbers.");
    const value = Number(input.value);
    if (!(value > 0)) return fail("Value must be greater than 0.");
    if (input.discount_type === "percent" && value > 100) return fail("Percent cannot exceed 100.");
    const row = {
      code,
      discount_type: input.discount_type,
      value,
      min_order: Number(input.min_order || 0),
      expires_at: input.expires_at ? new Date(input.expires_at).toISOString() : null,
      usage_limit: input.usage_limit ? Math.floor(Number(input.usage_limit)) : null,
      is_active: input.is_active ?? true,
    };
    const { error } = input.id ? await db.from("coupons").update(row).eq("id", input.id) : await db.from("coupons").insert(row);
    if (error) return fail(error.code === "23505" ? "That coupon code already exists." : error.message);
    revalidatePath("/admin/coupons");
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function toggleCoupon(adminId: string, id: string, isActive: boolean) {
  try {
    const db = await assertAdmin(adminId);
    const { error } = await db.from("coupons").update({ is_active: isActive }).eq("id", id);
    if (error) throw error;
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function deleteCoupon(adminId: string, id: string) {
  try {
    const db = await assertAdmin(adminId);
    const { error } = await db.from("coupons").delete().eq("id", id);
    if (error) throw error;
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// ----------------------------------------------------------------- banners
export async function getAdminBanners(adminId: string) {
  try {
    const db = await assertAdmin(adminId);
    const { data, error } = await db.from("banners").select("*").order("sort_order").order("created_at", { ascending: false });
    if (error) throw error;
    return ok(data || []);
  } catch (e) {
    return fail(e);
  }
}

export async function saveBanner(adminId: string, input: { id?: string; title: string; subtitle?: string; image_url?: string; link_url?: string; sort_order?: number; is_active?: boolean }) {
  try {
    const db = await assertAdmin(adminId);
    if (!input.title?.trim()) return fail("Title is required.");
    const row = { title: input.title.trim(), subtitle: input.subtitle?.trim() || null, image_url: input.image_url?.trim() || null, link_url: input.link_url?.trim() || null, sort_order: Number(input.sort_order || 0), is_active: input.is_active ?? true };
    const { error } = input.id ? await db.from("banners").update(row).eq("id", input.id) : await db.from("banners").insert(row);
    if (error) throw error;
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function toggleBanner(adminId: string, id: string, isActive: boolean) {
  try {
    const db = await assertAdmin(adminId);
    const { error } = await db.from("banners").update({ is_active: isActive }).eq("id", id);
    if (error) throw error;
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function deleteBanner(adminId: string, id: string) {
  try {
    const db = await assertAdmin(adminId);
    const { error } = await db.from("banners").delete().eq("id", id);
    if (error) throw error;
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// ----------------------------------------------------------------- tickets
export async function getAdminTickets(adminId: string) {
  try {
    const db = await assertAdmin(adminId);
    const { data, error } = await db.from("support_tickets").select("*, profiles:user_id(full_name,email)").order("created_at", { ascending: false });
    if (error) throw error;
    return ok(data || []);
  } catch (e) {
    return fail(e);
  }
}

export async function updateTicket(adminId: string, id: string, input: { status: "open" | "in_progress" | "resolved" | "closed"; reply?: string }) {
  try {
    const db = await assertAdmin(adminId);
    const patch: any = { status: input.status, updated_at: new Date().toISOString() };
    if (input.reply?.trim()) patch.admin_reply = input.reply.trim();
    const { data, error } = await db.from("support_tickets").update(patch).eq("id", id).select("user_id,subject").single();
    if (error || !data) return fail(error?.message || "Ticket not found");
    if (input.reply?.trim()) await notify(db, data.user_id, `Reply to: ${data.subject}`, input.reply.trim(), "support");
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function createTicket(adminId: string, input: { userEmail: string; subject: string; message: string; priority?: string }) {
  try {
    const db = await assertAdmin(adminId);
    if (!input.subject?.trim() || !input.message?.trim()) return fail("Subject and message are required.");
    let userId: string | null = null;
    if (input.userEmail?.trim()) {
      const { data: u } = await db.from("profiles").select("id").eq("email", input.userEmail.trim().toLowerCase()).maybeSingle();
      if (!u) return fail("No user with that email.");
      userId = u.id;
    }
    const { error } = await db.from("support_tickets").insert({ user_id: userId, ticket_number: `TKT-${Math.floor(100000 + Math.random() * 900000)}`, subject: input.subject.trim(), message: input.message.trim(), priority: input.priority || "normal" });
    if (error) throw error;
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// ---------------------------------------------------------------- settings
export async function getPlatformSettings(adminId: string) {
  try {
    const db = await assertAdmin(adminId);
    const { data, error } = await db.from("platform_settings").select("key,value");
    if (error) throw error;
    return ok(Object.fromEntries((data || []).map((r: any) => [r.key, r.value])));
  } catch (e) {
    return fail(e);
  }
}

export async function savePlatformSettings(adminId: string, values: Record<string, string>) {
  try {
    const db = await assertAdmin(adminId);
    const num = (k: string, min = 0, max = 1e6) => {
      const n = Number(values[k]);
      if (!Number.isFinite(n) || n < min || n > max) throw new Error(`Invalid value for ${k}`);
    };
    num("commission_rate", 0, 50);
    num("service_fee");
    num("delivery_fee");
    num("min_order");
    num("payout_fee_pct", 0, 20);
    const rows = Object.entries(values).map(([key, value]) => ({ key, value: String(value), updated_at: new Date().toISOString() }));
    const { error } = await db.from("platform_settings").upsert(rows, { onConflict: "key" });
    if (error) throw error;
    await audit(db, adminId, "update_settings", "platform_settings", "all", values);
    revalidatePath("/admin/settings");
    return ok();
  } catch (e) {
    return fail(e);
  }
}

export async function applyCommissionToStores(adminId: string, ratePct: number) {
  try {
    const db = await assertAdmin(adminId);
    if (!(ratePct >= 0 && ratePct <= 50)) return fail("Invalid rate.");
    const { error } = await db.from("stores").update({ commission_rate: ratePct / 100 }).neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw error;
    await audit(db, adminId, "apply_commission_all", "stores", "all", { ratePct });
    return ok();
  } catch (e) {
    return fail(e);
  }
}

// ----------------------------------------------------------------- payouts
export async function getAdminPayouts(adminId: string) {
  try {
    const db = await assertAdmin(adminId);
    const [{ data: payouts, error }, { data: balances }, { data: stores }] = await Promise.all([
      db.from("vendor_payouts").select("*, stores(name)").order("created_at", { ascending: false }).limit(200),
      db.from("vendor_balances").select("*"),
      db.from("stores").select("id,name,commission_rate"),
    ]);
    if (error) throw error;
    const sm = new Map((stores || []).map((s: any) => [s.id, s]));
    return ok({
      payouts: payouts || [],
      balances: (balances || []).map((b: any) => ({ ...b, store: sm.get(b.store_id) || null })),
    });
  } catch (e) {
    return fail(e);
  }
}

// ----------------------------------------------------------- notifications
export async function getAdminNotifications(adminId: string) {
  try {
    const db = await assertAdmin(adminId);
    const { data, error } = await db
      .from("notifications")
      .select("*")
      .eq("user_id", adminId)
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return ok(data || []);
  } catch (e) {
    return fail(e);
  }
}

export async function markAdminNotificationsRead(adminId: string) {
  try {
    const db = await assertAdmin(adminId);
    const { error } = await db
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", adminId)
      .eq("is_read", false);
    if (error) throw error;
    return ok();
  } catch (e) {
    return fail(e);
  }
}
