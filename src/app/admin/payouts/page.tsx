"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import { Wallet, Check, CheckCircle2, X, Loader2 } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { getAdminPayouts } from "@/lib/actions/admin";
import {
  approveVendorPayout,
  markPayoutPaid,
  rejectVendorPayout,
  executeBatchStorePayout,
} from "@/lib/actions/payouts";
import { FeedbackBanner, refreshAdminCounts } from "../_components/AdminUI";

export default function AdminPayoutsPage() {
  const user = useAuthStore((s) => s.user);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [balances, setBalances] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getAdminPayouts(user.id);
    if (res.success && res.data) {
      setPayouts(res.data.payouts || []);
      setBalances(res.data.balances || []);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to load payouts." });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (id: string) => {
    if (!user?.id) return;
    setBusyId(id);
    const res = await approveVendorPayout(user.id, id);
    if (res.success) {
      setFeedback({ type: "success", message: "Payout approved and moved to processing." });
      await load();
      refreshAdminCounts();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to approve payout." });
    }
    setBusyId(null);
  };

  const handleMarkPaid = async (id: string) => {
    if (!user?.id) return;
    setBusyId(id);
    const res = await markPayoutPaid(user.id, id);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `Payout marked paid (Transfer Ref: ${res.transferRef}).`,
      });
      await load();
      refreshAdminCounts();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to mark payout paid." });
    }
    setBusyId(null);
  };

  const handleReject = async (id: string) => {
    if (!user?.id) return;
    setBusyId(id);
    const res = await rejectVendorPayout(user.id, id, "Declined by platform finance review.");
    if (res.success) {
      setFeedback({ type: "success", message: "Payout declined." });
      await load();
      refreshAdminCounts();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to decline payout." });
    }
    setBusyId(null);
  };

  const handleBatch = async () => {
    if (!user?.id) return;
    setBusyId("batch");
    const res = await executeBatchStorePayout(user.id);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `Executed batch ACH settlement for ${res.count} store(s).`,
      });
      await load();
      refreshAdminCounts();
    } else {
      setFeedback({ type: "error", message: res.error || "Batch payout failed." });
    }
    setBusyId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Vendor Payouts & Commission Settlement
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Approve merchant payout requests, mark ACH transfers as paid, or settle available store balances in batch.
          </p>
        </div>

        <button
          type="button"
          onClick={handleBatch}
          disabled={busyId === "batch"}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
        >
          {busyId === "batch" ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Wallet className="w-4 h-4" />
          )}
          <span>Execute Batch ACH Transfers</span>
        </button>
      </div>

      <FeedbackBanner feedback={feedback} onClear={() => setFeedback(null)} />

      {/* Payout Requests & History */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Payout Requests & History</h2>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Payout #</th>
              <th className="py-3 px-6">Merchant</th>
              <th className="py-3 px-6">Gross</th>
              <th className="py-3 px-6">Fee</th>
              <th className="py-3 px-6">Net Payout</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading payouts...
                </td>
              </tr>
            ) : payouts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  No payout records yet.
                </td>
              </tr>
            ) : (
              payouts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-bold text-slate-900">
                    {p.payout_number}
                    <p className="text-[10px] text-slate-400 font-normal">
                      {new Date(p.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-800">
                    {p.stores?.name || "Store"}
                    <p className="text-[10px] text-slate-400 font-mono">
                      Bank •••• {p.bank_account_last4 || "8821"}
                    </p>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900">{formatPrice(Number(p.amount))}</td>
                  <td className="py-4 px-6 font-bold text-purple-700">
                    {formatPrice(Number(p.platform_fee))}
                  </td>
                  <td className="py-4 px-6 font-extrabold text-emerald-700">
                    {formatPrice(Number(p.net_payout))}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-1 rounded-full font-bold text-[10px] capitalize ${
                        p.status === "completed"
                          ? "bg-emerald-100 text-emerald-800"
                          : p.status === "failed"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {busyId === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-auto" />
                    ) : p.status === "pending" ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleApprove(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" /> Approve
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMarkPaid(p.id)}
                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Mark Paid
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReject(p.id)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600"
                          title="Decline payout"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : p.status === "processing" ? (
                      <button
                        type="button"
                        onClick={() => handleMarkPaid(p.id)}
                        className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs"
                      >
                        Mark Paid
                      </button>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">
                        {p.stripe_transfer_id || "Settled"}
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Store Balances */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-900">Store Escrow Balances</h2>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Store</th>
              <th className="py-3 px-6">Available Balance</th>
              <th className="py-3 px-6">Pending Escrow</th>
              <th className="py-3 px-6">Total Withdrawn</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {balances.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/50">
                <td className="py-3.5 px-6 font-bold text-slate-900">
                  {b.store?.name || b.store_id}
                </td>
                <td className="py-3.5 px-6 font-extrabold text-emerald-700">
                  {formatPrice(Number(b.available_balance))}
                </td>
                <td className="py-3.5 px-6 font-semibold text-amber-700">
                  {formatPrice(Number(b.pending_balance))}
                </td>
                <td className="py-3.5 px-6 text-slate-600">
                  {formatPrice(Number(b.total_withdrawn))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
