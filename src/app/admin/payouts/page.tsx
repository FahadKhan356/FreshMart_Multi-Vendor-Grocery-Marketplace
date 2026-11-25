import { formatPrice } from "@/lib/utils";
import { Wallet, CheckCircle2, ArrowUpRight, DollarSign } from "lucide-react";

export default function AdminPayoutsPage() {
  const settlements = [
    { merchant: "GreenField Organic Market", gmv: 34890.00, fee: 2791.20, netPayout: 32098.80, status: "Ready for ACH Transfer", bank: "Chase •••• 8821" },
    { merchant: "Valley Fresh Butcher & Deli", gmv: 28450.00, fee: 2276.00, netPayout: 26174.00, status: "Ready for ACH Transfer", bank: "Citibank •••• 1042" },
    { merchant: "SunHarvest Direct", gmv: 19820.00, fee: 1585.60, netPayout: 18234.40, status: "Ready for ACH Transfer", bank: "TD Bank •••• 9912" },
    { merchant: "Brooklyn Artisan Bakery", gmv: 12400.00, fee: 992.00, netPayout: 11408.00, status: "Ready for ACH Transfer", bank: "Wells Fargo •••• 5519" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Vendor Payouts & Commission Settlement
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated bi-weekly escrow transfers, platform fee holdbacks (8%), and banking ACH dispatch.
          </p>
        </div>

        <button className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20 transition-all flex items-center gap-1.5">
          <Wallet className="w-4 h-4" />
          <span>Execute All ACH Batch Transfers</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Organic Merchant</th>
              <th className="py-3 px-6">Gross GMV</th>
              <th className="py-3 px-6">Platform Fee (8%)</th>
              <th className="py-3 px-6">Net ACH Payout</th>
              <th className="py-3 px-6">Bank Destination</th>
              <th className="py-3 px-6 text-right">Settlement Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {settlements.map((s, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="py-4 px-6 font-bold text-slate-900">{s.merchant}</td>
                <td className="py-4 px-6 font-extrabold text-slate-900">{formatPrice(s.gmv)}</td>
                <td className="py-4 px-6 font-bold text-purple-700">+{formatPrice(s.fee)}</td>
                <td className="py-4 px-6 font-extrabold text-emerald-700">{formatPrice(s.netPayout)}</td>
                <td className="py-4 px-6 text-slate-500 font-mono text-[11px]">{s.bank}</td>
                <td className="py-4 px-6 text-right">
                  <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {s.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
