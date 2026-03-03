from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import QuizView, SearchView, TaxonViewSet

router = DefaultRouter()
router.register(r"taxa", TaxonViewSet, basename="taxon")

urlpatterns = [
    path("quiz/", QuizView.as_view(), name="quiz"),
    path("search/", SearchView.as_view(), name="search"),
    path("", include(router.urls)),
]
