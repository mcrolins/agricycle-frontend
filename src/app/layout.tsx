import type { Metadata } from "next";
import PageRestoreHandler from "@/app/components/PageRestoreHandler";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgriCycle | Farmers Marketplace",
  description: "Marketplace connecting farmers, buyers, and contractors.",
  themeColor: "#16a34a",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen bg-[var(--background)] text-[var(--foreground)] antialiased">
        <PageRestoreHandler />
        <main className="min-h-screen w-full bg-[var(--surface)] relative overflow-x-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
