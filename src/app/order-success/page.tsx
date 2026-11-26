"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import { getOrderDetails } from "@/lib/actions/orders";
import { formatPrice } from "@/lib/utils";
import {
  CheckCircle2,
  MapPin,
  Truck,
  Store,
  ShieldCheck,
  ArrowRight,
  Clock,
  Receipt,
  Sparkles,
  Loader2,
} from "lucide-react";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderNumberParam = searchParams.get("orderNumber");
  const orderId = searchParams.get("order_id");
  const mode = searchParams.get("mode");

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    getOrderDetails(orderId)
      .then((data) => setOrder(data))
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto text-center py-20 flex items-center justify-center gap-2 text-xs text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin text-fresh-600" />
        <span>Loading order confirmation...</span>
      </div>
    );
  }

  const displayOrderNumber = order?.order_number || orderNumberParam || "FreshMart Order";
  const addr = order?.shipping_address;
  const addressText = addr
    ? `${addr.address}${addr.apartment ? `, ${addr.apartment}` : ""}, ${addr.city}, ${addr.state} ${addr.zipCode}`
    : "Delivery address on file";

  const statusBadge =
    mode === "cod" || order?.payment_method === "cod"
      ? "Cash on Delivery Confirmed"
      : mode === "test"
      ? "Order Confirmed (Test Payment)"
      : "Payment Confirmed via Stripe";

  return (
    <div className="max-w-2xl mx-auto px-4 text-center space-y-6">
      <div className="w-20 h-20 rounded-full bg-fresh-100 text-fresh-600 flex items-center justify-center mx-auto shadow-lg shadow-fresh-600/20 animate-in zoom-in-75 duration-300">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-fresh-50 border border-fresh-200 text-fresh-800 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 text-fresh-600" />
          <span>{statusBadge}</span>
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Order Confirmed!
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Thank you for choosing FreshMart! Your order{" "}
          <span className="font-extrabold text-slate-800">#{displayOrderNumber}</span> has been dispatched to local merchant kitchens &amp; cold-storage depots.
        </p>
      </div>

      {/* Delivery Tracking Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-left space-y-5">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-fresh-600" />
            <span className="text-xs font-bold text-slate-900">Delivery Window</span>
          </div>
          <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            {order?.delivery_window || "30-Min Rapid Express"}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Delivery Destination</span>
            <div className="flex items-start gap-1.5 font-bold text-slate-800">
              <MapPin className="w-3.5 h-3.5 text-fresh-600 shrink-0 mt-0.5" />
              <span>{addressText}</span>
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-slate-400 font-medium">Total Paid / Due</span>
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Truck className="w-3.5 h-3.5 text-fresh-600 shrink-0" />
              <span>
                {order ? formatPrice(Number(order.total_amount)) : "Confirmed"} (
                {order?.payment_status || "paid"})
              </span>
            </div>
          </div>
        </div>

        {/* Participating Merchants */}
        {order?.vendor_orders && order.vendor_orders.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              Fulfilling Grocery Merchants (Split Sub-Orders)
            </span>
            <div className="space-y-2.5 text-xs text-slate-700">
              {order.vendor_orders.map((vo: any) => (
                <div key={vo.id} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-fresh-600" />
                      <span className="font-semibold">{vo.stores?.name || "Partner Store"}</span>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                      {vo.status}
                    </span>
                  </div>
                  {vo.order_items && vo.order_items.length > 0 && (
                    <p className="text-[11px] text-slate-500 pl-5">
                      {vo.order_items.map((it: any) => `${it.quantity}× ${it.name}`).join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-3.5 rounded-xl bg-fresh-50/70 border border-fresh-200/80 flex items-center gap-3 text-xs text-fresh-900 font-medium">
          <ShieldCheck className="w-5 h-5 text-fresh-600 shrink-0" />
          <span>
            Every piece of produce is guaranteed fresh. If you are not 100% delighted, file an instant refund anytime from your account.
          </span>
        </div>
      </div>

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
