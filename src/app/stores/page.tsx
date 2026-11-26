"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import { STORES, Store } from "@/data/mockData";
import { getLiveStores } from "@/lib/data/supabaseData";
import { Star, ArrowRight, MapPin, Clock, Search } from "lucide-react";

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>(STORES);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStores() {
      try {
        const liveStores = await getLiveStores();
        if (liveStores && liveStores.length > 0) {
          setStores(liveStores);
        }
      } catch (err) {
        console.warn("Using offline stores:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStores();
  }, []);

  const filtered = stores.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.address.toLowerCase().includes(q)
    );
  });

  return (
    <>
      <CustomerHeader />

      <main className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-fresh-600">Verified Farm Direct</span>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
                Independent Grocery Stores &amp; Family Farms
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
                Order directly from certified organic farms, century-old Italian delis, artisanal sourdough bakeries, and wild seafood mongers across Brooklyn.
              </p>
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search stores or neighborhoods..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium outline-none focus:ring-2 focus:ring-fresh-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((store) => (
              <Link
                key={store.id}
                href={`/stores/${store.slug}`}
                className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:border-fresh-500 hover:shadow-xl hover:shadow-fresh-500/5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-40 w-full bg-slate-100 overflow-hidden">
                    <img
                      src={store.banner}
                      alt={store.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md text-white font-bold text-xs flex items-center gap-1">
                      <Clock className="w-3 h-3 text-fresh-400" />
                      <span>{store.deliveryTime}</span>
                    </div>
                  </div>

                  <div className="p-5 pt-0 relative">
                    <div className="w-14 h-14 rounded-2xl border-2 border-white bg-white shadow-md overflow-hidden -mt-7 mb-3 relative z-10">
                      <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                    </div>

                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-bold text-slate-900 text-base group-hover:text-fresh-600 transition-colors">
                        {store.name}
                      </h3>
                      <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        <span>{store.rating}</span>
                        <span className="text-slate-400 font-normal">({store.reviewsCount})</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{store.address} ({store.distance})</span>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {store.description}
                    </p>

                    <div className="flex flex-wrap gap-1 mt-4">
                      {store.tags.map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3.5 border-t border-slate-100 text-xs font-semibold text-slate-500 flex items-center justify-between bg-slate-50/50">
                  <span>${store.deliveryFee} Delivery • Min ${store.minOrder}</span>
                  <span className="text-fresh-600 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                    Enter Store <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>

          {!loading && filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500">
              No stores matched &ldquo;{search}&rdquo;.
            </div>
          )}
        </div>
      </main>

      <CustomerFooter />
    </>
  );
}
