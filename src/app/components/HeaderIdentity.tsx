"use client";

import { useAuthState } from "@/app/lib/useAuthState";

function formatRole(role: string | null) {
  if (!role) return null;
  return role.toLowerCase();
}

export default function HeaderIdentity() {
  const { role, username } = useAuthState();

  if (!username) {
    return <p className="text-sm text-neutral-700">Sustainable Farm Exchange</p>;
  }

  const readableRole = formatRole(role);

  return (
    <p className="text-sm text-neutral-700">
      Hello {readableRole ? `${readableRole} ` : ""}
      {username}
    </p>
  );
}
