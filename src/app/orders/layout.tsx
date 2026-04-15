import BottomNav from "@/app/components/BottomNav";
import HeaderIdentity from "@/app/components/HeaderIdentity";
import MainHeaderNav from "@/app/components/MainHeaderNav";

export default function OrdersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen pb-16 md:pb-0">
      <header className="border-b border-[var(--line)]/90 bg-[var(--surface)]/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">AgriCycle</p>
            <HeaderIdentity />
          </div>
          <MainHeaderNav />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8 lg:py-8">{children}</div>
      <BottomNav />
    </div>
  );
}
