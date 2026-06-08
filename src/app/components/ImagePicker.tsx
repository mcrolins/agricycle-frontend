"use client";

import { useRef, useState } from "react";

export default function ImagePicker({ onPick }: { onPick: (files: File[]) => void }) {
  const ref = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  function pickFiles(fileList: FileList | File[] | null | undefined) {
    if (!fileList) return;
    const files = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
    if (files.length > 0) {
      onPick(files);
    }
    if (ref.current) ref.current.value = "";
  }

  return (
    <div
      className={[
        "rounded-2xl border-2 border-dashed bg-white p-5 transition text-center",
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
        pickFiles(event.dataTransfer.files);
      }}
    >
      <p className="text-sm font-semibold">Add photos</p>
      <p className="mt-1 text-xs text-neutral-500">Drag and drop images here, or choose from your device.</p>

      <input
        ref={ref}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          pickFiles(e.target.files);
        }}
      />

      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="mt-4 w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-neutral-800"
      >
        Choose Images
      </button>
    </div>
  );
}
