"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { clearTokens } from "@/app/lib/auth";
import { useAuthState } from "@/app/lib/useAuthState";
import { useRequestNotifications } from "@/app/lib/useRequestNotifications";

function NavLink({ href, label, badgeCount = 0 }: { href: string; label: string; badgeCount?: number }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link href={href} className={`rounded-full border px-4 py-2 text-sm transition-colors ${isActive ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--line)] bg-white text-neutral-900"}`}>
      <span className="inline-flex items-center gap-2">
        <span>{label}</span>
        {badgeCount > 0 && (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {badgeCount}
          </span>
        )}
      </span>
    </Link>
  );
}

export default function MainHeaderNav() {
  const router = useRouter();
  const { accessToken, role } = useAuthState();
  const isFarmer = role === "FARMER";
  const isProcessor = role === "PROCESSOR";
  const isAdmin = role === "ADMIN";
  const notificationCount = useRequestNotifications();
  const primaryHref = isFarmer ? "/my-listings" : isProcessor ? "/orders/my" : null;
  const primaryLabel = isFarmer ? "My Listings" : isProcessor ? "My Requests" : null;

  function handleLogout() {
    clearTokens();
    router.replace("/login");
  }

  return (
    <nav className="hidden items-center gap-2 md:flex">
      <NavLink href="/listings" label="Listings" />
      {primaryHref && primaryLabel && <NavLink href={primaryHref} label={primaryLabel} badgeCount={notificationCount} />}
      {(isFarmer || isProcessor) && <NavLink href="/reports" label="Reports" />}
      <NavLink href="/help" label="Help" />
      {isAdmin && (
        <Link href="/admin" className="rounded-full border border-violet-200 bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700">
          Admin Panel
        </Link>
      )}
      {isFarmer && (
        <Link href="/listings/new" className="rounded-full bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white">
          New Listing
        </Link>
      )}
      {!accessToken && (
        <Link href="/login" className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm">
          Account
        </Link>
      )}
      {accessToken && (
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-full border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700"
        >
          Logout
        </button>
      )}
    </nav>
  );
}
