import React, { useState, useCallback } from 'react';
import { 
  Users, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  AlertTriangle,
  Crown,
  Shield,
  User,
  ChevronDown,
  Save,
  UserCheck
} from 'lucide-react';
import { useNotification } from '../../contexts/NotificationContext';
import { LoadingSpinner } from '../Shared/LoadingSpinner';

// Type definitions for user role management
interface UserRole {
  id: string;
  name: string;
  email: string;
  role: 'User' | 'Admin' | 'Moderator' | 'Super Admin';
  joinDate: string;
  lastActive: string;
  status: 'active' | 'inactive';
}

interface EditingState {
  userId: string;
  newRole: UserRole['role'];
}

interface UserRoleManagementProps {
  className?: string;
}

/**
 * UserRoleManagement Component
 * 
 * A comprehensive user role management interface with PulseSpark branding featuring:
 * - Responsive table layout with user information and role management
 * - Inline role editing with dropdown selection and save/cancel actions
 * - User removal with confirmation modal and safety checks
 * - Accessible design with proper ARIA attributes and keyboard navigation
 */
export const UserRoleManagement: React.FC<UserRoleManagementProps> = ({ 
  className = '' 
}) => {
  // Sample user data - replace with actual data from context/API
  const [users, setUsers] = useState<UserRole[]>([
    {
      id: '1',
      name: 'John Smith',
      email: 'john.smith@example.com',
      role: 'Admin',
      joinDate: '2023-01-15',
      lastActive: '2024-01-27',
      status: 'active'
    },
    {
      id: '2',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@example.com',
      role: 'Moderator',
      joinDate: '2023-03-22',
      lastActive: '2024-01-26',
      status: 'active'
    },
    {
      id: '3',
      name: 'Mike Davis',
      email: 'mike.davis@example.com',
      role: 'User',
      joinDate: '2023-06-10',
      lastActive: '2024-01-25',
      status: 'active'
    },
    {
      id: '4',
      name: 'Emily Chen',
      email: 'emily.chen@example.com',
      role: 'User',
      joinDate: '2023-08-05',
      lastActive: '2024-01-24',
      status: 'active'
    },
    {
      id: '5',
      name: 'David Wilson',
      email: 'david.wilson@example.com',
      role: 'Moderator',
      joinDate: '2023-09-18',
      lastActive: '2024-01-23',
      status: 'inactive'
    },
    {
      id: '6',
      name: 'Lisa Anderson',
      email: 'lisa.anderson@example.com',
      role: 'Super Admin',
      joinDate: '2022-12-01',
      lastActive: '2024-01-27',
      status: 'active'
    }
  ]);

  // State management for editing and UI interactions
  const [editingUser, setEditingUser] = useState<EditingState | null>(null);
  const [showRemoveModal, setShowRemoveModal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const { showNotification } = useNotification();

  // Available roles for dropdown selection
  const availableRoles: UserRole['role'][] = ['User', 'Moderator', 'Admin', 'Super Admin'];

  /**
   * Get appropriate icon for user role
   * Returns Lucide React icon component based on role level
   */
  const getRoleIcon = useCallback((role: UserRole['role']) => {
    const iconClasses = "w-4 h-4";
    
    switch (role) {
      case 'Super Admin':
        return <Crown className={`${iconClasses} text-purple-600`} />;
      case 'Admin':
        return <Shield className={`${iconClasses} text-red-600`} />;
      case 'Moderator':
        return <UserCheck className={`${iconClasses} text-blue-600`} />;
      case 'User':
      default:
        return <User className={`${iconClasses} text-gray-600`} />;
    }
  }, []);

  /**
   * Get role badge styling based on role level
   * Returns appropriate Tailwind classes for different roles
   */
  const getRoleBadge = useCallback((role: UserRole['role']) => {
    switch (role) {
      case 'Super Admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'Moderator':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'User':
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }, []);

  /**
   * Get status badge styling based on user status
   * Returns appropriate styling for active/inactive users
   */
  const getStatusBadge = useCallback((status: UserRole['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, []);

  /**
   * Handle starting role edit mode
   * Sets up editing state for the selected user
   */
  const handleStartEdit = useCallback((user: UserRole) => {
    setEditingUser({
      userId: user.id,
      newRole: user.role
    });
  }, []);

  /**
   * Handle canceling role edit
   * Clears editing state without saving changes
   */
  const handleCancelEdit = useCallback(() => {
    setEditingUser(null);
  }, []);

  /**
   * Handle saving role changes
   * Validates and saves the new role assignment
   */
  const handleSaveRole = useCallback(async () => {
    if (!editingUser) return;

    setIsSaving(true);
    try {
      // Simulate API call to update user role
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update user role in state
      setUsers(prev => prev.map(user => 
        user.id === editingUser.userId 
          ? { ...user, role: editingUser.newRole }
          : user
      ));

      // Clear editing state
      setEditingUser(null);
      
      showNotification('User role updated successfully', 'success');
    } catch (error) {
      showNotification('Failed to update user role', 'error');
    } finally {
      setIsSaving(false);
    }
  }, [editingUser, showNotification]);

  /**
   * Handle role selection change in dropdown
   * Updates the editing state with new role selection
   */
  const handleRoleChange = useCallback((newRole: UserRole['role']) => {
    if (editingUser) {
      setEditingUser(prev => prev ? { ...prev, newRole } : null);
    }
  }, [editingUser]);

  /**
   * Handle user removal with confirmation
   * Shows confirmation modal before removing user
   */
  const handleRemoveUser = useCallback((userId: string) => {
    setShowRemoveModal(userId);
  }, []);

  /**
   * Confirm user removal
   * Actually removes the user after confirmation
   */
  const confirmRemoveUser = useCallback(async () => {
    if (!showRemoveModal) return;

    setIsLoading(true);
    try {
      // Simulate API call to remove user
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Remove user from state
      setUsers(prev => prev.filter(user => user.id !== showRemoveModal));
      
      // Close modal
      setShowRemoveModal(null);
      
      showNotification('User removed successfully', 'success');
    } catch (error) {
      showNotification('Failed to remove user', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showRemoveModal, showNotification]);

  /**
   * Cancel user removal
   * Closes confirmation modal without removing user
   */
  const cancelRemoveUser = useCallback(() => {
    setShowRemoveModal(null);
  }, []);

  /**
   * Format date for display
   * Converts ISO date string to readable format
   */
  const formatDate = useCallback((dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  /**
   * Check if current user can edit another user's role
   * Implements basic role hierarchy validation
   */
  const canEditRole = useCallback((targetRole: UserRole['role']): boolean => {
    // In a real app, you'd check the current user's role
    // For demo purposes, assume current user is Super Admin
    return true;
  }, []);

  /**
   * Check if current user can remove another user
   * Implements basic role hierarchy validation
   */
  const canRemoveUser = useCallback((targetRole: UserRole['role']): boolean => {
    // Prevent removal of Super Admin users for safety
    return targetRole !== 'Super Admin';
  }, []);

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 max-w-4xl mx-auto my-8 ${className}`}>
      {/* Page Header - PulseSpark branding with users icon */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Role Management</h1>
          <p className="text-gray-600">Manage user roles and permissions across the platform</p>
        </div>
      </div>

      {/* Users Table - Responsive table with role management */}
      <div className="overflow-x-auto">
        <table 
          className="w-full border-collapse"
          role="table"
          aria-label="User role management table"
        >
          {/* Table Header */}
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-4 px-4 font-semibold text-gray-900">User</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-900">Role</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-900">Status</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-900">Last Active</th>
              <th className="text-left py-4 px-4 font-semibold text-gray-900">Actions</th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {users.map((user, index) => {
              const isEditing = editingUser?.userId === user.id;
              
              return (
                <tr 
                  key={user.id}
                  className={`
                    border-b border-gray-100 transition-colors
                    ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    hover:bg-green-50
                  `}
                >
                  {/* User Information Column */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {/* User Avatar */}
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-green-600" />
                      </div>
                      
                      {/* User Details */}
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                        <p className="text-xs text-gray-500">
                          Joined {formatDate(user.joinDate)}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Role Column - Editable */}
                  <td className="py-4 px-4">
                    {isEditing ? (
                      /* Role Editing Dropdown */
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <select
                            value={editingUser.newRole}
                            onChange={(e) => handleRoleChange(e.target.value as UserRole['role'])}
                            className="
                              appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8
                              text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 
                              focus:border-transparent transition-colors
                            "
                            disabled={isSaving}
                            aria-label={`Select new role for ${user.name}`}
                          >
                            {availableRoles.map((role) => (
                              <option key={role} value={role}>
                                {role}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                        </div>
                        
                        {/* Save and Cancel Buttons */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={handleSaveRole}
                            disabled={isSaving}
                            className="
                              p-2 bg-green-600 text-white rounded-md hover:bg-green-700 
                              disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                              focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1
                            "
                            title="Save role change"
                            aria-label={`Save role change for ${user.name}`}
                          >
                            {isSaving ? (
                              <LoadingSpinner size="sm" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isSaving}
                            className="
                              p-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 
                              disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                              focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-1
                            "
                            title="Cancel role change"
                            aria-label={`Cancel role change for ${user.name}`}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Role Display Badge */
                      <div className="flex items-center gap-2">
                        {getRoleIcon(user.role)}
                        <span className={`
                          px-3 py-1 text-sm font-medium rounded-full border
                          ${getRoleBadge(user.role)}
                        `}>
                          {user.role}
                        </span>
                      </div>
                    )}
                  </td>

                  {/* Status Column */}
                  <td className="py-4 px-4">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(user.status)}`}>
                      {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                    </span>
                  </td>

                  {/* Last Active Column */}
                  <td className="py-4 px-4">
                    <span className="text-sm text-gray-600">
                      {formatDate(user.lastActive)}
                    </span>
                  </td>

                  {/* Actions Column */}
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      {/* Edit Role Button */}
                      {!isEditing && canEditRole(user.role) && (
                        <button
                          onClick={() => handleStartEdit(user)}
                          className="
                            p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 
                            rounded-md transition-colors focus:outline-none focus:ring-2 
                            focus:ring-green-500 focus:ring-offset-1
                          "
                          title={`Edit role for ${user.name}`}
                          aria-label={`Edit role for ${user.name}`}
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      )}

                      {/* Remove User Button */}
                      {!isEditing && canRemoveUser(user.role) && (
                        <button
                          onClick={() => handleRemoveUser(user.id)}
                          className="
                            p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 
                            rounded-md transition-colors focus:outline-none focus:ring-2 
                            focus:ring-red-500 focus:ring-offset-1
                          "
                          title={`Remove ${user.name}`}
                          aria-label={`Remove ${user.name} from the platform`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State - Show when no users */}
      {users.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Users Found</h3>
          <p className="text-gray-600">No users are currently registered in the system.</p>
        </div>
      )}

      {/* Remove User Confirmation Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="remove-user-title"
            aria-describedby="remove-user-description"
          >
            {/* Modal Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <h3 id="remove-user-title" className="text-lg font-semibold text-gray-900">
                Confirm User Removal
              </h3>
            </div>

            {/* Modal Content */}
            <div className="mb-6">
              <p id="remove-user-description" className="text-gray-600 mb-4">
                Are you sure you want to remove this user from the platform? This action cannot be undone.
              </p>
              
              {/* User Details */}
              {(() => {
                const userToRemove = users.find(u => u.id === showRemoveModal);
                return userToRemove ? (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{userToRemove.name}</p>
                        <p className="text-sm text-gray-600">{userToRemove.email}</p>
                        <p className="text-xs text-gray-500">Role: {userToRemove.role}</p>
                      </div>
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3">
              <button
                onClick={cancelRemoveUser}
                disabled={isLoading}
                className="
                  flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 
                  rounded-md font-medium transition-colors disabled:opacity-50 
                  disabled:cursor-not-allowed focus:outline-none focus:ring-2 
                  focus:ring-gray-500 focus:ring-offset-2
                "
              >
                Cancel
              </button>
              <button
                onClick={confirmRemoveUser}
                disabled={isLoading}
                className="
                  flex-1 flex justify-center items-center gap-2 px-4 py-2 
                  bg-red-600 text-white rounded-md font-medium hover:bg-red-700 
                  disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                  focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2
                "
              >
                {isLoading ? (
                  <>
                    <LoadingSpinner size="sm" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Remove User</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Role Management Footer - Summary and guidelines */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Role Hierarchy</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Super Admin:</strong> Full system access and user management</p>
                <p><strong>Admin:</strong> User management and system configuration</p>
                <p><strong>Moderator:</strong> Content moderation and user support</p>
                <p><strong>User:</strong> Standard platform access and features</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserRoleManagement;