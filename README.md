# Darukaa.Earth — Geospatial Data Analytics Platform

A full-stack dashboard for creating projects, drawing geospatial site boundaries on an
interactive map, and viewing analytics (carbon, canopy cover, biodiversity index) per site.
Built for the Darukaa.Earth Full-Stack Developer Hackathon Challenge.

## 1. High-Level Architecture

```
┌──────────────────┐        HTTPS / JWT        ┌────────────────────┐
│  React Frontend   │ ───────────────────────▶ │   FastAPI Backend   │
│  (Vite, deployed   │ ◀───────────────────────  │  (deployed on       │
│   on Vercel)        │        JSON REST API      │   Render)            │
│  - Mapbox GL JS     │                            │  - JWT auth          │
│  - mapbox-gl-draw   │                            │  - SQLAlchemy ORM    │
│  - Chart.js         │                            │  - Pydantic schemas  │
└──────────────────┘                            └─────────┬──────────┘
                                                              │
                                                              ▼
                                                    ┌────────────────────┐
                                                    │   PostgreSQL (Render │
                                                    │   managed Postgres)  │
                                                    └────────────────────┘
```

- **Frontend (React + Vite)**: handles auth screens, a project dashboard, an interactive
  Mapbox map for drawing site polygons (via `@mapbox/mapbox-gl-draw`), and a site detail
  page with Chart.js time-series charts.
- **Backend (FastAPI)**: exposes a REST API for auth, projects, and sites; issues and
  validates JWTs; talks to the database through SQLAlchemy.
- **Database**: PostgreSQL in production (Render), SQLite locally for zero-setup development.

## 2. Database / Schema

| Table      | Columns                                                                 |
|------------|--------------------------------------------------------------------------|
| `users`    | id, email (unique), hashed_password, created_at                          |
| `projects` | id, name, description, owner_id (FK → users), created_at                 |
| `sites`    | id, project_id (FK → projects), name, geometry (GeoJSON), area_hectares, created_at |

**Trade-off — GeoJSON column instead of native PostGIS geometry:** the challenge spec calls
for PostgreSQL + PostGIS. Within the hackathon's time window, we store each site's polygon
as a **GeoJSON `JSON` column** rather than a native PostGIS `geometry` type. This keeps the
schema portable (runs on plain SQLite for local dev, and on any managed Postgres — including
Render's free tier, which doesn't ship PostGIS by default — without extra provisioning), while
still giving the frontend real GeoJSON to render and edit on the map. The trade-off: we give up
server-side spatial queries (e.g. `ST_Area`, `ST_Intersects`). If this were a longer-running
project, the natural next step is a migration to a `geometry(Polygon, 4326)` column via
`GeoAlchemy2` once PostGIS is enabled, adding spatial indexing and server-side area/overlap
calculations.

**Trade-off — mocked analytics data:** the spec explicitly allows mock datasets. Site
analytics (carbon tonnes, canopy cover %, biodiversity index) are generated deterministically
per site (seeded off the site ID) rather than sourced from a real remote-sensing pipeline,
which is out of scope for this challenge but is the general product design (satellite/MRV
data would replace this endpoint's internals without changing its API contract).

## 3. Local Setup

### Backend
```bash
cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # edit if needed
uvicorn app.main:app --reload
# API docs: http://localhost:8000/docs
```

### Frontend
```bash
cd frontend
npm install
cp .env.example .env
# Edit .env: set VITE_MAPBOX_TOKEN to your own Mapbox public token
# (free at https://account.mapbox.com/access-tokens/)
npm run dev
# App: http://localhost:5173
```

## 4. CI/CD Pipeline

**GitHub Actions** (`.github/workflows/ci.yml`) runs on every push/PR to `main`:
- **Backend job**: installs dependencies, runs `flake8` linting, and does an import sanity
  check (`from app.main import app`) to catch broken imports before deploy.
- **Frontend job**: installs dependencies, runs ESLint, and runs a production `vite build` to
  catch build-breaking errors early.

**Pre-commit hooks** (Husky + lint-staged, configured in `frontend/package.json` and
`frontend/.husky/pre-commit`): on every `git commit`, staged `.js/.jsx/.css` files are
automatically formatted with Prettier and linted with ESLint (`--fix`) before the commit is
allowed to complete.

**Deployment**:
- **Backend → Render**: `backend/render.yaml` is a Render Blueprint that provisions a free web
  service (`uvicorn app.main:app`) and a free managed Postgres database, wiring
  `DATABASE_URL` automatically. Push to `main` → Render auto-deploys.
- **Frontend → Vercel**: import the repo's `frontend/` directory as a Vercel project (Framework
  preset: Vite). Set environment variables `VITE_API_URL` (your deployed Render URL) and
  `VITE_MAPBOX_TOKEN`. Push to `main` → Vercel auto-deploys.

## 5. API Overview

| Method | Endpoint                        | Auth | Description                        |
|--------|----------------------------------|------|--------------------------------------|
| POST   | `/auth/register`                | No   | Create a user account                |
| POST   | `/auth/login`                    | No   | Get a JWT access token               |
| GET    | `/projects`                      | Yes  | List the current user's projects     |
| POST   | `/projects`                      | Yes  | Create a project                     |
| GET    | `/projects/{id}`                 | Yes  | Get a single project                 |
| GET    | `/projects/{id}/sites`           | Yes  | List sites in a project              |
| POST   | `/projects/{id}/sites`           | Yes  | Add a site (GeoJSON polygon)         |
| GET    | `/sites/{id}`                    | Yes  | Get a single site                    |
| GET    | `/sites/{id}/analytics`          | Yes  | Time-series analytics for a site     |

Interactive docs are auto-generated at `/docs` (Swagger) once the backend is running.

## 6. Tech Stack

Frontend: React 18, Vite, React Router, Mapbox GL JS, `mapbox-gl-draw`, Chart.js.
Backend: FastAPI, SQLAlchemy, Pydantic, `python-jose` (JWT), Passlib/bcrypt (password hashing).
DB: PostgreSQL (production) / SQLite (local dev).
CI/CD: GitHub Actions, Husky, lint-staged, Prettier, ESLint, flake8.
