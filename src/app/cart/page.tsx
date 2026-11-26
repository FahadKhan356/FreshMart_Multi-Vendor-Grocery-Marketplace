"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/lib/store/cartStore";
import { validateCouponAction } from "@/lib/actions/customer";
import {
  Trash2,
  Plus,
  Minus,
  Store,
  ArrowRight,
  Tag,
  Truck,
  X,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export default function CartPage() {
  const [mounted, setMounted] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);

  const items = useCartStore((s) => s.items);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const clearCart = useCartStore((s) => s.clearCart);
  const tipAmount = useCartStore((s) => s.tipAmount);
  const setTipAmount = useCartStore((s) => s.setTipAmount);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const setAppliedCoupon = useCartStore((s) => s.setAppliedCoupon);
  const clearCoupon = useCartStore((s) => s.clearCoupon);

  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getDeliveryFee = useCartStore((s) => s.getDeliveryFee);
  const getServiceFee = useCartStore((s) => s.getServiceFee);
  const getDiscountAmount = useCartStore((s) => s.getDiscountAmount);
  const getTotal = useCartStore((s) => s.getTotal);
  const getStoreGroups = useCartStore((s) => s.getStoreGroups);

  useEffect(() => {
    setMounted(true);
  }, []);

  const storeGroups = mounted ? getStoreGroups() : [];
  const subtotal = mounted ? getSubtotal() : 0;
  const deliveryFee = mounted ? getDeliveryFee() : 0;
  const serviceFee = mounted ? getServiceFee() : 0;
  const discountAmount = mounted ? getDiscountAmount() : 0;
  const total = mounted ? getTotal() : 0;

  const handleApplyPromo = async () => {
    const code = promoCode.trim();
    if (!code) {
      setPromoError("Enter a promo code.");
      return;
    }
    setPromoLoading(true);
    setPromoError(null);
    const res = await validateCouponAction(code, subtotal);
    if (res.ok && res.coupon) {
      setAppliedCoupon({
        code: res.coupon.code,
        discountType: res.coupon.discount_type,
        value: res.coupon.value,
        discount: res.discount,
      });
      setPromoCode("");
    } else {
      setPromoError(res.error || "Invalid promo code.");
    }
    setPromoLoading(false);
  };

  return (
    <>
      <CustomerHeader />

      <main className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Multi-Vendor Shopping Cart
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Products from different independent grocery shops are combined into a single unified temperature-controlled delivery.
              </p>
            </div>
            {mounted && items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-rose-50 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cart</span>
              </button>
            )}
          </div>

          {!mounted ? (
            <div className="py-20 text-center text-xs text-slate-500">Loading your cart...</div>
          ) : items.length === 0 ? (
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
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-fresh-600 text-white font-bold text-xs shadow-md shadow-fresh-600/20 hover:bg-fresh-700 transition-all"
              >
                <span>Browse Grocery Departments</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left: Cart Items Grouped by Store */}
              <div className="lg:col-span-8 space-y-6">
                {storeGroups.map((group) => (
                  <div
                    key={group.storeId}
                    className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-fresh-100 text-fresh-700 flex items-center justify-center">
                          <Store className="w-4 h-4" />
                        </div>
                        <h3 className="font-bold text-sm text-slate-900">{group.storeName}</h3>
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Vendor Sub-Order (8% Platform Commission)
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                      {group.items.map((item) => (
                        <div key={item.id} className="py-4 flex items-center gap-4">
                          <Link
                            href={`/product/${item.id}`}
                            className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 overflow-hidden relative shrink-0"
                          >
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          </Link>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <Link href={`/product/${item.id}`} className="font-bold text-xs sm:text-sm text-slate-900 hover:text-fresh-700 truncate block">
                                  {item.name}
                                </Link>
                                <p className="text-[11px] text-slate-400 mt-0.5">
                                  {item.unit} {item.organic && "• Organic"}
                                </p>
                              </div>
                              <span className="font-extrabold text-xs sm:text-sm text-slate-900">
                                {formatPrice(item.price * item.quantity)}
                              </span>
                            </div>

                            <div className="flex items-center justify-between mt-3">
                              <div className="flex items-center border border-slate-200 rounded-xl bg-slate-50 overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                  className="p-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="px-3 text-xs font-bold text-slate-800">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  className="p-1.5 hover:bg-slate-200 text-slate-600 transition-colors"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => removeItem(item.id)}
                                className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                                title="Remove item"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-between text-xs text-slate-500 font-medium">
                      <span>Store Subtotal</span>
                      <span className="font-bold text-slate-800">{formatPrice(group.subtotal)}</span>
                    </div>
                  </div>
                ))}

                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3 text-xs text-emerald-900">
                  <Truck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    <strong>Unified Cold-Chain Guarantee:</strong> All perishables from these {storeGroups.length} independent shops are packed into separate insulated thermal bags and maintained below 4°C during rapid delivery.
                  </span>
                </div>
              </div>

              {/* Right: Order Summary Box */}
              <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6 sticky top-28">
                <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
                  Order Summary
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Items Subtotal</span>
                    <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Multi-Vendor Delivery Fee ({storeGroups.length} Stores)</span>
                    <span className="font-bold text-slate-900">{formatPrice(deliveryFee)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Cold-Chain Service Fee (5%)</span>
                    <span className="font-bold text-slate-900">{formatPrice(serviceFee)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between items-center text-fresh-700 font-bold">
                      <span className="flex items-center gap-1">
                        Promo ({appliedCoupon.code})
                        <button
                          type="button"
                          onClick={clearCoupon}
                          className="text-slate-400 hover:text-rose-600"
                          title="Remove promo code"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}

                  {/* Courier Tip Selection */}
                  <div className="pt-3 border-t border-slate-100">
                    <span className="block font-bold text-slate-700 mb-2">Courier Partner Tip</span>
                    <div className="grid grid-cols-4 gap-1.5">
                      {[0, 2.0, 3.0, 5.0].map((tip) => (
                        <button
                          type="button"
                          key={tip}
                          onClick={() => setTipAmount(tip)}
                          className={`py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            tipAmount === tip
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
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        placeholder="Promo code (e.g. FRESH10)"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleApplyPromo()}
                        className="w-full bg-slate-100 rounded-xl pl-8 pr-3 py-2 text-xs font-medium outline-none uppercase"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyPromo}
                      disabled={promoLoading}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 disabled:opacity-50 transition-colors flex items-center gap-1"
                    >
                      {promoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Apply"}
                    </button>
                  </div>
                  {promoError && (
                    <p className="text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>{promoError}</span>
                    </p>
                  )}
                  {appliedCoupon && !promoError && (
                    <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Code {appliedCoupon.code} applied!</span>
                    </p>
                  )}
                </div>

                {/* Checkout CTA */}
                <Link
                  href="/checkout"
                  className="w-full py-4 rounded-2xl bg-fresh-600 hover:bg-fresh-700 text-white font-bold text-sm shadow-lg shadow-fresh-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
                >
                  <span>Proceed to Express Checkout</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <p className="text-[11px] text-center text-slate-400">
                  Backed by FreshMart&apos;s 100% Guaranteed Freshness Policy.
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
