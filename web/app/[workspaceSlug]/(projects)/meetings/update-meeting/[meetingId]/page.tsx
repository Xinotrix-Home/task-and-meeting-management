"use client";

import { useParams } from "next/navigation";
import MeetingRequestForm from "../../_components/MeetingRequestForm";
import MeetingUpdateForm from "../../_components/MeetingUpdateForm";
import MeetingForm from "../../_components/MeetingForm";

export default function CreateMeetingPage() {
  const { meetingId } = useParams();
  return (
    <>
      <div className="mt-6">
        <MeetingForm mode="update" id={meetingId as string} />
      </div>
    </>
  );
}
