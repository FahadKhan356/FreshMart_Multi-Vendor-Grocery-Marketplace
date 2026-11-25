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

export function RoleSwitcher() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const roles = [
    { name: "Customer Store", path: "/", icon: ShoppingBag, color: "bg-emerald-600 text-white" },
    { name: "Market Catalog", path: "/catalog", icon: ShoppingBag, color: "bg-emerald-500 text-white" },
    { name: "Vendor Dashboard", path: "/vendor", icon: Store, color: "bg-blue-600 text-white" },
    { name: "Super-Admin Portal", path: "/admin", icon: ShieldCheck, color: "bg-purple-600 text-white" },
    { name: "Courier Partner App", path: "/courier", icon: Bike, color: "bg-amber-600 text-white" },
  ];

  const currentRole = roles.find(r => pathname === r.path || (r.path !== "/" && pathname.startsWith(r.path))) || roles[0];

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="mb-2 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl p-2 shadow-2xl w-64 space-y-1 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="px-3 py-2 border-b border-slate-800">
            <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Switch FreshMart Role</p>
            <p className="text-xs text-slate-300">Live preview all 4 system actors</p>
          </div>
          {roles.map((role) => {
            const Icon = role.icon;
            const isActive = pathname === role.path || (role.path !== "/" && pathname.startsWith(role.path));
            return (
              <Link
                key={role.path}
                href={role.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive 
                    ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" 
                    : "text-slate-300 hover:bg-slate-800 hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4" />
                  <span>{role.name}</span>
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
        <span className="font-bold text-white">{currentRole.name}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}
