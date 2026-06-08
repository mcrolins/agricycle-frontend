import Link from "next/link";
import { absUrl } from "@/app/lib/api";
import type { ListingListItem } from "@/app/lib/types";

function formatQty(value: string | number | null | undefined) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value ?? "-");
  return numeric.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

const CATEGORY_LABELS: Record<string, string> = {
  FRESH_PRODUCE: "Fresh Produce",
  ANIMAL_PRODUCE: "Animal Produce",
  FARM_WASTE: "Farm Waste",
  AGRI_INPUTS: "Agri Inputs",
  EQUIPMENT: "Equipment",
};

export default function ListingCard({ item }: { item: ListingListItem }) {
  const img = item.primary_image?.image;
  const hasRemainingQuantity = typeof item.remaining_quantity === "number" && Number.isFinite(item.remaining_quantity);
  const displayQuantity = hasRemainingQuantity ? item.remaining_quantity : Number(item.quantity);

  return (
    <Link
      href={`/listings/${item.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--card)] shadow-sm transition-all hover:shadow-lg hover:-translate-y-1 w-full h-full"
    >
      {/* Image Container - Full Width */}
      <div className="relative w-full aspect-[4/3] bg-[var(--surface-strong)] overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={absUrl(img)} alt={item.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-slate-400 font-medium">No image</div>
        )}
        {item.listing_type === "RENTAL" && (
          <span className="absolute top-2 right-2 rounded-lg bg-amber-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
            Rent
          </span>
        )}
        {item.listing_type === "SALE" && (
          <span className="absolute top-2 right-2 rounded-lg bg-green-600 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-sm">
            Sale
          </span>
        )}
      </div>

      {/* Content Container */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <span className="inline-block rounded-full bg-[var(--brand-soft)] px-2 py-0.5 text-[11px] font-semibold text-[var(--brand-strong)] shrink-0">
            {CATEGORY_LABELS[item.category] || item.category_display || item.category}
          </span>
        </div>

        <h3 className="text-[15px] font-semibold leading-snug text-[var(--foreground)] mb-2" title={item.title}>
          {item.title}
        </h3>

        <div className="flex flex-col gap-1 mb-3 text-xs text-slate-500">
          <div className="flex items-start gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0 text-slate-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="break-words">{item.location}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 flex-shrink-0 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="break-words">@{item.farmer_username}</span>
          </div>
        </div>

        <div className="mt-auto flex items-end justify-between gap-2 pt-3 border-t border-slate-100">
          <p className="text-base font-bold text-[var(--accent)]">
            {item.price ? `KES ${Number(item.price).toLocaleString()}` : "Price TBD"}
            {item.rental_period && <span className="text-[11px] font-normal text-slate-500 ml-1">/ {item.rental_period.replace('PER_', '').toLowerCase()}</span>}
          </p>
          <span className="text-xs font-semibold text-slate-600 text-right">
            {formatQty(displayQuantity)} <span className="text-[11px] font-normal text-slate-400">{item.unit}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
