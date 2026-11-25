"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  DollarSign, 
  ShoppingBag, 
  Clock, 
  Package, 
  AlertTriangle, 
  TrendingUp, 
  Check, 
  X, 
  ArrowUpRight,
  ChevronRight,
  Eye,
  Hourglass
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function VendorDashboardOverview() {
  const [orders, setOrders] = useState([
    { id: "ORD-94821", customer: "Sarah Jenkins", items: "4 items (Avocados, Strawberries)", amount: 33.95, time: "3 mins ago", status: "New Pending" },
    { id: "ORD-94820", customer: "David Miller", items: "2 items (Olive Oil, Garlic)", amount: 21.50, time: "14 mins ago", status: "Preparing" },
    { id: "ORD-94818", customer: "Elena Rostova", items: "6 items (Greens, Tomatoes, Berries)", amount: 48.20, time: "28 mins ago", status: "Dispatched" },
    { id: "ORD-94815", customer: "Michael Chen", items: "1 item (Avocados 8-pack)", amount: 8.99, time: "45 mins ago", status: "Completed" },
  ]);

  const handleAccept = (id: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: "Preparing" } : o))
    );
  };

  const handleReject = (id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  };

  return (
    <div className="space-y-8 max-w-7xl">
      
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Store Performance Overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time fulfillment metrics for GreenField Organic Market
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/vendor/expiry"
            className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs flex items-center gap-1.5 hover:bg-amber-100 transition-colors"
          >
            <Hourglass className="w-3.5 h-3.5 text-amber-600" />
            <span>3 Near-Expiry Items</span>
          </Link>
          <Link
            href="/vendor/products"
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
          >
            + Add New SKU
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Sales</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">$1,482.50</p>
            <p className="text-[11px] font-bold text-emerald-600 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> +18.4% vs yesterday
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
            <p className="text-2xl font-extrabold text-slate-900">42 Orders</p>
            <p className="text-[11px] font-bold text-slate-500 mt-1">
              Avg basket size: $35.29
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Queue</span>
            <div className="w-8 h-8 rounded-lg bg-harvest-50 text-harvest-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <p className="text-2xl font-extrabold text-slate-900">4 Incoming</p>
            <p className="text-[11px] font-bold text-harvest-600 mt-1">
              Avg fulfillment: 8.2 mins
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
            <p className="text-2xl font-extrabold text-slate-900">2 SKUs Low</p>
            <p className="text-[11px] font-bold text-rose-600 mt-1">
              Strawberries (under 10 units)
            </p>
          </div>
        </div>
      </div>

      {/* Live Incoming Orders Table with Accept / Reject */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Incoming Orders Fulfillment Queue</h2>
            <p className="text-xs text-slate-500 mt-0.5">Accept order to trigger courier batch dispatch</p>
          </div>
          <Link href="/vendor/orders" className="text-xs font-bold text-blue-600 hover:underline">
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
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-bold text-slate-900">{order.id}</td>
                  <td className="py-4 px-6 font-semibold text-slate-800">{order.customer}</td>
                  <td className="py-4 px-6 text-slate-600">{order.items}</td>
                  <td className="py-4 px-6 font-extrabold text-slate-900">{formatPrice(order.amount)}</td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      order.status === "New Pending" ? "bg-amber-100 text-amber-800 animate-pulse" :
                      order.status === "Preparing" ? "bg-blue-100 text-blue-800" :
                      order.status === "Dispatched" ? "bg-purple-100 text-purple-800" :
                      "bg-emerald-100 text-emerald-800"
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {order.status === "New Pending" ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleAccept(order.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                        >
                          <Check className="w-3 h-3" /> Accept
                        </button>
                        <button
                          onClick={() => handleReject(order.id)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] text-slate-400 font-semibold">Ready for courier</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Grid: Top Selling SKUs & Weekly Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Top Selling Products */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Top-Selling Farm SKUs Today</h3>
          <div className="space-y-3">
            {[
              { name: "Organic Hass Avocados (4-pack)", units: "84 sold", revenue: "$419.16", stock: "45 left" },
              { name: "Sweet Driscoll Strawberries (1 lb)", units: "62 sold", revenue: "$278.38", stock: "8 left (Low)" },
              { name: "Cold-Pressed Extra Virgin Olive Oil", units: "29 sold", revenue: "$391.50", stock: "35 left" },
            ].map((sku, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <p className="font-bold text-slate-900">{sku.name}</p>
                  <p className="text-[11px] text-slate-400">{sku.units} • Stock: {sku.stock}</p>
                </div>
                <span className="font-extrabold text-slate-900">{sku.revenue}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Settlement Status */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Current Payout Period</h3>
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Gross Sales (Nov 18 - 25):</span>
              <span className="font-bold text-slate-900">$8,420.00</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-600">Platform Commission (8%):</span>
              <span className="text-rose-600 font-bold">-$673.60</span>
            </div>
            <div className="pt-2 border-t border-blue-200/60 flex justify-between items-baseline">
              <span className="font-bold text-xs text-slate-800">Net Merchant Transfer:</span>
              <span className="text-lg font-extrabold text-blue-700">$7,746.40</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400">
            Scheduled deposit into Chase Business Checking (•••• 8821) on Friday, Nov 27.
          </p>
        </div>

      </div>

    </div>
  );
}
