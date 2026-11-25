import { formatPrice } from "@/lib/utils";
import { Wallet, CheckCircle2, ArrowDownRight, Building } from "lucide-react";

export default function VendorPayoutsPage() {
  const payouts = [
    { id: "PAY-8812", period: "Nov 10 - Nov 17, 2026", gross: 7920.00, fee: 633.60, net: 7286.40, status: "Deposited", date: "Nov 19, 2026" },
    { id: "PAY-8750", period: "Nov 03 - Nov 10, 2026", gross: 8450.00, fee: 676.00, net: 7774.00, status: "Deposited", date: "Nov 12, 2026" },
    { id: "PAY-8692", period: "Oct 27 - Nov 03, 2026", gross: 6810.00, fee: 544.80, net: 6265.20, status: "Deposited", date: "Nov 05, 2026" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Commission & Payout History</h1>
        <p className="text-xs text-slate-500 mt-0.5">Automated settlements directly to your registered business bank account.</p>
      </div>

      {/* Connected Account Card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-900">Chase Business Checking (•••• 8821)</h3>
            <p className="text-xs text-slate-400">GreenField Organic LLC • Routing: 021000021</p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" /> Verified & Active
        </span>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Settlement ID</th>
              <th className="py-3 px-6">Billing Period</th>
              <th className="py-3 px-6">Gross Sales</th>
              <th className="py-3 px-6">Platform Fee (8%)</th>
              <th className="py-3 px-6">Net Transfer</th>
              <th className="py-3 px-6 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {payouts.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/50">
                <td className="py-4 px-6 font-bold text-slate-900">{p.id}</td>
                <td className="py-4 px-6 text-slate-600">{p.period}</td>
                <td className="py-4 px-6 font-extrabold text-slate-900">{formatPrice(p.gross)}</td>
                <td className="py-4 px-6 text-rose-600 font-semibold">-{formatPrice(p.fee)}</td>
                <td className="py-4 px-6 font-extrabold text-blue-700">{formatPrice(p.net)}</td>
                <td className="py-4 px-6 text-right">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                    {p.status} on {p.date}
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
