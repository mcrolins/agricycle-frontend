"use client";

import Link from "next/link";

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

function badgeClass(status) {
  switch ((status || "").toUpperCase()) {
    case "ACCEPTED":
      return "bg-emerald-100 text-emerald-800";
    case "REJECTED":
      return "bg-red-100 text-red-700";
    case "PENDING":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-neutral-100 text-neutral-700";
  }
}

export default function RequestCard({ request, onStatusChange, actionLoading = false, showDetailsLink = true }) {
  const wasteType = request.listing_waste_type || request.waste_type || "Order Request";
  const location = request.listing_location || request.location || "Location pending";
  const quantity = request.quantity_requested ?? request.quantity ?? "-";
  const proposedPrice = request.proposed_price ?? request.price ?? "-";
  const note = request.message || request.notes || request.description || "";
  const status = request.status || "PENDING";
  const unit = request.listing_unit || request.unit || "unit";
  const numericQuantity = Number(quantity);
  const numericUnitPrice = Number(proposedPrice);
  const totalCost = Number.isFinite(numericQuantity) && Number.isFinite(numericUnitPrice) ? numericQuantity * numericUnitPrice : null;

  return (
    <article className="rounded-2xl border border-[var(--line)] bg-[var(--card)] p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Order Request</p>
          <h3 className="mt-1 break-words text-xl font-semibold text-[var(--brand-strong)]">{wasteType}</h3>
          <p className="mt-1 text-sm text-neutral-600">{location}</p>
        </div>
        <span className={["inline-flex rounded-full px-3 py-1 text-xs font-semibold", badgeClass(status)].join(" ")}>
          {status}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Requested Quantity</p>
          <p className="mt-1 text-base font-semibold text-neutral-900">
            {formatQty(quantity)} {unit}
          </p>
        </div>
        <div className="rounded-xl bg-white px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Price Per {unit}</p>
          <p className="mt-1 text-base font-semibold text-neutral-900">KES {formatMoney(proposedPrice)}</p>
        </div>
      </div>

      {totalCost !== null && (
        <p className="mt-3 text-sm font-semibold text-neutral-800">
          Estimated total: KES {formatMoney(totalCost)}
        </p>
      )}

      {note && <p className="mt-4 text-sm leading-6 text-neutral-700">{note}</p>}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {showDetailsLink && (
          <Link
            href={`/orders/${request.id}`}
            className="rounded-xl border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold text-neutral-900"
          >
            View Details
          </Link>
        )}

        {onStatusChange && status === "PENDING" && (
          <button
            type="button"
            onClick={() => onStatusChange(request.id, "ACCEPTED")}
            disabled={actionLoading}
            className="rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {actionLoading ? "Updating..." : "Accept"}
          </button>
        )}

        {onStatusChange && status === "PENDING" && (
          <button
            type="button"
            onClick={() => onStatusChange(request.id, "REJECTED")}
            disabled={actionLoading}
            className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {actionLoading ? "Updating..." : "Reject"}
          </button>
        )}
      </div>
    </article>
  );
}
