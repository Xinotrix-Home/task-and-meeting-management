"use client";

import { useMemo, useState } from "react";
import { observer } from "mobx-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { ArrowRightToLineIcon, PencilIcon, ViewIcon } from "lucide-react";
import { IMeeting } from "@plane/types";
import { Button, ContentWrapper } from "@plane/ui";
import { LogoSpinner } from "@/components/common";
import { useMeeting } from "@/hooks/store/use-meeting";
import { IMeetingGroup, sampleMeetings } from "../data/meetings";
import { useMember } from "@/hooks/store";
// edit icon

function groupMeetingsByLabel(meetings: IMeeting[]): IMeetingGroup[] {
  const groupsMap = new Map<string, IMeeting[]>();

  meetings.forEach((meeting) => {
    const label = (meeting as any).status || "Upcoming";

    if (!groupsMap.has(label)) {
      groupsMap.set(label, []);
    }
    groupsMap.get(label)!.push(meeting);
  });

  return Array.from(groupsMap.entries()).map(([label, meetings]) => ({
    label,
    meetings,
  }));
}

const MeetingCardList = observer(() => {
  const now = new Date();
  const router = useRouter();
  const { workspaceSlug, projectId } = useParams();
  const meetingStore = useMeeting();
  const [searchQuery, setSearchQuery] = useState("");
  const [showAllMeetingsLabel, setShowAllMeetingsLabel] = useState<string | null>(null);

  const {
    project: { projectMemberIds, getProjectMemberDetails },
  } = useMember();

  // fetch workspace data
  useSWR(
    workspaceSlug ? `WORKSPACE_MEETINGS_${workspaceSlug}` : null,
    workspaceSlug ? () => meetingStore.fetchMeetings(workspaceSlug.toString()) : null,
    { revalidateIfStale: false, revalidateOnFocus: false }
  );

  if (meetingStore.isLoading)
    return (
      <div className="relative flex h-screen w-full items-center justify-center">
        <LogoSpinner />
      </div>
    );
  if (meetingStore.error) return <div>{meetingStore.error.message}</div>;

  const groupedMeetings = groupMeetingsByLabel(meetingStore.meetings);

  const handleVIewAllMeetings = (meetingLabel: string) => {
    setShowAllMeetingsLabel(meetingLabel);
  };

  const renderMeetingsList = (meetingGroups: IMeetingGroup[]) => (
    <div className="grid grid-cols-1">
      {meetingGroups.map((meetingGroup) => {
        let meetingsData;
        if (showAllMeetingsLabel) {
          meetingsData = showAllMeetingsLabel === meetingGroup?.label ? meetingGroup : null;
        } else {
          meetingsData = meetingGroup;
        }
        if (!meetingsData?.label) return;
        return (
          <div key={meetingsData?.label} className="mb-6">
            <div className="flex justify-between items-center my-2">
              <h2 className="text-xl font-semibold mb-4">
                {meetingsData?.label
                  ?.toLowerCase()
                  .split(" ")
                  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(" ")}{" "}
                Meetings
              </h2>
              {meetingsData?.meetings?.length > 5 && showAllMeetingsLabel && (
                <Button className="btn btn-secondary text-xs" onClick={() => handleVIewAllMeetings("")}>
                  <span>Back to meetings</span>
                </Button>
              )}
            </div>
            <div className="bg-gray-800 text-white rounded-lg shadow divide-y divide-gray-500">
              {/* Header Row */}
              <div className="grid grid-cols-7 gap-5 text-sm font-bold  tracking-wide text-gray-300 bg-gray-700 px-4 py-3 rounded-t-lg">
                <div>Date 📅</div>
                <div>Start Time ⏰</div>
                <div>Subject 📝</div>
                <div>Description 🧾</div>
                <div>Chairperson 👥</div>
                <div>Host 👥</div>
                {/* <div>Participants 👥</div> */}
                <div className="text-center">Actions ⚙️</div>
              </div>
              {/* Meeting Rows */}
              {meetingGroup?.meetings?.slice(0, 5)?.map((meeting) => {
                const isLive = isMeetingActive(meeting?.start_time, meeting?.end_time);
                return (
                  <div key={meeting?.id} className="grid grid-cols-7 items-center justify-center gap-5 px-4 py-3">
                    <div className="text-sm">{formatDateTime(meeting?.start_time, "date")}</div>
                    <div className="text-sm ">{formatDateTime(meeting?.start_time, "time")}</div>
                    <div className="text-sm">{meeting?.subject}</div>
                    <div className="text-sm">{meeting?.description?.slice(0, 20)}...</div>
                    <div className="text-sm">{meeting?.chairperson?.display_name}</div>
                    <div className="text-sm">{meeting?.host?.display_name}</div>
                    {/* <div className="text-sm">{meeting?.participants?.map((p) => p?.display_name).join(", ")}</div> */}
                    <div className="flex gap-4 justify-center p-1">
                      {/* {!(meeting?.id === "Me") && !(meetingGroup?.label === "Completed") && ( */}
                      {/* Meeting Minute */}
                      {isLive && (
                        <div className="relative group">
                          <Link
                            href={`/${workspaceSlug?.toString()}/meetings/meeting-minute/${meeting?.id}`}
                            className="rounded hover:bg-gray-700"
                          >
                            <ArrowRightToLineIcon size={18} />
                          </Link>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-5">
                            Meeting minutes
                          </div>
                        </div>
                      )}

                      {/* Edit Meeting */}
                      {!(meetingGroup?.label === "Completed") && (
                        <div className="relative group">
                          <Link
                            href={`/${workspaceSlug?.toString()}/meetings/update-meeting/${meeting?.id}`}
                            className=" rounded hover:bg-gray-700"
                          >
                            <PencilIcon size={18} />
                          </Link>
                          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                            Edit meeting
                          </div>
                        </div>
                      )}
                      {/* View Details */}
                      <div className="relative group">
                        <Link
                          href={`/${workspaceSlug?.toString()}/meetings/meeting-details/${meeting?.id}`}
                          className="rounded hover:bg-gray-700"
                        >
                          <ViewIcon size={18} />
                        </Link>
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10">
                          View details
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {meetingsData?.meetings?.length > 5 && !showAllMeetingsLabel && (
              <div className="flex w-full justify-end mt-2">
                <Button className="btn btn-primary text-xs" onClick={() => handleVIewAllMeetings(meetingGroup?.label)}>
                  <span>View all</span>
                </Button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  return (
    <ContentWrapper>
      <div className="space-y-12">
        <div>
          {groupedMeetings?.length > 0 ? (
            renderMeetingsList(groupedMeetings)
          ) : (
            <main className="grid min-h-full place-items-center px-6 py-24 sm:py-32 lg:px-8">
              <div className="text-center">
                <h3 className="mt-4 text-xl font-semibold tracking-tight text-balance">No meetings found</h3>
                <div className="mt-4 flex items-center justify-center gap-x-6">
                  <Button
                    className="btn btn-primary text-xs"
                    onClick={() => router.push(`/${workspaceSlug?.toString()}/`)}
                  >
                    Go back home
                  </Button>
                </div>
              </div>
            </main>
          )}
        </div>
      </div>
    </ContentWrapper>
  );
});

export default MeetingCardList;

export const formatDate = (isoDate: string) =>
  new Intl.DateTimeFormat("en-US", {
    dateStyle: "long",
  }).format(new Date(isoDate));

export const formatTime = (time: string) => {
  const [hours, minutes] = time.split(":");
  const date = new Date();
  date.setHours(+hours, +minutes);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "numeric",
  }).format(date);
};

export function formatDateTime(dateString: string, type: "date" | "time"): string {
  // Strip 'Z' to treat as local time if needed
  const localDate = new Date(dateString.replace(/Z$/, ""));

  if (type === "date") {
    return localDate.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }); // Example: "30 June 2025"
  }

  if (type === "time") {
    return localDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }); // Example: "9:00 AM"
  }

  return "";
}

export const isMeetingActive = (start_time: string, end_time: string): boolean => {
  const now = new Date();
  const parseLocal = (timeStr: string) => {
    // Remove 'Z' and treat as local
    return new Date(timeStr.replace(/Z$/, ""));
  };
  const start = parseLocal(start_time);
  const end = parseLocal(end_time);
  // console.log("Now     :", now.toString());
  // console.log("Start   :", start.toString());
  // console.log("End     :", end.toString())
  return now >= start && now <= end;
};

// const active = isMeetingActive("2025-07-18T13:45:00Z", "2025-07-18T16:45:00Z");
// if (active) {
//   console.log("Meeting is active now");
// } else {
//   console.log("Meeting is not active");
// }
