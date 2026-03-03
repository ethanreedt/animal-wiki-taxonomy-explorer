import random

from django.db.models import Q

from .models import Taxon, TaxonImage, VernacularName

# Difficulty -> which ancestor ranks to quiz on
DIFFICULTY_RANKS = {
    "easy": ["phylum", "class"],
    "medium": ["class", "order"],
    "hard": ["order", "family"],
}

RANK_FIELD_MAP = {
    "kingdom": "kingdom",
    "phylum": "phylum",
    "class": "klass",
    "order": "order",
    "family": "family",
    "genus": "genus",
}

MAX_ATTEMPTS = 5


def _random_species_with_image():
    """Return a random accepted species that has an image and English common name."""
    count = Taxon.objects.filter(
        status="accepted",
        rank="species",
        images__isnull=False,
    ).distinct().count()
    if count == 0:
        return None
    offset = random.randint(0, count - 1)
    species = (
        Taxon.objects.filter(
            status="accepted",
            rank="species",
            images__isnull=False,
        )
        .distinct()
        .order_by("id")[offset : offset + 1]
    )
    species = list(species)
    if not species:
        return None
    species = species[0]

    # Must have English common name
    vn = VernacularName.objects.filter(
        taxon=species, language="eng"
    ).order_by("-is_preferred").first()
    if not vn:
        return None

    img = TaxonImage.objects.filter(taxon=species).order_by("-is_primary").first()
    if not img:
        return None

    return {
        "taxon": species,
        "common_name": vn.name,
        "image_url": img.thumbnail_url or img.url,
    }


def _species_info(species_data):
    """Format species data for API response."""
    t = species_data["taxon"]
    return {
        "id": t.id,
        "scientific_name": t.scientific_name,
        "common_name": species_data["common_name"],
        "image_url": species_data["image_url"],
    }


def _get_wrong_answers(correct_value, rank, count=3):
    """Get plausible wrong answers from the same rank level."""
    field = RANK_FIELD_MAP.get(rank)
    if not field:
        return []

    # Find siblings: other values at this rank that have species
    siblings = (
        Taxon.objects.filter(status="accepted", rank=rank)
        .exclude(scientific_name=correct_value)
        .values_list("scientific_name", flat=True)
        .distinct()
    )
    siblings = list(siblings[:50])
    if len(siblings) < count:
        return siblings
    return random.sample(siblings, count)


def generate_place_it(difficulty="medium"):
    """Pick a species, ask what rank group it belongs to."""
    ranks = DIFFICULTY_RANKS.get(difficulty, DIFFICULTY_RANKS["medium"])

    for _ in range(MAX_ATTEMPTS):
        species_data = _random_species_with_image()
        if not species_data:
            continue

        target_rank = random.choice(ranks)
        field = RANK_FIELD_MAP.get(target_rank)
        if not field:
            continue

        correct_value = getattr(species_data["taxon"], field, "")
        if not correct_value:
            continue

        wrong = _get_wrong_answers(correct_value, target_rank, count=3)
        if len(wrong) < 3:
            continue

        options = wrong + [correct_value]
        random.shuffle(options)

        return {
            "type": "place_it",
            "difficulty": difficulty,
            "rank": target_rank,
            "species": _species_info(species_data),
            "question": f"What {target_rank} does this species belong to?",
            "options": options,
            "correct_answer": correct_value,
        }

    return None


def generate_odd_one_out(difficulty="medium"):
    """Pick 3 species from one group + 1 outsider. User finds the odd one."""
    ranks = DIFFICULTY_RANKS.get(difficulty, DIFFICULTY_RANKS["medium"])

    for _ in range(MAX_ATTEMPTS):
        target_rank = random.choice(ranks)
        field = RANK_FIELD_MAP.get(target_rank)
        if not field:
            continue

        # Pick a random group at this rank
        groups = list(
            Taxon.objects.filter(status="accepted", rank=target_rank)
            .values_list("scientific_name", flat=True)
            .distinct()[:100]
        )
        if len(groups) < 2:
            continue

        random.shuffle(groups)
        main_group = groups[0]
        outsider_group = groups[1]

        # Get species from main group with images
        filter_kwargs = {field: main_group, "status": "accepted", "rank": "species"}
        main_species_ids = list(
            Taxon.objects.filter(**filter_kwargs, images__isnull=False)
            .distinct()
            .values_list("id", flat=True)[:50]
        )
        if len(main_species_ids) < 3:
            continue

        # Get outsider species
        outsider_kwargs = {field: outsider_group, "status": "accepted", "rank": "species"}
        outsider_ids = list(
            Taxon.objects.filter(**outsider_kwargs, images__isnull=False)
            .distinct()
            .values_list("id", flat=True)[:50]
        )
        if not outsider_ids:
            continue

        chosen_main_ids = random.sample(main_species_ids, 3)
        outsider_id = random.choice(outsider_ids)

        # Load full data
        all_ids = chosen_main_ids + [outsider_id]
        taxa = {t.id: t for t in Taxon.objects.filter(id__in=all_ids)}

        # Load names and images
        names = {}
        for vn in VernacularName.objects.filter(taxon_id__in=all_ids, language="eng").order_by("-is_preferred"):
            if vn.taxon_id not in names:
                names[vn.taxon_id] = vn.name

        images = {}
        for img in TaxonImage.objects.filter(taxon_id__in=all_ids).order_by("-is_primary"):
            if img.taxon_id not in images:
                images[img.taxon_id] = img.thumbnail_url or img.url

        # All must have names and images
        if not all(tid in names and tid in images for tid in all_ids):
            continue

        species_list = []
        for tid in all_ids:
            t = taxa[tid]
            species_list.append({
                "id": t.id,
                "scientific_name": t.scientific_name,
                "common_name": names[tid],
                "image_url": images[tid],
            })

        random.shuffle(species_list)

        return {
            "type": "odd_one_out",
            "difficulty": difficulty,
            "rank": target_rank,
            "group_name": main_group,
            "question": f"Which species does NOT belong to {target_rank} {main_group}?",
            "species": species_list,
            "correct_answer": outsider_id,
        }

    return None


def generate_closer_kin(difficulty="medium"):
    """Pick species A, close relative B, distant relative C. Ask which is closer."""
    ranks = DIFFICULTY_RANKS.get(difficulty, DIFFICULTY_RANKS["medium"])

    for _ in range(MAX_ATTEMPTS):
        target_rank = random.choice(ranks)
        field = RANK_FIELD_MAP.get(target_rank)
        if not field:
            continue

        # Pick two different groups at this rank
        groups = list(
            Taxon.objects.filter(status="accepted", rank=target_rank)
            .values_list("scientific_name", flat=True)
            .distinct()[:100]
        )
        if len(groups) < 2:
            continue

        random.shuffle(groups)
        close_group = groups[0]
        distant_group = groups[1]

        # Get 2 species from close group (A and B)
        close_kwargs = {field: close_group, "status": "accepted", "rank": "species"}
        close_ids = list(
            Taxon.objects.filter(**close_kwargs, images__isnull=False)
            .distinct()
            .values_list("id", flat=True)[:50]
        )
        if len(close_ids) < 2:
            continue

        # Get 1 species from distant group (C)
        distant_kwargs = {field: distant_group, "status": "accepted", "rank": "species"}
        distant_ids = list(
            Taxon.objects.filter(**distant_kwargs, images__isnull=False)
            .distinct()
            .values_list("id", flat=True)[:50]
        )
        if not distant_ids:
            continue

        chosen_close = random.sample(close_ids, 2)
        subject_id, close_id = chosen_close
        distant_id = random.choice(distant_ids)

        all_ids = [subject_id, close_id, distant_id]
        taxa = {t.id: t for t in Taxon.objects.filter(id__in=all_ids)}

        names = {}
        for vn in VernacularName.objects.filter(taxon_id__in=all_ids, language="eng").order_by("-is_preferred"):
            if vn.taxon_id not in names:
                names[vn.taxon_id] = vn.name

        images = {}
        for img in TaxonImage.objects.filter(taxon_id__in=all_ids).order_by("-is_primary"):
            if img.taxon_id not in images:
                images[img.taxon_id] = img.thumbnail_url or img.url

        if not all(tid in names and tid in images for tid in all_ids):
            continue

        def make_info(tid):
            t = taxa[tid]
            return {
                "id": t.id,
                "scientific_name": t.scientific_name,
                "common_name": names[tid],
                "image_url": images[tid],
            }

        return {
            "type": "closer_kin",
            "difficulty": difficulty,
            "rank": target_rank,
            "group_name": close_group,
            "question": f"Which species is more closely related to {names[subject_id]}?",
            "subject": make_info(subject_id),
            "options": [make_info(close_id), make_info(distant_id)],
            "correct_answer": close_id,
        }

    return None


GENERATORS = {
    "place_it": generate_place_it,
    "odd_one_out": generate_odd_one_out,
    "closer_kin": generate_closer_kin,
}


def generate_question(difficulty="medium", question_type=None):
    """Generate a random quiz question. Returns None if generation fails."""
    if question_type and question_type in GENERATORS:
        return GENERATORS[question_type](difficulty)

    # Random type
    gen = random.choice(list(GENERATORS.values()))
    return gen(difficulty)
