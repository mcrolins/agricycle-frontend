"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import RequestCard from "@/app/components/RequestCard";
import { useAuthState } from "@/app/lib/useAuthState";
import { getMyRequests } from "@/app/lib/orders";

function matchesDateRange(dateValue, startDate, endDate) {
  if (!startDate && !endDate) return true;
  if (!dateValue) return false;
  const requestDate = String(dateValue).slice(0, 10);
  if (startDate && requestDate < startDate) return false;
  if (endDate && requestDate > endDate) return false;
  return true;
}

function StatFilterCard({ label, value, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "rounded-xl border px-4 py-3 text-left transition",
        active ? "border-[var(--brand)] bg-[var(--brand-soft)]" : "bg-white hover:-translate-y-0.5 hover:shadow-sm",
      ].join(" ")}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-lg font-semibold text-neutral-900">{value}</p>
    </button>
  );
}

export default function MyRequestsPage() {
  const { role } = useAuthState();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [wasteTypeFilter, setWasteTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (role && role !== "PROCESSOR") return;
    let isMounted = true;

    getMyRequests()
      .then((data) => {
        if (isMounted) setRequests(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load your requests.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [role]);

  const acceptedCount = requests.filter((item) => item.status === "ACCEPTED").length;
  const pendingCount = requests.filter((item) => (item.status || "PENDING") === "PENDING").length;

  const wasteTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(
          requests
            .map((item) => item.listing_waste_type || item.waste_type)
            .filter(Boolean)
        )
      ).sort((a, b) => a.localeCompare(b)),
    [requests]
  );

  const filteredRequests = useMemo(() => {
    return requests.filter((item) => {
      const status = item.status || "PENDING";
      const wasteType = item.listing_waste_type || item.waste_type || "";

      if (statusFilter === "pending" && status !== "PENDING") return false;
      if (statusFilter === "accepted" && status !== "ACCEPTED") return false;
      if (wasteTypeFilter && wasteType !== wasteTypeFilter) return false;
      if (!matchesDateRange(item.created_at, startDate, endDate)) return false;
      return true;
    });
  }, [endDate, requests, startDate, statusFilter, wasteTypeFilter]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Orders</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--brand-strong)] sm:text-3xl">My Requests</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Track every request you have sent, follow approvals, and filter the request list by status, waste type, and date.
        </p>
      </section>

      {role && role !== "PROCESSOR" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          My requests are only available to processor accounts.{" "}
          <Link href="/orders/incoming" className="font-semibold underline">
            Go to incoming requests
          </Link>
          .
        </div>
      )}

      {role === "PROCESSOR" && loading && <p className="text-sm text-neutral-500">Loading your requests...</p>}
      {role === "PROCESSOR" && error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {role === "PROCESSOR" && !loading && !error && (
        <div className="grid gap-3 sm:grid-cols-3">
          <StatFilterCard label="Total Requests" value={requests.length} active={statusFilter === "all"} onClick={() => setStatusFilter("all")} />
          <StatFilterCard label="Pending" value={pendingCount} active={statusFilter === "pending"} onClick={() => setStatusFilter("pending")} />
          <StatFilterCard label="Accepted" value={acceptedCount} active={statusFilter === "accepted"} onClick={() => setStatusFilter("accepted")} />
        </div>
      )}

      {role === "PROCESSOR" && !loading && !error && acceptedCount > 0 && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          You have {acceptedCount} accepted request{acceptedCount === 1 ? "" : "s"}. Open them to see the latest status and contact details.
        </div>
      )}

      {role === "PROCESSOR" && !loading && !error && requests.length > 0 && (
        <section className="space-y-4 rounded-2xl border border-[var(--line)] bg-white p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--brand-strong)]">Request Drill-Down</h2>
              <p className="mt-1 text-sm text-neutral-600">Use the summary cards above and the filters below to isolate the requests you need.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                setWasteTypeFilter("");
                setStartDate("");
                setEndDate("");
              }}
              className="rounded-xl border border-[var(--line)] px-4 py-2 text-sm font-semibold text-neutral-800"
            >
              Clear Filters
            </button>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
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
          </div>

          {filteredRequests.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-8 text-center text-sm text-neutral-600">
              No requests match the selected filters.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((req) => (
                <RequestCard key={req.id} request={req} />
              ))}
            </div>
          )}
        </section>
      )}

      {role === "PROCESSOR" && !loading && !error && requests.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-8 text-center text-sm text-neutral-600">
          You have not placed any requests yet.
        </div>
      )}
    </div>
  );
}
