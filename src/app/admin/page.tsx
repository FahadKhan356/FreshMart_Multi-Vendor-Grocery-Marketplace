"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  TrendingUp,
  ShieldCheck,
  RefreshCw,
  Loader2,
  Store,
  Bike,
  Users,
  ShoppingBag,
  Receipt,
  Package,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { getAdminOverview } from "@/lib/actions/admin";
import { FeedbackBanner } from "./_components/AdminUI";

export default function AdminOverviewPage() {
  const user = useAuthStore((s) => s.user);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getAdminOverview(user.id);
    if (res.success && res.data) {
      setData(res.data);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to load platform overview." });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const maxGmv = Math.max(1, ...(data?.chart || []).map((d: any) => Number(d.gmv || 0)));

  return (
    <div className="space-y-8 max-w-7xl">
      <FeedbackBanner feedback={feedback} onClear={() => setFeedback(null)} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Platform Master Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {data
              ? `Live network overview across ${data.vendors} approved merchants, ${data.couriers} active couriers, and ${data.customers} customers.`
              : "Loading live FreshMart network metrics..."}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={load}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <Link
            href="/admin/vendors"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>
              {data ? `${data.pendingVendors} Pending KYC Audits` : "KYC Audits"}
            </span>
          </Link>
        </div>
      </div>

      {loading && !data ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
          <span>Loading live platform metrics...</span>
        </div>
      ) : (
        <>
          {/* 4 Primary Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Platform GMV
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {formatPrice(data?.gmv || 0)}
              </p>
              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> Paid Revenue: {formatPrice(data?.revenue || 0)}
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Platform Commission
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-purple-700">
                {formatPrice(data?.commission || 0)}
              </p>
              <span className="text-[11px] text-slate-400">
                From {data?.totalOrders || 0} total orders
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Grocery Stores
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {data?.vendors || 0} Stores
              </p>
              <span className="text-[11px] text-amber-600 font-bold">
                {data?.pendingVendors || 0} pending KYC review
              </span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Delivery Fleet
              </span>
              <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                {data?.couriers || 0} Couriers
              </p>
              <span className="text-[11px] text-slate-400">
                Delivered rate: {data?.deliveredRate || 0}%
              </span>
            </div>
          </div>

          {/* Secondary Operational KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              href="/admin/customers"
              className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-purple-300 transition-colors flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Customers</p>
                <p className="text-base font-extrabold text-slate-900">{data?.customers || 0}</p>
              </div>
            </Link>

            <Link
              href="/admin/orders"
              className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-purple-300 transition-colors flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Total Orders</p>
                <p className="text-base font-extrabold text-slate-900">{data?.totalOrders || 0}</p>
              </div>
            </Link>

            <Link
              href="/admin/refunds"
              className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-purple-300 transition-colors flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Open Refunds</p>
                <p className="text-base font-extrabold text-slate-900">{data?.pendingRefunds || 0}</p>
              </div>
            </Link>

            <Link
              href="/admin/products"
              className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-purple-300 transition-colors flex items-center gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">Pending Products</p>
                <p className="text-base font-extrabold text-slate-900">{data?.pendingProducts || 0}</p>
              </div>
            </Link>
          </div>

          {/* 14-Day GMV Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-slate-900">14-Day Platform GMV & Order Volume</h3>
                <p className="text-[11px] text-slate-400">Excludes cancelled orders</p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                Claim Rate: {data?.claimRate || 0}%
              </span>
            </div>
            <div className="h-44 flex items-end gap-2 pt-4">
              {(data?.chart || []).map((day: any) => {
                const pct = Math.max(4, Math.round((Number(day.gmv || 0) / maxGmv) * 100));
                return (
                  <div key={day.key} className="flex-1 flex flex-col items-center gap-1.5 group">
                    <div className="w-full flex items-end justify-center h-32">
                      <div
                        title={`${day.label}: ${formatPrice(day.gmv)} (${day.orders} orders)`}
                        style={{ height: `${day.gmv > 0 ? pct : 4}%` }}
                        className={`w-full max-w-[32px] rounded-t-lg transition-all ${
                          day.gmv > 0
                            ? "bg-purple-600 group-hover:bg-purple-700"
                            : "bg-slate-100"
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-medium truncate max-w-full">
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live Platform Activity & Recent Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Recent Grocery Vendors</h3>
                <Link href="/admin/vendors" className="text-xs font-bold text-purple-600 hover:underline">
                  Review KYC Queue →
                </Link>
              </div>

              <div className="space-y-3">
                {(data?.recentStores || []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No stores registered yet.</p>
                ) : (
                  (data?.recentStores || []).map((v: any) => (
                    <div
                      key={v.id}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                          <Store className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{v.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {(v.tags || []).join(", ") || "Grocery"} •{" "}
                            {new Date(v.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] capitalize ${
                          v.status === "pending_review"
                            ? "bg-amber-100 text-amber-800"
                            : v.status === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {v.status.replace("_", " ")}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900">Recent Platform Orders</h3>
                <Link href="/admin/orders" className="text-xs font-bold text-purple-600 hover:underline">
                  All Orders →
                </Link>
              </div>
              <div className="space-y-3">
                {(data?.recentOrders || []).length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center">No orders placed yet.</p>
                ) : (
                  (data?.recentOrders || []).map((o: any) => (
                    <div
                      key={o.id}
                      className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{o.order_number}</p>
                        <p className="text-[11px] text-slate-400">
                          {new Date(o.created_at).toLocaleDateString()} • {o.order_status.replace(/_/g, " ")}
                        </p>
                      </div>
                      <span className="font-extrabold text-slate-900">
                        {formatPrice(Number(o.total_amount))}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
