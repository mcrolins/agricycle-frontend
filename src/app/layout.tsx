import type { Metadata } from "next";
import PageRestoreHandler from "@/app/components/PageRestoreHandler";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agricycle",
  description: "Marketplace connecting farmers and recyclers",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        <PageRestoreHandler />
        <main className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
