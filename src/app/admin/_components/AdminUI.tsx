"use client";

import { AlertCircle, CheckCircle2, X } from "lucide-react";

export function FeedbackBanner({
  feedback,
  onClear,
}: {
  feedback: { type: "success" | "error"; message: string } | null;
  onClear: () => void;
}) {
  if (!feedback) return null;
  const isErr = feedback.type === "error";
  return (
    <div
      className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border text-xs font-semibold ${
        isErr
          ? "bg-rose-50 border-rose-200 text-rose-800"
          : "bg-emerald-50 border-emerald-200 text-emerald-800"
      }`}
    >
      <div className="flex items-center gap-2">
        {isErr ? (
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
        ) : (
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
        )}
        <span>{feedback.message}</span>
      </div>
      <button
        type="button"
        onClick={onClear}
        className="p-1 rounded-lg hover:bg-black/5"
        aria-label="Dismiss message"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

export function refreshAdminCounts() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("admin:refresh-counts"));
  }
}
