# Plane permissions & views
from plane.app.permissions import ROLE, allow_permission
from plane.app.views.base import BaseViewSet
from rest_framework.response import Response
from rest_framework import status

# Meeting module imports
from plane.db.models import (
    Meeting, 
)
from plane.app.serializers import MeetingSerializer


class WorkspaceMeetingViewSet(BaseViewSet):
    serializer_class = MeetingSerializer
    model = Meeting

    def get_queryset(self):
        return self.model.objects.filter(
            workspace__slug=self.kwargs.get("slug")
        ).select_related("workspace", "host", "chairperson").prefetch_related("participants")

    @allow_permission(
        allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE"
    )
    def list(self, request, slug):
        queryset = self.get_queryset()
        serializer = self.serializer_class(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug):
        serializer = self.serializer_class(data=request.data, context={"request": request})
        if serializer.is_valid():
            serializer.save(workspace=request.workspace, created_by=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        instance = self.get_object()
        serializer = self.serializer_class(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        instance = self.get_object()
        serializer = self.serializer_class(instance, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
