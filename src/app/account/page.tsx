"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import { SAMPLE_ORDERS, Order } from "@/data/mockData";
import { 
  User, 
  MapPin, 
  Package, 
  Receipt, 
  Heart, 
  Bell, 
  CreditCard, 
  Truck, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  Sparkles
} from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function AccountPage() {
  const [activeTab, setActiveTab] = useState<"orders" | "addresses" | "payments">("orders");

  return (
    <>
      <CustomerHeader />

      <main className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
          
          {/* User Profile Card */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-600 text-white font-extrabold text-xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                SJ
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                  Sarah Jenkins
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  sarah.jenkins@brooklyn.org • Member since April 2024
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-fresh-100 text-fresh-700 font-bold text-[10px] uppercase">
                    ⭐ FreshMart Green Club
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs font-semibold text-slate-600">34 Eco deliveries</span>
                </div>
              </div>
            </div>

            <Link
              href="/refunds"
              className="px-4 py-2.5 rounded-xl bg-harvest-50 text-harvest-800 hover:bg-harvest-100 border border-harvest-200 font-bold text-xs flex items-center gap-2 transition-colors"
            >
              <Sparkles className="w-4 h-4 text-harvest-600" />
              <span>Freshness Guarantee Claims</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Nav Menu */}
            <aside className="lg:col-span-3 bg-white rounded-3xl p-4 border border-slate-200/80 shadow-sm space-y-1">
              <button
                onClick={() => setActiveTab("orders")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === "orders" ? "bg-fresh-600 text-white shadow-md shadow-fresh-600/20" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Package className="w-4 h-4" />
                <span>My Orders & Live Tracking</span>
              </button>

              <button
                onClick={() => setActiveTab("addresses")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === "addresses" ? "bg-fresh-600 text-white shadow-md shadow-fresh-600/20" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <MapPin className="w-4 h-4" />
                <span>Saved Addresses</span>
              </button>

              <button
                onClick={() => setActiveTab("payments")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                  activeTab === "payments" ? "bg-fresh-600 text-white shadow-md shadow-fresh-600/20" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>Payment Methods</span>
              </button>

              <Link
                href="/refunds"
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                <Receipt className="w-4 h-4" />
                <span>Refunds & Returns</span>
              </Link>
            </aside>

            {/* Right Tab Content */}
            <div className="lg:col-span-9 space-y-6">
              
              {activeTab === "orders" && (
                <div className="space-y-6">
                  
                  {/* Live Active Order Highlight */}
                  <div className="bg-emerald-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl shadow-emerald-950/10">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-white/10 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                        <span className="font-bold text-xs uppercase tracking-wider text-emerald-400">Live Delivery in Progress</span>
                      </div>
                      <span className="text-xs text-slate-300">Order #ORD-94821</span>
                    </div>

                    <div className="py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div>
                        <p className="text-xs text-slate-400">Estimated Arrival</p>
                        <p className="text-xl font-extrabold text-white mt-1">10:45 AM (18 mins)</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Assigned Courier</p>
                        <p className="text-sm font-bold text-white mt-1">Marcus Vance (Eco E-Bike)</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-400">Insulated Box Temp</p>
                        <p className="text-sm font-bold text-emerald-300 mt-1">3.4°C (Cold-Chain Verified)</p>
                      </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                        <span className="text-emerald-400 font-bold">1. Picked at GreenField</span>
                        <span className="text-emerald-400 font-bold">2. Thermal Pack Sealed</span>
                        <span className="text-white font-extrabold">3. Out on Delivery</span>
                        <span className="text-slate-500">4. Delivered</span>
                      </div>
                      <div className="w-full bg-white/20 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-400 h-full w-3/4 rounded-full transition-all duration-500" />
                      </div>
                    </div>
                  </div>

                  {/* Historical Orders List */}
                  <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                    <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
                      Past Order Receipts
                    </h3>

                    <div className="divide-y divide-slate-100">
                      {SAMPLE_ORDERS.map((order) => (
                        <div key={order.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900">{order.id}</span>
                              <span className="text-xs text-slate-400">• {order.date}</span>
                            </div>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {order.itemsCount} items from {order.stores.join(", ")}
                            </p>
                            <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold mt-2">
                              {order.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="font-extrabold text-base text-slate-900">
                              {formatPrice(order.total)}
                            </span>
                            <button className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors">
                              Re-order All
                            </button>
                            <Link
                              href="/refunds"
                              className="text-xs text-harvest-700 hover:underline font-semibold"
                            >
                              Need Help?
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {activeTab === "addresses" && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                  <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
                    Saved Delivery Destinations
                  </h3>
                  <div className="p-4 rounded-2xl border-2 border-fresh-600 bg-fresh-50/40 flex justify-between items-start">
                    <div>
                      <span className="px-2 py-0.5 rounded bg-fresh-600 text-white text-[10px] font-bold uppercase">Home (Default)</span>
                      <h4 className="font-bold text-sm text-slate-900 mt-1">742 Evergreen Terrace, Apt 4B</h4>
                      <p className="text-xs text-slate-500">Brooklyn, NY 11217</p>
                      <p className="text-xs text-slate-400 mt-1">Instructions: Ring bell 4B or leave with doorman</p>
                    </div>
                    <button className="text-xs text-fresh-700 font-bold hover:underline">Edit</button>
                  </div>
                </div>
              )}

              {activeTab === "payments" && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                  <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
                    Saved Payment Cards
                  </h3>
                  <div className="p-4 rounded-2xl border border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <CreditCard className="w-6 h-6 text-slate-600" />
                      <div>
                        <p className="font-bold text-sm text-slate-900">Visa ending in •••• 4242</p>
                        <p className="text-xs text-slate-500">Expires 08/2028</p>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">Default</span>
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>
      </main>

      <CustomerFooter />
    </>
  );
}
