import { BarChart3, TrendingUp, DollarSign, ShoppingBag, ArrowUpRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function VendorAnalyticsPage() {
  return (
    <div className="space-y-8 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sales Analytics & Revenue Reports</h1>
        <p className="text-xs text-slate-500 mt-0.5">Real-time GMV volume, commission splits, and sales trends.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Gross Merchandise Value</span>
          <p className="text-3xl font-extrabold text-slate-900">$34,890.00</p>
          <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" /> +24.8% vs last month
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform Commission (8%)</span>
          <p className="text-3xl font-extrabold text-rose-600">-$2,791.20</p>
          <span className="text-xs text-slate-400">Includes payment processing & cloud host</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Merchant Payout</span>
          <p className="text-3xl font-extrabold text-blue-700">$32,098.80</p>
          <span className="text-xs font-bold text-slate-600">Deposited bi-weekly</span>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900">Weekly Revenue Breakdown (Last 7 Days)</h3>
        <div className="grid grid-cols-7 gap-3 pt-6 items-end h-48">
          {[
            { day: "Thu", val: 65, amount: "$980" },
            { day: "Fri", val: 88, amount: "$1,340" },
            { day: "Sat", val: 100, amount: "$1,720" },
            { day: "Sun", val: 92, amount: "$1,560" },
            { day: "Mon", val: 55, amount: "$840" },
            { day: "Tue", val: 74, amount: "$1,120" },
            { day: "Wed (Today)", val: 82, amount: "$1,482" },
          ].map((bar, i) => (
            <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
              <span className="text-[10px] font-bold text-slate-500">{bar.amount}</span>
              <div
                style={{ height: `${bar.val}%` }}
                className="w-full bg-blue-600 rounded-t-xl hover:bg-blue-700 transition-all cursor-pointer"
              />
              <span className="text-[11px] font-bold text-slate-600">{bar.day}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
