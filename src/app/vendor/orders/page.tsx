"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import { Check, X, Eye, Loader2, Search, MapPin, Phone, Mail } from "lucide-react";
import { updateVendorOrderStatus } from "@/lib/actions/orders";
import { useVendor } from "../VendorContext";
import { VendorOrderRow, getVendorOrders } from "@/lib/data/vendorData";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "accepted", label: "Accepted" },
  { key: "preparing", label: "Preparing" },
  { key: "ready", label: "Ready" },
  { key: "dispatched", label: "Dispatched" },
  { key: "completed", label: "Completed" },
  { key: "rejected", label: "Rejected" },
];

export default function VendorOrdersPage() {
  const { storeId, userId, refreshBadges } = useVendor();
  const [orders, setOrders] = useState<VendorOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [statusTab, setStatusTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrder, setSelectedOrder] = useState<VendorOrderRow | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadOrders = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const data = await getVendorOrders(storeId);
      setOrders(data);
    } catch (err) {
      console.error("Failed to load vendor orders:", err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setLoadingId(orderId);
    setFeedback(null);
    const res = await updateVendorOrderStatus(orderId, newStatus, userId);
    if (res.success) {
      setFeedback({ type: "success", text: `Order updated to "${newStatus}".` });
      await Promise.all([loadOrders(), refreshBadges()]);
      if (selectedOrder?.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
      }
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update order status." });
    }
    setLoadingId(null);
  };

  const filtered = orders.filter((o) => {
    const matchesTab = statusTab === "all" || o.status === statusTab;
    const matchesSearch =
      !searchQuery.trim() ||
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const formatAddress = (addr: Record<string, any>) => {
    const parts = [addr.address, addr.apartment, addr.city, addr.state, addr.zipCode].filter(Boolean);
    return parts.length > 0 ? parts.join(", ") : "Address on file";
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Orders & Fulfillment Center
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Accept incoming orders, pack groceries, mark ready for courier pickup, and track delivery status.
        </p>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold border flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusTab(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                statusTab === tab.key
                  ? "bg-[#16a34a] text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search order # or customer..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-5 my-8">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h3 className="font-extrabold text-lg text-slate-900">
                    Order {selectedOrder.order_number}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold uppercase">
                    {selectedOrder.status}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Placed {new Date(selectedOrder.created_at).toLocaleString()} • Payment:{" "}
                  {selectedOrder.payment_status}
                </p>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs">
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-400">Customer</p>
                <p className="font-bold text-slate-900">{selectedOrder.customer_name}</p>
                {selectedOrder.customer_email && (
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <Mail className="w-3 h-3" /> {selectedOrder.customer_email}
                  </p>
                )}
                {selectedOrder.customer_phone && (
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> {selectedOrder.customer_phone}
                  </p>
                )}
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase text-slate-400">Delivery Address</p>
                <p className="text-slate-700 font-medium flex items-start gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#16a34a] shrink-0 mt-0.5" />
                  <span>{formatAddress(selectedOrder.shipping_address)}</span>
                </p>
                {selectedOrder.delivery_window && (
                  <p className="text-[11px] text-slate-500">Window: {selectedOrder.delivery_window}</p>
                )}
                {selectedOrder.delivery_instructions && (
                  <p className="text-[11px] text-amber-700 font-medium">
                    Note: {selectedOrder.delivery_instructions}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-slate-900">Items ({selectedOrder.items.length})</p>
              <div className="border border-slate-200 rounded-2xl divide-y divide-slate-100">
                {selectedOrder.items.map((it) => (
                  <div key={it.id} className="p-3 flex items-center justify-between text-xs">
                    <div>
                      <p className="font-bold text-slate-900">{it.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {it.quantity} × {formatPrice(it.price)} ({it.unit})
                      </p>
                    </div>
                    <span className="font-extrabold text-slate-900">{formatPrice(it.total_price)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-100 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Store Subtotal</span>
                <span className="font-bold text-slate-900">{formatPrice(selectedOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between text-rose-600">
                <span>Platform Commission ({Math.round(selectedOrder.commission_rate * 100)}%)</span>
                <span className="font-bold">-{formatPrice(selectedOrder.platform_fee_amount)}</span>
              </div>
              <div className="flex justify-between pt-1.5 border-t border-emerald-200/70 font-extrabold text-sm text-[#14532d]">
                <span>Net Vendor Payout</span>
                <span>{formatPrice(selectedOrder.vendor_payout_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Order ID</th>
              <th className="py-3 px-6">Customer & Address</th>
              <th className="py-3 px-6">Groceries Manifest</th>
              <th className="py-3 px-6">Subtotal</th>
              <th className="py-3 px-6">Stage</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading orders...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No orders match your filter.
                </td>
              </tr>
            ) : (
              filtered.map((o) => (
                <tr key={o.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-bold text-slate-900">
                    {o.order_number}
                    <p className="text-[10px] text-slate-400 font-normal">
                      {new Date(o.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-900">{o.customer_name}</p>
                    <p className="text-[11px] text-slate-400 max-w-[200px] truncate">
                      {formatAddress(o.shipping_address)}
                    </p>
                  </td>
                  <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                    {o.items.length > 0
                      ? o.items.map((it) => `${it.quantity}x ${it.name}`).join(", ")
                      : "Items recorded"}
                  </td>
                  <td className="py-4 px-6 font-extrabold text-slate-900">{formatPrice(o.subtotal)}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                        o.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : o.status === "accepted" || o.status === "preparing"
                          ? "bg-blue-100 text-blue-800"
                          : o.status === "ready" || o.status === "dispatched"
                          ? "bg-purple-100 text-purple-800"
                          : o.status === "rejected" || o.status === "cancelled"
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600"
                        title="View order details"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>

                      {loadingId === o.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                      ) : (
                        <>
                          {o.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleStatusChange(o.id, "accepted")}
                                className="px-2.5 py-1.5 rounded-lg bg-[#16a34a] hover:bg-[#14532d] text-white font-bold text-xs flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" /> Accept
                              </button>
                              <button
                                onClick={() => handleStatusChange(o.id, "rejected")}
                                className="px-2 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs"
                                title="Reject order"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                          {o.status === "accepted" && (
                            <button
                              onClick={() => handleStatusChange(o.id, "preparing")}
                              className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                            >
                              Pack Order
                            </button>
                          )}
                          {o.status === "preparing" && (
                            <button
                              onClick={() => handleStatusChange(o.id, "ready")}
                              className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
                            >
                              Ready for Pickup
                            </button>
                          )}
                          {o.status === "ready" && (
                            <button
                              onClick={() => handleStatusChange(o.id, "dispatched")}
                              className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
                            >
                              Dispatch Courier
                            </button>
                          )}
                          {o.status === "dispatched" && (
                            <button
                              onClick={() => handleStatusChange(o.id, "completed")}
                              className="px-3 py-1.5 rounded-lg bg-[#16a34a] hover:bg-[#14532d] text-white font-bold text-xs"
                            >
                              Mark Completed
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
