"use client";

import { ChevronDown, ChevronRight, Crown, Loader2, MoreVertical, User, UserRound } from "lucide-react";
import { useParams } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
// helpers
import { API_BASE_URL } from "@/helpers/common.helper";
// services
import { IOrganogramPosition, OrganogramService } from "@/services/organogram";
import { WorkspaceService } from "@/services/workspace.service";

interface PositionNode {
  id: string;
  level: number;
  position: string;
  assignedMembers: string[];
  authorityType: "None" | "Head" | "Line Manager";
  userRole: string;
  parentId: string | null;
  hasChildren: boolean;
  isExpanded: boolean;
}

interface ContextMenuPosition {
  x: number;
  y: number;
  nodeId: string;
}

const organogramService = new OrganogramService();
const workspaceService = new WorkspaceService(API_BASE_URL);

// Transform API tree response to flat list with levels
const transformTreeToFlatList = (
  tree: IOrganogramPosition[],
  level: number = 0,
  parentId: string | null = null
): PositionNode[] => {
  const result: PositionNode[] = [];

  tree.forEach((position) => {
    const assignedMembers =
      position.assigned_users?.map(
        (user: { first_name?: string; last_name?: string; email?: string }) =>
          `${user.first_name || ""} ${user.last_name || ""}`.trim() || user.email || ""
      ) || [];

    const authorityTypeMap: Record<string, "None" | "Head" | "Line Manager"> = {
      none: "None",
      head: "Head",
      line_manager: "Line Manager",
    };

    const node: PositionNode = {
      id: position.id,
      level,
      position: position.name,
      assignedMembers,
      authorityType: authorityTypeMap[position.authority] || "None",
      userRole: position.authority === "head" ? "Head" : position.authority === "line_manager" ? "Manager" : "Member",
      parentId,
      hasChildren: (position.children?.length || 0) > 0,
      isExpanded: true,
    };

    result.push(node);

    if (position.children && position.children.length > 0) {
      const children = transformTreeToFlatList(position.children, level + 1, position.id);
      result.push(...children);
    }
  });

  return result;
};

const getIndentClass = (level: number) => {
  const spacingMap: Record<number, string> = {
    0: "pl-0",
    1: "pl-6",
    2: "pl-12",
    3: "pl-[72px]",
    4: "pl-[96px]",
    5: "pl-[120px]",
    6: "pl-[144px]",
  };
  return spacingMap[level] || `pl-[${level * 24}px]`;
};

export default function OrganogramTable() {
  const { workspaceSlug } = useParams();
  const [data, setData] = useState<PositionNode[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const [selectedNode, setSelectedNode] = useState<PositionNode | null>(null);
  const [newPosition, setNewPosition] = useState({ name: "", authority: "none" as "none" | "head" | "line_manager" });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Fetch organogram tree
  const {
    data: treeData,
    error: treeError,
    mutate: refetchTree,
  } = useSWR(workspaceSlug ? `organogram-tree-${workspaceSlug}` : null, async () => {
    try {
      return await organogramService.getPositionTree(workspaceSlug?.toString() || "");
    } catch (error) {
      // Log error for debugging
      console.error("Error fetching organogram tree:", error);
      throw error;
    }
  });

  // Fetch workspace members
  const { data: membersData } = useSWR(workspaceSlug ? `workspace-members-${workspaceSlug}` : null, () =>
    workspaceService.fetchWorkspaceMembers(workspaceSlug?.toString() || "")
  );

  // Transform tree data to flat list
  useEffect(() => {
    if (treeData) {
      const flatList = transformTreeToFlatList(treeData);
      setData(flatList);
    }
  }, [treeData]);

  // Toggle expand/collapse functionality
  const toggleExpand = (nodeId: string) => {
    setData((prevData) =>
      prevData.map((node) => (node.id === nodeId ? { ...node, isExpanded: !node.isExpanded } : node))
    );
  };

  // Filter visible nodes based on expand/collapse state
  const getVisibleNodes = useCallback(() => {
    const visibleNodes: PositionNode[] = [];
    const processNode = (node: PositionNode, parentExpanded = true) => {
      if (parentExpanded) {
        visibleNodes.push(node);
        if (node.hasChildren && node.isExpanded) {
          const children = data.filter((child) => child.parentId === node.id);
          children.forEach((child) => processNode(child, true));
        }
      }
    };

    // Start with root nodes (parentId === null)
    const rootNodes = data.filter((node) => node.parentId === null);
    rootNodes.forEach((node) => processNode(node));

    return visibleNodes;
  }, [data]);

  // Handle right-click context menu
  const handleRightClick = (e: React.MouseEvent, node: PositionNode) => {
    e.preventDefault();
    setSelectedNode(node);
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      nodeId: node.id,
    });
  };

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(event.target as Node)) {
        setContextMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle modal actions
  const handleAddPosition = () => {
    setContextMenu(null);
    setNewPosition({ name: "", authority: "none" });
    setShowAddModal(true);
  };

  const handleEditMember = () => {
    if (!selectedNode) return;
    setContextMenu(null);
    // Get user IDs from assigned members
    const memberIds = selectedNode.assignedMembers
      .map((name: string) => {
        const member = membersData?.find(
          (m: { member?: { first_name?: string; last_name?: string; email?: string; id?: string } }) => {
            const displayName = `${m.member?.first_name || ""} ${m.member?.last_name || ""}`.trim();
            return displayName === name || m.member?.email === name;
          }
        );
        return member?.member?.id;
      })
      .filter((id): id is string => !!id);
    setSelectedUserIds(memberIds);
    setSearchTerm("");
    setShowEditModal(true);
  };

  const handleDeletePosition = () => {
    setContextMenu(null);
    setShowDeleteModal(true);
  };

  const handleUpgradeLevel = () => {
    // Implementation for upgrade level - could move position up in hierarchy
    setContextMenu(null);
  };

  const handleDowngradeLevel = () => {
    // Implementation for downgrade level - could move position down in hierarchy
    setContextMenu(null);
  };

  // Save new position
  const handleSavePosition = async () => {
    if (!workspaceSlug || !newPosition.name.trim() || !selectedNode) return;

    setIsLoading(true);
    setError(null);

    try {
      await organogramService.createPosition(workspaceSlug.toString(), {
        name: newPosition.name,
        parent: selectedNode.id,
        authority: newPosition.authority,
      });

      setShowAddModal(false);
      setNewPosition({ name: "", authority: "none" });
      await refetchTree();
    } catch (err: unknown) {
      const error = err as { error?: string; message?: string };
      setError(error?.error || error?.message || "Failed to create position");
    } finally {
      setIsLoading(false);
    }
  };

  // Assign/Unassign users
  const handleAssignMembers = async () => {
    if (!workspaceSlug || !selectedNode) return;

    setIsLoading(true);
    setError(null);

    try {
      const currentUserIds = selectedNode.assignedMembers
        .map((name: string) => {
          const member = membersData?.find(
            (m: { member?: { first_name?: string; last_name?: string; email?: string; id?: string } }) => {
              const displayName = `${m.member?.first_name || ""} ${m.member?.last_name || ""}`.trim();
              return displayName === name || m.member?.email === name;
            }
          );
          return member?.member?.id;
        })
        .filter((id): id is string => !!id);

      // Unassign users that are no longer selected
      const usersToUnassign = currentUserIds.filter((id) => !selectedUserIds.includes(id));
      for (const userId of usersToUnassign) {
        await organogramService.unassignUser(workspaceSlug.toString(), selectedNode.id, { user_id: userId });
      }

      // Assign new users
      const usersToAssign = selectedUserIds.filter((id) => !currentUserIds.includes(id));
      for (const userId of usersToAssign) {
        await organogramService.assignUser(workspaceSlug.toString(), selectedNode.id, { user_id: userId });
      }

      setShowEditModal(false);
      setSelectedUserIds([]);
      await refetchTree();
    } catch (err: unknown) {
      const error = err as { error?: string; message?: string };
      setError(error?.error || error?.message || "Failed to assign members");
    } finally {
      setIsLoading(false);
    }
  };

  // Delete position
  const handleDeletePositionConfirm = async () => {
    if (!workspaceSlug || !selectedNode) return;

    setIsLoading(true);
    setError(null);

    try {
      await organogramService.deletePosition(workspaceSlug.toString(), selectedNode.id);
      setShowDeleteModal(false);
      setSelectedNode(null);
      await refetchTree();
    } catch (err: unknown) {
      const error = err as { error?: string; message?: string };
      setError(error?.error || error?.message || "Failed to delete position");
    } finally {
      setIsLoading(false);
    }
  };

  // Authority badge styling
  const getAuthorityBadge = (authorityType: string) => {
    switch (authorityType) {
      case "Head":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "Line Manager":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getAuthorityIcon = (authorityType: string) => {
    switch (authorityType) {
      case "Head":
        return <Crown className="w-3 h-3" />;
      case "Line Manager":
        return <UserRound className="w-3 h-3" />;
      default:
        return <UserRound className="w-3 h-3" />;
    }
  };

  const availableUsers =
    membersData?.map(
      (member: {
        member?: { id?: string; display_name?: string; first_name?: string; last_name?: string; email?: string };
      }) => ({
        id: member.member?.id || "",
        name:
          member.member?.display_name ||
          `${member.member?.first_name || ""} ${member.member?.last_name || ""}`.trim() ||
          member.member?.email ||
          "",
        email: member.member?.email || "",
      })
    ) || [];

  const filteredUsers = availableUsers.filter(
    (user: { name: string; email: string }) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Helper function to extract error message
  const getErrorMessage = (error: unknown): string => {
    if (!error) return "Unknown error";
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    if (typeof error === "object") {
      const errObj = error as Record<string, unknown>;
      if (errObj.message && typeof errObj.message === "string") return errObj.message;
      if (errObj.error && typeof errObj.error === "string") return errObj.error;
      if (Array.isArray(errObj.errors)) {
        return errObj.errors.map((e: unknown) => (typeof e === "string" ? e : JSON.stringify(e))).join(", ");
      }
      // Try to stringify the error object
      try {
        return JSON.stringify(error);
      } catch {
        return "Unknown error";
      }
    }
    return "Unknown error";
  };

  if (treeError) {
    const errorMessage = getErrorMessage(treeError);
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-2">
          <p className="text-red-600 font-semibold">Error loading organogram</p>
          <p className="text-sm text-red-500">{errorMessage}</p>
          <button
            onClick={() => refetchTree()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!treeData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 m-4">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-16">
                ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Positions
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Authority
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-700 uppercase tracking-wider w-20">
                Members
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider w-32">
                Role
              </th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-white divide-y divide-gray-200">
            {getVisibleNodes().map((node) => (
              <tr
                key={node.id}
                className="hover:bg-gray-50 transition-colors cursor-pointer group"
                onContextMenu={(e) => handleRightClick(e, node)}
              >
                {/* ID Column */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                  {node.id.slice(0, 8)}...
                </td>

                {/* Positions Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`flex items-center ${getIndentClass(node.level)}`}>
                    {/* Hierarchy Lines */}
                    {node.level > 0 && (
                      <div className="flex items-center mr-3">
                        <div className="w-4 h-px bg-gray-300" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full border border-white" />
                      </div>
                    )}
                    {/* Expand/Collapse Button */}
                    {node.hasChildren && (
                      <button
                        className="mr-2 p-1 hover:bg-gray-200 rounded transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleExpand(node.id);
                        }}
                      >
                        {node.isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-600" />
                        )}
                      </button>
                    )}
                    {/* Position Name */}
                    <span className="text-sm font-medium text-gray-900">{node.position}</span>
                    {/* Actions Button (appears on hover) */}
                    <button
                      className="ml-2 p-1 opacity-0 group-hover:opacity-100 hover:bg-gray-200 rounded transition-all"
                      onClick={(e) => handleRightClick(e, node)}
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </td>

                {/* Authority Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex flex-wrap gap-1">
                    {node.assignedMembers.length > 0 ? (
                      node.assignedMembers.map((user, idx) => (
                        <div key={idx} className="flex items-center space-x-1">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getAuthorityBadge(node.authorityType)}`}
                          >
                            {getAuthorityIcon(node.authorityType)}
                            <span className="ml-1">{user}</span>
                          </span>
                          {node.authorityType !== "None" && (
                            <span className="text-xs text-gray-500">{node.authorityType}</span>
                          )}
                        </div>
                      ))
                    ) : (
                      <span className="text-sm text-gray-400 italic">Unassigned</span>
                    )}
                  </div>
                </td>

                {/* Members Count Column */}
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                    {node.assignedMembers.length}
                  </span>
                </td>

                {/* Role Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    {node.userRole}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-48"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
            onClick={handleAddPosition}
          >
            <span className="text-green-600">➕</span>
            Add New Position
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
            onClick={handleEditMember}
          >
            <User className="w-4 h-4 text-blue-600" />
            Edit Member
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
            onClick={handleUpgradeLevel}
          >
            <span className="text-purple-600">⬆️</span>
            Upgrade Level
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-gray-700"
            onClick={handleDowngradeLevel}
          >
            <span className="text-orange-600">⬇️</span>
            Downgrade Level
          </button>
          <hr className="my-1 border-gray-200" />
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
            onClick={handleDeletePosition}
          >
            <span>🗑️</span>
            Delete Position
          </button>
        </div>
      )}

      {/* Add New Position Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Add New Position</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position Name</label>
                <input
                  type="text"
                  value={newPosition.name}
                  onChange={(e) => setNewPosition({ ...newPosition, name: e.target.value })}
                  placeholder="Enter position name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Authority</label>
                <select
                  value={newPosition.authority}
                  onChange={(e) =>
                    setNewPosition({ ...newPosition, authority: e.target.value as "none" | "head" | "line_manager" })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                >
                  <option value="none">None</option>
                  <option value="head">Head</option>
                  <option value="line_manager">Line Manager</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowAddModal(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                disabled={!newPosition.name.trim() || isLoading}
                onClick={handleSavePosition}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Save Position
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900">Edit Member Assignment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Member(s) to: <span className="font-semibold">{selectedNode?.position}</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  />
                </div>
              </div>

              {/* Authority Validation Warning */}
              {selectedNode?.authorityType !== "None" && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This position has &quot;{selectedNode?.authorityType}&quot; authority. Only
                    one user can be assigned.
                  </p>
                </div>
              )}

              {/* User Selection */}
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                {filteredUsers.length > 0 ? (
                  filteredUsers.map((user: { id: string; name: string }) => (
                    <label key={user.id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type={selectedNode?.authorityType !== "None" ? "radio" : "checkbox"}
                        name={selectedNode?.authorityType !== "None" ? "singleUser" : undefined}
                        checked={selectedUserIds.includes(user.id)}
                        onChange={(e) => {
                          if (selectedNode?.authorityType !== "None") {
                            setSelectedUserIds(e.target.checked ? [user.id] : []);
                          } else {
                            setSelectedUserIds((prev) =>
                              e.target.checked ? [...prev, user.id] : prev.filter((id) => id !== user.id)
                            );
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-900">{user.name}</span>
                    </label>
                  ))
                ) : (
                  <div className="p-2 text-sm text-gray-500">No users found</div>
                )}
              </div>

              {/* Currently Selected */}
              {selectedUserIds.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selected Users:</label>
                  <div className="flex flex-wrap gap-1">
                    {selectedUserIds.map((userId: string) => {
                      const user = availableUsers.find((u: { id: string; name: string }) => u.id === userId);
                      if (!user) return null;
                      return (
                        <span
                          key={userId}
                          className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                          {user.name}
                          <button
                            onClick={() => setSelectedUserIds((prev) => prev.filter((id) => id !== userId))}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowEditModal(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                onClick={handleAssignMembers}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Assign Members
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-red-600">Confirm Delete</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete the position:
                <span className="font-semibold"> &quot;{selectedNode?.position}&quot;</span>?
              </p>

              {/* Warnings */}
              <div className="space-y-2">
                {selectedNode?.hasChildren && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      ⚠️ <strong>Warning:</strong> This position has child positions that will also be affected.
                    </p>
                  </div>
                )}

                {selectedNode && selectedNode.assignedMembers?.length > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      👥 <strong>Note:</strong> This position has {selectedNode.assignedMembers.length} assigned
                      member(s): {selectedNode.assignedMembers.join(", ")}
                    </p>
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-500">This action cannot be undone.</p>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowDeleteModal(false)}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                onClick={handleDeletePositionConfirm}
                disabled={isLoading}
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
                Delete Position
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
