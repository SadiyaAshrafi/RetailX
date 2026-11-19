"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, ArrowRight, Check, GitCompare, MapPin, MessageSquare, Send, ShieldCheck, ShoppingBag, Star, Truck, UserCheck, Zap } from "lucide-react";
import { useState } from "react";
import { api, cartId, money, notifyCartChanged, type Product } from "@/lib/api";

type Review = {
  user: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
};

type ProductDetail = Omit<Product, "cities"> & {
  cities: { city: string; stock: number }[];
  specs?: Record<string, string>;
  highlights?: string[];
  reviews?: Review[];
};

export default function ProductDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [inCompare, setInCompare] = useState(false);

  // Review Form state
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerRating, setReviewerRating] = useState(5);
  const [reviewerComment, setReviewerComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  const product = useQuery({
    queryKey: ["product", params.id],
    queryFn: () => api<ProductDetail>(`/products/${params.id}`),
  });

  async function addToCart(buyNow = false) {
    if (!product.data) return;
    setMessage("");
    try {
      await api(`/cart/${cartId()}/items`, {
        method: "POST",
        body: JSON.stringify({ productId: product.data.productId, quantity }),
      });
      notifyCartChanged();
      if (buyNow) router.push("/checkout");
      else setMessage("Added to your bag.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to add this item.");
    }
  }

  function handleCompare() {
    if (!product.data) return;
    const list: string[] = JSON.parse(localStorage.getItem("retailx-compare-list") || "[]");
    if (!list.includes(product.data.productId)) {
      list.push(product.data.productId);
      localStorage.setItem("retailx-compare-list", JSON.stringify(list));
      window.dispatchEvent(new Event("retailx-compare-changed"));
    }
    router.push("/compare");
  }

  async function submitReview(e: React.FormEvent) {
    e.preventDefault();
    if (!product.data || !reviewerName || !reviewerComment) return;
    setSubmittingReview(true);
    try {
      await api("/reviews", {
        method: "POST",
        body: JSON.stringify({
          productId: product.data.productId,
          user: reviewerName,
          rating: reviewerRating,
          comment: reviewerComment,
        }),
      });
      setReviewSuccess(true);
      setReviewerName("");
      setReviewerComment("");
      await queryClient.invalidateQueries({ queryKey: ["product", params.id] });
      window.setTimeout(() => setReviewSuccess(false), 3000);
    } catch {
      alert("Could not submit review.");
    } finally {
      setSubmittingReview(false);
    }
  }

  if (product.isLoading) return <main className="page-width detail-loading"><div className="product-skeleton" /></main>;
  if (!product.data) return <main className="page-width detail-missing"><strong>We couldn’t find this item.</strong><Link href="/products" className="text-link">Back to discovery <ArrowRight size={14} /></Link></main>;

  const item = product.data;
  const reviews = item.reviews || [];

  return (
    <main className="page-width detail-page">
      <div className="breadcrumb">
        <Link href="/products"><ArrowLeft size={13} /> Back to discovery</Link>
        <span>/</span>
        <span>{item.category}</span>
        <span>/</span>
        <span className="text-stone-500">{item.name}</span>
      </div>

      <div className="detail-layout">
        <div className="detail-image">
          <img src={item.imageUrl} alt={item.name} />
          <span className="detail-image-tag">{item.category} / RETAILX EDIT</span>
        </div>

        <section className="detail-copy">
          <div className="eyebrow"><span className="eyebrow-line" /> THOUGHTFULLY CHOSEN</div>
          <h1>{item.name}</h1>
          <div className="detail-rating">
            <Star size={15} fill="currentColor" /> {item.rating.toFixed(1)} <span>·</span> {reviews.length} customer review{reviews.length === 1 ? "" : "s"}
          </div>
          <p className="detail-description">{item.description}</p>
          <div className="detail-price">{money(item.price)} <span>Inclusive of all taxes</span></div>

          <div className={`stock-callout${item.stock < 6 ? " stock-low" : ""}`}>
            <span className="stock-indicator" />
            <div>
              <strong>{item.stock > 0 ? (item.stock < 6 ? `Only ${item.stock} left in stock` : "In stock and ready to ship") : "Currently unavailable"}</strong>
              <span>Live inventory synchronized with Aiven PostgreSQL</span>
            </div>
          </div>

          <div className="detail-locations">
            <span className="filter-label">Available in warehouse hubs:</span>
            {item.cities.length ? (
              item.cities.map((location) => (
                <span className="location-chip" key={location.city}>
                  <MapPin size={12} /> {location.city} <b>{location.stock} units</b>
                </span>
              ))
            ) : (
              <span className="muted-copy">No stores have stock right now.</span>
            )}
          </div>

          {/* Highlights */}
          {item.highlights && item.highlights.length > 0 && (
            <div className="detail-highlights">
              <span className="filter-label">KEY HIGHLIGHTS</span>
              <ul className="highlights-pills">
                {item.highlights.map((h, i) => (
                  <li key={i}><Zap size={12} className="text-amber-500 inline mr-1" />{h}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="detail-buy-row">
            <div className="quantity-stepper">
              <button onClick={() => setQuantity(Math.max(1, quantity - 1))} aria-label="Decrease quantity">−</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity(Math.min(Math.max(item.stock, 1), quantity + 1))} aria-label="Increase quantity">+</button>
            </div>
            <button className="button button-primary detail-add" disabled={item.stock < 1} onClick={() => void addToCart()}>
              <ShoppingBag size={16} /> Add to bag
            </button>
          </div>

          <div className="detail-secondary-actions">
            <button className="button button-secondary detail-buy" disabled={item.stock < 1} onClick={() => void addToCart(true)}>
              Buy now <ArrowRight size={15} />
            </button>
            <button className="button button-outline detail-compare-btn" onClick={handleCompare}>
              <GitCompare size={15} /> Compare specs
            </button>
          </div>

          {message && (
            <p className={message.startsWith("Added") ? "success-message" : "error-message"}>
              {message.startsWith("Added") && <Check size={14} />} {message}
            </p>
          )}

          <div className="detail-promises">
            <span><Truck size={15} /> Free express delivery in 2–4 days</span>
            <span><ShieldCheck size={15} /> Easy 30-day hassle-free returns</span>
          </div>
        </section>
      </div>

      {/* Hardware Specs Section */}
      {item.specs && Object.keys(item.specs).length > 0 && (
        <section className="product-specs-section">
          <div className="section-title-wrap">
            <div className="eyebrow"><span className="eyebrow-line" /> TECHNICAL SPECIFICATIONS</div>
            <h2>Built with precision.</h2>
          </div>
          <div className="specs-table-grid">
            {Object.entries(item.specs).map(([specKey, specVal]) => (
              <div key={specKey} className="spec-card">
                <span className="spec-label">{specKey}</span>
                <strong className="spec-value">{specVal}</strong>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Customer Reviews Section */}
      <section className="product-reviews-section">
        <div className="section-title-wrap">
          <div className="eyebrow"><span className="eyebrow-line" /> VERIFIED REVIEWS</div>
          <h2>What people say.</h2>
        </div>

        <div className="reviews-layout">
          {/* Reviews List */}
          <div className="reviews-list-col">
            {reviews.length === 0 ? (
              <div className="no-reviews-box">
                <MessageSquare size={28} className="text-stone-400 mb-2" />
                <p>Be the first to review this product!</p>
              </div>
            ) : (
              reviews.map((rev, index) => (
                <article key={index} className="review-card">
                  <div className="review-header">
                    <div className="review-author-wrap">
                      <strong>{rev.user}</strong>
                      {rev.verified && (
                        <span className="verified-badge"><UserCheck size={12} /> Verified Buyer</span>
                      )}
                    </div>
                    <span className="review-date">{rev.date}</span>
                  </div>
                  <div className="review-stars">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={13} fill={i < rev.rating ? "#eab308" : "none"} stroke="#eab308" />
                    ))}
                  </div>
                  <p className="review-comment">{rev.comment}</p>
                </article>
              ))
            )}
          </div>

          {/* Add Review Form */}
          <aside className="review-form-col">
            <form onSubmit={submitReview} className="add-review-form">
              <h3>Share your experience</h3>
              <p className="text-xs text-stone-500 mb-3">Help the community make better choices.</p>

              <label className="form-field">
                Your name
                <input
                  required
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  placeholder="e.g. Sahil M."
                />
              </label>

              <label className="form-field">
                Rating
                <select
                  value={reviewerRating}
                  onChange={(e) => setReviewerRating(Number(e.target.value))}
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5/5 Excellent)</option>
                  <option value={4}>⭐⭐⭐⭐ (4/5 Very Good)</option>
                  <option value={3}>⭐⭐⭐ (3/5 Average)</option>
                  <option value={2}>⭐⭐ (2/5 Fair)</option>
                  <option value={1}>⭐ (1/5 Poor)</option>
                </select>
              </label>

              <label className="form-field">
                Review notes
                <textarea
                  required
                  rows={3}
                  value={reviewerComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                  placeholder="What did you like about the sound, build quality, or battery life?"
                />
              </label>

              {reviewSuccess && (
                <div className="review-success-msg">
                  <Check size={14} /> Review published live!
                </div>
              )}

              <button
                type="submit"
                disabled={submittingReview || !reviewerName || !reviewerComment}
                className="button button-primary w-full"
              >
                {submittingReview ? "Submitting..." : <><Send size={14} /> Post review</>}
              </button>
            </form>
          </aside>
        </div>
      </section>
    </main>
  );
}
