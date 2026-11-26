"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import {
  acceptAvailableDelivery,
  getCourierDashboardData,
  updateDeliveryStatus,
} from "@/lib/actions/courier";
import type { AvailableDeliveryDTO, CourierDeliveryDTO } from "@/lib/data/courier";
import {
  MapPin,
  Navigation,
  Store,
  CheckCircle2,
  Phone,
  PackageCheck,
  Truck,
  Loader2,
  AlertCircle,
  PlusCircle,
} from "lucide-react";

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  assigned: { label: "Assigned (Pickup Ready)", className: "bg-amber-100 text-amber-800" },
  picked_up: { label: "Picked Up", className: "bg-blue-100 text-blue-800" },
  in_transit: { label: "In Transit", className: "bg-emerald-100 text-emerald-800" },
  delivered: { label: "Delivered", className: "bg-slate-100 text-slate-700" },
  failed: { label: "Failed", className: "bg-rose-100 text-rose-800" },
};

export default function CourierDashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [assigned, setAssigned] = useState<CourierDeliveryDTO[]>([]);
  const [completed, setCompleted] = useState<CourierDeliveryDTO[]>([]);
  const [available, setAvailable] = useState<AvailableDeliveryDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadData = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getCourierDashboardData(user.id);
    if (res.success) {
      setAssigned(res.assigned || []);
      setCompleted(res.completed || []);
      setAvailable(res.available || []);
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to load deliveries." });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const notifyLayout = () => {
    window.dispatchEvent(new Event("freshmart:courier-updated"));
  };

  const handleAccept = async (vendorOrderId: string) => {
    if (!user?.id || busyId) return;
    setBusyId(vendorOrderId);
    setFeedback(null);
    const res = await acceptAvailableDelivery(user.id, vendorOrderId);
    if (res.success) {
      setFeedback({ type: "success", text: "Delivery accepted and added to your active manifest." });
      await loadData();
      notifyLayout();
    } else {
      setFeedback({ type: "error", text: res.error || "Could not accept delivery." });
    }
    setBusyId(null);
  };

  const handleAdvanceStatus = async (
    deliveryId: string,
    nextStatus: "picked_up" | "in_transit" | "delivered"
  ) => {
    if (!user?.id || busyId) return;
    setBusyId(deliveryId);
    setFeedback(null);
    const res = await updateDeliveryStatus(user.id, deliveryId, nextStatus);
    if (res.success) {
      setFeedback({
        type: "success",
        text:
          nextStatus === "delivered"
            ? "Delivery marked complete and earnings credited!"
            : `Delivery status updated to ${nextStatus.replace("_", " ")}.`,
      });
      await loadData();
      notifyLayout();
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to update status." });
    }
    setBusyId(null);
  };

  const totalActivePayout = assigned.reduce((sum, d) => sum + d.courierFee + d.tipAmount, 0);

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Overview Banner */}
      <div className="bg-amber-500 text-slate-950 p-6 sm:p-8 rounded-3xl shadow-lg shadow-amber-500/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <span className="px-2.5 py-0.5 rounded-full bg-slate-950 text-amber-300 font-bold text-[10px] uppercase tracking-wider">
            Active Shift Batch
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            {assigned.length} {assigned.length === 1 ? "Delivery" : "Deliveries"} in Your Active Manifest
          </h1>
          <p className="text-xs text-slate-900 font-medium mt-1">
            {available.length} available {available.length === 1 ? "pickup" : "pickups"} nearby • Active Batch Payout:{" "}
            {formatPrice(totalActivePayout)}
          </p>
        </div>

        <Link
          href="/courier/live-route"
          className="px-6 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs shadow-md flex items-center gap-2 shrink-0 transition-transform active:scale-95"
        >
          <Navigation className="w-4 h-4 text-emerald-400" />
          <span>Launch GPS Navigation</span>
        </Link>
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

      {loading ? (
        <div className="bg-white rounded-3xl p-12 border border-slate-200/80 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
          <span>Loading live dispatch manifest...</span>
        </div>
      ) : (
        <>
          {/* Assigned Deliveries */}
          <div className="space-y-4">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Assigned Active Deliveries ({assigned.length})
            </h2>

            {assigned.length === 0 ? (
              <div className="bg-white rounded-3xl p-8 border border-slate-200/80 text-center space-y-2">
                <p className="text-sm font-bold text-slate-800">No active deliveries right now</p>
                <p className="text-xs text-slate-500">
                  Accept an available pickup below to start your next route.
                </p>
              </div>
            ) : (
              assigned.map((del) => {
                const statusBadge = STATUS_LABELS[del.status] || STATUS_LABELS.assigned;
                const isBusy = busyId === del.id;
                return (
                  <div
                    key={del.id}
                    className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900">
                          DEL-{del.id.slice(0, 6).toUpperCase()}
                        </span>
                        <span className="text-xs text-slate-400">• Order {del.orderNumber}</span>
                        {del.deliveryWindow && (
                          <span className="text-xs text-slate-400">• {del.deliveryWindow}</span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${statusBadge.className}`}>
                          {statusBadge.label}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                          {del.bagTempCelsius.toFixed(1)}°C
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                      <div className="space-y-2">
                        <div className="flex items-start gap-2.5">
                          <Store className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-400 font-medium block text-[10px] uppercase">
                              Pickup Point
                            </span>
                            <span className="font-bold text-slate-900">
                              {del.storeName} ({del.pickupAddress})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start gap-2.5 pt-2">
                          <MapPin className="w-4 h-4 text-fresh-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-slate-400 font-medium block text-[10px] uppercase">
                              Dropoff Destination
                            </span>
                            <span className="font-bold text-slate-900">
                              {del.customerName} ({del.dropoffAddress})
                            </span>
                            {del.deliveryInstructions && (
                              <span className="block text-[11px] text-amber-700 font-medium mt-0.5">
                                Note: {del.deliveryInstructions}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between space-y-3">
                        <div className="flex justify-between items-baseline">
                          <span className="text-slate-500 font-medium">Estimated Trip Earnings:</span>
                          <span className="text-base font-extrabold text-slate-900">
                            {formatPrice(del.courierFee + del.tipAmount)}
                            <span className="text-[10px] font-semibold text-emerald-600 ml-1">
                              (Includes {formatPrice(del.tipAmount)} tip)
                            </span>
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {del.status === "assigned" && (
                            <button
                              onClick={() => handleAdvanceStatus(del.id, "picked_up")}
                              disabled={isBusy}
                              className="flex-1 py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <PackageCheck className="w-3.5 h-3.5" />
                              )}
                              <span>Mark Picked Up</span>
                            </button>
                          )}

                          {del.status === "picked_up" && (
                            <button
                              onClick={() => handleAdvanceStatus(del.id, "in_transit")}
                              disabled={isBusy}
                              className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Truck className="w-3.5 h-3.5" />
                              )}
                              <span>Start Delivery</span>
                            </button>
                          )}

                          {del.status === "in_transit" && (
                            <button
                              onClick={() => handleAdvanceStatus(del.id, "delivered")}
                              disabled={isBusy}
                              className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 disabled:opacity-60"
                            >
                              {isBusy ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              <span>Mark Delivered</span>
                            </button>
                          )}

                          <Link
                            href={`/courier/live-route?deliveryId=${del.id}`}
                            className="py-2 px-3 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-slate-800"
                          >
                            <Navigation className="w-3.5 h-3.5 text-amber-400" />
                            <span>Navigate</span>
                          </Link>

                          {del.customerPhone ? (
                            <a
                              href={`tel:${del.customerPhone.replace(/[^\d+]/g, "")}`}
                              className="px-3 py-2 rounded-xl bg-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 hover:bg-slate-300"
                            >
                              <Phone className="w-3.5 h-3.5" /> Call
                            </a>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Available / Unassigned Deliveries Pool */}
          <div className="space-y-4 pt-2">
            <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
              Available Pickups Pool ({available.length})
            </h2>

            {available.length === 0 ? (
              <div className="bg-white rounded-3xl p-6 border border-slate-200/80 text-xs text-slate-500">
                No unassigned vendor orders are waiting for pickup right now.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {available.map((av) => {
                  const isBusy = busyId === av.vendorOrderId;
                  return (
                    <div
                      key={av.vendorOrderId}
                      className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4 text-xs"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-slate-900">
                            Order {av.orderNumber}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                            {av.vendorOrderStatus} • {av.itemCount} items
                          </span>
                        </div>
                        <p className="font-bold text-slate-800">
                          Pickup: {av.storeName} ({av.pickupAddress})
                        </p>
                        <p className="text-slate-600">
                          Dropoff: {av.customerName} — {av.dropoffAddress}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase">Est. Payout</span>
                          <span className="text-sm font-extrabold text-slate-900">
                            {formatPrice(av.estimatedFee + av.estimatedTip)}
                          </span>
                        </div>
                        <button
                          onClick={() => handleAccept(av.vendorOrderId)}
                          disabled={isBusy}
                          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-60"
                        >
                          {isBusy ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <PlusCircle className="w-3.5 h-3.5" />
                          )}
                          <span>Accept Delivery</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recently Completed */}
          {completed.length > 0 && (
            <div className="space-y-3 pt-2">
              <h2 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                Completed Deliveries ({completed.length})
              </h2>
              <div className="bg-white rounded-3xl border border-slate-200/80 divide-y divide-slate-100 overflow-hidden">
                {completed.slice(0, 5).map((del) => (
                  <div
                    key={del.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900">{del.orderNumber}</span>
                      <span className="text-slate-500 ml-2">
                        {del.storeName} → {del.customerName}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-emerald-700">
                        {formatPrice(del.courierFee + del.tipAmount)}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[10px]">
                        Delivered
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
