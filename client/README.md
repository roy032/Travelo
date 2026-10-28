# Travelo Client

React frontend for Travelo, built with Vite and Tailwind CSS.

## Setup

```bash
npm install
cp .env.example .env   # set VITE_API_URL to the server origin, e.g. http://localhost:3000
npm run dev
```

The app runs at http://localhost:5173 and expects the server from `../server` to be running.

## Scripts

- `npm run dev` - start the dev server
- `npm run build` - production build
- `npm run preview` - preview the production build
- `npm run lint` - ESLint

## Offline use

The production build registers `public/sw.js`. At install it saves the app
shell and every JS/CSS chunk (`vite build` writes the list into the worker,
see `serviceWorkerManifest` in `vite.config.js`). API reads (trips,
itinerary, checklist, expenses, profile) and `/uploads` photos are saved as
they are viewed, network first, so a trip opened once still opens without
signal. Sign-in, health checks and identity documents are never stored, and
the saved data is deleted on sign-in and sign-out (`src/utils/offline.js`).
`OfflineBanner` shows when the device is offline and offers a reload when a
new version has taken over.

## Translations

Strings live in `src/i18n/locales/` (English `en.js`, Spanish `es.js`).
Components read them with `const { t } = useTranslation()` and
`t("nav.myTrips")`, or `t("nav.accountMenu", { name })` for placeholders.
The language starts from the saved choice, then the browser language, and
falls back to English; missing strings fall back to English too. To add a
language, copy `en.js`, translate it and register it in `src/i18n/index.js`;
`src/i18n/__tests__/i18n.test.js` fails if a key or placeholder is missing.
Translated so far: navbar, sign-in, sign-up, forgot password, My Trips and
the 404 page.
