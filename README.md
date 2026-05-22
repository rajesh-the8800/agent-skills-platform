# agent-skills-platform

Production-ready AI Skills Marketplace Platform (monorepo).

## Repo layout

- `apps/web`: Next.js frontend
- `apps/api`: NestJS backend
- `packages/*`: shared packages (UI, types, auth, config)
- `infrastructure/*`: Docker + Terraform

## Requirements

- Node.js >= 20
- npm >= 10 (recommended)

## Quickstart (local)

> This repo requires **Node.js 20+**. If you use `nvm`, run `nvm use` (uses `.nvmrc`).

1. Install dependencies:

```bash
npm install
```

2. Start local dependencies (Postgres):

```bash
docker compose -f infrastructure/docker/docker-compose.yml up -d
```

3. Run migrations:

```bash
npm run --workspace apps/api prisma:migrate
```

4. (Optional) Seed demo skills and a creator user for local download testing:

```bash
npm run prisma:seed --workspace @agent-skills/api
```

5. Copy `.env.example` to `.env` at the repo root (and ensure `apps/api` can read the same values you need, or symlink). Required for Google sign-in and protected downloads:

- `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`, `AUTH_URL` (web origin, e.g. `http://localhost:3000`)
- `INTERNAL_API_SECRET` (identical on web and API)
- `API_URL` (Nest base URL from the Next.js server, default `http://localhost:3001`)
- `AWS_*` and `AWS_S3_BUCKET` for presigned ZIP URLs

In the [Google Cloud Console](https://console.cloud.google.com/), create OAuth credentials and add the authorized redirect URI:

`{AUTH_URL}/api/auth/callback/google`

6. Start dev:

```bash
npm run dev
```

## Authentication & skill downloads

- Users sign in with **Google** via Auth.js (JWT session, HTTP-only cookies).
- The Next.js app acts as a **BFF**: the browser calls `POST /api/skills/:skillId/download`; the route checks the session, then calls Nest with `Authorization: Bearer INTERNAL_API_SECRET` and the synced `userId`.
- Nest validates the internal secret, records a row in `Download`, increments `Skill.installCount`, and returns a **short-lived S3 presigned URL**.
- Until S3 is configured, the download endpoint may respond with `503` from the API.

For **skill uploads** (`/dashboard/submit`), the browser performs a direct `PUT` to the presigned S3 URL. Your bucket needs **CORS** allowing `PUT` from your web origin (e.g. `http://localhost:3000`) and headers `Content-Type`. See [AWS S3 CORS documentation](https://docs.aws.amazon.com/AmazonS3/latest/userguide/cors.html).

If the browser shows **Auth.js** `ClientFetchError` / “There was a problem with the server configuration” ([autherror](https://errors.authjs.dev#autherror)), the usual cause is a missing **`AUTH_SECRET`** (or **`NEXTAUTH_SECRET`**) in the environment the Next.js server uses. Add it to `.env.local` under `apps/web` or your deployment env. For local dev, the app now falls back to a dev-only secret with a console warning if unset; **production builds require a real secret**.

## Local URLs

- Web: `http://localhost:3000`
- API health: `http://localhost:3001/health`
- Swagger: `http://localhost:3001/docs`
- PgAdmin: `http://localhost:5050` (user: `admin@local.dev`, pass: `admin`)

