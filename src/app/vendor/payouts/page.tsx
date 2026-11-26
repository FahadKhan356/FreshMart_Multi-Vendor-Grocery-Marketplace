"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import { Wallet, CheckCircle2, Building, Loader2, X, Edit, ArrowUpRight } from "lucide-react";
import { useVendor } from "../VendorContext";
import {
  VendorPayoutRow,
  getVendorBalanceRow,
  getVendorPayouts,
} from "@/lib/data/vendorData";
import { requestVendorPayout, updateVendorBankSettings } from "@/lib/actions/payouts";

export default function VendorPayoutsPage() {
  const { store, storeId, userId, refreshStore, refreshBadges } = useVendor();
  const [balance, setBalance] = useState({ available_balance: 0, pending_balance: 0, total_withdrawn: 0 });
  const [payouts, setPayouts] = useState<VendorPayoutRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Payout modal
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [submittingPayout, setSubmittingPayout] = useState(false);

  // Bank settings modal
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankName, setBankName] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [bankRouting, setBankRouting] = useState("");
  const [bankLast4, setBankLast4] = useState("");
  const [savingBank, setSavingBank] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadPayoutData = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const [bal, hist] = await Promise.all([
        getVendorBalanceRow(storeId),
        getVendorPayouts(storeId),
      ]);
      setBalance(bal);
      setPayouts(hist);
    } catch (err) {
      console.error("Failed to load payouts:", err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadPayoutData();
  }, [loadPayoutData]);

  const openPayoutModal = () => {
    setPayoutAmount(balance.available_balance > 0 ? String(balance.available_balance) : "");
    setShowPayoutModal(true);
  };

  const openBankModal = () => {
    setBankName(store?.bank_name || "Chase Business Checking");
    setBankHolder(store?.bank_account_holder || store?.name || "");
    setBankRouting(store?.bank_routing || "021000021");
    setBankLast4(store?.bank_account_last4 || "8821");
    setShowBankModal(true);
  };

  const handleRequestPayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    setSubmittingPayout(true);
    setFeedback(null);
    const res = await requestVendorPayout(storeId, Number(payoutAmount), userId);
    if (res.success) {
      setShowPayoutModal(false);
      setFeedback({
        type: "success",
        text: `Payout ${res.payout?.payout_number} completed! Funds sent to •••• ${store?.bank_account_last4 || "8821"}.`,
      });
      await Promise.all([loadPayoutData(), refreshBadges()]);
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to request payout." });
    }
    setSubmittingPayout(false);
  };

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    setSavingBank(true);
    setFeedback(null);
    const res = await updateVendorBankSettings(
      storeId,
      {
        bank_name: bankName,
        bank_account_holder: bankHolder,
        bank_routing: bankRouting,
        bank_account_last4: bankLast4,
      },
      userId
    );
    if (res.success) {
      setShowBankModal(false);
      setFeedback({ type: "success", text: "Payout bank account updated." });
      await refreshStore();
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update bank settings." });
    }
    setSavingBank(false);
  };

  const commissionPct = Math.round((store?.commission_rate ?? 0.08) * 100);

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Commission & Payout History
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {commissionPct}% marketplace commission • Instant ACH payout requests to your connected bank account.
          </p>
        </div>

        <button
          onClick={openPayoutModal}
          disabled={balance.available_balance <= 0}
          className="px-4 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#14532d] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all self-start"
        >
          <Wallet className="w-4 h-4" />
          <span>Request Payout</span>
        </button>
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

      {/* Balance Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Available Balance
          </span>
          <p className="text-2xl font-extrabold text-[#16a34a]">
            {formatPrice(balance.available_balance)}
          </p>
          <p className="text-[11px] text-slate-400">Ready for immediate withdrawal</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Pending Settlement
          </span>
          <p className="text-2xl font-extrabold text-slate-900">
            {formatPrice(balance.pending_balance)}
          </p>
          <p className="text-[11px] text-slate-400">Clears when orders complete</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Total Withdrawn
          </span>
          <p className="text-2xl font-extrabold text-slate-900">
            {formatPrice(balance.total_withdrawn)}
          </p>
          <p className="text-[11px] text-slate-400">Lifetime settled payouts</p>
        </div>
      </div>

      {/* Connected Account Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#16a34a] flex items-center justify-center shrink-0">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">
              {store?.bank_name || "Chase Business Checking"} (•••• {store?.bank_account_last4 || "8821"})
            </h3>
            <p className="text-xs text-slate-400">
              {store?.bank_account_holder || store?.name || "Partner LLC"} • Routing:{" "}
              {store?.bank_routing || "021000021"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Verified & Active
          </span>
          <button
            onClick={openBankModal}
            className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Bank
          </button>
        </div>
      </div>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-slate-900">Request ACH Payout</h3>
              <button
                onClick={() => setShowPayoutModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleRequestPayout} className="space-y-4 text-xs font-bold">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex justify-between">
                <span className="text-slate-500">Available Balance</span>
                <span className="text-[#14532d] font-extrabold">
                  {formatPrice(balance.available_balance)}
                </span>
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Withdrawal Amount ($ USD)</label>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  max={balance.available_balance}
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-extrabold"
                />
                <p className="text-[11px] text-slate-400 font-normal mt-1">
                  1% ACH processing fee applies; net transfer{" "}
                  {formatPrice(Math.max(0, Number(payoutAmount || 0) * 0.99))} to ••••{" "}
                  {store?.bank_account_last4 || "8821"}.
                </p>
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={submittingPayout}
                  className="flex-1 py-3 rounded-xl bg-[#16a34a] hover:bg-[#14532d] text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  {submittingPayout ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                  <span>Confirm Payout</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank Settings Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-slate-900">Payout Bank Settings</h3>
              <button
                onClick={() => setShowBankModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSaveBank} className="space-y-3 text-xs font-bold">
              <div>
                <label className="text-slate-600 block mb-1">Bank Name</label>
                <input
                  type="text"
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>
              <div>
                <label className="text-slate-600 block mb-1">Account Holder / Legal Entity</label>
                <input
                  type="text"
                  required
                  value={bankHolder}
                  onChange={(e) => setBankHolder(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1">Routing Number (9 digits)</label>
                  <input
                    type="text"
                    required
                    maxLength={9}
                    value={bankRouting}
                    onChange={(e) => setBankRouting(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Account Last 4 Digits</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    value={bankLast4}
                    onChange={(e) => setBankLast4(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  disabled={savingBank}
                  className="flex-1 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#14532d] text-white font-bold text-xs flex items-center justify-center gap-1.5"
                >
                  {savingBank && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Save Bank Details</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Payout History Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Settlement ID</th>
              <th className="py-3 px-6">Date</th>
              <th className="py-3 px-6">Requested Amount</th>
              <th className="py-3 px-6">ACH Fee (1%)</th>
              <th className="py-3 px-6">Net Transfer</th>
              <th className="py-3 px-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading payout history...
                </td>
              </tr>
            ) : payouts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No payouts requested yet. Click "Request Payout" above to withdraw your available balance.
                </td>
              </tr>
            ) : (
              payouts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-bold text-slate-900">{p.payout_number}</td>
                  <td className="py-4 px-6 text-slate-600">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6 font-extrabold text-slate-900">{formatPrice(p.amount)}</td>
                  <td className="py-4 px-6 text-rose-600 font-semibold">
                    -{formatPrice(p.platform_fee)}
                  </td>
                  <td className="py-4 px-6 font-extrabold text-[#14532d]">
                    {formatPrice(p.net_payout)}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] capitalize">
                      {p.status} •••• {p.bank_account_last4 || "8821"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
