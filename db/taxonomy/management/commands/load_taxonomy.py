import csv
import sys

csv.field_size_limit(sys.maxsize)

from django.core.management.base import BaseCommand
from django.db import connection, transaction
from tqdm import tqdm

from taxonomy.models import Taxon

BATCH_SIZE = 5000


def strip_col_prefix(reader):
    """Strip 'col:' / 'clb:' namespace prefixes from ColDP TSV headers."""
    reader.fieldnames = [
        f.split(":", 1)[1] if ":" in f else f for f in reader.fieldnames
    ]
    return reader


# Column mapping from COL NameUsage.tsv to our model
RANK_NORMALIZE = {
    "kingdom": "kingdom",
    "phylum": "phylum",
    "class": "class",
    "order": "order",
    "family": "family",
    "genus": "genus",
    "species": "species",
    # Include intermediate ranks we still want to store
    "subkingdom": "subkingdom",
    "superphylum": "superphylum",
    "subphylum": "subphylum",
    "superclass": "superclass",
    "subclass": "subclass",
    "superorder": "superorder",
    "suborder": "suborder",
    "superfamily": "superfamily",
    "subfamily": "subfamily",
    "tribe": "tribe",
    "subtribe": "subtribe",
    "subgenus": "subgenus",
    "subspecies": "subspecies",
}


class Command(BaseCommand):
    help = "Load taxonomy data from a COL NameUsage.tsv file"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            required=True,
            help="Path to NameUsage.tsv from COL ColDP export",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing Taxon records before loading",
        )

    def handle(self, *args, **options):
        filepath = options["file"]

        if options["clear"]:
            self.stdout.write("Clearing existing taxon data...")
            Taxon.objects.all().delete()

        self.stdout.write(f"Loading taxonomy from {filepath}...")

        # Phase 1: Bulk insert rows
        count = self._load_rows(filepath)
        self.stdout.write(f"Inserted {count} taxa.")

        # Phase 2: Build ltree paths
        self.stdout.write("Building ltree paths...")
        self._build_paths()

        # Phase 3: Compute species counts
        self.stdout.write("Computing species counts...")
        self._compute_species_counts()

        # Phase 4: Build search vectors
        self.stdout.write("Building search vectors...")
        self._build_search_vectors()

        self.stdout.write(self.style.SUCCESS("Taxonomy load complete."))

    def _count_lines(self, filepath):
        """Count lines for progress bar."""
        count = 0
        with open(filepath, "r", encoding="utf-8") as f:
            for _ in f:
                count += 1
        return count - 1  # subtract header

    def _load_rows(self, filepath):
        """Parse TSV and bulk insert Taxon rows."""
        total = self._count_lines(filepath)
        self.stdout.write(f"  {total} rows to process...")

        # Drop indexes for faster bulk insert
        self._drop_indexes()

        batch = []
        inserted = 0
        # Track col_id -> parentID for later path building
        parent_map = {}

        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f, delimiter="\t")
            strip_col_prefix(reader)

            for row in tqdm(reader, total=total, desc="Loading taxa"):
                status = (row.get("status") or "").strip().lower()

                # Skip synonyms for MVP — only load accepted taxa
                if status not in ("accepted", "provisionally accepted"):
                    continue

                col_id = row.get("ID", "").strip()
                if not col_id:
                    continue

                rank = (row.get("rank") or "").strip().lower()
                parent_id = (row.get("parentID") or "").strip()

                if parent_id:
                    parent_map[col_id] = parent_id

                taxon = Taxon(
                    col_id=col_id,
                    rank=rank,
                    scientific_name=(row.get("scientificName") or "").strip(),
                    authorship=(row.get("authorship") or "").strip(),
                    status=status,
                    extinct=(row.get("extinct") or "").strip().lower()
                    in ("true", "1"),
                    kingdom=(row.get("kingdom") or "").strip(),
                    phylum=(row.get("phylum") or "").strip(),
                    klass=(row.get("class") or "").strip(),
                    order=(row.get("order") or "").strip(),
                    family=(row.get("family") or "").strip(),
                    genus=(row.get("genus") or "").strip(),
                )

                batch.append(taxon)

                if len(batch) >= BATCH_SIZE:
                    Taxon.objects.bulk_create(batch, ignore_conflicts=True)
                    inserted += len(batch)
                    batch = []

        if batch:
            Taxon.objects.bulk_create(batch, ignore_conflicts=True)
            inserted += len(batch)

        # Now set parent FK relationships
        self.stdout.write("  Setting parent relationships...")
        self._set_parents(parent_map)

        # Rebuild indexes
        self._rebuild_indexes()

        return inserted

    def _set_parents(self, parent_map):
        """Set parent ForeignKey using col_id -> parentID mapping."""
        # Build col_id -> pk lookup
        col_to_pk = dict(Taxon.objects.values_list("col_id", "pk"))

        updates = []
        for col_id, parent_col_id in tqdm(
            parent_map.items(), desc="Mapping parents"
        ):
            pk = col_to_pk.get(col_id)
            parent_pk = col_to_pk.get(parent_col_id)
            if pk and parent_pk:
                updates.append((pk, parent_pk))

        # Batch update using raw SQL for speed
        with connection.cursor() as cursor:
            for i in tqdm(
                range(0, len(updates), BATCH_SIZE), desc="Updating parents"
            ):
                batch = updates[i : i + BATCH_SIZE]
                # Build VALUES clause
                values = ",".join(
                    f"({pk},{parent_pk})" for pk, parent_pk in batch
                )
                cursor.execute(
                    f"""
                    UPDATE taxonomy_taxon AS t
                    SET parent_id = v.parent_id
                    FROM (VALUES {values}) AS v(id, parent_id)
                    WHERE t.id = v.id
                    """
                )

    def _build_paths(self):
        """Build ltree paths using recursive SQL."""
        with connection.cursor() as cursor:
            cursor.execute(
                """
                WITH RECURSIVE tree AS (
                    -- Root nodes (no parent)
                    SELECT id, col_id, col_id::text AS path
                    FROM taxonomy_taxon
                    WHERE parent_id IS NULL

                    UNION ALL

                    -- Child nodes
                    SELECT t.id, t.col_id, tree.path || '.' || t.col_id
                    FROM taxonomy_taxon t
                    JOIN tree ON t.parent_id = tree.id
                )
                UPDATE taxonomy_taxon
                SET path = tree.path::ltree
                FROM tree
                WHERE taxonomy_taxon.id = tree.id
                """
            )
        self.stdout.write("  Paths built.")

    def _compute_species_counts(self):
        """Compute species_count for each taxon using ltree descendant query."""
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE taxonomy_taxon AS t
                SET species_count = sub.cnt
                FROM (
                    SELECT ancestor.id, COUNT(descendant.id) AS cnt
                    FROM taxonomy_taxon ancestor
                    JOIN taxonomy_taxon descendant
                        ON descendant.path <@ ancestor.path
                        AND descendant.rank = 'species'
                    GROUP BY ancestor.id
                ) sub
                WHERE t.id = sub.id
                """
            )
        self.stdout.write("  Species counts computed.")

    def _build_search_vectors(self):
        """Populate search_vector field."""
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE taxonomy_taxon
                SET search_vector =
                    setweight(to_tsvector('simple', coalesce(scientific_name, '')), 'A')
                """
            )
        self.stdout.write("  Search vectors built.")

    def _drop_indexes(self):
        """Drop non-essential indexes for faster bulk insert."""
        with connection.cursor() as cursor:
            cursor.execute(
                """
                DROP INDEX IF EXISTS taxon_path_gist;
                DROP INDEX IF EXISTS taxon_search_gin;
                DROP INDEX IF EXISTS taxon_sciname_idx;
                DROP INDEX IF EXISTS taxon_rank_idx;
                DROP INDEX IF EXISTS taxon_parent_idx;
                """
            )

    def _rebuild_indexes(self):
        """Rebuild indexes after bulk insert."""
        with connection.cursor() as cursor:
            cursor.execute(
                """
                CREATE INDEX IF NOT EXISTS taxon_path_gist
                    ON taxonomy_taxon USING gist (path);
                CREATE INDEX IF NOT EXISTS taxon_search_gin
                    ON taxonomy_taxon USING gin (search_vector);
                CREATE INDEX IF NOT EXISTS taxon_sciname_idx
                    ON taxonomy_taxon (scientific_name);
                CREATE INDEX IF NOT EXISTS taxon_rank_idx
                    ON taxonomy_taxon (rank);
                CREATE INDEX IF NOT EXISTS taxon_parent_idx
                    ON taxonomy_taxon (parent_id);
                """
            )
