import { User, ShieldCheck, Bike, CheckCircle2 } from "lucide-react";

export default function CourierProfilePage() {
  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Courier Profile & Equipment Verification</h1>
        <p className="text-xs text-slate-500 mt-0.5">Active certifications for sub-4°C food handling and e-bike safety.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-xs">
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center">
            MV
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">Marcus Vance</h3>
            <p className="text-slate-500">marcus.vance@courier.freshmart.local • (555) 782-9912</p>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] mt-1">
              Rating: ★ 4.98 (640 Deliveries)
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-bold text-slate-900 text-sm">Inspected Equipment</h4>
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-600">Thermal Cold-Chain Box (40L):</span>
              <span className="text-emerald-700 font-bold">Passed Inspection (Nov 2026)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-600">Vehicle Type:</span>
              <span className="font-bold text-slate-800">RadPower Commercial Cargo E-Bike</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-slate-600">NYC Food Protection Certificate:</span>
              <span className="text-emerald-700 font-bold">#FPC-99142 Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
