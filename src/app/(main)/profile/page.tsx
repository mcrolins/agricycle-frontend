"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuthState } from "@/app/lib/useAuthState";
import { apiFetch } from "@/app/lib/api";
import { useRouter } from "next/navigation";

type Review = {
  id: number;
  reviewer: number;
  reviewer_name: string;
  rating: number | null;
  comment: string;
  created_at: string;
};

type Complaint = {
  id: number;
  reporter: number;
  reporter_name: string;
  description: string;
  created_at: string;
};

type DashboardStats = {
  total_listings: number;
  accepted_requests: number;
  completed_listings: number;
  outgoing_accepted: number;
  average_rating: number | null;
  reviews: Review[];
  complaints: Complaint[];
};

export default function ProfilePage() {
  const { accessToken, role, username } = useAuthState();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    if (!accessToken) return;
    setLoadingStats(true);
    apiFetch<DashboardStats>("/api/accounts/me/dashboard/")
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [accessToken]);

  if (!username) {
    router.replace("/login");
    return null;
  }

  const roleColors: Record<string, string> = {
    FARMER: "bg-green-100 text-green-700",
    BUYER: "bg-blue-100 text-blue-700",
    CONTRACTOR: "bg-amber-100 text-amber-700",
    ADMIN: "bg-slate-100 text-slate-700",
  };

  const roleColor = roleColors[role || ""] || "bg-slate-100 text-slate-700";
  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1).toLowerCase() : "User";

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  function renderStars(rating: number | null) {
    if (!rating) return <span className="text-slate-400">No rating</span>;
    return (
      <span className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            xmlns="http://www.w3.org/2000/svg"
            className={`h-4 w-4 ${star <= rating ? "text-amber-400" : "text-slate-200"}`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </span>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 pb-24 md:p-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-neutral-900 md:text-4xl">
          My Profile
        </h1>
        <p className="mt-2 text-lg text-neutral-600">
          Your account overview and activity dashboard
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-[var(--line)] bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-soft)] text-2xl font-bold text-[var(--brand-strong)]">
              {username[0].toUpperCase()}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-neutral-900">
                @{username}
              </h2>
              <p className="text-sm text-neutral-500 mt-0.5">
                {role === "FARMER" && "Farmer — List and sell agricultural products"}
                {role === "BUYER" && "Buyer — Browse and purchase products"}
                {role === "CONTRACTOR" && "Contractor — Rent equipment and buy inputs"}
                {role === "ADMIN" && "Administrator — Platform management"}
                {!role && "User"}
              </p>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold w-fit ${roleColor}`}>
            {roleLabel}
          </span>
        </div>

        {/* Average Rating */}
        {stats?.average_rating && (
          <div className="mt-4 pt-4 border-t border-[var(--line)] flex items-center gap-3">
            {renderStars(Math.round(stats.average_rating))}
            <span className="text-sm font-semibold text-neutral-700">{stats.average_rating} / 5</span>
            <span className="text-xs text-neutral-500">({stats.reviews.length} review{stats.reviews.length !== 1 ? "s" : ""})</span>
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
          label="Total Listings"
          value={loadingStats ? "..." : (stats?.total_listings ?? 0)}
          color="text-green-600 bg-green-50"
        />
        <StatCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          label="Accepted Requests"
          value={loadingStats ? "..." : (stats?.accepted_requests ?? 0)}
          color="text-blue-600 bg-blue-50"
        />
        <StatCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          }
          label="Completed"
          value={loadingStats ? "..." : (stats?.completed_listings ?? 0)}
          color="text-purple-600 bg-purple-50"
        />
        <StatCard
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          }
          label="Outgoing Accepted"
          value={loadingStats ? "..." : (stats?.outgoing_accepted ?? 0)}
          color="text-amber-600 bg-amber-50"
        />
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        {(role === "FARMER" || role === "CONTRACTOR") && (
          <Link
            href="/my-listings"
            className="rounded-2xl border border-[var(--line)] bg-white p-4 text-center font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)] transition-colors active:scale-95"
          >
            View My Listings
          </Link>
        )}

        {(role === "BUYER" || role === "CONTRACTOR" || role === "FARMER") && (
          <Link
            href="/orders/my"
            className="rounded-2xl border border-[var(--line)] bg-white p-4 text-center font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)] transition-colors active:scale-95"
          >
            My Orders
          </Link>
        )}

        <Link
          href="/reports"
          className="rounded-2xl border border-[var(--line)] bg-white p-4 text-center font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)] transition-colors active:scale-95"
        >
          View Reports
        </Link>

        <Link
          href="/help"
          className="rounded-2xl border border-[var(--line)] bg-white p-4 text-center font-semibold text-[var(--brand)] hover:bg-[var(--brand-soft)] transition-colors active:scale-95"
        >
          Help & Support
        </Link>
      </div>

      {/* Reviews Section */}
      <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--line)] bg-slate-50 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            Reviews from Buyers
          </h3>
          <span className="text-xs font-semibold text-neutral-500 bg-white px-2.5 py-1 rounded-full border border-[var(--line)]">
            {stats?.reviews.length ?? 0}
          </span>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {loadingStats ? (
            <div className="p-6 text-center text-sm text-neutral-500">Loading reviews...</div>
          ) : !stats?.reviews.length ? (
            <div className="p-8 text-center">
              <span className="text-4xl block mb-2">⭐</span>
              <p className="text-sm font-medium text-neutral-500">No reviews yet</p>
              <p className="text-xs text-neutral-400 mt-1">Buyers will leave reviews after transactions</p>
            </div>
          ) : (
            stats.reviews.map((review) => (
              <div key={review.id} className="p-4 md:px-6">
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {(review.reviewer_name || "U")[0].toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-neutral-900">{review.reviewer_name || `User #${review.reviewer}`}</span>
                      <p className="text-[11px] text-neutral-400">{formatDate(review.created_at)}</p>
                    </div>
                  </div>
                  {renderStars(review.rating)}
                </div>
                {review.comment && (
                  <p className="text-sm text-neutral-600 mt-2 pl-10 leading-relaxed">{review.comment}</p>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Complaints Section */}
      <div className="rounded-2xl border border-[var(--line)] bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-[var(--line)] bg-slate-50 flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            Complaints Against You
          </h3>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            (stats?.complaints.length ?? 0) > 0
              ? "text-red-600 bg-red-50 border-red-200"
              : "text-neutral-500 bg-white border-[var(--line)]"
          }`}>
            {stats?.complaints.length ?? 0}
          </span>
        </div>
        <div className="divide-y divide-[var(--line)]">
          {loadingStats ? (
            <div className="p-6 text-center text-sm text-neutral-500">Loading...</div>
          ) : !stats?.complaints.length ? (
            <div className="p-8 text-center">
              <span className="text-4xl block mb-2">✅</span>
              <p className="text-sm font-medium text-neutral-500">No complaints</p>
              <p className="text-xs text-neutral-400 mt-1">Keep up the great work!</p>
            </div>
          ) : (
            stats.complaints.map((complaint) => (
              <div key={complaint.id} className="p-4 md:px-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
                    {(complaint.reporter_name || "U")[0].toUpperCase()}
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-neutral-900">{complaint.reporter_name || `User #${complaint.reporter}`}</span>
                    <p className="text-[11px] text-neutral-400">{formatDate(complaint.created_at)}</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 pl-10 leading-relaxed">{complaint.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-4 md:p-5 shadow-sm">
      <div className={`inline-flex h-10 w-10 items-center justify-center rounded-xl ${color} mb-3`}>
        {icon}
      </div>
      <p className="text-2xl font-bold text-neutral-900">{value}</p>
      <p className="text-xs font-medium text-neutral-500 mt-1">{label}</p>
    </div>
  );
}
