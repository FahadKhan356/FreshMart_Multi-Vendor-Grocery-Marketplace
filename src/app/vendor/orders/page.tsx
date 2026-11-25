"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Check, X, Clock, ShoppingBag, Truck, CheckCircle2 } from "lucide-react";

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState([
    { id: "ORD-94821", customer: "Sarah Jenkins", address: "742 Evergreen Terr, Apt 4B", items: "Avocados (4-pk), Driscoll Strawberries (1 lb), Pasture Eggs", total: 33.95, status: "Pending", time: "10:14 AM" },
    { id: "ORD-94820", customer: "David Miller", address: "182 Bedford Ave, Brooklyn", items: "Cold-Pressed Olive Oil 500ml", total: 21.50, status: "Preparing", time: "10:02 AM" },
    { id: "ORD-94818", customer: "Elena Rostova", address: "310 Court St, Cobble Hill", items: "Organic Crisp Kale, Heirloom Tomatoes, Strawberries", total: 48.20, status: "Dispatched", time: "09:44 AM" },
    { id: "ORD-94815", customer: "Michael Chen", address: "95 5th Ave, Park Slope", items: "Organic Hass Avocados (8-pk bag)", total: 8.99, status: "Delivered", time: "09:15 AM" },
  ]);

  const updateStatus = (id: string, newStatus: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: newStatus } : o))
    );
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Orders & Fulfillment Center
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Process incoming grocery bags, accept or reject items, and trigger rapid courier dropoff.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Order ID</th>
              <th className="py-3 px-6">Customer & Address</th>
              <th className="py-3 px-6">Groceries Manifest</th>
              <th className="py-3 px-6">Amount</th>
              <th className="py-3 px-6">Fulfillment Stage</th>
              <th className="py-3 px-6 text-right">Update Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/50">
                <td className="py-4 px-6 font-bold text-slate-900">
                  {o.id}
                  <p className="text-[10px] text-slate-400 font-normal">{o.time}</p>
                </td>
                <td className="py-4 px-6">
                  <p className="font-bold text-slate-900">{o.customer}</p>
                  <p className="text-[11px] text-slate-400">{o.address}</p>
                </td>
                <td className="py-4 px-6 text-slate-600 max-w-xs">{o.items}</td>
                <td className="py-4 px-6 font-extrabold text-slate-900">{formatPrice(o.total)}</td>
                <td className="py-4 px-6">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    o.status === "Pending" ? "bg-amber-100 text-amber-800 animate-pulse" :
                    o.status === "Preparing" ? "bg-blue-100 text-blue-800" :
                    o.status === "Dispatched" ? "bg-purple-100 text-purple-800" :
                    "bg-emerald-100 text-emerald-800"
                  }`}>
                    {o.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  {o.status === "Pending" && (
                    <button
                      onClick={() => updateStatus(o.id, "Preparing")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                    >
                      Accept & Pack
                    </button>
                  )}
                  {o.status === "Preparing" && (
                    <button
                      onClick={() => updateStatus(o.id, "Dispatched")}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 text-white font-bold text-xs"
                    >
                      Hand to Courier
                    </button>
                  )}
                  {o.status === "Dispatched" && (
                    <span className="text-[11px] text-purple-600 font-bold">Courier In Transit</span>
                  )}
                  {o.status === "Delivered" && (
                    <span className="text-[11px] text-emerald-700 font-bold">Completed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
