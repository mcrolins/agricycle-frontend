"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthState } from "@/app/lib/useAuthState";

export default function OrdersIndexPage() {
  const router = useRouter();
  const { accessToken, hydrated, role } = useAuthState();

  useEffect(() => {
    if (!hydrated) return;

    if (!accessToken) {
      router.replace("/login");
      return;
    }

    if (role === "FARMER") {
      router.replace("/orders/incoming");
      return;
    }

    if (role === "PROCESSOR") {
      router.replace("/orders/my");
      return;
    }

    router.replace("/listings");
  }, [accessToken, hydrated, role, router]);

  return <p className="text-sm text-neutral-500">Opening orders...</p>;
}
