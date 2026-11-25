"use client";

import { useState } from "react";
import Link from "next/link";
import { Navigation, MapPin, CheckCircle2, Phone, AlertCircle, ShieldCheck } from "lucide-react";

export default function CourierLiveRoutePage() {
  const [completed, setCompleted] = useState(false);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Turn-by-Turn Route Navigation</h1>
          <p className="text-xs text-slate-500 mt-0.5">Live GPS guidance to 742 Evergreen Terrace, Brooklyn.</p>
        </div>
        <Link href="/courier" className="text-xs font-bold text-amber-600 hover:underline">
          ← Back to Manifest
        </Link>
      </div>

      {/* Simulated Map Viewport */}
      <div className="relative h-72 sm:h-96 w-full rounded-3xl bg-slate-900 overflow-hidden shadow-xl border border-slate-800 flex items-center justify-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

        <div className="relative z-10 text-center space-y-3 p-6">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
            <Navigation className="w-7 h-7 animate-bounce" />
          </div>
          <h3 className="text-lg font-bold">Turn Right onto Atlantic Avenue in 250 ft</h3>
          <p className="text-xs text-slate-400">Head toward Flatbush Ave • 1.2 miles remaining (ETA 10:45 AM)</p>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-300">
            <span>Cold Bag Sensor: 3.4°C (Normal)</span>
          </div>
        </div>

        {/* Live Traffic Pill */}
        <div className="absolute bottom-4 left-4 right-4 bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Customer Destination</span>
            <span className="font-bold text-white">Sarah Jenkins • Apt 4B</span>
          </div>
          <a
            href="tel:5552348901"
            className="px-3 py-1.5 rounded-xl bg-fresh-600 text-white font-bold flex items-center gap-1"
          >
            <Phone className="w-3.5 h-3.5" /> Call Customer
          </a>
        </div>
      </div>

      {/* Delivery Confirmation Box */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
        <h3 className="font-bold text-sm text-slate-900">Delivery Confirmation Checkpoint</h3>
        <p className="text-xs text-slate-500">
          Verify insulated seal before handing to customer. Ring door bell 4B or leave in designated contactless safe drop.
        </p>

        {completed ? (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span>Dropoff complete! $11.50 added to your daily wallet earnings.</span>
          </div>
        ) : (
          <button
            onClick={() => setCompleted(true)}
            className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Confirm Package Handed Over to Customer</span>
          </button>
        )}
      </div>
    </div>
  );
}
