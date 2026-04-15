"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { AUTH_CHANGE_EVENT, getAccessToken, getCurrentRole, getCurrentUsername, inferCurrentRole } from "@/app/lib/auth";

type AuthState = {
  accessToken: string | null;
  role: string | null;
  username: string | null;
  hydrated: boolean;
};

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  const handleChange = () => onStoreChange();

  window.addEventListener("storage", handleChange);
  window.addEventListener(AUTH_CHANGE_EVENT, handleChange);
  window.addEventListener("pageshow", handleChange);
  window.addEventListener("focus", handleChange);
  document.addEventListener("visibilitychange", handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(AUTH_CHANGE_EVENT, handleChange);
    window.removeEventListener("pageshow", handleChange);
    window.removeEventListener("focus", handleChange);
    document.removeEventListener("visibilitychange", handleChange);
  };
}

export function useAuthState(): AuthState {
  const hydrated = useSyncExternalStore(subscribe, () => true, () => false);
  const accessToken = useSyncExternalStore(subscribe, getAccessToken, () => null);
  const storedRole = useSyncExternalStore(subscribe, getCurrentRole, () => null);
  const username = useSyncExternalStore(subscribe, getCurrentUsername, () => null);
  const [inferredRole, setInferredRole] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken || storedRole) return;

    let active = true;

    inferCurrentRole().then((role) => {
      if (!active) return;
      setInferredRole(role);
    });

    return () => {
      active = false;
    };
  }, [accessToken, storedRole]);

  return { accessToken, role: storedRole ?? (accessToken ? inferredRole : null), username, hydrated };
}
