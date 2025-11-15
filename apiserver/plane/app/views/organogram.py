# Django imports
from django.db.models import Prefetch, Q
from django.core.exceptions import ValidationError

# Third party imports
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response

# Module imports
from plane.app.views.base import BaseViewSet, BaseAPIView
from plane.app.serializers import (
    OrganogramPositionSerializer,
    OrganogramPositionLiteSerializer,
    UserPositionSerializer,
    OrganogramPositionTreeSerializer,
    WorkspaceOrganogramSerializer,
    OrganogramTreeRootSerializer,
)
from plane.app.permissions import WorkspaceEntityPermission, allow_permission, ROLE
from plane.db.models import (
    OrganogramPosition,
    UserPosition,
    WorkspaceOrganogram,
    User,
    Workspace,
)


class OrganogramPositionViewSet(BaseViewSet):
    """
    ViewSet for managing organogram positions within a workspace.
    """
    serializer_class = OrganogramPositionSerializer
    model = OrganogramPosition
    permission_classes = [WorkspaceEntityPermission]

    search_fields = ["name", "description"]
    filterset_fields = ["authority", "parent"]

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                deleted_at__isnull=True,
            )
            .select_related("workspace", "parent", "created_by", "updated_by")
            .prefetch_related(
                Prefetch(
                    "user_assignments",
                    queryset=UserPosition.objects.filter(deleted_at__isnull=True).select_related("user", "assigned_by"),
                )
            )
            .order_by("name")
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug):
        """List all positions in the workspace"""
        positions = self.get_queryset()
        serializer = OrganogramPositionSerializer(positions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug):
        """Create a new position"""
        workspace = Workspace.objects.get(slug=slug)

        serializer = OrganogramPositionSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace=workspace)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        """Get details of a specific position"""
        position = self.get_queryset().get(pk=pk)
        serializer = OrganogramPositionSerializer(position)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        """Update a position"""
        position = self.get_queryset().get(pk=pk)

        serializer = OrganogramPositionSerializer(
            position, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        """Soft delete a position"""
        position = self.get_queryset().get(pk=pk)

        # Check if position has children
        if position.children.filter(deleted_at__isnull=True).exists():
            return Response(
                {"error": "Cannot delete position with child positions. Please delete or reassign children first."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Soft delete
        position.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    @action(detail=False, methods=["get"], url_path="tree")
    def tree(self, request, slug):
        """
        Get hierarchical tree view of positions.
        Returns only root positions (positions without parent) with nested children.
        """
        root_positions = (
            self.get_queryset()
            .filter(parent__isnull=True)
            .prefetch_related("children")
        )

        serializer = OrganogramTreeRootSerializer(root_positions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    @action(detail=True, methods=["post"], url_path="assign-user")
    def assign_user(self, request, slug, pk):
        """
        Assign a user to a position.
        Request body: {"user_id": "uuid"}
        """
        position = self.get_queryset().get(pk=pk)
        user_id = request.data.get("user_id")

        if not user_id:
            return Response(
                {"error": "user_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Check if user is already assigned to this position
        existing = UserPosition.objects.filter(
            user=user, position=position, deleted_at__isnull=True
        ).first()

        if existing:
            return Response(
                {"error": "User is already assigned to this position"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # Validate Head/LineManager constraint
        if position.authority in ["head", "line_manager"]:
            existing_assignments = UserPosition.objects.filter(
                position=position, deleted_at__isnull=True
            )
            if existing_assignments.exists():
                return Response(
                    {
                        "error": f"Position '{position.name}' with authority '{position.get_authority_display()}' can only have one user assigned."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Create assignment
        user_position = UserPosition.objects.create(
            user=user,
            position=position,
            assigned_by=request.user,
        )

        serializer = UserPositionSerializer(user_position)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    @action(detail=True, methods=["post"], url_path="unassign-user")
    def unassign_user(self, request, slug, pk):
        """
        Remove a user from a position.
        Request body: {"user_id": "uuid"}
        """
        position = self.get_queryset().get(pk=pk)
        user_id = request.data.get("user_id")

        if not user_id:
            return Response(
                {"error": "user_id is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            user_position = UserPosition.objects.get(
                user_id=user_id,
                position=position,
                deleted_at__isnull=True,
            )
        except UserPosition.DoesNotExist:
            return Response(
                {"error": "User is not assigned to this position"},
                status=status.HTTP_404_NOT_FOUND,
            )

        # Soft delete the assignment
        user_position.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    @action(detail=True, methods=["get"], url_path="children")
    def get_children(self, request, slug, pk):
        """
        Get all child positions recursively.
        Query params: include_self=true/false (default: false)
        """
        position = self.get_queryset().get(pk=pk)
        include_self = request.query_params.get("include_self", "false").lower() == "true"

        children = position.get_all_children(include_self=include_self)
        serializer = OrganogramPositionLiteSerializer(children, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    @action(detail=True, methods=["get"], url_path="reporting-chain")
    def reporting_chain(self, request, slug, pk):
        """
        Get the reporting chain from this position to the top.
        """
        position = self.get_queryset().get(pk=pk)
        chain = position.get_reporting_chain()
        serializer = OrganogramPositionLiteSerializer(chain, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)


class WorkspaceOrganogramViewSet(BaseViewSet):
    """
    ViewSet for managing workspace organograms (multiple organogram support).
    """
    serializer_class = WorkspaceOrganogramSerializer
    model = WorkspaceOrganogram
    permission_classes = [WorkspaceEntityPermission]

    search_fields = ["name", "description"]
    filterset_fields = ["is_active"]

    def get_queryset(self):
        return (
            super()
            .get_queryset()
            .filter(
                workspace__slug=self.kwargs.get("slug"),
                deleted_at__isnull=True,
            )
            .select_related("workspace", "created_by", "updated_by")
            .prefetch_related("positions")
            .order_by("-created_at")
        )

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def list(self, request, slug):
        """List all organograms in the workspace"""
        organograms = self.get_queryset()
        serializer = WorkspaceOrganogramSerializer(organograms, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug):
        """Create a new organogram"""
        workspace = Workspace.objects.get(slug=slug)

        serializer = WorkspaceOrganogramSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(workspace=workspace)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER, ROLE.GUEST], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        """Get details of a specific organogram"""
        organogram = self.get_queryset().get(pk=pk)
        serializer = WorkspaceOrganogramSerializer(organogram)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        """Update an organogram"""
        organogram = self.get_queryset().get(pk=pk)

        serializer = WorkspaceOrganogramSerializer(
            organogram, data=request.data, partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        """Soft delete an organogram"""
        organogram = self.get_queryset().get(pk=pk)
        organogram.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    @action(detail=True, methods=["post"], url_path="activate")
    def activate(self, request, slug, pk):
        """
        Set this organogram as the active one for the workspace.
        Automatically deactivates other organograms.
        """
        organogram = self.get_queryset().get(pk=pk)
        organogram.is_active = True
        organogram.save()

        serializer = WorkspaceOrganogramSerializer(organogram)
        return Response(serializer.data, status=status.HTTP_200_OK)
