"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import { ProductCard } from "@/components/ui/ProductCard";
import { STORES, PRODUCTS, Store, Product } from "@/data/mockData";
import { getLiveStoreBySlug, getLiveProducts } from "@/lib/data/supabaseData";
import { 
  Star, 
  Clock, 
  MapPin, 
  ShieldCheck, 
  Search, 
  ChevronRight,
  Percent
} from "lucide-react";

export default function StoreDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  
  const [store, setStore] = useState<Store>(
    () => STORES.find((s) => s.slug === slug) || STORES[0]
  );
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [activeCategory, setActiveCategory] = useState("all");
  const [storeSearch, setStoreSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStoreData() {
      try {
        if (!slug) return;
        const liveStore = await getLiveStoreBySlug(slug);
        if (liveStore) {
          setStore(liveStore);
          const liveProducts = await getLiveProducts({ storeId: liveStore.id });
          if (liveProducts.length > 0) {
            setProducts(liveProducts);
          }
        } else {
          // fallback to all live products
          const liveProducts = await getLiveProducts();
          if (liveProducts.length > 0) {
            setProducts(liveProducts);
          }
        }
      } catch (err) {
        console.error("Failed to load live store data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStoreData();
  }, [slug]);

  const storeProducts = products.filter((p) => {
    const matchesCategory =
      activeCategory === "all" ||
      (activeCategory === "organic" && p.organic) ||
      (activeCategory === "flash" && p.discountBadge);
    const matchesSearch =
      !storeSearch ||
      p.name.toLowerCase().includes(storeSearch.toLowerCase()) ||
      p.description.toLowerCase().includes(storeSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });


  return (
    <>
      <CustomerHeader />

      <main className="min-h-screen bg-slate-50 pb-20">
        
        {/* Store Hero Banner */}
        <div className="relative h-64 sm:h-80 w-full bg-slate-900 overflow-hidden">
          <img
            src={store.banner}
            alt={store.name}
            className="w-full h-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          
          <div className="absolute top-6 left-6 flex items-center gap-2 text-xs font-medium text-white/80">
            <Link href="/" className="hover:text-white">Home</Link>
            <ChevronRight className="w-3 h-3 text-white/50" />
            <Link href="/stores" className="hover:text-white">Stores</Link>
            <ChevronRight className="w-3 h-3 text-white/50" />
            <span className="text-white font-bold">{store.name}</span>
          </div>
        </div>

        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 -mt-20 relative z-10">
          
          {/* Store Info Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl shadow-slate-900/5 mb-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
              
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-2xl border-2 border-white bg-white shadow-lg overflow-hidden shrink-0">
                  <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {store.name}
                    </h1>
                    <span className="px-2 py-0.5 rounded-full bg-fresh-100 text-fresh-700 text-xs font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Certified
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
                    {store.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-600 mt-3">
                    <span className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-3.5 h-3.5 fill-amber-400" /> {store.rating} ({store.reviewsCount} reviews)
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-fresh-600" /> {store.deliveryTime} express
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" /> {store.address}
                    </span>
                  </div>
                </div>
              </div>

              {/* Store Specific Offer Pill */}
              <div className="p-4 rounded-2xl bg-fresh-50 border border-fresh-200/70 shrink-0 space-y-1">
                <div className="flex items-center gap-1.5 text-fresh-800 text-xs font-bold">
                  <Percent className="w-4 h-4 text-fresh-600" />
                  <span>Store Offer: Spend $35 get Free Delivery</span>
                </div>
                <p className="text-[11px] text-fresh-700 font-medium">Use code GREENFRESH at checkout</p>
              </div>

            </div>

            {/* In-store Search & Category bar */}
            <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto no-scrollbar pb-1 text-xs font-bold">
                <button
                  onClick={() => setActiveCategory("all")}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    activeCategory === "all" ? "bg-fresh-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All Store Items
                </button>
                <button
                  onClick={() => setActiveCategory("organic")}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    activeCategory === "organic" ? "bg-fresh-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Fresh Produce
                </button>
                <button
                  onClick={() => setActiveCategory("flash")}
                  className={`px-4 py-2 rounded-xl transition-all ${
                    activeCategory === "flash" ? "bg-fresh-600 text-white shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  Today's Discounts
                </button>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={`Search ${store.name}...`}
                  value={storeSearch}
                  onChange={(e) => setStoreSearch(e.target.value)}
                  className="w-full bg-slate-100 rounded-xl pl-9 pr-4 py-2 text-xs font-medium outline-none focus:bg-white focus:ring-2 focus:ring-fresh-600 border border-transparent focus:border-fresh-200"
                />
              </div>
            </div>
          </div>

          {/* Store Products Grid */}
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Aisle Inventory ({storeProducts.length} items)
            </h2>
            <span className="text-xs text-slate-500 font-medium">Delivered directly in refrigerated insulation packs</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {storeProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

        </div>
      </main>

      <CustomerFooter />
    </>
  );
}
