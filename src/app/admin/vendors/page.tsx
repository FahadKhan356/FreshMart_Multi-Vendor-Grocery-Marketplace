"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, X, Ban, RotateCcw, Search, Loader2, Store } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { getAdminVendors, setVendorStatus } from "@/lib/actions/admin";
import { FeedbackBanner, refreshAdminCounts } from "../_components/AdminUI";

export default function AdminVendorsPage() {
  const user = useAuthStore((s) => s.user);
  const [vendors, setVendors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [reasonModal, setReasonModal] = useState<{
    storeId: string;
    storeName: string;
    action: "rejected" | "suspended";
  } | null>(null);
  const [reasonText, setReasonText] = useState("");

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getAdminVendors(user.id);
    if (res.success && res.data) {
      setVendors(res.data);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to load vendors." });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (storeId: string, name: string) => {
    if (!user?.id) return;
    setBusyId(storeId);
    const res = await setVendorStatus(user.id, storeId, "approved");
    if (res.success) {
      setFeedback({ type: "success", message: `${name} has been approved and is now live.` });
      await load();
      refreshAdminCounts();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to approve store." });
    }
    setBusyId(null);
  };

  const handleReasonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !reasonModal) return;
    setBusyId(reasonModal.storeId);
    const res = await setVendorStatus(user.id, reasonModal.storeId, reasonModal.action, reasonText);
    if (res.success) {
      setFeedback({
        type: "success",
        message: `${reasonModal.storeName} has been ${reasonModal.action}.`,
      });
      setReasonModal(null);
      setReasonText("");
      await load();
      refreshAdminCounts();
    } else {
      setFeedback({ type: "error", message: res.error || "Action failed." });
    }
    setBusyId(null);
  };

  const filtered = vendors.filter((v) => {
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        v.name?.toLowerCase().includes(q) ||
        v.profiles?.full_name?.toLowerCase().includes(q) ||
        v.profiles?.email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Vendor Approval Requests & KYC Audits
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Approve new merchant applications, suspend non-compliant stores, or reactivate suspended vendors.
        </p>
      </div>

      <FeedbackBanner feedback={feedback} onClear={() => setFeedback(null)} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {[
            { id: "all", label: "All" },
            { id: "pending_review", label: "Pending Review" },
            { id: "approved", label: "Approved" },
            { id: "suspended", label: "Suspended" },
            { id: "rejected", label: "Rejected" },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                statusFilter === tab.id
                  ? "bg-purple-600 text-white"
                  : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search store or owner..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Store</th>
              <th className="py-3 px-6">Proprietor</th>
              <th className="py-3 px-6">Address & Tags</th>
              <th className="py-3 px-6">Commission</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Audit Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading vendors...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No stores match the current filter.
                </td>
              </tr>
            ) : (
              filtered.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0">
                        <Store className="w-4 h-4" />
                      </div>
                      <div>
                        <p>{v.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal">{v.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-semibold text-slate-800">{v.profiles?.full_name || "Vendor"}</p>
                    <p className="text-[10px] text-slate-400">{v.profiles?.email}</p>
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    <p>{v.address}</p>
                    <p className="text-[10px] text-slate-400">{(v.tags || []).join(", ") || "General Grocery"}</p>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-700">
                    {Math.round(Number(v.commission_rate || 0.08) * 100)}%
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold capitalize ${
                        v.status === "pending_review"
                          ? "bg-amber-100 text-amber-800"
                          : v.status === "approved"
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {v.status.replace("_", " ")}
                    </span>
                    {v.status_reason && (
                      <p className="text-[10px] text-rose-600 mt-1 max-w-[180px] truncate" title={v.status_reason}>
                        {v.status_reason}
                      </p>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    {busyId === v.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-auto" />
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        {v.status !== "approved" && (
                          <button
                            type="button"
                            onClick={() => handleApprove(v.id, v.name)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs"
                          >
                            {v.status === "pending_review" ? (
                              <Check className="w-3 h-3" />
                            ) : (
                              <RotateCcw className="w-3 h-3" />
                            )}
                            <span>{v.status === "pending_review" ? "Approve" : "Re-Approve"}</span>
                          </button>
                        )}
                        {v.status === "pending_review" && (
                          <button
                            type="button"
                            onClick={() => {
                              setReasonModal({ storeId: v.id, storeName: v.name, action: "rejected" });
                              setReasonText("");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs flex items-center gap-1"
                          >
                            <X className="w-3 h-3" /> Reject
                          </button>
                        )}
                        {v.status === "approved" && (
                          <button
                            type="button"
                            onClick={() => {
                              setReasonModal({ storeId: v.id, storeName: v.name, action: "suspended" });
                              setReasonText("");
                            }}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs flex items-center gap-1"
                          >
                            <Ban className="w-3 h-3" /> Suspend
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {reasonModal && (
        <div className="fixed inset-0 bg-slate-950/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleReasonSubmit}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-extrabold text-slate-900 capitalize">
              {reasonModal.action} {reasonModal.storeName}
            </h3>
            <p className="text-xs text-slate-500">
              Provide a clear reason. This will be persisted and sent to the vendor as a notification.
            </p>
            <textarea
              required
              rows={3}
              value={reasonText}
              onChange={(e) => setReasonText(e.target.value)}
              placeholder="Enter reason..."
              className="w-full p-3 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReasonModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busyId === reasonModal.storeId}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs disabled:opacity-50"
              >
                Confirm {reasonModal.action}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
