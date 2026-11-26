"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuthStore } from "@/lib/store/authStore";
import { formatPrice } from "@/lib/utils";
import { getCourierLiveRouteData, updateDeliveryStatus } from "@/lib/actions/courier";
import type { CourierDeliveryDTO } from "@/lib/data/courier";
import {
  Navigation,
  MapPin,
  CheckCircle2,
  Phone,
  AlertCircle,
  ExternalLink,
  Loader2,
  PackageCheck,
  Truck,
  Store,
} from "lucide-react";

function LiveRouteContent() {
  const user = useAuthStore((s) => s.user);
  const searchParams = useSearchParams();
  const requestedId = searchParams.get("deliveryId");

  const [deliveries, setDeliveries] = useState<CourierDeliveryDTO[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proofNote, setProofNote] = useState("");
  const [bagTemp, setBagTemp] = useState("3.4");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [completedMessage, setCompletedMessage] = useState<string | null>(null);

  const loadRoute = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getCourierLiveRouteData(user.id);
    if (res.success && res.activeDeliveries) {
      setDeliveries(res.activeDeliveries);
      if (res.activeDeliveries.length > 0) {
        const match =
          (requestedId && res.activeDeliveries.find((d) => d.id === requestedId)) ||
          res.activeDeliveries[0];
        setSelectedId(match.id);
        setBagTemp(String(match.bagTempCelsius ?? 3.4));
        setProofNote(match.proofNote || "");
      } else {
        setSelectedId("");
      }
    } else if (!res.success) {
      setFeedback({ type: "error", text: res.error || "Failed to load active route." });
    }
    setLoading(false);
  }, [user?.id, requestedId]);

  useEffect(() => {
    loadRoute();
  }, [loadRoute]);

  const activeDelivery = deliveries.find((d) => d.id === selectedId) || deliveries[0] || null;

  const handleSelectChange = (id: string) => {
    setSelectedId(id);
    setCompletedMessage(null);
    setFeedback(null);
    const found = deliveries.find((d) => d.id === id);
    if (found) {
      setBagTemp(String(found.bagTempCelsius ?? 3.4));
      setProofNote(found.proofNote || "");
    }
  };

  const handleStep = async (nextStatus: "picked_up" | "in_transit" | "delivered") => {
    if (!user?.id || !activeDelivery || submitting) return;
    setSubmitting(true);
    setFeedback(null);
    const parsedTemp = parseFloat(bagTemp);
    const res = await updateDeliveryStatus(user.id, activeDelivery.id, nextStatus, {
      bagTempCelsius: Number.isNaN(parsedTemp) ? undefined : parsedTemp,
      proofNote: nextStatus === "delivered" ? proofNote : undefined,
    });

    if (res.success) {
      window.dispatchEvent(new Event("freshmart:courier-updated"));
      if (nextStatus === "delivered") {
        const earned = activeDelivery.courierFee + activeDelivery.tipAmount;
        setCompletedMessage(
          `Dropoff complete for ${activeDelivery.orderNumber}! ${formatPrice(earned)} added to your earnings.`
        );
      } else {
        setFeedback({
          type: "success",
          text: `Status updated to ${nextStatus.replace("_", " ")}. Customer notified.`,
        });
      }
      await loadRoute();
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update delivery status." });
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto bg-white rounded-3xl p-12 border border-slate-200/80 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
        <span>Loading live route...</span>
      </div>
    );
  }

  if (!activeDelivery) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        {completedMessage && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>{completedMessage}</span>
          </div>
        )}
        <div className="bg-white rounded-3xl p-10 border border-slate-200/80 text-center space-y-3">
          <h1 className="text-xl font-extrabold text-slate-900">No Active Route</h1>
          <p className="text-xs text-slate-500">
            You have no active deliveries assigned. Accept an available pickup from the dashboard to start navigation.
          </p>
          <Link
            href="/courier"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400"
          >
            ← View Assigned & Available Deliveries
          </Link>
        </div>
      </div>
    );
  }

  const mapsDirUrl = `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(
    activeDelivery.pickupAddress
  )}&destination=${encodeURIComponent(activeDelivery.dropoffAddress)}`;
  const mapsDropoffUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    activeDelivery.dropoffAddress
  )}`;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Turn-by-Turn Route Navigation
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {activeDelivery.orderNumber} • {activeDelivery.storeName} → {activeDelivery.dropoffAddress}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {deliveries.length > 1 && (
            <select
              value={activeDelivery.id}
              onChange={(e) => handleSelectChange(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-800"
            >
              {deliveries.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.orderNumber} — {d.customerName}
                </option>
              ))}
            </select>
          )}
          <Link href="/courier" className="text-xs font-bold text-amber-600 hover:underline">
            ← Back to Manifest
          </Link>
        </div>
      </div>

      {completedMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 font-bold text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{completedMessage}</span>
        </div>
      )}

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

      {/* Route Map Card */}
      <div className="relative min-h-[20rem] w-full rounded-3xl bg-slate-900 overflow-hidden shadow-xl border border-slate-800 flex flex-col justify-between p-6 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-40" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-2">
          <span className="px-3 py-1 rounded-full bg-amber-500 text-slate-950 font-extrabold text-[11px] uppercase">
            Status: {activeDelivery.status.replace("_", " ")}
          </span>
          <a
            href={mapsDirUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Open in Google Maps</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="relative z-10 text-center space-y-3 py-6">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/40">
            <Navigation className="w-7 h-7 animate-bounce" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-400 flex items-center justify-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-amber-400" />
              <span>Pickup: {activeDelivery.storeName} ({activeDelivery.pickupAddress})</span>
            </p>
            <h3 className="text-lg font-bold flex items-center justify-center gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Dropoff: {activeDelivery.dropoffAddress}</span>
            </h3>
            {activeDelivery.deliveryInstructions && (
              <p className="text-xs text-amber-300 font-medium">
                Instructions: {activeDelivery.deliveryInstructions}
              </p>
            )}
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-300">
            <span>Cold Bag Sensor: {activeDelivery.bagTempCelsius.toFixed(1)}°C</span>
          </div>
        </div>

        {/* Customer Footer Bar */}
        <div className="relative z-10 bg-slate-950/90 backdrop-blur-md p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Customer Destination</span>
            <span className="font-bold text-white">{activeDelivery.customerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={mapsDropoffUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold flex items-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5" /> Dropoff Pin
            </a>
            {activeDelivery.customerPhone && (
              <a
                href={`tel:${activeDelivery.customerPhone.replace(/[^\d+]/g, "")}`}
                className="px-3 py-1.5 rounded-xl bg-fresh-600 text-white font-bold flex items-center gap-1"
              >
                <Phone className="w-3.5 h-3.5" /> Call Customer
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Step Progress & Delivery Confirmation Box */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-900">Delivery Step Progress & Proof</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Advance your delivery stage and log cold-bag temperature & dropoff confirmation.
            </p>
          </div>
          <span className="text-xs font-extrabold text-emerald-700">
            Payout: {formatPrice(activeDelivery.courierFee + activeDelivery.tipAmount)}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Current Cold-Bag Temp (°C)
            </label>
            <input
              type="number"
              step="0.1"
              value={bagTemp}
              onChange={(e) => setBagTemp(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Proof of Delivery Note
            </label>
            <input
              type="text"
              value={proofNote}
              onChange={(e) => setProofNote(e.target.value)}
              placeholder="e.g. Handed to customer at Apt 4B"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {activeDelivery.status === "assigned" && (
            <button
              onClick={() => handleStep("picked_up")}
              disabled={submitting}
              className="flex-1 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PackageCheck className="w-4 h-4" />}
              <span>Confirm Store Pickup</span>
            </button>
          )}

          {activeDelivery.status === "picked_up" && (
            <button
              onClick={() => handleStep("in_transit")}
              disabled={submitting}
              className="flex-1 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Truck className="w-4 h-4" />}
              <span>Mark Out for Delivery (In Transit)</span>
            </button>
          )}

          <button
            onClick={() => handleStep("delivered")}
            disabled={submitting}
            className="flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
            <span>Confirm Package Handed Over to Customer</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CourierLiveRoutePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto bg-white rounded-3xl p-12 border border-slate-200/80 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span>Loading route...</span>
        </div>
      }
    >
      <LiveRouteContent />
    </Suspense>
  );
}
