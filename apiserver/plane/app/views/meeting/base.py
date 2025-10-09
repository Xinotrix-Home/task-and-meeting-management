# Plane permissions & views
from plane.app.permissions import ROLE, allow_permission
from plane.app.serializers.meeting import MeetingAgendaSerializer
from plane.app.views.base import BaseViewSet
from rest_framework.response import Response
from rest_framework import status
from collections import defaultdict
from django.db import transaction

# Meeting module imports
from plane.bgtasks.meeting_add_participant_email_task import meeting_add_participant_email
from plane.db.models import (
    Meeting,
    Workspace,
)
from plane.app.serializers import MeetingSerializer, MeetingListSerializer
from plane.db.models.issue import Issue, IssueAssignee
from plane.db.models.meeting import AgendaAssignee, MeetingAgenda, MeetingParticipant
from plane.db.models.project import Project
from plane.utils.host import base_host


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

        # meeting_add_participant_email.delay()
        STATUS_LABELS = {
            "draft": "Draft",
            "upcoming": "Upcoming",
            "completed": "Completed",
            "live": "Live",
            "cancelled": "Cancelled",
        }
        queryset = self.get_queryset()

        grouped_meetings = defaultdict(list)

        for meeting in queryset:
            status_key = meeting.status.lower()
            grouped_meetings[status_key].append(meeting)

        response_data = []
        for key, meetings in grouped_meetings.items():
            serializer = MeetingListSerializer(meetings, many=True)
            response_data.append({
                "label": STATUS_LABELS.get(key, key.title()),
                "meetings": serializer.data,
            })

        return Response(response_data, status=status.HTTP_200_OK)

    @allow_permission(allowed_roles=[ROLE.ADMIN], level="WORKSPACE")
    def create(self, request, slug):
        with transaction.atomic():
            try:
                if not (workspace:=Workspace.objects.filter(slug=slug).first()):
                    return Response({"detail": "Workspace not found."}, status=status.HTTP_404_NOT_FOUND)

                participants_ids = request.data.pop("participants", [])
                agendas_data = request.data.pop("agendas", [])

                serializer = self.serializer_class(data=request.data, context={"request": request})
                if not serializer.is_valid():
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

                instance = serializer.save(workspace=workspace, created_by=request.user)

                # Bulk create participants
                MeetingParticipant.objects.bulk_create([
                    MeetingParticipant(meeting_id=instance.id, user_id=user_id) for user_id in participants_ids
                ])

                # Use serializer to create agendas
                for agenda_data in agendas_data:
                    assignees = agenda_data.pop("assignees", [])
                    issues = agenda_data.pop("issues", [])

                    # Create agenda properly
                    agenda = MeetingAgenda.objects.create(
                        meeting=instance,
                        **agenda_data
                    )
                    AgendaAssignee.objects.bulk_create([
                        AgendaAssignee(agenda=agenda, user_id=user_id) for user_id in assignees
                    ])

                if serializer.validated_data.get("status") == "submitted":
                    meeting_participants = MeetingParticipant.objects.filter(meeting_id=instance.id).values_list(
                        "user_id", flat=True)

                    [
                        meeting_add_participant_email(
                            base_host(request=request, is_app=True),
                            user_id,
                            request.user.id,
                        )
                        for user_id in meeting_participants
                    ]

                serializer = MeetingListSerializer(instance)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                print('Exception -->> ', e)
                # logger.exception(e)
            return Response({"detail": "Internal Server Error"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


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
            # instance.agendas.all().delete()
            MeetingAgenda.objects.filter(meeting=instance).delete()

            for agenda_data in agendas_data:
                ids = agenda_data.pop("id", [])
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
                    ids = issue.pop("id", [])
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
