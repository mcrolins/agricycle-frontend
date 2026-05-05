"use client";

import { useState } from "react";
import { apiFetch } from "@/app/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthState } from "@/app/lib/useAuthState";
import { kenyaLocationListId, kenyaLocationSuggestions } from "@/app/lib/kenyaLocations";
import Tooltip from "@/app/components/Tooltip";
import ConfirmationModal from "@/app/components/ConfirmationModal";

type CreateListingPayload = {
  waste_type: string;
  quantity: number;
  unit: string;
  location: string;
  notes: string;
  status: string;
  price?: number;
};

type CreateListingResponse = {
  id: number;
};

export default function NewListingPage() {
  const router = useRouter();
  const { accessToken, role } = useAuthState();
  const isFarmer = role === "FARMER";
  const [form, setForm] = useState({
    waste_type: "",
    quantity: "",
    unit: "kg",
    location: "",
    price: "",
    notes: "",
    status: "OPEN",
  });
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdListingId, setCreatedListingId] = useState<number | null>(null);
  const [touched, setTouched] = useState({
    quantity: false,
    price: false,
  });

  const quantityValue = Number(form.quantity);
  const quantityEmpty = form.quantity.trim().length === 0;
  const quantityInvalid = !quantityEmpty && (!Number.isFinite(quantityValue) || quantityValue <= 0);
  const quantityError =
    touched.quantity || loading
      ? quantityEmpty
        ? "Quantity is required."
        : quantityInvalid
        ? "Quantity must be greater than 0."
        : null
      : null;
  const priceValue = Number(form.price);
  const priceInvalid = form.price.trim().length > 0 && (!Number.isFinite(priceValue) || priceValue < 0);
  const priceError =
    touched.price || loading
      ? priceInvalid
        ? "Price cannot be negative."
        : null
      : null;

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched({ quantity: true, price: true });
    if (!isFarmer) {
      setErr("Only FARMER accounts can create listings.");
      return;
    }
    if (quantityEmpty || quantityInvalid || priceInvalid) {
      setErr("Fix the highlighted field before creating the listing.");
      return;
    }
    setErr(null);
    setLoading(true);

    try {
      const payload: CreateListingPayload = {
        waste_type: form.waste_type,
        quantity: Number(form.quantity),
        unit: form.unit,
        location: form.location,
        notes: form.notes,
        status: form.status,
      };
      if (form.price) payload.price = Number(form.price);

      const created = await apiFetch<CreateListingResponse>("/api/v1/listings/", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      setCreatedListingId(created.id);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to create listing");
    } finally {
      setLoading(false);
    }
  }

  if (!accessToken) {
    return (
      <div className="rounded-2xl border bg-white p-4">
        <h1 className="text-xl font-bold">Create Listing</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Please{" "}
          <Link href="/login" className="font-semibold underline">
            log in
          </Link>{" "}
          as a farmer to create a listing.
        </p>
      </div>
    );
  }

  if (!isFarmer) {
    return (
      <div className="rounded-2xl border bg-white p-4">
        <h1 className="text-xl font-bold">Create Listing</h1>
        <p className="mt-2 text-sm text-neutral-600">
          This page is only available to FARMER accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Create Listing</h1>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border bg-white p-4">
        <div className="flex gap-2 items-center w-full relative">
          <input required className="w-full rounded-xl border px-3 py-3 text-sm" placeholder="Waste category / type"
            value={form.waste_type} onChange={(e) => update("waste_type", e.target.value)} />
          <Tooltip text="What is waste category? Examples: Crop residue, animal waste, processing by-products. Be specific (e.g., Maize stalks, cow dung).">
            <button type="button" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 hover:bg-neutral-200" aria-label="What is waste category?">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
            </button>
          </Tooltip>
        </div>

        <div className="flex gap-2">
          <div className="w-full">
            <input
              required
              min="0"
              step="any"
              aria-invalid={quantityError ? "true" : "false"}
              className={`w-full rounded-xl border px-3 py-3 text-sm ${quantityError ? "border-red-300 bg-red-50" : ""}`}
              placeholder="Quantity"
              inputMode="decimal"
              value={form.quantity}
              onBlur={() => setTouched((current) => ({ ...current, quantity: true }))}
              onChange={(e) => update("quantity", e.target.value)}
            />
            {quantityError && <p className="mt-1 text-xs text-red-600">{quantityError}</p>}
          </div>
          <select className="w-32 rounded-xl border px-3 py-3 text-sm"
            value={form.unit} onChange={(e) => update("unit", e.target.value)}>
            <option value="kg">kg</option>
            <option value="bags">bags</option>
            <option value="tons">tons</option>
          </select>
        </div>

        <div>
          <input
            required
            className="w-full rounded-xl border px-3 py-3 text-sm"
            placeholder="Search county or enter a custom location"
            list={kenyaLocationListId}
            value={form.location}
            onChange={(e) => update("location", e.target.value)}
          />
          <datalist id={kenyaLocationListId}>
            {kenyaLocationSuggestions.map((location) => (
              <option key={location} value={location} />
            ))}
          </datalist>
          <p className="mt-1 text-xs text-neutral-500">
            Search from all 47 counties and popular locations like `Njoro, Nakuru County`, or type a custom place if it is not listed.
          </p>
        </div>

        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <span className="text-sm font-semibold text-neutral-500">Ksh</span>
          </div>
          <input className={`w-full rounded-xl border py-3 pl-[3.25rem] pr-3 text-sm ${priceError ? "border-red-300 bg-red-50" : ""}`} placeholder="Price (optional)" inputMode="decimal"
            min="0"
            step="any"
            aria-invalid={priceError ? "true" : "false"}
            value={form.price}
            onBlur={() => setTouched((current) => ({ ...current, price: true }))}
            onChange={(e) => update("price", e.target.value)} />
        </div>
        {priceError && <p className="-mt-2 text-xs text-red-600">{priceError}</p>}

        <textarea className="w-full rounded-xl border px-3 py-3 text-sm" placeholder="Notes"
          value={form.notes} onChange={(e) => update("notes", e.target.value)} />

        <select className="w-full rounded-xl border px-3 py-3 text-sm"
          value={form.status} onChange={(e) => update("status", e.target.value)}>
          <option value="OPEN">OPEN</option>
          <option value="REQUESTED">REQUESTED</option>
          <option value="ACCEPTED">ACCEPTED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <button disabled={loading} className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? "Creating..." : "Create Listing"}
        </button>
      </form>
      <ConfirmationModal
        open={createdListingId != null}
        title="Listing created"
        message="Your listing was created successfully and is ready to view."
        confirmLabel="View Listing"
        variant="success"
        showCancel={false}
        autoCloseMs={3000}
        onConfirm={() => {
          if (createdListingId != null) router.push(`/listings/${createdListingId}`);
        }}
        onAutoClose={() => {
          if (createdListingId != null) router.push(`/listings/${createdListingId}`);
        }}
        onCancel={() => {
          if (createdListingId != null) router.push(`/listings/${createdListingId}`);
        }}
      />
    </div>
  );
}
