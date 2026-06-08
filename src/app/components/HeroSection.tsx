import Link from "next/link";

export default function HeroSection() {
  return (
    <div className="relative w-full bg-[var(--brand)] px-4 py-6 text-white overflow-hidden shadow-sm">
      <div className="absolute top-0 right-0 -mt-10 -mr-10 h-40 w-40 rounded-full bg-white opacity-10 blur-2xl"></div>
      <div className="absolute bottom-0 left-0 -mb-10 -ml-10 h-32 w-32 rounded-full bg-white opacity-10 blur-xl"></div>
      
      <div className="relative z-10 flex flex-col items-start gap-3">
        <h1 className="text-2xl font-bold leading-tight">
          AgriCycle <br />
          <span className="text-yellow-300">Farmers Market</span>
        </h1>
        <p className="text-sm font-medium opacity-90 max-w-[80%]">
          Buy & sell fresh produce, waste, and inputs directly from farmers.
        </p>
        <Link 
          href="/listings/new"
          className="mt-2 inline-block rounded-full bg-[var(--accent)] px-5 py-2 text-sm font-bold text-white shadow transition-transform active:scale-95 hover:bg-[var(--accent-strong)]"
        >
          Start Selling
        </Link>
      </div>
    </div>
  );
}
