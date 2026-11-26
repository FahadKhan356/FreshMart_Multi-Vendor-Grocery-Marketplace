"use client";

import { useCallback, useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { useAuthStore } from "@/lib/store/authStore";
import { getCourierEarningsData, requestCourierCashout } from "@/lib/actions/courier";
import type { CourierDeliveryDTO, CourierPayoutDTO, DailyEarningsDTO } from "@/lib/data/courier";
import { CheckCircle2, AlertCircle, Loader2, Wallet } from "lucide-react";

export default function CourierEarningsPage() {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(true);
  const [cashingOut, setCashingOut] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);
  const [todayTrips, setTodayTrips] = useState(0);
  const [totalTips, setTotalTips] = useState(0);
  const [avgTip, setAvgTip] = useState(0);
  const [availableBalance, setAvailableBalance] = useState(0);
  const [dailyTotals, setDailyTotals] = useState<DailyEarningsDTO[]>([]);
  const [completedDeliveries, setCompletedDeliveries] = useState<CourierDeliveryDTO[]>([]);
  const [payouts, setPayouts] = useState<CourierPayoutDTO[]>([]);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadEarnings = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getCourierEarningsData(user.id);
    if (res.success) {
      setTodayTotal(res.todayTotal || 0);
      setTodayTrips(res.todayTrips || 0);
      setTotalTips(res.totalTips || 0);
      setAvgTip(res.avgTip || 0);
      setAvailableBalance(res.availableBalance || 0);
      setDailyTotals(res.dailyTotals || []);
      setCompletedDeliveries(res.completedDeliveries || []);
      setPayouts(res.payouts || []);
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to load earnings." });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadEarnings();
  }, [loadEarnings]);

  const handleCashout = async () => {
    if (!user?.id || cashingOut || availableBalance <= 0) return;
    setCashingOut(true);
    setFeedback(null);
    const res = await requestCourierCashout(user.id);
    if (res.success) {
      setFeedback({
        type: "success",
        text: `Cashout ${res.payoutNumber} for ${formatPrice(res.amount || 0)} initiated via Free ACH!`,
      });
      await loadEarnings();
      window.dispatchEvent(new Event("freshmart:courier-updated"));
    } else {
      setFeedback({ type: "error", text: res.error || "Cashout failed." });
    }
    setCashingOut(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl bg-white rounded-3xl p-12 border border-slate-200/80 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
        <span>Calculating earnings from completed deliveries...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Driver Earnings & Tip Payouts
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Real-time breakdown of trip fees, customer tips, and instant wallet balance.
        </p>
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Today&apos;s Total Pay
          </span>
          <p className="text-3xl font-extrabold text-slate-900">{formatPrice(todayTotal)}</p>
          <span className="text-xs font-bold text-emerald-600">
            {todayTrips} {todayTrips === 1 ? "trip" : "trips"} completed today
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Customer Tips (100% Yours)
          </span>
          <p className="text-3xl font-extrabold text-amber-600">{formatPrice(totalTips)}</p>
          <span className="text-xs text-slate-400">
            Avg tip: {formatPrice(avgTip)} per completed delivery
          </span>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Available for Instant Cashout
          </span>
          <p className="text-3xl font-extrabold text-emerald-700">{formatPrice(availableBalance)}</p>
          <button
            onClick={handleCashout}
            disabled={cashingOut || availableBalance <= 0}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs mt-1 inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {cashingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
            <span>{availableBalance > 0 ? "Cash Out Now (Free ACH)" : "No Balance Available"}</span>
          </button>
        </div>
      </div>

      {/* Per-Day Totals */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-900">Daily Earnings Summary</h2>
        </div>
        {dailyTotals.length === 0 ? (
          <p className="p-6 text-xs text-slate-400">No completed deliveries recorded yet.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Trips</th>
                <th className="py-3 px-6">Delivery Fees</th>
                <th className="py-3 px-6">Tips</th>
                <th className="py-3 px-6 text-right">Total Earned</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dailyTotals.map((day) => (
                <tr key={day.date}>
                  <td className="py-3.5 px-6 font-bold text-slate-900">{day.date}</td>
                  <td className="py-3.5 px-6 text-slate-600">{day.trips}</td>
                  <td className="py-3.5 px-6 text-slate-700">{formatPrice(day.fees)}</td>
                  <td className="py-3.5 px-6 text-amber-600 font-semibold">{formatPrice(day.tips)}</td>
                  <td className="py-3.5 px-6 text-right font-extrabold text-emerald-700">
                    {formatPrice(day.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Completed Trips History */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-extrabold text-slate-900">Completed Delivery History</h2>
        </div>
        {completedDeliveries.length === 0 ? (
          <p className="p-6 text-xs text-slate-400">Complete a delivery to see it in your history.</p>
        ) : (
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
              <tr>
                <th className="py-3 px-6">Order</th>
                <th className="py-3 px-6">Route</th>
                <th className="py-3 px-6">Completed</th>
                <th className="py-3 px-6">Fee + Tip</th>
                <th className="py-3 px-6 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {completedDeliveries.map((del) => (
                <tr key={del.id}>
                  <td className="py-3.5 px-6 font-bold text-slate-900">{del.orderNumber}</td>
                  <td className="py-3.5 px-6 text-slate-600">
                    {del.storeName} → {del.customerName}
                  </td>
                  <td className="py-3.5 px-6 text-slate-500">
                    {new Date(del.completedAt || del.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-6 text-slate-600">
                    {formatPrice(del.courierFee)} + {formatPrice(del.tipAmount)}
                  </td>
                  <td className="py-3.5 px-6 text-right font-extrabold text-slate-900">
                    {formatPrice(del.courierFee + del.tipAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Cashout History */}
      {payouts.length > 0 && (
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-extrabold text-slate-900">Cashout History</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {payouts.map((p) => (
              <div key={p.id} className="px-6 py-3.5 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{p.payoutNumber}</span>
                  <span className="text-slate-500 ml-2">
                    {p.method} • {new Date(p.createdAt).toLocaleString()}
                  </span>
                </div>
                <span className="font-extrabold text-emerald-700">{formatPrice(p.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
