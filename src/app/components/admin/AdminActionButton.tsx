"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";

type AdminActionButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: "primary" | "secondary";
};

export default function AdminActionButton({
  children,
  className = "",
  type = "button",
  variant = "secondary",
  ...props
}: AdminActionButtonProps) {
  return (
    <button
      type={type}
      className={[
        "rounded-xl px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary"
          ? "bg-[var(--brand)] text-white shadow-sm hover:bg-[var(--brand-strong)]"
          : "border border-[var(--line)] bg-white text-neutral-800 hover:bg-neutral-50",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
