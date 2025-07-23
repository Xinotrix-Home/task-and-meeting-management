"use client";

import MeetingForm from "../_components/MeetingForm";
import MeetingRequestForm from "../_components/MeetingRequestForm";

export default function CreateMeetingPage() {
  return (
    <>
      <div className="mt-6">
        <MeetingForm mode="create" />
      </div>
    </>
  );
}
