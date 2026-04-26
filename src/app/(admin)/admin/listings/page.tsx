"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import AdminActionButton from "@/app/components/admin/AdminActionButton";
import { downloadCsv, printCurrentPage } from "@/app/lib/reportUtils";

type WasteListing = {
  id: number;
  waste_type: string;
  quantity: string;
  unit: string;
  price: string;
  location: string;
  status: string;
  created_at: string;
  farmer_username: string;
};

function statusBadgeClass(status: string) {
  switch ((status || "").toUpperCase()) {
    case "OPEN": return "bg-emerald-100 text-emerald-800";
    case "ACCEPTED": return "bg-emerald-100 text-emerald-800";
    case "PENDING": return "bg-amber-100 text-amber-800";
    case "REQUESTED": return "bg-blue-100 text-blue-800";
    case "REJECTED": return "bg-red-100 text-red-700";
    case "CANCELLED": return "bg-neutral-100 text-neutral-500";
    case "COMPLETED": return "bg-neutral-100 text-neutral-700";
    default: return "bg-neutral-100 text-neutral-700";
  }
}

export default function AdminListingsPage() {
  const [listings, setListings] = useState<WasteListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [wasteTypeFilter, setWasteTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function loadListings() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter) q.set("status", statusFilter);
      if (wasteTypeFilter) q.set("waste_type", wasteTypeFilter);
      if (startDate) q.set("start_date", startDate);
      if (endDate) q.set("end_date", endDate);

      const qs = q.toString() ? `?${q.toString()}` : "";
      const data = await apiFetch<WasteListing[]>(`/api/v1/listings/${qs}`);
      setListings(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load listings");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, startDate, endDate]); 
  // wasteTypeFilter requires manual submit to avoid spamming the API on every keystroke

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    void loadListings();
  }

  const filteredListings = useMemo(() => {
    const normalizedNameFilter = nameFilter.trim().toLowerCase();
    if (!normalizedNameFilter) return listings;

    return listings.filter((listing) =>
      [listing.farmer_username, listing.waste_type]
        .join(" ")
        .toLowerCase()
        .includes(normalizedNameFilter)
    );
  }, [listings, nameFilter]);

  function downloadListings() {
    const rows: Array<Array<string | number>> = [
      ["Listing ID", "Waste Type", "Quantity", "Unit", "Farmer", "Location", "Price (KES)", "Status", "Created"],
      ...filteredListings.map((listing) => [
        listing.id,
        listing.waste_type,
        listing.quantity,
        listing.unit,
        listing.farmer_username,
        listing.location,
        listing.price,
        listing.status,
        new Date(listing.created_at).toLocaleDateString(),
      ]),
    ];

    downloadCsv("admin-listings.csv", rows);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Administration</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--brand-strong)]">Manage Listings</h1>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <AdminActionButton onClick={downloadListings} disabled={loading || filteredListings.length === 0}>
            Download CSV
          </AdminActionButton>
          <AdminActionButton onClick={printCurrentPage} variant="primary">
            Print
          </AdminActionButton>
        </div>
      </div>

      {/* Filters Bar */}
      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 print:hidden">
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-semibold text-neutral-600">Name</label>
          <input
            type="text"
            placeholder="Farmer or item name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
          />
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="mb-1 block text-xs font-semibold text-neutral-600">Waste Type</label>
          <input
            type="text"
            placeholder="e.g. husks"
            value={wasteTypeFilter}
            onChange={(e) => setWasteTypeFilter(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
          />
        </div>
        
        <div className="w-[140px]">
          <label className="mb-1 block text-xs font-semibold text-neutral-600">Status</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
          >
            <option value="">All</option>
            <option value="OPEN">Open</option>
            <option value="REQUESTED">Requested</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-600">Start Date</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-600">End Date</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
          />
        </div>
        
        <button type="submit" className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-strong)]">
          Search
        </button>
      </form>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface)] text-xs font-semibold text-neutral-500">
              <tr>
                <th className="px-5 py-4 uppercase tracking-wider">Item</th>
                <th className="px-5 py-4 uppercase tracking-wider">Farmer</th>
                <th className="px-5 py-4 uppercase tracking-wider">Location</th>
                <th className="px-5 py-4 uppercase tracking-wider">Price (KES)</th>
                <th className="px-5 py-4 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 uppercase tracking-wider">Date</th>
              </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-neutral-500">Loading listings...</td>
                </tr>
              ) : filteredListings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-neutral-500">
                    {listings.length === 0 ? "No listings found for this criteria." : "No listings match the current filters."}
                  </td>
                </tr>
              ) : (
                filteredListings.map((l) => (
                  <tr key={l.id} className="transition hover:bg-neutral-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-neutral-900">{l.waste_type}</p>
                      <p className="text-xs text-neutral-500">{l.quantity} {l.unit}</p>
                    </td>
                    <td className="px-5 py-4 text-neutral-600">@{l.farmer_username}</td>
                    <td className="px-5 py-4 text-neutral-600">{l.location}</td>
                    <td className="px-5 py-4 font-semibold text-neutral-900">{l.price}</td>
                    <td className="px-5 py-4">
                      <span className={["inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase", statusBadgeClass(l.status)].join(" ")}>
                        {l.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-neutral-500">
                      {new Date(l.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
