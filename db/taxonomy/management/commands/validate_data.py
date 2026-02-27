from django.core.management.base import BaseCommand
from django.db import connection


CHECKS = [
    (
        "Total taxa",
        "SELECT COUNT(*) FROM taxonomy_taxon",
    ),
    (
        "Taxa by rank",
        """
        SELECT rank, COUNT(*) AS cnt
        FROM taxonomy_taxon
        GROUP BY rank
        ORDER BY cnt DESC
        """,
    ),
    (
        "Taxa by status",
        """
        SELECT status, COUNT(*) AS cnt
        FROM taxonomy_taxon
        GROUP BY status
        ORDER BY cnt DESC
        """,
    ),
    (
        "Root nodes (no parent)",
        "SELECT COUNT(*) FROM taxonomy_taxon WHERE parent_id IS NULL",
    ),
    (
        "Orphan taxa (parent_id points to nonexistent row)",
        """
        SELECT COUNT(*)
        FROM taxonomy_taxon t
        LEFT JOIN taxonomy_taxon p ON t.parent_id = p.id
        WHERE t.parent_id IS NOT NULL AND p.id IS NULL
        """,
    ),
    (
        "Empty or NULL ltree paths",
        "SELECT COUNT(*) FROM taxonomy_taxon WHERE path IS NULL OR path = ''",
    ),
    (
        "Rank gaps (species whose parent is not genus)",
        """
        SELECT COUNT(*)
        FROM taxonomy_taxon child
        JOIN taxonomy_taxon parent ON child.parent_id = parent.id
        WHERE child.rank = 'species' AND parent.rank != 'genus'
        """,
    ),
    (
        "Taxa with zero-length scientific_name",
        "SELECT COUNT(*) FROM taxonomy_taxon WHERE scientific_name = ''",
    ),
    (
        "Duplicate col_id values (should be 0)",
        """
        SELECT COUNT(*) FROM (
            SELECT col_id FROM taxonomy_taxon
            GROUP BY col_id HAVING COUNT(*) > 1
        ) dupes
        """,
    ),
    (
        "Taxa with species_count = 0 by rank (top 10)",
        """
        SELECT rank, COUNT(*) AS cnt
        FROM taxonomy_taxon
        WHERE species_count = 0 AND rank NOT IN ('species', 'subspecies')
        GROUP BY rank
        ORDER BY cnt DESC
        LIMIT 10
        """,
    ),
    (
        "Total vernacular names",
        "SELECT COUNT(*) FROM taxonomy_vernacularname",
    ),
    (
        "Vernacular names by language (top 10)",
        """
        SELECT language, COUNT(*) AS cnt
        FROM taxonomy_vernacularname
        GROUP BY language
        ORDER BY cnt DESC
        LIMIT 10
        """,
    ),
    (
        "Orphan vernacular names (taxon_id points to nonexistent row)",
        """
        SELECT COUNT(*)
        FROM taxonomy_vernacularname vn
        LEFT JOIN taxonomy_taxon t ON vn.taxon_id = t.id
        WHERE t.id IS NULL
        """,
    ),
    (
        "Multiple preferred vernacular names per taxon+language",
        """
        SELECT COUNT(*) FROM (
            SELECT taxon_id, language
            FROM taxonomy_vernacularname
            WHERE is_preferred
            GROUP BY taxon_id, language
            HAVING COUNT(*) > 1
        ) dupes
        """,
    ),
    (
        "Taxa with NULL search_vector",
        "SELECT COUNT(*) FROM taxonomy_taxon WHERE search_vector IS NULL",
    ),
    (
        "Sample taxa (5 random species with vernacular names)",
        """
        SELECT t.scientific_name, t.rank, t.family, vn.name AS common_name, vn.language
        FROM taxonomy_taxon t
        JOIN taxonomy_vernacularname vn ON vn.taxon_id = t.id AND vn.is_preferred
        WHERE t.rank = 'species' AND vn.language = 'eng'
        ORDER BY RANDOM()
        LIMIT 5
        """,
    ),
]


class Command(BaseCommand):
    help = "Run validation checks on loaded taxonomy data"

    def handle(self, *args, **options):
        with connection.cursor() as cursor:
            for label, sql in CHECKS:
                self.stdout.write(self.style.MIGRATE_HEADING(f"\n{label}"))
                try:
                    cursor.execute(sql)
                    rows = cursor.fetchall()
                    cols = [col.name for col in cursor.description]

                    if len(cols) == 1 and len(rows) == 1:
                        # Single scalar result
                        self.stdout.write(f"  {rows[0][0]}")
                    else:
                        # Tabular result
                        widths = [len(c) for c in cols]
                        for row in rows:
                            for i, val in enumerate(row):
                                widths[i] = max(widths[i], len(str(val)))

                        header = "  ".join(c.ljust(w) for c, w in zip(cols, widths))
                        self.stdout.write(f"  {header}")
                        self.stdout.write(f"  {'  '.join('-' * w for w in widths)}")
                        for row in rows:
                            line = "  ".join(
                                str(v).ljust(w) for v, w in zip(row, widths)
                            )
                            self.stdout.write(f"  {line}")
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"  ERROR: {e}"))

        self.stdout.write(self.style.SUCCESS("\nValidation complete."))
