"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { apiFetch } from "@/app/lib/api";
import { downloadCsv, printCurrentPage } from "@/app/lib/reportUtils";
import { useAuthState } from "@/app/lib/useAuthState";
import type { WasteListingListItem } from "@/app/lib/types";

type TimelineEntry = {
  period: string;
  count?: number;
  quantity?: number | string;
  amount?: number | string;
};

type FarmerReport = {
  granularity: string;
  total_waste_listed_over_time: TimelineEntry[];
  revenue_earned_from_waste_sales: {
    total_revenue: number | string;
    total_sales: number;
    timeline: TimelineEntry[];
  };
  most_demanded_waste_types: {
    waste_type: string;
    request_count: number;
    total_quantity_requested: number | string;
  }[];
  unsold_vs_sold_listings: {
    sold: number;
    unsold: number;
    total: number;
  };
};

type ProcessorReport = {
  granularity: string;
  total_waste_purchased: {
    total_quantity: number | string;
    total_transactions: number;
    timeline: TimelineEntry[];
  };
  spending_trends: {
    total_spend: number | string;
    timeline: TimelineEntry[];
  };
  most_reliable_suppliers: {
    farmer_id: number;
    farmer_username: string;
    successful_transactions: number;
    total_quantity_supplied: number | string;
    total_spend: number | string;
  }[];
  waste_availability_trends: {
    currently_available_listings: number;
    currently_available_quantity: number | string;
    timeline: TimelineEntry[];
  };
};

type ListingView = "all" | "sold" | "unsold";

function SectionHeader({ tag, title, description }: { tag: string; title: string; description: string }) {
  return (
    <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">{tag}</p>
      <h1 className="mt-1 text-2xl font-bold text-[var(--brand-strong)] sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-neutral-700">{description}</p>
    </section>
  );
}

function ActionButton({
  children,
  onClick,
  variant = "secondary",
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl px-4 py-2 text-sm font-semibold transition",
        variant === "primary"
          ? "bg-[var(--brand)] text-white hover:bg-[var(--brand-strong)]"
          : "border border-[var(--line)] bg-white text-neutral-800 hover:bg-neutral-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function StatCard({
  label,
  value,
  sub,
  active = false,
  onClick,
}: {
  label: string;
  value: string | number;
  sub?: string;
  active?: boolean;
  onClick?: () => void;
}) {
  const className = [
    "rounded-2xl border p-5 shadow-sm transition",
    onClick ? "cursor-pointer hover:-translate-y-0.5 hover:shadow-md" : "",
    active ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "border-[var(--line)] bg-[var(--card)]",
  ]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-[var(--brand-strong)]">{value}</p>
      {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
    </>
  );

  if (!onClick) return <div className={className}>{content}</div>;

  return (
    <button type="button" onClick={onClick} className={`${className} text-left`} aria-pressed={active}>
      {content}
    </button>
  );
}

function ProgressBar({ value, max, color = "bg-[var(--brand)]" }: { value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[var(--brand-soft)]">
      <div className={`h-full rounded-full ${color} transition-all duration-500`} style={{ width: `${pct}%` }} />
    </div>
  );
}

function TimelineChart({
  data,
  valueKey,
  label,
  unit = "",
  color = "bg-[var(--brand)]",
}: {
  data: TimelineEntry[];
  valueKey: string;
  label: string;
  unit?: string;
  color?: string;
}) {
  if (!data.length) return <p className="py-4 text-center text-sm text-neutral-500">No data for this period.</p>;
  const maxVal = Math.max(...data.map((d) => Number((d as Record<string, unknown>)[valueKey]) || 0), 1);

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <div className="flex items-end gap-1" style={{ height: "120px" }}>
        {data.map((entry, i) => {
          const val = Number((entry as Record<string, unknown>)[valueKey]) || 0;
          const pct = (val / maxVal) * 100;
          return (
            <div key={`${entry.period}-${i}`} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: "100%" }}>
              <div
                className={`w-full min-w-1 ${color} rounded-t-md transition-all duration-300 group-hover:opacity-80`}
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
              <div className="pointer-events-none absolute -top-10 z-10 hidden rounded-lg bg-neutral-900 px-2 py-1 text-[10px] font-semibold whitespace-nowrap text-white shadow-lg group-hover:block">
                {val.toLocaleString()}
                {unit}
                <br />
                {formatPeriod(entry.period)}
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-[10px] text-neutral-400">
        <span>{formatPeriod(data[0].period)}</span>
        {data.length > 1 && <span>{formatPeriod(data[data.length - 1].period)}</span>}
      </div>
    </div>
  );
}

function formatPeriod(dateStr: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-KE", { month: "short", year: "2-digit" });
  } catch {
    return dateStr;
  }
}

function formatMoney(val: number | string) {
  const num = Number(val) || 0;
  return `KES ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatQty(val: number | string) {
  const num = Number(val) || 0;
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function isSoldListing(status: string) {
  return ["ACCEPTED", "COMPLETED"].includes((status || "").toUpperCase());
}

function matchesDateRange(dateValue: string, startDate: string, endDate: string) {
  if (!startDate && !endDate) return true;
  if (!dateValue) return false;
  const entryDate = dateValue.slice(0, 10);
  if (startDate && entryDate < startDate) return false;
  if (endDate && entryDate > endDate) return false;
  return true;
}

function FarmerReports({
  data,
  granularity,
  setGranularity,
  listings,
  listingsLoading,
}: {
  data: FarmerReport;
  granularity: string;
  setGranularity: (g: string) => void;
  listings: WasteListingListItem[];
  listingsLoading: boolean;
}) {
  const { unsold_vs_sold_listings: listingStats, revenue_earned_from_waste_sales: revenue, most_demanded_waste_types: demanded } = data;
  const [listingView, setListingView] = useState<ListingView>("all");
  const [wasteTypeFilter, setWasteTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const wasteTypeOptions = useMemo(
    () => Array.from(new Set(listings.map((item) => item.waste_type).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [listings]
  );

  const filteredListings = useMemo(() => {
    return listings.filter((item) => {
      if (listingView === "sold" && !isSoldListing(item.status)) return false;
      if (listingView === "unsold" && isSoldListing(item.status)) return false;
      if (wasteTypeFilter && item.waste_type !== wasteTypeFilter) return false;
      if (!matchesDateRange(item.created_at, startDate, endDate)) return false;
      return true;
    });
  }, [endDate, listingView, listings, startDate, wasteTypeFilter]);

  function exportFarmerReport() {
    const rows: Array<Array<string | number>> = [
      ["Farmer Report"],
      ["Granularity", granularity],
      ["Total Listings", listingStats.total],
      ["Sold Listings", listingStats.sold],
      ["Unsold Listings", listingStats.unsold],
      ["Total Revenue", Number(revenue.total_revenue) || 0],
      [""],
      ["Filtered Listings"],
      ["Waste Type Filter", wasteTypeFilter || "All"],
      ["Start Date", startDate || "Any"],
      ["End Date", endDate || "Any"],
      ["View", listingView],
      [""],
      ["Waste Type", "Quantity", "Unit", "Location", "Price", "Status", "Created At"],
      ...filteredListings.map((item) => [
        item.waste_type,
        item.quantity,
        item.unit,
        item.location,
        item.price ?? "",
        item.status,
        item.created_at,
      ]),
    ];

    downloadCsv("farmer-report.csv", rows);
  }

  return (
    <div className="space-y-6">
      <SectionHeader tag="Farmer Reports" title="Your Performance" description="Track your listings, sales revenue, and most in-demand waste types." />

      <div className="flex flex-wrap gap-2">
        {["month", "day"].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGranularity(g)}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              granularity === g ? "bg-[var(--brand)] text-white" : "border border-[var(--line)] bg-white text-neutral-700 hover:bg-neutral-50",
            ].join(" ")}
          >
            {g === "month" ? "Monthly" : "Daily"}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          <ActionButton onClick={exportFarmerReport}>Download CSV</ActionButton>
          <ActionButton onClick={printCurrentPage} variant="primary">
            Print Report
          </ActionButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Listings" value={listingStats.total} sub="Open the full listing register" active={listingView === "all"} onClick={() => setListingView("all")} />
        <StatCard label="Sold Listings" value={listingStats.sold} sub="Filter to sold listings" active={listingView === "sold"} onClick={() => setListingView("sold")} />
        <StatCard label="Unsold Listings" value={listingStats.unsold} sub="Filter to unsold listings" active={listingView === "unsold"} onClick={() => setListingView("unsold")} />
        <StatCard label="Total Revenue" value={formatMoney(revenue.total_revenue)} sub={`${revenue.total_sales} sale${revenue.total_sales === 1 ? "" : "s"}`} />
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Sell-Through Rate</p>
            <p className="mt-1 text-2xl font-bold text-[var(--brand-strong)]">
              {listingStats.total > 0 ? `${Math.round((listingStats.sold / listingStats.total) * 100)}%` : "—"}
            </p>
          </div>
          <div className="text-right text-xs text-neutral-500">
            {listingStats.sold} of {listingStats.total} listings sold
          </div>
        </div>
        <div className="mt-3">
          <ProgressBar value={listingStats.sold} max={listingStats.total} />
        </div>
      </div>

      <section className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--brand-strong)]">Listing Drill-Down</h2>
            <p className="mt-1 text-sm text-neutral-600">Click the listing cards above to switch between all, sold, and unsold records.</p>
          </div>
          <Link href="/my-listings" className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-neutral-800">
            Open My Listings
          </Link>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Waste Type</label>
            <select
              value={wasteTypeFilter}
              onChange={(event) => setWasteTypeFilter(event.target.value)}
              className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm"
            >
              <option value="">All waste types</option>
              {wasteTypeOptions.map((wasteType) => (
                <option key={wasteType} value={wasteType}>
                  {wasteType}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Start Date</label>
            <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-neutral-500">End Date</label>
            <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm" />
          </div>
          <div className="flex items-end">
            <button
              type="button"
              onClick={() => {
                setWasteTypeFilter("");
                setStartDate("");
                setEndDate("");
              }}
              className="w-full rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-neutral-800"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <div className="mt-4 overflow-hidden rounded-xl border border-[var(--line)]">
          <div className="grid grid-cols-2 gap-3 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-neutral-500 md:grid-cols-6">
            <span>Waste Type</span>
            <span>Quantity</span>
            <span className="hidden md:block">Location</span>
            <span className="hidden md:block">Price</span>
            <span>Status</span>
            <span>Date</span>
          </div>
          {listingsLoading ? (
            <p className="px-4 py-6 text-sm text-neutral-500">Loading your listings…</p>
          ) : filteredListings.length === 0 ? (
            <p className="px-4 py-6 text-sm text-neutral-500">No listings match the selected filters.</p>
          ) : (
            filteredListings.map((item) => (
              <Link
                key={item.id}
                href={`/listings/${item.id}`}
                className="grid grid-cols-2 gap-3 border-t border-[var(--line)] px-4 py-3 text-sm transition hover:bg-[var(--surface)] md:grid-cols-6"
              >
                <span className="font-semibold text-[var(--brand-strong)]">{item.waste_type}</span>
                <span>{item.quantity} {item.unit}</span>
                <span className="hidden md:block">{item.location}</span>
                <span className="hidden md:block">{item.price ? formatMoney(item.price) : "Negotiable"}</span>
                <span>{item.status}</span>
                <span>{item.created_at ? new Date(item.created_at).toLocaleDateString("en-KE") : "—"}</span>
              </Link>
            ))
          )}
        </div>
      </section>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--brand-strong)]">Revenue Over Time</h2>
        <div className="mt-4">
          <TimelineChart data={revenue.timeline} valueKey="amount" label="Revenue (KES)" unit=" KES" />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--brand-strong)]">Waste Listed Over Time</h2>
        <div className="mt-4">
          <TimelineChart data={data.total_waste_listed_over_time} valueKey="quantity" label="Quantity Listed" color="bg-[var(--accent)]" />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--brand-strong)]">Most Demanded Waste Types</h2>
        <p className="mt-1 text-sm text-neutral-600">What processors request from your listings the most.</p>
        {demanded.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">No requests received yet.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {demanded.map((wt) => (
              <div key={wt.waste_type} className="flex items-center justify-between rounded-xl border border-[var(--line)] bg-[var(--card)] px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-[var(--brand-strong)]">{wt.waste_type}</p>
                  <p className="mt-0.5 text-xs text-neutral-500">{wt.request_count} request{wt.request_count === 1 ? "" : "s"}</p>
                </div>
                <span className="text-sm font-semibold text-[var(--accent)]">{formatQty(wt.total_quantity_requested)} requested</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProcessorReports({
  data,
  granularity,
  setGranularity,
}: {
  data: ProcessorReport;
  granularity: string;
  setGranularity: (g: string) => void;
}) {
  const { total_waste_purchased: purchases, spending_trends: spending, most_reliable_suppliers: suppliers, waste_availability_trends: availability } = data;

  function exportProcessorReport() {
    const rows: Array<Array<string | number>> = [
      ["Processor Report"],
      ["Granularity", granularity],
      ["Total Purchases", purchases.total_transactions],
      ["Quantity Purchased", Number(purchases.total_quantity) || 0],
      ["Total Spent", Number(spending.total_spend) || 0],
      ["Available Listings Now", availability.currently_available_listings],
      ["Available Quantity Now", Number(availability.currently_available_quantity) || 0],
      [""],
      ["Most Reliable Suppliers"],
      ["Farmer", "Transactions", "Quantity Supplied", "Total Spend"],
      ...suppliers.map((supplier) => [
        supplier.farmer_username,
        supplier.successful_transactions,
        supplier.total_quantity_supplied,
        supplier.total_spend,
      ]),
    ];

    downloadCsv("processor-report.csv", rows);
  }

  return (
    <div className="space-y-6">
      <SectionHeader tag="Processor Reports" title="Your Activity" description="Track your purchases, spending, supplier performance, and market availability." />

      <div className="flex flex-wrap gap-2">
        {["month", "day"].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => setGranularity(g)}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              granularity === g ? "bg-[var(--brand)] text-white" : "border border-[var(--line)] bg-white text-neutral-700 hover:bg-neutral-50",
            ].join(" ")}
          >
            {g === "month" ? "Monthly" : "Daily"}
          </button>
        ))}
        <div className="ml-auto flex flex-wrap gap-2">
          <ActionButton onClick={exportProcessorReport}>Download CSV</ActionButton>
          <ActionButton onClick={printCurrentPage} variant="primary">
            Print Report
          </ActionButton>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total Purchases" value={purchases.total_transactions} />
        <StatCard label="Quantity Purchased" value={formatQty(purchases.total_quantity)} />
        <StatCard label="Total Spent" value={formatMoney(spending.total_spend)} />
        <StatCard label="Available Now" value={availability.currently_available_listings} sub={`${formatQty(availability.currently_available_quantity)} units`} />
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--brand-strong)]">Spending Over Time</h2>
        <div className="mt-4">
          <TimelineChart data={spending.timeline} valueKey="amount" label="Spending (KES)" unit=" KES" />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--brand-strong)]">Purchases Over Time</h2>
        <div className="mt-4">
          <TimelineChart data={purchases.timeline} valueKey="quantity" label="Quantity Purchased" color="bg-[var(--accent)]" />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--brand-strong)]">Market Availability Trends</h2>
        <p className="mt-1 text-sm text-neutral-600">Total waste listings on the platform over time.</p>
        <div className="mt-4">
          <TimelineChart data={availability.timeline} valueKey="quantity" label="Quantity Available" color="bg-emerald-500" />
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--brand-strong)]">Most Reliable Suppliers</h2>
        <p className="mt-1 text-sm text-neutral-600">Farmers you&apos;ve successfully transacted with.</p>
        {suppliers.length === 0 ? (
          <p className="mt-4 text-sm text-neutral-500">No completed transactions yet.</p>
        ) : (
          <>
            <div className="mt-4 hidden overflow-hidden rounded-xl border border-[var(--line)] md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--line)] bg-[var(--surface)]">
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Farmer</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Transactions</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Qty Supplied</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">Total Spend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--line)]/60">
                  {suppliers.map((supplier) => (
                    <tr key={supplier.farmer_id} className="transition hover:bg-[var(--surface)]/50">
                      <td className="px-4 py-3 font-semibold text-[var(--brand-strong)]">@{supplier.farmer_username}</td>
                      <td className="px-4 py-3 text-neutral-700">{supplier.successful_transactions}</td>
                      <td className="px-4 py-3 text-neutral-700">{formatQty(supplier.total_quantity_supplied)}</td>
                      <td className="px-4 py-3 font-semibold text-[var(--accent)]">{formatMoney(supplier.total_spend)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 space-y-2 md:hidden">
              {suppliers.map((supplier) => (
                <div key={supplier.farmer_id} className="rounded-xl border border-[var(--line)] bg-[var(--card)] p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-[var(--brand-strong)]">@{supplier.farmer_username}</p>
                    <span className="rounded-full bg-[var(--brand-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--brand-strong)]">
                      {supplier.successful_transactions} txn{supplier.successful_transactions === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between text-xs text-neutral-600">
                    <span>Qty: {formatQty(supplier.total_quantity_supplied)}</span>
                    <span className="font-semibold text-[var(--accent)]">{formatMoney(supplier.total_spend)}</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { accessToken, role, hydrated, username } = useAuthState();
  const [farmerData, setFarmerData] = useState<FarmerReport | null>(null);
  const [processorData, setProcessorData] = useState<ProcessorReport | null>(null);
  const [farmerListings, setFarmerListings] = useState<WasteListingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingsLoading, setListingsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [granularity, setGranularity] = useState("month");

  const isFarmer = role === "FARMER";
  const isProcessor = role === "PROCESSOR";

  useEffect(() => {
    if (!hydrated || !accessToken || !role) return;
    let mounted = true;

    const endpoint = isFarmer ? `/api/reports/farmer/?granularity=${granularity}` : isProcessor ? `/api/reports/processor/?granularity=${granularity}` : null;

    if (!endpoint) return;

    apiFetch<FarmerReport | ProcessorReport>(endpoint)
      .then((data) => {
        if (!mounted) return;
        if (isFarmer) setFarmerData(data as FarmerReport);
        if (isProcessor) setProcessorData(data as ProcessorReport);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load reports");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [accessToken, granularity, hydrated, isFarmer, isProcessor, role]);

  useEffect(() => {
    if (!hydrated || !isFarmer || !username) return;
    let mounted = true;

    apiFetch<WasteListingListItem[]>("/api/v1/listings/", { method: "GET" }, { auth: false })
      .then((items) => {
        if (!mounted) return;
        setFarmerListings((Array.isArray(items) ? items : []).filter((item) => item.farmer_username === username));
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err instanceof Error ? err.message : "Failed to load listing drill-down.");
      })
      .finally(() => {
        if (mounted) setListingsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [hydrated, isFarmer, username]);

  if (!hydrated) {
    return <p className="text-sm text-neutral-500">Loading...</p>;
  }

  if (!accessToken) {
    return (
      <div className="space-y-4">
        <SectionHeader tag="Reports" title="Your Reports" description="Log in to view your personalized reports." />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Please{" "}
          <Link href="/login" className="font-semibold underline">
            log in
          </Link>{" "}
          to view your reports.
        </div>
      </div>
    );
  }

  if (!isFarmer && !isProcessor) {
    return (
      <div className="space-y-4">
        <SectionHeader tag="Reports" title="Your Reports" description="Reports are available for farmers and processors." />
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Reports are available for farmer and processor accounts.
          {role === "ADMIN" && (
            <>
              {" "}Admin reports are available in the{" "}
              <Link href="/admin" className="font-semibold underline">
                admin panel
              </Link>
              .
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {loading && <p className="text-sm text-neutral-500">Loading your reports...</p>}
      {error && <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {!loading && isFarmer && farmerData && (
        <FarmerReports
          data={farmerData}
          granularity={granularity}
          setGranularity={(next) => {
            if (next === granularity) return;
            setError(null);
            setLoading(true);
            setGranularity(next);
          }}
          listings={farmerListings}
          listingsLoading={listingsLoading}
        />
      )}

      {!loading && isProcessor && processorData && (
        <ProcessorReports
          data={processorData}
          granularity={granularity}
          setGranularity={(next) => {
            if (next === granularity) return;
            setError(null);
            setLoading(true);
            setGranularity(next);
          }}
        />
      )}
    </div>
  );
}
