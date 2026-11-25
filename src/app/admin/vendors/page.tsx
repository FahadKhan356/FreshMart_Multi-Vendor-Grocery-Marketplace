"use client";

import { useState } from "react";
import { Check, X, ShieldCheck, FileText, Store, ExternalLink } from "lucide-react";

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState([
    {
      id: "VEN-401",
      storeName: "Catskill Mountain Honey & Apiary",
      owner: "Jonathan Vance",
      category: "Organic Raw Honey & Preserves",
      license: "USDA Organic Cert #99214-NY",
      inspectedDate: "Nov 25, 2026",
      status: "Pending Review",
    },
    {
      id: "VEN-402",
      storeName: "Hudson Valley Heritage Orchards",
      owner: "Amelia Thorne",
      category: "Heirloom Apples, Pears & Ciders",
      license: "NYS Dept of Agriculture Food Safety #7712",
      inspectedDate: "Nov 24, 2026",
      status: "Pending Review",
    },
    {
      id: "VEN-398",
      storeName: "GreenField Organic Market",
      owner: "David Greenfield",
      category: "Produce & Microgreens",
      license: "Verified USDA Organic",
      inspectedDate: "Nov 20, 2026",
      status: "Approved",
    },
  ]);

  const handleAction = (id: string, newStatus: string) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: newStatus } : v))
    );
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Vendor Approval Requests & KYC Audits
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Review state agricultural permits, certified organic accreditations, and food safety inspection logs before enabling storefront access.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-bold border-b border-slate-100">
            <tr>
              <th className="py-3 px-6">Store Candidate</th>
              <th className="py-3 px-6">Proprietor</th>
              <th className="py-3 px-6">Product Aisle</th>
              <th className="py-3 px-6">Food Safety License</th>
              <th className="py-3 px-6">Status</th>
              <th className="py-3 px-6 text-right">Audit Decision</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {vendors.map((v) => (
              <tr key={v.id} className="hover:bg-slate-50/50">
                <td className="py-4 px-6 font-bold text-slate-900">
                  {v.storeName}
                  <p className="text-[10px] text-slate-400 font-normal">{v.id}</p>
                </td>
                <td className="py-4 px-6 font-semibold text-slate-800">{v.owner}</td>
                <td className="py-4 px-6 text-slate-600">{v.category}</td>
                <td className="py-4 px-6">
                  <span className="flex items-center gap-1.5 font-mono text-[11px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md w-fit">
                    <FileText className="w-3 h-3" />
                    {v.license}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    v.status === "Pending Review" ? "bg-amber-100 text-amber-800 animate-pulse" :
                    v.status === "Approved" ? "bg-emerald-100 text-emerald-800" :
                    "bg-rose-100 text-rose-700"
                  }`}>
                    {v.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-right">
                  {v.status === "Pending Review" ? (
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleAction(v.id, "Approved")}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                      >
                        <Check className="w-3 h-3" /> Approve Store
                      </button>
                      <button
                        onClick={() => handleAction(v.id, "Rejected")}
                        className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 font-bold text-xs"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <span className="text-[11px] font-bold text-slate-400">Audit Completed</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
