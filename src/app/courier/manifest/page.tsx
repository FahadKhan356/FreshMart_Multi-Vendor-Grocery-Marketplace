import { FileText, ShieldCheck, Thermometer, CheckCircle2 } from "lucide-react";

export default function CourierManifestPage() {
  const manifestItems = [
    { bagId: "BAG-881", store: "GreenField Organic", items: "Avocados (4-pk), Driscoll Strawberries (1 lb)", bagTemp: "3.4°C", sealStatus: "Sealed & Inspected" },
    { bagId: "BAG-882", store: "SunHarvest Direct", items: "Pasture-Raised Eggs (12-ct)", bagTemp: "3.8°C", sealStatus: "Sealed & Inspected" },
    { bagId: "BAG-883", store: "Brooklyn Artisan Bakery", items: "Country Sourdough Boule (Warm box)", bagTemp: "Ambient (Dry box)", sealStatus: "Sealed & Inspected" },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Batch Manifest & Temperature Log
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Audited packing list and real-time cold-box temperature telemetry for route order #FM-94821.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Thermal Bag ID</th>
              <th className="py-3 px-6">Source Merchant</th>
              <th className="py-3 px-6">Grocery Contents</th>
              <th className="py-3 px-6">Sensor Reading</th>
              <th className="py-3 px-6 text-right">Cold-Chain Protocol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {manifestItems.map((item, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="py-4 px-6 font-bold text-slate-900">{item.bagId}</td>
                <td className="py-4 px-6 font-semibold text-slate-800">{item.store}</td>
                <td className="py-4 px-6 text-slate-600">{item.items}</td>
                <td className="py-4 px-6 font-mono font-bold text-emerald-700">{item.bagTemp}</td>
                <td className="py-4 px-6 text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    {item.sealStatus}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
