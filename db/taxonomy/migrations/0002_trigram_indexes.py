from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ("taxonomy", "0001_initial"),
    ]

    operations = [
        migrations.RunSQL(
            sql="""
                CREATE INDEX IF NOT EXISTS taxon_sciname_trgm
                ON taxonomy_taxon USING gin (scientific_name gin_trgm_ops);
            """,
            reverse_sql="DROP INDEX IF EXISTS taxon_sciname_trgm;",
        ),
        migrations.RunSQL(
            sql="""
                CREATE INDEX IF NOT EXISTS vernacular_name_trgm
                ON taxonomy_vernacularname USING gin (name gin_trgm_ops);
            """,
            reverse_sql="DROP INDEX IF EXISTS vernacular_name_trgm;",
        ),
    ]
