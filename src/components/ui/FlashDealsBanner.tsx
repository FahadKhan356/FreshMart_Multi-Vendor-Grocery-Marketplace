"use client";

import { useState, useEffect } from "react";
import { Clock, Zap, ArrowRight, ShoppingBasket } from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export function FlashDealsBanner() {
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 22, seconds: 18 });

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

  return (
    <section className="mt-12 rounded-3xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 p-6 sm:p-8 text-white shadow-xl shadow-amber-500/10 relative overflow-hidden">
      <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 mb-8">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/20 backdrop-blur-md text-amber-100 text-xs font-bold uppercase tracking-wider mb-2">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Today's Fresh Harvest Mega Drop</span>
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

      {/* 2 Deal Showcase Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Deal 1 */}
        <div className="bg-white rounded-2xl p-4 text-slate-900 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAIiFI_H-8e5vYi13cCndkMSgViGwg5i7rjfXLZyhHVJOBmJBYZ0IsaT_VM1NDud2d32xqM5Ke9rOjcW0x0jaltPM-858FltvWtrURzZwL99v_BhxsOzYApZRVx4os_sLvuALqjpUujwbqByIC_Z9kBwqGs0U7v8pBnStCCzFeYeeqdG0ksPospphtfQRzyAJtjHsX_e0TbJeSIOgflGEr_IKRMggcWa5arvZCJ5niF"
                alt="Strawberries BOGO"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-700 font-bold text-[10px] uppercase">
                BOGO Free Today
              </span>
              <h4 className="font-bold text-sm text-slate-900 mt-1">Sweet Driscoll Strawberries</h4>
              <p className="text-xs text-slate-500">1 lb clamshell • GreenField Organic</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base font-extrabold text-fresh-600">$4.49</span>
                <span className="text-xs text-slate-400 line-through">$8.98</span>
              </div>
            </div>
          </div>

          <Link
            href="/cart"
            className="w-10 h-10 rounded-full bg-fresh-600 hover:bg-fresh-700 text-white flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95 shadow-md shadow-fresh-600/20"
          >
            <ShoppingBasket className="w-4 h-4" />
          </Link>
        </div>

        {/* Deal 2 */}
        <div className="bg-white rounded-2xl p-4 text-slate-900 flex items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-100 shrink-0">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAFZwavzxQ5pGrqEEzGPoXjjyg2tv_aFpyLiaJSOXUPVFZXOjnRc241ZS4KvF6bgut8Tw7QuK_YFXnO2YWcmpZXJmqM0mqIEP3SMjmz1qhrknKcvsrdvwwSlPsUcL5RPP3TSiBlrorMvYEGsTsPaI0uci-CvJGuRH_TIFWtc7RLIJQB38ON-2BaYyYwAbVZjeNkf-KcP-6A9gjej_LWTYwda8cSTpRZWppB5yyKcmzJ"
                alt="Estate Cold-Pressed Olive Oil"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold text-[10px] uppercase">
                25% OFF
              </span>
              <h4 className="font-bold text-sm text-slate-900 mt-1">Cold-Pressed Extra Virgin Olive Oil</h4>
              <p className="text-xs text-slate-500">500 ml glass • GreenField Organic</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-base font-extrabold text-fresh-600">$13.50</span>
                <span className="text-xs text-slate-400 line-through">$18.00</span>
              </div>
            </div>
          </div>

          <Link
            href="/cart"
            className="w-10 h-10 rounded-full bg-fresh-600 hover:bg-fresh-700 text-white flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95 shadow-md shadow-fresh-600/20"
          >
            <ShoppingBasket className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
