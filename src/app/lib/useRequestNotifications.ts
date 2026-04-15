"use client";

import { useEffect, useState } from "react";
import { useAuthState } from "@/app/lib/useAuthState";
import { getIncomingRequests, getMyRequests } from "@/app/lib/orders";

export function useRequestNotifications() {
  const { accessToken, role } = useAuthState();
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!accessToken) return;

    let mounted = true;

    const load = async () => {
      try {
        if (role === "FARMER") {
          const data = await getIncomingRequests();
          if (!mounted) return;
          const list = Array.isArray(data) ? data : [];
          setCount(list.filter((item) => (item.status || "PENDING") === "PENDING").length);
          return;
        }

        if (role === "PROCESSOR") {
          const data = await getMyRequests();
          if (!mounted) return;
          const list = Array.isArray(data) ? data : [];
          setCount(list.filter((item) => item.status === "ACCEPTED").length);
          return;
        }

        setCount(0);
      } catch {
        if (mounted) setCount(0);
      }
    };

    void load();
    const interval = window.setInterval(() => {
      void load();
    }, 30000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, [accessToken, role]);

  return accessToken ? count : 0;
}
