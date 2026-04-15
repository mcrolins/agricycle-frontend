"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearTokens } from "@/app/lib/auth";
import { useAuthState } from "@/app/lib/useAuthState";
import { useRequestNotifications } from "@/app/lib/useRequestNotifications";

function Item({ href, label, badgeCount = 0 }: { href: string; label: string; badgeCount?: number }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={[
        "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs",
        active ? "text-neutral-900" : "text-neutral-500",
      ].join(" ")}
    >
      <span className={["h-1 w-6 rounded-full", active ? "bg-neutral-900" : "bg-transparent"].join(" ")} />
      <span className="inline-flex items-center gap-1">
        <span>{label}</span>
        {badgeCount > 0 && <span className="rounded-full bg-red-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">{badgeCount}</span>}
      </span>
    </Link>
  );
}

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { accessToken, role } = useAuthState();
  const isFarmer = role === "FARMER";
  const isProcessor = role === "PROCESSOR";
  const isAdmin = role === "ADMIN";
  const notificationCount = useRequestNotifications();
  const browseLabel = isFarmer ? "My" : "Browse";
  const primaryHref = isFarmer ? "/my-listings" : isProcessor ? "/orders/my" : null;
  const primaryLabel = isFarmer ? "Mine" : isProcessor ? "Requests" : browseLabel;

  function handleLogout() {
    clearTokens();
    router.replace("/login");
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 border-t border-[var(--line)] bg-[var(--surface)]/95 backdrop-blur md:hidden">
      <div className="mx-auto flex w-full max-w-6xl">
        <Item href="/listings" label="Home" />
        {isFarmer && <Item href="/listings/new" label="+" />}
        {isAdmin && <Item href="/admin" label="Admin" />}
        {primaryHref ? <Item href={primaryHref} label={primaryLabel} badgeCount={notificationCount} /> : <Item href="/listings" label={browseLabel} />}
        {(isFarmer || isProcessor) && <Item href="/reports" label="Reports" />}
        {accessToken ? (
          <button
            type="button"
            onClick={handleLogout}
            className={[
              "flex flex-1 flex-col items-center justify-center gap-1 py-2 text-xs",
              pathname === "/login" ? "text-neutral-900" : "text-neutral-500",
            ].join(" ")}
          >
            <span className="h-1 w-6 rounded-full bg-transparent" />
            <span>Logout</span>
          </button>
        ) : (
          <Item href="/login" label="Profile" />
        )}
      </div>
    </nav>
  );
}
