# Deploying the live demo (Render + MongoDB Atlas)

This deploys the whole app as **one Render web service**: the Node backend serves
the built React frontend, so there's a single URL and no CORS to configure.

```
Browser ──▶ https://taskapp-xxxx.onrender.com
                       │
             ┌─────────┴──────────┐
             │  Render web service │
             │  • serves React app │
             │  • /api/* → Express  │
             └─────────┬──────────┘
                       ▼
              MongoDB Atlas (cloud)
```

---

## Prerequisites

- The repo pushed to **GitHub** (public, or grant Render access).
- A free **MongoDB Atlas** account — the deployed backend cannot use your local MongoDB.
- A free **Render** account (sign in with GitHub).

---

## Step 1 — Create a cloud database (MongoDB Atlas)

1. Go to <https://www.mongodb.com/cloud/atlas/register> and sign up.
2. **Create a cluster** → choose the **free M0** tier → pick a region → **Create**.
3. **Database Access** → *Add New Database User* → username + password (save them).
4. **Network Access** → *Add IP Address* → **Allow access from anywhere** (`0.0.0.0/0`).
   (Render's IPs are dynamic on the free tier, so allow-all is the simplest option.)
5. **Connect** → *Drivers* → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your real password and insert the database name
   `taskmanager` before the `?`:
   ```
   mongodb+srv://myuser:MyPass@cluster0.xxxxx.mongodb.net/taskmanager?retryWrites=true&w=majority
   ```
   Keep this string for Step 3.

---

## Step 2 — Push to GitHub

If not already pushed:
```bash
git add .
git commit -m "Add deployment config"
git push origin main
```

---

## Step 3 — Deploy on Render (via the blueprint)

The repo already contains [`render.yaml`](render.yaml), which describes the service.

1. Go to <https://dashboard.render.com> → **New +** → **Blueprint**.
2. Connect your GitHub and pick this repository.
3. Render reads `render.yaml` and shows the `taskapp` web service. Click **Apply**.
4. It will prompt for the secret env vars (marked `sync: false`). Set:
   | Variable      | Value                                                    |
   |---------------|----------------------------------------------------------|
   | `MONGODB_URI` | the Atlas string from Step 1                             |
   | `JWT_SECRET`  | a long random string (e.g. run `openssl rand -hex 32`)   |
   | `REDIS_URL`   | *(optional)* leave blank to disable caching             |
5. Click **Create** / **Deploy**. First build takes a few minutes (it builds the
   frontend, then the backend).

The other env vars (`NODE_ENV`, `SERVE_CLIENT`, `CLIENT_DIST_PATH`, `CLIENT_ORIGIN`,
`JWT_EXPIRES_IN`) are set automatically by `render.yaml`.

---

## Step 4 — Seed the demo data (once)

The deployed DB starts empty. In Render → your service → **Shell**, run:
```bash
cd backend && npm run seed
```
This creates the demo accounts (and re-run `npm run seed:todos` if you want the
extra To Do tasks). Alternatively just register a new account through the UI.

---

## Step 5 — Open the live demo

Your URL is shown at the top of the Render service page, e.g.
`https://taskapp-xxxx.onrender.com`. Open it and log in:

```
demo@taskapp.com  /  Demo1234
```

---

## Known limitations of the free tier

- **Cold starts:** the free service sleeps after ~15 min idle; the first request
  then takes ~30–60s to wake. Subsequent requests are fast.
- **Uploaded cover images are not persistent.** They're written to the
  container's local disk, which is wiped on every redeploy/restart. Tasks and
  their data persist (they're in Atlas), but uploaded images will disappear
  after a redeploy. Making them durable would mean pointing `IFileStorage` at a
  cloud store (e.g. Cloudinary) — the storage interface is already abstracted for
  that, but it's not wired up in this build.
- **Redis** is optional; if `REDIS_URL` is unset the app runs without caching.

---

## Running it locally instead

See the main [README](README.md). In short: `docker compose up --build`, or run
`npm run dev` in `backend/` and `frontend/` with a local MongoDB.
