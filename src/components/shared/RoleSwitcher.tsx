"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  ShoppingBag, 
  Store, 
  ShieldCheck, 
  Bike, 
  ExternalLink,
  ChevronDown
} from "lucide-react";
import { useState } from "react";
import { useAuthStore, UserRole } from "@/lib/store/authStore";

export function RoleSwitcher() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user, switchRole } = useAuthStore();
  const activeRole = user?.role || "customer";

  const roles: { roleId: UserRole; name: string; path: string; icon: any }[] = [
    { roleId: "customer", name: "Customer Store", path: "/", icon: ShoppingBag },
    { roleId: "customer", name: "Market Catalog", path: "/catalog", icon: ShoppingBag },
    { roleId: "vendor", name: "Vendor Dashboard", path: "/vendor", icon: Store },
    { roleId: "admin", name: "Super-Admin Portal", path: "/admin", icon: ShieldCheck },
    { roleId: "courier", name: "Courier Partner App", path: "/courier", icon: Bike },
  ];

  const currentRoleObj = roles.find(r => pathname === r.path || (r.path !== "/" && pathname.startsWith(r.path))) || roles[0];

  const handleRoleSelect = (roleId: UserRole) => {
    switchRole(roleId);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-2 shadow-2xl w-64 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-3 py-2 border-b border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Switch FreshMart Role</p>
            <p className="text-xs text-slate-300">Live preview all 4 system actors</p>
          </div>
          {roles.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path || (item.path !== "/" && pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => handleRoleSelect(item.roleId)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive 
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {isActive && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
              </Link>
            );
          })}
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-900 text-white font-semibold text-xs shadow-xl shadow-slate-950/30 hover:bg-slate-800 border border-slate-700 transition-all hover:scale-105 active:scale-95"
      >
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-slate-300">Role:</span>
        <span className="font-bold text-white capitalize">{activeRole} ({currentRoleObj.name})</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}

