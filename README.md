# Travelo

A collaborative trip planning application built with React, Node.js/Express, MongoDB and Socket.IO. Trip members can plan itineraries, share checklists and notes, track and split expenses, share photos and chat in real time.

## Features

- Authentication with HTTP-only JWT cookies
- NID/passport upload and admin verification (required to create or join domestic/international trips)
- Trips: create, edit, invite members, join requests
- Real-time group chat per trip (Socket.IO) and in-app notifications
- Day-by-day itinerary with map view
- Shared checklist and packing suggestions
- Expense logging with receipts and equal split calculation
- Photo gallery and private/shared notes
- Destination explorer
- Admin dashboard: users, verification queue, trip reports

## Tech stack

- Client: React 19, Vite, React Router, Tailwind CSS, Socket.IO client, React Leaflet
- Server: Node.js, Express 5, MongoDB with Mongoose, Socket.IO, JWT, Zod, Multer, UploadThing

## Getting started

### Prerequisites

- Node.js 20.19 or later and npm
- A MongoDB instance (local or Atlas)
- An UploadThing token (required for document, receipt and photo uploads)

### 1. Install dependencies

```bash
git clone https://github.com/roy032/Travelo.git
cd Travelo

cd server && npm install
cd ../client && npm install
```

### 2. Configure environment variables

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```

Then edit `server/.env` and set at least `MONGODB_URI`, `JWT_SECRET` and `UPLOADTHING_TOKEN`. The server refuses to start without `MONGODB_URI` and `JWT_SECRET`.

Server (`server/.env`):

| Variable | Required | Description |
| --- | --- | --- |
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes | Long random string used to sign auth tokens |
| `UPLOADTHING_TOKEN` | for uploads in production | UploadThing API token. Without it, development stores uploads in `server/src/uploads` |
| `FILE_STORAGE` | no | Set to `local` to store uploads on disk even with a token (never use on hosts with ephemeral disks) |
| `JWT_EXPIRES_IN` | no | Token and cookie lifetime, e.g. `1d`, `12h` (default `1d`) |
| `PORT` | no | HTTP port (default `3000`) |
| `NODE_ENV` | no | `development` or `production` (secure cookies in production) |
| `CLIENT_URL` | no | Allowed client origin(s) for CORS and Socket.IO, comma-separated (default `http://localhost:5173`) |
| `TRUST_PROXY` | no | Set to `true` when running behind a reverse proxy |

Client (`client/.env`):

| Variable | Description |
| --- | --- |
| `VITE_API_URL` | Server origin without the `/api` suffix, e.g. `http://localhost:3000` |

### 3. Seed destinations (optional)

```bash
cd server
npm run seed:destinations
```

### 4. Run in development

In two terminals:

```bash
cd server
npm run dev
```

```bash
cd client
npm run dev
```

- Client: http://localhost:5173
- API: http://localhost:3000/api

To make yourself an admin, register an account, then either list its email in `ADMIN_EMAILS` in `server/.env` and sign in again, or run `npm run make-admin -- you@example.com` in `server/`.

## Scripts

Server (`server/`):

- `npm run dev` - start with nodemon
- `npm start` - start with node
- `npm run make-admin -- <email>` - promote an existing account to admin
- `npm test` - run tests (Vitest); set `MONGODB_TEST_URI` (e.g. `mongodb://localhost:27017`) to include the API tests, which use a throwaway database
- `npm run seed:destinations` - seed destination data
- `npm run lint` / `npm run format` - ESLint / Prettier

Client (`client/`):

- `npm run dev` - start the Vite dev server
- `npm run build` - production build
- `npm run preview` - preview the production build
- `npm test` - component and API client tests (Vitest + Testing Library)
- `npm run lint` - ESLint

End-to-end tests (`e2e/`, Playwright) build the client, start the server on port 3100 against a local MongoDB (`E2E_MONGODB_URI`, default `mongodb://127.0.0.1:27017/travelo_e2e`, wiped on every run) and drive Chromium through sign-up, login, trip creation, photo upload, Explore, NID verification and joining a trip:

```bash
cd e2e
npm ci
npx playwright install chromium
npm test
```

CI runs all three suites with a MongoDB service container.

## Deployment

The root `Dockerfile` builds the client and serves it from the API server, so the app and API share one origin (the auth cookie is `SameSite=strict`). It runs on any Docker host, such as Render, Railway or Fly.io.

```bash
docker build -t travelo .
docker run -p 3000:3000 \
  -e MONGODB_URI=... -e JWT_SECRET=... -e UPLOADTHING_TOKEN=... \
  -e CLIENT_URL=https://your-domain -e TRUST_PROXY=true \
  travelo
```

Set `CLIENT_URL` to the public URL. `CLIENT_DIST` is set by the image; outside Docker, point it at `client/dist` to serve the built client from the server. See [DEPLOY.md](DEPLOY.md) for step-by-step Render setup and credential rotation.

## Project structure

```
Travelo/
├── client/                React frontend (Vite)
│   └── src/
│       ├── components/    UI and feature components
│       ├── context/       Auth context
│       ├── hooks/         Custom hooks (socket, pagination, ...)
│       ├── pages/         Route pages
│       ├── services/      API client
│       └── utils/
└── server/                Express API
    └── src/
        ├── config/        Database and UploadThing setup
        ├── controllers/
        ├── middlewares/   Auth, uploads, rate limiting, errors
        ├── models/        Mongoose models
        ├── routes/
        ├── services/      Business logic
        ├── socket/        Socket.IO chat server
        ├── jobs/          Scheduled jobs
        └── validations/   Zod schemas
```

## Team

- Jayanta - authentication, document verification, trip management, checklist, chat and notifications
- Pallab - member management, destination explorer, map view, photos and notes
- Avrow - itinerary planner, expense tracking, split calculation and admin features

## License

ISC
