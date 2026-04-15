"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getRequestContact, getRequestDetail } from "@/app/lib/orders";

function formatMoney(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return numeric.toLocaleString();
}

function formatQty(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value ?? "-");
  return numeric.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);
  const [error, setError] = useState("");
  const [contactError, setContactError] = useState("");

  async function loadContact() {
    try {
      setContactLoading(true);
      setContactError("");
      const data = await getRequestContact(id);
      setContact(data);
    } catch (err) {
      setContactError(err instanceof Error ? err.message : "Failed to load contact info.");
    } finally {
      setContactLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    getRequestDetail(id)
      .then((data) => {
        if (isMounted) setRequest(data);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load request.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) return <p className="text-sm text-neutral-500">Loading request...</p>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>;
  if (!request) return <p className="text-sm text-neutral-500">Request not found.</p>;
  const quantity = request.quantity_requested ?? request.quantity ?? "-";
  const unitPrice = request.proposed_price ?? request.price ?? "-";
  const unit = request.listing_unit || request.unit || "unit";
  const totalCost =
    Number.isFinite(Number(quantity)) && Number.isFinite(Number(unitPrice)) ? Number(quantity) * Number(unitPrice) : null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Order Request</p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-[var(--brand-strong)]">Request #{request.id}</h1>
          <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
            {request.status || "PENDING"}
          </span>
        </div>
        <p className="mt-2 text-sm text-neutral-700">
          Review the request summary, confirm quantities and pricing, then unlock contact details once accepted.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Listing</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">
            {request.listing_waste_type || request.waste_type || "Waste request"}
          </p>
          <p className="mt-2 text-sm text-neutral-600">{request.listing_location || request.location || "Location pending"}</p>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Commercial Terms</p>
          <p className="mt-1 text-sm text-neutral-700">Quantity: {formatQty(quantity)} {unit}</p>
          <p className="mt-2 text-sm text-neutral-700">Price per {unit}: KES {formatMoney(unitPrice)}</p>
          <p className="mt-2 text-sm text-neutral-700">Estimated total: {totalCost === null ? "-" : `KES ${formatMoney(totalCost)}`}</p>
        </div>
      </section>

      {!!(request.message || request.notes || request.description) && (
        <section className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Notes</p>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            {request.message || request.notes || request.description}
          </p>
        </section>
      )}

      {request.status === "ACCEPTED" ? (
        <section className="rounded-2xl border bg-white p-4">
          <h2 className="text-lg font-semibold text-neutral-900">Contact Exchange</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Once accepted, both parties can view contact details and coordinate pickup, delivery, and payment directly.
          </p>
          <button
            type="button"
            onClick={loadContact}
            disabled={contactLoading}
            className="mt-4 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {contactLoading ? "Loading contact..." : "View Contact Info"}
          </button>

          {contactError && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{contactError}</div>}

          {contact && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[var(--surface)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Farmer</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">{contact.farmer.name}</p>
                <p className="mt-1 text-sm text-neutral-600">{contact.farmer.phone_number}</p>
              </div>
              <div className="rounded-xl bg-[var(--surface)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Processor</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">{contact.processor.name}</p>
                <p className="mt-1 text-sm text-neutral-600">{contact.processor.phone_number}</p>
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-4 text-sm text-neutral-600">
          Contact details unlock only after the request is accepted.
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/orders/my" className="rounded-xl border px-4 py-2 text-sm font-semibold">
          My Requests
        </Link>
        <Link href="/orders/incoming" className="rounded-xl border px-4 py-2 text-sm font-semibold">
          Incoming Requests
        </Link>
      </div>
    </div>
  );
}
