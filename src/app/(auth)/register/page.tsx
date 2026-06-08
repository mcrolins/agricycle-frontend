"use client";

import { useState } from "react";
import { register } from "@/app/lib/api";
import { useRouter } from "next/navigation";

const namePattern = /^[A-Za-z][A-Za-z\s'-]*$/;
const usernamePattern = /^(?=.*[A-Za-z])[A-Za-z][A-Za-z0-9_]*$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const kenyanPhonePattern = /^(?:\+254|254|0)(?:7\d{8}|1\d{8})$/;

function getNameValidation(label: string, value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return `${label} is required.`;
  if (!/^[A-Za-z]/.test(trimmedValue)) return `${label} must start with a letter.`;
  if (!namePattern.test(trimmedValue)) return `${label} can only use letters, spaces, apostrophes, or hyphens.`;
  return null;
}

function getUsernameValidation(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "Username is required.";
  if (!/^[A-Za-z]/.test(trimmedValue)) return "Username must start with a letter.";
  if (!usernamePattern.test(trimmedValue)) return "Username can contain letters, numbers, and underscores only.";
  if (trimmedValue.length < 3) return "Username must be at least 3 characters.";
  return null;
}

function getEmailValidation(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "Email is required.";
  if (!emailPattern.test(trimmedValue)) return "Enter a valid email address, for example name@example.com.";
  return null;
}

function getPhoneValidation(value: string) {
  const trimmedValue = value.trim();
  if (!trimmedValue) return "Phone number is required.";
  if (!kenyanPhonePattern.test(trimmedValue)) return "Use a Kenyan number like 0712345678, 254712345678, or +254712345678.";
  return null;
}

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

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<"FARMER" | "BUYER" | "CONTRACTOR">("FARMER");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState({
    username: false,
    firstName: false,
    lastName: false,
    email: false,
    phoneNumber: false,
    password: false,
  });

  const usernameError = getUsernameValidation(username);
  const firstNameError = getNameValidation("First name", firstName);
  const lastNameError = getNameValidation("Last name", lastName);
  const emailError = getEmailValidation(email);
  const phoneError = getPhoneValidation(phoneNumber);
  const passwordError = getPasswordValidation(password);

  const fieldErrors = {
    username: usernameError,
    firstName: firstNameError,
    lastName: lastNameError,
    email: emailError,
    phoneNumber: phoneError,
    password: passwordError,
  };

  const formValid = Object.values(fieldErrors).every((value) => value === null);

  function markTouched(key: keyof typeof touched) {
    setTouched((current) => (current[key] ? current : { ...current, [key]: true }));
  }

  function inputClassName(hasError: boolean) {
    return [
      "mt-1 w-full rounded-xl border bg-white px-3 py-3 text-sm outline-none transition",
      hasError ? "border-red-300 focus:border-red-500" : "border-neutral-200 focus:border-neutral-500",
    ].join(" ");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setTouched({
      username: true,
      firstName: true,
      lastName: true,
      email: true,
      phoneNumber: true,
      password: true,
    });

    if (!formValid) {
      setErr("Fix the highlighted fields before registering.");
      return;
    }

    setLoading(true);
    try {
      const trimmedUsername = username.trim();
      const trimmedFirstName = firstName.trim();
      const trimmedLastName = lastName.trim();
      const trimmedEmail = email.trim();
      const trimmedPhone = phoneNumber.trim();

      await register({
        username: trimmedUsername,
        first_name: trimmedFirstName,
        last_name: trimmedLastName,
        email: trimmedEmail,
        password,
        role,
        phone_number: trimmedPhone,
      });
      router.replace("/login");
    } catch (error: unknown) {
      setErr(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <h1 className="text-2xl font-bold">Create account</h1>
      <p className="mt-1 text-sm text-neutral-600">Choose your role and get started.</p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}

        <div>
          <label className="text-xs font-semibold text-neutral-600">Role</label>
          <select
            className="mt-1 w-full rounded-xl border border-neutral-200 bg-white px-3 py-3 text-sm"
            value={role}
            onChange={(e) => setRole(e.target.value as "FARMER" | "BUYER" | "CONTRACTOR")}
          >
            <option value="FARMER">Farmer</option>
            <option value="BUYER">Buyer</option>
            <option value="CONTRACTOR">Contractor</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-600">Username</label>
          <input
            className={inputClassName(touched.username && !!usernameError)}
            value={username}
            onBlur={() => markTouched("username")}
            onChange={(e) => setUsername(e.target.value)}
          />
          <p className={`mt-1 text-xs ${touched.username && usernameError ? "text-red-700" : "text-neutral-500"}`}>
            {touched.username && usernameError ? usernameError : "Must start with a letter. Numbers are allowed after that."}
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-600">First name</label>
          <input
            className={inputClassName(touched.firstName && !!firstNameError)}
            value={firstName}
            onBlur={() => markTouched("firstName")}
            onChange={(e) => setFirstName(e.target.value)}
          />
          <p className={`mt-1 text-xs ${touched.firstName && firstNameError ? "text-red-700" : "text-neutral-500"}`}>
            {touched.firstName && firstNameError ? firstNameError : "Start with a letter. Use letters, spaces, apostrophes, or hyphens only."}
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-600">Last name</label>
          <input
            className={inputClassName(touched.lastName && !!lastNameError)}
            value={lastName}
            onBlur={() => markTouched("lastName")}
            onChange={(e) => setLastName(e.target.value)}
          />
          <p className={`mt-1 text-xs ${touched.lastName && lastNameError ? "text-red-700" : "text-neutral-500"}`}>
            {touched.lastName && lastNameError ? lastNameError : "Start with a letter. Use letters, spaces, apostrophes, or hyphens only."}
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-600">Email</label>
          <input
            type="email"
            className={inputClassName(touched.email && !!emailError)}
            value={email}
            onBlur={() => markTouched("email")}
            onChange={(e) => setEmail(e.target.value)}
          />
          <p className={`mt-1 text-xs ${touched.email && emailError ? "text-red-700" : "text-neutral-500"}`}>
            {touched.email && emailError ? emailError : "Use a standard email format such as name@example.com."}
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-600">Phone number</label>
          <input
            className={inputClassName(touched.phoneNumber && !!phoneError)}
            placeholder="+2547..."
            value={phoneNumber}
            onBlur={() => markTouched("phoneNumber")}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <p className={`mt-1 text-xs ${touched.phoneNumber && phoneError ? "text-red-700" : "text-neutral-500"}`}>
            {touched.phoneNumber && phoneError ? phoneError : "Accepted Kenyan formats: 0712345678, 254712345678, or +254712345678."}
          </p>
        </div>

        <div>
          <label className="text-xs font-semibold text-neutral-600">Password</label>
          <div className="relative mt-1">
            <input
              type={showPassword ? "text" : "password"}
              className={inputClassName(touched.password && !!passwordError).replace("mt-1 ", "")}
              value={password}
              onBlur={() => markTouched("password")}
              onChange={(e) => setPassword(e.target.value)}
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
          <p className={`mt-1 text-xs ${touched.password && passwordError ? "text-red-700" : "text-neutral-500"}`}>
            {touched.password && passwordError ? passwordError : "Use at least 8 chars, with uppercase, lowercase, numbers & symbols."}
          </p>
        </div>

        <button
          disabled={loading || !formValid}
          className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
        >
          {loading ? "Creating..." : "Register"}
        </button>
      </form>
    </div>
  );
}
