from django.contrib.postgres.indexes import GinIndex, GistIndex
from django.contrib.postgres.search import SearchVectorField
from django.db import models

from .fields import LTreeField


class Taxon(models.Model):
    RANK_CHOICES = [
        ("kingdom", "Kingdom"),
        ("phylum", "Phylum"),
        ("class", "Class"),
        ("order", "Order"),
        ("family", "Family"),
        ("genus", "Genus"),
        ("species", "Species"),
    ]

    STATUS_CHOICES = [
        ("accepted", "Accepted"),
        ("synonym", "Synonym"),
        ("provisionally accepted", "Provisionally Accepted"),
    ]

    IUCN_CHOICES = [
        ("LC", "Least Concern"),
        ("NT", "Near Threatened"),
        ("VU", "Vulnerable"),
        ("EN", "Endangered"),
        ("CR", "Critically Endangered"),
        ("EW", "Extinct in the Wild"),
        ("EX", "Extinct"),
        ("DD", "Data Deficient"),
        ("NE", "Not Evaluated"),
    ]

    # Core identity
    col_id = models.CharField(max_length=255, unique=True, db_index=True)
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children",
    )
    path = LTreeField(blank=True, default="")

    # Classification
    rank = models.CharField(max_length=50, choices=RANK_CHOICES, db_index=True)
    scientific_name = models.CharField(max_length=500, db_index=True)
    authorship = models.CharField(max_length=500, blank=True, default="")
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="accepted")
    extinct = models.BooleanField(default=False)

    # Denormalized higher classification
    kingdom = models.CharField(max_length=255, blank=True, default="")
    phylum = models.CharField(max_length=255, blank=True, default="")
    klass = models.CharField(max_length=255, blank=True, default="")
    order = models.CharField(max_length=255, blank=True, default="")
    family = models.CharField(max_length=255, blank=True, default="")
    genus = models.CharField(max_length=255, blank=True, default="")

    # Cached computed fields
    species_count = models.IntegerField(default=0)

    # Conservation
    iucn_status = models.CharField(
        max_length=2, choices=IUCN_CHOICES, blank=True, default=""
    )

    # Full-text search
    search_vector = SearchVectorField(null=True)

    class Meta:
        indexes = [
            GistIndex(fields=["path"], name="taxon_path_gist"),
            GinIndex(fields=["search_vector"], name="taxon_search_gin"),
            models.Index(fields=["scientific_name"], name="taxon_sciname_idx"),
            models.Index(fields=["rank"], name="taxon_rank_idx"),
            models.Index(fields=["parent"], name="taxon_parent_idx"),
        ]

    def __str__(self):
        return f"{self.scientific_name} ({self.rank})"


class VernacularName(models.Model):
    taxon = models.ForeignKey(
        Taxon, on_delete=models.CASCADE, related_name="vernacular_names"
    )
    name = models.CharField(max_length=255, db_index=True)
    language = models.CharField(max_length=3)
    is_preferred = models.BooleanField(default=False)
    source = models.CharField(max_length=50)

    class Meta:
        indexes = [
            models.Index(fields=["name"], name="vernacular_name_idx"),
            models.Index(fields=["language"], name="vernacular_lang_idx"),
        ]

    def __str__(self):
        return f"{self.name} ({self.language})"


class TaxonImage(models.Model):
    taxon = models.ForeignKey(
        Taxon, on_delete=models.CASCADE, related_name="images"
    )
    url = models.URLField(max_length=500)
    thumbnail_url = models.URLField(max_length=500, blank=True, default="")
    license = models.CharField(max_length=100, blank=True, default="")
    source = models.CharField(max_length=50)
    is_primary = models.BooleanField(default=False)

    def __str__(self):
        return f"Image for {self.taxon.scientific_name} ({self.source})"
