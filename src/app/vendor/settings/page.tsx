"use client";

import { useState } from "react";
import { Store, Clock, MapPin, UploadCloud, Check } from "lucide-react";

export default function VendorSettingsPage() {
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Store Profile & Operating Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Customize your storefront banner, operating schedule, minimum basket values, and dispatch radius.</p>
      </div>

      <form onSubmit={handleSave} className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-xs font-bold">
        {saved && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>Store settings successfully updated and live on marketplace!</span>
          </div>
        )}

        <div>
          <label className="text-slate-700 block mb-1">Store Legal Name</label>
          <input
            type="text"
            defaultValue="GreenField Organic Market LLC"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-700 block mb-1">Store Address</label>
            <input
              type="text"
              defaultValue="742 Atlantic Ave, Brooklyn, NY 11217"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
            />
          </div>
          <div>
            <label className="text-slate-700 block mb-1">Delivery Radius (Miles)</label>
            <input
              type="number"
              defaultValue="5.0"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-700 block mb-1">Store Opening Time</label>
            <input
              type="text"
              defaultValue="07:00 AM"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
            />
          </div>
          <div>
            <label className="text-slate-700 block mb-1">Store Closing Time</label>
            <input
              type="text"
              defaultValue="09:00 PM"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-700 block mb-1">Storefront Hero Banner Image URL</label>
          <input
            type="text"
            defaultValue="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=1200"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
          />
        </div>

        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/20 transition-all"
        >
          Save Storefront Configuration
        </button>
      </form>
    </div>
  );
}
