"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { apiFetch } from "@/app/lib/api";
import type { ListingListItem } from "@/app/lib/types";
import ListingCard from "@/app/components/ListingCard";
import CategoryBar from "@/app/components/CategoryBar";
import HeroSection from "@/app/components/HeroSection";
import SearchBar from "@/app/components/SearchBar";
import { useAuthState } from "@/app/lib/useAuthState";

function ListingsContent() {
  const { role } = useAuthState();
  const router = useRouter();
  const searchParams = useSearchParams();
  const category = searchParams.get("category");
  const search = searchParams.get("search");
  const location = searchParams.get("location");

  const [items, setItems] = useState<ListingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  // Extract unique locations from loaded items for the filter dropdown
  const [allLocations, setAllLocations] = useState<string[]>([]);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (search) params.set("search", search);
    if (location) params.set("location", location);
    const s = params.toString();
    return s ? `?${s}` : "";
  }, [category, search, location]);

  // Fetch all locations once (without filters) to populate the dropdown
  useEffect(() => {
    apiFetch<ListingListItem[]>(`/api/v1/listings/`, { method: "GET" }, { auth: false })
      .then((data) => {
        const listings = Array.isArray(data) ? data : [];
        const locs = [...new Set(listings.map((l) => l.location).filter(Boolean))].sort();
        setAllLocations(locs);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    apiFetch<ListingListItem[]>(`/api/v1/listings/${queryString}`, { method: "GET" }, { auth: false })
      .then(async (data) => {
        if (!mounted) return;
        const listings = Array.isArray(data) ? data : [];
        setItems(listings);
      })
      .catch((e: unknown) => mounted && setErr(e instanceof Error ? e.message : "Failed to load listings"))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [queryString]);

  function handleLocationChange(newLocation: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (newLocation) {
      params.set("location", newLocation);
    } else {
      params.delete("location");
    }
    router.push(`/listings?${params.toString()}`);
  }

  return (
    <div className="flex flex-col min-h-screen bg-[var(--background)] pb-24 md:pb-8">
      <HeroSection />
      <SearchBar locations={allLocations} />
      <CategoryBar />

      <div className="px-4 py-8 md:px-10 md:py-10 max-w-[1400px] mx-auto w-full">
        {/* Header + Location Filter */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-bold text-[var(--foreground)]">
              {category ? CATEGORY_LABELS[category] || "Listings" : "All Listings"}
            </h2>
            <span className="text-sm font-medium text-slate-500">{items.length} items</span>
          </div>

          {/* Clear all filters */}
          <div className="flex items-center gap-2">
            {(category || search || location) && (
              <button
                type="button"
                onClick={() => router.push("/listings")}
                className="rounded-xl border border-[var(--line)] bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 transition-colors whitespace-nowrap"
              >
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Active filter tags */}
        {(category || location || search) && (
          <div className="mb-6 flex flex-wrap gap-2">
            {category && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--brand-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--brand-strong)]">
                {CATEGORY_LABELS[category] || category}
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("category");
                    router.push(`/listings?${params.toString()}`);
                  }}
                  className="ml-0.5 hover:text-red-600 transition-colors"
                >×</button>
              </span>
            )}
            {location && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
                📍 {location}
                <button
                  onClick={() => handleLocationChange("")}
                  className="ml-0.5 hover:text-red-600 transition-colors"
                >×</button>
              </span>
            )}
            {search && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
                &quot;{search}&quot;
                <button
                  onClick={() => {
                    const params = new URLSearchParams(searchParams.toString());
                    params.delete("search");
                    router.push(`/listings?${params.toString()}`);
                  }}
                  className="ml-0.5 hover:text-red-600 transition-colors"
                >×</button>
              </span>
            )}
          </div>
        )}

        {/* Skeleton Loading */}
        {loading && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div key={n} className="h-72 sm:h-80 animate-pulse rounded-2xl bg-slate-200"></div>
            ))}
          </div>
        )}

        {/* Error */}
        {err && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {err}
          </div>
        )}

        {/* Listings Grid */}
        {!loading && !err && items.length > 0 && (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {items.map((it) => (
              <ListingCard key={it.id} item={it} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !err && items.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-[var(--surface)] rounded-2xl shadow-sm border border-[var(--line)] min-h-[250px]">
            <span className="text-5xl mb-3">🔍</span>
            <p className="text-base font-semibold text-slate-700 md:text-lg">No listings found</p>
            <p className="text-sm text-slate-500 mt-2">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}

const CATEGORY_LABELS: Record<string, string> = {
  FRESH_PRODUCE: "Fresh Produce",
  ANIMAL_PRODUCE: "Animal Produce",
  FARM_WASTE: "Farm Waste",
  AGRI_INPUTS: "Agricultural Inputs",
  EQUIPMENT: "Equipment & Rentals",
};

export default function ListingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
      <ListingsContent />
    </Suspense>
  );
}
