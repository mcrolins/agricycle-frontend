import BottomNav from "@/app/components/BottomNav";
import MainHeaderNav from "@/app/components/MainHeaderNav";
import Link from "next/link";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen relative">
      <header className="sticky top-0 z-40 w-full bg-[var(--brand)] text-white shadow-sm md:bg-white md:text-[var(--foreground)] md:border-b md:border-[var(--line)]">
        <div className="flex min-h-[56px] items-center justify-between px-4 md:px-6 w-full gap-3">
          <Link href="/listings" className="flex items-center justify-center flex-shrink-0" aria-label="Home">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 md:h-8 md:w-8" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.5S2 11.5 2 13.5s1.75 3.75 1.75 3.75C7 8 17 8 17 8z"/>
            </svg>
          </Link>
          <div className="flex-1 flex justify-end">
            <MainHeaderNav />
          </div>
        </div>
      </header>

      <div className="w-full h-full pb-safe">{children}</div>
      <BottomNav />
    </div>
  );
}
