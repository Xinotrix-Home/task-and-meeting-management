"use client";

import { useEffect, useState } from "react";
import { Eye, Plus, Trash2, X } from "lucide-react"; // You already use these
import { setToast, TOAST_TYPE } from "@plane/ui";
import { useMeeting } from "@/hooks/store/use-meeting";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import { IMeeting, IUser } from "@plane/types/src/meeting";
import { useMember } from "@/hooks/store";
import useSWR from "swr";
import { serializeMeetingForApi } from "@/services/meeting";
import { observer } from "mobx-react";

const MeetingUpdateForm = observer(() => {
  const { workspaceSlug, meetingId } = useParams();
  const { meetings } = useMeeting();
  const { t } = useTranslation();
  const router = useRouter();

  const meetingData = meetingId ? meetings?.find((m) => m.id === meetingId) : undefined;

  // console.log("data", meetingData);

  if (!meetingData?.id) {
    router.push(`/${workspaceSlug}/meetings`);
  }

  const {
    workspace: { fetchWorkspaceMembers, fetchWorkspaceMemberInvitations },
  } = useMember();

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-900 text-white rounded-2xl shadow-xl space-y-6">
      <h2 className="text-2xl font-bold mb-4">Meeting Details</h2>

      <div>
        <label className="block mb-1 font-medium">Meeting Subject</label>
        <p className="bg-gray-800 px-4 py-2 rounded-lg">{meetingData?.subject}</p>
      </div>

      <div>
        <label className="block mb-1 font-medium">Description</label>
        <p className="bg-gray-800 px-4 py-2 rounded-lg whitespace-pre-wrap">{meetingData?.description || "—"}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">Chairperson</label>
          <p className="bg-gray-800 px-4 py-2 rounded-lg">{meetingData?.chairperson?.display_name || "—"}</p>
        </div>
        <div>
          <label className="block mb-1 font-medium">Host</label>
          <p className="bg-gray-800 px-4 py-2 rounded-lg">{meetingData?.host?.display_name || "—"}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block mb-1 font-medium">Date</label>
          <p className="bg-gray-800 px-4 py-2 rounded-lg">{meetingData?.start_time?.slice(0, 10)}</p>
        </div>
        <div>
          <label className="block mb-1 font-medium">Start Time</label>
          <p className="bg-gray-800 px-4 py-2 rounded-lg">{meetingData?.start_time?.slice(11, 16)}</p>
        </div>
        <div>
          <label className="block mb-1 font-medium">End Time</label>
          <p className="bg-gray-800 px-4 py-2 rounded-lg">{meetingData?.end_time?.slice(11, 16)}</p>
        </div>
      </div>

      <div>
        <label className="block mb-1 font-medium">Participants</label>
        <div className="bg-gray-800 px-4 py-2 rounded-lg flex flex-wrap gap-2">
          <input
            type="text"
            readOnly
            value={meetingData?.participants?.map((p) => (p as any)?.user?.display_name)?.join(", ") ?? ""}
            className="w-full bg-gray-800"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Agenda Items</h3>
        <div className="space-y-4">
          {meetingData?.agendas?.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-4">
              <div className="col-span-12 md:col-span-5">
                <label className="block mb-1 font-medium">Title</label>
                <p className="bg-gray-800 px-4 py-2 rounded-lg">{item?.title}</p>
              </div>

              <div className="col-span-12 md:col-span-4">
                <label className="block mb-1 font-medium">Assignees</label>
                <div className="bg-gray-800 px-4 py-2 rounded-lg flex flex-wrap gap-2">
                  <input
                    type="text"
                    readOnly
                    value={meetingData?.participants?.map((p) => (p as any)?.user?.display_name)?.join(", ") ?? ""}
                    className="w-full bg-gray-800"
                  />
                </div>
              </div>

              <div className="col-span-12 md:col-span-2">
                <label className="block mb-1 font-medium">Duration (min)</label>
                <p className="bg-gray-800 px-4 py-2 rounded-lg">{item?.duration_minutes}</p>
              </div>
            </div>
          )) || <p>No agenda items.</p>}
        </div>
      </div>

      <div>
        <label className="block mb-1 font-medium">Attachments</label>
        <div className="mt-3 space-y-2">
          {meetingData?.attachments?.map((file, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center bg-gray-800 border border-gray-700 px-3 py-2 rounded-md text-sm"
            >
              <span>{file?.name || `File ${idx + 1}`}</span>
              <div>
                <a
                  href={file?.url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline flex items-center gap-1"
                >
                  <Eye size={16} /> View
                </a>
              </div>
            </div>
          )) || <p className="bg-gray-800 px-4 py-2 rounded-lg">No attachments</p>}
        </div>
      </div>
    </div>
  );
});

export default MeetingUpdateForm;
