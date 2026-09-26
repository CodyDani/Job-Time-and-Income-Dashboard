# Job Time and Income Dashboard

A small React + Vite app for tracking work sessions and payouts. Built with React (TypeScript) and Tailwind; includes basic PWA support (manifest + service worker).

## Features

- Clean dark-mode dashboard UI: overview and per-account detail screens with high-contrast cards and clear metric hierarchy.
- Accounts grid with interactive Account Cards showing name, editable hourly rate pill, total hours, and pending payout.
- Overview top-stats banner: total payout, total hours, and a quick-action/status card.
- Per-account detail view with metrics row (timeframe selector), work sessions history, and payout history.
- Inline modals: create account, log work session (From/To times + optional Date + Today/Previously), and record payouts.
- Robust time handling: accepts `HH:MM` or `HH:MM:SS`, supports hours > 24, and computes numeric durations correctly.
- Currency formatted to Nigerian Naira (NGN / ₦) throughout the UI; payouts and balances derive from the editable account rate.
- Empty-state UX: clear prompt and CTA when no accounts exist ("Create Your First Account").
- No seed/sample accounts by default — clean project on first run.
- Basic PWA support: `site.webmanifest` and `sw.js` with registration in `src/main.tsx`.

## Quickstart

Prerequisites

- Node.js (16+ recommended)
- npm or pnpm

Install

```bash
npm install
# or
pnpm install
```

Run dev server (choose alternative port if 8443 is in use)

```bash
# default
npm run dev
# or pick a free port (example: 5173)
npm run dev -- --port 5173
```

Build and preview

```bash
npm run build
npm run preview
```

## PWA Notes

- Manifest: [site.webmanifest](site.webmanifest)
- Service worker: [sw.js](sw.js)
- SW registration: [src/main.tsx](src/main.tsx)

The service worker is a minimal cache-first worker for offline fallback. In development the dev server may bypass SW behavior; run `npm run build` and `npm run preview` to test installability and offline caching.

## Important Files

- App entry: [src/main.tsx](src/main.tsx)
- Main UI + logic: [src/App.tsx](src/App.tsx)
- Global styles: [src/index.css](src/index.css)
- HTML shell: [index.html](index.html)

## Time & Duration Behavior

- Enter times as `HH:MM` or `HH:MM:SS`. The app supports hours > 24 (e.g., `62:00`).
- Duration is calculated as numeric difference in hours/minutes between start and end times.

## Troubleshooting

- If `npm run dev` fails with "port in use", pick another port (see examples above) or free the port.
- If service worker caching causes stale assets during development, unregister the SW in the browser devtools -> Application -> Service Workers.

## Contributing

Small project — open an issue or PR. If you want me to run the dev server or add improved PWA caching (Workbox), say so and I can implement and test it.

## License

MIT — add your license file if desired.
