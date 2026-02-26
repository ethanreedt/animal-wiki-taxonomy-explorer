from django.http import JsonResponse
from django.urls import path


def hello(request):
    return JsonResponse({"message": "Hello World from Animal Wiki API!"})


urlpatterns = [
    path("api/hello/", hello),
]
