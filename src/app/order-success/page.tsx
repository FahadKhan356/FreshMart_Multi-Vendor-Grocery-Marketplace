"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import { 
  CheckCircle2, 
  MapPin, 
  Truck, 
  Store, 
  ShieldCheck, 
  ArrowRight, 
  Clock, 
  Receipt,
  Sparkles
} from "lucide-react";
import { Suspense } from "react";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get("orderNumber") || "FM-849201";
  const orderId = searchParams.get("order_id");
  const isMock = searchParams.get("mock") === "true";

  return (
    <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
      {/* Animated Success Icon */}
      <div className="w-20 h-20 rounded-full bg-fresh-100 text-fresh-600 flex items-center justify-center mx-auto shadow-lg shadow-fresh-600/20 animate-in zoom-in-75 duration-300">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fresh-50 border border-fresh-200 text-fresh-800 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-fresh-600" />
          <span>Payment Confirmed via Stripe</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Order Confirmed!
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Thank you for choosing FreshMart! Your order <span className="font-extrabold text-slate-800">#{orderNumber}</span> has been dispatched to local merchant kitchens & cold-storage depots.
        </p>
      </div>

      {/* Delivery Tracking Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-left space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-fresh-600" />
            <span className="text-xs font-bold text-slate-900">Estimated Rapid Delivery</span>
          </div>
          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            Today, 25-35 mins
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Delivery Destination</span>
            <div className="flex items-start gap-1.5 font-bold text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-fresh-600 shrink-0 mt-0.5" />
              <span>742 Evergreen Terrace, Apt 4B, Brooklyn</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Fulfillment Type</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Truck className="w-3.5 h-3.5 text-fresh-600 shrink-0" />
              <span>Multi-Vendor Consolidated Courier</span>
            </div>
          </div>
        </div>

        {/* Participating Merchants */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
            Fulfilling Grocery Merchants (Split Sub-Orders)
          </span>
          <div className="space-y-1.5 text-xs text-slate-700">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-fresh-600" />
                <span className="font-semibold">Valley Green Grocers</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                Packing Produce
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-3.5 h-3.5 text-fresh-600" />
                <span className="font-semibold">Sunrise Dairy & Organic</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                Cold-Storage Prep
              </span>
            </div>
          </div>
        </div>

        {/* Freshness Guarantee Note */}
        <div className="p-3.5 rounded-xl bg-fresh-50/70 border border-fresh-200/80 flex items-center gap-3 text-xs text-fresh-900 font-medium">
          <ShieldCheck className="w-5 h-5 text-fresh-600 shrink-0" />
          <span>
            Every piece of produce is guaranteed fresh. If you are not 100% delighted, file an instant refund anytime from your account.
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Link
          href="/account"
          className="flex-1 py-3.5 rounded-xl bg-fresh-600 hover:bg-fresh-700 text-white font-bold text-xs shadow-md shadow-fresh-600/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
        >
          <Receipt className="w-4 h-4" />
          <span>View Order in Account</span>
        </Link>
        <Link
          href="/"
          className="flex-1 py-3.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-2"
        >
          <span>Continue Shopping</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <>
      <CustomerHeader />
      <main className="min-h-screen bg-slate-50 py-16">
        <Suspense fallback={<div className="max-w-2xl mx-auto text-center py-20 text-slate-500">Loading order status...</div>}>
          <OrderSuccessContent />
        </Suspense>
      </main>
      <CustomerFooter />
    </>
  );
}
