"use client";

import { useRef, useState } from "react";

export default function ImagePicker({ onPick }: { onPick: (file: File) => void }) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function pickFile(file: File | undefined) {
    if (!file || !file.type.startsWith("image/")) return;
    onPick(file);
    if (ref.current) ref.current.value = "";
  }

  return (
    <div
      className={[
        "rounded-2xl border-2 border-dashed bg-white p-5 transition",
        isDragging ? "border-[var(--brand)] bg-[var(--brand-soft)]/30" : "border-[var(--line)]",
      ].join(" ")}
      onDragEnter={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragOver={(event) => {
        event.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
        setIsDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        pickFile(event.dataTransfer.files?.[0]);
      }}
    >
      <p className="text-sm font-semibold">Add photo</p>
      <p className="mt-1 text-xs text-neutral-500">Drag and drop an image here, or choose one from your device.</p>

      <input
        ref={ref}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          pickFile(e.target.files?.[0]);
        }}
      />

      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="mt-4 w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
      >
        Choose Image
      </button>
    </div>
  );
}
