"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";

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
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<number | null>(null);

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

  async function updateRole(userId: number, newRole: string) {
    setProcessingId(userId);
    try {
      const updated = await apiFetch<AdminUser>(`/api/accounts/admin/users/${userId}/`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      setUsers((prev) => prev.map((u) => (u.id === userId ? updated : u)));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role");
    } finally {
      setProcessingId(null);
    }
  }

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

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Administration</p>
          <h1 className="mt-1 text-2xl font-bold text-[var(--brand-strong)]">Manage Users</h1>
        </div>
      </div>

      {loading && <p className="text-sm text-neutral-500">Loading users...</p>}
      {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}

      {!loading && !error && (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white shadow-sm">
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
                {users.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-neutral-500">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="transition hover:bg-neutral-50">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--brand-soft)] text-sm font-bold text-[var(--brand-strong)]">
                            {getInitials(user)}
                          </div>
                          <div>
                            <p className="font-semibold text-neutral-900">{user.first_name} {user.last_name}</p>
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
                        <div className="flex justify-end gap-2">
                          <select
                            disabled={processingId === user.id}
                            value={user.role}
                            onChange={(e) => updateRole(user.id, e.target.value)}
                            className="rounded-lg border border-[var(--line)] bg-white px-2 py-1.5 text-xs font-semibold text-neutral-700 focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                          >
                            <option value="FARMER">Make Farmer</option>
                            <option value="PROCESSOR">Make Processor</option>
                            <option value="ADMIN">Make Admin</option>
                          </select>
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
      )}
    </div>
  );
}
