# Task Manager — MERN Stack

A full-stack task management application built with **MongoDB, Express, React, and Node.js** (TypeScript throughout). Users register, log in, and manage their own tasks on a Kanban board with search, filtering, per-column pagination, drag-and-drop, and cover-image uploads.

---

## Table of contents

- [Features](#features)
- [Tech stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Quick start (Docker)](#quick-start-docker)
- [Manual setup](#manual-setup)
- [Environment variables](#environment-variables)
- [Test accounts](#test-accounts)
- [Project structure](#project-structure)
- [Architecture](#architecture)
- [API endpoints](#api-endpoints)
- [Deployment](#deployment)
- [Known issues / limitations](#known-issues--limitations)
- [AI & tools disclosure](#ai--tools-disclosure)

---

## Features

### Core requirements (all implemented)

- ✅ User **registration and login**
- ✅ **JWT-based authentication** with protected API endpoints
- ✅ Each user can access **only their own tasks** (enforced at the data layer)
- ✅ **Create, read, update, delete** tasks
- ✅ Every task has **title, description, status, priority, due date**
- ✅ Statuses: **To Do / In Progress / Done** · Priorities: **Low / Medium / High**
- ✅ **Search** tasks by title
- ✅ **Filter** tasks by status and priority
- ✅ **Responsive** UI (desktop + mobile) via Tailwind CSS
- ✅ Clear **loading, error, empty-state, and validation** feedback
- ✅ Passwords hashed with **bcrypt**
- ✅ **Backend request validation** with Zod
- ✅ No secrets committed; **`.env.example`** provided

### Bonus features (implemented)

- ✅ **TypeScript** on both backend and frontend
- ✅ **Drag and drop** between status columns (native HTML5 DnD, optimistic update)
- ✅ **Pagination** — per-column, 10 tasks per column, independent prev/next arrows
- ✅ **Task attachments** — upload a cover image per task (images only, max 2 MB)
- ✅ **Docker support** — `docker compose up` runs the whole stack
- ✅ **Redis caching** — cache-aside for task lists with graceful fallback to the DB
- ✅ **Live demo** — see [Deployment](#deployment)

---

## Tech stack

| Layer     | Technology                                                        |
|-----------|-------------------------------------------------------------------|
| Frontend  | React 19, TypeScript, Vite, Tailwind CSS 4, React Router 7, Axios |
| Backend   | Node.js, Express 5, TypeScript, Mongoose 9, Zod 4                 |
| Auth      | JSON Web Tokens (`jsonwebtoken`), bcrypt (`bcryptjs`)             |
| Database  | MongoDB                                                           |
| Cache     | Redis (optional)                                                  |
| Uploads   | Multer (local disk storage)                                      |
| Dev/Infra | Docker + Docker Compose, `tsx`                                    |

---

## Prerequisites

- **Node.js 20+** and **npm**
- **MongoDB** running locally (or a MongoDB Atlas connection string)
- **Redis** (optional — the app runs without it, just without caching)
- **Docker + Docker Compose** (optional — only for the containerized setup)

---

## Quick start (Docker)

The fastest way to run everything — no local Node/Mongo/Redis needed.

```bash
docker compose up --build
```

This starts four services (MongoDB, Redis, backend, frontend). On first boot the
backend automatically runs the migration and seeds demo data.

- Frontend → <http://localhost:5173>
- API health → <http://localhost:5000/api/health>

Stop it with `Ctrl+C`, then `docker compose down` (add `-v` to also wipe the DB
and uploaded files).

> Note: Compose maps MongoDB to host port **27018** (not 27017) to avoid clashing
> with a locally installed MongoDB. Inside the Docker network it's still 27017.

---

## Manual setup

Run the backend and frontend in two separate terminals.

### 1. Backend

```bash
cd backend
cp .env.example .env          # then edit values as needed
npm install
npm run migrate               # create collections + indexes
npm run seed                  # (optional) demo accounts + sample tasks
npm run dev                   # starts on http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env          # default points at http://localhost:5000/api
npm install
npm run dev                   # starts on http://localhost:5173
```

Open <http://localhost:5173>.

### Backend scripts

| Script                | Purpose                                                      |
|-----------------------|--------------------------------------------------------------|
| `npm run dev`         | Start the API in watch mode (`tsx`)                          |
| `npm run build`       | Compile TypeScript to `dist/`                                |
| `npm start`           | Run the compiled server                                      |
| `npm run typecheck`   | Type-check without emitting                                  |
| `npm run migrate`     | Create MongoDB collections + indexes from the models         |
| `npm run seed`        | Seed two demo users with sample tasks                        |
| `npm run seed:user2`  | Seed only the second demo user                               |
| `npm run seed:todos`  | Append 10 "To Do" tasks to the demo user                     |

---

## Environment variables

### Backend (`backend/.env`) — see [`backend/.env.example`](backend/.env.example)

| Variable          | Required | Default                                    | Description                                        |
|-------------------|----------|--------------------------------------------|----------------------------------------------------|
| `NODE_ENV`        | no       | `development`                              | `development` \| `test` \| `production`            |
| `PORT`            | no       | `5000`                                     | API server port                                    |
| `MONGODB_URI`     | **yes**  | —                                          | MongoDB connection string                          |
| `JWT_SECRET`      | **yes**  | —                                          | Secret for signing JWTs (min 16 chars)             |
| `JWT_EXPIRES_IN`  | no       | `7d`                                       | Token lifetime (e.g. `15m`, `12h`, `7d`)           |
| `CLIENT_ORIGIN`   | no       | `http://localhost:5173`                    | Allowed CORS origin                                |
| `REDIS_URL`       | no       | *(unset = caching disabled)*               | Redis connection URL                               |
| `SERVE_CLIENT`    | no       | `false`                                    | If `true`, backend also serves the built frontend  |
| `CLIENT_DIST_PATH`| no       | —                                          | Path to `frontend/dist` when `SERVE_CLIENT=true`   |

### Frontend (`frontend/.env`) — see [`frontend/.env.example`](frontend/.env.example)

| Variable       | Default                       | Description                       |
|----------------|-------------------------------|-----------------------------------|
| `VITE_API_URL` | `http://localhost:5000/api`   | Base URL of the backend API       |

> Secrets are never committed. `.env` is git-ignored; only `.env.example` files (no secret values) are in the repo.

---

## Test accounts

Created by `npm run seed` (and automatically in the Docker setup):

| User   | Email                | Password   |
|--------|----------------------|------------|
| User 1 | `demo@taskapp.com`   | `Demo1234` |
| User 2 | `sara@taskapp.com`   | `Sara1234` |

Two accounts are provided so you can verify data isolation — logging in as one user never shows the other's tasks.

---

## Project structure

```
electro_pi/
├── docker-compose.yml          # full stack: mongo + redis + backend + frontend
├── render.yaml                 # Render deployment blueprint
├── DEPLOY.md                   # step-by-step deployment guide
├── postman/                    # Postman collection + environment
│
├── backend/                    # Node + Express + TypeScript (Clean Architecture)
│   ├── Dockerfile
│   ├── docker-entrypoint.sh    # waits for DB → migrate → seed → start
│   └── src/
│       ├── domain/             # entities + interfaces (no framework code)
│       │   ├── entities/       #   User, Task
│       │   ├── repositories/   #   IUserRepository, ITaskRepository
│       │   └── services/       #   IPasswordHasher, ITokenService, IFileStorage, ITaskCache
│       ├── application/        # use cases (business logic) + app errors
│       │   └── use-cases/      #   RegisterUser, LoginUser, CreateTask, GetTasks, ...
│       ├── infrastructure/     # concrete implementations
│       │   ├── database/       #   Mongoose connection
│       │   ├── models/         #   Mongoose schemas (User, Task)
│       │   ├── repositories/   #   Mongo implementations
│       │   ├── security/       #   bcrypt hasher, JWT service
│       │   ├── storage/        #   local-disk file storage
│       │   └── cache/          #   Redis client + task cache
│       ├── presentation/       # HTTP layer
│       │   ├── controllers/    #   AuthController, TaskController
│       │   ├── routes/         #   authRoutes, taskRoutes
│       │   ├── middlewares/    #   auth, validate, upload, error handler
│       │   ├── validation/     #   Zod schemas
│       │   └── dto/            #   response mappers
│       ├── scripts/            # migrate + seed scripts
│       ├── config/             # validated env config
│       ├── app.ts              # composition root (dependency injection)
│       └── server.ts           # entry point
│
└── frontend/                   # React + Vite + TypeScript + Tailwind
    └── src/
        ├── pages/              # LoginPage, RegisterPage, DashboardPage
        ├── components/         # TaskBoard, TaskCard, TaskForm, BoardFilters, Navbar, ui/
        ├── hooks/              # useAuth, useBoard
        ├── context/            # AuthProvider / auth context
        ├── lib/                # axios instance + auth/task services
        ├── config/             # env
        ├── types/              # shared TS types (API contract)
        └── App.tsx             # routing + providers
```

---

## Architecture

The backend follows **Clean Architecture** — dependencies point inward:

```
presentation  →  application  →  domain  ←  infrastructure
 (Express)        (use cases)    (core)      (Mongo, Redis, bcrypt, JWT, disk)
```

- **domain** — pure entities and interfaces; no framework imports.
- **application** — use cases that orchestrate business rules, depending only on domain interfaces.
- **infrastructure** — concrete adapters implementing those interfaces (MongoDB, Redis, bcrypt, JWT, local file storage).
- **presentation** — Express controllers/routes/middleware; `app.ts` is the composition root that wires the concrete classes into the use cases.

Why it matters: the business logic is database-agnostic and testable, and swapping an implementation (e.g. Redis → another cache, local disk → S3) means writing one new adapter, not touching the use cases.

**Ownership & security:** every task query is scoped by `userId` at the repository level, so a user physically cannot read or mutate another user's tasks (a missing/foreign task returns `404`, never another user's data). Passwords are bcrypt-hashed and never returned by the API. Login returns the same generic error for a wrong email vs. wrong password (no user enumeration).

**Caching:** task lists use a cache-aside strategy — one Redis key holds a user's full task list; reads serve from it, writes invalidate it. If Redis is unavailable the app falls back to MongoDB transparently.

---

## API endpoints

Base URL: `http://localhost:5000/api`. All task routes and `GET /auth/me` require an `Authorization: Bearer <token>` header.

### Auth

| Method | Endpoint         | Auth | Description                                    |
|--------|------------------|------|------------------------------------------------|
| POST   | `/auth/register` | —    | Register a new user → `{ token, user }`        |
| POST   | `/auth/login`    | —    | Log in → `{ token, user }`                     |
| GET    | `/auth/me`       | ✅   | Get the current authenticated user             |

### Tasks

| Method | Endpoint            | Auth | Description                                                    |
|--------|---------------------|------|---------------------------------------------------------------|
| GET    | `/tasks`            | ✅   | List tasks — `?search=&status=&priority=&page=&limit=`        |
| POST   | `/tasks`            | ✅   | Create a task (JSON, or multipart with an `image` cover)      |
| GET    | `/tasks/:id`        | ✅   | Get one task                                                  |
| PATCH  | `/tasks/:id`        | ✅   | Update a task (JSON, or multipart with an `image` cover)      |
| DELETE | `/tasks/:id`        | ✅   | Delete a task                                                 |
| POST   | `/tasks/:id/cover`  | ✅   | Upload/replace a task's cover image (multipart, field `image`)|
| DELETE | `/tasks/:id/cover`  | ✅   | Remove a task's cover image                                   |

### Other

| Method | Endpoint       | Description                          |
|--------|----------------|--------------------------------------|
| GET    | `/api/health`  | Health check → `{ "status": "ok" }`  |

**Filter/search query params on `GET /tasks`:**

- `search` — case-insensitive partial match on the task title
- `status` — `todo` \| `in_progress` \| `done`
- `priority` — `low` \| `medium` \| `high`
- `page`, `limit` — pagination (limit capped at 100)

A **Postman collection** is included in [`postman/`](postman/) — import both files, hit **Login**, then any Tasks request (the token is captured automatically).

---

## Deployment

The app can be deployed as a **single service** (the backend serves the built
React app) on **Render**, backed by **MongoDB Atlas**. See **[DEPLOY.md](DEPLOY.md)**
for the full step-by-step guide.

- **Live demo:** _<!-- add your Render URL here after deploying -->_

---

## Known issues / limitations

- **Uploaded cover images are not durable on ephemeral hosts.** Files are stored
  on the container's local disk, so on a platform like Render's free tier they are
  lost on redeploy/restart. Task data (in MongoDB) persists; only uploaded images
  are affected. The storage layer is abstracted behind `IFileStorage`, so pointing
  it at a cloud provider (e.g. Cloudinary/S3) would fix this without touching the
  business logic — it is not wired up in this build.
- **Drag-and-drop is pointer-based** (native HTML5 DnD), so it works on desktop.
  On touch devices, change a task's status via the edit form instead.
- **Free-tier cold starts:** on Render's free plan the service sleeps after ~15 min
  idle, so the first request after idling can take ~30–60s.
- **No automated tests** are included in this submission (manual + Postman testing
  was used during development).

---

## AI & tools disclosure

Per the assignment guidelines: AI assistance (Claude) was used during development
for scaffolding, boilerplate, and reviewing code. All architectural decisions,
integration, and verification were done by the author, who can explain every part
of the submitted code.
