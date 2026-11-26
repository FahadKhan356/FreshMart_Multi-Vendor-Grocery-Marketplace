"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import { UserRole } from "@/lib/validations/auth";
import { ShieldAlert, Lock, ArrowRight, UserCheck } from "lucide-react";

interface RoleGuardProps {
  allowedRoles: UserRole[];
  portalName: string;
  children: React.ReactNode;
}

export function RoleGuard({ allowedRoles, portalName, children }: RoleGuardProps) {
  const [mounted, setMounted] = useState(false);
  const user = useAuthStore((s) => s.user);
  const switchRole = useAuthStore((s) => s.switchRole);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="w-8 h-8 rounded-full border-3 border-emerald-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  const isAuthorized = user && allowedRoles.includes(user.role);

  if (!isAuthorized) {
    const primaryRequiredRole = allowedRoles[0];
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-800/90 border border-slate-700 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-extrabold uppercase tracking-wider">
              RBAC Security Policy Enforced
            </span>
            <h1 className="text-2xl font-extrabold tracking-tight">
              {portalName} Access Restricted
            </h1>
            <p className="text-xs text-slate-400 leading-relaxed">
              You are currently signed in as{" "}
              <span className="font-bold text-white">
                {user ? `${user.fullName} (${user.role.toUpperCase()})` : "Guest"}
              </span>
              . Accessing the {portalName} requires{" "}
              <span className="font-bold text-emerald-400">
                {allowedRoles.map((r) => r.toUpperCase()).join(" or ")}
              </span>{" "}
              authorization.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <button
              onClick={() => switchRole(primaryRequiredRole)}
              className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all"
            >
              <UserCheck className="w-4 h-4" />
              <span>Switch & Authenticate as {primaryRequiredRole.toUpperCase()}</span>
            </button>

            <Link
              href="/login"
              className="w-full py-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Sign In with Different Account</span>
            </Link>

            <Link
              href="/"
              className="block text-xs text-slate-400 hover:text-white pt-2 font-semibold"
            >
              ← Return to Customer Marketplace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
