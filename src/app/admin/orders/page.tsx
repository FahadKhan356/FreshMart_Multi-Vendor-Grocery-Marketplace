"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { SAMPLE_ORDERS } from "@/data/mockData";
import { ShoppingBag, Eye, Truck, CheckCircle2 } from "lucide-react";

export default function AdminOrdersPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Platform Orders & Unified Dispatch
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Live stream of all multi-vendor grocery orders across Brooklyn.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Order</th>
              <th className="py-3 px-6">Assigned Merchant(s)</th>
              <th className="py-3 px-6">Courier Partner</th>
              <th className="py-3 px-6">Order Total</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {SAMPLE_ORDERS.map((o) => (
              <tr key={o.id} className="hover:bg-slate-50/50">
                <td className="py-4 px-6 font-bold text-slate-900">
                  {o.id}
                  <p className="text-[10px] text-slate-400 font-normal">{o.date}</p>
                </td>
                <td className="py-4 px-6 font-semibold text-slate-800">{o.stores.join(", ")}</td>
                <td className="py-4 px-6 text-slate-600 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                  <span>{o.courierName}</span>
                </td>
                <td className="py-4 px-6 font-extrabold text-slate-900">{formatPrice(o.total)}</td>
                <td className="py-4 px-6">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {o.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  <span className="text-xs font-bold text-purple-600 hover:underline cursor-pointer">
                    Inspect Log
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
