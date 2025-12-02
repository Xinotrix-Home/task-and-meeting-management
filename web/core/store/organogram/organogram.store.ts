import { makeObservable, observable, action, runInAction, computed } from "mobx";
import { OrganogramService, IOrganogramPosition, ICreatePositionPayload, IUpdatePositionPayload, IAssignUserPayload, IUnassignUserPayload } from "@/services/organogram";
import { CoreRootStore } from "../root.store";

export interface IOrganogramError {
  status: string;
  message: string;
}

export interface IOrganogramStore {
  // Observables
  positionMap: Record<string, IOrganogramPosition>;
  positionIds: string[];
  isLoading: boolean;
  error: IOrganogramError | null;
  expandedNodes: Set<string>;

  // Computed
  positions: IOrganogramPosition[];
  rootPositions: IOrganogramPosition[];

  // Actions
  fetchPositions: (workspaceSlug: string) => Promise<void>;
  fetchTree: (workspaceSlug: string) => Promise<void>;
  getPositionById: (id: string) => IOrganogramPosition | undefined;
  createPosition: (workspaceSlug: string, data: ICreatePositionPayload) => Promise<IOrganogramPosition>;
  updatePosition: (workspaceSlug: string, positionId: string, data: IUpdatePositionPayload) => Promise<IOrganogramPosition>;
  deletePosition: (workspaceSlug: string, positionId: string) => Promise<void>;
  assignUser: (workspaceSlug: string, positionId: string, data: IAssignUserPayload) => Promise<void>;
  unassignUser: (workspaceSlug: string, positionId: string, data: IUnassignUserPayload) => Promise<void>;
  toggleExpand: (positionId: string) => void;
  setExpanded: (positionId: string, expanded: boolean) => void;
  getVisibleNodes: () => IOrganogramPosition[];
  reset: () => void;
}

export class OrganogramStore implements IOrganogramStore {
  positionMap: Record<string, IOrganogramPosition> = {};
  positionIds: string[] = [];
  isLoading = false;
  error: IOrganogramError | null = null;
  expandedNodes: Set<string> = new Set();

  organogramService: OrganogramService;
  rootStore: CoreRootStore;

  constructor(_rootStore: CoreRootStore) {
    makeObservable(this, {
      // Observables
      positionMap: observable,
      positionIds: observable,
      isLoading: observable.ref,
      error: observable,
      expandedNodes: observable,

      // Computed
      positions: computed,
      rootPositions: computed,

      // Actions
      fetchPositions: action,
      fetchTree: action,
      getPositionById: action,
      createPosition: action,
      updatePosition: action,
      deletePosition: action,
      assignUser: action,
      unassignUser: action,
      toggleExpand: action,
      setExpanded: action,
      getVisibleNodes: action,
      reset: action,
    });

    this.organogramService = new OrganogramService();
    this.rootStore = _rootStore;
  }

  get positions(): IOrganogramPosition[] {
    return this.positionIds.map((id) => this.positionMap[id]).filter(Boolean);
  }

  get rootPositions(): IOrganogramPosition[] {
    return this.positions.filter((pos) => !pos.parent);
  }

  /**
   * Convert tree structure to flat structure
   */
  private flattenTree(
    tree: IOrganogramPosition[],
    parentId: string | null = null,
    level: number = 0
  ): IOrganogramPosition[] {
    const flat: IOrganogramPosition[] = [];

    tree.forEach((node) => {
      const flatNode: IOrganogramPosition = {
        ...node,
        parent: parentId,
        level,
        isExpanded: node.isExpanded ?? (level === 0 ? true : false),
        children_count: node.children?.length || 0,
      };

      flat.push(flatNode);

      // If node is expanded or is root, add children
      if (node.children && node.children.length > 0) {
        const children = this.flattenTree(node.children, node.id, level + 1);
        flat.push(...children);
      }
    });

    return flat;
  }

  /**
   * Build tree structure from flat list
   */
  private buildTree(positions: IOrganogramPosition[]): IOrganogramPosition[] {
    const positionMap = new Map<string, IOrganogramPosition>();
    const rootNodes: IOrganogramPosition[] = [];

    // Create map of all positions
    positions.forEach((pos) => {
      positionMap.set(pos.id, { ...pos, children: [] });
    });

    // Build tree structure
    positions.forEach((pos) => {
      const node = positionMap.get(pos.id);
      if (!node) return;

      if (!pos.parent) {
        rootNodes.push(node);
      } else {
        const parent = positionMap.get(pos.parent);
        if (parent) {
          if (!parent.children) {
            parent.children = [];
          }
          parent.children.push(node);
        }
      }
    });

    return rootNodes;
  }

  /**
   * Fetch all positions (flat list)
   */
  fetchPositions = async (workspaceSlug: string) => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const positions = await this.organogramService.listPositions(workspaceSlug);

      runInAction(() => {
        this.positionMap = {};
        this.positionIds = [];

        positions.forEach((position) => {
          if (position?.id) {
            // Initialize expanded state - root nodes expanded by default
            const isRoot = !position.parent;
            const isExpanded = isRoot || this.expandedNodes.has(position.id);

            this.positionMap[position.id] = {
              ...position,
              isExpanded,
              level: this.calculateLevel(position, positions),
            };
            this.positionIds.push(position.id);
          }
        });

        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = {
          status: "fetch-error",
          message: error?.message || "Failed to fetch positions",
        };
        this.isLoading = false;
      });
      throw error;
    }
  };

  /**
   * Fetch hierarchical tree
   */
  fetchTree = async (workspaceSlug: string) => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const tree = await this.organogramService.getTree(workspaceSlug);

      // Flatten tree to flat structure for easier management
      const flatPositions = this.flattenTree(tree);

      runInAction(() => {
        this.positionMap = {};
        this.positionIds = [];

        flatPositions.forEach((position) => {
          if (position?.id) {
            // Preserve expanded state if it exists, otherwise check if it was previously expanded
            // Root nodes are expanded by default, others are collapsed
            const isRoot = !position.parent;
            const isExpanded =
              position.isExpanded !== undefined
                ? position.isExpanded
                : isRoot
                  ? true
                  : this.expandedNodes.has(position.id);
            this.positionMap[position.id] = {
              ...position,
              isExpanded,
            };
            this.positionIds.push(position.id);
          }
        });

        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = {
          status: "fetch-error",
          message: error?.message || "Failed to fetch tree",
        };
        this.isLoading = false;
      });
      throw error;
    }
  };

  /**
   * Calculate level of a position based on parent hierarchy
   */
  private calculateLevel(position: IOrganogramPosition, allPositions: IOrganogramPosition[]): number {
    if (!position.parent) return 0;

    let level = 0;
    let currentParentId = position.parent;

    while (currentParentId) {
      level++;
      const parent = allPositions.find((p) => p.id === currentParentId);
      if (!parent || !parent.parent) break;
      currentParentId = parent.parent;
    }

    return level;
  }

  /**
   * Get position by ID
   */
  getPositionById = (id: string): IOrganogramPosition | undefined => {
    return this.positionMap[id];
  };

  /**
   * Create a new position
   */
  createPosition = async (workspaceSlug: string, data: ICreatePositionPayload): Promise<IOrganogramPosition> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      const newPosition = await this.organogramService.createPosition(workspaceSlug, data);

      runInAction(() => {
        if (newPosition?.id) {
          const level = newPosition.parent
            ? (this.positionMap[newPosition.parent]?.level ?? 0) + 1
            : 0;

          this.positionMap[newPosition.id] = {
            ...newPosition,
            isExpanded: false,
            level,
          };

          // Update parent's children_count if parent exists
          if (newPosition.parent && this.positionMap[newPosition.parent]) {
            this.positionMap[newPosition.parent] = {
              ...this.positionMap[newPosition.parent],
              children_count: (this.positionMap[newPosition.parent].children_count || 0) + 1,
            };
          }

          // Add to positionIds if not already there
          if (!this.positionIds.includes(newPosition.id)) {
            this.positionIds.push(newPosition.id);
          }

          // If parent exists, expand it
          if (newPosition.parent) {
            this.setExpanded(newPosition.parent, true);
          }
        }

        this.isLoading = false;
      });

      return newPosition;
    } catch (error: any) {
      runInAction(() => {
        this.error = {
          status: "create-error",
          message: error?.message || "Failed to create position",
        };
        this.isLoading = false;
      });
      throw error;
    }
  };

  /**
   * Update a position
   */
  updatePosition = async (
    workspaceSlug: string,
    positionId: string,
    data: IUpdatePositionPayload
  ): Promise<IOrganogramPosition> => {
    const original = this.positionMap[positionId];

    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
        if (original) {
          this.positionMap[positionId] = { ...original, ...data };
        }
      });

      const updated = await this.organogramService.updatePosition(workspaceSlug, positionId, data);

      runInAction(() => {
        if (updated?.id) {
          this.positionMap[updated.id] = {
            ...updated,
            isExpanded: this.positionMap[updated.id]?.isExpanded ?? false,
            level: this.positionMap[updated.id]?.level ?? 0,
          };
        }
        this.isLoading = false;
      });

      return updated;
    } catch (error: any) {
      runInAction(() => {
        if (original) {
          this.positionMap[positionId] = original;
        }
        this.error = {
          status: "update-error",
          message: error?.message || "Failed to update position",
        };
        this.isLoading = false;
      });
      throw error;
    }
  };

  /**
   * Delete a position
   */
  deletePosition = async (workspaceSlug: string, positionId: string): Promise<void> => {
    const original = this.positionMap[positionId];

    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      await this.organogramService.deletePosition(workspaceSlug, positionId);

      runInAction(() => {
        // Remove position and all its children
        const toRemove = [positionId];
        const findChildren = (parentId: string) => {
          this.positions.forEach((pos) => {
            if (pos.parent === parentId) {
              toRemove.push(pos.id);
              findChildren(pos.id);
            }
          });
        };
        findChildren(positionId);

        toRemove.forEach((id) => {
          delete this.positionMap[id];
          this.positionIds = this.positionIds.filter((pid) => pid !== id);
          this.expandedNodes.delete(id);
        });

        // Update parent's children_count if parent exists
        if (original?.parent && this.positionMap[original.parent]) {
          const parent = this.positionMap[original.parent];
          this.positionMap[original.parent] = {
            ...parent,
            children_count: Math.max(0, (parent.children_count || 0) - 1),
          };
        }

        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = {
          status: "delete-error",
          message: error?.message || "Failed to delete position",
        };
        this.isLoading = false;
      });
      throw error;
    }
  };

  /**
   * Assign user to position
   */
  assignUser = async (workspaceSlug: string, positionId: string, data: IAssignUserPayload): Promise<void> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      await this.organogramService.assignUser(workspaceSlug, positionId, data);

      // Refresh position to get updated user assignments
      const updatedPosition = await this.organogramService.getPosition(workspaceSlug, positionId);

      runInAction(() => {
        if (updatedPosition?.id && this.positionMap[updatedPosition.id]) {
          this.positionMap[updatedPosition.id] = {
            ...this.positionMap[updatedPosition.id],
            ...updatedPosition,
          };
        }
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = {
          status: "assign-error",
          message: error?.message || "Failed to assign user",
        };
        this.isLoading = false;
      });
      throw error;
    }
  };

  /**
   * Unassign user from position
   */
  unassignUser = async (workspaceSlug: string, positionId: string, data: IUnassignUserPayload): Promise<void> => {
    try {
      runInAction(() => {
        this.isLoading = true;
        this.error = null;
      });

      await this.organogramService.unassignUser(workspaceSlug, positionId, data);

      // Refresh position to get updated user assignments
      const updatedPosition = await this.organogramService.getPosition(workspaceSlug, positionId);

      runInAction(() => {
        if (updatedPosition?.id && this.positionMap[updatedPosition.id]) {
          this.positionMap[updatedPosition.id] = {
            ...this.positionMap[updatedPosition.id],
            ...updatedPosition,
          };
        }
        this.isLoading = false;
      });
    } catch (error: any) {
      runInAction(() => {
        this.error = {
          status: "unassign-error",
          message: error?.message || "Failed to unassign user",
        };
        this.isLoading = false;
      });
      throw error;
    }
  };

  /**
   * Toggle expand/collapse state
   */
  toggleExpand = (positionId: string) => {
    const position = this.positionMap[positionId];
    if (!position) return;

    const newExpanded = !position.isExpanded;
    this.setExpanded(positionId, newExpanded);
  };

  /**
   * Set expand/collapse state
   */
  setExpanded = (positionId: string, expanded: boolean) => {
    const position = this.positionMap[positionId];
    if (!position) return;

    runInAction(() => {
      this.positionMap[positionId] = {
        ...position,
        isExpanded: expanded,
      };

      if (expanded) {
        this.expandedNodes.add(positionId);
      } else {
        this.expandedNodes.delete(positionId);
      }
    });
  };

  /**
   * Get visible nodes based on expand/collapse state
   */
  getVisibleNodes = (): IOrganogramPosition[] => {
    const visibleNodes: IOrganogramPosition[] = [];

    const processNode = (node: IOrganogramPosition, parentExpanded = true) => {
      // Only show node if all ancestors are expanded
      if (parentExpanded) {
        visibleNodes.push(node);

        // Check if node has children (check both children_count and actual children in positions)
        const childrenCount = node.children_count || 0;
        const hasChildrenInStore = this.positions.some((pos) => pos.parent === node.id);
        const hasChildren = childrenCount > 0 || hasChildrenInStore;

        // If node has children and is expanded, process children
        if (hasChildren && node.isExpanded) {
          // Get all children of this node, sorted to maintain order
          const children = this.positions
            .filter((child) => child.parent === node.id)
            .sort((a, b) => {
              // Sort by ID or name to maintain consistent order
              return (a.id || "").localeCompare(b.id || "");
            });

          // Process each child, passing true since we know the parent is expanded
          children.forEach((child) => processNode(child, true));
        }
      }
    };

    // Start with root nodes (they have no parent, so parentExpanded is true)
    const rootNodes = this.rootPositions;
    rootNodes.forEach((node) => processNode(node, true));

    return visibleNodes;
  };

  /**
   * Reset store
   */
  reset = () => {
    runInAction(() => {
      this.positionMap = {};
      this.positionIds = [];
      this.isLoading = false;
      this.error = null;
      this.expandedNodes.clear();
    });
  };
}

