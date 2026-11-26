"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { useAuthStore } from "@/lib/store/authStore";
import {
  getAdminCounts,
  getAdminOverview,
  getAdminNotifications,
  markAdminNotificationsRead,
} from "@/lib/actions/admin";
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
  Package,
  Tags,
  Ticket,
  Image as ImageIcon,
  MessageSquare,
  Menu,
  X,
  CheckCheck,
} from "lucide-react";

type Counts = {
  pendingVendors: number;
  newRefunds: number;
  pendingProducts: number;
  openTickets: number;
  pendingPayouts: number;
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [counts, setCounts] = useState<Counts>({
    pendingVendors: 0,
    newRefunds: 0,
    pendingProducts: 0,
    openTickets: 0,
    pendingPayouts: 0,
  });
  const [networkStats, setNetworkStats] = useState<{ vendors: number; couriers: number } | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notifLoading, setNotifLoading] = useState(false);

  const loadCounts = useCallback(async () => {
    if (!user?.id || user.role !== "admin") return;
    const [cRes, oRes, nRes] = await Promise.all([
      getAdminCounts(user.id),
      getAdminOverview(user.id),
      getAdminNotifications(user.id),
    ]);
    if (cRes.success && cRes.data) setCounts(cRes.data);
    if (oRes.success && oRes.data) {
      setNetworkStats({ vendors: oRes.data.vendors, couriers: oRes.data.couriers });
    }
    if (nRes.success && nRes.data) setNotifications(nRes.data);
  }, [user?.id, user?.role]);

  useEffect(() => {
    loadCounts();
  }, [loadCounts, pathname]);

  useEffect(() => {
    const handler = () => loadCounts();
    window.addEventListener("admin:refresh-counts", handler);
    return () => window.removeEventListener("admin:refresh-counts", handler);
  }, [loadCounts]);

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    setNotifLoading(true);
    const res = await markAdminNotificationsRead(user.id);
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    }
    setNotifLoading(false);
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;
  const initials = (user?.fullName || "AD")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const navItems = [
    { name: "Platform Overview", path: "/admin", icon: BarChart2 },
    {
      name: "Vendor Approvals (KYC)",
      path: "/admin/vendors",
      icon: Store,
      badge: counts.pendingVendors > 0 ? `${counts.pendingVendors} Pending` : undefined,
    },
    { name: "Platform Orders", path: "/admin/orders", icon: ShoppingBag },
    {
      name: "Refund & Dispute Hub",
      path: "/admin/refunds",
      icon: Receipt,
      badge: counts.newRefunds > 0 ? `${counts.newRefunds} New` : undefined,
    },
    {
      name: "Merchant Payouts",
      path: "/admin/payouts",
      icon: Wallet,
      badge: counts.pendingPayouts > 0 ? `${counts.pendingPayouts} Pending` : undefined,
    },
    { name: "Courier Fleet", path: "/admin/couriers", icon: Bike },
    { name: "Customers", path: "/admin/customers", icon: Users },
    {
      name: "Product Moderation",
      path: "/admin/products",
      icon: Package,
      badge: counts.pendingProducts > 0 ? `${counts.pendingProducts} Pending` : undefined,
    },
    { name: "Categories", path: "/admin/categories", icon: Tags },
    { name: "Coupons & Promos", path: "/admin/coupons", icon: Ticket },
    { name: "Storefront Banners", path: "/admin/banners", icon: ImageIcon },
    {
      name: "Support Tickets",
      path: "/admin/tickets",
      icon: MessageSquare,
      badge: counts.openTickets > 0 ? `${counts.openTickets} Open` : undefined,
    },
    { name: "Platform Settings", path: "/admin/settings", icon: Sliders },
  ];

  return (
    <div className="min-h-screen bg-slate-100/70 flex flex-col lg:flex-row">
      {/* Mobile Header */}
      <div className="lg:hidden bg-slate-900 text-white p-4 flex items-center justify-between border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center font-bold text-sm">
            {initials}
          </div>
          <span className="font-bold text-sm">FreshMart Super-Admin</span>
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
        className={`w-72 bg-slate-950 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 fixed lg:sticky top-0 h-screen z-50 lg:z-30 transition-transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 flex flex-col flex-1 min-h-0 space-y-5">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-4"
            >
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
                <p className="text-[11px] text-purple-300 font-semibold mt-0.5 truncate">
                  {user?.fullName || "Platform Operations"}
                </p>
              </div>
            </div>
          </div>

          <nav className="space-y-1 overflow-y-auto flex-1 pr-1">
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
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white font-extrabold text-[9px] shrink-0">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-5 border-t border-slate-800/80 text-[11px] text-slate-500">
          <p className="font-bold text-slate-400">FreshMart Network Status</p>
          <div className="flex items-center gap-1.5 text-emerald-400 mt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {networkStats
                ? `${networkStats.vendors} Stores & ${networkStats.couriers} Couriers Live`
                : "Connecting to live network..."}
            </span>
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

          <div className="flex items-center gap-4 relative">
            <button
              type="button"
              onClick={() => setNotifOpen((v) => !v)}
              className="relative cursor-pointer p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
              aria-label="Admin notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-1.5 right-1.5" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Admin Notifications ({unreadCount})
                  </span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      disabled={notifLoading}
                      className="text-[11px] font-bold text-purple-600 hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark read
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
                        className={`p-3.5 text-xs ${n.is_read ? "bg-white" : "bg-purple-50/50"}`}
                      >
                        <p className="font-bold text-slate-900">{n.title}</p>
                        <p className="text-[11px] text-slate-600 mt-0.5">{n.message}</p>
                        {(n.metadata?.link || n.link) && (
                          <Link
                            href={n.metadata?.link || n.link}
                            onClick={() => setNotifOpen(false)}
                            className="inline-block mt-1.5 text-[11px] font-bold text-purple-600 hover:underline"
                          >
                            View details →
                          </Link>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <div
              title={user?.email || "Admin"}
              className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center"
            >
              {initials}
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
