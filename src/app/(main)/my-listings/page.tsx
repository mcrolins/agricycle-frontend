"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import type { ListingListItem } from "@/app/lib/types";
import { useAuthState } from "@/app/lib/useAuthState";
import { getIncomingRequests, updateRequestStatus } from "@/app/lib/orders";

type ListingRequest = {
  id: number;
  listing_waste_type?: string;
  listing_title?: string;
  listing_category?: string;
  waste_type?: string;
  listing_unit?: string;
  unit?: string;
  quantity_requested?: string | number | null;
  quantity?: string | number | null;
  proposed_price?: string | number | null;
  price?: string | number | null;
  message?: string;
  notes?: string;
  status?: string;
  processor_username?: string;
  buyer_username?: string;
  bidder_username?: string;
  username?: string;
};

export default function MyListingsPage() {
  const { role, username } = useAuthState();
  const [listings, setListings] = useState<ListingListItem[]>([]);
  const [requests, setRequests] = useState<ListingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState<number | null>(null);

  useEffect(() => {
    if (!username || (role !== "FARMER" && role !== "CONTRACTOR")) return;
    let mounted = true;

    const load = async () => {
      try {
        setError("");
        const [allListings, incomingRequests] = await Promise.all([
          apiFetch<ListingListItem[]>(`/api/v1/listings/`, { method: "GET" }, { auth: false }),
          getIncomingRequests(),
        ]);

        if (!mounted) return;
        setListings((Array.isArray(allListings) ? allListings : []).filter((item) => item.farmer_username === username));
        setRequests(Array.isArray(incomingRequests) ? incomingRequests : []);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load your listings.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();

    return () => {
      mounted = false;
    };
  }, [role, username]);

  async function handleStatusChange(id: number, status: "ACCEPTED" | "REJECTED") {
    try {
      setActionId(id);
      await updateRequestStatus(id, status);
      const refreshed = await getIncomingRequests();
      setRequests(Array.isArray(refreshed) ? refreshed : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update request.");
    } finally {
      setActionId(null);
    }
  }

  const pendingCount = useMemo(
    () => requests.filter((item) => (item.status || "PENDING") === "PENDING").length,
    [requests]
  );

  function formatMoney(value: string | number | null | undefined) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "-";
    return numeric.toLocaleString();
  }

  if (role && role !== "FARMER" && role !== "CONTRACTOR") {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
        My Listings is only available to farmer and contractor accounts.{" "}
        <Link href="/orders/my" className="font-semibold underline">
          Go to my requests
        </Link>
        .
      </div>
    );
  }

  return (
    <div className="px-4 py-8 md:px-10 md:py-10 max-w-[1400px] mx-auto w-full space-y-8 pb-24 md:pb-8">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Farmer Workspace</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--brand-strong)] sm:text-3xl">My Listings</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Monitor your listings, review incoming requests, and respond quickly when buyers reach out.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Listings</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">{listings.length}</p>
          </div>
          <div className="rounded-xl bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Pending Requests</p>
            <p className="mt-1 text-lg font-semibold text-neutral-900">{pendingCount}</p>
          </div>
          <div className="rounded-xl bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Next Step</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">
              {pendingCount > 0 ? "Review incoming requests" : "Share listings with buyers"}
            </p>
          </div>
        </div>
      </section>

      {loading && <p className="text-sm text-neutral-500">Loading your listings...</p>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {!loading && !error && pendingCount > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          You have {pendingCount} pending request{pendingCount === 1 ? "" : "s"} waiting for review.
        </div>
      )}

      {!loading && !error && (
        <section className="space-y-4 rounded-2xl border bg-white p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Your Listings</h2>
            <Link href="/listings/new" className="rounded-xl border px-4 py-2 text-sm font-semibold">
              New Listing
            </Link>
          </div>
          {listings.length === 0 && <p className="text-sm text-neutral-600">You have not created any listings yet.</p>}
          <div className="space-y-4">
            {listings.map((listing) => (
              <Link
                key={listing.id}
                href={`/listings/${listing.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 transition hover:-translate-y-0.5 hover:shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--brand-strong)]">{listing.title}</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {listing.quantity} {listing.unit} · {listing.location}
                  </p>
                </div>
                <span className="rounded-full bg-[var(--brand-soft)] px-3 py-1 text-xs font-semibold text-[var(--brand-strong)]">
                  {listing.status}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!loading && !error && (
        <section className="space-y-4 rounded-2xl border bg-white p-5 md:p-6">
          <h2 className="text-lg font-semibold">Incoming Requests</h2>
          {requests.length === 0 && <p className="text-sm text-neutral-600">No buyers have requested your listings yet.</p>}
          <div className="space-y-4">
            {requests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--brand-strong)]">
                      {request.listing_title || request.listing_waste_type || request.waste_type || "Listing request"}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">
                      @{request.buyer_username || request.processor_username || request.bidder_username || request.username || "buyer"} requested{" "}
                      {request.quantity_requested ?? request.quantity ?? "-"} {request.listing_unit || request.unit || "units"} at KES{" "}
                      {formatMoney(request.proposed_price ?? request.price)} per {request.listing_unit || request.unit || "unit"}
                    </p>
                    {!!(request.message || request.notes) && (
                      <p className="mt-2 text-sm text-neutral-700">{request.message || request.notes}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
                    {request.status || "PENDING"}
                  </span>
                </div>
                {(request.status || "PENDING") === "PENDING" && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={actionId === request.id}
                      onClick={() => handleStatusChange(request.id, "ACCEPTED")}
                      className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {actionId === request.id ? "Updating..." : "Accept"}
                    </button>
                    <button
                      type="button"
                      disabled={actionId === request.id}
                      onClick={() => handleStatusChange(request.id, "REJECTED")}
                      className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
                    >
                      {actionId === request.id ? "Updating..." : "Reject"}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
