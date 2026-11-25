"use client";

import { useState } from "react";
import Link from "next/link";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import { 
  ShieldCheck, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Clock,
  Sparkles,
  Camera
} from "lucide-react";

export default function RefundsPage() {
  const [selectedOrder, setSelectedOrder] = useState("ORD-94821");
  const [selectedReason, setSelectedReason] = useState("spoilage");
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <CustomerHeader />

      <main className="min-h-screen bg-slate-50 py-10">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
          
          {/* Hero Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-3xl p-8 sm:p-10 mb-10 shadow-xl shadow-emerald-950/10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Instant Freshness Guarantee</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              Refund & Return Support Center
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mt-2 leading-relaxed">
              We stand behind every organic leaf, fruit, egg, and cut. If any grocery item is damaged, overripe, missing, or compromised during delivery, claim an instant wallet or card refund in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left: Claim Submission Form */}
            <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
              <h2 className="font-bold text-lg text-slate-900 pb-3 border-b border-slate-100">
                Submit Quality Guarantee Claim
              </h2>

              {submitted ? (
                <div className="p-8 rounded-2xl bg-fresh-50 border border-fresh-200 text-center space-y-3 animate-in fade-in">
                  <CheckCircle2 className="w-12 h-12 text-fresh-600 mx-auto" />
                  <h3 className="font-bold text-base text-slate-900">Refund Claim #REF-4418 Approved Instantly</h3>
                  <p className="text-xs text-slate-600 max-w-md mx-auto">
                    $4.99 has been credited back to your original payment method. Thank you for helping us maintain our local farm quality standards.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="px-4 py-2 rounded-xl bg-fresh-600 text-white font-bold text-xs"
                  >
                    Submit Another Claim
                  </button>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Step 1: Select Order */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                      1. Select Recent Order
                    </label>
                    <select
                      value={selectedOrder}
                      onChange={(e) => setSelectedOrder(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-fresh-600"
                    >
                      <option value="ORD-94821">Order #ORD-94821 - Today, 10:14 AM ($33.95)</option>
                      <option value="ORD-88219">Order #ORD-88219 - Nov 22, 2026 ($62.40)</option>
                      <option value="ORD-79104">Order #ORD-79104 - Nov 18, 2026 ($28.15)</option>
                    </select>
                  </div>

                  {/* Step 2: Select Items */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
                      2. Which Item Needs Quality Attention?
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center justify-between p-3 rounded-xl border border-fresh-600 bg-fresh-50/50 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" defaultChecked className="rounded text-fresh-600" />
                          <div>
                            <p className="font-bold text-xs text-slate-900">Organic Hass Avocados (4-pack)</p>
                            <p className="text-[11px] text-slate-500">GreenField Organic • $4.99</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-fresh-700">$4.99 refund</span>
                      </label>
                      <label className="flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input type="checkbox" className="rounded text-fresh-600" />
                          <div>
                            <p className="font-bold text-xs text-slate-900">Grade A Pasture-Raised Eggs (12-ct)</p>
                            <p className="text-[11px] text-slate-500">SunHarvest Direct • $5.49</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-500">$5.49 refund</span>
                      </label>
                    </div>
                  </div>

                  {/* Step 3: Reason */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                      3. Select Quality Reason
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold">
                      {[
                        { id: "spoilage", title: "Bruised / Overripe" },
                        { id: "temp", title: "Warm Upon Arrival" },
                        { id: "missing", title: "Item Missing in Bag" },
                      ].map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedReason(r.id)}
                          className={`p-3 rounded-xl border transition-all text-left ${
                            selectedReason === r.id
                              ? "border-fresh-600 bg-fresh-50 text-fresh-800 shadow-sm"
                              : "border-slate-200 text-slate-600 hover:border-slate-300"
                          }`}
                        >
                          {r.title}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Step 4: Photo Upload */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                      4. Upload Photo Evidence (Optional)
                    </label>
                    <div className="border-2 border-dashed border-slate-200 hover:border-fresh-500 rounded-2xl p-6 text-center bg-slate-50/50 cursor-pointer transition-colors">
                      <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800">Click or tap to attach produce photo</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG up to 10MB</p>
                    </div>
                  </div>

                  <button
                    onClick={() => setSubmitted(true)}
                    className="w-full py-4 rounded-2xl bg-fresh-600 hover:bg-fresh-700 text-white font-bold text-sm shadow-lg shadow-fresh-600/30 transition-all hover:scale-[1.01] active:scale-95"
                  >
                    Submit Guarantee Claim ($4.99)
                  </button>
                </div>
              )}
            </div>

            {/* Right: Policy & Guarantee Info */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <div className="w-10 h-10 rounded-xl bg-fresh-100 text-fresh-700 flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">How Refunds Work</h3>
                <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-fresh-600 shrink-0 mt-0.5" />
                    <span><strong>Instant Approval:</strong> Claims submitted within 24 hours of delivery are instantly processed without return shipping.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-fresh-600 shrink-0 mt-0.5" />
                    <span><strong>No Food Waste:</strong> You never have to mail back spoiled or damaged produce. Compost or dispose of it locally.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-fresh-600 shrink-0 mt-0.5" />
                    <span><strong>Farm Quality Feedback:</strong> Claims are fed back directly into the vendor dashboard to ensure supplier cold-chain integrity.</span>
                  </li>
                </ul>
              </div>

              {/* Past claims list */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">Past Guarantee Records</h4>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span>#REF-3910 (Organic Strawberries)</span>
                    <span className="text-emerald-700">+$4.49</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Processed Nov 12, 2026 • Refunded to Visa</p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>

      <CustomerFooter />
    </>
  );
}
