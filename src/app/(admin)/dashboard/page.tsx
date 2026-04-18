"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ScatterChart, Scatter, Cell } from 'recharts';
import { apiFetch } from "@/app/lib/api";
import { useAuthState } from "@/app/lib/useAuthState";

interface DashboardData {
  total_platform_transactions: {
    total_transactions: number;
    total_transaction_value: string;
    timeline: Array<{period: string; count: number; amount?: string}>;
  };
  marketplace_liquidity: {
    total_listings: number;
    sold_listings: number;
    unsold_listings: number;
    sell_through_rate: number;
  };
  active_users_over_time: Array<{period: string; active_users: number}>;
  waste_categories_distribution: Array<{
    waste_type: string;
    listing_count: number;
    total_quantity: string;
  }>;
  granularity: string;
}

export default function AdminDashboard() {
  const { role } = useAuthState();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role !== 'ADMIN') return;
    apiFetch<DashboardData>('/api/reports/', {}, { auth: true })
      .then(setData)
      .catch((e: any) => setError(e.message))
      .finally(() => setLoading(false));
  }, [role]);

  if (role !== 'ADMIN') return <p>Admin access required.</p>;
  if (loading) return <p>Loading dashboard...</p>;
  if (error) return <p>Error: {error}</p>;

  const timelineData = data!.total_platform_transactions.timeline.map((t) => ({
    period: t.period,
    listings: t.count || 0, // Approximate listings from transactions
    orders: t.count || 0,
    amount: Number(t.amount || 0),
  }));

  const wasteScatterData = data!.waste_categories_distribution.map((cat, idx) => ({
    waste_type: cat.waste_type,
    listings: cat.listing_count,
    quantity: Number(cat.total_quantity),
    x: idx,
  }));

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border p-6">
          <h3 className="text-lg font-semibold text-neutral-600">Total Listings</h3>
          <p className="text-3xl font-bold">{data!.marketplace_liquidity.total_listings}</p>
        </div>
        <div className="rounded-2xl border p-6">
          <h3 className="text-lg font-semibold text-neutral-600">Sold Listings</h3>
          <p className="text-3xl font-bold">{data!.marketplace_liquidity.sold_listings}</p>
        </div>
        <div className="rounded-2xl border p-6">
          <h3 className="text-lg font-semibold text-neutral-600">Sell Through</h3>
          <p className="text-3xl font-bold">{(data!.marketplace_liquidity.sell_through_rate * 100).toFixed(1)}%</p>
        </div>
        <div className="rounded-2xl border p-6">
          <h3 className="text-lg font-semibold text-neutral-600">Transactions</h3>
          <p className="text-3xl font-bold">{data!.total_platform_transactions.total_transactions}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Histogram */}
        <div className="rounded-2xl border p-6">
          <h3 className="text-xl font-bold mb-4">Monthly Trends (Histogram)</h3>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="orders" fill="#8884d8" name="Orders" />
              <Bar dataKey="listings" fill="#82ca9d" name="Listings" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Polygon Scatter */}
        <div className="rounded-2xl border p-6">
          <h3 className="text-xl font-bold mb-4">Waste Type Trends (Scatter/Polygon)</h3>
          <ResponsiveContainer width="100%" height={400}>
            <ScatterChart>
              <CartesianGrid />
              <XAxis type="category" dataKey="waste_type" />
              <YAxis type="number" />
              <Tooltip />
              <Scatter name="Waste" data={wasteScatterData} fill="#8884d8">
                {wasteScatterData.map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={`hsl(${idx * 20}, 70%, 50%)`} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
