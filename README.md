# Mobile Sensor Practice

A Vite + Preact app that streams accelerometer data from a phone to a desktop browser in real time using **Supabase** (Postgres + Realtime). The phone and desktop stay in sync via a small session row: a **start/stop signal** and a **JSON payload** for the latest sensor sample.

| Page | URL (dev) | Opened on | Purpose |
|------|-----------|-----------|---------|
| Home | `/` (`index.html`) | Any | Menu: Learn vs Explore |
| Train | `/train.html` | Desktop | Main game: match motion to the target pattern |
| Controller | `/controller.html` | Mobile | Enable sensors, stream accelerometer data |
| Sandbox | `/sandbox.html` | Desktop | Free-form exploration and pattern tagging |

---

## Stack

| Piece | Role |
|-------|------|
| **Vite** | Dev server and production build |
| **Preact** | UI |
| **Supabase JS** (`@supabase/supabase-js`) | Upserts + realtime subscriptions on a `session_state` table |
| **Chart.js** | Live charts on dashboard-style views |
| **OpenAI** (optional) | Learning helpers and sandbox pattern analysis when `VITE_OPENAI_API_KEY` is set (`src/lib/openai.js`) |

The realtime bridge lives in `src/lib/supabase.js`: it mirrors the old “Firebase path” idea (`session/signal`, `session/sensorData`) as columns on one row per session.

---

## Prerequisites

- Node.js and npm
- A [Supabase](https://supabase.com/) project

---

## 1. Create the database table

In the Supabase SQL editor, run:

```sql
create table if not exists public.session_state (
  id text primary key,
  signal text,
  sensor_data jsonb,
  updated_at timestamptz not null default now()
);

alter table public.session_state replica identity full;
```

Enable **Realtime** for this table: **Database → Replication** (or **Table editor → your table → Realtime**), and turn on `INSERT`, `UPDATE`, and `DELETE` for `public.session_state` as needed for your plan.

For local development with the **anon** key, add Row Level Security policies that allow `select`, `insert`, and `update` on `session_state` for the `anon` role (tighten this before production).

---

## 2. Environment variables

Copy `.env.example` to `.env` in the project root and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Project URL (`https://….supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Yes | **anon public** key (Project Settings → API) |
| `VITE_OPENAI_API_KEY` | No | OpenAI API key for AI features (learning + pattern analysis) |
| `VITE_OPENAI_MODEL` | No | Chat model (defaults to `gpt-4o-mini`) |
| `VITE_SUPABASE_SESSION_ID` | No | Defaults to `default`; change to isolate sessions |
| `VITE_SUPABASE_SESSION_TABLE` | No | Defaults to `session_state` if your table name differs |

This repo’s `vite.config.js` sets `envDir` to a parent folder for portal embedding. If `.env` is not picked up when you run `npm run dev`, either place `.env` where that `envDir` resolves, or adjust `envDir` for standalone development.

---

## 3. Install and run

```bash
npm install
npm run dev
```

Then:

1. Open **Train** (or Sandbox) on the desktop. With the default `vite.config.js` `base`, that is typically `http://localhost:5173/staticGames/human-motion/train.html` (see `data/game.json` for `game-id`).
2. Open **Controller** on the phone on the same origin (or tunnel with HTTPS for real devices).
3. On the phone, tap **Enable Sensors** (iOS needs a user gesture for motion permission).
4. On the desktop, start the session; the phone streams samples until you stop.

Use **HTTPS** in production: `DeviceMotionEvent` generally needs a secure context on mobile.

---

## How it works

```
controller (phone)              Supabase                    train / sandbox (desktop)
─────────────────               ────────                    ─────────────────────────
writes signal / sensor_data  →  session_state row  →      subscribes + reads JSON
```

- **`signal`**: `"start"` or `"stop"` — tells the controller when to attach `devicemotion` and send samples.
- **`sensor_data`**: JSON — latest reading (shape your controller sends; typically `acceleration` + `timestamp`).

Conceptually this replaces the old Firebase paths `/session/signal` and `/session/sensorData` with one upserted row keyed by a **per–browser-tab pairing id** (UUID).

### One phone per desktop session

- Each **train** or **sandbox** tab generates a random session id (stored in `sessionStorage`) and shows a **QR code + link** to `controller.html?session=<uuid>`.
- Only clients using that exact `session` id read/write the same `session_state` row in Supabase, so different computers/tabs do not collide by default.
- **New phone pairing** on the desktop generates a fresh UUID; scan the new QR so the phone uses the new URL.
- If two phones open the **same** controller URL, they would still share one row (last write wins). For strict single-controller locking you’d need server-side pairing (Edge Function), which this repo does not implement.

Optional: set `VITE_SUPABASE_SESSION_ID` only if you need a fixed id for special deployments; normal use relies on the dynamic pairing id above.

### Example payload per sample

```json
{
  "acceleration": { "x": 0.12, "y": -0.34, "z": 9.78 },
  "accelerationIncludingGravity": { "x": 0.15, "y": -0.30, "z": 0.02 },
  "timestamp": 1710600000000
}
```

### Throttle rate

The mobile controller throttles sends (see `SEND_INTERVAL_MS` in `src/pages/Controller.jsx`). Adjust if you want smoother charts vs fewer writes.

---

## Production build

```bash
npm run build
npm run preview
```

Deploy the `dist/` output to any static host. Set the same `VITE_*` variables in your host’s environment or build pipeline.

---

## Legacy static HTML (optional)

Root files `main.html` and older CDN-based demos may still reference **Firebase** in comments or scripts. The **supported** path for phone ↔ desktop sync in this project is the Vite app + Supabase as above.

---

## Browser compatibility

- **iOS Safari 13+**: `DeviceMotionEvent.requestPermission()` must run from a user gesture — the Controller page handles this via **Enable Sensors**.
- **Android Chrome**: Motion events usually work without an extra permission prompt.
- **Desktop**: Can connect and show data; meaningful accelerometer data requires a suitable device.
