# Gatherly

Gatherly is a real-time chat and room meeting app built with a React/Vite frontend, a Node.js/Express API, Socket.io, Prisma ORM, and Supabase PostgreSQL.

## Features

- One-to-one chat with realtime delivery, reactions, replies, pins, read state, and message expiry.
- Anonymous rooms with realtime chat, polls, participant management, room deletion, and optional passwords.
- Professional room meetings through LiveKit with host controls, waiting-room approval, and shared whiteboard.
- Status updates with text/media status composer, reactions, replies, and automatic status viewing.
- Supabase PostgreSQL persistence through Prisma.

## Project Structure

```text
Gatherly/
  client/   React/Vite app served by Vite locally or nginx in Docker
  server/   Express API, Socket.io handlers, Prisma schema, and services
  docker-compose.yml
```

## Environment

Create `server/.env` from `server/.env.example`.

Use the pooled Supabase URL for the running app:

```env
DATABASE_URL="postgresql://...:6543/postgres?pgbouncer=true"
```

Use the direct Supabase URL for Prisma migrations:

```env
DIRECT_URL="postgresql://...:5432/postgres"
```

Required server values:

```env
ACCESS_TOKEN_SECRET=
REFRESH_TOKEN_SECRET=
COOKIE_SECRET=
CLIENT_URL=http://localhost:5173
CORS_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

Optional values include Redis, ImageKit, SMTP, and LiveKit settings.

## Local Development

Install and start the server:

```bash
cd server
npm install
npx prisma generate
npm run dev
```

Install and start the client:

```bash
cd client
npm install
npm run dev
```

The client runs at `http://localhost:5173` and proxies API/socket traffic to `http://localhost:5000`.

## Docker

The Docker setup uses Supabase PostgreSQL from `server/.env`, Redis for realtime scaling/cache, the backend on port `5000`, and the frontend on port `8080`.

```bash
docker compose up --build
```

Open `http://localhost:8080`.

## Database

Prisma schema lives in `server/prisma/schema.prisma`.

Run migrations with the direct Supabase connection:

```bash
cd server
npx prisma migrate deploy
```
