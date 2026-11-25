"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { 
  LayoutDashboard, 
  Package, 
  Boxes, 
  Hourglass, 
  ShoppingBag, 
  BarChart3, 
  Star, 
  Wallet, 
  Settings, 
  Store, 
  Bell, 
  ShieldCheck, 
  Search, 
  Power,
  ChevronRight,
  ExternalLink,
  Menu,
  X
} from "lucide-react";

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [storeOpen, setStoreOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "Overview", path: "/vendor", icon: LayoutDashboard },
    { name: "Product Catalog", path: "/vendor/products", icon: Package },
    { name: "Stock & Inventory", path: "/vendor/inventory", icon: Boxes },
    { name: "Batch & Expiry Tracker", path: "/vendor/expiry", icon: Hourglass, badge: "3 Near Expiry" },
    { name: "Orders & Fulfillment", path: "/vendor/orders", icon: ShoppingBag, badge: "4 New" },
    { name: "Sales & Analytics", path: "/vendor/analytics", icon: BarChart3 },
    { name: "Produce Reviews", path: "/vendor/reviews", icon: Star },
    { name: "Commission & Payouts", path: "/vendor/payouts", icon: Wallet },
    { name: "Store Settings", path: "/vendor/settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col lg:flex-row">
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-sm">
            VM
          </div>
          <span className="font-bold text-sm">GreenField Vendor Hub</span>
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
          
          {/* Logo & Store Identity */}
          <div>
            <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-4">
              <span>← Back to Customer Store</span>
            </Link>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-sm text-white truncate leading-tight">
                  GreenField Organic
                </h3>
                <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Merchant Account
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
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
                      ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
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

        {/* Bottom Store Open/Close Status */}
        <div className="p-6 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Store Accepting Orders</span>
            <button
              onClick={() => setStoreOpen(!storeOpen)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                storeOpen ? "bg-emerald-500" : "bg-slate-700"
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  storeOpen ? "left-6" : "left-1"
                }`}
              />
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            Auto-dispatch active • 25-35m courier routing enabled.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Merchant Partner Portal
            </span>
            <span className="hidden sm:inline text-xs text-slate-300">•</span>
            <span className="hidden sm:inline text-xs font-semibold text-slate-600">
              Brooklyn Hub #104
            </span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/stores/greenfield-organic"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
            >
              <span>View Live Storefront</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            {/* Notification bell */}
            <div className="relative cursor-pointer p-2 rounded-full hover:bg-slate-100 text-slate-600">
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
            </div>

            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
              GO
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 sm:p-8 flex-1">
          {children}
        </div>

      </div>

    </div>
  );
}
