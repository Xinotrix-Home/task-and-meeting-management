# Third party imports
from rest_framework import serializers

# Module imports
from .base import BaseSerializer, DynamicBaseSerializer
from .user import UserLiteSerializer
from .workspace import WorkspaceLiteSerializer

from plane.db.models import (
    OrganogramPosition,
    UserPosition,
    WorkspaceOrganogram,
    User,
)


class OrganogramPositionLiteSerializer(BaseSerializer):
    """Lightweight serializer for position references"""

    class Meta:
        model = OrganogramPosition
        fields = [
            "id",
            "name",
            "authority",
        ]
        read_only_fields = fields


class UserPositionSerializer(DynamicBaseSerializer):
    """Serializer for user-position assignments"""
    user = UserLiteSerializer(read_only=True)
    user_id = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(),
        source="user",
        write_only=True
    )
    position = OrganogramPositionLiteSerializer(read_only=True)
    assigned_by_detail = UserLiteSerializer(source="assigned_by", read_only=True)

    class Meta:
        model = UserPosition
        fields = [
            "id",
            "user",
            "user_id",
            "position",
            "assigned_at",
            "assigned_by",
            "assigned_by_detail",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "assigned_at",
            "created_at",
            "updated_at",
        ]


class OrganogramPositionSerializer(DynamicBaseSerializer):
    """Main serializer for organogram positions"""
    parent_detail = OrganogramPositionLiteSerializer(source="parent", read_only=True)
    workspace_detail = WorkspaceLiteSerializer(source="workspace", read_only=True)
    assigned_users = serializers.SerializerMethodField()
    user_assignments = UserPositionSerializer(many=True, read_only=True)
    children_count = serializers.SerializerMethodField()

    def get_assigned_users(self, obj):
        user_assignments = obj.user_assignments.filter(deleted_at__isnull=True).select_related('user')
        return UserLiteSerializer([ua.user for ua in user_assignments], many=True).data

    def get_children_count(self, obj):
        return obj.children.filter(deleted_at__isnull=True).count()

    class Meta:
        model = OrganogramPosition
        fields = [
            "id",
            "name",
            "workspace",
            "workspace_detail",
            "parent",
            "parent_detail",
            "authority",
            "description",
            "user_assignments",
            "assigned_users",
            "children_count",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "workspace_detail",
            "parent_detail",
            "assigned_users",
            "children_count",
        ]

    def validate(self, attrs):
        # Validate parent is in the same workspace
        if attrs.get("parent") and attrs.get("workspace"):
            if attrs["parent"].workspace != attrs["workspace"]:
                raise serializers.ValidationError(
                    {"parent": "Parent position must be in the same workspace"}
                )

        # Validate parent doesn't create circular reference
        parent = attrs.get("parent")
        if parent:
            current = parent
            visited = set()
            if self.instance:
                visited.add(self.instance.id)

            while current:
                if current.id in visited:
                    raise serializers.ValidationError(
                        {"parent": "Circular parent-child relationship detected"}
                    )
                visited.add(current.id)
                current = current.parent

        return attrs


class OrganogramPositionTreeSerializer(BaseSerializer):
    """Hierarchical tree serializer for positions"""
    parent_detail = OrganogramPositionLiteSerializer(source="parent", read_only=True)
    children = serializers.SerializerMethodField()
    user_assignments = UserPositionSerializer(many=True, read_only=True)
    assigned_users = serializers.SerializerMethodField()

    def get_assigned_users(self, obj):
        user_assignments = obj.user_assignments.filter(deleted_at__isnull=True).select_related('user')
        return UserLiteSerializer([ua.user for ua in user_assignments], many=True).data

    def get_children(self, obj):
        children = obj.children.filter(deleted_at__isnull=True)
        return OrganogramPositionTreeSerializer(children, many=True, context=self.context).data

    class Meta:
        model = OrganogramPosition
        fields = [
            "id",
            "name",
            "parent",
            "parent_detail",
            "authority",
            "description",
            "user_assignments",
            "assigned_users",
            "children",
        ]
        read_only_fields = fields


class WorkspaceOrganogramSerializer(DynamicBaseSerializer):
    """Serializer for workspace organogram"""
    workspace_detail = WorkspaceLiteSerializer(source="workspace", read_only=True)
    positions_detail = OrganogramPositionLiteSerializer(source="positions", many=True, read_only=True)
    positions_count = serializers.SerializerMethodField()

    def get_positions_count(self, obj):
        return obj.positions.filter(deleted_at__isnull=True).count()

    class Meta:
        model = WorkspaceOrganogram
        fields = [
            "id",
            "workspace",
            "workspace_detail",
            "name",
            "description",
            "is_active",
            "positions",
            "positions_detail",
            "positions_count",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
            "created_by",
            "updated_by",
            "workspace_detail",
            "positions_detail",
            "positions_count",
        ]


class OrganogramTreeRootSerializer(BaseSerializer):
    """Serializer for root-level positions (positions without parent)"""
    children = serializers.SerializerMethodField()
    user_assignments = UserPositionSerializer(many=True, read_only=True)

    def get_children(self, obj):
        children = obj.children.filter(deleted_at__isnull=True)
        return OrganogramPositionTreeSerializer(children, many=True, context=self.context).data

    class Meta:
        model = OrganogramPosition
        fields = [
            "id",
            "name",
            "authority",
            "description",
            "user_assignments",
            "children",
        ]
        read_only_fields = fields
