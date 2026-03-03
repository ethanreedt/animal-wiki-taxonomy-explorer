# Animal Wiki Taxonomy Explorer

An interactive web app for exploring the biological tree of life — over 4.5 million species from the [Catalogue of Life](https://www.catalogueoflife.org/), visualized as a navigable radial tree with search, taxonomy details, and a quiz game.

**Live at [animalwiki.ethant.net](https://animalwiki.ethant.net)**

## Features

- **Radial tree visualization** — D3-powered interactive tree with zoom, pan, and click-to-navigate
- **Full-text search** — PostgreSQL full-text search with trigram similarity fallback
- **Taxonomy sidebar** — Classification path, Wikipedia summaries, conservation status, common names
- **Taxonomy quiz** — Three question types (placement, odd one out, closer kin) with difficulty tiers and streak scoring
- **Featured taxa** — Curated landing page showcasing major branches of life

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | React 19, Vite, Tailwind CSS v4, D3 v7, React Router v7 |
| Backend | Django 5.1, Django REST Framework, Gunicorn |
| Database | PostgreSQL 16 (ltree + pg_trgm extensions) |
| Data | Catalogue of Life — ColDP format via ChecklistBank |
| Infra | GitHub Actions, GHCR, AKS (GitOps — push to main auto-deploys) |

## Project Structure

```
backend/          Django API (managed=False read-only models)
db/               Database project (schema, migrations, data loaders)
frontend/         React SPA (Vite dev server, nginx in prod)
k8s/              Kubernetes manifests
.github/          CI/CD workflows
```

## Local Development

### Database

```bash
cd db/
docker compose up -d          # PostgreSQL 16
uv sync                       # install Python deps
uv run python manage.py migrate
uv run python manage.py load_taxonomy
uv run python manage.py load_vernacular
```

### Backend

```bash
cd backend/
pip install -r requirements.txt
python manage.py runserver     # localhost:8000
```

### Frontend

```bash
cd frontend/
npm install
npm run dev                    # localhost:3000 (proxies /api to :8000)
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /api/taxa/roots/` | Root-level taxa |
| `GET /api/taxa/{id}/` | Taxon detail |
| `GET /api/taxa/{id}/children/` | Direct children |
| `GET /api/taxa/{id}/ancestors/` | Full path from root |
| `GET /api/taxa/{id}/summary/` | Wikipedia extract |
| `GET /api/taxa/featured/` | Curated featured taxa |
| `GET /api/search/?q=` | Full-text + trigram search |
| `GET /api/quiz/?difficulty=&type=` | Quiz question generator |

## Data Attribution

Taxonomy data from the [Catalogue of Life](https://www.catalogueoflife.org/) (ColDP format).
