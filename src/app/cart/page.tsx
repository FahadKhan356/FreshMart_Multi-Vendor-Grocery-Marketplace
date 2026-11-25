"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import { INITIAL_CART, CartItem } from "@/data/mockData";
import { formatPrice } from "@/lib/utils";
import { 
  Trash2, 
  Plus, 
  Minus, 
  Store, 
  ArrowRight, 
  ShieldCheck, 
  Sparkles, 
  Tag, 
  Truck, 
  AlertCircle 
} from "lucide-react";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>(INITIAL_CART);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>(null);
  const [courierTip, setCourierTip] = useState<number>(3.00);

  const updateQuantity = (id: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== id));
  };

  // Group items by store for Multi-Vendor grouping
  const groupedByStore = cartItems.reduce((acc, item) => {
    const store = item.product.storeName;
    if (!acc[store]) acc[store] = [];
    acc[store].push(item);
    return acc;
  }, {} as Record<string, CartItem[]>);

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );
  const deliveryFee = cartItems.length > 0 ? 3.99 : 0;
  const serviceFee = cartItems.length > 0 ? 1.50 : 0;
  const discountAmount = appliedPromo ? 5.00 : 0;
  const total = Math.max(0, subtotal + deliveryFee + serviceFee + courierTip - discountAmount);

  return (
    <>
      <CustomerHeader />

      <main className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
          
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Multi-Vendor Shopping Cart
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mb-8">
            Products from different independent shops are fulfilled in a single unified temperature-controlled delivery.
          </p>

          {cartItems.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-lg mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mx-auto">
                <Store className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Your basket is empty</h3>
              <p className="text-xs text-slate-500">
                Explore local organic farms and artisanal bakeries to add fresh groceries to your cart.
              </p>
              <Link
                href="/catalog"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-fresh-600 text-white font-bold text-xs"
              >
                <span>Browse Departments</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* Left: Cart Items Grouped by Store */}
              <div className="lg:col-span-8 space-y-6">
                {Object.entries(groupedByStore).map(([storeName, items]) => (
                  <div
                    key={storeName}
                    className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4"
                  >
                    {/* Store Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-fresh-100 text-fresh-700 flex items-center justify-center">
                          <Store className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-sm text-slate-900">{storeName}</h3>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Express Batch Ready
                      </span>
                    </div>

                    {/* Store's items */}
                    <div className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <div key={item.product.id} className="py-4 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            <img
                              src={item.product.image}
                              alt={item.product.name}
                              className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-100"
                            />
                            <div>
                              <Link
                                href={`/product/${item.product.id}`}
                                className="font-bold text-sm text-slate-900 hover:text-fresh-600 transition-colors block"
                              >
                                {item.product.name}
                              </Link>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                {item.product.unit} • {formatPrice(item.product.price)} each
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-6">
                            {/* Stepper */}
                            <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 p-1">
                              <button
                                onClick={() => updateQuantity(item.product.id, -1)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <span className="px-3 font-bold text-xs text-slate-900">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() => updateQuantity(item.product.id, 1)}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <span className="font-extrabold text-sm text-slate-900 w-16 text-right">
                              {formatPrice(item.product.price * item.quantity)}
                            </span>

                            <button
                              onClick={() => removeItem(item.product.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Freshness Note */}
                <div className="p-4 rounded-2xl bg-fresh-50 border border-fresh-200/80 flex items-center gap-3 text-xs text-fresh-900 font-semibold">
                  <ShieldCheck className="w-5 h-5 text-fresh-600 shrink-0" />
                  <span>
                    Your multi-vendor grocery items will be packed in cold-chain insulated thermal bags and kept below 4°C until delivery.
                  </span>
                </div>
              </div>

              {/* Right: Order Summary Box */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6 sticky top-28">
                <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
                  Order Summary
                </h3>

                {/* Price Breakdown */}
                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Items Subtotal</span>
                    <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Multi-Vendor Delivery Fee</span>
                    <span className="font-bold text-slate-900">{formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cold-Chain Service Fee</span>
                    <span className="font-bold text-slate-900">{formatPrice(serviceFee)}</span>
                  </div>
                  {appliedPromo && (
                    <div className="flex justify-between text-fresh-700 font-bold">
                      <span>Promo Discount (FRESH5)</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}

                  {/* Courier Tip Selection */}
                  <div className="pt-3 border-t border-slate-100">
                    <span className="block font-bold text-slate-700 mb-2">Courier Partner Tip</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[2.00, 3.00, 5.00, 7.00].map((tip) => (
                        <button
                          key={tip}
                          onClick={() => setCourierTip(tip)}
                          className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            courierTip === tip
                              ? "border-fresh-600 bg-fresh-50 text-fresh-700 shadow-sm"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          ${tip.toFixed(2)}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Total Row */}
                  <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline text-base font-extrabold text-slate-900">
                    <span>Estimated Total</span>
                    <span className="text-xl text-fresh-600">{formatPrice(total)}</span>
                  </div>
                </div>

                {/* Promo Code Input */}
                <div className="flex items-center gap-2 pt-2">
                  <div className="relative flex-1">
                    <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Discount code (try FRESH5)"
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      className="w-full bg-slate-100 rounded-xl pl-8 pr-3 py-2 text-xs font-medium outline-none uppercase"
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (promoCode.trim().toUpperCase() === "FRESH5") {
                        setAppliedPromo("FRESH5");
                      }
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors"
                  >
                    Apply
                  </button>
                </div>

                {/* Checkout CTA */}
                <Link
                  href="/checkout"
                  className="w-full py-4 rounded-2xl bg-fresh-600 hover:bg-fresh-700 text-white font-bold text-sm shadow-lg shadow-fresh-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <p className="text-[11px] text-center text-slate-400">
                  Backed by FreshMart's 100% Guaranteed Freshness Policy.
                </p>
              </div>

            </div>
          )}

        </div>
      </main>

      <CustomerFooter />
    </>
  );
}
