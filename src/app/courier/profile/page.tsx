"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuthStore } from "@/lib/store/authStore";
import { getCourierProfileData, updateCourierProfile } from "@/lib/actions/courier";
import { CheckCircle2, AlertCircle, Loader2, Save } from "lucide-react";

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CR";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

export default function CourierProfilePage() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [equipment, setEquipment] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadProfile = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const res = await getCourierProfileData(user.id);
    if (res.success && res.profile) {
      setEmail(res.profile.email);
      setFullName(res.profile.fullName);
      setPhone(res.profile.phone);
      setVehicle(res.profile.vehicle);
      setEquipment(res.profile.equipment);
      setCompletedCount(res.completedCount || 0);
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to load profile." });
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || saving) return;
    setSaving(true);
    setFeedback(null);

    const res = await updateCourierProfile(user.id, {
      fullName,
      phone,
      vehicle,
      equipment,
    });

    if (res.success) {
      setUser({
        ...user,
        fullName: fullName.trim(),
        phone: phone.trim(),
      });
      window.dispatchEvent(new Event("freshmart:courier-updated"));
      setFeedback({ type: "success", text: "Profile & equipment details saved." });
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to save profile." });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-3xl bg-white rounded-3xl p-12 border border-slate-200/80 flex items-center justify-center gap-2 text-xs font-semibold text-slate-500">
        <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
        <span>Loading courier profile...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Courier Profile & Equipment Verification
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your driver details, vehicle, and sub-4°C cold-chain equipment.
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

      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6 text-xs"
      >
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 rounded-2xl bg-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shrink-0">
            {getInitials(fullName || "Courier")}
          </div>
          <div>
            <h3 className="font-bold text-base text-slate-900">{fullName || "Courier Partner"}</h3>
            <p className="text-slate-500">
              {email} {phone ? `• ${phone}` : ""}
            </p>
            <span className="inline-block px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] mt-1">
              {completedCount} Completed {completedCount === 1 ? "Delivery" : "Deliveries"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 782-3490"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Vehicle Type</label>
            <input
              type="text"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="RadPower Commercial Cargo E-Bike"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Cold-Chain Equipment</label>
            <input
              type="text"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="Thermal Cold-Chain Box (40L)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold flex items-center gap-2 disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>Save Profile & Equipment</span>
          </button>
        </div>
      </form>
    </div>
  );
}
