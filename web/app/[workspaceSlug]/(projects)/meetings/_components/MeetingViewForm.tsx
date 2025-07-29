"use client";

import { observer } from "mobx-react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@plane/i18n";
import { useMeeting } from "@/hooks/store/use-meeting";

const MeetingViewForm = observer(() => {
  const { workspaceSlug, meetingId } = useParams();
  const { meetings } = useMeeting();
  const { t } = useTranslation();
  const router = useRouter();

  const meetingData = meetingId ? meetings?.find((m) => m.id === meetingId) : undefined;

  if (!meetingData?.id) {
    router.push(`/${workspaceSlug}/meetings`);
  }

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
            value={meetingData?.participants?.map((p) => p?.display_name)?.join(", ") ?? ""}
            className="w-full bg-gray-800"
          />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Agenda Items</h3>
        <div className="space-y-6">
          {meetingData?.agendas?.map((agenda, agendaIdx) => (
            <div
              key={agenda.id || `agenda-${agendaIdx}`}
              className="border border-gray-700 rounded-lg p-5 space-y-5 bg-gray-800"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="">
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Agenda</label>
                  <p className="bg-gray-900 px-4 py-2 rounded text-white">{agenda?.title || "—"}</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Time (Minutes)</label>
                  <p className="bg-gray-900 px-4 py-2 rounded text-white">{agenda?.duration_minutes ?? "—"}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-300 mb-1">Owner</label>
                  <p className="bg-gray-900 px-4 py-2 rounded text-white">
                    {agenda?.assignees?.map((u) => u?.display_name).join(", ") || "—"}
                  </p>
                </div>
              </div>

              {agenda?.issues?.length ? (
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-gray-300">Action Items</h4>
                  {agenda?.issues?.map((issue, issueIdx) => (
                    <div
                      key={issueIdx}
                      className="grid grid-cols-1 md:grid-cols-12 gap-4 bg-gray-900 p-4 rounded border border-gray-700"
                    >
                      <div className="md:col-span-4">
                        <label className="text-sm font-medium text-gray-300 block mb-1">Action</label>
                        <p className="bg-gray-800 px-3 py-2 rounded text-white">{issue?.name || "—"}</p>
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-sm font-medium text-gray-300 block mb-1">Assignees</label>
                        <p className="bg-gray-800 px-4 py-2 rounded text-white">
                          {issue?.assignees?.map((u) => u?.display_name).join(", ") || "—"}
                        </p>
                      </div>

                      <div className="md:col-span-3">
                        <label className="text-sm font-medium text-gray-300 block mb-1">Due Date</label>
                        <p className="bg-gray-800 px-3 py-2 rounded text-white">{issue?.target_date || "—"}</p>
                      </div>

                      <div className="md:col-span-2">
                        <label className="text-sm font-medium text-gray-300 block mb-1">Priority</label>
                        <p className="bg-gray-800 px-3 py-2 rounded text-white">{issue?.priority || "—"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                ""
              )}
            </div>
          ))}

          {meetingData?.agendas?.length === 0 && <p className="text-sm text-gray-400">No agenda items found.</p>}
        </div>
      </div>

      {/* <div>
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
      </div> */}

      {meetingData?.summary ? (
        <div>
          <label className="text-sm font-semibold text-gray-300 block mb-2">Meeting Summary</label>
          <textarea
            value={meetingData?.summary}
            readOnly
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
            rows={4}
            placeholder="Final meeting summary..."
          />
        </div>
      ) : (
        ""
      )}
    </div>
  );
});

export default MeetingViewForm;
