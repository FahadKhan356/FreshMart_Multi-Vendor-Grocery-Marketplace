"use client";

import { useState, useEffect, useCallback } from "react";
import { Bike, Plus, Edit2, Ban, CheckCircle2, Trash2, Loader2, X } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import {
  getAdminCouriers,
  saveCourier,
  setUserStatus,
  deleteCourier,
} from "@/lib/actions/admin";
import { FeedbackBanner } from "../_components/AdminUI";

export default function AdminCouriersPage() {
  const user = useAuthStore((s) => s.user);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{
    id?: string;
    fullName: string;
    email: string;
    phone: string;
    vehicle: string;
  }>({ fullName: "", email: "", phone: "", vehicle: "E-Bike" });

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getAdminCouriers(user.id);
    if (res.success && res.data) {
      setCouriers(res.data);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to load couriers." });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const openCreate = () => {
    setForm({ fullName: "", email: "", phone: "", vehicle: "E-Bike" });
    setModalOpen(true);
  };

  const openEdit = (c: any) => {
    setForm({
      id: c.id,
      fullName: c.full_name || "",
      email: c.email || "",
      phone: c.phone || "",
      vehicle: c.vehicle || "E-Bike",
    });
    setModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setBusyId("save");
    const res = await saveCourier(user.id, form);
    if (res.success) {
      setFeedback({
        type: "success",
        message: form.id ? "Courier updated." : "Courier created and activated.",
      });
      setModalOpen(false);
      await load();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to save courier." });
    }
    setBusyId(null);
  };

  const handleToggleStatus = async (c: any) => {
    if (!user?.id) return;
    const next = c.status === "suspended" ? "active" : "suspended";
    setBusyId(c.id);
    const res = await setUserStatus(user.id, c.id, next);
    if (res.success) {
      setFeedback({ type: "success", message: `${c.full_name} is now ${next}.` });
      await load();
    } else {
      setFeedback({ type: "error", message: res.error || "Status update failed." });
    }
    setBusyId(null);
  };

  const handleDelete = async (c: any) => {
    if (!user?.id) return;
    setBusyId(c.id);
    const res = await deleteCourier(user.id, c.id);
    if (res.success) {
      setFeedback({ type: "success", message: `Courier ${c.full_name} deleted.` });
      await load();
    } else {
      setFeedback({ type: "error", message: res.error || "Cannot delete courier." });
    }
    setBusyId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Courier Fleet Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add, edit, activate, or suspend insulated cold-chain delivery partners.
          </p>
        </div>

        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Courier</span>
        </button>
      </div>

      <FeedbackBanner feedback={feedback} onClear={() => setFeedback(null)} />

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Courier</th>
              <th className="py-3 px-6">Contact</th>
              <th className="py-3 px-6">Vehicle</th>
              <th className="py-3 px-6">Deliveries</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading couriers...
                </td>
              </tr>
            ) : couriers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No couriers registered.
                </td>
              </tr>
            ) : (
              couriers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                        <Bike className="w-4 h-4" />
                      </div>
                      <div>
                        <p>{c.full_name}</p>
                        <p className="text-[10px] text-slate-400 font-normal">
                          {c.is_online ? "Online now" : "Offline"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    <p>{c.email}</p>
                    <p className="text-[10px] text-slate-400">{c.phone || "No phone"}</p>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-700">{c.vehicle || "E-Bike"}</td>
                  <td className="py-4 px-6">
                    <span className="font-bold text-slate-900">{c.activeDeliveries}</span> active •{" "}
                    <span className="text-slate-500">{c.completed} completed</span>
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
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                          title="Edit courier"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(c)}
                          className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 ${
                            c.status === "suspended"
                              ? "bg-emerald-600 text-white hover:bg-emerald-700"
                              : "bg-amber-50 text-amber-800 hover:bg-amber-100"
                          }`}
                        >
                          {c.status === "suspended" ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Activate
                            </>
                          ) : (
                            <>
                              <Ban className="w-3 h-3" /> Suspend
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                          title="Delete courier"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
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
                {form.id ? "Edit Courier" : "Add New Courier"}
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
                <label className="block font-bold text-slate-600 mb-1">Full Name</label>
                <input
                  required
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Vehicle</label>
                  <input
                    value={form.vehicle}
                    onChange={(e) => setForm({ ...form, vehicle: e.target.value })}
                    placeholder="E-Bike, Van..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
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
                {busyId === "save" ? "Saving..." : "Save Courier"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
