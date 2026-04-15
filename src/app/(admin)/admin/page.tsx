"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import { downloadCsv, printCurrentPage } from "@/app/lib/reportUtils";

type TimelineEntry = {
  period: string;
  count?: number;
  amount?: string | number;
  active_users?: number;
  quantity?: number | string;
};

type AdminReport = {
  granularity: string;
  total_platform_transactions: {
    total_transactions: number;
    total_transaction_value: string | number;
    timeline: TimelineEntry[];
  };
  active_users_over_time: TimelineEntry[];
  waste_categories_distribution: {
    waste_type: string;
    listing_count: number;
    total_quantity: string | number;
  }[];
  marketplace_liquidity: {
    total_listings: number;
    sold_listings: number;
    unsold_listings: number;
    successful_sales: number;
    sell_through_rate: number;
  };
};

function formatPeriod(dateStr: string) {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-KE", { month: "short", year: "2-digit" });
  } catch {
    return dateStr;
  }
}

function formatMoney(val: string | number) {
  const num = Number(val) || 0;
  return `KES ${num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatQty(val: number | string) {
  const num = Number(val) || 0;
  return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function StatCard({ label, value, sub, accent = false }: { label: string; value: string | number; sub?: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">{label}</p>
      <p className={["mt-2 text-3xl font-bold", accent ? "text-[var(--brand)]" : "text-[var(--brand-strong)]"].join(" ")}>
        {value}
      </p>
      {sub && <p className="mt-1 text-xs text-neutral-500">{sub}</p>}
    </div>
  );
}

function TimelineChart({ data, valueKey, label, unit = "", color = "bg-[var(--brand)]" }: { data: TimelineEntry[]; valueKey: string; label: string; unit?: string; color?: string }) {
  if (!data.length) return <p className="py-4 text-center text-sm text-neutral-500">No data available.</p>;
  const maxVal = Math.max(...data.map((d) => Number((d as Record<string, unknown>)[valueKey]) || 0), 1);

  return (
    <div className="space-y-1.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <div className="flex items-end gap-1" style={{ height: "120px" }}>
        {data.map((entry, i) => {
          const val = Number((entry as Record<string, unknown>)[valueKey]) || 0;
          const pct = (val / maxVal) * 100;
          return (
            <div key={i} className="group relative flex flex-1 flex-col items-center justify-end" style={{ height: "100%" }}>
              <div
                className={`w-full min-w-1 ${color} rounded-t-md transition-all duration-300 group-hover:opacity-80`}
                style={{ height: `${Math.max(pct, 4)}%` }}
              />
              <div className="pointer-events-none absolute -top-10 z-10 hidden rounded-lg bg-neutral-900 px-2 py-1 text-[10px] font-semibold text-white shadow-lg group-hover:block whitespace-nowrap">
                {val.toLocaleString()}{unit}
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

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [granularity, setGranularity] = useState("month");

  useEffect(() => {
    let mounted = true;

    apiFetch<AdminReport>(`/api/reports/admin/?granularity=${granularity}`)
      .then((d) => {
        if (!mounted) return;
        setData(d);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load admin reports");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => { mounted = false; };
  }, [granularity]);

  function exportAdminReport() {
    if (!data) return;

    const rows: Array<Array<string | number>> = [
      ["Admin Platform Report"],
      ["Granularity", granularity],
      ["Total Value Traded", Number(data.total_platform_transactions.total_transaction_value) || 0],
      ["Completed Trades", data.total_platform_transactions.total_transactions],
      ["Sell Through Rate", `${Math.round(data.marketplace_liquidity.sell_through_rate * 100)}%`],
      ["Total Listings", data.marketplace_liquidity.total_listings],
      ["Sold Listings", data.marketplace_liquidity.sold_listings],
      ["Unsold Listings", data.marketplace_liquidity.unsold_listings],
      [""],
      ["Waste Categories"],
      ["Waste Type", "Listing Count", "Total Quantity"],
      ...data.waste_categories_distribution.map((category) => [
        category.waste_type,
        category.listing_count,
        category.total_quantity,
      ]),
    ];

    downloadCsv("admin-report.csv", rows);
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Administration</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--brand-strong)] sm:text-3xl">Dashboard & Reports</h1>
        <p className="mt-2 text-sm text-neutral-700">Detailed financial and marketplace metrics for the platform.</p>
      </section>

      {/* Controls */}
      <div className="flex gap-2">
        {["month", "day"].map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => {
              if (g === granularity) return;
              setError(null);
              setLoading(true);
              setGranularity(g);
            }}
            className={[
              "rounded-full px-4 py-2 text-sm font-semibold transition",
              granularity === g
                ? "bg-[var(--brand)] text-white"
                : "border border-[var(--line)] bg-white text-neutral-700 hover:bg-neutral-50",
            ].join(" ")}
          >
            {g === "month" ? "Monthly" : "Daily"}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={exportAdminReport}
            disabled={!data}
            className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-neutral-800 disabled:opacity-60"
          >
            Download CSV
          </button>
          <button
            type="button"
            onClick={printCurrentPage}
            className="rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[var(--brand-strong)]"
          >
            Print Report
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading reports...</p>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {!loading && data && (
        <>
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Total Value Traded" value={formatMoney(data.total_platform_transactions.total_transaction_value)} accent />
            <StatCard label="Completed Trades" value={data.total_platform_transactions.total_transactions} />
            <StatCard label="Sell-Through Rate" value={`${Math.round(data.marketplace_liquidity.sell_through_rate * 100)}%`} />
            <StatCard label="Total Listings" value={data.marketplace_liquidity.total_listings} sub={`${data.marketplace_liquidity.unsold_listings} currently unsold`} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Transactions Chart */}
            <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--brand-strong)]">Transaction Volume</h2>
              <div className="mt-4">
                <TimelineChart data={data.total_platform_transactions.timeline} valueKey="amount" label="Value Traded (KES)" unit=" KES" />
              </div>
            </div>

            {/* Active Users Chart */}
            <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--brand-strong)]">Active Users</h2>
              <div className="mt-4">
                <TimelineChart data={data.active_users_over_time} valueKey="active_users" label="Users Active in Market" color="bg-[var(--accent)]" />
              </div>
            </div>
          </div>

          {/* Categories Chart */}
          <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--brand-strong)]">Category Distribution</h2>
            <p className="mt-1 text-sm text-neutral-600">Breakdown of listed waste types across the entire platform.</p>
            {data.waste_categories_distribution.length === 0 ? (
              <p className="mt-4 text-sm text-neutral-500">No categories found.</p>
            ) : (
              <div className="mt-6 flex flex-wrap gap-4">
                {data.waste_categories_distribution.map((cat, i) => (
                  <div key={i} className="min-w-[150px] flex-1 rounded-xl border border-[var(--line)] bg-[var(--card)] p-4 text-center">
                    <p className="text-sm font-semibold text-[var(--brand-strong)]">{cat.waste_type}</p>
                    <p className="mt-1 text-xl font-bold text-[var(--brand)]">{formatQty(cat.total_quantity)}</p>
                    <p className="mt-0.5 text-xs text-neutral-500">{cat.listing_count} listings</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
