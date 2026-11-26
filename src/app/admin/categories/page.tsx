"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Edit2, Trash2, Loader2, X } from "lucide-react";
import { useAuthStore } from "@/lib/store/authStore";
import { getAdminCategories, saveCategory, deleteCategory } from "@/lib/actions/admin";
import { FeedbackBanner } from "../_components/AdminUI";

export default function AdminCategoriesPage() {
  const user = useAuthStore((s) => s.user);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<{
    id?: string;
    name: string;
    icon: string;
    bg_color: string;
    text_color: string;
  }>({ name: "", icon: "🥬", bg_color: "bg-emerald-50", text_color: "text-emerald-700" });

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getAdminCategories(user.id);
    if (res.success && res.data) {
      setCategories(res.data);
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to load categories." });
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
    const res = await saveCategory(user.id, form);
    if (res.success) {
      setFeedback({
        type: "success",
        message: form.id ? "Category updated." : "Category created.",
      });
      setModalOpen(false);
      await load();
    } else {
      setFeedback({ type: "error", message: res.error || "Failed to save category." });
    }
    setBusyId(null);
  };

  const handleDelete = async (c: any) => {
    if (!user?.id) return;
    setBusyId(c.id);
    const res = await deleteCategory(user.id, c.id);
    if (res.success) {
      setFeedback({ type: "success", message: `Category "${c.name}" deleted.` });
      await load();
    } else {
      setFeedback({ type: "error", message: res.error || "Cannot delete category." });
    }
    setBusyId(null);
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Grocery Categories
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage storefront aisle categories and icons.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setForm({ name: "", icon: "🥬", bg_color: "bg-emerald-50", text_color: "text-emerald-700" });
            setModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Add Category</span>
        </button>
      </div>

      <FeedbackBanner feedback={feedback} onClear={() => setFeedback(null)} />

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Category</th>
              <th className="py-3 px-6">Slug</th>
              <th className="py-3 px-6">Products</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                  Loading categories...
                </td>
              </tr>
            ) : categories.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-slate-400">
                  No categories found.
                </td>
              </tr>
            ) : (
              categories.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 font-bold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg">{c.icon}</span>
                      <span>{c.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-mono text-slate-500">{c.slug}</td>
                  <td className="py-4 px-6 font-bold text-slate-700">{c.productCount}</td>
                  <td className="py-4 px-6 text-right">
                    {busyId === c.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-slate-400 ml-auto" />
                    ) : (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setForm({
                              id: c.id,
                              name: c.name,
                              icon: c.icon,
                              bg_color: c.bg_color || "bg-emerald-50",
                              text_color: c.text_color || "text-emerald-700",
                            });
                            setModalOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                          title="Edit category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c)}
                          className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600"
                          title="Delete category"
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
                {form.id ? "Edit Category" : "New Category"}
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
                <label className="block font-bold text-slate-600 mb-1">Name</label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-600 mb-1">Emoji Icon</label>
                <input
                  required
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
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
                {busyId === "save" ? "Saving..." : "Save Category"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
