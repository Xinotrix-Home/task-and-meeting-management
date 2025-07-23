// hooks/useMeeting.ts
import { useContext } from "react";
import { StoreContext } from "@/lib/store-context";
import { MeetingStore } from "@/store/meeting/meeting.store";

export const useMeeting = (): MeetingStore => {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error("useMeeting must be used within a StoreProvider");
  }
  // Ensure the returned object is of type MeetingStore and includes meetingService
  return context.meeting as MeetingStore;
};
