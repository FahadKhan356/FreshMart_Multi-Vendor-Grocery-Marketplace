"use client";

import { useState } from "react";
import Link from "next/link";
import { ShieldCheck, Truck, Clock, RefreshCw, Phone, Mail, X } from "lucide-react";

const POLICY_DOCS: Record<string, { title: string; body: string }> = {
  organic: {
    title: "Organic Verification Standards",
    body: "Every produce, dairy, and pantry partner on FreshMart undergoes USDA Organic or Certified Naturally Grown verification. Farm origin tags and harvest dates are logged at batch intake.",
  },
  coldchain: {
    title: "Cold-Chain Temperature Policy",
    body: "Perishables are packed in insulated thermal totes with food-grade gel packs and monitored by our courier fleet to remain below 4°C (39°F) from store pickup to your doorstep.",
  },
  terms: {
    title: "Terms of Service",
    body: "Orders placed on FreshMart are fulfilled directly by independent partner stores. Multi-vendor carts are split into store sub-orders with unified delivery and 24-hour Freshness Guarantee coverage.",
  },
  privacy: {
    title: "Privacy Shield Compliance",
    body: "Your delivery addresses, order history, and payment details are encrypted in transit and at rest. FreshMart never sells customer data to third-party advertisers.",
  },
  charter: {
    title: "Local Farm Cooperative Charter",
    body: "FreshMart partners directly with local family farms, artisan bakeries, and independent grocers, returning 92% of every item sale directly to the producing merchant.",
  },
};

export function CustomerFooter() {
  const [activePolicy, setActivePolicy] = useState<string | null>(null);
  const policy = activePolicy ? POLICY_DOCS[activePolicy] : null;

  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 mt-20 border-t border-slate-800">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
        {/* Guarantees Strip */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800 text-white">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-fresh-500/10 text-fresh-400 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold">30-Min Rapid Delivery</h4>
              <p className="text-xs text-slate-400">Hyper-local temperature controlled fleet</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-fresh-500/10 text-fresh-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold">100% Certified Organic</h4>
              <p className="text-xs text-slate-400">Traceable direct farm origin tags</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-fresh-500/10 text-fresh-400 flex items-center justify-center shrink-0">
              <RefreshCw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Instant Freshness Refund</h4>
              <p className="text-xs text-slate-400">One-tap refund if quality falls short</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-fresh-500/10 text-fresh-400 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold">Multi-Vendor Cart</h4>
              <p className="text-xs text-slate-400">Shop across independent shops in one checkout</p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12 border-b border-slate-800 text-xs">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-fresh-600 flex items-center justify-center text-white">
                🥬
              </div>
              <span className="text-xl font-black text-white">FreshMart</span>
            </div>
            <p className="text-slate-400 max-w-sm leading-relaxed mb-4">
              FreshMart is the modern hyper-local grocery platform empowering independent local farms, organic grocers, artisan bakers, and butchers to sell directly to community homes.
            </p>
            <div className="flex items-center gap-4 text-slate-400">
              <div className="flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-fresh-400" />
                <span>1-800-FRESH-MART</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-fresh-400" />
                <span>support@freshmart.local</span>
              </div>
            </div>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Customer Service</h5>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/catalog" className="hover:text-white transition-colors">Browse Marketplace</Link></li>
              <li><Link href="/stores" className="hover:text-white transition-colors">Explore Local Stores</Link></li>
              <li><Link href="/account" className="hover:text-white transition-colors">Track Active Orders</Link></li>
              <li><Link href="/refunds" className="hover:text-white transition-colors">Freshness Guarantee Claims</Link></li>
              <li><Link href="/cart" className="hover:text-white transition-colors">View Cart &amp; Bag</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Merchant &amp; Partners</h5>
            <ul className="space-y-2 text-slate-400">
              <li><Link href="/vendor" className="hover:text-white transition-colors font-semibold text-fresh-400">Vendor Portal Login</Link></li>
              <li><Link href="/courier" className="hover:text-white transition-colors font-semibold text-amber-400">Courier Driver App</Link></li>
              <li><Link href="/admin" className="hover:text-white transition-colors font-semibold text-purple-400">Super-Admin Operations</Link></li>
              <li><Link href="/vendor/inventory" className="hover:text-white transition-colors">Batch Expiry Management</Link></li>
              <li><Link href="/vendor/payouts" className="hover:text-white transition-colors">Merchant Payout Schedule</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="font-bold text-white uppercase tracking-wider text-[11px] mb-3">Platform &amp; Legal</h5>
            <ul className="space-y-2 text-slate-400">
              <li><button type="button" onClick={() => setActivePolicy("organic")} className="hover:text-white transition-colors text-left">Organic Verification Standards</button></li>
              <li><button type="button" onClick={() => setActivePolicy("coldchain")} className="hover:text-white transition-colors text-left">Cold-Chain Temperature Policy</button></li>
              <li><button type="button" onClick={() => setActivePolicy("terms")} className="hover:text-white transition-colors text-left">Terms of Service</button></li>
              <li><button type="button" onClick={() => setActivePolicy("privacy")} className="hover:text-white transition-colors text-left">Privacy Shield Compliance</button></li>
              <li><button type="button" onClick={() => setActivePolicy("charter")} className="hover:text-white transition-colors text-left">Local Farm Cooperative Charter</button></li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 FreshMart Marketplace Technologies. Built with Next.js, TypeScript &amp; Tailwind CSS.</p>
          <div className="flex items-center gap-4">
            <span className="px-2 py-1 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">v1.0.0 Production Ready</span>
            <span>Made with 💚 for local organic producers</span>
          </div>
        </div>
      </div>

      {/* Policy Modal */}
      {policy && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white text-slate-900 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="font-extrabold text-base">{policy.title}</h4>
              <button
                type="button"
                onClick={() => setActivePolicy(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">{policy.body}</p>
            <button
              type="button"
              onClick={() => setActivePolicy(null)}
              className="w-full py-2.5 rounded-xl bg-fresh-600 hover:bg-fresh-700 text-white text-xs font-bold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </footer>
  );
}
