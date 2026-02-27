from django.contrib.postgres.search import SearchQuery, SearchRank
from django.db.models import Q
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework.viewsets import ReadOnlyModelViewSet

from .models import Taxon, VernacularName
from .serializers import (
    SearchResultSerializer,
    TaxonDetailSerializer,
    TaxonListSerializer,
)


class TaxonViewSet(ReadOnlyModelViewSet):
    queryset = Taxon.objects.filter(status="accepted")

    def get_serializer_class(self):
        if self.action == "retrieve":
            return TaxonDetailSerializer
        return TaxonListSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        if self.action == "retrieve":
            qs = qs.prefetch_related("vernacular_names")
        return qs

    @action(detail=False, methods=["get"])
    def roots(self, request):
        roots = self.get_queryset().filter(parent__isnull=True).order_by("-species_count")
        serializer = TaxonListSerializer(roots, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def children(self, request, pk=None):
        taxon = self.get_object()
        children = (
            self.get_queryset()
            .filter(parent=taxon)
            .order_by("-species_count")[:200]
        )
        serializer = TaxonListSerializer(children, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def ancestors(self, request, pk=None):
        taxon = self.get_object()
        if not taxon.path:
            return Response([])

        path_ids = taxon.path.split(".")
        ancestors = (
            self.get_queryset()
            .filter(col_id__in=path_ids)
            .order_by("path")
        )
        serializer = TaxonListSerializer(ancestors, many=True)
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

        # Prefetch common names for all results
        taxon_ids = [t.id for t in results]
        common_names = {}
        vn_qs = (
            VernacularName.objects.filter(
                taxon_id__in=taxon_ids, language="eng"
            )
            .order_by("-is_preferred")
        )
        for vn in vn_qs:
            if vn.taxon_id not in common_names:
                common_names[vn.taxon_id] = vn.name

        for taxon in results:
            taxon._prefetched_common_name = common_names.get(taxon.id)

        serializer = SearchResultSerializer(results, many=True)
        return Response(serializer.data)
