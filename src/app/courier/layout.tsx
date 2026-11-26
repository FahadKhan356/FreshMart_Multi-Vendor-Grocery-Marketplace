"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { RoleGuard } from "@/components/shared/RoleGuard";
import { useAuthStore } from "@/lib/store/authStore";
import {
  getCourierLayoutData,
  markCourierNotificationsRead,
  toggleCourierOnlineStatus,
} from "@/lib/actions/courier";
import type { CourierNotificationDTO, CourierProfileDTO } from "@/lib/data/courier";
import {
  Bike,
  Navigation,
  FileText,
  DollarSign,
  User,
  Bell,
  Menu,
  X,
  Check,
} from "lucide-react";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function CourierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const user = useAuthStore((s) => s.user);
  const [profile, setProfile] = useState<CourierProfileDTO | null>(null);
  const [online, setOnline] = useState(true);
  const [togglingOnline, setTogglingOnline] = useState(false);
  const [activeCount, setActiveCount] = useState(0);
  const [latestTemp, setLatestTemp] = useState<number | null>(null);
  const [notifications, setNotifications] = useState<CourierNotificationDTO[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const loadLayoutData = useCallback(async () => {
    if (!user?.id || (user.role !== "courier" && user.role !== "admin")) return;
    const res = await getCourierLayoutData(user.id);
    if (res.success && res.profile) {
      setProfile(res.profile);
      setOnline(res.profile.isOnline);
      setActiveCount(res.activeCount ?? 0);
      setLatestTemp(res.latestTemp ?? null);
      setNotifications(res.notifications ?? []);
    }
  }, [user?.id, user?.role]);

  useEffect(() => {
    loadLayoutData();
  }, [loadLayoutData, pathname]);

  useEffect(() => {
    const handler = () => {
      loadLayoutData();
    };
    window.addEventListener("freshmart:courier-updated", handler);
    return () => window.removeEventListener("freshmart:courier-updated", handler);
  }, [loadLayoutData]);

  const handleToggleOnline = async () => {
    if (!user?.id || togglingOnline) return;
    const nextOnline = !online;
    setTogglingOnline(true);
    setStatusError(null);
    setOnline(nextOnline);
    const res = await toggleCourierOnlineStatus(user.id, nextOnline);
    if (!res.success) {
      setOnline(!nextOnline);
      setStatusError(res.error || "Failed to update status.");
    }
    setTogglingOnline(false);
  };

  const handleMarkAllRead = async () => {
    if (!user?.id) return;
    const res = await markCourierNotificationsRead(user.id);
    if (res.success) {
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    }
  };

  const displayName = profile?.fullName || user?.fullName || "Courier Partner";
  const displayVehicle = profile?.vehicle || "Eco E-Bike";
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const navItems = [
    {
      name: "Assigned Deliveries",
      path: "/courier",
      icon: Bike,
      badge: `${activeCount} Active`,
    },
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
            <span
              className={`text-[10px] font-semibold ${
                online ? "text-emerald-400" : "text-slate-400"
              }`}
            >
              {online ? "● Online & Receiving" : "● Offline • Shift Paused"}
            </span>
          </div>
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
        className={`w-72 bg-slate-900 text-slate-300 flex flex-col justify-between shrink-0 border-r border-slate-800 fixed lg:sticky top-0 h-screen z-50 lg:z-30 transition-transform ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6 space-y-6">
          <div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition-colors mb-4"
            >
              <span>← Back to Customer Store</span>
            </Link>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shrink-0">
                <Bike className="w-5 h-5" />
              </div>
              <div className="overflow-hidden">
                <h3 className="font-bold text-sm text-white truncate leading-tight">
                  {displayName}
                </h3>
                <p className="text-[11px] text-amber-400 font-semibold mt-0.5 truncate">
                  {displayVehicle}
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
              onClick={handleToggleOnline}
              disabled={togglingOnline}
              aria-label="Toggle online status"
              className={`w-11 h-6 rounded-full transition-colors relative disabled:opacity-60 ${
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
          {statusError && <p className="text-[11px] text-rose-400">{statusError}</p>}
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
              {latestTemp !== null
                ? `Thermal Bag Locked (${latestTemp.toFixed(1)}°C)`
                : "Thermal Bag Standby"}
            </span>
          </div>

          <div className="flex items-center gap-4 relative">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative cursor-pointer p-2 rounded-full hover:bg-slate-100 text-slate-600"
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
              )}
            </button>

            {notifOpen && (
              <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl border border-slate-200 shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">
                    Notifications ({unreadCount} unread)
                  </span>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" /> Mark read
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
                        className={`p-3 text-xs space-y-0.5 ${
                          n.isRead ? "bg-white" : "bg-emerald-50/40"
                        }`}
                      >
                        <p className="font-bold text-slate-900">{n.title}</p>
                        <p className="text-slate-600">{n.message}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            <Link
              href="/courier/profile"
              className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center"
              title={displayName}
            >
              {getInitials(displayName)}
            </Link>
          </div>
        </header>

        <div className="p-6 sm:p-8 flex-1">
          <RoleGuard allowedRoles={["courier", "admin"]} portalName="Courier Fleet">
            {children}
          </RoleGuard>
        </div>
      </div>
    </div>
  );
}
