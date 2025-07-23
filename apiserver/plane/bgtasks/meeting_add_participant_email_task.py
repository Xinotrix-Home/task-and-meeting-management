# Standard Library
import logging
from datetime import datetime, timedelta
from io import StringIO
import yagmail

# Django & Third Party
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from celery import shared_task

# Local Apps
from plane.db.models.meeting import MeetingParticipant
from plane.db.models import User
from plane.utils.exception_logger import log_exception

logger = logging.getLogger("plane.worker")

# Constants (Should be moved to settings.py or .env in production)
UID = "1234567890@yourdomain.com"


def generate_ics(START_TIME: datetime, END_TIME: datetime, TO_EMAIL: str, SENDER_EMAIL: str, MEETING_SUBJECT:str, MEETING_BODY:str, MEETING_LOCATION:str) -> str:
    start = START_TIME.strftime("%Y%m%dT%H%M%SZ")
    end = END_TIME.strftime("%Y%m%dT%H%M%SZ")
    ics_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Your Company//Meeting Invite//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
DTSTART:{start}
DTEND:{end}
DTSTAMP:{datetime.utcnow().strftime("%Y%m%dT%H%M%SZ")}
ORGANIZER;CN=Your Name:mailto:{SENDER_EMAIL}
UID:{UID}
ATTENDEE;CN=Participant;RSVP=TRUE:mailto:{TO_EMAIL}
DESCRIPTION:{MEETING_BODY}
LOCATION:{MEETING_LOCATION}
SEQUENCE:0
STATUS:CONFIRMED
SUMMARY:{MEETING_SUBJECT}
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR"""
    return ics_content


@shared_task
def meeting_add_participant_email(current_site: str, meeting_participant_id: int, invitor_id: int):
    """
    Sends a meeting invitation email with calendar (.ics) attachment to a meeting participant.
    """
    try:
        invitor = User.objects.get(pk=invitor_id)
        meeting_participant = MeetingParticipant.objects.select_related('meeting', 'user').get(pk=meeting_participant_id)
        meeting = meeting_participant.meeting
        participant_user = meeting_participant.user

        # Build context
        context = {
            "meeting_name": meeting.subject,
            "workspace_name": meeting.workspace.name,
            "email": participant_user.email,
            "inviter_first_name": invitor.first_name,
            "meeting_url": f"{current_site}/{meeting.workspace.slug}/meetings/{meeting.id}/",
        }

        # Render email templates
        # html_content = render_to_string("emails/meeting_invite.html", context)
        # text_content = strip_tags(html_content)

        # Email meta
        recipient = participant_user.email
        # recipient = "aljaber084@gmail.com"
        SENDER_EMAIL = "mailnishad02@gmail.com"
        APP_PASSWORD = "hgej bugg thdo xohj"
        MEETING_SUBJECT = meeting_participant.meeting.subject
        MEETING_BODY = f"Hello {participant_user.first_name}, You are invited to a meeting. Please see details below and add to your calendar."
        MEETING_LOCATION = "Zoom / Office"

        start_time = meeting.start_time if hasattr(meeting, "start_time") else datetime.now()
        end_time = start_time + timedelta(hours=1)

        # Generate ICS content
        ics = generate_ics(start_time, end_time, recipient, SENDER_EMAIL, MEETING_SUBJECT, MEETING_BODY, MEETING_LOCATION)

        # Build email with calendar invite as attachment
        yag = yagmail.SMTP(SENDER_EMAIL, APP_PASSWORD)
        email_subject = MEETING_SUBJECT
        email_body = MEETING_BODY

        # Write ICS file temporarily
        with open("invite.ics", "w") as f:
            f.write(ics)

        # Send email with .ics file attached
        yag.send(
            to=recipient,
            subject=email_subject,
            contents=email_body,
            attachments="invite.ics"
        )

        logger.info(f"Meeting invite sent successfully to {recipient}")
    except Exception as e:
        logger.error(f"Error sending meeting invite: {str(e)}")
        log_exception(e)