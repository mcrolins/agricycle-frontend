"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const CATEGORIES = [
  { id: "", label: "All", icon: "🌾" },
  { id: "FRESH_PRODUCE", label: "Fresh", icon: "🍎" },
  { id: "ANIMAL_PRODUCE", label: "Animal", icon: "🥚" },
  { id: "FARM_WASTE", label: "Waste", icon: "🍂" },
  { id: "AGRI_INPUTS", label: "Inputs", icon: "🌱" },
  { id: "EQUIPMENT", label: "Equip", icon: "🚜" },
];

export default function CategoryBar() {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category") || "";

  return (
    <div className="w-full overflow-x-auto bg-[var(--surface)] py-3 px-4 shadow-sm scrollbar-hide border-b border-[var(--line)]">
      <div className="flex gap-4">
        {CATEGORIES.map((cat) => {
          const isActive = currentCategory === cat.id;
          const params = new URLSearchParams(searchParams.toString());
          if (cat.id) {
            params.set("category", cat.id);
          } else {
            params.delete("category");
          }
          const href = `/listings?${params.toString()}`;

          return (
            <Link
              key={cat.label}
              href={href}
              className={`flex flex-col items-center gap-1 min-w-[56px] transition-transform active:scale-95 ${
                isActive ? "opacity-100" : "opacity-70 hover:opacity-100"
              }`}
            >
              <div
                className={`flex h-12 w-12 items-center justify-center rounded-full text-xl shadow-sm transition-colors ${
                  isActive ? "bg-[var(--brand)] text-white" : "bg-[var(--surface-strong)] text-[var(--foreground)]"
                }`}
              >
                {cat.icon}
              </div>
              <span className={`text-[10px] font-semibold tracking-wide ${isActive ? "text-[var(--brand)]" : "text-slate-600"}`}>
                {cat.label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
