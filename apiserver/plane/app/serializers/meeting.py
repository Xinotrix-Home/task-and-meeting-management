# Django imports
from django.conf import settings

# Third party imports
from rest_framework import serializers

# Local imports
from plane.db.models import Meeting, MeetingParticipant, MeetingAgenda, AgendaAssignee, User
from plane.app.serializers.user import UserLiteSerializer


class AgendaAssigneeSerializer(serializers.ModelSerializer):
    user = UserLiteSerializer(read_only=True)

    class Meta:
        model = AgendaAssignee
        fields = ("id", "user")


class MeetingAgendaSerializer(serializers.ModelSerializer):
    # assignees = AgendaAssigneeSerializer(many=True)
    assignees = serializers.ListField(
        child=serializers.PrimaryKeyRelatedField(queryset=User.objects.all()),
        write_only=True,
        required=False,
    )

    class Meta:
        model = MeetingAgenda
        fields = ("id", "title", "duration_minutes", "assignees")

    def create(self, validated_data):
        assignees_data = validated_data.pop("assignees", [])
        agenda = MeetingAgenda.objects.create(**validated_data)
        for assignee_data in assignees_data:
            AgendaAssignee.objects.create(agenda=agenda, **assignee_data)
        return agenda

    def update(self, instance, validated_data):
        assignees_data = validated_data.pop("assignees", [])
        instance.title = validated_data.get("title", instance.title)
        instance.duration_minutes = validated_data.get(
            "duration_minutes", 
            instance.duration_minutes
        )
        instance.save()

        if assignees_data:
            instance.assignees.all().delete()
            for assignee_data in assignees_data:
                AgendaAssignee.objects.create(agenda=instance, **assignee_data)

        return instance


class MeetingAgendaListSerializer(serializers.ModelSerializer):
    assignees = AgendaAssigneeSerializer(many=True)

    class Meta:
        model = MeetingAgenda
        fields = ("id", "title", "duration_minutes", "assignees")





class MeetingParticipantSerializer(serializers.ModelSerializer):
    user = UserLiteSerializer(read_only=True)

    class Meta:
        model = MeetingParticipant
        fields = ("id", "user", "has_accepted", "has_attended")


class MeetingSerializer(serializers.ModelSerializer):
    participants = serializers.ListField(
        child=serializers.UUIDField()
    )
    # agendas = serializers.ListField(
    #     child=serializers.UUIDField()
    # )
    agendas = MeetingAgendaSerializer(many=True)
    

    class Meta:
        model = Meeting
        fields = (
            "id", "subject", "description", "start_time", "end_time",
            "host", "chairperson",
            "participants", "agendas",
        )

    def create(self, validated_data):
        participants_ids = validated_data.pop("participants", [])
        print("participants_ids", participants_ids)
        agendas_data = validated_data.pop("agendas", [])
        print("agendas_data", agendas_data)
        meeting = Meeting.objects.create(**validated_data)

        for user_id in participants_ids:
            MeetingParticipant.objects.create(meeting=meeting, user_id=user_id)

        for adata in agendas_data:
            assignees = adata.pop("assignees", [])
            print("assignees", assignees)
            agenda = MeetingAgenda.objects.create(meeting=meeting, **adata)
            for assignee in assignees:
                AgendaAssignee.objects.create(agenda=agenda, user=assignee)

        return meeting

    def update(self, instance, validated_data):
        participants_ids = validated_data.pop("participants", [])
        print("participants_ids", participants_ids)
        agendas_data = validated_data.pop("agendas", [])

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if participants_ids:
            instance.participants.all().delete()
            for user_id in participants_ids:
                MeetingParticipant.objects.create(meeting=instance, user_id=user_id)

        if agendas_data:
            instance.agendas.all().delete()
            for adata in agendas_data:
                assignees = adata.pop("assignees", [])
                agenda = MeetingAgenda.objects.create(meeting=instance, **adata)
                for assignee in assignees:
                    AgendaAssignee.objects.create(agenda=agenda, user=assignee)

        return instance

class MeetingListSerializer(serializers.ModelSerializer):
    host = UserLiteSerializer()
    chairperson = UserLiteSerializer()

    participants = MeetingParticipantSerializer(many=True)
    agendas = MeetingAgendaListSerializer(many=True)

    class Meta:
        model = Meeting
        fields = (
            "id", "subject", "description", "start_time", "end_time",
            "host", "chairperson",
            "participants", "agendas",
        )
