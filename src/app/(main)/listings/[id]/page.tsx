"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { absUrl, apiFetch } from "@/app/lib/api";
import type { ListingBid, WasteListingDetail } from "@/app/lib/types";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/app/lib/useAuthState";
import { createRequest } from "@/app/lib/orders";

export default function ListingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [data, setData] = useState<WasteListingDetail | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [bids, setBids] = useState<ListingBid[]>([]);
  const [bidsErr, setBidsErr] = useState<string | null>(null);
  const [bidsLoading, setBidsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [deletingImageId, setDeletingImageId] = useState<number | null>(null);
  const [imageActionErr, setImageActionErr] = useState<string | null>(null);
  const [requestForm, setRequestForm] = useState({
    quantity_requested: "",
    proposed_price: data?.price ? String(data.price) : "",
    message: "",
  });
  const [requestSubmitting, setRequestSubmitting] = useState(false);
  const [requestErr, setRequestErr] = useState<string | null>(null);
  const [requestSuccessId, setRequestSuccessId] = useState<number | null>(null);
  const [requestTouched, setRequestTouched] = useState({
    quantity_requested: false,
    proposed_price: false,
  });
  const [farmerProfile, setFarmerProfile] = useState<any | null>(null);
  const [showFarmerModal, setShowFarmerModal] = useState(false);

  const { accessToken, role: currentRole, username: currentUsername } = useAuthState();
  const isOwner = !!currentUsername && currentUsername === data?.farmer_username;
  const canRequest = !!accessToken && currentRole !== "FARMER" && !isOwner;
  const isOwnerFarmer = currentRole === "FARMER" && !!currentUsername && currentUsername === data?.farmer_username;

  useEffect(() => {
    apiFetch<WasteListingDetail>(`/api/v1/listings/${id}/`, { method: "GET" }, { auth: false })
      .then(setData)
      .catch((e: unknown) => setErr(e instanceof Error ? e.message : "Failed to load listing"));
  }, [accessToken, id]);

  useEffect(() => {
    setActiveImageIndex(0);
  }, [data?.id]);

  useEffect(() => {
    if (!data) return;
    setRequestForm((current) => ({
      quantity_requested: current.quantity_requested,
      proposed_price: current.proposed_price || (data.price ? String(data.price) : ""),
      message: current.message,
    }));
  }, [data]);

  useEffect(() => {
    if (data?.farmer) {
      apiFetch(`/api/accounts/farmer/${data.farmer}/`, { method: "GET" }, { auth: false })
        .then(setFarmerProfile)
        .catch(console.error);
    }
  }, [data?.farmer]);

  useEffect(() => {
    let mounted = true;
    setBidsLoading(true);
    setBidsErr(null);

    const endpoints = [`/api/v1/listings/${id}/bids/`, `/api/v1/bids/?listing=${id}`];

    const load = async () => {
      for (const endpoint of endpoints) {
        try {
          const payload = await apiFetch<unknown>(endpoint, { method: "GET" }, { auth: !!accessToken });
          if (!mounted) return;
          const list = Array.isArray(payload)
            ? payload
            : typeof payload === "object" && payload && Array.isArray((payload as { results?: unknown[] }).results)
            ? ((payload as { results: unknown[] }).results ?? [])
            : [];
          setBids(list as ListingBid[]);
          setBidsLoading(false);
          return;
        } catch (e: unknown) {
          if (e instanceof Error && (e.message.includes("404") || e.message.includes("403") || e.message.includes("401"))) {
            continue;
          }
          if (!mounted) return;
          setBidsErr(e instanceof Error ? e.message : "Failed to load bids");
          setBidsLoading(false);
          return;
        }
      }
      if (!mounted) return;
      setBids([]);
      setBidsErr(null);
      setBidsLoading(false);
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [accessToken, id]);

  async function deleteListing() {
    if (!isOwnerFarmer) return;
    const ok = window.confirm("Delete this listing? This action cannot be undone.");
    if (!ok) return;

    setDeleteErr(null);
    setDeleteLoading(true);
    try {
      const endpoints = [`/api/v1/listings/${id}/`, `/api/v1/listings/${id}`];
      let deleted = false;
      let lastErr: Error | null = null;
      for (const endpoint of endpoints) {
        try {
          await apiFetch(endpoint, { method: "DELETE" });
          deleted = true;
          break;
        } catch (e: unknown) {
          if (e instanceof Error && e.message.includes("404")) {
            lastErr = e;
            continue;
          }
          throw e;
        }
      }
      if (!deleted) throw lastErr ?? new Error("Delete endpoint not found.");
      router.push("/listings");
    } catch (e: unknown) {
      setDeleteErr(e instanceof Error ? e.message : "Failed to delete listing");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function updateBidStatus(bidId: number, nextStatus: "ACCEPTED" | "REJECTED") {
    setActionLoadingId(bidId);
    setBidsErr(null);
    try {
      const endpoints =
        nextStatus === "ACCEPTED"
          ? [
              `/api/v1/bids/${bidId}/accept/`,
              `/api/v1/listings/${id}/bids/${bidId}/accept/`,
              `/api/v1/bids/${bidId}/`,
            ]
          : [
              `/api/v1/bids/${bidId}/reject/`,
              `/api/v1/listings/${id}/bids/${bidId}/reject/`,
              `/api/v1/bids/${bidId}/`,
            ];

      let updated = false;
      for (const endpoint of endpoints) {
        try {
          await apiFetch(endpoint, {
            method: endpoint.endsWith("/") && (endpoint.includes("/accept/") || endpoint.includes("/reject/")) ? "POST" : "PATCH",
            body: JSON.stringify({ status: nextStatus }),
          });
          updated = true;
          break;
        } catch (e: unknown) {
          if (e instanceof Error && e.message.includes("404")) continue;
          throw e;
        }
      }
      if (!updated) throw new Error("Bid action endpoint not found.");

      setBids((prev) => prev.map((bid) => (bid.id === bidId ? { ...bid, status: nextStatus } : bid)));
    } catch (e: unknown) {
      setBidsErr(e instanceof Error ? e.message : "Failed to update bid");
    } finally {
      setActionLoadingId(null);
    }
  }

  async function deleteImage(imageId: number) {
    if (!isOwnerFarmer) return;
    const ok = window.confirm("Delete this image?");
    if (!ok) return;

    setImageActionErr(null);
    setDeletingImageId(imageId);
    try {
      const endpoints = [
        `/api/v1/listings/${id}/images/${imageId}/`,
        `/api/v1/listings/${id}/images/${imageId}`,
        `/api/v1/images/${imageId}/`,
        `/api/v1/listing-images/${imageId}/`,
      ];
      let deleted = false;
      let lastErr: Error | null = null;

      for (const endpoint of endpoints) {
        try {
          await apiFetch(endpoint, { method: "DELETE" });
          deleted = true;
          break;
        } catch (e: unknown) {
          if (e instanceof Error && e.message.includes("404")) {
            lastErr = e;
            continue;
          }
          throw e;
        }
      }
      if (!deleted) throw lastErr ?? new Error("Delete image endpoint not found.");

      setData((prev) => {
        if (!prev) return prev;
        const nextImages = prev.images.filter((img) => img.id !== imageId);
        setActiveImageIndex((current) => {
          if (nextImages.length === 0) return 0;
          return Math.min(current, nextImages.length - 1);
        });
        return { ...prev, images: nextImages };
      });
    } catch (e: unknown) {
      setImageActionErr(e instanceof Error ? e.message : "Failed to delete image");
    } finally {
      setDeletingImageId(null);
    }
  }

  if (err) return <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>;
  if (!data) return <p className="text-sm text-neutral-500">Loading...</p>;
  const imageCount = data.images.length;
  const hasImages = imageCount > 0;
  const safeActiveIndex = hasImages ? Math.min(activeImageIndex, imageCount - 1) : 0;
  const activeImage = hasImages ? data.images[safeActiveIndex] : null;
  const requestQuantity = Number(requestForm.quantity_requested);
  const requestPrice = Number(requestForm.proposed_price);
  const listingQuantity = Number(data.quantity);
  const acceptedQuantity = bids
    .filter((bid) => (bid.status || "").toUpperCase() === "ACCEPTED")
    .reduce((sum, bid) => sum + (Number(bid.quantity_requested ?? bid.quantity) || 0), 0);
  const backendRemaining = data.remaining_quantity != null ? Number(data.remaining_quantity) : null;
  const remainingQuantity = backendRemaining != null && Number.isFinite(backendRemaining)
    ? backendRemaining
    : (Number.isFinite(listingQuantity) ? Math.max(listingQuantity - acceptedQuantity, 0) : 0);
  const availableQuantity = remainingQuantity > 0 ? remainingQuantity : listingQuantity;
  const isListingOpen = ["OPEN", "REQUESTED"].includes(data.status);
  const canStillRequestQuantity = availableQuantity > 0;
  const isProcessor = currentRole === "PROCESSOR";
  const bidSummary = data.bid_summary;
  const hasRequestQuantity = requestForm.quantity_requested.trim().length > 0;
  const hasRequestPrice = requestForm.proposed_price.trim().length > 0;
  const hasRequestMessage = requestForm.message.trim().length > 0;
  const requestQuantityValid = hasRequestQuantity && Number.isFinite(requestQuantity) && requestQuantity > 0;
  const requestPriceValid = hasRequestPrice && Number.isFinite(requestPrice) && requestPrice >= 0;
  const requestQuantityTooHigh = requestQuantityValid && Number.isFinite(availableQuantity) && availableQuantity > 0 && requestQuantity > availableQuantity;
  const requestFormValid = requestQuantityValid && requestPriceValid && !requestQuantityTooHigh;
  const requestQuantityError =
    requestTouched.quantity_requested || requestSubmitting
      ? !hasRequestQuantity
        ? "Quantity is required."
        : !Number.isFinite(requestQuantity) || requestQuantity <= 0
        ? "Quantity must be greater than 0."
        : requestQuantityTooHigh
        ? "Requested quantity is higher than the listed amount."
        : null
      : null;
  const requestPriceError =
    requestTouched.proposed_price || requestSubmitting
      ? !hasRequestPrice
        ? "Price is required."
        : !Number.isFinite(requestPrice) || requestPrice < 0
        ? "Price cannot be negative."
        : null
      : null;
  const totalRequestCost = requestQuantityValid && requestPriceValid ? requestQuantity * requestPrice : null;

  function goPrevImage() {
    if (!hasImages) return;
    setActiveImageIndex((prev) => (prev - 1 + imageCount) % imageCount);
  }

  function goNextImage() {
    if (!hasImages) return;
    setActiveImageIndex((prev) => (prev + 1) % imageCount);
  }

  function updateRequestField(key: "quantity_requested" | "proposed_price" | "message", value: string) {
    setRequestForm((current) => ({ ...current, [key]: value }));
  }

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canRequest || !data) return;

    setRequestErr(null);
    setRequestSuccessId(null);
    setRequestTouched({
      quantity_requested: true,
      proposed_price: true,
    });
    setRequestSubmitting(true);

    try {
      if (!requestFormValid) {
        throw new Error("Enter a valid quantity and price before sending your request.");
      }

      const payload = {
        listing: data.id,
        listing_id: data.id,
        quantity_requested: Number(requestForm.quantity_requested),
        proposed_price: Number(requestForm.proposed_price),
        message: requestForm.message.trim(),
      };

      const created = await createRequest(payload);
      const createdId =
        typeof created === "object" && created && "id" in created && typeof created.id === "number" ? created.id : null;

      setRequestSuccessId(createdId);
      setRequestForm({
        quantity_requested: "",
        proposed_price: data.price ? String(data.price) : "",
        message: "",
      });
    } catch (error: unknown) {
      setRequestErr(error instanceof Error ? error.message : "Failed to submit request.");
    } finally {
      setRequestSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-bold">{data.waste_type}</h1>
          <p className="text-sm text-neutral-600">
            {availableQuantity} {data.unit} available · {data.location}
          </p>
          <p className="mt-1 text-xs text-neutral-500">@{data.farmer_username}</p>
        </div>
        <span className="rounded-full bg-neutral-100 px-2 py-1 text-[11px] text-neutral-700">{data.status}</span>
      </div>

      <div className="overflow-hidden rounded-2xl p-0">
        {hasImages ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-neutral-500">
                {safeActiveIndex + 1} / {imageCount}
              </p>
              {imageCount > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={goPrevImage}
                    className="rounded-full border px-2.5 py-1 text-xs font-semibold"
                    aria-label="Previous image"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={goNextImage}
                    className="rounded-full border px-2.5 py-1 text-xs font-semibold"
                    aria-label="Next image"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 overflow-x-auto px-1 py-2">
              {data.images.map((img, idx) => (
                <div
                  key={img.id}
                  className={[
                    "relative shrink-0 transition-all duration-300",
                    idx === safeActiveIndex ? "scale-100 opacity-100" : "scale-90 opacity-70",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(idx);
                      if (idx === safeActiveIndex) setIsLightboxOpen(true);
                    }}
                    className={[
                      "overflow-hidden rounded-xl border-2 bg-neutral-100",
                      idx === safeActiveIndex ? "border-[var(--brand)] ring-2 ring-[var(--brand-soft)]" : "border-transparent",
                    ].join(" ")}
                    aria-label={`Select image ${idx + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={absUrl(img.image)}
                      alt={`${data.waste_type} image ${idx + 1}`}
                      className={[
                        "object-cover transition-transform",
                        idx === safeActiveIndex ? "h-48 w-64 sm:h-56 sm:w-72" : "h-36 w-48 sm:h-44 sm:w-56",
                      ].join(" ")}
                    />
                  </button>

                  {isOwnerFarmer && (
                    <button
                      type="button"
                      onClick={() => deleteImage(img.id)}
                      disabled={deletingImageId === img.id}
                      className="absolute -right-2 -top-2 rounded-full bg-red-600 p-1.5 text-white shadow disabled:opacity-60"
                      aria-label="Delete image"
                    >
                      {deletingImageId === img.id ? (
                        <span className="text-[10px]">...</span>
                      ) : (
                        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-current" aria-hidden="true">
                          <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v9h-2V9zm4 0h2v9h-2V9zM8 9h2v9H8V9z" />
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-52 w-full items-center justify-center text-sm text-neutral-400">No images</div>
        )}
        <div className="mt-2 text-xs text-neutral-500">
          {hasImages ? `${safeActiveIndex + 1} / ${data.images.length}` : "0 / 0"}
        </div>
        {imageActionErr && <div className="mt-2 rounded-xl border border-red-200 bg-red-50 p-2 text-xs text-red-700">{imageActionErr}</div>}
      </div>
      {isLightboxOpen && hasImages && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <button
            type="button"
            onClick={() => setIsLightboxOpen(false)}
            className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-2 text-sm font-semibold text-white hover:bg-white/25"
          >
            Close
          </button>
          <div className="relative w-full max-w-5xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={absUrl(activeImage!.image)} alt={`${data.waste_type} full view`} className="max-h-[80vh] w-full rounded-xl object-contain" />
            {imageCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/30"
                  aria-label="Previous image"
                >
                  ‹
                </button>
                <button
                  type="button"
                  onClick={goNextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/20 px-3 py-2 text-sm font-semibold text-white hover:bg-white/30"
                  aria-label="Next image"
                >
                  ›
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4">
        <p className="text-sm font-semibold">Listing Snapshot</p>
        <div className="mt-2 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-[var(--surface)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Original Quantity</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">{data.quantity} {data.unit}</p>
          </div>
          <div className="rounded-xl bg-[var(--surface)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Accepted Requests</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">{acceptedQuantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} {data.unit}</p>
          </div>
          <div className="rounded-xl bg-[var(--surface)] px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Quantity Left</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">{remainingQuantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} {data.unit}</p>
          </div>
        </div>

        <p className="mt-4 text-sm font-semibold">Listed Price</p>
        <p className="mt-1 text-sm">{data.price ? `KES ${data.price} per ${data.unit}` : "Negotiable"}</p>

        <p className="mt-4 text-sm font-semibold">Notes</p>
        <p className="mt-1 text-sm text-neutral-700">{data.notes || "—"}</p>
      </div>

      {isProcessor && bidSummary && bidSummary.total_bids > 0 && (
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="text-lg font-semibold">Competitive Bids</h2>
          <p className="mt-1 text-sm text-neutral-600">Other processors have also placed bids on this listing. Place a competitive offer to increase your chances.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-[var(--surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Total Bids</p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">{bidSummary.total_bids}</p>
            </div>
            <div className="rounded-xl bg-[var(--surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Pending / Accepted</p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">{bidSummary.pending_bids} / {bidSummary.accepted_bids}</p>
            </div>
            {bidSummary.price_range && (
              <div className="rounded-xl bg-[var(--surface)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Price Range</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">KES {Number(bidSummary.price_range.min).toLocaleString()} – {Number(bidSummary.price_range.max).toLocaleString()}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {farmerProfile && (
        <div className="rounded-2xl border bg-white p-4">
          <h2 className="text-lg font-semibold">About Farmer</h2>
          <div className="mt-2 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-200 font-bold text-neutral-600">
              {data.farmer_username[0].toUpperCase()}
            </div>
            <div>
              <p className="font-semibold">@{data.farmer_username}</p>
              <p className="text-xs text-neutral-500">
                {farmerProfile.average_rating ? `★ ${Number(farmerProfile.average_rating).toFixed(1)} Rating` : "No ratings yet"}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-xl bg-[var(--surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Total Listings</p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">{farmerProfile.total_listings}</p>
            </div>
            <div className="rounded-xl bg-[var(--surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Accepted Listings</p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">{farmerProfile.accepted_listings || 0}</p>
            </div>
            <div className="rounded-xl bg-[var(--surface)] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Reviews</p>
              <p className="mt-1 text-sm font-semibold text-neutral-900">{farmerProfile.reviews?.length || 0}</p>
            </div>
          </div>
          <button
            onClick={() => setShowFarmerModal(true)}
            className="mt-4 w-full rounded-xl border px-4 py-2 text-sm font-semibold hover:bg-neutral-50 transition"
          >
            View Full Profile & Reviews
          </button>
        </div>
      )}

      <div className="rounded-2xl border bg-white p-4">
        <h2 className="text-lg font-semibold">Request This Listing</h2>
        <p className="mt-2 text-sm text-neutral-600">
          {isListingOpen && canStillRequestQuantity
            ? "Processors can send a request with quantity, price, and pickup notes."
            : canStillRequestQuantity
            ? "This listing still has available quantity. Place a competitive offer."
            : "This listing has no quantity left to allocate."}
        </p>
        {!accessToken && (
          <p className="mt-2 text-sm text-neutral-600">
            Log in to submit a request.{" "}
            <Link href="/login" className="font-semibold underline">
              Go to login
            </Link>
          </p>
        )}
        {accessToken && isOwner && (
          <p className="mt-2 text-sm text-neutral-600">
            You cannot request your own listing.
          </p>
        )}
        {accessToken && currentRole === "FARMER" && !isOwner && (
          <p className="mt-2 text-sm text-neutral-600">
            Farmer accounts can manage requests on their own listings, but only processor accounts can place new requests.
          </p>
        )}
        {canRequest && isListingOpen && canStillRequestQuantity && (
          <form onSubmit={submitRequest} className="mt-4 space-y-3">
            <div className="rounded-2xl bg-[var(--surface)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Live Summary</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Requested Quantity</p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {requestQuantityValid ? `${requestQuantity} ${data.unit}` : "Not set"}
                  </p>
                </div>
                <div className="rounded-xl bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Price Per {data.unit}</p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {requestPriceValid ? `KES ${requestPrice.toLocaleString()}` : "Not set"}
                  </p>
                </div>
                <div className="rounded-xl bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Estimated Total</p>
                  <p className="mt-1 text-sm font-semibold text-neutral-900">
                    {totalRequestCost !== null ? `KES ${totalRequestCost.toLocaleString()}` : "Not set"}
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-xl bg-white px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Request State</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">
                  {requestSubmitting
                    ? "Submitting"
                    : requestFormValid
                    ? "Ready to send"
                    : hasRequestQuantity || hasRequestPrice || hasRequestMessage
                    ? "Needs details"
                    : "Waiting for input"}
                </p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Quantity Needed
                <input
                  required
                  min="0"
                  step="any"
                  aria-invalid={requestQuantityError ? "true" : "false"}
                  className={`mt-1 w-full rounded-xl border bg-white px-3 py-3 text-sm ${
                    requestQuantityError ? "border-red-300 bg-red-50" : "border-[var(--line)]"
                  }`}
                  inputMode="decimal"
                  placeholder={`e.g. ${availableQuantity}`}
                  value={requestForm.quantity_requested}
                  onBlur={() => setRequestTouched((current) => ({ ...current, quantity_requested: true }))}
                  onChange={(event) => updateRequestField("quantity_requested", event.target.value)}
                />
                {requestQuantityError && <span className="mt-1 block text-[11px] normal-case text-red-600">{requestQuantityError}</span>}
                {!requestQuantityError && (
                  <span className="mt-1 block text-[11px] normal-case text-neutral-500">
                    Up to {availableQuantity.toLocaleString(undefined, { maximumFractionDigits: 2 })} {data.unit} can still be requested.
                  </span>
                )}
              </label>
              <label className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
                Price Per {data.unit}
                <div className="relative mt-1">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-sm font-semibold text-neutral-500 normal-case">Ksh</span>
                  </div>
                  <input
                    required
                    min="0"
                    step="any"
                    aria-invalid={requestPriceError ? "true" : "false"}
                    className={`w-full rounded-xl border bg-white py-3 pl-[3.25rem] pr-3 text-sm ${
                      requestPriceError ? "border-red-300 bg-red-50" : "border-[var(--line)]"
                    }`}
                    inputMode="decimal"
                    placeholder={data.price ? `e.g. ${data.price} per ${data.unit}` : `Enter amount per ${data.unit}`}
                    value={requestForm.proposed_price}
                    onBlur={() => setRequestTouched((current) => ({ ...current, proposed_price: true }))}
                    onChange={(event) => updateRequestField("proposed_price", event.target.value)}
                  />
                </div>
                {requestPriceError && <span className="mt-1 block text-[11px] normal-case text-red-600">{requestPriceError}</span>}
                {!requestPriceError && (
                  <span className="mt-1 block text-[11px] normal-case text-neutral-500">
                    Enter your offer price for one {data.unit === "kg" ? "kilogram" : data.unit === "bags" ? "bag" : data.unit}.
                  </span>
                )}
              </label>
            </div>
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
              Message
              <textarea
                className="mt-1 min-h-28 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm"
                placeholder="Share pickup expectations, timing, or any clarification for the farmer."
                value={requestForm.message}
                onChange={(event) => updateRequestField("message", event.target.value)}
              />
            </label>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => updateRequestField("quantity_requested", String(availableQuantity))}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold"
              >
                Use remaining quantity
              </button>
              {data.price && (
                <button
                  type="button"
                  onClick={() => updateRequestField("proposed_price", String(data.price))}
                  className="rounded-full border px-3 py-1.5 text-xs font-semibold"
                >
                  Match listed unit price
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={requestSubmitting || !requestFormValid}
                className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {requestSubmitting ? "Submitting..." : "Send Request"}
              </button>
              <Link href="/orders/my" className="rounded-xl border px-4 py-2 text-sm font-semibold">
                View My Requests
              </Link>
            </div>

            {!requestFormValid && (hasRequestQuantity || hasRequestPrice || hasRequestMessage) && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                Add a valid quantity and price to activate request submission.
              </div>
            )}
            {requestErr && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{requestErr}</div>}
            {requestSuccessId && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                Request sent successfully.{" "}
                <Link href={requestSuccessId ? `/orders/${requestSuccessId}` : "/orders/my"} className="font-semibold underline">
                  {requestSuccessId ? "Open request" : "View my requests"}
                </Link>
              </div>
            )}
          </form>
        )}
      </div>

      {isOwnerFarmer && (
        <div className="space-y-3 rounded-2xl border bg-white p-4">
          <h2 className="text-lg font-semibold">Manage Listing</h2>
          <div className="flex flex-wrap gap-2">
            <Link href={`/listings/${data.id}/edit`} className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">
              Edit Listing
            </Link>
            <Link href={`/listings/${data.id}/upload`} className="rounded-xl border px-4 py-2 text-sm font-semibold">
              Upload Images
            </Link>
            <button
              type="button"
              onClick={deleteListing}
              disabled={deleteLoading}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {deleteLoading ? "Deleting..." : "Delete Listing"}
            </button>
          </div>
          {deleteErr && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{deleteErr}</div>}
        </div>
      )}

      {isOwnerFarmer && (
        <div className="space-y-3 rounded-2xl border bg-white p-4">
          <h2 className="text-lg font-semibold">Manage Bids</h2>
          {bidsLoading && <p className="text-sm text-neutral-500">Loading bids...</p>}
          {bidsErr && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{bidsErr}</div>}
          {!bidsLoading && !bidsErr && bids.length === 0 && <p className="text-sm text-neutral-600">No bids yet.</p>}
          <div className="space-y-2">
            {bids.map((bid) => (
              <div key={bid.id} className="rounded-xl border p-3">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-semibold">
                    @{bid.processor_username || bid.bidder_username || "processor"} · {bid.quantity_requested ?? bid.quantity ?? "-"} {data.unit} at KES{" "}
                    {(bid.proposed_price ?? bid.amount ?? bid.price ?? "-")} per {data.unit}
                  </p>
                  <span className="rounded-full bg-neutral-100 px-2 py-1 text-xs">{bid.status || "PENDING"}</span>
                </div>
                {!!(bid.message || bid.notes) && <p className="mt-1 text-sm text-neutral-700">{bid.message || bid.notes}</p>}
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={actionLoadingId === bid.id}
                    onClick={() => updateBidStatus(bid.id, "ACCEPTED")}
                    className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={actionLoadingId === bid.id}
                    onClick={() => updateBidStatus(bid.id, "REJECTED")}
                    className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {currentRole === "FARMER" && !isOwnerFarmer && (
        <p className="text-sm text-neutral-600">This listing belongs to another farmer. You cannot edit or manage it.</p>
      )}

      {showFarmerModal && farmerProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
            <button
              onClick={() => setShowFarmerModal(false)}
              className="absolute right-4 top-4 rounded-full bg-neutral-100 p-2 text-neutral-600 hover:bg-neutral-200"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold">Farmer Profile: @{data.farmer_username}</h2>
            
            <div className="mt-6">
              <h3 className="font-semibold text-neutral-900">Recent Listings</h3>
              {farmerProfile.listings && farmerProfile.listings.length > 0 ? (
                <div className="mt-2 space-y-2">
                  {farmerProfile.listings.map((l: any) => (
                    <div key={l.id} className="rounded-xl border p-3 text-sm">
                      <span className="font-semibold">{l.waste_type}</span> - {l.quantity} {l.unit}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 mt-1">No listings.</p>
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-neutral-900">Reviews & Ratings</h3>
              {farmerProfile.reviews && farmerProfile.reviews.length > 0 ? (
                <div className="mt-2 space-y-3">
                  {farmerProfile.reviews.map((r: any) => (
                    <div key={r.id} className="rounded-xl bg-neutral-50 p-3 text-sm">
                      <div className="flex justify-between font-semibold">
                        <span>{r.reviewer_name || 'Anonymous'}</span>
                        <span className="text-amber-500">★ {r.rating}</span>
                      </div>
                      {r.comment && <p className="mt-1 text-neutral-700">{r.comment}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 mt-1">No reviews yet.</p>
              )}
            </div>

            <div className="mt-6">
              <h3 className="font-semibold text-neutral-900">Public Complaints</h3>
              {farmerProfile.complaints && farmerProfile.complaints.length > 0 ? (
                <div className="mt-2 space-y-3">
                  {farmerProfile.complaints.map((c: any) => (
                    <div key={c.id} className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-800">
                      <p className="font-semibold">{c.reporter_name || 'Anonymous'}</p>
                      <p className="mt-1">{c.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500 mt-1">No complaints reported.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
