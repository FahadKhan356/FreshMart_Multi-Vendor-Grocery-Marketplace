"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import { getCustomerAddresses, type CustomerAddress } from "@/lib/data/customerData";
import { createMultiVendorOrder } from "@/lib/actions/orders";
import { formatPrice } from "@/lib/utils";
import {
  MapPin,
  Clock,
  CreditCard,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
  Store,
  Loader2,
  AlertCircle,
  Banknote,
  Edit3,
} from "lucide-react";

const DELIVERY_SLOTS = [
  { id: "express-30", label: "30-Min Rapid Express", sub: "Direct courier dispatch", badge: "Fastest", baseFee: 2.99 },
  { id: "afternoon", label: "Today, 2:00 PM – 4:00 PM", sub: "Eco green consolidated", badge: "Scheduled", baseFee: 1.99 },
  { id: "evening", label: "Tonight, 6:00 PM – 8:00 PM", sub: "Evening dinner batch", badge: "Scheduled", baseFee: 1.99 },
];

export default function CheckoutPage() {
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedWindow, setSelectedWindow] = useState("express-30");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cod">("card");
  const [instructions, setInstructions] = useState("");

  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [editingAddress, setEditingAddress] = useState(false);
  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    zipCode: "",
  });

  const { user } = useAuthStore();
  const items = useCartStore((s) => s.items);
  const tipAmount = useCartStore((s) => s.tipAmount);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getServiceFee = useCartStore((s) => s.getServiceFee);
  const getDiscountAmount = useCartStore((s) => s.getDiscountAmount);
  const getStoreGroups = useCartStore((s) => s.getStoreGroups);
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    setAddress((prev) => ({
      ...prev,
      fullName: prev.fullName || user.fullName || "",
      phone: prev.phone || user.phone || "",
    }));
    getCustomerAddresses(user.id).then((addrs) => {
      setSavedAddresses(addrs);
      if (addrs.length > 0) {
        const def = addrs.find((a) => a.is_default) || addrs[0];
        setAddress({
          fullName: def.full_name,
          phone: def.phone,
          address: def.address,
          apartment: def.apartment || "",
          city: def.city,
          state: def.state,
          zipCode: def.zip_code,
        });
        if (def.instructions) setInstructions(def.instructions);
      } else {
        setEditingAddress(true);
      }
    });
  }, [user?.id, user?.fullName, user?.phone]);

  const storeGroups = mounted ? getStoreGroups() : [];
  const subtotal = mounted ? getSubtotal() : 0;
  const slot = DELIVERY_SLOTS.find((s) => s.id === selectedWindow) || DELIVERY_SLOTS[0];
  const deliveryFee =
    storeGroups.length === 0
      ? 0
      : Math.round((slot.baseFee + Math.max(0, storeGroups.length - 1) * 1.5) * 100) / 100;
  const serviceFee = mounted ? getServiceFee() : 0;
  const discountAmount = mounted ? getDiscountAmount() : 0;
  const total =
    subtotal === 0
      ? 0
      : Math.max(0, Math.round((subtotal + deliveryFee + serviceFee + (tipAmount || 0) - discountAmount) * 100) / 100);

  const handleSelectSavedAddress = (a: CustomerAddress) => {
    setAddress({
      fullName: a.full_name,
      phone: a.phone,
      address: a.address,
      apartment: a.apartment || "",
      city: a.city,
      state: a.state,
      zipCode: a.zip_code,
    });
    if (a.instructions) setInstructions(a.instructions);
    setEditingAddress(false);
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setErrorMessage("Your cart is empty. Please add items before checking out.");
      return;
    }
    if (!address.fullName.trim() || !address.address.trim() || !address.city.trim() || !address.state.trim() || !address.zipCode.trim() || !address.phone.trim()) {
      setErrorMessage("Please complete all required delivery address fields.");
      setEditingAddress(true);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const result = await createMultiVendorOrder({
        customerId: user?.id,
        couponCode: appliedCoupon?.code,
        paymentMethod,
        deliveryFeeOverride: deliveryFee,
        shippingAddress: address,
        deliveryWindow: slot.label,
        deliveryInstructions: instructions,
        tipAmount,
        items: items.map((i) => ({
          id: i.id,
          name: i.name,
          price: i.price,
          quantity: i.quantity,
          unit: i.unit,
          storeId: i.storeId,
          storeName: i.storeName,
          image: i.image,
        })),
      });

      if (!result.success || !result.orderId) {
        throw new Error(result.error || "Failed to create multi-vendor order.");
      }

      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          total: result.total,
          items,
          customerEmail: user?.email,
          paymentMethod,
        }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok || !checkoutData.url) {
        throw new Error(checkoutData.error || "Failed to initiate payment gateway.");
      }

      clearCart();
      window.location.href = checkoutData.url;
    } catch (err: any) {
      console.error("Order submission failure:", err);
      setErrorMessage(err.message || "Failed to process order. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <CustomerHeader />

      <main className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
            <Link href="/cart" className="hover:text-fresh-600">Cart</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 font-bold">Express Checkout</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
            Multi-Vendor Checkout
          </h1>

          {errorMessage && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Steps */}
            <div className="lg:col-span-8 space-y-6">
              {/* Step 1: Address */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                    <MapPin className="w-4 h-4 text-fresh-600" />
                    <span>1. Delivery Destination</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditingAddress((v) => !v)}
                    className="text-xs font-bold text-fresh-700 hover:underline flex items-center gap-1"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{editingAddress ? "Done" : "Edit Address"}</span>
                  </button>
                </div>

                {savedAddresses.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {savedAddresses.map((sa) => (
                      <button
                        type="button"
                        key={sa.id}
                        onClick={() => handleSelectSavedAddress(sa)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          address.address === sa.address
                            ? "border-fresh-600 bg-fresh-50 text-fresh-800"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {sa.label}: {sa.address}
                      </button>
                    ))}
                  </div>
                )}

                {editingAddress ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <input
                      type="text"
                      placeholder="Full Name *"
                      value={address.fullName}
                      onChange={(e) => setAddress({ ...address, fullName: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-fresh-600"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number *"
                      value={address.phone}
                      onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-fresh-600"
                    />
                    <input
                      type="text"
                      placeholder="Street Address *"
                      value={address.address}
                      onChange={(e) => setAddress({ ...address, address: e.target.value })}
                      className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-fresh-600"
                    />
                    <input
                      type="text"
                      placeholder="Apt / Suite (Optional)"
                      value={address.apartment}
                      onChange={(e) => setAddress({ ...address, apartment: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-fresh-600"
                    />
                    <input
                      type="text"
                      placeholder="City *"
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-fresh-600"
                    />
                    <input
                      type="text"
                      placeholder="State *"
                      value={address.state}
                      onChange={(e) => setAddress({ ...address, state: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-fresh-600"
                    />
                    <input
                      type="text"
                      placeholder="ZIP Code *"
                      value={address.zipCode}
                      onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs outline-none focus:ring-2 focus:ring-fresh-600"
                    />
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-fresh-50/50 border border-fresh-200/60">
                    <p className="text-xs font-bold text-slate-900">{address.fullName}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {address.address}
                      {address.apartment ? `, ${address.apartment}` : ""}
                    </p>
                    <p className="text-xs text-slate-500">
                      {address.city}, {address.state} {address.zipCode} • {address.phone}
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Drop-off Instructions (Optional)
                  </label>
                  <input
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g. Leave with doorman, ring bell 4B..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-fresh-600"
                  />
                </div>
              </div>

              {/* Step 2: Delivery Time Window */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
                  <Clock className="w-4 h-4 text-fresh-600" />
                  <span>2. Delivery Speed &amp; Time Slot</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {DELIVERY_SLOTS.map((s) => (
                    <button
                      type="button"
                      key={s.id}
                      onClick={() => setSelectedWindow(s.id)}
                      className={`p-4 rounded-2xl text-left border transition-all ${
                        selectedWindow === s.id
                          ? "border-fresh-600 bg-fresh-50/70 shadow-sm"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <span
                        className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                          s.badge === "Fastest" ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {s.badge}
                      </span>
                      <h4 className="font-bold text-xs text-slate-900 mt-2">{s.label}</h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">{s.sub}</p>
                      <p className="text-xs font-extrabold text-fresh-700 mt-2">${s.baseFee.toFixed(2)}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Payment Method */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
                  <CreditCard className="w-4 h-4 text-fresh-600" />
                  <span>3. Payment Method</span>
                </div>

                <div className="space-y-3">
                  <label
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === "card" ? "border-fresh-600 bg-fresh-50/30" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "card"}
                        onChange={() => setPaymentMethod("card")}
                        className="text-fresh-600 focus:ring-fresh-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Credit / Debit Card (Stripe / Test Checkout)</p>
                        <p className="text-[11px] text-slate-500">Instant payment confirmation</p>
                      </div>
                    </div>
                    <CreditCard className="w-4 h-4 text-slate-500" />
                  </label>

                  <label
                    className={`flex items-center justify-between p-4 rounded-2xl border cursor-pointer transition-all ${
                      paymentMethod === "cod" ? "border-fresh-600 bg-fresh-50/30" : "border-slate-200"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                        className="text-fresh-600 focus:ring-fresh-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Cash on Delivery</p>
                        <p className="text-[11px] text-slate-500">Pay your courier upon refrigerated drop-off</p>
                      </div>
                    </div>
                    <Banknote className="w-4 h-4 text-emerald-600" />
                  </label>
                </div>
              </div>

              {/* Multi-Vendor Order Partition Preview */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900">
                  <Store className="w-4 h-4 text-fresh-600" />
                  <span>Multi-Vendor Order Splitting ({storeGroups.length} Participating Shops)</span>
                </div>
                <div className="space-y-2 text-xs">
                  {storeGroups.map((g) => (
                    <div key={g.storeId} className="flex justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="font-semibold text-slate-800">{g.storeName} ({g.items.length} items)</span>
                      <span className="font-extrabold text-slate-900">{formatPrice(g.subtotal)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Summary Card */}
            <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6 sticky top-28">
              <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
                Payment Breakdown
              </h3>

              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Groceries ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span className="font-bold text-slate-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Rapid Multi-Vendor Delivery</span>
                  <span className="font-bold text-slate-900">{formatPrice(deliveryFee)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Courier Tip</span>
                  <span className="font-bold text-slate-900">{formatPrice(tipAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cold-Chain Service Fee (5%)</span>
                  <span className="font-bold text-slate-900">{formatPrice(serviceFee)}</span>
                </div>
                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex justify-between text-fresh-700 font-bold">
                    <span>Promo ({appliedCoupon.code})</span>
                    <span>-{formatPrice(discountAmount)}</span>
                  </div>
                )}
                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline text-base font-extrabold text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-xl text-fresh-600">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isSubmitting || items.length === 0}
                className="w-full py-4 rounded-2xl bg-fresh-600 hover:bg-fresh-700 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-fresh-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Order...</span>
                  </>
                ) : (
                  <>
                    <span>{paymentMethod === "cod" ? "Place Cash on Delivery Order" : "Authorize & Place Order"}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 text-[11px] text-slate-600 font-medium">
                <ShieldCheck className="w-4 h-4 text-fresh-600 shrink-0" />
                <span>Zero Risk: Covered by 100% Instant Freshness Refund.</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <CustomerFooter />
    </>
  );
}
