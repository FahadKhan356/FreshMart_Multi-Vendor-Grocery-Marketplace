"use client";

import { useState, useEffect } from "react";
import { Check, Loader2, X } from "lucide-react";
import { useVendor } from "../VendorContext";
import { updateStoreSettings } from "@/lib/actions/vendor";

export default function VendorSettingsPage() {
  const { store, storeId, userId, loading, refreshStore } = useVendor();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [logo, setLogo] = useState("");
  const [banner, setBanner] = useState("");
  const [isOpen, setIsOpen] = useState(true);
  const [deliveryFee, setDeliveryFee] = useState("2.99");
  const [minOrder, setMinOrder] = useState("15.00");
  const [deliveryTime, setDeliveryTime] = useState("25-35 mins");
  const [deliveryRadius, setDeliveryRadius] = useState("5.0");
  const [openingTime, setOpeningTime] = useState("07:00 AM");
  const [closingTime, setClosingTime] = useState("09:00 PM");

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (!store) return;
    setName(store.name);
    setDescription(store.description);
    setAddress(store.address);
    setPhone(store.phone);
    setLogo(store.logo);
    setBanner(store.banner);
    setIsOpen(store.is_open);
    setDeliveryFee(String(store.delivery_fee));
    setMinOrder(String(store.min_order));
    setDeliveryTime(store.delivery_time);
    setDeliveryRadius(String(store.delivery_radius));
    setOpeningTime(store.opening_time);
    setClosingTime(store.closing_time);
  }, [store]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeId) return;
    setSaving(true);
    setFeedback(null);

    const res = await updateStoreSettings(
      storeId,
      {
        name: name.trim(),
        description: description.trim(),
        address: address.trim(),
        phone: phone.trim(),
        logo: logo.trim(),
        banner: banner.trim(),
        is_open: isOpen,
        delivery_fee: Number(deliveryFee) || 0,
        min_order: Number(minOrder) || 0,
        delivery_time: deliveryTime.trim(),
        delivery_radius: Number(deliveryRadius) || 5.0,
        opening_time: openingTime.trim(),
        closing_time: closingTime.trim(),
      },
      userId
    );

    if (res.success) {
      await refreshStore();
      setFeedback({
        type: "success",
        text: "Store settings successfully saved and live on the marketplace!",
      });
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update store settings." });
    }
    setSaving(false);
  };

  if (loading && !store) {
    return (
      <div className="max-w-4xl bg-white p-12 rounded-3xl border border-slate-200/80 text-center text-slate-400">
        <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
        Loading store configuration...
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Store Profile & Operating Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Customize your storefront identity, operating hours, delivery fees, and availability.
        </p>
      </div>

      <form
        onSubmit={handleSave}
        className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-xs font-bold"
      >
        {feedback && (
          <div
            className={`p-4 rounded-2xl border flex items-center justify-between ${
              feedback.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                : "bg-rose-50 border-rose-200 text-rose-700"
            }`}
          >
            <span className="flex items-center gap-2">
              {feedback.type === "success" && <Check className="w-4 h-4 text-[#16a34a]" />}
              {feedback.text}
            </span>
            <button type="button" onClick={() => setFeedback(null)}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
          <div>
            <p className="text-slate-900 font-bold">Store Open & Accepting Orders</p>
            <p className="text-[11px] text-slate-500 font-normal">
              Pause incoming orders anytime during restocking or holidays.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className={`w-12 h-6 rounded-full transition-colors relative ${
              isOpen ? "bg-[#16a34a]" : "bg-slate-300"
            }`}
          >
            <span
              className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                isOpen ? "left-7" : "left-1"
              }`}
            />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-700 block mb-1">Store Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
            />
          </div>
          <div>
            <label className="text-slate-700 block mb-1">Contact Phone</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-700 block mb-1">Store Description</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-700 block mb-1">Store Address</label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
            />
          </div>
          <div>
            <label className="text-slate-700 block mb-1">Delivery Radius (Miles)</label>
            <input
              type="number"
              step="0.5"
              min="1"
              value={deliveryRadius}
              onChange={(e) => setDeliveryRadius(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="text-slate-700 block mb-1">Delivery Fee ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={deliveryFee}
              onChange={(e) => setDeliveryFee(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
            />
          </div>
          <div>
            <label className="text-slate-700 block mb-1">Minimum Order ($)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={minOrder}
              onChange={(e) => setMinOrder(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
            />
          </div>
          <div>
            <label className="text-slate-700 block mb-1">Estimated Delivery Time</label>
            <input
              type="text"
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-700 block mb-1">Store Opening Time</label>
            <input
              type="text"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
            />
          </div>
          <div>
            <label className="text-slate-700 block mb-1">Store Closing Time</label>
            <input
              type="text"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-700 block mb-1">Store Logo URL</label>
            <input
              type="text"
              value={logo}
              onChange={(e) => setLogo(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
            />
          </div>
          <div>
            <label className="text-slate-700 block mb-1">Storefront Hero Banner Image URL</label>
            <input
              type="text"
              value={banner}
              onChange={(e) => setBanner(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving || !storeId}
          className="px-6 py-3 rounded-xl bg-[#16a34a] hover:bg-[#14532d] text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all inline-flex items-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          <span>Save Storefront Configuration</span>
        </button>
      </form>
    </div>
  );
}
