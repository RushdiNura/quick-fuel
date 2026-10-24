# QuickFuel — React frontend

React 19 + TypeScript + Vite + Tailwind CSS, talking to the Supabase backend
in `quickfuel-backend/`. No demo/mock mode here — this is the real app,
built to run against your live project. If you haven't deployed the backend
yet, do that first (see its own README).

## Setup
```bash
cd quickfuel-frontend
npm install
cp .env.example .env
# edit .env with your Supabase project URL + anon key
npm run dev
```

## What's here
- `src/contexts/AuthContext.tsx` — session, profile (with car class joined),
  and notifications, refreshed on auth state change.
- `src/contexts/LangContext.tsx` — English / Amharic / Oromo, persisted to
  localStorage. Admin/owner back-office screens are English-only by design
  (see note below); the driver and operator flows are fully translated.
- `src/lib/api.ts` — typed wrappers for every edge function
  (`reserve`, `mock-payment`, `verify-code`, `dispense-authorise`,
  `dispense-complete`, `request-refund`, `approve-refund`, `create-user`,
  `create-station`).
- `src/pages/driver/` — station list/map toggle, the five-step reservation
  flow, reservation history with refund requests.
- `src/pages/operator/` — pickup-code verification + two-step dispensing.
- `src/pages/owner/` — inventory + a real Chart.js demand/revenue chart.
- `src/pages/admin/` — stats, refund approval, create-user, register-station,
  station verification, recent activity feed.

## Interface design
The interface uses a cohesive QuickFuel design system across driver, operator, station-owner, administrator, and sign-in screens:
- Responsive layouts designed for small phones through desktop workspaces.
- A restrained petrol-green and warm-amber palette, paper surfaces, refined typography, and consistent spacing.
- Accessible focus indicators, semantic controls for interactive choices, reduced-motion support, and light/dark color tokens.
- Shared buttons, fields, cards, dialogs, notifications, and status styles to keep interactions consistent.

## Honest limitations (same as the backend)
- The driver's station "map" is a schematic SVG, not a real tiled map —
  wiring in Google Maps or Mapbox needs an API key and billing account
  this project doesn't have. The component is isolated in
  `src/pages/driver/SchematicMap.tsx` so swapping it is a contained change.
- Amharic/Oromo strings in `src/lib/i18n.ts` are best-effort translations,
  not reviewed by a native speaker — worth a pass before shipping to real
  users.
- Payment is still the mock simulation from the backend; swap
  `api.mockPayment` for real Telebirr/Chapa calls once you have merchant
  credentials.
- No automated test suite was written for this pass — `npm run build`
  (which runs `tsc -b`) is your first line of defense; I'd recommend adding
  Vitest + React Testing Library before this goes further, matching what
  Chapter 4 of the document already lists as the testing stack.

## Deploying
`npm run build` outputs static files in `dist/` — deploy that to Vercel,
Netlify, or any static host, same as the document's own deployment diagram
(Chapter 3.4) describes.
