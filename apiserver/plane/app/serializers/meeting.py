# Django imports
from django.conf import settings

# Third party imports
from rest_framework import serializers

# Local imports
from plane.db.models import Meeting, MeetingParticipant, MeetingAgenda, AgendaAssignee, User, Issue
from plane.app.serializers.user import UserLiteSerializer
from plane.app.serializers.issue import IssueAssigneeDetailSerializer


class AgendaAssigneeSerializer(serializers.ModelSerializer):
    user = UserLiteSerializer(read_only=True)

    class Meta:
        model = AgendaAssignee
        fields = ("id", "user")


class IssueCreateSerializerFromAgenda(serializers.Serializer):
    name = serializers.CharField()
    description = serializers.CharField(required=False, allow_blank=True)
    priority = serializers.CharField()
    target_date = serializers.DateTimeField()
    assignees = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    )


class MeetingAgendaSerializer(serializers.ModelSerializer):
    assignees = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()),
        write_only=True,
        required=False,
    )
    issues = IssueCreateSerializerFromAgenda(many=True, write_only=True, required=False)

    class Meta:
        model = MeetingAgenda
        fields = ("id", "title", "duration_minutes", "assignees", "issues")

    def create(self, validated_data):
        assignees = validated_data.pop("assignees", [])
        issues = validated_data.pop("issues", [])

        agenda = MeetingAgenda.objects.create(**validated_data)

        AgendaAssignee.objects.bulk_create([
            AgendaAssignee(agenda=agenda, user=user) for user in assignees
        ])

        for issue in issues:
            assignee_ids = issue.pop("assignees", [])
            new_issue = Issue.objects.create(agenda=agenda, workspace=self.context.get("workspace"), **issue)
            new_issue.assignees.set(assignee_ids)

        return agenda

    def update(self, instance, validated_data):
        assignees = validated_data.pop("assignees", [])
        issues = validated_data.pop("issues", [])

        instance.title = validated_data.get("title", instance.title)
        instance.duration_minutes = validated_data.get("duration_minutes", instance.duration_minutes)
        instance.save()

        instance.assignees.all().delete()
        AgendaAssignee.objects.bulk_create([
            AgendaAssignee(agenda=instance, user=user) for user in assignees
        ])

        instance.issue_agenda.all().delete()
        for issue in issues:
            assignee_ids = issue.pop("assignees", [])
            new_issue = Issue.objects.create(agenda=instance, workspace=self.context.get("workspace"), **issue)
            new_issue.assignees.set(assignee_ids)

        return instance



class MeetingAgendaListSerializer(serializers.ModelSerializer):
    assignees = AgendaAssigneeSerializer(many=True)
    issues = serializers.SerializerMethodField()

    class Meta:
        model = MeetingAgenda
        fields = ("id", "title", "duration_minutes", "assignees", "issues")

    def get_issues(self, obj):
        issues = Issue.objects.filter(agenda=obj)
        return IssueAssigneeDetailSerializer(issues, many=True).data






class MeetingParticipantSerializer(serializers.ModelSerializer):
    user = UserLiteSerializer(read_only=True)

    class Meta:
        model = MeetingParticipant
        fields = ("id", "user", "has_accepted", "has_attended")


class MeetingSerializer(serializers.ModelSerializer):

    class Meta:
        model = Meeting
        fields = (
            "id", "subject", "description", "start_time", "end_time",
            "host", "chairperson", "status"
        )

    def create(self, validated_data):
        meeting = Meeting.objects.create(**validated_data)

        return meeting

    def update(self, instance, validated_data):
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        return instance

class MeetingListSerializer(serializers.ModelSerializer):
    host = UserLiteSerializer()
    chairperson = UserLiteSerializer()

    participants = MeetingParticipantSerializer(many=True)
    agendas = MeetingAgendaListSerializer(many=True)

    class Meta:
        model = Meeting
        fields = (
            "id", "subject", "description", "start_time", "end_time", 'status',
            "host", "chairperson",
            "participants", "agendas",
        )
