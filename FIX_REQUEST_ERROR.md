# Fix: Listing request validation error

## Issue
Backend 400: \"listing: This field is required. | quantity_requested: This field is required.\"

## Root Cause
createRequest fallbacks try incompatible payloads first.

## Plan
1. Update createRequest to send exact payload: `{listing_id, quantity_requested, proposed_price, message}`
2. Test submission

## Steps
1. [x] Edit orders.js - Now using `listing` field (not `listing_id`) → payload: {listing, quantity_requested, proposed_price, message}
2. [ ] Test request submission
