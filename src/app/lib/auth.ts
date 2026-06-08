const ACCESS_KEY = "agricycle_access";
const REFRESH_KEY = "agricycle_refresh";
const ROLE_KEY = "agricycle_role";
const USERNAME_KEY = "agricycle_username";
export const AUTH_CHANGE_EVENT = "agricycle-auth-change";
const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

function joinApiUrl(base: string, path: string) {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedBase.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${normalizedBase}${normalizedPath.slice(4)}`;
  }

  return `${normalizedBase}${normalizedPath}`;
}

function notifyAuthChange() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_KEY);
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function extractRole(payload: Record<string, unknown> | null) {
  if (!payload) return null;

  const nestedUser =
    payload.user && typeof payload.user === "object" ? (payload.user as Record<string, unknown>) : null;

  const candidate =
    payload.role ??
    payload.user_role ??
    payload.userRole ??
    payload.account_role ??
    payload.accountRole ??
    payload.user_type ??
    payload.userType ??
    payload.account_type ??
    payload.accountType ??
    payload.type ??
    (Array.isArray(payload.roles) ? payload.roles[0] : null) ??
    (Array.isArray(payload.groups) ? payload.groups[0] : null) ??
    nestedUser?.role ??
    nestedUser?.user_role ??
    nestedUser?.userRole ??
    nestedUser?.account_role ??
    nestedUser?.accountRole ??
    nestedUser?.user_type ??
    nestedUser?.userType ??
    nestedUser?.account_type ??
    nestedUser?.accountType ??
    nestedUser?.type;

  return typeof candidate === "string" ? candidate.toUpperCase() : null;
}

function extractUsername(payload: Record<string, unknown> | null) {
  if (!payload) return null;
  const username =
    payload.username ??
    payload.user_name ??
    (payload.user && typeof payload.user === "object" ? (payload.user as Record<string, unknown>).username : null);
  return typeof username === "string" ? username : null;
}

function getStoredRole() {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem(ROLE_KEY);
  return typeof role === "string" ? role.toUpperCase() : null;
}

export function setCurrentRole(role: string | null, notify = true) {
  if (typeof window === "undefined") return;
  if (!role) {
    localStorage.removeItem(ROLE_KEY);
    if (notify) notifyAuthChange();
    return;
  }
  localStorage.setItem(ROLE_KEY, role.toUpperCase());
  if (notify) notifyAuthChange();
}

export function setCurrentUsername(username: string | null, notify = true) {
  if (typeof window === "undefined") return;
  if (!username) {
    localStorage.removeItem(USERNAME_KEY);
    if (notify) notifyAuthChange();
    return;
  }
  localStorage.setItem(USERNAME_KEY, username);
  if (notify) notifyAuthChange();
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  const payload = decodeJwtPayload(access);
  const tokenRole = extractRole(payload);
  if (tokenRole) setCurrentRole(tokenRole, false);
  const tokenUsername = extractUsername(payload);
  if (tokenUsername) setCurrentUsername(tokenUsername, false);
  notifyAuthChange();
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(ROLE_KEY);
  localStorage.removeItem(USERNAME_KEY);
  notifyAuthChange();
}

export function getCurrentRole(): string | null {
  const token = getAccessToken();
  if (!token) return getStoredRole();

  const payload = decodeJwtPayload(token);
  const tokenRole = extractRole(payload);
  return tokenRole ?? getStoredRole();
}

export function getCurrentUsername(): string | null {
  const token = getAccessToken();
  if (token) {
    const payload = decodeJwtPayload(token);
    const tokenUsername = extractUsername(payload);
    if (tokenUsername) return tokenUsername;
  }
  if (typeof window === "undefined") return null;
  return localStorage.getItem(USERNAME_KEY);
}

export async function inferCurrentRole(): Promise<string | null> {
  const token = getAccessToken();
  if (!token) return null;

  const headers = new Headers({
    Authorization: `Bearer ${token}`,
  });

  const checks: Array<{ path: string; role: string }> = [
    { path: "/api/requests/incoming/", role: "FARMER" },
    { path: "/api/requests/mine/", role: "BUYER" },
  ];

  for (const check of checks) {
    try {
      const response = await fetch(joinApiUrl(API_BASE, check.path), { headers });
      if (response.ok) {
        setCurrentRole(check.role, false);
        return check.role;
      }
    } catch {
      continue;
    }
  }

  return null;
}
