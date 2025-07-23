"use client";
import { useEffect, useState } from "react";
import { Clock, Plus, Trash2, StickyNote } from "lucide-react";
import { IMeeting, IUser } from "@plane/types/src/meeting";
import { MeetingStore } from "@/store/meeting/meeting.store";
import { useMeeting } from "@/hooks/store/use-meeting";
import { useParams, useRouter } from "next/navigation";
import { observer } from "mobx-react";
import { setToast, TOAST_TYPE } from "@plane/ui";
import { useTranslation } from "@plane/i18n";
import { IAgenda, IssueItem } from "../data/meetings";
import { formatDateTime } from "./MeetingCardList";
import { useMember } from "@/hooks/store";
import useSWR from "swr";
import { MembersSettingsLoader } from "@/components/ui";

// Simulated user list with IDs and names

const MeetingMinutesForm = observer(() => {
  const [summary, setSummary] = useState("");
  const { t } = useTranslation();
  const router = useRouter();
  const {
    workspace: { fetchWorkspaceMembers, workspaceMemberIds, getSearchedWorkspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();
  const { meetings, updateMeeting } = useMeeting();
  const { meetingId, workspaceSlug } = useParams();

  // useSWR(
  //   workspaceSlug
  //     ? async () => {
  //         await fetchWorkspaceMembers(workspaceSlug.toString());
  //       }
  //     : null
  // );

  if (!workspaceMemberIds) return <MembersSettingsLoader />;

  const meetingData = meetingId ? meetings?.find((m) => m.id === meetingId) : undefined;

  // if (!meetingData?.id) {
  //   router.push(`/${workspaceSlug}/meetings`);
  // }

  const [agendaItems, setAgendaItems] = useState<IAgenda[]>([]);
  useEffect(() => {
    if (meetingData?.agendas) {
      const agendasWithDefaults = meetingData.agendas.map((agenda) => ({
        ...agenda,
        issues: agenda.issues || [],
        // isNew: false,
      }));
      setAgendaItems(agendasWithDefaults);
    }
    if (meetingData?.summary) {
      setSummary(meetingData?.summary);
    }
  }, [meetingData]);

  const handleUpdateAgenda = (index: number, field: string, value: any) => {
    setAgendaItems((prev) => prev.map((agenda, i) => (i === index ? { ...agenda, [field]: value } : agenda)));
  };

  const handleAddAgenda = () => {
    setAgendaItems((prev) => [
      ...prev,
      {
        title: "",
        assignees: [],
        duration_minutes: 0,
        issues: [],
      },
    ]);
  };

  const handleRemoveAgenda = (index: number) => {
    setAgendaItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddIssue = (agendaIndex: number) => {
    const newIssue = {
      name: "",
      description: "",
      assignees: [],
      target_date: "",
      priority: "Medium",
    };
    setAgendaItems((prev) =>
      prev.map((agenda, i) =>
        i === agendaIndex ? { ...agenda, issues: [...(agenda.issues || []), newIssue] } : agenda
      )
    );
  };

  const handleUpdateIssue = (agendaIndex: number, issueIndex: number, field: string, value: any) => {
    setAgendaItems((prev) =>
      prev.map((agenda, i) => {
        if (i !== agendaIndex) return agenda;
        const updatedIssues = agenda.issues?.map((issue, j) =>
          j === issueIndex ? { ...issue, [field]: value } : issue
        );
        return { ...agenda, issues: updatedIssues };
      })
    );
  };

  const handleRemoveIssue = (agendaIndex: number, issueIndex: number) => {
    setAgendaItems((prev) =>
      prev.map((agenda, i) =>
        i === agendaIndex ? { ...agenda, issues: agenda.issues?.filter((_, j) => j !== issueIndex) } : agenda
      )
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      ...meetingData,
      agendas: agendaItems,
      summary,
    };
    console.log("Final Meeting Minutes Data:", payload);

    if (meetingData?.id) {
      updateMeeting(workspaceSlug?.toString()!, meetingData?.id, payload)
        .then(() => {
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: t("success"),
            message: t("meeting_created_successfully"),
          });
          // setFormSubmitState("");
          router.push(`/${workspaceSlug}/meetings`);
        })
        .catch(() => {
          setToast({
            type: TOAST_TYPE.ERROR,
            title: t("error"),
            message: t("something_went_wrong"),
          });
          // setFormSubmitState("");
        });
    }
  };

  // derived values
  const searchedMemberIds = getSearchedWorkspaceMemberIds("");
  const memberDetails = searchedMemberIds?.map((memberId) => getWorkspaceMemberDetails(memberId));

  const users = memberDetails?.map((data) => {
    const { avatar, avatar_url, display_name, email, id, first_name, last_name }: any = data?.member;
    return {
      avatar,
      avatar_url,
      display_name,
      email,
      id,
      first_name,
      last_name,
    };
  });
  console.log("members_data", meetingData, searchedMemberIds);

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-gray-900 text-gray-100 shadow-xl rounded-2xl p-6 max-w-[90%] mx-auto space-y-8"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-semibold text-white">{meetingData?.subject}</h2>
        <div className="flex items-center text-gray-400">
          <Clock className="w-5 h-5 mr-2" />
          <span>
            {meetingData?.start_time && formatDateTime(meetingData?.start_time, "date")} |{" "}
            {meetingData?.start_time && formatDateTime(meetingData?.start_time, "time")} –{" "}
            {meetingData?.end_time && formatDateTime(meetingData?.end_time, "time")}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="text-sm font-semibold text-gray-300 mb-2 block">Host</label>
          <input
            type="text"
            value={`${meetingData?.host?.first_name ?? ""} ${meetingData?.host?.last_name ?? ""}`}
            readOnly
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-300 mb-2 block">Participants</label>
          <input
            type="text"
            value={meetingData?.participants?.map((p) => p?.display_name)?.join(", ") ?? ""}
            readOnly
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Agenda</h3>
          <button
            type="button"
            onClick={handleAddAgenda}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-600 hover:bg-gray-700 text-sm text-gray-200"
          >
            <Plus className="w-4 h-4" /> Add Agenda
          </button>
        </div>

        {agendaItems.map((agenda, agendaIdx) => (
          <div
            key={agenda.id || `agenda-${agendaIdx}`}
            className="border border-gray-700 rounded-lg relative p-5 space-y-5 bg-gray-800"
          >
            <div className="flex justify-between items-start">
              <button
                type="button"
                onClick={() => handleRemoveAgenda(agendaIdx)}
                className="absolute top-2 right-2 text-red-400 hover:text-red-600"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div className="md:col-span-3">
                <label className="text-sm font-semibold text-gray-300 block mb-1">Agenda</label>
                <input
                  type="text"
                  placeholder="Agenda Title"
                  value={agenda.title}
                  onChange={(e) => handleUpdateAgenda(agendaIdx, "title", e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-semibold text-gray-300 block mb-1">Owner</label>
                <select
                  // defaultValue={agenda?.assignees}
                  className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 text-white"
                >
                  <option disabled>Select owner</option>
                  {users?.map((u, i) => <option key={i}>{u?.display_name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-300 block mb-1">Time (Minutes)</label>
                <input
                  type="number"
                  value={agenda.duration_minutes}
                  onChange={(e) => handleUpdateAgenda(agendaIdx, "duration_minutes", +e.target.value)}
                  placeholder="Duration (min)"
                  className="w-40 bg-gray-800 border border-gray-600 px-4 py-2 rounded-lg"
                />
              </div>
            </div>
            {/* Action Items */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <h4 className="font-medium text-gray-200">Action Items</h4>
                <button
                  type="button"
                  className="text-sm flex items-center gap-1 px-2 py-1 border border-gray-600 rounded hover:bg-gray-700 text-gray-200"
                  onClick={() => handleAddIssue(agendaIdx)}
                >
                  <Plus className="w-4 h-4" /> Add Action
                </button>
              </div>
              {agenda.issues?.map((issue, issueIdx) => (
                <div
                  key={issueIdx}
                  className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-900 p-4 border border-gray-700 rounded-md"
                >
                  <div className="md:col-span-4">
                    <label className="text-sm font-medium text-gray-300 block mb-1">Action</label>
                    <input
                      type="text"
                      value={issue.name}
                      onChange={(e) => handleUpdateIssue(agendaIdx, issueIdx, "name", e.target.value)}
                      placeholder="Action name"
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white placeholder-gray-400"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <div>
                      <label className="text-sm text-white">Assignees</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {issue.assignees?.map((user) => (
                          <span key={user.id} className="bg-gray-700 text-sm px-2 py-1 rounded">
                            {user.display_name}
                          </span>
                        ))}
                      </div>
                      <select
                        onChange={(e) => {
                          const selectedUser = users?.find((u) => u.id === e.target.value);
                          if (selectedUser && !issue.assignees?.some((a) => a.id === selectedUser.id)) {
                            const newAssignees = [...(issue.assignees || []), selectedUser];
                            handleUpdateIssue(agendaIdx, issueIdx, "assignees", newAssignees);
                          }
                        }}
                        className="w-full mt-2 bg-gray-800 border border-gray-600 px-3 py-2 rounded"
                      >
                        <option value="">Select Assignee</option>
                        {users?.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.display_name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <label className="text-sm font-medium text-gray-300 block mb-1">Due Date</label>
                    <input
                      type="date"
                      value={issue.target_date}
                      onChange={(e) => handleUpdateIssue(agendaIdx, issueIdx, "target_date", e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                    />
                  </div>
                  {/* <input
                    type="text"
                    value={issue.description}
                    onChange={(e) => handleUpdateIssue(agendaIdx, issueIdx, "description", e.target.value)}
                    placeholder="Description"
                    className="bg-gray-800 border border-gray-600 px-3 py-2 rounded w-full"
                  /> */}
                  <div className="md:col-span-1">
                    <select
                      value={issue.priority}
                      onChange={(e) => handleUpdateIssue(agendaIdx, issueIdx, "priority", e.target.value)}
                      className="bg-gray-800 border border-gray-600 px-3 py-2 rounded"
                    >
                      {["Low", "Medium", "High"].map((level) => (
                        <option key={level}>{level}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-1 flex justify-center items-center pt-6">
                    <button
                      type="button"
                      className="text-red-400 hover:text-red-600"
                      onClick={() => handleRemoveIssue(agendaIdx, issueIdx)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Notes/Decisions */}
      {/* <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-semibold text-gray-300">Notes / Decisions</label>
                <button
                  type="button"
                  className="flex items-center gap-1 text-sm text-gray-400 hover:text-white"
                >
                  <StickyNote className="w-4 h-4" /> Add Note
                </button>
              </div>
              <textarea
                value={item.note || ''}
                onChange={(e) => handleNoteChange(idx, e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                rows={3}
                placeholder="Add meeting notes or decisions for this agenda..."
              />
            </div>
          </div>
        ))}
      </div> */}

      {/* Meeting Summary */}
      <div>
        <label className="text-sm font-semibold text-gray-300 block mb-2">Meeting Summary</label>
        <textarea
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
          rows={4}
          placeholder="Final meeting summary..."
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex justify-end gap-3 pt-4">
        <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded">
          Submit
        </button>
      </div>
    </form>
  );
});

export default MeetingMinutesForm;
