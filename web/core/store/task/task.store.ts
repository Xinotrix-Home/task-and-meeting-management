import { makeObservable, observable, action, runInAction, computed } from "mobx";
import { ITask } from "@plane/types";
import { TaskService } from "@/services/tasks";
import { CoreRootStore } from "../root.store";

export interface ITaskError {
  status: string;
  message: string;
}

export interface ITaskStore {
  taskIds: string[];
  taskMap: Record<string, ITask>;
  isLoading: boolean;
  error: ITaskError | null;

  tasks: ITask[];

  fetchTasks: (workspaceSlug: string) => Promise<void>;
  reset: () => void;
}

export class TaskStore implements ITaskStore {
  taskIds: string[] = [];
  taskMap: Record<string, ITask> = {};
  isLoading = false;
  error: ITaskError | null = null;

  taskService: TaskService;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      taskIds: observable,
      taskMap: observable,
      isLoading: observable.ref,
      error: observable,

      tasks: computed,

      fetchTasks: action,
      reset: action,
    });

    this.taskService = new TaskService();
  }

  get tasks(): ITask[] {
    return this.taskIds.map(id => this.taskMap[id]).filter(Boolean);
  }

  fetchTasks = async (workspaceSlug: string) => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const tasks = await this.taskService.getTasks(workspaceSlug);

      runInAction(() => {
        this.taskIds = [];
        this.taskMap = {};

        tasks.forEach(task => {
          if (task?.id) {
            this.taskMap[task.id] = task;
            this.taskIds.push(task.id);
          }
        });

        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.error = {
          status: "fetch-error",
          message: "Failed to fetch tasks",
        };
        this.isLoading = false;
      });
      throw error;
    }
  };

  reset = () => {
    runInAction(() => {
      this.taskIds = [];
      this.taskMap = {};
      this.isLoading = false;
      this.error = null;
    });
  };
}
