"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Loader2, X, Image as ImageIcon } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { getAdminBanners, saveBanner, toggleBanner, deleteBanner } from "@/lib/actions/admin";
import { FeedbackBanner } from "../_components/AdminUI";

export default function AdminBannersPage() {
  const user = useAuthStore((s) => s.user);
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{
    id?: string;
    title: string;
    subtitle: string;
    image_url: string;
    link_url: string;
    sort_order: string;
    is_active: boolean;
  }>({
    title: "",
    subtitle: "",
    image_url: "",
    link_url: "/products",
    sort_order: "1",
    is_active: true,
  });

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getAdminBanners(user.id);
    if (res.success && res.data) {
      setBanners(res.data);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to load banners." });
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
    const res = await saveBanner(user.id, {
      id: form.id,
      title: form.title,
      subtitle: form.subtitle,
      image_url: form.image_url,
      link_url: form.link_url,
      sort_order: Number(form.sort_order || 0),
      is_active: form.is_active,
    });
    if (res.success) {
      setFeedback({ type: "success", message: form.id ? "Banner updated." : "Banner created." });
      setModalOpen(false);
      await load();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to save banner." });
    }
    setBusyId(null);
  };

  const handleToggle = async (b: any) => {
    if (!user?.id) return;
    setBusyId(b.id);
    const res = await toggleBanner(user.id, b.id, !b.is_active);
    if (res.success) await load();
    else setFeedback({ type: "error", message: res.error || "Failed to toggle banner." });
    setBusyId(null);
  };

  const handleDelete = async (b: any) => {
    if (!user?.id) return;
    setBusyId(b.id);
    const res = await deleteBanner(user.id, b.id);
    if (res.success) {
      setFeedback({ type: "success", message: `Banner "${b.title}" deleted.` });
      await load();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to delete banner." });
    }
    setBusyId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Storefront Banners
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage promotional hero banners displayed on the marketplace.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm({
              title: "",
              subtitle: "",
              image_url: "",
              link_url: "/products",
              sort_order: "1",
              is_active: true,
            });
            setModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Banner</span>
        </button>
      </div>

      <FeedbackBanner feedback={feedback} onClear={() => setFeedback(null)} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {loading ? (
          <div className="col-span-full bg-white p-10 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
            <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
            Loading banners...
          </div>
        ) : banners.length === 0 ? (
          <div className="col-span-full bg-white p-10 rounded-3xl border border-slate-200 text-center text-xs text-slate-400">
            No banners created yet.
          </div>
        ) : (
          banners.map((b) => (
            <div
              key={b.id}
              className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col"
            >
              {b.image_url ? (
                <img src={b.image_url} alt={b.title} className="h-40 w-full object-cover" />
              ) : (
                <div className="h-40 bg-slate-100 flex items-center justify-center text-slate-400">
                  <ImageIcon className="w-8 h-8" />
                </div>
              )}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm text-slate-900">{b.title}</h3>
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => handleToggle(b)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        b.is_active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {b.is_active ? "Active" : "Inactive"}
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{b.subtitle}</p>
                  <p className="text-[11px] font-mono text-slate-400 mt-2">
                    Link: {b.link_url || "/"} • Order #{b.sort_order}
                  </p>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setForm({
                        id: b.id,
                        title: b.title || "",
                        subtitle: b.subtitle || "",
                        image_url: b.image_url || "",
                        link_url: b.link_url || "",
                        sort_order: String(b.sort_order ?? 0),
                        is_active: !!b.is_active,
                      });
                      setModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(b)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-slate-950/50 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">
                {form.id ? "Edit Banner" : "New Banner"}
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
                <label className="block font-bold text-slate-600 mb-1">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Subtitle</label>
                <input
                  value={form.subtitle}
                  onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Image URL</label>
                <input
                  value={form.image_url}
                  onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Link URL</label>
                  <input
                    value={form.link_url}
                    onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-600 mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
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
                {busyId === "save" ? "Saving..." : "Save Banner"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
