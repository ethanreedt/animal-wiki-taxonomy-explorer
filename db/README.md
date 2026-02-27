# Database — Schema Management & Data Loading

This directory owns the database schema, migrations, and data loading for Animal Wiki. The backend API (`../backend/`) connects to the same database but treats all tables as read-only (`managed = False`).

## Architecture

```
db/
  config/          Django settings (DB connection only, no web server)
  taxonomy/        Authoritative models, migrations, and management commands
  init/            SQL scripts run on first container start (extensions)
  scripts/         Helper scripts (COL download)
  data/            Downloaded source data (gitignored)
```

**Why a separate Django project?** The backend API should only serve queries — it shouldn't own schema changes or data loading. Keeping migrations and bulk-import commands here means `backend/` stays focused, and schema changes are managed independently of API deployments.

## Prerequisites

- [uv](https://docs.astral.sh/uv/) (Python package manager)
- Docker & Docker Compose (for local PostgreSQL)

## Quick Start

```bash
# 1. Start PostgreSQL (creates DB with ltree + pg_trgm extensions)
cp .env.example .env   # edit password if desired
docker compose up -d

# 2. Run migrations
uv run python manage.py migrate

# 3. Download Catalogue of Life data (~1GB)
bash scripts/download_col.sh

# 4. Load taxonomy (~5M rows, takes a few minutes)
uv run python manage.py load_taxonomy --file data/col/NameUsage.tsv

# 5. Load common names
uv run python manage.py load_vernacular --file data/col/VernacularName.tsv
```

Use `--clear` on steps 4/5 to wipe and reload from scratch.

## Data Source

All taxonomy data comes from the [Catalogue of Life](https://www.catalogueoflife.org/) (COL), downloaded in ColDP format from `download.checklistbank.org`. The loader filters to **accepted** and **provisionally accepted** taxa only (synonyms are skipped).

## Database

PostgreSQL 16 with two extensions:

- **ltree** — materialized path column (`Taxon.path`) for efficient ancestor/descendant queries (e.g., "all species under Mammalia")
- **pg_trgm** — trigram indexes on `scientific_name` and `vernacular_name` for fuzzy text search

## Schema

Three tables, all prefixed `taxonomy_`:

| Table | Purpose |
|---|---|
| `taxonomy_taxon` | Core taxonomy tree — one row per accepted taxon (kingdom through species) |
| `taxonomy_vernacularname` | Common names linked to taxa (e.g., "Dog" for *Canis lupus familiaris*) |
| `taxonomy_taxonimage` | Images linked to taxa (populated separately, not from COL) |

### Key fields on `taxonomy_taxon`

- `col_id` — Catalogue of Life identifier (unique)
- `parent_id` — FK to parent taxon (self-referential tree)
- `path` — ltree materialized path built from `col_id` chain (root.child.grandchild)
- `rank` — taxonomic rank (kingdom, phylum, class, order, family, genus, species)
- `scientific_name`, `authorship` — the taxon's name and authority
- `kingdom` through `genus` — denormalized higher classification for fast filtering
- `species_count` — precomputed count of descendant species
- `search_vector` — tsvector combining scientific + vernacular names for full-text search

### Indexes

- GiST on `path` — fast ltree containment queries (`<@`, `@>`)
- GIN on `search_vector` — full-text search
- GIN trigram on `scientific_name` and `vernacular_name.name` — fuzzy/partial match
- B-tree on `scientific_name`, `rank`, `parent_id`, `col_id`

## Load Process

`load_taxonomy` runs in four phases:

1. **Bulk insert** — parse NameUsage.tsv, insert rows in batches of 5000 (indexes dropped for speed)
2. **Build ltree paths** — recursive CTE walks the parent chain and sets `path` for every node
3. **Compute species counts** — aggregate query counts descendant species per taxon
4. **Build search vectors** — populates `search_vector` with weighted tsvector (scientific name = A)

`load_vernacular` then adds common names and updates search vectors (vernacular names = weight B).

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `POSTGRES_DB` | `animalwiki` | Database name |
| `POSTGRES_USER` | `animalwiki` | Database user |
| `POSTGRES_PASSWORD` | `password` | Database password |
| `POSTGRES_HOST` | `localhost` | Database host |
| `POSTGRES_PORT` | `5432` | Database port |

Set these in `.env` (loaded automatically by both Docker Compose and Django settings).
