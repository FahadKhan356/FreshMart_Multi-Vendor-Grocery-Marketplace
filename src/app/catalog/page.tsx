"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import { ProductCard } from "@/components/ui/ProductCard";
import { PRODUCTS, CATEGORIES, STORES, Product, Store, Category } from "@/data/mockData";
import { getLiveProducts, getLiveStores, getLiveCategories } from "@/lib/data/supabaseData";
import { 
  Filter, 
  Grid, 
  List, 
  SlidersHorizontal, 
  Check, 
  ChevronRight,
  Leaf,
  Store as StoreIcon,
  Sparkles,
  Search,
  Loader2
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function CatalogPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedStore, setSelectedStore] = useState<string>("all");
  const [organicOnly, setOrganicOnly] = useState<boolean>(false);
  const [maxPrice, setMaxPrice] = useState<number>(30);
  const [sortBy, setSortBy] = useState<"featured" | "price-low" | "price-high" | "rating">("featured");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [stores, setStores] = useState<Store[]>(STORES);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [liveProds, liveCats, liveStores] = await Promise.all([
          getLiveProducts(),
          getLiveCategories(),
          getLiveStores(),
        ]);
        if (liveProds && liveProds.length > 0) setProducts(liveProds);
        if (liveCats && liveCats.length > 0) setCategories(liveCats);
        if (liveStores && liveStores.length > 0) setStores(liveStores);
      } catch (err) {
        console.warn("Fallback to cache:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Filtering
  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== "all" && p.category !== selectedCategory) return false;
    if (selectedStore !== "all" && p.storeId !== selectedStore) return false;
    if (organicOnly && !p.organic) return false;
    if (p.price > maxPrice) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === "price-low") return a.price - b.price;
    if (sortBy === "price-high") return b.price - a.price;
    if (sortBy === "rating") return b.rating - a.rating;
    return 0;
  });

  return (
    <>
      <CustomerHeader />

      <main className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
            <Link href="/" className="hover:text-fresh-600">Home</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 font-bold">Marketplace Catalog</span>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            
            {/* Left Filter Sidebar */}
            <aside className="w-full lg:w-64 shrink-0 space-y-6">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
                
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <SlidersHorizontal className="w-4 h-4 text-fresh-600" />
                    <span>Filter Items</span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedStore("all");
                      setOrganicOnly(false);
                      setMaxPrice(30);
                    }}
                    className="text-xs text-fresh-600 hover:underline font-semibold"
                  >
                    Reset
                  </button>
                </div>

                {/* Organic Checkbox */}
                <div>
                  <label className="flex items-center gap-2.5 text-xs font-bold text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={organicOnly}
                      onChange={(e) => setOrganicOnly(e.target.checked)}
                      className="w-4 h-4 rounded text-fresh-600 focus:ring-fresh-500 border-slate-300"
                    />
                    <span className="flex items-center gap-1">
                      <Leaf className="w-3.5 h-3.5 text-fresh-600" />
                      100% Certified Organic Only
                    </span>
                  </label>
                </div>

                {/* Categories */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Departments</h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedCategory("all")}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                        selectedCategory === "all" ? "bg-fresh-50 text-fresh-700 font-bold" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>All Departments</span>
                      <span className="text-[11px] text-slate-400">{products.length}</span>
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedCategory(c.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                          selectedCategory === c.id ? "bg-fresh-50 text-fresh-700 font-bold" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{c.name}</span>
                        <span className="text-[11px] text-slate-400">{c.itemCount}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Local Stores */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Vendor Store</h4>
                  <div className="space-y-1">
                    <button
                      onClick={() => setSelectedStore("all")}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                        selectedStore === "all" ? "bg-fresh-50 text-fresh-700 font-bold" : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      <span>All Stores ({stores.length})</span>
                    </button>
                    {stores.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => setSelectedStore(s.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between ${
                          selectedStore === s.id ? "bg-fresh-50 text-fresh-700 font-bold" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        <span className="truncate">{s.name}</span>
                        <span className="text-[10px] text-amber-500 font-bold">★ {s.rating}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price Slider */}
                <div>
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-slate-500 uppercase tracking-wider">Max Price</span>
                    <span className="text-fresh-700">${maxPrice.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="30"
                    step="1"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-fresh-600 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>$3.00</span>
                    <span>$30.00</span>
                  </div>
                </div>

              </div>
            </aside>

            {/* Right Product Grid */}
            <div className="flex-1">
              
              {/* Header Bar: Results count & Sort */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-lg font-bold text-slate-900 leading-tight">
                    Marketplace & Catalog
                  </h1>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Showing <span className="font-bold text-slate-800">{filteredProducts.length}</span> organic grocery items (Live Supabase Sync)
                  </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                  {/* Sort Dropdown */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 font-semibold">Sort by:</span>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-fresh-600"
                    >
                      <option value="featured">Featured Picks</option>
                      <option value="rating">Highest Rated (★ 5.0)</option>
                      <option value="price-low">Price: Low to High</option>
                      <option value="price-high">Price: High to Low</option>
                    </select>
                  </div>

                  {/* Grid/List Toggle */}
                  <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === "grid" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-lg transition-colors ${
                        viewMode === "list" ? "bg-white text-slate-900 shadow-sm" : "text-slate-400 hover:text-slate-700"
                      }`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Products Display */}
              {filteredProducts.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                    <Search className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-slate-800">No items match your criteria</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try loosening your filters or selecting "All Departments" to explore our full grocery catalogue.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedStore("all");
                      setOrganicOnly(false);
                      setMaxPrice(30);
                    }}
                    className="px-4 py-2 rounded-xl bg-fresh-600 text-white font-bold text-xs"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProducts.map((p) => (
                    <div
                      key={p.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-fresh-500 shadow-sm transition-all flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        <img src={p.image} alt={p.name} className="w-20 h-20 rounded-xl object-cover bg-slate-100" />
                        <div>
                          <span className="text-[11px] text-slate-500 font-medium">{p.storeName}</span>
                          <Link href={`/product/${p.id}`} className="font-bold text-sm text-slate-900 hover:text-fresh-600 block">
                            {p.name}
                          </Link>
                          <p className="text-xs text-slate-400 mt-0.5">{p.unit} • {p.origin}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-extrabold text-fresh-600">{formatPrice(p.price)}</span>
                            {p.originalPrice && (
                              <span className="text-xs text-slate-400 line-through">{formatPrice(p.originalPrice)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <Link
                        href={`/product/${p.id}`}
                        className="px-4 py-2 rounded-xl bg-fresh-600 text-white font-bold text-xs hover:bg-fresh-700 transition-colors shrink-0"
                      >
                        View Details
                      </Link>
                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>

        </div>
      </main>

      <CustomerFooter />
    </>
  );
}
