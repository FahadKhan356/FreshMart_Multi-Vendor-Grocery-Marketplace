"use client";

import { useState, useEffect } from "react";
import { PRODUCTS, Product } from "@/data/mockData";
import { getLiveProducts } from "@/lib/data/supabaseData";
import { updateProductStock } from "@/lib/actions/products";
import { formatPrice } from "@/lib/utils";
import { AlertTriangle, Boxes, Check, Search, Sliders } from "lucide-react";

export default function VendorInventoryPage() {
  const [stockLevels, setStockLevels] = useState<any[]>(
    PRODUCTS.map((p) => ({ ...p, isAvailable: p.stock > 0 }))
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInventory() {
      try {
        const live = await getLiveProducts({ storeId: "a1111111-1111-1111-1111-111111111111" });
        if (live && live.length > 0) {
          setStockLevels(live.map((p) => ({ ...p, isAvailable: p.stock > 0 })));
        }
      } catch (err) {
        console.error("Failed to load live inventory:", err);
      } finally {
        setLoading(false);
      }
    }
    loadInventory();
  }, []);

  const toggleAvailability = async (id: string) => {
    const target = stockLevels.find((s) => s.id === id);
    if (!target) return;
    const newStatus = !target.isAvailable;
    
    setStockLevels((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isAvailable: newStatus } : item
      )
    );

    try {
      await updateProductStock(id, target.stock, newStatus);
    } catch (err) {
      console.warn("Stock update fallback:", err);
    }
  };


  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventory & Stock Thresholds
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor perishable buffer stock, update unit availability, and configure automated stockout triggers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 font-bold text-xs border border-rose-200">
            2 SKUs below buffer threshold
          </span>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Produce Item</th>
              <th className="py-3 px-6">Current Stock</th>
              <th className="py-3 px-6">Buffer Alert Level</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Online Toggle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {stockLevels.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/50">
                <td className="py-4 px-6 flex items-center gap-3">
                  <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                  <div>
                    <p className="font-bold text-slate-900">{item.name}</p>
                    <p className="text-[11px] text-slate-400">{item.unit}</p>
                  </div>
                </td>
                <td className="py-4 px-6 font-extrabold text-slate-900">{item.stock} units</td>
                <td className="py-4 px-6 text-slate-500 font-medium">Alert if &lt; 15 units</td>
                <td className="py-4 px-6">
                  {item.stock < 15 ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                      Low Stock Warning
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                      Optimal Buffer
                    </span>
                  )}
                </td>
                <td className="py-4 px-6 text-right">
                  <button
                    onClick={() => toggleAvailability(item.id)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                      item.isAvailable
                        ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                        : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                    }`}
                  >
                    {item.isAvailable ? "Available In Store" : "Marked Out of Stock"}
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
