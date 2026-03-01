import logging
import time
from functools import lru_cache

import requests as http_requests
from django.contrib.postgres.search import SearchQuery, SearchRank
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

logger = logging.getLogger(__name__)

WIKI_API = "https://en.wikipedia.org/w/api.php"

# Simple in-memory cache with TTL
_summary_cache = {}
_CACHE_TTL = 3600  # 1 hour


def _get_wiki_summary(scientific_name):
    """Fetch Wikipedia extract for a scientific name, with caching."""
    now = time.time()
    if scientific_name in _summary_cache:
        cached, ts = _summary_cache[scientific_name]
        if now - ts < _CACHE_TTL:
            return cached

    params = {
        "action": "query",
        "titles": scientific_name,
        "prop": "extracts",
        "exintro": True,
        "explaintext": True,
        "redirects": 1,
        "format": "json",
    }
    try:
        resp = http_requests.get(
            WIKI_API,
            params=params,
            timeout=5,
            headers={"User-Agent": "AnimalWiki/1.0"},
        )
        resp.raise_for_status()
        pages = resp.json().get("query", {}).get("pages", {})
        for page in pages.values():
            if "missing" not in page and "extract" in page:
                extract = page["extract"]
                # Truncate to ~500 chars at sentence boundary
                if len(extract) > 500:
                    cut = extract[:500].rfind(". ")
                    if cut > 200:
                        extract = extract[: cut + 1]
                result = {"summary": extract, "source": "wikipedia"}
                _summary_cache[scientific_name] = (result, now)
                return result
    except Exception as e:
        logger.warning("Wikipedia fetch failed for %s: %s", scientific_name, e)

    result = {"summary": None, "source": None}
    _summary_cache[scientific_name] = (result, now)
    return result

from .models import Taxon, TaxonImage, VernacularName
from .serializers import (
    SearchResultSerializer,
    TaxonDetailSerializer,
    TaxonListSerializer,
)


def _prefetch_list_fields(taxa):
    """Batch-load common names and image URLs onto a list of taxa."""
    taxon_ids = [t.id for t in taxa]
    if not taxon_ids:
        return taxa

    # Common names
    common_names = {}
    vn_qs = (
        VernacularName.objects.filter(taxon_id__in=taxon_ids, language="eng")
        .order_by("-is_preferred")
    )
    for vn in vn_qs:
        if vn.taxon_id not in common_names:
            common_names[vn.taxon_id] = vn.name

    # Images (prefer primary, then any)
    image_urls = {}
    img_qs = (
        TaxonImage.objects.filter(taxon_id__in=taxon_ids)
        .order_by("-is_primary")
    )
    for img in img_qs:
        if img.taxon_id not in image_urls:
            image_urls[img.taxon_id] = img.thumbnail_url or img.url

    for taxon in taxa:
        taxon._prefetched_common_name = common_names.get(taxon.id)
        taxon._prefetched_image_url = image_urls.get(taxon.id)

    return taxa


class TaxonViewSet(ReadOnlyModelViewSet):
    queryset = Taxon.objects.filter(status="accepted")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return TaxonDetailSerializer
        return TaxonListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "retrieve":
            qs = qs.prefetch_related("vernacular_names", "images")
        return qs

    @action(detail=False, methods=["get"])
    def roots(self, request):
        roots = list(
            self.get_queryset()
            .filter(parent__isnull=True)
            .order_by("-species_count")
        )
        _prefetch_list_fields(roots)
        serializer = TaxonListSerializer(roots, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def children(self, request, pk=None):
        taxon = self.get_object()
        children = list(
            self.get_queryset()
            .filter(parent=taxon)
            .order_by("-species_count")[:200]
        )
        _prefetch_list_fields(children)
        serializer = TaxonListSerializer(children, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def ancestors(self, request, pk=None):
        taxon = self.get_object()
        if not taxon.path:
            return Response([])

        path_ids = taxon.path.split(".")
        ancestors = list(
            self.get_queryset()
            .filter(col_id__in=path_ids)
            .order_by("path")
        )
        _prefetch_list_fields(ancestors)
        serializer = TaxonListSerializer(ancestors, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def summary(self, request, pk=None):
        """Fetch Wikipedia summary for a taxon."""
        taxon = self.get_object()
        result = _get_wiki_summary(taxon.scientific_name)
        return Response(result)

    @action(detail=False, methods=["get"])
    def featured(self, request):
        """Return a curated set of interesting taxa for the landing page."""
        FEATURED_NAMES = [
            "Mammalia",
            "Aves",
            "Reptilia",
            "Amphibia",
            "Actinopterygii",
            "Insecta",
        ]
        taxa = list(
            self.get_queryset()
            .filter(scientific_name__in=FEATURED_NAMES)
            .order_by("-species_count")
        )
        _prefetch_list_fields(taxa)
        serializer = TaxonListSerializer(taxa, many=True)
        return Response(serializer.data)


class SearchView(APIView):
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "search"

    def get(self, request):
        query = request.query_params.get("q", "").strip()
        if len(query) < 2:
            return Response(
                {"detail": "Query must be at least 2 characters."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        limit = min(int(request.query_params.get("limit", 8)), 20)

        # Full-text search on search_vector
        search_query = SearchQuery(query, config="english")
        ft_results = (
            Taxon.objects.filter(status="accepted", search_vector=search_query)
            .annotate(ft_rank=SearchRank("search_vector", search_query))
            .order_by("-ft_rank")[:limit]
        )

        results = list(ft_results)

        # Trigram fallback if full-text didn't return enough results
        if len(results) < limit:
            existing_ids = {t.id for t in results}
            remaining = limit - len(results)

            trigram_results = (
                Taxon.objects.filter(status="accepted")
                .filter(
                    Q(scientific_name__trigram_similar=query)
                    | Q(
                        vernacular_names__name__trigram_similar=query,
                        vernacular_names__language="eng",
                    )
                )
                .exclude(id__in=existing_ids)
                .distinct()[:remaining]
            )
            results.extend(trigram_results)

        _prefetch_list_fields(results)
        serializer = SearchResultSerializer(results, many=True)
        return Response(serializer.data)
