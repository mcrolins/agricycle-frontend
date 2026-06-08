"use client";

import { useState } from "react";
import { apiFetch } from "@/app/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthState } from "@/app/lib/useAuthState";
import { kenyaLocationListId, kenyaLocationSuggestions } from "@/app/lib/kenyaLocations";
import ConfirmationModal from "@/app/components/ConfirmationModal";

type CreateListingPayload = {
  title: string;
  description: string;
  category: string;
  quantity: number;
  unit: string;
  location: string;
  price?: number;
  listing_type: string;
  condition?: string;
  rental_period?: string;
  status: string;
};

export default function NewListingPage() {
  const router = useRouter();
  const { accessToken, role } = useAuthState();
  const isFarmer = role === "FARMER";
  const isContractor = role === "CONTRACTOR";
  
  const [form, setForm] = useState({
    title: "",
    description: "",
    category: isContractor ? "EQUIPMENT" : "FRESH_PRODUCE",
    quantity: "",
    unit: "kg",
    location: "",
    price: "",
    listing_type: isContractor ? "RENTAL" : "SALE",
    condition: "NEW",
    rental_period: "PER_DAY",
    status: "OPEN",
  });
  
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [createdListingId, setCreatedListingId] = useState<number | null>(null);

  function update(k: string, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isFarmer && !isContractor) {
      setErr("Only FARMER and CONTRACTOR accounts can create listings.");
      return;
    }
    
    if (isContractor && form.category !== "EQUIPMENT") {
      setErr("Contractors can only list equipment.");
      return;
    }

    setErr(null);
    setLoading(true);

    try {
      const payload: CreateListingPayload = {
        title: form.title,
        description: form.description,
        category: form.category,
        quantity: Number(form.quantity),
        unit: form.unit,
        location: form.location,
        listing_type: form.listing_type,
        status: form.status,
      };
      
      if (form.price) payload.price = Number(form.price);
      if (form.category === "EQUIPMENT") payload.condition = form.condition;
      if (form.listing_type === "RENTAL") payload.rental_period = form.rental_period;

      const created = await apiFetch<{ id: number }>("/api/v1/listings/", {
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
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[var(--foreground)]">Create Listing</h1>
        <p className="mt-2 text-sm text-slate-600">
          Please <Link href="/login" className="font-bold text-[var(--brand)] underline">log in</Link> as a seller.
        </p>
      </div>
    );
  }

  if (!isFarmer && !isContractor) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-xl font-bold text-[var(--foreground)]">Access Denied</h1>
        <p className="mt-2 text-sm text-slate-600">This page is only available to FARMER and CONTRACTOR accounts.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-24 p-4">
      <div className="bg-[var(--surface)] p-4 rounded-xl border border-[var(--line)] shadow-sm">
        <h1 className="text-2xl font-bold text-[var(--brand-strong)]">Sell an Item</h1>
        <p className="text-sm text-slate-600 mt-1">List your produce, equipment or waste to millions of buyers.</p>
      </div>

      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700 shadow-sm">{err}</div>}

      <form onSubmit={onSubmit} className="space-y-5 rounded-2xl border bg-white p-5 shadow-sm">
        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Title</label>
          <input required className="w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--brand)] outline-none transition-all bg-slate-50 focus:bg-white" placeholder="What are you selling?"
            value={form.title} onChange={(e) => update("title", e.target.value)} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Category</label>
            <select className="w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--brand)] outline-none bg-slate-50 focus:bg-white"
              value={form.category} onChange={(e) => update("category", e.target.value)} disabled={isContractor}>
              {!isContractor && <option value="FRESH_PRODUCE">Fresh Produce</option>}
              {!isContractor && <option value="ANIMAL_PRODUCE">Animal Produce</option>}
              {!isContractor && <option value="FARM_WASTE">Farm Waste</option>}
              {!isContractor && <option value="AGRI_INPUTS">Agri Inputs</option>}
              <option value="EQUIPMENT">Equipment</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Listing Type</label>
            <select className="w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--brand)] outline-none bg-slate-50 focus:bg-white"
              value={form.listing_type} onChange={(e) => update("listing_type", e.target.value)}>
              <option value="SALE">For Sale</option>
              <option value="RENTAL">For Rent</option>
            </select>
          </div>
        </div>

        {form.category === "EQUIPMENT" && (
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Condition</label>
            <select className="w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--brand)] outline-none bg-slate-50 focus:bg-white"
              value={form.condition} onChange={(e) => update("condition", e.target.value)}>
              <option value="NEW">New</option>
              <option value="USED">Used</option>
              <option value="REFURBISHED">Refurbished</option>
            </select>
          </div>
        )}

        <div className="grid grid-cols-3 gap-3">
          <div className="col-span-2">
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Quantity</label>
            <input required min="0.01" step="any" type="number" className="w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--brand)] outline-none bg-slate-50 focus:bg-white" placeholder="Amount"
              value={form.quantity} onChange={(e) => update("quantity", e.target.value)} />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Unit</label>
            <select className="w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--brand)] outline-none bg-slate-50 focus:bg-white"
              value={form.unit} onChange={(e) => update("unit", e.target.value)}>
              <option value="kg">kg</option>
              <option value="bags">bags</option>
              <option value="tons">tons</option>
              <option value="items">items</option>
              <option value="units">units</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Location</label>
          <input required className="w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--brand)] outline-none bg-slate-50 focus:bg-white" placeholder="County / Town" list={kenyaLocationListId}
            value={form.location} onChange={(e) => update("location", e.target.value)} />
          <datalist id={kenyaLocationListId}>
            {kenyaLocationSuggestions.map((loc) => <option key={loc} value={loc} />)}
          </datalist>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Price (KES)</label>
            <input type="number" min="0" step="any" className="w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--brand)] outline-none bg-slate-50 focus:bg-white" placeholder="Optional"
              value={form.price} onChange={(e) => update("price", e.target.value)} />
          </div>
          
          {form.listing_type === "RENTAL" && (
            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Rental Period</label>
              <select className="w-full rounded-xl border px-4 py-3 text-sm focus:ring-2 focus:ring-[var(--brand)] outline-none bg-slate-50 focus:bg-white"
                value={form.rental_period} onChange={(e) => update("rental_period", e.target.value)}>
                <option value="PER_DAY">Per Day</option>
                <option value="PER_WEEK">Per Week</option>
                <option value="PER_MONTH">Per Month</option>
              </select>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-bold uppercase text-slate-600 mb-1">Description</label>
          <textarea className="w-full rounded-xl border px-4 py-3 text-sm h-24 focus:ring-2 focus:ring-[var(--brand)] outline-none bg-slate-50 focus:bg-white" placeholder="Add more details..."
            value={form.description} onChange={(e) => update("description", e.target.value)} />
        </div>

        <button disabled={loading} className="w-full rounded-full bg-[var(--accent)] px-4 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-[var(--accent-strong)] disabled:opacity-60 transition-colors">
          {loading ? "Publishing..." : "Publish Listing"}
        </button>
      </form>

      <ConfirmationModal
        open={createdListingId != null}
        title="Listing Published!"
        message="Your listing is now live on the marketplace. You can upload photos next."
        confirmLabel="View Listing"
        variant="success"
        showCancel={false}
        autoCloseMs={3000}
        onConfirm={() => { if (createdListingId) router.push(`/listings/${createdListingId}/upload`); }}
        onAutoClose={() => { if (createdListingId) router.push(`/listings/${createdListingId}/upload`); }}
        onCancel={() => { if (createdListingId) router.push(`/listings/${createdListingId}/upload`); }}
      />
    </div>
  );
}
