"use client";

import { useParams } from "next/navigation";
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
