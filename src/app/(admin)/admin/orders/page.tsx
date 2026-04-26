"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import AdminActionButton from "@/app/components/admin/AdminActionButton";
import { downloadCsv, printCurrentPage } from "@/app/lib/reportUtils";

type AdminOrder = {
  id: number;
  processor_username: string;
  listing_waste_type: string;
  listing_farmer_username: string;
  quantity_requested: string;
  proposed_price: string;
  listing_unit?: string;
  unit?: string;
  status: string;
  created_at: string;
};

function statusBadgeClass(status: string) {
  switch ((status || "").toUpperCase()) {
    case "PENDING": return "bg-amber-100 text-amber-800";
    case "ACCEPTED": return "bg-emerald-100 text-emerald-800";
    case "REJECTED": return "bg-red-100 text-red-700";
    case "CANCELLED": return "bg-neutral-100 text-neutral-500";
    case "COMPLETED": return "bg-neutral-100 text-neutral-700";
    default: return "bg-neutral-100 text-neutral-700";
  }
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState("");
  const [processorFilter, setProcessorFilter] = useState("");
  const [listingFilter, setListingFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  async function loadOrders() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (statusFilter) q.set("status", statusFilter);
      if (processorFilter) q.set("processor", processorFilter);
      if (listingFilter) q.set("listing_type", listingFilter);
      if (startDate) q.set("start_date", startDate);
      if (endDate) q.set("end_date", endDate);

      const qs = q.toString() ? `?${q.toString()}` : "";
      const data = await apiFetch<AdminOrder[]>(`/api/requests/admin/${qs}`);
      setOrders(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, startDate, endDate]); 

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    void loadOrders();
  }

  function formatMoney(value: string | number) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "-";
    return numeric.toLocaleString();
  }

  function downloadOrders() {
    const rows: Array<Array<string | number>> = [
      ["Order ID", "Waste Type", "Quantity Requested", "Unit", "Processor", "Farmer", "Price Per Unit", "Estimated Total", "Status", "Created"],
      ...orders.map((order) => {
        const quantity = Number(order.quantity_requested);
        const unitPrice = Number(order.proposed_price);
        const estimatedTotal =
          Number.isFinite(quantity) && Number.isFinite(unitPrice) ? quantity * unitPrice : "-";

        return [
          order.id,
          order.listing_waste_type,
          order.quantity_requested,
          order.listing_unit || order.unit || "units",
          order.processor_username,
          order.listing_farmer_username,
          order.proposed_price,
          estimatedTotal,
          order.status,
          new Date(order.created_at).toLocaleDateString(),
        ];
      }),
    ];

    downloadCsv("admin-orders.csv", rows);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Administration</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--brand-strong)]">Manage Orders</h1>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <AdminActionButton onClick={downloadOrders} disabled={loading || orders.length === 0}>
            Download CSV
          </AdminActionButton>
          <AdminActionButton onClick={printCurrentPage} variant="primary">
            Print
          </AdminActionButton>
        </div>
      </div>

      {/* Filters Bar */}
      <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 print:hidden">
        <div className="flex-1 min-w-[150px]">
          <label className="mb-1 block text-xs font-semibold text-neutral-600">Processor (Buyer)</label>
          <input
            type="text"
            placeholder="e.g. john"
            value={processorFilter}
            onChange={(e) => setProcessorFilter(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
          />
        </div>
        
        <div className="flex-1 min-w-[150px]">
          <label className="mb-1 block text-xs font-semibold text-neutral-600">Listing Type</label>
          <input
            type="text"
            placeholder="e.g. manure"
            value={listingFilter}
            onChange={(e) => setListingFilter(e.target.value)}
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
            <option value="PENDING">Pending</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="COMPLETED">Completed</option>
            <option value="REJECTED">Rejected</option>
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
                <th className="px-5 py-4 uppercase tracking-wider">Order ID</th>
                <th className="px-5 py-4 uppercase tracking-wider">Item & qty</th>
                <th className="px-5 py-4 uppercase tracking-wider">Buyer (Processor)</th>
                <th className="px-5 py-4 uppercase tracking-wider">Price Per Unit</th>
                <th className="px-5 py-4 uppercase tracking-wider">Estimated Total</th>
                <th className="px-5 py-4 uppercase tracking-wider">Status</th>
                <th className="px-5 py-4 uppercase tracking-wider">Date Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-neutral-500">Loading orders...</td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-neutral-500">No orders found.</td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr key={o.id} className="transition hover:bg-neutral-50">
                    <td className="px-5 py-4 font-mono text-xs text-neutral-500">#{o.id}</td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-neutral-900">{o.listing_waste_type}</p>
                      <p className="text-xs text-neutral-500">{o.quantity_requested} {o.listing_unit || o.unit || "units"} requested</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-[var(--accent)]">@{o.processor_username}</p>
                    </td>
                    <td className="px-5 py-4 font-semibold text-neutral-900">
                      {o.proposed_price ? `KES ${formatMoney(o.proposed_price)} / ${o.listing_unit || o.unit || "unit"}` : "-"}
                    </td>
                    <td className="px-5 py-4 font-semibold text-neutral-900">
                      {Number.isFinite(Number(o.quantity_requested)) && Number.isFinite(Number(o.proposed_price))
                        ? `KES ${formatMoney(Number(o.quantity_requested) * Number(o.proposed_price))}`
                        : "-"}
                    </td>
                    <td className="px-5 py-4">
                      <span className={["inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase", statusBadgeClass(o.status)].join(" ")}>
                        {o.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap text-xs text-neutral-500">
                      {new Date(o.created_at).toLocaleDateString()}
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
