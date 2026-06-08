"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthState } from "@/app/lib/useAuthState";
import { useRequestNotifications } from "@/app/lib/useRequestNotifications";

function Item({ href, label, badgeCount = 0, icon }: { href: string; label: string; badgeCount?: number; icon: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2 transition-colors ${
        active ? "text-[var(--brand)]" : "text-slate-500 hover:text-slate-900"
      }`}
    >
      <div className={`relative flex h-6 w-6 items-center justify-center transition-transform ${active ? "scale-110" : ""}`}>
        {icon}
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 text-[9px] font-bold text-white shadow-sm ring-2 ring-white">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </div>
      <span className={`text-[10px] font-medium ${active ? "font-bold" : ""}`}>{label}</span>
    </Link>
  );
}

export default function BottomNav() {
  const { accessToken, role } = useAuthState();
  const isFarmer = role === "FARMER";
  const isBuyer = role === "BUYER" || role === "CONTRACTOR";
  const isAdmin = role === "ADMIN";
  const notificationCount = useRequestNotifications();
  const cartItemCount = 0; // Would normally come from state

  const primaryHref = isFarmer ? "/my-listings" : isBuyer ? "/orders/my" : null;
  const primaryLabel = isFarmer ? "Mine" : isBuyer ? "Orders" : "Browse";

  const HomeIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeIconWidth}><path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;
  const CartIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeIconWidth}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
  const SellIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeIconWidth}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>;
  const OrdersIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeIconWidth}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>;
  const ProfileIcon = <svg xmlns="http://www.w3.org/2000/svg" className="h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeIconWidth}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-[var(--line)] bg-white pb-safe md:hidden shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex h-16 w-full max-w-[480px]">
        <Item href="/listings" label="Home" icon={HomeIcon} />
        
        {accessToken && <Item href="/cart" label="Cart" badgeCount={cartItemCount} icon={CartIcon} />}
        
        {(isFarmer || role === "CONTRACTOR") && (
          <div className="relative -top-5 flex flex-1 items-center justify-center">
            <Link
              href="/listings/new"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg ring-4 ring-white transition-transform active:scale-95"
            >
              <div className="h-6 w-6">{SellIcon}</div>
            </Link>
          </div>
        )}
        
        {primaryHref ? (
          <Item href={primaryHref} label={primaryLabel} badgeCount={notificationCount} icon={OrdersIcon} />
        ) : (
          isAdmin && <Item href="/admin" label="Admin" icon={OrdersIcon} />
        )}
        
        <Item href="/profile" label="Profile" icon={ProfileIcon} />
      </div>
    </nav>
  );
}

// Helper to avoid inline strokeWidth logic that can break
const activeIconWidth = 2;
