"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import RequestCard from "@/app/components/RequestCard";
import { useAuthState } from "@/app/lib/useAuthState";
import { getIncomingRequests, updateRequestStatus } from "@/app/lib/orders";

export default function IncomingRequestsPage() {
  const { role } = useAuthState();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState(null);

  async function handleStatusChange(id, status) {
    try {
      setActionId(id);
      setError("");
      await updateRequestStatus(id, status);
      const data = await getIncomingRequests();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update request.");
    } finally {
      setActionId(null);
    }
  }

  useEffect(() => {
    if (role && role !== "FARMER") return;
    let isMounted = true;

    getIncomingRequests()
      .then((data) => {
        if (isMounted) setRequests(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load incoming requests.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [role]);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-5">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Orders</p>
        <h1 className="mt-1 text-2xl font-bold text-[var(--brand-strong)] sm:text-3xl">Incoming Requests</h1>
        <p className="mt-2 text-sm text-neutral-700">
          Review processor requests, approve serious buyers quickly, and keep negotiations moving.
        </p>
      </section>

      {role && role !== "FARMER" && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Incoming requests are only available to farmer accounts.{" "}
          <Link href="/orders/my" className="font-semibold underline">
            Go to my requests
          </Link>
          .
        </div>
      )}

      {role === "FARMER" && loading && <p className="text-sm text-neutral-500">Loading incoming requests...</p>}
      {role === "FARMER" && error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {role === "FARMER" && !loading && !error && requests.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-8 text-center text-sm text-neutral-600">
          No incoming requests yet.
        </div>
      )}

      {role === "FARMER" && (
        <div className="space-y-4">
          {requests.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              onStatusChange={handleStatusChange}
              actionLoading={actionId === req.id}
              showDetailsLink={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
