import { Star, ShieldCheck, ThumbsUp } from "lucide-react";

export default function VendorReviewsPage() {
  const reviews = [
    { customer: "Sarah J.", rating: 5, date: "Yesterday", product: "Organic Hass Avocados", comment: "The avocados arrived in perfect condition, no bruising, and they made the most delicious guacamole tonight!" },
    { customer: "Michael C.", rating: 5, date: "2 days ago", product: "Sweet Driscoll Strawberries", comment: "Super sweet and vibrant. My kids devoured the whole clamshell immediately." },
    { customer: "David M.", rating: 4, date: "Nov 20, 2026", product: "Estate Extra Virgin Olive Oil", comment: "Exceptional olive oil, genuine peppery finish. Packaging was well insulated." },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Reviews & Produce Ratings</h1>
          <p className="text-xs text-slate-500 mt-0.5">Verified customer feedback on fresh produce quality, packaging, and ripeness.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="font-extrabold text-sm text-slate-900">4.9 / 5.0</span>
          <span className="text-xs text-slate-400">(1,420 ratings)</span>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((r, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700">
                  {r.customer[0]}
                </div>
                <div>
                  <h4 className="font-bold text-xs text-slate-900">{r.customer}</h4>
                  <p className="text-[10px] text-slate-400">Purchased: {r.product} • {r.date}</p>
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
          </div>
        ))}
      </div>
    </div>
  );
}
