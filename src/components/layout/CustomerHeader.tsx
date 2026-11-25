"use client";

import Link from "next/link";
import { useState } from "react";
import { 
  Search, 
  MapPin, 
  ShoppingBasket, 
  User, 
  ChevronDown, 
  Store, 
  Percent, 
  Receipt, 
  Bell,
  Sparkles,
  Command,
  Heart
} from "lucide-react";
import { CATEGORIES } from "@/data/mockData";

export function CustomerHeader() {
  const [searchQuery, setSearchQuery] = useState("");
  const [cartCount, setCartCount] = useState(3);
  const [cartTotal, setCartTotal] = useState(42.80);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
        {/* Main Row */}
        <div className="h-20 flex items-center justify-between gap-4">
          
          {/* Logo & Location */}
          <div className="flex items-center gap-6 shrink-0">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl bg-fresh-600 flex items-center justify-center text-white shadow-md shadow-fresh-600/20 group-hover:bg-fresh-700 transition-all">
                <span className="text-xl font-black">🥬</span>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-fresh-900 group-hover:text-fresh-600 transition-colors">
                  FreshMart
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider text-fresh-600 leading-none">
                  Organic Direct
                </span>
              </div>
            </Link>

            {/* Delivery address button */}
            <button className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/70 text-slate-800 transition-colors text-left">
              <MapPin className="w-4 h-4 text-fresh-600 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-500 font-medium leading-none">Deliver to</span>
                <span className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                  742 Evergreen Terrace (25-35m)
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-2 hidden md:block">
            <div className="relative flex items-center w-full h-11 bg-slate-100 rounded-2xl px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-fresh-600 focus-within:shadow-md transition-all">
              <button className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold pr-3 border-r border-slate-200 shrink-0 hover:text-fresh-700">
                <Store className="w-3.5 h-3.5 text-fresh-600" />
                <span>All Stores</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              <Search className="w-4 h-4 text-slate-400 ml-3 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search farm fresh produce, sourdough, pasture dairy, artisan meat..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none"
              />
              <span className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-bold">
                <Command className="w-2.5 h-2.5" /> K
              </span>
            </div>
          </div>

          {/* Quick Links & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600 mr-2">
              <Link href="/catalog" className="hover:text-fresh-700 transition-colors">
                Browse Aisle
              </Link>
              <Link href="/stores" className="hover:text-fresh-700 transition-colors">
                Local Farms (45+)
              </Link>
              <Link href="/account" className="hover:text-fresh-700 transition-colors flex items-center gap-1">
                <span>Orders</span>
              </Link>
              <Link href="/refunds" className="text-harvest-700 hover:text-harvest-800 transition-colors flex items-center gap-1 font-bold">
                <Sparkles className="w-3.5 h-3.5 text-harvest-500" />
                <span>Freshness Guarantee</span>
              </Link>
            </nav>

            {/* Cart Button */}
            <Link
              href="/cart"
              className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-fresh-600 hover:bg-fresh-700 text-white font-bold text-xs shadow-md shadow-fresh-600/20 transition-all hover:scale-[1.02] active:scale-95"
            >
              <ShoppingBasket className="w-4 h-4" />
              <span className="hidden sm:inline font-semibold">{cartCount} items</span>
              <span className="font-extrabold px-1.5 py-0.5 rounded bg-fresh-700/60">${cartTotal.toFixed(2)}</span>
            </Link>

            {/* Account Icon */}
            <Link
              href="/account"
              className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 transition-colors text-slate-700"
            >
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-xs text-slate-700 overflow-hidden">
                SJ
              </div>
              <span className="hidden xl:inline text-xs font-bold text-slate-800">Sarah J.</span>
            </Link>
          </div>

        </div>

        {/* Categories Quick Navigation Strip */}
        <div className="flex items-center gap-4 overflow-x-auto py-2.5 border-t border-slate-100 text-xs font-semibold text-slate-600 no-scrollbar whitespace-nowrap">
          <Link href="/catalog" className="flex items-center gap-1.5 text-fresh-700 font-bold hover:text-fresh-800 shrink-0">
            <span>All Departments</span>
          </Link>
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.id}
              href={`/catalog?category=${cat.id}`}
              className="hover:text-fresh-600 transition-colors shrink-0 text-slate-600"
            >
              {cat.name}
            </Link>
          ))}
          <Link href="/catalog?discount=true" className="text-rose-600 hover:text-rose-700 font-bold shrink-0 ml-auto flex items-center gap-1">
            <Percent className="w-3 h-3" />
            <span>Today's Flash Deals</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
