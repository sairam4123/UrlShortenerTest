# Sairam's URL Shortener

Fast, minimalist link shortener composed of a FastAPI backend and a Next.js frontend. It creates short aliases, tracks click metadata, and serves redirects from a single JSON datastore.

## Tech Stack

- FastAPI 0.116 with asynchronous routing and `uvicorn`
- Next.js 15 / React 19 UI with Tailwind-based styling
- Lightweight JSON persistence via `db.json` (no external database required)

## Prerequisites

- Python 3.12+
- [uv](https://github.com/astral-sh/uv) or another PEP 621–aware installer (e.g. `pip`)
- Node.js 20+ with npm (or pnpm / bun)

## Backend Setup

```bash
# Install dependencies
uv sync

# Run the API (reload + root path /api)
uv run uvicorn src.main:app --reload --port 8000
```

- API base URL locally: `http://localhost:8000/api`
- Short-link data persists to `db.json` in the project root; delete the file to reset.

### Alternative install without uv

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -e .
uvicorn src.main:app --reload --port 8000
```

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

- Dev server runs at `http://localhost:3000`.
- When running the frontend separately from the API, expose the backend base URL via `NEXT_PUBLIC_API_BASE` (defaults to relative `/api`). Example `.env.local`:
  ```env
  NEXT_PUBLIC_API_BASE=http://localhost:8000/api
  ```
- For Vercel or other hosts, ensure the FastAPI service is deployed under `/api` to match the configured `root_path`.

## Core Features

- Generate unique shortened URLs with optional custom aliases
- Fetch metadata (click count, last visitor IP, original URL)
- Random alias suggestions (collision-safe)
- Automatic redirect handling for public short links
- Health check endpoint for uptime probes

## API Reference

| Method | Path                     | Params                                          | Description                                                     |
| ------ | ------------------------ | ----------------------------------------------- | --------------------------------------------------------------- |
| GET    | `/api/url/create`        | `long_url` (required), `custom_name` (optional) | Creates a short link and returns `{ "url": "/<id>" }`.          |
| GET    | `/api/url/{id}/metadata` | —                                               | Returns stored metadata for the short link.                     |
| GET    | `/api/{id}`              | —                                               | Redirects to the stored destination and increments click count. |
| POST   | `/api/alias/suggest`     | `long_url`, `count` (≤10)                       | Returns `{ "suggested_names": [...] }` based on random phrases. |
| GET    | `/api/404`               | —                                               | JSON error payload for not-found routes.                        |
| GET    | `/api/health`            | —                                               | Simple health check response.                                   |

### Example: create and follow a link

```bash
curl "http://localhost:8000/api/url/create?long_url=https://example.com"
# => { "url": "/AbCdEf12" }

curl -i "http://localhost:8000/api/AbCdEf12" # 307 redirect to https://example.com
```

## Frontend Overview

- `frontend/src/app/page.tsx`: landing page with URL + custom alias inputs
- `frontend/src/@components/AliasChips.tsx`: pill UI for suggested aliases
- `frontend/src/api/api.ts`: helper functions to call backend endpoints (align the HTTP verbs/query parameters with the FastAPI handlers when wiring forms)

## Development Tips

- Keep random alias collisions low by adjusting `random_phrase` length in [src/main.py](src/main.py#L20-L27).
- To inspect or reset stored links, edit [db.json](db.json) while the server is stopped.
- Add persistence beyond JSON by swapping `get_db` / `store_db` with SQLModel-backed storage in [src/main.py](src/main.py#L9-L46) and [src/models.py](src/models.py).

## Testing & Future Work

- Add integration tests (e.g. with `httpx.AsyncClient`) to cover create/redirect flows.
- Wire the frontend form to `shortenUrl` / `suggestAliases` helpers and display metadata responses.
- Consider rate limiting, auth, and analytics dashboards for production deployments.
