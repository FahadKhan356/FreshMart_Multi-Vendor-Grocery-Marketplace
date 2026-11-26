"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, MessageSquare, Loader2, X } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { getAdminTickets, updateTicket, createTicket } from "@/lib/actions/admin";
import { FeedbackBanner, refreshAdminCounts } from "../_components/AdminUI";

export default function AdminTicketsPage() {
  const user = useAuthStore((s) => s.user);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [selected, setSelected] = useState<any | null>(null);
  const [replyText, setReplyText] = useState("");
  const [nextStatus, setNextStatus] = useState<"open" | "in_progress" | "resolved" | "closed">("in_progress");

  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({
    userEmail: "",
    subject: "",
    message: "",
    priority: "normal",
  });

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getAdminTickets(user.id);
    if (res.success && res.data) {
      setTickets(res.data);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to load support tickets." });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selected) return;
    setBusy(true);
    const res = await updateTicket(user.id, selected.id, {
      status: nextStatus,
      reply: replyText,
    });
    if (res.success) {
      setFeedback({ type: "success", message: `Ticket ${selected.ticket_number} updated.` });
      setSelected(null);
      await load();
      refreshAdminCounts();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to update ticket." });
    }
    setBusy(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    setBusy(true);
    const res = await createTicket(user.id, newForm);
    if (res.success) {
      setFeedback({ type: "success", message: "Support ticket created." });
      setNewOpen(false);
      setNewForm({ userEmail: "", subject: "", message: "", priority: "normal" });
      await load();
      refreshAdminCounts();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to create ticket." });
    }
    setBusy(false);
  };

  const filtered = tickets.filter((t) => (filter === "all" ? true : t.status === filter));

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Support Tickets
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Respond to customer and vendor inquiries and track resolution status.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setNewOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Create Ticket</span>
        </button>
      </div>

      <FeedbackBanner feedback={feedback} onClear={() => setFeedback(null)} />

      <div className="flex flex-wrap gap-1.5">
        {["all", "open", "in_progress", "resolved", "closed"].map((st) => (
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
            {st.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Ticket #</th>
              <th className="py-3 px-6">User</th>
              <th className="py-3 px-6">Subject</th>
              <th className="py-3 px-6">Priority</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading tickets...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No support tickets found.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-bold text-slate-900">
                    {t.ticket_number}
                    <p className="text-[10px] text-slate-400 font-normal">
                      {new Date(t.created_at).toLocaleDateString()}
                    </p>
                  </td>
                  <td className="py-4 px-6 text-slate-700">
                    <p className="font-semibold">{t.profiles?.full_name || "Guest"}</p>
                    <p className="text-[10px] text-slate-400">{t.profiles?.email}</p>
                  </td>
                  <td className="py-4 px-6">
                    <p className="font-bold text-slate-900">{t.subject}</p>
                    <p className="text-[11px] text-slate-500 max-w-xs truncate">{t.message}</p>
                  </td>
                  <td className="py-4 px-6 capitalize font-semibold text-slate-600">{t.priority}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                        t.status === "resolved" || t.status === "closed"
                          ? "bg-emerald-100 text-emerald-800"
                          : t.status === "open"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {t.status.replace("_", " ")}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setSelected(t);
                        setReplyText(t.admin_reply || "");
                        setNextStatus(t.status);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Reply</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-slate-950/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleUpdate}
            className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {selected.ticket_number}: {selected.subject}
                </h3>
                <p className="text-xs text-slate-500">{selected.profiles?.email}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 text-xs text-slate-700">
              {selected.message}
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">Status</label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Admin Reply</label>
                <textarea
                  rows={3}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Write a reply (sends notification to user)..."
                  className="w-full p-3 rounded-xl border border-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-50"
              >
                {busy ? "Saving..." : "Update Ticket"}
              </button>
            </div>
          </form>
        </div>
      )}

      {newOpen && (
        <div className="fixed inset-0 bg-slate-950/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleCreate}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Create Support Ticket</h3>
              <button
                type="button"
                onClick={() => setNewOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-600 mb-1">User Email (optional)</label>
                <input
                  type="email"
                  value={newForm.userEmail}
                  onChange={(e) => setNewForm({ ...newForm, userEmail: e.target.value })}
                  placeholder="customer@freshmart.local"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Subject</label>
                <input
                  required
                  value={newForm.subject}
                  onChange={(e) => setNewForm({ ...newForm, subject: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Priority</label>
                <select
                  value={newForm.priority}
                  onChange={(e) => setNewForm({ ...newForm, priority: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Message</label>
                <textarea
                  required
                  rows={3}
                  value={newForm.message}
                  onChange={(e) => setNewForm({ ...newForm, message: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNewOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={busy}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs disabled:opacity-50"
              >
                {busy ? "Creating..." : "Create Ticket"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
