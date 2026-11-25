"use client";

import { useState } from "react";
import { Check, X, ShieldCheck, AlertCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function AdminRefundsPage() {
  const [claims, setClaims] = useState([
    {
      id: "REF-4418",
      orderId: "ORD-94821",
      customer: "Sarah Jenkins",
      store: "GreenField Organic",
      item: "Organic Hass Avocados (4-pack)",
      amount: 4.99,
      reason: "Bruised in transit (Sub-4°C OK, mechanical impact)",
      status: "Approved",
    },
    {
      id: "REF-4412",
      orderId: "ORD-88219",
      customer: "David Miller",
      store: "Valley Fresh Butcher",
      item: "Atlantic Salmon Fillet (1 lb)",
      amount: 14.99,
      reason: "Packaging seal broken",
      status: "Under Review",
    },
  ]);

  const handleResolve = (id: string, action: string) => {
    setClaims((prev) =>
      prev.map((c) => (c.id === id ? { ...c, status: action } : c))
    );
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Refund Claims & Dispute Center
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Audited Freshness Guarantee reimbursement claims between customers and organic merchants.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Claim ID</th>
              <th className="py-3 px-6">Customer & Order</th>
              <th className="py-3 px-6">Merchant</th>
              <th className="py-3 px-6">Produce Item & Reason</th>
              <th className="py-3 px-6">Amount</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {claims.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/50">
                <td className="py-4 px-6 font-bold text-slate-900">{c.id}</td>
                <td className="py-4 px-6 font-semibold text-slate-800">
                  {c.customer}
                  <p className="text-[10px] text-slate-400 font-normal">{c.orderId}</p>
                </td>
                <td className="py-4 px-6 text-slate-600">{c.store}</td>
                <td className="py-4 px-6">
                  <p className="font-bold text-slate-900">{c.item}</p>
                  <p className="text-[11px] text-slate-400">{c.reason}</p>
                </td>
                <td className="py-4 px-6 font-extrabold text-slate-900">{formatPrice(c.amount)}</td>
                <td className="py-4 px-6">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    c.status === "Approved" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800 animate-pulse"
                  }`}>
                    {c.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  {c.status === "Under Review" ? (
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleResolve(c.id, "Approved")}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleResolve(c.id, "Rejected")}
                        className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold text-xs"
                      >
                        Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">Reimbursed</span>
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
