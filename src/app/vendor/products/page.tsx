"use client";

import { useState } from "react";
import { PRODUCTS, Product } from "@/data/mockData";
import { formatPrice } from "@/lib/utils";
import { Plus, Search, Edit, Trash2, Eye, Leaf, Check } from "lucide-react";

export default function VendorProductsPage() {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newStock, setNewStock] = useState("");

  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newPrice) return;
    const newProd: Product = {
      id: `prod-${Date.now()}`,
      name: newTitle,
      storeId: "store-1",
      storeName: "GreenField Organic Market",
      price: Number(newPrice),
      unit: "Each",
      category: "fruits-veggies",
      rating: 5.0,
      reviewsCount: 1,
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600",
      stock: Number(newStock) || 20,
      organic: true,
      origin: "Hudson Valley, NY",
      description: "Freshly listed farm direct produce.",
    };
    setProducts([newProd, ...products]);
    setShowAddModal(false);
    setNewTitle("");
    setNewPrice("");
    setNewStock("");
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Product Catalog & SKUs</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage your store's items, pricing, variations, and active listings.</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 flex items-center gap-1.5 transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Grocery SKU</span>
        </button>
      </div>

      {/* Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="font-extrabold text-lg text-slate-900">Add New Grocery Product</h3>
            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs font-bold">
              <div>
                <label className="text-slate-600 block mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Organic Crisp Kale Bunch"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 block mb-1">Price ($ USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="3.99"
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
                <div>
                  <label className="text-slate-600 block mb-1">Initial Stock Units</label>
                  <input
                    type="number"
                    placeholder="35"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-blue-600 text-white font-bold text-xs"
                >
                  Publish to Storefront
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
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
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Product</th>
              <th className="py-3 px-6">Category</th>
              <th className="py-3 px-6">Price</th>
              <th className="py-3 px-6">Stock Status</th>
              <th className="py-3 px-6">Rating</th>
              <th className="py-3 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="py-4 px-6 flex items-center gap-3">
                  <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover bg-slate-100" />
                  <div>
                    <p className="font-bold text-slate-900">{p.name}</p>
                    <p className="text-[11px] text-slate-400">{p.unit} • {p.origin}</p>
                  </div>
                </td>
                <td className="py-4 px-6 font-semibold text-slate-600 uppercase text-[10px]">{p.category}</td>
                <td className="py-4 px-6 font-bold text-slate-900">{formatPrice(p.price)}</td>
                <td className="py-4 px-6">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    p.stock < 15 ? "bg-rose-100 text-rose-700" : "bg-emerald-100 text-emerald-800"
                  }`}>
                    {p.stock} units left
                  </span>
                </td>
                <td className="py-4 px-6 text-amber-500 font-bold">★ {p.rating}</td>
                <td className="py-4 px-6 text-right">
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
