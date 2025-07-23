import { makeObservable, observable, action, runInAction, computed } from "mobx";
import { v4 as uuidv4 } from "uuid";
import { MeetingService } from "@/services/meeting";
import { IMeeting } from "@plane/types";
import { CoreRootStore } from "../root.store";

export interface IMeetingError {
  status: string;
  message: string;
}

export interface IMeetingStore {
  meetingIds: string[];
  meetingMap: Record<string, IMeeting>;
  isLoading: boolean;
  error: IMeetingError | null;

  meetings: IMeeting[];

  fetchMeetings: (workspaceSlug: string) => Promise<void>;
  addMeeting: (workspaceSlug: string, data: Partial<IMeeting>) => Promise<IMeeting>;
  updateMeeting: (workspaceSlug: string, id: string, data: Partial<IMeeting>) => Promise<IMeeting>;
  deleteMeeting: (workspaceSlug: string, id: string) => Promise<void>;
  removeMeetingFromStore: (id: string) => void;
  reset: () => void;
}

export class MeetingStore implements IMeetingStore {
  meetingIds: string[] = [];
  meetingMap: Record<string, IMeeting> = {};
  isLoading = false;
  error: IMeetingError | null = null;

  meetingService: MeetingService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      meetingIds: observable,
      meetingMap: observable,
      isLoading: observable.ref,
      error: observable,

      meetings: computed,

      fetchMeetings: action,
      addMeeting: action,
      updateMeeting: action,
      deleteMeeting: action,
      removeMeetingFromStore: action,
      reset: action,
    });

    this.meetingService = new MeetingService();
  }

  get meetings(): IMeeting[] {
    return this.meetingIds.map(id => this.meetingMap[id]).filter(Boolean);
  }

  fetchMeetings = async (workspaceSlug: string) => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const meetingGroups = await this.meetingService.getMeetings(workspaceSlug);

      runInAction(() => {
        this.meetingIds = [];
        this.meetingMap = {};

        // Flatten grouped response into flat IMeeting[]
        meetingGroups.forEach(group => {
          group.meetings.forEach(meeting => {
            if (meeting?.id) {
              this.meetingMap[meeting.id] = meeting;
              this.meetingIds.push(meeting?.id);
            }
          });
        });

        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = {
          status: "fetch-error",
          message: "Failed to fetch meetings",
        };
        this.isLoading = false;
      });
      throw error;
    }
  };

  addMeeting = async (workspaceSlug: string, data: Partial<IMeeting>) => {
    const tempId = uuidv4();

    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;

        this.meetingMap[tempId] = {
          ...(data as IMeeting),
          id: tempId,
        };
        this.meetingIds.unshift(tempId);
      });

      const newMeeting = await this.meetingService.createMeeting(workspaceSlug, data);

      runInAction(() => {
        delete this.meetingMap[tempId];

        if (newMeeting?.id) {
          this.meetingMap[newMeeting.id] = newMeeting;
          this.meetingIds = [newMeeting.id, ...this.meetingIds.filter(id => id !== tempId)];
        }

        this.isLoading = false;
      });

      return newMeeting;
    } catch (error) {
      runInAction(() => {
        delete this.meetingMap[tempId];
        this.meetingIds = this.meetingIds.filter(id => id !== tempId);

        this.error = {
          status: "create-error",
          message: "Failed to create meeting",
        };
        this.isLoading = false;
      });
      throw error;
    }
  };

  updateMeeting = async (workspaceSlug: string, id: string, data: Partial<IMeeting>) => {
    const original = this.meetingMap[id];

    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
        this.meetingMap[id] = { ...original, ...data };
      });

      const updated = await this.meetingService.updateMeeting(workspaceSlug, id, data);

      runInAction(() => {
        this.meetingMap[id] = updated;
        this.isLoading = false;
      });

      return updated;
    } catch (error) {
      runInAction(() => {
        this.meetingMap[id] = original;

        this.error = {
          status: "update-error",
          message: "Failed to update meeting",
        };
        this.isLoading = false;
      });

      throw error;
    }
  };

  deleteMeeting = async (workspaceSlug: string, id: string) => {
    const original = this.meetingMap[id];

    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      await this.meetingService.deleteMeeting(workspaceSlug, id);

      runInAction(() => {
        delete this.meetingMap[id];
        this.meetingIds = this.meetingIds.filter(mid => mid !== id);
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.meetingMap[id] = original;
        if (!this.meetingIds.includes(id)) {
          this.meetingIds.push(id);
        }

        this.error = {
          status: "delete-error",
          message: "Failed to delete meeting",
        };
        this.isLoading = false;
      });

      throw error;
    }
  };

  removeMeetingFromStore = (id: string) => {
    runInAction(() => {
      delete this.meetingMap[id];
      this.meetingIds = this.meetingIds.filter(mid => mid !== id);
    });
  };

  reset = () => {
    runInAction(() => {
      this.meetingIds = [];
      this.meetingMap = {};
      this.isLoading = false;
      this.error = null;
    });
  };
}
