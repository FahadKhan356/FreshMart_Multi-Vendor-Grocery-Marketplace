"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { 
  ShieldCheck, 
  BarChart2, 
  Store, 
  Users, 
  ShoppingBag, 
  Receipt, 
  Wallet, 
  Bike, 
  Sliders, 
  Bell, 
  Search,
  ExternalLink,
  Menu,
  X
} from "lucide-react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Platform Overview", path: "/admin", icon: BarChart2 },
    { name: "Vendor Approvals (KYC)", path: "/admin/vendors", icon: Store, badge: "2 Pending" },
    { name: "Platform Orders", path: "/admin/orders", icon: ShoppingBag },
    { name: "Refund & Dispute Hub", path: "/admin/refunds", icon: Receipt, badge: "1 New" },
    { name: "Merchant Payouts", path: "/admin/payouts", icon: Wallet },
    { name: "Courier Fleet", path: "/admin/couriers", icon: Bike },
    { name: "Platform Settings", path: "/admin/settings", icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col lg:flex-row">
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-sm">
            SA
          </div>
          <span className="font-bold text-sm">FreshMart Super-Admin</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Left Sidebar */}
      <aside className={`w-72 bg-slate-950 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 fixed lg:sticky top-0 h-screen z-50 lg:z-30 transition-transform ${
        mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <div className="p-6 space-y-6">
          
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-4">
              <span>← Back to Customer Store</span>
            </Link>

            <div className="p-3.5 rounded-2xl bg-purple-950/40 border border-purple-800/40 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-sm text-white truncate leading-tight">
                  Super-Admin Portal
                </h3>
                <p className="text-[11px] text-purple-300 font-semibold mt-0.5">
                  Platform Operations
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
                      ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                      : "text-slate-400 hover:bg-slate-900 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[9px]">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

        </div>

        <div className="p-6 border-t border-slate-800/80 text-[11px] text-slate-500">
          <p className="font-bold text-slate-400">FreshMart Network Status</p>
          <div className="flex items-center gap-1.5 text-emerald-400 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>45 Stores & 28 Couriers Live</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Admin Platform Operations
            </span>
            <span className="hidden sm:inline text-xs text-slate-300">•</span>
            <span className="hidden sm:inline text-xs font-semibold text-slate-600">
              Brooklyn Multi-Vendor Network
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative cursor-pointer p-2 rounded-full hover:bg-slate-100 text-slate-600">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
            </div>

            <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center">
              AD
            </div>
          </div>
        </header>

        <div className="p-6 sm:p-8 flex-1">
          <RoleGuard allowedRoles={["admin"]} portalName="Super-Admin Portal">
            {children}
          </RoleGuard>
        </div>

      </div>

    </div>
  );
}
