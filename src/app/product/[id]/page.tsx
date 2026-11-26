"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CustomerHeader } from "@/components/layout/CustomerHeader";
import { CustomerFooter } from "@/components/layout/CustomerFooter";
import { ProductCard } from "@/components/ui/ProductCard";
import { Product } from "@/data/mockData";
import { getLiveProductById, getLiveProducts } from "@/lib/data/supabaseData";
import {
  getProductReviews,
  getStoreSlugById,
  getCustomerWishlistIds,
  type ProductReview,
} from "@/lib/data/customerData";
import { toggleWishlistAction, submitProductReviewAction } from "@/lib/actions/customer";
import { useCartStore } from "@/lib/store/cartStore";
import { useAuthStore } from "@/lib/store/authStore";
import { formatPrice } from "@/lib/utils";
import {
  Star,
  Plus,
  Minus,
  ShoppingBasket,
  Leaf,
  Check,
  ChevronRight,
  Heart,
  Share2,
  Loader2,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [storeSlug, setStoreSlug] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>([]);
  const [wishlisted, setWishlisted] = useState(false);
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [qty, setQty] = useState(1);
  const [addedAnimation, setAddedAnimation] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Review form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewFeedback, setReviewFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const addItem = useCartStore((s) => s.addItem);
  const { user } = useAuthStore();

  useEffect(() => {
    async function loadProductData() {
      if (!id) return;
      setLoading(true);
      const [liveProduct, allLive, revs] = await Promise.all([
        getLiveProductById(id),
        getLiveProducts(),
        getProductReviews(id),
      ]);
      if (liveProduct) {
        setProduct(liveProduct);
        const slug = await getStoreSlugById(liveProduct.storeId);
        setStoreSlug(slug);
      }
      setRelatedProducts(allLive.filter((p) => p.id !== id).slice(0, 4));
      setReviews(revs);
      setLoading(false);
    }
    loadProductData();
  }, [id]);

  useEffect(() => {
    if (user?.id && id) {
      getCustomerWishlistIds(user.id).then((ids) => {
        setWishlistIds(ids);
        setWishlisted(ids.includes(id));
      });
    }
  }, [user?.id, id]);

  const handleAddToCart = () => {
    if (!product || product.stock <= 0) return;
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

  const handleToggleWishlist = async () => {
    if (!product || !user?.id) return;
    const next = !wishlisted;
    setWishlisted(next);
    const res = await toggleWishlistAction(user.id, product.id);
    if (res.success && typeof res.wishlisted === "boolean") {
      setWishlisted(res.wishlisted);
    } else {
      setWishlisted(!next);
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share && product) {
        await navigator.share({ title: product.name, url: window.location.href });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 1800);
      }
    } catch {
      // user cancelled share
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !user?.id) return;
    setSubmittingReview(true);
    setReviewFeedback(null);

    const res = await submitProductReviewAction({
      userId: user.id,
      productId: product.id,
      rating: reviewRating,
      comment: reviewComment,
    });

    if (res.success && res.review) {
      setReviews((prev) => [res.review as ProductReview, ...prev]);
      setReviewComment("");
      setReviewRating(5);
      setReviewFeedback({ type: "success", text: "Thank you! Your review has been published." });
    } else {
      setReviewFeedback({ type: "error", text: res.error || "Failed to submit review." });
    }
    setSubmittingReview(false);
  };

  if (loading) {
    return (
      <>
        <CustomerHeader />
        <main className="min-h-screen bg-slate-50 flex items-center justify-center py-24">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <Loader2 className="w-4 h-4 animate-spin text-fresh-600" />
            <span>Loading product details...</span>
          </div>
        </main>
        <CustomerFooter />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <CustomerHeader />
        <main className="min-h-screen bg-slate-50 py-24 text-center px-4">
          <h1 className="text-2xl font-extrabold text-slate-900">Product Not Found</h1>
          <p className="text-xs text-slate-500 mt-2">This product may have been removed or is unavailable.</p>
          <Link href="/catalog" className="inline-block mt-6 px-5 py-2.5 rounded-xl bg-fresh-600 text-white text-xs font-bold">
            Back to Catalog
          </Link>
        </main>
        <CustomerFooter />
      </>
    );
  }

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
            {/* Left Image */}
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
                  <button
                    type="button"
                    onClick={handleToggleWishlist}
                    title={wishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
                    className={`w-10 h-10 rounded-full backdrop-blur-md shadow-md flex items-center justify-center transition-colors ${
                      wishlisted ? "bg-rose-50 text-rose-500" : "bg-white/90 text-slate-600 hover:text-rose-500"
                    }`}
                  >
                    <Heart className={`w-5 h-5 ${wishlisted ? "fill-rose-500" : ""}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    title="Copy product link"
                    className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md text-slate-600 hover:text-slate-900 flex items-center justify-center transition-colors"
                  >
                    {copiedLink ? <Check className="w-5 h-5 text-fresh-600" /> : <Share2 className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Product Details & Buy Box */}
            <div className="lg:col-span-6 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Link
                    href={storeSlug ? `/stores/${storeSlug}` : `/catalog?store=${product.storeId}`}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-fresh-700 hover:underline"
                  >
                    <span>Sold by {product.storeName}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-xs">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    <span>{product.rating}</span>
                    <span className="text-slate-400 font-normal">
                      ({reviews.length || product.reviewsCount} reviews)
                    </span>
                  </div>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  {product.name}
                </h1>

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

                {/* Farm Origin & Freshness Card */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Unit / Pack Size:</span>
                    <span className="font-bold text-slate-800">{product.unit}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Stock Availability:</span>
                    <span className={`font-bold ${product.stock > 0 ? "text-emerald-700" : "text-rose-600"}`}>
                      {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                    </span>
                  </div>
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

                {product.nutrition && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                      Nutritional Values (per 100g)
                    </h4>
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

              {/* Quantity Stepper & Add to Cart */}
              <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center gap-4">
                <div className="flex items-center border border-slate-200 rounded-2xl p-1 bg-slate-50 w-full sm:w-auto justify-between sm:justify-start">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors text-slate-700"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 font-bold text-sm text-slate-900">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty(Math.min(product.stock || 99, qty + 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-200 transition-colors text-slate-700"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className={`flex-1 w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
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
                      <span>
                        {product.stock <= 0 ? "Out of Stock" : `Add to Cart • ${formatPrice(product.price * qty)}`}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Customer Reviews Section */}
          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <div className="flex items-center gap-2 font-bold text-base text-slate-900">
                <MessageSquare className="w-4 h-4 text-fresh-600" />
                <span>Write a Customer Review</span>
              </div>

              {reviewFeedback && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
                    reviewFeedback.type === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                      : "bg-rose-50 text-rose-800 border border-rose-200"
                  }`}
                >
                  {reviewFeedback.type === "success" ? (
                    <Check className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{reviewFeedback.text}</span>
                </div>
              )}

              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Rating</label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-1"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">Your Review</label>
                  <textarea
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share how fresh, tasty, and well-packed this item arrived..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 outline-none focus:bg-white focus:ring-2 focus:ring-fresh-600"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview || !user?.id}
                  className="w-full py-3 rounded-xl bg-fresh-600 hover:bg-fresh-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors"
                >
                  {submittingReview ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <span>Post Review</span>
                  )}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
                Verified Customer Reviews ({reviews.length})
              </h3>
              {reviews.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  No reviews yet. Be the first to review {product.name}!
                </p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="py-4 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-slate-900">{rev.reviewer_name}</span>
                        <span className="text-[11px] text-slate-400">
                          {new Date(rev.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`w-3.5 h-3.5 ${
                              s <= rev.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <div className="mt-14">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-6">
                Pairs Well With {product.name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    initialWishlisted={wishlistIds.includes(p.id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <CustomerFooter />
    </>
  );
}
