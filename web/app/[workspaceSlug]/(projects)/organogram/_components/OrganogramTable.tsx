"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, Crown, MoreVertical, User, UserRound } from "lucide-react";

// Enhanced data structure with proper hierarchical IDs
const organizationData = [
  {
    id: "1000",
    level: 0,
    position: "Managing Director",
    assignedMembers: ["AKM Hamidul Haq"],
    authorityType: "Head",
    userRole: "Super Admin",
    parentId: null,
    hasChildren: true,
    isExpanded: true,
  },
  {
    id: "1100",
    level: 1,
    position: "Board Director - A",
    assignedMembers: ["MD. Satuuddin"],
    authorityType: "Line Manager",
    userRole: "General Admin",
    parentId: "1000",
    hasChildren: true,
    isExpanded: true,
  },
  {
    id: "1110",
    level: 2,
    position: "CEO",
    assignedMembers: ["Rahul Amin"],
    authorityType: "Head",
    userRole: "Head",
    parentId: "1100",
    hasChildren: true,
    isExpanded: true,
  },
  {
    id: "1111",
    level: 3,
    position: "Head of Product",
    assignedMembers: ["Abbas Uddin"],
    authorityType: "Head",
    userRole: "Head",
    parentId: "1110",
    hasChildren: true,
    isExpanded: true,
  },
  {
    id: "1111.1",
    level: 4,
    position: "Development Lead",
    assignedMembers: [],
    authorityType: "None",
    userRole: "Manager",
    parentId: "1111",
    hasChildren: true,
    isExpanded: true,
  },
  {
    id: "1111.1.1",
    level: 5,
    position: "Sr. Developer",
    assignedMembers: ["Saiful Islam", "Hossain Ahmed", "Khalil Rahman"],
    authorityType: "None",
    userRole: "General Dev",
    parentId: "1111.1",
    hasChildren: false,
    isExpanded: false,
  },
  {
    id: "1111.1.2",
    level: 5,
    position: "Jr. Developer",
    assignedMembers: ["Dhiresh Kumar", "Kabir Hassan"],
    authorityType: "None",
    userRole: "General Dev",
    parentId: "1111.1",
    hasChildren: false,
    isExpanded: false,
  },
  {
    id: "1111.2",
    level: 4,
    position: "Sr. UI/UX Designer",
    assignedMembers: ["Farhan Ahmed"],
    authorityType: "Line Manager",
    userRole: "Manager",
    parentId: "1111",
    hasChildren: true,
    isExpanded: true,
  },
  {
    id: "1111.2.1",
    level: 5,
    position: "Assistant UI/UX Designer",
    assignedMembers: ["Liton Dash"],
    authorityType: "None",
    userRole: "General User",
    parentId: "1111.2",
    hasChildren: false,
    isExpanded: false,
  },
  {
    id: "1112",
    level: 3,
    position: "Head of HR",
    assignedMembers: ["Samiul Aman"],
    authorityType: "Head",
    userRole: "Head",
    parentId: "1110",
    hasChildren: true,
    isExpanded: true,
  },
  {
    id: "1112.1",
    level: 4,
    position: "Recruitment Officer",
    assignedMembers: ["Rafsana Jahan"],
    authorityType: "None",
    userRole: "Manager",
    parentId: "1112",
    hasChildren: false,
    isExpanded: false,
  },
  {
    id: "1200",
    level: 1,
    position: "Board Director - B",
    assignedMembers: ["Mirja Ahmed"],
    authorityType: "Line Manager",
    userRole: "General Admin",
    parentId: "1000",
    hasChildren: false,
    isExpanded: false,
  },
];

// Available users for assignment
const availableUsers = [
  "John Doe",
  "Jane Smith",
  "Mike Johnson",
  "Sarah Wilson",
  "David Brown",
  "Emily Davis",
  "Chris Miller",
  "Lisa Anderson",
  "Tom Wilson",
  "Amy Taylor",
];

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

export default function OrganogramTree() {
  const [data, setData] = useState(organizationData);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [newPosition, setNewPosition] = useState({ name: "", authority: "None" });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Toggle expand/collapse functionality
  const toggleExpand = (nodeId: string) => {
    setData((prevData) =>
      prevData.map((node) => (node.id === nodeId ? { ...node, isExpanded: !node.isExpanded } : node))
    );
  };

  // Filter visible nodes based on expand/collapse state
  const getVisibleNodes = () => {
    const visibleNodes: any[] = [];
    const processNode = (node: any, parentExpanded = true) => {
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
  };

  // Handle right-click context menu
  const handleRightClick = (e: React.MouseEvent, node: any) => {
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
    setShowAddModal(true);
  };

  const handleEditMember = () => {
    setContextMenu(null);
    setSelectedUsers(selectedNode?.assignedMembers || []);
    setShowEditModal(true);
  };

  const handleDeletePosition = () => {
    setContextMenu(null);
    setShowDeleteModal(true);
  };

  const handleUpgradeLevel = () => {
    // Implementation for upgrade level
    setContextMenu(null);
  };

  const handleDowngradeLevel = () => {
    // Implementation for downgrade level
    setContextMenu(null);
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

  return (
    <div className="bg-gray-900 text-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          {/* Header */}
          <thead className="bg-gray-900 text-white border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium   uppercase tracking-wider w-16">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium   uppercase tracking-wider">Positions</th>
              <th className="px-6 py-3 text-left text-xs font-medium   uppercase tracking-wider">Authority</th>
              <th className="px-6 py-3 text-center text-xs font-medium   uppercase tracking-wider w-20">Members</th>
              <th className="px-6 py-3 text-left text-xs font-medium   uppercase tracking-wider w-32">Role</th>
            </tr>
          </thead>

          {/* Body */}
          <tbody className="bg-gray-900 divide-y divide-gray-200">
            {getVisibleNodes().map((node, index) => (
              <tr
                key={node.id}
                className="hover:bg-gray-800 transition-colors cursor-pointer group"
                onContextMenu={(e) => handleRightClick(e, node)}
              >
                {/* ID Column */}
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white">{node.id}</td>

                {/* Positions Column */}
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className={`flex items-center ${getIndentClass(node.level)}`}>
                    {/* Hierarchy Lines */}
                    {node.level > 0 && (
                      <div className="flex items-center mr-3">
                        <div className="w-4 h-px bg-gray-300"> </div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full border border-white"> </div>
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
                    &quot;
                    {/* Position Name */}
                    <span className="text-sm font-medium text-white">{node.position}</span>
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
                      node.assignedMembers.map((user: any, idx: any) => (
                        <div key={idx} className="flex items-center space-x-1">
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAuthorityBadge(node.authorityType)}`}
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
          className="fixed bg-gray-900 border border-gray-200 rounded-lg shadow-lg py-2 z-50 min-w-48"
          style={{
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
          }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={handleAddPosition}
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
          <div className="bg-gray-900 p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Add New Position</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position Name</label>
                <input
                  type="text"
                  value={newPosition.name}
                  onChange={(e) => setNewPosition({ ...newPosition, name: e.target.value })}
                  placeholder="Enter position name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Authority</label>
                <select
                  value={newPosition.authority}
                  onChange={(e) => setNewPosition({ ...newPosition, authority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="None">None</option>
                  <option value="Head">Head</option>
                  <option value="Line Manager">Line Manager</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                disabled={!newPosition.name.trim()}
              >
                Save Position
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Member Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-96 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-gray-800">Edit Member Assignment</h2>
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                {availableUsers
                  .filter((user) => user.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((user) => (
                    <label key={user} className="flex items-center p-2 hover:bg-gray-50 cursor-pointer">
                      <input
                        type={selectedNode?.authorityType !== "None" ? "radio" : "checkbox"}
                        name={selectedNode?.authorityType !== "None" ? "singleUser" : undefined}
                        checked={selectedUsers.includes(user)}
                        onChange={(e) => {
                          if (selectedNode?.authorityType !== "None") {
                            setSelectedUsers(e.target.checked ? [user] : []);
                          } else {
                            setSelectedUsers((prev) =>
                              e.target.checked ? [...prev, user] : prev.filter((u) => u !== user)
                            );
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm">{user}</span>
                    </label>
                  ))}
              </div>

              {/* Currently Selected */}
              {selectedUsers.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Selected Users:</label>
                  <div className="flex flex-wrap gap-1">
                    {selectedUsers.map((user) => (
                      <span
                        key={user}
                        className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                      >
                        {user}
                        <button
                          onClick={() => setSelectedUsers((prev) => prev.filter((u) => u !== user))}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
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
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Assign Members</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-900 p-6 rounded-lg w-96 shadow-xl">
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

                {selectedNode?.assignedMembers?.length > 0 && (
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
              >
                Cancel
              </button>
              <button className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Delete Position</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
