import { 
  BarChart3, 
  DollarSign, 
  Store, 
  Users, 
  ShoppingBag, 
  TrendingUp, 
  ShieldCheck, 
  ArrowUpRight,
  Bike
} from "lucide-react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export default function AdminOverviewPage() {
  return (
    <div className="space-y-8 max-w-7xl">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Platform Master Operations
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Network overview across 45 organic merchants, 28 active couriers, and 14,890 customers.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/vendors"
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>2 Pending KYC Audits</span>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Platform GMV</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">$142,850.00</p>
          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +31.2% this month
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform Commission (8%)</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-purple-700">$11,428.00</p>
          <span className="text-[11px] text-slate-400">Net platform earnings</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Grocery Stores</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">45 Stores</p>
          <span className="text-[11px] text-emerald-600 font-bold">100% Certified Organic</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Delivery Fleet</span>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">28 Couriers</p>
          <span className="text-[11px] text-slate-400">Avg drop time: 24.5 mins</span>
        </div>
      </div>

      {/* Live Platform Activity & Health */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Onboarded Vendors */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-sm text-slate-900">Recent Grocery Vendor Approvals</h3>
            <Link href="/admin/vendors" className="text-xs font-bold text-purple-600 hover:underline">
              Review KYC Queue →
            </Link>
          </div>

          <div className="space-y-3">
            {[
              { name: "Valley Fresh Butcher & Deli", type: "Grass-Fed Meat & Seafood", date: "Approved Nov 22", status: "Active Live" },
              { name: "SunHarvest Direct", type: "Pasture-Raised Dairy Co-op", date: "Approved Nov 19", status: "Active Live" },
              { name: "Catskill Mountain Honey & Apiary", type: "Raw Organic Honey", date: "Submitted Today", status: "KYC Pending" },
            ].map((v, i) => (
              <div key={i} className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                <div>
                  <p className="font-bold text-slate-900">{v.name}</p>
                  <p className="text-[11px] text-slate-400">{v.type} • {v.date}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                  v.status === "KYC Pending" ? "bg-amber-100 text-amber-800 animate-pulse" : "bg-emerald-100 text-emerald-800"
                }`}>
                  {v.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cold-Chain Fleet Status */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
          <h3 className="font-bold text-sm text-slate-900">Cold-Chain Temperature Network</h3>
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 space-y-2">
            <div className="flex justify-between text-xs font-bold text-emerald-900">
              <span>Fleet Insulation Bags</span>
              <span>100% Sub-4°C</span>
            </div>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              All 28 active couriers equipped with calibrated digital thermistors reporting live readings into the FreshMart telemetry hub.
            </p>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>On-Time Delivery Rate:</span>
              <span className="font-bold text-slate-900">98.4%</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Quality Guarantee Claim Rate:</span>
              <span className="font-bold text-emerald-700">0.42% (Ultra Low)</span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
