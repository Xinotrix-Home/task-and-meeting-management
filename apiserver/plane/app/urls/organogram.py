from django.urls import path

from plane.app.views import (
    OrganogramPositionViewSet,
    WorkspaceOrganogramViewSet,
)


urlpatterns = [
    # Organogram Positions
    path(
        "workspaces/<str:slug>/organogram/positions/",
        OrganogramPositionViewSet.as_view({"get": "list", "post": "create"}),
        name="organogram-positions",
    ),
    path(
        "workspaces/<str:slug>/organogram/positions/<uuid:pk>/",
        OrganogramPositionViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="organogram-position-detail",
    ),
    path(
        "workspaces/<str:slug>/organogram/tree/",
        OrganogramPositionViewSet.as_view({"get": "tree"}),
        name="organogram-tree",
    ),
    path(
        "workspaces/<str:slug>/organogram/positions/<uuid:pk>/assign-user/",
        OrganogramPositionViewSet.as_view({"post": "assign_user"}),
        name="organogram-position-assign-user",
    ),
    path(
        "workspaces/<str:slug>/organogram/positions/<uuid:pk>/unassign-user/",
        OrganogramPositionViewSet.as_view({"post": "unassign_user"}),
        name="organogram-position-unassign-user",
    ),
    path(
        "workspaces/<str:slug>/organogram/positions/<uuid:pk>/children/",
        OrganogramPositionViewSet.as_view({"get": "get_children"}),
        name="organogram-position-children",
    ),
    path(
        "workspaces/<str:slug>/organogram/positions/<uuid:pk>/reporting-chain/",
        OrganogramPositionViewSet.as_view({"get": "reporting_chain"}),
        name="organogram-position-reporting-chain",
    ),
    # Workspace Organograms (Multiple organogram support)
    path(
        "workspaces/<str:slug>/organograms/",
        WorkspaceOrganogramViewSet.as_view({"get": "list", "post": "create"}),
        name="workspace-organograms",
    ),
    path(
        "workspaces/<str:slug>/organograms/<uuid:pk>/",
        WorkspaceOrganogramViewSet.as_view(
            {
                "get": "retrieve",
                "patch": "partial_update",
                "delete": "destroy",
            }
        ),
        name="workspace-organogram-detail",
    ),
    path(
        "workspaces/<str:slug>/organograms/<uuid:pk>/activate/",
        WorkspaceOrganogramViewSet.as_view({"post": "activate"}),
        name="workspace-organogram-activate",
    ),
]
