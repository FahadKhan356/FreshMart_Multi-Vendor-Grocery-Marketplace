"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { VendorProvider, useVendor } from "./VendorContext";
import { toggleStoreOpen } from "@/lib/actions/vendor";
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
  ExternalLink,
  Menu,
  X,
  CheckCheck,
  Loader2,
} from "lucide-react";

function VendorShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    userId,
    stores,
    store,
    storeId,
    nearExpiryCount,
    newOrdersCount,
    notifications,
    unreadCount,
    switchStore,
    refreshStore,
    markAllNotificationsRead,
  } = useVendor();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const navItems = [
    { name: "Overview", path: "/vendor", icon: LayoutDashboard },
    { name: "Product Catalog", path: "/vendor/products", icon: Package },
    { name: "Stock & Inventory", path: "/vendor/inventory", icon: Boxes },
    {
      name: "Batch & Expiry Tracker",
      path: "/vendor/expiry",
      icon: Hourglass,
      badge: nearExpiryCount > 0 ? `${nearExpiryCount} Near Expiry` : undefined,
    },
    {
      name: "Orders & Fulfillment",
      path: "/vendor/orders",
      icon: ShoppingBag,
      badge: newOrdersCount > 0 ? `${newOrdersCount} New` : undefined,
    },
    { name: "Sales & Analytics", path: "/vendor/analytics", icon: BarChart3 },
    { name: "Produce Reviews", path: "/vendor/reviews", icon: Star },
    { name: "Commission & Payouts", path: "/vendor/payouts", icon: Wallet },
    { name: "Store Settings", path: "/vendor/settings", icon: Settings },
  ];

  const storeName = store?.name || "Partner Store";
  const initials = storeName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || "")
    .join("") || "FM";

  const handleToggleStoreOpen = async () => {
    if (!storeId || !store || togglingOpen) return;
    setTogglingOpen(true);
    setStatusMsg(null);
    const nextOpen = !store.is_open;
    const res = await toggleStoreOpen(storeId, nextOpen, userId);
    if (res.success) {
      await refreshStore();
      setStatusMsg(nextOpen ? "Store is now accepting orders" : "Store paused");
      setTimeout(() => setStatusMsg(null), 2500);
    } else {
      setStatusMsg(res.error || "Failed to update store status");
    }
    setTogglingOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#16a34a] flex items-center justify-center font-bold text-sm">
            {initials}
          </div>
          <span className="font-bold text-sm truncate max-w-[200px]">{storeName}</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-slate-800 text-slate-300"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Left Sidebar */}
      <aside
        className={`w-72 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 fixed lg:sticky top-0 h-screen z-50 lg:z-30 transition-transform overflow-y-auto ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 space-y-6">
          {/* Logo & Store Identity */}
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-4"
            >
              <span>← Back to Customer Store</span>
            </Link>

            <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/60 space-y-2.5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#16a34a] text-white flex items-center justify-center font-bold shrink-0 overflow-hidden">
                  {store?.logo ? (
                    <img src={store.logo} alt={storeName} className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-5 h-5" />
                  )}
                </div>
                <div className="overflow-hidden">
                  <h3 className="font-bold text-sm text-white truncate leading-tight">
                    {storeName}
                  </h3>
                  <p className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        store?.is_open !== false ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
                      }`}
                    />
                    {store?.is_open !== false ? "Accepting Orders" : "Store Paused"}
                  </p>
                </div>
              </div>

              {stores.length > 1 && (
                <select
                  value={storeId || ""}
                  onChange={(e) => switchStore(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-[11px] font-semibold rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500"
                  aria-label="Switch active store"
                >
                  {stores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              )}
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
                      ? "bg-[#16a34a] text-white shadow-md shadow-emerald-600/30"
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
        <div className="p-6 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Store Accepting Orders</span>
            <button
              onClick={handleToggleStoreOpen}
              disabled={togglingOpen || !storeId}
              aria-label="Toggle store accepting orders"
              className={`w-11 h-6 rounded-full transition-colors relative disabled:opacity-50 ${
                store?.is_open !== false ? "bg-[#16a34a]" : "bg-slate-700"
              }`}
            >
              {togglingOpen ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-white mx-auto" />
              ) : (
                <span
                  className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                    store?.is_open !== false ? "left-6" : "left-1"
                  }`}
                />
              )}
            </button>
          </div>
          {statusMsg && (
            <p className="text-[11px] font-semibold text-emerald-400">{statusMsg}</p>
          )}
          <p className="text-[11px] text-slate-500">
            Auto-dispatch active • {store?.delivery_time || "25-35 mins"} routing.
          </p>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-20 shadow-xs">
          <div className="flex items-center gap-4 min-w-0">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 shrink-0">
              Merchant Partner Portal
            </span>
            <span className="hidden sm:inline text-xs text-slate-300">•</span>
            <span className="hidden sm:inline text-xs font-semibold text-slate-600 truncate">
              {store?.address || storeName}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {store?.slug && (
              <Link
                href={`/stores/${store.slug}`}
                target="_blank"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-[#16a34a] hover:text-[#14532d] hover:underline"
              >
                <span>View Live Storefront</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}

            {/* Notification bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative cursor-pointer p-2 rounded-full hover:bg-slate-100 text-slate-600"
                aria-label="Toggle notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                  <div className="p-3.5 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Notifications ({unreadCount} unread)
                    </span>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="text-[11px] font-bold text-[#16a34a] hover:underline flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <p className="p-4 text-xs text-slate-400 text-center">No notifications yet.</p>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n.id}
                          className={`p-3.5 text-xs space-y-1 ${
                            n.is_read ? "bg-white" : "bg-emerald-50/40"
                          }`}
                        >
                          <p className="font-bold text-slate-900">{n.title}</p>
                          <p className="text-[11px] text-slate-600">{n.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#14532d] font-bold text-xs flex items-center justify-center">
              {initials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-6 sm:p-8 flex-1">{children}</div>
      </div>
    </div>
  );
}

export default function VendorLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard allowedRoles={["vendor", "admin"]} portalName="Vendor Hub">
      <VendorProvider>
        <VendorShell>{children}</VendorShell>
      </VendorProvider>
    </RoleGuard>
  );
}
