# Deploying Travelo

Travelo ships as one Docker image: the server serves the API, Socket.IO and the built client on a single origin. These steps use Render (free plan) and MongoDB Atlas. The same image runs on Railway or Fly.io with the same environment variables.

## 1. Rotate the leaked credentials

A MongoDB Atlas password and an UploadThing token were committed in `server/.env.example` and are still in git history. Treat both as public.

**MongoDB Atlas**

1. Open [cloud.mongodb.com](https://cloud.mongodb.com) and select the project with the `clientworks` cluster.
2. Go to **Security > Database Access**.
3. Click **Add New Database User**. Choose password authentication, click **Autogenerate Secure Password**, and copy it. Give the user **Read and write to any database**, then click **Add User**.
4. Delete the old `developer0` user (click **Delete** on its row).
5. Go to **Security > Network Access** and click **Add IP Address > Allow Access from Anywhere** (`0.0.0.0/0`). Render's free plan has no fixed outbound IP.
6. Go to **Database > Connect > Drivers** and copy the connection string. Replace `<username>` and `<password>` with the new user, and add the database name before the `?`, so it reads `...mongodb.net/travelo?retryWrites=true&w=majority`. This is your `MONGODB_URI`.

**UploadThing**

1. Open [uploadthing.com/dashboard](https://uploadthing.com/dashboard) and select the Travelo app.
2. Go to **API Keys**, create a new key, and copy the `UPLOADTHING_TOKEN` value.
3. Delete or roll the old key so the leaked token stops working.

**JWT secret**

The Render blueprint generates a new random `JWT_SECRET`. If you deploy elsewhere, generate one with `openssl rand -hex 32`.

## 2. Deploy on Render

1. Sign up at [render.com](https://render.com) with your GitHub account and allow it access to `roy032/Travelo`.
2. Click **New > Blueprint**, pick the `Travelo` repository and the `main` branch. Render reads `render.yaml`.
3. Render asks for the three values marked `sync: false`:
   - `MONGODB_URI`: the connection string from step 1.
   - `UPLOADTHING_TOKEN`: the new token from step 1.
   - `CLIENT_URL`: `https://travelo.onrender.com`. If Render gives the service a different URL, update this value to match after the first deploy.
   - `ADMIN_EMAILS`: the email you will register with, e.g. `you@example.com`. Accounts listed here become admins when they sign in.
4. Click **Apply**. The first build takes a few minutes. The service is healthy when `https://<your-service>.onrender.com/api/health` returns `{"status":"ok","database":"connected",...}`. It returns 503 when the database is unreachable, and Render uses it as the health check.

The free plan sleeps after 15 minutes without traffic and takes about a minute to wake. Use a paid instance if that matters for launch.

## 3. Right after the first deploy

1. **Register your own account immediately** with the email in `ADMIN_EMAILS`, then sign out and back in to get admin access. Signing up never grants admin, so if registration says the email already exists, someone else took it: remove it from `ADMIN_EMAILS` and register with another address. You can also promote an existing account from your machine with `MONGODB_URI="..." npm run make-admin -- you@example.com` in `server/`.
2. Seed the destination explorer from your machine:

   ```bash
   cd server
   MONGODB_URI="<your MONGODB_URI>" npm run seed:destinations
   ```

3. Check login, trip creation, chat (open a trip in two browsers) and a photo upload.

## 4. Monitoring

**Error tracking (Sentry).** Create a free project at [sentry.io](https://sentry.io) (platform: Node.js, plus a second React project if you want browser errors). In the Render service, open **Environment** and add:

- `SENTRY_DSN`: the Node.js project's DSN. Server crashes and 5xx errors are reported.
- `VITE_SENTRY_DSN`: the React project's DSN. It is baked into the client at build time, so trigger a new deploy after adding it.

Leave both unset to disable error tracking. Cookies, auth headers and IP addresses are never sent.

**Uptime check.** Pick one or both:

- In GitHub, open **Settings > Secrets and variables > Actions > Variables** and add `HEALTHCHECK_URL` = `https://<your-service>.onrender.com/api/health`. The `Uptime check` workflow polls it every 10 minutes, and GitHub emails you when a run fails. It also keeps a free instance from sleeping.
- Or add an HTTP monitor for the same URL at [uptimerobot.com](https://uptimerobot.com) (free, 5-minute interval, email or SMS alerts).

## Security notes

- Sign-up and sign-in are limited to 10 attempts per IP and per account every 15 minutes, and the API to 300 requests per IP per minute. Override with `AUTH_RATE_LIMIT_MAX` and `API_RATE_LIMIT_MAX`. The limits are kept in memory, so they are per instance.
- CI runs gitleaks over the full git history on every push and pull request, and fails if a secret is committed. Previously leaked, rotated secrets are listed in `.gitleaksignore`.
- Dependabot opens weekly pull requests for vulnerable dependencies.

## Environment variables

| Variable | Required | Value |
| --- | --- | --- |
| `MONGODB_URI` | yes | Atlas connection string |
| `JWT_SECRET` | yes | Long random string |
| `UPLOADTHING_TOKEN` | for uploads | UploadThing API token |
| `CLIENT_URL` | yes in production | Public URL of the app, e.g. `https://travelo.onrender.com` |
| `SITE_URL` | no | Public URL used in share previews, the sitemap and robots.txt; defaults to the first `CLIENT_URL` |
| `TRUST_PROXY` | behind a proxy | `true` on Render, Railway and Fly.io |
| `JWT_EXPIRES_IN` | no | Session length, default `1d` |
| `ADMIN_EMAILS` | to have an admin | Comma-separated emails made admin on sign-in |
| `SENTRY_DSN` | no | Server error tracking |
| `VITE_SENTRY_DSN` | no | Browser error tracking (build time) |
| `SENTRY_TRACES_SAMPLE_RATE` | no | Performance tracing sample rate, default `0` |
| `AUTH_RATE_LIMIT_MAX` | no | Auth attempts per 15 minutes, default `10` |
| `API_RATE_LIMIT_MAX` | no | API requests per minute, default `300` |
| `PORT` | no | Set by the host; defaults to `3000` |

`NODE_ENV=production` and `CLIENT_DIST` are set inside the Docker image.
