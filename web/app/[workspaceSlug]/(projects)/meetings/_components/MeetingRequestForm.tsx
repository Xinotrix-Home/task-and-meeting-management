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

export const users: IUser[] = [
  {
    id: "9a1aeba2-8eee-4939-a7f9-833d49970f58",
    first_name: "Rahat Uddin",
    last_name: "Azad",
    display_name: "rahatuddin786",
  },
];

export default function MeetingForm() {
  const { workspaceSlug } = useParams();
  const { t } = useTranslation();
  const { addMeeting } = useMeeting();
  const router = useRouter();
  const [formSubmitState, setFormSubmitState] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [chairperson, setChairperson] = useState<IUser | {}>({});
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [host, setHost] = useState<IUser | {}>({});
  const [participants, setParticipants] = useState<IUser[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [agendaItems, setAgendaItems] = useState([{ title: "", assignees: [] as IUser[], duration: "" }]);

  const {
    workspace: { fetchWorkspaceMembers, fetchWorkspaceMemberInvitations },
  } = useMember();

  // useSWR(
  //   workspaceSlug
  //     ? async () => {
  //         await fetchWorkspaceMembers(workspaceSlug.toString());
  //       }
  //     : null
  // );

  const addAgenda = () => setAgendaItems([...agendaItems, { title: "", assignees: [], duration: "" }]);

  const removeAgenda = (index: number) => setAgendaItems(agendaItems.filter((_, i) => i !== index));

  const updateAgendaItem = (index: number, field: string, value: any) => {
    const updated = [...agendaItems];
    (updated[index] as any)[field] = value;
    setAgendaItems(updated);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => setAttachments(attachments.filter((_, i) => i !== index));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const start_time = `${date} ${startTime}:00`;
    const end_time = `${date} ${endTime}:00`;

    const payload: any = {
      subject,
      description,
      start_time,
      end_time,
      chairperson: (chairperson as IUser)?.id ? chairperson : null,
      host: (host as IUser)?.id ? host : null,
      participants: participants,
      agendas: agendaItems.map((item) => ({
        title: item.title,
        duration_minutes: Number.isNaN(Number(item.duration)) ? 0 : parseInt(item.duration),
        assignees: item?.assignees,
      })),
      attachments,
      status: formSubmitState === "draft" ? "draft" : "submitted",
    };

    setFormSubmitState("submitting");
    addMeeting(workspaceSlug?.toString()!, payload)
      .then(() => {
        setToast({
          type: TOAST_TYPE.SUCCESS,
          title: t("success"),
          message: t("meeting_created_successfully"),
        });
        setFormSubmitState("");
        router.push(`/${workspaceSlug}/meetings`);
      })
      .catch(() => {
        setToast({
          type: TOAST_TYPE.ERROR,
          title: t("error"),
          message: t("something_went_wrong"),
        });
        setFormSubmitState("");
      });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="p-6 max-w-4xl mx-auto bg-gray-900 text-white rounded-2xl shadow-xl space-y-6"
    >
      <h2 className="text-2xl font-bold mb-4">Create New Meeting</h2>

      <div>
        <label className="block mb-1 font-medium">Meeting Subject *</label>
        <input
          type="text"
          required
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 px-4 py-2 rounded-lg"
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full bg-gray-800 border border-gray-600 px-4 py-2 rounded-lg"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block mb-1 font-medium">Chairperson *</label>
          <select
            required
            value={(chairperson as IUser)?.id || ""}
            onChange={(e) => {
              const selectedUser = users?.find((u) => u?.id === e?.target?.value);
              setChairperson(selectedUser || {});
            }}
            className="w-full bg-gray-800 border border-gray-600 px-4 py-2 rounded-lg"
          >
            <option value="">Select Chairperson</option>
            {users.map((u) => (
              <option key={u?.id} value={u?.id}>
                {u?.display_name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block mb-1 font-medium">Host *</label>
          <select
            required
            value={(host as IUser)?.id || ""}
            onChange={(e) => {
              const selectedUser = users?.find((u) => u?.id === e.target.value);
              setHost(selectedUser || {});
            }}
            className="w-full bg-gray-800 border border-gray-600 px-4 py-2 rounded-lg"
          >
            <option value="">Select Host</option>
            {users.map((u) => (
              <option key={u?.id} value={u.id}>
                {u?.display_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block mb-1 font-medium">Date *</label>
          <input
            type="date"
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 px-4 py-2 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">Start Time *</label>
          <input
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 px-4 py-2 rounded-lg"
          />
        </div>
        <div>
          <label className="block mb-1 font-medium">End Time *</label>
          <input
            type="time"
            required
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 px-4 py-2 rounded-lg"
          />
        </div>
      </div>

      <div>
        <label className="block mb-1 font-medium">Participants *</label>
        <div className="bg-gray-800 border border-gray-600 p-2 rounded-lg">
          <div className="flex flex-wrap gap-2 mb-2">
            {participants.map((p) => (
              <span key={p.id} className="bg-gray-700 text-sm px-3 py-1 rounded-full flex items-center gap-1">
                {p.display_name}
                <button
                  type="button"
                  onClick={() => setParticipants(participants.filter((user) => user.id !== p.id))}
                  className="text-red-400 hover:text-red-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <select
            key={participants.map((p) => p.id).join(",")}
            onChange={(e) => {
              const selectedId = e.target.value;
              const selectedUser = users.find((u) => u.id === selectedId);
              if (selectedUser && !participants.some((u) => u.id === selectedUser.id)) {
                setParticipants([...participants, selectedUser]);
              }
              // e.target.selectedIndex = 0;
            }}
            className="w-full bg-gray-700 border border-gray-600 px-4 py-2 rounded-md"
          >
            <option value="">Select participant</option>
            {users
              .filter((u) => !participants.some((p) => p.id === u.id))
              .map((u) => (
                <option key={u.id} value={u.id}>
                  {u.display_name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Agenda Items</h3>
        <div className="space-y-4">
          {agendaItems.map((item, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-4 items-end">
              <div className="col-span-12 md:col-span-5">
                <label className="block mb-1 font-medium">Title</label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateAgendaItem(idx, "title", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 px-4 py-2 rounded-lg"
                />
              </div>
              <div className="col-span-12 md:col-span-4">
                <label className="block mb-1 font-medium">Assignees</label>
                <div className="bg-gray-800 border border-gray-600 p-2 rounded-lg">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {item.assignees.map((assignee: IUser) => (
                      <span
                        key={assignee.id}
                        className="bg-gray-700 text-sm px-3 py-1 rounded-full flex items-center gap-1"
                      >
                        {assignee.display_name}
                        <button
                          type="button"
                          onClick={() => {
                            const updatedAssignees = item.assignees.filter((a) => a.id !== assignee.id);
                            updateAgendaItem(idx, "assignees", updatedAssignees);
                          }}
                          className="text-red-400 hover:text-red-200"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <select
                    key={item.assignees.map((p) => p.id).join(",")}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      const selectedUser = users.find((u) => u.id === selectedId);
                      if (selectedUser && !item.assignees.some((a) => a.id === selectedUser.id)) {
                        const updatedAssignees = [...item.assignees, selectedUser];
                        updateAgendaItem(idx, "assignees", updatedAssignees);
                      }
                      // e.target.selectedIndex = 0;
                    }}
                    className="w-full bg-gray-700 border border-gray-600 px-4 py-2 rounded-md"
                  >
                    <option value="">Select assignee</option>
                    {users
                      .filter((u) => !item.assignees.some((a) => a.id === u.id))
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.display_name}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="col-span-12 md:col-span-2">
                <label className="block mb-1 font-medium">Duration (min)</label>
                <input
                  type="number"
                  value={item.duration}
                  onChange={(e) => updateAgendaItem(idx, "duration", e.target.value)}
                  className="w-full bg-gray-800 border border-gray-600 px-4 py-2 rounded-lg"
                />
              </div>
              <div className="col-span-12 md:col-span-1 text-center">
                <button
                  type="button"
                  onClick={() => removeAgenda(idx)}
                  className="border border-red-600 text-red-400 p-2 rounded-full"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={addAgenda}
            className="flex items-center gap-2 px-3 py-1.5 border border-gray-600 rounded-lg hover:bg-gray-700"
          >
            <Plus size={16} /> Add Agenda
          </button>
        </div>
      </div>

      <div>
        <label className="block mb-1 font-medium">Attachments</label>
        <input
          type="file"
          multiple
          onChange={handleFileChange}
          className="w-full file:bg-gray-800 file:border file:border-gray-600 file:text-white file:rounded-lg file:px-4 file:py-2"
        />
        <div className="mt-3 space-y-2">
          {attachments.map((file, idx) => (
            <div
              key={idx}
              className="flex justify-between items-center bg-gray-800 border border-gray-700 px-3 py-2 rounded-md text-sm"
            >
              <span>{file.name}</span>
              <div className="flex gap-3 items-center">
                <button type="button" className="text-blue-400 hover:underline flex items-center gap-1">
                  <Eye size={16} /> View
                </button>
                <button
                  type="button"
                  onClick={() => removeAttachment(idx)}
                  className="text-red-400 hover:underline flex items-center gap-1"
                >
                  <X size={16} /> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-4 pt-4">
        <button
          type="submit"
          onClick={() => setFormSubmitState("draft")}
          className="px-4 py-2 border border-gray-600 rounded-lg hover:bg-gray-700"
        >
          Save as Draft
        </button>
        <button
          type="submit"
          onClick={() => setFormSubmitState("submit")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Submit
        </button>
      </div>
    </form>
  );
}
