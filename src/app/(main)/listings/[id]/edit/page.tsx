"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/app/lib/api";
import type { ListingDetail } from "@/app/lib/types";
import { useAuthState } from "@/app/lib/useAuthState";
import { kenyaLocationListId, kenyaLocationSuggestions } from "@/app/lib/kenyaLocations";

type UpdateListingPayload = {
  title: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  status: string;
  listing_type: string;
  condition?: string;
  rental_period?: string;
  price?: number;
};

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { accessToken, role, username } = useAuthState();
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: "FRESH_PRODUCE",
    quantity: "",
    unit: "kg",
    location: "",
    price: "",
    listing_type: "SALE",
    condition: "NEW",
    rental_period: "PER_DAY",
    status: "OPEN",
  });
  const [initialForm, setInitialForm] = useState({
    title: "",
    description: "",
    category: "FRESH_PRODUCE",
    quantity: "",
    unit: "kg",
    location: "",
    price: "",
    listing_type: "SALE",
    condition: "NEW",
    rental_period: "PER_DAY",
    status: "OPEN",
  });
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isOwnerSeller = (role === "FARMER" || role === "CONTRACTOR") && !!username && ownerUsername === username;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiFetch<ListingDetail>(`/api/v1/listings/${id}/`, { method: "GET" }, { auth: false })
      .then((listing) => {
        if (!mounted) return;
        setOwnerUsername(listing.farmer_username);
        const hydratedForm = {
          title: listing.title ?? "",
          description: listing.description ?? "",
          category: listing.category ?? "FRESH_PRODUCE",
          quantity: String(listing.quantity ?? ""),
          unit: listing.unit ?? "kg",
          location: listing.location ?? "",
          price: listing.price ? String(listing.price) : "",
          listing_type: listing.listing_type ?? "SALE",
          condition: listing.condition ?? "NEW",
          rental_period: listing.rental_period ?? "PER_DAY",
          status: listing.status ?? "OPEN",
        };
        setForm(hydratedForm);
        setInitialForm(hydratedForm);
      })
      .catch((e: unknown) => mounted && setErr(e instanceof Error ? e.message : "Failed to load listing"))
      .finally(() => mounted && setLoading(false));

    return () => {
      mounted = false;
    };
  }, [id]);

  function update(k: keyof typeof form, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  function discardChanges() {
    setErr(null);
    setForm(initialForm);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isOwnerSeller) {
      setErr("Only the listing owner can edit this listing.");
      return;
    }

    setErr(null);
    setSaving(true);
    try {
      const payload: UpdateListingPayload = {
        title: form.title.trim(),
        description: form.description.trim(),
        category: form.category,
        quantity: Number(form.quantity),
        unit: form.unit,
        location: form.location.trim(),
        status: form.status,
        listing_type: form.listing_type,
      };
      if (form.category === "EQUIPMENT") payload.condition = form.condition;
      if (form.listing_type === "RENTAL") payload.rental_period = form.rental_period;
      if (form.price.trim()) payload.price = Number(form.price);

      const endpoints = [`/api/v1/listings/${id}/`, `/api/v1/listings/${id}`];
      let saved = false;
      let lastErr: Error | null = null;

      for (const endpoint of endpoints) {
        try {
          await apiFetch(endpoint, {
            method: "PATCH",
            body: JSON.stringify(payload),
          });
          saved = true;
          break;
        } catch (e: unknown) {
          if (e instanceof Error && e.message.includes("404")) {
            lastErr = e;
            continue;
          }
          throw e;
        }
      }
      if (!saved) throw lastErr ?? new Error("Update endpoint not found.");

      router.push(`/listings/${id}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Failed to update listing");
    } finally {
      setSaving(false);
    }
  }

  if (!accessToken) {
    return (
      <div className="rounded-2xl border bg-white p-4">
        <h1 className="text-xl font-bold">Edit Listing</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Please{" "}
          <Link href="/login" className="font-semibold underline">
            log in
          </Link>{" "}
          as the listing owner.
        </p>
      </div>
    );
  }

  if (loading) return <p className="text-sm text-neutral-500">Loading listing...</p>;

  if (!isOwnerSeller) {
    return (
      <div className="rounded-2xl border bg-white p-4">
        <h1 className="text-xl font-bold">Edit Listing</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Only the seller who created this listing can edit it.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Edit Listing</h1>
      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

      <form onSubmit={onSubmit} className="space-y-3 rounded-2xl border bg-white p-4">
        <input
          className="w-full rounded-xl border px-3 py-3 text-sm"
          placeholder="Title"
          value={form.title}
          onChange={(e) => update("title", e.target.value)}
        />

        <div className="grid gap-2 sm:grid-cols-2">
          <select className="w-full rounded-xl border px-3 py-3 text-sm" value={form.category} onChange={(e) => update("category", e.target.value)} disabled={role === "CONTRACTOR"}>
            <option value="FRESH_PRODUCE">Fresh Produce</option>
            <option value="ANIMAL_PRODUCE">Animal Produce</option>
            <option value="FARM_WASTE">Farm Waste</option>
            <option value="AGRI_INPUTS">Agri Inputs</option>
            <option value="EQUIPMENT">Equipment</option>
          </select>
          <select className="w-full rounded-xl border px-3 py-3 text-sm" value={form.listing_type} onChange={(e) => update("listing_type", e.target.value)}>
            <option value="SALE">For Sale</option>
            <option value="RENTAL">For Rent</option>
          </select>
        </div>

        {form.category === "EQUIPMENT" && (
          <select className="w-full rounded-xl border px-3 py-3 text-sm" value={form.condition} onChange={(e) => update("condition", e.target.value)}>
            <option value="NEW">New</option>
            <option value="USED">Used</option>
            <option value="REFURBISHED">Refurbished</option>
          </select>
        )}

        <div className="flex gap-2">
          <input
            className="w-full rounded-xl border px-3 py-3 text-sm"
            placeholder="Quantity"
            inputMode="decimal"
            value={form.quantity}
            onChange={(e) => update("quantity", e.target.value)}
          />
          <select className="w-32 rounded-xl border px-3 py-3 text-sm" value={form.unit} onChange={(e) => update("unit", e.target.value)}>
            <option value="kg">kg</option>
            <option value="bags">bags</option>
            <option value="tons">tons</option>
          </select>
        </div>

        <div>
          <input
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

        <input
          className="w-full rounded-xl border px-3 py-3 text-sm"
          placeholder="Price (optional)"
          value={form.price}
          onChange={(e) => update("price", e.target.value)}
        />

        <textarea
          className="w-full rounded-xl border px-3 py-3 text-sm"
          placeholder="Description"
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
        />

        {form.listing_type === "RENTAL" && (
          <select className="w-full rounded-xl border px-3 py-3 text-sm" value={form.rental_period} onChange={(e) => update("rental_period", e.target.value)}>
            <option value="PER_DAY">Per Day</option>
            <option value="PER_WEEK">Per Week</option>
            <option value="PER_MONTH">Per Month</option>
          </select>
        )}

        <select className="w-full rounded-xl border px-3 py-3 text-sm" value={form.status} onChange={(e) => update("status", e.target.value)}>
          <option value="OPEN">OPEN</option>
          <option value="REQUESTED">REQUESTED</option>
          <option value="ACCEPTED">ACCEPTED</option>
          <option value="COMPLETED">COMPLETED</option>
          <option value="CANCELLED">CANCELLED</option>
        </select>

        <div className="grid gap-2 sm:grid-cols-2">
          <button
            disabled={saving}
            className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={discardChanges}
            disabled={saving}
            className="w-full rounded-xl border px-4 py-3 text-sm font-semibold disabled:opacity-60"
          >
            Discard Changes
          </button>
        </div>
      </form>
    </div>
  );
}
