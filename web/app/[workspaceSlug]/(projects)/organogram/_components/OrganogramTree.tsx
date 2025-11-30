"use client";

import { WORKSPACE_MEMBERS } from "@/constants/fetch-keys";
import { useWorkspace } from "@/hooks/store";
import { useOrganogram } from "@/hooks/store/use-organogram";
import { WorkspaceService } from "@/plane-web/services";
import { IOrganogramPosition } from "@/services/organogram";
import { ChevronDown, ChevronRight, Crown, MoreVertical, User, UserRound } from "lucide-react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import useSWR from "swr";

const workspaceService = new WorkspaceService();

const getIndentClass = (level: number) =>
  ({
    0: "pl-0",
    1: "pl-6",
    2: "pl-12",
    3: "pl-18",
    4: "pl-24",
    5: "pl-30",
    6: "pl-36",
  })[level] || "pl-0";

interface ContextMenuPosition {
  x: number;
  y: number;
  nodeId: string;
}

// Helper to format authority type for display
const formatAuthorityType = (authority: string): string => {
  switch (authority) {
    case "head":
      return "Head";
    case "line_manager":
      return "Line Manager";
    default:
      return "None";
  }
};

// Helper to get user display name
const getUserDisplayName = (user: { first_name?: string; last_name?: string; email?: string }): string => {
  if (user.first_name || user.last_name) {
    return `${user.first_name || ""} ${user.last_name || ""}`.trim();
  }
  return user.email || "Unknown User";
};

const OrganogramTree = observer(() => {
  const { workspaceSlug } = useParams();
  const organogramStore = useOrganogram();
  const { getWorkspaceBySlug } = useWorkspace();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const [selectedNode, setSelectedNode] = useState<IOrganogramPosition | null>(null);
  const [newPosition, setNewPosition] = useState({
    name: "",
    authority: "none" as "none" | "head" | "line_manager",
    parent: null as string | null,
    description: "",
  });
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Fetch workspace members for user assignment
  const { data: workspaceMembers } = useSWR(
    workspaceSlug ? WORKSPACE_MEMBERS(workspaceSlug.toString()) : null,
    workspaceSlug ? () => workspaceService.fetchWorkspaceMembers(workspaceSlug.toString()) : null
  );

  // Fetch organogram data
  useEffect(() => {
    if (workspaceSlug) {
      organogramStore.fetchTree(workspaceSlug.toString());
    }
  }, [workspaceSlug, organogramStore]);

  // Toggle expand/collapse functionality
  const toggleExpand = (nodeId: string) => {
    organogramStore.toggleExpand(nodeId);
  };

  // Get visible nodes from store
  const visibleNodes = organogramStore.getVisibleNodes();

  // Handle right-click context menu
  const handleRightClick = (e: React.MouseEvent, node: IOrganogramPosition) => {
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
  const handleAddPosition = (parentNode?: IOrganogramPosition | null) => {
    setContextMenu(null);
    setNewPosition({
      name: "",
      authority: "none",
      parent: parentNode?.id || null,
      description: "",
    });
    setSelectedNode(parentNode || null);
    setShowAddModal(true);
  };

  const handleEditMember = () => {
    setContextMenu(null);
    if (selectedNode) {
      const userIds = selectedNode.assigned_users?.map((u) => u.id) || [];
      setSelectedUserIds(userIds);
      setShowEditModal(true);
    }
  };

  const handleDeletePosition = () => {
    setContextMenu(null);
    setShowDeleteModal(true);
  };

  const handleUpgradeLevel = () => {
    // Implementation for upgrade level - could update parent relationship
    setContextMenu(null);
  };

  const handleDowngradeLevel = () => {
    // Implementation for downgrade level - could update parent relationship
    setContextMenu(null);
  };

  // Handle save new position
  const handleSavePosition = async () => {
    if (!workspaceSlug || !newPosition.name.trim()) return;

    // Get workspace ID from workspace store
    const workspace = getWorkspaceBySlug(workspaceSlug.toString());
    if (!workspace?.id) {
      console.error("Workspace not found");
      return;
    }

    try {
      await organogramStore.createPosition(workspaceSlug.toString(), {
        name: newPosition.name.trim(),
        workspace: workspace.id,
        authority: newPosition.authority,
        parent: newPosition.parent || null,
        description: newPosition.description.trim() || undefined,
      });
      setShowAddModal(false);
      setNewPosition({ name: "", authority: "none", parent: null, description: "" });
      setSelectedNode(null);
    } catch (error) {
      console.error("Failed to create position:", error);
    }
  };

  // Get all positions for parent selection (excluding the position being created and its descendants)
  const getParentPositionOptions = () => {
    const allPositions = organogramStore.positions;
    // Filter out the selected node and its children if creating a child position
    return allPositions.filter((pos) => {
      // If we're creating a child of a specific node, exclude that node's descendants
      if (selectedNode) {
        const isDescendant = (node: IOrganogramPosition, ancestorId: string): boolean => {
          if (node.parent === ancestorId) return true;
          if (!node.parent) return false;
          const parent = allPositions.find((p) => p.id === node.parent);
          return parent ? isDescendant(parent, ancestorId) : false;
        };
        return !isDescendant(pos, selectedNode.id) && pos.id !== selectedNode.id;
      }
      return true;
    });
  };

  // Handle assign members
  const handleAssignMembers = async () => {
    if (!workspaceSlug || !selectedNode) return;

    try {
      // Get current assigned users
      const currentUserIds = selectedNode.assigned_users?.map((u) => u.id) || [];

      // Determine which users to add and remove
      const usersToAdd = selectedUserIds.filter((id) => !currentUserIds.includes(id));
      const usersToRemove = currentUserIds.filter((id) => !selectedUserIds.includes(id));

      // For head/line_manager, only one user allowed
      if (selectedNode.authority !== "none" && selectedUserIds.length > 1) {
        alert("This position can only have one user assigned");
        return;
      }

      // Assign new users
      for (const userId of usersToAdd) {
        await organogramStore.assignUser(workspaceSlug.toString(), selectedNode.id, { user_id: userId });
      }

      // Unassign removed users
      for (const userId of usersToRemove) {
        await organogramStore.unassignUser(workspaceSlug.toString(), selectedNode.id, { user_id: userId });
      }

      setShowEditModal(false);
      setSelectedUserIds([]);
    } catch (error) {
      console.error("Failed to assign members:", error);
    }
  };

  // Handle delete position
  const handleConfirmDelete = async () => {
    if (!workspaceSlug || !selectedNode) return;

    try {
      await organogramStore.deletePosition(workspaceSlug.toString(), selectedNode.id);
      setShowDeleteModal(false);
      setSelectedNode(null);
    } catch (error) {
      console.error("Failed to delete position:", error);
    }
  };

  // Authority badge styling
  const getAuthorityBadge = (authorityType: string) => {
    switch (authorityType) {
      case "head":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "line_manager":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-600 border-gray-200";
    }
  };

  const getAuthorityIcon = (authorityType: string) => {
    switch (authorityType) {
      case "head":
        return <Crown className="w-3 h-3" />;
      case "line_manager":
        return <UserRound className="w-3 h-3" />;
      default:
        return <UserRound className="w-3 h-3" />;
    }
  };

  // Get available users for assignment
  const availableUsers = workspaceMembers
    ?.map((member) => {
      if (!member?.member) return null;
      return {
        id: member.member.id,
        name: member.member.display_name || `${member.member.first_name} ${member.member.last_name}`.trim(),
        email: member.member.email,
      };
    })
    .filter((user) => user !== null) as { id: string; name: string; email: string }[] | undefined;

  const filteredUsers = availableUsers?.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (organogramStore.isLoading && visibleNodes.length === 0) {
    return (
      <div className="bg-gray-900 text-white rounded-lg shadow-sm border border-gray-200 p-10 text-center">
        <p>Loading organogram...</p>
      </div>
    );
  }

  const parentPositionOptions = getParentPositionOptions();

  return (
    <div className="bg-gray-900 text-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Add Position Button - Top Right */}
      <div className="flex justify-end p-4 border-b border-gray-200">
        <button
          onClick={() => handleAddPosition(null)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <span>➕</span>
          Add New Position
        </button>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-gray-900 text-white border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-16">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Positions</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Authority</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider w-20">Members</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider w-32">Role</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-gray-900 divide-y divide-gray-200">
            {visibleNodes.map((node) => {
              const hasChildren = (node.children_count || 0) > 0;
              const assignedUsers = node.assigned_users || [];

              return (
                <tr
                  key={node.id}
                  className="hover:bg-gray-800 transition-colors cursor-pointer group"
                  onContextMenu={(e) => handleRightClick(e, node)}
                >
                  {/* ID Column */}
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white">{node.id}</td>

                  {/* Positions Column */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`flex items-center ${getIndentClass(node.level || 0)}`}>
                      {/* Hierarchy Lines */}
                      {(node.level || 0) > 0 && (
                        <div className="flex items-center mr-3">
                          <div className="w-4 h-px bg-gray-300"> </div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full border border-white"> </div>
                        </div>
                      )}
                      {/* Expand/Collapse Button */}
                      {hasChildren && (
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
                      <span className="text-sm font-medium text-white">{node.name}</span>
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
                      {assignedUsers.length > 0 ? (
                        assignedUsers.map((user, idx) => (
                          <div key={idx} className="flex items-center space-x-1">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAuthorityBadge(node.authority)}`}
                            >
                              {getAuthorityIcon(node.authority)}
                              <span className="ml-1">{getUserDisplayName(user)}</span>
                            </span>
                            {node.authority !== "none" && (
                              <span className="text-xs text-gray-500">{formatAuthorityType(node.authority)}</span>
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
                      {assignedUsers.length}
                    </span>
                  </td>

                  {/* Role Column - Using authority as role for now */}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {formatAuthorityType(node.authority)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className="fixed bg-gray-900 border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-48"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => handleAddPosition(selectedNode)}
          >
            <span className="text-green-600">➕</span>
            Add New Position
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={handleEditMember}
          >
            <User className="text-blue-600" />
            Edit Member
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={handleUpgradeLevel}
          >
            <span className="text-purple-600">⬆️</span>
            Upgrade Level
          </button>
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={handleDowngradeLevel}
          >
            <span className="text-orange-600">⬇️</span>
            Downgrade Level
          </button>
          <hr className="my-1" />
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 text-red-600 flex items-center gap-2"
            onClick={handleDeletePosition}
          >
            <span>🗑️</span>
            Delete Level
          </button>
        </div>
      )}

      {/* Add New Position Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-[500px] max-w-[90vw] shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Create New Position</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newPosition.name}
                  onChange={(e) => setNewPosition({ ...newPosition, name: e.target.value })}
                  placeholder="e.g., Engineering Manager, CEO, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">This name must be unique within the workspace</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Parent Position</label>
                <select
                  value={newPosition.parent || ""}
                  onChange={(e) =>
                    setNewPosition({
                      ...newPosition,
                      parent: e.target.value || null,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="">None (Root Position)</option>
                  {parentPositionOptions.map((position) => {
                    const indent = "  ".repeat(position.level || 0);
                    return (
                      <option key={position.id} value={position.id}>
                        {indent}
                        {position.name}{" "}
                        {position.authority !== "none" ? `(${formatAuthorityType(position.authority)})` : ""}
                      </option>
                    );
                  })}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Select a parent position to create a hierarchical structure. Leave empty for root positions.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Authority Type</label>
                <select
                  value={newPosition.authority}
                  onChange={(e) =>
                    setNewPosition({ ...newPosition, authority: e.target.value as "none" | "head" | "line_manager" })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                >
                  <option value="none">None - Multiple users can be assigned</option>
                  <option value="head">Head - Only one user can be assigned (Leadership position)</option>
                  <option value="line_manager">
                    Line Manager - Only one user can be assigned (Management position)
                  </option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  Head and Line Manager positions can only have one user assigned. None positions can have multiple
                  users.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newPosition.description}
                  onChange={(e) => setNewPosition({ ...newPosition, description: e.target.value })}
                  placeholder="Optional description of the position's responsibilities..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 resize-none"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
              <button
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                onClick={() => {
                  setShowAddModal(false);
                  setNewPosition({ name: "", authority: "none", parent: null, description: "" });
                  setSelectedNode(null);
                }}
                disabled={organogramStore.isLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={!newPosition.name.trim() || organogramStore.isLoading}
                onClick={handleSavePosition}
              >
                {organogramStore.isLoading ? "Creating..." : "Create Position"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Member Assignment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Member(s) to: <span className="font-semibold">{selectedNode.name}</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search users..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Authority Validation Warning */}
              {selectedNode.authority !== "none" && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> This position has &quot;{formatAuthorityType(selectedNode.authority)}&quot;
                    authority. Only one user can be assigned.
                  </p>
                </div>
              )}

              {/* User Selection */}
              <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
                {filteredUsers && filteredUsers.length > 0 ? (
                  filteredUsers.map((user) => (
                    <label key={user.id} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type={selectedNode.authority !== "none" ? "radio" : "checkbox"}
                        name={selectedNode.authority !== "none" ? "singleUser" : undefined}
                        checked={selectedUserIds.includes(user.id)}
                        onChange={(e) => {
                          if (selectedNode.authority !== "none") {
                            setSelectedUserIds(e.target.checked ? [user.id] : []);
                          } else {
                            setSelectedUserIds((prev) =>
                              e.target.checked ? [...prev, user.id] : prev.filter((id) => id !== user.id)
                            );
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{user.name}</span>
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
                    {selectedUserIds.map((userId) => {
                      const user = availableUsers?.find((u) => u.id === userId);
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
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={organogramStore.isLoading}
                onClick={handleAssignMembers}
              >
                {organogramStore.isLoading ? "Assigning..." : "Assign Members"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedNode && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-red-600">Confirm Delete</h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Are you sure you want to delete the position:
                <span className="font-semibold"> &quot;{selectedNode.name}&quot;</span>?
              </p>

              {/* Warnings */}
              <div className="space-y-2">
                {(selectedNode.children_count || 0) > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                    <p className="text-sm text-red-800">
                      ⚠️ <strong>Warning:</strong> This position has child positions that will also be affected.
                    </p>
                  </div>
                )}

                {(selectedNode.assigned_users?.length || 0) > 0 && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                    <p className="text-sm text-yellow-800">
                      👥 <strong>Note:</strong> This position has {selectedNode.assigned_users?.length} assigned
                      member(s): {selectedNode.assigned_users?.map((u) => getUserDisplayName(u)).join(", ")}
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
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={organogramStore.isLoading}
                onClick={handleConfirmDelete}
              >
                {organogramStore.isLoading ? "Deleting..." : "Delete Position"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default OrganogramTree;
