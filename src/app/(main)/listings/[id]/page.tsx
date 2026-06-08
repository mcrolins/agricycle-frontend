"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { absUrl, apiFetch } from "@/app/lib/api";
import type { ListingDetail } from "@/app/lib/types";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/app/lib/useAuthState";
import { createRequest } from "@/app/lib/orders";
import ConfirmationModal from "@/app/components/ConfirmationModal";
import CartDrawer from "@/app/components/CartDrawer";

type FarmerReview = {
  id: number;
  reviewer: number;
  reviewer_name: string;
  rating: number | null;
  comment: string;
  created_at: string;
};

type FarmerComplaint = {
  id: number;
  reporter: number;
  reporter_name: string;
  description: string;
  created_at: string;
};

type FarmerProfile = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  total_listings: number;
  accepted_listings: number;
  average_rating: number | null;
  reviews: FarmerReview[];
  complaints: FarmerComplaint[];
};

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { accessToken, role, username } = useAuthState();
  
  const [data, setData] = useState<ListingDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  const [requestForm, setRequestForm] = useState({ quantity_requested: "", proposed_price: "", message: "" });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestErr, setRequestErr] = useState<string | null>(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Farmer profile (reviews, complaints, rating)
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  
  const isOwner = !!username && username === data?.farmer_username;
  const canBuy = !!accessToken && !isOwner && (role === "FARMER" || role === "BUYER" || role === "CONTRACTOR");

  useEffect(() => {
    apiFetch<ListingDetail>(`/api/v1/listings/${id}/`, { method: "GET" }, { auth: false })
      .then(res => {
        setData(res);
        setRequestForm(prev => ({ ...prev, proposed_price: res.price ? String(res.price) : "" }));
      })
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Failed to load listing"));
  }, [id]);

  // Fetch farmer profile once we have the farmer ID
  useEffect(() => {
    if (!data?.farmer) return;
    apiFetch<FarmerProfile>(`/api/accounts/farmer/${data.farmer}/`, { method: "GET" }, { auth: false })
      .then(setFarmerProfile)
      .catch(() => {}); // Silently fail — profile section just won't show
  }, [data?.farmer]);

  async function addToCart() {
    if (!canBuy) return router.push("/login");
    setAddingToCart(true);
    try {
      await apiFetch("/api/requests/cart/add/", {
        method: "POST",
        body: JSON.stringify({ listing_id: id, quantity: 1 }),
      });
      setCartSuccess(true);
      setIsCartDrawerOpen(true);
      setTimeout(() => setCartSuccess(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setAddingToCart(false);
    }
  }

  async function submitRequest(e: React.FormEvent) {
    e.preventDefault();
    setRequestSubmitting(true);
    setRequestErr(null);
    try {
      await createRequest({
        listing_id: Number(id),
        quantity_requested: Number(requestForm.quantity_requested),
        proposed_price: Number(requestForm.proposed_price),
        message: requestForm.message,
      });
      setShowRequestModal(false);
      router.push("/orders/my");
    } catch (error: unknown) {
      setRequestErr(error instanceof Error ? error.message : "Failed to submit request.");
    } finally {
      setRequestSubmitting(false);
    }
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function renderStars(rating: number | null) {
    if (!rating) return <span className="text-xs text-slate-400">No rating</span>;
    return (
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 ${star <= rating ? "text-amber-400" : "text-slate-200"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
    );
  }

  if (err) return <div className="p-4 text-red-600">{err}</div>;
  if (!data) return <div className="p-8 text-center text-slate-500">Loading...</div>;

  const imageCount = data.images.length;
  const hasImages = imageCount > 0;
  const activeImage = hasImages ? data.images[activeImageIndex] : null;

  const reviewCount = farmerProfile?.reviews.length ?? 0;
  const complaintCount = farmerProfile?.complaints.length ?? 0;

  return (
    <div className="pb-24 max-w-6xl mx-auto md:px-6 md:py-8">
      <div className="md:grid md:grid-cols-2 md:gap-8 md:items-start">
        {/* Left Column: Image Gallery */}
        <div className="md:sticky md:top-24">
          <div className="relative aspect-[4/3] md:aspect-square md:max-h-[600px] w-full bg-[var(--surface-strong)] md:rounded-2xl overflow-hidden">
        {hasImages ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={absUrl(activeImage!.image)} 
              alt={data.title} 
              className="h-full w-full object-cover cursor-pointer" 
              onClick={() => setIsLightboxOpen(true)}
            />
            {imageCount > 1 && (
              <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-2">
                {data.images.map((_, idx) => (
                  <div key={idx} className={`h-2 rounded-full transition-all ${idx === activeImageIndex ? "w-6 bg-[var(--brand)]" : "w-2 bg-white/60"}`} />
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-slate-400">No Image</div>
        )}
      </div>

      {hasImages && imageCount > 1 && (
        <div className="flex gap-2 overflow-x-auto p-4 scrollbar-hide">
          {data.images.map((img, idx) => (
            <button 
              key={img.id} 
              onClick={() => setActiveImageIndex(idx)}
              className={`h-16 w-16 shrink-0 rounded-lg overflow-hidden border-2 ${idx === activeImageIndex ? "border-[var(--brand)]" : "border-transparent"}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={absUrl(img.image)} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
      </div>

      {/* Right Column: Details */}
      <div className="flex flex-col gap-4 mt-4 md:mt-0">
        {/* Main Details */}
        <div className="p-4 md:p-6 bg-white shadow-sm border-y md:border border-[var(--line)] md:rounded-2xl">
        <div className="flex items-start justify-between">
          <h1 className="text-xl font-bold leading-tight text-[var(--foreground)]">{data.title}</h1>
          {data.listing_type === "RENTAL" ? (
            <span className="rounded bg-amber-500 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">For Rent</span>
          ) : (
            <span className="rounded bg-green-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">For Sale</span>
          )}
        </div>
        
        <p className="mt-2 text-2xl font-bold text-[var(--accent)]">
          {data.price ? `KES ${Number(data.price).toLocaleString()}` : "Price Negotiable"}
          {data.rental_period && <span className="text-sm font-normal text-slate-500"> / {data.rental_period.replace('PER_', '').toLowerCase()}</span>}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-700">
          Available: {data.quantity} {data.unit}
        </p>
      </div>

      {/* Seller Details */}
      <div className="p-4 md:p-6 bg-white shadow-sm border-y md:border border-[var(--line)] md:rounded-2xl">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Seller Details</h2>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-soft)] text-lg font-bold text-[var(--brand-strong)]">
            {data.farmer_username[0].toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="font-bold">@{data.farmer_username}</p>
            <p className="text-xs font-medium text-slate-500">📍 {data.location}</p>
          </div>
          {/* Seller rating badge */}
          {farmerProfile?.average_rating && (
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm font-bold text-amber-700">{farmerProfile.average_rating}</span>
              <span className="text-[11px] text-amber-600">({reviewCount})</span>
            </div>
          )}
        </div>

        {/* Seller stats row */}
        {farmerProfile && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
              <strong className="text-slate-700">{farmerProfile.total_listings}</strong> listings
            </span>
            <span className="flex items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <strong className="text-slate-700">{farmerProfile.accepted_listings}</strong> completed
            </span>
            {complaintCount > 0 && (
              <span className="flex items-center gap-1 text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                <strong>{complaintCount}</strong> complaint{complaintCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Product Details */}
      <div className="p-4 md:p-6 bg-white shadow-sm border-y md:border border-[var(--line)] md:rounded-2xl">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500 mb-3">Product Details</h2>
        <div className="grid grid-cols-2 gap-y-4 gap-x-2">
          <div>
            <p className="text-[10px] font-semibold uppercase text-slate-500">Category</p>
            <p className="text-sm font-medium">{data.category_display || data.category}</p>
          </div>
          {data.condition && (
            <div>
              <p className="text-[10px] font-semibold uppercase text-slate-500">Condition</p>
              <p className="text-sm font-medium">{data.condition}</p>
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <p className="text-[10px] font-semibold uppercase text-slate-500">Description</p>
          <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap leading-relaxed">{data.description || "No description provided."}</p>
        </div>
      </div>

      {/* Seller Reviews */}
      <div className="bg-white shadow-sm border-y md:border border-[var(--line)] md:rounded-2xl overflow-hidden">
        <div className="px-4 md:px-6 py-4 border-b border-[var(--line)] bg-slate-50 flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-wide text-slate-600 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Buyer Reviews
          </h2>
          <span className="text-xs font-semibold text-neutral-500 bg-white px-2.5 py-1 rounded-full border border-[var(--line)]">
            {reviewCount}
          </span>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {!farmerProfile ? (
            <div className="p-6 text-center text-sm text-slate-400">Loading seller reviews...</div>
          ) : reviewCount === 0 ? (
            <div className="p-6 text-center">
              <span className="text-3xl block mb-1.5">⭐</span>
              <p className="text-sm font-medium text-slate-500">No reviews yet</p>
              <p className="text-xs text-slate-400 mt-0.5">Be the first to transact with this seller</p>
            </div>
          ) : (
            farmerProfile.reviews.map((review) => (
              <div key={review.id} className="p-4 md:px-6">
                <div className="flex items-start justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-[11px] font-bold text-blue-700">
                      {(review.reviewer_name || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-neutral-800">{review.reviewer_name || `User #${review.reviewer}`}</span>
                      <p className="text-[11px] text-neutral-400">{formatDate(review.created_at)}</p>
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>
                {review.comment && (
                  <p className="text-sm text-neutral-600 mt-1.5 pl-9 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Seller Complaints */}
      {complaintCount > 0 && (
        <div className="bg-white shadow-sm border-y md:border border-[var(--line)] md:rounded-2xl overflow-hidden">
          <div className="px-4 md:px-6 py-4 border-b border-[var(--line)] bg-red-50 flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wide text-red-700 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              Complaints
            </h2>
            <span className="text-xs font-semibold text-red-600 bg-white px-2.5 py-1 rounded-full border border-red-200">
              {complaintCount}
            </span>
          </div>
          <div className="divide-y divide-[var(--line)]">
            {farmerProfile!.complaints.map((complaint) => (
              <div key={complaint.id} className="p-4 md:px-6">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-red-100 text-[11px] font-bold text-red-700">
                    {(complaint.reporter_name || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-neutral-800">{complaint.reporter_name || `User #${complaint.reporter}`}</span>
                    <p className="text-[11px] text-neutral-400">{formatDate(complaint.created_at)}</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 pl-9 leading-relaxed">{complaint.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      </div>
    </div>

      {/* Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full bg-white p-3 md:p-4 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] border-t border-[var(--line)] z-40 flex justify-center">
        <div className="w-full max-w-6xl mx-auto flex gap-3">
        {isOwner ? (
          <Link href={`/listings/${id}/edit`} className="w-full py-3.5 rounded-full bg-slate-900 text-white font-bold text-center">
            Edit Listing
          </Link>
        ) : canBuy ? (
          <>
            <button 
              onClick={() => setShowRequestModal(true)}
              className="flex-1 py-3.5 rounded-full border-2 border-[var(--brand)] text-[var(--brand)] font-bold text-center transition-colors hover:bg-[var(--brand-soft)]"
            >
              Negotiate Offer
            </button>
            <button 
              onClick={addToCart}
              disabled={addingToCart || cartSuccess}
              className={`flex-1 py-3.5 rounded-full text-white font-bold text-center transition-colors shadow-sm ${cartSuccess ? 'bg-green-500' : 'bg-[var(--accent)] hover:bg-[var(--accent-strong)]'}`}
            >
              {addingToCart ? "Adding..." : cartSuccess ? "Added ✓" : "Add to Cart"}
            </button>
          </>
        ) : !accessToken ? (
          <Link href="/login" className="w-full py-3.5 rounded-full bg-[var(--brand)] text-white font-bold text-center">
            Log in to Buy
          </Link>
        ) : null}
        </div>
      </div>

      {/* Lightbox */}
      {isLightboxOpen && hasImages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4" onClick={() => setIsLightboxOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={absUrl(activeImage!.image)} className="max-h-[85vh] max-w-full rounded-xl object-contain" alt="" />
        </div>
      )}

      {/* Request Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center">
          <div className="w-full max-w-[480px] rounded-t-2xl sm:rounded-2xl bg-white p-5 shadow-xl transition-transform animate-slide-up sm:animate-none">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Negotiate Offer</h2>
              <button onClick={() => setShowRequestModal(false)} className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">✕</button>
            </div>
            
            <form onSubmit={submitRequest} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase text-slate-600">Quantity Needed ({data.unit})</label>
                <input required type="number" min="1" max={data.quantity} className="w-full mt-1 rounded-xl border p-3 text-sm" 
                  value={requestForm.quantity_requested} onChange={e => setRequestForm(f => ({ ...f, quantity_requested: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-600">Your Offer Price (KES)</label>
                <input required type="number" min="0" className="w-full mt-1 rounded-xl border p-3 text-sm" 
                  value={requestForm.proposed_price} onChange={e => setRequestForm(f => ({ ...f, proposed_price: e.target.value }))} />
              </div>
              <div>
                <label className="text-xs font-bold uppercase text-slate-600">Message to Seller</label>
                <textarea className="w-full mt-1 rounded-xl border p-3 text-sm h-24" placeholder="Hello, I would like to buy..."
                  value={requestForm.message} onChange={e => setRequestForm(f => ({ ...f, message: e.target.value }))} />
              </div>
              
              {requestErr && <div className="text-red-500 text-sm font-semibold">{requestErr}</div>}
              
              <button disabled={requestSubmitting} className="w-full py-4 rounded-xl bg-[var(--brand)] text-white font-bold text-center mt-2 disabled:opacity-50">
                {requestSubmitting ? "Sending..." : "Send Offer"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer isOpen={isCartDrawerOpen} onClose={() => setIsCartDrawerOpen(false)} />
    </div>
  );
}
