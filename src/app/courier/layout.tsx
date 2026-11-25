"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  Bike, 
  Navigation, 
  FileText, 
  DollarSign, 
  User, 
  Bell, 
  MapPin, 
  Power,
  ChevronRight,
  Menu,
  X
} from "lucide-react";

export default function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [online, setOnline] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Assigned Deliveries", path: "/courier", icon: Bike, badge: "2 Active" },
    { name: "Live Route & Navigation", path: "/courier/live-route", icon: Navigation },
    { name: "Batch Manifest & Temp", path: "/courier/manifest", icon: FileText },
    { name: "Earnings & Tips", path: "/courier/earnings", icon: DollarSign },
    { name: "Profile & Equipment", path: "/courier/profile", icon: User },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col lg:flex-row">
      
      {/* Mobile Top Header */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-sm">
            <Bike className="w-4 h-4" />
          </div>
          <div>
            <span className="font-bold text-sm block leading-none">FreshMart Courier</span>
            <span className="text-[10px] text-emerald-400 font-semibold">● Online & Receiving</span>
          </div>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Left Sidebar */}
      <aside className={`w-72 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 fixed lg:sticky top-0 h-screen z-50 lg:z-30 transition-transform ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="p-6 space-y-6">
          
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-4">
              <span>← Back to Customer Store</span>
            </Link>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <Bike className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-sm text-white truncate leading-tight">
                  Marcus Vance
                </h3>
                <p className="text-[11px] text-amber-400 font-semibold mt-0.5">
                  Eco E-Bike • Tier 1 Courier
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-extrabold text-[9px]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

        </div>

        {/* Courier Duty Switch */}
        <div className="p-6 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">On Duty Status</span>
            <button
              onClick={() => setOnline(!online)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                online ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  online ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            {online ? "Receiving hyper-local orders within 3.5 miles." : "Offline. Shift paused."}
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Courier Partner Dispatch
            </span>
            <span className="hidden sm:inline text-xs text-slate-300">•</span>
            <span className="hidden sm:inline text-xs font-semibold text-emerald-600 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Thermal Bag Locked (3.4°C)
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer p-2 rounded-full hover:bg-slate-100 text-slate-600">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
            </div>

            <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center">
              MV
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-8 flex-1">
          {children}
        </div>

      </div>

    </div>
  );
}
