"use client";

import { useState } from "react";
import { login } from "@/app/lib/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { setCurrentUsername, getCurrentRole } from "@/app/lib/auth";

function getPasswordValidation(value: string) {
  if (!value) return "Password is required.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  if (value.length > 64) return "Password must be no more than 64 characters.";
  if (!/[A-Z]/.test(value)) return "Password must contain at least one uppercase letter.";
  if (!/[a-z]/.test(value)) return "Password must contain at least one lowercase letter.";
  if (!/[0-9]/.test(value)) return "Password must contain at least one number.";
  if (!/[^A-Za-z0-9]/.test(value)) return "Password must contain at least one special character.";
  return null;
}

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [touchedPassword, setTouchedPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordError = getPasswordValidation(password);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setTouchedPassword(true);

    if (passwordError) {
      setErr("Please ensure your password meets the requirements.");
      return;
    }

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
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              className={`w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none transition ${
                touchedPassword && !!passwordError ? "border-red-300 focus:border-red-500" : "border-neutral-200 focus:border-neutral-500"
              }`}
              value={password}
              onBlur={() => setTouchedPassword(true)}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <button
              type="button"
              className="absolute inset-y-0 right-3 flex items-center text-neutral-500 hover:text-neutral-700"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>
          <p className={`mt-1 text-xs ${touchedPassword && passwordError ? "text-red-700" : "text-neutral-500"}`}>
            {touchedPassword && passwordError ? passwordError : ""}
          </p>
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
