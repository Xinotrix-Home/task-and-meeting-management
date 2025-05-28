# Python imports
from typing import Optional, Any

# Django imports
from django.db import models
from django.conf import settings

# Module imports
from plane.db.models import BaseModel


class Meeting(BaseModel):
    workspace = models.ForeignKey(
        "db.Workspace",
        on_delete=models.CASCADE,
        related_name="workspace_meetings"
    )
    subject = models.CharField(max_length=255)
    description = models.TextField(blank=True, null=True)
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()

    host = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="hosted_meetings"
    )
    chairperson = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name="chaired_meetings"
    )

    class Meta:
        db_table = "meetings"
        ordering = ("-created_at",)
        verbose_name = "Meeting"
        verbose_name_plural = "Meetings"

    def __str__(self):
        return f"{self.subject} ({self.start_time})"


class MeetingParticipant(BaseModel):
    meeting = models.ForeignKey(
        "meetings.Meeting",
        on_delete=models.CASCADE,
        related_name="participants"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="meeting_participation"
    )
    has_accepted = models.BooleanField(default=False)
    has_attended = models.BooleanField(default=False)

    class Meta:
        unique_together = ("meeting", "user", "deleted_at")
        db_table = "meeting_participants"
        ordering = ("-created_at",)
        verbose_name = "Meeting Participant"
        verbose_name_plural = "Meeting Participants"

    def __str__(self):
        return f"{self.user.email} in {self.meeting.subject}"


class MeetingAgenda(BaseModel):
    meeting = models.ForeignKey(
        "meetings.Meeting",
        on_delete=models.CASCADE,
        related_name="agendas"
    )
    title = models.CharField(max_length=255)
    duration_minutes = models.IntegerField(null=True, blank=True)

    class Meta:
        db_table = "meeting_agendas"
        ordering = ("-created_at",)
        verbose_name = "Meeting Agenda"
        verbose_name_plural = "Meeting Agendas"

    def __str__(self):
        return f"{self.title} ({self.meeting.subject})"


class AgendaAssignee(BaseModel):
    agenda = models.ForeignKey(
        "meetings.MeetingAgenda",
        on_delete=models.CASCADE,
        related_name="assignees"
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="assigned_agenda_items"
    )

    class Meta:
        unique_together = ("agenda", "user", "deleted_at")
        db_table = "agenda_assignees"
        ordering = ("-created_at",)
        verbose_name = "Agenda Assignee"
        verbose_name_plural = "Agenda Assignees"

    def __str__(self):
        return f"{self.user.email} assigned to {self.agenda.title}"
