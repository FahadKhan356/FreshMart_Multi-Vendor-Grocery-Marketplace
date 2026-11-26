"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import {
  Search,
  MapPin,
  ShoppingBasket,
  ChevronDown,
  Store,
  Percent,
  Sparkles,
  Command,
  X,
  Check,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { CATEGORIES, type Category, type Product, type Store as StoreType } from "@/data/mockData";
import { getLiveCategories, getLiveStores } from "@/lib/data/supabaseData";
import {
  searchCatalogLive,
  getCustomerAddresses,
  type CustomerAddress,
} from "@/lib/data/customerData";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import { formatPrice } from "@/lib/utils";

export function CustomerHeader() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mounted, setMounted] = useState(false);

  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [stores, setStores] = useState<StoreType[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<string>("all");
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);

  const [suggestions, setSuggestions] = useState<{ products: Product[]; stores: StoreType[] }>({
    products: [],
    stores: [],
  });
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searching, setSearching] = useState(false);

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("Select delivery address");
  const [addressDropdownOpen, setAddressDropdownOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchBoxRef = useRef<HTMLDivElement>(null);
  const addressBoxRef = useRef<HTMLDivElement>(null);

  const cartItems = useCartStore((s) => s.items);
  const getTotal = useCartStore((s) => s.getTotal);
  const { user } = useAuthStore();
  const role = user?.role || "customer";

  useEffect(() => {
    setMounted(true);
    const savedAddr = typeof window !== "undefined" ? localStorage.getItem("freshmart_selected_address") : null;
    if (savedAddr) setSelectedAddress(savedAddr);

    Promise.all([getLiveCategories(), getLiveStores()]).then(([cats, strs]) => {
      if (cats.length > 0) setCategories(cats);
      if (strs.length > 0) setStores(strs);
    });
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    getCustomerAddresses(user.id).then((addrs) => {
      setAddresses(addrs);
      if (addrs.length > 0) {
        const def = addrs.find((a) => a.is_default) || addrs[0];
        const label = `${def.address}${def.apartment ? `, ${def.apartment}` : ""}`;
        setSelectedAddress((prev) => (prev === "Select delivery address" ? label : prev));
      }
    });
  }, [user?.id]);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
        setStoreDropdownOpen(false);
        setAddressDropdownOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Outside click handler
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
        setStoreDropdownOpen(false);
      }
      if (addressBoxRef.current && !addressBoxRef.current.contains(e.target as Node)) {
        setAddressDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Debounced live search
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setSuggestions({ products: [], stores: [] });
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      const res = await searchCatalogLive(q, selectedStoreId);
      setSuggestions(res);
      setSearching(false);
      setShowSuggestions(true);
    }, 220);
    return () => clearTimeout(timer);
  }, [searchQuery, selectedStoreId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (selectedStoreId !== "all") params.set("store", selectedStoreId);
    router.push(`/catalog${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const selectedStoreLabel =
    selectedStoreId === "all"
      ? "All Stores"
      : stores.find((s) => s.id === selectedStoreId)?.name || "Store";

  const cartCount = mounted ? cartItems.reduce((acc, i) => acc + i.quantity, 0) : 0;
  const cartTotal = mounted ? getTotal() : 0;

  const initials =
    mounted && user?.fullName
      ? user.fullName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
      : "G";
  const firstName = mounted && user?.fullName ? user.fullName.split(" ")[0] : "Guest";

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

            {/* Delivery address selector */}
            <div className="relative hidden xl:block" ref={addressBoxRef}>
              <button
                type="button"
                onClick={() => setAddressDropdownOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/70 text-slate-800 transition-colors text-left"
              >
                <MapPin className="w-4 h-4 text-fresh-600 shrink-0" />
                <div className="flex flex-col">
                  <span className="text-[10px] text-slate-500 font-medium leading-none">Deliver to</span>
                  <span className="text-xs font-bold text-slate-900 truncate max-w-[180px]">
                    {selectedAddress}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {addressDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-xl p-3 z-50 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 px-2">
                    Saved Delivery Addresses
                  </p>
                  {addresses.length === 0 ? (
                    <p className="text-xs text-slate-500 px-2 py-2">
                      No saved addresses yet. Add one in your account.
                    </p>
                  ) : (
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                      {addresses.map((addr) => {
                        const text = `${addr.address}${addr.apartment ? `, ${addr.apartment}` : ""}`;
                        const active = selectedAddress === text;
                        return (
                          <button
                            key={addr.id}
                            type="button"
                            onClick={() => {
                              setSelectedAddress(text);
                              localStorage.setItem("freshmart_selected_address", text);
                              setAddressDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                              active ? "bg-fresh-50 text-fresh-800 font-bold" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="min-w-0">
                              <span className="text-[10px] uppercase font-bold text-fresh-600 block">
                                {addr.label}
                              </span>
                              <span className="truncate block">{text}</span>
                            </div>
                            {active && <Check className="w-3.5 h-3.5 text-fresh-600 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <Link
                    href="/account?tab=addresses"
                    onClick={() => setAddressDropdownOpen(false)}
                    className="block text-center py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                  >
                    Manage Addresses
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-2xl mx-2 hidden md:block relative" ref={searchBoxRef}>
            <form
              onSubmit={handleSearchSubmit}
              className="relative flex items-center w-full h-11 bg-slate-100 rounded-2xl px-3 focus-within:bg-white focus-within:ring-2 focus-within:ring-fresh-600 focus-within:shadow-md transition-all"
            >
              <button
                type="button"
                onClick={() => setStoreDropdownOpen((o) => !o)}
                className="flex items-center gap-1.5 text-slate-600 text-xs font-semibold pr-3 border-r border-slate-200 shrink-0 hover:text-fresh-700 max-w-[140px]"
              >
                <Store className="w-3.5 h-3.5 text-fresh-600 shrink-0" />
                <span className="truncate">{selectedStoreLabel}</span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              <Search className="w-4 h-4 text-slate-400 ml-3 mr-2 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onFocus={() => {
                  if (searchQuery.trim().length >= 2) setShowSuggestions(true);
                }}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search farm fresh produce, sourdough, pasture dairy, artisan meat..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 outline-none"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setSuggestions({ products: [], stores: [] });
                    setShowSuggestions(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="hidden lg:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 text-[10px] font-bold">
                  <Command className="w-2.5 h-2.5" /> K
                </span>
              )}
            </form>

            {/* Store Filter Dropdown */}
            {storeDropdownOpen && (
              <div className="absolute left-0 mt-2 w-60 bg-white rounded-2xl border border-slate-200 shadow-xl p-2 z-50 space-y-1">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStoreId("all");
                    setStoreDropdownOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold ${
                    selectedStoreId === "all" ? "bg-fresh-50 text-fresh-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  All Stores ({stores.length})
                </button>
                {stores.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => {
                      setSelectedStoreId(s.id);
                      setStoreDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold truncate ${
                      selectedStoreId === s.id ? "bg-fresh-50 text-fresh-700 font-bold" : "text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            )}

            {/* Live Search Suggestions */}
            {showSuggestions && searchQuery.trim().length >= 2 && (
              <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl border border-slate-200 shadow-2xl p-3 z-50 space-y-3 max-h-96 overflow-y-auto">
                {searching ? (
                  <div className="flex items-center justify-center gap-2 py-6 text-xs text-slate-500">
                    <Loader2 className="w-4 h-4 animate-spin text-fresh-600" />
                    <span>Searching fresh inventory...</span>
                  </div>
                ) : suggestions.products.length === 0 && suggestions.stores.length === 0 ? (
                  <div className="py-5 text-center text-xs text-slate-500">
                    No matching products or stores for &ldquo;{searchQuery}&rdquo;.
                  </div>
                ) : (
                  <>
                    {suggestions.stores.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
                          Stores
                        </p>
                        {suggestions.stores.map((st) => (
                          <Link
                            key={st.id}
                            href={`/stores/${st.slug}`}
                            onClick={() => setShowSuggestions(false)}
                            className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                          >
                            <img src={st.logo} alt={st.name} className="w-8 h-8 rounded-lg object-cover bg-slate-100" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-slate-900 truncate">{st.name}</p>
                              <p className="text-[11px] text-slate-500 truncate">{st.deliveryTime}</p>
                            </div>
                            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          </Link>
                        ))}
                      </div>
                    )}

                    {suggestions.products.length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 mb-1">
                          Products
                        </p>
                        {suggestions.products.map((prod) => (
                          <Link
                            key={prod.id}
                            href={`/product/${prod.id}`}
                            onClick={() => setShowSuggestions(false)}
                            className="flex items-center justify-between gap-3 px-2 py-2 rounded-xl hover:bg-slate-50 transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <img src={prod.image} alt={prod.name} className="w-9 h-9 rounded-lg object-cover bg-slate-100" />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 truncate">{prod.name}</p>
                                <p className="text-[11px] text-slate-500 truncate">
                                  {prod.storeName} • {prod.unit}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs font-extrabold text-fresh-700 shrink-0">
                              {formatPrice(prod.price)}
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={handleSearchSubmit}
                      className="w-full py-2 rounded-xl bg-fresh-50 hover:bg-fresh-100 text-fresh-700 text-xs font-bold transition-colors"
                    >
                      View all results for &ldquo;{searchQuery}&rdquo;
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Quick Links & Actions */}
          <div className="flex items-center gap-3 shrink-0">
            <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600 mr-2">
              <Link href="/catalog" className="hover:text-fresh-700 transition-colors">
                Browse Aisle
              </Link>
              <Link href="/stores" className="hover:text-fresh-700 transition-colors">
                Local Farms{stores.length > 0 ? ` (${stores.length})` : ""}
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
              <div className="w-8 h-8 rounded-full bg-fresh-100 text-fresh-800 flex items-center justify-center font-bold text-xs overflow-hidden">
                {initials}
              </div>
              <div className="hidden xl:flex flex-col text-left">
                <span className="text-xs font-bold text-slate-800 leading-none">
                  {firstName}
                </span>
                {mounted && role !== "customer" && (
                  <span className="text-[10px] font-extrabold text-fresh-600 uppercase tracking-wider leading-none mt-0.5">
                    {role}
                  </span>
                )}
              </div>
            </Link>
          </div>
        </div>

        {/* Categories Quick Navigation Strip */}
        <div className="flex items-center gap-4 overflow-x-auto py-2.5 border-t border-slate-100 text-xs font-semibold text-slate-600 no-scrollbar whitespace-nowrap">
          <Link href="/catalog" className="flex items-center gap-1.5 text-fresh-700 font-bold hover:text-fresh-800 shrink-0">
            <span>All Departments</span>
          </Link>
          {categories.map((cat) => (
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
            <span>Today&apos;s Flash Deals</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
