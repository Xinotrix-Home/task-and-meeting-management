import { API_BASE_URL } from "@plane/constants";
import { APIService } from "../api.service";
import { IMeeting, IMeetingGroup } from "@plane/types";

export class MeetingService extends APIService {
  constructor() {
    super(API_BASE_URL)
  }


  async createMeeting(workspaceSlug: string, data: Partial<IMeeting>): Promise<IMeeting> {
    const payload = serializeMeetingForApi(data)

    return this.post(`/api/workspaces/${workspaceSlug}/meetings/`, payload)
      .then((res) => res?.data)
      .catch((error) => {
        throw error?.response;
      })
  }


  async updateMeeting(workspaceSlug: string, meetingId: string, data: Partial<IMeeting>): Promise<IMeeting> {
    const payload = serializeMeetingForApi(data)
    return this.patch(`/api/workspaces/${workspaceSlug}/meetings/${meetingId}/`, payload)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async deleteMeeting(workspaceSlug: string, meetingId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/meetings/${meetingId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getMeetings(workspaceSlug: string): Promise<IMeetingGroup[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/meetings/`, {
      params: {
        all: true
      }
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }

  async getMeetingById(workspaceSlug: string, meetingId: string): Promise<IMeeting> {
    return this.get(`/api/workspaces/${workspaceSlug}/meetings/${meetingId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response;
      });
  }
}

// Utility function to convert full objects to ID-only format
export const serializeMeetingForApi = (data: Partial<IMeeting>) => ({
  ...data,
  chairperson: data.chairperson?.id ?? data.chairperson ?? null,
  host: data.host?.id ?? data.host ?? null,
  participants: Array.isArray(data.participants)
    ? data.participants.map(p => p?.id ?? p).filter(Boolean)
    : [],

  attachments: Array.isArray(data.attachments)
    ? data.attachments.map(a => ({
      id: a?.id ?? undefined,
      name: a?.name ?? "",
      url: a?.url ?? "",
      type: a?.type ?? "",
    }))
    : [],

  agendas: Array.isArray(data.agendas)
    ? data.agendas.map(agenda => ({
      id: agenda?.id ?? undefined,
      title: agenda?.title ?? "",
      duration_minutes: agenda?.duration_minutes ?? 0,
      // note: agenda?.note ?? "",
      assignees: Array.isArray(agenda.assignees)
        ? agenda.assignees.map(a => a?.id ?? a).filter(Boolean)
        : [],
      issues: Array.isArray(agenda.issues)
        ? agenda.issues.map(issue => ({
          id: issue?.id ?? undefined,
          name: issue?.name ?? "",
          description: issue?.description ?? "",
          assignees: Array.isArray(issue.assignees)
            ? issue.assignees.map(a => a?.id ?? a).filter(Boolean)
            : [],
          target_date: issue?.target_date ?? null,
          priority: issue?.priority ?? "",
        }))
        : [],
    }))
    : [],
});


// Utility function to pass full objects format
// const serializeMeetingForApi = (data: Partial<IMeeting>) => ({
//   ...data,
//   chairperson: data.chairperson ?? null,
//   host: data.host ?? null,
//   participants: Array.isArray(data.participants) ? data.participants : [],
//   attachments: Array.isArray(data.attachments) ? data.attachments : [],
//   agendas: Array.isArray(data.agendas)
//     ? data.agendas.map((agenda) => ({
//       ...agenda,
//       assignees: Array.isArray(agenda.assignees) ? agenda.assignees : [],
//       issues: Array.isArray(agenda.issues)
//         ? agenda.issues.map((issue) => ({
//           ...issue,
//           assignees: Array.isArray(issue.assignees) ? issue.assignees : [],
//         }))
//         : [],
//     }))
//     : [],
// });


// api/ workspaces/<str:slug>/meetings/ [name='workspace-meetings'] 
// all, create

// api/ workspaces/<str:slug>/meetings/<uuid:pk>/ [name='workspace-meeting-detail']
// single get, update, delete