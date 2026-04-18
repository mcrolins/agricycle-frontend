"use client";

import { useState } from "react";
import { login } from "@/app/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setCurrentUsername, getCurrentRole } from "@/app/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      await login(username, password);
      setCurrentUsername(username.trim());
      
      const role = getCurrentRole();
      console.log('LOGIN DEBUG:', {
        username: username.trim(),
        extractedRole: role
      });
      
      // Temp fix for known admin
      if (username.trim() === 'AgricycleAdmin') {
        localStorage.setItem('agricycle_role', 'ADMIN');
        console.log('FORCE ADMIN ROLE for AgricycleAdmin');
      }
      
      if (role === "ADMIN") {
        router.replace("/admin");
      } else {
        router.replace("/listings");
      }
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold">Welcome back</h1>
      <p className="mt-1 text-sm text-neutral-600">Login to continue. Your account role is assigned by the server.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

        <div>
          <label className="text-xs font-semibold text-neutral-600">Username</label>
          <input
            className="mt-1 w-full rounded-xl border bg-white px-3 py-3 text-sm"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. john"
          />
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-600">Password</label>
          <input
            type="password"
            className="mt-1 w-full rounded-xl border bg-white px-3 py-3 text-sm"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />
        </div>

        <button
          disabled={loading}
          className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="text-center text-sm text-neutral-600">
          No account?{" "}
          <Link className="font-semibold text-neutral-900 underline" href="/register">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}
