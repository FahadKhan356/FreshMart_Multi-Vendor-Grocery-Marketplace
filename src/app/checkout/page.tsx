"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import { 
  MapPin, 
  Clock, 
  CreditCard, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight,
  ChevronRight,
  Building
} from "lucide-react";

export default function CheckoutPage() {
  const [selectedWindow, setSelectedWindow] = useState("express-30");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
  };

  if (orderPlaced) {
    return (
      <>
        <CustomerHeader />
        <main className="min-h-screen bg-slate-50 py-16">
          <div className="max-w-xl mx-auto px-4 text-center bg-white p-8 sm:p-12 rounded-3xl border border-slate-200 shadow-xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-fresh-100 text-fresh-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Order Placed Successfully!
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Order <span className="font-bold text-slate-800">#FM-94821</span> has been dispatched to GreenField Organic and SunHarvest Direct. Courier Marcus V. is on the route.
            </p>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Estimated Delivery:</span>
                <span className="font-bold text-emerald-700">10:45 AM (25 mins)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Address:</span>
                <span className="font-semibold text-slate-800">742 Evergreen Terrace, Brooklyn</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Charged:</span>
                <span className="font-extrabold text-slate-900">$42.80</span>
              </div>
            </div>

            <div className="pt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/account"
                className="flex-1 py-3.5 rounded-xl bg-fresh-600 hover:bg-fresh-700 text-white font-bold text-xs shadow-md transition-all"
              >
                Track Live Order
              </Link>
              <Link
                href="/"
                className="flex-1 py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                Back to Homepage
              </Link>
            </div>
          </div>
        </main>
        <CustomerFooter />
      </>
    );
  }

  return (
    <>
      <CustomerHeader />

      <main className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
          
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
            <Link href="/cart" className="hover:text-fresh-600">Cart</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 font-bold">Checkout</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-8">
            Express Checkout
          </h1>

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
                  <button className="text-xs text-fresh-600 font-bold hover:underline">Change</button>
                </div>

                <div className="p-4 rounded-2xl bg-fresh-50/50 border border-fresh-200/60 flex items-start justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900">Sarah Jenkins</p>
                    <p className="text-xs text-slate-600 mt-0.5">742 Evergreen Terrace, Apt 4B</p>
                    <p className="text-xs text-slate-500">Brooklyn, NY 11217 • (555) 234-8901</p>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-fresh-600 text-white text-[10px] font-bold">Default</span>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Drop-off Instructions (Optional)
                  </label>
                  <input
                    type="text"
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
                    <p className="text-xs font-extrabold text-fresh-700 mt-2">$3.99</p>
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
                  <span>3. Payment Method</span>
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
                        <p className="text-xs font-bold text-slate-900">Visa ending in •••• 4242</p>
                        <p className="text-[11px] text-slate-500">Expires 08/28 • Default card</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600 uppercase">Visa</span>
                  </label>

                  <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-200 hover:border-slate-300 cursor-pointer">
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === "apple"}
                        onChange={() => setPaymentMethod("apple")}
                        className="text-fresh-600 focus:ring-fresh-500"
                      />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Apple Pay</p>
                        <p className="text-[11px] text-slate-500">Fast biometric checkout</p>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600"> Pay</span>
                  </label>
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
                  <span>Groceries (3 items)</span>
                  <span className="font-bold text-slate-900">$33.90</span>
                </div>
                <div className="flex justify-between">
                  <span>Rapid Delivery (30-min)</span>
                  <span className="font-bold text-slate-900">$3.99</span>
                </div>
                <div className="flex justify-between">
                  <span>Courier Tip</span>
                  <span className="font-bold text-slate-900">$3.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Cold-Chain Service Fee</span>
                  <span className="font-bold text-slate-900">$1.91</span>
                </div>
                <div className="pt-3 border-t border-slate-100 flex justify-between items-baseline text-base font-extrabold text-slate-900">
                  <span>Total Amount</span>
                  <span className="text-xl text-fresh-600">$42.80</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="w-full py-4 rounded-2xl bg-fresh-600 hover:bg-fresh-700 text-white font-bold text-sm shadow-xl shadow-fresh-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95"
              >
                <span>Authorize & Place Order</span>
                <ArrowRight className="w-4 h-4" />
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
