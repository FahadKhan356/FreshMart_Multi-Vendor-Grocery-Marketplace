"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import {
  getCustomerOrdersWithTracking,
  getCustomerAddresses,
  getCustomerWishlist,
  getCustomerReviews,
  getCustomerNotifications,
  type CustomerAddress,
  type WishlistEntry,
  type ProductReview,
  type CustomerNotification,
} from "@/lib/data/customerData";
import {
  saveAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
  toggleWishlistAction,
  deleteReviewAction,
  markNotificationReadAction,
} from "@/lib/actions/customer";
import { useAuthStore } from "@/lib/store/authStore";
import { useCartStore } from "@/lib/store/cartStore";
import {
  MapPin,
  Package,
  Receipt,
  Heart,
  Bell,
  CreditCard,
  Sparkles,
  Plus,
  Trash2,
  Edit3,
  Star,
  Check,
  CheckCheck,
  Loader2,
  ShoppingBasket,
  X,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

type TabType = "orders" | "addresses" | "payments" | "wishlist" | "reviews" | "notifications";

function getOrderProgress(order: any): { pct: number; stepLabel: string } {
  const s = order?.order_status || order?.vendor_orders?.[0]?.status || "pending";
  const delStatus = order?.vendor_orders?.[0]?.deliveries?.[0]?.status;
  if (s === "delivered" || delStatus === "delivered" || s === "completed") {
    return { pct: 100, stepLabel: "Delivered" };
  }
  if (s === "out_for_delivery" || delStatus === "in_transit" || s === "dispatched") {
    return { pct: 75, stepLabel: "Out for Delivery" };
  }
  if (s === "ready_for_pickup" || s === "ready" || delStatus === "picked_up") {
    return { pct: 50, stepLabel: "Ready / Thermal Pack Sealed" };
  }
  if (s === "preparing" || s === "paid" || s === "accepted") {
    return { pct: 25, stepLabel: "Preparing at Store" };
  }
  if (s === "cancelled" || s === "rejected") {
    return { pct: 0, stepLabel: "Cancelled" };
  }
  return { pct: 15, stepLabel: "Order Placed" };
}

function AccountContent() {
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TabType) || "orders";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const { user } = useAuthStore();
  const addItem = useCartStore((s) => s.addItem);

  const [orders, setOrders] = useState<any[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [wishlist, setWishlist] = useState<WishlistEntry[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [notifications, setNotifications] = useState<CustomerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [reorderedId, setReorderedId] = useState<string | null>(null);

  // Address form state
  const [showAddrForm, setShowAddrForm] = useState(false);
  const [editingAddrId, setEditingAddrId] = useState<string | null>(null);
  const [savingAddr, setSavingAddr] = useState(false);
  const [addrForm, setAddrForm] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
    instructions: "",
    isDefault: false,
  });

  useEffect(() => {
    const t = searchParams.get("tab") as TabType | null;
    if (t && ["orders", "addresses", "payments", "wishlist", "reviews", "notifications"].includes(t)) {
      setActiveTab(t);
    }
  }, [searchParams]);

  const loadAll = async (uid: string) => {
    setLoading(true);
    try {
      const [ords, addrs, wish, revs, notifs] = await Promise.all([
        getCustomerOrdersWithTracking(uid),
        getCustomerAddresses(uid),
        getCustomerWishlist(uid),
        getCustomerReviews(uid),
        getCustomerNotifications(uid),
      ]);
      setOrders(ords);
      setAddresses(addrs);
      setWishlist(wish);
      setReviews(revs);
      setNotifications(notifs);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadAll(user.id);
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const handleReorder = (order: any) => {
    let count = 0;
    for (const vo of order.vendor_orders || []) {
      for (const it of vo.order_items || []) {
        addItem({
          id: it.product_id || it.id,
          name: it.name,
          price: Number(it.price),
          unit: it.unit || "Each",
          image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80",
          storeId: vo.store_id,
          storeName: vo.stores?.name || "FreshMart Partner",
          stock: 50,
          quantity: it.quantity,
        });
        count++;
      }
    }
    if (count > 0) {
      setReorderedId(order.id);
      setTimeout(() => setReorderedId(null), 1800);
    }
  };

  const openNewAddress = () => {
    setEditingAddrId(null);
    setAddrForm({
      label: "Home",
      fullName: user?.fullName || "",
      phone: user?.phone || "",
      address: "",
      apartment: "",
      city: "",
      state: "",
      zipCode: "",
      instructions: "",
      isDefault: addresses.length === 0,
    });
    setShowAddrForm(true);
  };

  const openEditAddress = (a: CustomerAddress) => {
    setEditingAddrId(a.id);
    setAddrForm({
      label: a.label,
      fullName: a.full_name,
      phone: a.phone,
      address: a.address,
      apartment: a.apartment || "",
      city: a.city,
      state: a.state,
      zipCode: a.zip_code,
      instructions: a.instructions || "",
      isDefault: a.is_default,
    });
    setShowAddrForm(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSavingAddr(true);
    const res = await saveAddressAction({
      id: editingAddrId || undefined,
      userId: user.id,
      ...addrForm,
    });
    if (res.success) {
      const refreshed = await getCustomerAddresses(user.id);
      setAddresses(refreshed);
      setShowAddrForm(false);
    }
    setSavingAddr(false);
  };

  const handleDeleteAddress = async (addrId: string) => {
    if (!user?.id) return;
    const res = await deleteAddressAction(user.id, addrId);
    if (res.success) {
      setAddresses((prev) => prev.filter((a) => a.id !== addrId));
    }
  };

  const handleSetDefaultAddress = async (addrId: string) => {
    if (!user?.id) return;
    const res = await setDefaultAddressAction(user.id, addrId);
    if (res.success) {
      const refreshed = await getCustomerAddresses(user.id);
      setAddresses(refreshed);
    }
  };

  const handleRemoveWishlist = async (productId: string) => {
    if (!user?.id) return;
    const res = await toggleWishlistAction(user.id, productId);
    if (res.success) {
      setWishlist((prev) => prev.filter((w) => w.product_id !== productId));
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!user?.id) return;
    const res = await deleteReviewAction(user.id, reviewId);
    if (res.success) {
      setReviews((prev) => prev.filter((r) => r.id !== reviewId));
    }
  };

  const handleMarkRead = async (notificationId?: string) => {
    if (!user?.id) return;
    const res = await markNotificationReadAction(user.id, notificationId);
    if (res.success) {
      setNotifications((prev) =>
        prev.map((n) => (!notificationId || n.id === notificationId ? { ...n, is_read: true } : n))
      );
    }
  };

  const activeOrder = orders.find(
    (o) => o.order_status !== "delivered" && o.order_status !== "cancelled"
  );
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
        {/* User Profile Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              {user?.fullName ? user.fullName.split(" ").map((n) => n[0]).join("") : "G"}
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {user?.fullName || "Guest Customer"}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {user?.email || "Sign in via role switcher"} • FreshMart Verified Profile
              </p>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2.5 py-0.5 rounded-full bg-fresh-100 text-fresh-700 font-bold text-[10px] uppercase">
                  ⭐ FreshMart Member
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-semibold text-slate-600">{orders.length} Orders</span>
              </div>
            </div>
          </div>

          <Link
            href="/refunds"
            className="px-4 py-2.5 rounded-xl bg-harvest-50 text-harvest-800 hover:bg-harvest-100 border border-harvest-200 font-bold text-xs flex items-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-harvest-600" />
            <span>Freshness Guarantee Claims</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Nav Menu */}
          <aside className="lg:col-span-3 bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-1">
            {[
              { id: "orders", label: "My Orders & Tracking", icon: Package },
              { id: "addresses", label: "Saved Addresses", icon: MapPin },
              { id: "payments", label: "Payment History", icon: CreditCard },
              { id: "wishlist", label: `Wishlist (${wishlist.length})`, icon: Heart },
              { id: "reviews", label: `My Reviews (${reviews.length})`, icon: Star },
              { id: "notifications", label: "Notifications", icon: Bell, badge: unreadCount },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  type="button"
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    activeTab === tab.id
                      ? "bg-fresh-600 text-white shadow-md shadow-fresh-600/20"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </span>
                  {tab.badge ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
                      {tab.badge}
                    </span>
                  ) : null}
                </button>
              );
            })}

            <Link
              href="/refunds"
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Receipt className="w-4 h-4" />
              <span>Refunds &amp; Returns</span>
            </Link>
          </aside>

          {/* Right Tab Content */}
          <div className="lg:col-span-9 space-y-6">
            {loading ? (
              <div className="bg-white rounded-3xl p-12 border border-slate-200 text-center flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-fresh-600" />
                <span>Loading your account data...</span>
              </div>
            ) : activeTab === "orders" ? (
              <div className="space-y-6">
                {/* Live Active Order Highlight */}
                {activeOrder && (
                  <div className="bg-emerald-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-emerald-950/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                        <span className="font-bold text-xs uppercase tracking-wider text-emerald-400">
                          Active Order Tracking
                        </span>
                      </div>
                      <span className="text-xs text-slate-300 font-bold">Order #{activeOrder.order_number}</span>
                    </div>

                    <div className="py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs text-slate-400">Delivery Window</p>
                        <p className="text-lg font-extrabold text-white mt-1">
                          {activeOrder.delivery_window || "30-Min Express"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Current Stage</p>
                        <p className="text-sm font-bold text-white mt-1">
                          {getOrderProgress(activeOrder).stepLabel}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Cold-Chain Temp</p>
                        <p className="text-sm font-bold text-emerald-300 mt-1">
                          {activeOrder.vendor_orders?.[0]?.deliveries?.[0]?.bag_temp_celsius
                            ? `${activeOrder.vendor_orders[0].deliveries[0].bag_temp_celsius}°C (Verified)`
                            : "Below 4.0°C (Cold-Chain Monitored)"}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                        <span>1. Placed</span>
                        <span>2. Preparing</span>
                        <span>3. Out for Delivery</span>
                        <span>4. Delivered</span>
                      </div>
                      <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${getOrderProgress(activeOrder).pct}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Orders List */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                  <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
                    Order History ({orders.length})
                  </h3>

                  {orders.length === 0 ? (
                    <div className="py-10 text-center space-y-3">
                      <p className="text-xs text-slate-500">You haven&apos;t placed any orders yet.</p>
                      <Link
                        href="/catalog"
                        className="inline-block px-5 py-2.5 rounded-xl bg-fresh-600 text-white text-xs font-bold"
                      >
                        Start Shopping
                      </Link>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {orders.map((order) => {
                        const storeNames = (order.vendor_orders || [])
                          .map((vo: any) => vo.stores?.name)
                          .filter(Boolean);
                        const itemCount = (order.vendor_orders || []).reduce(
                          (s: number, vo: any) => s + (vo.order_items?.length || 0),
                          0
                        );
                        return (
                          <div
                            key={order.id}
                            className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-slate-900">#{order.order_number}</span>
                                <span className="text-xs text-slate-400">
                                  • {new Date(order.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-0.5">
                                {itemCount} items from {storeNames.length > 0 ? storeNames.join(", ") : "FreshMart Partner"}
                              </p>
                              <div className="flex items-center gap-2 mt-2">
                                <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                                  {order.order_status}
                                </span>
                                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">
                                  {order.payment_status}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <span className="font-extrabold text-base text-slate-900">
                                {formatPrice(Number(order.total_amount))}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleReorder(order)}
                                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-fresh-600 hover:text-white text-slate-700 text-xs font-bold transition-colors flex items-center gap-1"
                              >
                                {reorderedId === order.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" /> Added!
                                  </>
                                ) : (
                                  <span>Re-order All</span>
                                )}
                              </button>
                              <Link
                                href={`/refunds?orderId=${order.id}`}
                                className="text-xs text-harvest-700 hover:underline font-semibold"
                              >
                                Need Help?
                              </Link>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : activeTab === "addresses" ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-5">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">
                    Saved Delivery Destinations ({addresses.length})
                  </h3>
                  <button
                    type="button"
                    onClick={openNewAddress}
                    className="px-3.5 py-2 rounded-xl bg-fresh-600 hover:bg-fresh-700 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Address</span>
                  </button>
                </div>

                {showAddrForm && (
                  <form onSubmit={handleSaveAddress} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700">
                        {editingAddrId ? "Edit Address" : "New Delivery Address"}
                      </h4>
                      <button type="button" onClick={() => setShowAddrForm(false)} className="text-slate-400 hover:text-slate-700">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="text"
                        placeholder="Label (e.g. Home, Work)"
                        value={addrForm.label}
                        onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-fresh-600"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Recipient Full Name"
                        value={addrForm.fullName}
                        onChange={(e) => setAddrForm({ ...addrForm, fullName: e.target.value })}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-fresh-600"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Phone Number"
                        value={addrForm.phone}
                        onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-fresh-600"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Street Address"
                        value={addrForm.address}
                        onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-fresh-600"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Apt / Suite (Optional)"
                        value={addrForm.apartment}
                        onChange={(e) => setAddrForm({ ...addrForm, apartment: e.target.value })}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-fresh-600"
                      />
                      <input
                        type="text"
                        placeholder="City"
                        value={addrForm.city}
                        onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-fresh-600"
                        required
                      />
                      <input
                        type="text"
                        placeholder="State"
                        value={addrForm.state}
                        onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-fresh-600"
                        required
                      />
                      <input
                        type="text"
                        placeholder="ZIP Code"
                        value={addrForm.zipCode}
                        onChange={(e) => setAddrForm({ ...addrForm, zipCode: e.target.value })}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-fresh-600"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Delivery Instructions (Optional)"
                        value={addrForm.instructions}
                        onChange={(e) => setAddrForm({ ...addrForm, instructions: e.target.value })}
                        className="sm:col-span-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-fresh-600"
                      />
                    </div>
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={addrForm.isDefault}
                        onChange={(e) => setAddrForm({ ...addrForm, isDefault: e.target.checked })}
                        className="rounded text-fresh-600"
                      />
                      <span>Set as default delivery address</span>
                    </label>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowAddrForm(false)}
                        className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={savingAddr}
                        className="px-5 py-2 rounded-xl bg-fresh-600 text-white text-xs font-bold disabled:opacity-50"
                      >
                        {savingAddr ? "Saving..." : "Save Address"}
                      </button>
                    </div>
                  </form>
                )}

                {addresses.length === 0 && !showAddrForm ? (
                  <p className="text-xs text-slate-500 py-8 text-center">
                    No saved addresses yet. Click &ldquo;Add Address&rdquo; to save one.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((a) => (
                      <div
                        key={a.id}
                        className={`p-4 rounded-2xl border flex justify-between items-start gap-4 ${
                          a.is_default ? "border-2 border-fresh-600 bg-fresh-50/40" : "border-slate-200"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-fresh-600 text-white text-[10px] font-bold uppercase">
                              {a.label} {a.is_default ? "(Default)" : ""}
                            </span>
                            <span className="text-xs font-bold text-slate-700">{a.full_name}</span>
                          </div>
                          <h4 className="font-bold text-sm text-slate-900 mt-1.5">
                            {a.address}
                            {a.apartment ? `, ${a.apartment}` : ""}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {a.city}, {a.state} {a.zip_code} • {a.phone}
                          </p>
                          {a.instructions && (
                            <p className="text-xs text-slate-400 mt-1">Instructions: {a.instructions}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {!a.is_default && (
                            <button
                              type="button"
                              onClick={() => handleSetDefaultAddress(a.id)}
                              className="text-xs text-slate-600 hover:text-fresh-700 font-semibold"
                            >
                              Set Default
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openEditAddress(a)}
                            className="p-1.5 text-slate-500 hover:text-fresh-700"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteAddress(a.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "payments" ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
                  Payment History ({orders.length})
                </h3>
                {orders.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">No payment transactions recorded yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {orders.map((o) => (
                      <div key={o.id} className="py-3.5 flex items-center justify-between gap-4 text-xs">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600">
                            <CreditCard className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-bold text-slate-900">
                              Order #{o.order_number} •{" "}
                              <span className="uppercase">{o.payment_method || "card"}</span>
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {new Date(o.created_at).toLocaleString()}
                              {o.coupon_code ? ` • Promo: ${o.coupon_code}` : ""}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-extrabold text-sm text-slate-900">
                            {formatPrice(Number(o.total_amount))}
                          </p>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold uppercase">
                            {o.payment_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeTab === "wishlist" ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
                  Saved Wishlist ({wishlist.length})
                </h3>
                {wishlist.length === 0 ? (
                  <div className="py-10 text-center space-y-3">
                    <p className="text-xs text-slate-500">Your wishlist is empty. Tap the heart on any product to save it.</p>
                    <Link href="/catalog" className="inline-block px-5 py-2.5 rounded-xl bg-fresh-600 text-white text-xs font-bold">
                      Browse Catalog
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {wishlist.map((w) =>
                      w.product ? (
                        <div key={w.id} className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <img src={w.product.image} alt={w.product.name} className="w-14 h-14 rounded-xl object-cover bg-slate-100 shrink-0" />
                            <div className="min-w-0">
                              <Link href={`/product/${w.product.id}`} className="font-bold text-xs text-slate-900 hover:text-fresh-700 truncate block">
                                {w.product.name}
                              </Link>
                              <p className="text-[11px] text-slate-500 truncate">{w.product.storeName}</p>
                              <p className="text-xs font-extrabold text-fresh-700 mt-0.5">{formatPrice(w.product.price)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() =>
                                w.product &&
                                addItem({
                                  id: w.product.id,
                                  name: w.product.name,
                                  price: w.product.price,
                                  unit: w.product.unit,
                                  image: w.product.image,
                                  storeId: w.product.storeId,
                                  storeName: w.product.storeName,
                                  stock: w.product.stock,
                                  organic: w.product.organic,
                                  quantity: 1,
                                })
                              }
                              className="p-2 rounded-xl bg-fresh-50 text-fresh-700 hover:bg-fresh-600 hover:text-white transition-colors"
                              title="Add to Cart"
                            >
                              <ShoppingBasket className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRemoveWishlist(w.product_id)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 transition-colors"
                              title="Remove"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            ) : activeTab === "reviews" ? (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
                  My Product Reviews ({reviews.length})
                </h3>
                {reviews.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">You haven&apos;t written any product reviews yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {reviews.map((rev) => (
                      <div key={rev.id} className="py-4 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <Link
                            href={`/product/${rev.product_id}`}
                            className="font-bold text-xs text-fresh-700 hover:underline"
                          >
                            {rev.products?.name || "Product"}
                          </Link>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-xs text-slate-600">{rev.comment}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteReview(rev.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600"
                          title="Delete Review"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="font-bold text-base text-slate-900">
                    Notifications ({unreadCount} unread)
                  </h3>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead()}
                      className="text-xs font-bold text-fresh-700 hover:underline flex items-center gap-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark All Read</span>
                    </button>
                  )}
                </div>
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-8 text-center">No notifications yet.</p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={`py-3.5 px-3 rounded-xl flex items-start justify-between gap-4 ${
                          n.is_read ? "opacity-75" : "bg-fresh-50/40"
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-fresh-600" />}
                            <p className="font-bold text-xs text-slate-900">{n.title}</p>
                          </div>
                          <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                          <p className="text-[10px] text-slate-400 mt-1">
                            {new Date(n.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {n.link && (
                            <Link href={n.link} className="text-xs font-bold text-fresh-700 hover:underline">
                              View
                            </Link>
                          )}
                          {!n.is_read && (
                            <button
                              type="button"
                              onClick={() => handleMarkRead(n.id)}
                              className="text-[11px] font-semibold text-slate-500 hover:text-slate-900"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AccountPage() {
  return (
    <>
      <CustomerHeader />
      <Suspense fallback={<div className="min-h-screen bg-slate-50 py-20 text-center text-xs text-slate-500">Loading account...</div>}>
        <AccountContent />
      </Suspense>
      <CustomerFooter />
    </>
  );
}
