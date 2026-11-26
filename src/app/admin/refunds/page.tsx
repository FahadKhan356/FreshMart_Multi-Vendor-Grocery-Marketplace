"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2, Eye, X, CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { getAdminRefunds, markRefundUnderReview } from "@/lib/actions/admin";
import { approveRefund, rejectRefund } from "@/lib/actions/refunds";
import { FeedbackBanner, refreshAdminCounts } from "../_components/AdminUI";

export default function AdminRefundsPage() {
  const user = useAuthStore((s) => s.user);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [approvedAmount, setApprovedAmount] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getAdminRefunds(user.id);
    if (res.success && res.data) {
      setClaims(res.data);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to load refund claims." });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const selected = claims.find((c) => c.id === selectedId) || null;

  const openClaim = (c: any) => {
    setSelectedId(c.id);
    setApprovedAmount(String(c.amount));
    setAdminNotes(c.admin_notes || "");
    setRejectionReason(c.rejection_reason || "");
  };

  const handleUnderReview = async () => {
    if (!user?.id || !selected) return;
    setBusy(true);
    const res = await markRefundUnderReview(user.id, selected.id);
    if (res.success) {
      setFeedback({ type: "success", message: `Claim ${selected.claim_number} marked under review.` });
      await load();
      refreshAdminCounts();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to update claim." });
    }
    setBusy(false);
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selected) return;
    setBusy(true);
    const amt = Number(approvedAmount);
    const res = await approveRefund(selected.id, adminNotes, amt, user.id);
    if (res.success) {
      const modeLabel =
        res.refundMode === "stripe"
          ? `Stripe refund ${res.stripeRefundId}`
          : `Test mode (${res.stripeRefundId})`;
      setFeedback({
        type: "success",
        message: `Claim ${selected.claim_number} approved for ${formatPrice(res.approvedAmount || amt)} — ${modeLabel}.`,
      });
      await load();
      refreshAdminCounts();
      setSelectedId(null);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to approve refund." });
    }
    setBusy(false);
  };

  const handleReject = async () => {
    if (!user?.id || !selected) return;
    if (!rejectionReason.trim()) {
      setFeedback({ type: "error", message: "Please enter a rejection reason." });
      return;
    }
    setBusy(true);
    const res = await rejectRefund(selected.id, rejectionReason, user.id);
    if (res.success) {
      setFeedback({ type: "success", message: `Claim ${selected.claim_number} rejected.` });
      await load();
      refreshAdminCounts();
      setSelectedId(null);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to reject claim." });
    }
    setBusy(false);
  };

  const filtered = claims.filter((c) => (filter === "all" ? true : c.status === filter));

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Refund Claims & Dispute Center
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review Freshness Guarantee claims, approve full or partial refunds via Stripe (or test mode), or reject with reason.
        </p>
      </div>

      <FeedbackBanner feedback={feedback} onClear={() => setFeedback(null)} />

      <div className="flex flex-wrap gap-1.5">
        {["all", "requested", "under_review", "refunded", "rejected"].map((st) => (
          <button
            key={st}
            type="button"
            onClick={() => setFilter(st)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${
              filter === st
                ? "bg-purple-600 text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {st.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Claim</th>
              <th className="py-3 px-6">Customer & Order</th>
              <th className="py-3 px-6">Merchant</th>
              <th className="py-3 px-6">Reason</th>
              <th className="py-3 px-6">Amount</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading refund claims...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  No refund claims found.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-bold text-slate-900">
                    {c.claim_number}
                    <p className="text-[10px] text-slate-400 font-normal">
                      {new Date(c.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-semibold text-slate-800">{c.customer?.full_name || "Customer"}</p>
                    <p className="text-[10px] text-slate-400">{c.orders?.order_number}</p>
                  </td>
                  <td className="py-4 px-6 text-slate-600">{c.stores?.name || "Store"}</td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-900">{c.reason}</p>
                    {c.additional_details && (
                      <p className="text-[11px] text-slate-400 max-w-xs truncate">{c.additional_details}</p>
                    )}
                  </td>
                  <td className="py-4 px-6 font-extrabold text-slate-900">
                    {formatPrice(Number(c.approved_amount ?? c.amount))}
                    {c.approved_amount && Number(c.approved_amount) < Number(c.amount) && (
                      <p className="text-[10px] font-normal text-slate-400">
                        of {formatPrice(Number(c.amount))}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        c.status === "refunded" || c.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : c.status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {c.status.replace("_", " ")}
                    </span>
                    {c.refund_mode && (
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {c.refund_mode === "stripe" ? "Stripe Live" : "Test Mode"}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => openClaim(c)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{["requested", "under_review"].includes(c.status) ? "Review" : "View"}</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Claim Modal */}
      {selected && (
        <div className="fixed inset-0 bg-slate-950/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Claim {selected.claim_number}
                </h3>
                <p className="text-xs text-slate-500">
                  Order {selected.orders?.order_number} • {selected.stores?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedId(null)}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Status Timeline */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Status Timeline
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1 font-bold text-emerald-700">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Requested
                </span>
                <span className="text-slate-300">→</span>
                <span
                  className={`flex items-center gap-1 font-bold ${
                    ["under_review", "refunded", "rejected"].includes(selected.status)
                      ? "text-emerald-700"
                      : "text-slate-400"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" /> Under Review
                </span>
                <span className="text-slate-300">→</span>
                <span
                  className={`flex items-center gap-1 font-bold ${
                    selected.status === "refunded"
                      ? "text-emerald-700"
                      : selected.status === "rejected"
                      ? "text-rose-700"
                      : "text-slate-400"
                  }`}
                >
                  {selected.status === "rejected" ? (
                    <XCircle className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {selected.status === "rejected" ? "Rejected" : "Refunded"}
                </span>
              </div>
              {selected.stripe_refund_id && (
                <p className="text-[11px] text-slate-500 font-mono">
                  Ref: {selected.stripe_refund_id} ({selected.refund_mode === "stripe" ? "Stripe" : "Test Mode"})
                </p>
              )}
            </div>

            {/* Evidence & Items */}
            <div className="space-y-2 text-xs">
              <p className="font-bold text-slate-900">Reason: {selected.reason}</p>
              {selected.additional_details && (
                <p className="text-slate-600">{selected.additional_details}</p>
              )}
              {selected.image_url && (
                <a
                  href={selected.image_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-purple-600 font-bold hover:underline"
                >
                  View Customer Photo Evidence ↗
                </a>
              )}
              {(selected.refund_items || []).length > 0 && (
                <div className="bg-slate-50 rounded-xl p-3 space-y-1">
                  {selected.refund_items.map((ri: any) => (
                    <div key={ri.id} className="flex justify-between text-[11px]">
                      <span>
                        {ri.quantity}× {ri.order_items?.name || "Item"}
                      </span>
                      <span className="font-bold">{formatPrice(Number(ri.amount))}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {selected.status === "requested" && (
              <button
                type="button"
                disabled={busy}
                onClick={handleUnderReview}
                className="w-full py-2.5 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-xs disabled:opacity-50"
              >
                Mark Under Review
              </button>
            )}

            {["requested", "under_review"].includes(selected.status) && (
              <div className="space-y-4 pt-2 border-t border-slate-100">
                <form onSubmit={handleApprove} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Approved Amount (max {formatPrice(Number(selected.amount))})
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max={Number(selected.amount)}
                        required
                        value={approvedAmount}
                        onChange={(e) => setApprovedAmount(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">
                        Admin Notes (optional)
                      </label>
                      <input
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        placeholder="Internal note..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={busy}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs disabled:opacity-50"
                  >
                    {busy ? "Processing..." : "Approve & Issue Refund"}
                  </button>
                </form>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <input
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Rejection reason (required to reject)..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleReject}
                    className="w-full py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs disabled:opacity-50"
                  >
                    Reject Claim
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
