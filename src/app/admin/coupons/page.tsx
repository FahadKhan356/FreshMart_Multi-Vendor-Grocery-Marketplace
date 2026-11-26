"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Loader2, X, Ticket } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { getAdminCoupons, saveCoupon, toggleCoupon, deleteCoupon } from "@/lib/actions/admin";
import { FeedbackBanner } from "../_components/AdminUI";

export default function AdminCouponsPage() {
  const user = useAuthStore((s) => s.user);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{
    id?: string;
    code: string;
    discount_type: "percent" | "fixed";
    value: string;
    min_order: string;
    usage_limit: string;
    expires_at: string;
    is_active: boolean;
  }>({
    code: "",
    discount_type: "percent",
    value: "10",
    min_order: "0",
    usage_limit: "",
    expires_at: "",
    is_active: true,
  });

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getAdminCoupons(user.id);
    if (res.success && res.data) {
      setCoupons(res.data);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to load coupons." });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setBusyId("save");
    const res = await saveCoupon(user.id, {
      id: form.id,
      code: form.code,
      discount_type: form.discount_type,
      value: Number(form.value),
      min_order: Number(form.min_order || 0),
      usage_limit: form.usage_limit ? Number(form.usage_limit) : null,
      expires_at: form.expires_at || null,
      is_active: form.is_active,
    });
    if (res.success) {
      setFeedback({ type: "success", message: form.id ? "Coupon updated." : "Coupon created." });
      setModalOpen(false);
      await load();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to save coupon." });
    }
    setBusyId(null);
  };

  const handleToggle = async (c: any) => {
    if (!user?.id) return;
    setBusyId(c.id);
    const res = await toggleCoupon(user.id, c.id, !c.is_active);
    if (res.success) {
      await load();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to toggle coupon." });
    }
    setBusyId(null);
  };

  const handleDelete = async (c: any) => {
    if (!user?.id) return;
    setBusyId(c.id);
    const res = await deleteCoupon(user.id, c.id);
    if (res.success) {
      setFeedback({ type: "success", message: `Coupon ${c.code} deleted.` });
      await load();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to delete coupon." });
    }
    setBusyId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Coupons & Promo Codes
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Create, activate, or expire checkout discount codes.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm({
              code: "",
              discount_type: "percent",
              value: "10",
              min_order: "0",
              usage_limit: "",
              expires_at: "",
              is_active: true,
            });
            setModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Coupon</span>
        </button>
      </div>

      <FeedbackBanner feedback={feedback} onClear={() => setFeedback(null)} />

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Code</th>
              <th className="py-3 px-6">Discount</th>
              <th className="py-3 px-6">Min Order</th>
              <th className="py-3 px-6">Usage</th>
              <th className="py-3 px-6">Expires</th>
              <th className="py-3 px-6">Active</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading coupons...
                </td>
              </tr>
            ) : coupons.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  No coupons created yet.
                </td>
              </tr>
            ) : (
              coupons.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-mono font-extrabold text-purple-700">
                    <span className="inline-flex items-center gap-1.5 bg-purple-50 px-2.5 py-1 rounded-lg">
                      <Ticket className="w-3.5 h-3.5" />
                      {c.code}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900">
                    {c.discount_type === "percent" ? `${c.value}% OFF` : `${formatPrice(Number(c.value))} OFF`}
                  </td>
                  <td className="py-4 px-6 text-slate-600">{formatPrice(Number(c.min_order || 0))}</td>
                  <td className="py-4 px-6 text-slate-600">
                    {c.used_count || 0} / {c.usage_limit ?? "∞"}
                  </td>
                  <td className="py-4 px-6 text-slate-500">
                    {c.expires_at ? new Date(c.expires_at).toLocaleDateString() : "No expiry"}
                  </td>
                  <td className="py-4 px-6">
                    <button
                      type="button"
                      disabled={busyId === c.id}
                      onClick={() => handleToggle(c)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        c.is_active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {c.is_active ? "Active" : "Paused"}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setForm({
                            id: c.id,
                            code: c.code,
                            discount_type: c.discount_type,
                            value: String(c.value),
                            min_order: String(c.min_order || 0),
                            usage_limit: c.usage_limit ? String(c.usage_limit) : "",
                            expires_at: c.expires_at ? String(c.expires_at).slice(0, 10) : "",
                            is_active: !!c.is_active,
                          });
                          setModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(c)}
                        className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                {form.id ? "Edit Coupon" : "New Coupon"}
              </h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Code</label>
                <input
                  required
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="FRESH20"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono uppercase"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Type</label>
                  <select
                    value={form.discount_type}
                    onChange={(e) =>
                      setForm({ ...form, discount_type: e.target.value as "percent" | "fixed" })
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="percent">Percent (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Value</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Min Order ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.min_order}
                    onChange={(e) => setForm({ ...form, min_order: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={form.usage_limit}
                    onChange={(e) => setForm({ ...form, usage_limit: e.target.value })}
                    placeholder="Unlimited"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Expires At</label>
                <input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyId === "save"}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-50"
              >
                {busyId === "save" ? "Saving..." : "Save Coupon"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
