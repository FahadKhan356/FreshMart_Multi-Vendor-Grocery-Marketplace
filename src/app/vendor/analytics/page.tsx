"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useVendor } from "../VendorContext";
import { VendorOrderRow, getVendorOrders } from "@/lib/data/vendorData";

export default function VendorAnalyticsPage() {
  const { store, storeId } = useVendor();
  const [orders, setOrders] = useState<VendorOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState<"7d" | "30d" | "all">("30d");

  const loadAnalytics = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const data = await getVendorOrders(storeId);
      setOrders(data);
    } catch (err) {
      console.error("Failed to load analytics:", err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const now = Date.now();
  const cutoffMs =
    range === "7d" ? 7 * 86400000 : range === "30d" ? 30 * 86400000 : Infinity;

  const filteredOrders = orders.filter((o) => {
    if (["rejected", "cancelled"].includes(o.status)) return false;
    if (cutoffMs === Infinity) return true;
    return now - new Date(o.created_at).getTime() <= cutoffMs;
  });

  const grossSales = filteredOrders.reduce((acc, o) => acc + o.subtotal, 0);
  const commissionRate = store?.commission_rate ?? 0.08;
  const totalFee = filteredOrders.reduce((acc, o) => acc + o.platform_fee_amount, 0);
  const netPayout = filteredOrders.reduce((acc, o) => acc + o.vendor_payout_amount, 0);

  // Build 7-day sales breakdown
  const days: { key: string; label: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    const label = i === 0 ? "Today" : d.toLocaleDateString("en-US", { weekday: "short" });
    days.push({ key, label, amount: 0 });
  }
  for (const o of orders) {
    if (["rejected", "cancelled"].includes(o.status)) continue;
    const key = new Date(o.created_at).toISOString().slice(0, 10);
    const bucket = days.find((d) => d.key === key);
    if (bucket) bucket.amount += o.subtotal;
  }
  const maxDayAmount = Math.max(...days.map((d) => d.amount), 1);

  // Top products
  const prodMap = new Map<string, { name: string; units: number; revenue: number }>();
  for (const o of filteredOrders) {
    for (const it of o.items) {
      const key = it.product_id || it.name;
      const prev = prodMap.get(key);
      if (prev) {
        prev.units += it.quantity;
        prev.revenue += it.total_price;
      } else {
        prodMap.set(key, { name: it.name, units: it.quantity, revenue: it.total_price });
      }
    }
  }
  const topProducts = Array.from(prodMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return (
    <div className="space-y-8 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Sales Analytics & Revenue Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time GMV volume, {Math.round(commissionRate * 100)}% commission splits, and product performance.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-white p-1 rounded-xl border border-slate-200 self-start">
          {(["7d", "30d", "all"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                range === r ? "bg-[#16a34a] text-white" : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              {r === "7d" ? "Last 7 Days" : r === "30d" ? "Last 30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200/80">
          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
          Computing store analytics...
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Gross Merchandise Value
              </span>
              <p className="text-3xl font-extrabold text-slate-900">{formatPrice(grossSales)}</p>
              <span className="text-xs font-bold text-[#16a34a] flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> {filteredOrders.length} active orders
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Platform Commission ({Math.round(commissionRate * 100)}%)
              </span>
              <p className="text-3xl font-extrabold text-rose-600">-{formatPrice(totalFee)}</p>
              <span className="text-xs text-slate-400">Marketplace fulfillment & payment fee</span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Net Merchant Revenue
              </span>
              <p className="text-3xl font-extrabold text-[#14532d]">{formatPrice(netPayout)}</p>
              <span className="text-xs font-bold text-slate-600">Credited to vendor balance</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">
                Daily Revenue Breakdown (Last 7 Days)
              </h3>
              <div className="grid grid-cols-7 gap-3 pt-6 items-end h-52">
                {days.map((bar) => {
                  const pct = bar.amount > 0 ? Math.max(12, Math.round((bar.amount / maxDayAmount) * 100)) : 4;
                  return (
                    <div key={bar.key} className="flex flex-col items-center gap-2 h-full justify-end">
                      <span className="text-[10px] font-bold text-slate-500">
                        {formatPrice(bar.amount)}
                      </span>
                      <div
                        style={{ height: `${pct}%` }}
                        className={`w-full rounded-t-xl transition-all ${
                          bar.amount > 0
                            ? "bg-[#16a34a] hover:bg-[#14532d]"
                            : "bg-slate-100"
                        }`}
                      />
                      <span className="text-[11px] font-bold text-slate-600">{bar.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
              <h3 className="font-bold text-sm text-slate-900">Top Products by Revenue</h3>
              {topProducts.length === 0 ? (
                <p className="text-xs text-slate-400 py-8 text-center">
                  No product sales recorded in this period.
                </p>
              ) : (
                <div className="space-y-3">
                  {topProducts.map((tp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{tp.name}</p>
                        <p className="text-[11px] text-slate-400">{tp.units} units sold</p>
                      </div>
                      <span className="font-extrabold text-[#14532d]">
                        {formatPrice(tp.revenue)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
