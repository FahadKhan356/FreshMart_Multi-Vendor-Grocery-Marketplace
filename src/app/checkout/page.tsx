"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import { useCartStore } from "@/lib/store/cartStore";
import { createMultiVendorOrder } from "@/lib/actions/orders";
import { formatPrice } from "@/lib/utils";
import { 
  MapPin, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  Store,
  Loader2,
  AlertCircle
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [selectedWindow, setSelectedWindow] = useState("express-30");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [instructions, setInstructions] = useState("Leave on front porch table. Ring doorbell.");

  const [address, setAddress] = useState({
    fullName: "Sarah Jenkins",
    phone: "(555) 234-8901",
    address: "742 Evergreen Terrace",
    apartment: "Apt 4B",
    city: "Brooklyn",
    state: "NY",
    zipCode: "11217",
  });

  const items = useCartStore((s) => s.items);
  const tipAmount = useCartStore((s) => s.tipAmount);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const getDeliveryFee = useCartStore((s) => s.getDeliveryFee);
  const getServiceFee = useCartStore((s) => s.getServiceFee);
  const getTotal = useCartStore((s) => s.getTotal);
  const getStoreGroups = useCartStore((s) => s.getStoreGroups);
  const clearCart = useCartStore((s) => s.clearCart);

  useEffect(() => {
    setMounted(true);
  }, []);

  const storeGroups = mounted ? getStoreGroups() : [];
  const subtotal = mounted ? getSubtotal() : 42.80;
  const deliveryFee = mounted ? getDeliveryFee() : 2.99;
  const serviceFee = mounted ? getServiceFee() : 2.14;
  const total = mounted ? getTotal() : 50.93;

  const handlePlaceOrder = async () => {
    if (items.length === 0) {
      setErrorMessage("Your cart is empty. Please add items before checking out.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Create multi-vendor parent order & split sub-orders in Supabase
      const orderPayload = {
        shippingAddress: address,
        deliveryWindow: selectedWindow === "express-30" ? "30-Min Rapid Express" : "Today, 4:00 PM – 6:00 PM",
        deliveryInstructions: instructions,
        tipAmount: tipAmount,
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
      };

      const result = await createMultiVendorOrder(orderPayload);

      if (!result.success || !result.orderId) {
        throw new Error(result.error || "Failed to create multi-vendor order.");
      }

      // 2. Initialize Stripe Checkout / Payment session
      const checkoutRes = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: result.orderId,
          orderNumber: result.orderNumber,
          total: result.total,
          items: items,
          customerEmail: "sarah.jenkins@example.com",
        }),
      });

      const checkoutData = await checkoutRes.json();

      if (!checkoutRes.ok || !checkoutData.url) {
        throw new Error(checkoutData.error || "Failed to initiate payment gateway.");
      }

      // Clear local cart store upon successful order generation
      clearCart();

      // Redirect to Stripe checkout or order success
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
                  <span className="px-2 py-0.5 rounded bg-fresh-600 text-white text-[10px] font-bold">Default</span>
                </div>

                <div className="p-4 rounded-2xl bg-fresh-50/50 border border-fresh-200/60 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{address.fullName}</p>
                    <p className="text-xs text-slate-600 mt-0.5">{address.address}, {address.apartment}</p>
                    <p className="text-xs text-slate-500">{address.city}, {address.state} {address.zipCode} • {address.phone}</p>
                  </div>
                </div>

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
                  <span>2. Delivery Speed & Time Slot</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <button
                    onClick={() => setSelectedWindow("express-30")}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      selectedWindow === "express-30"
                        ? "border-fresh-600 bg-fresh-50/70 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-600 text-white">
                      Fastest
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 mt-2">30-Min Rapid Express</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Direct courier dispatch</p>
                    <p className="text-xs font-extrabold text-fresh-700 mt-2">$2.99</p>
                  </button>

                  <button
                    onClick={() => setSelectedWindow("afternoon")}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      selectedWindow === "afternoon"
                        ? "border-fresh-600 bg-fresh-50/70 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500">Scheduled</span>
                    <h4 className="font-bold text-xs text-slate-900 mt-2">Today, 2:00 PM – 4:00 PM</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Eco green consolidated</p>
                    <p className="text-xs font-extrabold text-fresh-700 mt-2">$1.99</p>
                  </button>

                  <button
                    onClick={() => setSelectedWindow("evening")}
                    className={`p-4 rounded-2xl text-left border transition-all ${
                      selectedWindow === "evening"
                        ? "border-fresh-600 bg-fresh-50/70 shadow-sm"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <span className="text-[10px] font-bold text-slate-500">Scheduled</span>
                    <h4 className="font-bold text-xs text-slate-900 mt-2">Tonight, 6:00 PM – 8:00 PM</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">Evening dinner batch</p>
                    <p className="text-xs font-extrabold text-fresh-700 mt-2">$1.99</p>
                  </button>
                </div>
              </div>

              {/* Step 3: Payment Method */}
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center gap-2 font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
                  <CreditCard className="w-4 h-4 text-fresh-600" />
                  <span>3. Payment Gateway (Stripe)</span>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center justify-between p-4 rounded-2xl border border-fresh-600 bg-fresh-50/30 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "card"}
                        onChange={() => setPaymentMethod("card")}
                        className="text-fresh-600 focus:ring-fresh-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Credit / Debit Card (Stripe Checkout)</p>
                        <p className="text-[11px] text-slate-500">Encrypted 256-bit bank level security</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600 uppercase">Stripe</span>
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
                  <span>Groceries ({items.length} items)</span>
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
                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline text-base font-extrabold text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-xl text-fresh-600">{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isSubmitting || items.length === 0}
                className="w-full py-4 rounded-2xl bg-fresh-600 hover:bg-fresh-700 disabled:opacity-50 text-white font-bold text-sm shadow-xl shadow-fresh-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing Secure Checkout...</span>
                  </>
                ) : (
                  <>
                    <span>Authorize & Place Order</span>
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
