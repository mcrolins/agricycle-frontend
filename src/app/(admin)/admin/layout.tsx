"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuthState } from "@/app/lib/useAuthState";
import { clearTokens } from "@/app/lib/auth";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/users", label: "Users", icon: "👥" },
  { href: "/admin/listings", label: "Listings", icon: "🌾" },
  { href: "/admin/orders", label: "Orders", icon: "📦" },
  { href: "/admin/complaints", label: "Complaints", icon: "⚠️" },
];

function SidebarLink({ href, label, icon }: { href: string; label: string; icon: string }) {
  const pathname = usePathname();
  const isActive = pathname === href || (href !== "/admin" && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={[
        "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-all duration-200",
        isActive
          ? "bg-[var(--brand)] text-white shadow-sm"
          : "text-neutral-700 hover:bg-[var(--brand-soft)] hover:text-[var(--brand-strong)]",
      ].join(" ")}
    >
      <span className="text-base">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { role, username, hydrated } = useAuthState();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (hydrated && role !== "ADMIN") {
      router.replace("/listings");
    }
  }, [hydrated, role, router]);

  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  function handleLogout() {
    clearTokens();
    router.replace("/login");
  }

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-neutral-500">Loading...</p>
      </div>
    );
  }

  if (role !== "ADMIN") {
    return null;
  }

  return (
    <div className="min-h-screen lg:flex">
      {/* Mobile header */}
      <header className="flex items-center justify-between border-b border-[var(--line)]/90 bg-[var(--surface)]/90 px-4 py-3 backdrop-blur lg:hidden">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">AgriCycle</p>
          <p className="text-sm text-neutral-700">Admin Panel</p>
        </div>
        <button
          type="button"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm font-semibold"
        >
          {sidebarOpen ? "✕" : "☰"}
        </button>
      </header>

      {/* Sidebar overlay on mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={[
          "fixed top-0 left-0 z-40 flex h-full w-64 flex-col border-r border-[var(--line)] bg-[var(--surface)] transition-transform duration-300 lg:static lg:z-auto lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}
      >
        {/* Sidebar header */}
        <div className="border-b border-[var(--line)]/60 px-5 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">AgriCycle</p>
          <h2 className="mt-1 text-lg font-bold text-[var(--brand-strong)]">Admin Panel</h2>
        </div>

        {/* Nav links */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {navItems.map((item) => (
            <SidebarLink key={item.href} {...item} />
          ))}
        </nav>

        {/* User info */}
        <div className="border-t border-[var(--line)]/60 px-4 py-4">
          <div className="rounded-xl bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Signed in as</p>
            <p className="mt-1 text-sm font-semibold text-neutral-900">{username || "admin"}</p>
          </div>
          <div className="mt-2 flex gap-2">
            <Link
              href="/listings"
              className="flex-1 rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-center text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50"
            >
              View Site
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex-1 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-700 transition hover:bg-red-100"
            >
              Logout
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-x-hidden">
        <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}
