"use client";

import Link from "next/link";
import { useState } from "react";
import { Star, Plus, Minus, Check, Leaf } from "lucide-react";
import { Product } from "@/data/mockData";
import { formatPrice } from "@/lib/utils";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [qty, setQty] = useState(0);
  const [justAdded, setJustAdded] = useState(false);

  const handleAdd = () => {
    setQty(1);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1000);
  };

  return (
    <div className="group bg-white rounded-2xl border border-slate-200/80 p-3.5 hover:border-fresh-500 hover:shadow-xl hover:shadow-fresh-500/5 transition-all flex flex-col justify-between">
      <div>
        {/* Image & Badges */}
        <div className="relative aspect-square w-full rounded-xl bg-slate-100 overflow-hidden mb-3">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />

          {/* Top badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 items-start">
            {product.discountBadge && (
              <span className="px-2 py-0.5 rounded-md bg-harvest-500 text-white font-extrabold text-[10px] tracking-wide uppercase shadow-sm">
                {product.discountBadge}
              </span>
            )}
            {product.organic && (
              <span className="px-1.5 py-0.5 rounded-md bg-fresh-600/90 backdrop-blur-sm text-white font-bold text-[10px] flex items-center gap-1 shadow-sm">
                <Leaf className="w-2.5 h-2.5" /> Organic
              </span>
            )}
          </div>
        </div>

        {/* Store Name & Rating */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
          <span className="font-medium text-slate-600 truncate max-w-[120px]">{product.storeName}</span>
          <div className="flex items-center gap-0.5 text-amber-500 font-bold">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span>{product.rating}</span>
          </div>
        </div>

        {/* Product Title */}
        <Link href={`/product/${product.id}`} className="block">
          <h3 className="font-bold text-slate-900 text-sm line-clamp-2 group-hover:text-fresh-700 transition-colors leading-snug">
            {product.name}
          </h3>
        </Link>
        <p className="text-[11px] text-slate-400 mt-0.5">{product.unit}</p>
      </div>

      {/* Price & Cart Control */}
      <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-base font-extrabold text-slate-900 leading-none">
            {formatPrice(product.price)}
          </span>
          {product.originalPrice && (
            <span className="text-[11px] text-slate-400 line-through leading-tight mt-0.5">
              {formatPrice(product.originalPrice)}
            </span>
          )}
        </div>

        {/* Stepper or Add button */}
        {qty === 0 ? (
          <button
            onClick={handleAdd}
            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1 shadow-sm ${
              justAdded 
                ? "bg-fresh-600 text-white" 
                : "bg-fresh-50 text-fresh-700 hover:bg-fresh-600 hover:text-white"
            }`}
          >
            {justAdded ? (
              <>
                <Check className="w-3.5 h-3.5" /> Added
              </>
            ) : (
              <>
                <Plus className="w-3.5 h-3.5" /> Add
              </>
            )}
          </button>
        ) : (
          <div className="flex items-center bg-fresh-600 text-white rounded-full px-1 py-0.5 shadow-sm">
            <button
              onClick={() => setQty(qty - 1)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/20 text-white"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-bold text-xs">{qty}</span>
            <button
              onClick={() => setQty(qty + 1)}
              className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-black/20 text-white"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
