"use client";

import { use, useState } from "react";
import { apiFetch } from "@/app/lib/api";
import ImagePicker from "@/app/components/ImagePicker";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ListingDetail } from "@/app/lib/types";
import { useEffect } from "react";
import { useAuthState } from "@/app/lib/useAuthState";
import ConfirmationModal from "@/app/components/ConfirmationModal";

export default function UploadListingImagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { accessToken, role, username } = useAuthState();
  const [ownerUsername, setOwnerUsername] = useState<string | null>(null);
  const [checkingOwner, setCheckingOwner] = useState(true);
  const isOwner = (role === "FARMER" || role === "CONTRACTOR") && !!username && ownerUsername === username;
  const [err, setErr] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadSucceeded, setUploadSucceeded] = useState(false);

  useEffect(() => {
    let mounted = true;
    setCheckingOwner(true);
    apiFetch<ListingDetail>(`/api/v1/listings/${id}/`, { method: "GET" }, { auth: false })
      .then((listing) => mounted && setOwnerUsername(listing.farmer_username))
      .catch((e: unknown) => mounted && setErr(e instanceof Error ? e.message : "Failed to verify listing ownership"))
      .finally(() => mounted && setCheckingOwner(false));
    return () => {
      mounted = false;
    };
  }, [id]);

  async function upload(files: File[]) {
    if (!isOwner) {
      setErr("Only the owner of this listing can upload images.");
      return;
    }
    setErr(null);
    setUploading(true);

    try {
      for (const file of files) {
        const fd = new FormData();
        fd.append("image", file);
        // Additional images uploaded via this page are not primary by default,
        // unless it's the very first image. Backend can handle the logic, or we just pass false.
        fd.append("is_primary", "false"); 

        await apiFetch(`/api/v1/listings/${id}/images/`, {
          method: "POST",
          body: fd,
        });
      }

      setUploadSucceeded(true);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "Upload failed for some images");
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
          to upload images.
        </p>
      </div>
    );
  }

  if (checkingOwner) {
    return <p className="text-sm text-neutral-500">Checking ownership...</p>;
  }

  if (!isOwner) {
    return (
      <div className="space-y-3 rounded-2xl border bg-white p-4">
        <h1 className="text-xl font-bold">Upload images</h1>
        <p className="text-sm text-neutral-600">
          Only the owner of this listing can upload images.
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
      <ConfirmationModal
        open={uploadSucceeded}
        title="Image uploaded"
        message="Your image was uploaded successfully and added to the listing."
        confirmLabel="View Listing"
        variant="success"
        showCancel={false}
        autoCloseMs={3000}
        onConfirm={() => router.push(`/listings/${id}`)}
        onAutoClose={() => router.push(`/listings/${id}`)}
        onCancel={() => router.push(`/listings/${id}`)}
      />
    </div>
  );
}
