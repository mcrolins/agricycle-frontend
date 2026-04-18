"use client";

import { useEffect, useState } from "react";
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, AreaChart, Area 
} from "recharts";
import { apiFetch } from "@/app/lib/api";
import { downloadCsv, downloadCsvFromText, printCurrentPage } from "@/app/lib/reportUtils";

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


export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [granularity, setGranularity] = useState("month");

  // Filters State
  // Users
  const [userQuery, setUserQuery] = useState("");
  const [userDateJoined, setUserDateJoined] = useState("");
  const [userLocation, setUserLocation] = useState("");
  
  // Listings
  const [listingUserQuery, setListingUserQuery] = useState("");
  const [listingWasteType, setListingWasteType] = useState("");
  const [listingLocation, setListingLocation] = useState("");
  
  // Orders
  const [orderQuery, setOrderQuery] = useState("");
  const [orderLocation, setOrderLocation] = useState("");

  const handleDownloadUsers = async () => {
    try {
      const params = new URLSearchParams();
      if (userQuery) params.append("user_query", userQuery);
      if (userDateJoined) params.append("user_date_joined", userDateJoined);
      if (userLocation) params.append("user_location", userLocation);
      const csv = await apiFetch<string>(`/api/reports/admin/users.csv/?${params.toString()}`, {}, { auth: true });
      downloadCsvFromText("admin_users.csv", csv);
    } catch (err: any) {
      alert("Failed to download users CSV: " + err.message);
    }
  };

  const handleDownloadListings = async () => {
    try {
      const params = new URLSearchParams();
      if (listingUserQuery) params.append("listing_user_query", listingUserQuery);
      if (listingWasteType) params.append("listing_waste_type", listingWasteType);
      if (listingLocation) params.append("listing_location", listingLocation);
      const csv = await apiFetch<string>(`/api/reports/admin/listings.csv/?${params.toString()}`, {}, { auth: true });
      downloadCsvFromText("admin_listings.csv", csv);
    } catch (err: any) {
      alert("Failed to download listings CSV: " + err.message);
    }
  };

  const handleDownloadOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (orderQuery) params.append("order_query", orderQuery);
      if (orderLocation) params.append("order_location", orderLocation);
      const csv = await apiFetch<string>(`/api/reports/admin/orders.csv/?${params.toString()}`, {}, { auth: true });
      downloadCsvFromText("admin_orders.csv", csv);
    } catch (err: any) {
      alert("Failed to download orders CSV: " + err.message);
    }
  };

  useEffect(() => {
    let mounted = true;

    const fetchData = () => {
      apiFetch<AdminReport>(`/api/reports/admin/?granularity=${granularity}`)
        .then((d) => {
          if (!mounted) return;
          setData(d);
          setError(null);
        })
        .catch((err) => {
          if (mounted) setError(err instanceof Error ? err.message : "Failed to load admin reports");
        })
        .finally(() => {
          if (mounted) setLoading(false);
        });
    };

    // Initial fetch
    fetchData();

    // Poll every 30 seconds
    const intervalId = setInterval(fetchData, 30000);

    return () => { 
      mounted = false; 
      clearInterval(intervalId);
    };
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
            {/* Transactions Chart (Histogram) */}
            <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--brand-strong)]">Transaction Volume</h2>
              <p className="text-xs text-neutral-500 mb-4">Value Traded (KES)</p>
              <div className="h-48">
                {data.total_platform_transactions.timeline.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.total_platform_transactions.timeline.map((d) => ({
                        ...d,
                        periodStr: formatPeriod(d.period),
                        amount: Number(d.amount) || 0,
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="periodStr" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={(v) => `KSh ${v.toLocaleString()}`} />
                      <Tooltip 
                        formatter={(value: any) => [`KES ${(Number(value) || 0).toLocaleString()}`, "Value"]}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      />
                      <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="flex h-full items-center justify-center text-sm text-neutral-500">No data available.</p>
                )}
              </div>
            </div>

            {/* Active Users Chart (Frequency Polygon) */}
            <div className="rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-[var(--brand-strong)]">Active Users</h2>
              <p className="text-xs text-neutral-500 mb-4">Users Active in Market</p>
              <div className="h-48">
                {data.active_users_over_time.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                      data={data.active_users_over_time.map((d) => ({
                        ...d,
                        periodStr: formatPeriod(d.period),
                        active_users: Number(d.active_users) || 0,
                      }))}
                      margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                      <defs>
                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="periodStr" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                      <Tooltip 
                        formatter={(value: any) => [value, "Users"]}
                        labelStyle={{ color: '#374151' }}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB' }}
                      />
                      <Area type="monotone" dataKey="active_users" stroke="#10B981" fillOpacity={1} fill="url(#colorUsers)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="flex h-full items-center justify-center text-sm text-neutral-500">No data available.</p>
                )}
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

          {/* Reports Export Section */}
          <div className="space-y-6 pt-6">
            <h2 className="text-2xl font-bold">Custom CSV Reports</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Users Export */}
              <div className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-[var(--brand-strong)]">Users Database</h3>
                <input 
                  type="text" 
                  placeholder="Query (username, logic, etc.)" 
                  value={userQuery} 
                  onChange={e => setUserQuery(e.target.value)} 
                  className="w-full rounded-xl border p-2 text-sm"
                />
                <input 
                  type="date" 
                  value={userDateJoined} 
                  onChange={e => setUserDateJoined(e.target.value)} 
                  className="w-full rounded-xl border p-2 text-sm text-neutral-600"
                />
                <input 
                  type="text" 
                  placeholder="Location filter" 
                  value={userLocation} 
                  onChange={e => setUserLocation(e.target.value)} 
                  className="w-full rounded-xl border p-2 text-sm"
                />
                <div className="flex-1" />
                <button 
                  onClick={handleDownloadUsers}
                  className="mt-2 w-full rounded-xl border border-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--brand-soft)]"
                >
                  Export Users CSV
                </button>
              </div>

              {/* Listings Export */}
              <div className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-[var(--brand-strong)]">Listings Database</h3>
                <input 
                  type="text" 
                  placeholder="Farmer name query" 
                  value={listingUserQuery} 
                  onChange={e => setListingUserQuery(e.target.value)} 
                  className="w-full rounded-xl border p-2 text-sm"
                />
                <input 
                  type="text" 
                  placeholder="Waste Type" 
                  value={listingWasteType} 
                  onChange={e => setListingWasteType(e.target.value)} 
                  className="w-full rounded-xl border p-2 text-sm"
                />
                <input 
                  type="text" 
                  placeholder="Location filter" 
                  value={listingLocation} 
                  onChange={e => setListingLocation(e.target.value)} 
                  className="w-full rounded-xl border p-2 text-sm"
                />
                <div className="flex-1" />
                <button 
                  onClick={handleDownloadListings}
                  className="mt-2 w-full rounded-xl border border-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--brand-soft)]"
                >
                  Export Listings CSV
                </button>
              </div>

              {/* Orders Export */}
              <div className="flex flex-col gap-4 rounded-2xl border border-[var(--line)] bg-white p-5 shadow-sm">
                <h3 className="text-lg font-semibold text-[var(--brand-strong)]">Orders Database</h3>
                <input 
                  type="text" 
                  placeholder="Farmer or processor name" 
                  value={orderQuery} 
                  onChange={e => setOrderQuery(e.target.value)} 
                  className="w-full rounded-xl border p-2 text-sm"
                />
                <input 
                  type="text" 
                  placeholder="Location filter" 
                  value={orderLocation} 
                  onChange={e => setOrderLocation(e.target.value)} 
                  className="w-full rounded-xl border p-2 text-sm"
                />
                <div className="flex-1" />
                <button 
                  onClick={handleDownloadOrders}
                  className="mt-2 w-full rounded-xl border border-[var(--brand)] px-4 py-2 text-sm font-semibold text-[var(--brand)] transition hover:bg-[var(--brand-soft)]"
                >
                  Export Orders CSV
                </button>
              </div>

            </div>
          </div>
        </>
      )}
    </div>
  );
}
