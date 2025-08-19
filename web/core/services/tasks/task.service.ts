import { API_BASE_URL } from "@plane/constants";
import { ITask } from "@plane/types";
import { APIService } from "../api.service";

export class TaskService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async createTask(workspaceSlug: string, payload: Partial<ITask>): Promise<ITask> {
    return this.post(`/api/workspaces/${workspaceSlug}/tasks/`, payload)
      .then(res => res?.data)
      .catch(error => {
        throw error?.response;
      });
  }

  async updateTask(workspaceSlug: string, taskId: string, payload: Partial<ITask>): Promise<ITask> {
    return this.patch(`/api/workspaces/${workspaceSlug}/tasks/${taskId}/`, payload)
      .then(res => res?.data)
      .catch(error => {
        throw error?.response;
      });
  }

  async deleteTask(workspaceSlug: string, taskId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/tasks/${taskId}/`)
      .then(res => res?.data)
      .catch(error => {
        throw error?.response;
      });
  }

  async getTasks(workspaceSlug: string): Promise<ITask[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/tasks/`, {
      params: { all: true }
    })
      .then(res => res?.data)
      .catch(error => {
        throw error?.response;
      });
  }

  async getTaskById(workspaceSlug: string, taskId: string): Promise<ITask> {
    return this.get(`/api/workspaces/${workspaceSlug}/tasks/${taskId}/`)
      .then(res => res?.data)
      .catch(error => {
        throw error?.response;
      });
  }
}
