"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function SearchBar({ locations = [] }: { locations?: string[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("search") || "");

  const handleSearchAndFilter = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      params.set("search", query.trim());
    } else {
      params.delete("search");
    }
    router.push(`/listings?${params.toString()}`);
  };

  const handleLocationChange = (newLocation: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newLocation) {
      params.set("location", newLocation);
    } else {
      params.delete("location");
    }
    router.push(`/listings?${params.toString()}`);
  };

  const currentLocation = searchParams.get("location") || "";

  return (
    <div className="px-4 py-3 bg-[var(--surface)] shadow-sm sticky top-[56px] md:top-[64px] z-30 border-b border-[var(--line)]">
      <form onSubmit={handleSearchAndFilter} className="flex flex-col sm:flex-row gap-2 max-w-[1400px] mx-auto">
        <div className="relative flex items-center flex-1">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products, inputs, equipment..."
            className="w-full rounded-xl border border-[var(--line)] bg-slate-50 py-2.5 pl-10 pr-4 text-sm font-medium text-slate-800 placeholder-slate-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition-all"
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="absolute left-3.5 h-4 w-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        
        <div className="relative flex items-center sm:w-48">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-3 h-4 w-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <select
            value={currentLocation}
            onChange={(e) => handleLocationChange(e.target.value)}
            className="w-full appearance-none rounded-xl border border-[var(--line)] bg-slate-50 py-2.5 pl-9 pr-8 text-sm font-medium text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand)] transition-all cursor-pointer"
          >
            <option value="">All Locations</option>
            {locations.map((loc) => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        <button type="submit" className="hidden">Search</button>
      </form>
    </div>
  );
}
