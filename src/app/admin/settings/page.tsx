"use client";

import { useState, useEffect, useCallback } from "react";
import { Save, Loader2, Sliders, RefreshCw } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import {
  getPlatformSettings,
  savePlatformSettings,
  applyCommissionToStores,
} from "@/lib/actions/admin";
import { FeedbackBanner } from "../_components/AdminUI";

export default function AdminSettingsPage() {
  const user = useAuthStore((s) => s.user);
  const [values, setValues] = useState({
    commission_rate: "8",
    service_fee: "1.99",
    delivery_fee: "2.99",
    min_order: "15",
    payout_fee_pct: "1",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getPlatformSettings(user.id);
    if (res.success && res.data) {
      setValues((prev) => ({ ...prev, ...res.data }));
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to load settings." });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setSaving(true);
    const res = await savePlatformSettings(user.id, values);
    if (res.success) {
      setFeedback({ type: "success", message: "Platform settings saved to Supabase." });
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to save settings." });
    }
    setSaving(false);
  };

  const handleApplyAll = async () => {
    if (!user?.id) return;
    setApplying(true);
    const rate = Number(values.commission_rate);
    const res = await applyCommissionToStores(user.id, rate);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `Applied ${rate}% commission rate to all stores.`,
      });
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to update stores." });
    }
    setApplying(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Platform Settings & Fee Rules
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure marketplace commission rates, service fees, delivery minimums, and ACH payout fees.
        </p>
      </div>

      <FeedbackBanner feedback={feedback} onClear={() => setFeedback(null)} />

      {loading ? (
        <div className="bg-white p-10 rounded-3xl border border-slate-200/80 text-center text-xs text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
          Loading settings...
        </div>
      ) : (
        <form
          onSubmit={handleSave}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5 text-xs"
        >
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Sliders className="w-4 h-4 text-purple-600" />
            <h2 className="text-sm font-bold text-slate-900">Marketplace Economics</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Default Commission Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="50"
                required
                value={values.commission_rate}
                onChange={(e) => setValues({ ...values, commission_rate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                ACH Payout Fee (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="20"
                required
                value={values.payout_fee_pct}
                onChange={(e) => setValues({ ...values, payout_fee_pct: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Platform Service Fee ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={values.service_fee}
                onChange={(e) => setValues({ ...values, service_fee: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Default Delivery Fee ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={values.delivery_fee}
                onChange={(e) => setValues({ ...values, delivery_fee: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Minimum Order Subtotal ($)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={values.min_order}
                onChange={(e) => setValues({ ...values, min_order: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={handleApplyAll}
              disabled={applying}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${applying ? "animate-spin" : ""}`} />
              <span>Apply {values.commission_rate}% Commission to All Stores</span>
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              <span>Save Platform Settings</span>
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
