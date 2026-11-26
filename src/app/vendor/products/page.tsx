"use client";

import { useState, useEffect, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import { Plus, Search, Edit, Trash2, Loader2, X, Check, Upload } from "lucide-react";
import { useVendor } from "../VendorContext";
import {
  VendorProduct,
  VendorCategory,
  getVendorProducts,
  getCategoriesList,
} from "@/lib/data/vendorData";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  updateProductStock,
} from "@/lib/actions/products";

const DEFAULT_IMAGE =
  "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600";

export default function VendorProductsPage() {
  const { storeId, userId, refreshBadges } = useVendor();
  const [products, setProducts] = useState<VendorProduct[]>([]);
  const [categories, setCategories] = useState<VendorCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [availabilityFilter, setAvailabilityFilter] = useState<"all" | "available" | "unavailable">("all");

  // Modal state (Add or Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<VendorProduct | null>(null);
  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState("fruits-veggies");
  const [formPrice, setFormPrice] = useState("");
  const [formOriginalPrice, setFormOriginalPrice] = useState("");
  const [formUnit, setFormUnit] = useState("Each");
  const [formOrigin, setFormOrigin] = useState("Local Farm");
  const [formStock, setFormStock] = useState("25");
  const [formThreshold, setFormThreshold] = useState("15");
  const [formImage, setFormImage] = useState(DEFAULT_IMAGE);
  const [formDescription, setFormDescription] = useState("");
  const [formOrganic, setFormOrganic] = useState(true);
  const [formAvailable, setFormAvailable] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([getVendorProducts(storeId), getCategoriesList()]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormName("");
    setFormCategory(categories[0]?.id || "fruits-veggies");
    setFormPrice("");
    setFormOriginalPrice("");
    setFormUnit("Each");
    setFormOrigin("Hudson Valley, NY");
    setFormStock("25");
    setFormThreshold("15");
    setFormImage(DEFAULT_IMAGE);
    setFormDescription("");
    setFormOrganic(true);
    setFormAvailable(true);
    setShowModal(true);
  };

  const openEditModal = (p: VendorProduct) => {
    setEditingProduct(p);
    setFormName(p.name);
    setFormCategory(p.category_id);
    setFormPrice(String(p.price));
    setFormOriginalPrice(p.original_price ? String(p.original_price) : "");
    setFormUnit(p.unit);
    setFormOrigin(p.origin);
    setFormStock(String(p.stock));
    setFormThreshold(String(p.low_stock_threshold));
    setFormImage(p.image || DEFAULT_IMAGE);
    setFormDescription(p.description || "");
    setFormOrganic(p.organic);
    setFormAvailable(p.is_available);
    setShowModal(true);
  };

  const handleImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setFormImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId || !formName.trim() || !formPrice) return;
    setSubmitting(true);
    setFeedback(null);

    const payload = {
      storeId,
      categoryId: formCategory,
      name: formName.trim(),
      description: formDescription.trim(),
      price: Number(formPrice),
      originalPrice: formOriginalPrice ? Number(formOriginalPrice) : undefined,
      unit: formUnit.trim() || "Each",
      origin: formOrigin.trim() || "Local Farm",
      stock: Number(formStock) || 0,
      lowStockThreshold: Number(formThreshold) || 15,
      organic: formOrganic,
      isAvailable: formAvailable,
      image: formImage.trim() || DEFAULT_IMAGE,
    };

    const res = editingProduct
      ? await updateProduct(editingProduct.id, payload, userId)
      : await createProduct(payload, userId);

    if (res.success) {
      setShowModal(false);
      setFeedback({
        type: "success",
        text: editingProduct ? "Product updated in Supabase." : "New product published to storefront.",
      });
      await Promise.all([loadData(), refreshBadges()]);
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to save product." });
    }
    setSubmitting(false);
  };

  const handleDelete = async (p: VendorProduct) => {
    if (!storeId) return;
    if (!window.confirm(`Delete "${p.name}"? If it has existing order history, it will be archived.`)) {
      return;
    }
    setDeletingId(p.id);
    setFeedback(null);
    const res = await deleteProduct(p.id, storeId, userId);
    if (res.success) {
      setFeedback({
        type: "success",
        text: res.archived
          ? `"${p.name}" has order history and was archived (marked unavailable).`
          : `"${p.name}" deleted.`,
      });
      await Promise.all([loadData(), refreshBadges()]);
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to delete product." });
    }
    setDeletingId(null);
  };

  const handleToggleAvailable = async (p: VendorProduct) => {
    setFeedback(null);
    const res = await updateProductStock(p.id, p.stock, !p.is_available, undefined, userId);
    if (res.success) {
      setProducts((prev) =>
        prev.map((item) => (item.id === p.id ? { ...item, is_available: !p.is_available } : item))
      );
      setFeedback({
        type: "success",
        text: `${p.name} marked ${!p.is_available ? "available" : "unavailable"}.`,
      });
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update availability." });
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.origin.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = categoryFilter === "all" || p.category_id === categoryFilter;
    const matchesAvail =
      availabilityFilter === "all" ||
      (availabilityFilter === "available" && p.is_available) ||
      (availabilityFilter === "unavailable" && !p.is_available);
    return matchesSearch && matchesCat && matchesAvail;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Product Catalog & SKUs</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your store's items, pricing, categories, and active listings.
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="px-4 py-2.5 rounded-xl bg-[#16a34a] hover:bg-[#14532d] text-white font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Grocery SKU</span>
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

      {/* Search & Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search products by name or origin..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={availabilityFilter}
          onChange={(e) => setAvailabilityFilter(e.target.value as any)}
          className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700"
        >
          <option value="all">All Availability</option>
          <option value="available">Available Only</option>
          <option value="unavailable">Unavailable / Hidden</option>
        </select>
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl space-y-4 my-8">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-lg text-slate-900">
                {editingProduct ? "Edit Grocery Product" : "Add New Grocery Product"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3 text-xs font-bold">
              <div>
                <label className="text-slate-600 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Crisp Kale Bunch"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1">Category</label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Unit (e.g. 1 lb, Bunch)</label>
                  <input
                    type="text"
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Compare Price</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Optional"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={formStock}
                    onChange={(e) => setFormStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Alert Threshold</label>
                  <input
                    type="number"
                    min="0"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Origin / Farm Source</label>
                <input
                  type="text"
                  value={formOrigin}
                  onChange={(e) => setFormOrigin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Image URL or Upload</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={formImage}
                    onChange={(e) => setFormImage(e.target.value)}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                  />
                  <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload</span>
                    <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
                  </label>
                </div>
              </div>

              <div>
                <label className="text-slate-600 block mb-1">Description</label>
                <textarea
                  rows={2}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium"
                />
              </div>

              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formOrganic}
                    onChange={(e) => setFormOrganic(e.target.checked)}
                    className="rounded text-[#16a34a]"
                  />
                  <span className="text-slate-700">Certified Organic</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formAvailable}
                    onChange={(e) => setFormAvailable(e.target.checked)}
                    className="rounded text-[#16a34a]"
                  />
                  <span className="text-slate-700">Available on Storefront</span>
                </label>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-[#16a34a] hover:bg-[#14532d] text-white font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>{editingProduct ? "Save Product Changes" : "Publish to Storefront"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-3 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Products Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Product</th>
              <th className="py-3 px-6">Category</th>
              <th className="py-3 px-6">Price</th>
              <th className="py-3 px-6">Stock Status</th>
              <th className="py-3 px-6">Availability</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading catalog...
                </td>
              </tr>
            ) : filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-10 text-center text-slate-400">
                  No matching products found.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6 flex items-center gap-3">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-10 h-10 rounded-lg object-cover bg-slate-100 shrink-0"
                    />
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-400">
                        {p.unit} • {p.origin}
                      </p>
                    </div>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-600 uppercase text-[10px]">
                    {p.category_id}
                  </td>
                  <td className="py-4 px-6 font-bold text-slate-900">
                    {formatPrice(p.price)}
                    {p.original_price && p.original_price > p.price && (
                      <span className="ml-1.5 text-[10px] text-slate-400 line-through">
                        {formatPrice(p.original_price)}
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.stock <= p.low_stock_threshold
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-800"
                      }`}
                    >
                      {p.stock} units left
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleToggleAvailable(p)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors ${
                        p.is_available
                          ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                          : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                      }`}
                    >
                      {p.is_available ? "Live" : "Hidden"}
                    </button>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEditModal(p)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-[#16a34a] hover:bg-emerald-50 transition-colors"
                        aria-label={`Edit ${p.name}`}
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p)}
                        disabled={deletingId === p.id}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                        aria-label={`Delete ${p.name}`}
                      >
                        {deletingId === p.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
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
