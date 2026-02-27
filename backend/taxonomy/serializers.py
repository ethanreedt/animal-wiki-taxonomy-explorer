from rest_framework import serializers

from .models import Taxon, VernacularName


class VernacularNameSerializer(serializers.ModelSerializer):
    class Meta:
        model = VernacularName
        fields = ["id", "name", "language", "is_preferred"]


class TaxonListSerializer(serializers.ModelSerializer):
    common_name = serializers.SerializerMethodField()

    class Meta:
        model = Taxon
        fields = [
            "id",
            "col_id",
            "scientific_name",
            "rank",
            "species_count",
            "extinct",
            "iucn_status",
            "common_name",
        ]

    def get_common_name(self, obj):
        if hasattr(obj, "_prefetched_common_name"):
            return obj._prefetched_common_name
        vn = obj.vernacular_names.filter(
            language="eng", is_preferred=True
        ).first()
        if not vn:
            vn = obj.vernacular_names.filter(language="eng").first()
        return vn.name if vn else None


class TaxonDetailSerializer(serializers.ModelSerializer):
    vernacular_names = VernacularNameSerializer(many=True, read_only=True)
    common_name = serializers.SerializerMethodField()
    parent_id = serializers.PrimaryKeyRelatedField(
        source="parent", read_only=True
    )

    class Meta:
        model = Taxon
        fields = [
            "id",
            "col_id",
            "scientific_name",
            "authorship",
            "rank",
            "status",
            "extinct",
            "species_count",
            "iucn_status",
            "kingdom",
            "phylum",
            "klass",
            "order",
            "family",
            "genus",
            "parent_id",
            "common_name",
            "vernacular_names",
        ]

    def get_common_name(self, obj):
        for vn in obj.vernacular_names.all():
            if vn.language == "eng" and vn.is_preferred:
                return vn.name
        for vn in obj.vernacular_names.all():
            if vn.language == "eng":
                return vn.name
        return None


class SearchResultSerializer(serializers.ModelSerializer):
    common_name = serializers.SerializerMethodField()
    rank_display = serializers.CharField(source="get_rank_display", read_only=True)

    class Meta:
        model = Taxon
        fields = [
            "id",
            "col_id",
            "scientific_name",
            "rank",
            "rank_display",
            "species_count",
            "common_name",
        ]

    def get_common_name(self, obj):
        if hasattr(obj, "_prefetched_common_name"):
            return obj._prefetched_common_name
        vn = obj.vernacular_names.filter(
            language="eng", is_preferred=True
        ).first()
        if not vn:
            vn = obj.vernacular_names.filter(language="eng").first()
        return vn.name if vn else None
