"use client";

import { useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Hourglass, AlertCircle, Zap, ShieldCheck, Check } from "lucide-react";

export default function VendorExpiryPage() {
  const [expiryItems, setExpiryItems] = useState([
    {
      id: "exp-1",
      name: "Sweet Driscoll Farms Strawberries (1 lb)",
      harvested: "Nov 23, 2026",
      expires: "Nov 27, 2026 (In 2 days)",
      stock: 14,
      originalPrice: 4.49,
      discountedPrice: 2.99,
      isFlashSale: true,
      urgency: "high",
    },
    {
      id: "exp-2",
      name: "Country Artisan Sourdough Boule",
      harvested: "Nov 25, 2026 (Dawn)",
      expires: "Nov 28, 2026 (In 3 days)",
      stock: 8,
      originalPrice: 6.25,
      discountedPrice: 4.50,
      isFlashSale: false,
      urgency: "medium",
    },
    {
      id: "exp-3",
      name: "Wild Caught Atlantic Salmon Fillet",
      harvested: "Nov 24, 2026",
      expires: "Nov 28, 2026 (In 3 days)",
      stock: 6,
      originalPrice: 14.99,
      discountedPrice: 10.99,
      isFlashSale: false,
      urgency: "medium",
    },
    {
      id: "exp-4",
      name: "Organic Hass Avocados (4-pack)",
      harvested: "Nov 22, 2026",
      expires: "Dec 04, 2026 (In 9 days)",
      stock: 45,
      originalPrice: 4.99,
      discountedPrice: 4.99,
      isFlashSale: false,
      urgency: "good",
    },
  ]);

  const toggleFlashSale = (id: string) => {
    setExpiryItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isFlashSale: !item.isFlashSale } : item
      )
    );
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 uppercase tracking-wider mb-1">
          <Hourglass className="w-3.5 h-3.5" />
          <span>Cold-Chain Perishable Quality Management</span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Batch Harvest & Expiry Countdown Tracker
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Eliminate food waste by triggering automated Flash Harvest discounts on near-expiry organic produce before shelf life lapses.
        </p>
      </div>

      {/* Expiry Cards */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Perishable Item</th>
              <th className="py-3 px-6">Harvest Date</th>
              <th className="py-3 px-6">Peak Freshness Countdown</th>
              <th className="py-3 px-6">Remaining Units</th>
              <th className="py-3 px-6">Smart Flash Discount</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {expiryItems.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="py-4 px-6 font-bold text-slate-900">{item.name}</td>
                <td className="py-4 px-6 text-slate-500">{item.harvested}</td>
                <td className="py-4 px-6">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    item.urgency === "high" ? "bg-rose-100 text-rose-700 font-extrabold animate-pulse" :
                    item.urgency === "medium" ? "bg-amber-100 text-amber-800" :
                    "bg-emerald-100 text-emerald-800"
                  }`}>
                    {item.expires}
                  </span>
                </td>
                <td className="py-4 px-6 font-extrabold text-slate-900">{item.stock} pkgs</td>
                <td className="py-4 px-6">
                  {item.isFlashSale ? (
                    <span className="text-xs font-bold text-fresh-600 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 fill-fresh-500 text-fresh-500" />
                      Active: {formatPrice(item.discountedPrice)} (Was {formatPrice(item.originalPrice)})
                    </span>
                  ) : (
                    <span className="text-slate-400 font-medium">Standard Price: {formatPrice(item.originalPrice)}</span>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => toggleFlashSale(item.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                      item.isFlashSale
                        ? "bg-amber-500 text-white shadow-sm"
                        : "bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-800"
                    }`}
                  >
                    {item.isFlashSale ? "Deactivate Flash Sale" : "Trigger Flash Deal"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
