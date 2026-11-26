"use client";

import { useState, useEffect } from "react";
import { Clock, Zap, ShoppingBasket, Check } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { Product } from "@/data/mockData";
import { getFlashDealProducts } from "@/lib/data/customerData";
import { getLiveProducts } from "@/lib/data/supabaseData";
import { useCartStore } from "@/lib/store/cartStore";

export function FlashDealsBanner() {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 22, seconds: 18 });
  const [deals, setDeals] = useState<Product[]>([]);
  const [addedId, setAddedId] = useState<string | null>(null);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    async function loadDeals() {
      let prods = await getFlashDealProducts();
      if (prods.length === 0) {
        const all = await getLiveProducts();
        prods = all.slice(0, 2);
      }
      setDeals(prods.slice(0, 2));
    }
    loadDeals();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: 59, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleQuickAdd = (p: Product) => {
    addItem({
      id: p.id,
      name: p.name,
      price: p.price,
      originalPrice: p.originalPrice,
      unit: p.unit,
      image: p.image,
      storeId: p.storeId,
      storeName: p.storeName,
      stock: p.stock,
      organic: p.organic,
      quantity: 1,
    });
    setAddedId(p.id);
    setTimeout(() => setAddedId(null), 1200);
  };

  if (deals.length === 0) return null;

  return (
    <section className="mt-12 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 p-6 sm:p-8 text-white shadow-xl shadow-amber-500/10 relative overflow-hidden">
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md text-amber-100 text-xs font-bold uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Today&apos;s Fresh Harvest Mega Drop</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Limited-Time Flash Deals
          </h2>
          <p className="text-amber-100 text-xs sm:text-sm mt-1">
            Hand-picked surplus organic fruits and cold-pressed pantry essentials up to 50% off.
          </p>
        </div>

        {/* Live Countdown Timer */}
        <div className="flex items-center gap-2 bg-black/25 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10 shrink-0">
          <Clock className="w-4 h-4 text-amber-200" />
          <span className="text-xs uppercase font-extrabold text-amber-200 tracking-wider mr-1">Ends in:</span>
          <div className="flex items-center gap-1 font-mono font-extrabold text-base text-white">
            <span className="px-2 py-0.5 rounded-lg bg-black/30">
              {String(timeLeft.hours).padStart(2, "0")}
            </span>
            <span>:</span>
            <span className="px-2 py-0.5 rounded-lg bg-black/30">
              {String(timeLeft.minutes).padStart(2, "0")}
            </span>
            <span>:</span>
            <span className="px-2 py-0.5 rounded-lg bg-black/30">
              {String(timeLeft.seconds).padStart(2, "0")}
            </span>
          </div>
        </div>
      </div>

      {/* 2 Live Deal Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {deals.map((deal) => (
          <div
            key={deal.id}
            className="bg-white rounded-2xl p-4 text-slate-900 flex items-center justify-between gap-4 shadow-sm"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <Link href={`/product/${deal.id}`} className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                <img
                  src={deal.image}
                  alt={deal.name}
                  className="w-full h-full object-cover"
                />
              </Link>
              <div className="min-w-0">
                <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold text-[10px] uppercase">
                  {deal.discountBadge || "Flash Deal"}
                </span>
                <Link href={`/product/${deal.id}`} className="block">
                  <h4 className="font-bold text-sm text-slate-900 mt-1 hover:text-fresh-700 truncate">
                    {deal.name}
                  </h4>
                </Link>
                <p className="text-xs text-slate-500 truncate">
                  {deal.unit} • {deal.storeName}
                </p>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-base font-extrabold text-fresh-600">{formatPrice(deal.price)}</span>
                  {deal.originalPrice && (
                    <span className="text-xs text-slate-400 line-through">{formatPrice(deal.originalPrice)}</span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleQuickAdd(deal)}
              title="Add Flash Deal to Cart"
              className="w-10 h-10 rounded-full bg-fresh-600 hover:bg-fresh-700 text-white flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95 shadow-md shadow-fresh-600/20"
            >
              {addedId === deal.id ? <Check className="w-4 h-4" /> : <ShoppingBasket className="w-4 h-4" />}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
