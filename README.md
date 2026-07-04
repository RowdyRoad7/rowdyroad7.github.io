# RouteRx + DelRx

A mobile-first route planning and proof-of-delivery app for drivers. **RouteRx** turns a list of stops into an optimized, turn-by-turn route; **DelRx** captures a signed, photographed record of every delivery and keeps a searchable audit trail.

## Overview

| | |
|---|---|
| **RouteRx** | Enter a starting point, ending point, and up to 25 stops. Addresses are validated with Google Places Autocomplete, and the Google Routes API returns the most efficient stop order (traffic-aware), along with total distance and duration. Each stop opens directly in Google Maps for navigation. |
| **DelRx** | At each stop, capture a package photo and an on-screen recipient signature (one pair per order, if a stop has multiple orders). Records are written to Firestore as an immutable audit trail and surfaced in a records dashboard with date filtering, summary stats, and a printable/exportable delivery report. |

## Features

- **Address autocomplete & validation** — Google Places API (New) autocomplete for start, end, and every stop, with session tokens to keep billing efficient.
- **Route optimization** — Google Routes API (`computeRoutes`) with `optimizeWaypointOrder` and `TRAFFIC_AWARE` routing to reorder stops for the shortest trip.
- **Per-stop order tracking** — track number of orders per stop, mark stops done, and jump straight into Google Maps navigation for any leg.
- **Signature + photo capture** — an on-canvas signature pad (`signature_pad`) paired with a client-side compressed package photo per order, stored directly on the delivery record.
- **Delivery records dashboard** — searchable/filterable log of all deliveries with quick date presets (today / 7 days / 30 days / all), summary stats, and mobile card / desktop table views.
- **Printable delivery reports** — one-click export of a print-ready HTML report with signatures and package photos for a selected date range.
- **Auth** — Firebase Authentication with email/password and Google sign-in.
- **Immutable audit trail** — Firestore security rules only allow authenticated creates; records can never be edited or deleted from the client.
- **Responsive UI + light/dark theme** — optimized for use on a phone in the field, with a persistent theme toggle.
- **Local persistence** — in-progress routes are cached in `localStorage` so a refresh doesn't lose your stops.

## Tech Stack

- **React 19** + **Vite** (with `@vitejs/plugin-react`)
- **Firebase** — Authentication & Firestore
- **Google Maps Platform** — Places API (New) & Routes API
- **signature_pad** for on-device signature capture
- **framer-motion**, **lucide-react** for UI/animation
- **ESLint** for linting
- Deployed to **GitHub Pages** via GitHub Actions

## Project Structure
