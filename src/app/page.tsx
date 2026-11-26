"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import { ProductCard } from "@/components/ui/ProductCard";
import { FlashDealsBanner } from "@/components/ui/FlashDealsBanner";
import { PRODUCTS, STORES, CATEGORIES, Product, Store, Category } from "@/data/mockData";
import { getLiveProducts, getLiveStores, getLiveCategories } from "@/lib/data/supabaseData";
import { getCustomerWishlistIds } from "@/lib/data/customerData";
import { useAuthStore } from "@/lib/store/authStore";
import { 
  Zap, 
  Store as StoreIcon, 
  ShieldCheck, 
  Star, 
  ArrowRight, 
  Leaf, 
  Sparkles,
  ShoppingBag,
  TrendingUp,
  Clock,
  CheckCircle2,
  Loader2
} from "lucide-react";

export default function HomePage() {
  const [productFilter, setProductFilter] = useState<"all" | "organic" | "local">("all");
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [stores, setStores] = useState<Store[]>(STORES);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();

  useEffect(() => {
    if (user?.id) {
      getCustomerWishlistIds(user.id).then(setWishlistIds);
    }
  }, [user?.id]);

  useEffect(() => {
    async function loadLiveData() {
      try {
        const [liveProds, liveStores, liveCats] = await Promise.all([
          getLiveProducts(),
          getLiveStores(),
          getLiveCategories(),
        ]);
        if (liveProds && liveProds.length > 0) setProducts(liveProds);
        if (liveStores && liveStores.length > 0) setStores(liveStores);
        if (liveCats && liveCats.length > 0) setCategories(liveCats);
      } catch (err) {
        console.warn("Using offline fallback:", err);
      } finally {
        setLoading(false);
      }
    }
    loadLiveData();
  }, []);

  const filteredProducts = products.filter((p) => {
    if (productFilter === "organic") return p.organic;
    if (productFilter === "local") return (p.origin || "").includes("NY") || (p.origin || "").includes("Brooklyn");
    return true;
  });

  return (
    <>
      <CustomerHeader />

      <main className="min-h-screen bg-slate-50">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6 pt-6 pb-20">

          {/* Hero Showcase Section */}
          <section className="relative w-full rounded-3xl bg-emerald-900 text-white overflow-hidden shadow-xl shadow-emerald-950/20">
            {/* Ambient Background Glows */}
            <div className="absolute -right-20 -top-20 w-96 h-96 rounded-full bg-fresh-500/20 blur-3xl pointer-events-none" />
            <div className="absolute left-1/4 -bottom-20 w-80 h-80 rounded-full bg-harvest-500/20 blur-3xl pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center p-6 sm:p-10 lg:p-14 relative z-10">
              
              {/* Left Content */}
              <div className="lg:col-span-7 flex flex-col items-start space-y-5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-emerald-300 border border-white/10 text-xs font-bold uppercase tracking-wider">
                  <Leaf className="w-3.5 h-3.5 text-fresh-400" />
                  <span>100% Guaranteed Freshness or Instant Refund</span>
                </div>

                <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                  Fresh Organic Groceries Delivered to Your Doorstep{" "}
                  <span className="text-fresh-400 underline decoration-harvest-400 decoration-4 underline-offset-8">
                    in 30 Mins
                  </span>
                </h1>

                <p className="text-slate-300 text-sm sm:text-base max-w-xl leading-relaxed">
                  Shop directly from certified organic family farms, artisan sourdough bakeries, and wild seafood mongers across Brooklyn, harvested fresh this morning.
                </p>

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-3 pt-2 w-full sm:w-auto">
                  <Link
                    href="/catalog"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-fresh-600 hover:bg-fresh-500 text-white text-sm font-bold shadow-lg shadow-fresh-600/30 transition-all hover:scale-105 active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Shop Fresh Now</span>
                  </Link>
                  <Link
                    href="/stores"
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-bold border border-white/20 backdrop-blur-md transition-colors"
                  >
                    <StoreIcon className="w-4 h-4 text-emerald-300" />
                    <span>Explore Stores ({stores.length})</span>
                  </Link>
                </div>

                {/* Micro trust proof */}
                <div className="flex items-center gap-3 pt-2">
                  <div className="flex -space-x-2 overflow-hidden">
                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-emerald-950 object-cover" src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80" alt="Farmer" />
                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-emerald-950 object-cover" src="https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=100&q=80" alt="Baker" />
                    <img className="inline-block h-8 w-8 rounded-full ring-2 ring-emerald-950 object-cover" src="https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&w=100&q=80" alt="Butcher" />
                  </div>
                  <p className="text-xs text-slate-300">
                    Trusted by <span className="font-bold text-white">34,000+ Brooklyn families</span> today
                  </p>
                </div>
              </div>

              {/* Right Visual Image & Cold Chain Pill */}
              <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
                <div className="relative w-full max-w-[460px] aspect-[4/3] sm:aspect-square rounded-2xl overflow-hidden shadow-2xl bg-slate-800 border border-white/10">
                  <img
                    src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800"
                    alt="Fresh organic harvest"
                    className="w-full h-full object-cover"
                  />
                  {/* Floating Cold Chain Pill */}
                  <div className="absolute bottom-4 left-4 right-4 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-white/10 shadow-lg flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                        <Zap className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white leading-none">Cold-Chain Speed Hub</p>
                        <p className="text-[10px] text-slate-400 mt-1">Under 4°C temperature locked</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/30 text-emerald-300 text-[10px] font-bold uppercase tracking-wider">
                      Live
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* Quick Delivery Stats Bar */}
            <div className="w-full bg-emerald-950/80 border-t border-white/10 px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-fresh-500/20 text-fresh-400 flex items-center justify-center shrink-0">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">30-min express</p>
                  <p className="text-[11px] text-slate-400">Rapid hyper-local dropoff</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-fresh-500/20 text-fresh-400 flex items-center justify-center shrink-0">
                  <StoreIcon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{stores.length} live stores</p>
                  <p className="text-[11px] text-slate-400">Independent verified grocers</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-harvest-500/20 text-harvest-400 flex items-center justify-center shrink-0">
                  <Leaf className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">100% Organic Direct</p>
                  <p className="text-[11px] text-slate-400">Certified farm items</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                  <Star className="w-4 h-4 fill-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">4.9/5 satisfaction</p>
                  <p className="text-[11px] text-slate-400">From 85k+ reviews</p>
                </div>
              </div>
            </div>
          </section>

          {/* Flash Harvest Deals with Countdown */}
          <FlashDealsBanner />

          {/* Grocery Categories Grid */}
          <section className="mt-14">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-fresh-600 mb-1">
                  Explore Aisle by Aisle
                </p>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Popular Grocery Categories
                </h2>
              </div>
              <Link href="/catalog" className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-fresh-600 hover:text-fresh-700">
                <span>View All Departments</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/catalog?category=${cat.id}`}
                  className="group bg-white p-3.5 rounded-2xl border border-slate-200/80 hover:border-fresh-500 hover:shadow-lg hover:shadow-fresh-500/5 transition-all text-center flex flex-col items-center justify-center"
                >
                  <div className={`w-12 h-12 rounded-2xl ${cat.bgColor} ${cat.textColor} flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform`}>
                    <Leaf className="w-5 h-5" />
                  </div>
                  <span className="font-bold text-xs text-slate-900 group-hover:text-fresh-600 transition-colors line-clamp-1">
                    {cat.name}
                  </span>
                  <span className="text-[10px] text-slate-400 mt-0.5">{cat.itemCount} items</span>
                </Link>
              ))}
            </div>
          </section>

          {/* Brooklyn's Most Loved Groceries Grid */}
          <section className="mt-14">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-fresh-600 uppercase tracking-wider mb-1">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Picked Fresh Daily • Live from Supabase</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Brooklyn's Most Loved Groceries
                </h2>
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  onClick={() => setProductFilter("all")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    productFilter === "all" ? "bg-white text-slate-900 font-bold shadow-sm" : "hover:text-slate-900"
                  }`}
                >
                  All Items ({products.length})
                </button>
                <button
                  onClick={() => setProductFilter("organic")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    productFilter === "organic" ? "bg-white text-slate-900 font-bold shadow-sm" : "hover:text-slate-900"
                  }`}
                >
                  100% Organic
                </button>
                <button
                  onClick={() => setProductFilter("local")}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    productFilter === "local" ? "bg-white text-slate-900 font-bold shadow-sm" : "hover:text-slate-900"
                  }`}
                >
                  Local NY Farms
                </button>
              </div>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  initialWishlisted={wishlistIds.includes(product.id)}
                />
              ))}
            </div>
          </section>

          {/* Featured Grocery Stores */}
          <section className="mt-16">
            <div className="flex items-end justify-between mb-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-fresh-600 mb-1">
                  Community Partner Network
                </p>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Featured Local Grocery Stores
                </h2>
              </div>
              <Link href="/stores" className="text-xs font-bold text-fresh-600 hover:text-fresh-700 flex items-center gap-1">
                <span>View All Stores ({stores.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {stores.map((store) => (
                <Link
                  key={store.id}
                  href={`/stores/${store.slug}`}
                  className="group bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:border-fresh-500 hover:shadow-xl hover:shadow-fresh-500/5 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Store Banner */}
                    <div className="relative h-32 w-full bg-slate-100 overflow-hidden">
                      <img
                        src={store.banner}
                        alt={store.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-slate-900/80 backdrop-blur-sm text-white font-bold text-[10px]">
                        {store.deliveryTime}
                      </div>
                    </div>

                    {/* Logo & Details */}
                    <div className="p-4 pt-0 relative">
                      <div className="w-12 h-12 rounded-xl border-2 border-white bg-white shadow-md overflow-hidden -mt-6 mb-2 relative z-10">
                        <img src={store.logo} alt={store.name} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-bold text-slate-900 text-sm group-hover:text-fresh-600 transition-colors">
                          {store.name}
                        </h3>
                        <div className="flex items-center gap-0.5 text-amber-500 font-bold text-xs">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span>{store.rating}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {store.description}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-1 mt-3">
                        {store.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 border-t border-slate-100 text-xs font-semibold text-slate-500 flex items-center justify-between">
                    <span>${store.deliveryFee} Delivery</span>
                    <span className="text-fresh-600 group-hover:translate-x-1 transition-transform inline-flex items-center gap-0.5 font-bold">
                      Visit Store <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Freshness Guarantee Assurance Box */}
          <section className="mt-16 rounded-3xl bg-slate-900 text-white p-8 sm:p-10 relative overflow-hidden">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
              <div className="md:col-span-8 space-y-3">
                <span className="px-3 py-1 rounded-full bg-fresh-500/20 text-fresh-400 text-xs font-bold uppercase tracking-wider">
                  The FreshMart Promise
                </span>
                <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Every Apple, Loaf, and Egg Inspected Before Dispatch
                </h3>
                <p className="text-slate-300 text-xs sm:text-sm max-w-xl leading-relaxed">
                  Our cold-chain couriers maintain sub-4°C thermal containers during transit. If any produce or refrigerated grocery item arrives bruised, sour, or warm, claim an instant refund with zero hassles in our Return Center.
                </p>
                <div className="pt-2">
                  <Link
                    href="/refunds"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-fresh-600 hover:bg-fresh-500 text-white text-xs font-bold transition-all"
                  >
                    <span>View Refund & Return Center</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              <div className="md:col-span-4 flex flex-col gap-3">
                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-fresh-400 shrink-0" />
                  <span className="text-xs font-semibold">100% Instant Freshness Guarantee</span>
                </div>
                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-fresh-400 shrink-0" />
                  <span className="text-xs font-semibold">Regenerative & Zero Pesticide Farms</span>
                </div>
                <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700 flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-fresh-400 shrink-0" />
                  <span className="text-xs font-semibold">Live Courier GPS & Temperature Logs</span>
                </div>
              </div>
            </div>
          </section>

        </div>
      </main>

      <CustomerFooter />
    </>
  );
}
