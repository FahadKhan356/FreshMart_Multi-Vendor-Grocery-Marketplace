"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { getAdminOrders, assignCourier, cancelOrder } from "@/lib/actions/admin";
import { Truck, Search, Loader2, X, Eye, Ban, MapPin } from "lucide-react";
import { FeedbackBanner } from "../_components/AdminUI";

const ORDER_STATUSES = [
  "all",
  "pending",
  "paid",
  "preparing",
  "ready_for_pickup",
  "out_for_delivery",
  "delivered",
  "cancelled",
];

export default function AdminOrdersPage() {
  const user = useAuthStore((s) => s.user);
  const [orders, setOrders] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [courierChoice, setCourierChoice] = useState<Record<string, string>>({});
  const [cancelReason, setCancelReason] = useState("");
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getAdminOrders(user.id);
    if (res.success && res.data) {
      setOrders(res.data.orders || []);
      setCouriers(res.data.couriers || []);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to load orders." });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId) || null;

  const handleAssignCourier = async (vendorOrderId: string) => {
    if (!user?.id) return;
    const cId = courierChoice[vendorOrderId];
    if (!cId) {
      setFeedback({ type: "error", message: "Select a courier first." });
      return;
    }
    setBusyKey(`assign-${vendorOrderId}`);
    const res = await assignCourier(user.id, vendorOrderId, cId);
    if (res.success) {
      setFeedback({ type: "success", message: "Courier assigned and delivery record updated." });
      await load();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to assign courier." });
    }
    setBusyKey(null);
  };

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedOrder) return;
    setBusyKey(`cancel-${selectedOrder.id}`);
    const res = await cancelOrder(user.id, selectedOrder.id, cancelReason);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `Order ${selectedOrder.order_number} cancelled.${res.data?.note || ""}`,
      });
      setCancelReason("");
      await load();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to cancel order." });
    }
    setBusyKey(null);
  };

  const filtered = orders.filter((o) => {
    if (statusFilter !== "all" && o.order_status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const storeNames = (o.vendor_orders || []).map((v: any) => v.stores?.name || "").join(" ");
      return (
        o.order_number?.toLowerCase().includes(q) ||
        o.customer?.full_name?.toLowerCase().includes(q) ||
        storeNames.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const activeCouriers = couriers.filter((c) => c.status !== "suspended");

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Platform Orders & Unified Dispatch
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Inspect multi-vendor orders, assign couriers to sub-orders, or cancel orders with automatic refund handling.
        </p>
      </div>

      <FeedbackBanner feedback={feedback} onClear={() => setFeedback(null)} />

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {ORDER_STATUSES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
                statusFilter === st
                  ? "bg-purple-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {st.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search order #, customer, store..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Order</th>
              <th className="py-3 px-6">Customer</th>
              <th className="py-3 px-6">Merchant(s)</th>
              <th className="py-3 px-6">Courier(s)</th>
              <th className="py-3 px-6">Total</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading orders...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  No orders found.
                </td>
              </tr>
            ) : (
              filtered.map((o) => {
                const storeList = (o.vendor_orders || []).map((v: any) => v.stores?.name).filter(Boolean);
                const courierList = (o.vendor_orders || [])
                  .map((v: any) => v.courier?.full_name)
                  .filter(Boolean);
                return (
                  <tr key={o.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {o.order_number}
                      <p className="text-[10px] text-slate-400 font-normal">
                        {new Date(o.created_at).toLocaleDateString()}
                      </p>
                    </td>
                    <td className="py-4 px-6 font-semibold text-slate-800">
                      {o.customer?.full_name || "Customer"}
                      <p className="text-[10px] text-slate-400 font-normal">{o.customer?.email}</p>
                    </td>
                    <td className="py-4 px-6 text-slate-700">
                      {storeList.length ? storeList.join(", ") : "—"}
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <div className="flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span>{courierList.length ? courierList.join(", ") : "Unassigned"}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-extrabold text-slate-900">
                      {formatPrice(Number(o.total_amount))}
                      <p className="text-[10px] font-semibold text-slate-400 capitalize">
                        {o.payment_status.replace(/_/g, " ")}
                      </p>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] capitalize ${
                          o.order_status === "cancelled"
                            ? "bg-rose-100 text-rose-800"
                            : o.order_status === "delivered"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-purple-100 text-purple-800"
                        }`}
                      >
                        {o.order_status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedOrderId(o.id);
                          const init: Record<string, string> = {};
                          for (const vo of o.vendor_orders || []) {
                            if (vo.courier_id) init[vo.id] = vo.courier_id;
                          }
                          setCourierChoice(init);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 hover:underline"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Order Details Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-slate-950/50 z-50 flex justify-end">
          <div className="bg-white w-full max-w-2xl h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">
                  Order {selectedOrder.order_number}
                </h2>
                <p className="text-xs text-slate-500">
                  Placed {new Date(selectedOrder.created_at).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedOrderId(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Parent Order Summary */}
            <div className="grid grid-cols-2 gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Customer</p>
                <p className="font-bold text-slate-900">{selectedOrder.customer?.full_name}</p>
                <p className="text-slate-500">{selectedOrder.customer?.email}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Totals & Payment</p>
                <p className="font-extrabold text-slate-900">
                  {formatPrice(Number(selectedOrder.total_amount))} ({selectedOrder.payment_status})
                </p>
                <p className="text-slate-500">
                  Subtotal {formatPrice(Number(selectedOrder.subtotal))} • Delivery{" "}
                  {formatPrice(Number(selectedOrder.delivery_fee))}
                </p>
              </div>
              <div className="col-span-2 flex items-start gap-2 pt-2 border-t border-slate-200/60">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <span className="text-slate-600">
                  {typeof selectedOrder.shipping_address === "string"
                    ? selectedOrder.shipping_address
                    : [
                        selectedOrder.shipping_address?.street || selectedOrder.shipping_address?.address,
                        selectedOrder.shipping_address?.city,
                        selectedOrder.shipping_address?.state,
                        selectedOrder.shipping_address?.zip,
                      ]
                        .filter(Boolean)
                        .join(", ") || "Customer address"}
                </span>
              </div>
            </div>

            {/* Sub-Orders */}
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Vendor Sub-Orders ({(selectedOrder.vendor_orders || []).length})
              </h3>
              {(selectedOrder.vendor_orders || []).map((vo: any) => (
                <div
                  key={vo.id}
                  className="p-4 rounded-2xl border border-slate-200 space-y-3 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-900">{vo.stores?.name || "Store"}</p>
                      <p className="text-[11px] text-slate-400">
                        Subtotal {formatPrice(Number(vo.subtotal))} • Fee{" "}
                        {formatPrice(Number(vo.platform_fee_amount))} • Vendor Payout{" "}
                        {formatPrice(Number(vo.vendor_payout_amount))}
                      </p>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px] capitalize">
                      {vo.status}
                    </span>
                  </div>

                  {/* Items */}
                  <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                    {(vo.items || []).map((it: any) => (
                      <div key={it.id} className="flex justify-between text-[11px]">
                        <span className="text-slate-700">
                          {it.quantity}× {it.name} ({it.unit})
                        </span>
                        <span className="font-bold text-slate-900">
                          {formatPrice(Number(it.total_price))}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Assign Courier */}
                  {selectedOrder.order_status !== "cancelled" &&
                    !["cancelled", "rejected", "completed"].includes(vo.status) && (
                      <div className="flex items-center gap-2 pt-1">
                        <select
                          value={courierChoice[vo.id] || vo.courier_id || ""}
                          onChange={(e) =>
                            setCourierChoice((prev) => ({ ...prev, [vo.id]: e.target.value }))
                          }
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white"
                        >
                          <option value="">Select courier...</option>
                          {activeCouriers.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.full_name} {c.vehicle ? `(${c.vehicle})` : ""}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          disabled={busyKey === `assign-${vo.id}`}
                          onClick={() => handleAssignCourier(vo.id)}
                          className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-50"
                        >
                          {busyKey === `assign-${vo.id}` ? "Saving..." : "Assign Courier"}
                        </button>
                      </div>
                    )}
                </div>
              ))}
            </div>

            {/* Cancel Order */}
            {!["delivered", "cancelled"].includes(selectedOrder.order_status) && (
              <form
                onSubmit={handleCancelOrder}
                className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-3"
              >
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs">
                  <Ban className="w-4 h-4" />
                  <span>Cancel Entire Order</span>
                </div>
                <input
                  required
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Cancellation reason (sent to customer)..."
                  className="w-full px-3 py-2 rounded-xl border border-rose-200 bg-white text-xs"
                />
                <button
                  type="submit"
                  disabled={busyKey === `cancel-${selectedOrder.id}`}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50"
                >
                  {busyKey === `cancel-${selectedOrder.id}` ? "Cancelling..." : "Cancel Order & Refund"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
