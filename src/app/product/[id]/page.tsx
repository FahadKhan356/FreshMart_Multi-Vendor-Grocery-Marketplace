"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import { ProductCard } from "@/components/ui/ProductCard";
import { PRODUCTS, Product } from "@/data/mockData";
import { getLiveProductById, getLiveProducts } from "@/lib/data/supabaseData";
import { useCartStore } from "@/lib/store/cartStore";
import { formatPrice } from "@/lib/utils";
import { 
  Star, 
  ShieldCheck, 
  Plus, 
  Minus, 
  ShoppingBasket, 
  Leaf, 
  MapPin, 
  Clock, 
  Truck, 
  Check, 
  ChevronRight,
  Heart,
  Share2,
  Calendar,
  AlertCircle
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  
  const [product, setProduct] = useState<Product>(
    () => PRODUCTS.find((p) => p.id === id) || PRODUCTS[0]
  );
  const [relatedProducts, setRelatedProducts] = useState<Product[]>(PRODUCTS.slice(1, 5));
  const [qty, setQty] = useState(1);
  const [selectedVariation, setSelectedVariation] = useState("4-pack bag");
  const [addedAnimation, setAddedAnimation] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  useEffect(() => {
    async function loadProductData() {
      if (!id) return;
      const liveProduct = await getLiveProductById(id);
      if (liveProduct) {
        setProduct(liveProduct);
      }
      const allLive = await getLiveProducts();
      if (allLive.length > 0) {
        setRelatedProducts(allLive.filter((p) => p.id !== (liveProduct?.id || id)).slice(0, 4));
      }
    }
    loadProductData();
  }, [id]);

  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      unit: product.unit,
      image: product.image,
      storeId: product.storeId,
      storeName: product.storeName,
      stock: product.stock,
      organic: product.organic,
      quantity: qty,
    });
    setAddedAnimation(true);
    setTimeout(() => setAddedAnimation(false), 1200);
  };


  return (
    <>
      <CustomerHeader />

      <main className="min-h-screen bg-slate-50 py-8">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-6">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mb-6">
            <Link href="/" className="hover:text-fresh-600">Home</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <Link href="/catalog" className="hover:text-fresh-600">Marketplace</Link>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-900 font-bold">{product.name}</span>
          </div>

          {/* Main PDP Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 bg-white rounded-3xl p-6 sm:p-10 border border-slate-200/80 shadow-sm">
            
            {/* Left Image Gallery */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative aspect-square w-full rounded-2xl bg-slate-100 overflow-hidden border border-slate-100">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                {product.organic && (
                  <span className="absolute top-4 left-4 px-3 py-1 rounded-full bg-fresh-600 text-white font-bold text-xs flex items-center gap-1 shadow-md">
                    <Leaf className="w-3.5 h-3.5" /> 100% Certified Organic
                  </span>
                )}
                <div className="absolute top-4 right-4 flex gap-2">
                  <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md text-slate-600 hover:text-rose-500 flex items-center justify-center transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                  <button className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Thumbnails row */}
              <div className="grid grid-cols-4 gap-3">
                <div className="aspect-square rounded-xl bg-slate-100 border-2 border-fresh-600 overflow-hidden cursor-pointer">
                  <img src={product.image} alt="Thumb 1" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-square rounded-xl bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer opacity-70 hover:opacity-100">
                  <img src={product.image} alt="Thumb 2" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-square rounded-xl bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer opacity-70 hover:opacity-100">
                  <img src={product.image} alt="Thumb 3" className="w-full h-full object-cover" />
                </div>
                <div className="aspect-square rounded-xl bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer opacity-70 hover:opacity-100">
                  <img src={product.image} alt="Thumb 4" className="w-full h-full object-cover" />
                </div>
              </div>
            </div>

            {/* Right Product Details & Buy Box */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                
                {/* Store link */}
                <div className="flex items-center justify-between">
                  <Link
                    href={`/stores/greenfield-organic`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-fresh-700 hover:underline"
                  >
                    <span>Sold by {product.storeName}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{product.rating}</span>
                    <span className="text-slate-400 font-normal">({product.reviewsCount} customer reviews)</span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {product.name}
                </h1>

                {/* Price Display */}
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-slate-900">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-lg text-slate-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                  {product.discountBadge && (
                    <span className="px-2.5 py-0.5 rounded-full bg-harvest-100 text-harvest-800 text-xs font-extrabold">
                      {product.discountBadge}
                    </span>
                  )}
                </div>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {product.description}
                </p>

                {/* Size / Weight Variations */}
                <div className="pt-2">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-2">
                    Package Size: <span className="text-slate-900 font-semibold">{selectedVariation}</span>
                  </label>
                  <div className="flex gap-2">
                    {["4-pack bag", "8-pack box ($8.99)", "Single ripe ($1.49)"].map((v) => (
                      <button
                        key={v}
                        onClick={() => setSelectedVariation(v)}
                        className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${
                          selectedVariation === v
                            ? "border-fresh-600 bg-fresh-50 text-fresh-800 shadow-sm"
                            : "border-slate-200 text-slate-600 hover:border-slate-300"
                        }`}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Farm Origin & Freshness Guarantee Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Farm Origin:</span>
                    <span className="font-bold text-slate-800">{product.origin}</span>
                  </div>
                  {product.harvestDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Harvest Date:</span>
                      <span className="font-bold text-emerald-700">{product.harvestDate}</span>
                    </div>
                  )}
                  {product.expiryDate && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Peak Freshness Until:</span>
                      <span className="font-bold text-slate-800">{product.expiryDate}</span>
                    </div>
                  )}
                </div>

                {/* Nutritional Breakdown */}
                {product.nutrition && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">Nutritional Values (per 100g)</h4>
                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                      <div className="p-2 rounded-xl bg-slate-100">
                        <p className="text-[10px] text-slate-400 font-medium">Energy</p>
                        <p className="font-bold text-slate-800">{product.nutrition.calories}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-100">
                        <p className="text-[10px] text-slate-400 font-medium">Fats</p>
                        <p className="font-bold text-slate-800">{product.nutrition.fat}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-100">
                        <p className="text-[10px] text-slate-400 font-medium">Carbs</p>
                        <p className="font-bold text-slate-800">{product.nutrition.carbs}</p>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-100">
                        <p className="text-[10px] text-slate-400 font-medium">Protein</p>
                        <p className="font-bold text-slate-800">{product.nutrition.protein}</p>
                      </div>
                    </div>
                  </div>
                )}

              </div>

              {/* Quantity Stepper & Add to Cart button */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center border border-slate-200 rounded-2xl p-1 bg-slate-50 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors text-slate-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 font-bold text-sm text-slate-900">{qty}</span>
                  <button
                    onClick={() => setQty(qty + 1)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors text-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  onClick={handleAddToCart}
                  className={`flex-1 w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 ${
                    addedAnimation 
                      ? "bg-emerald-700 text-white shadow-emerald-700/20" 
                      : "bg-fresh-600 hover:bg-fresh-700 text-white shadow-fresh-600/30"
                  }`}
                >
                  {addedAnimation ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Added {qty} to Bag!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBasket className="w-5 h-5" />
                      <span>Add to Cart • {formatPrice(product.price * qty)}</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>

          {/* Related Products */}
          <div className="mt-14">
            <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-6">
              Pairs Well With Fresh Hass Avocados
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>

        </div>
      </main>

      <CustomerFooter />
    </>
  );
}
