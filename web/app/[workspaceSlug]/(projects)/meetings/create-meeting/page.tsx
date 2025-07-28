"use client";

import MeetingForm from "../_components/MeetingForm";

export default function CreateMeetingPage() {
  return (
    <>
      <div className="mt-6">
        <MeetingForm mode="create" />
      </div>
    </>
  );
}
