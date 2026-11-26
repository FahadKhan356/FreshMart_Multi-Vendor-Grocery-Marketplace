"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Search, Loader2, X } from "lucide-react";
import { useVendor } from "../VendorContext";
import { VendorProduct, getVendorProducts } from "@/lib/data/vendorData";
import { updateProductStock } from "@/lib/actions/products";

interface EditableStock {
  stock: number;
  threshold: number;
  dirty: boolean;
}

export default function VendorInventoryPage() {
  const { storeId, userId } = useVendor();
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [edits, setEdits] = useState<Record<string, EditableStock>>({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [lowStockOnly, setLowStockOnly] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadInventory = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const live = await getVendorProducts(storeId);
      setProducts(live);
      const initialEdits: Record<string, EditableStock> = {};
      for (const p of live) {
        initialEdits[p.id] = {
          stock: p.stock,
          threshold: p.low_stock_threshold,
          dirty: false,
        };
      }
      setEdits(initialEdits);
    } catch (err) {
      console.error("Failed to load live inventory:", err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadInventory();
  }, [loadInventory]);

  const handleFieldChange = (id: string, field: "stock" | "threshold", value: number) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: Math.max(0, value),
        dirty: true,
      },
    }));
  };

  const handleSaveRow = async (p: VendorProduct) => {
    const edit = edits[p.id];
    if (!edit) return;
    setSavingId(p.id);
    setFeedback(null);
    const res = await updateProductStock(p.id, edit.stock, p.is_available, edit.threshold, userId);
    if (res.success) {
      setProducts((prev) =>
        prev.map((item) =>
          item.id === p.id
            ? { ...item, stock: edit.stock, low_stock_threshold: edit.threshold }
            : item
        )
      );
      setEdits((prev) => ({ ...prev, [p.id]: { ...edit, dirty: false } }));
      setFeedback({ type: "success", text: `Updated stock & alert threshold for ${p.name}.` });
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update stock." });
    }
    setSavingId(null);
  };

  const toggleAvailability = async (p: VendorProduct) => {
    const newStatus = !p.is_available;
    const currentStock = edits[p.id]?.stock ?? p.stock;
    const currentThreshold = edits[p.id]?.threshold ?? p.low_stock_threshold;
    setSavingId(p.id);
    setFeedback(null);
    const res = await updateProductStock(p.id, currentStock, newStatus, currentThreshold, userId);
    if (res.success) {
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, is_available: newStatus } : item))
      );
      setFeedback({
        type: "success",
        text: `${p.name} marked ${newStatus ? "Available In Store" : "Out of Stock"}.`,
      });
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update availability." });
    }
    setSavingId(null);
  };

  const lowStockCount = products.filter((p) => p.stock <= p.low_stock_threshold).length;

  const filtered = products.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() || p.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLow = !lowStockOnly || p.stock <= p.low_stock_threshold;
    return matchesSearch && matchesLow;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Inventory & Stock Thresholds
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitor perishable buffer stock, edit unit counts, and configure low-stock alert triggers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLowStockOnly(!lowStockOnly)}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs border transition-colors ${
              lowStockOnly
                ? "bg-rose-600 text-white border-rose-600"
                : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100"
            }`}
          >
            {lowStockCount} SKUs at/below threshold {lowStockOnly ? "(Filtered)" : ""}
          </button>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold border flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter inventory by product name..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Produce Item</th>
              <th className="py-3 px-6">Current Stock</th>
              <th className="py-3 px-6">Alert Threshold</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6">Save</th>
              <th className="py-3 px-6 text-right">Online Toggle</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading inventory...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No inventory items match your filter.
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const edit = edits[item.id] || {
                  stock: item.stock,
                  threshold: item.low_stock_threshold,
                  dirty: false,
                };
                const isLow = edit.stock <= edit.threshold;
                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 flex items-center gap-3">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{item.name}</p>
                        <p className="text-[11px] text-slate-400">{item.unit}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <input
                        type="number"
                        min={0}
                        value={edit.stock}
                        onChange={(e) => handleFieldChange(item.id, "stock", Number(e.target.value))}
                        className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-extrabold text-slate-900"
                        aria-label={`Stock for ${item.name}`}
                      />
                    </td>
                    <td className="py-4 px-6">
                      <input
                        type="number"
                        min={0}
                        value={edit.threshold}
                        onChange={(e) =>
                          handleFieldChange(item.id, "threshold", Number(e.target.value))
                        }
                        className="w-20 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700"
                        aria-label={`Threshold for ${item.name}`}
                      />
                    </td>
                    <td className="py-4 px-6">
                      {isLow ? (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                          Low Stock Warning
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                          Optimal Buffer
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => handleSaveRow(item)}
                        disabled={!edit.dirty || savingId === item.id}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-all ${
                          edit.dirty
                            ? "bg-[#16a34a] hover:bg-[#14532d] text-white shadow-xs"
                            : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        }`}
                      >
                        {savingId === item.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>Save</span>
                      </button>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={() => toggleAvailability(item)}
                        disabled={savingId === item.id}
                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all ${
                          item.is_available
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                            : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                        }`}
                      >
                        {item.is_available ? "Available In Store" : "Marked Out of Stock"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
