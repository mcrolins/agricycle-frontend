"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/app/lib/api";
import type { WasteListingDetail } from "@/app/lib/types";
import { useAuthState } from "@/app/lib/useAuthState";
import { kenyaLocationListId, kenyaLocationSuggestions } from "@/app/lib/kenyaLocations";

type UpdateListingPayload = {
  waste_type: string;
  quantity: number;
  unit: string;
  location: string;
  notes: string;
  status: string;
  price?: number;
};

export default function EditListingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { accessToken, role, username } = useAuthState();
  const [form, setForm] = useState({
    waste_type: "",
    quantity: "",
    unit: "kg",
    location: "",
    price: "",
    notes: "",
    status: "OPEN",
  });
  const [initialForm, setInitialForm] = useState({
    waste_type: "",
    quantity: "",
    unit: "kg",
    location: "",
    price: "",
    notes: "",
    status: "OPEN",
  });
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const isOwnerFarmer = role === "FARMER" && !!username && ownerUsername === username;

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiFetch<WasteListingDetail>(`/api/v1/listings/${id}/`, { method: "GET" }, { auth: false })
      .then((listing) => {
        if (!mounted) return;
        setOwnerUsername(listing.farmer_username);
        const hydratedForm = {
          waste_type: listing.waste_type ?? "",
          quantity: String(listing.quantity ?? ""),
          unit: listing.unit ?? "kg",
          location: listing.location ?? "",
          price: listing.price ? String(listing.price) : "",
          notes: listing.notes ?? "",
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
    if (!isOwnerFarmer) {
      setErr("Only the listing owner can edit this listing.");
      return;
    }

    setErr(null);
    setSaving(true);
    try {
      const payload: UpdateListingPayload = {
        waste_type: form.waste_type.trim(),
        quantity: Number(form.quantity),
        unit: form.unit,
        location: form.location.trim(),
        notes: form.notes.trim(),
        status: form.status,
      };
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

  if (!isOwnerFarmer) {
    return (
      <div className="rounded-2xl border bg-white p-4">
        <h1 className="text-xl font-bold">Edit Listing</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Only the farmer who created this listing can edit it.
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
          placeholder="Waste type"
          value={form.waste_type}
          onChange={(e) => update("waste_type", e.target.value)}
        />

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
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => update("notes", e.target.value)}
        />

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
