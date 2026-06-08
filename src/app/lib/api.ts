import { clearTokens, getAccessToken, setTokens } from "./auth";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

type ApiError = Error & {
  payload?: unknown;
  status?: number;
};

function joinApiUrl(base: string, path: string) {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedBase.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${normalizedBase}${normalizedPath.slice(4)}`;
  }

  return `${normalizedBase}${normalizedPath}`;
}

function formatApiError(payload: unknown) {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return "Request failed";
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.detail === "string" && record.detail.trim()) {
    return record.detail;
  }

  const messages: string[] = [];
  for (const [key, value] of Object.entries(record)) {
    if (Array.isArray(value)) {
      const text = value.map((v) => String(v)).join(", ");
      messages.push(`${key}: ${text}`);
      continue;
    }
    if (typeof value === "string") {
      messages.push(`${key}: ${value}`);
      continue;
    }
    if (value && typeof value === "object") {
      messages.push(`${key}: ${JSON.stringify(value)}`);
    }
  }

  return messages.length ? messages.join(" | ") : "Request failed";
}

export function absUrl(pathOrUrl: string) {
  if (!pathOrUrl) return pathOrUrl;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return joinApiUrl(API_BASE, pathOrUrl);
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  { auth = true }: { auth?: boolean } = {}
): Promise<T> {
  const headers = new Headers(options.headers);

  // Don't set JSON content-type for FormData (browser will set boundary)
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  if (!headers.has("Content-Type") && !isFormData) {
    headers.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getAccessToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const res = await fetch(joinApiUrl(API_BASE, path), { ...options, headers });

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    if (res.status === 401) clearTokens();
    const details = formatApiError(payload);
    const error = new Error(details) as ApiError;
    error.status = res.status;
    error.payload = payload;
    if (res.status >= 500) {
      error.message = `Server error (${res.status}). ${details}`;
      throw error;
    }
    throw error;
  }

  return payload as T;
}

export async function login(username: string, password: string) {
  const data = await apiFetch<{ access: string; refresh: string }>(
    "/api/accounts/token/",
    {
      method: "POST",
      body: JSON.stringify({ username, password }),
    },
    { auth: false }
  );
  setTokens(data.access, data.refresh);
  return data;
}

export async function register(payload: {
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role: "FARMER" | "BUYER" | "CONTRACTOR";
  phone_number: string;
}) {
  return apiFetch(
    "/api/accounts/register/",
    { method: "POST", body: JSON.stringify(payload) },
    { auth: false }
  );
}
