"use client";

import { useRef } from "react";

export default function ImagePicker({ onPick }: { onPick: (file: File) => void }) {
  const ref = useRef<HTMLInputElement | null>(null);

  return (
    <div className="rounded-2xl border bg-white p-4">
      <p className="text-sm font-semibold">Add photo</p>
      <p className="mt-1 text-xs text-neutral-500">Upload an image for this listing.</p>

      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onPick(file);
        }}
      />

      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="mt-3 w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white"
      >
        Choose Image
      </button>
    </div>
  );
}