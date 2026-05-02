"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getRequestContact, getRequestDetail } from "@/app/lib/orders";
import { useAuthState } from "@/app/lib/useAuthState";
import { apiFetch } from "@/app/lib/api";

function formatMoney(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return "-";
  return numeric.toLocaleString();
}

function formatQty(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value ?? "-");
  return numeric.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export default function RequestDetailPage() {
  const { id } = useParams();
  const [request, setRequest] = useState(null);
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);
  const [error, setError] = useState("");
  const [contactError, setContactError] = useState("");

  const { role } = useAuthState();
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: "" });
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewError, setReviewError] = useState("");

  const [complaintForm, setComplaintForm] = useState({ description: "" });
  const [complaintLoading, setComplaintLoading] = useState(false);
  const [complaintSuccess, setComplaintSuccess] = useState(false);
  const [complaintError, setComplaintError] = useState("");

  const targetUser = contact ? (role === "FARMER" ? contact.processor : contact.farmer) : null;

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ quantity_requested: "", proposed_price: "", message: "" });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  const isPending = request?.status === "PENDING";
  const isProcessor = role === "PROCESSOR";

  async function handleCancel() {
    if (!window.confirm("Are you sure you want to cancel this request?")) return;
    setCancelLoading(true);
    setCancelError("");
    try {
      await apiFetch(`/api/requests/${id}/status/`, {
        method: "PATCH",
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      setRequest({ ...request, status: "CANCELLED" });
    } catch (err) {
      setCancelError(err.message || "Failed to cancel request.");
    } finally {
      setCancelLoading(false);
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditLoading(true);
    setEditError("");
    try {
      const res = await apiFetch(`/api/requests/mine/${id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          quantity_requested: Number(editForm.quantity_requested),
          proposed_price: Number(editForm.proposed_price),
          message: editForm.message || "",
        }),
      });
      setRequest(res);
      setIsEditing(false);
    } catch (err) {
      setEditError(err.message || "Failed to update request.");
    } finally {
      setEditLoading(false);
    }
  }

  function startEditing() {
    setEditForm({
      quantity_requested: request.quantity_requested || "",
      proposed_price: request.proposed_price || "",
      message: request.message || request.notes || request.description || "",
    });
    setIsEditing(true);
  }

  async function submitReview(e) {
    e.preventDefault();
    if (!targetUser) return;
    setReviewLoading(true);
    setReviewError("");
    setReviewSuccess(false);
    try {
      await apiFetch("/api/accounts/review/", {
        method: "POST",
        body: JSON.stringify({
          reviewee: targetUser.id,
          request_id: id,
          rating: reviewForm.rating,
          comment: reviewForm.comment
        })
      });
      setReviewSuccess(true);
      setReviewForm({ rating: 5, comment: "" });
    } catch (err) {
      setReviewError(err.message || "Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  }

  async function submitComplaint(e) {
    e.preventDefault();
    if (!targetUser) return;
    setComplaintLoading(true);
    setComplaintError("");
    setComplaintSuccess(false);
    try {
      await apiFetch("/api/accounts/complaint/", {
        method: "POST",
        body: JSON.stringify({
          reported: targetUser.id,
          description: complaintForm.description
        })
      });
      setComplaintSuccess(true);
      setComplaintForm({ description: "" });
    } catch (err) {
      setComplaintError(err.message || "Failed to submit complaint");
    } finally {
      setComplaintLoading(false);
    }
  }

  async function loadContact() {
    try {
      setContactLoading(true);
      setContactError("");
      const data = await getRequestContact(id);
      setContact(data);
    } catch (err) {
      setContactError(err instanceof Error ? err.message : "Failed to load contact info.");
    } finally {
      setContactLoading(false);
    }
  }

  useEffect(() => {
    let isMounted = true;

    getRequestDetail(id)
      .then((data) => {
        if (isMounted) setRequest(data);
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : "Failed to load request.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  if (loading) return <p className="text-sm text-neutral-500">Loading request...</p>;
  if (error) return <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>;
  if (!request) return <p className="text-sm text-neutral-500">Request not found.</p>;
  const quantity = request.quantity_requested ?? request.quantity ?? "-";
  const unitPrice = request.proposed_price ?? request.price ?? "-";
  const unit = request.listing_unit || request.unit || "unit";
  const totalCost =
    Number.isFinite(Number(quantity)) && Number.isFinite(Number(unitPrice)) ? Number(quantity) * Number(unitPrice) : null;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-5">
      <section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--brand)]">Order Request</p>
        <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold text-[var(--brand-strong)]">Request #{request.id}</h1>
          <span className="inline-flex rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-700">
            {request.status || "PENDING"}
          </span>
        </div>
        <p className="mt-2 text-sm text-neutral-700">
          Review the request summary, confirm quantities and pricing, then unlock contact details once accepted.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Listing</p>
          <p className="mt-1 text-lg font-semibold text-neutral-900">
            {request.listing_waste_type || request.waste_type || "Waste request"}
          </p>
          <p className="mt-2 text-sm text-neutral-600">{request.listing_location || request.location || "Location pending"}</p>
        </div>
        {isEditing ? (
          <form onSubmit={handleEditSubmit} className="rounded-2xl border bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Edit Commercial Terms</p>
            <div className="mt-3 space-y-3">
              <label className="block text-sm font-semibold">
                Quantity
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  className="mt-1 block w-full rounded-xl border p-2 text-sm"
                  value={editForm.quantity_requested}
                  onChange={(e) => setEditForm({ ...editForm, quantity_requested: e.target.value })}
                />
              </label>
              <label className="block text-sm font-semibold">
                Price per {unit}
                <input
                  type="number"
                  step="any"
                  min="0"
                  required
                  className="mt-1 block w-full rounded-xl border p-2 text-sm"
                  value={editForm.proposed_price}
                  onChange={(e) => setEditForm({ ...editForm, proposed_price: e.target.value })}
                />
              </label>
              <label className="block text-sm font-semibold">
                Notes
                <textarea
                  className="mt-1 block w-full rounded-xl border p-2 text-sm"
                  value={editForm.message}
                  onChange={(e) => setEditForm({ ...editForm, message: e.target.value })}
                />
              </label>
              {editError && <p className="text-sm text-red-600">{editError}</p>}
              <div className="flex gap-2 pt-2">
                <button type="submit" disabled={editLoading} className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                  {editLoading ? "Saving..." : "Save Changes"}
                </button>
                <button type="button" onClick={() => setIsEditing(false)} className="rounded-xl border px-4 py-2 text-sm font-semibold text-neutral-700">
                  Cancel
                </button>
              </div>
            </div>
          </form>
        ) : (
          <div className="rounded-2xl border bg-white p-4">
            <div className="flex justify-between items-start">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Commercial Terms</p>
              {isProcessor && isPending && (
                <div className="flex gap-2">
                  <button onClick={startEditing} className="text-xs font-semibold text-blue-600 hover:underline">Edit</button>
                  <button onClick={handleCancel} disabled={cancelLoading} className="text-xs font-semibold text-red-600 hover:underline disabled:opacity-50">{cancelLoading ? "Cancelling..." : "Cancel"}</button>
                </div>
              )}
            </div>
            {cancelError && <p className="text-xs text-red-600 mt-1">{cancelError}</p>}
            <p className="mt-1 text-sm text-neutral-700">Quantity: {formatQty(quantity)} {unit}</p>
            <p className="mt-2 text-sm text-neutral-700">Price per {unit}: KES {formatMoney(unitPrice)}</p>
            <p className="mt-2 text-sm text-neutral-700">Estimated total: {totalCost === null ? "-" : `KES ${formatMoney(totalCost)}`}</p>
          </div>
        )}
      </section>

      {!!(request.message || request.notes || request.description) && (
        <section className="rounded-2xl border bg-white p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Notes</p>
          <p className="mt-2 text-sm leading-6 text-neutral-700">
            {request.message || request.notes || request.description}
          </p>
        </section>
      )}

      {request.status === "ACCEPTED" ? (
        <section className="rounded-2xl border bg-white p-4">
          <h2 className="text-lg font-semibold text-neutral-900">Contact Exchange</h2>
          <p className="mt-2 text-sm text-neutral-600">
            Once accepted, both parties can view contact details and coordinate pickup, delivery, and payment directly.
          </p>
          <button
            type="button"
            onClick={loadContact}
            disabled={contactLoading}
            className="mt-4 rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {contactLoading ? "Loading contact..." : "View Contact Info"}
          </button>

          {contactError && <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{contactError}</div>}

          {contact && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl bg-[var(--surface)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Farmer</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">{contact.farmer.name}</p>
                <p className="mt-1 text-sm text-neutral-600">{contact.farmer.phone_number}</p>
              </div>
              <div className="rounded-xl bg-[var(--surface)] p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Processor</p>
                <p className="mt-1 text-sm font-semibold text-neutral-900">{contact.processor.name}</p>
                <p className="mt-1 text-sm text-neutral-600">{contact.processor.phone_number}</p>
              </div>
            </div>
          )}

          {contact && targetUser && (
            <div className="mt-6 border-t pt-6 space-y-6">
              <div>
                <h3 className="font-semibold text-neutral-900">Leave a Review</h3>
                <p className="text-sm text-neutral-600 mt-1">Share your experience with {targetUser.name} (Optional)</p>
                {reviewSuccess ? (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    Review submitted successfully!
                  </div>
                ) : (
                  <form onSubmit={submitReview} className="mt-3 space-y-3">
                    <label className="block text-sm font-semibold">
                      Rating (1-5 stars)
                      <select 
                        className="mt-1 block w-full rounded-xl border p-2 text-sm"
                        value={reviewForm.rating}
                        onChange={e => setReviewForm({...reviewForm, rating: Number(e.target.value)})}
                      >
                        {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                      </select>
                    </label>
                    <label className="block text-sm font-semibold">
                      Comment
                      <textarea 
                        className="mt-1 block w-full rounded-xl border p-2 text-sm h-20"
                        placeholder="Write your review here..."
                        value={reviewForm.comment}
                        onChange={e => setReviewForm({...reviewForm, comment: e.target.value})}
                      />
                    </label>
                    <button type="submit" disabled={reviewLoading} className="rounded-xl bg-neutral-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                      {reviewLoading ? "Submitting..." : "Submit Review"}
                    </button>
                    {reviewError && <p className="text-red-600 text-sm mt-1">{reviewError}</p>}
                  </form>
                )}
              </div>

              <div>
                <h3 className="font-semibold text-red-600">Report an Issue</h3>
                <p className="text-sm text-neutral-600 mt-1">If there was a serious problem, you can file a complaint directly to the admin.</p>
                {complaintSuccess ? (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    Complaint submitted. An admin will review it shortly.
                  </div>
                ) : (
                  <form onSubmit={submitComplaint} className="mt-3 space-y-3">
                    <label className="block text-sm font-semibold">
                      Description
                      <textarea 
                        required
                        className="mt-1 block w-full rounded-xl border border-red-200 p-2 text-sm h-20"
                        placeholder="Describe the issue in detail..."
                        value={complaintForm.description}
                        onChange={e => setComplaintForm({...complaintForm, description: e.target.value})}
                      />
                    </label>
                    <button type="submit" disabled={complaintLoading} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
                      {complaintLoading ? "Submitting..." : "Submit Complaint"}
                    </button>
                    {complaintError && <p className="text-red-600 text-sm mt-1">{complaintError}</p>}
                  </form>
                )}
              </div>
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-4 text-sm text-neutral-600">
          Contact details unlock only after the request is accepted.
        </section>
      )}

      <div className="flex flex-wrap gap-2">
        <Link href="/orders/my" className="rounded-xl border px-4 py-2 text-sm font-semibold">
          My Requests
        </Link>
        <Link href="/orders/incoming" className="rounded-xl border px-4 py-2 text-sm font-semibold">
          Incoming Requests
        </Link>
      </div>
    </div>
  );
}
