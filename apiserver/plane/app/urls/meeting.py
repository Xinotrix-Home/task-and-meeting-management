# Django imports
from django.urls import path
from plane.app.views import (
    WorkspaceMeetingViewSet,
)

# urls.py entries to add
urlpatterns = [
    path(
        "workspaces/<str:slug>/meetings/",
        WorkspaceMeetingViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-meetings",
    ),
    path(
        "workspaces/<str:slug>/meetings/<uuid:pk>/",
        WorkspaceMeetingViewSet.as_view({
            "get": "retrieve",
            "patch": "partial_update",
            "delete": "destroy"
        }),
        name="workspace-meeting-detail",
    ),
]