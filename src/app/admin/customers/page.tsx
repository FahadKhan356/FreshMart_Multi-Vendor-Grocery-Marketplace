"use client";

import { useState, useEffect, useCallback } from "react";
import { Users, Search, Ban, CheckCircle2, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { getAdminCustomers, setUserStatus } from "@/lib/actions/admin";
import { FeedbackBanner } from "../_components/AdminUI";

export default function AdminCustomersPage() {
  const user = useAuthStore((s) => s.user);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getAdminCustomers(user.id);
    if (res.success && res.data) {
      setCustomers(res.data);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to load customers." });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleToggle = async (c: any) => {
    if (!user?.id) return;
    const next = c.status === "suspended" ? "active" : "suspended";
    setBusyId(c.id);
    const res = await setUserStatus(user.id, c.id, next);
    if (res.success) {
      setFeedback({ type: "success", message: `${c.full_name} is now ${next}.` });
      await load();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to update customer." });
    }
    setBusyId(null);
  };

  const filtered = customers.filter((c) => {
    if (statusFilter !== "all" && (c.status || "active") !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return c.full_name?.toLowerCase().includes(q) || c.email?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Customer Directory
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          View customer order activity, lifetime spend, and suspend or reactivate accounts.
        </p>
      </div>

      <FeedbackBanner feedback={feedback} onClear={() => setFeedback(null)} />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex gap-1.5">
          {["all", "active", "suspended"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize ${
                statusFilter === st
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
            placeholder="Search name or email..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs"
          />
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Customer</th>
              <th className="py-3 px-6">Contact</th>
              <th className="py-3 px-6">Orders</th>
              <th className="py-3 px-6">Total Spend</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading customers...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No customers found.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
                        <Users className="w-4 h-4" />
                      </div>
                      <span>{c.full_name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    <p>{c.email}</p>
                    <p className="text-[10px] text-slate-400">{c.phone || "No phone"}</p>
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900">{c.orderCount}</td>
                  <td className="py-4 px-6 font-extrabold text-emerald-700">
                    {formatPrice(Number(c.totalSpend || 0))}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        c.status === "suspended"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {c.status || "active"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    {busyId === c.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-auto" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggle(c)}
                        className={`px-3 py-1.5 rounded-lg font-bold text-xs inline-flex items-center gap-1 ${
                          c.status === "suspended"
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-rose-50 hover:bg-rose-100 text-rose-700"
                        }`}
                      >
                        {c.status === "suspended" ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" /> Activate
                          </>
                        ) : (
                          <>
                            <Ban className="w-3.5 h-3.5" /> Suspend
                          </>
                        )}
                      </button>
                    )}
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
