import Link from "next/link";
import { absUrl } from "@/app/lib/api";
import type { WasteListingListItem } from "@/app/lib/types";

type ListingCardItem = WasteListingListItem & {
  effective_status?: string;
  remaining_quantity?: number;
  original_quantity?: number;
};

function formatQty(value: string | number | null | undefined) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value ?? "-");
  return numeric.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function ListingCard({ item }: { item: ListingCardItem }) {
  const img = item.primary_image?.image;
  const displayStatus = item.effective_status || item.status;
  const hasRemainingQuantity = typeof item.remaining_quantity === "number" && Number.isFinite(item.remaining_quantity);
  const displayQuantity = hasRemainingQuantity ? item.remaining_quantity : Number(item.quantity);
  const showOriginalQuantity =
    hasRemainingQuantity &&
    typeof item.original_quantity === "number" &&
    Number.isFinite(item.original_quantity) &&
    item.original_quantity !== item.remaining_quantity;

  return (
    <Link
      href={`/listings/${item.id}`}
      className="group flex h-full gap-3 rounded-2xl border border-[var(--line)] bg-[var(--card)] p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-4"
    >
      <div className="h-20 w-20 overflow-hidden rounded-xl bg-[var(--surface-strong)] sm:h-24 sm:w-24">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={absUrl(img)} alt={item.waste_type} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center px-2 text-center text-xs text-neutral-500">No image</div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="truncate text-base font-semibold leading-tight text-[var(--brand-strong)]">{item.waste_type}</h3>
          <span className="shrink-0 rounded-full bg-[var(--brand-soft)] px-2 py-1 text-[11px] font-semibold text-[var(--brand-strong)]">
            {displayStatus}
          </span>
        </div>

        <p className="mt-1 text-sm text-neutral-700">
          {formatQty(displayQuantity)} {item.unit} · {item.location}
        </p>
        {showOriginalQuantity && (
          <p className="mt-1 text-xs text-neutral-500">
            Originally {formatQty(item.original_quantity)} {item.unit}
          </p>
        )}

        <div className="mt-2 flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--accent)]">{item.price ? `KES ${item.price}` : "Negotiable"}</p>
          <p className="text-xs text-neutral-500">@{item.farmer_username}</p>
        </div>
      </div>
    </Link>
  );
}
