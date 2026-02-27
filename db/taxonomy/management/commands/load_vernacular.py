import csv
import sys

csv.field_size_limit(sys.maxsize)

from django.core.management.base import BaseCommand
from django.db import connection
from tqdm import tqdm

from taxonomy.models import Taxon, VernacularName

BATCH_SIZE = 5000


def strip_col_prefix(reader):
    """Strip 'col:' / 'clb:' namespace prefixes from ColDP TSV headers."""
    reader.fieldnames = [
        f.split(":", 1)[1] if ":" in f else f for f in reader.fieldnames
    ]
    return reader


class Command(BaseCommand):
    help = "Load vernacular names from a COL VernacularName.tsv file"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            required=True,
            help="Path to VernacularName.tsv from COL ColDP export",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing VernacularName records before loading",
        )

    def handle(self, *args, **options):
        filepath = options["file"]

        if options["clear"]:
            self.stdout.write("Clearing existing vernacular names...")
            VernacularName.objects.all().delete()

        self.stdout.write(f"Loading vernacular names from {filepath}...")

        count = self._load_rows(filepath)
        self.stdout.write(f"Inserted {count} vernacular names.")

        # Update search vectors to include vernacular names
        self.stdout.write("Updating search vectors with vernacular names...")
        self._update_search_vectors()

        self.stdout.write(self.style.SUCCESS("Vernacular name load complete."))

    def _count_lines(self, filepath):
        count = 0
        with open(filepath, "r", encoding="utf-8") as f:
            for _ in f:
                count += 1
        return count - 1

    def _load_rows(self, filepath):
        """Parse TSV and bulk insert VernacularName rows."""
        total = self._count_lines(filepath)
        self.stdout.write(f"  {total} rows to process...")

        # Build col_id -> pk lookup
        col_to_pk = dict(Taxon.objects.values_list("col_id", "pk"))

        batch = []
        inserted = 0
        skipped = 0

        with open(filepath, "r", encoding="utf-8") as f:
            reader = csv.DictReader(f, delimiter="\t")
            strip_col_prefix(reader)

            for row in tqdm(reader, total=total, desc="Loading vernacular"):
                taxon_id = (row.get("taxonID") or "").strip()
                name = (row.get("name") or "").strip()
                language = (row.get("language") or "").strip()

                if not taxon_id or not name:
                    skipped += 1
                    continue

                taxon_pk = col_to_pk.get(taxon_id)
                if not taxon_pk:
                    skipped += 1
                    continue

                vn = VernacularName(
                    taxon_id=taxon_pk,
                    name=name,
                    language=language[:3] if language else "",
                    is_preferred=(row.get("preferred") or "").strip().lower()
                    in ("true", "1"),
                    source="col",
                )
                batch.append(vn)

                if len(batch) >= BATCH_SIZE:
                    VernacularName.objects.bulk_create(batch, ignore_conflicts=True)
                    inserted += len(batch)
                    batch = []

        if batch:
            VernacularName.objects.bulk_create(batch, ignore_conflicts=True)
            inserted += len(batch)

        self.stdout.write(f"  Skipped {skipped} rows (missing taxon or name).")
        return inserted

    def _update_search_vectors(self):
        """Update Taxon search_vector to include vernacular names."""
        with connection.cursor() as cursor:
            cursor.execute(
                """
                UPDATE taxonomy_taxon AS t
                SET search_vector =
                    setweight(to_tsvector('simple', coalesce(t.scientific_name, '')), 'A')
                    || setweight(
                        to_tsvector('simple', coalesce(vn.names, '')), 'B'
                    )
                FROM (
                    SELECT taxon_id, string_agg(name, ' ') AS names
                    FROM taxonomy_vernacularname
                    GROUP BY taxon_id
                ) vn
                WHERE t.id = vn.taxon_id
                """
            )
        self.stdout.write("  Search vectors updated.")
