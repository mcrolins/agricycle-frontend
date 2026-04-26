"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import { getAccessToken } from "@/app/lib/auth";
import { downloadCsv, printCurrentPage } from "@/app/lib/reportUtils";
import AdminActionButton from "@/app/components/admin/AdminActionButton";

type AdminUser = {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  phone_number: string;
  is_active: boolean;
  date_joined: string;
  location?: string | null;
  county?: string | null;
  sub_county?: string | null;
  city?: string | null;
  ward?: string | null;
  address?: string | null;
};

type UserListing = {
  id: number;
  waste_type: string;
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
  processor_username: string;
  listing_waste_type: string;
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

function getUserDisplayName(user: AdminUser) {
  const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return fullName || user.username;
}

function getUserLocation(user: AdminUser) {
  return [
    user.location,
    user.city,
    user.county,
    user.sub_county,
    user.ward,
    user.address,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .join(", ");
}

function getOrderRelationship(order: UserOrder, username: string) {
  const isBuyer = order.processor_username === username;
  const isSeller = order.listing_farmer_username === username;

  if (isBuyer && isSeller) {
    return {
      label: "Placed & Received",
      otherUser: username,
    };
  }

  if (isBuyer) {
    return {
      label: "Placed Order",
      otherUser: order.listing_farmer_username,
    };
  }

  return {
    label: "Received Order",
    otherUser: order.processor_username,
  };
}

async function fetchUserActivityFromRoute(userId: number) {
  const token = getAccessToken();
  const headers = new Headers();

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`/api/admin/users/${userId}/activity`, {
    headers,
    cache: "no-store",
  });

  const contentType = response.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      typeof payload === "string"
        ? payload
        : payload && typeof payload === "object" && "detail" in payload
          ? String((payload as { detail?: unknown }).detail || "Failed to load user activity")
          : "Failed to load user activity";

    throw new Error(message);
  }

  return payload as UserActivity;
}

async function fetchUserActivityFallback(user: AdminUser) {
  const [listings, orders] = await Promise.all([
    apiFetch<UserListing[]>("/api/v1/listings/"),
    apiFetch<UserOrder[]>("/api/requests/admin/"),
  ]);

  return {
    listings: (Array.isArray(listings) ? listings : []).filter(
      (listing) => listing.farmer_username === user.username
    ),
    orders: (Array.isArray(orders) ? orders : []).filter(
      (order) =>
        order.processor_username === user.username || order.listing_farmer_username === user.username
    ),
  } satisfies UserActivity;
}

async function fetchUserActivity(user: AdminUser) {
  try {
    return await fetchUserActivityFromRoute(user.id);
  } catch {
    return fetchUserActivityFallback(user);
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [nameQuery, setNameQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [joinedDateFilter, setJoinedDateFilter] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [activityCache, setActivityCache] = useState<Record<string, UserActivity>>({});
  const [activityLoading, setActivityLoading] = useState(false);
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    apiFetch<AdminUser[]>("/api/accounts/admin/users/")
      .then((data) => {
        if (!mounted) return;
        setUsers(Array.isArray(data) ? data : []);
      })
      .catch((err) => {
        if (mounted) setError(err instanceof Error ? err.message : "Failed to load users");
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  async function deleteUser(userId: number) {
    if (!confirm("Are you sure you want to permanently delete this user?")) return;
    setProcessingId(userId);
    try {
      await apiFetch(`/api/accounts/admin/users/${userId}/`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete user");
    } finally {
      setProcessingId(null);
    }
  }

  function getInitials(u: AdminUser) {
    if (u.first_name && u.last_name) return `${u.first_name[0]}${u.last_name[0]}`.toUpperCase();
    return u.username.slice(0, 2).toUpperCase();
  }

  const filteredUsers = useMemo(() => {
    const normalizedNameQuery = nameQuery.trim().toLowerCase();
    const normalizedLocationQuery = locationQuery.trim().toLowerCase();

    return users.filter((user) => {
      const matchesName = !normalizedNameQuery || [
        getUserDisplayName(user),
        user.username,
        user.email,
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedNameQuery);

      const matchesLocation =
        !normalizedLocationQuery || getUserLocation(user).toLowerCase().includes(normalizedLocationQuery);

      const matchesJoinedDate =
        !joinedDateFilter || (user.date_joined || "").slice(0, 10) === joinedDateFilter;

      return matchesName && matchesLocation && matchesJoinedDate;
    });
  }, [joinedDateFilter, locationQuery, nameQuery, users]);

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [selectedUserId, users]
  );

  const selectedActivity = selectedUser ? activityCache[String(selectedUser.id)] : null;

  useEffect(() => {
    if (selectedUserId == null) return;
    if (!filteredUsers.some((user) => user.id === selectedUserId)) {
      setSelectedUserId(null);
    }
  }, [filteredUsers, selectedUserId]);

  useEffect(() => {
    if (!selectedUser) {
      setActivityError(null);
      setActivityLoading(false);
      return;
    }

    if (activityCache[String(selectedUser.id)]) {
      setActivityError(null);
      setActivityLoading(false);
      return;
    }

    let cancelled = false;
    setActivityLoading(true);
    setActivityError(null);

    fetchUserActivity(selectedUser)
      .then((activity) => {
        if (cancelled) return;
        setActivityCache((prev) => ({
          ...prev,
          [String(selectedUser.id)]: activity,
        }));
      })
      .catch((err) => {
        if (!cancelled) {
          setActivityError(err instanceof Error ? err.message : "Failed to load user activity");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setActivityLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [activityCache, selectedUser]);

  function downloadUsers() {
    const rows: Array<Array<string | number>> = [
      ["Name", "Username", "Email", "Phone", "Role", "Location", "Date Joined", "Status"],
      ...filteredUsers.map((user) => [
        getUserDisplayName(user),
        user.username,
        user.email,
        user.phone_number || "-",
        user.role,
        getUserLocation(user) || "-",
        new Date(user.date_joined).toLocaleDateString(),
        user.is_active ? "Active" : "Inactive",
      ]),
    ];

    downloadCsv("admin-users.csv", rows);
  }

  function toggleSelectedUser(userId: number) {
    setSelectedUserId((current) => (current === userId ? null : userId));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Administration</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--brand-strong)]">Manage Users</h1>
        </div>
        <div className="flex flex-wrap gap-2 print:hidden">
          <AdminActionButton onClick={downloadUsers} disabled={loading || filteredUsers.length === 0}>
            Download CSV
          </AdminActionButton>
          <AdminActionButton onClick={printCurrentPage} variant="primary">
            Print
          </AdminActionButton>
        </div>
      </div>

      <div className="grid gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-4 print:hidden md:grid-cols-2 xl:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-600">Name</label>
          <input
            type="text"
            placeholder="Search by full name or username"
            value={nameQuery}
            onChange={(e) => setNameQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-600">Location</label>
          <input
            type="text"
            placeholder="Search by county, city, or address"
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-neutral-600">Date Joined</label>
          <input
            type="date"
            value={joinedDateFilter}
            onChange={(e) => setJoinedDateFilter(e.target.value)}
            className="w-full rounded-xl border border-[var(--line)] bg-white px-3 py-2 text-sm focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
          />
        </div>
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading users...</p>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <>
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
            <div className="border-b border-[var(--line)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">
              Click a user row to view listings and orders
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
              <thead className="bg-[var(--surface)] text-xs font-semibold text-neutral-500">
                <tr>
                  <th className="px-5 py-4 uppercase tracking-wider">User</th>
                  <th className="px-5 py-4 uppercase tracking-wider">Contact</th>
                  <th className="px-5 py-4 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-4 uppercase tracking-wider">Joined</th>
                  <th className="px-5 py-4 text-right uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-neutral-500">
                      {users.length === 0 ? "No users found." : "No users match the current filters."}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr
                      key={user.id}
                      tabIndex={0}
                      onClick={() => toggleSelectedUser(user.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          toggleSelectedUser(user.id);
                        }
                      }}
                      className={[
                        "cursor-pointer transition hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-[var(--brand)] focus:ring-inset",
                        selectedUserId === user.id ? "bg-[var(--brand-soft)]/40" : "",
                      ].join(" ")}
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand-strong)]">
                            {getInitials(user)}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900">{getUserDisplayName(user)}</p>
                            <p className="text-xs text-neutral-500">@{user.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-neutral-900">{user.phone_number}</p>
                        <p className="text-xs text-neutral-500">{user.email}</p>
                      </td>
                      <td className="px-5 py-4">
                        <span className={[
                          "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                          user.role === "ADMIN" ? "bg-violet-100 text-violet-700" :
                          user.role === "PROCESSOR" ? "bg-amber-100 text-amber-700" :
                          "bg-[var(--brand-soft)] text-[var(--brand-strong)]"
                        ].join(" ")}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap text-neutral-600">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                          <button
                            disabled={processingId === user.id}
                            onClick={() => deleteUser(user.id)}
                            className="rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          </div>

          {selectedUser && (
            <section className="rounded-2xl border border-[var(--line)] bg-white shadow-sm">
              <div className="flex flex-col gap-4 border-b border-[var(--line)] px-5 py-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">User Details</p>
                  <h2 className="mt-1 text-xl font-bold text-[var(--brand-strong)]">
                    {getUserDisplayName(selectedUser)}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-600">
                    @{selectedUser.username} · {selectedUser.role} ·{" "}
                    {getUserLocation(selectedUser) || "Location not available"}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:min-w-[280px]">
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Listings</p>
                    <p className="mt-1 text-2xl font-bold text-[var(--brand-strong)]">
                      {selectedActivity?.listings.length ?? 0}
                    </p>
                  </div>
                  <div className="rounded-xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Orders</p>
                    <p className="mt-1 text-2xl font-bold text-[var(--brand-strong)]">
                      {selectedActivity?.orders.length ?? 0}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-6 px-5 py-5">
                {activityLoading && (
                  <p className="text-sm text-neutral-500">Loading listings and orders for this user...</p>
                )}
                {activityError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                    {activityError}
                  </div>
                )}

                {!activityLoading && !activityError && selectedActivity && (
                  <div className="grid gap-6 xl:grid-cols-2">
                    <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
                      <div className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                        <h3 className="font-semibold text-[var(--brand-strong)]">Listings</h3>
                      </div>
                      {selectedActivity.listings.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-neutral-500">This user has no listings.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                              <tr>
                                <th className="px-4 py-3">Item</th>
                                <th className="px-4 py-3">Location</th>
                                <th className="px-4 py-3">Price</th>
                                <th className="px-4 py-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--line)]">
                              {selectedActivity.listings.map((listing) => (
                                <tr key={listing.id}>
                                  <td className="px-4 py-3">
                                    <p className="font-semibold text-neutral-900">{listing.waste_type}</p>
                                    <p className="text-xs text-neutral-500">
                                      {listing.quantity} {listing.unit} · {new Date(listing.created_at).toLocaleDateString()}
                                    </p>
                                  </td>
                                  <td className="px-4 py-3 text-neutral-600">{listing.location}</td>
                                  <td className="px-4 py-3 font-medium text-neutral-900">
                                    {listing.price ? `KES ${listing.price}` : "-"}
                                  </td>
                                  <td className="px-4 py-3 text-neutral-600">{listing.status}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-[var(--line)]">
                      <div className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                        <h3 className="font-semibold text-[var(--brand-strong)]">Orders</h3>
                      </div>
                      {selectedActivity.orders.length === 0 ? (
                        <p className="px-4 py-6 text-sm text-neutral-500">This user has no related orders.</p>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                              <tr>
                                <th className="px-4 py-3">Order</th>
                                <th className="px-4 py-3">Relation</th>
                                <th className="px-4 py-3">Other User</th>
                                <th className="px-4 py-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--line)]">
                              {selectedActivity.orders.map((order) => {
                                const relationship = getOrderRelationship(order, selectedUser.username);

                                return (
                                  <tr key={order.id}>
                                    <td className="px-4 py-3">
                                      <p className="font-semibold text-neutral-900">#{order.id} · {order.listing_waste_type}</p>
                                      <p className="text-xs text-neutral-500">
                                        {order.quantity_requested} {order.listing_unit || order.unit || "units"} · {new Date(order.created_at).toLocaleDateString()}
                                      </p>
                                    </td>
                                    <td className="px-4 py-3 text-neutral-600">{relationship.label}</td>
                                    <td className="px-4 py-3 text-neutral-600">@{relationship.otherUser}</td>
                                    <td className="px-4 py-3 text-neutral-600">{order.status}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
