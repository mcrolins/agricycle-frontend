"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import type { ListingBid, WasteListingListItem } from "@/app/lib/types";
import ListingCard from "@/app/components/ListingCard";
import Link from "next/link";
import { useAuthState } from "@/app/lib/useAuthState";

type ListingListViewItem = WasteListingListItem & {
  effective_status: string;
  remaining_quantity: number;
  original_quantity: number;
};

function isFulfilledStatus(status: string) {
  return ["ACCEPTED", "COMPLETED"].includes((status || "").toUpperCase());
}

async function loadListingAcceptedQuantity(listingId: number): Promise<number> {
  const endpoints = [`/api/v1/listings/${listingId}/bids/`, `/api/v1/bids/?listing=${listingId}`];

  for (const endpoint of endpoints) {
    try {
      const payload = await apiFetch<unknown>(endpoint, { method: "GET" }, { auth: false });
      const bids = Array.isArray(payload)
        ? payload
        : typeof payload === "object" && payload && Array.isArray((payload as { results?: unknown[] }).results)
        ? ((payload as { results: unknown[] }).results ?? [])
        : [];

      return bids.reduce((sum, bid) => {
        const record = bid as ListingBid;
        if ((record.status || "").toUpperCase() !== "ACCEPTED") return sum;
        return sum + (Number(record.quantity_requested ?? record.quantity) || 0);
      }, 0);
    } catch (error: unknown) {
      if (error instanceof Error && (error.message.includes("404") || error.message.includes("401") || error.message.includes("403"))) {
        continue;
      }
      return 0;
    }
  }

  return 0;
}

function toListingListViewItem(item: WasteListingListItem, acceptedQuantity: number): ListingListViewItem {
  const originalQuantity = Number(item.quantity) || 0;
  const remainingQuantity = Math.max(originalQuantity - acceptedQuantity, 0);
  const effectiveStatus =
    isFulfilledStatus(item.status) && remainingQuantity > 0
      ? "OPEN"
      : isFulfilledStatus(item.status) && remainingQuantity <= 0
      ? "ACCEPTED"
      : item.status;

  return {
    ...item,
    effective_status: effectiveStatus,
    remaining_quantity: remainingQuantity || 0,
    original_quantity: originalQuantity,
  };
}

export default function ListingsPage() {
  const { role } = useAuthState();
  const isFarmer = role === "FARMER";
  const isProcessor = role === "PROCESSOR";
  const [items, setItems] = useState<ListingListViewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [location, setLocation] = useState("");

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (location) params.set("location", location);
    if (q) params.set("waste_type", q);
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [q, location]);

  const visibleItems = useMemo(() => {
    if (!status) return items;
    return items.filter((item) => (item.effective_status || item.status) === status);
  }, [items, status]);

  useEffect(() => {
    let mounted = true;

    apiFetch<WasteListingListItem[]>(`/api/v1/listings/${queryString}`, { method: "GET" }, { auth: false })
      .then(async (data) => {
        if (!mounted) return;
        const listings = Array.isArray(data) ? data : [];
        const acceptedQuantities = await Promise.all(listings.map((item) => loadListingAcceptedQuantity(item.id)));
        if (!mounted) return;
        setItems(listings.map((item, index) => toListingListViewItem(item, acceptedQuantities[index] || 0)));
      })
      .catch((e: unknown) => mounted && setErr(e instanceof Error ? e.message : "Failed to load listings"))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [queryString]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Marketplace</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--brand-strong)] sm:text-3xl">
          {isFarmer ? "Farm Listings" : "Agricultural Listings"}
        </h1>
        <p className="mt-2 text-sm text-neutral-700 sm:text-base">
          {isFarmer && "View all listings, create your own, and manage listings you own."}
          {isProcessor && "Browse farmer listings and open a listing to submit a purchase request."}
          {!isFarmer && !isProcessor && "Browse available crop residue, organic materials, and recyclable farm waste."}
        </p>
        {isFarmer && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/listings/new"
              className="inline-flex rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
            >
              Create New Listing
            </Link>
            <Link href="/my-listings" className="inline-flex rounded-xl border px-4 py-2 text-sm font-semibold">
              My Listings
            </Link>
          </div>
        )}
      </div>

      <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-4 sm:grid-cols-2 lg:grid-cols-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-600 sm:col-span-2 lg:col-span-1">
          Waste Type
          <input
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm"
            placeholder="e.g. rice husks"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setErr(null);
              setLoading(true);
            }}
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Location
          <input
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm"
            placeholder="County / Town"
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setErr(null);
              setLoading(true);
            }}
          />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-600">
          Status
          <select
            className="mt-1 w-full rounded-xl border border-[var(--line)] bg-white px-3 py-3 text-sm"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setErr(null);
              setLoading(true);
            }}
          >
            <option value="">All</option>
            <option value="OPEN">OPEN</option>
            <option value="REQUESTED">REQUESTED</option>
            <option value="ACCEPTED">ACCEPTED</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </label>
        <div className="flex items-end">
          <div className="w-full rounded-xl bg-[var(--brand-soft)] px-3 py-3 text-sm text-[var(--brand-strong)]">
            <span className="font-semibold">{visibleItems.length}</span> listing{visibleItems.length === 1 ? "" : "s"} found
          </div>
        </div>
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading...</p>}
      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {visibleItems.map((it) => (
          <ListingCard key={it.id} item={it} />
        ))}
      </div>
      {!loading && visibleItems.length === 0 && <p className="text-sm text-neutral-500">No listings found.</p>}
    </div>
  );
}
