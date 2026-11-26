"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useAuthStore } from "@/lib/store/authStore";
import {
  getCourierManifestData,
  logDeliveryTemperature,
  toggleManifestItem,
} from "@/lib/actions/courier";
import type { CourierDeliveryDTO } from "@/lib/data/courier";
import {
  Thermometer,
  CheckCircle2,
  Circle,
  Loader2,
  AlertCircle,
  Plus,
} from "lucide-react";

export default function CourierManifestPage() {
  const user = useAuthStore((s) => s.user);
  const [deliveries, setDeliveries] = useState<CourierDeliveryDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [togglingItemId, setTogglingItemId] = useState<string | null>(null);
  const [tempInput, setTempInput] = useState("3.4");
  const [tempNote, setTempNote] = useState("");
  const [loggingTemp, setLoggingTemp] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadManifest = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getCourierManifestData(user.id);
    if (res.success && res.activeDeliveries) {
      setDeliveries(res.activeDeliveries);
      if (res.activeDeliveries.length > 0) {
        setSelectedId((prev) =>
          prev && res.activeDeliveries!.some((d) => d.id === prev)
            ? prev
            : res.activeDeliveries![0].id
        );
      }
    } else if (!res.success) {
      setFeedback({ type: "error", text: res.error || "Failed to load manifest." });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadManifest();
  }, [loadManifest]);

  const activeDelivery = deliveries.find((d) => d.id === selectedId) || deliveries[0] || null;

  const handleToggleItem = async (itemId: string) => {
    if (!user?.id || !activeDelivery || togglingItemId) return;
    setTogglingItemId(itemId);
    setFeedback(null);
    const res = await toggleManifestItem(user.id, activeDelivery.id, itemId);
    if (res.success && res.checkedItems) {
      setDeliveries((prev) =>
        prev.map((d) =>
          d.id === activeDelivery.id
            ? {
                ...d,
                checkedItems: res.checkedItems!,
                items: d.items.map((it) => ({
                  ...it,
                  checked: res.checkedItems!.includes(it.id),
                })),
              }
            : d
        )
      );
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update item check." });
    }
    setTogglingItemId(null);
  };

  const handleLogTemp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !activeDelivery || loggingTemp) return;
    const tempNum = parseFloat(tempInput);
    if (Number.isNaN(tempNum)) {
      setFeedback({ type: "error", text: "Enter a valid temperature number." });
      return;
    }

    setLoggingTemp(true);
    setFeedback(null);
    const res = await logDeliveryTemperature(user.id, activeDelivery.id, tempNum, tempNote);
    if (res.success) {
      setTempNote("");
      setFeedback({ type: "success", text: `Logged ${res.bagTempCelsius?.toFixed(1)}°C reading.` });
      window.dispatchEvent(new Event("freshmart:courier-updated"));
      await loadManifest();
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to log temperature." });
    }
    setLoggingTemp(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl bg-white rounded-3xl p-12 border border-slate-200/80 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
        <span>Loading batch manifest...</span>
      </div>
    );
  }

  if (!activeDelivery) {
    return (
      <div className="max-w-7xl bg-white rounded-3xl p-10 border border-slate-200/80 text-center space-y-3">
        <h1 className="text-xl font-extrabold text-slate-900">No Active Batch Manifest</h1>
        <p className="text-xs text-slate-500">
          Accept a delivery from the dashboard to inspect its grocery items and log cold-chain temperatures.
        </p>
        <Link
          href="/courier"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
        >
          ← Go to Deliveries
        </Link>
      </div>
    );
  }

  const checkedCount = activeDelivery.items.filter((i) => i.checked).length;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Batch Manifest & Temperature Log
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Packing checklist and cold-box temperature telemetry for {activeDelivery.orderNumber} ({activeDelivery.storeName}).
          </p>
        </div>

        {deliveries.length > 1 && (
          <select
            value={activeDelivery.id}
            onChange={(e) => setSelectedId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
          >
            {deliveries.map((d) => (
              <option key={d.id} value={d.id}>
                {d.orderNumber} — {d.storeName}
              </option>
            ))}
          </select>
        )}
      </div>

      {feedback && (
        <div
          className={`p-4 rounded-2xl border text-xs font-bold flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-900"
              : "bg-rose-50 border-rose-200 text-rose-900"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.text}</span>
        </div>
      )}

      {/* Packing Checklist Table */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
            Items Checklist ({checkedCount}/{activeDelivery.items.length} Verified)
          </span>
          <span className="text-xs font-mono font-bold text-emerald-700">
            Current Sensor: {activeDelivery.bagTempCelsius.toFixed(1)}°C
          </span>
        </div>

        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Check</th>
              <th className="py-3 px-6">Source Merchant</th>
              <th className="py-3 px-6">Grocery Item</th>
              <th className="py-3 px-6">Qty & Unit</th>
              <th className="py-3 px-6 text-right">Cold-Chain Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {activeDelivery.items.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-6 px-6 text-center text-slate-400">
                  No line items found for this vendor order.
                </td>
              </tr>
            ) : (
              activeDelivery.items.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50">
                  <td className="py-4 px-6">
                    <button
                      onClick={() => handleToggleItem(item.id)}
                      disabled={togglingItemId === item.id}
                      className="flex items-center gap-2 font-bold text-slate-700 hover:text-emerald-700 disabled:opacity-50"
                    >
                      {togglingItemId === item.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                      ) : item.checked ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                      <span>{item.checked ? "Verified" : "Check"}</span>
                    </button>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-800">{activeDelivery.storeName}</td>
                  <td className="py-4 px-6 font-bold text-slate-900">{item.name}</td>
                  <td className="py-4 px-6 text-slate-600">
                    {item.quantity} × {item.unit}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] inline-flex items-center gap-1 ${
                        item.checked
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {item.checked ? "Sealed & Inspected" : "Pending Check"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Temperature Log Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleLogTemp}
          className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-4 text-xs"
        >
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-sm text-slate-900">Record Cold-Chain Temperature</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Temperature (°C)</label>
              <input
                type="number"
                step="0.1"
                value={tempInput}
                onChange={(e) => setTempInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Checkpoint Note</label>
              <input
                type="text"
                value={tempNote}
                onChange={(e) => setTempNote(e.target.value)}
                placeholder="e.g. Loaded insulated bag"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={loggingTemp}
            className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-1.5 disabled:opacity-60"
          >
            {loggingTemp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
            <span>Log Temperature Reading</span>
          </button>
        </form>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 text-xs">
          <h3 className="font-bold text-sm text-slate-900">Temperature Telemetry History</h3>
          {activeDelivery.tempLog.length === 0 ? (
            <p className="text-slate-400">
              No manual readings logged yet. Initial sensor baseline: {activeDelivery.bagTempCelsius.toFixed(1)}°C.
            </p>
          ) : (
            <div className="space-y-2 max-h-44 overflow-y-auto">
              {activeDelivery.tempLog.map((entry, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between"
                >
                  <div>
                    <span className="font-bold text-slate-800">{entry.note || "Cold-chain check"}</span>
                    <span className="block text-[10px] text-slate-400">
                      {new Date(entry.recordedAt).toLocaleString()}
                    </span>
                  </div>
                  <span className="font-mono font-extrabold text-emerald-700">
                    {Number(entry.temp).toFixed(1)}°C
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
