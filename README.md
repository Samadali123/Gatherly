# Gatherly

Gatherly is a real-time communication workspace for direct chat, anonymous rooms, professional room meetings, status updates, and lightweight social discovery. It uses a React/Vite frontend, a Node.js/Express backend, Socket.io, Prisma ORM, Supabase PostgreSQL, Redis, LiveKit, ImageKit, and Google OAuth.

## What Gatherly Does

Gatherly is built for people and teams who need quick conversations without losing context. Users can message each other, search profiles, follow/unfollow, block unwanted contacts, create temporary anonymous rooms, pin important messages, reply in threads, share statuses, and run professional meetings with a waiting room and shared whiteboard.

## Core Features

- Email/phone password auth and Google login/signup.
- Personal and professional account modes.
- User profiles with username, bio, phone, avatar upload, follow/unfollow, and block/unblock.
- User search by name, username, email, or phone.
- One-to-one realtime chat with attachments, GIFs, reactions, replies, pinned messages, read state, call logs, and message expiry.
- Block-aware direct messaging.
- Status updates with text/photo/video composer, automatic story progression, and chat replies.
- Anonymous rooms with unique guest aliases, avatars, realtime chat, polls, participants, optional passwords, room expiry, and host-only delete.
- Professional room meetings powered by LiveKit.
- Meeting waiting room with host admit/deny.
- Host meeting controls for mute, camera off, and participant removal.
- Shared whiteboard for professional meetings.
- Supabase PostgreSQL persistence through Prisma.
- Redis-backed realtime/cache support for Docker/production.

## Tech Stack

- Frontend: React 18, Vite, Tailwind CSS, Zustand, Socket.io client, LiveKit React components, tldraw.
- Backend: Node.js 20, Express, Socket.io, Prisma, PostgreSQL, Redis, JWT auth, Joi validation.
- Database: Supabase PostgreSQL.
- Media: ImageKit.
- Meetings: LiveKit Cloud.
- Auth providers: Password auth and Google OAuth.
- Deployment: Dockerfiles for separate frontend and backend services, plus Docker Compose for local container testing.

## Project Structure

```text
Gatherly/
  client/              React/Vite frontend, nginx Docker image
  server/              Express API, Socket.io, Prisma, services
  docker-compose.yml   Local multi-container setup
  README.md
```

## Environment Variables

Do not commit real `.env` files. Keep secrets only in local `.env` files or your deployment provider's secret manager.

### Server Environment

Create `server/.env` with these values:

```env
NODE_ENV=development
PORT=5000

# Supabase PostgreSQL
DATABASE_URL=postgresql://USER:PASSWORD@HOST:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://USER:PASSWORD@HOST:5432/postgres

# Auth
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
COOKIE_SECRET=

# ImageKit
IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

# LiveKit
LIVEKIT_URL=wss://your-livekit-project.livekit.cloud
LIVEKIT_API_KEY=
LIVEKIT_API_SECRET=

# Email
EMAIL_USER=
EMAIL_USER_PASSWORD=

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# App URLs
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
APP_DOMAIN=http://localhost:5173

# Optional for production / Docker
REDIS_URL=redis://localhost:6379
TRUST_PROXY=loopback
COOKIE_SECURE=false
```

Use `DATABASE_URL` for the running app. Use `DIRECT_URL` for Prisma migrations.

### Client Environment

Create `client/.env`:

```env
REACT_APP_GIPHY_API_KEY=
```

This project maps `REACT_APP_GIPHY_API_KEY` through `client/vite.config.js`.

## Local Development

Install and start the backend:

```bash
cd server
npm install
npx prisma generate
npm run dev
```

Install and start the frontend:

```bash
cd client
npm install
npm run dev
```

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`

The Vite dev server proxies `/api` and `/socket.io` to the backend.

## Database Setup

Prisma schema lives in `server/prisma/schema.prisma`.

For a fresh Supabase database:

```bash
cd server
npm run db:rebuild -- --force
```

For production migrations:

```bash
cd server
npx prisma migrate deploy
```

Make sure `DIRECT_URL` points to the direct Supabase database connection when running migrations.

## Docker

The Docker setup runs:

- Redis on port `6379`
- Backend on port `5000`
- Frontend through nginx on port `8080`

Start everything:

```bash
docker compose up --build
```

Open:

```text
http://localhost:8080
```

In Docker Compose, the frontend proxies API and Socket.io traffic to the backend container through nginx.

## Production Deployment

You have one repo with two apps: `client` and `server`. Deploy them as two separate services from the same GitHub repository.

Recommended simple setup:

- Backend service: deploy from `server/`
- Frontend service: deploy from `client/`
- Database: Supabase PostgreSQL
- Redis: provider Redis, Upstash Redis, or the deploy platform's Redis plugin
- Media: ImageKit
- Meetings: LiveKit Cloud

### Recommended Platform

Railway is the easiest fit for this monorepo because it supports multiple services from one repository with separate root directories. Create one Railway project with:

- Service 1: `backend`, root directory `/server`
- Service 2: `frontend`, root directory `/client`
- Service 3: Redis, or use external Upstash Redis

Render is also a good option, but you will usually create two web services manually: one for `server/` and one static/site or Docker service for `client/`.

Vercel is good for the frontend only. For this app, the backend needs long-running Socket.io support, so host the backend on Railway, Render, Fly.io, or another container/web-service platform.

### Production Environment Changes

When deployed, update these server env values:

```env
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com
CORS_ORIGINS=https://your-frontend-domain.com
APP_DOMAIN=https://your-frontend-domain.com
COOKIE_SECURE=true
TRUST_PROXY=1
REDIS_URL=your-production-redis-url
```

Also update Google OAuth settings:

- Authorized JavaScript origin: `https://your-frontend-domain.com`
- Authorized redirect URI: your backend Google callback URL if using callback flow.

This app currently uses Google ID-token credential flow, so the frontend domain must be allowed in Google Cloud.

### Production Checklist

- Rotate all secrets that were ever pasted into chat, screenshots, Git, or logs.
- Do not commit `server/.env` or `client/.env`.
- Run Prisma migrations against Supabase.
- Confirm Google OAuth production origin is configured.
- Confirm LiveKit URL/API key/API secret are production values.
- Confirm ImageKit keys work in production.
- Use HTTPS URLs in `CLIENT_URL`, `CORS_ORIGINS`, and `APP_DOMAIN`.
- Set `COOKIE_SECURE=true` in production.
- Add a custom domain for frontend and backend if using separate domains.
- Test signup, Google login, direct chat, room join, meeting start, waiting room, whiteboard, status upload, and media upload after deployment.

## Dockerfiles

Backend Dockerfile:

- Uses `node:20-alpine`
- Installs production dependencies
- Runs `npx prisma generate`
- Starts with `node server.js`

Frontend Dockerfile:

- Builds Vite app with Node
- Serves static files with nginx
- Proxies `/api` and `/socket.io` through `client/nginx.conf`

## Important Security Note

If real database passwords, JWT secrets, ImageKit keys, LiveKit keys, SMTP passwords, or Google secrets were shared publicly or committed, rotate them before production deployment.
