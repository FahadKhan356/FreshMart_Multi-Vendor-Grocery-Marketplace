"use client";

import { useState, useEffect, useCallback } from "react";
import { Star, MessageSquare, Loader2, Send, X } from "lucide-react";
import { useVendor } from "../VendorContext";
import { VendorReviewRow, getVendorReviews } from "@/lib/data/vendorData";
import { replyToReview } from "@/lib/actions/vendor";

export default function VendorReviewsPage() {
  const { storeId, userId } = useVendor();
  const [reviews, setReviews] = useState<VendorReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<"all" | "5" | "4" | "low">("all");
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [savingReply, setSavingReply] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadReviews = useCallback(async () => {
    if (!storeId) return;
    setLoading(true);
    try {
      const data = await getVendorReviews(storeId);
      setReviews(data);
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const handleReplySubmit = async (e: React.FormEvent, reviewId: string) => {
    e.preventDefault();
    if (!storeId || !replyText.trim()) return;
    setSavingReply(true);
    setFeedback(null);
    const res = await replyToReview(reviewId, storeId, replyText, userId);
    if (res.success) {
      setReplyingId(null);
      setReplyText("");
      setFeedback({ type: "success", text: "Reply published to customer review." });
      await loadReviews();
    } else {
      setFeedback({ type: "error", text: res.error || "Failed to save reply." });
    }
    setSavingReply(false);
  };

  const avgRating =
    reviews.length > 0
      ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
      : "—";

  const filtered = reviews.filter((r) => {
    if (ratingFilter === "5") return r.rating === 5;
    if (ratingFilter === "4") return r.rating === 4;
    if (ratingFilter === "low") return r.rating <= 3;
    return true;
  });

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Customer Reviews & Produce Ratings
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified customer feedback on fresh produce quality, packaging, and ripeness.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200 self-start">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="font-extrabold text-sm text-slate-900">{avgRating} / 5.0</span>
          <span className="text-xs text-slate-400">({reviews.length} reviews)</span>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3.5 rounded-2xl text-xs font-bold border flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-rose-50 text-rose-700 border-rose-200"
          }`}
        >
          <span>{feedback.text}</span>
          <button onClick={() => setFeedback(null)} className="p-1">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex gap-2">
        {[
          { key: "all", label: "All Reviews" },
          { key: "5", label: "5 Stars" },
          { key: "4", label: "4 Stars" },
          { key: "low", label: "3 Stars & Below" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setRatingFilter(f.key as any)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
              ratingFilter === f.key
                ? "bg-[#16a34a] text-white"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
          Loading customer reviews...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center text-slate-400 text-xs">
          No customer reviews match this filter yet.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center font-bold text-xs text-[#14532d]">
                    {r.reviewer_name[0]?.toUpperCase() || "C"}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-slate-900">{r.reviewer_name}</h4>
                    <p className="text-[10px] text-slate-400">
                      Purchased: <span className="font-semibold text-slate-600">{r.product_name}</span> •{" "}
                      {new Date(r.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                  {Array.from({ length: r.rating }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                "{r.comment}"
              </p>

              {r.vendor_reply && (
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-2xl p-3.5 text-xs space-y-1">
                  <p className="font-bold text-[#14532d] text-[11px]">
                    Store Response •{" "}
                    {r.vendor_reply_at
                      ? new Date(r.vendor_reply_at).toLocaleDateString()
                      : "Published"}
                  </p>
                  <p className="text-slate-700">{r.vendor_reply}</p>
                </div>
              )}

              {replyingId === r.id ? (
                <form onSubmit={(e) => handleReplySubmit(e, r.id)} className="flex gap-2 pt-1">
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a public response to this customer..."
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    disabled={savingReply}
                    className="px-4 py-2 rounded-xl bg-[#16a34a] hover:bg-[#14532d] text-white font-bold text-xs flex items-center gap-1.5"
                  >
                    {savingReply ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Post Reply</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setReplyingId(null);
                      setReplyText("");
                    }}
                    className="px-3 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs"
                  >
                    Cancel
                  </button>
                </form>
              ) : (
                <div className="flex justify-end">
                  <button
                    onClick={() => {
                      setReplyingId(r.id);
                      setReplyText(r.vendor_reply || "");
                    }}
                    className="text-xs font-bold text-[#16a34a] hover:text-[#14532d] flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{r.vendor_reply ? "Edit Reply" : "Reply to Customer"}</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
