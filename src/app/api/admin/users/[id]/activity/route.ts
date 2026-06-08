import { NextRequest, NextResponse } from "next/server";

type AdminUser = {
  id: number;
  username: string;
};

type UserListing = {
  id: number;
  title: string;
  category: string;
  quantity: string;
  unit: string;
  price: string;
  location: string;
  status: string;
  created_at: string;
  farmer_username: string;
};

type UserOrder = {
  id: number;
  buyer_username: string;
  listing_title: string;
  listing_category: string;
  listing_farmer_username: string;
  quantity_requested: string;
  proposed_price: string;
  listing_unit?: string;
  unit?: string;
  status: string;
  created_at: string;
};

type UserActivity = {
  listings: UserListing[];
  orders: UserOrder[];
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

function joinApiUrl(base: string, path: string) {
  const normalizedBase = base.replace(/\/+$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;

  if (normalizedBase.endsWith("/api") && normalizedPath.startsWith("/api/")) {
    return `${normalizedBase}${normalizedPath.slice(4)}`;
  }

  return `${normalizedBase}${normalizedPath}`;
}

async function fetchBackend<T>(path: string, authorization: string) {
  const response = await fetch(joinApiUrl(API_BASE, path), {
    headers: {
      Authorization: authorization,
    },
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : payload && typeof payload === "object" && "detail" in payload
          ? String((payload as { detail?: unknown }).detail || "Request failed")
          : "Request failed";

    return {
      ok: false as const,
      status: response.status,
      message,
    };
  }

  return {
    ok: true as const,
    data: payload as T,
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authorization = request.headers.get("authorization");
  if (!authorization) {
    return NextResponse.json({ detail: "Missing Authorization header" }, { status: 401 });
  }

  const { id } = await context.params;
  if (!id) {
    return NextResponse.json({ detail: "Missing user id" }, { status: 400 });
  }

  const userResponse = await fetchBackend<AdminUser>(`/api/accounts/admin/users/${id}/`, authorization);
  if (!userResponse.ok) {
    return NextResponse.json({ detail: userResponse.message }, { status: userResponse.status });
  }

  const username = userResponse.data.username;

  const [listingsResponse, ordersResponse] = await Promise.all([
    fetchBackend<UserListing[]>("/api/v1/listings/", authorization),
    fetchBackend<UserOrder[]>("/api/requests/admin/", authorization),
  ]);

  if (!listingsResponse.ok) {
    return NextResponse.json({ detail: listingsResponse.message }, { status: listingsResponse.status });
  }

  if (!ordersResponse.ok) {
    return NextResponse.json({ detail: ordersResponse.message }, { status: ordersResponse.status });
  }

  const activity: UserActivity = {
    listings: (Array.isArray(listingsResponse.data) ? listingsResponse.data : []).filter(
      (listing) => listing.farmer_username === username
    ),
    orders: (Array.isArray(ordersResponse.data) ? ordersResponse.data : []).filter(
      (order) =>
        order.buyer_username === username || order.listing_farmer_username === username
    ),
  };

  return NextResponse.json(activity);
}
