"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { 
  Bike, 
  MapPin, 
  Navigation, 
  Clock, 
  Store, 
  User, 
  CheckCircle2, 
  Phone, 
  ShieldCheck,
  ChevronRight
} from "lucide-react";

export default function CourierDashboardPage() {
  const [deliveries, setDeliveries] = useState([
    {
      id: "DEL-7712",
      orderId: "ORD-94821",
      pickup: "GreenField Organic Market (742 Atlantic Ave)",
      dropoff: "Sarah Jenkins (742 Evergreen Terr, Apt 4B)",
      eta: "14 mins",
      distance: "1.2 miles",
      payout: 8.50,
      tip: 3.00,
      status: "In Transit",
      temp: "3.4°C",
    },
    {
      id: "DEL-7714",
      orderId: "ORD-94825",
      pickup: "Brooklyn Artisan Bakery (95 5th Ave)",
      dropoff: "Elena Rostova (310 Court St, Cobble Hill)",
      eta: "30 mins",
      distance: "2.1 miles",
      payout: 11.20,
      tip: 5.00,
      status: "Assigned (Pickup Ready)",
      temp: "Ambient Bakery Box",
    },
  ]);

  return (
    <div className="space-y-6 max-w-7xl">
      
      {/* Overview Banner */}
      <div className="bg-amber-500 text-slate-950 p-6 sm:p-8 rounded-3xl shadow-lg shadow-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
            Active Shift Batch
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            2 Deliveries in Your Active Manifest
          </h1>
          <p className="text-xs text-slate-900 font-medium mt-1">
            Optimized consolidated multi-stop route • 3.3 total miles • Total Payout: $27.70
          </p>
        </div>

        <Link
          href="/courier/live-route"
          className="px-6 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs shadow-md flex items-center gap-2 shrink-0 transition-transform active:scale-95"
        >
          <Navigation className="w-4 h-4 text-emerald-400" />
          <span>Launch GPS Navigation</span>
        </Link>
      </div>

      {/* Deliveries Cards */}
      <div className="space-y-4">
        {deliveries.map((del) => (
          <div
            key={del.id}
            className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900">{del.id}</span>
                <span className="text-xs text-slate-400">• Order {del.orderId}</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                  {del.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                  {del.temp}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <Store className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 font-medium block text-[10px] uppercase">Pickup Point</span>
                    <span className="font-bold text-slate-900">{del.pickup}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-2">
                  <MapPin className="w-4 h-4 text-fresh-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-slate-400 font-medium block text-[10px] uppercase">Dropoff Destination</span>
                    <span className="font-bold text-slate-900">{del.dropoff}</span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between space-y-3">
                <div className="flex justify-between items-baseline">
                  <span className="text-slate-500 font-medium">Estimated Trip Earnings:</span>
                  <span className="text-base font-extrabold text-slate-900">
                    {formatPrice(del.payout + del.tip)}
                    <span className="text-[10px] font-semibold text-emerald-600 ml-1">
                      (Includes {formatPrice(del.tip)} tip)
                    </span>
                  </span>
                </div>

                <div className="flex gap-2">
                  <Link
                    href="/courier/live-route"
                    className="flex-1 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800"
                  >
                    <Navigation className="w-3.5 h-3.5 text-amber-400" />
                    <span>Navigate</span>
                  </Link>
                  <a
                    href="tel:5552348901"
                    className="px-3 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-300"
                  >
                    <Phone className="w-3.5 h-3.5" /> Call
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
