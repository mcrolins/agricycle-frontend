import { apiFetch } from "./api";

// Processor: create a new request
export async function createRequest(data) {
  const payloads = [
    data,
    {
      listing: data.listing ?? data.listing_id,
      quantity_requested: data.quantity_requested,
      proposed_price: data.proposed_price,
      message: data.message,
    },
    {
      listing_id: data.listing_id ?? data.listing,
      quantity_requested: data.quantity_requested,
      proposed_price: data.proposed_price,
      message: data.message,
    },
    {
      listing: data.listing ?? data.listing_id,
      quantity: data.quantity_requested,
      price: data.proposed_price,
      notes: data.message,
    },
    {
      listing_id: data.listing_id ?? data.listing,
      quantity: data.quantity_requested,
      price: data.proposed_price,
      notes: data.message,
    },
  ];

  let lastError = null;

  for (const payload of payloads) {
    try {
      return await apiFetch(`/api/requests/create/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });
    } catch (error) {
      const status = typeof error === "object" && error && "status" in error ? error.status : undefined;
      if (status !== 400) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError ?? new Error("Failed to create request.");
}

// Processor: my requests
export const getMyRequests = () =>
  apiFetch(`/api/requests/mine/`);

// Farmer: incoming requests
export const getIncomingRequests = () =>
  apiFetch(`/api/requests/incoming/`);

// Update request status
export const updateRequestStatus = (id, status) =>
  apiFetch(`/api/requests/${id}/status/`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });

// Get contact info (farmer + processor)
export const getRequestContact = (id) =>
  apiFetch(`/api/requests/${id}/contact/`);

// Fetch request detail
export async function getRequestDetail(id) {
  const endpoints = [`/api/requests/mine/${id}/`, `/api/requests/${id}/`];
  let lastError = null;

  for (const endpoint of endpoints) {
    try {
      return await apiFetch(endpoint);
    } catch (error) {
      const status = typeof error === "object" && error && "status" in error ? error.status : undefined;
      if (status === 404) {
        lastError = error;
        continue;
      }
      throw error;
    }
  }

  throw lastError ?? new Error("Request detail endpoint not found.");
}
