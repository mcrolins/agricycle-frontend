"use client";

import { use, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import ImagePicker from "@/app/components/ImagePicker";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { WasteListingDetail } from "@/app/lib/types";
import { useEffect } from "react";
import { useAuthState } from "@/app/lib/useAuthState";

export default function UploadListingImagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { accessToken, role, username } = useAuthState();
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [checkingOwner, setCheckingOwner] = useState(true);
  const isOwnerFarmer = role === "FARMER" && !!username && ownerUsername === username;
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setCheckingOwner(true);
    apiFetch<WasteListingDetail>(`/api/v1/listings/${id}/`, { method: "GET" }, { auth: false })
      .then((listing) => mounted && setOwnerUsername(listing.farmer_username))
      .catch((e: unknown) => mounted && setErr(e instanceof Error ? e.message : "Failed to verify listing ownership"))
      .finally(() => mounted && setCheckingOwner(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  async function upload(file: File) {
    if (!isOwnerFarmer) {
      setErr("Only the farmer who created this listing can upload images.");
      return;
    }
    setErr(null);
    setUploading(true);

    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("is_primary", "true");

      await apiFetch(`/api/v1/listings/${id}/images/`, {
        method: "POST",
        body: fd,
      });

      router.push(`/listings/${id}`);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (!accessToken) {
    return (
      <div className="space-y-3 rounded-2xl border bg-white p-4">
        <h1 className="text-xl font-bold">Upload images</h1>
        <p className="text-sm text-neutral-600">
          Please{" "}
          <Link href="/login" className="font-semibold underline">
            log in
          </Link>{" "}
          as a farmer to upload images.
        </p>
      </div>
    );
  }

  if (checkingOwner) {
    return <p className="text-sm text-neutral-500">Checking ownership...</p>;
  }

  if (!isOwnerFarmer) {
    return (
      <div className="space-y-3 rounded-2xl border bg-white p-4">
        <h1 className="text-xl font-bold">Upload images</h1>
        <p className="text-sm text-neutral-600">
          Only the farmer who created this listing can upload images.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Upload images</h1>
      {err && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{err}</div>}
      <ImagePicker onPick={upload} />
      {uploading && <p className="text-sm text-neutral-500">Uploading...</p>}
    </div>
  );
}
