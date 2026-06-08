"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { clearTokens } from "@/app/lib/auth";
import { useAuthState } from "@/app/lib/useAuthState";
import { useRequestNotifications } from "@/app/lib/useRequestNotifications";
import UserDropdown from "./UserDropdown";

function NavLink({ href, label, badgeCount = 0, icon }: { href: string; label: string; badgeCount?: number; icon?: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link href={href} className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${isActive ? "bg-[var(--brand-soft)] text-[var(--brand-strong)]" : "text-slate-600 hover:bg-slate-100"}`}>
      {icon}
      <span className="inline-flex items-center gap-2">
        <span>{label}</span>
        {badgeCount > 0 && (
          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-[var(--accent)] px-1.5 py-0.5 text-[10px] font-bold text-white shadow-sm">
            {badgeCount > 99 ? "99+" : badgeCount}
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
  const isBuyer = role === "BUYER" || role === "CONTRACTOR";
  const isAdmin = role === "ADMIN";
  const notificationCount = useRequestNotifications();
  
  // Example cart badge count, would normally come from a cart context/hook
  const cartItemCount = 0; 

  const primaryHref = isFarmer ? "/my-listings" : isBuyer ? "/orders/my" : null;
  const primaryLabel = isFarmer ? "My Listings" : isBuyer ? "My Orders" : null;

  return (
    <nav className="hidden items-center gap-1 md:flex overflow-visible">
      <NavLink href="/listings" label="Marketplace" />
      {primaryHref && primaryLabel && <NavLink href={primaryHref} label={primaryLabel} badgeCount={notificationCount} />}
      
      {accessToken && (
        <NavLink 
          href="/cart" 
          label="Cart" 
          badgeCount={cartItemCount}
          icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
        />
      )}

      {isAdmin && (
        <Link href="/admin" className="rounded-full bg-slate-800 px-4 py-2 text-sm font-semibold text-white ml-2">
          Admin Panel
        </Link>
      )}
      {(isFarmer || role === "CONTRACTOR") && (
        <Link href="/listings/new" className="rounded-full bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow-sm ml-2 transition-transform hover:scale-105">
          Sell Item
        </Link>
      )}

      {!accessToken && (
        <>
          <NavLink href="/help" label="About & Help" />
          <Link href="/login" className="rounded-full border border-[var(--line)] bg-white px-4 py-2 text-sm font-semibold shadow-sm ml-2">
            Login / Sign Up
          </Link>
        </>
      )}

      {accessToken && <UserDropdown />}
    </nav>
  );
}
