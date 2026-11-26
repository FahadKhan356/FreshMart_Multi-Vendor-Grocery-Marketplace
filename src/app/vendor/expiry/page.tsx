"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import { Hourglass, Zap, Edit, Loader2, X, Check } from "lucide-react";
import { useVendor } from "../VendorContext";
import { VendorProduct, getVendorProducts, getDaysUntilExpiry } from "@/lib/data/vendorData";
import { toggleProductFlashDiscount, updateProductBatchExpiry } from "@/lib/actions/products";

export default function VendorExpiryPage() {
  const { storeId, userId, refreshBadges } = useVendor();
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Batch edit modal
  const [editingItem, setEditingItem] = useState<VendorProduct | null>(null);
  const [batchNumber, setBatchNumber] = useState("");
  const [harvestDate, setHarvestDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [savingBatch, setSavingBatch] = useState(false);

  const loadProducts = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const prods = await getVendorProducts(storeId);
      setProducts(prods);
    } catch (err) {
      console.error("Failed to load expiry tracker:", err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const handleFlashDiscount = async (p: VendorProduct, percent: number) => {
    setActingId(p.id);
    setFeedback(null);
    const res = await toggleProductFlashDiscount(p.id, percent, userId);
    if (res.success) {
      setFeedback({
        type: "success",
        text:
          percent > 0
            ? `Applied -${percent}% Flash Harvest markdown to ${p.name}.`
            : `Removed flash markdown from ${p.name}.`,
      });
      await Promise.all([loadProducts(), refreshBadges()]);
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update markdown." });
    }
    setActingId(null);
  };

  const openBatchModal = (p: VendorProduct) => {
    setEditingItem(p);
    setBatchNumber(p.batch_number || "");
    setHarvestDate(p.harvest_date || "");
    setExpiryDate(p.expiry_date || "");
  };

  const handleSaveBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setSavingBatch(true);
    setFeedback(null);
    const res = await updateProductBatchExpiry(
      editingItem.id,
      { batchNumber, harvestDate, expiryDate },
      userId
    );
    if (res.success) {
      setEditingItem(null);
      setFeedback({ type: "success", text: `Updated batch & expiry dates for ${editingItem.name}.` });
      await Promise.all([loadProducts(), refreshBadges()]);
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to save batch details." });
    }
    setSavingBatch(false);
  };

  // Sort by soonest expiry first
  const sortedProducts = [...products].sort((a, b) => {
    const da = getDaysUntilExpiry(a.expiry_date);
    const db = getDaysUntilExpiry(b.expiry_date);
    if (da === null && db === null) return 0;
    if (da === null) return 1;
    if (db === null) return -1;
    return da - db;
  });

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
          Eliminate food waste by managing batch lot numbers and triggering Flash Harvest markdowns on near-expiry produce.
        </p>
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

      {/* Batch Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-base text-slate-900">
                Edit Batch & Expiry: {editingItem.name}
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveBatch} className="space-y-3 text-xs font-bold">
              <div>
                <label className="text-slate-600 block mb-1">Batch / Lot Number</label>
                <input
                  type="text"
                  value={batchNumber}
                  onChange={(e) => setBatchNumber(e.target.value)}
                  placeholder="e.g. LOT-B77777"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Harvest / Pack Date</label>
                <input
                  type="text"
                  value={harvestDate}
                  onChange={(e) => setHarvestDate(e.target.value)}
                  placeholder="e.g. Nov 24, 2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Expiry / Best-By Date</label>
                <input
                  type="text"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  placeholder="e.g. Nov 29, 2026"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>
              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  disabled={savingBatch}
                  className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#14532d] text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  {savingBatch ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Batch Info</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Expiry Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Perishable Item & Lot</th>
              <th className="py-3 px-6">Harvest Date</th>
              <th className="py-3 px-6">Peak Freshness Countdown</th>
              <th className="py-3 px-6">Remaining Units</th>
              <th className="py-3 px-6">Smart Flash Discount</th>
              <th className="py-3 px-6 text-right">Markdown Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading perishable batches...
                </td>
              </tr>
            ) : sortedProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No products found for this store.
                </td>
              </tr>
            ) : (
              sortedProducts.map((item) => {
                const days = getDaysUntilExpiry(item.expiry_date);
                const urgency =
                  days === null ? "none" : days <= 2 ? "high" : days <= 5 ? "medium" : "good";
                const isFlash = item.markdown_percent > 0 || Boolean(item.discount_badge);

                return (
                  <tr key={item.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6">
                      <p className="font-bold text-slate-900">{item.name}</p>
                      <p className="text-[11px] text-slate-400">
                        Batch: {item.batch_number || "Unassigned"}
                      </p>
                    </td>
                    <td className="py-4 px-6 text-slate-500">{item.harvest_date || "—"}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                          urgency === "high"
                            ? "bg-rose-100 text-rose-700 font-extrabold"
                            : urgency === "medium"
                            ? "bg-amber-100 text-amber-800"
                            : urgency === "good"
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-slate-100 text-slate-500"
                        }`}
                      >
                        {item.expiry_date
                          ? `${item.expiry_date}${
                              days !== null ? ` (${days <= 0 ? "Due today" : `In ${days}d`})` : ""
                            }`
                          : "No expiry set"}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-extrabold text-slate-900">{item.stock} units</td>
                    <td className="py-4 px-6">
                      {isFlash ? (
                        <span className="text-xs font-bold text-[#16a34a] flex items-center gap-1">
                          <Zap className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                          {formatPrice(item.price)}
                          {item.original_price ? (
                            <span className="text-slate-400 line-through font-normal ml-1">
                              {formatPrice(item.original_price)}
                            </span>
                          ) : null}
                          <span className="ml-1 text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-full">
                            -{item.markdown_percent}%
                          </span>
                        </span>
                      ) : (
                        <span className="text-slate-500 font-medium">
                          Standard: {formatPrice(item.price)}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openBatchModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          title="Edit batch & dates"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {actingId === item.id ? (
                          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        ) : isFlash ? (
                          <button
                            onClick={() => handleFlashDiscount(item, 0)}
                            className="px-3 py-1.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                          >
                            Clear Markdown
                          </button>
                        ) : (
                          <div className="flex items-center gap-1">
                            {[20, 35].map((pct) => (
                              <button
                                key={pct}
                                onClick={() => handleFlashDiscount(item, pct)}
                                className="px-2.5 py-1.5 rounded-xl font-bold text-xs bg-slate-100 text-slate-700 hover:bg-amber-100 hover:text-amber-900 transition-colors"
                              >
                                -{pct}% Deal
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
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
