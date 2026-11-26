"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  DollarSign,
  ShoppingBag,
  Clock,
  AlertTriangle,
  TrendingUp,
  Check,
  X,
  Hourglass,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useVendor } from "./VendorContext";
import {
  VendorOrderRow,
  VendorProduct,
  getVendorOrders,
  getVendorProducts,
  getVendorBalanceRow,
} from "@/lib/data/vendorData";
import { updateVendorOrderStatus } from "@/lib/actions/orders";

export default function VendorDashboardOverview() {
  const { store, storeId, userId, nearExpiryCount, refreshBadges } = useVendor();
  const [orders, setOrders] = useState<VendorOrderRow[]>([]);
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [balance, setBalance] = useState({ available_balance: 0, pending_balance: 0, total_withdrawn: 0 });
  const [loading, setLoading] = useState(true);
  const [actingOrderId, setActingOrderId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadOverview = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const [ord, prods, bal] = await Promise.all([
        getVendorOrders(storeId),
        getVendorProducts(storeId),
        getVendorBalanceRow(storeId),
      ]);
      setOrders(ord);
      setProducts(prods);
      setBalance(bal);
    } catch (err) {
      console.error("Failed to load overview:", err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const handleOrderAction = async (orderId: string, nextStatus: string) => {
    setActingOrderId(orderId);
    setFeedback(null);
    const res = await updateVendorOrderStatus(orderId, nextStatus, userId);
    if (res.success) {
      setFeedback({ type: "success", text: `Order updated to ${nextStatus}.` });
      await Promise.all([loadOverview(), refreshBadges()]);
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update order." });
    }
    setActingOrderId(null);
  };

  const activeOrders = orders.filter((o) => !["rejected", "cancelled"].includes(o.status));
  const totalSales = activeOrders.reduce((acc, o) => acc + o.subtotal, 0);
  const avgBasket = activeOrders.length > 0 ? totalSales / activeOrders.length : 0;
  const activeQueueCount = orders.filter((o) => ["pending", "accepted", "preparing"].includes(o.status)).length;
  const lowStockProducts = products.filter((p) => p.stock <= p.low_stock_threshold);

  // Compute top selling products from real order_items
  const skuMap = new Map<string, { name: string; units: number; revenue: number; stock: number }>();
  for (const o of activeOrders) {
    for (const it of o.items) {
      const key = it.product_id || it.name;
      const existing = skuMap.get(key);
      const matchedProd = products.find((p) => p.id === it.product_id || p.name === it.name);
      if (existing) {
        existing.units += it.quantity;
        existing.revenue += it.total_price;
      } else {
        skuMap.set(key, {
          name: it.name,
          units: it.quantity,
          revenue: it.total_price,
          stock: matchedProd?.stock ?? 0,
        });
      }
    }
  }
  const topSkus = Array.from(skuMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 4);

  const commissionRate = store?.commission_rate ?? 0.08;
  const commissionFee = Math.round(totalSales * commissionRate * 100) / 100;
  const netSales = Math.round((totalSales - commissionFee) * 100) / 100;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Store Performance Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time fulfillment metrics for {store?.name || "your store"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/vendor/expiry"
            className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-100 transition-colors"
          >
            <Hourglass className="w-3.5 h-3.5 text-amber-600" />
            <span>{nearExpiryCount} Near-Expiry Items</span>
          </Link>
          <Link
            href="/vendor/products"
            className="px-4 py-2 rounded-xl bg-[#16a34a] hover:bg-[#14532d] text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all"
          >
            + Add New SKU
          </Link>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          {feedback.text}
        </div>
      )}

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Gross Store Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#16a34a] flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{formatPrice(totalSales)}</p>
            <p className="text-[11px] font-bold text-[#16a34a] mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Net after 8% fee: {formatPrice(netSales)}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Orders</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{activeOrders.length} Orders</p>
            <p className="text-[11px] font-bold text-slate-500 mt-1">
              Avg basket size: {formatPrice(avgBasket)}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Queue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{activeQueueCount} Active</p>
            <p className="text-[11px] font-bold text-amber-600 mt-1">
              Pending / Preparing fulfillment
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Low Stock Alert</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">{lowStockProducts.length} SKUs Low</p>
            <p className="text-[11px] font-bold text-rose-600 mt-1 truncate">
              {lowStockProducts.length > 0
                ? `${lowStockProducts[0].name} (${lowStockProducts[0].stock} left)`
                : "All stock levels healthy"}
            </p>
          </div>
        </div>
      </div>

      {/* Live Incoming Orders Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Incoming Orders Fulfillment Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">Accept order to begin packing and notify courier dispatch</p>
          </div>
          <Link href="/vendor/orders" className="text-xs font-bold text-[#16a34a] hover:underline">
            View All Orders →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Order ID</th>
                <th className="py-3 px-6">Customer</th>
                <th className="py-3 px-6">Produce Items</th>
                <th className="py-3 px-6">Amount</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                    Loading live store orders...
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400">
                    No orders found for this store yet.
                  </td>
                </tr>
              ) : (
                orders.slice(0, 6).map((order) => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-bold text-slate-900">{order.order_number}</td>
                    <td className="py-4 px-6 font-semibold text-slate-800">{order.customer_name}</td>
                    <td className="py-4 px-6 text-slate-600 max-w-xs truncate">
                      {order.items.length > 0
                        ? order.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")
                        : "Order items"}
                    </td>
                    <td className="py-4 px-6 font-extrabold text-slate-900">{formatPrice(order.subtotal)}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                          order.status === "pending"
                            ? "bg-amber-100 text-amber-800"
                            : order.status === "accepted" || order.status === "preparing"
                            ? "bg-blue-100 text-blue-800"
                            : order.status === "ready" || order.status === "dispatched"
                            ? "bg-purple-100 text-purple-800"
                            : order.status === "rejected" || order.status === "cancelled"
                            ? "bg-rose-100 text-rose-700"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {actingOrderId === order.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-auto" />
                      ) : order.status === "pending" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOrderAction(order.id, "accepted")}
                            className="px-3 py-1.5 rounded-lg bg-[#16a34a] hover:bg-[#14532d] text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                          >
                            <Check className="w-3 h-3" /> Accept
                          </button>
                          <button
                            onClick={() => handleOrderAction(order.id, "rejected")}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs"
                            aria-label="Reject order"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : order.status === "accepted" ? (
                        <button
                          onClick={() => handleOrderAction(order.id, "preparing")}
                          className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs"
                        >
                          Start Packing
                        </button>
                      ) : (
                        <Link href="/vendor/orders" className="text-[11px] text-[#16a34a] font-semibold hover:underline">
                          Manage →
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid: Top Selling SKUs & Balance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Top-Selling Store SKUs</h3>
          <div className="space-y-3">
            {topSkus.length === 0 ? (
              <p className="text-xs text-slate-400 py-4">No completed order items recorded yet.</p>
            ) : (
              topSkus.map((sku, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                >
                  <div>
                    <p className="font-bold text-slate-900">{sku.name}</p>
                    <p className="text-[11px] text-slate-400">
                      {sku.units} sold • Stock: {sku.stock} left
                    </p>
                  </div>
                  <span className="font-extrabold text-slate-900">{formatPrice(sku.revenue)}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900">Vendor Balance & Commission</h3>
            <Link href="/vendor/payouts" className="text-xs font-bold text-[#16a34a] hover:underline">
              Payouts →
            </Link>
          </div>
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Available for Withdrawal:</span>
              <span className="font-extrabold text-[#14532d]">{formatPrice(balance.available_balance)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Pending Settlement:</span>
              <span className="font-bold text-slate-900">{formatPrice(balance.pending_balance)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Platform Commission ({Math.round(commissionRate * 100)}%):</span>
              <span className="text-rose-600 font-bold">-{formatPrice(commissionFee)}</span>
            </div>
            <div className="pt-2 border-t border-emerald-200/60 flex justify-between items-baseline">
              <span className="font-bold text-xs text-slate-800">Total Withdrawn to Date:</span>
              <span className="text-lg font-extrabold text-[#16a34a]">{formatPrice(balance.total_withdrawn)}</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Destination: {store?.bank_name || "Chase Business Checking"} (•••• {store?.bank_account_last4 || "8821"})
          </p>
        </div>
      </div>
    </div>
  );
}
