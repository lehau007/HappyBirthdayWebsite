# Happy Birthday Web — Running Guide

A birthday-card web app with fireworks, flower animations, a personalised AI poem, and a feedback inbox.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite 5, Tailwind CSS 3, Framer Motion, Nginx |
| Backend | FastAPI, SQLAlchemy (async), Alembic, Uvicorn |
| Database | PostgreSQL 16 |
| Auth | JWT (access + refresh tokens, in-memory only) |
| AI | OpenAI API (birthday poem generation) |
| Container | Docker + Docker Compose |

---

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) ≥ 24 (with Compose v2)
- An **OpenAI API key** (for poem generation)

---

## Quick Start — Docker (Recommended)

### 1. Create the backend `.env` file

```
project_src/backend/.env
```

```env
DATABASE_URL=postgresql+asyncpg://postgres:postgres@db:5432/happybirthday
OPENAI_API_KEY=sk-...your-key-here...
JWT_SECRET=change-me-to-a-long-random-string
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
FRONTEND_ORIGIN=http://localhost:5173
```

> **Never commit `.env` to source control.**  
> Generate a strong `JWT_SECRET`, for example:
> ```bash
> python -c "import secrets; print(secrets.token_hex(32))"
> ```

---

### 2. Start the backend (PostgreSQL + FastAPI)

```bash
cd project_src/backend
docker compose up -d --build
```

This starts two containers:
- `db` — PostgreSQL 16, port **5432**
- `backend` — FastAPI (Uvicorn), port **8000**

Wait until both are healthy:

```bash
docker compose ps
```

---

### 3. Run database migrations

```bash
docker compose exec backend alembic upgrade head
```

---

### 4. Seed the first Root Admin account

```bash
docker compose exec backend python seed.py
```

Default credentials created:

| Field | Value |
|-------|-------|
| Username | `rootadmin` |
| Password | `ChangeMe123!` |

> **Change the password immediately after first login.**

---

### 5. Start the frontend (React + Nginx)

```bash
cd project_src/frontend
docker compose up -d --build
```

This starts:
- `frontend` — Nginx serving the built React app, port **5173**

---

### 6. Open the app

| URL | What |
|-----|------|
| `http://localhost:5173` | Frontend (birthday card app) |
| `http://localhost:8000/docs` | Backend API (Swagger UI) |
| `http://localhost:8000/redoc` | Backend API (ReDoc) |

---

## Stopping the App

```bash
# Stop frontend
cd project_src/frontend
docker compose down

# Stop backend + database
cd project_src/backend
docker compose down
```

To also **delete the database volume** (full reset):

```bash
cd project_src/backend
docker compose down -v
```

---

## Development (without Docker)

### Backend

Requirements: **Python 3.11+**, **PostgreSQL** running locally.

```bash
cd project_src/backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate          # Windows
# source .venv/bin/activate     # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Set up .env (see Step 1 above, change DATABASE_URL to point to local postgres)

# Run migrations
alembic upgrade head

# Seed root admin
python seed.py

# Start dev server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

Requirements: **Node.js 20+**.

```bash
cd project_src/frontend

# Install dependencies
npm install

# Create .env.local (optional — defaults to localhost:8000)
echo "VITE_API_BASE_URL=http://localhost:8000" > .env.local

# Start dev server
npm run dev
```

Frontend dev server runs at `http://localhost:5173`.

---

## User Roles

| Role | How to get one | What they can do |
|------|---------------|-----------------|
| **Root Admin** | Seeded via `seed.py` | Create / delete Admins; manage all data |
| **Admin** | Created by Root Admin in dashboard | Create / delete Normal Users; view inbox; mark messages read |
| **Normal User** | Created by Admin | View birthday card (4 pages), submit feedback |

---

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|---------|---------|-------------|
| `DATABASE_URL` | ✅ | — | AsyncPG connection string |
| `OPENAI_API_KEY` | ✅ | — | Used to generate birthday poem |
| `JWT_SECRET` | ✅ | — | HMAC secret for signing JWTs |
| `JWT_ALGORITHM` | | `HS256` | JWT signing algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | | `30` | Access token TTL |
| `REFRESH_TOKEN_EXPIRE_DAYS` | | `7` | Refresh token TTL |
| `FRONTEND_ORIGIN` | | `http://localhost:5173` | CORS allowed origin |
| `VITE_API_BASE_URL` | | `http://localhost:8000` | Backend URL (frontend build arg) |

---

## Project Structure

```
project_src/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app entry point
│   │   ├── config.py        # Settings (pydantic-settings)
│   │   ├── models/          # SQLAlchemy ORM models
│   │   ├── routers/         # API route handlers
│   │   ├── schemas/         # Pydantic request/response schemas
│   │   └── services/        # Business logic (auth, poem generation)
│   ├── alembic/             # Database migrations
│   ├── seed.py              # Initial Root Admin seed script
│   ├── Dockerfile
│   ├── docker-compose.yml   # Backend + PostgreSQL stack
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── pages/           # Page1Fireworks, Page2Flowers, Page3Poem, Page4Feedback
    │   ├── context/         # AuthContext (in-memory JWT storage)
    │   ├── api/             # Axios instance with auto-refresh interceptor
    │   └── styles/          # CSS Modules
    ├── Dockerfile           # Multi-stage: node build → nginx serve
    ├── docker-compose.yml   # Frontend Nginx container
    └── vite.config.ts
```

---

## Troubleshooting

**Backend container exits immediately**
- Check your `.env` file exists at `project_src/backend/.env` and all required variables are set.
- Run `docker compose logs backend` for the actual error.

**`alembic upgrade head` fails with "relation already exists"**
- The database may have stale tables. Run `docker compose down -v` and start again from Step 2.

**Poem generation returns 503**
- Verify `OPENAI_API_KEY` in `.env` is valid and has available quota.

**CORS error in browser**
- Ensure `FRONTEND_ORIGIN` in `.env` matches the exact URL you open in the browser (including port).

**Port already in use**
- Change the host port in the relevant `docker-compose.yml` (e.g. `"5174:80"` instead of `"5173:80"`).
