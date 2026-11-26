"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, Search, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { getAdminProducts, moderateProduct } from "@/lib/actions/admin";
import { FeedbackBanner, refreshAdminCounts } from "../_components/AdminUI";

export default function AdminProductsPage() {
  const user = useAuthStore((s) => s.user);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [rejectTarget, setRejectTarget] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getAdminProducts(user.id);
    if (res.success && res.data) {
      setProducts(res.data);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to load products." });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (p: any) => {
    if (!user?.id) return;
    setBusyId(p.id);
    const res = await moderateProduct(user.id, p.id, "approved");
    if (res.success) {
      setFeedback({ type: "success", message: `"${p.name}" approved and published.` });
      await load();
      refreshAdminCounts();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to approve product." });
    }
    setBusyId(null);
  };

  const handleReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !rejectTarget) return;
    setBusyId(rejectTarget.id);
    const res = await moderateProduct(user.id, rejectTarget.id, "rejected", rejectReason);
    if (res.success) {
      setFeedback({ type: "success", message: `"${rejectTarget.name}" rejected.` });
      setRejectTarget(null);
      setRejectReason("");
      await load();
      refreshAdminCounts();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to reject product." });
    }
    setBusyId(null);
  };

  const filtered = products.filter((p) => {
    const st = p.approval_status || "approved";
    if (filter !== "all" && st !== filter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.name?.toLowerCase().includes(q) || p.stores?.name?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Product Moderation
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Approve or reject vendor catalog listings before they appear on the customer storefront.
        </p>
      </div>

      <FeedbackBanner feedback={feedback} onClear={() => setFeedback(null)} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {["all", "pending", "approved", "rejected"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize ${
                filter === st
                  ? "bg-purple-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search product or store..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Product</th>
              <th className="py-3 px-6">Store & Category</th>
              <th className="py-3 px-6">Price</th>
              <th className="py-3 px-6">Stock</th>
              <th className="py-3 px-6">Moderation</th>
              <th className="py-3 px-6 text-right">Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading products...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No products found.
                </td>
              </tr>
            ) : (
              filtered.map((p) => {
                const st = p.approval_status || "approved";
                return (
                  <tr key={p.id} className="hover:bg-slate-50/50">
                    <td className="py-4 px-6 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-9 h-9 rounded-lg object-cover bg-slate-100 shrink-0"
                        />
                        <span>{p.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-600">
                      <p className="font-semibold text-slate-800">{p.stores?.name || "Store"}</p>
                      <p className="text-[10px] text-slate-400">{p.categories?.name || p.category_id}</p>
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900">
                      {formatPrice(Number(p.price))} / {p.unit}
                    </td>
                    <td className="py-4 px-6 text-slate-700">{p.stock}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                          st === "approved"
                            ? "bg-emerald-100 text-emerald-800"
                            : st === "rejected"
                            ? "bg-rose-100 text-rose-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {st}
                      </span>
                      {p.rejection_reason && (
                        <p className="text-[10px] text-rose-600 mt-0.5 max-w-[160px] truncate">
                          {p.rejection_reason}
                        </p>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      {busyId === p.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-auto" />
                      ) : (
                        <div className="flex items-center justify-end gap-1.5">
                          {st !== "approved" && (
                            <button
                              type="button"
                              onClick={() => handleApprove(p)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Approve
                            </button>
                          )}
                          {st !== "rejected" && (
                            <button
                              type="button"
                              onClick={() => {
                                setRejectTarget(p);
                                setRejectReason("");
                              }}
                              className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center gap-1"
                            >
                              <X className="w-3 h-3" /> Reject
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {rejectTarget && (
        <div className="fixed inset-0 bg-slate-950/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleReject}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-extrabold text-slate-900">
              Reject &ldquo;{rejectTarget.name}&rdquo;
            </h3>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (sent to vendor)..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectTarget(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyId === rejectTarget.id}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs"
              >
                Confirm Reject
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
