# Plane permissions & views
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers.meeting import MeetingAgendaSerializer
from plane.app.views.base import BaseViewSet
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction

# Meeting module imports
from plane.db.models import (
    Meeting,
    Workspace,
)
from plane.app.serializers import MeetingSerializer, MeetingListSerializer
from plane.db.models.issue import Issue, IssueAssignee
from plane.db.models.meeting import AgendaAssignee, MeetingAgenda, MeetingParticipant
from plane.db.models.project import Project


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
        serializer = MeetingListSerializer(queryset, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug):
        with transaction.atomic():
            try:
                workspace = Workspace.objects.get(slug=slug)
            except Workspace.DoesNotExist:
                return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

            participants_ids = request.data.pop("participants", [])
            agendas_data = request.data.pop("agendas", [])

            serializer = self.serializer_class(data=request.data, context={"request": request})
            if serializer.is_valid():
                serializer.save(workspace=workspace, created_by=request.user)

                # Bulk create participants
                MeetingParticipant.objects.bulk_create([
                    MeetingParticipant(meeting_id=serializer.data.get("id", None), user_id=user_id) for user_id in participants_ids
                ])

                # Use serializer to create agendas
                for agenda_data in agendas_data:
                    assignees = agenda_data.pop("assignees", [])
                    issues = agenda_data.pop("issues", [])

                    print("agenda_data", agenda_data)
                    # MeetingAgendaSerializer().create({**agenda_data, "meeting_id": serializer.data.get("id", None), "workspace": workspace})
                    agenda = MeetingAgenda.objects.create(**agenda_data, meeting_id=serializer.data.get("id", None))

                    AgendaAssignee.objects.bulk_create([
                        AgendaAssignee(agenda=agenda, user_id=user) for user in assignees
                    ])

            instance = Meeting.objects.prefetch_related(
                "participants",
                "agendas__issue_agenda",  # prefetch issues
                "agendas__assignees"      # if needed
            ).select_related("host", "chairperson").get(id=serializer.instance.id)
            serializer = MeetingListSerializer(instance)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN, ROLE.MEMBER], level="WORKSPACE")
    def retrieve(self, request, slug, pk):
        instance = self.get_object()
        serializer = MeetingListSerializer(instance)
        return Response(serializer.data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def partial_update(self, request, slug, pk):
        instance = self.get_object()
        try:
            workspace = Workspace.objects.get(slug=slug)
        except Workspace.DoesNotExist:
            return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

        participants_ids = request.data.pop("participants", [])
        agendas_data = request.data.pop("agendas", [])

        serializer = self.serializer_class(instance, data=request.data, partial=True, context={"request": request})
        if serializer.is_valid():
            serializer.save(updated_by=request.user)

            # Refresh participants
            instance.participants.all().delete()
            MeetingParticipant.objects.bulk_create([
                MeetingParticipant(meeting=instance, user_id=user_id) for user_id in participants_ids
            ])

            # Delete related issues before deleting agendas
            from plane.db.models import Issue
            Issue.objects.filter(agenda__in=instance.agendas.all()).delete()

            # Then delete agendas
            instance.agendas.all().delete()

            for agenda_data in agendas_data:
                assignees = agenda_data.pop("assignees", [])
                issues = agenda_data.pop("issues", [])
                agenda = MeetingAgenda.objects.create(**agenda_data, meeting=instance)

                AgendaAssignee.objects.bulk_create([
                    AgendaAssignee(agenda=agenda, user_id=user) for user in assignees
                ])

                project = Project.objects.get_or_create(
                    workspace=workspace, identifier="DEFLT",
                    name=agenda_data.get("project_name", "Default")
                )[0]

                for issue in issues:
                    assignee_ids = issue.pop("assignees", [])
                    new_issue = Issue.objects.create(agenda=agenda, workspace=workspace, project=project, **issue)

                    IssueAssignee.objects.bulk_create([
                        IssueAssignee(issue=new_issue, assignee_id=user_id, workspace=workspace, project=project)
                        for user_id in assignee_ids
                    ])

            return Response(MeetingListSerializer(instance).data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def destroy(self, request, slug, pk):
        instance = self.get_object()
        instance.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
