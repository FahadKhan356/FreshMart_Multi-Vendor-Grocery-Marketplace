"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import { submitRefundClaim, getRefundRequests } from "@/lib/actions/refunds";
import { getCustomerOrdersWithTracking } from "@/lib/data/customerData";
import { useAuthStore } from "@/lib/store/authStore";
import { formatPrice } from "@/lib/utils";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Camera,
  Loader2,
  X,
} from "lucide-react";

const REASONS = [
  { id: "damaged_goods", title: "Bruised / Damaged" },
  { id: "poor_quality", title: "Poor Freshness / Warm" },
  { id: "missing_item", title: "Item Missing in Bag" },
  { id: "expired_product", title: "Expired / Near Expiry" },
  { id: "wrong_item", title: "Wrong Item Sent" },
  { id: "order_not_delivered", title: "Order Not Delivered" },
] as const;

function RefundsContent() {
  const searchParams = useSearchParams();
  const preselectedOrderId = searchParams.get("orderId");
  const { user } = useAuthStore();

  const [orders, setOrders] = useState<any[]>([]);
  const [claims, setClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [selectedReason, setSelectedReason] = useState<
    "damaged_goods" | "wrong_item" | "missing_item" | "expired_product" | "poor_quality" | "order_not_delivered" | "other"
  >("damaged_goods");
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimResult, setClaimResult] = useState<{ claimNumber: string; amount: number } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = async (uid: string) => {
    setLoading(true);
    try {
      const [ords, pastClaims] = await Promise.all([
        getCustomerOrdersWithTracking(uid),
        getRefundRequests({ customerId: uid }),
      ]);
      setOrders(ords);
      setClaims(pastClaims || []);
      if (ords.length > 0) {
        const match = preselectedOrderId ? ords.find((o) => o.id === preselectedOrderId) : ords[0];
        setSelectedOrderId((match || ords[0]).id);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      loadData(user.id);
    } else {
      setLoading(false);
    }
  }, [user?.id]);

  const currentOrder = orders.find((o) => o.id === selectedOrderId);
  const orderItems: Array<{
    id: string;
    name: string;
    quantity: number;
    totalPrice: number;
    storeId: string;
    storeName: string;
    vendorOrderId: string;
  }> = [];

  if (currentOrder) {
    for (const vo of currentOrder.vendor_orders || []) {
      for (const it of vo.order_items || []) {
        orderItems.push({
          id: it.id,
          name: it.name,
          quantity: it.quantity,
          totalPrice: Number(it.total_price),
          storeId: vo.store_id,
          storeName: vo.stores?.name || "Partner Store",
          vendorOrderId: vo.id,
        });
      }
    }
  }

  const toggleItem = (id: string) => {
    setSelectedItemIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const currentRefundAmount = orderItems
    .filter((item) => selectedItemIds.includes(item.id))
    .reduce((sum, item) => sum + item.totalPrice, 0);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Image must be under 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setImagePreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitClaim = async () => {
    if (!currentOrder) {
      setErrorMessage("Please select an order.");
      return;
    }
    if (selectedItemIds.length === 0) {
      setErrorMessage("Please select at least one item for refund.");
      return;
    }
    if (additionalNotes.trim().length < 10) {
      setErrorMessage("Please provide at least 10 characters explaining the issue.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const selectedItems = orderItems.filter((i) => selectedItemIds.includes(i.id));
      const res = await submitRefundClaim({
        customerId: user?.id,
        orderId: currentOrder.id,
        vendorOrderId: selectedItems[0]?.vendorOrderId,
        storeId: selectedItems[0]?.storeId,
        reason: selectedReason,
        additionalDetails: additionalNotes.trim(),
        imageUrl: imagePreview || undefined,
        items: selectedItems.map((i) => ({
          orderItemId: i.id,
          name: i.name,
          quantity: i.quantity,
          amount: i.totalPrice,
        })),
      });

      if (!res.success || !res.claimNumber) {
        setErrorMessage(res.error || "Failed to submit refund claim.");
        return;
      }

      setClaimResult({ claimNumber: res.claimNumber, amount: res.amount || currentRefundAmount });
      setSelectedItemIds([]);
      setAdditionalNotes("");
      setImagePreview(null);
      if (user?.id) {
        const updated = await getRefundRequests({ customerId: user.id });
        setClaims(updated || []);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to submit refund claim.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 py-10">
      <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
        {/* Hero Banner */}
        <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-3xl p-8 sm:p-10 mb-10 shadow-xl shadow-emerald-950/10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-emerald-300 text-xs font-bold uppercase tracking-wider mb-3">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Instant Freshness Guarantee</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Refund &amp; Return Support Center
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl mt-2 leading-relaxed">
            We stand behind every organic leaf, fruit, egg, and cut. If any grocery item is damaged, overripe, missing, or compromised during delivery, submit a claim below.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Claim Submission Form */}
          <div className="lg:col-span-8 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
            <h2 className="font-bold text-lg text-slate-900 pb-3 border-b border-slate-100">
              Submit Quality Guarantee Claim
            </h2>

            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {loading ? (
              <div className="py-12 text-center flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-fresh-600" />
                <span>Loading your orders...</span>
              </div>
            ) : claimResult ? (
              <div className="p-8 rounded-2xl bg-fresh-50 border border-fresh-200 text-center space-y-4">
                <CheckCircle2 className="w-12 h-12 text-fresh-600 mx-auto" />
                <h3 className="font-bold text-base text-slate-900">
                  Refund Claim #{claimResult.claimNumber} Submitted
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  {formatPrice(claimResult.amount)} has been submitted to the operations desk for review and reimbursement.
                </p>
                <button
                  type="button"
                  onClick={() => setClaimResult(null)}
                  className="px-5 py-2.5 rounded-xl bg-fresh-600 hover:bg-fresh-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  Submit Another Claim
                </button>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-10 text-center space-y-3">
                <p className="text-xs text-slate-500">You don&apos;t have any orders eligible for a refund claim yet.</p>
                <Link href="/catalog" className="inline-block px-5 py-2.5 rounded-xl bg-fresh-600 text-white text-xs font-bold">
                  Browse Groceries
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Step 1: Select Order */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    1. Select Recent Order
                  </label>
                  <select
                    value={selectedOrderId}
                    onChange={(e) => {
                      setSelectedOrderId(e.target.value);
                      setSelectedItemIds([]);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-fresh-600"
                  >
                    {orders.map((o) => (
                      <option key={o.id} value={o.id}>
                        Order #{o.order_number} - {new Date(o.created_at).toLocaleDateString()} ({formatPrice(Number(o.total_amount))})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Step 2: Select Items */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-2 uppercase tracking-wider">
                    2. Which Item(s) Need Quality Attention?
                  </label>
                  {orderItems.length === 0 ? (
                    <p className="text-xs text-slate-500">No items found in this order.</p>
                  ) : (
                    <div className="space-y-2">
                      {orderItems.map((item) => {
                        const isChecked = selectedItemIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={() => toggleItem(item.id)}
                            className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                              isChecked ? "border-fresh-600 bg-fresh-50/50" : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {}}
                                className="rounded text-fresh-600 focus:ring-fresh-500"
                              />
                              <div>
                                <p className="font-bold text-xs text-slate-900">
                                  {item.name} (×{item.quantity})
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  {item.storeName} • {formatPrice(item.totalPrice)}
                                </p>
                              </div>
                            </div>
                            <span className={`text-xs font-bold ${isChecked ? "text-fresh-700" : "text-slate-500"}`}>
                              {formatPrice(item.totalPrice)} refund
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Step 3: Reason */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    3. Select Quality Reason
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-bold">
                    {REASONS.map((r) => (
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

                {/* Additional notes */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    4. Description &amp; Notes
                  </label>
                  <textarea
                    rows={3}
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    placeholder="Explain what was wrong with the item (at least 10 characters)..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-fresh-600"
                  />
                </div>

                {/* Step 5: Photo Upload */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5 uppercase tracking-wider">
                    5. Upload Photo Evidence (Optional)
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                  />
                  {imagePreview ? (
                    <div className="relative inline-block">
                      <img src={imagePreview} alt="Evidence" className="h-32 rounded-2xl border border-slate-200 object-cover" />
                      <button
                        type="button"
                        onClick={() => setImagePreview(null)}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-200 hover:border-fresh-500 rounded-2xl p-6 text-center bg-slate-50/50 cursor-pointer transition-colors"
                    >
                      <Camera className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                      <p className="text-xs font-bold text-slate-800">Click or tap to attach produce photo</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">JPG, PNG up to 5MB</p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleSubmitClaim}
                  disabled={isSubmitting || currentRefundAmount === 0}
                  className="w-full py-4 rounded-2xl bg-fresh-600 hover:bg-fresh-700 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-fresh-600/30 transition-all hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Quality Claim...</span>
                    </>
                  ) : (
                    <span>Submit Guarantee Claim ({formatPrice(currentRefundAmount)})</span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Right: Policy & Real Claim History */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="w-10 h-10 rounded-xl bg-fresh-100 text-fresh-700 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-base text-slate-900">How Refunds Work</h3>
              <ul className="space-y-3 text-xs text-slate-600 leading-relaxed">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-fresh-600 shrink-0 mt-0.5" />
                  <span><strong>Fast Review:</strong> Claims submitted within 24 hours of delivery are reviewed without return shipping.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-fresh-600 shrink-0 mt-0.5" />
                  <span><strong>No Food Waste:</strong> You never have to mail back spoiled or damaged produce.</span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                Your Refund Claims ({claims.length})
              </h4>
              {claims.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">No refund claims submitted yet.</p>
              ) : (
                <div className="space-y-3">
                  {claims.map((c) => (
                    <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1.5">
                      <div className="flex justify-between items-center font-bold">
                        <span className="text-slate-900">#{c.claim_number}</span>
                        <span className="text-emerald-700">{formatPrice(Number(c.amount))}</span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {c.stores?.name || "Store"} • Order #{c.orders?.order_number || c.order_id?.slice(0, 8)}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-400">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            c.status === "refunded" || c.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : c.status === "rejected"
                              ? "bg-rose-100 text-rose-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {c.status.replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function RefundsPage() {
  return (
    <>
      <CustomerHeader />
      <Suspense fallback={<div className="min-h-screen bg-slate-50 py-20 text-center text-xs text-slate-500">Loading refunds center...</div>}>
        <RefundsContent />
      </Suspense>
      <CustomerFooter />
    </>
  );
}
