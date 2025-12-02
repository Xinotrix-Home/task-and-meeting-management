# Django imports
from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError

# Module imports
from .base import BaseModel
from .workspace import Workspace


AUTHORITY_CHOICES = (
    ("none", "None"),
    ("head", "Head"),
    ("line_manager", "Line Manager"),
)


class OrganogramPosition(BaseModel):
    """
    Model representing a position in the organizational hierarchy.
    """
    name = models.CharField(max_length=255, verbose_name="Position Name")
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="organogram_positions"
    )
    parent = models.ForeignKey(
        "self",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="children"
    )
    authority = models.CharField(
        max_length=20,
        choices=AUTHORITY_CHOICES,
        default="none",
        verbose_name="Authority Level"
    )
    description = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ["name", "workspace", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=models.Q(deleted_at__isnull=True),
                name="organogram_position_unique_name_workspace_when_deleted_at_null",
            )
        ]
        verbose_name = "Organogram Position"
        verbose_name_plural = "Organogram Positions"
        db_table = "organogram_positions"
        ordering = ("name",)

    def __str__(self):
        return f"{self.name} <{self.workspace.name}>"

    def clean(self):
        """
        Validate that:
        1. Position doesn't create circular parent-child relationships
        2. Head/LineManager positions have at most one user
        """
        # Check for circular reference
        if self.parent:
            current = self.parent
            visited = {self.id}
            while current:
                if current.id in visited:
                    raise ValidationError("Circular parent-child relationship detected")
                visited.add(current.id)
                current = current.parent

        super().clean()

    def get_all_children(self, include_self=False):
        """
        Recursively get all child positions.
        """
        children = []
        if include_self:
            children.append(self)

        for child in self.children.filter(deleted_at__isnull=True):
            children.append(child)
            children.extend(child.get_all_children(include_self=False))

        return children

    def get_reporting_chain(self):
        """
        Get the reporting chain from this position to the top.
        """
        chain = [self]
        current = self.parent
        while current:
            chain.append(current)
            current = current.parent
        return chain


class UserPosition(BaseModel):
    """
    Many-to-many through table for User-Position assignment.
    """
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="position_assignments"
    )
    position = models.ForeignKey(
        OrganogramPosition,
        on_delete=models.CASCADE,
        related_name="user_assignments"
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    assigned_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="position_assignments_made"
    )

    class Meta:
        unique_together = ["user", "position", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["user", "position"],
                condition=models.Q(deleted_at__isnull=True),
                name="user_position_unique_user_position_when_deleted_at_null",
            )
        ]
        verbose_name = "User Position"
        verbose_name_plural = "User Positions"
        db_table = "user_positions"
        ordering = ("-assigned_at",)

    def __str__(self):
        return f"{self.user.email} - {self.position.name}"

    def clean(self):
        """
        Validate that Head/LineManager positions can only have one user.
        """
        if self.position.authority in ["head", "line_manager"]:
            # Check if there's already a user assigned to this position
            existing = UserPosition.objects.filter(
                position=self.position,
                deleted_at__isnull=True
            ).exclude(id=self.id)

            if existing.exists():
                raise ValidationError(
                    f"Position '{self.position.name}' with authority "
                    f"'{self.position.get_authority_display()}' can only have one user assigned."
                )

        super().clean()


class WorkspaceOrganogram(BaseModel):
    """
    Model to support multiple organograms per workspace.
    """
    workspace = models.ForeignKey(
        Workspace,
        on_delete=models.CASCADE,
        related_name="organograms"
    )
    name = models.CharField(max_length=255, verbose_name="Organogram Name")
    description = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=False)
    positions = models.ManyToManyField(
        OrganogramPosition,
        related_name="organograms",
        blank=True
    )

    class Meta:
        unique_together = ["name", "workspace", "deleted_at"]
        constraints = [
            models.UniqueConstraint(
                fields=["name", "workspace"],
                condition=models.Q(deleted_at__isnull=True),
                name="workspace_organogram_unique_name_workspace_when_deleted_at_null",
            )
        ]
        verbose_name = "Workspace Organogram"
        verbose_name_plural = "Workspace Organograms"
        db_table = "workspace_organograms"
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.name} <{self.workspace.name}>"

    def save(self, *args, **kwargs):
        """
        If this organogram is set as active, deactivate others in the workspace.
        """
        if self.is_active:
            WorkspaceOrganogram.objects.filter(
                workspace=self.workspace,
                deleted_at__isnull=True
            ).exclude(id=self.id).update(is_active=False)

        super().save(*args, **kwargs)
