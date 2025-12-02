import { API_BASE_URL } from "@plane/constants";
import { APIService } from "../api.service";

// Types based on API documentation
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
  user_assignments?: IUserAssignment[];
  assigned_users?: IAssignedUser[];
  children_count?: number;
  created_at?: string;
  updated_at?: string;
  // For tree structure
  children?: IOrganogramPosition[];
  // For UI state
  isExpanded?: boolean;
  level?: number;
}

export interface IUserAssignment {
  id: string;
  user: IAssignedUser;
  assigned_at: string;
  assigned_by_detail?: any;
}

export interface IAssignedUser {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface IOrganogram {
  id: string;
  workspace: string;
  workspace_detail?: {
    id: string;
    name: string;
    slug: string;
  };
  name: string;
  description?: string;
  is_active: boolean;
  positions?: string[];
  positions_detail?: IOrganogramPosition[];
  positions_count?: number;
  created_at?: string;
}

export interface ICreatePositionPayload {
  name: string;
  workspace?: string; // Workspace ID
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

  /**
   * List all positions in the workspace
   */
  async listPositions(workspaceSlug: string): Promise<IOrganogramPosition[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/organogram/positions/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  /**
   * Get hierarchical tree of positions
   */
  async getTree(workspaceSlug: string): Promise<IOrganogramPosition[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/organogram/tree/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  /**
   * Get position details
   */
  async getPosition(workspaceSlug: string, positionId: string): Promise<IOrganogramPosition> {
    return this.get(`/api/workspaces/${workspaceSlug}/organogram/positions/${positionId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  /**
   * Create a new position
   */
  async createPosition(workspaceSlug: string, data: ICreatePositionPayload): Promise<IOrganogramPosition> {
    return this.post(`/api/workspaces/${workspaceSlug}/organogram/positions/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  /**
   * Update a position
   */
  async updatePosition(
    workspaceSlug: string,
    positionId: string,
    data: IUpdatePositionPayload
  ): Promise<IOrganogramPosition> {
    return this.patch(`/api/workspaces/${workspaceSlug}/organogram/positions/${positionId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  /**
   * Delete a position
   */
  async deletePosition(workspaceSlug: string, positionId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/organogram/positions/${positionId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  /**
   * Assign user to position
   */
  async assignUser(workspaceSlug: string, positionId: string, data: IAssignUserPayload): Promise<IUserAssignment> {
    return this.post(`/api/workspaces/${workspaceSlug}/organogram/positions/${positionId}/assign-user/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  /**
   * Unassign user from position
   */
  async unassignUser(workspaceSlug: string, positionId: string, data: IUnassignUserPayload): Promise<void> {
    return this.post(`/api/workspaces/${workspaceSlug}/organogram/positions/${positionId}/unassign-user/`, data)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  /**
   * Get child positions
   */
  async getChildren(workspaceSlug: string, positionId: string, includeSelf = false): Promise<IOrganogramPosition[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/organogram/positions/${positionId}/children/`, {
      params: {
        include_self: includeSelf,
      },
    })
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  /**
   * Get reporting chain
   */
  async getReportingChain(workspaceSlug: string, positionId: string): Promise<IOrganogramPosition[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/organogram/positions/${positionId}/reporting-chain/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  /**
   * List all organograms
   */
  async listOrganograms(workspaceSlug: string): Promise<IOrganogram[]> {
    return this.get(`/api/workspaces/${workspaceSlug}/organograms/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  /**
   * Get organogram details
   */
  async getOrganogram(workspaceSlug: string, organogramId: string): Promise<IOrganogram> {
    return this.get(`/api/workspaces/${workspaceSlug}/organograms/${organogramId}/`)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  /**
   * Create organogram
   */
  async createOrganogram(workspaceSlug: string, data: Partial<IOrganogram>): Promise<IOrganogram> {
    return this.post(`/api/workspaces/${workspaceSlug}/organograms/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  /**
   * Update organogram
   */
  async updateOrganogram(workspaceSlug: string, organogramId: string, data: Partial<IOrganogram>): Promise<IOrganogram> {
    return this.patch(`/api/workspaces/${workspaceSlug}/organograms/${organogramId}/`, data)
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  /**
   * Delete organogram
   */
  async deleteOrganogram(workspaceSlug: string, organogramId: string): Promise<void> {
    return this.delete(`/api/workspaces/${workspaceSlug}/organograms/${organogramId}/`)
      .then(() => undefined)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }

  /**
   * Activate organogram
   */
  async activateOrganogram(workspaceSlug: string, organogramId: string): Promise<IOrganogram> {
    return this.post(`/api/workspaces/${workspaceSlug}/organograms/${organogramId}/activate/`, {})
      .then((response) => response?.data)
      .catch((error) => {
        throw error?.response?.data || error;
      });
  }
}

