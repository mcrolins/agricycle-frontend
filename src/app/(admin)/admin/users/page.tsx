"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import { getAccessToken } from "@/app/lib/auth";
import { downloadCsv, printCurrentPage } from "@/app/lib/reportUtils";
import AdminActionButton from "@/app/components/admin/AdminActionButton";
import ConfirmationModal from "@/app/components/ConfirmationModal";

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
  profile?: {
    location?: string | null;
    county?: string | null;
    sub_county?: string | null;
    city?: string | null;
    ward?: string | null;
    address?: string | null;
  } | null;
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
    user.profile?.location,
    user.profile?.city,
    user.profile?.county,
    user.profile?.sub_county,
    user.profile?.ward,
    user.profile?.address,
  ]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    .filter((value, index, values) => values.indexOf(value) === index)
    .join(", ");
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function renderPrintTable(headers: string[], rows: Array<Array<string | number | null | undefined>>) {
  if (rows.length === 0) {
    return "<p class=\"empty\">No records found.</p>";
  }

  return `
    <table>
      <thead>
        <tr>${headers.map((header) => `<th>${escapeHtml(header)}</th>`).join("")}</tr>
      </thead>
      <tbody>
        ${rows
          .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
          .join("")}
      </tbody>
    </table>
  `;
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
  const [actionError, setActionError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [userIdPendingDelete, setUserIdPendingDelete] = useState<number | null>(null);
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
    setProcessingId(userId);
    setActionError(null);
    try {
      await apiFetch(`/api/accounts/admin/users/${userId}/`, { method: "DELETE" });
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      setUserIdPendingDelete(null);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete user");
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
  const userPendingDelete = users.find((user) => user.id === userIdPendingDelete) ?? null;

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

  function downloadSelectedUserDetails(user: AdminUser, activity: UserActivity | null) {
    const rows: Array<Array<string | number | null | undefined>> = [
      ["User Details"],
      ["Name", getUserDisplayName(user)],
      ["Username", user.username],
      ["Email", user.email],
      ["Phone", user.phone_number || "-"],
      ["Role", user.role],
      ["Location", getUserLocation(user) || "-"],
      ["Date Joined", user.date_joined ? new Date(user.date_joined).toLocaleDateString() : "-"],
      ["Status", user.is_active ? "Active" : "Inactive"],
      [],
      ["Listing History"],
      ["Listing ID", "Waste Type", "Quantity", "Unit", "Location", "Price (KES)", "Status", "Created"],
      ...(activity?.listings ?? []).map((listing) => [
        listing.id,
        listing.waste_type,
        listing.quantity,
        listing.unit,
        listing.location,
        listing.price,
        listing.status,
        listing.created_at ? new Date(listing.created_at).toLocaleDateString() : "-",
      ]),
      [],
      ["Order Activity"],
      ["Order ID", "Waste Type", "Quantity Requested", "Unit", "Processor", "Farmer", "Price Per Unit", "Status", "Created"],
      ...(activity?.orders ?? []).map((order) => [
        order.id,
        order.listing_waste_type,
        order.quantity_requested,
        order.listing_unit || order.unit || "units",
        order.processor_username,
        order.listing_farmer_username,
        order.proposed_price,
        order.status,
        order.created_at ? new Date(order.created_at).toLocaleDateString() : "-",
      ]),
    ];

    downloadCsv(`admin-user-${user.username}-details.csv`, rows);
  }

  function printSelectedUserDetails(user: AdminUser, activity: UserActivity | null) {
    const printWindow = window.open("", "_blank", "width=960,height=720");
    if (!printWindow) {
      window.print();
      return;
    }

    const listings = activity?.listings ?? [];
    const orders = activity?.orders ?? [];
    const documentTitle = `User Details - ${getUserDisplayName(user)}`;

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>${escapeHtml(documentTitle)}</title>
          <style>
            body { font-family: Arial, sans-serif; color: #171717; margin: 32px; }
            h1 { margin: 0 0 4px; font-size: 24px; }
            h2 { margin: 28px 0 10px; font-size: 16px; }
            p { margin: 4px 0; color: #525252; }
            table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
            th, td { border: 1px solid #d4d4d4; padding: 8px; text-align: left; vertical-align: top; }
            th { background: #f5f5f5; font-weight: 700; }
            .meta { margin-top: 16px; display: grid; grid-template-columns: 140px 1fr; gap: 6px 12px; font-size: 13px; }
            .label { font-weight: 700; color: #262626; }
            .empty { color: #737373; font-size: 13px; }
          </style>
        </head>
        <body>
          <h1>${escapeHtml(getUserDisplayName(user))}</h1>
          <p>@${escapeHtml(user.username)} · ${escapeHtml(user.role)}</p>
          <div class="meta">
            <span class="label">Email</span><span>${escapeHtml(user.email || "-")}</span>
            <span class="label">Phone</span><span>${escapeHtml(user.phone_number || "-")}</span>
            <span class="label">Location</span><span>${escapeHtml(getUserLocation(user) || "-")}</span>
            <span class="label">Date Joined</span><span>${escapeHtml(user.date_joined ? new Date(user.date_joined).toLocaleDateString() : "-")}</span>
            <span class="label">Status</span><span>${escapeHtml(user.is_active ? "Active" : "Inactive")}</span>
          </div>
          <h2>Listing History (${listings.length})</h2>
          ${renderPrintTable(
            ["Listing ID", "Waste Type", "Quantity", "Unit", "Location", "Price", "Status", "Created"],
            listings.map((listing) => [
              listing.id,
              listing.waste_type,
              listing.quantity,
              listing.unit,
              listing.location,
              listing.price,
              listing.status,
              listing.created_at ? new Date(listing.created_at).toLocaleDateString() : "-",
            ])
          )}
          <h2>Order Activity (${orders.length})</h2>
          ${renderPrintTable(
            ["Order ID", "Waste Type", "Quantity", "Unit", "Processor", "Farmer", "Price", "Status", "Created"],
            orders.map((order) => [
              order.id,
              order.listing_waste_type,
              order.quantity_requested,
              order.listing_unit || order.unit || "units",
              order.processor_username,
              order.listing_farmer_username,
              order.proposed_price,
              order.status,
              order.created_at ? new Date(order.created_at).toLocaleDateString() : "-",
            ])
          )}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
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
      {actionError && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{actionError}</div>}

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
                  <th className="px-5 py-4 uppercase tracking-wider">Location</th>
                  <th className="px-5 py-4 uppercase tracking-wider">Role</th>
                  <th className="px-5 py-4 uppercase tracking-wider">Joined</th>
                  <th className="px-5 py-4 text-right uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line)]">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-neutral-500">
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
                      <td className="px-5 py-4 text-neutral-600">
                        {getUserLocation(user) || "-"}
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
                            onClick={() => setUserIdPendingDelete(user.id)}
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
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm print:hidden"
              onClick={() => setSelectedUserId(null)}
            >
              <div 
                className="relative flex h-full max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-[var(--line)] bg-white shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="flex flex-col gap-4 border-b border-[var(--line)] px-6 py-5 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex-1">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Admin Dashboard · User Profile</p>
                    <h2 className="mt-1 text-2xl font-bold text-[var(--brand-strong)]">
                      {getUserDisplayName(selectedUser)}
                    </h2>
                    <p className="mt-1 text-sm text-neutral-600">
                      @{selectedUser.username} · {selectedUser.role} ·{" "}
                      {getUserLocation(selectedUser) || "Location not available"}
                    </p>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="flex flex-wrap justify-end gap-2">
                      <AdminActionButton
                        onClick={() => downloadSelectedUserDetails(selectedUser, selectedActivity)}
                        disabled={activityLoading}
                      >
                        Download Details
                      </AdminActionButton>
                      <AdminActionButton
                        onClick={() => printSelectedUserDetails(selectedUser, selectedActivity)}
                        disabled={activityLoading}
                        variant="primary"
                      >
                        Print Details
                      </AdminActionButton>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:min-w-[240px]">
                      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 text-center">Listings</p>
                        <p className="mt-1 text-2xl font-bold text-[var(--brand-strong)] text-center">
                          {selectedActivity?.listings.length ?? 0}
                        </p>
                      </div>
                      <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500 text-center">Orders</p>
                        <p className="mt-1 text-2xl font-bold text-[var(--brand-strong)] text-center">
                          {selectedActivity?.orders.length ?? 0}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedUserId(null)}
                      className="rounded-full bg-neutral-100 p-2 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-700 transition"
                      aria-label="Close modal"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
                  {activityLoading && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--brand)] border-t-transparent mb-4"></div>
                      <p className="text-sm text-neutral-500">Loading user activity and history...</p>
                    </div>
                  )}
                  {activityError && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-center">
                      <p className="text-sm font-semibold text-red-700">{activityError}</p>
                      <button onClick={() => window.location.reload()} className="mt-2 text-xs font-bold text-red-600 underline">Try again</button>
                    </div>
                  )}

                  {!activityLoading && !activityError && selectedActivity && (
                    <div className={selectedUser.role === "PROCESSOR" ? "space-y-6" : "grid gap-6 xl:grid-cols-2"}>
                      {/* Listings Section (Hidden or simplified for processors if needed, but keeping for now unless empty) */}
                      {selectedUser.role !== "PROCESSOR" && (
                        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
                          <div className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3">
                            <h3 className="font-semibold text-[var(--brand-strong)]">Listing History</h3>
                          </div>
                          {selectedActivity.listings.length === 0 ? (
                            <div className="py-12 text-center">
                              <p className="text-sm text-neutral-400 font-medium">This user has no listing history.</p>
                            </div>
                          ) : (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm">
                                <thead className="bg-neutral-50/50 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                  <tr>
                                    <th className="px-4 py-3">Waste Item</th>
                                    <th className="px-4 py-3">Location</th>
                                    <th className="px-4 py-3">Price</th>
                                    <th className="px-4 py-3">Status</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--line)]">
                                  {selectedActivity.listings.map((listing) => (
                                    <tr key={listing.id} className="hover:bg-neutral-50/50 transition">
                                      <td className="px-4 py-4">
                                        <p className="font-bold text-neutral-900">{listing.waste_type}</p>
                                        <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                                          {listing.quantity} {listing.unit} · {new Date(listing.created_at).toLocaleDateString()}
                                        </p>
                                      </td>
                                      <td className="px-4 py-4 text-neutral-600 text-xs font-medium">{listing.location}</td>
                                      <td className="px-4 py-4 font-bold text-neutral-900">
                                        {listing.price ? `KES ${listing.price}` : "-"}
                                      </td>
                                      <td className="px-4 py-4">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                          listing.status === "OPEN" ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-600"
                                        }`}>
                                          {listing.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Orders Section */}
                      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
                        <div className="border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 flex justify-between items-center">
                          <h3 className="font-semibold text-[var(--brand-strong)]">
                            {selectedUser.role === "PROCESSOR" ? "Order Activity" : "Order History"}
                          </h3>
                          {selectedUser.role === "PROCESSOR" && (
                            <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest">Minimal View</span>
                          )}
                        </div>
                        {selectedActivity.orders.length === 0 ? (
                          <div className="py-12 text-center">
                            <p className="text-sm text-neutral-400 font-medium">This user has no order activity.</p>
                          </div>
                        ) : (
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                              <thead className="bg-neutral-50/50 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                                <tr>
                                  <th className="px-4 py-3 text-center">Order ID</th>
                                  <th className="px-4 py-3">Waste Category</th>
                                  <th className="px-4 py-3">Relation</th>
                                  {selectedUser.role !== "PROCESSOR" && <th className="px-4 py-3">Counterparty</th>}
                                  <th className="px-4 py-3">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[var(--line)]">
                                {selectedActivity.orders.map((order) => {
                                  const relationship = getOrderRelationship(order, selectedUser.username);

                                  return (
                                    <tr key={order.id} className="hover:bg-neutral-50/50 transition">
                                      <td className="px-4 py-4 text-center font-mono text-xs font-bold text-neutral-400">
                                        #{order.id}
                                      </td>
                                      <td className="px-4 py-4">
                                        <p className="font-bold text-neutral-900">{order.listing_waste_type}</p>
                                        <p className="text-[11px] text-neutral-500 font-medium mt-0.5">
                                          {order.quantity_requested} {order.listing_unit || order.unit || "units"} · {new Date(order.created_at).toLocaleDateString()}
                                        </p>
                                      </td>
                                      <td className="px-4 py-4">
                                        <span className={`inline-flex rounded-lg px-2 py-1 text-[11px] font-bold ${
                                          relationship.label.includes("Placed") ? "bg-amber-50 text-amber-700" : "bg-blue-50 text-blue-700"
                                        }`}>
                                          {relationship.label}
                                        </span>
                                      </td>
                                      {selectedUser.role !== "PROCESSOR" && (
                                        <td className="px-4 py-4 text-neutral-600 font-medium text-xs">
                                          @{relationship.otherUser}
                                        </td>
                                      )}
                                      <td className="px-4 py-4">
                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                                          order.status === "PENDING" ? "bg-amber-100 text-amber-700" : 
                                          order.status === "ACCEPTED" ? "bg-green-100 text-green-700" :
                                          "bg-neutral-100 text-neutral-600"
                                        }`}>
                                          {order.status}
                                        </span>
                                      </td>
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
              </div>
            </div>
          )}
        </>
      )}
      <ConfirmationModal
        open={!!userPendingDelete}
        title="Delete user?"
        message={
          userPendingDelete
            ? `This will permanently delete ${getUserDisplayName(userPendingDelete)} (@${userPendingDelete.username}). This action cannot be undone.`
            : "This action cannot be undone."
        }
        confirmLabel="Delete User"
        variant="danger"
        loading={processingId === userPendingDelete?.id}
        onConfirm={() => {
          if (userPendingDelete) void deleteUser(userPendingDelete.id);
        }}
        onCancel={() => {
          if (!processingId) setUserIdPendingDelete(null);
        }}
      />
    </div>
  );
}
