"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/app/lib/api";

type UserMinimal = {
  id: number;
  username: string;
  full_name: string;
  email: string;
};

type Complaint = {
  id: number;
  reporter: UserMinimal;
  reported: UserMinimal;
  description: string;
  created_at: string;
};

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch<Complaint[]>("/api/accounts/admin/complaints/", { method: "GET" })
      .then((data) => {
        setComplaints(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load complaints");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-neutral-500">Loading complaints...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-neutral-900">User Complaints</h1>
        <p className="mt-1 text-sm text-neutral-600">
          Review and manage complaints filed by users against other platform participants.
        </p>
      </header>

      {complaints.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-12 text-center">
          <p className="text-sm text-neutral-500">No complaints found.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {complaints.map((complaint) => (
            <article key={complaint.id} className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-4 flex-1">
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Reporter Info */}
                    <div className="rounded-xl bg-amber-50 p-3 border border-amber-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Reporter (Complainer)</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">{complaint.reporter.full_name || complaint.reporter.username}</p>
                      <p className="text-xs text-neutral-600">{complaint.reporter.email}</p>
                    </div>

                    {/* Reported Info */}
                    <div className="rounded-xl bg-red-50 p-3 border border-red-100">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-red-700">Reported (Complainee)</p>
                      <p className="mt-1 text-sm font-semibold text-neutral-900">{complaint.reported.full_name || complaint.reported.username}</p>
                      <p className="text-xs text-neutral-600">{complaint.reported.email}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">Description</p>
                    <p className="mt-1 text-sm leading-relaxed text-neutral-800">{complaint.description}</p>
                  </div>
                </div>

                <div className="text-right">
                  <time className="text-xs text-neutral-500" dateTime={complaint.created_at}>
                    {new Date(complaint.created_at).toLocaleDateString()} at {new Date(complaint.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </time>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
