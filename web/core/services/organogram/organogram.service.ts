import { API_BASE_URL } from "@/helpers/common.helper";
import { APIService } from "../api.service";

export interface IOrganogramPosition {
  id: string;
  name: string;
  workspace: string;
  workspace_detail?: {
    id: string;
    name: string;
    slug: string;
  };
  parent: string | null;
  parent_detail?: {
    id: string;
    name: string;
    authority: string;
  };
  authority: "none" | "head" | "line_manager";
  description?: string;
  user_assignments?: Array<{
    id: string;
    user: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
    };
    assigned_at: string;
    assigned_by_detail?: any;
  }>;
  assigned_users?: Array<{
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  }>;
  children_count?: number;
  children?: IOrganogramPosition[];
  created_at?: string;
  updated_at?: string;
}

export interface ICreatePositionPayload {
  name: string;
  parent?: string | null;
  authority?: "none" | "head" | "line_manager";
  description?: string;
}

export interface IUpdatePositionPayload {
  name?: string;
  parent?: string | null;
  authority?: "none" | "head" | "line_manager";
  description?: string;
}

export interface IAssignUserPayload {
  user_id: string;
}

export interface IUnassignUserPayload {
  user_id: string;
}

export class OrganogramService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getPositions(workspaceSlug: string): Promise<IOrganogramPosition[]> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/organogram/positions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getPositionTree(workspaceSlug: string): Promise<IOrganogramPosition[]> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/organogram/tree/`)
      .then((response) => response?.data)
      .catch((error) => {
        // Preserve error information for better debugging
        const errorData = error?.response?.data || error?.response || error;
        console.error("OrganogramService.getPositionTree error:", {
          status: error?.response?.status,
          statusText: error?.response?.statusText,
          data: errorData,
          url: `/api/v1/workspaces/${workspaceSlug}/organogram/tree/`,
        });
        throw errorData;
      });
  }

  async getPosition(workspaceSlug: string, positionId: string): Promise<IOrganogramPosition> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/organogram/positions/${positionId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async createPosition(workspaceSlug: string, data: ICreatePositionPayload): Promise<IOrganogramPosition> {
    return this.post(`/api/v1/workspaces/${workspaceSlug}/organogram/positions/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async updatePosition(
    workspaceSlug: string,
    positionId: string,
    data: IUpdatePositionPayload
  ): Promise<IOrganogramPosition> {
    return this.patch(`/api/v1/workspaces/${workspaceSlug}/organogram/positions/${positionId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async deletePosition(workspaceSlug: string, positionId: string): Promise<void> {
    return this.delete(`/api/v1/workspaces/${workspaceSlug}/organogram/positions/${positionId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async assignUser(workspaceSlug: string, positionId: string, data: IAssignUserPayload): Promise<any> {
    return this.post(`/api/v1/workspaces/${workspaceSlug}/organogram/positions/${positionId}/assign-user/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async unassignUser(workspaceSlug: string, positionId: string, data: IUnassignUserPayload): Promise<void> {
    return this.post(`/api/v1/workspaces/${workspaceSlug}/organogram/positions/${positionId}/unassign-user/`, data)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getChildPositions(workspaceSlug: string, positionId: string, includeSelf: boolean = false): Promise<IOrganogramPosition[]> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/organogram/positions/${positionId}/children/`, {
      params: { include_self: includeSelf },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }

  async getReportingChain(workspaceSlug: string, positionId: string): Promise<IOrganogramPosition[]> {
    return this.get(`/api/v1/workspaces/${workspaceSlug}/organogram/positions/${positionId}/reporting-chain/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data;
      });
  }
}

