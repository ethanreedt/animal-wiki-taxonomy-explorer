import time

import requests
from django.core.management.base import BaseCommand
from tqdm import tqdm

from taxonomy.models import Taxon, TaxonImage

BATCH_SIZE = 50
WIKI_API = "https://en.wikipedia.org/w/api.php"
SESSION = requests.Session()
SESSION.headers.update({"User-Agent": "AnimalWiki/1.0 (taxonomy explorer)"})


def fetch_wiki_images(scientific_names):
    """Fetch image URLs from Wikipedia for a batch of scientific names.

    Uses the Wikipedia API to look up page images by title (scientific name).
    Returns a dict mapping scientific_name -> {url, thumbnail_url, license}.
    """
    results = {}
    if not scientific_names:
        return results

    # Wikipedia API accepts up to 50 titles per request
    titles = "|".join(scientific_names)
    params = {
        "action": "query",
        "titles": titles,
        "prop": "pageimages|pageprops",
        "piprop": "original|thumbnail",
        "pithumbsize": 300,
        "redirects": 1,
        "format": "json",
    }

    try:
        resp = SESSION.get(WIKI_API, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
    except (requests.RequestException, ValueError):
        return results

    # Build redirect map: redirected title -> original title
    redirects = {}
    if "redirects" in data.get("query", {}):
        for r in data["query"]["redirects"]:
            redirects[r["to"]] = r["from"]

    # Also build normalized map
    normalized = {}
    if "normalized" in data.get("query", {}):
        for n in data["query"]["normalized"]:
            normalized[n["to"]] = n["from"]

    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        if "missing" in page or "original" not in page:
            continue

        title = page["title"]
        # Trace back to original scientific name
        original = redirects.get(title, title)
        original = normalized.get(original, original)

        img = page.get("original", {})
        thumb = page.get("thumbnail", {})

        results[original] = {
            "url": img.get("source", ""),
            "thumbnail_url": thumb.get("source", ""),
        }

    return results


class Command(BaseCommand):
    help = "Load images from Wikipedia for taxa, prioritized by species_count"

    def add_arguments(self, parser):
        parser.add_argument(
            "--limit",
            type=int,
            default=10000,
            help="Maximum number of taxa to fetch images for (default: 10000)",
        )
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Delete all existing TaxonImage records before loading",
        )
        parser.add_argument(
            "--min-species",
            type=int,
            default=0,
            help="Only fetch images for taxa with at least this many species",
        )
        parser.add_argument(
            "--ranks",
            type=str,
            default="",
            help="Comma-separated list of ranks to fetch (e.g., 'class,order,family'). Empty = all ranks.",
        )

    def handle(self, *args, **options):
        limit = options["limit"]

        if options["clear"]:
            count = TaxonImage.objects.count()
            TaxonImage.objects.all().delete()
            self.stdout.write(f"Cleared {count} existing images")

        # Find taxa that don't already have images
        taxa_qs = (
            Taxon.objects.filter(status="accepted")
            .exclude(images__isnull=False)
            .order_by("-species_count")
        )

        if options["min_species"]:
            taxa_qs = taxa_qs.filter(species_count__gte=options["min_species"])

        if options["ranks"]:
            ranks = [r.strip() for r in options["ranks"].split(",")]
            taxa_qs = taxa_qs.filter(rank__in=ranks)

        # Exclude taxa that already have images
        taxa_with_images = TaxonImage.objects.values_list("taxon_id", flat=True)
        taxa_qs = taxa_qs.exclude(id__in=taxa_with_images)

        taxa = list(taxa_qs[:limit])
        self.stdout.write(f"Fetching images for {len(taxa)} taxa...")

        found = 0
        not_found = 0
        errors = 0
        images_to_create = []

        for i in tqdm(range(0, len(taxa), BATCH_SIZE), desc="Batches"):
            batch = taxa[i : i + BATCH_SIZE]
            name_to_taxon = {t.scientific_name: t for t in batch}
            names = list(name_to_taxon.keys())

            try:
                image_map = fetch_wiki_images(names)
            except Exception as e:
                self.stderr.write(f"Batch error: {e}")
                errors += len(batch)
                continue

            for name, taxon in name_to_taxon.items():
                if name in image_map and image_map[name]["url"]:
                    img_data = image_map[name]
                    images_to_create.append(
                        TaxonImage(
                            taxon=taxon,
                            url=img_data["url"],
                            thumbnail_url=img_data.get("thumbnail_url", ""),
                            license="CC",
                            source="wikipedia",
                            is_primary=True,
                        )
                    )
                    found += 1
                else:
                    not_found += 1

            # Bulk insert every 500 images
            if len(images_to_create) >= 500:
                TaxonImage.objects.bulk_create(images_to_create)
                images_to_create = []

            # Be polite to Wikipedia API
            time.sleep(0.1)

        # Insert remaining
        if images_to_create:
            TaxonImage.objects.bulk_create(images_to_create)

        self.stdout.write(
            self.style.SUCCESS(
                f"Done: {found} images found, {not_found} not found, {errors} errors"
            )
        )
