import { DollarSign, TrendingUp, Wallet, CheckCircle2, ArrowUpRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

export default function CourierEarningsPage() {
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Driver Earnings & Tip Payouts</h1>
        <p className="text-xs text-slate-500 mt-0.5">Real-time breakdown of trip fees, customer tips, and instant wallet balance.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Today's Total Pay</span>
          <p className="text-3xl font-extrabold text-slate-900">$142.50</p>
          <span className="text-xs font-bold text-emerald-600">8 trips completed • 4.5 hrs on duty</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Customer Tips (100% Yours)</span>
          <p className="text-3xl font-extrabold text-amber-600">$48.00</p>
          <span className="text-xs text-slate-400">Avg tip: $6.00 per grocery order</span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Available for Instant Cashout</span>
          <p className="text-3xl font-extrabold text-emerald-700">$190.50</p>
          <button className="px-3 py-1 rounded-xl bg-slate-900 text-white font-bold text-xs mt-1">
            Cash Out Now (Free ACH)
          </button>
        </div>
      </div>
    </div>
  );
}
