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
  return null;
}

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<"FARMER" | "PROCESSOR">("FARMER");
  const [password, setPassword] = useState("");
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
            onChange={(e) => setRole(e.target.value as "FARMER" | "PROCESSOR")}
          >
            <option value="FARMER">Farmer</option>
            <option value="PROCESSOR">Processor</option>
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
          <input
            type="password"
            className={inputClassName(touched.password && !!passwordError)}
            value={password}
            onBlur={() => markTouched("password")}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className={`mt-1 text-xs ${touched.password && passwordError ? "text-red-700" : "text-neutral-500"}`}>
            {touched.password && passwordError ? passwordError : "Use at least 8 characters."}
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
